import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ShiftAssignmentEntity } from '../entities/shift-assignment.entity';
import { ShiftEntity } from '../entities/shift.entity';
import { EmployeeEntity, EmploymentStatusEnum } from '../entities/employee.entity';
import { ListRosterQueryDto } from '../dto/roster.dto';

export interface RosterResult {
  employees: EmployeeEntity[];
  shifts: ShiftEntity[];
  assignments: Array<{ employeeId: string; date: string; shiftId: string }>;
}

@Injectable()
export class ListRosterService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>,
    @InjectRepository(ShiftAssignmentEntity)
    private readonly shiftAssignmentRepository: Repository<ShiftAssignmentEntity>,
  ) {}

  async execute(storeId: string, query: ListRosterQueryDto): Promise<RosterResult> {
    const [employees, shifts, assignments] = await Promise.all([
      this.employeeRepository.find({
        where: {
          storeId,
          employmentStatus: EmploymentStatusEnum.ACTIVE,
          ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        },
        order: { fullName: 'ASC' },
      }),
      this.shiftRepository.find({ where: { storeId, isActive: true }, order: { startTime: 'ASC' } }),
      this.shiftAssignmentRepository.find({
        where: { storeId, date: Between(query.startDate, query.endDate) },
      }),
    ]);

    return {
      employees,
      shifts,
      assignments: assignments.map((a) => ({ employeeId: a.employeeId, date: a.date, shiftId: a.shiftId })),
    };
  }
}
