import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftEntity } from '../entities/shift.entity';
import { CreateShiftDto } from '../dto/shift.dto';

@Injectable()
export class CreateShiftService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: CreateShiftDto): Promise<ShiftEntity> {
    const existing = await this.shiftRepository.findOne({ where: { storeId, name: dto.name } });
    if (existing) {
      throw new ConflictException(`A shift named "${dto.name}" already exists.`);
    }

    return this.shiftRepository.save(
      this.shiftRepository.create({
        tenantId,
        storeId,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        colorTag: dto.colorTag ?? '#2563EB',
      }),
    );
  }
}
