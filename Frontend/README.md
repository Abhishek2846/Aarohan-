# BhoomiSetu Frontend Application

Production-grade Next.js 14 web application for the **BhoomiSetu (भूमिसेतु)** Land Acquisition & AI Intelligence Platform.

---

## 🏛️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + CSS Variables for design system
- **Components**: Radix UI primitives + Lucide Icons + Custom GIS map renderers
- **Security**: Security headers, CSP policy, DPDP Act masked rendering, role-based route middleware
- **GIS / Mapping**: Leaflet / MapLibre with GeoJSON overlays, spatial buffer visualization, and project corridor screener

---

## 📁 Directory Structure

```
Frontend/
├── app/                  # Next.js 14 App Router routes and pages
│   ├── auth/             # Authentication pages (Login, Parichay SSO, Role selection)
│   ├── dashboard/        # Role-based command center dashboards
│   ├── acquisition/      # Statutory case workflow & RFCTLARR stage tracker
│   ├── compensation/     # Fair compensation calculator & PFMS disbursement
│   ├── map/              # Interactive GIS corridor & parcel map explorer
│   ├── ai-agent/         # Section 15 AI objection & assistant agent
│   └── verify/           # Gazette & public notification verification
├── components/           # Modular reusable UI components
│   ├── ui/               # Radix & Tailwind design system widgets
│   ├── map/              # GIS mapping viewports and GeoJSON layers
│   ├── forms/            # Statutory form inputs with client validation
│   └── layout/           # Navbar, sidebar, role-based header navigation
├── hooks/                # Custom React hooks (auth, geo, notifications)
├── lib/                  # Shared utilities, API client, security helpers
├── styles/               # Global Tailwind CSS and typography tokens
└── public/               # Static assets, PWA manifest, service workers
```

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env

# 3. Start development server
npm run dev
```

The application runs at `http://localhost:3000` and connects to the NestJS backend at `http://localhost:3001/v1`.
