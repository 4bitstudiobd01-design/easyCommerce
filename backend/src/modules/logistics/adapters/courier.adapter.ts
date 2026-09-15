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
  /** RedX's required delivery_area_id — from GET /logistics/redx/areas, picked by the merchant when booking. */
  deliveryAreaId?: number;
  /** Declared parcel value (RedX's `value`). Defaults to codAmount when omitted. */
  declaredValue?: number;
  apiKey?: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
  /** CarryBee's third auth header, issued alongside Client-ID / Client-Secret. */
  clientContext?: string;
  username?: string;
  password?: string;
  merchantStoreId?: string;
  /** Point the adapter at the provider's sandbox host instead of production. */
  sandbox?: boolean;
  /** Owning tenant — needed by adapters that cache per-tenant state (e.g. Pathao's token cache). */
  tenantId?: string;
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

export interface CourierConnectionTestResult {
  success: boolean;
  message: string;
}

/**
 * One credential input the Couriers tab renders for this provider.
 *
 * Declared by the adapter rather than hardcoded in the UI, so adding a provider
 * with a different auth shape needs no frontend change — the connect form is
 * generated from whatever the adapter reports.
 */
export interface CourierCredentialField {
  /** Key inside CourierCredentialBag, e.g. "apiKey". */
  key: string;
  label: string;
  /** Rendered as a password input and masked on read. */
  secret: boolean;
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

/**
 * Static, merchant-facing facts about a provider. These describe the courier
 * itself (not one merchant's connection), so they live with the adapter and are
 * the same for every tenant.
 */
export interface CourierProviderProfile {
  /** "Courier Service" vs "Logistics Service" — shown in the Type column. */
  serviceType: string;
  codSupport: boolean;
  coverage: string;
  website: string;
  /** False when the provider exposes no cancellation API (e.g. Steadfast). */
  supportsCancellation: boolean;
  supportsTracking: boolean;
  credentialFields: CourierCredentialField[];
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
  /** Capabilities and credential shape the Couriers tab renders from. */
  readonly profile: CourierProviderProfile;

  bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult>;
  trackParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierTrackingResult>;
  cancelParcel(
    trackingCode: string,
    credentials: CourierCredentials,
  ): Promise<CourierCancellationResult>;

  /**
   * Verifies credentials against the provider. Resolves with `success: false`
   * and a merchant-readable reason rather than throwing, because a failed test
   * is an expected outcome of the "Test Connection" button, not an error.
   */
  testConnection(credentials: CourierCredentials): Promise<CourierConnectionTestResult>;
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
  /** CarryBee's third auth header, issued alongside Client-ID / Client-Secret. */
  clientContext?: string;
  username?: string;
  password?: string;
  merchantStoreId?: string;
  /** Point the adapter at the provider's sandbox host instead of production. */
  sandbox?: boolean;
  /** Owning tenant — needed by adapters that cache per-tenant state (e.g. Pathao's token cache). */
  tenantId?: string;
}
