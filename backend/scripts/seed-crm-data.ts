import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../src/database/data-source';
import { TenantEntity } from '../src/modules/tenant/entities/tenant.entity';
import { StoreEntity } from '../src/modules/tenant/entities/store.entity';
import { LeadEntity, LeadStageEnum, LeadSourceEnum } from '../src/modules/customer/entities/lead.entity';
import {
  CustomerEntity,
  CustomerStatusEnum,
  CustomerAccountTypeEnum,
  CustomerSourceEnum,
} from '../src/modules/customer/entities/customer.entity';
import { CustomerAddressEntity } from '../src/modules/customer/entities/customer-address.entity';
import { CustomerNoteEntity } from '../src/modules/customer/entities/customer-note.entity';
import { CustomerActivityEntity } from '../src/modules/customer/entities/customer-activity.entity';

async function seedCrmData() {
  console.log('🚀 Running CRM Leads & Customer 360 Direct Database Seeder...');
  await AppDataSource.initialize();
  console.log('✅ Database connected.');

  const tenantRepo = AppDataSource.getRepository(TenantEntity);
  const storeRepo = AppDataSource.getRepository(StoreEntity);
  const leadRepo = AppDataSource.getRepository(LeadEntity);
  const customerRepo = AppDataSource.getRepository(CustomerEntity);
  const addressRepo = AppDataSource.getRepository(CustomerAddressEntity);
  const noteRepo = AppDataSource.getRepository(CustomerNoteEntity);
  const activityRepo = AppDataSource.getRepository(CustomerActivityEntity);

  let tenants = await tenantRepo.find();
  if (tenants.length === 0) {
    console.log('⚠️ No tenants found. Creating a default tenant...');
    const defaultTenant = tenantRepo.create({ name: 'Default Store Tenant', isActive: true });
    await tenantRepo.save(defaultTenant);
    tenants = [defaultTenant];
  }

  for (const tenant of tenants) {
    const store = await storeRepo.findOne({ where: { tenantId: tenant.id } });
    const storeId = store?.id;

    console.log(`\n📌 Seeding for Tenant: "${tenant.name}" (${tenant.id})`);

    // 1. Seed 12 Leads
    const sampleLeads = [
      {
        tenantId: tenant.id,
        storeId,
        name: 'Tanvir Ahmed',
        companyName: 'Apex Logistics Ltd',
        phone: '01711223344',
        email: 'tanvir.ahmed@apex.com.bd',
        source: LeadSourceEnum.WHATSAPP,
        stage: LeadStageEnum.NEW,
        estimatedValue: 45000,
        leadScore: 85,
        notes: 'Interested in bulk corporate polo shirts (150 pcs). Requested fabric sample and color chart.',
        nextFollowUpAt: new Date(Date.now() + 3 * 3600 * 1000),
        followUpNote: 'Send fabric sample photos on WhatsApp at 4 PM',
        followUpStatus: 'PENDING',
        tags: ['Corporate', 'Bulk Order', 'High Value'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Nusrat Jahan',
        companyName: 'Chic Boutique',
        phone: '01819887766',
        email: 'nusrat@chicboutique.bd',
        source: LeadSourceEnum.FACEBOOK,
        stage: LeadStageEnum.NEW,
        estimatedValue: 24000,
        leadScore: 78,
        notes: 'Inquired about wholesale designer silk sarees for Eid collection. Budget flexible.',
        nextFollowUpAt: new Date(Date.now() + 24 * 3600 * 1000),
        followUpNote: 'Call back to confirm catalog selection',
        followUpStatus: 'PENDING',
        tags: ['Retailer', 'Social Inquiry'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Mahmudul Hasan',
        companyName: 'Hasan Electronics',
        phone: '01755667788',
        email: 'hasan@hasanelectro.com',
        source: LeadSourceEnum.PHONE_CALL,
        stage: LeadStageEnum.CONTACTED,
        estimatedValue: 65000,
        leadScore: 82,
        notes: 'Spoke over phone. Needs 50 units for store restocking by end of next week.',
        nextFollowUpAt: new Date(Date.now() + 5 * 3600 * 1000),
        followUpNote: 'Email formal quotation and delivery terms',
        followUpStatus: 'PENDING',
        tags: ['Wholesale', 'Urgent Delivery'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Farzana Yasmin',
        companyName: 'Organic Kitchen BD',
        phone: '01912445566',
        email: 'farzana@organickitchen.bd',
        source: LeadSourceEnum.INSTAGRAM,
        stage: LeadStageEnum.CONTACTED,
        estimatedValue: 18500,
        leadScore: 70,
        notes: 'Instagram DM inquiry regarding custom branded packaging boxes and eco containers.',
        nextFollowUpAt: new Date(Date.now() + 36 * 3600 * 1000),
        followUpNote: 'Send packaging dimension specs',
        followUpStatus: 'PENDING',
        tags: ['Eco Package', 'F&B Sector'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Rafiqul Islam',
        companyName: 'Dhaka Tech Solutions',
        phone: '01912334455',
        email: 'rafiq@dhakatech.com',
        source: LeadSourceEnum.WEBSITE,
        stage: LeadStageEnum.QUALIFIED,
        estimatedValue: 95000,
        leadScore: 92,
        notes: 'Requirement verified: 60 premium executive gift hampers with custom laser logo engraving.',
        nextFollowUpAt: new Date(Date.now() + 4 * 3600 * 1000),
        followUpNote: 'Present final digital 3D mockup and pricing breakdown',
        followUpStatus: 'PENDING',
        tags: ['VIP', 'Corporate AGM', 'Ready to Buy'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Zubair Al-Mamun',
        companyName: 'CloudPoint Software',
        phone: '01799112233',
        email: 'zubair@cloudpoint.io',
        source: LeadSourceEnum.WHATSAPP,
        stage: LeadStageEnum.QUALIFIED,
        estimatedValue: 120000,
        leadScore: 90,
        notes: 'High intent deal for annual employee welcome kits (120 onboarding backpacks + bottles).',
        nextFollowUpAt: new Date(Date.now() + 8 * 3600 * 1000),
        followUpNote: 'Confirm sample approval with HR Director',
        followUpStatus: 'PENDING',
        tags: ['Tech Corporate', 'Recurring Client'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Mehnaz Chowdhury',
        companyName: 'Aura Spa & Wellness',
        phone: '01615556677',
        email: 'mehnaz@auraspa.bd',
        source: LeadSourceEnum.WEBSITE,
        stage: LeadStageEnum.PROPOSAL_SENT,
        estimatedValue: 38000,
        leadScore: 84,
        notes: 'Sent detailed proposal with tiered volume discount. Waiting for management sign-off.',
        nextFollowUpAt: new Date(Date.now() + 48 * 3600 * 1000),
        followUpNote: 'Follow up on proposal review status',
        followUpStatus: 'PENDING',
        tags: ['Hospitality', 'Custom Package'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Anisur Rahman',
        companyName: 'Delta Retail Hub',
        phone: '01822334455',
        email: 'anis@deltaretail.com.bd',
        source: LeadSourceEnum.STORE_INQUIRY,
        stage: LeadStageEnum.PROPOSAL_SENT,
        estimatedValue: 85000,
        leadScore: 88,
        notes: 'Store walk-in turned large bulk inquiry. Proposal delivered via email and WhatsApp.',
        nextFollowUpAt: new Date(Date.now() + 18 * 3600 * 1000),
        followUpNote: 'Call purchase manager to close deal',
        followUpStatus: 'PENDING',
        tags: ['Direct Store', 'High Priority'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Rezaul Karim',
        companyName: 'Karim Traders',
        phone: '01712998877',
        email: 'rezaul@karimtraders.com',
        source: LeadSourceEnum.STORE_INQUIRY,
        stage: LeadStageEnum.WON,
        estimatedValue: 150000,
        leadScore: 98,
        notes: 'Won and Converted! Order #ORD-9820 placed successfully with 50% advance bKash payment.',
        tags: ['Converted', 'Long Term Partner'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Sadia Afrin',
        companyName: 'Glow Beauty Studio',
        phone: '01688776655',
        email: 'sadia@glowbeauty.bd',
        source: LeadSourceEnum.INSTAGRAM,
        stage: LeadStageEnum.WON,
        estimatedValue: 42000,
        leadScore: 94,
        notes: 'Converted! Order #ORD-9844 fulfilled and delivered. Customer gave 5-star review.',
        tags: ['Converted', 'Satisfied Client'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Sultana Razia',
        companyName: 'Razia Textiles',
        phone: '01314445566',
        email: 'sultana@raziatraders.bd',
        source: LeadSourceEnum.PHONE_CALL,
        stage: LeadStageEnum.LOST,
        estimatedValue: 15000,
        leadScore: 40,
        lostReason: 'Competitor offered cheaper lower-grade alternate product',
        notes: 'Client prioritized lowest unit price over fabric longevity.',
        tags: ['Price Sensitive'],
        assignedStaffName: 'MD Belal Hossain',
      },
      {
        tenantId: tenant.id,
        storeId,
        name: 'Monir Hossain',
        companyName: 'Prime Decorators',
        phone: '01555667788',
        email: 'monir@primedecor.com',
        source: LeadSourceEnum.WHATSAPP,
        stage: LeadStageEnum.LOST,
        estimatedValue: 28000,
        leadScore: 45,
        lostReason: 'Needed delivery in 24 hours which was not feasible for custom printing',
        notes: 'Time constraint mismatch for specialized custom branding.',
        tags: ['Rush Order'],
        assignedStaffName: 'MD Belal Hossain',
      },
    ];

    for (const leadData of sampleLeads) {
      let existingLead = await leadRepo.findOne({
        where: { tenantId: tenant.id, phone: leadData.phone },
      });
      if (!existingLead) {
        existingLead = leadRepo.create(leadData);
        await leadRepo.save(existingLead);
        console.log(`  + Created Lead: ${leadData.name} (${leadData.stage}) - ৳${leadData.estimatedValue}`);
      } else {
        console.log(`  . Lead exists: ${leadData.name}`);
      }
    }

    // 2. Seed 5 Customers
    const sampleCustomers = [
      {
        firstName: 'Asif',
        lastName: 'Mahmud',
        phone: '01712345678',
        email: 'asif.mahmud@gmail.com',
        status: CustomerStatusEnum.ACTIVE,
        accountType: CustomerAccountTypeEnum.REGISTERED,
        source: CustomerSourceEnum.ONLINE_STORE,
        address: {
          label: 'Home',
          recipientName: 'Asif Mahmud',
          phone: '01712345678',
          addressLine1: 'House 24, Road 7, Block C',
          area: 'Dhanmondi',
          district: 'Dhaka',
          division: 'Dhaka',
          isDefault: true,
        },
        note: 'VIP customer. Prefers express weekend delivery.',
        activity: {
          eventType: 'ACCOUNT_CREATED',
          title: 'Registered Store Member',
          description: 'Customer registered via online storefront checkout.',
        },
      },
      {
        firstName: 'Nadia',
        lastName: 'Rahman',
        phone: '01819223344',
        email: 'nadia.rahman@yahoo.com',
        status: CustomerStatusEnum.ACTIVE,
        accountType: CustomerAccountTypeEnum.REGISTERED,
        source: CustomerSourceEnum.ONLINE_STORE,
        address: {
          label: 'Apartment',
          recipientName: 'Nadia Rahman',
          phone: '01819223344',
          addressLine1: 'Flat 4B, Green Tower, GEC Circle',
          area: 'Nasirabad',
          district: 'Chittagong',
          division: 'Chattogram',
          isDefault: true,
        },
        note: 'Interested in new boutique arrivals and luxury silk collections.',
        activity: {
          eventType: 'SOURCE_CONNECTED',
          title: 'Connected from Facebook Store',
          description: 'Customer connected via Social Commerce campaign.',
        },
      },
      {
        firstName: 'Tanvirul',
        lastName: 'Islam',
        phone: '01911445566',
        email: 'tanvir.islam@outlook.com',
        status: CustomerStatusEnum.GUEST,
        accountType: CustomerAccountTypeEnum.GUEST,
        source: CustomerSourceEnum.ONLINE_STORE,
        address: {
          label: 'Primary Delivery',
          recipientName: 'Tanvirul Islam',
          phone: '01911445566',
          addressLine1: 'Zindabazar Shopping Complex Road, Shop 14',
          area: 'Zindabazar',
          district: 'Sylhet',
          division: 'Sylhet',
          isDefault: true,
        },
        note: 'Guest Checkout customer with cash on delivery preference.',
        activity: {
          eventType: 'GUEST_ORDER',
          title: 'Guest Checkout Completed',
          description: 'Placed order as Guest without creating an account.',
        },
      },
      {
        firstName: 'Sabrina',
        lastName: 'Sultana',
        phone: '01612778899',
        email: 'sabrina.sultana@gmail.com',
        status: CustomerStatusEnum.ACTIVE,
        accountType: CustomerAccountTypeEnum.REGISTERED,
        source: CustomerSourceEnum.ONLINE_STORE,
        address: {
          label: 'Office',
          recipientName: 'Sabrina Sultana',
          phone: '01612778899',
          addressLine1: 'Plot 12, Sector 4, Jashimuddin Avenue',
          area: 'Uttara',
          district: 'Dhaka',
          division: 'Dhaka',
          isDefault: true,
        },
        note: 'Wholesale jewelry and accessories buyer.',
        activity: {
          eventType: 'WHATSAPP_OPTIN',
          title: 'WhatsApp Commerce Inbound',
          description: 'Customer engaged through WhatsApp business catalog.',
        },
      },
      {
        firstName: 'Mahabub',
        lastName: 'Alam',
        phone: '01511889900',
        email: 'mahabub.alam@enterprise.bd',
        status: CustomerStatusEnum.ACTIVE,
        accountType: CustomerAccountTypeEnum.REGISTERED,
        source: CustomerSourceEnum.MANUAL,
        address: {
          label: 'Store Delivery',
          recipientName: 'Mahabub Alam',
          phone: '01511889900',
          addressLine1: 'Shaheb Bazar Main Road, Holding 108',
          area: 'Shaheb Bazar',
          district: 'Rajshahi',
          division: 'Rajshahi',
          isDefault: true,
        },
        note: 'Physical Store Walk-in customer. Regular cash buyer.',
        activity: {
          eventType: 'WALKIN_PURCHASE',
          title: 'Store Walk-in Buyer',
          description: 'Added manually by merchant staff during retail walk-in purchase.',
        },
      },
    ];

    for (const custData of sampleCustomers) {
      let existingCust = await customerRepo.findOne({
        where: { tenantId: tenant.id, phone: custData.phone },
      });
      if (!existingCust) {
        existingCust = customerRepo.create({
          tenantId: tenant.id,
          storeId,
          firstName: custData.firstName,
          lastName: custData.lastName,
          phone: custData.phone,
          email: custData.email,
          status: custData.status,
          accountType: custData.accountType,
          source: custData.source,
        });
        existingCust = await customerRepo.save(existingCust);

        const addr = addressRepo.create({
          tenantId: tenant.id,
          storeId,
          customerId: existingCust.id,
          ...custData.address,
        });
        await addressRepo.save(addr);

        const note = noteRepo.create({
          tenantId: tenant.id,
          storeId,
          customerId: existingCust.id,
          authorName: 'MD Belal Hossain',
          content: custData.note,
        });
        await noteRepo.save(note);

        const act = activityRepo.create({
          tenantId: tenant.id,
          storeId,
          customerId: existingCust.id,
          eventType: custData.activity.eventType,
          title: custData.activity.title,
          description: custData.activity.description,
          actorName: 'System',
        });
        await activityRepo.save(act);

        console.log(`  + Created Customer: ${custData.firstName} ${custData.lastName} (${custData.phone})`);
      } else {
        console.log(`  . Customer exists: ${custData.firstName} ${custData.lastName}`);
      }
    }
  }

  await AppDataSource.destroy();
  console.log('\n🎉 CRM Seeding Completed Successfully!');
}

seedCrmData().catch((err) => {
  console.error('❌ CRM Seeding failed:', err);
  process.exit(1);
});
