import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from '../entities/holiday.entity';

@Injectable()
export class DeleteHolidayService {
  constructor(
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  async execute(storeId: string, holidayId: string): Promise<void> {
    const holiday = await this.holidayRepository.findOne({ where: { id: holidayId, storeId } });
    if (!holiday) {
      throw new NotFoundException('Holiday not found.');
    }
    await this.holidayRepository.remove(holiday);
  }
}
