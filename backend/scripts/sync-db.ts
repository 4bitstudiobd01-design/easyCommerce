import * as dotenv from 'dotenv';
dotenv.config();
import { AppDataSource } from '../src/database/data-source';

async function syncDb() {
  console.log('Connecting to AppDataSource...');
  await AppDataSource.initialize();
  console.log('Synchronizing schema...');
  await AppDataSource.synchronize(false);
  console.log('Schema synchronized successfully!');
  await AppDataSource.destroy();
}

syncDb().catch((err) => {
  console.error('Error synchronizing schema:', err);
  process.exit(1);
});
