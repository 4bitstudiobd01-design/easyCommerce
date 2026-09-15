import { Injectable, BadGatewayException, BadRequestException, Logger } from '@nestjs/common';
import { throwCourierError } from './courier-error.util';
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
  CourierTrackingEvent,
  CourierTrackingResult,
} from './courier.adapter';
import { ConsignmentStatusEnum, CourierProviderEnum } from '../entities/consignment.entity';

/** RedX parcel states mapped onto the canonical shipment lifecycle. */
const REDX_STATUS_MAP: Record<string, ConsignmentStatusEnum> = {
  'pickup-pending': ConsignmentStatusEnum.BOOKED,
  'pickup-assigned': ConsignmentStatusEnum.BOOKED,
  'picked-up': ConsignmentStatusEnum.PICKED_UP,
  'in-transit': ConsignmentStatusEnum.IN_TRANSIT,
  'agent-assigned': ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  delivered: ConsignmentStatusEnum.DELIVERED,
  'delivery-failed': ConsignmentStatusEnum.DELIVERY_FAILED,
  'return-in-transit': ConsignmentStatusEnum.RETURNING,
  returned: ConsignmentStatusEnum.RETURNED,
  cancelled: ConsignmentStatusEnum.CANCELLED,
};

/**
 * RedX integration.
 *
 * Without an access token the adapter runs in sandbox mode. With one, failures
 * surface as real failures — a booking is never reported as successful unless
 * RedX actually accepted it.
 *
 * Sibling services: RedxAreaService (cached area lookups), RedxChargeService
 * (delivery-fee quotes), RedxStoreService (pickup store create/list/info).
 *
 * NOT YET IMPLEMENTED — RedX webhooks. Status currently advances by polling
 * trackParcel(). See docs/integrations/redx-webhook-todo.md — RedX's webhook
 * has no signature header at all (unlike Pathao/CarryBee); the only auth is a
 * token embedded in the callback URL's own query string.
 */
@Injectable()
export class RedxCourierAdapter implements ICourierAdapter {
  readonly provider = CourierProviderEnum.REDX;
  readonly displayName = 'RedX';

