import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { HolidayEntity } from '../entities/holiday.entity';
import { ListHolidaysQueryDto } from '../dto/holiday.dto';

@Injectable()
export class ListHolidaysService {
  constructor(
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  async execute(storeId: string, query: ListHolidaysQueryDto): Promise<HolidayEntity[]> {
    const year = query.year ?? new Date().getFullYear();

    return this.holidayRepository.find({
      where: { storeId, date: Between(`${year}-01-01`, `${year}-12-31`) },
      order: { date: 'ASC' },
    });
  }
}
