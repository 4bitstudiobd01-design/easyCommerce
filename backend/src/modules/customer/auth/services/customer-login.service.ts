import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CustomerEntity, CustomerStatusEnum } from '../../entities/customer.entity';
import { CustomerSessionEntity } from '../../entities/customer-session.entity';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { CustomerAuthResponseDto } from '../dto/customer-auth-response.dto';

const SESSION_REFRESH_EXPIRY = '7d';
const REMEMBERED_REFRESH_EXPIRY = '30d';

function addExpiry(base: Date, remembered: boolean): Date {
  const days = remembered ? 30 : 7;
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class CustomerLoginService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(CustomerSessionEntity)
    private readonly sessionRepository: Repository<CustomerSessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async execute(tenantId: string, dto: CustomerLoginDto): Promise<CustomerAuthResponseDto> {
    const email = dto.email.trim().toLowerCase();

    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .addSelect('customer.passwordHash')
      .where('customer.tenantId = :tenantId', { tenantId })
      .andWhere('customer.email = :email', { email })
      .andWhere('customer.hasAccount = true')
      .getOne();

    if (!customer || !customer.passwordHash) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    if (customer.status === CustomerStatusEnum.BLOCKED) {
      throw new UnauthorizedException('This account has been blocked.');
    }

    const refreshExpiry = dto.rememberMe ? REMEMBERED_REFRESH_EXPIRY : SESSION_REFRESH_EXPIRY;

    const session = await this.sessionRepository.save(
      this.sessionRepository.create({
        customerId: customer.id,
        isValid: true,
        expiresAt: addExpiry(new Date(), Boolean(dto.rememberMe)),
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
    const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshExpiry });

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
