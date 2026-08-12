import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { BrandTicker } from '@/components/landing/BrandTicker';
import { GlobalImpact } from '@/components/landing/GlobalImpact';
import { EcommerceToolkit } from '@/components/landing/EcommerceToolkit';
import { DemoBanner } from '@/components/landing/DemoBanner';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Partnerships } from '@/components/landing/Partnerships';
import { Pricing } from '@/components/landing/Pricing';
import { Testimonials } from '@/components/landing/Testimonials';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';

export const revalidate = 60; // Revalidate cache every 60 seconds

async function getPlatformConfig() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/admin/platform-config`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export default async function Home() {
  const cmsConfig = await getPlatformConfig();
  const heroContent = cmsConfig?.heroContent || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <Hero 
        title={heroContent.title} 
        subtitle={heroContent.subtitle} 
      />

      {/* 3. Infinite Auto-Scrolling Brand Ticker */}
      <BrandTicker />

      {/* 4. Global Scale & Stats Matrix */}
      <GlobalImpact />

      {/* 5. Complete Ecommerce Toolkit (Bento Showcase Grid) */}
      <EcommerceToolkit />

      {/* 6. Interactive Demo Banner */}
      <DemoBanner />

      {/* 7. Feature & Architecture Infrastructure Grid */}
      <FeatureGrid />

      {/* 8. How It Works (Simple 3-Step Store Launch) */}
      <HowItWorks />

      {/* 9. Courier Logistics & MFS Payment Partners */}
      <Partnerships />

      {/* 10. Pricing Summary Cards */}
      <Pricing />

      {/* 11. Merchant Testimonials & Success Stories */}
      <Testimonials />

      {/* 12. Frequently Asked Questions */}
      <FaqSection />

      {/* 13. Footer */}
      <Footer />
    </div>
  );
}
