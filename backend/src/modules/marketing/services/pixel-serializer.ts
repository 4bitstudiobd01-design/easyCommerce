import { MarketingPixel } from '../entities/marketing-pixel.entity';
import { MarketingPixelPageRule } from '../entities/marketing-pixel-page-rule.entity';
import { MarketingPixelCryptoService } from './marketing-pixel-crypto.service';

export interface SerializedPixelPageRule {
  id: string;
  matchType: string;
  pageType: string | null;
  urlPattern: string | null;
  include: boolean;
}

export interface SerializedPixel {
  id: string;
  provider: string;
  label: string | null;
  pixelId: string;
  hasCredentials: boolean;
  credentialFields: string[];
  capiEnabled: boolean;
  pageScopeMode: string;
  status: string;
  isActive: boolean;
  lastEventAt: string | null;
  pageRules: SerializedPixelPageRule[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Entity -> API shape. Never emits credential material — only a `hasCredentials`
 * flag and the list of which fields are set (so the drawer can show
 * "••• configured" per field without the value).
 */
export function serializePixel(
  pixel: MarketingPixel,
  crypto: MarketingPixelCryptoService,
  pageRules: MarketingPixelPageRule[] = [],
): SerializedPixel {
  const bag = crypto.decrypt(pixel.credentialsEncrypted);
  const fields = crypto.presentFields(bag);
  return {
    id: pixel.id,
    provider: pixel.provider,
    label: pixel.label,
    pixelId: pixel.pixelId,
    hasCredentials: fields.length > 0,
    credentialFields: fields,
    capiEnabled: pixel.capiEnabled,
    pageScopeMode: pixel.pageScopeMode,
    status: pixel.status,
    isActive: pixel.isActive,
    lastEventAt: pixel.lastEventAt ? pixel.lastEventAt.toISOString() : null,
    pageRules: pageRules.map((r) => ({
      id: r.id,
      matchType: r.matchType,
      pageType: r.pageType,
      urlPattern: r.urlPattern,
      include: r.include,
    })),
    createdAt: pixel.createdAt.toISOString(),
    updatedAt: pixel.updatedAt.toISOString(),
  };
}
