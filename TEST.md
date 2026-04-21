# DataVerse Demo — Full Test Plan (Personal Testing)
**Your emails only. Do this before the demo.**

Gmail 1 = salaudeenmubarakstar@gmail.com  
Gmail 2 = mubaraksalaudeen123456@gmail.com

---

## PART 1 — SUBJECT PORTAL

### TEST 1 — Access Request → LOW → Auto-completed + Data Email

1. Go to Vercel URL → **Start My Request**
2. Name: `James Adeleke` · Email: Gmail 1 · Type: `Access`
3. Submit → check Gmail 1 for OTP → enter code → Verify
4. ✅ Screen: "Request Completed" · Badge: **LOW**
5. ✅ Email in Gmail 1: should show actual data — name, student ID, department, CGPA note, special category status

---

### TEST 2 — Deletion Request → MEDIUM → Auto-completed + Confirmation Email

1. Go to Vercel URL → **Start My Request**
2. Name: `Fatima Al-Hassan` · Email: Gmail 2 · Type: `Deletion`
3. Submit → Gmail 2 OTP → Verify
4. ✅ Screen: "Request Completed" · Badge: **MEDIUM**
5. ✅ Email in Gmail 2: confirms data removed + retention caveat

---

### TEST 3 — Modification Request → LOW → Auto-completed + Change Confirmation

1. Go to Vercel URL → **Start My Request**
2. Name: `James Adeleke` · Email: Gmail 1 · Type: `Modification`
3. Modification fields appear → New Address: `12 Canaan Land, Ota` · Phone: leave blank
4. Submit → Gmail 1 OTP → Verify
5. ✅ Screen: "Request Completed" · Badge: **LOW**
6. ✅ Email in Gmail 1: lists exactly which fields were updated

---

### TEST 4 — Stop Processing → LOW → Auto-completed

1. Go to Vercel URL → **Start My Request**
2. Name: `Fatima Al-Hassan` · Email: Gmail 2 · Type: `Stop Processing`
3. Submit → Gmail 2 OTP → Verify
4. ✅ Screen: "Request Completed" · Badge: **LOW**
5. ✅ Email in Gmail 2: confirms opt-out applied immediately

---

### TEST 5 — CRITICAL Escalation (3rd request from same email)

> James now has 2 requests in system (Tests 1 + 3). Third triggers CRITICAL.

1. Go to Vercel URL → **Start My Request**
2. Name: `James Adeleke` · Email: Gmail 1 · Type: `Access` · Description: `Urgent third request`
3. Submit → Gmail 1 OTP → Verify
4. ✅ Screen: **"Request Under Review"** (orange) · Badge: **CRITICAL**
5. Note the Request ID — approve it in Part 2.

---

## PART 2 — ADMIN DASHBOARD

Go to `/admin/login`

---

### TEST 6 — DPO Login: Sees All + Full Subject Profile

1. Login: `dpo@cu-demo.edu.ng` / `DPOsecure2024!`
2. ✅ Dashboard shows ALL requests including LOW/MEDIUM ones
3. Click into any request → Subject Profile section
4. ✅ Sees: CGPA, phone, address, medical notes (if any), ALL flags
5. ✅ Visible fields label shows: **"all fields (full DPO access)"**

---

### TEST 7 — Approve the CRITICAL Request

1. Find James Adeleke's CRITICAL escalated request
2. Click it → check escalation reason: "3 requests in 7 days"
3. AI draft may be pre-loaded in notes box — edit or keep
4. Click **Approve & Complete**
5. ✅ Dashboard: status → **completed**

---

### TEST 8 — Pre-seeded Escalations (no OTP needed — already in system)

From dashboard, look for these 3 requests:

| Subject | Type | Risk | Reason to check |
|---|---|---|---|
| Taiwo Ogundimu | Deletion | HIGH | Expelled student — disciplinary records retained |
| Sade Martins | Access | CRITICAL | Active legal hold — data frozen |
| Chukwudi Obi | Deletion | HIGH | Outstanding fees — financial records blocked |

