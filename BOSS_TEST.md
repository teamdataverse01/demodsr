# DataVerse Demo — Boss Test Script
**What your boss does during the live presentation.**

Boss Email 1 = tolaniyan@dataversesolutions.org → Dr. Rotimi Balogun (HIGH escalation)  
Boss Email 2 = info@dataversesolutions.org → Kolade Fashola (CRITICAL escalation)

You (Mubarak) stay logged into the admin dashboard throughout.  
Boss uses their phone or laptop to submit requests on the subject portal.

---

## SCENE 1 — The Normal Flow (Warm-up, 2 min)

*Show the boss that LOW requests are fully automated.*

**You submit this yourself before the boss arrives (or let the boss watch):**

1. Open subject portal → **Start My Request**
2. Name: `James Adeleke` · Email: `salaudeenmubarakstar@gmail.com` · Type: `Access`
3. Submit → enter OTP from your Gmail → Verify
4. Show screen: **"Request Completed"** · Badge: LOW
5. Open Gmail — show the actual data email that arrived automatically
6. Open admin dashboard — show the completed request in the list

**Talking point:** *"No admin touched this. Subject submitted, verified their identity, and received their data — all in under 60 seconds. That's NDPR Article 2.6 automation."*

---

## SCENE 2 — HIGH Escalation: Special Category Data (Boss Email 1)

*Boss submits using their own email. They get the OTP on their phone.*

1. Boss opens subject portal on their device
2. Boss fills in:
   - Name: `Dr. Rotimi Balogun`
   - Email: `tolaniyan@dataversesolutions.org`
   - Type: `Access`
   - Description: *leave blank or add anything*
3. Boss clicks **Submit Request**
4. Boss checks their email — receives OTP
5. Boss enters OTP → clicks **Verify & Submit**
6. ✅ Screen shows: **"Request Under Review"** (orange) · Badge: **HIGH**

**You (admin) now on dashboard:**
7. Refresh dashboard — new HIGH request appears at top
8. Click into it — show Subject Profile:
   - Academic Status: ACTIVE
   - Special Category Data: **Yes — heightened protection applies**
   - Research Participant: Yes
   - Medical Notes (DPO only): *"Hypertension — on medication. Biometric data collected for research trial CU-MED-2024."*
9. Show the escalation reason: *"Special category data detected. Human review required."*

**Talking point:** *"Because Dr. Balogun's record includes medical and biometric data, the system automatically flagged this for human review. It did not auto-execute. The DPO must personally approve this."*

10. Show legal team view — login as Legal → open the same request → confirm CGPA, phone, address, medical notes are all hidden
11. **Talking point:** *"Legal can see the escalation reason and the flag, but cannot see the underlying sensitive data. Role-based access — only the DPO sees medical notes."*

12. Login back as DPO → Approve the request with note: `Identity verified. Special category access request granted. Data package to be sent securely via encrypted channel per DPA clause 4.2.`

---

## SCENE 3 — CRITICAL Escalation: Potential Abuse Pattern (Boss Email 2)

*Kolade Fashola already has 3 prior requests seeded in the system. One more = CRITICAL.*

1. Boss opens subject portal (or you demonstrate)
2. Fill in:
   - Name: `Kolade Fashola`
   - Email: `info@dataversesolutions.org`
   - Type: `Access`
   - Description: `Please send me my data again`
3. Submit → Boss checks info@dataversesolutions.org for OTP
4. Enter OTP → Verify
5. ✅ Screen: **"Request Under Review"** · Badge: **CRITICAL**

**You on admin dashboard:**
6. New CRITICAL request appears — open it
7. Show escalation reason: *"4 requests from same identity in 7 days — potential automated or coordinated attempt"*

**Talking point:** *"Four requests in 7 days from the same person. The system flags this as a potential data harvesting attempt and escalates immediately. This is the kind of pattern bad actors use. The DPO decides whether to fulfil or investigate."*

8. Reject with note: `Unusual request frequency detected. Identity re-verification and justification required before processing. Contact dpo@cu-demo.edu.ng.`

---

## SCENE 4 — Pre-seeded Escalations: The Edge Cases (No OTP needed)

*These are already in the dashboard — use them to answer "what about..."  questions.*

From the admin dashboard, filter by **escalated** — show these 3:

---

**"What if an expelled student tries to delete their records?"**

Click → **Taiwo Ogundimu** · Deletion · HIGH

