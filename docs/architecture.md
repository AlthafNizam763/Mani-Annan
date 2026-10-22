# Project Echo (Project Mani) — Implementation Plan & Architecture

## Overview
Project Echo is a production-minded personal AI messaging assistant that:
1. Authenticates users securely via Firebase Auth.
2. Imports user-authorized chat histories (WhatsApp exported .txt / JSON format).
3. Distinguishes owner outgoing messages vs incoming sender messages to compute a compact, privacy-safe writing style profile (Manglish, slang, emojis, sentence length, tone).
4. Configures contacts with relationship roles (Romantic partner, Boss, Friend, Family, Custom) and deterministic reply boundaries.
5. Generates high-fidelity contextual reply drafts via a backend-isolated LLM provider abstraction (supporting Gemini / OpenAI / mock providers).
6. Enforces a zero-trust deterministic safety & policy engine before any draft approval/export.
7. Supports editing, approval, rejection, copying, sharing (without unofficial WhatsApp automation).
8. Features a Next.js web application, Flutter mobile app, Node.js + TypeScript Express API, and shared TypeScript contracts.

---

## Architecture Breakdown

```
vayal/
├── apps/
│   ├── web/                     # Next.js (App Router, Tailwind CSS, Firebase Web SDK)
│   └── mobile/                  # Flutter application (Dart, Firebase Auth, API Client)
├── services/
│   └── api/                     # Node.js + Express + TypeScript, Firebase Admin, Firestore
├── packages/
│   └── contracts/               # Shared TypeScript schemas, enums, Zod validation models
├── firebase/
│   ├── firestore.rules          # Strict user-isolated Firestore security rules
│   ├── firestore.indexes.json   # Index definitions
│   └── firebase.json            # Emulators and configuration
├── docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── privacy-model.md
│   └── threat-model.md
├── .env.example
├── package.json                 # Monorepo root (npm workspaces)
└── README.md
```

---

## Phase Schedule & Execution

### Phase A: Foundation
- Monorepo setup with npm workspaces (`packages/contracts`, `services/api`, `apps/web`, `apps/mobile`).
- Shared contracts package: schemas, enums, types, Zod models.
- Firebase configuration: `firestore.rules`, `firestore.indexes.json`, `firebase.json`.
- Backend API foundation: Express app, Firebase Admin auth middleware, error handling, rate limiting.
- Unit/integration tests for authentication & security rules.

### Phase B: First Working Vertical Slice
- Authorized chat parser (WhatsApp chat export `.txt` parser with regex for owner vs contact messages).
- Style profile extraction engine (language habits, Manglish markers, punctuation, emoji frequency, greeting patterns).
- LLM Provider Abstraction (`LLMProvider` interface, Gemini provider, Mock provider for deterministic tests).
- Reply Generation pipeline (`POST /api/v1/replies/generate`).
- Next.js Web UI: Clean, minimal black-and-white theme, Reply Studio, Style Profile viewer, Chat Import uploader.

### Phase C: Relationship Policies & Deterministic Safety
- Contact management with relationship configuration (Partner, Boss, Friend, Family, Custom).
- Policy Engine: quiet hours, rate limits, sensitive topics (financial, legal, emotional conflict, passwords), fail-closed logic.
- Audit logging (`users/{uid}/auditEvents`).
- Draft review workflow with approve, reject, edit, copy, and OS share triggers.

### Phase D: Privacy & Compliance
- Data export (`POST /api/v1/privacy/export`) and complete deletion (`DELETE /api/v1/me/data`).
- Audit & security verification tests.

### Phase E: Mobile (Flutter)
- Flutter client matching the shared contracts: Auth, Contacts, Reply Studio, Draft review, Copy & OS Share.

### Phase F: Verification & Release
- End-to-end tests, evaluation dataset, deployment documentation.
