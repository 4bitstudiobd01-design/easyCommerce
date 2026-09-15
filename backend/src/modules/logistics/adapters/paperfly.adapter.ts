import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
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
import { PAPERFLY_BASE_URL, paperflyAuthHeaders, resolvePaperflyCreds } from './paperfly-auth.util';

/**
 * Paperfly integration — PAPERFLY_INTEGRATION_GUIDE.md.
 *
 * Auth is HTTP Basic Auth using the merchant's own Paperfly Merchant Panel
 * login (username/password — a real login credential, not an issued API key),
 * plus a fixed `paperflykey` header on order creation. The doc doesn't
 * distinguish a sandbox host from production — there's only one base URL, so
 * (unlike Pathao/RedX/CarryBee) there is no sandbox/production toggle here;
 * "sandbox mode" for this adapter means "no credentials configured yet."
 *
 * With no credentials the adapter runs in sandbox mode. With credentials, a
 * failure surfaces as a real failure rather than a fabricated booking.
 *
 * Sibling service: PaperflyExchangeService (exchange orders — same endpoint,
 * extra fields, not part of the standard booking flow).
 *
 * NOT YET IMPLEMENTED — Paperfly webhooks. Status currently advances by
 * polling trackParcel(). See docs/integrations/paperfly-webhook-todo.md — the
 * exact signature header name is UNKNOWN (Paperfly's own docs don't state
 * it), unlike Pathao/RedX/CarryBee where the auth mechanism is fully spelled out.
 */
@Injectable()
export class PaperflyCourierAdapter implements ICourierAdapter {
  readonly provider = CourierProviderEnum.PAPERFLY;
  readonly displayName = 'Paperfly';

  readonly profile: CourierProviderProfile = {
    serviceType: 'Logistics Service',
    codSupport: true,
    coverage: 'All Over Bangladesh',
    website: 'paperfly.com.bd',
    supportsCancellation: true,
    supportsTracking: true,
    credentialFields: [
      {
        key: 'username',
        label: 'Merchant Panel Username',
        secret: false,
        required: true,
        helpText: 'Your Paperfly Merchant Panel login username — this is a real login, not an issued API key.',
      },
      {
        key: 'password',
        label: 'Merchant Panel Password',
        secret: true,
        required: true,
        helpText: 'Your Paperfly Merchant Panel login password.',
      },
      {
        key: 'apiKey',
        label: 'Merchant Store Name',
        secret: false,
        required: true,
        placeholder: 'e.g. Ovi',
        helpText: "The store name registered with Paperfly (their `storeName` field), sent on every order.",
      },
    ],
  };

  private readonly logger = new Logger(PaperflyCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  private authHeaders(username: string, password: string): Record<string, string> {
    return paperflyAuthHeaders(username, password, this.configService);
  }

  private resolveCreds(input: CourierCredentials): { username: string; password: string; storeName: string } | null {
    return resolvePaperflyCreds(input, this.configService);
  }

  async testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult> {
    const creds = this.resolveCreds(credentials);
    if (!creds) {
      return {
        success: false,
        message: 'Add a Merchant Panel username, password and store name before testing.',
      };
    }

    // Paperfly's docs expose no read-only endpoint to probe — Track Order is
    // the cheapest real call, and a lookup for a reference that doesn't exist
    // still proves the credentials authenticate (a 401/403 means they don't;
    // any other response, including "not found", means the handshake worked).
    try {
      const res = await axios.post(
        `${PAPERFLY_BASE_URL}/API-Order-Tracking`,
        { ReferenceNumber: `bitcommerce-connection-test-${Date.now()}` },
        { headers: this.authHeaders(creds.username, creds.password), timeout: 10000 },
      );
      if (res.status === 200) {
        return { success: true, message: 'Connected to Paperfly successfully.' };
      }
      return { success: false, message: 'Paperfly did not confirm these credentials.' };
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        return { success: false, message: 'Paperfly rejected these credentials.' };
      }
      // A 404/"not found" for a made-up reference is an authenticated
      // response, not a connection failure.
      if (status && status >= 400 && status < 500) {
        return { success: true, message: 'Connected to Paperfly successfully.' };
      }
      this.logger.error(`Paperfly connection test failed: ${err?.message}`);
      return { success: false, message: 'Could not reach Paperfly. Please try again shortly.' };
    }
  }

