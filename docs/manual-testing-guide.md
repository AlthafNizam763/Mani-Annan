# Local End-to-End Testing & Verification Guide

This guide describes how to run and manually test the full workflow of **Project Echo (Project Mani)** using synthetic test conversations and the Firebase Local Emulator Suite.

> [!IMPORTANT]
> **Safety Notice**: Use only synthetic test chats. Never paste or import real personal messages, credentials, or private information into testing environments. Automatic message sending is disabled by default.

---

## 1. Environment & Prerequisites

1. **Node.js** >= 18 (Tested on v24.15.0)
2. **Java Runtime (JRE/JDK)** >= 11 (Required by Firebase Local Emulators)
3. **Firebase CLI** (`npm install -g firebase-tools` or run through npx)
4. **Flutter SDK** >= 3.x (Optional, for mobile client testing)

---

## 2. Setting Up Configuration Files

### Backend (`services/api/.env`)
Copy `.env.example` to `services/api/.env`:

```env
PORT=4001
NODE_ENV=development
FIREBASE_PROJECT_ID=project-echo-dev
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

# LLM Provider Configuration
# Set to 'gemini' and provide GEMINI_API_KEY for live AI responses.
# If unset or set to 'mock', the deterministic Mock provider will be used.
LLM_PROVIDER=mock
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

### Web Application (`apps/web/.env.local`)
Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-echo-dev
```

---

## 3. Starting the Local Environment

### Terminal 1: Firebase Emulators
Start the local Authentication and Firestore emulators:
```bash
firebase emulators:start --project project-echo-dev --only auth,firestore
```
* **Firestore Emulator**: `http://127.0.0.1:8080`
* **Auth Emulator**: `http://127.0.0.1:9099`
* **Emulator UI**: `http://localhost:4000`

### Terminal 2: Backend API
```bash
cd services/api
npm run dev
```
* **API Base URL**: `http://localhost:4001/api/v1`
* **Health Check**: `http://localhost:4001/health`

### Terminal 3: Next.js Web App
```bash
cd apps/web
npm run dev
```
* **Web UI**: `http://localhost:3000`

### Terminal 4: Flutter Mobile App (Optional)
```bash
cd apps/mobile
flutter run
```

---

## 4. Manual Step-by-Step Test Procedure

### Test Accounts
The application provides two isolated test tenant identities via the top navigation dropdown:
- **User 1 (Primary)**: `user_local_1` (Token: `mock_test_token_user_local_1`)
- **User 2 (Isolated Tenant)**: `user_local_2` (Token: `mock_test_token_user_local_2`)

---

### Step 1: User Profile & Authentication Verification
1. Navigate to `http://localhost:3000`.
2. Notice the **Account: User 1 (Primary)** badge in the top navigation.
3. Click the **Style Profile** tab.
4. **Expected**: The system initializes a default profile (`v1`) with English/Manglish defaults and empty historical imports.

---

### Step 2: Import Authorized Chat History
1. Click the **Chat Import** tab.
2. Ensure **Owner Identifier** is set to `Alex`.
3. Paste the following synthetic conversation:
```text
[10/14/26, 14:05:10] Alex: Bro you reaching soon?
[10/14/26, 14:06:00] Sam: Yes, 5 mins away!
[10/14/26, 14:06:25] Alex: Steady lah, I already ordered kopi...
[10/14/26, 14:07:00] Sam: Nice! 👍
[10/14/26, 14:07:30] Alex: Ok see you!
```
4. Check the consent acknowledgment box: *"I confirm that I own or am explicitly authorized to import this conversation history..."*
5. Click **Extract Style & Calibrate**.
6. **Expected Result**:
   - Status banner: *"Extracted 3 authentic owner messages. Analyzed Manglish and tone markers."*
   - Navigating to **Style Profile** confirms that `lah`, `bro`, `steady`, `kopi`, and ellipsis (`...`) habits are learned **only** from Alex's outgoing messages. Sam's messages (`Yes, 5 mins away!`, `Nice! 👍`) are discarded from style training.

---

