import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerEntity,
  CustomerStatusEnum,
  CustomerAccountTypeEnum,
  CustomerSourceEnum,
} from '../entities/customer.entity';
import { CustomerAddressEntity } from '../entities/customer-address.entity';
import { CustomerNoteEntity } from '../entities/customer-note.entity';
import { CustomerActivityEntity } from '../entities/customer-activity.entity';

@Injectable()
export class SeedCustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(CustomerAddressEntity)
    private readonly addressRepository: Repository<CustomerAddressEntity>,
    @InjectRepository(CustomerNoteEntity)
    private readonly noteRepository: Repository<CustomerNoteEntity>,
    @InjectRepository(CustomerActivityEntity)
    private readonly activityRepository: Repository<CustomerActivityEntity>,
  ) {}

  async execute(tenantId: string, storeId?: string): Promise<CustomerEntity[]> {
    const customersData = [
      {
        firstName: 'Asif',
        lastName: 'Mahmud',
        phone: '01712345678',
        email: 'asif.mahmud@gmail.com',
        status: CustomerStatusEnum.ACTIVE,
        accountType: CustomerAccountTypeEnum.REGISTERED,
        source: CustomerSourceEnum.ONLINE_STORE,
        registrationChannel: 'social',
        registrationUtmSource: 'facebook',
        registrationUtmCampaign: 'eid_fashion_collection',
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
        registrationChannel: 'social',
        registrationUtmSource: 'instagram',
        registrationUtmCampaign: 'luxury_silk_drop',
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
        registrationChannel: 'social',
        registrationUtmSource: 'tiktok',
        registrationUtmCampaign: 'viral_gadgets_2026',
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
        registrationChannel: 'paid_search',
        registrationUtmSource: 'google',
        registrationUtmCampaign: 'wholesale_jewelry_bd',
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
        registrationChannel: 'direct',
        registrationUtmSource: 'direct',
        registrationUtmCampaign: 'store_walkin',
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

    const seededCustomers: CustomerEntity[] = [];

    for (const item of customersData) {
      let customer = await this.customerRepository.findOne({
        where: { tenantId, phone: item.phone },
      });

      if (!customer) {
        customer = this.customerRepository.create({
          tenantId,
          storeId,
          firstName: item.firstName,
          lastName: item.lastName,
          phone: item.phone,
          email: item.email,
          status: item.status,
          accountType: item.accountType,
          source: item.source,
          registrationChannel: item.registrationChannel,
          registrationUtmSource: item.registrationUtmSource,
          registrationUtmCampaign: item.registrationUtmCampaign,
        });
        customer = await this.customerRepository.save(customer);

        // Seed address
        const address = this.addressRepository.create({
          tenantId,
          storeId,
          customerId: customer.id,
          ...item.address,
        });
        await this.addressRepository.save(address);

        // Seed internal note
        const note = this.noteRepository.create({
          tenantId,
          storeId,
          customerId: customer.id,
          authorName: 'MD Belal Hossain',
          content: item.note,
        });
        await this.noteRepository.save(note);

        // Seed activity timeline
        const activity = this.activityRepository.create({
          tenantId,
          storeId,
          customerId: customer.id,
          eventType: item.activity.eventType,
          title: item.activity.title,
          description: item.activity.description,
          actorName: 'System',
        });
        await this.activityRepository.save(activity);
      }

      seededCustomers.push(customer);
    }

    return seededCustomers;
  }
}
