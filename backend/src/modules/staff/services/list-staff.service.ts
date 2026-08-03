import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffMemberEntity } from '../entities/staff.entity';

@Injectable()
export class ListStaffService {
  constructor(
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
  ) {}

  async execute(storeId: string): Promise<StaffMemberEntity[]> {
    return await this.staffRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }
}
