# What We Built — Plain English Breakdown
*Read this before the demo tomorrow.*

---

## The Big Picture

You are showing Covenant University a **live, working system** that handles Data Subject Requests (DSRs).

A DSR is when someone says:
- "What data do you have on me?" *(Access)*
- "Delete all my data" *(Deletion)*
- "Update my address" *(Modification)*
- "Stop sending me marketing emails" *(Stop Processing)*

Under Nigerian law (NDPR) and GDPR, universities **must** respond to these requests. Right now, Covenant does it manually — emails, spreadsheets, delays. DataVerse automates the whole thing.

---

## What You Are Logging Into Tomorrow

There are **two separate websites:**

### 1. The Subject Portal
**URL:** `your-vercel-url.vercel.app`

This is what **students, staff, and alumni** use. No login required.
- They fill in a form: name, email, what they want
- They get a 6-digit OTP sent to their email in seconds
- They enter the code to confirm who they are
- The system processes their request automatically
- They get a confirmation email

**This is the GDPR best practice** — no account creation barrier. Just verify via email.

---

### 2. The Admin Dashboard
**URL:** `your-vercel-url.vercel.app/admin/login`

This is what **university staff** use to manage requests.

Three accounts with different access levels:

| Who | Email | Password | What they can do |
|---|---|---|---|
| DPO (your boss equivalent) | dpo@cu-demo.edu.ng | DPOsecure2024! | Everything — approve, reject, settings, all data |
| Registrar | registrar@cu-demo.edu.ng | Registrar2024! | Process requests — approve and reject |
| Legal Team | legal@cu-demo.edu.ng | Legal2024! | **Read-only** — only sees HIGH/CRITICAL cases. Cannot take action. |

---

## The 6 Demo Scenarios — What Happens in Each

### Scenario 1 — Access Request (James Adeleke)
**Email to use:** `student.james@demo.edu.ng`

1. Go to subject portal → fill in James's name and email → select "Access"
2. System sends OTP to your phone/email instantly
3. Enter OTP → **request completes in under 60 seconds**
4. Switch to admin dashboard → show the completed request + full audit trail

**What this proves:** Zero human involvement. Automated. NDPR-compliant.

---

### Scenario 2 — Deletion Request (Fatima Al-Hassan)
**Email to use:** `alumni.fatima@demo.edu.ng`

1. Submit deletion request → verify OTP
2. System deletes her record automatically
3. In admin dashboard → show the record is gone
4. Show the audit log entry: *"record_deleted — alumni.fatima@demo.edu.ng"*

**What this proves:** GDPR Article 17 (Right to Erasure) is fully automated and evidenced.

---

### Scenario 3 — Modification Request (Emmanuel Chukwu)
**Email to use:** `staff.chukwu@demo.edu.ng`

1. Submit modification request → type a new address in the form
2. Verify OTP → system updates the record
3. In admin dashboard → show the old address vs new address in the audit trail

**What this proves:** Data stays accurate. Every change is logged: who, what, when.

---

### Scenario 4 — Stop Processing (Adaeze Obi)
**Email to use:** `student.ada@demo.edu.ng`

1. Submit "Stop Processing" request → verify OTP
2. System tags her record: `opt_out`, `stop_marketing`
3. Show the tags in admin dashboard

**What this proves:** Marketing opt-out is automatic and permanent.

---

### Scenario 5 — HIGH Risk Escalation (Dr. Balogun)
**Email to use:** `lecturer.balogun@demo.edu.ng`

1. Submit access request → verify OTP
2. System **does NOT complete it automatically** — it escalates
3. In admin dashboard → see the escalation reason: *"Special category data detected (health information)"*
4. Risk tier shows **HIGH** in red
5. DPO clicks "Approve & Execute" → request completes
6. Subject gets completion email

**What this proves:** The system never auto-processes sensitive (health) data. A human must always review it. AI had zero involvement in this decision — it was the risk engine.

---

### Scenario 6 — CRITICAL Escalation (Kolade Fashola)
**Email to use:** `student.bulk@demo.edu.ng`

*(This account already has 3 prior requests pre-seeded — so it triggers CRITICAL immediately)*