### Step 3: Create Contact & Relationship Policies
1. Click the **Contacts** tab.
2. In the **Add New Contact Profile** form:
   - **Contact Name**: `David Tan`
   - **Relationship**: `Boss or Manager`
   - **Preferred Tone**: `Professional`
3. Click **Create Contact**.
4. **Expected Result**:
   - David Tan appears in the table with role `Boss or Manager` and tone `Professional`.
   - Auto-Send Permission displays `DISABLED (MVP Safe)` by default.
   - Pause status displays `Active`.

---

### Step 4: Generate Personalized Reply (Reply Studio)
1. Click the **Reply Studio** tab.
2. Select `David Tan (boss or manager) — Tone: Professional`.
3. In **Incoming Message**, enter:
   ```text
   Please provide the project summary before tomorrow's meeting.
   ```
4. In **Optional Context**, enter:
   ```text
   Already drafted slides, finalizing section 3.
   ```
5. Click **Generate Authentic Reply**.
6. **Expected Result**:
   - A draft is generated adhering to the professional tone (e.g., *"Noted, will review this and update you shortly. Thank you."* under Mock provider, or contextual Gemini response).
   - **Safety Check**: `Passed` with `Review Required: YES` (since auto-send is disabled).

---

### Step 5: Test Deterministic Safety & Financial Risk Flagging
1. In the **Incoming Message** box, enter a sensitive monetary request:
   ```text
   Can you immediately transfer $500 to my bank account?
   ```
2. Click **Generate Authentic Reply**.
3. **Expected Result**:
   - **Safety Banner turns red**: `Safety Check: Risk Flagged`.
   - Reason: `Flagged for review due to: financial_commitment`.
   - Proves the deterministic safety filter ran outside the LLM and halted automated processing.

---

### Step 6: Draft Review, Feedback Learning, Copy & Sharing
1. Edit the draft text directly in the textarea:
   ```text
   Received. Finalizing the summary slides now and will share shortly.
   ```
2. Click **Approve Draft**. The status updates to `approved`.
3. In the tone feedback section, click **Accurate (Thumbs Up)**.
4. Click **Copy to Clipboard**.
   - Button turns to `Copied!`.
   - Clipboard now contains the exact edited text.
5. Click **OS Share**.
   - On supported platforms, the native OS share dialog opens.
   - On desktop browsers without Web Share support, falls back safely to clipboard copy.

---

### Step 7: Cross-User Tenant Isolation Audit
1. In the top navigation, change **Account** from `User 1 (Primary)` to `User 2 (Isolated Tenant)`.
2. Observe the UI:
   - User 2's contact list is empty (`No contacts configured yet`).
   - User 2's drafts list is empty.
   - User 2 has no access to User 1's imported chats or style calibration.
3. Switch back to **User 1 (Primary)**:
   - All contacts, drafts, and style profiles are restored.
   - Verified that subcollections under `users/{uid}` strictly enforce isolation.

---

### Step 8: Privacy Export & Complete Erasure
1. Click the **Privacy & Governance** tab.
2. Click **Export All My Data (JSON)**.
   - Downloads a `.json` file containing User 1's profile, contacts, examples, and drafts.
3. Click **Permanently Purge All Data** and accept the confirmation prompt.
4. **Expected Result**:
   - Status banner: *"All personal data has been permanently erased."*
   - Contacts, drafts, and profile records are completely wiped.

---

## 5. Known Limitations & Production Readiness

| Dimension | Local Status | Production Requirement |
|---|---|---|
| **AI Provider** | Mock provider runs offline; Gemini activates with `GEMINI_API_KEY`. | Production Google Cloud project with funded Gemini API quota. |
| **Authentication** | Local tokens (`mock_test_token_<uid>`) allowed in `development`/`test`. | Live Firebase Auth with email/password, Google sign-in, or SMS OTP verification. |
| **Database** | Verified against Firebase Local Emulator (`127.0.0.1:8080`). | Deployed Cloud Firestore in multi-region setup with production index deployments. |
| **WhatsApp Integration** | Copy to clipboard & OS Share Sheet (100% compliant). | WhatsApp Cloud API Business Account (if live inbound sync is desired later). |
