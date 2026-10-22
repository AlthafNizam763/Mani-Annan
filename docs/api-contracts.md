# API Contracts & Data Specification — Project Echo

## Base URL
`/api/v1`

All requests (except health check) require:
`Authorization: Bearer <FIREBASE_ID_TOKEN>`

---

## 1. User & Style

### `GET /api/v1/me`
Fetches current user profile and style profile overview.

**Response `200 OK`**:
```json
{
  "uid": "user_123",
  "email": "user@example.com",
  "displayName": "Alex",
  "createdAt": "2026-10-14T10:00:00.000Z",
  "styleProfile": {
    "version": 1,
    "primaryLanguages": ["en", "manglish"],
    "commonSlang": ["lah", "bro", "dey", "machan", "ok ok"],
    "avgSentenceLength": "short",
    "punctuationHabits": {
      "multipleExclamations": false,
      "usesEllipsis": true,
      "omitsEndingPeriod": true
    },
    "emojiHabits": {
      "frequentEmojis": ["👍", "🔥", "😂", "🙏"],
      "emojiFrequency": "moderate"
    },
    "greetingStyle": "informal",
    "closingStyle": "casual",
    "updatedAt": "2026-10-14T10:00:00.000Z"
  }
}
```

### `PUT /api/v1/me/style`
Updates the owner's personal writing style settings manually.

---

## 2. Authorized Chat Imports

### `POST /api/v1/imports`
Uploads and parses an authorized chat export (e.g., exported WhatsApp text).

**Request Body**:
```json
{
  "rawText": "[10/14/26, 09:15:00] Alex: Yo bro you free today?\n[10/14/26, 09:16:12] Sam: Free after 5pm\n[10/14/26, 09:17:00] Alex: Ok deal, see you at café lah",
  "ownerIdentifier": "Alex",
  "contactName": "Sam",
  "consentConfirmed": true
}
```

**Response `201 Created`**:
```json
{
  "importId": "imp_987",
  "status": "completed",
  "extractedOwnerMessagesCount": 2,
  "extractedContactMessagesCount": 1,
  "styleProfileUpdated": true,
  "summary": "Extracted 2 owner examples. Detected Manglish cues ('lah') and informal greeting."
}
```

### `GET /api/v1/imports`
Lists all imported datasets for the authenticated user.

### `DELETE /api/v1/imports/:importId`
Deletes an import and its derived example records.

---

## 3. Contacts & Relationships

### `GET /api/v1/contacts`
Lists all configured contacts.

### `POST /api/v1/contacts`
Creates a contact and assigns relationship boundaries.

**Request Body**:
```json
{
  "name": "Sam",
  "phoneNumber": "+60123456789",
  "relationship": "friend",
  "preferredTone": "casual",
  "allowedCategories": ["general_chat", "plans", "work_inquiry"],
  "autoSendEnabled": false,
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00",
    "timezone": "Asia/Kuala_Lumpur"
  },
  "sensitiveTopicsRequireReview": true,
  "isPaused": false
}
```

### `PATCH /api/v1/contacts/:contactId`
Updates relationship settings or toggles contact pause state.

---

## 4. Reply Generation & Draft Studio

### `POST /api/v1/replies/generate`
Generates a context-conditioned reply draft.

**Request Body**:
```json
{
  "contactId": "cnt_456",
  "incomingMessage": "Bro, are we still meeting today at the cafe?",
  "optionalContext": "I might be 15 mins late due to traffic"
}
```

**Response `201 Created`**:
```json
{
  "draftId": "dft_111",
  "contactId": "cnt_456",
  "contactName": "Sam",
  "relationship": "friend",
  "incomingMessage": "Bro, are we still meeting today at the cafe?",
  "generatedReply": "Yeah bro on for today! Might be like 15 mins late though, jam lah 🙏",
  "safetyCheck": {
    "isSafe": true,
    "requiresManualReview": false,
    "riskFlags": [],
    "reason": "Passed all safety policies."
  },
  "reviewStatus": "pending",
  "createdAt": "2026-10-14T10:05:00.000Z"
}
```

### `GET /api/v1/drafts`
Fetches active and past drafts.

### `PATCH /api/v1/drafts/:draftId`
Reviews or edits a draft (`approved`, `rejected`, `edited`).

### `POST /api/v1/drafts/:draftId/feedback`
Submits owner corrections to improve the style engine.

---

## 5. Privacy, Export & Deletion

### `POST /api/v1/privacy/export`
Exports all user data into a portable JSON package.

### `DELETE /api/v1/me/data`
Completely purges all user data: style profiles, contacts, imports, examples, drafts, and audit logs.