  async bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult> {
    const creds = this.resolveCreds(payload);

    // No credentials configured at all — genuine sandbox/dev mode.
    if (!creds) {
      return {
        trackingCode: `PF${Date.now().toString().slice(-9)}`,
        consignmentId: `PF-CID-${Date.now().toString().slice(-6)}`,
        status: 'BOOKED',
      };
    }

    try {
      const res = await axios.post(
        `${PAPERFLY_BASE_URL}/merchant/api/service/new_order_v2.php`,
        {
          merchantOrderReference: payload.invoice,
          storeName: creds.storeName,
          productBrief: payload.note || 'BitCommerce Parcel',
          packagePrice: String(payload.codAmount ?? 0),
          max_weight: String(payload.weight ?? 0.5),
          customerName: payload.recipientName,
          customerAddress: payload.recipientAddress,
          customerPhone: payload.recipientPhone,
        },
        { headers: this.authHeaders(creds.username, creds.password), timeout: 10000 },
      );

      const trackingNumber = res.data?.success?.tracking_number;
      if (trackingNumber) {
        return {
          trackingCode: String(trackingNumber),
          consignmentId: String(trackingNumber),
          status: 'BOOKED',
        };
      }

      this.logger.error(
        `Paperfly booking rejected for invoice ${payload.invoice}: ${JSON.stringify(res.data)}`,
      );
      throw new BadGatewayException('Paperfly courier booking failed. Please try again or contact support.');
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      this.logger.error(`Paperfly booking request failed for invoice ${payload.invoice}: ${err?.message}`);
      // 4xx (bad recipient data) → BadRequest with Paperfly's own reasons;
      // network / 5xx → BadGateway with a retry hint.
      throwCourierError('Paperfly', err);
    }
  }

  async trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult> {
    const creds = this.resolveCreds(credentials);

    // Sandbox mode: report the parcel as unchanged. Fabricating a delivery
    // history here would silently overwrite real shipment state with fiction.
    if (!creds) {
      return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
    }

    try {
      const res = await axios.post(
        `${PAPERFLY_BASE_URL}/API-Order-Tracking`,
        { ReferenceNumber: trackingCode },
        { headers: this.authHeaders(creds.username, creds.password), timeout: 10000 },
      );

      const status = res.data?.success?.trackingStatus?.[0];
      if (!status) {
        this.logger.warn(`Paperfly returned no tracking status for ${trackingCode}.`);
        return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
      }

      const currentStatus = this.deriveStatus(status);
      return {
        trackingCode,
        currentStatus,
        events: [
          {
            status: currentStatus,
            timestamp: new Date(),
            description: `Paperfly reported status: ${currentStatus}`,
          },
        ],
      };
    } catch (err) {
      this.logger.error(`Paperfly tracking request failed for ${trackingCode}: ${err?.message}`);
      throwCourierError('Paperfly', err);
    }
  }

  /**
   * Paperfly's Track Order response has no single `status` field — instead
   * every lifecycle stage is its own key on the object, populated once that
   * stage happens (empty string / null until then, per PAPERFLY_INTEGRATION_GUIDE §3.3
   * sample response). The furthest-reached stage present decides the
   * canonical status, checked in reverse lifecycle order.
   */
  private deriveStatus(status: Record<string, unknown>): ConsignmentStatusEnum {
    const has = (key: string) => Boolean(status[key]);

    if (has('Returned')) return ConsignmentStatusEnum.RETURNED;
    if (has('Partial')) return ConsignmentStatusEnum.DELIVERED;
    if (has('Delivered')) return ConsignmentStatusEnum.DELIVERED;
    if (has('PickedForDelivery')) return ConsignmentStatusEnum.OUT_FOR_DELIVERY;
    if (has('ReceivedAtPoint')) return ConsignmentStatusEnum.IN_TRANSIT;
    if (has('inTransit')) return ConsignmentStatusEnum.IN_TRANSIT;
    if (has('Pick')) return ConsignmentStatusEnum.PICKED_UP;
    return ConsignmentStatusEnum.BOOKED;
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const creds = this.resolveCreds(credentials);
    if (!creds) {
      return { cancelled: true, message: 'Cancelled locally (Paperfly sandbox mode).' };
    }

    try {
      const res = await axios.post(
        `${PAPERFLY_BASE_URL}/api/v1/cancel-order`,
        { order_id: trackingCode },
        { headers: this.authHeaders(creds.username, creds.password), timeout: 10000 },
      );

      if (res.data?.success) {
        return {
          cancelled: true,
          message: res.data.success.message || 'Cancelled with Paperfly.',
        };
      }
      return { cancelled: false, message: 'Paperfly could not cancel this consignment.' };
    } catch (err) {
      this.logger.error(`Paperfly cancellation failed for ${trackingCode}: ${err?.message}`);
      return { cancelled: false, message: 'Paperfly could not cancel this consignment.' };
    }
  }
}
