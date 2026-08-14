import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { FindUserByEmailService } from './services/find-user-by-email.service';
import { FindUserByIdentifierService } from './services/find-user-by-identifier.service';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { CreateUserService } from './services/create-user.service';
import { SuperAdminSeederService } from './services/super-admin-seeder.service';
import { UserController } from './user.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [
    FindUserByEmailService,
    FindUserByIdentifierService,
    FindUserByIdService,
    CreateUserService,
    SuperAdminSeederService,
    JwtAuthGuard,
  ],
  exports: [
    FindUserByEmailService,
    FindUserByIdentifierService,
    FindUserByIdService,
    CreateUserService,
    SuperAdminSeederService,
    TypeOrmModule,
  ],
})
export class UserModule {}
