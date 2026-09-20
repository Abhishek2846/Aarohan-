# BhoomiSetu Database Architecture & Schema

This directory contains the canonical PostgreSQL + PostGIS database schema, spatial indexing, and data models for the **BhoomiSetu (भूमिसेतु)** platform.

---

## 🏛️ Schema Overview

BhoomiSetu uses a relational PostgreSQL database with PostGIS spatial extensions to support statutory land acquisition under RFCTLARR Act 2013 and national infrastructure projects:

- **Canonical DDL**: [`bhoomiSetu_postgresql.sql`](./bhoomiSetu_postgresql.sql)
- **Geometry CRS**: EPSG:4326 (WGS 84 spatial coordinates for parcel boundaries and project corridors)
- **Spatial Indexing**: GiST indexes on all spatial geometry columns (`boundary_wgs84`)
- **Data Security**: Field-level AES-256-GCM authenticated encryption for DPDP Act 2023 compliance on citizen PII (`identity_token`, `bank_account_token`, `encrypted_legal_name`)

---

## 🚀 Setup & Migration

### Prerequisites
- PostgreSQL 14+ with PostGIS extension installed (`CREATE EXTENSION IF NOT EXISTS postgis;`)

### 1. Initialize Database
```bash
# Create the database
createdb -U postgres bhoomiSetuDb

# Import canonical schema
psql -U postgres -d bhoomiSetuDb -f Database/bhoomiSetu_postgresql.sql
```

### 2. Generate Prisma Client & Seed Data
```bash
cd Backend/api
npx prisma generate
npm run db:seed
```

---

## 🔒 Security & Data Integrity

- **PII Protection**: Raw Aadhaar, PAN, and Bank Account numbers are never stored in plaintext. Encrypted using AES-256-GCM authenticated cipher with 12-byte IV and 16-byte authentication tags.
- **Audit Logging**: All database mutations and sensitive accesses emit immutable SHA-256 hashed audit events in `audit_events`.
- **Session Tracking**: Active tokens and session revocations are tracked in `auth_sessions` with instant kill switch capabilities.

> **Note on Local Data**: The `Database/data/` directory is strictly excluded from version control via `.gitignore` to prevent any local database engine files, private keys, or logs from being committed to Git.
