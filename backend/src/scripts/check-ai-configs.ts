import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'easyComerz',
  synchronize: false,
});

async function main() {
  await dataSource.initialize();
  const configs = await dataSource.query(`SELECT id, "tenantId", "isEnabled", provider, model, "encryptedApiKey", "triggerMode" FROM omnichannel_ai_configs`);
  console.log('--- AI CONFIGS ---');
  console.log(JSON.stringify(configs, null, 2));

  await dataSource.destroy();
}

main().catch(console.error);
