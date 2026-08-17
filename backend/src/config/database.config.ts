import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  // .env and .env.example both use DB_USER; DB_USERNAME is accepted as a legacy
  // alias so existing environments keep working. Reading only DB_USERNAME meant a
  // configured DB_USER was ignored and the connection silently fell back to 'postgres'.
  username:
    configService.get<string>('DB_USER') ??
    configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_NAME', 'bitcommerce'),
  autoLoadEntities: true,
  synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
  migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
});
