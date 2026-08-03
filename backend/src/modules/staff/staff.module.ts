import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StaffMemberEntity } from './entities/staff.entity';
import { UserEntity } from '../user/entities/user.entity';
import { TenantModule } from '../tenant/tenant.module';
import { StaffController } from './staff.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { InviteStaffService } from './services/invite-staff.service';
import { ListStaffService } from './services/list-staff.service';
import { UpdateStaffPermissionsService } from './services/update-staff-permissions.service';
import { DeleteStaffService } from './services/delete-staff.service';
import { AcceptStaffInviteService } from './services/accept-staff-invite.service';
import { GetMyPermissionsService } from './services/get-my-permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffMemberEntity, UserEntity]),
    TenantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [StaffController],
  providers: [
    InviteStaffService,
    ListStaffService,
    UpdateStaffPermissionsService,
    DeleteStaffService,
    AcceptStaffInviteService,
    GetMyPermissionsService,
    JwtAuthGuard,
  ],
  exports: [
    InviteStaffService,
    ListStaffService,
    GetMyPermissionsService,
  ],
})
export class StaffModule {}