  readonly profile: CourierProviderProfile = {
    serviceType: 'Courier Service',
    codSupport: true,
    coverage: 'All Over Bangladesh',
    website: 'redx.com.bd',
    // Via PATCH /parcels (property_name: "status", new_value: "cancelled") —
    // RedX's docs describe this as accepted-for-processing, not synchronous.
    supportsCancellation: true,
    supportsTracking: true,
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API Access Token',
        secret: true,
        required: true,
        placeholder: 'Your RedX API access token',
        helpText: 'Issued by RedX for your merchant account; sent as API-ACCESS-TOKEN.',
      },
      {
        key: 'merchantStoreId',
        label: 'Pickup Store ID',
        secret: false,
        required: true,
        placeholder: 'e.g. 1',
        helpText: 'The RedX pickup store parcels are collected from. Create one under Logistics → RedX Stores, then copy its id.',
      },
    ],
  };

  private readonly logger = new Logger(RedxCourierAdapter.name);
  private static readonly PRODUCTION_URL = 'https://openapi.redx.com.bd/v1.0.0-beta';
  private static readonly SANDBOX_URL = 'https://sandbox.redx.com.bd/v1.0.0-beta';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sandbox host when the integration's sandbox toggle is on, otherwise
   * production. `REDX_BASE_URL` overrides both.
   */
  private resolveBaseUrl(sandbox?: boolean): string {
    const override = this.configService.get<string>('REDX_BASE_URL');
    if (override) return override.replace(/\/+$/, '');
    return sandbox ? RedxCourierAdapter.SANDBOX_URL : RedxCourierAdapter.PRODUCTION_URL;
  }

  async testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult> {
    const token = credentials.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');

    if (!token) {
      return { success: false, message: 'Add an API access token before testing the connection.' };
    }

    try {
      // Listing delivery areas is a read-only authenticated call, so a test
      // never books anything.
      await axios.get(`${this.resolveBaseUrl(credentials.sandbox)}/areas`, {
        headers: { 'API-ACCESS-TOKEN': `Bearer ${token}` },
        timeout: 10000,
      });
      return { success: true, message: 'Connected to RedX successfully.' };
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        return { success: false, message: 'RedX rejected this access token.' };
      }
      this.logger.error(`RedX connection test failed: ${err?.message}`);
      return { success: false, message: 'Could not reach RedX. Please try again shortly.' };
    }
  }

  async bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult> {
    const token = payload.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');

    if (!token) {
      return {
        trackingCode: `REDX${Date.now().toString().slice(-8)}`,
        consignmentId: `RX-CID-${Date.now().toString().slice(-6)}`,
        status: 'BOOKED',
      };
    }

    // RedX has no free-text address resolver (unlike Pathao/CarryBee) — the
    // merchant must pick a delivery area explicitly (GET /logistics/redx/areas)
    // before booking, and delivery_area_id is a documented-required field.
    if (!payload.deliveryAreaId) {
      throw new BadRequestException(
        'RedX needs a delivery area. Select one from the area list before booking.',
      );
    }

    const pickupStoreId = payload.merchantStoreId
      ? Number(payload.merchantStoreId)
      : Number(this.configService.get<string>('REDX_STORE_ID'));
    if (!pickupStoreId || Number.isNaN(pickupStoreId)) {
      throw new BadRequestException(
        'RedX needs a Pickup Store ID to book a parcel. Add it in the RedX courier settings.',
      );
    }

    try {
      const response = await axios.post(
        `${this.resolveBaseUrl(payload.sandbox)}/parcel`,
        {
          customer_name: payload.recipientName,
          customer_phone: payload.recipientPhone,
          delivery_area: payload.city,
          delivery_area_id: payload.deliveryAreaId,
          customer_address: payload.recipientAddress,
          merchant_invoice_id: payload.invoice,
          cash_collection_amount: String(payload.codAmount),
          // parcel_weight unit is ambiguous in RedX's own docs (§9.1) — grams
          // is what Get Parcel Details echoes back, so kg is converted here.
          parcel_weight: Math.round((payload.weight ?? 0.5) * 1000),
          instruction: payload.note || 'BitCommerce Parcel',
          value: payload.declaredValue ?? payload.codAmount,
          pickup_store_id: pickupStoreId,
        },
        {
          headers: {
            'API-ACCESS-TOKEN': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const trackingId = response.data?.tracking_id;
      if (trackingId) {
        return {
          trackingCode: String(trackingId),
          consignmentId: String(trackingId),
          status: 'BOOKED',
        };
      }

      this.logger.error(
        `RedX booking rejected for invoice ${payload.invoice}: ${JSON.stringify(response.data)}`,
      );
      throw new BadGatewayException('RedX courier booking failed. Please try again or contact support.');
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`RedX booking request failed for invoice ${payload.invoice}: ${err?.message}`);
      // 4xx (bad recipient data / unknown area) → BadRequest with RedX's own
      // reasons; network / 5xx → BadGateway with a retry hint.
      throwCourierError('RedX', err);
    }
  }

  async trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult> {
    const token = credentials.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');

    if (!token) {
      // Sandbox: no fabricated movement — status is driven by real updates only.
      return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
    }

    const baseUrl = this.resolveBaseUrl(credentials.sandbox);
    const headers = { 'API-ACCESS-TOKEN': `Bearer ${token}` };

    // GET /parcel/track/{id} carries a message/time history but NO status
    // field per RedX's own sample response — only message_en/message_bn/time.
    // The authoritative current status lives on the separate
    // GET /parcel/info/{id} endpoint instead. Both are fetched: info() for the
    // status that actually drives the shipment lifecycle, track() only to
    // surface a human-readable timeline in the shipment's activity log.
    let currentStatus = ConsignmentStatusEnum.BOOKED;
    try {
      const infoRes = await axios.get(`${baseUrl}/parcel/info/${trackingCode}`, { headers, timeout: 10000 });
      const rawStatus = String(infoRes.data?.parcel?.status ?? '').toLowerCase();
      const mapped = REDX_STATUS_MAP[rawStatus];
      if (mapped) {
        currentStatus = mapped;
      } else if (rawStatus) {
        this.logger.warn(`RedX returned an unrecognised status "${rawStatus}" for ${trackingCode}.`);
      }
    } catch (err) {
      this.logger.error(`RedX parcel info request failed for ${trackingCode}: ${err?.message}`);
      throw new BadGatewayException('Unable to reach RedX courier service. Please try again shortly.');
    }

    // The track endpoint is best-effort for the human-readable log — its
    // absence must never fail the whole sync when info() already succeeded.
    let events: CourierTrackingEvent[] = [];
    try {
      const trackRes = await axios.get(`${baseUrl}/parcel/track/${trackingCode}`, { headers, timeout: 10000 });
      const rawEvents: Array<{ message_en?: string; time?: string }> = trackRes.data?.tracking ?? [];

      events = rawEvents
        .map((event) => ({
          // No per-entry status is available from this endpoint — every entry
          // is stamped with the current status resolved above rather than
          // guessed, so the timeline reads as "these things happened while the
          // parcel was in its current state" rather than fabricating history.
          status: currentStatus,
          timestamp: event.time ? new Date(event.time) : new Date(),
          description: event.message_en,
        }))
        .filter((event) => !Number.isNaN(event.timestamp.getTime()))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (err) {
      this.logger.warn(`RedX parcel track request failed for ${trackingCode} (status still applied): ${err?.message}`);
    }

    if (events.length === 0) {
      events = [{ status: currentStatus, timestamp: new Date(), description: `RedX reported status: ${currentStatus}` }];
    }

    return { trackingCode, currentStatus, events };
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const token = credentials.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');
    if (!token) {
      return { cancelled: true, message: 'Cancelled locally (RedX sandbox mode).' };
    }

    try {
      // Note the plural /parcels — this is exactly as published in RedX's own
      // docs (§3.4), unlike every other parcel endpoint which is singular.
      // "status" is the only property_name/new_value combination RedX's docs
      // actually demonstrate; open-ended per §9.5, but this is the one
      // confirmed to work.
      const res = await axios.patch(
        `${this.resolveBaseUrl(credentials.sandbox)}/parcels`,
        {
          entity_type: 'parcel-tracking-id',
          entity_id: trackingCode,
          update_details: {
            property_name: 'status',
            new_value: 'cancelled',
            reason: 'Cancelled by merchant via BitCommerce.',
          },
        },
        {
          headers: { 'API-ACCESS-TOKEN': `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      // "Request Accepted" (§3.4) suggests this is processed asynchronously —
      // treat this response as accepted-for-processing, not a confirmed
      // cancellation. The real state change is only certain once a later
      // trackParcel() sync reports the cancelled status back.
      if (res.data?.success) {
        return {
          cancelled: true,
          message: res.data?.message || 'Cancellation request accepted by RedX.',
        };
      }
      return {
        cancelled: false,
        message: res.data?.message || 'RedX did not accept the cancellation request.',
      };
    } catch (err) {
      this.logger.error(`RedX cancellation failed for ${trackingCode}: ${err?.message}`);
      return { cancelled: false, message: 'RedX could not cancel this consignment.' };
    }
  }
}
