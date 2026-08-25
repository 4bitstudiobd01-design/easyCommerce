import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum } from '../../entities/customer.entity';
import { CustomerSessionEntity } from '../../entities/customer-session.entity';
import { CustomerAuthResponseDto } from '../dto/customer-auth-response.dto';

@Injectable()
export class CustomerRefreshTokenService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(CustomerSessionEntity)
    private readonly sessionRepository: Repository<CustomerSessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string): Promise<CustomerAuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: { sub: string; email: string; type?: string; tenantId?: string; storeId?: string; sid?: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'bitcommerce_jwt_secret_key_change_in_prod',
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    if (payload.type !== 'customer' || !payload.sid) {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    const session = await this.sessionRepository.findOne({ where: { id: payload.sid } });

    if (!session || !session.isValid || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session has been invalidated or has expired');
    }

    const customer = await this.customerRepository.findOne({ where: { id: payload.sub } });

    if (!customer) {
      throw new UnauthorizedException('Account no longer exists');
    }

    if (customer.status === CustomerStatusEnum.BLOCKED) {
      throw new UnauthorizedException('This account has been blocked.');
    }

    const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionRepository.update(session.id, { expiresAt: nextExpiresAt });

    const nextPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer' as const,
      tenantId: customer.tenantId,
      storeId: customer.storeId,
      sid: session.id,
    };

    return {
      accessToken: this.jwtService.sign(nextPayload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(nextPayload, { expiresIn: '7d' }),
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
