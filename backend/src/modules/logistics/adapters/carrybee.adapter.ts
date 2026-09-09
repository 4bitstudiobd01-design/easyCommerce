import { Injectable, BadGatewayException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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

const CARRYBEE_SANDBOX_URL = 'https://sandbox.carrybee.com';
const CARRYBEE_PRODUCTION_URL = 'https://developers.carrybee.com';

/**
 * CarryBee status → canonical shipment lifecycle.
 *
 * Covers two vocabularies that share meaning but differ in spelling:
 *  - webhook event codes, e.g. `order.pickup-cancelled` (CARRYBEE_INTEGRATION.md §7.4)
 *  - the `transfer_status` string on GET /orders/{id}/details, e.g. "Pickup cancelled"
 *
 * Keys here are the normalized form: lowercased, `order.` prefix stripped, and
 * every run of spaces/underscores collapsed to a single hyphen. `normalizeCarrybeeStatus()`
 * applies exactly that, so both `"Pickup cancelled"` and `order.pickup-cancelled`
 * resolve to `pickup-cancelled`.
 */
export const CARRYBEE_STATUS_MAP: Record<string, ConsignmentStatusEnum> = {
  created: ConsignmentStatusEnum.BOOKED,
  updated: ConsignmentStatusEnum.BOOKED,
  pending: ConsignmentStatusEnum.BOOKED,
  'pickup-requested': ConsignmentStatusEnum.BOOKED,
  'pickup-request': ConsignmentStatusEnum.BOOKED,
  'assigned-for-pickup': ConsignmentStatusEnum.BOOKED,
  picked: ConsignmentStatusEnum.PICKED_UP,
  'pickup-failed': ConsignmentStatusEnum.BOOKED,
  'pickup-cancelled': ConsignmentStatusEnum.CANCELLED,
  'pickup-canceled': ConsignmentStatusEnum.CANCELLED,
  cancelled: ConsignmentStatusEnum.CANCELLED,
  canceled: ConsignmentStatusEnum.CANCELLED,
  'order-cancelled': ConsignmentStatusEnum.CANCELLED,
  'at-the-sorting-hub': ConsignmentStatusEnum.IN_TRANSIT,
  'on-the-way-to-central-warehouse': ConsignmentStatusEnum.IN_TRANSIT,
  'at-central-warehouse': ConsignmentStatusEnum.IN_TRANSIT,
  'in-transit': ConsignmentStatusEnum.IN_TRANSIT,
  'received-at-last-mile-hub': ConsignmentStatusEnum.IN_TRANSIT,
  'assigned-for-delivery': ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  'out-for-delivery': ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  'delivery-on-hold': ConsignmentStatusEnum.IN_TRANSIT,
  delivered: ConsignmentStatusEnum.DELIVERED,
  'partial-delivery': ConsignmentStatusEnum.DELIVERED,
  'partial-delivered': ConsignmentStatusEnum.DELIVERED,
  'delivery-failed': ConsignmentStatusEnum.DELIVERY_FAILED,
  returned: ConsignmentStatusEnum.RETURNED,
  'paid-return': ConsignmentStatusEnum.RETURNED,
  exchange: ConsignmentStatusEnum.RETURNED,
  'returned-at-sorting': ConsignmentStatusEnum.RETURNING,
  'returned-in-transit': ConsignmentStatusEnum.RETURNING,
  'returned-to-merchant': ConsignmentStatusEnum.RETURNED,
};

/** Lowercase, drop an `order.` prefix, collapse spaces/underscores to hyphens. */
export function normalizeCarrybeeStatus(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^order\./, '')
    .replace(/[\s_]+/g, '-');
}

