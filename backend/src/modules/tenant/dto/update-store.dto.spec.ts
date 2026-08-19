import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateStoreDto, HeroBannerItemDto } from './update-store.dto';

async function errorsFor(payload: Partial<UpdateStoreDto>) {
  const dto = plainToInstance(UpdateStoreDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

const validBanner = {
  id: 'banner-1',
  imageUrl: 'https://cdn.example.com/banners/summer-sale.jpg',
};

/**
 * Theme & Branding fields previously accepted any string (or bare @IsArray()
 * for heroBanners with no per-item validation), so a hand-crafted request could
 * store an arbitrary XSS-bearing string as primaryColor/fontFamily, a
 * javascript: URL as a logo/banner image, or a banner array with malformed
 * items that would break storefront rendering.
 */
describe('UpdateStoreDto — branding fields', () => {
  it('accepts a well-formed branding payload', async () => {
    expect(
      await errorsFor({
        logo: 'https://cdn.example.com/logo.png',
        favicon: 'https://cdn.example.com/favicon.png',
        metaTitle: 'Sumon Fashion - Premium Apparel',
        metaDescription: 'Shop top quality clothing online with fast BD delivery.',
        primaryColor: '#2563EB',
        fontFamily: 'Inter',
        heroBanners: [validBanner],
      }),
    ).toEqual([]);
  });

  it('rejects a non-hex primaryColor', async () => {
    expect(await errorsFor({ primaryColor: 'Royal Blue' })).toContain('primaryColor');
    expect(await errorsFor({ primaryColor: 'javascript:alert(1)' })).toContain('primaryColor');
  });

  it('rejects a logo/favicon that is not a real http(s) URL', async () => {
    expect(await errorsFor({ logo: 'javascript:alert(1)' })).toContain('logo');
    expect(await errorsFor({ logo: 'not-a-url' })).toContain('logo');
    expect(await errorsFor({ favicon: 'ftp://example.com/icon.ico' })).toContain('favicon');
  });

  it('accepts an uploaded asset URL served from the API origin (no public TLD, e.g. localhost)', async () => {
    expect(await errorsFor({ logo: 'http://localhost:5001/uploads/tenant-1/store_logo/abc.png' })).toEqual([]);
  });

  it('enforces SEO field length caps matching the storefront <title>/<meta> limits', async () => {
    expect(await errorsFor({ metaTitle: 'a'.repeat(71) })).toContain('metaTitle');
    expect(await errorsFor({ metaDescription: 'a'.repeat(161) })).toContain('metaDescription');
  });

  it('rejects a hero banner missing required fields', async () => {
    expect(
      await errorsFor({ heroBanners: [{ id: 'banner-1' } as unknown as HeroBannerItemDto] }),
    ).toContain('heroBanners');
  });

  it('rejects a hero banner with a non-URL imageUrl', async () => {
    expect(
      await errorsFor({ heroBanners: [{ ...validBanner, imageUrl: 'javascript:alert(1)' }] }),
    ).toContain('heroBanners');
  });

  it('accepts a hero banner without optional CTA fields', async () => {
    const dto = plainToInstance(HeroBannerItemDto, validBanner);
    expect(await validate(dto)).toEqual([]);
  });
});
