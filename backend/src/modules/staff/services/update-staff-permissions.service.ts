import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffMemberEntity } from '../entities/staff.entity';
import { UpdateStaffPermissionsDto } from '../dto/update-staff.dto';

@Injectable()
export class UpdateStaffPermissionsService {
  constructor(
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
  ) {}

  async execute(
    storeId: string,
    staffId: string,
    dto: UpdateStaffPermissionsDto,
  ): Promise<StaffMemberEntity> {
    const staff = await this.staffRepository.findOne({
      where: { id: staffId, storeId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    if (dto.role !== undefined) staff.role = dto.role;
    if (dto.permissions !== undefined) staff.permissions = dto.permissions;
    if (dto.status !== undefined) staff.status = dto.status;

    return await this.staffRepository.save(staff);
  }
}
