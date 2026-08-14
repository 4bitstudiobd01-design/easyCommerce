import React from 'react';
import { StorefrontHeader } from './StorefrontHeader';
import { CurrentStorefrontCard } from './CurrentStorefrontCard';
import { ActiveThemeCard } from './ActiveThemeCard';
import { ThemeMarketplaceSection } from './ThemeMarketplaceSection';
import { CustomDesignBanner } from './CustomDesignBanner';

export function StorefrontView() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <StorefrontHeader />
      
      <div className="p-8 space-y-6 max-w-[1400px] w-full">
        <CurrentStorefrontCard />
        <ActiveThemeCard />
        <ThemeMarketplaceSection />
        <CustomDesignBanner />
      </div>
    </div>
  );
}
