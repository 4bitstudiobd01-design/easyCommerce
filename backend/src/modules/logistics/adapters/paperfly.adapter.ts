import { Injectable, Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(PaperflyCourierAdapter.name);

  constructor(private readonly configService: ConfigService) {}

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
