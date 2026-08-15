import type { AbandonedCart } from '../api/orderApi';

/** Helper to generate ISO timestamps relative to now */
const subMinutes = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();
const subHours = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const subDays = (days: number, extraHours = 0) =>
  new Date(Date.now() - (days * 24 + extraHours) * 60 * 60 * 1000).toISOString();

export interface MockAbandonedCart extends AbandonedCart {
  stepAbandoned?: string;
  recoveryChannel?: 'SMS' | 'WHATSAPP' | 'EMAIL';
  recoveredAt?: string;
  recoveredOrderId?: string;
  discountCode?: string;
  timeline?: {
    time: string;
    title: string;
    description: string;
    type: 'cart_created' | 'checkout_started' | 'step_reached' | 'sms_sent' | 'link_clicked' | 'recovered';
  }[];
}

export const MOCK_ABANDONED_CARTS: MockAbandonedCart[] = [
  {
    id: 'cart-ab-001',
    customerName: 'Nusrat Jahan',
    customerPhone: '+880 1712-345678',
    customerEmail: 'nusrat.jahan@gmail.com',
    shippingAddress: 'House 42, Road 11, Block D, Banani, Dhaka',
    totalAmount: 4850,
    recoveryToken: 'tok_rec_nusrat_001',
    isRecovered: false,
    lastRemindedAt: undefined,
    tenantId: 'tenant-demo',
    createdAt: subMinutes(18),
    stepAbandoned: 'Payment Method Selection',
    itemsJson: [
      {
        id: 'prod-101',
        title: 'Premium Silk Panjabi - Royal Navy (Size: L)',
        price: 3250,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-102',
        title: 'Pure Leather Formal Belt (Black)',
        price: 1600,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subMinutes(28),
        title: 'Cart Created',
        description: 'Customer added 2 items from Eid Collection',
        type: 'cart_created',
      },
      {
        time: subMinutes(22),
        title: 'Checkout Started',
        description: 'Entered name, phone and Banani shipping address',
        type: 'checkout_started',
      },
      {
        time: subMinutes(18),
        title: 'Abandoned at Payment',
        description: 'Stopped at bKash payment confirmation page',
        type: 'step_reached',
      },
    ],
  },
  {
    id: 'cart-ab-002',
    customerName: 'Tanvir Ahmed',
    customerPhone: '+880 1845-901234',
    customerEmail: 'tanvir.ahmed.bd@yahoo.com',
    shippingAddress: 'Flat 5B, Concord Tower, GEC Circle, Chattogram',
    totalAmount: 6490,
    recoveryToken: 'tok_rec_tanvir_002',
    isRecovered: false,
    lastRemindedAt: subHours(1),
    tenantId: 'tenant-demo',
    createdAt: subHours(3),
    stepAbandoned: 'Shipping Selection',
    itemsJson: [
      {
        id: 'prod-103',
        title: 'Wireless ANC Earbuds Pro v2 with Bass Boost',
        price: 4990,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-104',
        title: 'Silicone Protective Case for Earbuds (Midnight Blue)',
        price: 1500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subHours(3),
        title: 'Cart Created',
        description: 'Added Wireless Earbuds & Case to cart',
        type: 'cart_created',
      },
      {
        time: subHours(2.8),
        title: 'Checkout Initiated',
        description: 'Customer filled phone and Chattogram shipping address',
        type: 'checkout_started',
      },
      {
        time: subHours(1),
        title: 'Recovery SMS Sent',
        description: 'Automated 2h reminder SMS dispatched with 10% coupon link',
        type: 'sms_sent',
      },
      {
        time: subMinutes(40),
        title: 'Recovery Link Clicked',
        description: 'Customer clicked recovery link via SMS',
        type: 'link_clicked',
      },
    ],
  },
  {
    id: 'cart-ab-003',
    customerName: 'Sadia Islam',
    customerPhone: '+880 1911-882233',
    customerEmail: 'sadia.islam89@outlook.com',
    shippingAddress: 'House 15, Dhanmondi 27, Dhaka',
    totalAmount: 7800,
    recoveryToken: 'tok_rec_sadia_003',
    isRecovered: true,
    lastRemindedAt: subHours(6),
    recoveredAt: subHours(2),
    recoveredOrderId: '#ORD-84920',
    discountCode: 'RECOVER10',
    recoveryChannel: 'SMS',
    tenantId: 'tenant-demo',
    createdAt: subHours(8),
    stepAbandoned: 'Cart Summary',
    itemsJson: [
      {
        id: 'prod-105',
        title: 'Handloom Pure Jamdani Saree - Crimson & Gold (84 Count)',
        price: 7800,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subHours(8),
        title: 'Cart Created',
        description: 'Added Handloom Jamdani Saree to cart',
        type: 'cart_created',
      },
      {
        time: subHours(7.5),
        title: 'Checkout Started',
        description: 'Customer filled address details',
        type: 'checkout_started',
      },
      {
        time: subHours(6),
        title: 'Recovery SMS Sent',
        description: 'Sent SMS: "Sadia, use code RECOVER10 for 10% OFF your Jamdani Saree"',
        type: 'sms_sent',
      },
      {
        time: subHours(2),
        title: 'Cart Successfully Recovered 🎉',
        description: 'Customer completed order #ORD-84920 via bKash Payment',
        type: 'recovered',
      },
    ],
  },
  {
    id: 'cart-ab-004',
    customerName: 'Mehedi Hasan',
    customerPhone: '+880 1623-774411',
    customerEmail: 'mehedi.hasan.dev@gmail.com',
    shippingAddress: 'Sector 7, Road 14, Uttara, Dhaka',
    totalAmount: 3200,
    recoveryToken: 'tok_rec_mehedi_004',
    isRecovered: false,
    lastRemindedAt: undefined,
    tenantId: 'tenant-demo',
    createdAt: subHours(4),
    stepAbandoned: 'Delivery Options',
    itemsJson: [
      {
        id: 'prod-106',
        title: 'Mechanical Gaming Keyboard RGB (Blue Switches)',
        price: 2600,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-107',
        title: 'Extended Gaming Mouse Pad XXL (900x400mm)',
        price: 600,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subHours(4.2),
        title: 'Cart Created',
        description: 'Added Mechanical Keyboard & Mouse Pad',
        type: 'cart_created',
      },
      {
        time: subHours(4),
        title: 'Abandoned in Checkout',
        description: 'Customer paused at Delivery method selection',
        type: 'step_reached',
      },
    ],
  },
  {
    id: 'cart-ab-005',
    customerName: 'Farzana Akter',
    customerPhone: '+880 1755-667788',
    customerEmail: 'farzana.akter.ctg@gmail.com',
    shippingAddress: 'Holding 24, Nasirabad Housing Society, Chattogram',
    totalAmount: 5200,
    recoveryToken: 'tok_rec_farzana_005',
    isRecovered: true,
    lastRemindedAt: subDays(1, 4),
    recoveredAt: subDays(1),
    recoveredOrderId: '#ORD-84812',
    discountCode: 'WELCOME10',
    recoveryChannel: 'SMS',
    tenantId: 'tenant-demo',
    createdAt: subDays(1, 6),
    stepAbandoned: 'Coupon Entry',
    itemsJson: [
      {
        id: 'prod-108',
        title: 'Organic Black Seed Hair Oil 200ml (Pack of 2)',
        price: 1800,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1608248597358-1e4284bb85b8?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-109',
        title: 'Herbal Hair Growth Serum with Rosemary',
        price: 1600,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1608248597358-1e4284bb85b8?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(1, 6),
        title: 'Cart Created',
        description: 'Added Hair Care items to cart',
        type: 'cart_created',
      },
      {
        time: subDays(1, 4),
        title: 'SMS Sent',
        description: 'Recovery SMS sent with direct checkout link',
        type: 'sms_sent',
      },
      {
        time: subDays(1),
        title: 'Order Recovered 🎉',
        description: 'Order #ORD-84812 placed with Cash on Delivery',
        type: 'recovered',
      },
    ],
  },
  {
    id: 'cart-ab-006',
    customerName: 'Rafiqul Islam',
    customerPhone: '+880 1833-221144',
    customerEmail: 'rafiqul.islam@standard-bd.com',
    shippingAddress: 'House 8, Road 3, Block C, Mirpur 2, Dhaka',
    totalAmount: 1850,
    recoveryToken: 'tok_rec_rafiqul_006',
    isRecovered: false,
    lastRemindedAt: subHours(12),
    tenantId: 'tenant-demo',
    createdAt: subDays(1),
    stepAbandoned: 'Review & Pay',
    itemsJson: [
      {
        id: 'prod-110',
        title: 'Casual Breathable Linen Shirt - Sky Blue (Size: XL)',
        price: 1850,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(1, 1),
        title: 'Cart Created',
        description: 'Added Casual Linen Shirt to cart',
        type: 'cart_created',
      },
      {
        time: subHours(12),
        title: 'Reminder SMS Sent',
        description: 'First reminder sent to customer phone',
        type: 'sms_sent',
      },
    ],
  },
  {
    id: 'cart-ab-007',
    customerName: 'Ayesha Siddiqua',
    customerPhone: '+880 1799-445566',
    customerEmail: 'ayesha.siddiqua@northsouth.edu',
    shippingAddress: 'Plot 15, Block B, Bashundhara R/A, Dhaka',
    totalAmount: 9200,
    recoveryToken: 'tok_rec_ayesha_007',
    isRecovered: false,
    lastRemindedAt: undefined,
    tenantId: 'tenant-demo',
    createdAt: subMinutes(55),
    stepAbandoned: 'Payment Selection',
    itemsJson: [
      {
        id: 'prod-111',
        title: 'Handcrafted Genuine Leather Shoulder Bag (Tan Brown)',
        price: 5800,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-112',
        title: 'Matching Leather Cardholder & Wallet Set',
        price: 3400,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subHours(1.1),
        title: 'Cart Created',
        description: 'High-value leather goods bundle added to cart',
        type: 'cart_created',
      },
      {
        time: subMinutes(55),
        title: 'Checkout Form Filled',
        description: 'Address entered: Bashundhara R/A',
        type: 'checkout_started',
      },
    ],
  },
  {
    id: 'cart-ab-008',
    customerName: 'Shakib Al Hasan',
    customerPhone: '+880 1711-002233',
    customerEmail: 'shakib.cricket75@gmail.com',
    shippingAddress: 'House 33, Road 2, Gulshan 1, Dhaka',
    totalAmount: 3800,
    recoveryToken: 'tok_rec_shakib_008',
    isRecovered: true,
    lastRemindedAt: subDays(2, 2),
    recoveredAt: subDays(2),
    recoveredOrderId: '#ORD-84690',
    discountCode: 'SUMMER5',
    recoveryChannel: 'SMS',
    tenantId: 'tenant-demo',
    createdAt: subDays(2, 5),
    stepAbandoned: 'Customer Details',
    itemsJson: [
      {
        id: 'prod-113',
        title: 'Dry-Fit Performance Polo T-Shirt (Pack of 2)',
        price: 2400,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-114',
        title: 'Athletic Sports Cap with UV Shield',
        price: 1400,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(2, 5),
        title: 'Cart Created',
        description: 'Customer added sportswear bundle',
        type: 'cart_created',
      },
      {
        time: subDays(2, 2),
        title: 'SMS Sent',
        description: 'Automated SMS sent with 5% promo code',
        type: 'sms_sent',
      },
      {
        time: subDays(2),
        title: 'Order Recovered 🎉',
        description: 'Order #ORD-84690 placed via Nagad',
        type: 'recovered',
      },
    ],
  },
  {
    id: 'cart-ab-009',
    customerName: 'Tahsin Rahman',
    customerPhone: '+880 1819-556677',
    customerEmail: 'tahsin.rahman94@gmail.com',
    shippingAddress: 'Holding 12, Zindabazar, Sylhet',
    totalAmount: 2950,
    recoveryToken: 'tok_rec_tahsin_009',
    isRecovered: false,
    lastRemindedAt: subHours(18),
    tenantId: 'tenant-demo',
    createdAt: subDays(2),
    stepAbandoned: 'Payment Method',
    itemsJson: [
      {
        id: 'prod-115',
        title: 'Smart Fitness Tracker Band with Heart Rate Monitor',
        price: 2950,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(2),
        title: 'Cart Created',
        description: 'Fitness tracker added to cart',
        type: 'cart_created',
      },
      {
        time: subHours(18),
        title: 'Reminder Dispatched',
        description: 'Recovery SMS dispatched via Greenweb Gateway',
        type: 'sms_sent',
      },
    ],
  },
  {
    id: 'cart-ab-010',
    customerName: 'Ishrat Jahan',
    customerPhone: '+880 1722-998877',
    customerEmail: 'ishrat.jahan.du@gmail.com',
    shippingAddress: 'House 5, Road 9, Dhanmondi, Dhaka',
    totalAmount: 2250,
    recoveryToken: 'tok_rec_ishrat_010',
    isRecovered: false,
    lastRemindedAt: undefined,
    tenantId: 'tenant-demo',
    createdAt: subHours(2),
    stepAbandoned: 'Delivery Options',
    itemsJson: [
      {
        id: 'prod-116',
        title: 'Scented Soy Candle Aromatherapy Gift Set (Lavender & Sandalwood)',
        price: 2250,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subHours(2.2),
        title: 'Cart Created',
        description: 'Added candle gift set to cart',
        type: 'cart_created',
      },
      {
        time: subHours(2),
        title: 'Checkout Form Filled',
        description: 'Customer selected home delivery',
        type: 'checkout_started',
      },
    ],
  },
  {
    id: 'cart-ab-011',
    customerName: 'Kamrul Hassan',
    customerPhone: '+880 1912-334455',
    customerEmail: 'kamrul.hassan@rajshahi.gov.bd',
    shippingAddress: 'Shaheb Bazar, Rajshahi Sadar, Rajshahi',
    totalAmount: 3900,
    recoveryToken: 'tok_rec_kamrul_011',
    isRecovered: true,
    lastRemindedAt: subDays(3, 4),
    recoveredAt: subDays(3),
    recoveredOrderId: '#ORD-84510',
    discountCode: 'RECOVER10',
    recoveryChannel: 'SMS',
    tenantId: 'tenant-demo',
    createdAt: subDays(3, 8),
    stepAbandoned: 'Payment Method',
    itemsJson: [
      {
        id: 'prod-117',
        title: 'Premium Raw Organic Mustard Honey 1kg',
        price: 1950,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(3, 8),
        title: 'Cart Created',
        description: 'Added 2x Organic Honey 1kg',
        type: 'cart_created',
      },
      {
        time: subDays(3, 4),
        title: 'SMS Sent',
        description: 'Reminder SMS with 10% coupon delivered',
        type: 'sms_sent',
      },
      {
        time: subDays(3),
        title: 'Order Recovered 🎉',
        description: 'Order #ORD-84510 confirmed with COD',
        type: 'recovered',
      },
    ],
  },
  {
    id: 'cart-ab-012',
    customerName: 'Nabila Tabassum',
    customerPhone: '+880 1877-112233',
    customerEmail: 'nabila.tabassum@hotmail.com',
    shippingAddress: 'Sector 4, Uttara Model Town, Dhaka',
    totalAmount: 1450,
    recoveryToken: 'tok_rec_nabila_012',
    isRecovered: false,
    lastRemindedAt: subDays(3),
    tenantId: 'tenant-demo',
    createdAt: subDays(4),
    stepAbandoned: 'Cart Summary',
    itemsJson: [
      {
        id: 'prod-118',
        title: 'Matte Liquid Lipstick Velvet Finish (Shade: Dusty Rose)',
        price: 1450,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(4),
        title: 'Cart Created',
        description: 'Item added to shopping bag',
        type: 'cart_created',
      },
      {
        time: subDays(3),
        title: 'Reminder SMS Dispatched',
        description: 'SMS notification sent',
        type: 'sms_sent',
      },
    ],
  },
  {
    id: 'cart-ab-013',
    customerName: 'Zubair Hossain',
    customerPhone: '+880 1611-447788',
    customerEmail: 'zubair.hossain@bracu.ac.bd',
    shippingAddress: 'Kallayanpur, Mirpur Road, Dhaka',
    totalAmount: 5600,
    recoveryToken: 'tok_rec_zubair_013',
    isRecovered: false,
    lastRemindedAt: undefined,
    tenantId: 'tenant-demo',
    createdAt: subDays(4, 2),
    stepAbandoned: 'Delivery Options',
    itemsJson: [
      {
        id: 'prod-119',
        title: 'Minimalist Chronograph Men Watch with Sapphire Glass',
        price: 5600,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(4, 2),
        title: 'Cart Created',
        description: 'Added Minimalist Chronograph Watch',
        type: 'cart_created',
      },
    ],
  },
  {
    id: 'cart-ab-014',
    customerName: 'Mahmudul Haque',
    customerPhone: '+880 1788-552211',
    customerEmail: 'mahmud.haque@gmail.com',
    shippingAddress: 'Golapganj, Sylhet',
    totalAmount: 2100,
    recoveryToken: 'tok_rec_mahmud_014',
    isRecovered: false,
    lastRemindedAt: subDays(5),
    tenantId: 'tenant-demo',
    createdAt: subDays(5, 4),
    stepAbandoned: 'Address Input',
    itemsJson: [
      {
        id: 'prod-120',
        title: 'Premium Arabian Oud Fragrance Oil 12ml',
        price: 2100,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(5, 4),
        title: 'Cart Created',
        description: 'Customer added Arabian Oud Fragrance',
        type: 'cart_created',
      },
      {
        time: subDays(5),
        title: 'SMS Sent',
        description: 'Auto reminder SMS dispatched',
        type: 'sms_sent',
      },
    ],
  },
  {
    id: 'cart-ab-015',
    customerName: 'Samira Khan',
    customerPhone: '+880 1822-778899',
    customerEmail: 'samira.khan.fashion@yahoo.com',
    shippingAddress: 'Khulshi R/A, Chattogram',
    totalAmount: 4300,
    recoveryToken: 'tok_rec_samira_015',
    isRecovered: false,
    lastRemindedAt: undefined,
    tenantId: 'tenant-demo',
    createdAt: subDays(6),
    stepAbandoned: 'Payment Method',
    itemsJson: [
      {
        id: 'prod-121',
        title: 'Embroidered Linen Kurti - Pastel Pink (Size: M)',
        price: 2800,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-122',
        title: 'Linen Trousers with Ankle Embroidery',
        price: 1500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(6),
        title: 'Cart Created',
        description: 'Added 2 items from Summer Lawn Collection',
        type: 'cart_created',
      },
    ],
  },
  {
    id: 'cart-ab-016',
    customerName: 'Arifur Rahman',
    customerPhone: '+880 1933-667744',
    customerEmail: 'arif.rahman.eng@gmail.com',
    shippingAddress: 'Shantinagar, Dhaka 1217',
    totalAmount: 3100,
    recoveryToken: 'tok_rec_arif_016',
    isRecovered: false,
    lastRemindedAt: subDays(6, 6),
    tenantId: 'tenant-demo',
    createdAt: subDays(6, 12),
    stepAbandoned: 'Delivery Options',
    itemsJson: [
      {
        id: 'prod-123',
        title: 'Ergonomic Memory Foam Lumbar Support Cushion',
        price: 3100,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(6, 12),
        title: 'Cart Created',
        description: 'Added Lumbar Cushion',
        type: 'cart_created',
      },
      {
        time: subDays(6, 6),
        title: 'SMS Sent',
        description: 'Reminder SMS dispatched',
        type: 'sms_sent',
      },
    ],
  },
  {
    id: 'cart-ab-017',
    customerName: 'Rifat Chowdhury',
    customerPhone: '+880 1766-332211',
    customerEmail: 'rifat.chowdhury@bankasia.com',
    shippingAddress: 'Agrabad C/A, Chattogram',
    totalAmount: 1950,
    recoveryToken: 'tok_rec_rifat_017',
    isRecovered: false,
    lastRemindedAt: undefined,
    tenantId: 'tenant-demo',
    createdAt: subDays(7),
    stepAbandoned: 'Cart Summary',
    itemsJson: [
      {
        id: 'prod-124',
        title: 'Smart Coffee Mug with Temperature Control 350ml',
        price: 1950,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(7),
        title: 'Cart Created',
        description: 'Smart mug added to shopping cart',
        type: 'cart_created',
      },
    ],
  },
  {
    id: 'cart-ab-018',
    customerName: 'Sultana Razia',
    customerPhone: '+880 1855-443322',
    customerEmail: 'sultana.razia.design@gmail.com',
    shippingAddress: 'House 19, Road 4, Sector 9, Uttara, Dhaka',
    totalAmount: 6200,
    recoveryToken: 'tok_rec_sultana_018',
    isRecovered: false,
    lastRemindedAt: subDays(7, 2),
    tenantId: 'tenant-demo',
    createdAt: subDays(7, 8),
    stepAbandoned: 'Payment Method',
    itemsJson: [
      {
        id: 'prod-125',
        title: 'Handcrafted Wooden Wall Clock (Nordic Minimalist)',
        price: 3800,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'prod-126',
        title: 'Ceramic Table Vase Set of 3 (Matte White)',
        price: 2400,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150&auto=format&fit=crop&q=80',
      },
    ],
    timeline: [
      {
        time: subDays(7, 8),
        title: 'Cart Created',
        description: 'Customer added Home Decor bundle',
        type: 'cart_created',
      },
      {
        time: subDays(7, 2),
        title: 'SMS Sent',
        description: 'Reminder SMS dispatched with 10% coupon',
        type: 'sms_sent',
      },
    ],
  },
];

