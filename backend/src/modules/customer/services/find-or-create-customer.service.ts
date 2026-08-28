import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum, CustomerSourceEnum } from '../entities/customer.entity';
import { CustomerAddressEntity } from '../entities/customer-address.entity';
import { getPhoneLookupVariants } from '../../../common/utils/normalize-phone.util';

export interface FindOrCreateCustomerInput {
  phone: string;
  name?: string;
  email?: string;
  storeId?: string;
  source?: CustomerSourceEnum;
  userId?: string;
  isGuest?: boolean;
  address?: {
    recipientName?: string;
    phone?: string;
    addressLine1: string;
    city: string;
  };
}

/**
 * Resolves the customer record an order belongs to, creating or updating one on first sight.
 *
 * Uniqueness is strictly keyed on (tenantId, phone).
 * If the user is logged in (has userId or isGuest=false), accountType is REGISTERED and status is ACTIVE.
 * If the user checks out without login (isGuest=true), accountType is GUEST and status is GUEST.
 *
 * Checkout must never fail because of customer bookkeeping, so this is deliberately
 * forgiving: it returns null rather than throwing if resolution fails, letting the
 * order proceed with the denormalised name/phone it already carries.
 */
@Injectable()
export class FindOrCreateCustomerService {
  private readonly logger = new Logger(FindOrCreateCustomerService.name);

  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(CustomerAddressEntity)
    private readonly addressRepository: Repository<CustomerAddressEntity>,
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

    const isLoggedIn = Boolean(input.userId) || input.isGuest === false;
    const { firstName, lastName } = this.splitName(input.name);
    const email = input.email?.trim().toLowerCase() || undefined;

    let customer: CustomerEntity | null = null;

    try {
      const phoneVariants = getPhoneLookupVariants(phone);
      const existing = await this.customerRepository.findOne({
        where: { tenantId, phone: In(phoneVariants) },
      });

      if (existing) {
        let changed = false;

        // If existing had placeholder name and now a real name is provided, update
        if ((existing.firstName === 'Guest' || !existing.firstName) && firstName !== 'Guest') {
          existing.firstName = firstName;
          existing.lastName = lastName;
          changed = true;
        }

        // If existing had no email and email is provided
        if (!existing.email && email) {
          existing.email = email;
          changed = true;
        }

        // If customer just logged in, upgrade from GUEST to REGISTERED / ACTIVE
        if (isLoggedIn) {
          if (input.userId && !existing.userId) {
            existing.userId = input.userId;
            changed = true;
          }
          if (existing.accountType === CustomerAccountTypeEnum.GUEST || !existing.accountType) {
            existing.accountType = CustomerAccountTypeEnum.REGISTERED;
            changed = true;
          }
          if (existing.status === CustomerStatusEnum.GUEST) {
            existing.status = CustomerStatusEnum.ACTIVE;
            changed = true;
          }
        }

        if (changed) {
          customer = await this.customerRepository.save(existing);
        } else {
          customer = existing;
        }
      } else {
        // Create new customer
        const status = isLoggedIn ? CustomerStatusEnum.ACTIVE : CustomerStatusEnum.GUEST;
        const accountType = isLoggedIn ? CustomerAccountTypeEnum.REGISTERED : CustomerAccountTypeEnum.GUEST;

        const newCustomer = this.customerRepository.create({
          tenantId,
          storeId: input.storeId,
          userId: input.userId,
          firstName,
          lastName,
          email,
          phone,
          status,
          accountType,
          hasAccount: isLoggedIn,
          source: input.source ?? CustomerSourceEnum.ONLINE_STORE,
        });

        customer = await this.customerRepository.save(newCustomer);
      }

      // Automatically persist shipping address if provided
      if (customer && input.address?.addressLine1) {
        await this.syncAddress(tenantId, customer.id, input, input.address);
      }

      return customer;
    } catch (err: any) {
      // A concurrent checkout for the same phone can lose the race against the
      // (tenantId, phone) unique index — re-read rather than failing the order.
      const isUniqueViolation = err?.code === '23505';
      if (isUniqueViolation) {
        const phoneVariants = getPhoneLookupVariants(phone);
        const fallback = await this.customerRepository.findOne({ where: { tenantId, phone: In(phoneVariants) } });
        if (fallback) return fallback;
      }

      this.logger.error(
        `Failed to resolve customer for phone ${phone} on tenant ${tenantId}: ${err?.message}`,
      );
      return null;
    }
  }

  private async syncAddress(
    tenantId: string,
    customerId: string,
    input: FindOrCreateCustomerInput,
    addr: { recipientName?: string; phone?: string; addressLine1: string; city: string },
  ): Promise<void> {
    try {
      const existingAddr = await this.addressRepository.findOne({
        where: {
          tenantId,
          customerId,
          addressLine1: addr.addressLine1.trim(),
        },
      });

      if (!existingAddr) {
        const address = this.addressRepository.create({
          tenantId,
          storeId: input.storeId,
          customerId,
          label: 'Shipping',
          recipientName: addr.recipientName || input.name || 'Customer',
          phone: addr.phone || input.phone,
          addressLine1: addr.addressLine1.trim(),
          city: addr.city?.trim() || 'Dhaka',
          country: 'Bangladesh',
          isDefault: true,
        });
        await this.addressRepository.save(address);
      }
    } catch (err) {
      // Best-effort address sync; never block checkout
    }
  }
}
