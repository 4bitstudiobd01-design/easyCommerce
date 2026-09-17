import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity, AttendanceStatusEnum } from '../entities/attendance.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { CheckInDto } from '../dto/attendance.dto';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, markedByUserId: string, dto: CheckInDto): Promise<AttendanceEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: dto.employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const existing = await this.attendanceRepository.findOne({
      where: { employeeId: dto.employeeId, date: dto.date },
    });

    if (existing?.checkInAt) {
      throw new ConflictException('This employee is already checked in for this date.');
    }

    if (existing) {
      existing.checkInAt = new Date();
      existing.status = AttendanceStatusEnum.PRESENT;
      existing.markedByUserId = markedByUserId;
      return this.attendanceRepository.save(existing);
    }

    return this.attendanceRepository.save(
      this.attendanceRepository.create({
        tenantId,
        storeId,
        employeeId: dto.employeeId,
        date: dto.date,
        status: AttendanceStatusEnum.PRESENT,
        checkInAt: new Date(),
        markedByUserId,
      }),
    );
  }
}
