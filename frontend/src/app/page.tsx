import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { MetricsStrip } from '@/components/landing/MetricsStrip';
import { ProblemSolutionSection } from '@/components/landing/ProblemSolutionSection';
import { FeaturesShowcase } from '@/components/landing/FeaturesShowcase';
import { DashboardShowcaseSection } from '@/components/landing/DashboardShowcaseSection';
import { IntegrationsSection } from '@/components/landing/IntegrationsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { Pricing } from '@/components/landing/Pricing';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';
import { MobileAppBottomNav } from '@/components/landing/MobileAppBottomNav';

export const revalidate = 60; // Revalidate cache every 60 seconds

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white pb-20 md:pb-0">
      {/* 1. Exact Navbar */}
      <Navbar />

      {/* 2. Exact Hero Section with 3D Mockup */}
      <Hero />

      {/* 3. Exact Metrics / Social Proof Strip */}
      <MetricsStrip />

      {/* 4. Exact Problem vs Solution (Spreadsheets to BitCommerce) */}
      <ProblemSolutionSection />

      {/* 5. Exact 8-Feature Showcase Grid */}
      <FeaturesShowcase />

      {/* 6. Exact Powerful Dashboard Showcase (Charts + Copy) */}
      <DashboardShowcaseSection />

      {/* 7. Exact Payments & Delivery Partners Strip */}
      <IntegrationsSection />

      {/* 8. Exact 4-Step How BitCommerce Works */}
      <HowItWorksSection />

      {/* 9. Exact Pricing Table Section */}
      <Pricing />

      {/* 10. FAQ / Help Section */}
      <FaqSection />

      {/* 11. Exact Royal Blue CTA Banner & Dark Navy Footer */}
      <Footer />

      {/* 12. Ultra-Sleek Floating Native Mobile App Dock */}
      <MobileAppBottomNav />
    </div>
  );
}
