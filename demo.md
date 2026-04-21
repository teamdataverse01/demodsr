# DataVerse DSR — Full Covenant University Demo Plan

> **Goal:** A live, end-to-end demonstration that proves the platform can handle a large
> university's DSR obligations at scale. Every scenario should feel real. Every question
> a stakeholder could ask should have a live answer — not a slide.

---

## 1. What We Are Building for the Demo

### Mock University: "Covenant University (Demo)"

A realistic mock dataset that mirrors what the actual onboarding would look like:

| Entity | Volume | Notes |
|---|---|---|
| Students (current) | 200 mock records | Various faculties, years, courses |
| Staff | 30 mock records | Admin, HR, IT, Finance departments |
| Faculty / Lecturers | 20 mock records | Academic staff with research data |
| Alumni | 50 mock records | Former students with ongoing engagement |

Each record contains name, email, phone, department/course, registration number, address,
enrolment/employment date, and relevant tags (e.g. `enrolled`, `alumni`, `staff`).

---

## 2. Mock Accounts to Create

Everyone present (or trying the demo independently) should be able to log in and explore.

### Admin / DPO Accounts

| Account | Role | Login |
|---|---|---|
| `dpo@cu-demo.edu.ng` | Superadmin | Full system access |
| `registrar@cu-demo.edu.ng` | Admin | Processes requests, views queue |
| `legal@cu-demo.edu.ng` | Admin | Reviews high-risk escalations |

### Subject Accounts (pre-registered in mock DB so OTP flow works)

These email addresses exist in the mock database. Anyone can use them to submit a DSR request
and see the full citizen-facing journey:

| Mock Subject | Role | Scenario |
|---|---|---|
| `student.james@demo.edu.ng` | 3rd year student | Access request |
| `alumni.fatima@demo.edu.ng` | 2019 alumna | Deletion request |
| `staff.chukwu@demo.edu.ng` | HR staff member | Modification request |
| `student.ada@demo.edu.ng` | Final year student | Stop processing request |
| `lecturer.balogun@demo.edu.ng` | Senior lecturer | High-risk escalation scenario |
| `student.bulk@demo.edu.ng` | Student with 3 prior requests | Triggers CRITICAL escalation |

---

## 3. Demo Scenarios — Full Scripts

### Scenario 1 — Standard Access Request (Automated, LOW risk)

**Who:** `student.james@demo.edu.ng`
**Request:** Access — "What data does the university hold on me?"
**Expected outcome:** Automated. Completed within 60 seconds.

**Steps to demonstrate:**
1. Open the subject portal (`/request/new`)
2. Enter name, email, select **Access**
3. Show the OTP arriving (or appearing on-screen in dev mode)
4. Verify — watch the dashboard update in real time
5. Show the confirmation email received by the subject
6. Switch to admin panel — show the completed request, full audit trail, data retrieved
7. **Point to make:** Zero human involvement required. Completed in under 60 seconds.

---

### Scenario 2 — Deletion Request (Automated, MEDIUM risk)

**Who:** `alumni.fatima@demo.edu.ng`
**Request:** Deletion — "Remove all my personal data from your systems"
**Expected outcome:** Automated with audit flag. Record deleted from mock DB, confirmation sent.

**Steps to demonstrate:**
1. Submit deletion request on subject portal
2. OTP verify
3. Watch system execute deletion — highlight the audit log entry showing what was deleted
4. Show confirmation email to subject
5. Attempt to find the record in the mock DB — it is gone
6. **Point to make:** GDPR Article 17 — right to erasure — fully automated and evidenced.
7. **Boss's concern addressed:** Data minimisation — the platform does not store the deleted data,
   only the deletion confirmation and timestamp.

---

### Scenario 3 — Modification Request (Automated, LOW risk)

**Who:** `staff.chukwu@demo.edu.ng`
**Request:** Modification — "Update my home address to the new one"
**Expected outcome:** Automated update. Record changed in mock DB. Confirmation sent.

**Steps to demonstrate:**
1. Submit modification with new address details
2. OTP verify
3. Open mock DB / admin view — show old address vs new address
4. Show full audit trail (who changed what, when)
5. **Boss's concern addressed:** Authentication — staff member verified purely via OTP to their
   registered email. No account creation barrier.

---

