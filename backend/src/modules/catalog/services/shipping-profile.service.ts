import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingProfileEntity } from '../entities/shipping-profile.entity';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShippingProfileDto {
  @ApiProperty({ example: 'Standard Delivery', description: 'Shipping profile name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Standard local shipping profile', description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: false, description: 'Default shipping profile flag', required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@Injectable()
export class CreateShippingProfileService {
  constructor(
    @InjectRepository(ShippingProfileEntity)
    private readonly shippingProfileRepository: Repository<ShippingProfileEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateShippingProfileDto): Promise<ShippingProfileEntity> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Shipping profile name is required');
    }

    const trimmedName = dto.name.trim();

    if (dto.isDefault) {
      // Unset previous defaults in tenant scope
      await this.shippingProfileRepository.update({ tenantId }, { isDefault: false });
    }

    const profile = this.shippingProfileRepository.create({
      name: trimmedName,
      description: dto.description ? dto.description.trim() : undefined,
      isDefault: Boolean(dto.isDefault),
      tenantId,
    });

    return this.shippingProfileRepository.save(profile);
  }
}

@Injectable()
export class ListShippingProfilesService {
  constructor(
    @InjectRepository(ShippingProfileEntity)
    private readonly shippingProfileRepository: Repository<ShippingProfileEntity>,
  ) {}

  async execute(tenantId: string): Promise<ShippingProfileEntity[]> {
    const profiles = await this.shippingProfileRepository.find({
      where: { tenantId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });

    // Provide default fallback profile if none exist for tenant
    if (profiles.length === 0) {
      const defaultProfile = this.shippingProfileRepository.create({
        name: 'Standard Delivery Profile',
        description: 'Default store shipping profile for physical orders',
        isDefault: true,
        tenantId,
      });
      const saved = await this.shippingProfileRepository.save(defaultProfile);
      return [saved];
    }

    return profiles;
  }
}
