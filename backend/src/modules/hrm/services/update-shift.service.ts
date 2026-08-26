import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftEntity } from '../entities/shift.entity';
import { UpdateShiftDto } from '../dto/shift.dto';

@Injectable()
export class UpdateShiftService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>,
  ) {}

  async execute(storeId: string, shiftId: string, dto: UpdateShiftDto): Promise<ShiftEntity> {
    const shift = await this.shiftRepository.findOne({ where: { id: shiftId, storeId } });
    if (!shift) {
      throw new NotFoundException('Shift not found.');
    }

    if (dto.name && dto.name !== shift.name) {
      const existing = await this.shiftRepository.findOne({ where: { storeId, name: dto.name } });
      if (existing) {
        throw new ConflictException(`A shift named "${dto.name}" already exists.`);
      }
    }

    Object.assign(shift, dto);
    return this.shiftRepository.save(shift);
  }
}