### Scenario 4 — Stop Processing / Marketing Opt-Out (Automated, LOW risk)

**Who:** `student.ada@demo.edu.ng`
**Request:** Stop Processing — "Stop sending me alumni marketing emails"
**Expected outcome:** Contact tagged `opt-out-marketing` in mock DB. Removed from campaign lists.

**Steps to demonstrate:**
1. Submit stop processing request
2. OTP verify — show it completing instantly
3. Open the mock DB record — show the `opt_out` and `stop_marketing` tags applied
4. **Boss's concern addressed:** Integration pattern — the same connector handles tagging,
   removal from campaigns, and flagging without touching any other system.

---

### Scenario 5 — HIGH Risk Escalation (Human Review Required)

**Who:** `lecturer.balogun@demo.edu.ng`
**Request:** Access — but this record contains special category data (health information flag)
**Expected outcome:** ESCALATED. Cannot proceed without admin approval.

**Steps to demonstrate:**
1. Submit access request
2. OTP verify — watch the system escalate instead of auto-completing
3. Switch to admin panel — show the escalation in the queue
4. Show the escalation reason displayed to the admin: "Special category data detected"
5. Show the admin risk tier display: HIGH
6. Approve the request — watch it execute
7. **Boss's concern addressed:** Human oversight — the system never auto-executes on special
   category data. A human must review and click approve.
8. **Boss's concern addressed (AI):** AI had zero involvement in this escalation decision.
   It was the deterministic risk engine.

---

### Scenario 6 — CRITICAL Escalation (Flags Suspicious Pattern)

**Who:** `student.bulk@demo.edu.ng` (has 3 prior requests in the last 7 days)
**Request:** Deletion request (another one)
**Expected outcome:** CRITICAL escalation. Admin notified immediately.

**Steps to demonstrate:**
1. Submit the deletion request
2. Show it hitting CRITICAL in the admin queue with the reason: "Multiple recent requests from
   same identity — potential automated or coordinated attempt"
3. Show the admin notification
4. Show Reject with reason option
5. **Boss's concern addressed:** The system does not blindly execute repeated deletion requests.
   It detects the pattern and flags it.

---

## 4. UI/UX Walkthrough Points

For each screen, narrate what the user is experiencing and why it was designed that way.

### Subject Portal
- Clean, accessible form — no account creation required (GDPR best practice)
- Only asks for what is needed: name, email, request type, brief description
- OTP screen — explain why this is the right level of identity verification for this context
- Status page — show the real-time status updates so the subject is not left in the dark

### Admin Dashboard
- Request queue — priority sorted, shows risk tier at a glance
- Request detail — full context, what data was found, why it was escalated, what AI drafted (if enabled)
- Audit trail — scrollable timeline at the bottom of every request
- One-click actions — Advance, Approve, Reject, Request Info
- **Emphasise:** Every action the admin takes is logged with timestamp and user ID

---

## 5. Addressing Every Boss Concern — Live During Demo

Map each concern to the exact moment in the demo where it is answered:

| Concern | Answered In |
|---|---|
| Data minimisation | Scenario 2 (deletion) — show only allowed fields retrieved |
| Data retention | Admin panel → system settings → show retention config |
| Authentication | Scenario 3 — OTP for subjects; show JWT admin login |
| Human oversight | Scenario 5 — HIGH risk escalation |
| AI boundaries | Scenario 5 — show AI draft box (suggest only, admin edits/rejects) |
| Integration pattern | Scenario 4 — show connector code (4 functions, clean interface) |
| Hosting flexibility | Infrastructure slide / ARCHITECTURE.md section 7 |
| Data storage | Open DB inspector — show exactly what is and is not stored |
| Encryption | Show Fernet-encrypted package in DB (unreadable blob) |
| Access control | Log in as each of the 3 admin roles — show what each can/cannot see |
| Integration methods | Walkthrough of connector pattern and the 4 integration tiers |
| Data ownership | DPA reference — DataVerse is processor, university is controller |
| Cross-device | Open subject portal on phone during demo |
| Log pseudonymization | Show raw audit log → explain the anonymization job |
| Retention enforcement | Show Celery task config — nightly job, not a cron on the server |

---

## 6. What You Need for the Demo — Infrastructure Guide

### Frontend (Subject Portal + Admin Dashboard)

