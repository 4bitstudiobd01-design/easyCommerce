import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourierProviderEnum } from '../entities/consignment.entity';

/** Merchant-facing connection state of one provider. */
export enum CourierConnectionStatus {
  CONNECTED = 'Connected',
  DISCONNECTED = 'Disconnected',
  /** Credentials exist but the last call or test failed. */
  ERROR = 'Error',
}

/**
 * Health band derived from the provider's API success rate. `N/A` is a real
 * answer — a provider that has never been called has no rate to report, and
 * showing 0% or 100% there would be misleading.
 */
export enum CourierApiHealth {
  HEALTHY = 'Healthy',
  FAIR = 'Fair',
  POOR = 'Poor',
  NOT_AVAILABLE = 'N/A',
}

export class CourierCredentialFieldDto {
  @ApiProperty({ example: 'apiKey' })
  key: string;

  @ApiProperty({ example: 'API Key' })
  label: string;

  @ApiProperty({ description: 'Render as a password input and mask on read' })
  secret: boolean;

  @ApiProperty()
  required: boolean;

  @ApiPropertyOptional()
  placeholder?: string;

  @ApiPropertyOptional()
  helpText?: string;
}

export class CourierIntegrationDto {
  @ApiProperty({ description: 'Integration row id, or the provider code when never connected' })
  id: string;

  @ApiProperty({ enum: CourierProviderEnum })
  code: CourierProviderEnum;

  @ApiProperty({ example: 'Steadfast' })
  name: string;

  @ApiProperty({ example: 'Courier Service' })
  type: string;

  @ApiProperty({ enum: CourierConnectionStatus })
  status: CourierConnectionStatus;

  @ApiProperty({ enum: CourierApiHealth })
  apiHealth: CourierApiHealth;

  @ApiProperty({ description: 'API success rate as a percentage; 0 when never called' })
  apiSuccessRate: number;

  @ApiProperty({ description: 'Shipments booked with this provider (all time, this tenant)' })
  shipments: number;

  @ApiProperty()
  delivered: number;

  @ApiProperty({ description: 'Delivered as a share of concluded shipments' })
  successRate: number;

  @ApiProperty()
  codSupport: boolean;

  @ApiProperty({ example: 'All Over Bangladesh' })
  coverage: string;

  @ApiProperty({ example: 'steadfast.com.bd' })
  website: string;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty({ description: 'Pre-selected when booking a parcel' })
  isDefault: boolean;

  @ApiProperty()
  sandbox: boolean;

  @ApiProperty()
  autoCreateShipment: boolean;

  @ApiProperty()
  autoUpdateTracking: boolean;

  @ApiProperty()
  supportsCancellation: boolean;

  @ApiProperty()
  supportsTracking: boolean;

  @ApiPropertyOptional({ nullable: true })
  lastApiSync: Date | null;

  @ApiPropertyOptional({ nullable: true })
  lastWebhook: Date | null;

  @ApiPropertyOptional({ nullable: true })
  lastTestedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  lastTestSucceeded: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  lastTestMessage: string | null;

  @ApiProperty({ description: 'Whether any credential is stored for this provider' })
  hasCredentials: boolean;

  @ApiProperty({ type: [CourierCredentialFieldDto] })
  credentialFields: CourierCredentialFieldDto[];

  @ApiProperty({
    description: 'Stored credentials, masked. Never contains a usable secret.',
    example: { apiKey: '••••••••ab12' },
  })
  maskedCredentials: Record<string, string>;
}

export class CourierMetricDto {
  @ApiProperty()
  count: number;

  @ApiProperty({ description: 'Change vs the preceding period; null when there is no baseline', nullable: true })
  change: number | null;
}

export class CourierApiHealthMetricDto {
  @ApiProperty({ description: 'Average API success rate across connected providers' })
  rate: number;

  @ApiProperty({ nullable: true })
  change: number | null;
}

export class CouriersSummaryDto {
  @ApiProperty({ type: CourierMetricDto })
  totalCouriers: CourierMetricDto;

  @ApiProperty({ type: CourierMetricDto })
  connected: CourierMetricDto;

  @ApiProperty({ type: CourierMetricDto })
  disconnected: CourierMetricDto;

  @ApiProperty({ type: CourierMetricDto, description: 'Connected providers that booked a parcel in the last 30 days' })
  active: CourierMetricDto;

  @ApiProperty({ type: CourierApiHealthMetricDto })
  apiHealth: CourierApiHealthMetricDto;
}

export class CouriersDashboardResponseDto {
  @ApiProperty({ type: CouriersSummaryDto })
  summary: CouriersSummaryDto;

  @ApiProperty({ type: [CourierIntegrationDto] })
  couriers: CourierIntegrationDto[];
}

export class CourierConnectionTestResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ example: 'Connected to Steadfast successfully.' })
  message: string;

  @ApiProperty({ type: CourierIntegrationDto, description: 'The integration with the test outcome recorded' })
  integration: CourierIntegrationDto;
}
