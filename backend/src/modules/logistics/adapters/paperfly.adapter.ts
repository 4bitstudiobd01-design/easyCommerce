import { Injectable, Logger } from '@nestjs/common';
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

/**
 * Paperfly integration.
 *
 * Paperfly's merchant API is contract-issued per merchant, so no live endpoint
 * is wired here. With no credentials the adapter runs in sandbox mode and says
 * so; once credentials exist it fails loudly rather than fabricating a booking,
 * which keeps a missing integration from looking like a successful shipment.
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
    supportsCancellation: false,
    supportsTracking: false,
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        secret: true,
        required: true,
        placeholder: 'Paperfly merchant API key',
        helpText: 'Paperfly issues API access per merchant contract — ask your account manager.',
      },
      {
        key: 'username',
        label: 'Merchant Username',
        secret: false,
        required: false,
      },
      {
        key: 'password',
        label: 'Merchant Password',
        secret: true,
        required: false,
      },
    ],
  };

  private readonly logger = new Logger(PaperflyCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult> {
    const apiKey = credentials.apiKey || this.configService.get<string>('PAPERFLY_API_KEY');

    if (!apiKey) {
      return { success: false, message: 'Add an API key before testing the connection.' };
    }

    // No live Paperfly endpoint is wired (see the class comment), so claiming a
    // successful handshake here would be a lie. The credentials are stored and
    // the merchant is told plainly what does and does not work.
    return {
      success: false,
      message:
        'Paperfly credentials saved, but live verification is not available yet — bookings run in sandbox mode.',
    };
  }

  async bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult> {
    const apiKey = payload.apiKey || this.configService.get<string>('PAPERFLY_API_KEY');

    if (!apiKey) {
      return {
        trackingCode: `PF${Date.now().toString().slice(-9)}`,
        consignmentId: `PF-CID-${Date.now().toString().slice(-6)}`,
        status: 'BOOKED',
      };
    }

    this.logger.error(
      `Paperfly live booking is not implemented but credentials are configured (invoice ${payload.invoice}).`,
    );
    throw new Error(
      'Paperfly live booking is not yet available. Remove the Paperfly credentials to use sandbox mode, or choose another courier.',
    );
  }

  async trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult> {
    const apiKey = credentials.apiKey || this.configService.get<string>('PAPERFLY_API_KEY');

    if (!apiKey) {
      // Sandbox: report no movement rather than inventing a delivery history.
      return {
        trackingCode,
        currentStatus: ConsignmentStatusEnum.BOOKED,
        events: [],
      };
    }

    this.logger.warn(`Paperfly live tracking is not implemented (${trackingCode}).`);
    return { trackingCode, currentStatus: ConsignmentStatusEnum.BOOKED, events: [] };
  }

  async cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult> {
    const apiKey = credentials.apiKey || this.configService.get<string>('PAPERFLY_API_KEY');
    if (!apiKey) {
      return { cancelled: true, message: 'Cancelled locally (Paperfly sandbox mode).' };
    }
    this.logger.warn(`Paperfly live cancellation is not implemented (${trackingCode}).`);
    return {
      cancelled: false,
      message: 'Paperfly cancellation must be arranged directly with the courier.',
    };
  }
}
