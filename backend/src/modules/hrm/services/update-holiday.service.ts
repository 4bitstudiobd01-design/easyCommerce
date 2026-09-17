import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from '../entities/holiday.entity';
import { UpdateHolidayDto } from '../dto/holiday.dto';

@Injectable()
export class UpdateHolidayService {
  constructor(
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  async execute(storeId: string, holidayId: string, dto: UpdateHolidayDto): Promise<HolidayEntity> {
    const holiday = await this.holidayRepository.findOne({ where: { id: holidayId, storeId } });
    if (!holiday) {
      throw new NotFoundException('Holiday not found.');
    }

    if (dto.date && dto.date !== holiday.date) {
      const existing = await this.holidayRepository.findOne({ where: { storeId, date: dto.date } });
      if (existing) {
        throw new ConflictException(`A holiday is already recorded for ${dto.date}.`);
      }
    }

    Object.assign(holiday, dto);
    return this.holidayRepository.save(holiday);
  }
}
