import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftEntity } from '../entities/shift.entity';

@Injectable()
export class ListShiftsService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>,
  ) {}

  async execute(storeId: string): Promise<ShiftEntity[]> {
    return this.shiftRepository.find({ where: { storeId }, order: { startTime: 'ASC' } });
  }
}