1. Click each one
2. ✅ Escalation reason displayed clearly explains WHY it was blocked
3. ✅ Subject profile shows the relevant flags (academic_status: EXPELLED, has_legal_hold: true, outstanding_balance: true)
4. Try rejecting Taiwo's request with note: `Disciplinary records retained per CU Policy DS-2024-04. DPO review required.`

---

### TEST 9 — Registrar Login: Sees Academic Data, NOT Medical Notes

1. Logout → Login: `registrar@cu-demo.edu.ng` / `Registrar2024!`
2. Open Dr. Rotimi Balogun's request (HIGH escalation)
3. ✅ Can see: CGPA, phone, address, department, academic status
4. ✅ CANNOT see: medical notes section is absent
5. ✅ Visible fields label shows: **"all fields except medical notes"**

---

### TEST 10 — Legal Login: Filtered Requests + Restricted Profile

1. Logout → Login: `legal@cu-demo.edu.ng` / `Legal2024!`
2. ✅ Dashboard: only HIGH and CRITICAL requests visible — LOW/MEDIUM hidden
3. Open Sade Martins' CRITICAL request
4. ✅ Subject profile shows ONLY: name, email, department, academic status, legal hold flag, special category flag
5. ✅ CANNOT see: CGPA, phone, address, medical notes, financial flags
6. ✅ Visible fields label shows: **"name, email, department, role, academic_status, legal hold status, special category flag"**
7. ✅ No Approve or Reject buttons — read-only confirmed

---

## PART 3 — SETTINGS PAGE

Login as DPO → click **Settings**

### TEST 11 — Retention & Encryption Tab
- ✅ Policy table loads with categories, periods, legal basis
- ✅ Encryption: AES-256, TLS 1.3, key management via Railway secrets vault
- ✅ Retention job: nightly schedule, last run date shown

### TEST 12 — DB Inspector Tab
- ✅ Records load showing `phone__encrypted` and `address__encrypted` as `gAAAAAB...==`
- ✅ Raw phone/address NOT visible — proves encryption at rest

### TEST 13 — Audit Export Tab
- ✅ Audit log loads
- ✅ Actor column shows SHA-256 hashes (not real emails)
- ✅ Note explains: "mapping held separately under DPO access only"

---

## PART 4 — INTEGRATION PAGE

Dashboard → click **Integration**

- ✅ Base URL shows Railway URL (not localhost)
- ✅ 12 endpoints listed, GET/POST badges, auth labels
- ✅ Risk tier table at bottom with CRITICAL/HIGH/MEDIUM/LOW + new escalation cases

---

## PART 5 — EDGE CASES (2 min)

| Test | Steps | Expected |
|---|---|---|
| Wrong OTP | Submit request → type `000000` | "Invalid OTP" error |
| No-auth redirect | Incognito → go to `/admin/dashboard` | Redirects to login |
| Approve disabled | Open escalated request → clear notes box | Approve button greyed out |
| Unknown email | Submit with random email not in DB | "Email not found in university database" |

---

## PASS CRITERIA CHECKLIST

- [ ] Test 1: LOW access → data email received with actual subject data
- [ ] Test 2: MEDIUM deletion → confirmation email received
- [ ] Test 3: LOW modification → change summary email received
- [ ] Test 4: LOW stop processing → opt-out confirmation email
- [ ] Test 5: CRITICAL escalation on 3rd request
- [ ] Test 6: DPO sees all fields including CGPA + medical notes
- [ ] Test 7: Approve escalated request → status completed
- [ ] Test 8: 3 pre-seeded escalations with clear reasons visible
- [ ] Test 9: Registrar sees CGPA but NOT medical notes
- [ ] Test 10: Legal sees name/dept only, no CGPA/phone, no action buttons
- [ ] Test 11-13: Settings tabs all load correctly
- [ ] Test 14: Integration page shows Railway URL
- [ ] Edge cases: wrong OTP, unknown email, no-auth redirect
