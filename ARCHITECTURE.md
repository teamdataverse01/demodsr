# DataVerse DSR Platform — Architecture

## Overview

DataVerse is a Data Subject Request (DSR) management platform built to help Nigerian universities
comply with the NDPR (Nigeria Data Protection Regulation) and GDPR. It handles the full lifecycle
of data subject requests — from submission to audit trail — with deterministic risk scoring and
optional AI-assisted response drafting.

---

## System Components

```
Subject Portal (Next.js)          Admin Dashboard (Next.js)
        |                                   |
        └──────────── HTTPS ────────────────┘
                           |
                    FastAPI Backend
                           |
              ┌────────────┼────────────┐
              │            │            │
          PostgreSQL   Gmail SMTP    Gemini API
          (Data store)  (OTP email)  (AI drafts)
```

---

## Section 7 — Hosting Options

### Demo Environment (current)
| Component | Service | Cost |
|---|---|---|
| API + Workers | Railway Pro | $20/month |
| Database | Railway PostgreSQL | Free add-on |
| Frontend | Vercel | Free |
| Email | Gmail SMTP | Free |
| AI Drafts | Gemini API | Pay-per-use (~$0.01/demo) |

### Recommended Production (AWS)
| Component | Service | Notes |
|---|---|---|
| API | ECS Fargate | Auto-scaling containers |
| Database | RDS PostgreSQL (Multi-AZ) | Automated backups, encryption at rest |
| Frontend | CloudFront + S3 | CDN, global edge |
| WAF | AWS WAF | Rate limiting, OWASP protection |
| Secrets | AWS Secrets Manager | Key rotation |
| Email | SES or Resend | Higher volume limits |
| Monitoring | CloudWatch | Alerts, log retention |

### On-Premise Option
DataVerse ships as a Docker Compose package. Any university with an on-premise server
can deploy the full stack with a single command:
```bash
docker-compose up -d
```
No external dependencies required. All data stays on the university's own infrastructure.

### Data Residency
- Default: Railway (EU region) or AWS eu-west-1 (Ireland) / af-south-1 (Cape Town)
- Nigeria-local: on-premise deployment or co-location at CWG/Rack Centre Lagos
- The university decides. DataVerse follows.

---

## Security Architecture

### Authentication
- Subjects: OTP to registered email (10-minute expiry, single-use)
- Admins: Password + session token (in-memory, revocable)
- Production: Replace with SSO/SAML (Microsoft Entra, Google Workspace)

### Encryption
- In transit: TLS 1.3 (enforced by Railway/Vercel/CloudFront)
- At rest: AES-256 (PostgreSQL TDE on Railway Pro / RDS)
- Application layer: Fernet symmetric encryption on sensitive fields (phone, address, modification payloads)
- Key storage: Environment variables (Railway secrets vault / AWS Secrets Manager)

### Access Control
| Role | Permissions |
|---|---|
| Superadmin (DPO) | Full access — all requests, settings, DB inspector, audit export |
| Admin (Registrar) | Process requests — approve/reject. No settings access. |
| Legal | Read-only — HIGH and CRITICAL escalations only. Cannot take action. |

---

## Data Flow — Request Lifecycle

```
1. Subject submits request → OTP sent to registered email
2. Subject verifies OTP → identity confirmed
3. Risk engine assesses: LOW / MEDIUM / HIGH / CRITICAL
4. LOW/MEDIUM → auto-executed immediately
   HIGH/CRITICAL → escalated to admin queue
5. Admin reviews → approve or reject
6. Completion email sent to subject
7. Full audit trail written at every step
```

---

## Risk Engine (Deterministic — No AI)

```python
CRITICAL  if recent_requests >= 3 in 7 days   → admin notified immediately
HIGH      if subject has special category data  → human review required
MEDIUM    if request_type == deletion           → auto-execute + audit flag
LOW       all other cases                       → auto-execute
```

AI is only involved in drafting suggested responses. It plays zero role in risk decisions.

---

## Data Ownership

- **Controller:** The university (Covenant University, or any client institution)
- **Processor:** DataVerse Solutions Ltd
- DataVerse cannot access, sell, share, or use university data for any purpose outside the DPA
- Full data portability: export available in JSON/CSV at any time
- Right to erasure of DataVerse's own copy upon contract termination: guaranteed within 30 days
