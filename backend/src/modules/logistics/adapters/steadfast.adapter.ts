import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICourierAdapter, CourierBookingPayload, CourierBookingResult } from './courier.adapter';
import axios from 'axios';

@Injectable()
export class SteadfastCourierAdapter implements ICourierAdapter {
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
}