Show escalation reason:
> *"Subject status is 'expelled'. Disciplinary records must be retained for appeals, legal proceedings, and institutional documentation. Deletion requires DPO approval."*

Subject profile shows: Academic Status = **EXPELLED**

Talking point: *"The system knows Taiwo's status. A deletion request from an expelled student is automatically blocked — it does not auto-execute. The DPO reviews whether disciplinary records can legally be removed."*

---

**"What if there's an active court case involving a student?"**

Click → **Sade Martins** · Access · CRITICAL

Show escalation reason:
> *"Active legal hold on this record. Data cannot be modified or deleted until the hold is lifted by the DPO or Legal team."*

Subject profile shows: ⚠ **Active Legal Hold** banner in red

Talking point: *"If the university places a legal hold — say, because of ongoing litigation — the system blocks ALL actions on that record, even a simple access request. Nothing moves until the hold is lifted."*

---

**"What about students with unpaid fees trying to erase financial records?"**

Click → **Chukwudi Obi** · Deletion · HIGH

Show escalation reason:
> *"Subject has an outstanding financial obligation. Financial records cannot be deleted while a balance exists. Requires Finance and DPO sign-off."*

Subject profile shows: ⚠ **Outstanding Financial Obligation** banner in yellow

Talking point: *"A student with outstanding fees cannot delete their financial records. The system cross-checks obligations before executing deletion. Finance and the DPO must both sign off."*

---

## SCENE 5 — Compliance Audit Trail (2 min)

Go to **Settings** (DPO logged in)

1. **Retention & Encryption tab**
   - Show the policy table — categories, retention periods, legal basis
   - *"Every retention period maps to a specific regulation — NDPR, Labour Act, university policy. This is not arbitrary."*

2. **DB Inspector tab**
   - Show phone and address fields as `gAAAAAB...==`
   - *"This is what the database actually stores. Even if someone accessed the raw database, they see encrypted blobs — not real phone numbers."*

3. **Audit Export tab**
   - Show actor column as SHA-256 hashes
   - *"For privacy compliance, even the audit log itself is anonymised. The email-to-hash mapping is held separately under DPO access only — so the audit log can be shared with regulators without exposing admin identities."*

---

## SCENE 6 — Integration Capability (1 min)

Go to **Integration** page

- Show the 12 API endpoints
- *"Every action in this portal is also available as an API. Your student portal, HR system, CRM — any system that holds personal data can trigger DSR workflows automatically. A student logs into the portal, clicks 'Delete My Data', and DataVerse handles it without your staff lifting a finger."*

---

## LIKELY BOSS QUESTIONS + YOUR ANSWERS

| Question | Answer |
|---|---|
| "Who owns the data?" | "Covenant University. DataVerse is the processor. DPA signed January 2026, reference DPA/CU/DATAVERSE/2026/001." |
| "What if DataVerse goes down?" | "Data stays in your own Railway PostgreSQL instance. You can export or migrate at any time. No lock-in." |
| "Can we host it on-premise?" | "Yes. The system runs on any server with Python and PostgreSQL. Railway is for demo convenience." |
| "What regulations does this cover?" | "NDPR (Nigeria), GDPR (EU subjects), and UK GDPR. All visible in the retention policy table." |
| "How do we know it's secure?" | "AES-256 at rest, TLS 1.3 in transit, role-based access, SHA-256 audit pseudonymisation. Show DB Inspector." |
| "What about students who didn't give consent?" | "Stop Processing request — one click, system flags opt_out_marketing and stop_processing immediately." |
| "How long does a request take?" | "LOW: under 60 seconds, automated. HIGH/CRITICAL: escalated to DPO queue with AI draft response pre-loaded." |
| "Can legal see student CGPA?" | "No. Role-based access — legal sees name, email, risk reason only. CGPA is Registrar and DPO only." |

---

## YOUR DEMO CHECKLIST (before boss arrives)

- [ ] Run seed on Railway (so new escalation scenarios are in the DB)
- [ ] Log into admin dashboard as DPO — confirm all 3 pre-seeded escalations visible
- [ ] Submit Test 1 (James Adeleke access) yourself — confirm data email arrives in Gmail 1
- [ ] Have subject portal open in one tab, admin dashboard open in another
- [ ] Boss email confirmed: tolaniyan@dataversesolutions.org and info@dataversesolutions.org can receive email
- [ ] Legal login tab ready (to switch roles mid-demo)
