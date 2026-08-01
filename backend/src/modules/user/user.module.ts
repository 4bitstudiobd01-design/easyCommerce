import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { FindUserByEmailService } from './services/find-user-by-email.service';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { CreateUserService } from './services/create-user.service';
import { SuperAdminSeederService } from './services/super-admin-seeder.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, SessionEntity])],
  controllers: [UserController],
  providers: [
    FindUserByEmailService,
    FindUserByIdService,
    CreateUserService,
    SuperAdminSeederService,
  ],
  exports: [
    FindUserByEmailService,
    FindUserByIdService,
    CreateUserService,
    SuperAdminSeederService,
    TypeOrmModule,
  ],
})
export class UserModule {}
