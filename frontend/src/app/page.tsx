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
import { CompareFeatures } from '@/components/landing/CompareFeatures';
import { Testimonials } from '@/components/landing/Testimonials';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <Hero />

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

      {/* 11. Detailed Side-by-Side Feature Matrix Table */}
      <CompareFeatures />

      {/* 12. Merchant Testimonials & Success Stories */}
      <Testimonials />

      {/* 13. Frequently Asked Questions */}
      <FaqSection />

      {/* 14. Footer */}
      <Footer />
    </div>
  );
}
