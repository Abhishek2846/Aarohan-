# BhoomiSetu (भूमिसेतु) | Enterprise Land Acquisition & AI Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0+-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial_Enabled-green.svg)](https://postgis.net/)
[![DPDP Act](https://img.shields.io/badge/DPDP_Act_2023-Compliant_AES--256--GCM-success.svg)](https://www.meity.gov.in/)

Centralized, GIS-enabled, role-based land acquisition management platform for national infrastructure corridors (**SIH 2026 - Problem SIH26016**).

BhoomiSetu streamlines statutory workflows under the **RFCTLARR Act 2013**, integrates spatial GIS corridor screening with PM GatiShakti standards, ensures zero tax on agricultural compensation (Sec 10(37) IT Act & Sec 96 RFCTLARR Act), and enforces end-to-end data privacy complying with the **Digital Personal Data Protection (DPDP) Act 2023**.

---

## 🏛️ Enterprise Monorepo Architecture

```
BhoomiSetuV3/
├── Backend/
│   └── api/                  # NestJS 11 Enterprise API Service
│       ├── src/              # Modular architecture (Auth, Cases, GIS, Compensation, AI, Audit)
│       │   ├── auth/         # JWT + Session tracking + Parichay SSO + Emergency kill switch
│       │   ├── common/       # DPDP Act crypto utility, guards, interceptors, filters
│       │   ├── compensation/ # RFCTLARR tax-exempt calculation engine + PFMS integration
│       │   ├── spatial/      # PostGIS spatial queries, corridor buffering, GeoJSON APIs
│       │   ├── ai/           # Section 15 form assistant & delay risk prediction
│       │   └── audit/        # Immutable SHA-256 Merkle audit trail
│       ├── prisma/           # Prisma ORM schema with PostgreSQL adapter
│       ├── scripts/          # Database seeding and security test suites
│       └── test/             # End-to-end integration test suites
├── Frontend/                 # Next.js 14 App Router Web Application
│   ├── app/                  # Route handlers, dynamic layouts, role-based pages
│   ├── components/           # GIS map renderers, statutory form components, UI widgets
│   ├── lib/                  # Client utilities, API interceptors, DPDP formatting
│   └── public/               # Static assets, GIS imagery, PWA manifest
├── Database/                 # Canonical PostgreSQL Database DDL
│   ├── bhoomiSetu_postgresql.sql # DDL with PostGIS geometries, tables, indexes
│   └── README.md             # Schema architecture and migration instructions
├── scripts/                  # Cross-platform workspace orchestration scripts
│   ├── build-all.js          # Unified monorepo build runner
│   ├── start-dev.js          # Concurrent development runner with auto-port freeing
│   ├── start-public-demo.js  # Shareable local network & tunnel demo runner
│   └── free-ports.js         # Safe zombie process and socket cleaner
├── .env.example              # Safe environment variable template
├── .gitignore                # Enterprise-grade git ignore configuration
├── package.json              # Workspace root manifest and unified scripts
└── README.md                 # System overview and deployment guide
```

---

## ⚡ Quick Start (Unified Single-Command Startup)

Run the entire application (Backend + Frontend + Port Management) with a single command:

```bash
# 1. Install workspace dependencies
npm install

# 2. Setup environment files
copy .env.example .env
copy Backend\api\.env.example Backend\api\.env
copy Frontend\.env.example Frontend\.env

# 3. Start complete application
npm run dev
```

The startup script will automatically:
- Check and free ports 3000 and 3001 if occupied
- Start the NestJS Backend API at `http://localhost:3001/v1`
- Start the Next.js Frontend App at `http://localhost:3000`
- Output local Wi-Fi shareable links to `PUBLIC_URL.txt`
- Launch your default browser directly into BhoomiSetu

---

## 🌐 Public Demo with NGROK (Remote Internet Access)

Expose the entire application securely over the public internet so remote evaluators or team members can interact with the live application from any PC, tablet, or smartphone without requiring local network access.

### Prerequisites

1. **Node.js** (v18+ or v20+)
2. **Project dependencies**: `npm install`
3. **Local PostgreSQL/PostGIS database** (listening on port 5432)
4. **NGROK installed** globally or locally:
   ```bash
   # Install via npm
   npm install -g ngrok
   # Or download binary from: https://ngrok.com/download
   ```
5. **NGROK authenticated** (free account):
   ```bash
   ngrok config add-authtoken <your-auth-token>
   ```

### Verification

Verify your NGROK setup in PowerShell or Command Prompt:

```bash
ngrok version
```

### Launch Public Demo

Run the unified single-command public launcher:

```bash
npm run public
```

*(Note: `npm run dev:public` is also available as an alias.)*

### What This Command Does Automatically

1. **Pre-flight verification**: Checks that `ngrok` is installed and authenticated, and verifies that PostgreSQL is running on port 5432.
2. **Port clearance**: Cleans up ports `3000`, `3001`, and `4040` if held by leftover background processes.
3. **Starts NestJS Backend**: Launches the backend and polls `http://localhost:3001/v1/health` until verified healthy.
4. **Starts NGROK Secure Tunnel**: Creates an encrypted HTTPS tunnel forwarding to port 3000 and captures the public domain from the local NGROK API.
5. **Starts Next.js Frontend**: Configures `NEXT_PUBLIC_API_URL` to point to the public domain and starts the Next.js dev server with internal `/v1/*` reverse proxy rewrites to the backend.
6. **Auto-Opens Browser**: Launches your default browser directly into the public NGROK URL.
7. **Terminal Dashboard**: Displays active shareable URLs, system status, and pre-seeded demo login accounts.
8. **Saves Links**: Persists active URLs to `PUBLIC_URL.txt` in the root folder for instant copying.

### Architecture & Security Guarantees

```
REMOTE BROWSER (Anyone, Anywhere)
       │
       ▼  HTTPS
 NGROK PUBLIC URL (https://xxxx.ngrok-free.dev)
       │
       ▼
 LOCAL FRONTEND (Next.js - Port 3000)
       │
       ▼  Internal Reverse Proxy (/v1/*)
 LOCAL BACKEND (NestJS - Port 3001)
       │
       ▼  Local Database Queries
 LOCAL POSTGRESQL / POSTGIS (Port 5432)
```

- **Database Privacy**: PostgreSQL (port 5432) is strictly local and **never** exposed to the internet.
- **Zero CORS / Cookie Issues**: Because Next.js acts as a reverse proxy under the public origin, the browser never calls `localhost` from remote machines, and cookies (`bhoomi_token`, `bhoomi_role`) work out of the box.
- **Computer Must Remain Online**: The machine running `npm run public` must remain awake and connected to the internet.
- **URL Lifetime**: On NGROK free accounts, your assigned static domain is reused. If restarted, verify the domain printed in the terminal dashboard.

### How to Stop

Press **`Ctrl + C`** in the terminal. The process manager will cleanly terminate Next.js, NestJS, and NGROK without leaving orphan processes.

### Troubleshooting

- **NGROK not recognized**: Ensure `ngrok` is added to your system `PATH`. Restart your terminal after installing.
- **ERR_NGROK_4018 (Unauthenticated)**: Run `ngrok config add-authtoken <token>` with your token from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).
- **Port in use**: The script automatically frees ports, but you can also manually run `npx kill-port 3000 3001 4040`.
- **Database offline**: Verify PostgreSQL is running on port 5432 using Windows Services or Docker.

---

## 🔒 Enterprise Security & Compliance Features

1. **DPDP Act 2023 Field-Level Encryption**:
   - Citizen PII (Aadhaar, PAN, Bank Accounts, Phone Numbers, Legal Names) is encrypted at rest using **authenticated AES-256-GCM** with 12-byte initialization vectors and 16-byte authentication tags.
   - API endpoints enforce default-masking (e.g., `XXXX-XXXX-1004`, `XXXXXXXX1004`) to prevent sensitive data leaks.

2. **Active JWT Session Tracking & Emergency Kill Switch**:
   - Every issued JWT contains a unique Session ID (`jti`).
   - Sessions are validated against database records (`auth_sessions`).
   - Authorized administrators can trigger an **Emergency Force-Logout Kill Switch** to instantly invalidate all active sessions for compromised accounts.

3. **Statutory RFCTLARR Compliance**:
   - Fair compensation computation with automated multiplier factors (1.0x to 2.0x based on rural/urban distance).
   - Solatium (100%) and 12% statutory interest computation.
   - **0% Tax on Agricultural Land** automatically applied under Section 10(37) of Income Tax Act 1961 and Section 96 of RFCTLARR Act 2013.

4. **Cryptographic Audit Ledger**:
   - All critical actions (approvals, compensation disbursements, role changes, kill switch activations) are recorded with SHA-256 hashed audit events.

---

## 🧪 Verification & Test Suites

Run the enterprise automated test suites to verify system integrity:

```bash
# Verify DPDP PII encryption, masking, and JWT session revocation
node Backend/api/scripts/verify_pii_and_revocation.cjs

# Verify monorepo production build
npm run build
```

---

## 📤 Git Repository Initialization & Push Guide

When uploading this repository to GitHub or GitLab:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage all source code (safeguarded by enterprise .gitignore)
git add .

# 3. Check staged files to ensure no sensitive files are included
git status

# 4. Commit changes
git commit -m "feat: enterprise release of BhoomiSetu land acquisition platform"

# 5. Link your remote GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git branch -M main
git push -u origin main
```

> **Safety Guarantee**: The provided `.gitignore` automatically prevents committing `.env` files, private keys (`*.pem`, `*.key`), local MySQL data directories (`Database/data/`), `node_modules/`, Next.js build caches (`.next/`), and editor files.

---

## 📄 License
UNLICENSED — SIH 2026 National Prototype. Built for Ministry of Electronics and Information Technology & Ministry of Rural Development.
#   B h o o m i S e t u  
 