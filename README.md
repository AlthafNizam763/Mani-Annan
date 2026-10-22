# Mani-Annan — AI Personal Messaging Assistant

Mani-Annan is a production-minded personal AI messaging assistant that learns an owner's authentic communication style from authorized chat imports and owner corrections. It generates high-fidelity, relationship-tailored replies for contacts (e.g. romantic partner, manager, friend, family) while maintaining a strict deterministic safety perimeter and privacy controls.

---

## Key Features

1. **Owner-Isolated Style Profiling**: Analyzes authorized WhatsApp chat exports (`.txt`) and isolates outgoing messages from incoming messages. Extracts language mix, Manglish markers (e.g., *lah*, *machan*, *dey*), sentence structures, emoji habits, and punctuation styles.
2. **Relationship-Conditioned Engine**: Custom tone parameters and safety boundaries per contact (Romantic partner, Boss, Friend, Family, Custom).
3. **Pluggable LLM Provider**: Backend-isolated LLM layer with structured schema validation, rate-limiting, and error handling. Never exposes keys to clients.
4. **Deterministic Policy & Safety Engine**: Regex & semantic safety rules running completely outside the LLM to prevent hallucinations regarding commitments, money transfers, account passwords/OTPs, or emotional escalations.
5. **Human-in-the-Loop Studio**: Web (Next.js) & Mobile (Flutter) interfaces providing one-click copy, system sharing, review, feedback, and draft regeneration.
6. **Privacy & Data Sovereignty**: Granular data deletion (`DELETE /api/v1/me/data`) and full data export (`POST /api/v1/privacy/export`).

---

## Repository Structure

```
mani-annan/
├── apps/
│   ├── web/                     # Next.js 14 App Router, Tailwind CSS, Firebase Web SDK
│   └── mobile/                  # Flutter 3+ mobile client, Dart
├── services/
│   └── api/                     # Node.js + Express + TypeScript, Firebase Admin, Firestore
├── packages/
│   └── contracts/               # Shared TypeScript schemas, enums, Zod validation models
├── firebase/
│   ├── firestore.rules          # Strict security rules
│   ├── firestore.indexes.json   # Composite indexes
│   └── firebase.json            # Emulators definition
├── docs/                        # Architecture, API contracts, privacy & threat models
└── .env.example                 # Environment configuration template
```

---

## Getting Started

### 1. Prerequisites
- Node.js >= 18 (Node v24 tested)
- npm >= 9
- Flutter >= 3.x (Optional, for mobile app development)
- Java Runtime (for Firebase Local Emulator Suite)

### 2. Setup Monorepo
```bash
# Clone the repository and install root dependencies
npm install
```

### 3. Run Firebase Emulators
```bash
# In one terminal
npm run emulators
```

### 4. Start the Backend API
```bash
cd services/api
npm run dev
```

### 5. Start the Web App
```bash
cd apps/web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Manual End-to-End Testing

For step-by-step instructions with synthetic test conversations, tenant isolation audits, financial risk warnings, and data purge walkthroughs, see:
- [Manual Testing Guide](docs/manual-testing-guide.md)
