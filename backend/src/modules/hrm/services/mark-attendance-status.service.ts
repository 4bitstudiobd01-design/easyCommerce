import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../entities/attendance.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { MarkAttendanceStatusDto } from '../dto/attendance.dto';

@Injectable()
export class MarkAttendanceStatusService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  /** Directly sets a day's status (Absent/On Leave/Half Day/etc.) without requiring a
   *  check-in/out — for HR corrections and days an employee never physically clocked in. */
  async execute(tenantId: string, storeId: string, markedByUserId: string, dto: MarkAttendanceStatusDto): Promise<AttendanceEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: dto.employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const existing = await this.attendanceRepository.findOne({
      where: { employeeId: dto.employeeId, date: dto.date },
    });

    if (existing) {
      existing.status = dto.status;
      existing.notes = dto.notes;
      existing.markedByUserId = markedByUserId;
      return this.attendanceRepository.save(existing);
    }

    return this.attendanceRepository.save(
      this.attendanceRepository.create({
        tenantId,
        storeId,
        employeeId: dto.employeeId,
        date: dto.date,
        status: dto.status,
        notes: dto.notes,
        markedByUserId,
      }),
    );
  }
}
