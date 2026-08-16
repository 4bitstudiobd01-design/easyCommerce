import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorefrontSessionEntity } from '../entities/storefront-session.entity';
import { TrackVisitDto } from '../dto/track-visit.dto';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { normalizeChannel } from '../../../common/utils/normalize-channel.util';

const DEBOUNCE_MS = 2000;

@Injectable()
export class RecordVisitService {
  constructor(
    @InjectRepository(StorefrontSessionEntity)
    private readonly sessionRepository: Repository<StorefrontSessionEntity>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  /**
   * Upserts a storefront visit session by client-generated `sessionId`. This is a
   * public, unauthenticated endpoint (anonymous storefront visitors have no JWT) —
   * `tenantId` is always resolved server-side from `storeSlug`, never trusted from
   * the client. The `ON CONFLICT` upsert is atomic so concurrent beacons for the
   * same session can't race into duplicate rows; the debounce (skip bumping
   * `lastSeenAt`/`pageViewCount` if the previous update was <2s ago) is a crude
   * guard against a broken/hostile client hot-looping this endpoint — it is not a
   * substitute for real rate-limiting, which this repo has no infrastructure for yet.
   */
  async execute(dto: TrackVisitDto): Promise<{ recorded: boolean }> {
    const store = await this.findStoreBySlugService.execute(dto.storeSlug);
    const tenantId = store.tenantId;

    const channel = normalizeChannel({
      requestedChannel: dto.channel,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      referrerHost: dto.referrerHost,
    });

    const result = await this.sessionRepository.manager.query(
      `
      INSERT INTO "storefront_sessions"
        ("sessionId", "tenantId", "storeSlug", "channel", "utmSource", "utmMedium", "utmCampaign", "referrerHost", "landingPage", "pageViewCount", "firstSeenAt", "lastSeenAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, now(), now())
      ON CONFLICT ("sessionId") DO UPDATE SET
        "pageViewCount" = "storefront_sessions"."pageViewCount" + 1,
        "lastSeenAt" = now()
      WHERE "storefront_sessions"."lastSeenAt" <= now() - INTERVAL '${DEBOUNCE_MS} milliseconds'
      RETURNING "id"
      `,
      [
        dto.sessionId,
        tenantId,
        dto.storeSlug,
        channel,
        dto.utmSource ?? null,
        dto.utmMedium ?? null,
        dto.utmCampaign ?? null,
        dto.referrerHost ?? null,
        dto.landingPage ?? null,
      ],
    );

    return { recorded: result.length > 0 };
  }
}
