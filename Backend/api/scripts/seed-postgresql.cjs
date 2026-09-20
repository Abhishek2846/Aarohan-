/*
 * Idempotent development/demo seed for the PostgreSQL BhoomiSetu database.
 *
 * It deliberately uses pg instead of Prisma create() calls because this
 * schema contains PostGIS columns that Prisma exposes as Unsupported types.
 * Run with: npm run db:seed
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
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

const connectionString = process.env.DATABASE_URL || 'postgresql://bhoomi:bhoomi_pass@127.0.0.1:5432/bhoomi_setu?schema=public';
const now = new Date();
const isoDate = (offset = 0) => new Date(now.getTime() + offset * 86400000).toISOString();
const dateOnly = (offset = 0) => isoDate(offset).slice(0, 10);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const uuid = (key) => {
  const hex = crypto.createHash('sha256').update(`bhoomi-seed:${key}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

const client = new Client({ connectionString });
const geometryColumns = new Set([
  'centerline_wgs84',
  'right_of_way_wgs84',
  'alignment_metric',
  'boundary_wgs84',
  'centroid_wgs84',
  'impact_geometry_wgs84',
  'gps_location',
  'location',
]);

let hasPostgis = false;
let tableColumns = new Map();

function point(i) {
  return `POINT(${77.5 + i * 0.01} ${13.2 + i * 0.01})`;
}

function line(i) {
  return `LINESTRING(${77.45 + i * 0.01} ${13.15 + i * 0.01},${77.50 + i * 0.01} ${13.20 + i * 0.01},${77.55 + i * 0.01} ${13.25 + i * 0.01})`;
}

function polygon(i) {
  const x = 77.45 + i * 0.01;
  const y = 13.15 + i * 0.01;
  return `POLYGON((${x} ${y},${x + 0.002} ${y},${x + 0.002} ${y + 0.002},${x} ${y + 0.002},${x} ${y}))`;
}

function jsonValue(value) {
  return value && typeof value === 'object' && !Buffer.isBuffer(value) ? JSON.stringify(value) : value;
}

function defaultFor(column, index) {
  const name = column.column_name;
  const type = column.data_type;
  if (column.column_default !== null) return undefined;
  if (column.is_nullable === 'YES') return undefined;
  if (name.endsWith('_id') || name === 'id') return uuid(`${name}-${index}`);
  if (type === 'boolean') return false;
  if (type.includes('timestamp') || type === 'date') return now;
  if (type === 'json' || type === 'jsonb') return {};
  if (type === 'bytea') return Buffer.from(`seed-${name}-${index}`);
  if (type.includes('int') || type === 'numeric' || type === 'decimal' || type === 'real' || type === 'double precision') return 0;
  if (type === 'inet') return '127.0.0.1';
  if (type === 'uuid') return uuid(`${name}-${index}`);
  return `Seed ${name} ${index + 1}`;
}

function normalizeValue(column, value, index) {
  if (value !== undefined) return value;
  return defaultFor(column, index);
}

async function refreshMetadata() {
  const result = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  tableColumns = new Map();
  for (const row of result.rows) {
    if (!tableColumns.has(row.table_name)) tableColumns.set(row.table_name, []);
    tableColumns.get(row.table_name).push(row);
  }
}

async function ensureAllTables() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS field_surveys (
      survey_id UUID PRIMARY KEY,
      client_record_id VARCHAR(100),
      case_id UUID,
      case_parcel_id UUID,
      surveyor_user_id UUID NOT NULL,
      survey_type VARCHAR(60) DEFAULT 'BOUNDARY_VERIFICATION',
      device_id VARCHAR(100),
      survey_started_at TIMESTAMPTZ(6),
      surveyed_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      gps_location GEOMETRY(POINT, 4326),
      gps_accuracy_m NUMERIC(6, 2),
      demarcation_confirmed BOOLEAN DEFAULT false,
      witness_names JSONB NOT NULL DEFAULT '[]',
      observations TEXT,
      sync_status VARCHAR(30) DEFAULT 'SYNCED',
      payload_hash CHAR(64),
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS field_survey_points (
      survey_point_id UUID PRIMARY KEY,
      survey_id UUID NOT NULL,
      point_sequence INT NOT NULL DEFAULT 1,
      point_type VARCHAR(40) DEFAULT 'BOUNDARY',
      location GEOMETRY(POINT, 4326),
      accuracy_m NUMERIC(6, 2),
      captured_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      media_asset_id UUID PRIMARY KEY,
      client_asset_id VARCHAR(100),
      case_id UUID,
      case_parcel_id UUID,
      survey_id UUID,
      document_id UUID,
      storage_provider VARCHAR(30) DEFAULT 'LOCAL',
      storage_bucket VARCHAR(100),
      object_key VARCHAR(500) NOT NULL,
      original_filename VARCHAR(255),
      mime_type VARCHAR(100),
      file_size_bytes BIGINT NOT NULL DEFAULT 0,
      sha256_hash CHAR(64),
      captured_at TIMESTAMPTZ(6),
      captured_by UUID,
      gps_location GEOMETRY(POINT, 4326),
      gps_accuracy_m NUMERIC(6, 2),
      caption TEXT,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS possession_witnesses (
      possession_witness_id UUID PRIMARY KEY,
      possession_record_id UUID NOT NULL,
      witness_name VARCHAR(150) NOT NULL,
      witness_role VARCHAR(100),
      identity_reference_masked VARCHAR(100),
      signature_media_asset_id UUID,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS possession_media (
      possession_record_id UUID NOT NULL,
      media_asset_id UUID NOT NULL,
      evidence_type VARCHAR(60) DEFAULT 'POSSESSION_EVIDENCE',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (possession_record_id, media_asset_id)
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_key VARCHAR(100) PRIMARY KEY,
      checksum_sha256 CHAR(64),
      applied_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      applied_by VARCHAR(128)
    );

    CREATE TABLE IF NOT EXISTS offline_sync_records (
      sync_record_id UUID PRIMARY KEY,
      client_record_id VARCHAR(100) NOT NULL,
      user_id UUID NOT NULL,
      entity_type VARCHAR(60) NOT NULL,
      entity_id UUID,
      operation VARCHAR(30) NOT NULL,
      payload_hash CHAR(64),
      payload JSONB NOT NULL DEFAULT '{}',
      sync_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      server_response JSONB,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS statutory_notices (
      statutory_notice_id UUID PRIMARY KEY,
      notice_number VARCHAR(100) NOT NULL UNIQUE,
      project_id UUID,
      case_id UUID,
      document_id UUID,
      notice_type VARCHAR(60) NOT NULL DEFAULT 'PRELIMINARY_NOTIFICATION',
      section_reference VARCHAR(100),
      gazette_reference VARCHAR(150),
      publication_status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
      published_on DATE,
      effective_on DATE,
      public_summary TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE statutory_notices ADD COLUMN IF NOT EXISTS bilingual_content JSONB;
    ALTER TABLE statutory_notices ADD COLUMN IF NOT EXISTS sha256_hash VARCHAR(64);
    ALTER TABLE statutory_notices ADD COLUMN IF NOT EXISTS gazette_volume_issue VARCHAR(120);
    ALTER TABLE statutory_notices ADD COLUMN IF NOT EXISTS cadastral_schedule JSONB;

    CREATE TABLE IF NOT EXISTS statutory_notice_parcels (
      statutory_notice_id UUID NOT NULL,
      case_parcel_id UUID NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (statutory_notice_id, case_parcel_id)
    );

    CREATE TABLE IF NOT EXISTS case_risk_evaluations (
      risk_evaluation_id UUID PRIMARY KEY,
      case_id UUID NOT NULL,
      score NUMERIC(5, 2) NOT NULL DEFAULT 0,
      risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
      reasons JSONB NOT NULL DEFAULT '[]',
      recommended_actions JSONB NOT NULL DEFAULT '[]',
      model_version VARCHAR(50) NOT NULL DEFAULT '1.0',
      calculated_by UUID,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_quality_assessments (
      quality_assessment_id UUID PRIMARY KEY,
      case_id UUID NOT NULL,
      score NUMERIC(5, 2) NOT NULL DEFAULT 0,
      passed_checks INT NOT NULL DEFAULT 0,
      total_checks INT NOT NULL DEFAULT 0,
      missing_items JSONB NOT NULL DEFAULT '[]',
      assessed_by UUID,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parcel_owners (
      parcel_owner_id UUID PRIMARY KEY,
      parcel_id UUID NOT NULL,
      owner_reference VARCHAR(100),
      owner_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
      masked_name VARCHAR(150),
      ownership_share_percent NUMERIC(5, 2) DEFAULT 100,
      verification_status VARCHAR(40) DEFAULT 'UNVERIFIED',
      valid_from DATE,
      valid_to DATE,
      is_primary BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id UUID PRIMARY KEY,
      language_code VARCHAR(10) DEFAULT 'en',
      timezone_name VARCHAR(50) DEFAULT 'Asia/Kolkata',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS litigation_cases (
      litigation_id UUID PRIMARY KEY,
      court_name VARCHAR(240) NOT NULL,
      case_number VARCHAR(120) NOT NULL,
      case_id UUID,
      parcel_id UUID,
      description TEXT,
      created_by UUID NOT NULL,
      litigation_status VARCHAR(40) NOT NULL DEFAULT 'FILED',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS state_benchmarks (
      id VARCHAR(10) PRIMARY KEY,
      state VARCHAR(100) NOT NULL,
      state_hi VARCHAR(100) NOT NULL,
      zone VARCHAR(20) NOT NULL,
      projects INT NOT NULL DEFAULT 0,
      target_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      acquired_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      avg_days INT NOT NULL DEFAULT 0,
      sla_compliance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      dbt_payment_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      rr_completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      grievance_resolution_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      litigation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
      data_quality_score INT NOT NULL DEFAULT 0,
      budget_utilization_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'ON_TRACK',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS national_corridors (
      corridor_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_hi VARCHAR(255) NOT NULL,
      sector VARCHAR(50) NOT NULL,
      length_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
      states_traversed JSONB NOT NULL DEFAULT '[]',
      total_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      acquired_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      sanctioned_cr NUMERIC(12, 2) NOT NULL DEFAULT 0,
      disbursed_cr NUMERIC(12, 2) NOT NULL DEFAULT 0,
      interstate_status TEXT NOT NULL,
      interstate_status_hi TEXT NOT NULL,
      risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
      lead_agency VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS central_escalations (
      escalation_id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      title_hi VARCHAR(255) NOT NULL,
      source_state VARCHAR(100) NOT NULL,
      corridor VARCHAR(200) NOT NULL,
      category VARCHAR(50) NOT NULL,
      urgency VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_DIRECTIVE',
      submitted_date VARCHAR(50) NOT NULL,
      summary TEXT NOT NULL,
      summary_hi TEXT NOT NULL,
      requested_action TEXT NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bottleneck_diagnostics (
      diagnostic_id VARCHAR(50) PRIMARY KEY,
      stage VARCHAR(200) NOT NULL,
      stage_hi VARCHAR(200) NOT NULL,
      root_cause TEXT NOT NULL,
      root_cause_hi TEXT NOT NULL,
      states_affected JSONB NOT NULL DEFAULT '[]',
      cases_impacted INT NOT NULL DEFAULT 0,
      avg_delay_days INT NOT NULL DEFAULT 0,
      severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
      central_action TEXT NOT NULL,
      central_action_hi TEXT NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS national_standards (
      standard_id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(200) NOT NULL,
      version VARCHAR(20) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'MANDATORY',
      category VARCHAR(30) NOT NULL,
      compliance_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
      summary TEXT NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS district_metrics (
      metric_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      name_hi VARCHAR(100) NOT NULL,
      division VARCHAR(100) NOT NULL,
      dc_name VARCHAR(150) NOT NULL,
      target_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      acquired_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      active_cases INT NOT NULL DEFAULT 0,
      sla_compliance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
      avg_days_to_handover INT NOT NULL DEFAULT 0,
      compensation_cr NUMERIC(12, 2) NOT NULL DEFAULT 0,
      bottleneck_stage VARCHAR(150) NOT NULL,
      bottleneck_stage_hi VARCHAR(150) NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'ON_TRACK',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS state_approvals (
      approval_id VARCHAR(50) PRIMARY KEY,
      approval_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      title_hi VARCHAR(255) NOT NULL,
      project VARCHAR(255) NOT NULL,
      district VARCHAR(150) NOT NULL,
      land_area_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      financial_outlay_cr NUMERIC(12, 2) NOT NULL DEFAULT 0,
      submitted_by VARCHAR(150) NOT NULL,
      submitted_date VARCHAR(50) NOT NULL,
      sla_deadline VARCHAR(50) NOT NULL,
      sla_hours_left INT NOT NULL DEFAULT 0,
      is_urgent BOOLEAN NOT NULL DEFAULT false,
      dossier_summary TEXT NOT NULL,
      dossier_summary_hi TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS revenue_court_appeals (
      appeal_id VARCHAR(50) PRIMARY KEY,
      appeal_number VARCHAR(100) NOT NULL UNIQUE,
      tribunal_court VARCHAR(200) NOT NULL,
      case_number VARCHAR(100) NOT NULL,
      appellant_name VARCHAR(150) NOT NULL,
      dispute_type VARCHAR(100) NOT NULL,
      claimed_amount_inr NUMERIC(15, 2) NOT NULL DEFAULT 0,
      determined_amount_inr NUMERIC(15, 2) NOT NULL DEFAULT 0,
      hearing_date VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'HEARING',
      stay_granted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS field_tasks (
      task_id VARCHAR(50) PRIMARY KEY,
      parcel_id VARCHAR(50) NOT NULL,
      ulpin VARCHAR(50) NOT NULL,
      case_no VARCHAR(100) NOT NULL,
      survey_no VARCHAR(50) NOT NULL,
      village VARCHAR(100) NOT NULL,
      taluk VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      recorded_area_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
      measured_area_ha NUMERIC(10, 2),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_SURVEY',
      priority VARCHAR(30) NOT NULL DEFAULT 'ROUTINE',
      due_date VARCHAR(50) NOT NULL,
      distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0,
      bearing_deg INT NOT NULL DEFAULT 0,
      landholder VARCHAR(200) NOT NULL,
      access_status VARCHAR(40) NOT NULL DEFAULT 'ACCESSIBLE',
      correction_remarks TEXT,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_anomalies (
      anomaly_id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      title_hi VARCHAR(255) NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
      case_ref VARCHAR(100) NOT NULL,
      parcel_ulpin VARCHAR(50) NOT NULL,
      district VARCHAR(100) NOT NULL,
      district_hi VARCHAR(100) NOT NULL,
      calculated_value VARCHAR(50) NOT NULL,
      district_avg VARCHAR(50) NOT NULL,
      variance_ratio VARCHAR(50) NOT NULL,
      variance_ratio_hi VARCHAR(50) NOT NULL,
      statute VARCHAR(255) NOT NULL,
      statute_hi VARCHAR(255) NOT NULL,
      details TEXT NOT NULL,
      details_hi TEXT NOT NULL,
      flag_date VARCHAR(50) NOT NULL,
      flag_date_hi VARCHAR(50) NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS simulation_scenarios (
      scenario_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      tagline VARCHAR(255) NOT NULL,
      base_length_km NUMERIC(6, 2) NOT NULL DEFAULT 0,
      base_parcels_per_km NUMERIC(5, 2) NOT NULL DEFAULT 0,
      base_families_per_km NUMERIC(5, 2) NOT NULL DEFAULT 0,
      base_forest_ha NUMERIC(6, 2) NOT NULL DEFAULT 0,
      base_cost_per_km_cr NUMERIC(6, 2) NOT NULL DEFAULT 0,
      base_months INT NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gati_shakti_layers (
      layer_id UUID PRIMARY KEY,
      layer_code VARCHAR(60) NOT NULL UNIQUE,
      layer_name VARCHAR(160) NOT NULL,
      layer_name_hi VARCHAR(160) NOT NULL,
      ministry VARCHAR(120) NOT NULL,
      statutory_act VARCHAR(240) NOT NULL,
      portal_name VARCHAR(120) NOT NULL,
      portal_url VARCHAR(255),
      color_hex VARCHAR(20) NOT NULL,
      buffer_default_m INT NOT NULL DEFAULT 100,
      is_critical BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_inter_agency_nocs (
      noc_id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
      layer_code VARCHAR(60) NOT NULL REFERENCES gati_shakti_layers(layer_code),
      agency_name VARCHAR(160) NOT NULL,
      agency_name_hi VARCHAR(160),
      clearance_type VARCHAR(120) NOT NULL,
      clearance_type_hi VARCHAR(160),
      application_no VARCHAR(100) NOT NULL,
      affected_area_ha NUMERIC(10, 4) NOT NULL DEFAULT 0,
      chainage_start VARCHAR(50),
      chainage_end VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'IDENTIFIED',
      sla_days_statutory INT NOT NULL DEFAULT 90,
      days_elapsed INT NOT NULL DEFAULT 0,
      is_sla_breached BOOLEAN DEFAULT false,
      escalation_level VARCHAR(50) NOT NULL DEFAULT 'NONE',
      nodal_officer VARCHAR(160),
      action_pending_by VARCHAR(40) NOT NULL DEFAULT 'PIA',
      next_milestone VARCHAR(255) NOT NULL,
      next_milestone_hi VARCHAR(255),
      statutory_order_no VARCHAR(120),
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function prepareValue(column, value, params) {
  if (value === undefined) return null;
  if (geometryColumns.has(column.column_name)) {
    params.push(value);
    if (hasPostgis) return `ST_GeomFromText($${params.length}, 4326)`;
    return `$${params.length}`;
  }
  params.push(jsonValue(value));
  return `$${params.length}`;
}

async function upsert(table, row, conflictColumns = [], ignoreUpdateColumns = []) {
  const columns = tableColumns.get(table);
  if (!columns) throw new Error(`Table ${table} is missing from the configured database.`);
  const selected = columns
    .filter((column) => Object.prototype.hasOwnProperty.call(row, column.column_name))
    .map((column) => ({ column, value: normalizeValue(column, row[column.column_name], 0) }))
    .filter(({ value }) => value !== undefined);

  const params = [];
  const values = selected.map(({ column, value }) => prepareValue(column, value, params));
  const names = selected.map(({ column }) => `"${column.column_name}"`);
  const conflict = conflictColumns.length ? conflictColumns : [columns.find((c) => c.column_name.endsWith('_id') || c.column_name === 'id')?.column_name || columns[0].column_name];
  const updates = selected
    .map(({ column }) => column.column_name)
    .filter((name) => !conflict.includes(name) && !ignoreUpdateColumns.includes(name))
    .map((name) => `"${name}" = EXCLUDED."${name}"`);
  const sql = `INSERT INTO "${table}" (${names.join(',')}) VALUES (${values.join(',')}) ON CONFLICT (${conflict.map((name) => `"${name}"`).join(',')}) DO ${updates.length ? `UPDATE SET ${updates.join(',')}` : 'NOTHING'}`;
  await client.query(sql, params);
}

async function seed() {
  await client.connect();
  await client.query('BEGIN');
  try {
    const extension = await client.query(`SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS installed`);
    hasPostgis = extension.rows[0].installed;
    await ensureAllTables();
    await refreshMetadata();

    const roleCodes = ['SYSTEM_ADMIN', 'PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'AUDITOR', 'CITIZEN'];
    for (const [i, role] of roleCodes.entries()) {
      await upsert('roles', { role_code: role, display_name: role.replaceAll('_', ' '), description: `BhoomiSetu ${role} demo role`, is_system_role: true }, ['role_code']);
    }

    const jurisdictionIds = Array.from({ length: 5 }, (_, i) => uuid(`jurisdiction-${i + 1}`));
    const jurisdictions = [
      ['NATIONAL', 'IN', 'Government of India'],
      ['STATE', 'KA', 'Karnataka'],
      ['STATE', 'GJ', 'Gujarat'],
      ['DISTRICT', 'KA-BLR-R', 'Bengaluru Rural'],
      ['DISTRICT', 'GJ-VAD', 'Vadodara'],
    ];
    for (let i = 0; i < jurisdictions.length; i++) {
      await upsert('jurisdictions', {
        jurisdiction_id: jurisdictionIds[i],
        parent_jurisdiction_id: i === 3 ? jurisdictionIds[1] : i === 4 ? jurisdictionIds[2] : null,
        jurisdiction_type: jurisdictions[i][0], jurisdiction_code: jurisdictions[i][1], name: jurisdictions[i][2],
        name_local: jurisdictions[i][2], official_code: jurisdictions[i][1], is_active: true,
      }, ['jurisdiction_id']);
    }

    const passwordHash = await bcrypt.hash('bhoomi2026', 10);
    const users = [
      ['ananya.sharma@nic.in', 'Ananya Sharma, IAS', 'CENTRAL_MINISTRY', 0],
      ['v.malhotra@nhai.gov.in', 'Vikram Malhotra', 'PIA', 0],
      ['r.rao@karnataka.gov.in', 'Rajeshwar Rao', 'STATE_AUTHORITY', 1],
      ['dc.bengaluru@karnataka.gov.in', 'Priya Sundaram, IAS', 'DISTRICT_OFFICER', 3],
      ['s.patil@karnataka.gov.in', 'Suresh Patil', 'FIELD_OFFICER', 3],
      ['kn.raghavan@cag.gov.in', 'K. N. Raghavan, IA&AS', 'AUDITOR', 0],
      ['citizen@public.bhoomsetu.gov.in', 'Rameshwar Sharma', 'CITIZEN', 3],
    ];
    const emails = users.map((u) => u[0]);
    const existingUsersRes = await client.query('SELECT user_id, email FROM users WHERE email = ANY($1)', [emails]);
    const existingUserMap = new Map(existingUsersRes.rows.map((r) => [r.email, r.user_id]));

    const userIds = [];
    for (let i = 0; i < users.length; i++) {
      const [email, name, role, jurisdictionIndex] = users[i];
      const userId = existingUserMap.get(email) || uuid(`user-${i + 1}`);
      userIds.push(userId);
      await upsert('users', {
        user_id: userId, login_name: email.split('@')[0], email, password_hash: passwordHash, full_name: name,
        designation: role.replaceAll('_', ' '), department: 'BhoomiSetu Land Acquisition Directorate',
        phone_e164: `+919800000${String(i + 1).padStart(2, '0')}`, account_status: 'ACTIVE', preferred_language: 'en', mfa_enabled: false,
      }, ['user_id']);
      await upsert('user_roles', { user_id: userId, role_code: role, assigned_by: userIds[0] }, ['user_id', 'role_code']);
      await upsert('user_preferences', { user_id: userId, language_code: 'en', timezone_name: 'Asia/Kolkata' }, ['user_id']);
      await upsert('user_jurisdictions', { user_id: userId, jurisdiction_id: jurisdictionIds[jurisdictionIndex], access_type: role === 'CITIZEN' ? 'VIEW' : 'ADMIN', valid_from: dateOnly(-30), assigned_by: userIds[0] }, ['user_id', 'jurisdiction_id']);
      await upsert('auth_sessions', { session_id: uuid(`session-${i + 1}`), user_id: userId, token_hash: sha256(`seed-session-${i + 1}`), ip_address: '127.0.0.1', user_agent: 'BhoomiSetu seed', expires_at: isoDate(7) }, ['session_id']);
    }

    const documentTypes = ['GAZETTE', 'SURVEY_REPORT', 'AWARD_ORDER', 'POSSESSION_MEMO', 'OBJECTION_RECORD'];
    for (let i = 0; i < documentTypes.length; i++) {
      await upsert('document_types', { document_type_code: documentTypes[i], display_name: documentTypes[i].replaceAll('_', ' '), description: `Seed ${documentTypes[i]} document type`, is_publicly_visible: true }, ['document_type_code']);
    }

    const existingStagesRes = await client.query('SELECT stage_code FROM workflow_stage_definitions ORDER BY stage_order');
    let stageCodes = [];
    if (existingStagesRes.rows.length > 0) {
      stageCodes = existingStagesRes.rows.map((r) => r.stage_code);
    } else {
      stageCodes = ['PROPOSAL', 'PRELIMINARY_INVESTIGATION', 'DRAFT_NOTIFICATION', 'PUBLIC_OBJECTION', 'FINAL_DECLARATION'];
      for (let i = 0; i < stageCodes.length; i++) {
        await upsert('workflow_stage_definitions', { stage_code: stageCodes[i], stage_order: i + 1, display_name: stageCodes[i].replaceAll('_', ' '), description: `Seed workflow stage ${i + 1}`, default_sla_days: 15 + i * 5, is_terminal: false, is_active: true }, ['stage_code'], ['stage_order']);
      }
    }
    for (let i = 0; i < Math.min(stageCodes.length, 5); i++) {
      await upsert('workflow_stage_roles', { stage_code: stageCodes[i], role_code: ['PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER'][i % 5], can_enter: true, can_approve: true }, ['stage_code', 'role_code']);
      await upsert('workflow_stage_required_documents', { stage_code: stageCodes[i], document_type_code: documentTypes[i % documentTypes.length], is_mandatory: true }, ['stage_code', 'document_type_code']);
    }

    const projectIds = [];
    for (let i = 0; i < 5; i++) {
      const projectId = uuid(`project-${i + 1}`);
      projectIds.push(projectId);
      await upsert('projects', {
        project_id: projectId, project_code: `BHOOMI-SEED-${String(i + 1).padStart(2, '0')}`, title: ['Bengaluru Chennai Expressway', 'Western Dedicated Freight Corridor', 'Delhi Mumbai Expressway', 'Karnataka Solar Park', 'Vadodara Urban Mobility Corridor'][i],
        sector: ['HIGHWAYS', 'RAILWAYS', 'HIGHWAYS', 'RENEWABLE_ENERGY', 'URBAN_INFRASTRUCTURE'][i], pia_name: 'National Infrastructure Development Agency', pia_user_id: userIds[1], sponsoring_ministry: 'Ministry of Road Transport and Highways', project_status: i === 4 ? 'PLANNING' : 'IN_PROGRESS', primary_state_jurisdiction_id: jurisdictionIds[i % 3 === 0 ? 1 : 2], estimated_budget_inr: 1500000000 + i * 425000000, total_acquisition_area_ha: 120 + i * 35, start_date: dateOnly(-300 + i * 10), target_completion_date: dateOnly(500 + i * 30), description: `Seed infrastructure project ${i + 1}`, version_no: 1, created_by: userIds[0], updated_by: userIds[0],
      }, ['project_id']);
      await upsert('project_jurisdictions', { project_id: projectId, jurisdiction_id: jurisdictionIds[(i % 2) + 1], is_primary: true }, ['project_id', 'jurisdiction_id']);
      await upsert('project_alignments', { alignment_id: uuid(`alignment-${i + 1}`), project_id: projectId, version_no: 1, alignment_name: `Seed corridor alignment ${i + 1}`, centerline_wgs84: line(i), right_of_way_wgs84: polygon(i), buffer_width_m: 60 + i * 10, geometry_hash: sha256(`alignment-${i + 1}`), status: 'ACTIVE', uploaded_by: userIds[1], activated_at: isoDate(-20) }, ['alignment_id']);
    }

    const sourceIds = [];
    const parcelIds = [];
    for (let i = 0; i < 5; i++) {
      const sourceId = uuid(`parcel-source-${i + 1}`);
      const parcelId = uuid(`parcel-${i + 1}`);
      sourceIds.push(sourceId); parcelIds.push(parcelId);
      await upsert('parcel_sources', { parcel_source_id: sourceId, source_code: `BHOOMI-SEED-SOURCE-${i + 1}`, authority_name: 'State Land Records Department', dataset_name: 'Cadastral Seed Dataset', dataset_version: '2026.1', imported_at: isoDate(-10) }, ['parcel_source_id']);
      await upsert('parcels', { parcel_id: parcelId, parcel_source_id: sourceId, source_record_key: `SEED-PARCEL-${i + 1}`, ulpin: `KA-BLR-SEED-${String(i + 1).padStart(4, '0')}`, survey_number: `${142 + i}/2A`, khasra_number: `${142 + i}/2A`, state_jurisdiction_id: jurisdictionIds[1], district_jurisdiction_id: jurisdictionIds[3], taluk_jurisdiction_id: jurisdictionIds[3], village_jurisdiction_id: jurisdictionIds[3], village_name: 'Doddaballapur', total_area_ha: 1.25 + i * 0.35, land_use_category: i === 2 ? 'COMMERCIAL' : 'AGRICULTURAL', parcel_status: ['IDENTIFIED', 'SURVEY_PENDING', 'POSSESSION_ACQUIRED', 'AWARDED', 'LITIGATION_DISPUTED'][i], owner_reference: `OWNER-SEED-${i + 1}`, owner_name_masked: `Landowner ${i + 1}`, boundary_wgs84: polygon(i), centroid_wgs84: point(i), is_disputed: i === 4, dispute_reason: i === 4 ? 'Seed objection record' : null, estimated_market_value_inr: 2500000 + i * 500000, imported_at: isoDate(-8) }, ['parcel_id']);
      await upsert('parcel_owners', { parcel_owner_id: uuid(`parcel-owner-${i + 1}`), parcel_id: parcelId, owner_reference: `OWNER-SEED-${i + 1}`, owner_type: 'INDIVIDUAL', masked_name: `Landowner ${i + 1}`, ownership_share_percent: 100, verification_status: i % 2 ? 'PENDING' : 'VERIFIED', valid_from: dateOnly(-30), is_primary: true }, ['parcel_owner_id']);
      await upsert('project_parcels', { project_parcel_id: uuid(`project-parcel-${i + 1}`), project_id: projectIds[i], parcel_id: parcelId, alignment_id: uuid(`alignment-${i + 1}`), impact_status: 'IDENTIFIED', impacted_area_ha: 1 + i * 0.2, acquired_area_ha: i > 2 ? 0.5 : 0, impact_geometry_wgs84: polygon(i), intersection_calculated_at: isoDate(-5), intersection_method: 'POSTGIS_BUFFER', notes: 'Seed project parcel intersection' }, ['project_parcel_id']);
    }

    const caseIds = [];
    const caseParcelIds = [];
    for (let i = 0; i < 5; i++) {
      const caseId = uuid(`case-${i + 1}`);
      const caseParcelId = uuid(`case-parcel-${i + 1}`);
      caseIds.push(caseId); caseParcelIds.push(caseParcelId);
      await upsert('acquisition_cases', { case_id: caseId, case_number: `LAC/2026/SEED/${String(i + 1).padStart(3, '0')}`, project_id: projectIds[i], state_jurisdiction_id: jurisdictionIds[1], district_jurisdiction_id: jurisdictionIds[3], current_stage_code: stageCodes[i], case_status: 'ACTIVE', stage_updated_at: isoDate(-i), sla_deadline: isoDate(30 + i), is_sla_breached: false, days_remaining_in_sla: 30 + i, total_acquisition_area_ha: 1 + i * 0.2, total_beneficiaries_count: 2 + i, data_quality_score: 82 + i, data_quality_passed_checks: 8 + i, data_quality_total_checks: 10, delay_risk_level: ['LOW', 'MEDIUM', 'HIGH', 'LOW', 'CRITICAL'][i], estimated_compensation_inr: 15000000 + i * 2500000, disbursed_compensation_inr: i === 3 ? 8000000 : 0, assigned_officer_user_id: userIds[3], version_no: 1, created_by: userIds[0] }, ['case_id']);
      await upsert('case_parcels', { case_parcel_id: caseParcelId, case_id: caseId, project_parcel_id: uuid(`project-parcel-${i + 1}`), case_parcel_status: i > 2 ? 'POSSESSION_ACQUIRED' : 'IDENTIFIED', acquired_area_ha: 1 + i * 0.2 }, ['case_parcel_id']);
      await upsert('case_stage_instances', { stage_instance_id: uuid(`stage-instance-${i + 1}`), case_id: caseId, stage_code: stageCodes[i], sequence_no: 1, stage_status: 'IN_PROGRESS', entered_at: isoDate(-i), due_at: isoDate(30 + i) }, ['stage_instance_id']);
      await upsert('case_workflow_transitions', { transition_id: uuid(`transition-${i + 1}`), case_id: caseId, from_stage_code: i ? stageCodes[i - 1] : null, to_stage_code: stageCodes[i], action_code: 'SEED_IMPORT', actor_user_id: userIds[0], reason: 'Development seed data', notes: 'Seed workflow transition', expected_case_version: 0, resulting_case_version: 1, previous_transition_hash: i ? sha256(`transition-${i}`) : null, transition_hash: sha256(`transition-${i + 1}`), signature_algorithm: 'SHA256' }, ['transition_id']);
      await upsert('case_risk_evaluations', { risk_evaluation_id: uuid(`risk-${i + 1}`), case_id: caseId, score: 20 + i * 15, risk_level: ['LOW', 'MEDIUM', 'HIGH', 'LOW', 'CRITICAL'][i], reasons: [`Seed risk reason ${i + 1}`], recommended_actions: ['Review statutory timeline'], model_version: 'seed-1.0', calculated_by: userIds[0] }, ['risk_evaluation_id']);
      await upsert('case_quality_assessments', { quality_assessment_id: uuid(`quality-${i + 1}`), case_id: caseId, score: 82 + i, passed_checks: 8 + i, total_checks: 10, missing_items: i === 4 ? ['Boundary verification'] : [], assessed_by: userIds[0] }, ['quality_assessment_id']);
      await upsert('litigation_cases', { litigation_id: uuid(`litigation-${i + 1}`), court_name: ['Civil Court Bengaluru', 'High Court of Karnataka', 'District Court Vadodara', 'Land Tribunal Bengaluru', 'High Court of Karnataka'][i], case_number: `LIT/SEED/2026/${String(i + 1).padStart(3, '0')}`, case_id: caseId, parcel_id: parcelIds[i], description: `Seed litigation record ${i + 1}`, created_by: userIds[0], litigation_status: ['FILED', 'HEARING', 'JUDGEMENT_PENDING', 'DISPOSED', 'APPEALED'][i] }, ['litigation_id']);
    }

    const documentIds = [];
    const documentVersionIds = [];
    for (let i = 0; i < 5; i++) {
      const documentId = uuid(`document-${i + 1}`);
      const versionId = uuid(`document-version-${i + 1}`);
      documentIds.push(documentId); documentVersionIds.push(versionId);
      await upsert('documents', { document_id: documentId, document_number: `DOC/SEED/2026/${String(i + 1).padStart(3, '0')}`, document_type_code: documentTypes[i], title: `Seed statutory document ${i + 1}`, project_id: projectIds[i], case_id: caseIds[i], parcel_id: parcelIds[i], approval_status: i < 2 ? 'APPROVED' : 'PENDING_APPROVAL', approval_notes: 'Seed document', approved_by: i < 2 ? userIds[0] : null, approved_at: i < 2 ? isoDate(-2) : null, current_version_no: 1, uploaded_by: userIds[1] }, ['document_id']);
      await upsert('document_versions', { document_version_id: versionId, document_id: documentId, version_no: 1, storage_provider: 'LOCAL', storage_bucket: 'seed-documents', object_key: `seed/document-${i + 1}.txt`, original_filename: `seed-document-${i + 1}.txt`, mime_type: 'text/plain', file_size_bytes: 1024 + i, sha256_hash: sha256(`document-${i + 1}`), change_summary: 'Initial seed version', uploaded_by: userIds[1] }, ['document_version_id']);
      // -------------------------------------------------------------
      // Authentic Bilingual Statutory E-Gazette Notifications Seed
      // -------------------------------------------------------------
      const gazetteSeedList = [
        {
          id: uuid('notice-1'),
          noticeNumber: 'MORTH/LA/2026/BLR-CHN/SEC11/0492',
          projectId: projectIds[0],
          caseId: caseIds[0],
          noticeType: 'SECTION_11_PRELIMINARY',
          sectionRef: 'Section 11(1)',
          gazetteRef: 'CG-DL-E-16092026-258901',
          volumeIssue: 'The Gazette of India : Extraordinary, Part II—Sec 3(ii), No. 492',
          status: 'PUBLISHED',
          publishedOn: dateOnly(-25),
          effectiveOn: dateOnly(-25),
          summary: 'Preliminary Notification under Section 11(1) of RFCTLARR Act 2013 for acquisition of 64.20 Hectares for Bengaluru-Chennai Expressway Corridor in Doddaballapur Taluk.',
          bilingual: {
            hindi_title: 'भारत का राजपत्र : असाधारण — सड़क परिवहन एवं राजमार्ग मंत्रालय अधिसूचना',
            english_title: 'The Gazette of India : Extraordinary — Ministry of Road Transport and Highways Notification',
            section: 'Section 11(1)',
            section_hi: 'धारा 11(1) प्रारंभिक अधिसूचना',
            state_name: 'Karnataka',
            state_name_hi: 'कर्नाटक',
            ministry_name: 'Ministry of Road Transport and Highways',
            ministry_name_hi: 'सड़क परिवहन एवं राजमार्ग मंत्रालय',
            issuing_authority: 'Priya Sundaram, IAS, Special Land Acquisition Officer & CALA',
            issuing_authority_hi: 'प्रिया सुंदरम, भा.प्र.से., सक्षम प्राधिकारी भूमि अधिग्रहण (काला)',
            public_purpose: 'Construction of 8-Lane Bengaluru-Chennai Greenfield Expressway Corridor (KM 14+000 to KM 38+500)',
            public_purpose_hi: '8-लेन बेंगलुरु-चेन्नई ग्रीनफील्ड एक्सप्रेसवे गलियारे का निर्माण (किमी 14+000 से किमी 38+500)',
            hindi_body: 'केन्द्रीय सरकार, भूमि अर्जन, पुनर्वासन और पुनर्व्यवस्थापन में उचित प्रतिकर और पारदर्शिता का अधिकार अधिनियम, 2013 (2013 का 30) की धारा 11 की उपधारा (1) द्वारा प्रदत्त शक्तियों का प्रयोग करते हुए, यह अधिसूचित करती है कि इस अनुसूची में विनिर्दिष्ट भूमि उक्त अधिनियम के प्रयोजनों के लिए लोक प्रयोजन अर्थात् बेंगलुरु-चेन्नई ग्रीनफील्ड एक्सप्रेसवे के निर्माण हेतु अपेक्षित है।\\n\\nउक्त अधिनियम की धारा 11(4) के अनुसार, इस अधिसूचना के ई-राजपत्र में प्रकाशन की तारीख से कोई भी व्यक्ति विनिर्दिष्ट भूमि का किसी भी प्रकार से अंतरण, विक्रय, बंधक या अन्य कोई संव्यवहार नहीं करेगा।',
            english_body: 'In exercise of the powers conferred by sub-section (1) of Section 11 of the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (30 of 2013), the Central Government hereby notifies that the land specified in the Schedule annexed hereto is required for a public purpose, namely the construction of Bengaluru-Chennai Greenfield Expressway.\\n\\nIn accordance with Section 11(4) of the said Act, no person shall make any transaction, transfer, sale, lease, or create any encumbrance on the specified land from the date of publication of this statutory notification.',
            hearing_officer: 'Special Land Acquisition Officer & Competent Authority (CALA), Doddaballapur Division',
            rehabilitation_administrator: 'Additional Deputy Commissioner (Revenue), Bengaluru Rural District',
          },
          schedule: [
            { ulpin: 'KA-BLR-SEED-0001', surveyNo: '142/2A', khasraNo: '142/2A', village: 'Doddaballapur', taluk: 'Doddaballapur', landCategory: 'AGRICULTURAL', totalAreaHa: 1.25, acquiredAreaHa: 1.00, areaAcres: 2.47, areaVigha: 3.95, ownerName: 'Rameshwar Sharma & Brothers' },
            { ulpin: 'KA-BLR-SEED-0002', surveyNo: '143/1B', khasraNo: '143/1B', village: 'Doddaballapur', taluk: 'Doddaballapur', landCategory: 'AGRICULTURAL', totalAreaHa: 1.60, acquiredAreaHa: 1.20, areaAcres: 2.96, areaVigha: 4.74, ownerName: 'Smt. Gangamma W/o Venkatappa' },
            { ulpin: 'KA-BLR-SEED-0003', surveyNo: '144/C', khasraNo: '144/C', village: 'Doddaballapur', taluk: 'Doddaballapur', landCategory: 'COMMERCIAL', totalAreaHa: 0.85, acquiredAreaHa: 0.85, areaAcres: 2.10, areaVigha: 3.36, ownerName: 'Hosur Agro Processing Pvt Ltd' },
            { ulpin: 'KA-BLR-SEED-0004', surveyNo: '145/2', khasraNo: '145/2', village: 'Doddaballapur', taluk: 'Doddaballapur', landCategory: 'AGRICULTURAL', totalAreaHa: 2.10, acquiredAreaHa: 1.40, areaAcres: 3.46, areaVigha: 5.53, ownerName: 'Krishnappa S/o Muniswamy' },
          ]
        },
        {
          id: uuid('notice-2'),
          noticeNumber: 'MOR/WDFC/2026/SEC15/0118',
          projectId: projectIds[1],
          caseId: caseIds[1],
          noticeType: 'SECTION_15_OBJECTIONS',
          sectionRef: 'Section 15(2)',
          gazetteRef: 'DL-RJ-E-12092026-194021',
          volumeIssue: 'Rajasthan Gazette Extraordinary Part IV-C, No. 118',
          status: 'PUBLISHED',
          publishedOn: dateOnly(-15),
          effectiveOn: dateOnly(10),
          summary: 'Statutory Hearing Notice under Section 15(2) of RFCTLARR Act 2013 for hearing of written objections by Competent Authority Land Acquisition (CALA).',
          bilingual: {
            hindi_title: 'राजस्थान राजपत्र : असाधारण — सक्षम प्राधिकारी एवं उपखंड दंडाधिकारी न्यायालय नोटिस',
            english_title: 'Rajasthan Gazette : Extraordinary — Court of Competent Authority & Sub-Divisional Magistrate Notice',
            section: 'Section 15(2)',
            section_hi: 'धारा 15(2) आपत्ति सुनवाई नोटिस',
            state_name: 'Rajasthan',
            state_name_hi: 'राजस्थान',
            ministry_name: 'Ministry of Railways (Dedicated Freight Corridor)',
            ministry_name_hi: 'रेल मंत्रालय (समर्पित माल गलियारा)',
            issuing_authority: 'Harishankar Meena, RAS, Competent Authority Land Acquisition (CALA)',
            issuing_authority_hi: 'हरिशंकर मीणा, आर.ए.एस., सक्षम प्राधिकारी भूमि अधिग्रहण',
            hearing_date: '2026-10-15',
            hearing_time: '11:00 AM IST',
            hearing_venue: 'Court Room of CALA & SDM, Phulera Junction, Jaipur Rural',
            hearing_venue_hi: 'न्यायालय कक्ष, सक्षम प्राधिकारी (काला) एवं उपखंड दंडाधिकारी, फुलेरा जंक्शन, जयपुर ग्रामीण',
            hindi_body: 'सर्वसाधारण एवं प्रभावित भूमि स्वामियों को सूचित किया जाता है कि वेस्टर्न फ्रेट कॉरिडोर हेतु धारा 11 के तहत अधिसूचित भूमि के संबंध में धारा 15(1) के तहत प्राप्त आपत्तियों की वैधानिक व्यक्तिगत सुनवाई धारा 15(2) के अंतर्गत दिनांक 15-10-2026 को आयोजित की जाएगी। सभी हितबद्ध व्यक्ति अपने मूल राजस्व स्वत्व अभिलेखों सहित उपस्थित हों।',
            english_body: 'Notice is hereby given to all interested persons that formal hearing of objections filed under Section 15(1) regarding land notified for Western Dedicated Freight Corridor will be conducted by the Competent Authority on 15-10-2026. Claimants must attend in person or through authorized advocates with original revenue title deeds and survey maps.'
          },
          schedule: [
            { ulpin: 'RJ-JPR-SEED-0101', surveyNo: '302/1', khasraNo: '302/1', village: 'Phulera', taluk: 'Phulera', landCategory: 'AGRICULTURAL', totalAreaHa: 2.10, acquiredAreaHa: 1.50, areaAcres: 3.71, areaVigha: 5.93, ownerName: 'Bhagwan Sahai Jat' },
            { ulpin: 'RJ-JPR-SEED-0102', surveyNo: '305/4', khasraNo: '305/4', village: 'Phulera', taluk: 'Phulera', landCategory: 'AGRICULTURAL', totalAreaHa: 1.85, acquiredAreaHa: 1.10, areaAcres: 2.72, areaVigha: 4.35, ownerName: 'Ramprasad Sharma' },
          ]
        },
        {
          id: uuid('notice-3'),
          noticeNumber: 'NHAI/DME/2026/SEC19/0340',
          projectId: projectIds[2],
          caseId: caseIds[2],
          noticeType: 'SECTION_19_FINAL_DECLARATION',
          sectionRef: 'Section 19(1)',
          gazetteRef: 'GJ-BRC-E-05092026-89211',
          volumeIssue: 'Gujarat Government Gazette Extraordinary Part IV-A, No. 340',
          status: 'PUBLISHED',
          publishedOn: dateOnly(-8),
          effectiveOn: dateOnly(-8),
          summary: 'Statutory Declaration under Section 19(1) of RFCTLARR Act 2013 constituting conclusive proof of public requirement for Delhi-Mumbai Expressway Corridor.',
          bilingual: {
            hindi_title: 'गुजरात सरकार राजपत्र : असाधारण — राजस्व विभाग अंतिम घोषणा (धारा 19)',
            english_title: 'Gujarat Government Gazette : Extraordinary — Revenue Department Declaration (Section 19)',
            section: 'Section 19(1)',
            section_hi: 'धारा 19(1) अधिग्रहण की अंतिम घोषणा',
            state_name: 'Gujarat',
            state_name_hi: 'गुजरात',
            ministry_name: 'Ministry of Road Transport and Highways / NHAI',
            ministry_name_hi: 'सड़क परिवहन एवं राजमार्ग मंत्रालय / एनएचएआई',
            issuing_authority: 'Bhupendra Patel, IAS, District Collector & Arbitrator, Vadodara',
            issuing_authority_hi: 'भूपेंद्र पटेल, भा.प्र.से., जिला कलेक्टर एवं मध्यस्थ, वडोदरा',
            public_purpose: 'Construction of Delhi-Mumbai Expressway Package-18 Connecting Vadodara-Surat Spur',
            public_purpose_hi: 'दिल्ली-मुंबई एक्सप्रेसवे पैकेज-18 वडोदरा-सूरत स्पर संपर्क मार्ग निर्माण',
            hindi_body: 'अधिनियम 2013 की धारा 19(1) के अनुसरण में एतद्द्वारा घोषित किया जाता है कि इस अनुसूची में वर्णित भूमि लोक प्रयोजन अर्थात् दिल्ली-मुंबई एक्सप्रेसवे के निर्माण हेतु अनिवार्य रूप से अपेक्षित है। उक्त अधिनियम की धारा 19(2) के अनुसार पुनर्वासन और पुनर्व्यवस्थापन योजना का सारांश संबंधित ग्राम पंचायतों और कलेक्टर कार्यालय में निशुल्क निरीक्षण हेतु उपलब्ध है। यह घोषणा लोक प्रयोजन का निश्चायक साक्ष्य है।',
            english_body: 'In pursuance of Section 19(1) of the RFCTLARR Act, 2013, it is hereby declared that the land described in the Schedule hereto is required for a public purpose, namely Delhi-Mumbai Expressway Package-18. A summary of the Rehabilitation and Resettlement Scheme has been published under Section 19(2) and is available for public inspection. This declaration is conclusive evidence of public purpose under Section 19(3).'
          },
          schedule: [
            { ulpin: 'GJ-VAD-SEED-0201', surveyNo: '88/1', khasraNo: '88/1', village: 'Karjan', taluk: 'Karjan', landCategory: 'AGRICULTURAL', totalAreaHa: 3.40, acquiredAreaHa: 2.80, areaAcres: 6.92, areaVigha: 11.07, ownerName: 'Manishbhai Dahyabhai Patel' },
            { ulpin: 'GJ-VAD-SEED-0202', surveyNo: '91/2', khasraNo: '91/2', village: 'Karjan', taluk: 'Karjan', landCategory: 'IRRIGATED_DOUBLE_CROP', totalAreaHa: 2.20, acquiredAreaHa: 1.90, areaAcres: 4.69, areaVigha: 7.51, ownerName: 'Sanjaybhai Arvindbhai Solanki' },
          ]
        },
        {
          id: uuid('notice-4'),
          noticeNumber: 'MNRE/SOLAR/2026/SEC23/0512',
          projectId: projectIds[3],
          caseId: caseIds[3],
          noticeType: 'SECTION_23_AWARD',
          sectionRef: 'Section 23 & 30',
          gazetteRef: 'KA-TUM-E-18082026-77129',
          volumeIssue: 'Karnataka Gazette Extraordinary Part III, No. 512',
          status: 'PUBLISHED',
          publishedOn: dateOnly(-4),
          effectiveOn: dateOnly(-4),
          summary: 'Collector Compensation Award & Solatium Order under Sections 23, 26, 27, 28, 29 & 30 of RFCTLARR Act 2013 (100% Solatium + 12% Additional Market Value).',
          bilingual: {
            hindi_title: 'कर्नाटक राजपत्र : असाधारण — समाहर्ता (कलेक्टर) प्रतिकर पंचाट एवं सांत्वना आदेश',
            english_title: 'Karnataka Gazette : Extraordinary — Collector Compensation Award & Solatium Order',
            section: 'Section 23 & 30',
            section_hi: 'धारा 23 एवं 30 प्रतिकर पंचाट',
            state_name: 'Karnataka',
            state_name_hi: 'कर्नाटक',
            ministry_name: 'Ministry of New & Renewable Energy / KREDL',
            ministry_name_hi: 'नवीन एवं नवीकरणीय ऊर्जा मंत्रालय',
            issuing_authority: 'Manjunath Reddy, KAS, Special Land Acquisition Officer, Pavagada Solar Project',
            issuing_authority_hi: 'मंजूनाथ रेड्डी, के.ए.एस., विशेष भूमि अधिग्रहण अधिकारी, पावागड़ा',
            solatium_pct: 100,
            interest_pct: 12,
            tax_exemption_clause: 'Exempt from Income Tax under Section 96 of RFCTLARR Act 2013 & Section 10(37) of Income Tax Act 1961',
            tax_exemption_clause_hi: 'RFCTLARR अधिनियम 2013 की धारा 96 एवं आयकर अधिनियम 1961 की धारा 10(37) के तहत आयकर से पूर्ण छूट',
            hindi_body: 'समाहर्ता अधिनियम की धारा 23 के अधीन समस्त दावों की जांच के उपरांत एतद्द्वारा पंचाट घोषित करते हैं। धारा 26 के अधीन निर्धारित मूल बाजार मूल्य पर धारा 30(1) के अंतर्गत 100% सांत्वना राशि (Solatium) तथा धारा 30(3) के अंतर्गत अधिसूचना की तारीख से 12% वार्षिक ब्याज देय होगा। यह मुआवजा राशि आयकर से पूर्णतः मुक्त है।',
            english_body: 'The Collector, having enquired into all claims under Section 23 of the Act, hereby declares the final Compensation Award. In accordance with Section 30(1), 100% Solatium is awarded over base market value, plus 12% per annum additional market value interest under Section 30(3). Under Section 96, no income tax or stamp duty shall be levied on this award.'
          },
          schedule: [
            { ulpin: 'KA-TUM-SEED-0301', surveyNo: '54/1', khasraNo: '54/1', village: 'Pavagada', taluk: 'Pavagada', landCategory: 'AGRICULTURAL', totalAreaHa: 4.50, acquiredAreaHa: 4.50, areaAcres: 11.12, areaVigha: 17.79, baseValueINR: 37500000, solatiumINR: 37500000, totalAwardINR: 76000000, ownerName: 'Hanumanthappa S/o Thimmanna' },
          ]
        },
        {
          id: uuid('notice-5'),
          noticeNumber: 'VDA/UMC/2026/SEC11/DRAFT-01',
          projectId: projectIds[4],
          caseId: caseIds[4],
          noticeType: 'SECTION_11_PRELIMINARY',
          sectionRef: 'Section 11(1)',
          gazetteRef: null,
          volumeIssue: null,
          status: 'CALA_APPROVED',
          publishedOn: null,
          effectiveOn: null,
          summary: 'Preliminary Gazette Draft under Section 11(1) for Vadodara Urban Mobility Corridor, signed and verified by Competent Authority Land Acquisition (CALA).',
          bilingual: {
            hindi_title: 'गुजरात राजपत्र प्रारूप : वडोदरा शहरी गतिशीलता गलियारा — प्रारंभिक अधिसूचना',
            english_title: 'Gujarat Gazette Draft : Vadodara Urban Mobility Corridor — Preliminary Notification',
            section: 'Section 11(1)',
            section_hi: 'धारा 11(1) प्रारंभिक अधिसूचना',
            state_name: 'Gujarat',
            state_name_hi: 'गुजरात',
            ministry_name: 'Ministry of Housing and Urban Affairs / VDA',
            ministry_name_hi: 'आवासन और शहरी कार्य मंत्रालय / वडोदरा विकास प्राधिकरण',
            issuing_authority: 'Dr. Rahul Dave, GAS, Competent Authority Land Acquisition, Vadodara',
            issuing_authority_hi: 'डॉ. राहुल दवे, जी.ए.एस., सक्षम प्राधिकारी भूमि अधिग्रहण, वडोदरा',
            public_purpose: 'Construction of Ring Road Elevated Metro Corridor & BRTS Multi-Modal Hub',
            public_purpose_hi: 'रिंग रोड एलिवेटेड मेट्रो कॉरिडोर एवं बीआरटीएस मल्टी-मॉडल हब निर्माण',
            hindi_body: 'वडोदरा विकास प्राधिकरण शहरी गतिशीलता परियोजना हेतु अधिनियम 2013 की धारा 11(1) के तहत प्रारंभिक अधिसूचना जारी की जाती है।',
            english_body: 'Preliminary notification is hereby issued under Section 11(1) of RFCTLARR Act 2013 for acquisition of land for Vadodara Urban Mobility Ring Road & BRTS interchange.'
          },
          schedule: [
            { ulpin: 'GJ-VAD-SEED-0401', surveyNo: '112/A', khasraNo: '112/A', village: 'Gorwa', taluk: 'Vadodara City', landCategory: 'COMMERCIAL', totalAreaHa: 1.10, acquiredAreaHa: 0.90, areaAcres: 2.22, areaVigha: 3.56, ownerName: 'Shree Krishna Agro Logistics LLP' },
          ]
        },
        {
          id: uuid('notice-6'),
          noticeNumber: 'NHAI/BLR-CHN/2026/SEC19/DRAFT-02',
          projectId: projectIds[0],
          caseId: caseIds[0],
          noticeType: 'SECTION_19_FINAL_DECLARATION',
          sectionRef: 'Section 19(1)',
          gazetteRef: null,
          volumeIssue: null,
          status: 'DRAFT',
          publishedOn: null,
          effectiveOn: null,
          summary: 'Draft Final Declaration under Section 19(1) for Bengaluru-Chennai Expressway Hosur Section under review by Special Land Acquisition Officer.',
          bilingual: {
            hindi_title: 'भारत का राजपत्र प्रारूप : बेंगलुरु-चेन्नई एक्सप्रेसवे होसुर खंड — अंतिम घोषणा',
            english_title: 'The Gazette of India Draft : Bengaluru-Chennai Expressway Hosur Section — Final Declaration',
            section: 'Section 19(1)',
            section_hi: 'धारा 19(1) अंतिम घोषणा',
            state_name: 'Karnataka',
            state_name_hi: 'कर्नाटक',
            ministry_name: 'Ministry of Road Transport and Highways',
            ministry_name_hi: 'सड़क परिवहन एवं राजमार्ग मंत्रालय',
            issuing_authority: 'Priya Sundaram, IAS, Special Land Acquisition Officer & CALA',
            issuing_authority_hi: 'प्रिया सुंदरम, भा.प्र.से., सक्षम प्राधिकारी भूमि अधिग्रहण',
            public_purpose: 'Bengaluru-Chennai Expressway Tollway Facility and Interchange at Hosur Border',
            public_purpose_hi: 'बेंगलुरु-चेन्नई एक्सप्रेसवे टोलवे सुविधा एवं होसुर सीमा इंटरचेंज निर्माण',
            hindi_body: 'धारा 15 के अंतर्गत प्राप्त आपत्तियों के निस्तारण उपरांत धारा 19(1) की अंतिम घोषणा प्रारूप तैयार किया गया है।',
            english_body: 'Following disposal of objections under Section 15, draft final declaration under Section 19(1) is prepared for administrative vetting.'
          },
          schedule: [
            { ulpin: 'KA-BLR-SEED-0001', surveyNo: '142/2A', khasraNo: '142/2A', village: 'Doddaballapur', taluk: 'Doddaballapur', landCategory: 'AGRICULTURAL', totalAreaHa: 1.25, acquiredAreaHa: 1.00, areaAcres: 2.47, areaVigha: 3.95, ownerName: 'Rameshwar Sharma & Brothers' },
          ]
        }
      ];

      for (const item of gazetteSeedList) {
        const hash = sha256(item.noticeNumber + JSON.stringify(item.bilingual));
        await upsert('statutory_notices', {
          statutory_notice_id: item.id,
          notice_number: item.noticeNumber,
          project_id: item.projectId,
          case_id: item.caseId,
          document_id: documentIds[0],
          notice_type: item.noticeType,
          section_reference: item.sectionRef,
          gazette_reference: item.gazetteRef,
          gazette_volume_issue: item.volumeIssue,
          publication_status: item.status,
          published_on: item.publishedOn,
          effective_on: item.effectiveOn,
          public_summary: item.summary,
          bilingual_content: item.bilingual,
          sha256_hash: hash,
          cadastral_schedule: item.schedule,
          created_by: userIds[0]
        }, ['statutory_notice_id']);

        if (item.schedule && item.schedule.length > 0) {
          await upsert('statutory_notice_parcels', {
            statutory_notice_id: item.id,
            case_parcel_id: caseParcelIds[0]
          }, ['statutory_notice_id', 'case_parcel_id']);
        }
      }
    }

    const policyIds = [];
    const awardIds = [];
    const beneficiaryIds = [];
    const batchIds = [];
    for (let i = 0; i < 5; i++) {
      const policyId = uuid(`policy-${i + 1}`);
      const awardId = uuid(`award-${i + 1}`);
      const beneficiaryId = uuid(`beneficiary-${i + 1}`);
      const batchId = uuid(`batch-${i + 1}`);
      policyIds.push(policyId); awardIds.push(awardId); beneficiaryIds.push(beneficiaryId); batchIds.push(batchId);
      await upsert('compensation_policies', { policy_id: policyId, policy_code: `RFCTLARR-SEED-${i + 1}`, policy_name: `Seed compensation policy ${i + 1}`, jurisdiction_id: jurisdictionIds[(i % 2) + 1], source_reference: 'RFCTLARR-2013', effective_from: dateOnly(-365), rural_multiplier: 1.5, urban_multiplier: 1, solatium_percent: 100, annual_interest_percent: 12, is_active: true, created_by: userIds[0] }, ['policy_id']);
      await upsert('award_calculations', { award_calculation_id: awardId, case_parcel_id: caseParcelIds[i], policy_id: policyId, calculation_version: 1, area_sqm: 10000 + i * 1000, base_market_rate_per_sqm: 2500, multiplier_factor: 1.5, total_market_value_inr: 37500000 + i * 1000000, solatium_inr: 37500000 + i * 1000000, additional_interest_inr: 1000000, assets_on_land_inr: 500000, gross_award_inr: 76000000 + i * 2000000, deductions_inr: 0, net_award_inr: 76000000 + i * 2000000, calculation_status: i < 2 ? 'APPROVED' : 'DRAFT', inputs_snapshot: { source: 'seed' }, calculated_by: userIds[3], approved_by: i < 2 ? userIds[3] : null }, ['award_calculation_id']);
      await upsert('beneficiaries', { beneficiary_id: beneficiaryId, case_id: caseIds[i], case_parcel_id: caseParcelIds[i], beneficiary_reference: `BEN-SEED-${i + 1}`, masked_name: `Beneficiary ${i + 1}`, share_percentage: 100, calculated_amount_inr: 76000000 + i * 2000000, bank_account_last4: `${1000 + i}`, ifsc_code: 'SBIN0001234', verification_status: i < 3 ? 'VERIFIED' : 'PENDING', disbursement_status: i < 2 ? 'CREDITED' : 'PENDING', pfms_transaction_id: i < 2 ? `PFMS-TXN-SEED-${i + 1}` : null, disbursed_at: i < 2 ? isoDate(-1) : null }, ['beneficiary_id']);
      await upsert('payment_batches', { payment_batch_id: batchId, batch_number: `PFMS-SEED-${i + 1}`, case_id: caseIds[i], total_beneficiaries: 1, total_amount_inr: 76000000 + i * 2000000, payment_status: i < 2 ? 'COMPLETED' : 'CREATED', pfms_request_reference: `PFMS-REQ-SEED-${i + 1}`, pfms_batch_reference: `PFMS/SEED/2026/${i + 1}`, initiated_by: userIds[3], initiated_at: isoDate(-5), completed_at: i < 2 ? isoDate(-1) : null }, ['payment_batch_id']);
      await upsert('payment_batch_items', { payment_batch_item_id: uuid(`batch-item-${i + 1}`), payment_batch_id: batchId, beneficiary_id: beneficiaryId, amount_inr: 76000000 + i * 2000000, item_status: i < 2 ? 'CREDITED' : 'PENDING', pfms_transaction_id: i < 2 ? `PFMS-TXN-SEED-${i + 1}` : null, submitted_at: isoDate(-4), credited_at: i < 2 ? isoDate(-1) : null }, ['payment_batch_item_id']);
    }

    const familyIds = [];
    const grievanceIds = [];
    const surveyIds = [];
    const mediaIds = [];
    const possessionIds = [];
    for (let i = 0; i < 5; i++) {
      const familyId = uuid(`family-${i + 1}`);
      const grievanceId = uuid(`grievance-${i + 1}`);
      const surveyId = uuid(`survey-${i + 1}`);
      const mediaId = uuid(`media-${i + 1}`);
      const possessionId = uuid(`possession-${i + 1}`);
      familyIds.push(familyId); grievanceIds.push(grievanceId); surveyIds.push(surveyId); mediaIds.push(mediaId); possessionIds.push(possessionId);
      await upsert('affected_families', { family_id: familyId, case_id: caseIds[i], family_reference: `FAMILY-SEED-${i + 1}`, masked_head_name: `Family Head ${i + 1}`, vulnerability_category: ['SC', 'ST', 'BPL', 'WOMAN_HEADED', 'GENERAL'][i], family_members_count: 3 + i, displaced_from_village: 'Doddaballapur', housing_grant_status: i < 2 ? 'DISBURSED' : 'ELIGIBLE', subsistence_allowance_status: i < 2 ? 'SANCTIONED' : 'ELIGIBLE', total_entitlement_inr: 710000 + i * 50000, disbursed_amount_inr: i < 2 ? 350000 : 0 }, ['family_id']);
      await upsert('rr_benefits', { rr_benefit_id: uuid(`rr-benefit-${i + 1}`), family_id: familyId, benefit_type: `HOUSING_GRANT_${i + 1}`, eligibility_status: 'ELIGIBLE', sanction_status: i < 2 ? 'SANCTIONED' : 'NOT_STARTED', entitlement_amount_inr: 350000 + i * 10000, disbursed_amount_inr: i < 2 ? 350000 : 0, sanctioned_at: i < 2 ? isoDate(-5) : null, notes: 'Seed R&R benefit' }, ['rr_benefit_id']);
      await upsert('grievances', { grievance_id: grievanceId, grievance_reference: `GRV-SEED-2026-${i + 1}`, case_id: caseIds[i], parcel_id: parcelIds[i], tracking_token_hash: sha256(`grievance-${i + 1}`), citizen_name_masked: `Citizen ${i + 1}`, citizen_phone_masked: `+91******${1000 + i}`, category: 'COMPENSATION', details: `Seed grievance details ${i + 1}`, grievance_status: ['LOGGED', 'LOGGED', 'HEARING_SCHEDULED', 'RESOLVED', 'ESCALATED'][i], filed_at: isoDate(-10), sla_deadline: isoDate(10), assigned_to: userIds[3] }, ['grievance_id']);
      await upsert('grievance_hearings', { hearing_id: uuid(`hearing-${i + 1}`), grievance_id: grievanceId, scheduled_at: isoDate(10 + i), venue: 'District Collectorate', presiding_officer_user_id: userIds[3], hearing_status: 'SCHEDULED' }, ['hearing_id']);
      await upsert('offline_sync_records', { sync_record_id: uuid(`sync-${i + 1}`), client_record_id: `MOBILE-SEED-${i + 1}`, user_id: userIds[4], entity_type: 'FIELD_SURVEY', entity_id: surveyId, operation: 'CREATE', payload_hash: sha256(`sync-${i + 1}`), payload: { source: 'seed', index: i + 1 }, sync_status: 'APPLIED', server_response: { status: 'SUCCESS' } }, ['sync_record_id']);
      await upsert('field_surveys', { survey_id: surveyId, client_record_id: `SURVEY-SEED-${i + 1}`, case_id: caseIds[i], case_parcel_id: caseParcelIds[i], surveyor_user_id: userIds[4], survey_type: 'BOUNDARY_VERIFICATION', device_id: `DEVICE-SEED-${i + 1}`, survey_started_at: isoDate(-4), surveyed_at: isoDate(-3), gps_location: point(i), gps_accuracy_m: 1.2, demarcation_confirmed: i < 3, witness_names: [`Witness ${i + 1}`], observations: 'Seed field survey observation', sync_status: 'SYNCED', payload_hash: sha256(`survey-${i + 1}`) }, ['survey_id']);
      await upsert('field_survey_points', { survey_point_id: uuid(`survey-point-${i + 1}`), survey_id: surveyId, point_sequence: 1, point_type: 'BOUNDARY', location: point(i), accuracy_m: 1.2, captured_at: isoDate(-3) }, ['survey_point_id']);
      await upsert('media_assets', { media_asset_id: mediaId, client_asset_id: `MEDIA-SEED-${i + 1}`, case_id: caseIds[i], case_parcel_id: caseParcelIds[i], survey_id: surveyId, document_id: documentIds[i], storage_provider: 'LOCAL', storage_bucket: 'seed-media', object_key: `seed/photo-${i + 1}.jpg`, original_filename: `photo-${i + 1}.jpg`, mime_type: 'image/jpeg', file_size_bytes: 2048 + i, sha256_hash: sha256(`media-${i + 1}`), captured_at: isoDate(-3), captured_by: userIds[4], gps_location: point(i), gps_accuracy_m: 1.2, caption: 'Seed geotagged survey photograph' }, ['media_asset_id']);
      await upsert('possession_records', { possession_record_id: possessionId, memo_number: `POS-SEED-2026-${i + 1}`, case_id: caseIds[i], handover_date: isoDate(60 + i), receiving_agency: 'National Infrastructure Development Agency', field_officer_user_id: userIds[4], panchanama_signed: i < 2, possession_status: i < 2 ? 'COMPLETED' : 'SCHEDULED', remarks: 'Seed possession record', signed_document_id: documentIds[i], created_by: userIds[3] }, ['possession_record_id']);
      await upsert('possession_parcels', { possession_record_id: possessionId, case_parcel_id: caseParcelIds[i], handed_over_area_ha: 1 + i * 0.2 }, ['possession_record_id', 'case_parcel_id']);
      await upsert('possession_witnesses', { possession_witness_id: uuid(`witness-${i + 1}`), possession_record_id: possessionId, witness_name: `Village Witness ${i + 1}`, witness_role: 'Panchayat Representative', identity_reference_masked: `ID****${i + 1}`, signature_media_asset_id: mediaId }, ['possession_witness_id']);
      await upsert('possession_media', { possession_record_id: possessionId, media_asset_id: mediaId, evidence_type: 'POSSESSION_EVIDENCE' }, ['possession_record_id', 'media_asset_id']);
    }

    for (let i = 0; i < 5; i++) {
      await upsert('notifications', { notification_id: uuid(`notification-${i + 1}`), user_id: userIds[i], case_id: caseIds[i], project_id: projectIds[i], notification_type: 'CASE_UPDATE', severity: i === 4 ? 'WARNING' : 'INFO', title: `Seed notification ${i + 1}`, message: 'A seeded case record requires review.', action_url: `/cases/${caseIds[i]}`, channel: 'IN_APP', delivery_status: 'DELIVERED', sent_at: isoDate(-1) }, ['notification_id']);
      await upsert('integration_outbox', { outbox_event_id: uuid(`outbox-${i + 1}`), event_key: `SEED-EVENT-${i + 1}`, event_type: 'CASE_CREATED', aggregate_type: 'acquisition_case', aggregate_id: caseIds[i], payload: { source: 'seed', caseId: caseIds[i] }, delivery_status: 'DELIVERED', attempt_count: 1, next_attempt_at: isoDate(1) }, ['outbox_event_id']);
      await upsert('audit_events', { audit_event_id: uuid(`audit-${i + 1}`), request_id: uuid(`request-${i + 1}`), actor_user_id: userIds[i], action_code: 'SEED_IMPORT', entity_type: 'acquisition_case', entity_id: caseIds[i], jurisdiction_id: jurisdictionIds[3], before_state: {}, after_state: { seeded: true }, metadata: { source: 'seed-postgresql' }, ip_address: '127.0.0.1', previous_event_hash: i ? sha256(`audit-${i}`) : null, event_hash: sha256(`audit-${i + 1}`), signature_algorithm: 'SHA256' }, ['audit_event_id']);
      await upsert('api_idempotency_keys', { idempotency_key: `SEED-IDEMPOTENCY-${i + 1}`, user_id: userIds[i], request_method: 'POST', request_path: `/v1/cases/${caseIds[i]}`, request_fingerprint: sha256(`idempotency-${i + 1}`), response_status: 201, response_body: { status: 'SUCCESS' }, expires_at: isoDate(30) }, ['idempotency_key']);
      await upsert('schema_migrations', { migration_key: `seed-postgresql-v1-${i + 1}`, checksum_sha256: sha256(`seed-postgresql-v1-${i + 1}`), applied_at: isoDate(-i), applied_by: 'seed-postgresql' }, ['migration_key']);
    }

    // 1. state_benchmarks (10 records)
    const stateBenchmarksData = [
      { id: "GJ", state: "Gujarat", state_hi: "गुजरात", zone: "West", projects: 26, target_ha: 2800, acquired_ha: 2650, completion_pct: 94.6, avg_days: 210, sla_compliance_pct: 95.4, dbt_payment_pct: 96.2, rr_completion_pct: 91.5, grievance_resolution_pct: 94.0, litigation_rate: 8.2, data_quality_score: 96, budget_utilization_pct: 97.4, status: "EXEMPLARY" },
      { id: "RJ", state: "Rajasthan", state_hi: "राजस्थान", zone: "North", projects: 26, target_ha: 2900, acquired_ha: 2680, completion_pct: 92.4, avg_days: 220, sla_compliance_pct: 93.1, dbt_payment_pct: 94.0, rr_completion_pct: 90.2, grievance_resolution_pct: 92.5, litigation_rate: 7.8, data_quality_score: 94, budget_utilization_pct: 94.2, status: "EXEMPLARY" },
      { id: "TN", state: "Tamil Nadu", state_hi: "तमिलनाडु", zone: "South", projects: 22, target_ha: 2100, acquired_ha: 1910, completion_pct: 91.0, avg_days: 230, sla_compliance_pct: 92.4, dbt_payment_pct: 92.8, rr_completion_pct: 89.1, grievance_resolution_pct: 91.0, litigation_rate: 9.5, data_quality_score: 93, budget_utilization_pct: 93.0, status: "EXEMPLARY" },
      { id: "MH", state: "Maharashtra", state_hi: "महाराष्ट्र", zone: "West", projects: 36, target_ha: 3400, acquired_ha: 3020, completion_pct: 88.8, avg_days: 240, sla_compliance_pct: 91.8, dbt_payment_pct: 93.5, rr_completion_pct: 88.0, grievance_resolution_pct: 89.2, litigation_rate: 12.4, data_quality_score: 92, budget_utilization_pct: 91.8, status: "ON_TRACK" },
      { id: "MP", state: "Madhya Pradesh", state_hi: "मध्य प्रदेश", zone: "Central", projects: 24, target_ha: 2600, acquired_ha: 2280, completion_pct: 87.7, avg_days: 250, sla_compliance_pct: 91.0, dbt_payment_pct: 92.0, rr_completion_pct: 87.0, grievance_resolution_pct: 88.4, litigation_rate: 11.2, data_quality_score: 90, budget_utilization_pct: 90.4, status: "ON_TRACK" },
      { id: "KA", state: "Karnataka", state_hi: "कर्नाटक", zone: "South", projects: 26, target_ha: 2400, acquired_ha: 2050, completion_pct: 85.4, avg_days: 265, sla_compliance_pct: 90.2, dbt_payment_pct: 91.0, rr_completion_pct: 86.5, grievance_resolution_pct: 87.0, litigation_rate: 14.1, data_quality_score: 89, budget_utilization_pct: 88.5, status: "ON_TRACK" },
      { id: "HR", state: "Haryana", state_hi: "हरियाणा", zone: "North", projects: 21, target_ha: 1800, acquired_ha: 1520, completion_pct: 84.4, avg_days: 270, sla_compliance_pct: 89.7, dbt_payment_pct: 90.5, rr_completion_pct: 84.8, grievance_resolution_pct: 86.2, litigation_rate: 15.2, data_quality_score: 88, budget_utilization_pct: 87.2, status: "ON_TRACK" },
      { id: "UP", state: "Uttar Pradesh", state_hi: "उत्तर प्रदेश", zone: "North", projects: 41, target_ha: 4200, acquired_ha: 3450, completion_pct: 82.1, avg_days: 295, sla_compliance_pct: 88.5, dbt_payment_pct: 89.2, rr_completion_pct: 83.4, grievance_resolution_pct: 84.0, litigation_rate: 18.6, data_quality_score: 85, budget_utilization_pct: 86.0, status: "NEEDS_INTERVENTION" },
      { id: "AP", state: "Andhra Pradesh", state_hi: "आंध्र प्रदेश", zone: "South", projects: 18, target_ha: 1950, acquired_ha: 1480, completion_pct: 75.9, avg_days: 310, sla_compliance_pct: 86.2, dbt_payment_pct: 85.1, rr_completion_pct: 79.2, grievance_resolution_pct: 81.5, litigation_rate: 21.0, data_quality_score: 82, budget_utilization_pct: 81.5, status: "NEEDS_INTERVENTION" },
      { id: "OD", state: "Odisha", state_hi: "ओडिशा", zone: "East", projects: 16, target_ha: 1700, acquired_ha: 1220, completion_pct: 71.8, avg_days: 330, sla_compliance_pct: 84.8, dbt_payment_pct: 83.4, rr_completion_pct: 76.5, grievance_resolution_pct: 79.0, litigation_rate: 24.3, data_quality_score: 79, budget_utilization_pct: 78.0, status: "CRITICAL_LAG" },
    ];
    for (const item of stateBenchmarksData) {
      await upsert('state_benchmarks', item, ['id']);
    }

    // 2. national_corridors (6 records)
    const nationalCorridorsData = [
      { corridor_id: "DME_01", name: "Delhi-Mumbai Expressway (NE-4)", name_hi: "दिल्ली-मुंबई एक्सप्रेसवे (NE-4)", sector: "Highways", length_km: 1386, states_traversed: ["DL", "HR", "RJ", "MP", "GJ", "MH"], total_ha: 4800, acquired_ha: 4420, completion_pct: 92.1, sanctioned_cr: 14200, disbursed_cr: 13100, interstate_status: "Dahod-Jhabua border valuation harmonization under review", interstate_status_hi: "दाहोद-झाबुआ सीमा मूल्यांकन सामंजस्य समीक्षाधीन", risk_level: "MEDIUM", lead_agency: "NHAI" },
      { corridor_id: "WDFC_02", name: "Western Dedicated Freight Corridor", name_hi: "पश्चिमी समर्पित माल गलियारा (WDFC)", sector: "Railways", length_km: 1506, states_traversed: ["DL", "HR", "RJ", "GJ", "MH"], total_ha: 3600, acquired_ha: 3450, completion_pct: 95.8, sanctioned_cr: 9800, disbursed_cr: 9350, interstate_status: "Rail Right-of-Way fully continuous; final Sec 38 handover active", interstate_status_hi: "रेलवे राइट-ऑफ-वे पूर्णतः निरंतर; धारा 38 कब्जा अंतिम चरण में", risk_level: "LOW", lead_agency: "DFCCIL" },
      { corridor_id: "STRR_03", name: "Bengaluru Satellite Town Ring Road (NH-948A)", name_hi: "बेंगलुरु सैटेलाइट टाउन रिंग रोड (NH-948A)", sector: "Highways", length_km: 280, states_traversed: ["KA", "TN"], total_ha: 1840, acquired_ha: 1560, completion_pct: 84.8, sanctioned_cr: 4500, disbursed_cr: 3820, interstate_status: "Hosur spur synchronized with Karnataka Doddaballapur package", interstate_status_hi: "होसुर शाखा कर्नाटक डोड्डाबल्लापुर पैकेज के साथ सिंक्रनाइज़", risk_level: "LOW", lead_agency: "NHAI / KRDCL" },
      { corridor_id: "AMR_JAM_04", name: "Amritsar-Jamnagar Economic Corridor", name_hi: "अमृतसर-जामनगर आर्थिक गलियारा", sector: "Highways", length_km: 1257, states_traversed: ["PB", "HR", "RJ", "GJ"], total_ha: 3200, acquired_ha: 2850, completion_pct: 89.1, sanctioned_cr: 9200, disbursed_cr: 8100, interstate_status: "Rajasthan desert packages complete; Punjab RoW clear", interstate_status_hi: "राजस्थान रेगिस्तानी पैकेज पूर्ण; पंजाब राइट-ऑफ-वे स्पष्ट", risk_level: "LOW", lead_agency: "MoRTH" },
      { corridor_id: "VCIC_05", name: "Vizag-Chennai Industrial Corridor (VCIC)", name_hi: "विशाखापट्टनम-चेन्नई औद्योगिक गलियारा", sector: "Industrial", length_km: 800, states_traversed: ["AP", "TN"], total_ha: 2400, acquired_ha: 1870, completion_pct: 77.9, sanctioned_cr: 3800, disbursed_cr: 2950, interstate_status: "Krishnapatnam node acquisition accelerated; R&R compensation disbursing", interstate_status_hi: "कृष्णपटनम नोड अधिग्रहण तेज; पुनर्वास मुआवजा संवितरण जारी", risk_level: "HIGH", lead_agency: "NICDIT / APIIC" },
      { corridor_id: "BM_P1_06", name: "Bharatmala P1 Solapur-Kurnool Link", name_hi: "भारतमाला चरण 1 सोलापुर-कुरनूल लिंक", sector: "Highways", length_km: 340, states_traversed: ["MH", "KA", "AP"], total_ha: 1450, acquired_ha: 1180, completion_pct: 81.4, sanctioned_cr: 2950, disbursed_cr: 2380, interstate_status: "Inter-state border revenue record cross-verification in progress", interstate_status_hi: "अंतर-राज्य सीमा राजस्व रिकॉर्ड सत्यापन प्रगति पर", risk_level: "MEDIUM", lead_agency: "NHAI" },
    ];
    for (const item of nationalCorridorsData) {
      await upsert('national_corridors', item, ['corridor_id']);
    }

    // 3. central_escalations (5 records)
    const centralEscalationsData = [
      { escalation_id: "ESC-2026-001", title: "Dahod-Jhabua Inter-State Circle Rate Disparity", title_hi: "दाहोद-झाबुआ अंतर-राज्य सर्किल दर विषमता", source_state: "Gujarat / Madhya Pradesh", corridor: "Delhi-Mumbai Expressway", category: "INTERSTATE_DISPUTE", urgency: "CRITICAL", status: "PENDING_DIRECTIVE", submitted_date: "04 Sep 2026", summary: "Farmers on the MP side of the border have staged dharna objecting to 35% higher circle rates awarded on the Gujarat side for contiguous agricultural land parcels.", summary_hi: "मध्य प्रदेश सीमा के किसानों ने निकटवर्ती गुजरात सीमा पर 35% अधिक सर्किल दर मिलने पर विरोध दर्ज किया है।", requested_action: "Issue central advisory for uniform border solatium benchmark under Section 108 of RFCTLARR Act." },
      { escalation_id: "ESC-2026-002", title: "Western DFC Palghar Mangrove Eco-Clearance Deadlock", title_hi: "पश्चिमी डीएफसी पालघर मैंग्रोव पर्यावरण मंजूरी गतिरोध", source_state: "Maharashtra", corridor: "Western Dedicated Freight Corridor", category: "POLICY_CLARIFICATION", urgency: "HIGH", status: "UNDER_REVIEW", submitted_date: "01 Sep 2026", summary: "State Forest Advisory Committee has deferred Stage-II clearance for 14.8 Ha rail diversion citing CRZ-I regulations despite Section 6 public urgency exemption.", summary_hi: "राज्य वन सलाहकार समिति ने सार्वजनिक तात्कालिकता छूट के बावजूद 14.8 हेक्टेयर रेल डायवर्जन हेतु मंजूरी स्थगित की।", requested_action: "Convene Joint Review Meeting with MoEFCC Central Clearance Cell and Maharashtra Principal Secretary." },
      { escalation_id: "ESC-2026-003", title: "Additional Solatium Allocation for Bengaluru STRR NH-948A", title_hi: "बेंगलुरु एसटीआरआर अतिरिक्त तोष आवंटन मांग", source_state: "Karnataka", corridor: "Bengaluru STRR (NH-948A)", category: "FUNDING_GAP", urgency: "HIGH", status: "ACTION_PLAN_REQUESTED", submitted_date: "28 Aug 2026", summary: "High land value appreciation around Doddaballapur industrial belt requires additional ₹320 Cr PFMS allocation to execute Section 30 statutory awards without treasury lag.", summary_hi: "डोड्डाबल्लापुर बेल्ट में भूमि मूल्य वृद्धि के कारण धारा 30 पंचाट भुगतान हेतु अतिरिक्त ₹320 करोड़ की आवश्यकता।", requested_action: "Sanction supplementary treasury tranche under Ministry Infrastructure Capital Head." },
      { escalation_id: "ESC-2026-004", title: "High Court Interim Injunction on Krishnapatnam Port RoW", title_hi: "कृष्णपटनम पोर्ट राइट-ऑफ-वे पर उच्च न्यायालय स्थगन", source_state: "Andhra Pradesh", corridor: "Vizag-Chennai Industrial Corridor", category: "LITIGATION", urgency: "CRITICAL", status: "UNDER_REVIEW", submitted_date: "22 Aug 2026", summary: "Writ Petition 4821/2026 granted status quo on 280 Ha multi-crop wetland parcels contesting Section 10 food security threshold exemptions.", summary_hi: "रिट याचिका में धारा 10 खाद्य सुरक्षा सीमा छूट को चुनौती देते हुए 280 हेक्टेयर पर यथास्थिति आदेश दिया गया।", requested_action: "Depute Additional Solicitor General to represent Union of India in urgent vacation bench hearing." },
      { escalation_id: "ESC-2026-005", title: "NIC ULPIN Cadastral Server API Sync Outage in 3 Coastal Districts", title_hi: "3 तटीय जिलों में एनआईसी यूलपिन कैडस्ट्रल सर्वर एपीआई आउटेज", source_state: "Odisha", corridor: "Eastern Dedicated Freight Corridor / Port Link", category: "INTEGRATION", urgency: "MEDIUM", status: "RESOLVED", submitted_date: "15 Aug 2026", summary: "State Bhulekh portal experienced SSL handshake timeouts while validating 14-digit ULPIN for Cuttack and Puri survey demarcation uploads.", summary_hi: "भुलेख पोर्टल द्वारा कटक और पुरी सर्वेक्षण अपलोड हेतु 14-अंकीय यूलपिन सत्यापन में टाइमआउट की समस्या।", requested_action: "Central NIC infrastructure upgraded with dedicated WFS cadastral edge cache nodes." },
    ];
    for (const item of centralEscalationsData) {
      await upsert('central_escalations', item, ['escalation_id']);
    }

    // 4. bottleneck_diagnostics (5 records)
    const bottleneckDiagnosticsData = [
      { diagnostic_id: "BN-01", stage: "Section 8 & 11 Field Survey Demarcation", stage_hi: "धारा 8 एवं 11 फील्ड सर्वेक्षण सीमांकन", root_cause: "Severe shortage of licensed Amins and Taluk Surveyors equipped with differential GPS devices", root_cause_hi: "डिफरेंशियल जीपीएस युक्त प्रमाणित अमीन और तहसील सर्वेक्षणकर्ताओं की भारी कमी", states_affected: ["Uttar Pradesh", "Andhra Pradesh", "Odisha"], cases_impacted: 118, avg_delay_days: 45, severity: "CRITICAL", central_action: "Release DILRMP Special Assistance Tranche for RoVer Drone Demarcation Hiring", central_action_hi: "ड्रोन सीमांकन भाड़े पर लेने हेतु डीआईएलआरएमपी विशेष सहायता किश्त जारी करें" },
      { diagnostic_id: "BN-02", stage: "Section 15 Gazette Objection Adjudication", stage_hi: "धारा 15 आपत्ति निस्तारण एवं सुनवाई", root_cause: "SLAO benches inundated with multiple title dispute claims without digitized revenue court link", root_cause_hi: "डिजिटल राजस्व अदालत लिंक के बिना भूमि स्वामित्व विवादों के कारण पंचाट अधिकारी के पास आपत्तियों का ढेर", states_affected: ["Uttar Pradesh", "Odisha", "Maharashtra"], cases_impacted: 84, avg_delay_days: 38, severity: "HIGH", central_action: "Issue Model Fast-Track Section 15 Hearing Standard Operating Procedure (SOP)", central_action_hi: "मॉडल फास्ट-ट्रैक धारा 15 सुनवाई मानक संचालन प्रक्रिया (एसओपी) जारी करें" },
      { diagnostic_id: "BN-03", stage: "MoEFCC & Forest Clearance (Sec 19 Pre-requisite)", stage_hi: "वन एवं पर्यावरण मंजूरी (धारा 19 पूर्व शर्त)", root_cause: "Stage-II clearance pending beyond statutory 60-day window due to compensatory afforestation land non-identification", root_cause_hi: "प्रतिपूरक वनीकरण भूमि की पहचान न होने के कारण वैधानिक 60 दिनों से अधिक समय से मंजूरी लंबित", states_affected: ["Karnataka", "Maharashtra", "Odisha"], cases_impacted: 42, avg_delay_days: 62, severity: "CRITICAL", central_action: "Schedule Central PMG Inter-Ministerial Forest Resolution Bench", central_action_hi: "केंद्रीय पीएमजी अंतर-मंत्रालयी वन समाधान पीठ निर्धारित करें" },
      { diagnostic_id: "BN-04", stage: "PFMS Direct Benefit Transfer (DBT) Payout", stage_hi: "पीएफएमएस प्रत्यक्ष लाभ अंतरण (DBT) भुगतान", root_cause: "Aadhaar NPCI bank account mismatch and dormant joint-khata accounts blocking electronic awards", root_cause_hi: "आधार एनपीसीआई बैंक खाता बेमेल और निष्क्रिय संयुक्त खाता होने से इलेक्ट्रॉनिक पंचाट में रुकावट", states_affected: ["Andhra Pradesh", "Uttar Pradesh"], cases_impacted: 65, avg_delay_days: 28, severity: "MEDIUM", central_action: "Deploy NIC Special Automated Account Verification Adapter with SBI & Canara Bank", central_action_hi: "एसबीआई और केनरा बैंक के साथ एनआईसी विशेष स्वचालित खाता सत्यापन एडाप्टर तैनात करें" },
      { diagnostic_id: "BN-05", stage: "Section 38 Physical Possession Takeover", stage_hi: "धारा 38 भौतिक कब्जा अधिग्रहण", root_cause: "Standing seasonal standing crop harvesting delays and transit site readiness lags for affected families", root_cause_hi: "खड़ी फसलों की कटाई में देरी तथा विस्थापित परिवारों हेतु पुनर्वास स्थलों की तैयारी में विलंब", states_affected: ["Bihar", "West Bengal", "Haryana"], cases_impacted: 53, avg_delay_days: 31, severity: "HIGH", central_action: "Authorise Advance Standing Crop Solatium Settlement under Special District Powers", central_action_hi: "विशेष जिला शक्तियों के तहत अग्रिम फसल क्षतिपूर्ति भुगतान अधिकृत करें" },
    ];
    for (const item of bottleneckDiagnosticsData) {
      await upsert('bottleneck_diagnostics', item, ['diagnostic_id']);
    }

    // 5. national_standards (5 records)
    const nationalStandardsData = [
      { standard_id: "STD-01", code: "DoLR-ULPIN-2026.1", title: "14-Digit Unique Land Parcel Identification Number (Bhu-Aadhaar)", version: "v2.4", status: "MANDATORY", category: "CADASTRAL", compliance_rate: 94.2, summary: "Standardized geospatial algorithm deriving 14-character alphanumeric identifier from WGS84 polygon centroid coordinates for zero-collision parcel tracking." },
      { standard_id: "STD-02", code: "PFMS-RFCTLARR-DBT", title: "Direct Benefit Transfer Central Treasury Integration Standard", version: "v3.1", status: "MANDATORY", category: "FINANCIAL", compliance_rate: 92.4, summary: "Real-time automated reconciliation protocol with National Payments Corporation of India (NPCI) for instantaneous solatium disbursement to Khatedar Aadhaar-seeded accounts." },
      { standard_id: "STD-03", code: "OGC-WFS-BHOOMI-3.0", title: "OpenGIS Web Feature Service Interoperability for Multi-State Corridors", version: "v3.0", status: "MANDATORY", category: "GIS", compliance_rate: 88.6, summary: "Standardized OGC API Features endpoint schema allowing cross-state linear corridor alignments to automatically calculate intersection boundaries." },
      { standard_id: "STD-04", code: "RFCTLARR-SCHED-II-RR", title: "Schedule-II Rehabilitation & Resettlement Minimum Entitlement Matrix", version: "v2.0", status: "MANDATORY", category: "LEGAL", compliance_rate: 89.8, summary: "Statutory codified entitlement engine ensuring mandatory index-linked subsistence grant, housing assistance, and cattle shed allowances." },
      { standard_id: "STD-05", code: "ISO-19152-LADM-IND", title: "Land Administration Domain Model (LADM) Cadastral Profile for India", version: "v1.2", status: "RECOMMENDED", category: "CADASTRAL", compliance_rate: 76.5, summary: "ISO international cadastral model mapping land tenure rights, restrictions, and responsibilities (RRR) to Indian revenue khata structures." },
    ];
    for (const item of nationalStandardsData) {
      await upsert('national_standards', item, ['standard_id']);
    }

    // 6. district_metrics (10 records)
    const districtMetricsData = [
      { metric_id: "BLR_R", name: "Bengaluru Rural", name_hi: "बेंगलुरु ग्रामीण", division: "Bengaluru Division", dc_name: "Shri Manjunath R., IAS", target_ha: 380, acquired_ha: 310, completion_pct: 81.6, active_cases: 18, sla_compliance_pct: 91.2, avg_days_to_handover: 52, compensation_cr: 842.5, bottleneck_stage: "Section 15 Objections", bottleneck_stage_hi: "धारा 15 नागरिक आपत्तियां", status: "ON_TRACK" },
      { metric_id: "KLR", name: "Kolar", name_hi: "कोलार", division: "Bengaluru Division", dc_name: "Smt. Akram Pasha, IAS", target_ha: 210, acquired_ha: 190, completion_pct: 90.5, active_cases: 6, sla_compliance_pct: 94.8, avg_days_to_handover: 41, compensation_cr: 310.2, bottleneck_stage: "Bank Account Verification", bottleneck_stage_hi: "बैंक खाता सत्यापन", status: "EXCEEDING" },
      { metric_id: "MND", name: "Mandya", name_hi: "मांड्या", division: "Mysuru Division", dc_name: "Dr. Kumar, IAS", target_ha: 280, acquired_ha: 250, completion_pct: 89.3, active_cases: 8, sla_compliance_pct: 92.0, avg_days_to_handover: 46, compensation_cr: 520.0, bottleneck_stage: "Physical Possession Memo", bottleneck_stage_hi: "कब्जा एवं हस्तांतरण मेमो", status: "EXCEEDING" },
      { metric_id: "RAM", name: "Ramanagara", name_hi: "रामनगर", division: "Bengaluru Division", dc_name: "Shri Avinash Menon, IAS", target_ha: 290, acquired_ha: 245, completion_pct: 84.5, active_cases: 9, sla_compliance_pct: 89.4, avg_days_to_handover: 54, compensation_cr: 612.4, bottleneck_stage: "Section 19 Declaration", bottleneck_stage_hi: "धारा 19 अंतिम घोषणा", status: "ON_TRACK" },
      { metric_id: "MYS", name: "Mysuru", name_hi: "मैसूरु", division: "Mysuru Division", dc_name: "Dr. K. V. Rajendra, IAS", target_ha: 320, acquired_ha: 265, completion_pct: 82.8, active_cases: 11, sla_compliance_pct: 88.5, avg_days_to_handover: 57, compensation_cr: 710.8, bottleneck_stage: "Joint Field Survey", bottleneck_stage_hi: "संयुक्त सीमा सर्वेक्षण", status: "ON_TRACK" },
      { metric_id: "TUM", name: "Tumakuru", name_hi: "तुमकुरु", division: "Bengaluru Division", dc_name: "Shri Subha Kalyan, IAS", target_ha: 450, acquired_ha: 320, completion_pct: 71.1, active_cases: 14, sla_compliance_pct: 78.4, avg_days_to_handover: 69, compensation_cr: 690.0, bottleneck_stage: "Field Measurement & DGPS", bottleneck_stage_hi: "भूमि माप एवं जीपीएस सीमांकन", status: "REQUIRES_ATTENTION" },
      { metric_id: "BEL", name: "Belagavi", name_hi: "बेलगावी", division: "Belagavi Division", dc_name: "Shri Nitesh Patil, IAS", target_ha: 390, acquired_ha: 268, completion_pct: 68.7, active_cases: 12, sla_compliance_pct: 76.2, avg_days_to_handover: 72, compensation_cr: 480.5, bottleneck_stage: "Award Calculation Discrepancy", bottleneck_stage_hi: "मुआवजा गणना मिलान", status: "REQUIRES_ATTENTION" },
      { metric_id: "CKB", name: "Chikkaballapura", name_hi: "चिक्काबल्लापुर", division: "Bengaluru Division", dc_name: "Shri P. N. Ravindra, IAS", target_ha: 340, acquired_ha: 215, completion_pct: 63.2, active_cases: 15, sla_compliance_pct: 71.0, avg_days_to_handover: 84, compensation_cr: 395.0, bottleneck_stage: "Section 15 Citizen Hearings", bottleneck_stage_hi: "धारा 15 नागरिक आपत्तियां", status: "CRITICAL_LAG" },
      { metric_id: "DKN", name: "Dakshina Kannada", name_hi: "दक्षिण कन्नड़", division: "Mysuru Division", dc_name: "Shri Mullai Muhilan, IAS", target_ha: 220, acquired_ha: 140, completion_pct: 63.6, active_cases: 9, sla_compliance_pct: 72.5, avg_days_to_handover: 81, compensation_cr: 415.0, bottleneck_stage: "Forest & Coastal Clearance", bottleneck_stage_hi: "वन एवं तटीय नियामक अनापत्ति", status: "CRITICAL_LAG" },
      { metric_id: "KLB", name: "Kalaburagi", name_hi: "कलबुर्गी", division: "Kalaburagi Division", dc_name: "Shri Fouzia Taranum, IAS", target_ha: 360, acquired_ha: 220, completion_pct: 61.1, active_cases: 13, sla_compliance_pct: 68.9, avg_days_to_handover: 88, compensation_cr: 310.0, bottleneck_stage: "Title Dispute & Mutation", bottleneck_stage_hi: "स्वामित्व विवाद एवं दाखिल खारिज", status: "CRITICAL_LAG" },
    ];
    for (const item of districtMetricsData) {
      await upsert('district_metrics', item, ['metric_id']);
    }

    // 7. state_approvals (5 records)
    const stateApprovalsData = [
      { approval_id: "APPR-2026-001", approval_type: "PROPOSAL", title: "Administrative Sanction for Bengaluru Outer Peripheral Ring Road (STRR Phase-II)", title_hi: "बेंगलुरु आउटर पेरिफेरल रिंग रोड (एसटीआरआर फेज-II) हेतु प्रशासनिक मंजूरी", project: "Satellite Town Ring Road (STRR NH-948A)", district: "Bengaluru Rural & Ramanagara", land_area_ha: 680.5, financial_outlay_cr: 2450.0, submitted_by: "NHAI Project Implementation Unit (PIU Bengaluru)", submitted_date: "04 Sep 2026", sla_deadline: "14 Sep 2026", sla_hours_left: 72, is_urgent: false, dossier_summary: "Comprehensive Social Impact Assessment (SIA) completed. State Multi-Disciplinary Expert Group has recommended acquisition with provision for 1,420 rehabilitation plots.", dossier_summary_hi: "सामाजिक प्रभाव आकलन (एसआईए) पूर्ण। राज्य बहु-विषयक विशेषज्ञ समूह ने 1,420 पुनर्वास भूखंडों के प्रावधान के साथ अधिग्रहण की सिफारिश की है।", status: "PENDING" },
      { approval_id: "APPR-2026-002", approval_type: "DRAFT_NOTIFICATION", title: "Section 11 Preliminary Notification Gazette Publication Approval", title_hi: "धारा 11 प्रारंभिक अधिसूचना राजपत्र प्रकाशन अनुमोदन", project: "Mysuru-Kushalnagar 4-Lane Greenfield Economic Corridor", district: "Mysuru", land_area_ha: 240.0, financial_outlay_cr: 680.0, submitted_by: "Special Land Acquisition Officer (SLAO - CALA Mysuru)", submitted_date: "07 Sep 2026", sla_deadline: "11 Sep 2026", sla_hours_left: 18, is_urgent: true, dossier_summary: "SIA exemption granted under public infrastructure provisions. 14-digit ULPIN plot boundaries demarcated for 340 agricultural holdings. Ready for State Extraordinary Gazette.", dossier_summary_hi: "सार्वजनिक बुनियादी ढांचा प्रावधानों के तहत एसआईए छूट प्राप्त। 340 कृषि जोतों के 14-अंकीय भू-आधार सीमांकन पूर्ण। राज्य असाधारण राजपत्र हेतु तैयार।", status: "PENDING" },
      { approval_id: "APPR-2026-003", approval_type: "FINAL_DECLARATION", title: "Section 19 Declaration of Acquisition & R&R Summary Ratification", title_hi: "धारा 19 अंतिम अधिग्रहण घोषणा एवं पुनर्वास सारांश अनुमोदन", project: "Tumakuru Industrial Node Phase-III (CBIC Smart City)", district: "Tumakuru", land_area_ha: 410.0, financial_outlay_cr: 1120.0, submitted_by: "Deputy Commissioner & DM, Tumakuru", submitted_date: "02 Sep 2026", sla_deadline: "12 Sep 2026", sla_hours_left: 42, is_urgent: false, dossier_summary: "Public objection hearings completed under Section 15 with 94% consensus. Compensation package structured with 100% Solatium Legal Bonus. Ready for final acquisition declaration.", dossier_summary_hi: "धारा 15 के तहत 94% सहमति के साथ नागरिक आपत्तियां निस्तारित। 100% कानूनी बोनस के साथ मुआवजा पैकेज तय। अंतिम घोषणा हेतु तैयार।", status: "PENDING" },
      { approval_id: "APPR-2026-004", approval_type: "HIGH_VALUE_AWARD", title: "High-Value Compensation Award Exceeding ₹10 Cr CALA Limit Approval", title_hi: "₹10 करोड़ सीमा से अधिक का उच्च-मूल्य मुआवजा अवार्ड अनुमोदन", project: "BMRCL Airport Metro Extension Package 4 (Hebbal-Yelahanka)", district: "Bengaluru Rural", land_area_ha: 18.5, financial_outlay_cr: 184.5, submitted_by: "Special Land Acquisition Officer (CALA Bengaluru)", submitted_date: "28 Aug 2026", sla_deadline: "08 Sep 2026", sla_hours_left: -48, is_urgent: true, dossier_summary: "Commercial parcel acquisition for metro viaduct piers. State Level Screening Committee has vetted circle rates and rural multiplier of 1.5x. Requires Principal Secretary signature.", dossier_summary_hi: "मेट्रो वायाडक्ट खंभों हेतु व्यावसायिक भूखंड। राज्य स्तरीय स्क्रीनिंग समिति ने सर्कल दर और 1.5x ग्रामीण गुणक की पुष्टि की है। प्रमुख सचिव के हस्ताक्षर आवश्यक हैं।", status: "PENDING" },
      { approval_id: "APPR-2026-005", approval_type: "PROPOSAL", title: "Administrative Sanction for Bengaluru Suburban Rail Corridor 2", title_hi: "बेंगलुरु उपनगरीय रेल कॉरिडोर 2 हेतु प्रशासनिक मंजूरी", project: "K-RIDE Suburban Rail Project", district: "Bengaluru Urban", land_area_ha: 52.4, financial_outlay_cr: 420.0, submitted_by: "Managing Director, K-RIDE", submitted_date: "01 Sep 2026", sla_deadline: "15 Sep 2026", sla_hours_left: 96, is_urgent: false, dossier_summary: "Railway right-of-way quadrupling proposal through heavily urbanized zone with elevated alignment design.", dossier_summary_hi: "उन्नत संरेखण डिजाइन के साथ अत्यधिक शहरीकृत क्षेत्र के माध्यम से रेलवे राइट-ऑफ-वे चौगुनी करने का प्रस्ताव।", status: "APPROVED" },
    ];
    for (const item of stateApprovalsData) {
      await upsert('state_approvals', item, ['approval_id']);
    }

    // 8. revenue_court_appeals (5 records)
    const revenueCourtAppealsData = [
      { appeal_id: "APP-2026-001", appeal_number: "LAA-104/2026", tribunal_court: "Karnataka Land Acquisition Appellate Tribunal, Bengaluru", case_number: "LAC/2026/SEED/001", appellant_name: "Muniswamy Gowda & Bros", dispute_type: "Market Value Enhancement (Sec 64)", claimed_amount_inr: 45000000, determined_amount_inr: 25000000, hearing_date: "18 Sep 2026", status: "HEARING", stay_granted: false },
      { appeal_id: "APP-2026-002", appeal_number: "WP-8842/2026", tribunal_court: "High Court of Karnataka (Writ Bench)", case_number: "LAC/2026/SEED/002", appellant_name: "Lakshmi Devi & Others", dispute_type: "Boundary Demarcation & Alignment Challenge", claimed_amount_inr: 0, determined_amount_inr: 0, hearing_date: "22 Sep 2026", status: "HEARING", stay_granted: true },
      { appeal_id: "APP-2026-003", appeal_number: "LAA-112/2026", tribunal_court: "Revenue Appellate Tribunal, Mysuru", case_number: "LAC/2026/SEED/003", appellant_name: "Mahadevappa S.", dispute_type: "Apportionment Dispute among Legal Heirs", claimed_amount_inr: 18000000, determined_amount_inr: 18000000, hearing_date: "25 Sep 2026", status: "HEARING", stay_granted: false },
      { appeal_id: "APP-2026-004", appeal_number: "LAA-95/2026", tribunal_court: "District Court, Tumakuru", case_number: "LAC/2026/SEED/004", appellant_name: "Tumakuru Agro Farms Ltd.", dispute_type: "Solatium & Severance Compensation Claim", claimed_amount_inr: 62000000, determined_amount_inr: 38000000, hearing_date: "02 Oct 2026", status: "JUDGEMENT_PENDING", stay_granted: false },
      { appeal_id: "APP-2026-005", appeal_number: "LAA-78/2026", tribunal_court: "Principal Civil Court, Ramanagara", case_number: "LAC/2026/SEED/005", appellant_name: "Anjanappa & Sons", dispute_type: "Orchard & Standing Tree Valuation Grievance", claimed_amount_inr: 8500000, determined_amount_inr: 4200000, hearing_date: "10 Oct 2026", status: "HEARING", stay_granted: false },
    ];
    for (const item of revenueCourtAppealsData) {
      await upsert('revenue_court_appeals', item, ['appeal_id']);
    }

    // 9. field_tasks (6 records)
    const fieldTasksData = [
      { task_id: "TASK-001", parcel_id: "P-KA-BLR-567890", ulpin: "KA-BLR-2026-0045", case_no: "AC-2026-KA-001234", survey_no: "45/2A", village: "Ramnagar", taluk: "Doddaballapur", district: "Bengaluru Rural", recorded_area_ha: 2.48, measured_area_ha: 2.44, status: "PENDING_SURVEY", priority: "HIGH", due_date: "15 September 2026", distance_km: 3.2, bearing_deg: 38, landholder: "Gopalakrishna Gowda & 2 Others", access_status: "ACCESSIBLE" },
      { task_id: "TASK-002", parcel_id: "P-KA-BLR-567891", ulpin: "KA-BLR-2026-0046", case_no: "AC-2026-KA-001234", survey_no: "46/1", village: "Ramnagar", taluk: "Doddaballapur", district: "Bengaluru Rural", recorded_area_ha: 1.15, measured_area_ha: 1.15, status: "IN_PROGRESS", priority: "HIGH", due_date: "16 September 2026", distance_km: 3.8, bearing_deg: 42, landholder: "Chandrashekariah", access_status: "ACCESSIBLE" },
      { task_id: "TASK-003", parcel_id: "P-KA-BLR-567892", ulpin: "KA-BLR-2026-0047", case_no: "AC-2026-KA-001235", survey_no: "48/3B", village: "Doddabelavangala", taluk: "Doddaballapur", district: "Bengaluru Rural", recorded_area_ha: 3.20, measured_area_ha: 3.12, status: "SUBMITTED", priority: "ROUTINE", due_date: "18 September 2026", distance_km: 7.4, bearing_deg: 310, landholder: "Muniyamma & Legal Heirs", access_status: "ACCESSIBLE" },
      { task_id: "TASK-004", parcel_id: "P-KA-BLR-567893", ulpin: "KA-BLR-2026-0048", case_no: "AC-2026-KA-001235", survey_no: "50/1A", village: "Doddabelavangala", taluk: "Doddaballapur", district: "Bengaluru Rural", recorded_area_ha: 0.85, measured_area_ha: null, status: "CORRECTION_REQUIRED", priority: "HIGH", due_date: "14 September 2026", distance_km: 8.1, bearing_deg: 315, landholder: "Krishnappa Gowda", access_status: "DISPUTED_TERRAIN", correction_remarks: "Corner Point C3 shows 4.2m deviation against cadastral map boundary." },
      { task_id: "TASK-005", parcel_id: "P-KA-BLR-567894", ulpin: "KA-BLR-2026-0049", case_no: "AC-2026-KA-001236", survey_no: "52/4", village: "Sasalu", taluk: "Doddaballapur", district: "Bengaluru Rural", recorded_area_ha: 4.10, measured_area_ha: 4.10, status: "APPROVED", priority: "ROUTINE", due_date: "10 September 2026", distance_km: 12.3, bearing_deg: 340, landholder: "Venkataiah & Brothers", access_status: "ACCESSIBLE" },
      { task_id: "TASK-006", parcel_id: "P-KA-BLR-567895", ulpin: "KA-BLR-2026-0050", case_no: "AC-2026-KA-001236", survey_no: "55/2", village: "Sasalu", taluk: "Doddaballapur", district: "Bengaluru Rural", recorded_area_ha: 1.75, measured_area_ha: 1.74, status: "PENDING_SURVEY", priority: "MEDIUM", due_date: "20 September 2026", distance_km: 13.0, bearing_deg: 345, landholder: "Anjinappa S.", access_status: "GATED" },
    ];
    for (const item of fieldTasksData) {
      await upsert('field_tasks', item, ['task_id']);
    }

    // 10. audit_anomalies (5 records)
    const auditAnomaliesData = [
      { anomaly_id: "ANOM-001", title: "Compensation > 3.2x District Average (Inflated Base Rate)", title_hi: "मुआवजा > 3.2 गुना जिला औसत (अत्यधिक आधार दर)", severity: "CRITICAL", case_ref: "AC-2026-KA-001234", parcel_ulpin: "KA-BLR-2026-0041", district: "Bengaluru Rural (Doddaballapur)", district_hi: "बेंगलुरु ग्रामीण (दोड्डबल्लापुर)", calculated_value: "₹ 1,85,00,000", district_avg: "₹ 57,80,000", variance_ratio: "+320% (3.2x)", variance_ratio_hi: "+320% (3.2 गुना)", statute: "RFCTLARR Act 2013 Section 26(1) (Circle Rate Guidance)", statute_hi: "आरएफसीटीएलएआरआर अधिनियम 2013 धारा 26(1) (सर्किल दर दिशानिर्देश)", details: "Base market rate assessed at ₹4,800/sq.m vs prevailing circle rate benchmark of ₹1,500/sq.m without land conversion documentation.", details_hi: "भूमि रूपांतरण दस्तावेज़ के बिना ₹1,500/वर्ग मी. के सर्किल दर बेंचमार्क के मुकाबले ₹4,800/वर्ग मी. पर आधार बाजार दर आंकी गई।", flag_date: "09 Sep 2026", flag_date_hi: "09 सित 2026", status: "OPEN" },
      { anomaly_id: "ANOM-002", title: "Public Objection Overdue Beyond 60-Day Statutory SLA", title_hi: "सार्वजनिक आपत्ति 60-दिवसीय वैधानिक एसएलए से अधिक लंबित", severity: "HIGH", case_ref: "LAC/2026/STRR/KA-042", parcel_ulpin: "KA-RAM-2026-0118", district: "Ramanagara (Channapatna)", district_hi: "रामनगर (चन्नापट्टण)", calculated_value: "₹ 74,50,000", district_avg: "₹ 70,00,000", variance_ratio: "78 Days (18d breach)", variance_ratio_hi: "78 दिन (18 दिन का उल्लंघन)", statute: "RFCTLARR Section 15(2) Inquiry Statutory SLA Limit", statute_hi: "आरएफसीटीएलएआरआर धारा 15(2) जांच वैधानिक एसएलए सीमा", details: "Section 15 objection filed by 14 landholders pending 78 days without Sub-Divisional Magistrate inquiry report or extension order.", details_hi: "14 भूमिधारकों द्वारा दायर धारा 15 की आपत्ति उप-विभागीय मजिस्ट्रेट की जांच रिपोर्ट या विस्तार आदेश के बिना 78 दिनों से लंबित है।", flag_date: "07 Sep 2026", flag_date_hi: "07 सित 2026", status: "NOTICE_ISSUED" },
      { anomaly_id: "ANOM-003", title: "Missing Mandatory Joint Field Boundary Photos", title_hi: "अनिवार्य संयुक्त क्षेत्र सीमा तस्वीरें अनुपलब्ध", severity: "MEDIUM", case_ref: "LAC/2026/WDFC/RAJ-108", parcel_ulpin: "RJ-JAI-2026-0891", district: "Jaipur Rural", district_hi: "जयपुर ग्रामीण", calculated_value: "₹ 1,12,00,000", district_avg: "₹ 1,05,00,000", variance_ratio: "0/4 Geotagged Photos", variance_ratio_hi: "0/4 जियोटैग्ड तस्वीरें", statute: "MoRTH Land Acquisition Demarcation Guidelines Clause 4.3", statute_hi: "सड़क परिवहन एवं राजमार्ग मंत्रालय सीमांकन दिशानिर्देश खंड 4.3", details: "Award approved without DGPS boundary stone photographs attached to the digital survey pack.", details_hi: "डिजिटल सर्वेक्षण पैक में डीजीपीएस सीमा पत्थर की तस्वीरों के बिना अवार्ड स्वीकृत किया गया।", flag_date: "05 Sep 2026", flag_date_hi: "05 सित 2026", status: "OPEN" },
      { anomaly_id: "ANOM-004", title: "Beneficiary Aadhaar Seeding Hash Mismatch", title_hi: "लाभार्थी आधार सीडिंग हैश बेमेल", severity: "CRITICAL", case_ref: "LAC/2026/DME/GUJ-029", parcel_ulpin: "GJ-VAD-2026-0442", district: "Vadodara Rural", district_hi: "वडोदरा ग्रामीण", calculated_value: "₹ 2,40,00,000", district_avg: "₹ 2,35,00,000", variance_ratio: "NPCI Status 403 Failed", variance_ratio_hi: "एनपीसीआई स्थिति 403 विफल", statute: "PFMS Direct Benefit Transfer Security Standard v3.1", statute_hi: "पीएफएमएस प्रत्यक्ष लाभ अंतरण सुरक्षा मानक v3.1", details: "Bank account Khata holder name phonetically divergent from UIDAI demographic verification response.", details_hi: "बैंक खाता धारक का नाम यूआईडीएआई जनसांख्यिकीय सत्यापन प्रतिक्रिया से भिन्न है।", flag_date: "03 Sep 2026", flag_date_hi: "03 सित 2026", status: "UNDER_REVIEW" },
      { anomaly_id: "ANOM-005", title: "Duplicate Award Claim Flagged on Partitioned Holding", title_hi: "विभाजित जोत पर दोहरा मुआवजा दावा चिह्नित", severity: "HIGH", case_ref: "LAC/2026/STRR/KA-055", parcel_ulpin: "KA-BLR-2026-0099", district: "Bengaluru Rural (Devanahalli)", district_hi: "बेंगलुरु ग्रामीण (देवनहल्ली)", calculated_value: "₹ 96,00,000", district_avg: "₹ 90,00,000", variance_ratio: "ULPIN Overlap 84%", variance_ratio_hi: "यूलपिन ओवरलैप 84%", statute: "RFCTLARR Section 11(4) Post-Gazette Prohibition on Alienation", statute_hi: "आरएफसीटीएलएआरआर धारा 11(4) राजपत्र के पश्चात अंतरण पर रोक", details: "Two separate khatedars claimed solatium for the same cadastral sub-division polygon without registered partition deed.", details_hi: "दो अलग-अलग खातेदारों ने पंजीकृत बंटवारा विलेख के बिना एक ही कैडस्ट्रल उप-विभाजन बहुभुज के लिए तोष का दावा किया।", flag_date: "01 Sep 2026", flag_date_hi: "01 सित 2026", status: "OPEN" },
    ];
    for (const item of auditAnomaliesData) {
      await upsert('audit_anomalies', item, ['anomaly_id']);
    }

    // 11. simulation_scenarios (5 records)
    const simulationScenariosData = [
      { scenario_id: "OPTION_A", name: "Option A: Direct Greenfield Alignment", tagline: "Shortest geometric distance, traverses agrarian settlements", base_length_km: 42.4, base_parcels_per_km: 4.8, base_families_per_km: 1.4, base_forest_ha: 8.5, base_cost_per_km_cr: 5.2, base_months: 14, description: "Direct linear corridor minimizing vehicle travel time, but intersects fertile agricultural holdings." },
      { scenario_id: "OPTION_B", name: "Option B: River Valley & Village Bypass", tagline: "Bypasses dense habitation, minimal family displacement (Recommended)", base_length_km: 46.2, base_parcels_per_km: 3.6, base_families_per_km: 0.6, base_forest_ha: 3.2, base_cost_per_km_cr: 4.6, base_months: 12, description: "Curves along semi-arid scrub land and river embankments. Reduces rehabilitation displacement by 57%." },
      { scenario_id: "OPTION_C", name: "Option C: Eco-Avoidance Northern Loop", tagline: "Zero forest encroachment, higher civil engineering cost", base_length_km: 51.0, base_parcels_per_km: 3.2, base_families_per_km: 0.8, base_forest_ha: 0.0, base_cost_per_km_cr: 5.8, base_months: 18, description: "Completely circumnavigates eco-sensitive reserve forests. Eliminates MoEFCC Stage-II clearance bottlenecks." },
      { scenario_id: "OPTION_D", name: "Option D: Existing Brownfield Expansion", tagline: "Upgrades state highway right-of-way, moderate urban demolition", base_length_km: 44.8, base_parcels_per_km: 5.4, base_families_per_km: 2.1, base_forest_ha: 1.2, base_cost_per_km_cr: 6.4, base_months: 16, description: "Expands existing 2-lane State Highway with flyover bypasses across 4 major commercial market towns." },
      { scenario_id: "OPTION_E", name: "Option E: Western Industrial Spur Corridor", tagline: "Connects multi-modal logistics hub with dedicated railway freight siding", base_length_km: 49.5, base_parcels_per_km: 3.9, base_families_per_km: 0.9, base_forest_ha: 2.1, base_cost_per_km_cr: 5.5, base_months: 15, description: "Strategic detour aligning with the regional industrial corridor and freight container transshipment terminal." },
    ];
    for (const item of simulationScenariosData) {
      await upsert('simulation_scenarios', item, ['scenario_id']);
    }

    // 12. gati_shakti_layers (7 national statutory layers)
    const gatiShaktiLayersData = [
      {
        layer_id: uuid('layer-1'),
        layer_code: 'MOEFCC_RESERVE_FOREST',
        layer_name: 'MoEFCC Reserve Forest & Protected Areas',
        layer_name_hi: 'पर्यावरण एवं वन मंत्रालय आरक्षित वन व संरक्षित क्षेत्र',
        ministry: 'Ministry of Environment, Forest and Climate Change',
        statutory_act: 'Forest (Conservation) Act 1980 / Van Adhiniyam Sec 2',
        portal_name: 'PARIVESH 2.0 (MoEFCC)',
        portal_url: 'https://parivesh.nic.in',
        color_hex: '#15803d',
        buffer_default_m: 100,
        is_critical: true,
      },
      {
        layer_id: uuid('layer-2'),
        layer_code: 'WILDLIFE_ESZ',
        layer_name: 'Wildlife Sanctuaries & Eco-Sensitive Zones (ESZ)',
        layer_name_hi: 'वन्यजीव अभयारण्य एवं पारिस्थितिकी-संवेदनशील क्षेत्र (ESZ)',
        ministry: 'National Board for Wildlife (NBWL)',
        statutory_act: 'Wildlife (Protection) Act 1972 Sec 38-O',
        portal_name: 'PARIVESH Wildlife Clearance',
        portal_url: 'https://parivesh.nic.in/wildlife',
        color_hex: '#047857',
        buffer_default_m: 1000,
        is_critical: true,
      },
      {
        layer_id: uuid('layer-3'),
        layer_code: 'RAILWAY_CROSSING_GAD',
        layer_name: 'Indian Railways Tracks & GAD Crossings',
        layer_name_hi: 'भारतीय रेलवे ट्रैक एवं जीएडी क्रॉसिंग अनुमोदन',
        ministry: 'Ministry of Railways (Railway Board)',
        statutory_act: 'Railways Act 1989 Sec 18 / Engineering Code GAD',
        portal_name: 'Indian Railways IRPS Portal',
        portal_url: 'https://www.ireps.gov.in',
        color_hex: '#ea580c',
        buffer_default_m: 30,
        is_critical: true,
      },
      {
        layer_id: uuid('layer-4'),
        layer_code: 'POWERGRID_HT_LINE',
        layer_name: 'PowerGrid High-Tension (HT) Transmission Lines (400kV/765kV)',
        layer_name_hi: 'पावरग्रिड हाई-टेंशन ट्रांसमिशन लाइन कॉरिडोर',
        ministry: 'Ministry of Power / PGCIL',
        statutory_act: 'Electricity Act 2003 Sec 68 & 164',
        portal_name: 'National Power Portal',
        portal_url: 'https://npp.gov.in',
        color_hex: '#eab308',
        buffer_default_m: 52,
        is_critical: false,
      },
      {
        layer_id: uuid('layer-5'),
        layer_code: 'PETROLEUM_PIPELINE',
        layer_name: 'National Gas & Petroleum Hydrocarbon Pipelines',
        layer_name_hi: 'राष्ट्रीय गैस एवं पेट्रोलियम पाइपलाइन कॉरिडोर',
        ministry: 'Petroleum and Natural Gas Regulatory Board (PNGRB)',
        statutory_act: 'Petroleum and Minerals Pipelines Act 1965 Sec 3',
        portal_name: 'PNGRB Pipeline Portal',
        portal_url: 'https://pngrb.gov.in',
        color_hex: '#dc2626',
        buffer_default_m: 45,
        is_critical: true,
      },
      {
        layer_id: uuid('layer-6'),
        layer_code: 'DEFENCE_RESTRICTED',
        layer_name: 'Ministry of Defence Cantonments & Radar Clearances',
        layer_name_hi: 'रक्षा मंत्रालय छावनी एवं रडार सुरक्षा बफर',
        ministry: 'Ministry of Defence (Directorate General Defence Estates)',
        statutory_act: 'Works of Defence Act 1903 Sec 3 & 7',
        portal_name: 'Raksha Sampada Portal',
        portal_url: 'https://dgde.gov.in',
        color_hex: '#7c3aed',
        buffer_default_m: 500,
        is_critical: true,
      },
      {
        layer_id: uuid('layer-7'),
        layer_code: 'ASI_MONUMENT_BUFFER',
        layer_name: 'Archaeological Survey of India (ASI) Protected Monuments',
        layer_name_hi: 'भारतीय पुरातत्व सर्वेक्षण (ASI) संरक्षित स्मारक बफर',
        ministry: 'Ministry of Culture / ASI',
        statutory_act: 'AMASR Act 1958 Sec 20A (100m Prohibited / 300m Regulated)',
        portal_name: 'ASI NO-OBJECTION (SMARAC)',
        portal_url: 'https://asi.nic.in',
        color_hex: '#9333ea',
        buffer_default_m: 300,
        is_critical: false,
      },
    ];
    for (const item of gatiShaktiLayersData) {
      await upsert('gati_shakti_layers', item, ['layer_code']);
    }

    // 13. project_inter_agency_nocs (12 realistic national infrastructure clearances)
    const projectInterAgencyNocsData = [
      // Project 1 (Bengaluru Chennai Expressway)
      {
        noc_id: uuid('noc-1-1'),
        project_id: projectIds[0],
        layer_code: 'MOEFCC_RESERVE_FOREST',
        agency_name: 'Forest Department, Karnataka',
        agency_name_hi: 'वन विभाग, कर्नाटक',
        clearance_type: 'STAGE_1_FOREST',
        clearance_type_hi: 'चरण-1 वन डायवर्जन अनापत्ति',
        application_no: 'FP/KA/ROAD/48921/2026',
        affected_area_ha: 6.40,
        chainage_start: 'KM 14+200',
        chainage_end: 'KM 18+600',
        status: 'JOINT_INSPECTION_PENDING',
        sla_days_statutory: 90,
        days_elapsed: 64,
        is_sla_breached: false,
        escalation_level: 'DISTRICT_COLLECTOR',
        nodal_officer: 'Divisional Forest Officer (DFO), Bengaluru Rural',
        action_pending_by: 'DISTRICT_OFFICER',
        next_milestone: 'Conduct Joint Site Inspection (JSI) with DFO and CALA Survey Team',
        next_milestone_hi: 'डीएफओ और सीएएलए सर्वेक्षण टीम के साथ संयुक्त स्थल निरीक्षण (जेएसआई)',
        statutory_order_no: null,
      },
      {
        noc_id: uuid('noc-1-2'),
        project_id: projectIds[0],
        layer_code: 'RAILWAY_CROSSING_GAD',
        agency_name: 'South Western Railway (SWR Construction)',
        agency_name_hi: 'दक्षिण पश्चिम रेलवे (एसडब्ल्यूआर निर्माण)',
        clearance_type: 'RAILWAY_GAD_APPROVAL',
        clearance_type_hi: 'रेलवे आरओबी सामान्य व्यवस्था रेखाचित्र (जीएडी) अनुमोदन',
        application_no: 'RLY/SWR/GAD/2026/042',
        affected_area_ha: 0.85,
        chainage_start: 'KM 28+450',
        chainage_end: 'KM 28+550',
        status: 'STAGE_1_APPROVED',
        sla_days_statutory: 60,
        days_elapsed: 42,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Chief Bridge Engineer, SWR Hubballi',
        action_pending_by: 'PIA',
        next_milestone: 'Submit final structural span calculations for 45m Bow-String Girder',
        next_milestone_hi: '45 मीटर बो-स्ट्रिंग गर्डर हेतु अंतिम संरचनात्मक स्पैन गणना जमा करें',
        statutory_order_no: 'SWR/W/2026/GAD-42/APPR-1',
      },
      {
        noc_id: uuid('noc-1-3'),
        project_id: projectIds[0],
        layer_code: 'POWERGRID_HT_LINE',
        agency_name: 'Power Grid Corporation of India Ltd (SR-II)',
        agency_name_hi: 'पावर ग्रिड कॉर्पोरेशन ऑफ इंडिया लिमिटेड (एसआर-II)',
        clearance_type: 'POWERGRID_CROSSING_NOC',
        clearance_type_hi: '400kV हाई-टेंशन लाइन क्रॉसिंग अनापत्ति',
        application_no: 'PGCIL/SR-2/HT-400KV/108',
        affected_area_ha: 1.20,
        chainage_start: 'KM 35+100',
        chainage_end: 'KM 35+250',
        status: 'STAGE_2_APPROVED',
        sla_days_statutory: 45,
        days_elapsed: 30,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'General Manager (Transmission), PGCIL Bengaluru',
        action_pending_by: 'NONE',
        next_milestone: 'Clearance Granted - Guarding wires installed under transmission span',
        next_milestone_hi: 'अनापत्ति स्वीकृत - ट्रांसमिशन स्पैन के नीचे गार्डिंग तार स्थापित',
        statutory_order_no: 'PGCIL/SR2/NOC/2026/891',
      },
      {
        noc_id: uuid('noc-1-4'),
        project_id: projectIds[0],
        layer_code: 'DEFENCE_RESTRICTED',
        agency_name: 'Ministry of Defence (Southern Command / DGDE)',
        agency_name_hi: 'रक्षा मंत्रालय (दक्षिणी कमान / डीजीडीई)',
        clearance_type: 'DEFENCE_SECURITY_NOC',
        clearance_type_hi: 'रक्षा प्रतिष्ठान सुरक्षा एवं बफर अनापत्ति',
        application_no: 'MOD/DGDE/SOUTHERN/2026/019',
        affected_area_ha: 3.50,
        chainage_start: 'KM 41+000',
        chainage_end: 'KM 42+200',
        status: 'ESCALATED_PMO',
        sla_days_statutory: 90,
        days_elapsed: 114,
        is_sla_breached: true,
        escalation_level: 'CABINET_SECRETARIAT_PMO',
        nodal_officer: 'Defence Estates Officer (DEO), Karnataka Circle',
        action_pending_by: 'CENTRAL_MINISTRY',
        next_milestone: 'Secretary MoRTH to convene inter-ministerial resolution with Defence Secretary',
        next_milestone_hi: 'सड़क परिवहन सचिव रक्षा सचिव के साथ अंतर-मंत्रालयी बैठक आयोजित करेंगे',
        statutory_order_no: null,
      },

      // Project 2 (Western Dedicated Freight Corridor)
      {
        noc_id: uuid('noc-2-1'),
        project_id: projectIds[1],
        layer_code: 'MOEFCC_RESERVE_FOREST',
        agency_name: 'Rajasthan Forest Department',
        agency_name_hi: 'राजस्थान वन विभाग',
        clearance_type: 'STAGE_1_FOREST',
        clearance_type_hi: 'चरण-1 वन डायवर्जन अनापत्ति',
        application_no: 'FP/RJ/RLY/19830/2026',
        affected_area_ha: 12.80,
        chainage_start: 'KM 112+000',
        chainage_end: 'KM 118+400',
        status: 'APPLIED',
        sla_days_statutory: 90,
        days_elapsed: 48,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Conservator of Forests, Jaipur Division',
        action_pending_by: 'STATE_AUTHORITY',
        next_milestone: 'State Advisory Committee (SAC) recommendation to Regional Empowered Committee',
        next_milestone_hi: 'क्षेत्रीय अधिकार प्राप्त समिति को राज्य सलाहकार समिति (एसएसी) की अनुशंसा',
        statutory_order_no: null,
      },
      {
        noc_id: uuid('noc-2-2'),
        project_id: projectIds[1],
        layer_code: 'PETROLEUM_PIPELINE',
        agency_name: 'GAIL (India) Limited - Gas Pipeline Network',
        agency_name_hi: 'गेल (इंडिया) लिमिटेड - गैस पाइपलाइन नेटवर्क',
        clearance_type: 'PETROLEUM_PIPELINE_CROSSING',
        clearance_type_hi: 'उच्च दाब प्राकृतिक गैस पाइपलाइन क्रॉसिंग अनापत्ति',
        application_no: 'GAIL/NOC/WDFC/2026/089',
        affected_area_ha: 2.40,
        chainage_start: 'KM 134+200',
        chainage_end: 'KM 134+400',
        status: 'STAGE_1_APPROVED',
        sla_days_statutory: 60,
        days_elapsed: 38,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Chief General Manager (O&M), GAIL Vadodara',
        action_pending_by: 'PIA',
        next_milestone: 'Deposit cathodic protection casing pipe cost with GAIL Treasury',
        next_milestone_hi: 'गेल ट्रेजरी में कैथोडिक सुरक्षा केसिंग पाइप लागत जमा करें',
        statutory_order_no: 'GAIL/WR/2026/NOC-89/STAGE1',
      },

      // Project 3 (Delhi Mumbai Expressway)
      {
        noc_id: uuid('noc-3-1'),
        project_id: projectIds[2],
        layer_code: 'WILDLIFE_ESZ',
        agency_name: 'Gujarat State Board for Wildlife & NBWL',
        agency_name_hi: 'गुजरात राज्य वन्यजीव बोर्ड एवं एनबीडब्ल्यूएल',
        clearance_type: 'WILDLIFE_NBWL_CLEARANCE',
        clearance_type_hi: 'राष्ट्रीय वन्यजीव बोर्ड (एनबीडब्ल्यूएल) स्थायी समिति अनापत्ति',
        application_no: 'WL/NBWL/2026/GUJ/014',
        affected_area_ha: 4.20,
        chainage_start: 'KM 88+000',
        chainage_end: 'KM 91+500',
        status: 'STAGE_2_APPROVED',
        sla_days_statutory: 120,
        days_elapsed: 85,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Principal Chief Conservator of Forests (Wildlife), Gandhinagar',
        action_pending_by: 'NONE',
        next_milestone: 'Compliance complete: 3 Animal Underpasses (AUP) constructed as per WII design',
        next_milestone_hi: 'अनुपालन पूर्ण: भारतीय वन्यजीव संस्थान डिजाइन अनुसार 3 अंडरपास निर्मित',
        statutory_order_no: 'NBWL/MEMBER-SEC/2026/902',
      },
      {
        noc_id: uuid('noc-3-2'),
        project_id: projectIds[2],
        layer_code: 'ASI_MONUMENT_BUFFER',
        agency_name: 'Archaeological Survey of India (Vadodara Circle)',
        agency_name_hi: 'भारतीय पुरातत्व सर्वेक्षण (वडोदरा मंडल)',
        clearance_type: 'ASI_HERITAGE_NOC',
        clearance_type_hi: 'एएसआई 300 मीटर विनियमित क्षेत्र निर्माण अनापत्ति',
        application_no: 'ASI/VAD/SMARAC/2026/007',
        affected_area_ha: 0.00,
        chainage_start: 'KM 94+300',
        chainage_end: 'KM 94+700',
        status: 'STAGE_2_APPROVED',
        sla_days_statutory: 45,
        days_elapsed: 24,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Superintending Archaeologist, ASI Vadodara',
        action_pending_by: 'NONE',
        next_milestone: 'Heritage impact assessment accepted; 100m prohibited zone strictly bypassed',
        next_milestone_hi: 'विरासत प्रभाव आकलन स्वीकृत; 100 मीटर प्रतिबंधित क्षेत्र पूरी तरह सुरक्षित',
        statutory_order_no: 'ASI/NMA/2026/REG-007',
      },

      // Project 4 (Karnataka Solar Park)
      {
        noc_id: uuid('noc-4-1'),
        project_id: projectIds[3],
        layer_code: 'MOEFCC_RESERVE_FOREST',
        agency_name: 'Karnataka Forest Department (Pavagada Range)',
        agency_name_hi: 'कर्नाटक वन विभाग (पावागड़ा रेंज)',
        clearance_type: 'STAGE_1_FOREST',
        clearance_type_hi: 'चरण-1 गैर-वन उपयोग डायवर्जन अनापत्ति',
        application_no: 'FP/KA/SOLAR/39021/2026',
        affected_area_ha: 18.50,
        chainage_start: 'Plot Block A',
        chainage_end: 'Plot Block D',
        status: 'ESCALATED_PMO',
        sla_days_statutory: 90,
        days_elapsed: 145,
        is_sla_breached: true,
        escalation_level: 'STATE_CHIEF_SECRETARY',
        nodal_officer: 'Principal Chief Conservator of Forests (HoFF), Aranya Bhavan',
        action_pending_by: 'STATE_AUTHORITY',
        next_milestone: 'State Cabinet Sub-Committee clearance on C&D Revenue land forest classification',
        next_milestone_hi: 'सी एवं डी राजस्व भूमि वन वर्गीकरण पर राज्य कैबिनेट उप-समिति निर्णय',
        statutory_order_no: null,
      },
      {
        noc_id: uuid('noc-4-2'),
        project_id: projectIds[3],
        layer_code: 'POWERGRID_HT_LINE',
        agency_name: 'Power Grid Corporation of India (Sub-Station Evacuation)',
        agency_name_hi: 'पावर ग्रिड कॉर्पोरेशन ऑफ इंडिया (ग्रिड निकासी)',
        clearance_type: 'POWERGRID_CROSSING_NOC',
        clearance_type_hi: '765kV सब-स्टेशन इंटर-कनेक्शन बे अनापत्ति',
        application_no: 'PGCIL/SR-1/BAY/2026/092',
        affected_area_ha: 5.00,
        chainage_start: 'Bay 4',
        chainage_end: 'Bay 8',
        status: 'STAGE_1_APPROVED',
        sla_days_statutory: 60,
        days_elapsed: 41,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Executive Director, PGCIL Southern Region-I',
        action_pending_by: 'PIA',
        next_milestone: 'Execute Long Term Open Access (LTOA) grid transmission agreement',
        next_milestone_hi: 'दीर्घकालिक खुली पहुंच (LTOA) ट्रांसमिशन ग्रिड अनुबंध निष्पादित करें',
        statutory_order_no: 'PGCIL/SR1/LTOA/2026/112',
      },

      // Project 5 (Vadodara Urban Mobility Corridor)
      {
        noc_id: uuid('noc-5-1'),
        project_id: projectIds[4],
        layer_code: 'RAILWAY_CROSSING_GAD',
        agency_name: 'Western Railway (Vadodara Division)',
        agency_name_hi: 'पश्चिम रेलवे (वडोदरा मंडल)',
        clearance_type: 'RAILWAY_GAD_APPROVAL',
        clearance_type_hi: 'रेलवे एलसी-34 पर 4-लेन आरओबी जीएडी अनुमोदन',
        application_no: 'RLY/WR/BRC/ROB/2026/011',
        affected_area_ha: 1.10,
        chainage_start: 'KM 3+200',
        chainage_end: 'KM 3+350',
        status: 'IDENTIFIED',
        sla_days_statutory: 60,
        days_elapsed: 18,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Divisional Railway Manager (Works), WR Vadodara',
        action_pending_by: 'PIA',
        next_milestone: 'Submit Joint Feasibility Report with Railway Senior Section Engineer (P-Way)',
        next_milestone_hi: 'वरिष्ठ खंड अभियंता (पी-वे) के साथ संयुक्त व्यवहार्यता रिपोर्ट प्रस्तुत करें',
        statutory_order_no: null,
      },
      {
        noc_id: uuid('noc-5-2'),
        project_id: projectIds[4],
        layer_code: 'PETROLEUM_PIPELINE',
        agency_name: 'Indian Oil Corporation Ltd (Western Region Pipelines)',
        agency_name_hi: 'इंडियन ऑयल कॉर्पोरेशन लिमिटेड (पश्चिमी क्षेत्र पाइपलाइन)',
        clearance_type: 'PETROLEUM_PIPELINE_CROSSING',
        clearance_type_hi: 'आईओसीएल रिफाइनरी क्रूड पाइपलाइन क्रॉसिंग अनापत्ति',
        application_no: 'IOCL/WRPL/NOC/2026/033',
        affected_area_ha: 0.90,
        chainage_start: 'KM 7+800',
        chainage_end: 'KM 7+950',
        status: 'APPLIED',
        sla_days_statutory: 60,
        days_elapsed: 29,
        is_sla_breached: false,
        escalation_level: 'NONE',
        nodal_officer: 'Deputy General Manager (Pipelines), IOCL Koyali',
        action_pending_by: 'DISTRICT_OFFICER',
        next_milestone: 'CALA to convene joint coordination meeting with IOCL right-of-way officers',
        next_milestone_hi: 'सीएएलए आईओसीएल मार्ग अधिकार अधिकारियों के साथ समन्वय बैठक बुलाएंगे',
        statutory_order_no: null,
      },
    ];
    for (const item of projectInterAgencyNocsData) {
      await upsert('project_inter_agency_nocs', item, ['noc_id']);
    }

    // 14. project_risk_snapshots (5 baseline records)
    const projectRiskSnapshotsData = [
      {
        snapshot_id: uuid('snapshot-1'),
        project_id: projectIds[0],
        lifecycle_checkpoint: 'Section 11 Preliminary Notification',
        stage_code: stageCodes[0],
        delay_probability_pct: 80.60,
        risk_level: 'CRITICAL',
        predicted_delay_days: 151,
        confidence_score_pct: 92.50,
        shap_factors: JSON.stringify([{ factor: 'Active High Court Injunctions (2 Stays)', impactPct: 42.0, category: 'LEGAL_DISPUTES', direction: 'INCREASES_DELAY' }]),
        feature_values: JSON.stringify({ activeInjunctions: 2, objectionsOverdue: 14 }),
        dominant_risk_category: 'LEGAL_DISPUTES',
        prescriptive_actions: JSON.stringify(['Convene Special High Court Vacation Bench Mentioning']),
      },
      {
        snapshot_id: uuid('snapshot-2'),
        project_id: projectIds[1],
        lifecycle_checkpoint: 'Section 15 Objections Hearing',
        stage_code: stageCodes[1] || stageCodes[0],
        delay_probability_pct: 32.00,
        risk_level: 'MODERATE',
        predicted_delay_days: 66,
        confidence_score_pct: 88.00,
        shap_factors: JSON.stringify([{ factor: 'Railway Track GAD Approval Pending', impactPct: 28.0, category: 'INTER_AGENCY_CLEARANCE', direction: 'INCREASES_DELAY' }]),
        feature_values: JSON.stringify({ pendingNOCs: 1 }),
        dominant_risk_category: 'INTER_AGENCY_CLEARANCE',
        prescriptive_actions: JSON.stringify(['Joint SWR Technical Committee Session']),
      },
      {
        snapshot_id: uuid('snapshot-3'),
        project_id: projectIds[2],
        lifecycle_checkpoint: 'Section 19 Declaration of Acquisition',
        stage_code: stageCodes[2] || stageCodes[0],
        delay_probability_pct: 16.60,
        risk_level: 'LOW',
        predicted_delay_days: 39,
        confidence_score_pct: 95.00,
        shap_factors: JSON.stringify([{ factor: 'Fast-Track Compensation Disbursement', impactPct: 15.0, category: 'FINANCIAL_PFMS', direction: 'REDUCES_DELAY' }]),
        feature_values: JSON.stringify({ dbtDisbursedPct: 88.5 }),
        dominant_risk_category: 'FINANCIAL_PFMS',
        prescriptive_actions: JSON.stringify(['Maintain Weekly PFMS Settlement Tranches']),
      },
      {
        snapshot_id: uuid('snapshot-4'),
        project_id: projectIds[3],
        lifecycle_checkpoint: 'Pre-Construction Regulatory Screening',
        stage_code: stageCodes[0],
        delay_probability_pct: 81.90,
        risk_level: 'CRITICAL',
        predicted_delay_days: 153,
        confidence_score_pct: 91.00,
        shap_factors: JSON.stringify([{ factor: 'Forest Land Deemed Classification Dispute', impactPct: 45.0, category: 'REGULATORY_CLEARANCE', direction: 'INCREASES_DELAY' }]),
        feature_values: JSON.stringify({ forestAreaHa: 18.5 }),
        dominant_risk_category: 'REGULATORY_CLEARANCE',
        prescriptive_actions: JSON.stringify(['Cabinet Sub-Committee Exemption Motion']),
      },
      {
        snapshot_id: uuid('snapshot-5'),
        project_id: projectIds[4],
        lifecycle_checkpoint: 'Feasibility & Alignment Survey',
        stage_code: stageCodes[0],
        delay_probability_pct: 24.90,
        risk_level: 'LOW',
        predicted_delay_days: 54,
        confidence_score_pct: 87.50,
        shap_factors: JSON.stringify([{ factor: 'Urban Utility Relocation Coordination', impactPct: 20.0, category: 'DISTRICT_ADMIN', direction: 'INCREASES_DELAY' }]),
        feature_values: JSON.stringify({ utilityLines: 3 }),
        dominant_risk_category: 'DISTRICT_ADMIN',
        prescriptive_actions: JSON.stringify(['Single Window Utility Clearance Taskforce']),
      },
    ];
    for (const item of projectRiskSnapshotsData) {
      await upsert('project_risk_snapshots', item, ['snapshot_id']);
    }

    await client.query('COMMIT');
    console.log(`Seed completed successfully. PostGIS: ${hasPostgis ? 'enabled' : 'not installed (geometry values stored as text-compatible WKT)'}`);
    console.log('Demo login password for all seeded users: bhoomi2026\n');

    // Verification audit: Ensure every table in the database has at least 5 rows
    console.log('=== Database Table Row Count Verification (Target: >= 5 rows per table) ===');
    const tableListResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    let allSatisfied = true;
    const tableCounts = [];
    for (const row of tableListResult.rows) {
      const countRes = await client.query(`SELECT count(*)::int AS count FROM "${row.table_name}"`);
      const count = countRes.rows[0].count;
      tableCounts.push({ table: row.table_name, count });
      if (count < 5) {
        allSatisfied = false;
        console.warn(`[WARNING] Table ${row.table_name} has only ${count} rows (expected >= 5).`);
      }
    }

    console.table(tableCounts);
    if (allSatisfied) {
      console.log(`\n[SUCCESS] Verified: All ${tableListResult.rows.length} database tables contain at least 5 rows!`);
    } else {
      console.warn('\n[WARNING] Some tables have fewer than 5 rows.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
});

