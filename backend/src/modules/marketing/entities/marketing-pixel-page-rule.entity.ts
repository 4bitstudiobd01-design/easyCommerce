import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum PixelRuleMatchTypeEnum {
  PAGE_TYPE = 'PAGE_TYPE',
  URL_PATTERN = 'URL_PATTERN',
}

export enum StorefrontPageTypeEnum {
  HOME = 'HOME',
  PRODUCT = 'PRODUCT',
  COLLECTION = 'COLLECTION',
  CATEGORY = 'CATEGORY',
  CART = 'CART',
  CHECKOUT = 'CHECKOUT',
  THANK_YOU = 'THANK_YOU',
  SEARCH = 'SEARCH',
  BLOG = 'BLOG',
  OTHER = 'OTHER',
}

/**
 * Zero or more per-pixel targeting rules, consulted only when the parent pixel's
 * `pageScopeMode = RULES`. Supports both a coarse page-type match and a URL glob.
 *
 * Resolution at fire time (see resolve-pixel-fires.util in Phase 2):
 *   any include=false match -> do not fire
 *   else any include=true match -> fire
 *   else -> do not fire
 */
@Entity('marketing_pixel_page_rules')
@Index(['pixelId'])
@Index(['tenantId', 'storeId'])
export class MarketingPixelPageRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  /** FK -> marketing_pixels.id, ON DELETE CASCADE (declared in the migration). */
  @Column({ type: 'uuid' })
  pixelId: string;

  @Column({ type: 'enum', enum: PixelRuleMatchTypeEnum })
  matchType: PixelRuleMatchTypeEnum;

  /** Set when matchType = PAGE_TYPE. */
  @Column({ type: 'enum', enum: StorefrontPageTypeEnum, nullable: true })
  pageType: StorefrontPageTypeEnum | null;

  /**
   * Set when matchType = URL_PATTERN. Leading-slash path glob, case-insensitive:
   * `*` = one path segment, `**` = any depth. e.g. `/product/clearance-*`.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  urlPattern: string | null;

  /** false = an explicit exclusion that overrides matching include rules. */
  @Column({ type: 'boolean', default: true })
  include: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
