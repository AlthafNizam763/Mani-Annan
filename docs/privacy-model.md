# Privacy Model & Data Governance — Project Echo

## 1. Principles
- **Owner Sovereignty**: The user owns all data. Nothing is retained without explicit consent.
- **Separation of Concerns**: Only owner messages teach the style profile. Counterparty messages are discarded or strictly utilized as ephemeral conversational context for reply generation.
- **Minimization**: We do not send full chat histories to the LLM. We only send a curated, small set of authorized examples matching the relationship domain.
- **Zero-Trust AI**: LLM outputs do not auto-send by default. Auto-send requires explicit multi-layer approvals, deterministic safety verification, and clear opt-in.
- **Ephemeral & Exportable**: Complete GDPR/PDPA data export (`POST /api/v1/privacy/export`) and cryptographically sound complete deletion (`DELETE /api/v1/me/data`).

## 2. Retention Policies
- Raw import text is processed synchronously or in memory, then stripped. Only derived style tokens and consented few-shot examples are preserved under `users/{uid}/examples`.
- Drafts can have user-configurable time-to-live (default 30 days).
- Audit events log rule checks, decision codes, and timestamps without storing raw private message bodies.

## 3. WhatsApp Integration Compliance
- No unofficial WhatsApp web hooks, Puppeteer instances, or reverse-engineered APIs.
- The MVP operates via OS-native clipboard copying, OS share sheet triggers, and verified draft actions.