export interface SmsTemplate {
  id: string;
  name: string;
  badge: string;
  delayHours: number;
  triggerEvent: string;
  enabled: boolean;
  content: string;
  banglaContent?: string;
  variables: string[];
}

export const MOCK_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'tmpl-1h',
    name: '1-Hour Quick Reminder',
    badge: 'High Conversion',
    delayHours: 1,
    triggerEvent: 'Cart abandoned for 1 hour',
    enabled: true,
    content:
      'Hi {{customer_name}}, you left items in your cart at {{store_name}}! Complete your purchase before stock runs out: {{cart_url}}',
    banglaContent:
      'প্রিয় {{customer_name}}, {{store_name}}-এ আপনার কার্টটি এখনও অপেক্ষায় আছে! স্টক শেষ হওয়ার আগেই অর্ডার সম্পন্ন করুন: {{cart_url}}',
    variables: ['{{customer_name}}', '{{store_name}}', '{{cart_url}}', '{{cart_total}}'],
  },
  {
    id: 'tmpl-24h-discount',
    name: '24-Hour Incentive (10% OFF)',
    badge: 'Popular',
    delayHours: 24,
    triggerEvent: 'Cart abandoned for 24 hours',
    enabled: true,
    content:
      'Special gift for you, {{customer_name}}! Use code {{discount_code}} for 10% OFF your cart at {{store_name}}. Click here to claim: {{cart_url}}',
    banglaContent:
      '{{customer_name}}, আপনার জন্য বিশেষ অফার! {{discount_code}} কোড ব্যবহারে ১০% ছাড়ে আপনার কার্ট অর্ডার করুন: {{cart_url}}',
    variables: ['{{customer_name}}', '{{store_name}}', '{{cart_url}}', '{{discount_code}}'],
  },
  {
    id: 'tmpl-48h-urgency',
    name: '48-Hour Urgency & Low Stock',
    badge: 'Last Chance',
    delayHours: 48,
    triggerEvent: 'Cart abandoned for 48 hours',
    enabled: false,
    content:
      'Hurry {{customer_name}}! Items in your {{store_name}} cart are almost sold out. Finish checkout now with Free Delivery: {{cart_url}}',
    banglaContent:
      'তাড়াতাড়ি করুন {{customer_name}}! {{store_name}}-এ আপনার সংরক্ষিত পণ্যগুলোর স্টক প্রায় শেষ। ফ্রি ডেলিভারিতে অর্ডার করুন: {{cart_url}}',
    variables: ['{{customer_name}}', '{{store_name}}', '{{cart_url}}'],
  },
  {
    id: 'tmpl-bangla-native',
    name: 'Bangla Direct Friendly SMS',
    badge: 'Local Favourite',
    delayHours: 2,
    triggerEvent: 'Cart abandoned for 2 hours',
    enabled: true,
    content:
      'আসসালামু আলাইকুম {{customer_name}}, {{store_name}}-এ আপনার পছন্দের পণ্যগুলো কার্টে সংরক্ষিত আছে। ক্যাশ অন ডেলিভারিতে অর্ডার করতে ক্লিক করুন: {{cart_url}}',
    variables: ['{{customer_name}}', '{{store_name}}', '{{cart_url}}'],
  },
];

export interface RecoveryAnalytics {
  totalRecoveredRevenue: number;
  totalRecoveredCarts: number;
  conversionRate: number;
  averageRecoveryTimeHours: number;
  roiMultiplier: number;
  channelBreakdown: { channel: string; sharePercent: number; count: number; revenue: number; color: string }[];
  recoverySpeedBreakdown: { speed: string; percent: number; count: number }[];
}

export const MOCK_RECOVERY_ANALYTICS: RecoveryAnalytics = {
  totalRecoveredRevenue: 24700,
  totalRecoveredCarts: 4,
  conversionRate: 22.2,
  averageRecoveryTimeHours: 2.4,
  roiMultiplier: 18.5,
  channelBreakdown: [
    { channel: 'SMS Recovery', sharePercent: 75, count: 3, revenue: 19500, color: 'bg-emerald-500' },
    { channel: 'WhatsApp / Direct', sharePercent: 25, count: 1, revenue: 5200, color: 'bg-teal-500' },
  ],
  recoverySpeedBreakdown: [
    { speed: 'Within 1 Hour', percent: 25, count: 1 },
    { speed: '1 to 6 Hours', percent: 50, count: 2 },
    { speed: '6 to 24 Hours', percent: 25, count: 1 },
  ],
};
