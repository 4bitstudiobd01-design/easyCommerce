import { ConsignmentStatusEnum, CourierProviderEnum } from '../entities/consignment.entity';

export interface CourierBookingPayload {
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  codAmount: number;
  note?: string;
  weight?: number;
  apiKey?: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface CourierBookingResult {
  trackingCode: string;
  consignmentId?: string;
  status: string;
}

export interface CourierTrackingEvent {
  status: ConsignmentStatusEnum;
  timestamp: Date;
  location?: string;
  description?: string;
}

export interface CourierTrackingResult {
  trackingCode: string;
  currentStatus: ConsignmentStatusEnum;
  events: CourierTrackingEvent[];
}

export interface CourierCancellationResult {
  cancelled: boolean;
  message?: string;
}

/**
 * The contract every courier integration implements.
 *
 * Services depend only on this interface and resolve implementations through
 * CourierProviderRegistry, so provider-specific HTTP, auth and payload shaping
 * never leak into shipment business logic.
 */
export interface ICourierAdapter {
  /** Which provider this adapter serves — used by the registry to index it. */
  readonly provider: CourierProviderEnum;
  /** Merchant-facing provider name, e.g. "Steadfast". */
  readonly displayName: string;

  bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult>;
  trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult>;
  cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult>;
}

/**
 * Per-tenant courier credentials read from the merchant's store settings.
 * Never logged and never returned in an API response.
 */
export interface CourierCredentials {
  apiKey?: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
}
