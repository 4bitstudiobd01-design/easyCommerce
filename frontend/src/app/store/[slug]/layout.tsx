import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;

  try {
    const res = await fetch(`http://localhost:5001/api/v1/seo/public/store/${slug}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = await res.json();
      const seo = json.data || json;

      return {
        title: seo.metaTitle || `${seo.storeName} | Official Storefront`,
        description:
          seo.metaDescription ||
          `Shop authentic products, pricing, and fast nationwide delivery from ${seo.storeName} on EasyCommerce.`,
        icons: {
          icon: seo.faviconUrl || '/favicon.ico',
        },
        alternates: {
          canonical: seo.canonicalUrl || `https://${slug}.easycommerce.app`,
        },
        openGraph: {
          title: seo.openGraphTags?.title || `${seo.storeName} | EasyCommerce Store`,
          description:
            seo.openGraphTags?.description ||
            `Browse products and order online from ${seo.storeName}.`,
          url: seo.openGraphTags?.url || `https://${slug}.easycommerce.app`,
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
          title: seo.openGraphTags?.title || `${seo.storeName} | EasyCommerce`,
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
    title: `${slug} | Storefront`,
    description: `Official online storefront on EasyCommerce.`,
  };
}

export default function StorefrontLayout({ children }: Props) {
  return <>{children}</>;
}
