import { BadRequestException, Injectable } from '@nestjs/common';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { ICourierAdapter } from './courier.adapter';
import { SteadfastCourierAdapter } from './steadfast.adapter';
import { PathaoCourierAdapter } from './pathao.adapter';
import { PaperflyCourierAdapter } from './paperfly.adapter';
import { RedxCourierAdapter } from './redx.adapter';

/**
 * Resolves a courier provider to its adapter.
 *
 * Adding a provider means writing one adapter and listing it here — no shipment
 * service changes, and no provider branching anywhere else in the module. The
 * future Couriers/Tracking/Settings tabs can enumerate providers through this
 * same registry.
 */
@Injectable()
export class CourierProviderRegistry {
  private readonly adapters: Map<CourierProviderEnum, ICourierAdapter>;

  constructor(
    steadfast: SteadfastCourierAdapter,
    pathao: PathaoCourierAdapter,
    paperfly: PaperflyCourierAdapter,
    redx: RedxCourierAdapter,
  ) {
    this.adapters = new Map(
      [steadfast, pathao, paperfly, redx].map((adapter) => [adapter.provider, adapter]),
    );
  }

  /** Throws rather than silently falling back to a different courier. */
  resolve(provider: CourierProviderEnum): ICourierAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new BadRequestException(`Courier provider "${provider}" is not supported.`);
    }
    return adapter;
  }

  /** Every supported provider, for filter dropdowns and provider pickers. */
  listProviders(): Array<{ code: CourierProviderEnum; name: string }> {
    return Array.from(this.adapters.values()).map((adapter) => ({
      code: adapter.provider,
      name: adapter.displayName,
    }));
  }

  getDisplayName(provider: CourierProviderEnum): string {
    return this.adapters.get(provider)?.displayName ?? provider;
  }
}
