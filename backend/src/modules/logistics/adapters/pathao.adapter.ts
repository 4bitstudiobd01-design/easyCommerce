import { Injectable, BadGatewayException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ICourierAdapter,
  CourierBookingPayload,
  CourierBookingResult,
  CourierCancellationResult,
  CourierConnectionTestResult,
  CourierCredentials,
  CourierProviderProfile,
  CourierTrackingResult,
} from './courier.adapter';
import { ConsignmentStatusEnum, CourierProviderEnum } from '../entities/consignment.entity';
import { throwCourierError } from './courier-error.util';
import { PathaoAuthService, PathaoAuthCredentials } from '../services/pathao-auth.service';
import axios from 'axios';

const PATHAO_PRODUCTION_URL = 'https://api-hermes.pathao.com';
const PATHAO_SANDBOX_URL = 'https://courier-api-sandbox.pathao.com';

/** Pathao order-status slugs mapped onto the canonical shipment lifecycle. */
const PATHAO_STATUS_MAP: Record<string, ConsignmentStatusEnum> = {
  pending: ConsignmentStatusEnum.BOOKED,
  'pickup_requested': ConsignmentStatusEnum.BOOKED,
  'assigned_for_pickup': ConsignmentStatusEnum.BOOKED,
  picked: ConsignmentStatusEnum.PICKED_UP,
  'picked_up': ConsignmentStatusEnum.PICKED_UP,
  'at_the_sorting_hub': ConsignmentStatusEnum.IN_TRANSIT,
  'in_transit': ConsignmentStatusEnum.IN_TRANSIT,
  'received_at_last_mile_hub': ConsignmentStatusEnum.IN_TRANSIT,
  'assigned_for_delivery': ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  'out_for_delivery': ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  delivered: ConsignmentStatusEnum.DELIVERED,
  'partial_delivery': ConsignmentStatusEnum.DELIVERED,
  'delivery_failed': ConsignmentStatusEnum.DELIVERY_FAILED,
  returned: ConsignmentStatusEnum.RETURNED,
  'return_requested': ConsignmentStatusEnum.RETURNING,
  'on_hold': ConsignmentStatusEnum.IN_TRANSIT,
  cancelled: ConsignmentStatusEnum.CANCELLED,
};

/**
 * Pathao Courier Merchant API integration.
 *
 * Auth is OAuth2 password-grant. Token issuance/refresh/caching is delegated to
 * PathaoAuthService (PATHAO_INTEGRATION_SPEC.md §3) — this adapter never calls
 * `issue-token` directly, and retries exactly once on a 401 by forcing a fresh
 * token. Bookings require a Pathao `store_id` (the merchant's pickup
 * location), collected as a credential field. With no credentials the adapter
 * runs in sandbox mode; with credentials, a failure surfaces as a real failure
 * rather than a fabricated booking.
 *
 * `tenantId` comes through `CourierCredentials`/`CourierBookingPayload` (set by
 * the resolve-credentials / create-shipment / test-connection call sites) — the
 * token cache is per tenant, since each merchant has its own Pathao account.
 *
 * Sibling services: PathaoStoreService (store create/list), PathaoLocationService
 * (cached city/zone/area lookups), PathaoPriceService (delivery-fee quotes).
 *
 * NOT YET IMPLEMENTED — Pathao webhooks. Status currently advances by polling
 * trackParcel(). See docs/integrations/pathao-webhook-todo.md for the full
 * handshake header, signature header, event catalog and payload shapes needed
 * to build that slice.
 */
@Injectable()
export class PathaoCourierAdapter implements ICourierAdapter {
  readonly provider = CourierProviderEnum.PATHAO;
  readonly displayName = 'Pathao';

  readonly profile: CourierProviderProfile = {
    serviceType: 'Courier Service',
    codSupport: true,
    coverage: 'All Over Bangladesh',
    website: 'pathao.com',
    supportsCancellation: false,
    supportsTracking: true,
    credentialFields: [
      {
        key: 'clientId',
        label: 'Client ID',
        secret: false,
        required: true,
        placeholder: 'Pathao merchant client id',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        secret: true,
        required: true,
        placeholder: 'Pathao merchant client secret',
      },
      {
        key: 'username',
        label: 'Merchant Username',
        secret: false,
        required: true,
        placeholder: 'Pathao portal email',
        helpText: 'Pathao issues its access token with a password grant, so both are required.',
      },
      {
        key: 'password',
        label: 'Merchant Password',
        secret: true,
        required: true,
      },
      {
        key: 'merchantStoreId',
        label: 'Store ID',
        secret: false,
        required: true,
        placeholder: 'e.g. 12345',
        helpText: 'The Pathao store that parcels are picked up from. Find it under Stores in the Pathao merchant panel.',
      },
    ],
  };

