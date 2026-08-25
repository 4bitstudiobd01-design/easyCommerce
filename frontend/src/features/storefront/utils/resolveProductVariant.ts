import type { ProductVariant } from '@/features/catalog/api/catalogApi';

/**
 * Resolves a customer's selected option combination (e.g. { Color: 'Black', Size: 'L' })
 * to a specific ProductVariantEntity from a product's variants[] array.
 *
 * Why this doesn't reconstruct `combinationKey`: the backend builds that key from
 * `attribute.key` (an internal slug) + `option.value`, lowercased and joined with '|'
 * (see backend/src/modules/catalog/services/generate-product-variants.service.ts).
 * The storefront-facing ProductVariant.options[] (VariantOptionMeta[]) only exposes
 * `attributeName` (display name) and `optionLabel`/`value` — it never carries
 * `attribute.key`, so the exact backend string can't be reliably rebuilt here (names
 * and keys can differ in casing/format). Instead we match a variant by comparing the
 * selected attributeName -> optionLabel pairs directly against each variant's own
 * `options[]` — equally deterministic (each enabled variant has a unique option set)
 * without depending on data the frontend never receives.
 */
export function resolveVariant(
  variants: ProductVariant[] | undefined | null,
  selectedOptions: Record<string, string> | undefined | null,
): ProductVariant | undefined {
  if (!variants || variants.length === 0 || !selectedOptions) return undefined;

  const selectedEntries = Object.entries(selectedOptions).filter(([, value]) => !!value);
  if (selectedEntries.length === 0) return undefined;

  return variants.find((variant) => {
    if (!variant || variant.isEnabled === false) return false;
    const options = variant.options;
    if (!Array.isArray(options) || options.length === 0) return false;

    // Every selected attribute must match this variant's corresponding option,
    // and the variant must not have extra variant-defining attributes beyond
    // what was selected (otherwise a partial selection could match multiple variants).
    if (options.length !== selectedEntries.length) return false;

    return selectedEntries.every(([attributeName, optionLabel]) => {
      const match = options.find(
        (opt) => opt && opt.attributeName === attributeName,
      );
      if (!match) return false;
      return match.optionLabel === optionLabel || match.value === optionLabel;
    });
  });
}

export interface VariantAttributeOptions {
  attributeName: string;
  options: string[];
}

/**
 * Derives the distinct attribute names and their available option values across
 * a product's variants — used to render swatch/dropdown pickers. Defensive against
 * missing/inconsistent variant option data: never throws, degrades to [].
 */
export function getVariantAttributeOptions(
  variants: ProductVariant[] | undefined | null,
): VariantAttributeOptions[] {
  if (!variants || variants.length === 0) return [];

  const order: string[] = [];
  const map = new Map<string, Set<string>>();

  for (const variant of variants) {
    if (!variant || variant.isEnabled === false) continue;
    const options = variant.options;
    if (!Array.isArray(options)) continue;

    for (const opt of options) {
      if (!opt || !opt.attributeName || !opt.optionLabel) continue;
      if (!map.has(opt.attributeName)) {
        map.set(opt.attributeName, new Set());
        order.push(opt.attributeName);
      }
      map.get(opt.attributeName)!.add(opt.optionLabel);
    }
  }

  return order.map((attributeName) => ({
    attributeName,
    options: Array.from(map.get(attributeName) || []),
  }));
}
