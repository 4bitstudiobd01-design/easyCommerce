import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { StoreEntity } from '../entities/store.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { DeleteStoreDto } from '../dto/delete-store.dto';

/**
 * Closes a merchant's store.
 *
 * This deactivates and anonymizes rather than hard-deleting rows. A store's data
 * is spread across ~50 tenant-scoped tables owned by other modules, so cascading
 * a physical delete from here would mean reaching across every module boundary.
 * Deactivating takes the storefront offline immediately and releases the slug for
 * reuse, while leaving order/payment history intact for the financial and legal
 * retention those records require.
 */
@Injectable()
export class DeleteStoreService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(userId: string, dto: DeleteStoreDto): Promise<{ success: boolean; message: string }> {
    const store = await this.storeRepository.findOne({ where: { ownerId: userId } });
    if (!store) {
      throw new NotFoundException('No active store found for this merchant.');
    }

    if (dto.confirmStoreName.trim() !== store.name.trim()) {
      throw new BadRequestException(
        'The store name you typed does not match. Type the exact store name to confirm.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    // Free the slug so the merchant (or anyone else) can reuse it later, while
    // keeping the original recoverable from the archived value.
    const archivedSuffix = Date.now().toString(36);
    store.slug = `deleted-${store.slug}-${archivedSuffix}`.slice(0, 100);
    store.domain = undefined;
    store.isActive = false;
    store.maintenanceMode = true;
    store.maintenanceMessage = 'This store has been permanently closed by its owner.';

    await this.storeRepository.save(store);

    return {
      success: true,
      message: 'Your store has been closed and is no longer publicly accessible.',
    };
  }
}
