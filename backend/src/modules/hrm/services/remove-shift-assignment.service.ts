import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftAssignmentEntity } from '../entities/shift-assignment.entity';

@Injectable()
export class RemoveShiftAssignmentService {
  constructor(
    @InjectRepository(ShiftAssignmentEntity)
    private readonly shiftAssignmentRepository: Repository<ShiftAssignmentEntity>,
  ) {}

  /** No-op (not an error) if no assignment exists for that cell — clearing an empty cell is a valid action. */
  async execute(storeId: string, employeeId: string, date: string): Promise<void> {
    await this.shiftAssignmentRepository.delete({ storeId, employeeId, date });
  }
}
