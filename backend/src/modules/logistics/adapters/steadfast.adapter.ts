import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { throwCourierError } from './courier-error.util';
import axios from 'axios';

/** Steadfast delivery states mapped onto the canonical shipment lifecycle. */
const STEADFAST_STATUS_MAP: Record<string, ConsignmentStatusEnum> = {
  pending: ConsignmentStatusEnum.BOOKED,
  delivered_approval_pending: ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  partial_delivered_approval_pending: ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  cancelled_approval_pending: ConsignmentStatusEnum.OUT_FOR_DELIVERY,
  delivered: ConsignmentStatusEnum.DELIVERED,
  partial_delivered: ConsignmentStatusEnum.DELIVERED,
  cancelled: ConsignmentStatusEnum.CANCELLED,
  hold: ConsignmentStatusEnum.IN_TRANSIT,
  in_review: ConsignmentStatusEnum.IN_TRANSIT,
  unknown: ConsignmentStatusEnum.IN_TRANSIT,
};

@Injectable()
export class SteadfastCourierAdapter implements ICourierAdapter {
  readonly provider = CourierProviderEnum.STEADFAST;
  readonly displayName = 'Steadfast';

  readonly profile: CourierProviderProfile = {
    serviceType: 'Courier Service',
    codSupport: true,
    coverage: 'All Over Bangladesh',
    website: 'steadfast.com.bd',
    // Steadfast exposes no cancellation endpoint — see cancelParcel below.
    supportsCancellation: false,
    supportsTracking: true,
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        secret: true,
        required: true,
        placeholder: 'Your Steadfast Api-Key',
        helpText: 'Found in the Steadfast merchant portal under API settings.',
      },
      {
        key: 'secretKey',
        label: 'Secret Key',
        secret: true,
        required: true,
        placeholder: 'Your Steadfast Secret-Key',
      },
    ],
  };

  private readonly logger = new Logger(SteadfastCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult> {
    const apiKey = credentials.apiKey || this.configService.get<string>('STEADFAST_API_KEY');
    const secretKey =
      credentials.secretKey || this.configService.get<string>('STEADFAST_SECRET_KEY');

    if (!apiKey || !secretKey) {
      return {
        success: false,
        message: 'Add both an API key and a secret key before testing the connection.',
      };
    }

    try {
      // The balance endpoint is the cheapest authenticated call Steadfast
      // offers, so testing credentials never creates or mutates a parcel.
      const response = await axios.get(
        'https://portal.steadfast.com.bd/api/v1/get_balance',
        {
          headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey },
          timeout: 10000,
        },
      );

      if (response.data?.status === 200) {
        return { success: true, message: 'Connected to Steadfast successfully.' };
      }
      return {
        success: false,
        message: 'Steadfast rejected these credentials. Check the API and secret key.',
      };
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        return { success: false, message: 'Steadfast rejected these credentials.' };
      }
      this.logger.error(`Steadfast connection test failed: ${err?.message}`);
      return { success: false, message: 'Could not reach Steadfast. Please try again shortly.' };
    }
  }

  async bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult> {
    const apiKey = payload.apiKey || this.configService.get<string>('STEADFAST_API_KEY');
    const secretKey = payload.secretKey || this.configService.get<string>('STEADFAST_SECRET_KEY');

    // No credentials configured at all — this is genuine sandbox/dev mode.
    if (!apiKey || !secretKey) {
      const trackingCode = `ST-${payload.invoice}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        trackingCode,
        consignmentId: `CID-${Date.now().toString().slice(-6)}`,
        status: 'BOOKED',
      };
    }

    // Real credentials exist — a failure here must surface as a real failure,
    // never as a fabricated "BOOKED" result.
    try {
      const response = await axios.post(
        'https://portal.steadfast.com.bd/api/v1/create_order',
        {
          invoice: payload.invoice,
          recipient_name: payload.recipientName,
          recipient_phone: payload.recipientPhone,
          recipient_address: payload.recipientAddress,
          cod_amount: payload.codAmount,
          note: payload.note || 'BitCommerce Parcel',
        },
        {
          headers: {
            'Api-Key': apiKey,
            'Secret-Key': secretKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (response.data && response.data.status === 200) {
        const consignmentData = response.data.consignment;
        return {
          trackingCode: consignmentData.tracking_code || `ST-${payload.invoice}`,
          consignmentId: String(consignmentData.consignment_id || ''),
          status: 'BOOKED',
        };
      }

      this.logger.error(`Steadfast booking rejected for invoice ${payload.invoice}: ${JSON.stringify(response.data)}`);
      throw new BadGatewayException('Steadfast courier booking failed. Please try again or contact support.');
    } catch (err) {
      this.logger.error(`Steadfast booking request failed for invoice ${payload.invoice}: ${err?.message}`);
      // 4xx (bad recipient data) → BadRequest with Steadfast's own reasons;
      // network / 5xx → BadGateway with a retry hint.
      throwCourierError('Steadfast', err);
    }
  }

  async trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult> {
    const apiKey = credentials.apiKey || this.configService.get<string>('STEADFAST_API_KEY');
    const secretKey =
      credentials.secretKey || this.configService.get<string>('STEADFAST_SECRET_KEY');

    // Sandbox mode: report the parcel as unchanged. Fabricating a delivery
    // history here would silently overwrite real shipment state with fiction.
    if (!apiKey || !secretKey) {
      return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
    }

    try {
      const response = await axios.get(
        `https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/${trackingCode}`,
        {
          headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey },
          timeout: 10000,
        },
      );

      const deliveryStatus = String(response.data?.delivery_status ?? '').toLowerCase();
      const currentStatus = STEADFAST_STATUS_MAP[deliveryStatus];

      if (!currentStatus) {
        this.logger.warn(
          `Steadfast returned an unrecognised delivery status "${deliveryStatus}" for ${trackingCode}.`,
        );
        return { trackingCode, currentStatus: ConsignmentStatusEnum.IN_TRANSIT, events: [] };
      }

      // Steadfast's status endpoint reports a single current state rather than a
      // history, so one event is recorded for the observed transition.
      const events: CourierTrackingEvent[] = [
        {
          status: currentStatus,
          timestamp: new Date(),
          description: `Steadfast reported status: ${deliveryStatus}`,
        },
      ];

      return { trackingCode, currentStatus, events };
    } catch (err) {
      this.logger.error(`Steadfast tracking request failed for ${trackingCode}: ${err?.message}`);
      throw new BadGatewayException('Unable to reach Steadfast courier service. Please try again shortly.');
    }
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const apiKey = credentials.apiKey || this.configService.get<string>('STEADFAST_API_KEY');
    if (!apiKey) {
      return { cancelled: true, message: 'Cancelled locally (Steadfast sandbox mode).' };
    }
    // Steadfast has no public cancellation endpoint — the merchant must call
    // their account manager. Reporting success here would be a lie.
    this.logger.warn(`Steadfast has no cancellation API; ${trackingCode} cancelled locally only.`);
    return {
      cancelled: false,
      message: 'Steadfast cancellation must be arranged directly with the courier.',
    };
  }
}
