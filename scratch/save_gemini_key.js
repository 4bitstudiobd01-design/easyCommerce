const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
const crypto = require('crypto');

function resolveKey() {
  return crypto.createHash('sha256').update('bitcommerce_dev_secret_key_change_in_production').digest();
}
function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', resolveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return 'v1:' + iv.toString('base64') + ':' + cipher.getAuthTag().toString('base64') + ':' + encrypted.toString('base64');
}

async function updateDb() {
  const client = new Client({ connectionString: 'postgresql://postgres:123456@localhost:5433/easyComerz' });
  await client.connect();
  const rawKey = 'AQ.Ab8RN6IZKa4csooliGSKo3HJOQkp3IqIACl_hb_uPaKhYHXIOw';
  const enc = encrypt(rawKey);
  const res = await client.query(
    `UPDATE omnichannel_ai_configs 
     SET "encryptedGeminiKey" = $1, 
         "encryptedApiKey" = $1, 
         "isEnabled" = true, 
         "provider" = 'gemini', 
         "model" = 'gemini-2.5-flash' 
     WHERE "tenantId" = '8283b30b-bb45-4982-a93d-fc876d7d423d'`,
    [enc]
  );
  console.log('Saved to DB, rows updated:', res.rowCount);
  await client.end();
}

updateDb().catch(console.error);
