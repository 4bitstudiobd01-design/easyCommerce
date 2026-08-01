import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../entities/tenant.entity';
import { StoreEntity } from '../entities/store.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { CreateStoreDto } from '../dto/create-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';

@Injectable()
export class CreateStoreService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(userId: string, dto: CreateStoreDto): Promise<StoreResponseDto> {
    const slug = dto.slug.toLowerCase().trim();

    const existingStore = await this.storeRepository.findOne({
      where: { slug },
    });

    if (existingStore) {
      throw new ConflictException(`Store slug "${slug}" is already taken. Please choose another.`);
    }

    const tenant = this.tenantRepository.create({
      name: `${dto.name} Org`,
      isActive: true,
    });
    const savedTenant = await this.tenantRepository.save(tenant);

    const store = this.storeRepository.create({
      name: dto.name,
      slug,
      category: dto.category,
      phone: dto.phone,
      address: dto.address,
      logo: dto.logo,
      ownerId: userId,
      tenantId: savedTenant.id,
      isActive: true,
    });
    const savedStore = await this.storeRepository.save(store);

    await this.userRepository.update(userId, {
      tenantId: savedTenant.id,
    });

    return {
      id: savedStore.id,
      name: savedStore.name,
      slug: savedStore.slug,
      category: savedStore.category,
      phone: savedStore.phone,
      currency: savedStore.currency,
      ownerId: savedStore.ownerId,
      tenantId: savedStore.tenantId,
    };
  }
}
