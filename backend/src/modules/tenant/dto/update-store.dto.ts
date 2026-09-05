import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  MaxLength,
  IsUrl,
  IsHexColor,
  ValidateNested,
  IsObject,
} from 'class-validator';
import {
  SmsDriverEnum,
  EmailDriverEnum,
  HeroBannerItem,
  NavigationLinkItem,
} from '../entities/store.entity';

// require_tld: false — uploaded assets are served from the API's own origin
// (e.g. http://localhost:5001/uploads/... in local dev, or an internal host),
// which the default isURL() rejects for lacking a public top-level domain.
const IMAGE_URL_OPTIONS = { require_protocol: true, require_tld: false, protocols: ['http', 'https'] };

export class CheckoutFieldRuleDto {
  @ApiProperty({ example: true, description: 'Whether the field appears on the checkout form' })
  @IsBoolean()
  show: boolean;

  @ApiProperty({ example: true, description: 'Whether the field is mandatory (only meaningful when shown)' })
  @IsBoolean()
  required: boolean;
}

export class HeroBannerItemDto implements HeroBannerItem {
  @ApiProperty({ example: 'banner-1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'https://cdn.example.com/banners/summer-sale.jpg' })
  @IsUrl(IMAGE_URL_OPTIONS)
  imageUrl: string;

  @ApiProperty({ example: 'Shop Collection', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  ctaText?: string;

  @ApiProperty({ example: '/store/my-store', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ctaLink?: string;
}

export class UpdateStoreDto {
  @ApiProperty({ example: 'My Online Fashion Store', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '01700000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Dhanmondi, Dhaka', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsOptional()
  @IsUrl(IMAGE_URL_OPTIONS)
  logo?: string;

  @ApiProperty({ example: 'https://example.com/favicon.ico', required: false })
  @IsOptional()
  @IsUrl(IMAGE_URL_OPTIONS)
  favicon?: string;

  @ApiProperty({ example: 'https://facebook.com/yourpage', required: false })
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @ApiProperty({ example: 'https://instagram.com/yourpage', required: false })
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @ApiProperty({ example: 'https://twitter.com/yourpage', required: false })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @ApiProperty({ example: 'https://youtube.com/@yourpage', required: false })
  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;

  @ApiProperty({ example: 'Your verified online store for authentic goods.', required: false })
  @IsOptional()
  @IsString()
  footerDescription?: string;

  @ApiProperty({ example: 'Sumon Fashion - Premium Apparel Store', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiProperty({ example: 'Shop top quality clothing online with fast BD delivery.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  // Marketing Pixels & Conversions API
  @ApiProperty({ example: '123456789012345', required: false })
  @IsOptional()
  @IsString()
  facebookPixelId?: string;

  @ApiProperty({ example: 'EAAG...', required: false })
  @IsOptional()
  @IsString()
  facebookCapiToken?: string;

  @ApiProperty({ example: 'TEST12345', required: false })
  @IsOptional()
  @IsString()
  facebookTestEventCode?: string;

  @ApiProperty({ example: 'C1234567890', required: false })
  @IsOptional()
  @IsString()
  tiktokPixelId?: string;

  @ApiProperty({ example: 'GTM-XXXXXXX', required: false })
  @IsOptional()
  @IsString()
  googleTagManagerId?: string;

  @ApiProperty({ example: 'G-1234567890', required: false })
  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;

  @ApiProperty({ example: 'snap_pixel_123', required: false })
  @IsOptional()
  @IsString()
  snapchatPixelId?: string;

  @ApiProperty({ example: 'pin_tag_456', required: false })
  @IsOptional()
  @IsString()
  pinterestTagId?: string;

  @ApiProperty({ example: '#2563eb', required: false })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiProperty({ example: 'Inter', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fontFamily?: string;

  @ApiProperty({ required: false, type: [HeroBannerItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeroBannerItemDto)
  heroBanners?: HeroBannerItem[];

  @ApiProperty({ example: 'www.sumonfashion.com', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'BDT', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'sf_api_key_123', required: false })
  @IsOptional()
  @IsString()
  steadfastApiKey?: string;

  @ApiProperty({ example: 'sf_secret_key_456', required: false })
  @IsOptional()
  @IsString()
  steadfastSecretKey?: string;

  @ApiProperty({ example: 'pth_client_id_789', required: false })
  @IsOptional()
  @IsString()
  pathaoClientId?: string;

  @ApiProperty({ example: 'pth_client_secret_012', required: false })
  @IsOptional()
  @IsString()
  pathaoClientSecret?: string;

  // Notification Drivers (SMS & Email)
  @ApiProperty({ enum: SmsDriverEnum, required: false })
  @IsOptional()
  @IsEnum(SmsDriverEnum)
  smsDriver?: SmsDriverEnum;

  @ApiProperty({ example: 'sms_api_key_123', required: false })
  @IsOptional()
  @IsString()
  smsApiKey?: string;

  @ApiProperty({ example: 'EASYSTORE', required: false })
  @IsOptional()
  @IsString()
  smsSenderId?: string;

  @ApiProperty({ enum: EmailDriverEnum, required: false })
  @IsOptional()
  @IsEnum(EmailDriverEnum)
  emailDriver?: EmailDriverEnum;

  @ApiProperty({ example: 'smtp.mailtrap.io', required: false })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiProperty({ example: 587, required: false })
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @ApiProperty({ example: 'smtp_user', required: false })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiProperty({ example: 'smtp_pass', required: false })
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @ApiProperty({ example: 'no-reply@store.com', required: false })
  @IsOptional()
  @IsString()
  fromEmail?: string;

  // Shop Policies
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  privacyPolicy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  termsOfService?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refundPolicy?: string;

  // Blocklist
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedIps?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedEmails?: string[];

  // Limits
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxCodOrdersPerIp?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxOrdersPerDay?: number;

  // --- Localization ---
  @ApiProperty({ example: 'en', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 'Asia/Dhaka', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'DD/MM/YYYY', required: false })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiProperty({ example: 'KG', required: false })
  @IsOptional()
  @IsString()
  weightUnit?: string;

  // --- Store Preferences ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  maintenanceMessage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  catalogModeEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showOutOfStockProducts?: boolean;

  // --- Order Settings ---
  @ApiProperty({ example: 'ORD-', required: false })
  @IsOptional()
  @IsString()
  orderNumberPrefix?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoConfirmOrders?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  invoiceFooterNote?: string;

  // --- Checkout Settings ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  guestCheckoutEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requireCustomerEmail?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showCouponFieldAtCheckout?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showOrderNoteFieldAtCheckout?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderAmount?: number;

  @ApiProperty({ required: false, description: 'Flat delivery charge for orders inside Dhaka' })
  @IsOptional()
  // The numeric column round-trips as a string ("60.00"); coerce before validating.
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? value : Number(value)))
  @IsNumber()
  @Min(0)
  deliveryChargeInsideDhaka?: number;

  @ApiProperty({ required: false, description: 'Flat delivery charge for orders outside Dhaka' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? value : Number(value)))
  @IsNumber()
  @Min(0)
  deliveryChargeOutsideDhaka?: number;

  @ApiProperty({
    required: false,
    description:
      'Per-field show/required rules for the checkout form. Keys: email, address, country, division, district, cityArea, zipCode, orderNote. Each value is { show: boolean, required: boolean }.',
  })
  @IsOptional()
  @IsObject()
  checkoutFieldConfig?: Record<string, CheckoutFieldRuleDto>;

  // --- Customer Settings ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowCustomerRegistration?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requireEmailVerification?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowCustomerReviews?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoApproveReviews?: boolean;

  // --- Navigation ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  navigationLinks?: NavigationLinkItem[];

  // --- Homepage Settings ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showHeroSection?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showFeaturedProducts?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showCategoriesSection?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  featuredProductsCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showNewArrivals?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showBestSellers?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showFullCatalog?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showPromoBanner?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showWhyChooseUs?: boolean;
}
