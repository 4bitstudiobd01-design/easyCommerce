import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';
import { THEME_CATALOG } from './list-available-themes.service';

@Injectable()
export class ActivateThemeService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(
    storeId: string,
    themeId: string,
  ): Promise<{ success: boolean; message: string; activeThemeId: string }> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    const themeDef = THEME_CATALOG.find((t) => t.id === themeId);
    if (!themeDef) {
      throw new NotFoundException('Invalid theme ID.');
    }

    const unlocked = store.unlockedThemeIds || ['DEFAULT_MODERN'];
    if (!themeDef.isFree && !unlocked.includes(themeId)) {
      throw new BadRequestException(
        `Theme "${themeDef.name}" is locked. Please purchase/unlock this premium theme first.`,
      );
    }

    store.activeThemeId = themeId;
    if (themeDef.primaryColorDefault) {
      store.primaryColor = themeDef.primaryColorDefault;
    }

    await this.storeRepository.save(store);

    return {
      success: true,
      message: `Theme "${themeDef.name}" activated successfully!`,
      activeThemeId: store.activeThemeId,
    };
  }
}
