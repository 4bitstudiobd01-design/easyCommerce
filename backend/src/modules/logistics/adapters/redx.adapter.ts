import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
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
    supportsCancellation: false,
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

    try {
      const response = await axios.post(
        `${this.resolveBaseUrl(payload.sandbox)}/parcel`,
        {
          customer_name: payload.recipientName,
          customer_phone: payload.recipientPhone,
          delivery_area: payload.city,
          customer_address: payload.recipientAddress,
          merchant_invoice_id: payload.invoice,
          cash_collection_amount: String(payload.codAmount),
          parcel_weight: Math.round((payload.weight ?? 0.5) * 1000),
          instruction: payload.note || 'BitCommerce Parcel',
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

    try {
      const response = await axios.get(
        `${this.resolveBaseUrl(credentials.sandbox)}/parcel/track/${trackingCode}`,
        {
          headers: { 'API-ACCESS-TOKEN': `Bearer ${token}` },
          timeout: 10000,
        },
      );

      const rawEvents: Array<{
        message_en?: string;
        parcel_status?: string;
        time?: string;
        location?: string;
      }> = response.data?.tracking ?? [];

      const events: CourierTrackingEvent[] = rawEvents
        .map((event) => ({
          status: REDX_STATUS_MAP[String(event.parcel_status ?? '').toLowerCase()],
          timestamp: event.time ? new Date(event.time) : new Date(),
          location: event.location,
          description: event.message_en,
        }))
        // Unrecognised states and unparseable timestamps are dropped rather than
        // written to the timeline as garbage.
        .filter((event) => Boolean(event.status) && !Number.isNaN(event.timestamp.getTime()))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return {
        trackingCode,
        currentStatus: events.at(-1)?.status ?? ConsignmentStatusEnum.BOOKED,
        events,
      };
    } catch (err) {
      this.logger.error(`RedX tracking request failed for ${trackingCode}: ${err?.message}`);
      throw new BadGatewayException('Unable to reach RedX courier service. Please try again shortly.');
    }
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const token = credentials.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');
    if (!token) {
      return { cancelled: true, message: 'Cancelled locally (RedX sandbox mode).' };
    }
    this.logger.warn(`RedX live cancellation is not implemented (${trackingCode}).`);
    return {
      cancelled: false,
      message: 'RedX cancellation must be arranged directly with the courier.',
    };
  }
}
