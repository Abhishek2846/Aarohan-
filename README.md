# 🏞️ Aarohan (आरोहण) | Enterprise Land Acquisition & AI Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0+-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial_Enabled-green.svg)](https://postgis.net/)
[![DPDP Act](https://img.shields.io/badge/DPDP_Act_2023-Compliant_AES--256--GCM-success.svg)](https://www.meity.gov.in/)
[![PM GatiShakti](https://img.shields.io/badge/PM_GatiShakti-NMP_Compliant-orange.svg)](https://gatishakti.gov.in/)
[![RFCTLARR](https://img.shields.io/badge/RFCTLARR_Act-2013_Statutory-purple.svg)](https://legislative.gov.in/)

> **Smart India Hackathon (SIH 2026)** — Problem Statement: **SIH26016**  
> **Team:** Stack_Smashers  
> **Target Ministries:** Ministry of Rural Development (MoRD), Ministry of Road Transport & Highways (MoRTH), Ministry of Railways, Ministry of Electronics and Information Technology (MeitY).

---

## 📑 Table of Contents

1. [Executive Summary & Vision](#-executive-summary--vision)
2. [Statutory Framework & Legal Compliance](#-statutory-framework--legal-compliance)
3. [End-to-End 12-Stage Statutory Workflow Engine](#-end-to-end-12-stage-statutory-workflow-engine)
4. [Statutory Compensation & Tax-Exemption Engine](#-statutory-compensation--tax-exemption-engine)
5. [PM GatiShakti GIS & Cadastral Spatial Engine](#-pm-gatishakti-gis--cadastral-spatial-engine)
6. [AI Intelligence, Predictive ML & Simulation Subsystems](#-ai-intelligence-predictive-ml--simulation-subsystems)
7. [DPDP Act 2023 Field-Level Encryption & Security Architecture](#-dpdp-act-2023-field-level-encryption--security-architecture)
8. [Role-Based Access Control (RBAC) & User Directory](#-role-based-access-control-rbac--user-directory)
9. [Frontend Application Topology & Component Catalog](#-frontend-application-topology--component-catalog)
10. [Backend API Reference Catalog](#-backend-api-reference-catalog)
11. [Complete Database Data Model (PostgreSQL + PostGIS)](#-complete-database-data-model-postgresql--postgis)
12. [Monorepo Directory Layout](#-monorepo-directory-layout)
13. [Environment Configuration Reference](#-environment-configuration-reference)
14. [Complete Step-by-Step Reproduction & Deployment Guide](#-complete-step-by-step-reproduction--deployment-guide)
15. [Automated Verification & Test Suites](#-automated-verification--test-suites)
16. [Public Cloud & Tunnel Architecture](#-public-cloud--tunnel-architecture)
17. [License & Intellectual Property](#-license--intellectual-property)

---

## 🏛️ Executive Summary & Vision

**Aarohan (आरोहण)** is an enterprise-grade, centralized, GIS-enabled, role-based Land Acquisition and Resettlement Lifecycle Management Platform architected for India's linear national infrastructure corridors (Highways, Expressways, Dedicated Freight Corridors, High-Speed Rail, Renewable Energy Grids, and Industrial Corridors).

### Key Industry Problems Addressed:
1. **Prolonged Statutory Delays:** Average linear infrastructure acquisition spans 36–54 months due to fragmented offline handoffs across village Amins, District Collectors, and Central Ministries.
2. **Title Disputes & Boundary Overlaps:** Unverified paper cadastral maps cause conflicting claims and litigations.
3. **Disbursement Leakages & Calculation Inconsistencies:** Errors in applying statutory multiplier factors, solatium (100%), and 12% additional market value.
4. **Data Privacy Vulnerabilities:** Leakage of citizen PII (Aadhaar, bank account numbers, circle rate records) violating the Digital Personal Data Protection (DPDP) Act 2023.
5. **Inter-Agency Clearance Bottlenecks:** Lack of spatial alignment with PM GatiShakti national GIS layers causing unexpected collisions with forest reserves, wildlife sanctuaries, and defense assets.

Aarohan digitizes and binds every stakeholder into a unified cryptographic ledger, eliminating bottlenecks while enforcing 100% legal compliance.

---

## ⚖️ Statutory Framework & Legal Compliance

Aarohan directly codifies and enforces the following statutory mandates:

| Mandate / Act | Code / Section | System Implementation |
| :--- | :--- | :--- |
| **RFCTLARR Act 2013** | **Section 11(1)** | Automated publication and GIS boundary verification of Preliminary Notification. |
| **RFCTLARR Act 2013** | **Section 15(1)-(3)** | Digital objection filing, hearing schedule manager, and Competent Authority verdict recording. |
| **RFCTLARR Act 2013** | **Section 19(1)** | Declaration of Acquisition with ULPIN cadastral schedule and digital signature. |
| **RFCTLARR Act 2013** | **Sections 26 to 30** | Deterministic award computation engine (Base Rate × Distance Multiplier + 100% Solatium + 12% Interest + Asset Valuation). |
| **RFCTLARR Act 2013** | **Section 38** | Physical possession memo generation contingent on 100% compensation disbursement. |
| **RFCTLARR Act 2013** | **Second Schedule** | Mandatory Resettlement & Rehabilitation (R&R) entitlements (housing grants, subsistence allowances). |
| **RFCTLARR Act 2013** | **Section 96** | Statutory exemption from stamp duty and income tax on compulsory land acquisition awards. |
| **Income Tax Act 1961**| **Section 10(37)** | Zero TDS / 0% Tax automatically applied on agricultural compensation awards. |
| **DPDP Act 2023** | **Section 8** | Field-level authenticated AES-256-GCM encryption for Citizen PII with automated API masking. |
| **PM GatiShakti NMP** | **BISAG-N Standards** | PostGIS alignment buffering and multi-agency GIS clearance screening. |

---

## 🔄 End-to-End 12-Stage Statutory Workflow Engine

The platform enforces a deterministic state machine across **12 statutory stages**. A case cannot progress to subsequent stages without meeting mandatory legal prerequisites, role authorizations, and document uploads.

```
 [1. Proposal Submitted] ──► [2. Alignment & Buffer Review] ──► [3. Parcel Identification (ULPIN)]
             │                                                                │
             ▼                                                                ▼
 [6. Section 11/19 Gazette] ◄── [5. Joint Field Survey] ◄──── [4. State Administrative Sanction]
             │
             ▼
 [7. Objections & Hearing (Sec 15)] ──► [8. Award Formulation (Sec 23/30)] ──► [9. PFMS Compensation Disbursed]
                                                                                        │
                                                                                        ▼
 [12. Case Closed & Archived] ◄── [11. R&R Completed (Schedule II)] ◄─── [10. Physical Possession Handover]
```

### Stage Specifications & SLA Matrix

| Stage # | Stage Code | Display Name | SLA | Authorized Roles | Mandatory Required Documents | Exit Criteria |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **1** | `PROPOSAL_SUBMITTED` | Proposal Submitted | 30d | `PIA`, `STATE_AUTHORITY`, `CENTRAL_MINISTRY` | Feasibility Report, Alignment Draft | State Authority administrative acknowledgement. |
| **2** | `ALIGNMENT_REVIEW` | Alignment & Buffer Review | 30d | `PIA`, `STATE_AUTHORITY`, `AUDITOR` | Right-of-Way Buffer GeoJSON | Spatial validation against GatiShakti layers without critical unmitigated clashes. |
| **3** | `PARCEL_IDENTIFICATION` | Parcel Identification (ULPIN) | 45d | `PIA`, `STATE_AUTHORITY`, `DISTRICT_OFFICER` | Revenue Cadastral Map, RoR Records | 100% of intersecting parcels assigned authoritative ULPINs and verified land-use tags. |
| **4** | `STATE_APPROVAL` | State Administrative Sanction | 30d | `STATE_AUTHORITY`, `CENTRAL_MINISTRY` | In-Principle Sanction Order | Financial and administrative sanction signed by State Revenue Secretary. |
| **5** | `DISTRICT_SURVEY` | Joint Field Survey & Demarcation | 60d | `DISTRICT_OFFICER`, `FIELD_OFFICER` | Joint Survey Report, Tree/Structure Inventory | GPS boundary demarcation, geotagged evidence capture, and Amin signature. |
| **6** | `NOTIFICATION_PUBLISHED` | Statutory Gazette Notification | 30d | `STATE_AUTHORITY`, `DISTRICT_OFFICER`, `PIA` | Section 11(1) Preliminary Gazette | Cryptographically signed bilingual Gazette published with SHA-256 hash. |
| **7** | `OBJECTIONS_HEARING` | Public Objections & Hearing | 45d | `DISTRICT_OFFICER`, `STATE_AUTHORITY` | Objections Dossier, Hearing Minutes | Section 15 objection hearing conducted; Competent Authority orders uploaded. |
| **8** | `AWARD_ENACTED` | Award Formulation & Inquiry | 60d | `DISTRICT_OFFICER`, `STATE_AUTHORITY`, `AUDITOR` | Section 23/30 Statutory Award Order | Base rate calculation, solatium (100%), interest, and asset valuation finalized. |
| **9** | `COMPENSATION_DISBURSED` | PFMS DBT Compensation | 45d | `DISTRICT_OFFICER`, `STATE_AUTHORITY` | PFMS Batch Ledger, Bank Credit Slips | 100% calculated compensation credited directly to verified landowner bank accounts. |
| **10** | `POSSESSION_HANDOVER` | Physical Possession Handover | 30d | `DISTRICT_OFFICER`, `FIELD_OFFICER` | Section 38 Possession Memo, Panchnama | Boundary clearance, physical handover to PIA, panchnama witnessed and signed. |
| **11** | `RR_COMPLETED` | R&R Benefits Dispatched | 60d | `DISTRICT_OFFICER`, `STATE_AUTHORITY` | Schedule II Entitlement Certificates | Resettlement land allotment, housing grant, and subsistence allowance delivered. |
| **12** | `CASE_CLOSED` | Case Finalized & Archived | 15d | `DISTRICT_OFFICER`, `STATE_AUTHORITY`, `CENTRAL_MINISTRY` | Final Case Closure Audit Report | Full compliance checklist validated; Merkle audit ledger sealed. |

---

## 💰 Statutory Compensation & Tax-Exemption Engine

Aarohan integrates a mathematical calculation engine strictly matching the First Schedule of the RFCTLARR Act 2013 and Section 10(37) of the Income Tax Act 1961.

### 1. Land Valuation Mathematical Formulation

$$\text{Multiplied Value} = \text{Land Area (sqm)} \times \text{Base Circle Rate} \times \text{Distance Multiplier Factor}$$

- **Urban Parcels:** Distance Multiplier = `1.00x`
- **Rural Parcels:** Distance Multiplier = `1.00x` to `2.00x` (determined by radial distance from nearest urban municipality boundary, configurable per State Compensation Policy).

### 2. Mandatory Statutory Additions

$$\text{Solatium (100\%)} = \text{Multiplied Value} \times 1.00$$

$$\text{Additional Interest (12\%)} = \text{Multiplied Value} \times 0.12 \times \left(\frac{\text{Days from Sec 11 to Award}}{365}\right)$$

$$\text{Gross Award} = \text{Multiplied Value} + \text{Solatium} + \text{Additional Interest} + \text{Structural / Tree Assets}$$

### 3. Tax Exemption Logic
- **Agricultural Land:** Exempt from TDS and capital gains tax under **Section 10(37) of Income Tax Act 1961** and **Section 96 of RFCTLARR Act 2013** ($\text{Deduction} = ₹0$).
- **Commercial / Industrial Land:** Configurable withholding rate (default: 30% or applicable state tax slabs).

### 4. Direct Benefit Transfer (PFMS) Integration
- **Strict 100% Share Ownership Balancing:** Beneficiary payout allocations across co-owners must sum to exactly 100.0000% before batch generation is permitted.
- **Idempotent Batch Submissions:** Every PFMS payment batch generates a unique cryptographic idempotency token preventing duplicate disbursement calls.
- **Automated Reconciliations:** Tracks individual transaction statuses (`PENDING`, `SUBMITTED`, `CREDITED`, `FAILED`).

---

## 🗺️ PM GatiShakti GIS & Cadastral Spatial Engine

Aarohan operates an enterprise spatial engine built on **PostgreSQL / PostGIS** conforming to the BISAG-N PM GatiShakti National Master Plan (NMP) data specifications.

```
       PROJECT CORRIDOR ALIGNMENT (LineString / MultiLineString WGS84)
                                    │
                                    ▼  ST_Buffer(centerline, buffer_width_m)
                       RIGHT-OF-WAY (ROW) BUFFER POLYGON
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
CADASTRAL PARCELS            GATI SHAKTI LAYERS            FIELD SURVEY GPS
(ST_Intersects / ST_Intersection) (Forest / Eco / Wildlife) (Geotagged EXIF Points)
```

### Key GIS Functionalities:
1. **Interactive Alignment Drawer:** Tools for PIA engineers to draft, upload, or modify vector alignments (`LineString` in EPSG:4326 WGS84).
2. **Dynamic Buffer Generation:** Computes exact metric corridor polygons (`ST_Buffer` in metric projection).
3. **Automated Cadastral Intersection:** Identifies all revenue land parcels (`ST_Intersects`) and calculates the exact affected area in hectares (`ST_Area(ST_Intersection(...))`).
4. **PM GatiShakti Geo-Clearance Screener:**
   - Detects spatial overlap with 6 statutory environmental and infrastructural layers:
     - Reserve & Protected Forests
     - Wildlife Sanctuaries & National Parks
     - Coastal Regulation Zones (CRZ)
     - Railway Line Crossings (IR Master Plan)
     - National Highway Crossings (NHAI Master Plan)
     - High-Tension Transmission Corridors (PowerGrid)
5. **Inter-Agency NOC Workflow:** Automatically spawns required No-Objection Certificate requests to relevant department authorities based on spatial overlaps.
6. **Digital Twin Parcel Viewer:** Interactive 2D/3D cadastral viewer rendering parcel boundaries, ownership splits, dispute flags, and survey demarcations.

---

## 🧠 AI Intelligence, Predictive ML & Simulation Subsystems

Aarohan features specialized AI services running inside the NestJS engine:

### 1. 90-Day Statutory Delay Prediction Engine
Predicts whether a land acquisition project will cross the critical **90-Day Delay Threshold** beyond statutory SLAs:
- **Feature Extraction:** Analyzes 24 multi-dimensional signals across 5 categories:
  - `LAND_GIS`: Boundary dispute density, missing ULPIN percentage, forest area ratio.
  - `FINANCIAL_DBT`: Award estimation accuracy, co-owner claim completeness, bank account verification lag.
  - `LEGAL_DISPUTES`: Active court litigations, pending Section 15 objections, stay order risk.
  - `STATUTORY_VELOCITY`: Average days spent in current stage vs. national benchmark.
  - `DISTRICT_ADMIN`: Officer caseload, historical SLA compliance rate of the district.
- **TreeSHAP Explainability:** Returns exact feature attribution weights (e.g., `+22.4% delay risk from unresolved forest NOC`).
- **Prescriptive Actions:** Yields actionable statutory remedies (e.g., *"Convene Section 15(2) Joint Hearing within 7 days to reduce expected delay by 18 days"*).

### 2. Multilingual NLP Assistant (Aarohan AI)
- Fully conversational assistant supporting **English** and **Hindi (हिंदी)**.
- Context-aware intent detection for:
  - Case status inquiries (`CASE_STATUS`)
  - Fair compensation entitlement estimations (`COMPENSATION_CALCULATOR`)
  - Gazette notification verification (`GAZETTE_VERIFY`)
  - Grievance registration (`GRIEVANCE_INTENT`)
- Provides deep-links to relevant application screens and generates instant PDF-ready compensation estimate cards.

### 3. What-If Policy Simulation Sandbox
Allows State Revenue Secretaries and Central Planners to simulate project timeline and budgetary outcomes under alternative scenarios:
- Adjusting compensation multiplier factors (1.0x – 2.0x).
- Altering corridor buffer width (e.g., narrowing from 60m to 45m to bypass congested village settlements).
- Deploying extra surveying officers to compress joint survey schedules.

### 4. Cadastral & Document Anomaly Detection
Continuously scans database records to detect inconsistencies:
- Duplicate survey number claims across different files.
- Discrepancies between physical survey acreage and revenue Record of Rights (RoR).
- Mismatched co-owner share percentages totaling $\neq 100\%$.

---

## 🔒 DPDP Act 2023 Field-Level Encryption & Security Architecture

To guarantee strict compliance with the **Digital Personal Data Protection (DPDP) Act 2023**, Aarohan implements zero-trust cryptographic protections:

```
[Plaintext Citizen Data]
      │
      ▼  CryptoUtil.encrypt(text)
┌────────────────────────────────────────────────────────────────────────┐
│ Authenticated AES-256-GCM Binary Payload:                              │
│ [ 12 Bytes Random IV ] + [ 16 Bytes GCM Auth Tag ] + [ Ciphertext... ] │
└────────────────────────────────────────────────────────────────────────┘
      │
      ▼  Stored as PostgreSQL BYTEA
[database: beneficiaries.encrypted_legal_name, identity_token, bank_account_token]
```

### 1. Data at Rest (Field-Level Encryption)
- Citizen PII (Legal Name, Aadhaar Number, Bank Account Number, Mobile Number, PAN) is stored as authenticated `BYTEA` using **AES-256-GCM**.
- Any tampering with the ciphertext or auth tag in the database immediately triggers a cryptographic authentication failure.

### 2. Data in Transit & Default API Masking
- Endpoints return masked representations by default:
  - Aadhaar: `XXXX-XXXX-1234`
  - Bank Account: `XXXXXXXX4921`
  - PAN: `XXXXX1234X`
  - Phone: `+91 XXXXX 43210`
  - Citizen Name: `Rameshwar S****`
- Decryption is restricted strictly to authorized District Officers during biometric eKYC verification.

### 3. Active Session Tracking & Emergency Kill Switch
- Every issued JWT contains a unique Session ID (`jti`).
- Every API request validates that the session is active in the `auth_sessions` table.
- **Emergency Revocation Kill Switch:** Security administrators can immediately invalidate all active tokens for a compromised user ID via `POST /v1/auth/revoke-user-sessions/:userId`.

### 4. Cryptographic Merkle-Chained Audit Ledger
- Every state transition, award enactment, document approval, and payout execution generates an immutable audit event.
- Each event stores: `actor_user_id`, `action`, `entity_type`, `entity_id`, `pre_state_hash`, `post_state_hash`, and a cumulative `sha256_hash` forming a verifiable cryptographic hash chain.

---

## 👥 Role-Based Access Control (RBAC) & User Directory

The platform defines **7 distinct user personas**, each equipped with tailored dashboards and granular statutory capabilities:

| Role Code | User Persona | Primary Responsibilities | 
| :--- | :--- | :--- | 
| `CENTRAL_MINISTRY` | Central Ministry / Cabinet Sec | National corridor monitoring, inter-state escalations, policy benchmarks. | 
| `PIA` | Project Implementing Agency | Corridor alignment drafting, buffer creation, project progress tracking. | 
| `STATE_AUTHORITY` | State Revenue Authority | Administrative sanctions, state approvals, Section 11/19 gazette publishing. | 
| `DISTRICT_OFFICER` | District Collector / CALA | Section 15 objection hearings, award calculations, PFMS payment approvals. | 
| `FIELD_OFFICER` | Revenue Inspector / Amin | GPS field survey, boundary demarcation, geotagged camera evidence capture. | 
| `AUDITOR` | CAG / Vigilance Auditor | Merkle audit ledger verification, anomaly investigations, compliance scoring. | 
| `CITIZEN` | Affected Landowner | Land parcel lookup, claim verification, objection filing, DBT payment tracking. | 

---

## 🖥️ Frontend Application Topology & Component Catalog

Built using **Next.js 14 App Router** with React 18, Tailwind CSS, Radix UI primitives, Lucide Icons, Leaflet GIS, Recharts, and Framer Motion.

### Frontend Route Map (34 Routes)

```
Frontend/app/
├── page.tsx                          # Landing page & public portal entry
├── login/                            # Secure credentials login with role selector
├── auth/
│   ├── callback/                     # OAuth2 / Parichay SSO callback handler
│   └── parichay-gateway/             # National Single Sign-On simulation portal
├── unauthorized/                     # 403 Forbidden role-gate fallthrough screen
├── dashboard/                        # Role-based adaptive root dashboard redirector
│   ├── national/                     # Central Ministry GIS national corridor command center
│   ├── state/                        # State Revenue Department project sanction dashboard
│   ├── district/                     # CALA / District Collector statutory SLA roster
│   ├── pia/                          # Implementing Agency (NHAI/Railways) alignment cockpit
│   └── auditor/                      # CAG Cryptographic Audit & Anomaly Intelligence console
├── projects/                         # Corridor infrastructure portfolio
│   ├── new/                          # Multi-step project creation wizard
│   ├── [id]/                         # Detailed project overview and milestones
│   └── [id]/alignment/               # Interactive GeoJSON alignment & ROW buffer editor
├── cases/                            # Statutory acquisition case manager
│   ├── new/                          # New case registration wizard
│   └── [id]/                         # Case 360° cockpit: stages, parcels, documents, awards
├── gis/                              # Full-screen GIS cadastral mapping portal
├── gati-shakti/                      # PM GatiShakti multi-agency geo-clearance screener
├── compensation/                     # Statutory award calculation & PFMS batch payment center
├── possession/                       # Section 38 possession memo & panchnama generator
├── rr/                               # Resettlement & Rehabilitation Schedule II benefits ledger
├── survey/                           # Field operations and joint demarcation planner
├── field/                            # Mobile-first surveyor PWA with camera & GPS capture
├── gazette/                          # Bilingual Section 11/19 gazette publishing center
├── verify/gazette/                   # Public cryptographic QR verification portal
├── citizen/                          # Citizen public portal: claims, tracking & grievances
├── documents/                        # DMS with versioning, SHA-256 checks & viewer
├── analytics/                        # Macro cross-state performance & SLA compliance analytics
├── simulation/                       # What-If policy & corridor alignment simulation sandbox
├── audit/                            # Cryptographic Merkle audit chain inspector
├── profile/                          # User profile, digital signature & credential manager
├── settings/                         # Platform parameters & DPDP privacy configurations
└── api/v1/                           # Next.js API proxy routes (reverse proxy to NestJS)
    ├── analytics/
    ├── audit/
    ├── auth/
    ├── cases/[id]/
    ├── compensation/
    ├── documents/
    ├── gis/
    ├── parcels/[id]/
    ├── projects/[id]/
    ├── rr/
    └── workflow/
```

### Component Architecture

- **`components/ai/`**: `bhoomi-ai-chatbot.tsx` (Aarohan AI Assistant), `project-delay-risk-card.tsx`, `lifecycle-risk-trajectory.tsx`, `portfolio-risk-overview.tsx`, `role-based-delay-intelligence.tsx`.
- **`components/gis/`**: `gis-map.tsx`, `gis-map-client.tsx`, `alignment-drawer.tsx`, `spatial-query-panel.tsx`, `geotagged-photo-viewer.tsx`.
- **`components/gati-shakti/`**: `gati-shakti-map.tsx`, `gati-shakti-map-client.tsx`, `gati-shakti-screener.tsx`.
- **`components/field/`**: `camera-capture.tsx` (EXIF timestamp & GPS watermarking), `survey-form.tsx`, `sync-status-indicator.tsx`.
- **`components/gazette/`**: `gazette-publisher.tsx`, `gazette-preview-modal.tsx`.
- **`components/advanced/`**: `parcel-digital-twin-viewer.tsx`, `audit-trail-viewer.tsx`, `explainable-delay-risk.tsx`, `impact-simulation-interface.tsx`, `data-quality-score-indicator.tsx`.
- **`components/layout/`**: `civic-header.tsx`, `civic-footer.tsx`, `role-sidebar.tsx`, `notification-drawer.tsx`.
- **`components/common/`**: `role-gate.tsx`, `data-quality-widget.tsx`, `risk-indicator.tsx`, `stat-card.tsx`, `confirm-dialog.tsx`, `breadcrumbs.tsx`, `empty-state.tsx`, `status-badge.tsx`.
- **`components/ui/`**: `bhoomi-emblem.tsx` (National Emblem SVG), `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `badge.tsx`, `progress.tsx`, `separator.tsx`, `skeleton.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`.

---

## ⚡ Backend API Reference Catalog

The NestJS 11 backend organizes services into modular, decoupled domain controllers exposing RESTful APIs under the `/v1` prefix.

### 1. Authentication & Security (`/v1/auth`)
- `POST /v1/auth/login` — Authenticate credentials; returns JWT + sets active session in database.
- `GET /v1/auth/me` — Retrieve active user identity, assigned role, and jurisdiction scope.
- `POST /v1/auth/refresh` — Refresh expired access token using active session validation.
- `POST /v1/auth/logout` — Terminate session and invalidate JWT token in database.
- `POST /v1/auth/revoke-user-sessions/:userId` — **Emergency Kill Switch** revoking all active sessions for a user.
- `POST /v1/auth/mock-sso` — National Parichay SSO authentication simulator.
- `POST /v1/auth/mock-ekyc` — Aadhaar biometric eKYC verification simulator.

### 2. Acquisition Projects (`/v1/projects`)
- `POST /v1/projects` — Register new national corridor project.
- `GET /v1/projects` — Filter and search infrastructure projects.
- `GET /v1/projects/:id` — Get project details, budget, and milestone progress.
- `PATCH /v1/projects/:id` — Update project metadata and status.
- `GET /v1/projects/:id/alignments` — Fetch vector alignments and Right-of-Way geometries.
- `POST /v1/projects/:id/jurisdictions` — Map project to traversed states and districts.

### 3. Statutory Cases (`/v1/acquisition-cases`)
- `POST /v1/acquisition-cases` — Initialize statutory land acquisition docket.
- `GET /v1/acquisition-cases` — Search cases across stages, districts, and SLA status.
- `GET /v1/acquisition-cases/:id` — Retrieve full case 360° docket (parcels, documents, stages, risks).
- `GET /v1/acquisition-cases/:id/stages` — Retrieve complete statutory stage progression timeline.
- `PATCH /v1/acquisition-cases/:id` — Update case metadata or assign field officers.
- `POST /v1/acquisition-cases/:id/parcels` — Link cadastral parcels to acquisition case.
- `GET /v1/acquisition-cases/district-roster` — District Collector SLA compliance roster.

### 4. Workflow State Machine (`/v1/workflow`)
- `GET /v1/workflow/stages` — Retrieve 12 canonical statutory workflow stage definitions.
- `POST /v1/workflow/cases/:caseId/progress` — Advance case to next statutory stage (enforces document & role validation).
- `GET /v1/workflow/state-dashboard` — State Authority administrative approval overview.
- `POST /v1/workflow/state-approvals/:id/action` — Approve or reject state administrative sanction.

### 5. Cadastral Land Parcels (`/v1/parcels`)
- `POST /v1/parcels` — Register authoritative cadastral parcel with PostGIS polygon geometry.
- `GET /v1/parcels` — Query parcels by village, taluk, district, or status.
- `GET /v1/parcels/:id` — Retrieve parcel digital twin, ownership records, and dispute status.
- `GET /v1/parcels/mock-ulpin/:ulpin` — Query national Bhu-Aadhaar ULPIN registry mock.
- `GET /v1/parcels/search/spatial` — Spatial query fetching all parcels intersecting a bounding box or polygon.

### 6. GIS & PM GatiShakti (`/v1/gis`, `/v1/gati-shakti`)
- `POST /v1/gis` — Execute corridor buffer calculation against alignment waypoints.
- `GET /v1/gati-shakti/layers` — Fetch all 6 statutory PM GatiShakti GIS layers.
- `GET /v1/gati-shakti/national-summary` — National multi-agency clearance portfolio summary.
- `GET /v1/gati-shakti/projects/:projectId/screener` — Run geo-clearance conflict screener against alignment.
- `POST /v1/gati-shakti/projects/:projectId/nocs/:nocId/action` — Inter-agency clearance action (Grant/Query/Reject).

### 7. Statutory Compensation & PFMS (`/v1/compensation`)
- `POST /v1/compensation/award` — Compute Section 23/30 statutory award for a parcel.
- `POST /v1/compensation/beneficiaries` — Add beneficiary with AES-256-GCM encrypted PII and share percentage.
- `POST /v1/compensation/batches/:caseId` — Formulate PFMS payment batch (enforces 100% ownership balancing).
- `POST /v1/compensation/batches/:batchId/mock-response` — Simulate PFMS Core Banking Direct Benefit Transfer response.

### 8. Field Surveys & Demarcation (`/v1/field`)
- `GET /v1/field/tasks` — List assigned demarcation and survey tasks for field officers.
- `GET /v1/field/tasks/:id` — Get detailed task guidelines and boundary vertices.
- `PATCH /v1/field/tasks/:id/status` — Update task status (`IN_PROGRESS`, `COMPLETED`).
- `POST /v1/field/surveys` — Upload survey results, boundary points, and geotagged evidence.

### 9. Gazette Publication & Verification (`/v1/gazette`)
- `POST /v1/gazette/draft` — Generate bilingual Section 11/19 preliminary or final declaration draft.
- `POST /v1/gazette/:id/sign` — Apply authorized digital signature to gazette notice.
- `POST /v1/gazette/:id/publish` — Publish notice to e-Gazette repository and freeze SHA-256 hash.
- `GET /v1/gazette/verify/:hashOrRef` — Public verification endpoint validating authenticity of gazette notice.

### 10. Possession Management (`/v1/possession`)
- `GET /v1/possession` — List possession records and land handover status.
- `POST /v1/possession` — Formulate Section 38 Possession Memo after verifying 100% compensation disbursement.
- `POST /v1/possession/schedule` — Schedule joint physical site possession and notify witnesses.
- `PATCH /v1/possession/:id/complete` — Complete possession handover with signed panchnama.

### 11. Resettlement & Rehabilitation (`/v1/rr`)
- `POST /v1/rr/families` — Register affected family under RFCTLARR Second Schedule.
- `POST /v1/rr/families/:familyId/benefits` — Assign housing grants, cattle shed allowances, or subsistence grants.
- `PATCH /v1/rr/benefits/:id/disburse` — Record disbursement of R&R entitlements.

### 12. Public Grievance Redressal (`/v1/grievances`)
- `POST /v1/grievances/submit` — Citizen registers acquisition or valuation grievance.
- `PATCH /v1/grievances/:id/assign` — Assign grievance to Competent Authority or Revenue Inspector.
- `POST /v1/grievances/:id/hearings` — Schedule formal grievance inquiry hearing.
- `PATCH /v1/grievances/:id/resolve` — Submit final grievance resolution order.

### 13. AI Intelligence & Predictive ML (`/v1/ai`)
- `POST /v1/ai/chat` — Multilingual conversational assistant endpoint (English/Hindi).
- `GET /v1/ai/projects/:id/delay-risk` — Run 90-day delay prediction engine with TreeSHAP explainability.
- `GET /v1/ai/projects/:id/risk-trajectory` — Project lifecycle risk curve through completion.
- `POST /v1/ai/projects/:id/what-if` — Simulate What-If policy and alignment scenarios.
- `GET /v1/ai/anomalies` — List cross-cadastral and documentation anomalies.
- `GET /v1/ai/projects/portfolio-risk` — Multi-project national portfolio delay exposure.

### 14. Audit Ledger & Anomaly Inspection (`/v1/audit`)
- `GET /v1/audit` — Query tamper-proof SHA-256 audit ledger.
- `GET /v1/audit/verify-chain` — Verify integrity of the entire cryptographic hash chain.
- `GET /v1/audit/anomalies` — List automated audit alerts and unauthorized transition attempts.

---

## 🗄️ Complete Database Data Model (PostgreSQL + PostGIS)

The relational and spatial database schema encompasses **66 tables** structured into unified domain clusters:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         AAROHAN RELATIONAL DATA MODEL                  │
└────────────────────────────────────────────────────────────────────────┘

 [Core Users & Security]       [Spatial GIS & Alignment]       [Statutory RFCTLARR Workflow]
  - users                       - project_alignments            - workflow_stage_definitions
  - roles                       - parcels                       - workflow_stage_roles
  - user_roles                  - project_parcels               - workflow_stage_required_docs
  - jurisdictions               - parcel_owners                 - acquisition_cases
  - user_jurisdictions          - parcel_sources                - case_parcels
  - auth_sessions               - gati_shakti_layers            - case_stage_instances
  - api_idempotency_keys        - project_inter_agency_nocs     - case_workflow_transitions
  - user_preferences

 [Financial & PFMS DBT]        [Field Operations & Evidence]   [R&R and Public Interface]
  - compensation_policies       - field_surveys                 - affected_families
  - award_calculations          - field_survey_points           - rr_benefits
  - beneficiaries               - field_tasks                   - grievances
  - payment_batches             - offline_sync_records          - grievance_hearings
  - payment_batch_items         - possession_records            - litigation_cases
                                - possession_parcels            - revenue_court_appeals
                                - possession_witnesses
                                - possession_media

 [Document Management]         [Statutory Gazettes]            [AI & Analytics Intelligence]
  - document_types              - statutory_notices             - case_risk_evaluations
  - documents                   - statutory_notice_parcels      - case_quality_assessments
  - document_versions                                           - project_risk_snapshots
  - document_approvals          [Audit & System Integrity]      - simulation_scenarios
  - media_assets                - audit_events                  - state_benchmarks
                                - audit_anomalies               - national_corridors
                                - integration_outbox            - district_metrics
                                - notifications                 - central_escalations
```

---

## 📂 Monorepo Directory Layout

```
d:\Aarohan/
├── Backend/
│   └── api/                          # NestJS 11 Enterprise API Service
│       ├── src/
│       │   ├── acquisition-cases/    # Case lifecycle, stage transitions, docket management
│       │   ├── ai/                   # Delay prediction, TreeSHAP ML, NLP chat, simulation
│       │   ├── analytics/            # Macro-level state & national corridor analytics
│       │   ├── audit/                # Cryptographic SHA-256 Merkle audit trail
│       │   ├── auth/                 # JWT, session store, Parichay SSO, emergency kill switch
│       │   ├── citizen/              # Landowner self-service, claim lookup, e-KYC
│       │   ├── common/               # DPDP AES-256-GCM crypto, guards, interceptors, filters
│       │   ├── compensation/         # RFCTLARR Sec 26-30 award engine + PFMS DBT batches
│       │   ├── documents/            # Document management, SHA-256 hashes, approval workflow
│       │   ├── field/                # Surveyor tasks, offline sync, GPS demarcation
│       │   ├── gati-shakti/          # BISAG-N NMP layers, corridor screener, NOC management
│       │   ├── gazette/              # Section 11/19 bilingual notice builder, digital signing
│       │   ├── gis/                  # PostGIS corridor buffer, spatial query engine
│       │   ├── grievances/           # Public grievance registration & hearing scheduler
│       │   ├── integrations/         # External system connectors & outbox processor
│       │   ├── litigation/           # High Court / Revenue Court dispute tracking
│       │   ├── notifications/        # In-app notifications & email/SMS outbox
│       │   ├── parcels/              # Authoritative cadastral parcels, ULPIN registry
│       │   ├── possession/           # Section 38 possession memo, panchnama & witness records
│       │   ├── projects/             # Linear infrastructure corridor projects & alignments
│       │   ├── reports/              # PDF/CSV report generation & export services
│       │   ├── rr/                   # Resettlement & Rehabilitation Schedule II benefits
│       │   ├── simulation/           # What-If policy scenarios & impact simulations
│       │   ├── users/                # Enterprise user directory, roles & jurisdictions
│       │   └── workflow/             # 12-stage statutory state machine engine
│       ├── prisma/
│       │   └── schema.prisma         # Prisma Schema mapping all 66 relational models
│       ├── scripts/
│       │   ├── seed-postgresql.cjs   # Enterprise idempotent database seeder with PostGIS data
│       │   ├── seed_encrypted_pii.cjs # Encrypted PII test data seeder
│       │   ├── update_gazette_schema.cjs # Gazette schema migration script
│       │   └── verify_pii_and_revocation.cjs # DPDP crypto & kill-switch test runner
│       └── package.json
├── Frontend/                         # Next.js 14 App Router Web Application
│   ├── app/                          # 34 distinct application routes & layouts
│   ├── components/                   # UI components, GIS map renderers, AI widgets
│   ├── hooks/                        # React Query data-fetching hooks & custom hooks
│   ├── lib/                          # API clients, DPDP data formatters, GeoJSON utilities
│   ├── types/                        # TypeScript type definitions & domain interfaces
│   ├── styles/                       # Design tokens & CSS custom properties
│   ├── public/                       # National emblems, static GIS assets, PWA icons
│   ├── tests/                        # Playwright E2E, accessibility, visual & responsive tests
│   └── package.json
├── Database/
│   ├── bhoomiSetu_postgresql.sql     # Canonical PostgreSQL DDL with PostGIS geometries
│   ├── normalize-postgresql-schema.ps1 # Schema normalization utility
│   └── README.md                     # Database architectural overview & spatial indexes
├── scripts/
│   ├── build-all.js                  # Unified monorepo build runner
│   ├── start-dev.js                  # Concurrent dev server with automated port management
│   ├── start-public-demo.js          # Unified tunnel launcher with reverse proxy
│   └── free-ports.js                 # Cross-platform socket and port cleanup utility
├── .env.example                      # Root environment template
├── package.json                      # Unified root monorepo scripts
└── README.md                         # Complete project documentation (this file)
```

---

## ⚙️ Environment Configuration Reference

### 1. Backend (`Backend/api/.env`)

```ini
# Server Network Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# PostgreSQL / PostGIS Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aarohanDb?schema=public"

# JWT Authentication & Session Settings
JWT_SECRET="aarohan_setu_jwt_secret_dev_key_2026_change_in_production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# DPDP Act 2023 - 32-Byte Secret Key for Authenticated AES-256-GCM Encryption
ENCRYPTION_KEY="aarohan-enterprise-pii-secret-key-32bytes"

# Parichay National Single Sign-On (SSO) Gateway
PARICHAY_LIVE="false"
PARICHAY_AUTH_URL="https://servicedemo.nic.in/pnv1/api/oauth/authorize"
PARICHAY_CLIENT_ID="aarohan-client-01"
PARICHAY_CLIENT_SECRET="your_parichay_client_secret_here"
PARICHAY_CALLBACK_URL="http://localhost:3001/v1/auth/parichay/callback"
PARICHAY_TOKEN_URL="https://servicedemo.nic.in/pnv1/api/oauth/token"
PARICHAY_USERINFO_URL="https://servicedemo.nic.in/pnv1/api/oauth/userinfo"

# National Integration Gateways (Mocked or Staging)
PFMS_API_URL="https://mock-pfms-gateway.gov.in/api/v1"
PFMS_API_KEY="mock_key"
ULPIN_REGISTRY_URL="https://mock-ulpin-registry.gov.in/api/v1"

# Uploads & Storage Configuration
UPLOAD_STORAGE_PATH="./uploads"

# Statutory Compensation Tax Settings (Section 10(37) overrides for agricultural)
COMPENSATION_TAX_RATE=30
```

### 2. Frontend (`Frontend/.env.local`)

```ini
# Base API URL pointing to the NestJS Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/v1

# In Public tunnel mode, this is dynamically overridden to point to the secure tunnel origin
```

---

## 🚀 Complete Step-by-Step Reproduction & Deployment Guide

Follow this guide to spin up a completely fresh, functional instance of Aarohan on any Windows, macOS, or Linux workstation:

### Step 1: System Prerequisites
Ensure the following runtimes are installed:
- **Node.js**: v18.18+ or v20.x ([Download](https://nodejs.org/))
- **PostgreSQL**: v14, v15, or v16 ([Download](https://www.postgresql.org/download/))
- **PostGIS Extension**: Installed with PostgreSQL via Stack Builder or package manager (`postgresql-16-postgis-3`).
- **Git**: Installed and available in terminal `PATH`.

### Step 2: Clone & Install Workspace Dependencies
Open PowerShell or Terminal:
```bash
# Clone the repository
git clone https://github.com/Abhishek2846/Aarohan-.git
cd Aarohan-

# Install root dependencies
npm install

# Install Frontend dependencies
npm --prefix Frontend install

# Install Backend dependencies
npm --prefix Backend/api install
```

### Step 3: Database Creation & PostGIS Setup
Log into PostgreSQL via `psql` or pgAdmin and run:
```sql
CREATE DATABASE "aarohanDb";
\c "aarohanDb";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 4: Schema Migration
Execute the canonical DDL to create all 66 tables, indexes, and PostGIS geometries:
```bash
# On Windows (PowerShell):
Get-Content Database/bhoomiSetu_postgresql.sql | psql -U postgres -d aarohanDb

# On Linux / macOS:
psql -U postgres -d aarohanDb -f Database/bhoomiSetu_postgresql.sql
```

### Step 5: Environment Files Setup
```bash
# On Windows:
copy .env.example .env
copy Backend\api\.env.example Backend\api\.env
copy Frontend\.env.example Frontend\.env.local

# On Linux / macOS:
cp .env.example .env
cp Backend/api/.env.example Backend/api/.env
cp Frontend/.env.example Frontend/.env.local
```
*(Verify `DATABASE_URL` in `Backend/api/.env` matches your PostgreSQL username and password).*

### Step 6: Generate Prisma Client & Seed Database
```bash
# 1. Generate Prisma Client
npm --prefix Backend/api run build

# 2. Execute the idempotent database seeder (seeds users, corridors, parcels, GatiShakti layers)
npm --prefix Backend/api run db:seed
```

### Step 7: Launch Application
Run the single-command unified launcher:
```bash
npm run dev
```

**What happens automatically:**
1. Background scripts safely clear any leftover processes on ports `3000` and `3001`.
2. NestJS Backend starts on `http://localhost:3001/v1` (Swagger docs available at `http://localhost:3001/api/docs`).
3. Next.js Frontend starts on `http://localhost:3000`.
4. Shareable local Wi-Fi links are written to `PUBLIC_URL.txt`.
5. Your default browser automatically launches directly into the Aarohan login screen.

---

## 🧪 Automated Verification & Test Suites

The codebase includes end-to-end automated verification scripts and comprehensive test suites:

### 1. DPDP PII Encryption & Session Kill Switch Verification
Runs automated tests verifying AES-256-GCM encryption, name/Aadhaar/PAN masking, and instantaneous JWT session invalidation:
```bash
node Backend/api/scripts/verify_pii_and_revocation.cjs
```
*Expected Output: `✅ ALL 7 SECURITY & COMPLIANCE TESTS PASSED SUCCESSFULLY!`*

### 2. Playwright E2E Test Suites
Comprehensive browser-based test suites covering multiple dimensions:
```bash
# Run all E2E tests
npm --prefix Frontend run test:e2e

# Visual regression tests
npm --prefix Frontend run test:visual

# Accessibility (a11y) tests
npm --prefix Frontend run test:a11y

# Responsive layout tests
npm --prefix Frontend run test:responsive

# Interactive test UI
npm --prefix Frontend run test:e2e:ui

# View HTML test report
npm --prefix Frontend run test:report
```

### 3. Full Monorepo Production Build Verification
Verifies TypeScript compilation, Next.js page generation, and asset bundling across both services:
```bash
npm run build
```

---

## 🌐 Public Cloud & Tunnel Architecture

Aarohan includes a public tunnel launcher enabling remote evaluators, field workers, and team members to access the live local instance over an encrypted HTTPS connection without port forwarding:

```bash
npm run public
```

### Architecture Guarantees:
- **Zero CORS Issues:** Next.js acts as an internal reverse proxy for `/v1/*` paths, routing API calls directly to the local NestJS backend under the same origin.
- **Cookie & Session Preservation:** SameSite HTTP cookies function properly across remote browsers.
- **Database Isolation:** PostgreSQL (port 5432) remains completely private on localhost and is never exposed to the public internet.

---

## 📄 License & Intellectual Property

**SIH 2026 National Prototype — Team Stack_Smashers**  
Developed for the **Ministry of Electronics and Information Technology (MeitY)** and **Ministry of Rural Development (MoRD)**, Government of India.  
Unlicensed. All rights reserved for national deployment evaluation.
