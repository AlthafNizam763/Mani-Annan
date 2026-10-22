# Threat Model & Deterministic Safety Analysis — Project Echo

## 1. Threat Vectors & Mitigations

| Threat | Impact | Mitigation in Project Echo |
|---|---|---|
| **Prompt Injection via Incoming Message** | Attacker injects system prompt overrides into incoming chat message | Incoming text is sanitized, bounded, and strictly wrapped as `"""untrusted_input"""` within the model prompt. Model instructions are structured with schema constraints. |
| **Hallucination of Commitments / Facts** | AI agrees to money transfers, promises presence, signs contracts | Deterministic safety filter flags commitments, promises, monetary amounts, and legal terms; routes to mandatory manual review. |
| **Leakage of PII / Sensitive Credentials** | User sends passwords, 2FA codes, bank details | Regex & token-based safety engine detects OTPs, credit cards, banking phrases, passwords; blocks auto-generation or forces explicit warning. |
| **Cross-User Data Leakage in Firestore** | Malicious actor queries other users' style profiles or drafts | Strict Firestore security rules (`request.auth.uid == uid`), backend enforces token UID from Firebase Admin SDK. |
| **Exposing LLM API Keys** | API key scrapers reverse-engineer client code | LLM API keys are exclusively handled in Node.js backend (`services/api`), never packaged in Web or Mobile apps. |
| **Account Takeover / Unofficial WhatsApp Ban** | Account gets banned by Meta for unauthorized automation | Zero scraping / reverse-engineered WhatsApp clients. Explicit use of Clipboard & OS Share Sheets. |

## 2. Deterministic Safety Checks
Before any reply draft is approved or marked safe:
1. **Financial Rule**: Detects currency symbols, bank names, "transfer", "pay", "send money".
2. **Credential Rule**: Detects OTP, password, PIN, token keywords.
3. **Emergency / Distress Rule**: Detects medical emergencies, self-harm signals, extreme emotional crisis.
4. **Factual Commitment Rule**: Detects "I promise", "I guarantee", "I will definitely pay", "Signing now".
5. **Quiet Hours Rule**: Enforces sender's timezone quiet hours.
6. **Fail-Closed**: Any unhandled error in the policy engine defaults to `requiresManualReview: true` and `isSafe: false`.
