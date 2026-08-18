import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../entities/tenant.entity';
import { StoreEntity } from '../entities/store.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { CreateStoreDto } from '../dto/create-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { EnforcePlanLimitService } from '../../billing/services/enforce-plan-limit.service';

@Injectable()
export class CreateStoreService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly enforcePlanLimitService: EnforcePlanLimitService,
  ) {}

  async execute(userId: string, dto: CreateStoreDto): Promise<StoreResponseDto> {
    const slug = dto.slug.toLowerCase().trim();

    const existingStore = await this.storeRepository.findOne({
      where: { slug },
    });

    if (existingStore) {
      throw new ConflictException(`Store slug "${slug}" is already taken. Please choose another.`);
    }

    // A user's stores all belong to the same organization (tenant) — reuse it
    // if one already exists instead of splintering every store into its own
    // tenant, which would break multi-store billing/ownership.
    const user = await this.userRepository.findOne({ where: { id: userId } });
    let tenantId = user?.tenantId;

    if (!tenantId) {
      const tenant = this.tenantRepository.create({
        name: `${dto.name} Org`,
        isActive: true,
      });
      const savedTenant = await this.tenantRepository.save(tenant);
      tenantId = savedTenant.id;

      await this.userRepository.update(userId, { tenantId });
    }

    await this.enforcePlanLimitService.assertCanCreateStore(tenantId);

    const store = this.storeRepository.create({
      name: dto.name,
      slug,
      category: dto.category,
      country: dto.country || 'Bangladesh',
      phone: dto.phone,
      address: dto.address,
      logo: dto.logo,
      ownerId: userId,
      tenantId,
      isActive: true,
    });
    const savedStore = await this.storeRepository.save(store);

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
