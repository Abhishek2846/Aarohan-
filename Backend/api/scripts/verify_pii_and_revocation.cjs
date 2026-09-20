// PII Encryption & JWT Session Revocation Test Suite for BhoomiSetu
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
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

function decrypt(buf) {
  if (!buf || buf.length < 28) return null;
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encryptedText = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encryptedText) + decipher.final('utf8');
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function getToken(res) {
  return res.data?.data?.token || res.data?.data?.access_token || res.data?.token || res.data?.access_token;
}

function getUser(res) {
  return res.data?.data?.user || res.data?.user;
}

function getData(res) {
  return res.data?.data || res.data;
}

let ipCounter = 100;
async function request(options, postData = null) {
  ipCounter++;
  const headers = Object.assign({
    'X-Forwarded-For': `10.99.1.${ipCounter}`,
  }, options.headers || {});
  options.headers = headers;

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('🔒 BHOOMISETU PII DATA-AT-REST ENCRYPTION & TOKEN REVOCATION TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${message} - ${details}`);
      failed++;
    }
  }

  const pgClient = new Client({ connectionString });
  await pgClient.connect();

  try {
    // -------------------------------------------------------------
    // PART 1: PII Data-at-Rest Encryption (PostgreSQL DB checks)
    // -------------------------------------------------------------
    console.log('--- 1. PII Field-Level AES-256-GCM Data-at-Rest (PostgreSQL) ---');
    const bRes = await pgClient.query('SELECT beneficiary_id, identity_token, bank_account_token, encrypted_legal_name, bank_account_last4 FROM beneficiaries LIMIT 5');
    assert(bRes.rows.length > 0, 'Found beneficiaries in database');

    for (let i = 0; i < bRes.rows.length; i++) {
      const row = bRes.rows[i];
      assert(Buffer.isBuffer(row.identity_token) && row.identity_token.length >= 28, `Beneficiary ${i+1}: identity_token is encrypted binary buffer (length=${row.identity_token?.length}B)`);
      assert(Buffer.isBuffer(row.bank_account_token) && row.bank_account_token.length >= 28, `Beneficiary ${i+1}: bank_account_token is encrypted binary buffer (length=${row.bank_account_token?.length}B)`);
      assert(Buffer.isBuffer(row.encrypted_legal_name) && row.encrypted_legal_name.length >= 28, `Beneficiary ${i+1}: encrypted_legal_name is encrypted binary buffer (length=${row.encrypted_legal_name?.length}B)`);

      const decAadhaar = decrypt(row.identity_token);
      const decBank = decrypt(row.bank_account_token);
      const decName = decrypt(row.encrypted_legal_name);

      assert(!!decAadhaar && /^\d{12}$/.test(decAadhaar), `Beneficiary ${i+1}: Decrypted Aadhaar is valid 12-digit number (${decAadhaar})`);
      assert(!!decBank && decBank.endsWith(row.bank_account_last4), `Beneficiary ${i+1}: Decrypted Bank Account ends with bank_account_last4 (${row.bank_account_last4})`);
      assert(!!decName && decName.length > 3, `Beneficiary ${i+1}: Decrypted legal name is non-empty plaintext (${decName})`);
    }

    const oRes = await pgClient.query('SELECT parcel_owner_id, identity_token, encrypted_phone, encrypted_legal_name FROM parcel_owners LIMIT 5');
    assert(oRes.rows.length > 0, 'Found parcel owners in database');
    if (oRes.rows.length > 0) {
      const oRow = oRes.rows[0];
      assert(Buffer.isBuffer(oRow.identity_token), 'Parcel owner: identity_token is encrypted binary buffer');
      assert(Buffer.isBuffer(oRow.encrypted_phone), 'Parcel owner: encrypted_phone is encrypted binary buffer');
      const decPhone = decrypt(oRow.encrypted_phone);
      assert(!!decPhone && decPhone.startsWith('+91'), `Parcel owner: Decrypted phone is valid E.164 (+91 XXXXX...) (${decPhone})`);
    }

    // -------------------------------------------------------------
    // PART 2: DPDP Act 2023 Masked API Responses
    // -------------------------------------------------------------
    console.log('\n--- 2. DPDP Act Default-Masking in API Responses ---');
    // Login as Citizen to access profile
    const citizenLogin = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'citizen@public.bhoomsetu.gov.in', password: 'bhoomi2026' });

    const citizenToken = getToken(citizenLogin);
    assert(!!citizenToken, 'Citizen login successful');

    const citizenProfile = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/citizen/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });

    const citizenProfileData = getData(citizenProfile);
    assert(citizenProfile.statusCode === 200, 'Citizen profile endpoint responded with 200 OK');
    assert(/^XXXX-XXXX-\d{4}$/.test(citizenProfileData?.aadhaarMasked), `Citizen Aadhaar is masked according to DPDP standards (${citizenProfileData?.aadhaarMasked})`);
    assert(/^XXXXXXXX\d{4}$/.test(citizenProfileData?.accountMasked), `Citizen Bank Account is masked (${citizenProfileData?.accountMasked})`);
    assert(!!citizenProfileData?.phoneMasked && citizenProfileData?.phoneMasked.includes('XXXXX'), `Citizen Phone is masked (${citizenProfileData?.phoneMasked})`);
    assert(!citizenProfileData?.identity_token, 'Citizen profile does NOT leak raw binary identity_token');
    assert(!citizenProfileData?.bank_account_token, 'Citizen profile does NOT leak raw binary bank_account_token');

    // Citizen cannot access macro compensation overview (RBAC guard check)
    const citizenCompRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/compensation',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(citizenCompRes.statusCode === 403, `Citizen blocked from macro compensation overview with 403 Forbidden (got ${citizenCompRes.statusCode})`);

    // Officer (Central Ministry) compensation overview masking check
    const officerAdminLogin = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'ananya.sharma@nic.in', password: 'bhoomi2026' });
    const officerAdminToken = getToken(officerAdminLogin);

    const compRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/compensation',
      method: 'GET',
      headers: { Authorization: `Bearer ${officerAdminToken}` },
    });
    const compData = getData(compRes);
    assert(compRes.statusCode === 200, 'Officer compensation overview responded with 200 OK');
    const benList = compData?.beneficiaries || [];
    assert(benList.length > 0, `Compensation overview returned ${benList.length} beneficiaries`);
    if (benList.length > 0) {
      const b0 = benList[0];
      assert(!b0.identity_token && !b0.bank_account_token, 'Overview beneficiaries do not leak raw ciphertext buffers');
      assert(!!b0.bankMasked && b0.bankMasked.includes('••••'), `Overview beneficiary bank is masked (${b0.bankMasked})`);
      assert(!!b0.aadhaarMasked && b0.aadhaarMasked.startsWith('XXXX-XXXX-'), `Overview beneficiary Aadhaar is masked (${b0.aadhaarMasked})`);
    }

    // Test Adding Beneficiary with Field-Level PII Encryption
    const firstCase = await pgClient.query('SELECT case_id FROM acquisition_cases LIMIT 1');
    const firstParcel = await pgClient.query('SELECT case_parcel_id FROM case_parcels LIMIT 1');
    if (firstCase.rows.length > 0 && firstParcel.rows.length > 0) {
      const testCaseId = firstCase.rows[0].case_id;
      const testParcelId = firstParcel.rows[0].case_parcel_id;
      const addBenRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/v1/compensation/beneficiaries',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${officerAdminToken}`,
        },
      }, {
        caseId: testCaseId,
        caseParcelId: testParcelId,
        legalName: 'Radha Krishna Murthy',
        aadhaarNumber: '998877665544',
        bankAccountNumber: '60100234567891',
        sharePercentage: 50,
        ifscCode: 'HDFC0001234',
      });

      const benCreated = getData(addBenRes);
      assert(addBenRes.statusCode === 200 || addBenRes.statusCode === 201, `POST /v1/compensation/beneficiaries created new beneficiary (status=${addBenRes.statusCode})`);
      
      // Verify database stored encrypted ciphertext buffers
      if (benCreated?.beneficiary_id) {
        const checkDb = await pgClient.query('SELECT beneficiary_id, identity_token, bank_account_token, encrypted_legal_name, bank_account_last4 FROM beneficiaries WHERE beneficiary_id = $1', [benCreated.beneficiary_id]);
        assert(checkDb.rows.length === 1, 'New beneficiary persisted in PostgreSQL');
        const dbRow = checkDb.rows[0];
        assert(Buffer.isBuffer(dbRow.identity_token), 'New beneficiary identity_token stored as encrypted buffer');
        assert(decrypt(dbRow.identity_token) === '998877665544', 'Decrypted new Aadhaar matches original plaintext');
        assert(decrypt(dbRow.bank_account_token) === '60100234567891', 'Decrypted new Bank Account matches original plaintext');
        assert(decrypt(dbRow.encrypted_legal_name) === 'Radha Krishna Murthy', 'Decrypted new Legal Name matches original plaintext');
        assert(dbRow.bank_account_last4 === '7891', 'bank_account_last4 correctly extracted (7891)');
      }
    }

    // -------------------------------------------------------------
    // PART 3: Option C - JWT Session ID (jti) & Session Tracking
    // -------------------------------------------------------------
    console.log('\n--- 3. JWT Session Identifier (jti) & Active Session Tracking ---');
    const officerLogin = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 's.patil@karnataka.gov.in', password: 'bhoomi2026' });

    const officerToken = getToken(officerLogin);
    const officerUser = getUser(officerLogin);
    const officerUserId = officerUser?.id || officerUser?.user_id;
    assert(!!officerToken, 'Field Officer login successful');

    const officerJwt = parseJwt(officerToken);
    assert(!!officerJwt?.jti, `JWT token embeds unique session identifier (jti=${officerJwt?.jti})`);

    const sessionRow = await pgClient.query('SELECT session_id, user_id, revoked_at FROM auth_sessions WHERE session_id = $1', [officerJwt?.jti]);
    assert(sessionRow.rows.length === 1, 'Active session record found in PostgreSQL auth_sessions');
    assert(sessionRow.rows[0]?.revoked_at === null, 'Session revoked_at is initially NULL (active)');

    // Verify token works on protected route
    const meRes1 = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const meData1 = getData(meRes1);
    assert(meRes1.statusCode === 200 && meData1?.email === 's.patil@karnataka.gov.in', 'Officer token authorizes successfully (200 OK)');

    // -------------------------------------------------------------
    // PART 4: Option C - User Self-Logout & Instant Revocation
    // -------------------------------------------------------------
    console.log('\n--- 4. Self Logout & Immediate JWT Revocation ---');
    const logoutRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/logout',
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const logoutData = getData(logoutRes);
    assert(logoutRes.statusCode === 200 || logoutRes.statusCode === 201, `POST /v1/auth/logout succeeded (status=${logoutRes.statusCode})`);
    assert(logoutData?.status === 'SUCCESS', 'Logout response indicated SUCCESS');

    // Verify in PostgreSQL that session is marked revoked
    const revokedSession = await pgClient.query('SELECT session_id, revoked_at FROM auth_sessions WHERE session_id = $1', [officerJwt?.jti]);
    assert(revokedSession.rows[0]?.revoked_at !== null, `Session revoked_at timestamp is persisted in PostgreSQL (${revokedSession.rows[0]?.revoked_at})`);

    // Attempt to use the same token again -> MUST FAIL with 401 Unauthorized
    const meResAfterLogout = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert(meResAfterLogout.statusCode === 401, `Revoked token immediately rejected with 401 Unauthorized (got ${meResAfterLogout.statusCode})`);

    // -------------------------------------------------------------
    // PART 5: Option C - Admin Emergency Kill Switch (Force Logout)
    // -------------------------------------------------------------
    console.log('\n--- 5. Admin Emergency Kill Switch (Force Logout Target Officer) ---');
    // 1. Officer logs in again to get a fresh active session
    const officerLogin2 = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 's.patil@karnataka.gov.in', password: 'bhoomi2026' });
    const freshOfficerToken = getToken(officerLogin2);
    assert(!!freshOfficerToken, 'Officer re-authenticated with new active session');

    // Verify the fresh token works
    const meFresh = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${freshOfficerToken}` },
    });
    assert(meFresh.statusCode === 200, 'Fresh officer session is valid and working');

    // 2. Login as Central Ministry Admin
    const adminLogin = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'ananya.sharma@nic.in', password: 'bhoomi2026' });
    const adminToken = getToken(adminLogin);
    assert(!!adminToken, 'Admin (Central Ministry) login successful');

    // 3. Admin activates Emergency Kill Switch for this officer
    const killSwitchRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: `/v1/auth/revoke-user-sessions/${officerUserId}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const killData = getData(killSwitchRes);
    assert(killSwitchRes.statusCode === 200 || killSwitchRes.statusCode === 201, `Kill switch endpoint returned ${killSwitchRes.statusCode}`);
    assert(killData?.status === 'SUCCESS', 'Kill switch response confirmed SUCCESS');
    assert(killData?.revokedSessionsCount >= 1, `Kill switch revoked ${killData?.revokedSessionsCount} active session(s)`);

    // 4. Officer fresh token must NOW be rejected immediately
    const meAfterKill = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/v1/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${freshOfficerToken}` },
    });
    assert(meAfterKill.statusCode === 401, `Target officer token was immediately invalidated by Kill Switch (401 Unauthorized, got ${meAfterKill.statusCode})`);

    // 5. Verify security audit event was logged in PostgreSQL
    const auditRes = await pgClient.query(
      "SELECT audit_event_id, action_code, entity_type, entity_id, metadata FROM audit_events WHERE action_code = 'SECURITY_FORCE_LOGOUT' AND entity_id = $1 ORDER BY occurred_at DESC LIMIT 1",
      [officerUserId]
    );
    assert(auditRes.rows.length === 1, 'Emergency Kill Switch recorded a SECURITY_FORCE_LOGOUT audit event');

    // -------------------------------------------------------------
    // PART 6: RBAC Protection on Emergency Kill Switch
    // -------------------------------------------------------------
    console.log('\n--- 6. RBAC Guard on Emergency Kill Switch ---');
    // Citizen tries to invoke kill switch on an officer
    const unauthorizedKill = await request({
      hostname: 'localhost',
      port: 3001,
      path: `/v1/auth/revoke-user-sessions/${officerUserId}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(unauthorizedKill.statusCode === 403, `Unauthorized user blocked by RolesGuard with 403 Forbidden (got ${unauthorizedKill.statusCode})`);

  } finally {
    await pgClient.end();
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🌟 ALL PII ENCRYPTION & TOKEN REVOCATION TESTS PASSED PERFECTLY!');
  }
}

run().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