  private readonly logger = new Logger(PathaoCourierAdapter.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly pathaoAuth: PathaoAuthService,
  ) {}

  /**
   * Sandbox host when the integration's sandbox toggle is on, otherwise
   * production. `PATHAO_BASE_URL` overrides both for a bespoke/local endpoint.
   */
  private resolveBaseUrl(sandbox?: boolean): string {
    const override = this.configService.get<string>('PATHAO_BASE_URL');
    if (override) return override.replace(/\/+$/, '');
    return sandbox ? PATHAO_SANDBOX_URL : PATHAO_PRODUCTION_URL;
  }

  private resolveAuthCreds(
    input: CourierCredentials,
  ): PathaoAuthCredentials | null {
    const clientId = input.clientId || this.configService.get<string>('PATHAO_CLIENT_ID');
    const clientSecret =
      input.clientSecret || this.configService.get<string>('PATHAO_CLIENT_SECRET');
    const username = input.username || this.configService.get<string>('PATHAO_USERNAME');
    const password = input.password || this.configService.get<string>('PATHAO_PASSWORD');

    if (!clientId || !clientSecret || !username || !password) return null;
    return { clientId, clientSecret, username, password };
  }

  /**
   * Runs `fn` with a cached/fresh bearer token, retrying exactly once with a
   * forced re-issue if Pathao responds 401 (per spec §3.3).
   */
  private async withToken<T>(
    tenantId: string,
    baseUrl: string,
    sandbox: boolean,
    creds: PathaoAuthCredentials,
    fn: (token: string) => Promise<T>,
  ): Promise<T> {
    const token = await this.pathaoAuth.getValidAccessToken(tenantId, baseUrl, sandbox, creds);
    try {
      return await fn(token);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status !== 401) throw err;

      await this.pathaoAuth.invalidate(tenantId);
      const freshToken = await this.pathaoAuth.getValidAccessToken(
        tenantId,
        baseUrl,
        sandbox,
        creds,
        true,
      );
      return fn(freshToken);
    }
  }

  async testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult> {
    const creds = this.resolveAuthCreds(credentials);
    if (!creds) {
      return {
        success: false,
        message:
          'Pathao needs a client id, client secret, merchant username and password before testing.',
      };
    }

    try {
      // Issuing/validating a token is the authentication check itself —
      // nothing is booked. tenantId falls back to a stable per-credential key
      // when the caller is a diagnostic/pre-save test with no tenant yet.
      const tenantId = credentials.tenantId ?? this.diagnosticTenantKey(creds);
      const token = await this.pathaoAuth.getValidAccessToken(
        tenantId,
        this.resolveBaseUrl(credentials.sandbox),
        Boolean(credentials.sandbox),
        creds,
        true, // always issue fresh for an explicit connection test
      );

      if (token) {
        return { success: true, message: 'Connected to Pathao successfully.' };
      }
      return { success: false, message: 'Pathao did not issue a token for these credentials.' };
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403 || status === 422) {
        return { success: false, message: 'Pathao rejected these credentials.' };
      }
      this.logger.error(`Pathao connection test failed: ${err?.message}`);
      return { success: false, message: 'Could not reach Pathao. Please try again shortly.' };
    }
  }

  async bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult> {
    const creds = this.resolveAuthCreds(payload);

    // No credentials configured at all — this is genuine sandbox/dev mode.
    if (!creds) {
      const trackingCode = `PTH-${payload.invoice}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        trackingCode,
        consignmentId: `CID-${Date.now().toString().slice(-6)}`,
        status: 'BOOKED',
      };
    }

    const storeId = payload.merchantStoreId || this.configService.get<string>('PATHAO_STORE_ID');
    if (!storeId) {
      throw new BadRequestException(
        'Pathao needs a Store ID to book a parcel. Add it in the Pathao courier settings.',
      );
    }

    const tenantId = payload.tenantId ?? this.diagnosticTenantKey(creds);
    const baseUrl = this.resolveBaseUrl(payload.sandbox);
    const sandbox = Boolean(payload.sandbox);

    // Real credentials exist — a failure here must surface as a real failure,
    // never as a fabricated "BOOKED" result.
    try {
      const orderRes = await this.withToken(tenantId, baseUrl, sandbox, creds, (token) =>
        axios.post(
          `${baseUrl}/aladdin/api/v1/orders`,
          {
            store_id: Number(storeId),
            merchant_order_id: payload.invoice,
            recipient_name: payload.recipientName,
            recipient_phone: payload.recipientPhone,
            recipient_address: payload.recipientAddress,
            delivery_type: 48, // Normal Delivery
            item_type: 2, // Parcel
            special_instruction: payload.note || 'BitCommerce Parcel',
            item_quantity: 1,
            item_weight: String(payload.weight ?? 0.5),
            amount_to_collect: payload.codAmount,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        ),
      );

      const data = orderRes.data?.data;
      if (data?.consignment_id) {
        return {
          trackingCode: String(data.consignment_id),
          consignmentId: String(data.consignment_id),
          status: 'BOOKED',
        };
      }

      this.logger.error(
        `Pathao booking rejected for invoice ${payload.invoice}: ${JSON.stringify(orderRes.data)}`,
      );
      throw new BadGatewayException('Pathao courier booking failed. Please try again or contact support.');
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.errors
        : undefined;
      this.logger.error(
        `Pathao booking request failed for invoice ${payload.invoice}: ${err?.message} ${
          detail ? JSON.stringify(detail) : ''
        }`,
      );
      // 4xx (bad recipient data, missing store) → BadRequest with Pathao's own
      // reasons; network / 5xx → BadGateway with a retry hint.
      throwCourierError('Pathao', err);
    }
  }

  async trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult> {
    const creds = this.resolveAuthCreds(credentials);

    // Sandbox mode: report the parcel as unchanged. Fabricating a delivery
    // history here would silently overwrite real shipment state with fiction.
    if (!creds) {
      return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
    }

    const tenantId = credentials.tenantId ?? this.diagnosticTenantKey(creds);
    const baseUrl = this.resolveBaseUrl(credentials.sandbox);
    const sandbox = Boolean(credentials.sandbox);

    try {
      const res = await this.withToken(tenantId, baseUrl, sandbox, creds, (token) =>
        axios.get(`${baseUrl}/aladdin/api/v1/orders/${trackingCode}/info`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
      );

      const slug = String(res.data?.data?.order_status_slug ?? res.data?.data?.order_status ?? '')
        .toLowerCase()
        .replace(/\s+/g, '_');
      const currentStatus = PATHAO_STATUS_MAP[slug];

      if (!currentStatus) {
        this.logger.warn(`Pathao returned an unrecognised status "${slug}" for ${trackingCode}.`);
        return { trackingCode, currentStatus: ConsignmentStatusEnum.IN_TRANSIT, events: [] };
      }

      // Pathao's info endpoint reports a single current state, not a history, so
      // one event is recorded for the observed transition.
      return {
        trackingCode,
        currentStatus,
        events: [
          {
            status: currentStatus,
            timestamp: res.data?.data?.updated_at
              ? new Date(res.data.data.updated_at)
              : new Date(),
            description: `Pathao reported status: ${slug}`,
          },
        ],
      };
    } catch (err) {
      this.logger.error(`Pathao tracking request failed for ${trackingCode}: ${err?.message}`);
      throw new BadGatewayException('Unable to reach Pathao courier service. Please try again shortly.');
    }
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const clientId = credentials.clientId || this.configService.get<string>('PATHAO_CLIENT_ID');
    if (!clientId) {
      return { cancelled: true, message: 'Cancelled locally (Pathao sandbox mode).' };
    }
    // Pathao's merchant API exposes no cancellation endpoint.
    this.logger.warn(`Pathao has no cancellation API; ${trackingCode} cancelled locally only.`);
    return {
      cancelled: false,
      message: 'Pathao cancellation must be arranged directly with the courier.',
    };
  }

  /**
   * The token cache is keyed by tenantId, but a handful of call sites (an
   * ad-hoc credential test before anything is saved) may not carry one yet.
   * Falls back to a deterministic key derived from the credentials themselves
   * so those calls still benefit from caching without colliding across tenants.
   */
  private diagnosticTenantKey(creds: PathaoAuthCredentials): string {
    return `diag:${creds.clientId}:${creds.username}`;
  }
}
