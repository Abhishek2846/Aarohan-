const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres@localhost:5432/bhoomiSetuDb?schema=public';

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto
  .createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || 'bhoomi-setu-enterprise-pii-secret-key-32bytes')
  .digest();

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text).trim(), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function decrypt(buf) {
  if (!buf || buf.length < 28) return null;
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encryptedText = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encryptedText) + decipher.final('utf8');
}

async function main() {
  console.log('🔒 Migrating and Encrypting PII Data-at-Rest in PostgreSQL...');
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const SAMPLE_NAMES = [
      'Rameshwar Sharma',
      'Suresh Patil',
      'Meenakshi Sundaram',
      'Anand Kumar Rao',
      'Lakshmi Narayana',
      'Devendra Singh',
      'Sunita Devi',
      'Basavaraj Bommai',
    ];

    // 1. Beneficiaries
    const resB = await client.query('SELECT beneficiary_id, masked_name, bank_account_last4 FROM beneficiaries');
    console.log(`Found ${resB.rows.length} beneficiaries to encrypt`);

    for (let i = 0; i < resB.rows.length; i++) {
      const b = resB.rows[i];
      const legalName = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
      const rawAadhaar = `98765432${String(1000 + i).padStart(4, '0')}`;
      const last4 = b.bank_account_last4 || String(1000 + i);
      const rawBankAccount = `5010042918${last4}`;

      const encName = encrypt(legalName);
      const encAadhaar = encrypt(rawAadhaar);
      const encBank = encrypt(rawBankAccount);

      await client.query(
        `UPDATE beneficiaries
         SET encrypted_legal_name = $1,
             identity_token = $2,
             bank_account_token = $3,
             bank_account_last4 = $4
         WHERE beneficiary_id = $5`,
        [encName, encAadhaar, encBank, last4, b.beneficiary_id]
      );
      console.log(`  ✅ Encrypted beneficiary ${b.beneficiary_id} (${legalName})`);
    }

    // 2. Parcel Owners
    const resO = await client.query('SELECT parcel_owner_id, masked_name FROM parcel_owners');
    console.log(`Found ${resO.rows.length} parcel owners to encrypt`);

    for (let i = 0; i < resO.rows.length; i++) {
      const o = resO.rows[i];
      const legalName = SAMPLE_NAMES[(i + 2) % SAMPLE_NAMES.length];
      const rawAadhaar = `76543210${String(2000 + i).padStart(4, '0')}`;
      const rawPhone = `+91 98765 ${String(40000 + i).slice(0, 5)}`;

      const encName = encrypt(legalName);
      const encAadhaar = encrypt(rawAadhaar);
      const encPhone = encrypt(rawPhone);

      await client.query(
        `UPDATE parcel_owners
         SET encrypted_legal_name = $1,
             identity_token = $2,
             encrypted_phone = $3
         WHERE parcel_owner_id = $4`,
        [encName, encAadhaar, encPhone, o.parcel_owner_id]
      );
      console.log(`  ✅ Encrypted parcel owner ${o.parcel_owner_id} (${legalName})`);
    }

    // 3. Cryptographic Verification
    console.log('\n🔍 Verifying cryptographic integrity...');
    const verifyRes = await client.query(
      'SELECT beneficiary_id, identity_token, bank_account_token, encrypted_legal_name FROM beneficiaries LIMIT 1'
    );
    if (verifyRes.rows.length > 0) {
      const row = verifyRes.rows[0];
      const decAadhaar = decrypt(row.identity_token);
      const decBank = decrypt(row.bank_account_token);
      const decName = decrypt(row.encrypted_legal_name);
      console.log('Sample Beneficiary Verification:');
      console.log('  Identity Token Ciphertext Length (bytes):', row.identity_token ? row.identity_token.length : 0);
      console.log('  Decrypted Aadhaar:', decAadhaar);
      console.log('  Decrypted Bank Account:', decBank);
      console.log('  Decrypted Legal Name:', decName);
    }

    console.log('\n🎉 PII Encryption Migration Complete!');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('Error migrating PII encryption:', e);
  process.exit(1);
});
