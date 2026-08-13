import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CustomerSourceEnum } from '../entities/customer.entity';

export interface FindOrCreateCustomerInput {
  phone: string;
  name?: string;
  email?: string;
  storeId?: string;
  source?: CustomerSourceEnum;
}

/**
 * Resolves the customer record an order belongs to, creating one on first sight.
 *
 * Checkout must never fail because of customer bookkeeping, so this is deliberately
 * forgiving: it returns null rather than throwing if resolution fails, letting the
 * order proceed with the denormalised name/phone it already carries.
 *
 * Unlike CreateCustomerService this does not throw on duplicates — an existing phone
 * is the expected case for a returning customer.
 */
@Injectable()
export class FindOrCreateCustomerService {
  private readonly logger = new Logger(FindOrCreateCustomerService.name);

  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  private splitName(name?: string): { firstName: string; lastName: string } {
    const trimmed = (name || '').trim();
    if (!trimmed) return { firstName: 'Guest', lastName: 'Customer' };

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0].slice(0, 100), lastName: '-' };

    return {
      firstName: parts.slice(0, -1).join(' ').slice(0, 100),
      lastName: parts[parts.length - 1].slice(0, 100),
    };
  }

  async execute(tenantId: string, input: FindOrCreateCustomerInput): Promise<CustomerEntity | null> {
    const phone = (input.phone || '').trim();
    if (!phone) return null;

    try {
      const existing = await this.customerRepository.findOne({
        where: { tenantId, phone },
      });

      if (existing) return existing;

      const { firstName, lastName } = this.splitName(input.name);
      const email = input.email?.trim().toLowerCase() || undefined;

      const customer = this.customerRepository.create({
        tenantId,
        storeId: input.storeId,
        firstName,
        lastName,
        email,
        phone,
        source: input.source ?? CustomerSourceEnum.ONLINE_STORE,
      });

      return await this.customerRepository.save(customer);
    } catch (err: any) {
      // A concurrent checkout for the same phone can lose the race against the
      // (tenantId, phone) unique index — re-read rather than failing the order.
      const isUniqueViolation = err?.code === '23505';
      if (isUniqueViolation) {
        const existing = await this.customerRepository.findOne({ where: { tenantId, phone } });
        if (existing) return existing;
      }

      this.logger.error(
        `Failed to resolve customer for phone ${phone} on tenant ${tenantId}: ${err?.message}`,
      );
      return null;
    }
  }
}
