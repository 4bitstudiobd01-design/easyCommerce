import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRoleEnum } from '../entities/user.entity';

@Injectable()
export class SuperAdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminSeederService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedSuperAdmin();
    } catch (err: any) {
      this.logger.warn(`Super Admin seeder note: ${err?.message}`);
    }
  }

  async seedSuperAdmin() {
    const adminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL', 'admin@bitcommerce.com');
    const rawPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD', 'AdminPassword123!');

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const superAdmin = this.userRepository.create({
        email: adminEmail,
        passwordHash,
        fullName: 'BitCommerce Super Admin',
        role: UserRoleEnum.SUPER_ADMIN,
        isActive: true,
      });

      await this.userRepository.save(superAdmin);
      this.logger.log(`Super Admin user seeded dynamically from environment (.env)! Email: ${adminEmail}`);
    } else {
      this.logger.log(`Super Admin user already exists: ${adminEmail}`);
    }
  }
}
