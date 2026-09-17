import type { Metadata } from 'next';
import { PixelLoader } from '@/features/storefront/components/PixelLoader';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

/**
 * Absolute base for resolving relative OG / Twitter image URLs. Prefers an
 * explicit site URL, falls back to localhost in dev so Next stops warning.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;
  const metadataBase = new URL(SITE_URL);

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://easycoerzserver.vercel.app/api/v1';
    const res = await fetch(`${apiBase}/seo/public/store/${slug}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = await res.json();
      const seo = json.data || json;

      return {
        metadataBase,
        title: seo.metaTitle || `${seo.storeName} | Official Storefront`,
        description:
          seo.metaDescription ||
          `Shop authentic products, pricing, and fast nationwide delivery from ${seo.storeName} on BitCommerce.`,
        icons: {
          icon: seo.faviconUrl || '/icon.png',
        },
        alternates: {
          canonical: seo.canonicalUrl || `https://${slug}.bitcommerce.app`,
        },
        openGraph: {
          title: seo.openGraphTags?.title || `${seo.storeName} | BitCommerce Store`,
          description:
            seo.openGraphTags?.description ||
            `Browse products and order online from ${seo.storeName}.`,
          url: seo.openGraphTags?.url || `https://${slug}.bitcommerce.app`,
          siteName: seo.storeName,
          images: [
            {
              url:
                seo.openGraphTags?.image ||
                seo.logoUrl ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
              width: 1200,
              height: 630,
              alt: seo.storeName,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: seo.openGraphTags?.title || `${seo.storeName} | BitCommerce`,
          description: seo.openGraphTags?.description || `Shop online from ${seo.storeName}`,
          images: [
            seo.openGraphTags?.image ||
              seo.logoUrl ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
          ],
        },
      };
    }
  } catch (err) {
    // Fallback if backend server unavailable during static build
  }

  return {
    metadataBase,
    title: `${slug} | Storefront`,
    description: `Official online storefront on BitCommerce.`,
  };
}

export default function StorefrontLayout({ params, children }: Props) {
  return (
    <>
      <PixelLoader slug={params.slug} />
      {children}
    </>
  );
}
