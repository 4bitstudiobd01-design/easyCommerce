import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ICourierAdapter,
  CourierBookingPayload,
  CourierBookingResult,
  CourierCancellationResult,
  CourierCredentials,
  CourierTrackingResult,
} from './courier.adapter';
import { ConsignmentStatusEnum, CourierProviderEnum } from '../entities/consignment.entity';
import axios from 'axios';

@Injectable()
export class PathaoCourierAdapter implements ICourierAdapter {
  readonly provider = CourierProviderEnum.PATHAO;
  readonly displayName = 'Pathao';

  private readonly logger = new Logger(PathaoCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult> {
    const clientId = payload.clientId || this.configService.get<string>('PATHAO_CLIENT_ID');
    const clientSecret = payload.clientSecret || this.configService.get<string>('PATHAO_CLIENT_SECRET');

    // No credentials configured at all — this is genuine sandbox/dev mode.
    if (!clientId || !clientSecret) {
      const trackingCode = `PTH-${payload.invoice}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        trackingCode,
        consignmentId: `CID-${Date.now().toString().slice(-6)}`,
        status: 'BOOKED',
      };
    }

    // Real credentials exist — a failure here must surface as a real failure,
    // never as a fabricated "BOOKED" result.
    try {
      const tokenRes = await axios.post(
        'https://api-hermes.pathao.com/aladdin/api/v1/issue-token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          username: this.configService.get<string>('PATHAO_USERNAME'),
          password: this.configService.get<string>('PATHAO_PASSWORD'),
          grant_type: 'password',
        },
        { timeout: 10000 },
      );

      const token = tokenRes.data?.access_token;

      if (!token) {
        this.logger.error(`Pathao token issuance failed for invoice ${payload.invoice}: ${JSON.stringify(tokenRes.data)}`);
        throw new BadGatewayException('Unable to authenticate with Pathao courier service.');
      }

      const orderRes = await axios.post(
        'https://api-hermes.pathao.com/aladdin/api/v1/orders',
        {
          merchant_order_id: payload.invoice,
          recipient_name: payload.recipientName,
          recipient_phone: payload.recipientPhone,
          recipient_address: payload.recipientAddress,
          amount_to_collect: payload.codAmount,
          item_type: 2, // Parcel
          delivery_type: 48, // Normal Delivery
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (orderRes.data?.data) {
        return {
          trackingCode: orderRes.data.data.consignment_id || `PTH-${payload.invoice}`,
          consignmentId: String(orderRes.data.data.consignment_id),
          status: 'BOOKED',
        };
      }

      this.logger.error(`Pathao booking rejected for invoice ${payload.invoice}: ${JSON.stringify(orderRes.data)}`);
      throw new BadGatewayException('Pathao courier booking failed. Please try again or contact support.');
    } catch (err) {
      if (err instanceof BadGatewayException) {
        throw err;
      }
      this.logger.error(`Pathao booking request failed for invoice ${payload.invoice}: ${err?.message}`);
      throw new BadGatewayException('Unable to reach Pathao courier service. Please try again shortly.');
    }
  }

  async trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult> {
    const clientId = credentials.clientId || this.configService.get<string>('PATHAO_CLIENT_ID');
    const clientSecret =
      credentials.clientSecret || this.configService.get<string>('PATHAO_CLIENT_SECRET');

    // Sandbox mode: report the parcel as unchanged. Fabricating a delivery
    // history here would silently overwrite real shipment state with fiction.
    if (!clientId || !clientSecret) {
      return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
    }

    // Pathao exposes parcel status through merchant webhooks rather than a
    // public polling endpoint, so there is nothing to query here. Status
    // advances when a webhook arrives; until then the parcel is left untouched.
    this.logger.warn(
      `Pathao has no polling tracking endpoint; ${trackingCode} left unchanged pending webhook.`,
    );
    return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const clientId = credentials.clientId || this.configService.get<string>('PATHAO_CLIENT_ID');
    if (!clientId) {
      return { cancelled: true, message: 'Cancelled locally (Pathao sandbox mode).' };
    }
    this.logger.warn(`Pathao live cancellation is not implemented (${trackingCode}).`);
    return {
      cancelled: false,
      message: 'Pathao cancellation must be arranged directly with the courier.',
    };
  }
}
