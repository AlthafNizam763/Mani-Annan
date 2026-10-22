# WhatsApp Capability & Integration Assessment for Normal Personal Accounts

## 1. Executive Summary: The Personal Account Constraint

The owner's current setup is a **standard personal WhatsApp account**. The requirement is for **Mani to send automatic replies when Mani is toggled ON, even when the Mani web dashboard is closed**.

Meta's WhatsApp architecture and Terms of Service enforce a strict technical separation between **Personal WhatsApp Accounts**, **WhatsApp Business App Accounts**, and the **WhatsApp Business Platform (Cloud API)**.

There is **no official Meta cloud API that connects directly to a standard personal WhatsApp account** while leaving it as a personal mobile app. Bypassing this restriction via unofficial web socket scrapers or browser session hijacking (e.g. Baileys, whatsapp-web.js) is **explicitly prohibited** due to guaranteed permanent phone number bans and severe security risks.

Below is an objective evaluation of the three legitimate paths available, their capabilities, requirements, and limitations.

---

## 2. Technical Evaluation of Options

### Option 1: Official WhatsApp Business Platform (Cloud API)
* **How it Works**: A hosted server-to-server REST API provided directly by Meta. Inbound messages are pushed to Mani's backend via webhooks (`POST /api/v1/integrations/whatsapp/webhook`). The backend processes the message through Mani's deterministic safety and AI engine and posts the reply back via Meta's Graph API.
* **Auto-Reply when Dashboard is Closed**: **YES (100% cloud-based)**. The Node.js API runs 24/7 on the server.
* **Phone Online Requirement**: **NO**. The phone does not need to be turned on or connected to the internet.
* **Account Migration Requirement**:
  - The phone number **cannot remain registered on the standard personal WhatsApp mobile app**.
  - A phone number registered on WhatsApp Business Platform Cloud API must be deleted/deregistered from the mobile WhatsApp app and dedicated to the Cloud API.
  - *Recommendation*: Use a dedicated second phone number (virtual SIM or secondary business line) so the owner's personal WhatsApp account remains untouched.
* **Messaging Limits & Policies**:
  - **Customer Service Window**: Free-form replies can only be sent within **24 hours** of the user sending an inbound message.
  - Outside 24 hours, only pre-approved Meta Business Templates can be sent.
* **Cost**: Meta provides 1,000 free service conversations per month; subsequent conversations incur Meta utility/service conversation fees.

---

### Option 2: WhatsApp Business App Coexistence with Cloud API (Meta's New Onboarding Pilot)
* **How it Works**: Meta is progressively piloting features allowing select small business accounts using the WhatsApp Business mobile app to connect to Cloud API features.
* **Auto-Reply when Dashboard is Closed**: Partial/Restricted based on Meta regional eligibility.
* **Personal Account Feasibility**: **NOT SUPPORTED for personal accounts**. The account must at least be a registered WhatsApp Business profile, not a consumer WhatsApp profile.

---

### Option 3: Android Notification Listener & Auto-Reply Service (Device-Level Companion)
* **How it Works**: An Android background service (via Flutter/Android native `NotificationListenerService`) running on the owner's Android phone. When a personal WhatsApp notification arrives, the service intercepts it, calls Mani's backend API (`POST /api/v1/replies/generate`), and invokes the notification's `RemoteInput` "Quick Reply" action.
* **Personal Account Feasibility**: **YES**. Works with the standard, unmodified personal WhatsApp account.
* **Auto-Reply when Dashboard is Closed**: **YES**, but requires the **Android phone to be powered ON, connected to the internet, and running the background service**.
* **Limitations**:
  - If the phone battery dies or loses signal, auto-reply pauses.
  - Cannot read message history beyond what is presented in the incoming notification.
  - Not possible on iOS due to Apple's notification sandboxing restrictions.

---

### Option 4: Safe Human-in-the-Loop Workflow (Current Implemented Default)
* **How it Works**: One-click Copy to Clipboard and native OS Share Sheet.
* **Personal Account Feasibility**: **100% compatible** with all personal accounts on Web, iOS, and Android.
* **Account Risk**: **Zero ban risk**.

---

## 3. Recommended Architectural Decision

1. **Keep Normal Personal Account Untouched**: Never attempt unauthorized account conversions or scraper bots.
2. **Implement WhatsAppProvider Abstraction**:
   - `CloudApiProvider`: Official Meta WhatsApp Cloud API with webhook signature verification (SHA-256 HMAC), idempotency, and Graph API sending. (Reported as `BLOCKED_AWAITING_META_CREDENTIALS` until Meta App ID & Phone ID are configured).
   - `AndroidCompanionProvider`: Notification bridge contract for the Flutter client.
   - `ClipboardShareProvider`: Fully functional native workflow.
3. **UI Transparency**: Present the status of each provider clearly in the dashboard with zero simulated success or fake status toggles.