**Vercel — Free tier is fine.**
- No cold starts for static/SSR frontend
- Custom domain available on free tier
- Deploy: `vercel --prod` from `/frontend`
- Nothing to pay here

---

### Backend (FastAPI API)

**Railway — Upgrade to Pro ($20/month) for the demo.**

Why not free:
- Free tier containers sleep after inactivity — if the demo starts and the API is cold,
  there will be a 30-60 second delay on the first request. That will kill the energy in
  the room.
- Free tier has 500MB RAM limit — tight when running API + Celery worker together
- Free tier has no persistent volume guarantee

Pro tier gives you:
- Always-on containers (no sleeping)
- 8GB RAM ceiling
- Reliable uptime SLA
- $20 is worth it for a Covenant-sized client opportunity

---

### Database (PostgreSQL)

**Railway PostgreSQL — Free add-on is sufficient for demo data.**
- 1GB storage — more than enough for 300 mock records
- Persistent across deploys
- No additional cost on Railway Pro plan

---

### Background Workers (Celery + Redis)

**For the demo: skip Redis and run Celery tasks inline.**
- The `SETUP.md` already documents this as a valid dev mode
- Simplifies the deployment — one less service to manage
- Only add Redis/Celery as a separate Railway service if you want to demo the nightly
  retention job running live (optional)

---

### Email (OTP Delivery)

**Resend — Free tier (100 emails/day).**
- More than enough for a demo
- OTPs are the only emails being sent
- Sign up at resend.com, get the API key, paste into Railway env vars

---

### AI Draft Generation (Optional)

**Anthropic API — Pay-as-you-go.**
- Only needed if you want to show the AI draft feature
- A single demo will cost pennies
- Add `ANTHROPIC_API_KEY` to Railway env vars — the feature activates automatically

---

### Do You Need AWS?

**No — not for the demo.**

AWS is the right answer for production (RDS, ECS/EKS, CloudFront, WAF). For this demo,
Railway + Vercel is cleaner, faster to set up, and equally impressive to a non-technical
stakeholder. The architecture.md already documents AWS as the production hosting model —
mention it when asked about production, but do not over-engineer the demo environment.

---

### Summary — What to Buy / Set Up

| Service | Tier | Cost | Action |
|---|---|---|---|
| Vercel | Free | £0 | Deploy frontend now |
| Railway | Pro | $20/month | Upgrade before demo |
| Railway PostgreSQL | Free add-on | £0 | Add to Railway project |
| Resend | Free | £0 | Sign up, grab API key |
| Anthropic API | Pay-as-you-go | ~£0.01 for demo | Optional — only for AI draft |
| AWS / GCP / Azure | — | £0 | Not needed for demo |

**Total demo infrastructure cost: ~$20 for the month.**

---

## 7. Demo Environment Setup Checklist

- [ ] Railway Pro plan activated
- [ ] Backend deployed to Railway with all env vars set
- [ ] Frontend deployed to Vercel and pointing at Railway backend URL
- [ ] PostgreSQL database running on Railway
- [ ] Mock university database seeded (seed script ready)
- [ ] All 6 subject email accounts seeded and verified in mock DB
- [ ] All 3 admin accounts created and tested
- [ ] Resend API key set and OTP emails tested end-to-end
- [ ] All 6 demo scenarios rehearsed at least once
- [ ] Admin dashboard open on laptop screen
- [ ] Subject portal open on phone (for cross-device demonstration)
- [ ] ARCHITECTURE.md open as reference for stakeholder questions
- [ ] Backup: local Docker environment running as failsafe

---

## 8. Demo Flow — Suggested Order

1. **90 seconds — context** ("Here is the problem Covenant needs to solve")
2. **Subject journey — Scenario 1** (the happy path, automated, fast)
3. **Admin dashboard walkthrough** (show the queue, the audit trail, the tools)
4. **Scenario 5 — escalation** (the human-in-the-loop story)
5. **Scenario 6 — CRITICAL** (the platform protecting against abuse)
6. **Address the concerns** (walk the table from Section 5 — point, click, prove)
7. **Infrastructure slide** (brief — production is AWS, demo is Railway, same code)
8. **Open floor** — anyone can try it live using the mock accounts

---

*Demo version: 1.0 | Prepared: April 2026*
*DataVerse Solutions — Covenant University Readiness Demo*
