import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;

  try {
    const res = await fetch(`http://localhost:5001/api/v1/stores/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = await res.json();
      const store = json.data || json;

      return {
        title: `${store.name} | Official Storefront`,
        description: `Shop authentic products, pricing, and fast nationwide delivery from ${store.name} on EasyCommerce.`,
        openGraph: {
          title: `${store.name} | EasyCommerce Online Store`,
          description: `Browse latest products and order online from ${store.name}.`,
          url: `https://${store.slug}.easycommerce.app`,
          siteName: store.name,
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${store.name} | EasyCommerce`,
          description: `Shop online from ${store.name}`,
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
