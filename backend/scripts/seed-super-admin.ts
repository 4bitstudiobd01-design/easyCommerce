import * as dotenv from 'dotenv';
dotenv.config();
import { AppDataSource } from '../src/database/data-source';
import { UserEntity, UserRoleEnum } from '../src/modules/user/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function main() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Connected! Synchronizing schema...');
  await AppDataSource.synchronize();
  console.log('Schema synchronized.');

  const userRepo = AppDataSource.getRepository(UserEntity);

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@bitcommerce.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'AdminPassword123!';

  let superAdmin = await userRepo.findOne({ where: { email: superAdminEmail } });
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

  if (!superAdmin) {
    superAdmin = userRepo.create({
      email: superAdminEmail,
      fullName: 'Platform Admin',
      passwordHash: superAdminHash,
      phone: '+8801700000000',
      role: UserRoleEnum.SUPER_ADMIN,
      isActive: true,
    });
  } else {
    superAdmin.passwordHash = superAdminHash;
    superAdmin.role = UserRoleEnum.SUPER_ADMIN;
    superAdmin.isActive = true;
  }
  await userRepo.save(superAdmin);
  console.log('SUCCESS: Super Admin created/updated.');

  // Also ensure demo store owner exists
  const merchantEmail = 'belal@bitcommerce.app';
  const merchantPassword = 'Password123!';
  let merchant = await userRepo.findOne({ where: { email: merchantEmail } });
  const merchantHash = await bcrypt.hash(merchantPassword, 10);

  if (!merchant) {
    merchant = userRepo.create({
      email: merchantEmail,
      fullName: 'MD Belal Hossain',
      passwordHash: merchantHash,
      phone: '+8801711223344',
      role: UserRoleEnum.STORE_OWNER,
      isActive: true,
    });
  } else {
    merchant.passwordHash = merchantHash;
    merchant.role = UserRoleEnum.STORE_OWNER;
    merchant.isActive = true;
  }
  await userRepo.save(merchant);
  console.log('SUCCESS: Store Owner created/updated.');

  await AppDataSource.destroy();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
