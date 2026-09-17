import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity, EmploymentStatusEnum } from '../entities/employee.entity';
import { AttendanceEntity } from '../entities/attendance.entity';
import { ListAttendanceQueryDto } from '../dto/attendance.dto';

export interface AttendanceRosterRow {
  employee: EmployeeEntity;
  attendance: AttendanceEntity | null;
}

@Injectable()
export class ListAttendanceService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
  ) {}

  async execute(storeId: string, query: ListAttendanceQueryDto): Promise<AttendanceRosterRow[]> {
    const date = query.date ?? new Date().toISOString().slice(0, 10);

    const employeeQb = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('employee.storeId = :storeId', { storeId })
      .andWhere('employee.employmentStatus != :terminated', { terminated: EmploymentStatusEnum.TERMINATED });

    if (query.departmentId) {
      employeeQb.andWhere('employee.departmentId = :departmentId', { departmentId: query.departmentId });
    }

    const employees = await employeeQb.orderBy('employee.fullName', 'ASC').getMany();

    if (employees.length === 0) return [];

    const attendanceRecords = await this.attendanceRepository.find({ where: { storeId, date } });

    const attendanceByEmployeeId = new Map(attendanceRecords.map((a) => [a.employeeId, a]));

    return employees.map((employee) => ({
      employee,
      attendance: attendanceByEmployeeId.get(employee.id) ?? null,
    }));
  }
}