1. Submit any request → verify OTP
2. System flags it as **CRITICAL**
3. Reason shown: *"Multiple recent requests from same identity — potential automated or coordinated attempt"*
4. Admin can reject with a reason

**What this proves:** The platform detects abuse patterns. It doesn't blindly execute repeated deletion requests.

---

## The 3 Extra Pages (for boss's questions)

### Settings Page
**How to get there:** Log in as DPO → click "Settings" in top nav

This page has 6 tabs — each one answers a concern:

| Tab | Boss concern it answers |
|---|---|
| **Data Retention** | "How long do you keep our data?" — shows a table: students 7 years, staff 10 years, etc. |
| **Encryption** | "Is our data encrypted?" — shows AES-256 at rest, TLS 1.3 in transit |
| **Data Ownership (DPA)** | "Who owns the data?" — shows the DPA reference, confirms DataVerse is processor not controller |
| **Hosting Flexibility** | "Can we move to AWS / on-premise?" — yes, shows all options |
| **DB Inspector** | "Show me what's actually stored" — shows real records with encrypted fields (red, unreadable blobs) |
| **Pseudonymised Logs** | "What if audit logs are leaked?" — shows emails replaced with SHA-256 hashes |

**Important:** Only the DPO account can see Settings. Log out and log in as Legal to show they can't.

---

### Integration Page
**How to get there:** Any admin → click "Integration" in top nav

Shows two things:
1. **The 4-function connector** — actual Python code showing how DataVerse talks to any university system (student portal, HR system, alumni DB). Clean, simple, 4 functions.
2. **The 4 integration tiers** — from direct database connection (modern) to CSV upload (legacy). Works with any system.

**What this proves:** DataVerse isn't locked to one vendor. It connects to whatever Covenant is already running.

---

## What Happens When Someone Asks "Is This Secure?"

Walk them through this:

1. **Authentication:** Students verify via OTP (email). Admins use password + session token. No data is accessible without verification.
2. **Encryption:** Open Settings → Encryption tab. Point to "AES-256 at rest, TLS 1.3 in transit."
3. **DB Inspector:** Open Settings → DB Inspector. Show the `phone__encrypted` and `address__encrypted` fields — they look like `gAAAAABf3c8a2...` — unreadable blobs. The actual data is never stored in plain text.
4. **Access control:** Log in as Legal. Show they can only see HIGH/CRITICAL cases and can't click approve or reject.

---

## What Happens When Someone Asks "What About Our Data After the Contract Ends?"

Point to Settings → Data Ownership (DPA) tab:
- DataVerse is the **processor**, Covenant is the **controller**
- DPA reference number is on screen
- Full data export available at any time
- DataVerse deletes its copy within 30 days of contract termination

---

## The Demo Order (Suggested)

1. **90 seconds context** — "Here's the NDPR compliance problem Covenant has. Here's what happens today without DataVerse. Here's what happens with it."
2. **Scenario 1** — Show the happy path. Fast. Impressive.
3. **Admin dashboard** — Scroll the queue. Show audit trail. Show risk tiers.
4. **Scenario 5** — The escalation. Human-in-the-loop story.
5. **Scenario 6** — CRITICAL. The platform protects against abuse.
6. **Settings page** — Walk the tabs. Answer every concern live.
7. **Integration page** — Show the connector code. "4 functions. That's it."
8. **Open floor** — "Anyone can try it now. Here are the test emails."

---

## If Something Goes Wrong During the Demo

| Problem | Fix |
|---|---|
| OTP not arriving | Check spam folder. Wait 30 seconds. Gmail occasionally delays. |
| "Email not found" error | Make sure you're using exactly the email in the list above |
| Admin login fails | Double-check the password — capital letters matter |
| Page not loading | Refresh. If still broken, open the local backup at `http://localhost:3000` |

---

## The One-Line Pitch

> *"DataVerse turns a 30-day manual compliance headache into a 60-second automated process — with a full audit trail, human oversight on sensitive cases, and evidence of NDPR compliance at every step."*

---

*Built for: Covenant University Demo — April 2026*
*DataVerse Solutions*
