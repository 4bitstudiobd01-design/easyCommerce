import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from '../entities/holiday.entity';
import { CreateHolidayDto } from '../dto/holiday.dto';

@Injectable()
export class CreateHolidayService {
  constructor(
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateHolidayDto): Promise<HolidayEntity> {
    const existing = await this.holidayRepository.findOne({ where: { storeId, date: dto.date } });
    if (existing) {
      throw new ConflictException(`A holiday is already recorded for ${dto.date}.`);
    }

    return this.holidayRepository.save(
      this.holidayRepository.create({ tenantId, storeId, name: dto.name, date: dto.date }),
    );
  }
}
