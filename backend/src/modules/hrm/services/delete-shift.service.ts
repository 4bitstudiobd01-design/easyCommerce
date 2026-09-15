import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftEntity } from '../entities/shift.entity';
import { ShiftAssignmentEntity } from '../entities/shift-assignment.entity';

@Injectable()
export class DeleteShiftService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>,
    @InjectRepository(ShiftAssignmentEntity)
    private readonly shiftAssignmentRepository: Repository<ShiftAssignmentEntity>,
  ) {}

  async execute(storeId: string, shiftId: string): Promise<void> {
    const shift = await this.shiftRepository.findOne({ where: { id: shiftId, storeId } });
    if (!shift) {
      throw new NotFoundException('Shift not found.');
    }

    const assignmentCount = await this.shiftAssignmentRepository.count({ where: { shiftId } });
    if (assignmentCount > 0) {
      throw new ConflictException(
        'This shift is assigned on the roster. Reassign or clear those roster entries before deleting it.',
      );
    }

    await this.shiftRepository.remove(shift);
  }
}
