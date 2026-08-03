import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';

export interface StoreThemeDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  isFree: boolean;
  previewImage: string;
  features: string[];
  primaryColorDefault: string;
}

export const THEME_CATALOG: StoreThemeDefinition[] = [
  {
    id: 'DEFAULT_MODERN',
    name: 'Classic Modern Storefront',
    category: 'General E-Commerce',
    description: 'Clean, fast, and high-converting default store theme suitable for all product types.',
    price: 0,
    isFree: true,
    previewImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    features: ['Responsive Hero Slider', 'Category Pill Filtering', 'Instant Order Modal', 'Mobile Cart Drawer'],
    primaryColorDefault: '#2563eb',
  },
  {
    id: 'LUXURY_FASHION',
    name: 'Luxuria Fashion & Boutique',
    category: 'Fashion & Clothing',
    description: 'Sleek dark fashion editorial layout with full-bleed hero banners, elegant serif headers, and gold accents.',
    price: 1500,
    isFree: false,
    previewImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    features: ['High-Fashion Grid', 'Full-Bleed Visual Banner', 'Gold Accent Badges', 'Variant Color Swatches'],
    primaryColorDefault: '#d97706',
  },
  {
    id: 'TECH_HUB',
    name: 'TechHub Electronics & Gadgets',
    category: 'Electronics & Tech',
    description: 'Cyber blue electronics catalog theme with spec badges, featured deal timers, and dark navy grid.',
    price: 2000,
    isFree: false,
    previewImage: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800',
    features: ['Tech Spec Badges', 'Flash Sale Countdown', 'Dark Cyber Aesthetic', 'Stock Level Counter'],
    primaryColorDefault: '#0284c7',
  },
  {
    id: 'ORGANIC_GROCERY',
    name: 'Organic Fresh Grocery',
    category: 'Grocery & Supermarket',
    description: 'Fresh eco-green grocery layout with category pill tabs, organic badges, and quick 1-click order buttons.',
    price: 1200,
    isFree: false,
    previewImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    features: ['Fresh Leaf Badges', 'Express Checkout Button', 'Multi-Category Tabs', 'Weight/Unit Tags'],
    primaryColorDefault: '#16a34a',
  },
  {
    id: 'MINIMAL_DARK',
    name: 'Minimalist Cyber Dark Glass',
    category: 'Premium Lifestyle',
    description: 'Ultra-modern dark glassmorphism theme with neon glowing borders, vibrant badges, and sleek layout.',
    price: 1800,
    isFree: false,
    previewImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    features: ['Glassmorphism Cards', 'Neon Glow Accents', 'Ultra-Fast Load Time', 'Dark Theme Aesthetics'],
    primaryColorDefault: '#8b5cf6',
  },
];

@Injectable()
export class ListAvailableThemesService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(storeId: string): Promise<{
    activeThemeId: string;
    unlockedThemeIds: string[];
    themes: (StoreThemeDefinition & { isUnlocked: boolean; isActive: boolean })[];
  }> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });

    const activeThemeId = store?.activeThemeId || 'DEFAULT_MODERN';
    const unlockedThemeIds = store?.unlockedThemeIds || ['DEFAULT_MODERN'];

    const themes = THEME_CATALOG.map((theme) => {
      const isUnlocked = theme.isFree || unlockedThemeIds.includes(theme.id);
      const isActive = theme.id === activeThemeId;
      return {
        ...theme,
        isUnlocked,
        isActive,
      };
    });

    return {
      activeThemeId,
      unlockedThemeIds,
      themes,
    };
  }
}
