-- BhoomiSetu production database bootstrap
-- Target: PostgreSQL 14+ with PostGIS
-- Converted from MySQL schema; review application-specific behavior before production use.
--
-- This script is intentionally non-destructive:
--   * it never drops a database or table;
--   * it creates the database and tables only when they do not exist;
--   * it seeds reference data idempotently.
--
-- Import with:
--   psql -U <user> -d <database> -f bhoomiSetu_postgresql.sql
--
-- Spatial convention:
--   * GPS/map geometries use WGS 84 (SRID 4326).
--   * alignment_metric is intentionally SRID-flexible because a project may
--     use a locally appropriate projected CRS for metre-based calculations.
--   * do not use geographic SRID 4326 for metre-based non-point buffers.

CREATE EXTENSION IF NOT EXISTS postgis;
SET TIME ZONE 'UTC';

CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_key VARCHAR(100) NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  applied_by VARCHAR(128) NULL,
  PRIMARY KEY (migration_key)
);

-- ---------------------------------------------------------------------------
-- Identity, authorization, and administrative geography
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  role_code VARCHAR(40) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (role_code)
);

CREATE TABLE IF NOT EXISTS jurisdictions (
  jurisdiction_id UUID NOT NULL,
  parent_jurisdiction_id UUID NULL,
  jurisdiction_type TEXT NOT NULL,
  jurisdiction_code VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  name_local VARCHAR(160) NULL,
  official_code VARCHAR(64) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (jurisdiction_id),
  CONSTRAINT uq_jurisdiction_type_code UNIQUE (jurisdiction_type, jurisdiction_code),
  CONSTRAINT fk_jurisdictions_parent
    FOREIGN KEY (parent_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS users (
  user_id UUID NOT NULL,
  login_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  designation VARCHAR(160) NULL,
  department VARCHAR(180) NULL,
  phone_e164 VARCHAR(20) NULL,
  account_status TEXT NOT NULL DEFAULT 'INVITED',
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (user_id),
  CONSTRAINT uq_users_login_name UNIQUE (login_name),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL,
  role_code VARCHAR(40) NOT NULL,
  assigned_by UUID NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, role_code),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_code)
    REFERENCES roles (role_code)
    ON DELETE RESTRICT,
  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (assigned_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL DEFAULT 'en',
  timezone_name VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
  email_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  field_sync_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sla_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  compensation_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_jurisdictions (
  user_id UUID NOT NULL,
  jurisdiction_id UUID NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'VIEW',
  valid_from DATE NULL,
  valid_to DATE NULL,
  assigned_by UUID NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, jurisdiction_id),
  CONSTRAINT fk_user_jurisdictions_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_jurisdictions_jurisdiction
    FOREIGN KEY (jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_user_jurisdictions_assigned_by
    FOREIGN KEY (assigned_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_user_jurisdiction_dates
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  token_hash CHAR(64) NOT NULL,
  ip_address INET NULL,
  user_agent VARCHAR(512) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  PRIMARY KEY (session_id),
  CONSTRAINT uq_auth_sessions_token_hash UNIQUE (token_hash),
  CONSTRAINT fk_auth_sessions_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE
);

-- A single idempotency key is used for one client request, including offline
-- retries and PFMS submissions.
CREATE TABLE IF NOT EXISTS api_idempotency_keys (
  idempotency_key VARCHAR(128) NOT NULL,
  user_id UUID NULL,
  request_method VARCHAR(12) NOT NULL,
  request_path VARCHAR(255) NOT NULL,
  request_fingerprint CHAR(64) NOT NULL,
  response_status SMALLINT NULL,
  response_body JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (idempotency_key),
  CONSTRAINT fk_idempotency_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Reference data for the statutory workflow and document vault
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_types (
  document_type_code VARCHAR(40) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  is_publicly_visible BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (document_type_code)
);

CREATE TABLE IF NOT EXISTS workflow_stage_definitions (
  stage_code VARCHAR(40) NOT NULL,
  stage_order SMALLINT NOT NULL,
  display_name VARCHAR(180) NOT NULL,
  display_name_local VARCHAR(180) NULL,
  description VARCHAR(500) NULL,
  default_sla_days INTEGER NOT NULL,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (stage_code),
  CONSTRAINT uq_workflow_stage_order UNIQUE (stage_order),
  CONSTRAINT chk_workflow_stage_sla
    CHECK (default_sla_days > 0)
);

CREATE TABLE IF NOT EXISTS workflow_stage_roles (
  stage_code VARCHAR(40) NOT NULL,
  role_code VARCHAR(40) NOT NULL,
  can_enter BOOLEAN NOT NULL DEFAULT TRUE,
  can_approve BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (stage_code, role_code),
  CONSTRAINT fk_workflow_stage_roles_stage
    FOREIGN KEY (stage_code)
    REFERENCES workflow_stage_definitions (stage_code)
    ON DELETE CASCADE,
  CONSTRAINT fk_workflow_stage_roles_role
    FOREIGN KEY (role_code)
    REFERENCES roles (role_code)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workflow_stage_required_documents (
  stage_code VARCHAR(40) NOT NULL,
  document_type_code VARCHAR(40) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (stage_code, document_type_code),
  CONSTRAINT fk_required_documents_stage
    FOREIGN KEY (stage_code)
    REFERENCES workflow_stage_definitions (stage_code)
    ON DELETE CASCADE,
  CONSTRAINT fk_required_documents_type
    FOREIGN KEY (document_type_code)
    REFERENCES document_types (document_type_code)
    ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- Projects, alignments, land records, and GIS intersections
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  project_id UUID NOT NULL,
  project_code VARCHAR(100) NOT NULL,
  title VARCHAR(240) NOT NULL,
  sector VARCHAR(160) NOT NULL,
  pia_name VARCHAR(240) NOT NULL,
  pia_user_id UUID NULL,
  sponsoring_ministry VARCHAR(240) NULL,
  project_status TEXT
    NOT NULL DEFAULT 'PLANNING',
  primary_state_jurisdiction_id UUID NULL,
  estimated_budget_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  total_acquisition_area_ha DECIMAL(18, 4) NOT NULL DEFAULT 0,
  start_date DATE NULL,
  target_completion_date DATE NULL,
  description TEXT NULL,
  external_reference VARCHAR(120) NULL,
  version_no INTEGER NOT NULL DEFAULT 1,
  created_by UUID NULL,
  updated_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  archived_at TIMESTAMPTZ NULL,
  PRIMARY KEY (project_id),
  CONSTRAINT uq_projects_code UNIQUE (project_code),
  CONSTRAINT fk_projects_pia_user
    FOREIGN KEY (pia_user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_projects_state
    FOREIGN KEY (primary_state_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_projects_created_by
    FOREIGN KEY (created_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_projects_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_projects_budget
    CHECK (estimated_budget_inr >= 0),
  CONSTRAINT chk_projects_area
    CHECK (total_acquisition_area_ha >= 0),
  CONSTRAINT chk_projects_dates
    CHECK (target_completion_date IS NULL OR start_date IS NULL OR target_completion_date >= start_date)
);

CREATE TABLE IF NOT EXISTS project_jurisdictions (
  project_id UUID NOT NULL,
  jurisdiction_id UUID NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (project_id, jurisdiction_id),
  CONSTRAINT fk_project_jurisdictions_project
    FOREIGN KEY (project_id)
    REFERENCES projects (project_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_project_jurisdictions_jurisdiction
    FOREIGN KEY (jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS project_alignments (
  alignment_id UUID NOT NULL,
  project_id UUID NOT NULL,
  version_no INTEGER NOT NULL,
  alignment_name VARCHAR(180) NOT NULL,
  centerline_wgs84 geometry(LineString, 4326) NOT NULL,
  right_of_way_wgs84 geometry(Geometry, 4326) NULL,
  alignment_metric geometry NULL,
  metric_srid INTEGER NULL,
  buffer_width_m DECIMAL(10, 2) NOT NULL DEFAULT 0,
  geometry_hash CHAR(64) NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  uploaded_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  activated_at TIMESTAMPTZ NULL,
  PRIMARY KEY (alignment_id),
  CONSTRAINT uq_project_alignment_version UNIQUE (project_id, version_no),
  CONSTRAINT uq_project_alignment_hash UNIQUE (project_id, geometry_hash),
  CONSTRAINT fk_project_alignments_project
    FOREIGN KEY (project_id)
    REFERENCES projects (project_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_project_alignments_uploaded_by
    FOREIGN KEY (uploaded_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_alignment_buffer
    CHECK (buffer_width_m >= 0),
  CONSTRAINT chk_alignment_metric_srid
    CHECK (alignment_metric IS NULL OR metric_srid IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS parcel_sources (
  parcel_source_id UUID NOT NULL,
  source_code VARCHAR(100) NOT NULL,
  authority_name VARCHAR(240) NOT NULL,
  dataset_name VARCHAR(240) NULL,
  dataset_version VARCHAR(100) NULL,
  imported_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (parcel_source_id),
  CONSTRAINT uq_parcel_sources_code UNIQUE (source_code)
);

CREATE TABLE IF NOT EXISTS parcels (
  parcel_id UUID NOT NULL,
  parcel_source_id UUID NULL,
  source_record_key VARCHAR(128) NOT NULL,
  ulpin VARCHAR(32) NOT NULL,
  survey_number VARCHAR(100) NOT NULL,
  khasra_number VARCHAR(100) NULL,
  state_jurisdiction_id UUID NULL,
  district_jurisdiction_id UUID NULL,
  taluk_jurisdiction_id UUID NULL,
  village_jurisdiction_id UUID NULL,
  village_name VARCHAR(180) NOT NULL,
  total_area_ha DECIMAL(18, 4) NOT NULL,
  land_use_category TEXT
    NOT NULL,
  parcel_status TEXT NOT NULL DEFAULT 'IDENTIFIED',
  owner_reference VARCHAR(80) NULL,
  owner_name_masked VARCHAR(180) NULL,
  boundary_wgs84 geometry(Geometry, 4326) NOT NULL,
  centroid_wgs84 geometry(Point, 4326) NULL,
  is_disputed BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_reason VARCHAR(500) NULL,
  estimated_market_value_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  record_version INTEGER NOT NULL DEFAULT 1,
  imported_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (parcel_id),
  CONSTRAINT uq_parcels_ulpin UNIQUE (ulpin),
  CONSTRAINT uq_parcels_source_record UNIQUE (parcel_source_id, source_record_key),
  CONSTRAINT fk_parcels_source
    FOREIGN KEY (parcel_source_id)
    REFERENCES parcel_sources (parcel_source_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_parcels_state
    FOREIGN KEY (state_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_parcels_district
    FOREIGN KEY (district_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_parcels_taluk
    FOREIGN KEY (taluk_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_parcels_village
    FOREIGN KEY (village_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_parcels_area
    CHECK (total_area_ha >= 0),
  CONSTRAINT chk_parcels_value
    CHECK (estimated_market_value_inr >= 0)
);

CREATE TABLE IF NOT EXISTS parcel_owners (
  parcel_owner_id UUID NOT NULL,
  parcel_id UUID NOT NULL,
  owner_reference VARCHAR(80) NOT NULL,
  owner_type TEXT
    NOT NULL DEFAULT 'INDIVIDUAL',
  masked_name VARCHAR(180) NULL,
  encrypted_legal_name BYTEA NULL,
  identity_token BYTEA NULL,
  encrypted_phone BYTEA NULL,
  ownership_share_percent DECIMAL(7, 4) NOT NULL DEFAULT 100,
  verification_status TEXT
    NOT NULL DEFAULT 'UNVERIFIED',
  valid_from DATE NULL,
  valid_to DATE NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (parcel_owner_id),
  CONSTRAINT uq_parcel_owner_reference UNIQUE (parcel_id, owner_reference),
  CONSTRAINT fk_parcel_owners_parcel
    FOREIGN KEY (parcel_id)
    REFERENCES parcels (parcel_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_owner_share
    CHECK (ownership_share_percent > 0 AND ownership_share_percent <= 100),
  CONSTRAINT chk_owner_dates
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE TABLE IF NOT EXISTS project_parcels (
  project_parcel_id UUID NOT NULL,
  project_id UUID NOT NULL,
  parcel_id UUID NOT NULL,
  alignment_id UUID NULL,
  impact_status TEXT NOT NULL DEFAULT 'IDENTIFIED',
  impacted_area_ha DECIMAL(18, 4) NOT NULL DEFAULT 0,
  acquired_area_ha DECIMAL(18, 4) NOT NULL DEFAULT 0,
  impact_geometry_wgs84 geometry(Geometry, 4326) NULL,
  intersection_calculated_at TIMESTAMPTZ NULL,
  intersection_method VARCHAR(80) NULL,
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (project_parcel_id),
  CONSTRAINT uq_project_parcel UNIQUE (project_id, parcel_id),
  CONSTRAINT fk_project_parcels_project
    FOREIGN KEY (project_id)
    REFERENCES projects (project_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_project_parcels_parcel
    FOREIGN KEY (parcel_id)
    REFERENCES parcels (parcel_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_project_parcels_alignment
    FOREIGN KEY (alignment_id)
    REFERENCES project_alignments (alignment_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_project_parcel_areas
    CHECK (impacted_area_ha >= 0 AND acquired_area_ha >= 0)
);

-- ---------------------------------------------------------------------------
-- Acquisition cases and enforced workflow history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS acquisition_cases (
  case_id UUID NOT NULL,
  case_number VARCHAR(120) NOT NULL,
  project_id UUID NOT NULL,
  state_jurisdiction_id UUID NULL,
  district_jurisdiction_id UUID NULL,
  current_stage_code VARCHAR(40) NOT NULL,
  case_status TEXT
    NOT NULL DEFAULT 'DRAFT',
  stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  sla_deadline TIMESTAMPTZ NULL,
  is_sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
  days_remaining_in_sla INT NULL,
  total_acquisition_area_ha DECIMAL(18, 4) NOT NULL DEFAULT 0,
  total_beneficiaries_count INTEGER NOT NULL DEFAULT 0,
  data_quality_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  data_quality_passed_checks INTEGER NOT NULL DEFAULT 0,
  data_quality_total_checks INTEGER NOT NULL DEFAULT 0,
  delay_risk_level TEXT NOT NULL DEFAULT 'LOW',
  estimated_compensation_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  disbursed_compensation_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  assigned_officer_user_id UUID NULL,
  version_no INTEGER NOT NULL DEFAULT 1,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  completed_at TIMESTAMPTZ NULL,
  PRIMARY KEY (case_id),
  CONSTRAINT uq_acquisition_cases_number UNIQUE (case_number),
  CONSTRAINT fk_cases_project
    FOREIGN KEY (project_id)
    REFERENCES projects (project_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_cases_state
    FOREIGN KEY (state_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_cases_district
    FOREIGN KEY (district_jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_cases_current_stage
    FOREIGN KEY (current_stage_code)
    REFERENCES workflow_stage_definitions (stage_code)
    ON DELETE RESTRICT,
  CONSTRAINT fk_cases_assigned_officer
    FOREIGN KEY (assigned_officer_user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_cases_created_by
    FOREIGN KEY (created_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_cases_area
    CHECK (total_acquisition_area_ha >= 0),
  CONSTRAINT chk_cases_money
    CHECK (estimated_compensation_inr >= 0 AND disbursed_compensation_inr >= 0),
  CONSTRAINT chk_cases_quality
    CHECK (data_quality_score >= 0 AND data_quality_score <= 100)
);

CREATE TABLE IF NOT EXISTS case_parcels (
  case_parcel_id UUID NOT NULL,
  case_id UUID NOT NULL,
  project_parcel_id UUID NOT NULL,
  case_parcel_status TEXT NOT NULL DEFAULT 'IDENTIFIED',
  acquired_area_ha DECIMAL(18, 4) NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  removed_at TIMESTAMPTZ NULL,
  PRIMARY KEY (case_parcel_id),
  CONSTRAINT uq_case_project_parcel UNIQUE (case_id, project_parcel_id),
  CONSTRAINT fk_case_parcels_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_case_parcels_project_parcel
    FOREIGN KEY (project_parcel_id)
    REFERENCES project_parcels (project_parcel_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_case_parcel_area
    CHECK (acquired_area_ha >= 0)
);

CREATE TABLE IF NOT EXISTS case_stage_instances (
  stage_instance_id UUID NOT NULL,
  case_id UUID NOT NULL,
  stage_code VARCHAR(40) NOT NULL,
  sequence_no INTEGER NOT NULL,
  stage_status TEXT
    NOT NULL DEFAULT 'PENDING',
  entered_at TIMESTAMPTZ NULL,
  due_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  completed_by UUID NULL,
  completion_notes VARCHAR(2000) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (stage_instance_id),
  CONSTRAINT uq_case_stage_sequence UNIQUE (case_id, sequence_no),
  CONSTRAINT fk_case_stage_instances_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_case_stage_instances_stage
    FOREIGN KEY (stage_code)
    REFERENCES workflow_stage_definitions (stage_code)
    ON DELETE RESTRICT,
  CONSTRAINT fk_case_stage_instances_completed_by
    FOREIGN KEY (completed_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS case_workflow_transitions (
  transition_id UUID NOT NULL,
  case_id UUID NOT NULL,
  from_stage_code VARCHAR(40) NULL,
  to_stage_code VARCHAR(40) NOT NULL,
  action_code VARCHAR(60) NOT NULL,
  actor_user_id UUID NOT NULL,
  reason VARCHAR(1000) NULL,
  notes TEXT NULL,
  expected_case_version INTEGER NOT NULL,
  resulting_case_version INTEGER NOT NULL,
  previous_transition_hash CHAR(64) NULL,
  transition_hash CHAR(64) NOT NULL,
  signature_algorithm VARCHAR(40) NULL,
  digital_signature BYTEA NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (transition_id),
  CONSTRAINT uq_case_transition_hash UNIQUE (transition_hash),
  CONSTRAINT uq_case_resulting_version UNIQUE (case_id, resulting_case_version),
  CONSTRAINT fk_case_transitions_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_case_transitions_from_stage
    FOREIGN KEY (from_stage_code)
    REFERENCES workflow_stage_definitions (stage_code)
    ON DELETE RESTRICT,
  CONSTRAINT fk_case_transitions_to_stage
    FOREIGN KEY (to_stage_code)
    REFERENCES workflow_stage_definitions (stage_code)
    ON DELETE RESTRICT,
  CONSTRAINT fk_case_transitions_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_case_transition_versions
    CHECK (resulting_case_version = expected_case_version + 1)
);

CREATE TABLE IF NOT EXISTS case_risk_evaluations (
  risk_evaluation_id UUID NOT NULL,
  case_id UUID NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  risk_level TEXT NOT NULL,
  reasons JSONB NOT NULL,
  recommended_actions JSONB NOT NULL,
  model_version VARCHAR(80) NULL,
  calculated_by UUID NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (risk_evaluation_id),
  CONSTRAINT fk_case_risk_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_case_risk_calculated_by
    FOREIGN KEY (calculated_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_case_risk_score
    CHECK (score >= 0 AND score <= 100)
);

CREATE TABLE IF NOT EXISTS case_quality_assessments (
  quality_assessment_id UUID NOT NULL,
  case_id UUID NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  passed_checks INTEGER NOT NULL DEFAULT 0,
  total_checks INTEGER NOT NULL DEFAULT 0,
  missing_items JSONB NOT NULL,
  assessed_by UUID NULL,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (quality_assessment_id),
  CONSTRAINT fk_case_quality_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_case_quality_assessed_by
    FOREIGN KEY (assessed_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_case_quality_score
    CHECK (score >= 0 AND score <= 100)
);

-- ---------------------------------------------------------------------------
-- Documents, cryptographic evidence, and approvals
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
  document_id UUID NOT NULL,
  document_number VARCHAR(120) NOT NULL,
  document_type_code VARCHAR(40) NOT NULL,
  title VARCHAR(240) NOT NULL,
  project_id UUID NOT NULL,
  case_id UUID NULL,
  parcel_id UUID NULL,
  approval_status TEXT
    NOT NULL DEFAULT 'PENDING_APPROVAL',
  approval_notes VARCHAR(2000) NULL,
  approved_by UUID NULL,
  approved_at TIMESTAMPTZ NULL,
  current_version_no INTEGER NOT NULL DEFAULT 1,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (document_id),
  CONSTRAINT uq_documents_number UNIQUE (document_number),
  CONSTRAINT fk_documents_type
    FOREIGN KEY (document_type_code)
    REFERENCES document_types (document_type_code)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documents_project
    FOREIGN KEY (project_id)
    REFERENCES projects (project_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documents_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_documents_parcel
    FOREIGN KEY (parcel_id)
    REFERENCES parcels (parcel_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_documents_approved_by
    FOREIGN KEY (approved_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_documents_uploaded_by
    FOREIGN KEY (uploaded_by)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS document_versions (
  document_version_id UUID NOT NULL,
  document_id UUID NOT NULL,
  version_no INTEGER NOT NULL,
  storage_provider TEXT NOT NULL,
  storage_bucket VARCHAR(180) NOT NULL,
  object_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(160) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sha256_hash CHAR(64) NOT NULL,
  encryption_key_reference VARCHAR(255) NULL,
  change_summary VARCHAR(1000) NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (document_version_id),
  CONSTRAINT uq_document_version_number UNIQUE (document_id, version_no),
  CONSTRAINT fk_document_versions_document
    FOREIGN KEY (document_id)
    REFERENCES documents (document_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_document_versions_uploaded_by
    FOREIGN KEY (uploaded_by)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS document_approvals (
  document_approval_id UUID NOT NULL,
  document_id UUID NOT NULL,
  document_version_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_user_id UUID NOT NULL,
  notes VARCHAR(2000) NULL,
  signature_algorithm VARCHAR(40) NULL,
  digital_signature BYTEA NULL,
  acted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (document_approval_id),
  CONSTRAINT fk_document_approvals_document
    FOREIGN KEY (document_id)
    REFERENCES documents (document_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_document_approvals_version
    FOREIGN KEY (document_version_id)
    REFERENCES document_versions (document_version_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_document_approvals_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS statutory_notices (
  statutory_notice_id UUID NOT NULL,
  notice_number VARCHAR(140) NOT NULL,
  project_id UUID NOT NULL,
  case_id UUID NOT NULL,
  document_id UUID NULL,
  notice_type TEXT NOT NULL,
  section_reference VARCHAR(100) NOT NULL,
  gazette_reference VARCHAR(180) NULL,
  publication_status TEXT NOT NULL DEFAULT 'DRAFT',
  published_on DATE NULL,
  effective_on DATE NULL,
  public_summary VARCHAR(2000) NULL,
  public_url VARCHAR(500) NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (statutory_notice_id),
  CONSTRAINT uq_statutory_notice_number UNIQUE (notice_number),
  CONSTRAINT fk_statutory_notices_project
    FOREIGN KEY (project_id)
    REFERENCES projects (project_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_statutory_notices_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_statutory_notices_document
    FOREIGN KEY (document_id)
    REFERENCES documents (document_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_statutory_notices_created_by
    FOREIGN KEY (created_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_statutory_notice_dates
    CHECK (effective_on IS NULL OR published_on IS NULL OR effective_on >= published_on)
);

CREATE TABLE IF NOT EXISTS statutory_notice_parcels (
  statutory_notice_id UUID NOT NULL,
  case_parcel_id UUID NOT NULL,
  PRIMARY KEY (statutory_notice_id, case_parcel_id),
  CONSTRAINT fk_statutory_notice_parcels_notice
    FOREIGN KEY (statutory_notice_id)
    REFERENCES statutory_notices (statutory_notice_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_statutory_notice_parcels_case_parcel
    FOREIGN KEY (case_parcel_id)
    REFERENCES case_parcels (case_parcel_id)
    ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- Valuation, beneficiaries, PFMS payments, and resettlement
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS compensation_policies (
  policy_id UUID NOT NULL,
  policy_code VARCHAR(100) NOT NULL,
  policy_name VARCHAR(240) NOT NULL,
  jurisdiction_id UUID NULL,
  source_reference VARCHAR(240) NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  rural_multiplier DECIMAL(10, 4) NOT NULL DEFAULT 1,
  urban_multiplier DECIMAL(10, 4) NOT NULL DEFAULT 1,
  solatium_percent DECIMAL(8, 4) NOT NULL DEFAULT 100,
  annual_interest_percent DECIMAL(8, 4) NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (policy_id),
  CONSTRAINT uq_compensation_policies_code UNIQUE (policy_code),
  CONSTRAINT fk_compensation_policies_jurisdiction
    FOREIGN KEY (jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_compensation_policies_created_by
    FOREIGN KEY (created_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_compensation_policy_dates
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT chk_compensation_policy_rates
    CHECK (
      rural_multiplier > 0
      AND urban_multiplier > 0
      AND solatium_percent >= 0
      AND annual_interest_percent >= 0
    )
);

CREATE TABLE IF NOT EXISTS award_calculations (
  award_calculation_id UUID NOT NULL,
  case_parcel_id UUID NOT NULL,
  policy_id UUID NULL,
  calculation_version INTEGER NOT NULL DEFAULT 1,
  area_sqm DECIMAL(20, 4) NOT NULL DEFAULT 0,
  base_market_rate_per_sqm DECIMAL(20, 4) NOT NULL DEFAULT 0,
  multiplier_factor DECIMAL(10, 4) NOT NULL DEFAULT 1,
  total_market_value_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  solatium_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  additional_interest_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  assets_on_land_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  gross_award_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  deductions_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  net_award_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  calculation_status TEXT
    NOT NULL DEFAULT 'DRAFT',
  inputs_snapshot JSONB NULL,
  calculated_by UUID NULL,
  approved_by UUID NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  approved_at TIMESTAMPTZ NULL,
  PRIMARY KEY (award_calculation_id),
  CONSTRAINT uq_award_case_parcel_version UNIQUE (case_parcel_id, calculation_version),
  CONSTRAINT fk_award_calculations_case_parcel
    FOREIGN KEY (case_parcel_id)
    REFERENCES case_parcels (case_parcel_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_award_calculations_policy
    FOREIGN KEY (policy_id)
    REFERENCES compensation_policies (policy_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_award_calculations_calculated_by
    FOREIGN KEY (calculated_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_award_calculations_approved_by
    FOREIGN KEY (approved_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_award_calculation_amounts
    CHECK (
      area_sqm >= 0
      AND base_market_rate_per_sqm >= 0
      AND multiplier_factor > 0
      AND total_market_value_inr >= 0
      AND solatium_inr >= 0
      AND additional_interest_inr >= 0
      AND assets_on_land_inr >= 0
      AND gross_award_inr >= 0
      AND deductions_inr >= 0
      AND net_award_inr >= 0
    )
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  beneficiary_id UUID NOT NULL,
  case_id UUID NOT NULL,
  case_parcel_id UUID NULL,
  beneficiary_reference VARCHAR(100) NOT NULL,
  masked_name VARCHAR(180) NOT NULL,
  encrypted_legal_name BYTEA NULL,
  identity_token BYTEA NULL,
  share_percentage DECIMAL(7, 4) NOT NULL DEFAULT 100,
  calculated_amount_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  bank_account_token BYTEA NULL,
  bank_account_last4 CHAR(4) NULL,
  ifsc_code VARCHAR(20) NULL,
  verification_status TEXT
    NOT NULL DEFAULT 'UNVERIFIED',
  disbursement_status TEXT
    NOT NULL DEFAULT 'PENDING',
  pfms_transaction_id VARCHAR(160) NULL,
  disbursed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (beneficiary_id),
  CONSTRAINT uq_beneficiary_case_reference UNIQUE (case_id, beneficiary_reference),
  CONSTRAINT uq_beneficiary_pfms_transaction UNIQUE (pfms_transaction_id),
  CONSTRAINT fk_beneficiaries_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_beneficiaries_case_parcel
    FOREIGN KEY (case_parcel_id)
    REFERENCES case_parcels (case_parcel_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_beneficiary_share
    CHECK (share_percentage > 0 AND share_percentage <= 100),
  CONSTRAINT chk_beneficiary_amount
    CHECK (calculated_amount_inr >= 0)
);

CREATE TABLE IF NOT EXISTS payment_batches (
  payment_batch_id UUID NOT NULL,
  batch_number VARCHAR(120) NOT NULL,
  case_id UUID NOT NULL,
  total_beneficiaries INTEGER NOT NULL DEFAULT 0,
  total_amount_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'CREATED',
  pfms_request_reference VARCHAR(160) NULL,
  pfms_batch_reference VARCHAR(160) NULL,
  submission_idempotency_key VARCHAR(128) NULL,
  initiated_by UUID NULL,
  initiated_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  failure_reason VARCHAR(2000) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (payment_batch_id),
  CONSTRAINT uq_payment_batches_number UNIQUE (batch_number),
  CONSTRAINT uq_payment_batches_pfms_reference UNIQUE (pfms_batch_reference),
  CONSTRAINT uq_payment_batches_idempotency UNIQUE (submission_idempotency_key),
  CONSTRAINT fk_payment_batches_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_payment_batches_initiated_by
    FOREIGN KEY (initiated_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_payment_batch_amount
    CHECK (total_amount_inr >= 0)
);

CREATE TABLE IF NOT EXISTS payment_batch_items (
  payment_batch_item_id UUID NOT NULL,
  payment_batch_id UUID NOT NULL,
  beneficiary_id UUID NOT NULL,
  amount_inr DECIMAL(20, 2) NOT NULL,
  item_status TEXT
    NOT NULL DEFAULT 'PENDING',
  pfms_transaction_id VARCHAR(160) NULL,
  bank_response_code VARCHAR(80) NULL,
  bank_response_message VARCHAR(1000) NULL,
  submitted_at TIMESTAMPTZ NULL,
  credited_at TIMESTAMPTZ NULL,
  PRIMARY KEY (payment_batch_item_id),
  CONSTRAINT uq_payment_batch_beneficiary UNIQUE (payment_batch_id, beneficiary_id),
  CONSTRAINT uq_payment_item_pfms_transaction UNIQUE (pfms_transaction_id),
  CONSTRAINT fk_payment_batch_items_batch
    FOREIGN KEY (payment_batch_id)
    REFERENCES payment_batches (payment_batch_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payment_batch_items_beneficiary
    FOREIGN KEY (beneficiary_id)
    REFERENCES beneficiaries (beneficiary_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_payment_item_amount
    CHECK (amount_inr >= 0)
);

CREATE TABLE IF NOT EXISTS affected_families (
  family_id UUID NOT NULL,
  case_id UUID NOT NULL,
  family_reference VARCHAR(100) NOT NULL,
  masked_head_name VARCHAR(180) NOT NULL,
  encrypted_head_name BYTEA NULL,
  vulnerability_category TEXT
    NOT NULL DEFAULT 'GENERAL',
  family_members_count INTEGER NOT NULL DEFAULT 1,
  displaced_from_village VARCHAR(180) NULL,
  housing_grant_status TEXT
    NOT NULL DEFAULT 'ELIGIBLE',
  subsistence_allowance_status TEXT
    NOT NULL DEFAULT 'ELIGIBLE',
  total_entitlement_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  disbursed_amount_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (family_id),
  CONSTRAINT uq_family_case_reference UNIQUE (case_id, family_reference),
  CONSTRAINT fk_families_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_family_amounts
    CHECK (total_entitlement_inr >= 0 AND disbursed_amount_inr >= 0),
  CONSTRAINT chk_family_members
    CHECK (family_members_count > 0)
);

CREATE TABLE IF NOT EXISTS rr_benefits (
  rr_benefit_id UUID NOT NULL,
  family_id UUID NOT NULL,
  benefit_type VARCHAR(100) NOT NULL,
  eligibility_status TEXT NOT NULL DEFAULT 'PENDING',
  sanction_status TEXT
    NOT NULL DEFAULT 'NOT_STARTED',
  entitlement_amount_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  disbursed_amount_inr DECIMAL(20, 2) NOT NULL DEFAULT 0,
  sanctioned_at TIMESTAMPTZ NULL,
  disbursed_at TIMESTAMPTZ NULL,
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (rr_benefit_id),
  CONSTRAINT uq_rr_family_benefit_type UNIQUE (family_id, benefit_type),
  CONSTRAINT fk_rr_benefits_family
    FOREIGN KEY (family_id)
    REFERENCES affected_families (family_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_rr_benefit_amounts
    CHECK (entitlement_amount_inr >= 0 AND disbursed_amount_inr >= 0)
);

-- ---------------------------------------------------------------------------
-- Public objections, grievances, and hearings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS grievances (
  grievance_id UUID NOT NULL,
  grievance_reference VARCHAR(120) NOT NULL,
  case_id UUID NULL,
  parcel_id UUID NULL,
  tracking_token_hash CHAR(64) NULL,
  citizen_name_masked VARCHAR(180) NULL,
  encrypted_citizen_name BYTEA NULL,
  citizen_phone_masked VARCHAR(40) NULL,
  encrypted_citizen_phone BYTEA NULL,
  category VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  grievance_status TEXT
    NOT NULL DEFAULT 'LOGGED',
  filed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  sla_deadline TIMESTAMPTZ NULL,
  assigned_to UUID NULL,
  resolution_notes TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (grievance_id),
  CONSTRAINT uq_grievances_reference UNIQUE (grievance_reference),
  CONSTRAINT uq_grievances_tracking_token UNIQUE (tracking_token_hash),
  CONSTRAINT fk_grievances_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_grievances_parcel
    FOREIGN KEY (parcel_id)
    REFERENCES parcels (parcel_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_grievances_assigned_to
    FOREIGN KEY (assigned_to)
    REFERENCES users (user_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS grievance_hearings (
  hearing_id UUID NOT NULL,
  grievance_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  venue VARCHAR(300) NULL,
  presiding_officer_user_id UUID NULL,
  hearing_status TEXT NOT NULL DEFAULT 'SCHEDULED',
  minutes_document_id UUID NULL,
  outcome_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (hearing_id),
  CONSTRAINT fk_grievance_hearings_grievance
    FOREIGN KEY (grievance_id)
    REFERENCES grievances (grievance_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_grievance_hearings_officer
    FOREIGN KEY (presiding_officer_user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_grievance_hearings_minutes
    FOREIGN KEY (minutes_document_id)
    REFERENCES documents (document_id)
    ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Offline-first field surveys, GPS evidence, and media
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS offline_sync_records (
  sync_record_id UUID NOT NULL,
  client_record_id VARCHAR(160) NOT NULL,
  user_id UUID NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID NULL,
  operation TEXT NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'RECEIVED',
  server_response JSONB NULL,
  error_code VARCHAR(80) NULL,
  error_message VARCHAR(1000) NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  applied_at TIMESTAMPTZ NULL,
  PRIMARY KEY (sync_record_id),
  CONSTRAINT uq_offline_sync_client_record UNIQUE (client_record_id),
  CONSTRAINT fk_offline_sync_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS field_surveys (
  survey_id UUID NOT NULL,
  client_record_id VARCHAR(160) NULL,
  case_id UUID NOT NULL,
  case_parcel_id UUID NULL,
  surveyor_user_id UUID NOT NULL,
  survey_type TEXT
    NOT NULL,
  device_id VARCHAR(160) NULL,
  survey_started_at TIMESTAMPTZ NULL,
  surveyed_at TIMESTAMPTZ NOT NULL,
  gps_location geometry(Point, 4326) NULL,
  gps_accuracy_m DECIMAL(10, 3) NULL,
  demarcation_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  witness_names JSONB NULL,
  observations TEXT NULL,
  sync_status TEXT NOT NULL DEFAULT 'LOCAL',
  payload_hash CHAR(64) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (survey_id),
  CONSTRAINT uq_field_surveys_client_record UNIQUE (client_record_id),
  CONSTRAINT fk_field_surveys_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_field_surveys_case_parcel
    FOREIGN KEY (case_parcel_id)
    REFERENCES case_parcels (case_parcel_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_field_surveys_surveyor
    FOREIGN KEY (surveyor_user_id)
    REFERENCES users (user_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_field_survey_accuracy
    CHECK (gps_accuracy_m IS NULL OR gps_accuracy_m >= 0)
);

CREATE TABLE IF NOT EXISTS field_survey_points (
  survey_point_id UUID NOT NULL,
  survey_id UUID NOT NULL,
  point_sequence INTEGER NOT NULL,
  point_type TEXT NOT NULL DEFAULT 'OTHER',
  location geometry(Point, 4326) NOT NULL,
  accuracy_m DECIMAL(10, 3) NULL,
  captured_at TIMESTAMPTZ NULL,
  PRIMARY KEY (survey_point_id),
  CONSTRAINT uq_field_survey_point_sequence UNIQUE (survey_id, point_sequence),
  CONSTRAINT fk_field_survey_points_survey
    FOREIGN KEY (survey_id)
    REFERENCES field_surveys (survey_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_field_survey_point_accuracy
    CHECK (accuracy_m IS NULL OR accuracy_m >= 0)
);

CREATE TABLE IF NOT EXISTS media_assets (
  media_asset_id UUID NOT NULL,
  client_asset_id VARCHAR(160) NULL,
  case_id UUID NULL,
  case_parcel_id UUID NULL,
  survey_id UUID NULL,
  document_id UUID NULL,
  storage_provider TEXT NOT NULL,
  storage_bucket VARCHAR(180) NOT NULL,
  object_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NULL,
  mime_type VARCHAR(160) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sha256_hash CHAR(64) NOT NULL,
  captured_at TIMESTAMPTZ NULL,
  captured_by UUID NULL,
  gps_location geometry(Point, 4326) NULL,
  gps_accuracy_m DECIMAL(10, 3) NULL,
  caption VARCHAR(500) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (media_asset_id),
  CONSTRAINT uq_media_client_asset UNIQUE (client_asset_id),
  CONSTRAINT fk_media_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_media_case_parcel
    FOREIGN KEY (case_parcel_id)
    REFERENCES case_parcels (case_parcel_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_media_survey
    FOREIGN KEY (survey_id)
    REFERENCES field_surveys (survey_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_media_document
    FOREIGN KEY (document_id)
    REFERENCES documents (document_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_media_captured_by
    FOREIGN KEY (captured_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT chk_media_accuracy
    CHECK (gps_accuracy_m IS NULL OR gps_accuracy_m >= 0)
);

-- ---------------------------------------------------------------------------
-- Possession and handover
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS possession_records (
  possession_record_id UUID NOT NULL,
  memo_number VARCHAR(120) NOT NULL,
  case_id UUID NOT NULL,
  handover_date TIMESTAMPTZ NULL,
  receiving_agency VARCHAR(240) NOT NULL,
  field_officer_user_id UUID NULL,
  panchanama_signed BOOLEAN NOT NULL DEFAULT FALSE,
  possession_status TEXT NOT NULL DEFAULT 'SCHEDULED',
  remarks TEXT NULL,
  signed_document_id UUID NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ,
  PRIMARY KEY (possession_record_id),
  CONSTRAINT uq_possession_memo_number UNIQUE (memo_number),
  CONSTRAINT fk_possession_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_possession_field_officer
    FOREIGN KEY (field_officer_user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_possession_signed_document
    FOREIGN KEY (signed_document_id)
    REFERENCES documents (document_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_possession_created_by
    FOREIGN KEY (created_by)
    REFERENCES users (user_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS possession_parcels (
  possession_record_id UUID NOT NULL,
  case_parcel_id UUID NOT NULL,
  handed_over_area_ha DECIMAL(18, 4) NOT NULL DEFAULT 0,
  PRIMARY KEY (possession_record_id, case_parcel_id),
  CONSTRAINT fk_possession_parcels_record
    FOREIGN KEY (possession_record_id)
    REFERENCES possession_records (possession_record_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_possession_parcels_case_parcel
    FOREIGN KEY (case_parcel_id)
    REFERENCES case_parcels (case_parcel_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_possession_area
    CHECK (handed_over_area_ha >= 0)
);

CREATE TABLE IF NOT EXISTS possession_witnesses (
  possession_witness_id UUID NOT NULL,
  possession_record_id UUID NOT NULL,
  witness_name VARCHAR(180) NOT NULL,
  witness_role VARCHAR(120) NULL,
  identity_reference_masked VARCHAR(120) NULL,
  signature_media_asset_id UUID NULL,
  PRIMARY KEY (possession_witness_id),
  CONSTRAINT fk_possession_witnesses_record
    FOREIGN KEY (possession_record_id)
    REFERENCES possession_records (possession_record_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_possession_witnesses_signature
    FOREIGN KEY (signature_media_asset_id)
    REFERENCES media_assets (media_asset_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS possession_media (
  possession_record_id UUID NOT NULL,
  media_asset_id UUID NOT NULL,
  evidence_type VARCHAR(100) NOT NULL DEFAULT 'POSSESSION_EVIDENCE',
  PRIMARY KEY (possession_record_id, media_asset_id),
  CONSTRAINT fk_possession_media_record
    FOREIGN KEY (possession_record_id)
    REFERENCES possession_records (possession_record_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_possession_media_asset
    FOREIGN KEY (media_asset_id)
    REFERENCES media_assets (media_asset_id)
    ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- Notifications, integrations, and immutable audit evidence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID NOT NULL,
  user_id UUID NULL,
  case_id UUID NULL,
  project_id UUID NULL,
  notification_type VARCHAR(80) NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',
  title VARCHAR(240) NOT NULL,
  message VARCHAR(2000) NOT NULL,
  action_url VARCHAR(500) NULL,
  channel TEXT NOT NULL DEFAULT 'IN_APP',
  delivery_status TEXT
    NOT NULL DEFAULT 'PENDING',
  read_at TIMESTAMPTZ NULL,
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (notification_id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_case
    FOREIGN KEY (case_id)
    REFERENCES acquisition_cases (case_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_project
    FOREIGN KEY (project_id)
    REFERENCES projects (project_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integration_outbox (
  outbox_event_id UUID NOT NULL,
  event_key VARCHAR(180) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(80) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  delivery_status TEXT
    NOT NULL DEFAULT 'PENDING',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NULL,
  last_error VARCHAR(2000) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  delivered_at TIMESTAMPTZ NULL,
  PRIMARY KEY (outbox_event_id),
  CONSTRAINT uq_outbox_event_key UNIQUE (event_key)
);

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id UUID NOT NULL,
  request_id UUID NULL,
  actor_user_id UUID NULL,
  action_code VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID NULL,
  jurisdiction_id UUID NULL,
  before_state JSONB NULL,
  after_state JSONB NULL,
  metadata JSONB NULL,
  ip_address INET NULL,
  previous_event_hash CHAR(64) NULL,
  event_hash CHAR(64) NOT NULL,
  signature_algorithm VARCHAR(40) NULL,
  digital_signature BYTEA NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (audit_event_id),
  CONSTRAINT uq_audit_event_hash UNIQUE (event_hash),
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES users (user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_audit_jurisdiction
    FOREIGN KEY (jurisdiction_id)
    REFERENCES jurisdictions (jurisdiction_id)
    ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Idempotent reference-data seed
-- ---------------------------------------------------------------------------

INSERT INTO roles (role_code, display_name, description, is_system_role) VALUES
  ('PIA', 'Project Implementing Agency', 'Uploads alignments, submits proposals, and tracks impacted parcels.', TRUE),
  ('CENTRAL_MINISTRY', 'Central Ministry', 'National oversight and interstate bottleneck analytics.', TRUE),
  ('STATE_AUTHORITY', 'State Authority', 'Reviews proposals and authorizes state-level transitions.', TRUE),
  ('DISTRICT_OFFICER', 'District Officer', 'Verifies parcels, conducts hearings, calculates awards, and manages PFMS batches.', TRUE),
  ('FIELD_OFFICER', 'Field Officer', 'Performs offline surveys, GPS demarcation, and geo-tagged evidence capture.', TRUE),
  ('AUDITOR', 'Compliance Auditor', 'Verifies completeness, signatures, and the tamper-evident audit chain.', TRUE),
  ('CITIZEN', 'Citizen Transparency Portal', 'Views privacy-preserving status and submits grievances.', TRUE)
ON CONFLICT (role_code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role;

INSERT INTO document_types (document_type_code, display_name, description, is_publicly_visible) VALUES
  ('PROJECT_PROPOSAL', 'Project Proposal', 'Administrative proposal and project sanction material.', FALSE),
  ('ALIGNMENT', 'Alignment / GIS Package', 'Centerline, right-of-way, buffer, and GIS source material.', FALSE),
  ('OWNERSHIP_RECORD', 'Ownership / Land Record', 'Authoritative cadastral and ownership record.', FALSE),
  ('STATE_SANCTION', 'State Administrative Sanction', 'State approval and routing order.', FALSE),
  ('SURVEY_REPORT', 'Joint Survey Report', 'Joint measurement, demarcation, and inspection report.', FALSE),
  ('GAZETTE', 'Gazette Notification', 'Statutory public notification or declaration.', TRUE),
  ('OBJECTION_RECORD', 'Objection / Hearing Record', 'Objection filing, hearing minutes, and decision.', FALSE),
  ('AWARD_ORDER', 'Award Order', 'Award inquiry, valuation, and final award order.', FALSE),
  ('PAYMENT_PROOF', 'PFMS Payment Proof', 'Treasury/PFMS acknowledgement and bank payment evidence.', FALSE),
  ('POSSESSION_MEMO', 'Possession Memo', 'Panchanama and possession handover documentation.', FALSE),
  ('RR_RECORD', 'R&R Record', 'Resettlement and rehabilitation entitlement record.', FALSE),
  ('CLOSURE_REPORT', 'Closure Report', 'Case completion and statutory closure report.', FALSE),
  ('OTHER', 'Other Supporting Document', 'Additional supporting material.', FALSE)
ON CONFLICT (document_type_code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_publicly_visible = EXCLUDED.is_publicly_visible;

INSERT INTO workflow_stage_definitions
  (stage_code, stage_order, display_name, display_name_local, description, default_sla_days, is_terminal)
VALUES
  ('PROPOSAL_SUBMITTED', 1, 'Proposal Submitted', NULL, 'Initial project acquisition proposal.', 30, FALSE),
  ('ALIGNMENT_REVIEW', 2, 'Alignment & Buffer Review', NULL, 'Review the alignment and affected-area buffer.', 30, FALSE),
  ('PARCEL_IDENTIFICATION', 3, 'Parcel Identification (ULPIN)', NULL, 'Identify authoritative ULPIN parcels intersecting the alignment.', 45, FALSE),
  ('STATE_APPROVAL', 4, 'State Administrative Sanction', NULL, 'State authority approval and district routing.', 30, FALSE),
  ('DISTRICT_SURVEY', 5, 'Joint Field Survey & Demarcation', NULL, 'Field survey and boundary demarcation.', 60, FALSE),
  ('NOTIFICATION_PUBLISHED', 6, 'Section Notification Published', NULL, 'Publish the applicable statutory notification.', 30, FALSE),
  ('OBJECTIONS_HEARING', 7, 'Public Objections & Hearing', NULL, 'Receive, hear, and decide objections.', 45, FALSE),
  ('AWARD_ENACTED', 8, 'Award Inquiry & Calculation', NULL, 'Calculate, approve, and enact the award.', 60, FALSE),
  ('COMPENSATION_DISBURSED', 9, 'PFMS Compensation Disbursed', NULL, 'Submit and reconcile beneficiary payments.', 45, FALSE),
  ('POSSESSION_HANDOVER', 10, 'Physical Possession Handover', NULL, 'Record possession after statutory prerequisites.', 30, FALSE),
  ('RR_COMPLETED', 11, 'R&R Benefits Dispatched', NULL, 'Complete rehabilitation and resettlement benefits.', 60, FALSE),
  ('CASE_CLOSED', 12, 'Case Finalized & Closed', NULL, 'Finalize the acquisition docket.', 15, TRUE)
ON CONFLICT (stage_code) DO UPDATE SET
  stage_order = EXCLUDED.stage_order,
  display_name = EXCLUDED.display_name,
  display_name_local = EXCLUDED.display_name_local,
  description = EXCLUDED.description,
  default_sla_days = EXCLUDED.default_sla_days,
  is_terminal = EXCLUDED.is_terminal;

INSERT INTO workflow_stage_roles (stage_code, role_code, can_enter, can_approve) VALUES
  ('PROPOSAL_SUBMITTED', 'PIA', TRUE, FALSE),
  ('PROPOSAL_SUBMITTED', 'STATE_AUTHORITY', TRUE, TRUE),
  ('PROPOSAL_SUBMITTED', 'CENTRAL_MINISTRY', TRUE, TRUE),
  ('ALIGNMENT_REVIEW', 'PIA', TRUE, FALSE),
  ('ALIGNMENT_REVIEW', 'STATE_AUTHORITY', TRUE, TRUE),
  ('ALIGNMENT_REVIEW', 'AUDITOR', TRUE, FALSE),
  ('PARCEL_IDENTIFICATION', 'PIA', TRUE, FALSE),
  ('PARCEL_IDENTIFICATION', 'STATE_AUTHORITY', TRUE, TRUE),
  ('PARCEL_IDENTIFICATION', 'DISTRICT_OFFICER', TRUE, TRUE),
  ('PARCEL_IDENTIFICATION', 'AUDITOR', TRUE, FALSE),
  ('STATE_APPROVAL', 'STATE_AUTHORITY', TRUE, TRUE),
  ('STATE_APPROVAL', 'CENTRAL_MINISTRY', TRUE, TRUE),
  ('DISTRICT_SURVEY', 'DISTRICT_OFFICER', TRUE, TRUE),
  ('DISTRICT_SURVEY', 'FIELD_OFFICER', TRUE, FALSE),
  ('NOTIFICATION_PUBLISHED', 'STATE_AUTHORITY', TRUE, TRUE),
  ('NOTIFICATION_PUBLISHED', 'DISTRICT_OFFICER', TRUE, FALSE),
  ('NOTIFICATION_PUBLISHED', 'PIA', TRUE, FALSE),
  ('OBJECTIONS_HEARING', 'DISTRICT_OFFICER', TRUE, TRUE),
  ('OBJECTIONS_HEARING', 'STATE_AUTHORITY', TRUE, TRUE),
  ('AWARD_ENACTED', 'DISTRICT_OFFICER', TRUE, TRUE),
  ('AWARD_ENACTED', 'STATE_AUTHORITY', TRUE, TRUE),
  ('AWARD_ENACTED', 'AUDITOR', TRUE, FALSE),
  ('COMPENSATION_DISBURSED', 'DISTRICT_OFFICER', TRUE, TRUE),
  ('COMPENSATION_DISBURSED', 'STATE_AUTHORITY', TRUE, TRUE),
  ('POSSESSION_HANDOVER', 'DISTRICT_OFFICER', TRUE, TRUE),
  ('POSSESSION_HANDOVER', 'FIELD_OFFICER', TRUE, FALSE),
  ('RR_COMPLETED', 'DISTRICT_OFFICER', TRUE, TRUE),
  ('RR_COMPLETED', 'STATE_AUTHORITY', TRUE, TRUE),
  ('CASE_CLOSED', 'STATE_AUTHORITY', TRUE, TRUE),
  ('CASE_CLOSED', 'CENTRAL_MINISTRY', TRUE, TRUE),
  ('CASE_CLOSED', 'AUDITOR', TRUE, FALSE) ON CONFLICT DO NOTHING;

INSERT INTO workflow_stage_required_documents (stage_code, document_type_code, is_mandatory) VALUES
  ('PROPOSAL_SUBMITTED', 'PROJECT_PROPOSAL', TRUE),
  ('ALIGNMENT_REVIEW', 'ALIGNMENT', TRUE),
  ('PARCEL_IDENTIFICATION', 'OWNERSHIP_RECORD', TRUE),
  ('STATE_APPROVAL', 'STATE_SANCTION', TRUE),
  ('DISTRICT_SURVEY', 'SURVEY_REPORT', TRUE),
  ('NOTIFICATION_PUBLISHED', 'GAZETTE', TRUE),
  ('OBJECTIONS_HEARING', 'OBJECTION_RECORD', TRUE),
  ('AWARD_ENACTED', 'AWARD_ORDER', TRUE),
  ('COMPENSATION_DISBURSED', 'PAYMENT_PROOF', TRUE),
  ('POSSESSION_HANDOVER', 'POSSESSION_MEMO', TRUE),
  ('RR_COMPLETED', 'RR_RECORD', TRUE),
  ('CASE_CLOSED', 'CLOSURE_REPORT', TRUE) ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Read-optimized dashboard views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_project_summary AS
SELECT
  p.project_id,
  p.project_code,
  p.title,
  p.sector,
  p.project_status,
  p.estimated_budget_inr,
  p.total_acquisition_area_ha,
  (
    SELECT COUNT(*)
    FROM acquisition_cases c
    WHERE c.project_id = p.project_id
  ) AS cases_count,
  (
    SELECT COUNT(*)
    FROM project_parcels pp
    WHERE pp.project_id = p.project_id
      AND pp.impact_status <> 'EXCLUDED'
  ) AS affected_parcels_count,
  (
    SELECT COALESCE(SUM(c.estimated_compensation_inr), 0)
    FROM acquisition_cases c
    WHERE c.project_id = p.project_id
  ) AS estimated_compensation_inr,
  (
    SELECT COALESCE(SUM(c.disbursed_compensation_inr), 0)
    FROM acquisition_cases c
    WHERE c.project_id = p.project_id
  ) AS disbursed_compensation_inr
FROM projects p;

CREATE OR REPLACE VIEW v_case_dashboard AS
SELECT
  c.case_id,
  c.case_number,
  c.project_id,
  p.project_code,
  p.title AS project_title,
  c.current_stage_code,
  ws.display_name AS current_stage_name,
  c.case_status,
  c.stage_updated_at,
  c.sla_deadline,
  c.is_sla_breached,
  c.days_remaining_in_sla,
  c.total_acquisition_area_ha,
  c.total_beneficiaries_count,
  c.data_quality_score,
  c.delay_risk_level,
  c.estimated_compensation_inr,
  c.disbursed_compensation_inr,
  c.assigned_officer_user_id,
  u.full_name AS assigned_officer_name,
  (
    SELECT COUNT(*)
    FROM case_parcels cp
    WHERE cp.case_id = c.case_id
  ) AS parcels_count
FROM acquisition_cases c
JOIN projects p ON p.project_id = c.project_id
JOIN workflow_stage_definitions ws ON ws.stage_code = c.current_stage_code
LEFT JOIN users u ON u.user_id = c.assigned_officer_user_id;

CREATE OR REPLACE VIEW v_payment_batch_summary AS
SELECT
  pb.payment_batch_id,
  pb.batch_number,
  pb.case_id,
  c.case_number,
  pb.payment_status,
  pb.total_beneficiaries,
  pb.total_amount_inr,
  pb.pfms_request_reference,
  pb.pfms_batch_reference,
  pb.initiated_at,
  pb.completed_at,
  (
    SELECT COUNT(*)
    FROM payment_batch_items pbi
    WHERE pbi.payment_batch_id = pb.payment_batch_id
      AND pbi.item_status = 'CREDITED'
  ) AS credited_items,
  (
    SELECT COALESCE(SUM(pbi.amount_inr), 0)
    FROM payment_batch_items pbi
    WHERE pbi.payment_batch_id = pb.payment_batch_id
      AND pbi.item_status = 'CREDITED'
  ) AS credited_amount_inr
FROM payment_batches pb
JOIN acquisition_cases c ON c.case_id = pb.case_id;


-- Non-unique indexes converted from the source schema.
CREATE INDEX IF NOT EXISTS idx_jurisdictions_parent ON jurisdictions (parent_jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_name ON jurisdictions (name);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (account_status);
CREATE INDEX IF NOT EXISTS idx_users_name ON users (full_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role_code);
CREATE INDEX IF NOT EXISTS idx_user_jurisdictions_jurisdiction ON user_jurisdictions (jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_expiry ON auth_sessions (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_user_created ON api_idempotency_keys (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_stage_roles_role ON workflow_stage_roles (role_code);
CREATE INDEX IF NOT EXISTS idx_required_documents_type ON workflow_stage_required_documents (document_type_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (project_status);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects (primary_state_jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON projects (target_completion_date);
CREATE INDEX IF NOT EXISTS idx_project_jurisdictions_jurisdiction ON project_jurisdictions (jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_project_alignments_project_status ON project_alignments (project_id, status);
CREATE INDEX IF NOT EXISTS spx_project_alignments_centerline ON project_alignments USING GIST (centerline_wgs84);
CREATE INDEX IF NOT EXISTS idx_parcels_survey_number ON parcels (survey_number);
CREATE INDEX IF NOT EXISTS idx_parcels_khasra_number ON parcels (khasra_number);
CREATE INDEX IF NOT EXISTS idx_parcels_village ON parcels (village_jurisdiction_id, village_name);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels (parcel_status);
CREATE INDEX IF NOT EXISTS idx_parcels_disputed ON parcels (is_disputed);
CREATE INDEX IF NOT EXISTS spx_parcels_boundary ON parcels USING GIST (boundary_wgs84);
CREATE INDEX IF NOT EXISTS idx_parcel_owners_parcel ON parcel_owners (parcel_id);
CREATE INDEX IF NOT EXISTS idx_project_parcels_project_status ON project_parcels (project_id, impact_status);
CREATE INDEX IF NOT EXISTS idx_project_parcels_parcel ON project_parcels (parcel_id);
CREATE INDEX IF NOT EXISTS idx_cases_project_status ON acquisition_cases (project_id, case_status);
CREATE INDEX IF NOT EXISTS idx_cases_stage ON acquisition_cases (current_stage_code);
CREATE INDEX IF NOT EXISTS idx_cases_district_status ON acquisition_cases (district_jurisdiction_id, case_status);
CREATE INDEX IF NOT EXISTS idx_cases_sla ON acquisition_cases (sla_deadline, is_sla_breached);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON acquisition_cases (assigned_officer_user_id);
CREATE INDEX IF NOT EXISTS idx_case_parcels_project_parcel ON case_parcels (project_parcel_id);
CREATE INDEX IF NOT EXISTS idx_case_parcels_status ON case_parcels (case_id, case_parcel_status);
CREATE INDEX IF NOT EXISTS idx_case_stage_instances_stage ON case_stage_instances (stage_code, stage_status);
CREATE INDEX IF NOT EXISTS idx_case_transitions_case_time ON case_workflow_transitions (case_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_case_transitions_actor ON case_workflow_transitions (actor_user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_case_risk_case_time ON case_risk_evaluations (case_id, calculated_at);
CREATE INDEX IF NOT EXISTS idx_case_quality_case_time ON case_quality_assessments (case_id, assessed_at);
CREATE INDEX IF NOT EXISTS idx_documents_project_case ON documents (project_id, case_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents (document_type_code, approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_parcel ON documents (parcel_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_hash ON document_versions (sha256_hash);
CREATE INDEX IF NOT EXISTS idx_document_versions_object ON document_versions (storage_provider, storage_bucket, object_key);
CREATE INDEX IF NOT EXISTS idx_document_approvals_document_time ON document_approvals (document_id, acted_at);
CREATE INDEX IF NOT EXISTS idx_statutory_notices_case_status ON statutory_notices (case_id, publication_status);
CREATE INDEX IF NOT EXISTS idx_statutory_notices_published ON statutory_notices (published_on, publication_status);
CREATE INDEX IF NOT EXISTS idx_compensation_policies_jurisdiction_dates ON compensation_policies (jurisdiction_id, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_award_calculations_status ON award_calculations (calculation_status);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_case_status ON beneficiaries (case_id, disbursement_status);
CREATE INDEX IF NOT EXISTS idx_payment_batches_case_status ON payment_batches (case_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_families_case ON affected_families (case_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status_sla ON grievances (grievance_status, sla_deadline);
CREATE INDEX IF NOT EXISTS idx_grievances_case ON grievances (case_id);
CREATE INDEX IF NOT EXISTS idx_grievances_parcel ON grievances (parcel_id);
CREATE INDEX IF NOT EXISTS idx_grievance_hearings_schedule ON grievance_hearings (scheduled_at, hearing_status);
CREATE INDEX IF NOT EXISTS idx_offline_sync_user_status ON offline_sync_records (user_id, sync_status, received_at);
CREATE INDEX IF NOT EXISTS idx_field_surveys_case_time ON field_surveys (case_id, surveyed_at);
CREATE INDEX IF NOT EXISTS idx_field_surveys_surveyor ON field_surveys (surveyor_user_id, surveyed_at);
CREATE INDEX IF NOT EXISTS idx_field_surveys_sync_status ON field_surveys (sync_status);
CREATE INDEX IF NOT EXISTS spx_field_survey_points_location ON field_survey_points USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_media_case_parcel ON media_assets (case_id, case_parcel_id);
CREATE INDEX IF NOT EXISTS idx_media_hash ON media_assets (sha256_hash);
CREATE INDEX IF NOT EXISTS idx_possession_case_status ON possession_records (case_id, possession_status);
CREATE INDEX IF NOT EXISTS idx_possession_witnesses_record ON possession_witnesses (possession_record_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications (user_id, delivery_status, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_case ON notifications (case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_delivery ON integration_outbox (delivery_status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_entity_time ON audit_events (entity_type, entity_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor_time ON audit_events (actor_user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_jurisdiction_time ON audit_events (jurisdiction_id, occurred_at);

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

CREATE INDEX IF NOT EXISTS idx_litigation_cases_case ON litigation_cases (case_id);
CREATE INDEX IF NOT EXISTS idx_litigation_cases_parcel ON litigation_cases (parcel_id);
CREATE INDEX IF NOT EXISTS idx_litigation_cases_status ON litigation_cases (litigation_status);



-- ---------------------------------------------------------------------------
-- Missing schemas from initial file
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_anomalies (
    anomaly_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    title_hi character varying(255) NOT NULL,
    severity character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    case_ref character varying(100) NOT NULL,
    parcel_ulpin character varying(50) NOT NULL,
    district character varying(100) NOT NULL,
    district_hi character varying(100) NOT NULL,
    calculated_value character varying(50) NOT NULL,
    district_avg character varying(50) NOT NULL,
    variance_ratio character varying(50) NOT NULL,
    variance_ratio_hi character varying(50) NOT NULL,
    statute character varying(255) NOT NULL,
    statute_hi character varying(255) NOT NULL,
    details text NOT NULL,
    details_hi text NOT NULL,
    flag_date character varying(50) NOT NULL,
    flag_date_hi character varying(50) NOT NULL,
    status character varying(40) DEFAULT 'OPEN'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS bottleneck_diagnostics (
    diagnostic_id character varying(50) NOT NULL,
    stage character varying(200) NOT NULL,
    stage_hi character varying(200) NOT NULL,
    root_cause text NOT NULL,
    root_cause_hi text NOT NULL,
    states_affected jsonb DEFAULT '[]'::jsonb NOT NULL,
    cases_impacted integer DEFAULT 0 NOT NULL,
    avg_delay_days integer DEFAULT 0 NOT NULL,
    severity character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    central_action text NOT NULL,
    central_action_hi text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS central_escalations (
    escalation_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    title_hi character varying(255) NOT NULL,
    source_state character varying(100) NOT NULL,
    corridor character varying(200) NOT NULL,
    category character varying(50) NOT NULL,
    urgency character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    status character varying(50) DEFAULT 'PENDING_DIRECTIVE'::character varying NOT NULL,
    submitted_date character varying(50) NOT NULL,
    summary text NOT NULL,
    summary_hi text NOT NULL,
    requested_action text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS district_metrics (
    metric_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    name_hi character varying(100) NOT NULL,
    division character varying(100) NOT NULL,
    dc_name character varying(150) NOT NULL,
    target_ha numeric(10,2) DEFAULT 0 NOT NULL,
    acquired_ha numeric(10,2) DEFAULT 0 NOT NULL,
    completion_pct numeric(5,2) DEFAULT 0 NOT NULL,
    active_cases integer DEFAULT 0 NOT NULL,
    sla_compliance_pct numeric(5,2) DEFAULT 0 NOT NULL,
    avg_days_to_handover integer DEFAULT 0 NOT NULL,
    compensation_cr numeric(12,2) DEFAULT 0 NOT NULL,
    bottleneck_stage character varying(150) NOT NULL,
    bottleneck_stage_hi character varying(150) NOT NULL,
    status character varying(40) DEFAULT 'ON_TRACK'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS field_tasks (
    task_id character varying(50) NOT NULL,
    parcel_id character varying(50) NOT NULL,
    ulpin character varying(50) NOT NULL,
    case_no character varying(100) NOT NULL,
    survey_no character varying(50) NOT NULL,
    village character varying(100) NOT NULL,
    taluk character varying(100) NOT NULL,
    district character varying(100) NOT NULL,
    recorded_area_ha numeric(10,2) DEFAULT 0 NOT NULL,
    measured_area_ha numeric(10,2),
    status character varying(50) DEFAULT 'PENDING_SURVEY'::character varying NOT NULL,
    priority character varying(30) DEFAULT 'ROUTINE'::character varying NOT NULL,
    due_date character varying(50) NOT NULL,
    distance_km numeric(6,2) DEFAULT 0 NOT NULL,
    bearing_deg integer DEFAULT 0 NOT NULL,
    landholder character varying(200) NOT NULL,
    access_status character varying(40) DEFAULT 'ACCESSIBLE'::character varying NOT NULL,
    correction_remarks text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS national_corridors (
    corridor_id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    name_hi character varying(255) NOT NULL,
    sector character varying(50) NOT NULL,
    length_km numeric(10,2) DEFAULT 0 NOT NULL,
    states_traversed jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_ha numeric(10,2) DEFAULT 0 NOT NULL,
    acquired_ha numeric(10,2) DEFAULT 0 NOT NULL,
    completion_pct numeric(5,2) DEFAULT 0 NOT NULL,
    sanctioned_cr numeric(12,2) DEFAULT 0 NOT NULL,
    disbursed_cr numeric(12,2) DEFAULT 0 NOT NULL,
    interstate_status text NOT NULL,
    interstate_status_hi text NOT NULL,
    risk_level character varying(20) DEFAULT 'LOW'::character varying NOT NULL,
    lead_agency character varying(100) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS national_standards (
    standard_id character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    version character varying(20) NOT NULL,
    status character varying(30) DEFAULT 'MANDATORY'::character varying NOT NULL,
    category character varying(30) NOT NULL,
    compliance_rate numeric(5,2) DEFAULT 0 NOT NULL,
    summary text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS revenue_court_appeals (
    appeal_id character varying(50) NOT NULL,
    appeal_number character varying(100) NOT NULL,
    tribunal_court character varying(200) NOT NULL,
    case_number character varying(100) NOT NULL,
    appellant_name character varying(150) NOT NULL,
    dispute_type character varying(100) NOT NULL,
    claimed_amount_inr numeric(15,2) DEFAULT 0 NOT NULL,
    determined_amount_inr numeric(15,2) DEFAULT 0 NOT NULL,
    hearing_date character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'HEARING'::character varying NOT NULL,
    stay_granted boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS simulation_scenarios (
    scenario_id character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    tagline character varying(255) NOT NULL,
    base_length_km numeric(6,2) DEFAULT 0 NOT NULL,
    base_parcels_per_km numeric(5,2) DEFAULT 0 NOT NULL,
    base_families_per_km numeric(5,2) DEFAULT 0 NOT NULL,
    base_forest_ha numeric(6,2) DEFAULT 0 NOT NULL,
    base_cost_per_km_cr numeric(6,2) DEFAULT 0 NOT NULL,
    base_months integer DEFAULT 0 NOT NULL,
    description text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS state_approvals (
    approval_id character varying(50) NOT NULL,
    approval_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    title_hi character varying(255) NOT NULL,
    project character varying(255) NOT NULL,
    district character varying(150) NOT NULL,
    land_area_ha numeric(10,2) DEFAULT 0 NOT NULL,
    financial_outlay_cr numeric(12,2) DEFAULT 0 NOT NULL,
    submitted_by character varying(150) NOT NULL,
    submitted_date character varying(50) NOT NULL,
    sla_deadline character varying(50) NOT NULL,
    sla_hours_left integer DEFAULT 0 NOT NULL,
    is_urgent boolean DEFAULT false NOT NULL,
    dossier_summary text NOT NULL,
    dossier_summary_hi text NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS state_benchmarks (
    id character varying(10) NOT NULL,
    state character varying(100) NOT NULL,
    state_hi character varying(100) NOT NULL,
    zone character varying(20) NOT NULL,
    projects integer DEFAULT 0 NOT NULL,
    target_ha numeric(10,2) DEFAULT 0 NOT NULL,
    acquired_ha numeric(10,2) DEFAULT 0 NOT NULL,
    completion_pct numeric(5,2) DEFAULT 0 NOT NULL,
    avg_days integer DEFAULT 0 NOT NULL,
    sla_compliance_pct numeric(5,2) DEFAULT 0 NOT NULL,
    dbt_payment_pct numeric(5,2) DEFAULT 0 NOT NULL,
    rr_completion_pct numeric(5,2) DEFAULT 0 NOT NULL,
    grievance_resolution_pct numeric(5,2) DEFAULT 0 NOT NULL,
    litigation_rate numeric(5,2) DEFAULT 0 NOT NULL,
    data_quality_score integer DEFAULT 0 NOT NULL,
    budget_utilization_pct numeric(5,2) DEFAULT 0 NOT NULL,
    status character varying(40) DEFAULT 'ON_TRACK'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY audit_anomalies
    ADD CONSTRAINT audit_anomalies_pkey PRIMARY KEY (anomaly_id);
ALTER TABLE ONLY bottleneck_diagnostics
    ADD CONSTRAINT bottleneck_diagnostics_pkey PRIMARY KEY (diagnostic_id);
ALTER TABLE ONLY central_escalations
    ADD CONSTRAINT central_escalations_pkey PRIMARY KEY (escalation_id);
ALTER TABLE ONLY district_metrics
    ADD CONSTRAINT district_metrics_pkey PRIMARY KEY (metric_id);
ALTER TABLE ONLY field_tasks
    ADD CONSTRAINT field_tasks_pkey PRIMARY KEY (task_id);
ALTER TABLE ONLY national_corridors
    ADD CONSTRAINT national_corridors_pkey PRIMARY KEY (corridor_id);
ALTER TABLE ONLY national_standards
    ADD CONSTRAINT national_standards_code_key UNIQUE (code);
ALTER TABLE ONLY national_standards
    ADD CONSTRAINT national_standards_pkey PRIMARY KEY (standard_id);
ALTER TABLE ONLY revenue_court_appeals
    ADD CONSTRAINT revenue_court_appeals_appeal_number_key UNIQUE (appeal_number);
ALTER TABLE ONLY revenue_court_appeals
    ADD CONSTRAINT revenue_court_appeals_pkey PRIMARY KEY (appeal_id);
ALTER TABLE ONLY simulation_scenarios
    ADD CONSTRAINT simulation_scenarios_pkey PRIMARY KEY (scenario_id);
ALTER TABLE ONLY state_approvals
    ADD CONSTRAINT state_approvals_pkey PRIMARY KEY (approval_id);
ALTER TABLE ONLY state_benchmarks
    ADD CONSTRAINT state_benchmarks_pkey PRIMARY KEY (id);
\unrestrict fmTvbwRwSYMDSKnlPU3c6fFaviDg9dcsLThT5KQg58QPOZhhzIyfwmI1lZTuuis
