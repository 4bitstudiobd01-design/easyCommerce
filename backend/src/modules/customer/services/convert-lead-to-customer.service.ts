import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity, LeadStageEnum } from '../entities/lead.entity';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum, CustomerSourceEnum } from '../entities/customer.entity';
import { RecordCustomerActivityService } from './record-customer-activity.service';

@Injectable()
export class ConvertLeadToCustomerService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly recordCustomerActivityService: RecordCustomerActivityService,
  ) {}

  private splitName(name: string): { firstName: string; lastName: string } {
    const trimmed = (name || '').trim();
    if (!trimmed) return { firstName: 'Valued', lastName: 'Customer' };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0].slice(0, 100), lastName: '-' };
    return {
      firstName: parts.slice(0, -1).join(' ').slice(0, 100),
      lastName: parts[parts.length - 1].slice(0, 100),
    };
  }

  async execute(
    leadId: string,
    tenantId: string,
    storeId?: string,
  ): Promise<CustomerEntity> {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId, tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${leadId}" not found`);
    }

    const phone = lead.phone.trim();
    let customer = await this.customerRepository.findOne({
      where: { tenantId, phone },
    });

    const { firstName, lastName } = this.splitName(lead.name);

    if (customer) {
      // Update existing customer
      if (customer.firstName === 'Guest' || !customer.firstName) {
        customer.firstName = firstName;
        customer.lastName = lastName;
      }
      if (lead.email && !customer.email) {
        customer.email = lead.email.trim().toLowerCase();
      }
      if (customer.status === CustomerStatusEnum.GUEST) {
        customer.status = CustomerStatusEnum.ACTIVE;
        customer.accountType = CustomerAccountTypeEnum.REGISTERED;
      }
      customer = await this.customerRepository.save(customer);
    } else {
      // Create new active customer
      const newCustomer = this.customerRepository.create({
        tenantId,
        storeId: storeId || lead.storeId,
        firstName,
        lastName,
        email: lead.email ? lead.email.trim().toLowerCase() : undefined,
        phone,
        status: CustomerStatusEnum.ACTIVE,
        accountType: CustomerAccountTypeEnum.REGISTERED,
        source: CustomerSourceEnum.ONLINE_STORE,
      });
      customer = await this.customerRepository.save(newCustomer);
    }

    // Mark lead as WON
    lead.stage = LeadStageEnum.WON;
    await this.leadRepository.save(lead);

    // Record activity
    try {
      await this.recordCustomerActivityService.execute({
        tenantId,
        storeId: storeId || lead.storeId,
        customerId: customer.id,
        eventType: 'LEAD_CONVERTED',
        title: 'Converted from Sales Lead',
        description: `Lead "${lead.name}" (${lead.companyName || 'Individual'}) was converted into an active customer.`,
        actorName: 'Merchant Staff',
        metadata: {
          leadId: lead.id,
          leadName: lead.name,
          companyName: lead.companyName,
          estimatedValue: lead.estimatedValue,
        },
      });
    } catch {
      // Non-blocking activity
    }

    return customer;
  }
}
