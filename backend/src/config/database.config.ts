import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const enableSsl =
    configService.get<string>('DB_SSL') === 'true' ||
    (!!databaseUrl && configService.get<string>('DB_SSL') !== 'false');

  return {
    type: 'postgres',
    ...(databaseUrl
      ? { url: databaseUrl }
      : {
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username:
            configService.get<string>('DB_USER') ??
            configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'easyComerz'),
        }),
    ssl: enableSsl ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
    migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
  };
};
