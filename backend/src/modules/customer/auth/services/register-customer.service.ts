import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  CustomerEntity,
  CustomerSourceEnum,
  CustomerStatusEnum,
  CustomerAccountTypeEnum,
} from '../../entities/customer.entity';
import { CustomerSessionEntity } from '../../entities/customer-session.entity';
import { CustomerRegisterDto } from '../dto/customer-register.dto';
import { CustomerAuthResponseDto } from '../dto/customer-auth-response.dto';
import { normalizeChannel } from '../../../../common/utils/normalize-channel.util';
import { getPhoneLookupVariants } from '../../../../common/utils/normalize-phone.util';

const SESSION_REFRESH_EXPIRY = '7d';
const GUEST_NAME_PLACEHOLDERS = new Set(['Guest', 'Customer']);

function addExpiry(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class RegisterCustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(CustomerSessionEntity)
    private readonly sessionRepository: Repository<CustomerSessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CustomerRegisterDto): Promise<CustomerAuthResponseDto> {
    const phone = dto.phone.trim();
    const email = dto.email.trim().toLowerCase();

    const customer = await this.findOrUpgrade(tenantId, storeId, phone, email, dto);

    return this.issueTokens(customer);
  }

  private async findOrUpgrade(
    tenantId: string,
    storeId: string,
    phone: string,
    email: string,
    dto: CustomerRegisterDto,
  ): Promise<CustomerEntity> {
    try {
      return await this.createOrUpgrade(tenantId, storeId, phone, email, dto);
    } catch (err: any) {
      // Concurrent registration for the same phone/email can lose the race
      // against the partial unique index — re-read and upgrade instead of
      // failing the request, mirroring FindOrCreateCustomerService's pattern.
      if (err?.code === '23505') {
        const phoneVariants = getPhoneLookupVariants(phone);
        const existing = await this.customerRepository.findOne({
          where: [
            { tenantId, phone: In(phoneVariants) },
            ...(email ? [{ tenantId, email }] : []),
          ],
        });
        if (existing) {
          if (existing.hasAccount) {
            throw new ConflictException('An account with this email or phone already exists.');
          }
          return this.upgradeExisting(existing, email, dto);
        }
      }
      throw err;
    }
  }

  private async createOrUpgrade(
    tenantId: string,
    storeId: string,
    phone: string,
    email: string,
    dto: CustomerRegisterDto,
  ): Promise<CustomerEntity> {
    const phoneVariants = getPhoneLookupVariants(phone);
    const existing = await this.customerRepository.findOne({
      where: [
        { tenantId, phone: In(phoneVariants) },
        ...(email ? [{ tenantId, email }] : []),
      ],
    });

    if (existing) {
      if (existing.hasAccount) {
        throw new ConflictException('An account with this email or phone already exists.');
      }
      return this.upgradeExisting(existing, email, dto);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const registrationChannel = normalizeChannel({
      requestedChannel: dto.channel,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      referrerHost: dto.referrerHost,
    });

    const created = this.customerRepository.create({
      tenantId,
      storeId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      phone,
      source: CustomerSourceEnum.ONLINE_STORE,
      passwordHash,
      hasAccount: true,
      status: CustomerStatusEnum.ACTIVE,
      accountType: CustomerAccountTypeEnum.REGISTERED,
      registrationChannel,
      registrationUtmSource: dto.utmSource,
      registrationUtmMedium: dto.utmMedium,
      registrationUtmCampaign: dto.utmCampaign,
      registrationReferrerHost: dto.referrerHost,
    });

    return this.customerRepository.save(created);
  }

  private async upgradeExisting(
    existing: CustomerEntity,
    email: string,
    dto: CustomerRegisterDto,
  ): Promise<CustomerEntity> {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    existing.passwordHash = passwordHash;
    existing.hasAccount = true;
    existing.accountType = CustomerAccountTypeEnum.REGISTERED;
    if (existing.status === CustomerStatusEnum.GUEST) {
      existing.status = CustomerStatusEnum.ACTIVE;
    }
    if (!existing.email) {
      existing.email = email;
    }

    // Preserve true first-touch attribution from the customer's original guest
    // order — only backfill if this row never captured attribution before.
    if (!existing.registrationChannel) {
      existing.registrationChannel = normalizeChannel({
        requestedChannel: dto.channel,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        referrerHost: dto.referrerHost,
      });
      existing.registrationUtmSource = dto.utmSource;
      existing.registrationUtmMedium = dto.utmMedium;
      existing.registrationUtmCampaign = dto.utmCampaign;
      existing.registrationReferrerHost = dto.referrerHost;
    }

    // Only replace the guest-checkout placeholder name with the registration
    // form's name — don't clobber a real name the customer already gave at checkout.
    if (GUEST_NAME_PLACEHOLDERS.has(existing.firstName) && GUEST_NAME_PLACEHOLDERS.has(existing.lastName)) {
      existing.firstName = dto.firstName;
      existing.lastName = dto.lastName;
    }

    return this.customerRepository.save(existing);
  }

  private async issueTokens(customer: CustomerEntity): Promise<CustomerAuthResponseDto> {
    const session = await this.sessionRepository.save(
      this.sessionRepository.create({
        customerId: customer.id,
        isValid: true,
        expiresAt: addExpiry(new Date(), 7),
      }),
    );

    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer' as const,
      tenantId: customer.tenantId,
      storeId: customer.storeId,
      sid: session.id,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: SESSION_REFRESH_EXPIRY });

    return {
      accessToken,
      refreshToken,
      user: {
        id: customer.id,
        email: customer.email as string,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
    };
  }
}
