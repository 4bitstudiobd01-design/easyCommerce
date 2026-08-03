import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffMemberEntity } from '../entities/staff.entity';

@Injectable()
export class DeleteStaffService {
  constructor(
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
  ) {}

  async execute(storeId: string, staffId: string): Promise<void> {
    const staff = await this.staffRepository.findOne({
      where: { id: staffId, storeId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    await this.staffRepository.remove(staff);
  }
}
