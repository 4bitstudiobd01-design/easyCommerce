import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../entities/attendance.entity';
import { CheckOutDto } from '../dto/attendance.dto';

@Injectable()
export class CheckOutService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
  ) {}

  async execute(storeId: string, markedByUserId: string, dto: CheckOutDto): Promise<AttendanceEntity> {
    const attendance = await this.attendanceRepository.findOne({
      where: { employeeId: dto.employeeId, date: dto.date, storeId },
    });

    if (!attendance || !attendance.checkInAt) {
      throw new BadRequestException('This employee has not checked in for this date yet.');
    }

    if (attendance.checkOutAt) {
      throw new BadRequestException('This employee is already checked out for this date.');
    }

    attendance.checkOutAt = new Date();
    attendance.markedByUserId = markedByUserId;
    return this.attendanceRepository.save(attendance);
  }
}
