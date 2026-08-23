require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'easyComerz',
  });

  await client.connect();
  console.log('Connected to PostgreSQL.');

  // Enable uuid extension
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Create enum types if not exists
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "users_role_enum" AS ENUM ('SUPER_ADMIN', 'STORE_OWNER', 'STORE_STAFF', 'CUSTOMER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create users table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "email" varchar(255) NOT NULL UNIQUE,
      "passwordHash" varchar(255) NOT NULL,
      "fullName" varchar(255) NOT NULL,
      "phone" varchar(50),
      "role" "users_role_enum" NOT NULL DEFAULT 'CUSTOMER',
      "isActive" boolean NOT NULL DEFAULT true,
      "tenantId" uuid,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    );
  `);

  // Create super admin
  const adminEmail = 'admin@bitcommerce.com';
  const adminPassword = 'AdminPassword123!';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
  if (adminCheck.rows.length === 0) {
    await client.query(`
      INSERT INTO users ("email", "passwordHash", "fullName", "phone", "role", "isActive")
      VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', true)
    `, [adminEmail, adminHash, 'Platform Super Admin', '+8801700000000']);
    console.log('Super Admin user created successfully.');
  } else {
    await client.query(`
      UPDATE users SET "passwordHash" = $1, "role" = 'SUPER_ADMIN', "isActive" = true WHERE email = $2
    `, [adminHash, adminEmail]);
    console.log('Super Admin user updated successfully.');
  }

  // Create store owner
  const merchantEmail = 'belal@bitcommerce.app';
  const merchantPassword = 'Password123!';
  const merchantHash = await bcrypt.hash(merchantPassword, 10);

  const merchantCheck = await client.query('SELECT * FROM users WHERE email = $1', [merchantEmail]);
  if (merchantCheck.rows.length === 0) {
    await client.query(`
      INSERT INTO users ("email", "passwordHash", "fullName", "phone", "role", "isActive")
      VALUES ($1, $2, $3, $4, 'STORE_OWNER', true)
    `, [merchantEmail, merchantHash, 'MD Belal Hossain', '+8801711223344']);
    console.log('Store Owner user created successfully.');
  } else {
    await client.query(`
      UPDATE users SET "passwordHash" = $1, "role" = 'STORE_OWNER', "isActive" = true WHERE email = $2
    `, [merchantHash, merchantEmail]);
    console.log('Store Owner user updated successfully.');
  }

  const allUsers = await client.query('SELECT id, email, role, "isActive" FROM users');
  console.log('Current users in DB:', allUsers.rows);

  await client.end();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
