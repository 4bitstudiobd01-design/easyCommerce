import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICourierAdapter, CourierBookingPayload, CourierBookingResult } from './courier.adapter';
import axios from 'axios';

@Injectable()
export class PathaoCourierAdapter implements ICourierAdapter {
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
      const tokenRes = await axios.post('https://api-hermes.pathao.com/aladdin/api/v1/issue-token', {
        client_id: clientId,
        client_secret: clientSecret,
        username: this.configService.get<string>('PATHAO_USERNAME'),
        password: this.configService.get<string>('PATHAO_PASSWORD'),
        grant_type: 'password',
      });

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
}
