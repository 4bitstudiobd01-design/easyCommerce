import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../data-source';
import { UserEntity, UserRoleEnum } from '../../modules/user/entities/user.entity';
import { TenantEntity } from '../../modules/tenant/entities/tenant.entity';
import { StoreEntity } from '../../modules/tenant/entities/store.entity';
import { CategoryEntity } from '../../modules/catalog/entities/category.entity';
import { ProductEntity } from '../../modules/catalog/entities/product.entity';
import { ProductVariantEntity } from '../../modules/catalog/entities/product-variant.entity';
import { WarehouseEntity } from '../../modules/inventory/entities/warehouse.entity';
import { InventoryStockEntity } from '../../modules/inventory/entities/inventory-stock.entity';
import { OrderEntity, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from '../../modules/order/entities/order.entity';
import { OrderItemEntity } from '../../modules/order/entities/order-item.entity';
import { ConsignmentEntity, CourierProviderEnum, ConsignmentStatusEnum } from '../../modules/logistics/entities/consignment.entity';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../../modules/payment/entities/payment.entity';
import { OrderStatusHistoryEntity } from '../../modules/order/entities/order-status-history.entity';
import { OrderNoteEntity } from '../../modules/order/entities/order-note.entity';
import { ReturnEntity, ReturnStatusEnum } from '../../modules/order/entities/return.entity';
import { ReturnItemEntity } from '../../modules/order/entities/return-item.entity';
import { RefundEntity, RefundStatusEnum } from '../../modules/payment/entities/refund.entity';

import * as bcrypt from 'bcrypt';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Demo seeder cannot run in production environment.');
    process.exit(1);
  }

  console.log('🌱 Starting EasyCommerce Demo Data Seeder...');
  await AppDataSource.initialize();
  console.log('✅ Database connected.');

  const userRepo = AppDataSource.getRepository(UserEntity);
  const tenantRepo = AppDataSource.getRepository(TenantEntity);
  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const productRepo = AppDataSource.getRepository(ProductEntity);
  const variantRepo = AppDataSource.getRepository(ProductVariantEntity);
  const warehouseRepo = AppDataSource.getRepository(WarehouseEntity);
  const stockRepo = AppDataSource.getRepository(InventoryStockEntity);
  const orderRepo = AppDataSource.getRepository(OrderEntity);
  const consignmentRepo = AppDataSource.getRepository(ConsignmentEntity);
  const paymentRepo = AppDataSource.getRepository(PaymentEntity);
  const statusHistoryRepo = AppDataSource.getRepository(OrderStatusHistoryEntity);
  const noteRepo = AppDataSource.getRepository(OrderNoteEntity);
  const returnRepo = AppDataSource.getRepository(ReturnEntity);
  const returnItemRepo = AppDataSource.getRepository(ReturnItemEntity);
  const refundRepo = AppDataSource.getRepository(RefundEntity);

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
    console.log('🏭 Creating Default Warehouse');
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

  // 4. Seed Categories
  const categoryDefs = [
    { title: "Men's Fashion", slug: 'mens-fashion' },
    { title: 'Electronics', slug: 'electronics' },
    { title: 'Accessories', slug: 'accessories' },
    { title: 'Home & Lifestyle', slug: 'home-lifestyle' },
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

  // 5. Seed Products & Inventory Stocks
  const productDefs = [
    // Men's Fashion
    { title: 'Premium Cotton Panjabi', slug: 'premium-cotton-panjabi', price: 2450, cost: 1500, compare: 2990, catSlug: 'mens-fashion', stock: 3, sku: 'PANJ-001' },
    { title: 'Classic Formal White Shirt', slug: 'classic-formal-white-shirt', price: 1650, cost: 950, compare: 1950, catSlug: 'mens-fashion', stock: 15, sku: 'SHIRT-001' },
    { title: 'Casual Black T-Shirt', slug: 'casual-black-tshirt', price: 750, cost: 400, compare: 950, catSlug: 'mens-fashion', stock: 45, sku: 'TSHIRT-001' },
    { title: 'Slim Fit Denim Jeans', slug: 'slim-fit-denim-jeans', price: 2200, cost: 1300, compare: 2600, catSlug: 'mens-fashion', stock: 30, sku: 'JEANS-001' },
    { title: 'Premium Navy Polo Shirt', slug: 'premium-navy-polo-shirt', price: 1250, cost: 700, compare: 1500, catSlug: 'mens-fashion', stock: 50, sku: 'POLO-001' },
    { title: 'Embroidered Silk Kabli Set', slug: 'embroidered-silk-kabli-set', price: 3250, cost: 2000, compare: 3800, catSlug: 'mens-fashion', stock: 0, sku: 'KABLI-001' },
    { title: 'Oversized Heavyweight Hoodie', slug: 'oversized-heavyweight-hoodie', price: 1950, cost: 1100, compare: 2400, catSlug: 'mens-fashion', stock: 5, sku: 'HOOD-001' },
    { title: "Men's Casual Brown Loafers", slug: 'mens-casual-brown-loafers', price: 2850, cost: 1700, compare: 3400, catSlug: 'mens-fashion', stock: 11, sku: 'SHOE-001' },

    // Electronics
    { title: 'HD Indoor CCTV Camera 360', slug: 'hd-indoor-cctv-camera-360', price: 3850, cost: 2400, compare: 4500, catSlug: 'electronics', stock: 0, sku: 'CCTV-001' },
    { title: 'TWS Wireless Earbuds Pro', slug: 'tws-wireless-earbuds-pro', price: 2950, cost: 1800, compare: 3600, catSlug: 'electronics', stock: 25, sku: 'EARB-001' },
    { title: 'Waterproof Smart Watch V8', slug: 'waterproof-smart-watch-v8', price: 3450, cost: 2100, compare: 4200, catSlug: 'electronics', stock: 12, sku: 'WATCH-001' },
    { title: 'Portable Bluetooth Speaker', slug: 'portable-bluetooth-speaker', price: 1850, cost: 1100, compare: 2300, catSlug: 'electronics', stock: 40, sku: 'SPK-001' },
    { title: '20000mAh Fast Power Bank', slug: '20000mah-fast-power-bank', price: 2150, cost: 1250, compare: 2700, catSlug: 'electronics', stock: 4, sku: 'PBANK-001' },
    { title: 'ANC Noise Cancelling Headphones', slug: 'anc-noise-cancelling-headphones', price: 4950, cost: 3200, compare: 5800, catSlug: 'electronics', stock: 10, sku: 'HEAD-001' },
    { title: 'Smart Body Fat Analyzer Scale', slug: 'smart-body-fat-analyzer-scale', price: 2250, cost: 1350, compare: 2800, catSlug: 'electronics', stock: 19, sku: 'SCALE-001' },

    // Accessories
    { title: 'Genuine Leather Wallet', slug: 'genuine-leather-wallet', price: 1200, cost: 650, compare: 1600, catSlug: 'accessories', stock: 2, sku: 'WALL-001' },
    { title: 'Executive Black Leather Belt', slug: 'executive-black-leather-belt', price: 950, cost: 500, compare: 1300, catSlug: 'accessories', stock: 35, sku: 'BELT-001' },
    { title: 'UV Protection Sunglasses', slug: 'uv-protection-sunglasses', price: 1450, cost: 800, compare: 1900, catSlug: 'accessories', stock: 28, sku: 'SUN-001' },
    { title: 'Waterproof Travel Laptop Backpack', slug: 'waterproof-travel-laptop-backpack', price: 2650, cost: 1600, compare: 3200, catSlug: 'accessories', stock: 18, sku: 'PACK-001' },
    { title: 'Slim Leather Card Holder', slug: 'slim-leather-card-holder', price: 650, cost: 300, compare: 900, catSlug: 'accessories', stock: 80, sku: 'CARD-001' },

    // Home & Lifestyle
    { title: 'Modern Touch LED Table Lamp', slug: 'modern-touch-led-table-lamp', price: 1750, cost: 950, compare: 2200, catSlug: 'home-lifestyle', stock: 22, sku: 'LAMP-001' },
    { title: 'Insulated Stainless Steel Water Bottle', slug: 'insulated-stainless-steel-water-bottle', price: 850, cost: 450, compare: 1100, catSlug: 'home-lifestyle', stock: 60, sku: 'BOT-001' },
    { title: 'Modular Kitchen Countertop Organizer', slug: 'modular-kitchen-countertop-organizer', price: 2350, cost: 1400, compare: 2900, catSlug: 'home-lifestyle', stock: 14, sku: 'KITCH-001' },
    { title: 'Minimalist Nordic Wall Clock', slug: 'minimalist-nordic-wall-clock', price: 1150, cost: 600, compare: 1500, catSlug: 'home-lifestyle', stock: 25, sku: 'CLOCK-001' },
    { title: 'Cordless Electric Glass Kettle 1.8L', slug: 'cordless-electric-glass-kettle', price: 1650, cost: 950, compare: 2100, catSlug: 'home-lifestyle', stock: 30, sku: 'KET-001' },
  ];

  const createdProducts: ProductEntity[] = [];

  for (const pDef of productDefs) {
    let product = await productRepo.findOne({ where: { tenantId, slug: pDef.slug } });
    const category = categoryMap.get(pDef.catSlug);

    if (!product) {
      product = productRepo.create({
        title: pDef.title,
        slug: pDef.slug,
        description: `High quality ${pDef.title} crafted for everyday use in Bangladesh. Guaranteed authentic.`,
        basePrice: pDef.price,
        compareAtPrice: pDef.compare,
        costPrice: pDef.cost,
        isPublished: true,
        categoryId: category?.id,
        tenantId,
      });
      await productRepo.save(product);

      // Create variant
      const variant = variantRepo.create({
        sku: pDef.sku,
        price: pDef.price,
        compareAtPrice: pDef.compare,
        productId: product.id,
        tenantId,
      });
      await variantRepo.save(variant);

      // Create inventory stock
      const stock = stockRepo.create({
        productId: product.id,
        variantId: variant.id,
        warehouseId: warehouse.id,
        quantityOnHand: pDef.stock,
        quantityReserved: pDef.stock > 0 ? 1 : 0,
        reorderPoint: 5,
        tenantId,
      });
      await stockRepo.save(stock);
    }
    createdProducts.push(product);
  }

  console.log(`📦 Seeded ${createdProducts.length} Products & Stocks.`);

  // 6. Check existing orders
  const existingOrderCount = await orderRepo.count({ where: { tenantId } });
  if (existingOrderCount >= 1000000) {
    console.log(`🛒 Store already has ${existingOrderCount} orders. Skipping order generation to preserve idempotency.`);
    await AppDataSource.destroy();
    return;
  }
  
  console.log(`Deleting old orders before seeding new ones to test payment statuses...`);
  await AppDataSource.query(`TRUNCATE TABLE orders CASCADE`);
  await AppDataSource.query(`TRUNCATE TABLE consignments CASCADE`);

  console.log('🛒 Generating 110 Historical Orders across past 60 days...');

  // Bangladeshi Demo Customers
  const customerList = [
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

  // Status breakdown target for 110 orders:
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

  // Shuffle status pool for natural spread
  for (let i = statusPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusPool[i], statusPool[j]] = [statusPool[j], statusPool[i]];
  }

  const now = new Date();

  for (let i = 0; i < statusPool.length; i++) {
    const status = statusPool[i];
    const customer = customerList[i % customerList.length];

    // Distribute date randomly over last 60 days
    const daysAgo = Math.floor(Math.random() * 58);
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 1000000);

    // Pick 1 to 3 items
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts: ProductEntity[] = [];
    for (let k = 0; k < numItems; k++) {
      const p = createdProducts[Math.floor(Math.random() * createdProducts.length)];
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

      orderItems.push({
        productId: prod.id,
        productTitle: prod.title,
        sku: `${prod.slug.toUpperCase().slice(0, 4)}-001`,
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
        // Some COD delivered are collected, some are pending
        paymentStatus = i % 2 === 0 ? PaymentStatusEnum.COD_COLLECTED : PaymentStatusEnum.COD_PENDING;
      } else if (status === OrderStatusEnum.RETURNED || status === OrderStatusEnum.CANCELLED) {
        paymentStatus = PaymentStatusEnum.COD_PENDING; // COD usually doesn't get refunded, just stays pending
      } else {
        paymentStatus = PaymentStatusEnum.COD_PENDING;
      }
    } else {
      // Online payment logic
      if (status === OrderStatusEnum.DELIVERED || status === OrderStatusEnum.SHIPPED || status === OrderStatusEnum.COMPLETED || status === OrderStatusEnum.PROCESSING) {
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
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: `${customer.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
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

    // Save Payment record if paid or bKash/SSL
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

    // Save Status History (Progressive timeline)
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
        createdAt: new Date(orderDate.getTime() + 3600000), // 1 hour later
      });
      await statusHistoryRepo.save(updateHistory);
    }

    // Save Order Notes (~30% of orders get staff/customer notes)
    if (i % 3 === 0) {
      const note1 = noteRepo.create({
        orderId: order.id,
        content: `Customer requested delivery after 4 PM if possible. Phone: ${customer.phone}`,
        isCustomerVisible: false,
        createdBy: 'MD Belal Hossain',
        createdAt: new Date(orderDate.getTime() + 1800000),
      });
      await noteRepo.save(note1);

      if (i % 6 === 0) {
        const note2 = noteRepo.create({
          orderId: order.id,
          content: 'Your order has been verified and assigned to our central warehouse for dispatch.',
          isCustomerVisible: true,
          createdBy: 'System Notification',
          createdAt: new Date(orderDate.getTime() + 2500000),
        });
        await noteRepo.save(note2);
      }
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
        requestedAt: new Date(orderDate.getTime() + 86400000 * 3), // 3 days after order
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

      // If return is accepted and was paid, create a refund record
      if (paymentStatus === PaymentStatusEnum.REFUNDED || paymentStatus === PaymentStatusEnum.PAID) {
        // Find or create payment ID
        const payment = await paymentRepo.findOne({ where: { orderId: order.id } });
        if (payment) {
          const refund = refundRepo.create({
            refundNumber: `REF-${1000 + i}`,
            orderId: order.id,
            paymentId: payment.id,
            returnId: returnReq.id,
            amount: grandTotal,
            reason: 'Customer return accepted',
            method: paymentMethod === PaymentMethodEnum.BKASH ? 'BKASH' : 'BANK_TRANSFER',
            status: RefundStatusEnum.COMPLETED,
            tenantId,
            createdAt: new Date(orderDate.getTime() + 86400000 * 4),
            completedAt: new Date(orderDate.getTime() + 86400000 * 4),
          });
          await refundRepo.save(refund);
        }
      }
    }
  }

  console.log('✨ Seeded 110 Orders with Items, Payments, Consignments, Notes, Status History, Returns, and Refunds.');
  console.log('🎉 Seeding successfully completed!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