/**
 * CarryBee Courier API v2 integration.
 *
 * Auth is three per-environment headers (Client-ID / Client-Secret /
 * Client-Context) — see CARRYBEE_INTEGRATION.md §3. Bookings require a CarryBee
 * `store_id` plus resolved `city_id` / `zone_id`; this adapter resolves the
 * latter from the free-text delivery address via POST /api/v2/address-details.
 *
 * With no credentials the adapter runs in sandbox mode. With credentials a
 * failure surfaces as a real failure rather than a fabricated booking.
 *
 * NOT YET IMPLEMENTED — CarryBee webhooks (CARRYBEE_INTEGRATION.md §7). Status
 * currently advances by polling trackParcel(). Adding webhooks means: a public
 * POST controller, the one-time `webhook.integration` handshake (echo
 * X-CB-Webhook-Integration-Header), X-Carrybee-Webhook-Signature verification,
 * and an idempotent BullMQ processor keyed on
 * (consignment_id, event, timestamptz). Env vars are already stubbed in
 * .env.example (CARRYBEE_WEBHOOK_*). Track as a separate slice.
 */
@Injectable()
export class CarrybeeCourierAdapter implements ICourierAdapter {
  readonly provider = CourierProviderEnum.CARRYBEE;
  readonly displayName = 'Carrybee';

  readonly profile: CourierProviderProfile = {
    serviceType: 'Logistics & Express Courier',
    codSupport: true,
    coverage: 'Nationwide (64 Districts)',
    website: 'carrybee.com',
    supportsCancellation: true,
    supportsTracking: true,
    credentialFields: [
      {
        key: 'clientId',
        label: 'Client ID',
        secret: false,
        required: true,
        placeholder: 'Your CarryBee Client-ID',
        helpText: 'From the CarryBee merchant dashboard → API Credentials (separate Sandbox / Production sets).',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        secret: true,
        required: true,
        placeholder: 'Your CarryBee Client-Secret',
      },
      {
        key: 'clientContext',
        label: 'Client Context',
        secret: true,
        required: true,
        placeholder: 'Your CarryBee Client-Context',
        helpText: 'The third auth header CarryBee issues alongside the ID and secret.',
      },
      {
        key: 'merchantStoreId',
        label: 'Store ID',
        secret: false,
        required: true,
        placeholder: 'e.g. 12345',
        helpText: 'The CarryBee pickup store parcels are collected from. Create one under Stores, then copy its id.',
      },
    ],
  };

  private readonly logger = new Logger(CarrybeeCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sandbox host when the integration's sandbox toggle is on, otherwise
   * production. `CARRYBEE_BASE_URL` overrides both.
   */
  private resolveBaseUrl(sandbox?: boolean): string {
    const override = this.configService.get<string>('CARRYBEE_BASE_URL');
    if (override) return override.replace(/\/+$/, '');
    return sandbox ? CARRYBEE_SANDBOX_URL : CARRYBEE_PRODUCTION_URL;
  }

  private authHeaders(creds: {
    clientId: string;
    clientSecret: string;
    clientContext: string;
  }): Record<string, string> {
    return {
      'Client-ID': creds.clientId,
      'Client-Secret': creds.clientSecret,
      'Client-Context': creds.clientContext,
      'Content-Type': 'application/json',
    };
  }

  async testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult> {
    const clientId = credentials.clientId || this.configService.get<string>('CARRYBEE_CLIENT_ID');
    const clientSecret =
      credentials.clientSecret || this.configService.get<string>('CARRYBEE_CLIENT_SECRET');
    const clientContext =
      credentials.clientContext || this.configService.get<string>('CARRYBEE_CLIENT_CONTEXT');

    if (!clientId || !clientSecret || !clientContext) {
      return {
        success: false,
        message: 'CarryBee needs a Client ID, Client Secret and Client Context before testing.',
      };
    }

    try {
      // Listing cities is a read-only authenticated call — CarryBee has no
      // dedicated "status" endpoint, and this never books anything.
      const res = await axios.get(`${this.resolveBaseUrl(credentials.sandbox)}/api/v2/cities`, {
        headers: this.authHeaders({ clientId, clientSecret, clientContext }),
        timeout: 10000,
      });

      if (res.status === 200 && res.data?.error === false) {
        return { success: true, message: 'Connected to CarryBee successfully.' };
      }
      return {
        success: false,
        message: res.data?.message || 'CarryBee rejected these credentials.',
      };
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        return { success: false, message: 'CarryBee rejected these credentials.' };
      }
      this.logger.error(`CarryBee connection test failed: ${err?.message}`);
      return { success: false, message: 'Could not reach CarryBee. Please try again shortly.' };
    }
  }

