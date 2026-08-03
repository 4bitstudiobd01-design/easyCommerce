import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { StaffMemberEntity, StaffStatusEnum } from '../entities/staff.entity';
import { AcceptStaffInviteDto } from '../dto/accept-invite.dto';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';

@Injectable()
export class AcceptStaffInviteService {
  constructor(
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(dto: AcceptStaffInviteDto): Promise<{ success: boolean; message: string }> {
    const staff = await this.staffRepository.findOne({
      where: { inviteToken: dto.token },
    });

    if (!staff) {
      throw new NotFoundException('Invalid or expired invitation token.');
    }

    if (staff.inviteExpiresAt && new Date() > new Date(staff.inviteExpiresAt)) {
      throw new BadRequestException('Invitation link has expired. Please ask your store owner for a new invitation.');
    }

    let user = await this.userRepository.findOne({
      where: { email: staff.email.toLowerCase() },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    if (!user) {
      user = this.userRepository.create({
        email: staff.email.toLowerCase(),
        passwordHash,
        fullName: staff.name,
        phone: staff.phone,
        role: UserRoleEnum.STORE_STAFF,
        tenantId: staff.tenantId,
        isActive: true,
      });
      user = await this.userRepository.save(user);
    } else {
      user.passwordHash = passwordHash;
      user.role = UserRoleEnum.STORE_STAFF;
      user.tenantId = staff.tenantId;
      await this.userRepository.save(user);
    }

    staff.userId = user.id;
    staff.status = StaffStatusEnum.ACTIVE;
    staff.inviteToken = undefined as any;
    staff.inviteExpiresAt = undefined as any;

    await this.staffRepository.save(staff);

    return {
      success: true,
      message: 'Invitation accepted successfully! You can now login with your credentials.',
    };
  }
}
