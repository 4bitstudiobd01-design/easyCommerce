import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ICourierAdapter,
  CourierBookingPayload,
  CourierBookingResult,
  CourierCancellationResult,
  CourierCredentials,
  CourierTrackingEvent,
  CourierTrackingResult,
} from './courier.adapter';
import { ConsignmentStatusEnum, CourierProviderEnum } from '../entities/consignment.entity';
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

  private readonly logger = new Logger(SteadfastCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

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
          note: payload.note || 'EasyCommerce Parcel',
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
      if (err instanceof BadGatewayException) {
        throw err;
      }
      this.logger.error(`Steadfast booking request failed for invoice ${payload.invoice}: ${err?.message}`);
      throw new BadGatewayException('Unable to reach Steadfast courier service. Please try again shortly.');
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
