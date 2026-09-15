import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { CourierConnectionTestResponseDto } from '../dto/courier-integration-response.dto';
import { CredentialsCryptoService } from './credentials-crypto.service';
import { GetCourierIntegrationService } from './get-courier-integration.service';
import { RecordCourierApiCallService } from './record-courier-api-call.service';

/**
 * Verifies stored credentials against the provider and records the outcome.
 *
 * The result is persisted (not just returned) because the Couriers table shows
 * a provider whose last test failed as "Error" — a merchant should not have to
 * reopen the drawer to discover that their keys stopped working.
 */
@Injectable()
export class TestCourierConnectionService {
  constructor(
    @InjectRepository(CourierIntegrationEntity)
    private readonly integrationRepository: Repository<CourierIntegrationEntity>,
    private readonly registry: CourierProviderRegistry,
    private readonly credentialsCrypto: CredentialsCryptoService,
    private readonly getCourierIntegrationService: GetCourierIntegrationService,
    private readonly recordCourierApiCallService: RecordCourierApiCallService,
  ) {}

  async execute(
    provider: CourierProviderEnum,
    tenantId: string,
  ): Promise<CourierConnectionTestResponseDto> {
    const adapter = this.registry.resolve(provider);

    const integration = await this.integrationRepository.findOne({
      where: { tenantId, provider },
    });

    if (!integration) {
      throw new NotFoundException(
        `${adapter.displayName} has not been connected yet. Add its credentials first.`,
      );
    }

    const credentials = {
      ...this.credentialsCrypto.decrypt(integration.encryptedCredentials),
      // The sandbox toggle lives on the row, not the encrypted bag, so the test
      // hits the same host a real booking would. tenantId lets an adapter key
      // any per-tenant state it caches (e.g. Pathao's token).
      sandbox: integration.sandbox,
      tenantId,
    };

    // The adapter reports a failed handshake as `success: false` rather than
    // throwing; a thrown error here is an unexpected fault and is still turned
    // into a merchant-readable result instead of a 500.
    let result: { success: boolean; message: string };
    try {
      result = await adapter.testConnection(credentials);
    } catch {
      result = {
        success: false,
        message: `Could not reach ${adapter.displayName}. Please try again shortly.`,
      };
    }

    await this.integrationRepository.update(
      { id: integration.id },
      {
        lastTestedAt: new Date(),
        lastTestSucceeded: result.success,
        lastTestMessage: result.message,
      },
    );

    // A test is a real API call, so it counts toward the provider's health.
    await this.recordCourierApiCallService.execute(tenantId, provider, result.success);

    return {
      ...result,
      integration: await this.getCourierIntegrationService.execute(provider, tenantId),
    };
  }
}
