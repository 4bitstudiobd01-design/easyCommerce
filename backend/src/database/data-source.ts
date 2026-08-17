import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';

const isDev = process.env.NODE_ENV === 'development';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  // .env and .env.example both use DB_USER; DB_USERNAME is accepted as a legacy
  // alias so existing environments keep working. Reading only DB_USERNAME meant a
  // configured DB_USER was ignored and the connection silently fell back to 'postgres'.
  username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bitcommerce',

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',

  synchronize: false,
  logging: isDev,
});
