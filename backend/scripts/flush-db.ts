import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../src/database/data-source';

async function flushDatabase() {
  console.log('⚡ BitCommerce Database Flush Utility');
  console.log('----------------------------------------');

  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: Cannot flush database in production mode!');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected.');

    console.log('🗑️  Dropping and recreating public schema (CASCADE)...');
    await AppDataSource.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await AppDataSource.query('CREATE SCHEMA public;');
    await AppDataSource.query('GRANT ALL ON SCHEMA public TO public;');
    await AppDataSource.query('GRANT ALL ON SCHEMA public TO postgres;');
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('✅ Schema and UUID extensions initialized.');

    console.log('🔄 Synchronizing entities into fresh database schema...');
    await AppDataSource.synchronize(false);
    console.log('✅ All entity tables, relations, and indexes created cleanly!');

    await AppDataSource.destroy();
    console.log('🎉 Database flush complete!');
  } catch (error) {
    console.error('❌ Database flush failed:', error);
    process.exit(1);
  }
}

flushDatabase();
