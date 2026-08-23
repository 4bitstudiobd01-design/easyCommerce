import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FindUserByEmailService } from '../../user/services/find-user-by-email.service';
import { CreateUserService } from '../../user/services/create-user.service';
import { CreateStoreService } from '../../tenant/services/create-store.service';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { RegisterMerchantDto } from '../dto/register-merchant.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { normalizePhone } from '../../../common/utils/normalize-phone.util';

@Injectable()
export class RegisterMerchantService {
  constructor(
    private readonly findUserByEmailService: FindUserByEmailService,
    private readonly createUserService: CreateUserService,
    private readonly createStoreService: CreateStoreService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterMerchantDto): Promise<AuthResponseDto> {
    const existingUser = await this.findUserByEmailService.execute(dto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const savedUser = await this.createUserService.execute({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone ? normalizePhone(dto.phone) : undefined,
      role: UserRoleEnum.STORE_OWNER,
      isActive: true,
    });

    const storeName = dto.storeName?.trim();
    if (storeName) {
      const slug = (dto.subdomain?.trim() || storeName)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `store-${Date.now()}`;

      try {
        await this.createStoreService.execute(savedUser.id, {
          name: storeName,
          slug,
          category: dto.category || 'Fashion & Apparel',
          phone: dto.phone,
          address: dto.address,
        });
      } catch (storeErr) {
        // Non-blocking fallback: if slug already exists or store fails, user can complete in onboarding
      }
    }

    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: savedUser.role,
      },
    };
  }
}
