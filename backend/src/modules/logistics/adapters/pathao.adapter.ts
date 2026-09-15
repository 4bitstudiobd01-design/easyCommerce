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
  CourierTrackingResult,
} from './courier.adapter';
import { ConsignmentStatusEnum, CourierProviderEnum } from '../entities/consignment.entity';
import axios from 'axios';

const PATHAO_TOKEN_URL = 'https://api-hermes.pathao.com/aladdin/api/v1/issue-token';

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
    // Pathao pushes status by webhook; there is no polling endpoint to call.
    supportsTracking: false,
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
    ],
  };

  private readonly logger = new Logger(PathaoCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult> {
    const clientId = credentials.clientId || this.configService.get<string>('PATHAO_CLIENT_ID');
    const clientSecret =
      credentials.clientSecret || this.configService.get<string>('PATHAO_CLIENT_SECRET');
    const username = credentials.username || this.configService.get<string>('PATHAO_USERNAME');
    const password = credentials.password || this.configService.get<string>('PATHAO_PASSWORD');

    if (!clientId || !clientSecret || !username || !password) {
      return {
        success: false,
        message:
          'Pathao needs a client id, client secret, merchant username and password before testing.',
      };
    }

    try {
      // Issuing a token is the authentication check itself — nothing is booked.
      const response = await axios.post(
        PATHAO_TOKEN_URL,
        {
          client_id: clientId,
          client_secret: clientSecret,
          username,
          password,
          grant_type: 'password',
        },
        { timeout: 10000 },
      );

      if (response.data?.access_token) {
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
        PATHAO_TOKEN_URL,
        {
          client_id: clientId,
          client_secret: clientSecret,
          // Per-merchant credentials take precedence; the env values remain a
          // fallback for single-tenant/dev setups.
          username: payload.username || this.configService.get<string>('PATHAO_USERNAME'),
          password: payload.password || this.configService.get<string>('PATHAO_PASSWORD'),
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