  async bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult> {
    const clientId = payload.clientId || this.configService.get<string>('CARRYBEE_CLIENT_ID');
    const clientSecret =
      payload.clientSecret || this.configService.get<string>('CARRYBEE_CLIENT_SECRET');
    const clientContext =
      payload.clientContext || this.configService.get<string>('CARRYBEE_CLIENT_CONTEXT');

    // No credentials configured at all — genuine sandbox/dev mode.
    if (!clientId || !clientSecret || !clientContext) {
      const trackingCode = `CRB-${payload.invoice}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        trackingCode,
        consignmentId: `CRB-CID-${Date.now().toString().slice(-6)}`,
        status: 'BOOKED',
      };
    }

    const storeId = payload.merchantStoreId || this.configService.get<string>('CARRYBEE_STORE_ID');
    if (!storeId) {
      throw new BadRequestException(
        'CarryBee needs a Store ID to book a parcel. Add it in the CarryBee courier settings.',
      );
    }

    const baseUrl = this.resolveBaseUrl(payload.sandbox);
    const headers = this.authHeaders({ clientId, clientSecret, clientContext });

    try {
      // CarryBee requires numeric city_id / zone_id — resolve them from the
      // free-text address. A failure here is real: booking cannot proceed.
      const { cityId, zoneId } = await this.resolveDestination(baseUrl, headers, payload.recipientAddress);

      const res = await axios.post(
        `${baseUrl}/api/v2/orders`,
        {
          store_id: String(storeId),
          merchant_order_id: payload.invoice,
          delivery_type: 1, // Normal
          product_type: 1, // Parcel
          recipient_name: payload.recipientName,
          recipient_phone: payload.recipientPhone,
          recipient_address: payload.recipientAddress,
          city_id: cityId,
          zone_id: zoneId,
          special_instruction: payload.note || 'BitCommerce Parcel',
          item_weight: Math.max(1, Math.round((payload.weight ?? 0.5) * 1000)), // kg → grams
          item_quantity: 1,
          collectable_amount: Math.max(0, Math.round(payload.codAmount ?? 0)),
        },
        { headers, timeout: 12000 },
      );

      const order = res.data?.data?.order;
      if (res.data?.error === false && order?.consignment_id) {
        return {
          trackingCode: String(order.consignment_id),
          consignmentId: String(order.consignment_id),
          status: 'BOOKED',
        };
      }

      this.logger.error(
        `CarryBee booking rejected for invoice ${payload.invoice}: ${JSON.stringify(res.data)}`,
      );
      throw new BadGatewayException('CarryBee courier booking failed. Please try again or contact support.');
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.message || err.response?.data?.causes
        : undefined;
      this.logger.error(
        `CarryBee booking request failed for invoice ${payload.invoice}: ${err?.message} ${
          detail ? JSON.stringify(detail) : ''
        }`,
      );
      // 4xx (bad phone/address/weight) → BadRequest the merchant can act on;
      // network / 5xx → BadGateway with a retry hint. Our own thrown types pass
      // through unchanged.
      throwCourierError('CarryBee', err);
    }
  }

  /**
   * Resolves a free-text delivery address to CarryBee city/zone ids via
   * POST /api/v2/address-details (needs ≥ 10 chars). Throws a
   * BadRequestException the merchant can act on when it cannot be resolved.
   */
  private async resolveDestination(
    baseUrl: string,
    headers: Record<string, string>,
    address: string,
  ): Promise<{ cityId: number; zoneId: number }> {
    const query = (address || '').trim();
    if (query.length < 10) {
      throw new BadRequestException(
        'CarryBee needs a fuller delivery address (at least 10 characters) to resolve the city and zone.',
      );
    }

    let data: any;
    try {
      const res = await axios.post(
        `${baseUrl}/api/v2/address-details`,
        { query },
        { headers, timeout: 10000 },
      );
      data = res.data?.data;
    } catch (err) {
      this.logger.error(`CarryBee address resolution request failed: ${err?.message}`);
      // A 4xx here means CarryBee could not make sense of the address string —
      // that is the merchant's to fix, not a transient outage.
      throwCourierError('CarryBee', err);
    }

    // The docs page did not pin the exact shape of this response — accept the
    // common spellings rather than one rigid path.
    const cityId = Number(data?.city_id ?? data?.city?.id ?? data?.address?.city_id);
    const zoneId = Number(data?.zone_id ?? data?.zone?.id ?? data?.address?.zone_id);

    if (!Number.isFinite(cityId) || !Number.isFinite(zoneId) || cityId <= 0 || zoneId <= 0) {
      throw new BadRequestException(
        'CarryBee could not resolve this delivery address to a city and zone. Please check the address.',
      );
    }
    return { cityId, zoneId };
  }

  async trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult> {
    const clientId = credentials.clientId || this.configService.get<string>('CARRYBEE_CLIENT_ID');
    const clientSecret =
      credentials.clientSecret || this.configService.get<string>('CARRYBEE_CLIENT_SECRET');
    const clientContext =
      credentials.clientContext || this.configService.get<string>('CARRYBEE_CLIENT_CONTEXT');

    // Sandbox mode: report the parcel as unchanged rather than inventing a
    // delivery history.
    if (!clientId || !clientSecret || !clientContext) {
      return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
    }

    try {
      const res = await axios.get(
        `${this.resolveBaseUrl(credentials.sandbox)}/api/v2/orders/${trackingCode}/details`,
        {
          headers: this.authHeaders({ clientId, clientSecret, clientContext }),
          timeout: 10000,
        },
      );

      // The details endpoint carries the current state in `transfer_status`
      // ("Pickup cancelled", "In transit", …); older/other shapes used
      // `order_status` / `status`. Try all three.
      const order = res.data?.data?.order ?? res.data?.data ?? {};
      const rawStatus = normalizeCarrybeeStatus(
        order.transfer_status ?? order.order_status ?? order.status,
      );
      const currentStatus = CARRYBEE_STATUS_MAP[rawStatus];

      if (!currentStatus) {
        this.logger.warn(
          `CarryBee returned an unrecognised status "${rawStatus}" for ${trackingCode}.`,
        );
        // No usable status — leave the shipment untouched rather than forcing a
        // transition (an empty event list means SyncConsignmentService applies
        // nothing).
        return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
      }

      // The details endpoint reports a single current state, not a history, so
      // one event is recorded for the observed transition.
      return {
        trackingCode,
        currentStatus,
        events: [
          {
            status: currentStatus,
            timestamp: order.updated_at ? new Date(order.updated_at) : new Date(),
            description: `CarryBee reported status: ${rawStatus}`,
          },
        ],
      };
    } catch (err) {
      this.logger.error(`CarryBee tracking request failed for ${trackingCode}: ${err?.message}`);
      throw new BadGatewayException('Unable to reach CarryBee courier service. Please try again shortly.');
    }
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const clientId = credentials.clientId || this.configService.get<string>('CARRYBEE_CLIENT_ID');
    const clientSecret =
      credentials.clientSecret || this.configService.get<string>('CARRYBEE_CLIENT_SECRET');
    const clientContext =
      credentials.clientContext || this.configService.get<string>('CARRYBEE_CLIENT_CONTEXT');

    if (!clientId || !clientSecret || !clientContext) {
      return { cancelled: true, message: 'Cancelled locally (CarryBee sandbox mode).' };
    }

    try {
      const res = await axios.post(
        `${this.resolveBaseUrl(credentials.sandbox)}/api/v2/orders/${trackingCode}/cancel`,
        { cancellation_reason: 'Cancelled by merchant via BitCommerce.' },
        {
          headers: this.authHeaders({ clientId, clientSecret, clientContext }),
          timeout: 10000,
        },
      );

      // 202 Accepted — cancellation is queued.
      if (res.data?.error === false || res.status === 202) {
        return { cancelled: true, message: 'Cancellation request accepted by CarryBee.' };
      }
      return {
        cancelled: false,
        message: res.data?.message || 'CarryBee could not cancel this consignment.',
      };
    } catch (err) {
      this.logger.error(`CarryBee cancellation failed for ${trackingCode}: ${err?.message}`);
      return { cancelled: false, message: 'CarryBee could not cancel this consignment.' };
    }
  }
}
