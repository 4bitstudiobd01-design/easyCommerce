const { DataSource } = require('typeorm');
require('dotenv').config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bitcommerce',
});

async function clear() {
  await AppDataSource.initialize();
  await AppDataSource.query('TRUNCATE TABLE orders CASCADE');
  await AppDataSource.destroy();
  console.log('Orders cleared');
}
clear();
