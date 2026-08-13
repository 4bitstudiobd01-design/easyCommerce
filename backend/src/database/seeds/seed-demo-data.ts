import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../data-source';
import { UserEntity, UserRoleEnum } from '../../modules/user/entities/user.entity';
import { TenantEntity } from '../../modules/tenant/entities/tenant.entity';
import { StoreEntity } from '../../modules/tenant/entities/store.entity';
import { CategoryEntity } from '../../modules/catalog/entities/category.entity';
import { BrandEntity } from '../../modules/catalog/entities/brand.entity';
import { CollectionEntity } from '../../modules/catalog/entities/collection.entity';
import { ShippingProfileEntity } from '../../modules/catalog/entities/shipping-profile.entity';
import { AttributeDefinitionEntity } from '../../modules/catalog/entities/attribute-definition.entity';
import { AttributeOptionEntity } from '../../modules/catalog/entities/attribute-option.entity';
import { CategoryAttributeEntity } from '../../modules/catalog/entities/category-attribute.entity';
import { ProductAttributeValueEntity } from '../../modules/catalog/entities/product-attribute-value.entity';
import { ProductEntity } from '../../modules/catalog/entities/product.entity';
import { ProductVariantEntity, VariantOptionMeta } from '../../modules/catalog/entities/product-variant.entity';
import { ProductImageEntity } from '../../modules/catalog/entities/product-image.entity';
import { ProductRelationEntity } from '../../modules/catalog/entities/product-relation.entity';
import { ProductType } from '../../modules/catalog/enums/product-type.enum';
import { ProductStatus } from '../../modules/catalog/enums/product-status.enum';
import { TaxCategory } from '../../modules/catalog/enums/tax-category.enum';
import { ProductDiscountType } from '../../modules/catalog/enums/product-discount-type.enum';
import { AttributeType } from '../../modules/catalog/enums/attribute-type.enum';
import {
  WeightUnit,
  DimensionUnit,
  DigitalDeliveryType,
  ServiceDeliveryType,
  ServiceDurationUnit,
} from '../../modules/catalog/enums/fulfillment.enum';
import { WarehouseEntity } from '../../modules/inventory/entities/warehouse.entity';
import { InventoryStockEntity } from '../../modules/inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../modules/inventory/entities/inventory-movement.entity';
import { MovementType } from '../../modules/inventory/enums/inventory-movement-type.enum';
import { OrderEntity, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from '../../modules/order/entities/order.entity';
import { OrderItemEntity } from '../../modules/order/entities/order-item.entity';
import { ConsignmentEntity, CourierProviderEnum, ConsignmentStatusEnum } from '../../modules/logistics/entities/consignment.entity';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../../modules/payment/entities/payment.entity';
import { OrderStatusHistoryEntity } from '../../modules/order/entities/order-status-history.entity';
import { OrderNoteEntity } from '../../modules/order/entities/order-note.entity';
import { ReturnEntity, ReturnStatusEnum } from '../../modules/order/entities/return.entity';
import { ReturnItemEntity } from '../../modules/order/entities/return-item.entity';
import { RefundEntity, RefundStatusEnum } from '../../modules/payment/entities/refund.entity';
import { CustomerEntity, CustomerStatusEnum, CustomerSourceEnum } from '../../modules/customer/entities/customer.entity';

import * as bcrypt from 'bcrypt';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Demo seeder cannot run in production environment.');
    process.exit(1);
  }

  console.log('🌱 Starting EasyCommerce Full Product Module Demo Data Seeder (Chunk 14)...');
  await AppDataSource.initialize();
  console.log('✅ Database connected.');

  const userRepo = AppDataSource.getRepository(UserEntity);
  const tenantRepo = AppDataSource.getRepository(TenantEntity);
  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const brandRepo = AppDataSource.getRepository(BrandEntity);
  const collectionRepo = AppDataSource.getRepository(CollectionEntity);
  const shippingProfileRepo = AppDataSource.getRepository(ShippingProfileEntity);
  const attrDefRepo = AppDataSource.getRepository(AttributeDefinitionEntity);
  const attrOptRepo = AppDataSource.getRepository(AttributeOptionEntity);
  const catAttrRepo = AppDataSource.getRepository(CategoryAttributeEntity);
  const prodAttrValRepo = AppDataSource.getRepository(ProductAttributeValueEntity);
  const productRepo = AppDataSource.getRepository(ProductEntity);
  const variantRepo = AppDataSource.getRepository(ProductVariantEntity);
  const imageRepo = AppDataSource.getRepository(ProductImageEntity);
  const relationRepo = AppDataSource.getRepository(ProductRelationEntity);
  const warehouseRepo = AppDataSource.getRepository(WarehouseEntity);
  const stockRepo = AppDataSource.getRepository(InventoryStockEntity);
  const movementRepo = AppDataSource.getRepository(InventoryMovementEntity);
  const orderRepo = AppDataSource.getRepository(OrderEntity);
  const consignmentRepo = AppDataSource.getRepository(ConsignmentEntity);
  const paymentRepo = AppDataSource.getRepository(PaymentEntity);
  const statusHistoryRepo = AppDataSource.getRepository(OrderStatusHistoryEntity);
  const noteRepo = AppDataSource.getRepository(OrderNoteEntity);
  const returnRepo = AppDataSource.getRepository(ReturnEntity);
  const returnItemRepo = AppDataSource.getRepository(ReturnItemEntity);
  const refundRepo = AppDataSource.getRepository(RefundEntity);
  const customerRepo = AppDataSource.getRepository(CustomerEntity);

  // 1. Seed Merchant User
  const merchantEmail = 'belal@easycommerce.app';
  let merchant = await userRepo.findOne({ where: { email: merchantEmail } });

  if (!merchant) {
    console.log('👤 Creating Merchant User: MD Belal Hossain');
    merchant = userRepo.create({
      email: merchantEmail,
      fullName: 'MD Belal Hossain',
      passwordHash: bcrypt.hashSync('Password123!', 10),
      phone: '+8801711223344',
      role: UserRoleEnum.STORE_OWNER,
      isActive: true,
    });
    await userRepo.save(merchant);
  }

  // 2. Seed Tenant & Store
  const storeSlug = 'mydiagnostic';
  let store = await storeRepo.findOne({ where: { slug: storeSlug } });
  let tenant: TenantEntity;

  if (!store) {
    console.log('🏪 Creating Development Tenant & Store: My Diagnostic Store');
    tenant = tenantRepo.create({
      name: 'Diagnostic Tenant',
      isActive: true,
    });
    await tenantRepo.save(tenant);

    merchant.tenantId = tenant.id;
    await userRepo.save(merchant);

    store = storeRepo.create({
      name: 'My Diagnostic Store',
      slug: storeSlug,
      domain: 'mydiagnostic.easycommerce.app',
      category: 'Fashion & Electronics',
      phone: '+8801711223344',
      address: 'House 42, Road 11, Banani, Dhaka',
      ownerId: merchant.id,
      tenantId: tenant.id,
      isActive: true,
      activeThemeId: 'DEFAULT_MODERN',
      unlockedThemeIds: ['DEFAULT_MODERN'],
      primaryColor: '#2563eb',
      fontFamily: 'Inter',
      currency: 'BDT',
      steadfastApiKey: 'demo_sf_key_12345',
      steadfastSecretKey: 'demo_sf_secret_67890',
    });
    await storeRepo.save(store);
  } else {
    tenant = (await tenantRepo.findOne({ where: { id: store.tenantId } }))!;
  }

  const tenantId = tenant.id;

  // 3. Seed Default Warehouse
  let warehouse = await warehouseRepo.findOne({ where: { tenantId, isDefault: true } });
  if (!warehouse) {
    console.log('🏭 Creating Default Warehouse: Central Dhaka Warehouse');
    warehouse = warehouseRepo.create({
      name: 'Central Dhaka Warehouse',
      code: 'WH-DAC-01',
      isDefault: true,
      address: 'Tejgaon Industrial Area, Dhaka',
      phone: '+8801711223344',
      tenantId,
    });
    await warehouseRepo.save(warehouse);
  }

  // 4. Seed Shipping Profiles
  console.log('🚚 Seeding Shipping Profiles...');
  const shippingProfileDefs = [
    { name: 'Standard Courier Delivery', description: 'Standard parcel delivery within 2-3 business days across Bangladesh.', isDefault: true },
    { name: 'Heavy & Bulky Freight', description: 'Special cargo freight for heavy furniture and appliances (above 3kg).', isDefault: false },
    { name: 'Fragile / Express Care', description: 'Reinforced bubble-wrap and fragile tag handling with 24-48h express delivery.', isDefault: false },
  ];

  const shippingProfileMap = new Map<string, ShippingProfileEntity>();
  for (const spDef of shippingProfileDefs) {
    let sp = await shippingProfileRepo.findOne({ where: { tenantId, name: spDef.name } });
    if (!sp) {
      sp = shippingProfileRepo.create({
        name: spDef.name,
        description: spDef.description,
        isDefault: spDef.isDefault,
        tenantId,
      });
      await shippingProfileRepo.save(sp);
    }
    shippingProfileMap.set(spDef.name, sp);
  }

  // 5. Seed Brands
  console.log('🏷️ Seeding Brands...');
  const brandDefs = [
    { name: 'Nova', slug: 'nova', description: 'Contemporary lifestyle essentials and everyday smart apparel.' },
    { name: 'UrbanEdge', slug: 'urbanedge', description: 'Modern urban streetwear, denim, and premium cotton apparel.' },
    { name: 'TechCore', slug: 'techcore', description: 'High-performance audio, smart gadgets, and consumer electronics.' },
    { name: 'HomeNest', slug: 'homenest', description: 'Minimalist Scandinavian home decor, lighting, and kitchenware.' },
    { name: 'PureGlow', slug: 'pureglow', description: 'Ethical skincare, organic personal care, and wellness essentials.' },
    { name: 'ArtisanCraft', slug: 'artisancraft', description: 'Handmade leather goods, accessories, and heritage crafts.' },
  ];

  const brandMap = new Map<string, BrandEntity>();
  for (const bDef of brandDefs) {
    let brand = await brandRepo.findOne({ where: { tenantId, slug: bDef.slug } });
    if (!brand) {
      brand = brandRepo.create({
        name: bDef.name,
        slug: bDef.slug,
        description: bDef.description,
        tenantId,
      });
      await brandRepo.save(brand);
    }
    brandMap.set(bDef.slug, brand);
  }

  // 6. Seed Collections
  console.log('📂 Seeding Collections...');
  const collectionDefs = [
    { name: 'New Arrivals', slug: 'new-arrivals', description: 'Latest trending products freshly added this season.' },
    { name: 'Best Sellers', slug: 'best-sellers', description: 'Most popular customer favorites with highest ratings.' },
    { name: 'Summer Collection', slug: 'summer-collection', description: 'Lightweight, breathable apparel and summer lifestyle items.' },
    { name: 'Office Essentials', slug: 'office-essentials', description: 'Professional workspace accessories, lighting, and productivity tools.' },
    { name: 'Digital Products', slug: 'digital-products', description: 'Instant-download software kits, business templates, and digital assets.' },
  ];

  const collectionMap = new Map<string, CollectionEntity>();
  for (const cDef of collectionDefs) {
    let col = await collectionRepo.findOne({ where: { tenantId, slug: cDef.slug } });
    if (!col) {
      col = collectionRepo.create({
        name: cDef.name,
        slug: cDef.slug,
        description: cDef.description,
        tenantId,
      });
      await collectionRepo.save(col);
    }
    collectionMap.set(cDef.slug, col);
  }

  // 7. Seed Categories
  console.log('🗂️ Seeding Categories...');
  const categoryDefs = [
    { title: "Men's Fashion", slug: 'mens-fashion' },
    { title: "Women's Fashion", slug: 'womens-fashion' },
    { title: 'Electronics', slug: 'electronics' },
    { title: 'Accessories', slug: 'accessories' },
    { title: 'Home & Lifestyle', slug: 'home-lifestyle' },
    { title: 'Digital & Services', slug: 'digital-services' },
  ];

  const categoryMap = new Map<string, CategoryEntity>();
  for (const catDef of categoryDefs) {
    let cat = await categoryRepo.findOne({ where: { tenantId, slug: catDef.slug } });
    if (!cat) {
      cat = categoryRepo.create({
        name: catDef.title,
        slug: catDef.slug,
        tenantId,
      });
      await categoryRepo.save(cat);
    }
    categoryMap.set(catDef.slug, cat);
  }

  // 8. Seed Attribute Definitions and Options
  console.log('⚙️ Seeding Attribute Definitions & Options...');
  const attributeDefs = [
    {
      name: 'Color',
      slug: 'color',
      key: 'color',
      type: AttributeType.SELECT,
      description: 'Product primary or secondary color palette',
      isVariantOption: true,
      isFilterable: true,
      options: [
        { label: 'Midnight Black', value: 'midnight-black' },
        { label: 'Pure White', value: 'pure-white' },
        { label: 'Navy Blue', value: 'navy-blue' },
        { label: 'Heather Grey', value: 'heather-grey' },
        { label: 'Maroon', value: 'maroon' },
        { label: 'Olive Green', value: 'olive-green' },
      ],
    },
    {
      name: 'Size',
      slug: 'size',
      key: 'size',
      type: AttributeType.SELECT,
      description: 'Apparel and garment sizing',
      isVariantOption: true,
      isFilterable: true,
      options: [
        { label: 'S (Small)', value: 'S' },
        { label: 'M (Medium)', value: 'M' },
        { label: 'L (Large)', value: 'L' },
        { label: 'XL (Extra Large)', value: 'XL' },
        { label: 'XXL (Double XL)', value: 'XXL' },
      ],
    },
    {
      name: 'Fabric Material',
      slug: 'fabric-material',
      key: 'fabric_material',
      type: AttributeType.TEXT,
      description: 'Textile composition details',
      isVariantOption: false,
      isFilterable: true,
    },
    {
      name: 'Storage Capacity',
      slug: 'storage-capacity',
      key: 'storage_capacity',
      type: AttributeType.SELECT,
      description: 'Digital storage capacity',
      isVariantOption: true,
      isFilterable: true,
      options: [
        { label: '64GB', value: '64gb' },
        { label: '128GB', value: '128gb' },
        { label: '256GB', value: '256gb' },
        { label: '512GB', value: '512gb' },
      ],
    },
    {
      name: 'Warranty Period',
      slug: 'warranty-period',
      key: 'warranty_period',
      type: AttributeType.SELECT,
      description: 'Manufacturer warranty coverage duration',
      isVariantOption: false,
      isFilterable: true,
      options: [
        { label: '6 Months Official Warranty', value: '6m' },
        { label: '1 Year Official Warranty', value: '1y' },
        { label: '2 Years Extended Warranty', value: '2y' },
      ],
    },
  ];

  const attrMap = new Map<string, AttributeDefinitionEntity>();
  const attrOptMap = new Map<string, Map<string, AttributeOptionEntity>>();

  for (const aDef of attributeDefs) {
    let attr = await attrDefRepo.findOne({ where: { tenantId, key: aDef.key } });
    if (!attr) {
      attr = attrDefRepo.create({
        name: aDef.name,
        slug: aDef.slug,
        key: aDef.key,
        type: aDef.type,
        description: aDef.description,
        isVariantOption: aDef.isVariantOption,
        isFilterable: aDef.isFilterable,
        tenantId,
      });
      await attrDefRepo.save(attr);
    }
    attrMap.set(aDef.key, attr);

    if (aDef.options && aDef.options.length > 0) {
      const optMap = new Map<string, AttributeOptionEntity>();
      for (let idx = 0; idx < aDef.options.length; idx++) {
        const oDef = aDef.options[idx];
        let opt = await attrOptRepo.findOne({ where: { tenantId, attributeId: attr.id, value: oDef.value } });
        if (!opt) {
          opt = attrOptRepo.create({
            label: oDef.label,
            value: oDef.value,
            sortOrder: idx,
            attributeId: attr.id,
            tenantId,
          });
          await attrOptRepo.save(opt);
        }
        optMap.set(oDef.value, opt);
      }
      attrOptMap.set(aDef.key, optMap);
    }
  }

  // 9. Assign Attributes to Categories
  const mensFashionCat = categoryMap.get('mens-fashion');
  if (mensFashionCat) {
    for (const key of ['color', 'size', 'fabric_material']) {
      const a = attrMap.get(key);
      if (a) {
        let catAttr = await catAttrRepo.findOne({ where: { tenantId, categoryId: mensFashionCat.id, attributeId: a.id } });
        if (!catAttr) {
          catAttr = catAttrRepo.create({ categoryId: mensFashionCat.id, attributeId: a.id, tenantId });
          await catAttrRepo.save(catAttr);
        }
      }
    }
  }

  const electronicsCat = categoryMap.get('electronics');
  if (electronicsCat) {
    for (const key of ['color', 'storage_capacity', 'warranty_period']) {
      const a = attrMap.get(key);
      if (a) {
        let catAttr = await catAttrRepo.findOne({ where: { tenantId, categoryId: electronicsCat.id, attributeId: a.id } });
        if (!catAttr) {
          catAttr = catAttrRepo.create({ categoryId: electronicsCat.id, attributeId: a.id, tenantId });
          await catAttrRepo.save(catAttr);
        }
      }
    }
  }

  // 10. Seed Rich Products (Physical, Digital, Service, Active, Draft, Archived)
  console.log('📦 Seeding Products with Rich Chunks 1-13 Configurations...');

  interface SeedProductDef {
    name: string;
    slug: string;
    description: string;
    productType: ProductType;
    status: ProductStatus;
    basePrice: number;
    compareAtPrice?: number;
    costPrice?: number;
    taxRate?: number;
    taxCategory?: TaxCategory;
    isTaxInclusive?: boolean;
    discountType?: ProductDiscountType;
    discountValue?: number;
    sku?: string;
    barcode?: string;
    trackInventory?: boolean;
    stock: number;
    reorderPoint?: number;
    catSlug: string;
    brandSlug?: string;
    collectionSlugs?: string[];
    shippingProfileName?: string;
    shippingRequired?: boolean;
    weight?: number;
    weightUnit?: WeightUnit;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: DimensionUnit;
    isFragile?: boolean;
    // Digital
    digitalDeliveryType?: DigitalDeliveryType;
    digitalAssetUrl?: string;
    downloadLimit?: number;
    downloadExpiryDays?: number;
    // Service
    serviceDeliveryType?: ServiceDeliveryType;
    serviceDuration?: number;
    serviceDurationUnit?: ServiceDurationUnit;
    // SEO
    seoTitle?: string;
    metaDescription?: string;
    // Attributes
    attributeValues?: { key: string; value: string }[];
    // Variants (multi-dimension)
    variants?: {
      title: string;
      sku: string;
      price: number;
      compareAtPrice?: number;
      stock: number;
      options: { key: string; value: string }[];
    }[];
    // Image URLs
    images?: { url: string; altText: string; isPrimary: boolean }[];
  }

  const standardShipping = shippingProfileMap.get('Standard Courier Delivery');
  const heavyShipping = shippingProfileMap.get('Heavy & Bulky Freight');
  const fragileShipping = shippingProfileMap.get('Fragile / Express Care');

  const richProductDefs: SeedProductDef[] = [
    // --- 1. MEN'S FASHION (PHYSICAL WITH MULTI-OPTION VARIANTS) ---
    {
      name: 'Premium Cotton Panjabi',
      slug: 'premium-cotton-panjabi',
      description: 'Crafted from 100% fine combed cotton with subtle tone-on-tone embroidery. Perfect for Jummah, Eid, and formal gatherings in Bangladesh.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2450,
      compareAtPrice: 2990,
      costPrice: 1500,
      taxRate: 5,
      taxCategory: TaxCategory.STANDARD_VAT,
      discountType: ProductDiscountType.PERCENTAGE,
      discountValue: 10,
      sku: 'PANJ-001',
      stock: 45,
      catSlug: 'mens-fashion',
      brandSlug: 'urbanedge',
      collectionSlugs: ['new-arrivals', 'summer-collection'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.45,
      weightUnit: WeightUnit.KG,
      length: 30,
      width: 25,
      height: 3,
      dimensionUnit: DimensionUnit.CM,
      seoTitle: 'Premium Cotton Panjabi for Men | UrbanEdge Bangladesh',
      metaDescription: 'Shop 100% authentic combed cotton Panjabi online in Bangladesh. Fast home delivery in Dhaka, Chittagong and all divisions with COD.',
      attributeValues: [{ key: 'fabric_material', value: '100% Combed Cotton' }],
      variants: [
        { title: 'Navy Blue / M', sku: 'PANJ-NVY-M', price: 2450, compareAtPrice: 2990, stock: 15, options: [{ key: 'color', value: 'navy-blue' }, { key: 'size', value: 'M' }] },
        { title: 'Navy Blue / L', sku: 'PANJ-NVY-L', price: 2450, compareAtPrice: 2990, stock: 18, options: [{ key: 'color', value: 'navy-blue' }, { key: 'size', value: 'L' }] },
        { title: 'Pure White / M', sku: 'PANJ-WHT-M', price: 2450, compareAtPrice: 2990, stock: 8, options: [{ key: 'color', value: 'pure-white' }, { key: 'size', value: 'M' }] },
        { title: 'Pure White / L', sku: 'PANJ-WHT-L', price: 2450, compareAtPrice: 2990, stock: 4, options: [{ key: 'color', value: 'pure-white' }, { key: 'size', value: 'L' }] },
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80', altText: 'Premium Cotton Panjabi Front View', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80', altText: 'Premium Cotton Panjabi Fabric Detail', isPrimary: false },
      ],
    },
    {
      name: 'Casual Black Heavyweight T-Shirt',
      slug: 'casual-black-tshirt',
      description: '220 GSM heavyweight organic cotton t-shirt. Pre-shrunk, breathable, with seamless ribbed collar.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 750,
      compareAtPrice: 950,
      costPrice: 400,
      taxRate: 5,
      taxCategory: TaxCategory.STANDARD_VAT,
      sku: 'TSHIRT-001',
      stock: 65,
      catSlug: 'mens-fashion',
      brandSlug: 'urbanedge',
      collectionSlugs: ['best-sellers', 'summer-collection'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.25,
      weightUnit: WeightUnit.KG,
      seoTitle: 'Heavyweight Black T-Shirt 220 GSM | UrbanEdge',
      metaDescription: 'Durable and ultra-comfortable 220 GSM black cotton t-shirt for daily streetwear in Bangladesh.',
      attributeValues: [{ key: 'fabric_material', value: '220 GSM Organic Cotton' }],
      variants: [
        { title: 'Black / M', sku: 'TS-BLK-M', price: 750, compareAtPrice: 950, stock: 25, options: [{ key: 'color', value: 'midnight-black' }, { key: 'size', value: 'M' }] },
        { title: 'Black / L', sku: 'TS-BLK-L', price: 750, compareAtPrice: 950, stock: 20, options: [{ key: 'color', value: 'midnight-black' }, { key: 'size', value: 'L' }] },
        { title: 'Black / XL', sku: 'TS-BLK-XL', price: 750, compareAtPrice: 950, stock: 20, options: [{ key: 'color', value: 'midnight-black' }, { key: 'size', value: 'XL' }] },
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', altText: 'Casual Black T-Shirt', isPrimary: true },
      ],
    },
    {
      name: 'Slim Fit Denim Jeans',
      slug: 'slim-fit-denim-jeans',
      description: '12.5 oz premium stretch denim with authentic stone wash finish. Features reinforced stitching and durable YKK brass zipper.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2200,
      compareAtPrice: 2600,
      costPrice: 1300,
      sku: 'JEANS-001',
      stock: 30,
      catSlug: 'mens-fashion',
      brandSlug: 'nova',
      collectionSlugs: ['best-sellers'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.65,
      weightUnit: WeightUnit.KG,
      variants: [
        { title: 'Navy Blue / 32', sku: 'JN-NVY-32', price: 2200, compareAtPrice: 2600, stock: 12, options: [{ key: 'color', value: 'navy-blue' }, { key: 'size', value: 'M' }] },
        { title: 'Navy Blue / 34', sku: 'JN-NVY-34', price: 2200, compareAtPrice: 2600, stock: 18, options: [{ key: 'color', value: 'navy-blue' }, { key: 'size', value: 'L' }] },
      ],
    },
    {
      name: 'Classic Formal White Shirt',
      slug: 'classic-formal-white-shirt',
      description: 'Wrinkle-resistant Egyptian giza cotton tailored formal shirt. Double-fused collar and French placket.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1650,
      compareAtPrice: 1950,
      costPrice: 950,
      sku: 'SHIRT-001',
      stock: 15,
      catSlug: 'mens-fashion',
      brandSlug: 'nova',
      collectionSlugs: ['office-essentials'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.3,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Premium Navy Polo Shirt',
      slug: 'premium-navy-polo-shirt',
      description: 'Mercerized pique cotton polo shirt with mother-of-pearl buttons and contrast collar tip.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1250,
      compareAtPrice: 1500,
      costPrice: 700,
      sku: 'POLO-001',
      stock: 50,
      catSlug: 'mens-fashion',
      brandSlug: 'urbanedge',
      collectionSlugs: ['summer-collection'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.28,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Embroidered Silk Kabli Set',
      slug: 'embroidered-silk-kabli-set',
      description: 'Raw silk festive kabli suit with hand zardosi needlework on collar and cuffs. Includes matching salwar.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 3250,
      compareAtPrice: 3800,
      costPrice: 2000,
      sku: 'KABLI-001',
      stock: 0, // OUT OF STOCK scenario
      catSlug: 'mens-fashion',
      brandSlug: 'artisancraft',
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 0.7,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Oversized Heavyweight Hoodie',
      slug: 'oversized-heavyweight-hoodie',
      description: '380 GSM brushed fleece cotton hoodie with fleece-lined double hood and kangaroo pocket.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1950,
      compareAtPrice: 2400,
      costPrice: 1100,
      sku: 'HOOD-001',
      stock: 5, // LOW STOCK scenario
      catSlug: 'mens-fashion',
      brandSlug: 'urbanedge',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.8,
      weightUnit: WeightUnit.KG,
    },

    // --- 2. ELECTRONICS (PHYSICAL GADGETS) ---
    {
      name: 'TWS Wireless Earbuds Pro',
      slug: 'tws-wireless-earbuds-pro',
      description: 'Active Noise Cancellation (ANC) with transparency mode, 32-hour battery life with Qi wireless charging case, and IPX5 water resistance.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2950,
      compareAtPrice: 3600,
      costPrice: 1800,
      taxRate: 5,
      taxCategory: TaxCategory.STANDARD_VAT,
      sku: 'EARB-001',
      stock: 25,
      catSlug: 'electronics',
      brandSlug: 'techcore',
      collectionSlugs: ['best-sellers', 'office-essentials'],
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 0.15,
      weightUnit: WeightUnit.KG,
      seoTitle: 'TWS Wireless Earbuds Pro ANC | TechCore Bangladesh',
      metaDescription: 'Best budget ANC wireless earbuds in BD with 32h playback and crystal clear mic for calls. Official warranty included.',
      attributeValues: [{ key: 'warranty_period', value: '1y' }],
      variants: [
        { title: 'Midnight Black', sku: 'EARB-BLK', price: 2950, compareAtPrice: 3600, stock: 15, options: [{ key: 'color', value: 'midnight-black' }] },
        { title: 'Pure White', sku: 'EARB-WHT', price: 2950, compareAtPrice: 3600, stock: 10, options: [{ key: 'color', value: 'pure-white' }] },
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', altText: 'TWS Wireless Earbuds Pro', isPrimary: true },
      ],
    },
    {
      name: 'ANC Noise Cancelling Headphones',
      slug: 'anc-noise-cancelling-headphones',
      description: 'Over-ear studio sound headphones with hybrid 4-microphone ANC, 40mm titanium dynamic drivers, and 50 hours playtime.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 4950,
      compareAtPrice: 5800,
      costPrice: 3200,
      taxRate: 5,
      taxCategory: TaxCategory.STANDARD_VAT,
      sku: 'HEAD-001',
      stock: 10,
      catSlug: 'electronics',
      brandSlug: 'techcore',
      collectionSlugs: ['new-arrivals', 'office-essentials'],
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 0.38,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Waterproof Smart Watch V8',
      slug: 'waterproof-smart-watch-v8',
      description: '1.43-inch AMOLED Always-On display, SpO2 blood oxygen tracking, 100+ workout modes, and Bluetooth phone calling.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 3450,
      compareAtPrice: 4200,
      costPrice: 2100,
      sku: 'WATCH-001',
      stock: 12,
      catSlug: 'electronics',
      brandSlug: 'techcore',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.12,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Portable Bluetooth Speaker',
      slug: 'portable-bluetooth-speaker',
      description: '16W punchy bass stereo sound with dual passive radiators, IPX7 submersible waterproof housing, and 12-hour battery.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1850,
      compareAtPrice: 2300,
      costPrice: 1100,
      sku: 'SPK-001',
      stock: 40,
      catSlug: 'electronics',
      brandSlug: 'techcore',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.55,
      weightUnit: WeightUnit.KG,
    },
    {
      name: '20000mAh 22.5W Fast Power Bank',
      slug: '20000mah-fast-power-bank',
      description: 'Dual USB-A and PD 20W Type-C bi-directional fast charging with intelligent LED power percentage display.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2150,
      compareAtPrice: 2700,
      costPrice: 1250,
      sku: 'PBANK-001',
      stock: 4, // LOW STOCK
      catSlug: 'electronics',
      brandSlug: 'techcore',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.42,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'HD Indoor CCTV Camera 360',
      slug: 'hd-indoor-cctv-camera-360',
      description: '2K 3MP pan/tilt smart home security camera with AI motion detection, two-way audio talk, and night vision.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 3850,
      compareAtPrice: 4500,
      costPrice: 2400,
      sku: 'CCTV-001',
      stock: 0, // OUT OF STOCK
      catSlug: 'electronics',
      brandSlug: 'techcore',
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 0.35,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Smart Body Fat Analyzer Scale',
      slug: 'smart-body-fat-analyzer-scale',
      description: 'High-precision BIA bioimpedance scale calculating 13 body metrics with Bluetooth sync to iOS & Android fitness apps.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2250,
      compareAtPrice: 2800,
      costPrice: 1350,
      sku: 'SCALE-001',
      stock: 19,
      catSlug: 'electronics',
      brandSlug: 'techcore',
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 1.2,
      weightUnit: WeightUnit.KG,
    },

    // --- 3. ACCESSORIES ---
    {
      name: 'Genuine Leather Bifold Wallet',
      slug: 'genuine-leather-wallet',
      description: 'Handcrafted from vegetable-tanned cowhide leather. 8 card slots, 2 cash compartments, and RFID blocking lining.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1200,
      compareAtPrice: 1600,
      costPrice: 650,
      sku: 'WALL-001',
      stock: 2, // LOW STOCK
      catSlug: 'accessories',
      brandSlug: 'artisancraft',
      collectionSlugs: ['best-sellers'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.12,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Executive Black Leather Belt',
      slug: 'executive-black-leather-belt',
      description: 'Full-grain 35mm wide black leather formal belt with automatic ratchet alloy buckle.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 950,
      compareAtPrice: 1300,
      costPrice: 500,
      sku: 'BELT-001',
      stock: 35,
      catSlug: 'accessories',
      brandSlug: 'artisancraft',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.22,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'UV400 Polarized Sunglasses',
      slug: 'uv-protection-sunglasses',
      description: 'Lightweight TR90 matte frame with TAC polarized UV400 anti-glare scratch resistant lenses.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1450,
      compareAtPrice: 1900,
      costPrice: 800,
      sku: 'SUN-001',
      stock: 28,
      catSlug: 'accessories',
      brandSlug: 'nova',
      collectionSlugs: ['summer-collection'],
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 0.08,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Waterproof Travel Laptop Backpack',
      slug: 'waterproof-travel-laptop-backpack',
      description: 'Ergonomic multi-compartment travel backpack with padded sleeve for up to 16-inch laptops and built-in USB charging port.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2650,
      compareAtPrice: 3200,
      costPrice: 1600,
      sku: 'PACK-001',
      stock: 18,
      catSlug: 'accessories',
      brandSlug: 'nova',
      collectionSlugs: ['office-essentials'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.95,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Slim Leather Card Holder',
      slug: 'slim-leather-card-holder',
      description: 'Ultra-minimalist front pocket leather card wallet holding up to 6 cards and folded cash notes.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 650,
      compareAtPrice: 900,
      costPrice: 300,
      sku: 'CARD-001',
      stock: 80,
      catSlug: 'accessories',
      brandSlug: 'artisancraft',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.05,
      weightUnit: WeightUnit.KG,
    },
    {
      name: "Men's Casual Brown Loafers",
      slug: 'mens-casual-brown-loafers',
      description: 'Soft suede leather slip-on driving shoes with non-slip rubber grip sole and cushioned memory foam insole.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2850,
      compareAtPrice: 3400,
      costPrice: 1700,
      sku: 'SHOE-001',
      stock: 11,
      catSlug: 'accessories',
      brandSlug: 'artisancraft',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.85,
      weightUnit: WeightUnit.KG,
    },

    // --- 4. HOME & LIFESTYLE ---
    {
      name: 'Modern Touch LED Table Lamp',
      slug: 'modern-touch-led-table-lamp',
      description: 'Dimmable 3-color temperature eye-care desk lamp with flexible silicone gooseneck and phone holder base.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1750,
      compareAtPrice: 2200,
      costPrice: 950,
      sku: 'LAMP-001',
      stock: 22,
      catSlug: 'home-lifestyle',
      brandSlug: 'homenest',
      collectionSlugs: ['office-essentials'],
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 0.65,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Insulated Stainless Steel Water Bottle',
      slug: 'insulated-stainless-steel-water-bottle',
      description: '750ml double-wall vacuum insulated 304 food-grade stainless steel bottle. Keeps drinks cold for 24h or hot for 12h.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 850,
      compareAtPrice: 1100,
      costPrice: 450,
      sku: 'BOT-001',
      stock: 60,
      catSlug: 'home-lifestyle',
      brandSlug: 'homenest',
      collectionSlugs: ['summer-collection'],
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.38,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Modular Kitchen Countertop Organizer',
      slug: 'modular-kitchen-countertop-organizer',
      description: '2-tier expandable stainless steel spice and condiment rack with rust-proof powder coating.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 2350,
      compareAtPrice: 2900,
      costPrice: 1400,
      sku: 'KITCH-001',
      stock: 14,
      catSlug: 'home-lifestyle',
      brandSlug: 'homenest',
      shippingProfileName: 'Heavy & Bulky Freight',
      shippingRequired: true,
      weight: 2.4,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Minimalist Nordic Wall Clock',
      slug: 'minimalist-nordic-wall-clock',
      description: '12-inch silent sweep quartz movement clock with natural wooden frame and 3D embossed numerals.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1150,
      compareAtPrice: 1500,
      costPrice: 600,
      sku: 'CLOCK-001',
      stock: 25,
      catSlug: 'home-lifestyle',
      brandSlug: 'homenest',
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 0.75,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Cordless Electric Glass Kettle 1.8L',
      slug: 'cordless-electric-glass-kettle',
      description: '1500W fast-boil borosilicate glass electric kettle with blue LED illumination and auto shut-off protection.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 1650,
      compareAtPrice: 2100,
      costPrice: 950,
      sku: 'KET-001',
      stock: 30,
      catSlug: 'home-lifestyle',
      brandSlug: 'homenest',
      shippingProfileName: 'Fragile / Express Care',
      shippingRequired: true,
      isFragile: true,
      weight: 1.1,
      weightUnit: WeightUnit.KG,
    },

    // --- 5. DIGITAL PRODUCTS (CHUNK 10 CONFIGURATION) ---
    {
      name: 'E-commerce Business Invoice & Accounting Template Pack',
      slug: 'ecommerce-invoice-template-pack',
      description: 'Complete MS Excel & Google Sheets automated VAT-compliant invoice generator tailored for Bangladeshi online merchants and f-commerce stores.',
      productType: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      basePrice: 450,
      compareAtPrice: 850,
      costPrice: 50,
      taxRate: 0,
      taxCategory: TaxCategory.EXEMPT,
      sku: 'DIGI-INV-001',
      trackInventory: false,
      stock: 9999,
      catSlug: 'digital-services',
      brandSlug: 'techcore',
      collectionSlugs: ['digital-products'],
      shippingRequired: false,
      digitalDeliveryType: DigitalDeliveryType.DOWNLOAD,
      digitalAssetUrl: 'https://cdn.easycommerce.app/assets/demo/invoice-template-v2.zip',
      downloadLimit: 10,
      downloadExpiryDays: 365,
      seoTitle: 'EasyCommerce Invoice & Accounting Template Pack BD',
      metaDescription: 'Download instant automated Excel VAT invoice templates for online shop billing and expense management.',
    },
    {
      name: 'Social Media Brand Kit (100+ Canva Templates)',
      slug: 'social-media-brand-kit-canva',
      description: 'High-converting Facebook and Instagram banner templates for seasonal sales, Eid discounts, product showcase, and story updates in Canva.',
      productType: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      basePrice: 990,
      compareAtPrice: 1500,
      costPrice: 100,
      taxRate: 0,
      taxCategory: TaxCategory.EXEMPT,
      sku: 'DIGI-CANVA-001',
      trackInventory: false,
      stock: 9999,
      catSlug: 'digital-services',
      brandSlug: 'techcore',
      collectionSlugs: ['digital-products'],
      shippingRequired: false,
      digitalDeliveryType: DigitalDeliveryType.ACCESS_LINK,
      digitalAssetUrl: 'https://templates.easycommerce.app/canva/sm-brandkit-pack',
      downloadExpiryDays: 180,
    },
    {
      name: 'Bangla Professional CV & Resume Template Collection',
      slug: 'bangla-professional-cv-resume-pack',
      description: '15 ATS-optimized Word and PDF resume templates customized for corporate, IT, bank, and NGO job applicants in Bangladesh.',
      productType: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      basePrice: 350,
      compareAtPrice: 600,
      costPrice: 30,
      sku: 'DIGI-CV-001',
      trackInventory: false,
      stock: 9999,
      catSlug: 'digital-services',
      brandSlug: 'nova',
      collectionSlugs: ['digital-products'],
      shippingRequired: false,
      digitalDeliveryType: DigitalDeliveryType.DOWNLOAD,
      digitalAssetUrl: 'https://cdn.easycommerce.app/assets/demo/bangla-cv-pack.zip',
      downloadLimit: 5,
      downloadExpiryDays: 90,
    },

    // --- 6. SERVICE PRODUCTS (CHUNK 10 CONFIGURATION) ---
    {
      name: 'Professional E-Commerce Product Photography & Retouching',
      slug: 'professional-ecommerce-photography-service',
      description: 'Studio product photography on pure white background with professional color grading, shadow creation, and crop for 5 items.',
      productType: ProductType.SERVICE,
      status: ProductStatus.ACTIVE,
      basePrice: 2500,
      compareAtPrice: 3500,
      costPrice: 800,
      taxRate: 15,
      taxCategory: TaxCategory.STANDARD_VAT,
      sku: 'SRV-PHOTO-001',
      trackInventory: false,
      stock: 50,
      catSlug: 'digital-services',
      brandSlug: 'pureglow',
      shippingRequired: false,
      serviceDeliveryType: ServiceDeliveryType.ONLINE,
      serviceDuration: 48,
      serviceDurationUnit: ServiceDurationUnit.HOURS,
      seoTitle: 'Commercial Product Photography & Image Editing Service Dhaka',
      metaDescription: 'High quality studio photography service for online stores. White background, PNG transparent cutouts and high-res delivery in 48 hours.',
    },
    {
      name: 'Home AC Inspection & Deep Jet Cleaning Service',
      slug: 'home-ac-inspection-cleaning-service',
      description: 'Certified HVAC technician on-site chemical jet wash, gas pressure check, blower wheel cleaning, and performance check for 1-2 Ton split AC.',
      productType: ProductType.SERVICE,
      status: ProductStatus.ACTIVE,
      basePrice: 1200,
      compareAtPrice: 1600,
      costPrice: 500,
      taxRate: 5,
      taxCategory: TaxCategory.STANDARD_VAT,
      sku: 'SRV-AC-001',
      trackInventory: false,
      stock: 100,
      catSlug: 'home-lifestyle',
      brandSlug: 'homenest',
      shippingRequired: false,
      serviceDeliveryType: ServiceDeliveryType.ONSITE,
      serviceDuration: 90,
      serviceDurationUnit: ServiceDurationUnit.MINUTES,
    },

    // --- 7. DRAFT PRODUCTS (NOT YET PUBLISHED) ---
    {
      name: 'Magnetic Wireless Car Mount Fast Charger (15W)',
      slug: 'magnetic-wireless-car-mount-charger',
      description: 'Upcoming Qi2 certified 15W auto-clamping magnetic car air vent wireless charging mount with ambient indicator ring.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.DRAFT,
      basePrice: 1890,
      compareAtPrice: 2400,
      costPrice: 1100,
      sku: 'CAR-CHG-DRAFT',
      stock: 0,
      catSlug: 'electronics',
      brandSlug: 'techcore',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 0.25,
      weightUnit: WeightUnit.KG,
    },
    {
      name: 'Handcrafted Top-Grain Leather Duffle Bag',
      slug: 'handcrafted-leather-duffle-bag',
      description: 'Heritage series vintage brown leather weekend travel bag with solid antique brass hardware and reinforced shoulder strap.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.DRAFT,
      basePrice: 6500,
      compareAtPrice: 7800,
      costPrice: 4200,
      sku: 'DUFFLE-DRAFT',
      stock: 5,
      catSlug: 'accessories',
      brandSlug: 'artisancraft',
      shippingProfileName: 'Standard Courier Delivery',
      shippingRequired: true,
      weight: 1.85,
      weightUnit: WeightUnit.KG,
    },

    // --- 8. ARCHIVED PRODUCT (DISCONTINUED) ---
    {
      name: 'Legacy iPhone 11 Shockproof Silicone Case',
      slug: 'legacy-iphone-11-silicone-case',
      description: 'Discontinued classic liquid silicone protective phone cover with soft microfiber inner lining.',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.ARCHIVED,
      basePrice: 450,
      compareAtPrice: 700,
      costPrice: 180,
      sku: 'CASE-IP11-ARCH',
      stock: 0,
      catSlug: 'accessories',
      brandSlug: 'techcore',
      shippingRequired: true,
      weight: 0.06,
      weightUnit: WeightUnit.KG,
    },
  ];

  const seededProductEntities: ProductEntity[] = [];
  const productBySlugMap = new Map<string, ProductEntity>();

  for (const pDef of richProductDefs) {
    let product = await productRepo.findOne({ where: { tenantId, slug: pDef.slug } });
    const category = categoryMap.get(pDef.catSlug);
    const brand = pDef.brandSlug ? brandMap.get(pDef.brandSlug) : undefined;
    const shippingProf = pDef.shippingProfileName ? shippingProfileMap.get(pDef.shippingProfileName) : standardShipping;

    const collectionsToAssign: CollectionEntity[] = [];
    if (pDef.collectionSlugs && pDef.collectionSlugs.length > 0) {
      for (const colSlug of pDef.collectionSlugs) {
        const c = collectionMap.get(colSlug);
        if (c) collectionsToAssign.push(c);
      }
    }

    if (!product) {
      product = productRepo.create({
        name: pDef.name,
        slug: pDef.slug,
        description: pDef.description,
        productType: pDef.productType,
        status: pDef.status,
        basePrice: pDef.basePrice,
        compareAtPrice: pDef.compareAtPrice,
        costPrice: pDef.costPrice,
        taxRate: pDef.taxRate || 0,
        taxCategory: pDef.taxCategory || TaxCategory.STANDARD_VAT,
        isTaxInclusive: pDef.isTaxInclusive || false,
        discountType: pDef.discountType || ProductDiscountType.NONE,
        discountValue: pDef.discountValue || 0,
        sku: pDef.sku,
        barcode: pDef.barcode,
        trackInventory: pDef.trackInventory !== false,
        lowStockThreshold: pDef.reorderPoint || 5,
        isPublished: pDef.status === ProductStatus.ACTIVE,
        categoryId: category?.id,
        brandId: brand?.id,
        shippingProfileId: shippingProf?.id,
        shippingRequired: pDef.shippingRequired !== false,
        weight: pDef.weight,
        weightUnit: pDef.weightUnit || WeightUnit.KG,
        length: pDef.length,
        width: pDef.width,
        height: pDef.height,
        dimensionUnit: pDef.dimensionUnit || DimensionUnit.CM,
        isFragile: pDef.isFragile || false,
        digitalDeliveryType: pDef.digitalDeliveryType,
        digitalAssetUrl: pDef.digitalAssetUrl,
        downloadLimit: pDef.downloadLimit,
        downloadExpiryDays: pDef.downloadExpiryDays,
        serviceDeliveryType: pDef.serviceDeliveryType,
        serviceDuration: pDef.serviceDuration,
        serviceDurationUnit: pDef.serviceDurationUnit,
        seoTitle: pDef.seoTitle,
        metaDescription: pDef.metaDescription,
        canonicalUrl: pDef.seoTitle ? `https://mydiagnostic.easycommerce.app/products/${pDef.slug}` : undefined,
        isSearchEngineIndexed: true,
        tenantId,
      });
      await productRepo.save(product);
    } else {
      // Update with latest enriched fields
      product.name = pDef.name;
      product.description = pDef.description;
      product.productType = pDef.productType;
      product.status = pDef.status;
      product.basePrice = pDef.basePrice;
      product.compareAtPrice = pDef.compareAtPrice;
      product.costPrice = pDef.costPrice;
      product.taxRate = pDef.taxRate || 0;
      product.taxCategory = pDef.taxCategory || TaxCategory.STANDARD_VAT;
      product.discountType = pDef.discountType || ProductDiscountType.NONE;
      product.discountValue = pDef.discountValue || 0;
      product.sku = pDef.sku;
      product.trackInventory = pDef.trackInventory !== false;
      product.isPublished = pDef.status === ProductStatus.ACTIVE;
      product.categoryId = category?.id;
      product.brandId = brand?.id;
      product.shippingProfileId = shippingProf?.id;
      product.shippingRequired = pDef.shippingRequired !== false;
      product.weight = pDef.weight;
      product.digitalDeliveryType = pDef.digitalDeliveryType;
      product.digitalAssetUrl = pDef.digitalAssetUrl;
      product.downloadLimit = pDef.downloadLimit;
      product.downloadExpiryDays = pDef.downloadExpiryDays;
      product.serviceDeliveryType = pDef.serviceDeliveryType;
      product.serviceDuration = pDef.serviceDuration;
      product.serviceDurationUnit = pDef.serviceDurationUnit;
      product.seoTitle = pDef.seoTitle;
      product.metaDescription = pDef.metaDescription;
      await productRepo.save(product);
    }

    productBySlugMap.set(product.slug, product);
    seededProductEntities.push(product);

    // Save Collections join if defined
    if (collectionsToAssign.length > 0) {
      product.collections = collectionsToAssign;
      await productRepo.save(product);
    }

    // Save Product Attribute Values
    if (pDef.attributeValues && pDef.attributeValues.length > 0) {
      for (const av of pDef.attributeValues) {
        const attr = attrMap.get(av.key);
        if (attr) {
          let pav = await prodAttrValRepo.findOne({ where: { tenantId, productId: product.id, attributeId: attr.id } });
          if (!pav) {
            pav = prodAttrValRepo.create({
              productId: product.id,
              attributeId: attr.id,
              value: av.value,
              tenantId,
            });
            await prodAttrValRepo.save(pav);
          }
        }
      }
    }

    // Save Product Images
    if (pDef.images && pDef.images.length > 0) {
      for (let imgIdx = 0; imgIdx < pDef.images.length; imgIdx++) {
        const imgDef = pDef.images[imgIdx];
        let pImg = await imageRepo.findOne({ where: { tenantId, productId: product.id, url: imgDef.url } });
        if (!pImg) {
          pImg = imageRepo.create({
            productId: product.id,
            url: imgDef.url,
            altText: imgDef.altText,
            isPrimary: imgDef.isPrimary,
            sortOrder: imgIdx,
            tenantId,
          });
          await imageRepo.save(pImg);
        }
      }
    }

    // Save Variants
    if (pDef.variants && pDef.variants.length > 0) {
      product.hasVariants = true;
      await productRepo.save(product);

      for (const vDef of pDef.variants) {
        let variant = await variantRepo.findOne({ where: { tenantId, productId: product.id, sku: vDef.sku } });
        
        // Build option metadata
        const optionMetas: VariantOptionMeta[] = [];
        for (const optDef of vDef.options) {
          const attr = attrMap.get(optDef.key);
          const optMap = attrOptMap.get(optDef.key);
          const optionEntity = optMap?.get(optDef.value);

          if (attr && optionEntity) {
            optionMetas.push({
              attributeId: attr.id,
              attributeName: attr.name,
              optionId: optionEntity.id,
              optionLabel: optionEntity.label,
              value: optionEntity.value,
            });
          }
        }

        const combinationKey = vDef.options.map((o) => `${o.key}:${o.value}`).join('|');

        if (!variant) {
          variant = variantRepo.create({
            title: vDef.title,
            sku: vDef.sku,
            price: vDef.price,
            compareAtPrice: vDef.compareAtPrice,
            productId: product.id,
            combinationKey,
            options: optionMetas,
            isEnabled: true,
            tenantId,
          });
          await variantRepo.save(variant);
        }

        // Create/update variant inventory stock
        let vStock = await stockRepo.findOne({ where: { tenantId, productId: product.id, variantId: variant.id } });
        if (!vStock) {
          vStock = stockRepo.create({
            productId: product.id,
            variantId: variant.id,
            warehouseId: warehouse.id,
            quantityOnHand: vDef.stock,
            quantityReserved: vDef.stock > 0 ? 1 : 0,
            reorderPoint: 5,
            tenantId,
          });
          await stockRepo.save(vStock);

          // Add Initial Inventory Movement
          const move = movementRepo.create({
            productId: product.id,
            inventoryStockId: vStock.id,
            type: MovementType.INITIAL_STOCK,
            quantity: vDef.stock,
            previousQuantity: 0,
            newQuantity: vDef.stock,
            reason: 'Initial Opening Stock Setup',
            createdBy: 'MD Belal Hossain',
            tenantId,
          });
          await movementRepo.save(move);
        }
      }
    } else {
      // Single default variant for simple products
      let defaultVariant = await variantRepo.findOne({ where: { tenantId, productId: product.id } });
      if (!defaultVariant) {
        defaultVariant = variantRepo.create({
          title: 'Default Variant',
          sku: pDef.sku || `${pDef.slug.toUpperCase().slice(0, 4)}-001`,
          price: pDef.basePrice,
          compareAtPrice: pDef.compareAtPrice,
          costPrice: pDef.costPrice,
          productId: product.id,
          options: [],
          isEnabled: true,
          tenantId,
        });
        await variantRepo.save(defaultVariant);
      }

      // Create stock
      let stock = await stockRepo.findOne({ where: { tenantId, productId: product.id, variantId: defaultVariant.id } });
      if (!stock) {
        stock = stockRepo.create({
          productId: product.id,
          variantId: defaultVariant.id,
          warehouseId: warehouse.id,
          quantityOnHand: pDef.stock,
          quantityReserved: pDef.stock > 0 ? 1 : 0,
          reorderPoint: pDef.reorderPoint || 5,
          tenantId,
        });
        await stockRepo.save(stock);

        // Add Initial Inventory Movement
        const move = movementRepo.create({
          productId: product.id,
          inventoryStockId: stock.id,
          type: MovementType.INITIAL_STOCK,
          quantity: pDef.stock,
          previousQuantity: 0,
          newQuantity: pDef.stock,
          reason: 'Initial Opening Inventory',
          createdBy: 'MD Belal Hossain',
          tenantId,
        });
        await movementRepo.save(move);

        // For low stock items, add an ADJUSTMENT movement
        if (pDef.stock > 0 && pDef.stock <= 5) {
          const adjMove = movementRepo.create({
            productId: product.id,
            inventoryStockId: stock.id,
            type: MovementType.ADJUSTMENT,
            quantity: -2,
            previousQuantity: pDef.stock + 2,
            newQuantity: pDef.stock,
            reason: 'Audit Adjustment: Damaged stock removed from shelf',
            createdBy: 'MD Belal Hossain',
            tenantId,
          });
          await movementRepo.save(adjMove);
        }
      }
    }
  }

  console.log(`✨ Seeded ${seededProductEntities.length} Products with Variants, Attributes, and Media.`);

  // 11. Seed Related Products (Cross-Selling Relations)
  console.log('🔗 Seeding Related Products & Cross-Selling Pairs...');
  const crossSellingPairs: [string, string][] = [
    ['premium-cotton-panjabi', 'classic-formal-white-shirt'],
    ['premium-cotton-panjabi', 'mens-casual-brown-loafers'],
    ['casual-black-tshirt', 'slim-fit-denim-jeans'],
    ['casual-black-tshirt', 'oversized-heavyweight-hoodie'],
    ['tws-wireless-earbuds-pro', 'anc-noise-cancelling-headphones'],
    ['tws-wireless-earbuds-pro', '20000mah-fast-power-bank'],
    ['genuine-leather-wallet', 'executive-black-leather-belt'],
    ['genuine-leather-wallet', 'slim-leather-card-holder'],
    ['modern-touch-led-table-lamp', 'minimalist-nordic-wall-clock'],
    ['ecommerce-invoice-template-pack', 'social-media-brand-kit-canva'],
  ];

  for (const [sourceSlug, targetSlug] of crossSellingPairs) {
    const sourceProd = productBySlugMap.get(sourceSlug);
    const targetProd = productBySlugMap.get(targetSlug);

    if (sourceProd && targetProd && sourceProd.id !== targetProd.id) {
      let rel = await relationRepo.findOne({
        where: { tenantId, productId: sourceProd.id, relatedProductId: targetProd.id },
      });
      if (!rel) {
        rel = relationRepo.create({
          productId: sourceProd.id,
          relatedProductId: targetProd.id,
          sortOrder: 0,
          tenantId,
        });
        await relationRepo.save(rel);
      }
    }
  }

  // 12. Check and Seed Orders for Real Analytics
  const existingOrderCount = await orderRepo.count({ where: { tenantId } });
  if (existingOrderCount >= 1000000) {
    console.log(`🛒 Store already has ${existingOrderCount} orders. Skipping order generation to preserve idempotency.`);
    await AppDataSource.destroy();
    return;
  }

  console.log(`🧹 Refreshing historical order data for tenant ${tenantId}...`);
  await AppDataSource.query(
    `DELETE FROM consignments WHERE "orderId" IN (SELECT id FROM orders WHERE "tenantId" = $1)`,
    [tenantId],
  );
  await AppDataSource.query(`DELETE FROM orders WHERE "tenantId" = $1`, [tenantId]);
  await AppDataSource.query(`DELETE FROM customers WHERE "tenantId" = $1`, [tenantId]);

  console.log('🛒 Generating 110 Realistic Historical Orders for Product Analytics across past 60 days...');

  // Realistic Bangladeshi Customers
  const rawCustomerList = [
    { name: 'Rahim Hossain', phone: '01711000111', city: 'Dhaka', address: 'House 12, Road 5, Dhanmondi' },
    { name: 'Karim Ahmed', phone: '01819000222', city: 'Dhaka', address: 'Plot 45, Sector 7, Uttara' },
    { name: 'Hasan Mahmud', phone: '01912000333', city: 'Chattogram', address: 'GEC Circle, Nasirabad' },
    { name: 'Mim Akter', phone: '01615000444', city: 'Dhaka', address: 'Mirpur 10 Block D' },
    { name: 'Nusrat Jahan', phone: '01517000555', city: 'Sylhet', address: 'Zindabazar Point' },
    { name: 'Tanvir Rahman', phone: '01314000666', city: 'Rajshahi', address: 'Kazla, Rajshahi University' },
    { name: 'Sabrina Islam', phone: '01718000777', city: 'Khulna', address: 'KDA Avenue, Royal Mode' },
    { name: 'Arif Chowdhury', phone: '01812000888', city: 'Dhaka', address: 'Gulshan 2, Road 54' },
    { name: 'Fatema Khatun', phone: '01915000999', city: 'Gazipur', address: 'Chowrashta, Joydebpur' },
    { name: 'Mahmudul Hasan', phone: '01619001000', city: 'Narayanganj', address: 'Chasara Bus Stand' },
    { name: 'Sultana Razia', phone: '01713001111', city: 'Dhaka', address: 'Mohakhali DOHS Road 3' },
    { name: 'Tariqul Islam', phone: '01814002222', city: 'Chattogram', address: 'Agrabad Commercial Area' },
    { name: 'Farhana Yeasmin', phone: '01916003333', city: 'Dhaka', address: 'Bashundhara R/A Block C' },
    { name: 'Shakib Al Hasan', phone: '01618004444', city: 'Dhaka', address: 'Banani Block E' },
    { name: 'Tamim Iqbal', phone: '01519005555', city: 'Chattogram', address: 'Kazir Dewri Road' },
  ];

  const seededCustomers: (CustomerEntity & { address: string; city: string; name: string })[] = [];
  for (const c of rawCustomerList) {
    const parts = c.name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'Customer';
    const email = `${c.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

    const cust = customerRepo.create({
      tenantId,
      storeId: store.id,
      firstName,
      lastName,
      email,
      phone: c.phone,
      status: CustomerStatusEnum.ACTIVE,
      source: CustomerSourceEnum.ONLINE_STORE,
    });
    const saved = await customerRepo.save(cust);
    seededCustomers.push(Object.assign(saved, { address: c.address, city: c.city, name: c.name }));
  }

  // Target 110 orders distribution:
  // DELIVERED: 55, SHIPPED: 16, PROCESSING: 11, CONFIRMED: 11, PENDING: 8, CANCELLED: 6, RETURNED: 3
  const statusPool: OrderStatusEnum[] = [
    ...Array(55).fill(OrderStatusEnum.DELIVERED),
    ...Array(16).fill(OrderStatusEnum.SHIPPED),
    ...Array(11).fill(OrderStatusEnum.PROCESSING),
    ...Array(11).fill(OrderStatusEnum.CONFIRMED),
    ...Array(8).fill(OrderStatusEnum.PENDING),
    ...Array(6).fill(OrderStatusEnum.CANCELLED),
    ...Array(3).fill(OrderStatusEnum.RETURNED),
  ];

  for (let i = statusPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusPool[i], statusPool[j]] = [statusPool[j], statusPool[i]];
  }

  const now = new Date();

  for (let i = 0; i < statusPool.length; i++) {
    const status = statusPool[i];
    const customer = seededCustomers[i % seededCustomers.length];

    // Distribute date randomly over last 60 days
    const daysAgo = Math.floor(Math.random() * 58);
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 1000000);

    // Pick 1 to 3 items from seeded active products
    const activeProducts = seededProductEntities.filter((p) => p.status === ProductStatus.ACTIVE);
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts: ProductEntity[] = [];
    for (let k = 0; k < numItems; k++) {
      const p = activeProducts[Math.floor(Math.random() * activeProducts.length)];
      if (!selectedProducts.find((x) => x.id === p.id)) {
        selectedProducts.push(p);
      }
    }

    let subtotal = 0;
    const orderItems: Partial<OrderItemEntity>[] = [];

    for (const prod of selectedProducts) {
      const qty = Math.floor(Math.random() * 2) + 1;
      const unitPrice = Number(prod.basePrice);
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;

      // Find variant ID if exists
      const variant = await variantRepo.findOne({ where: { tenantId, productId: prod.id } });

      orderItems.push({
        productId: prod.id,
        variantId: variant?.id,
        productTitle: prod.name,
        sku: prod.sku || `${prod.slug.toUpperCase().slice(0, 4)}-001`,
        unitPrice,
        quantity: qty,
        totalPrice,
        tenantId,
      });
    }

    const deliveryFee = customer.city === 'Dhaka' ? 60 : 120;
    const discountAmount = i % 5 === 0 ? 100 : 0;
    const grandTotal = subtotal + deliveryFee - discountAmount;

    // Payment details
    let paymentMethod: PaymentMethodEnum = PaymentMethodEnum.COD;
    if (i % 3 === 1) paymentMethod = PaymentMethodEnum.BKASH;
    if (i % 7 === 0) paymentMethod = PaymentMethodEnum.SSLCOMMERZ;

    let paymentStatus: PaymentStatusEnum = PaymentStatusEnum.UNPAID;

    if (paymentMethod === PaymentMethodEnum.COD) {
      if (status === OrderStatusEnum.DELIVERED || status === OrderStatusEnum.COMPLETED) {
        paymentStatus = i % 2 === 0 ? PaymentStatusEnum.COD_COLLECTED : PaymentStatusEnum.COD_PENDING;
      } else {
        paymentStatus = PaymentStatusEnum.COD_PENDING;
      }
    } else {
      if (
        status === OrderStatusEnum.DELIVERED ||
        status === OrderStatusEnum.SHIPPED ||
        status === OrderStatusEnum.COMPLETED ||
        status === OrderStatusEnum.PROCESSING
      ) {
        paymentStatus = PaymentStatusEnum.PAID;
      } else if (status === OrderStatusEnum.RETURNED || status === OrderStatusEnum.CANCELLED) {
        paymentStatus = PaymentStatusEnum.REFUNDED;
      } else if (i % 5 === 0) {
        paymentStatus = PaymentStatusEnum.FAILED;
      } else {
        paymentStatus = PaymentStatusEnum.UNPAID;
      }
    }

    const orderNumber = `ORD-${1000 + i + 1}`;

    const order = orderRepo.create({
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      shippingAddress: customer.address,
      city: customer.city,
      deliveryFee,
      subtotal,
      discountAmount,
      couponCode: discountAmount > 0 ? 'SAVE100' : undefined,
      grandTotal,
      paymentMethod,
      paymentStatus,
      orderStatus: status,
      storeSlug,
      tenantId,
      createdAt: orderDate,
      updatedAt: orderDate,
    });

    await orderRepo.save(order);

    // Save Order Items
    for (const itemData of orderItems) {
      const item = AppDataSource.getRepository(OrderItemEntity).create({
        ...itemData,
        orderId: order.id,
        createdAt: orderDate,
      });
      await AppDataSource.getRepository(OrderItemEntity).save(item);
    }

    // Save Payment record if paid
    if (paymentStatus === PaymentStatusEnum.PAID) {
      const payment = paymentRepo.create({
        orderId: order.id,
        orderNumber,
        tranId: `TRX-${Date.now()}-${i}`,
        amount: grandTotal,
        currency: 'BDT',
        cardType: paymentMethod,
        status: PaymentTransactionStatusEnum.COMPLETED,
        tenantId,
        createdAt: orderDate,
      });
      await paymentRepo.save(payment);
    }

    // Save Consignment record if Shipped/Delivered
    if (status === OrderStatusEnum.SHIPPED || status === OrderStatusEnum.DELIVERED) {
      const courierProvider = i % 2 === 0 ? CourierProviderEnum.STEADFAST : CourierProviderEnum.PATHAO;
      const consignment = consignmentRepo.create({
        trackingCode: `${courierProvider === CourierProviderEnum.STEADFAST ? 'SF' : 'PT'}${100000 + i}`,
        orderId: order.id,
        orderNumber,
        courierProvider,
        recipientName: customer.name,
        recipientPhone: customer.phone,
        recipientAddress: customer.address,
        city: customer.city,
        codAmount: paymentMethod === PaymentMethodEnum.COD ? grandTotal : 0,
        deliveryCharge: deliveryFee,
        status: status === OrderStatusEnum.DELIVERED ? ConsignmentStatusEnum.DELIVERED : ConsignmentStatusEnum.IN_TRANSIT,
        tenantId,
        createdAt: orderDate,
      });
      await consignmentRepo.save(consignment);
    }

    // Status history
    const initialHistory = statusHistoryRepo.create({
      orderId: order.id,
      previousStatus: undefined,
      newStatus: OrderStatusEnum.PENDING,
      changedBy: 'Customer',
      reason: 'Order placed online',
      tenantId,
      createdAt: orderDate,
    });
    await statusHistoryRepo.save(initialHistory);

    if (status !== OrderStatusEnum.PENDING) {
      const updateHistory = statusHistoryRepo.create({
        orderId: order.id,
        previousStatus: OrderStatusEnum.PENDING,
        newStatus: status,
        changedBy: 'MD Belal Hossain',
        reason: `Status updated to ${status} via merchant dashboard`,
        tenantId,
        createdAt: new Date(orderDate.getTime() + 3600000),
      });
      await statusHistoryRepo.save(updateHistory);
    }

    // Order notes
    if (i % 3 === 0) {
      const note = noteRepo.create({
        orderId: order.id,
        tenantId,
        content: `Customer requested delivery after 4 PM if possible. Phone: ${customer.phone}`,
        isCustomerVisible: false,
        createdBy: 'MD Belal Hossain',
        createdAt: new Date(orderDate.getTime() + 1800000),
      });
      await noteRepo.save(note);
    }

    // Save Returns for RETURNED status orders
    if (status === OrderStatusEnum.RETURNED) {
      const returnReq = returnRepo.create({
        returnNumber: `RET-${1000 + i}`,
        orderId: order.id,
        status: ReturnStatusEnum.ACCEPTED,
        reason: 'Size did not fit customer',
        note: 'Customer called and requested a return/exchange.',
        tenantId,
        requestedAt: new Date(orderDate.getTime() + 86400000 * 3),
      });
      await returnRepo.save(returnReq);

      if (orderItems.length > 0 && orderItems[0].id) {
        const returnItem = returnItemRepo.create({
          returnId: returnReq.id,
          orderItemId: orderItems[0].id,
          quantity: 1,
          restockDecision: true,
          tenantId,
        });
        await returnItemRepo.save(returnItem);
      }
    }
  }

  console.log('✨ Seeded 110 Orders with Items, Payments, Consignments, Notes, Status History, and Returns.');
  console.log('🎉 Full EasyCommerce Product Module Demo Data Seeding Completed Successfully!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
