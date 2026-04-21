# DataVerse Demo — Setup & Deploy Guide

## Environment Variables Needed

### Backend (set in Railway)
| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-set by Railway PostgreSQL add-on |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | 16-char app password from Google Account |
| `GEMINI_API_KEY` | From your .env |

### Frontend (set in Vercel)
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL (e.g. https://xxx.up.railway.app) |

---

## Deploy Backend to Railway

1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select the `backend/` folder as the root directory
3. Add PostgreSQL plugin (free add-on)
4. Set all env vars listed above
5. Once deployed, copy the Railway URL

**After deploy — seed the database:**
```bash
# In Railway shell or locally with DATABASE_URL set:
python seed.py
```

---

## Deploy Frontend to Vercel

1. Go to vercel.com → New Project → Import GitHub repo
2. Set root directory to `frontend/`
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app`
4. Deploy

---

## Demo Accounts

### Admin
| Email | Password | Role |
|---|---|---|
| dpo@cu-demo.edu.ng | DPOsecure2024! | Superadmin |
| registrar@cu-demo.edu.ng | Registrar2024! | Admin |
| legal@cu-demo.edu.ng | Legal2024! | Admin |

### Demo Subject Emails (for live testing)
| Email | Scenario |
|---|---|
| student.james@demo.edu.ng | Access request (LOW, auto) |
| alumni.fatima@demo.edu.ng | Deletion (MEDIUM, auto) |
| staff.chukwu@demo.edu.ng | Modification (LOW, auto) |
| student.ada@demo.edu.ng | Stop processing (LOW, auto) |
| lecturer.balogun@demo.edu.ng | HIGH escalation (special category) |
| student.bulk@demo.edu.ng | CRITICAL escalation (3 prior requests) |

---

## Gmail SMTP Setup
1. Go to myaccount.google.com → Security → 2-Step Verification → App Passwords
2. Generate an App Password for "Mail"
3. Use the 16-character code as `GMAIL_APP_PASSWORD`
