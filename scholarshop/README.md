# ScholarShop

A student-only buy / sell / rent marketplace ("OLX for campus") with college-email verification, real-time chat, wishlist, reviews, and notifications.

> Stack: **React (Vite)** · **Node.js + Express** · **MySQL 8** · **Socket.IO**

There is no admin panel. Moderation is community-driven via reporting + a per-user trust score.

---

## Repository layout

```
ScholarShop/
  backend/      Express REST API + Socket.IO
  frontend/     React (Vite) SPA
  README.md     (this file)
```

---

## Prerequisites

- **Node.js 18+**
- **MySQL 8+** running locally (or any reachable host)
- **npm** (comes with Node)

---

## 1. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and set at minimum:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (any long random strings)
- `ALLOWED_EMAIL_DOMAINS` (comma-separated university domains, e.g. `uohyd.ac.in,example.edu`)
- **Email (Nodemailer):** see [Email (development vs production)](#email-development-vs-production) below.
- Optional: `OTP_RESEND_LIMIT` (default `5`) — max OTP emails per user per rolling hour.

### Email (development vs production)

- **Development:** set `MAIL_DEV=true`. OTPs are **not** sent over SMTP. The server prints  
  `[DEV MODE] OTP for user@domain → 123456`  
  and the register response includes **`otp`** (and **`devMode`: true**) for demo UIs.
- **Production:** set `MAIL_DEV=false` and configure **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. The API does **not** include `otp` in the JSON body.

OTP codes expire in **5 minutes**. Registration is limited to emails whose domain appears in `ALLOWED_EMAIL_DOMAINS` (subdomains allowed, e.g. `mail.uohyd.ac.in`).

If you already ran `db:setup` before this index was added, apply:

```sql
ALTER TABLE email_verifications ADD INDEX idx_ev_user_created (user_id, created_at);
```

---

## 2. Create the database & schema

In MySQL, create an empty database matching `DB_NAME`:

```sql
CREATE DATABASE scholarshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then from `backend/`:

```bash
npm install
npm run db:setup     # applies src/db/schema.sql
npm run db:seed      # optional: inserts demo categories + users
```

---

## 3. Run the backend

```bash
cd backend
npm run dev          # http://localhost:4000
```

REST: `http://localhost:4000/api/v1`
Socket.IO: `http://localhost:4000`
Uploaded images: `http://localhost:4000/uploads/...`

---

## 4. Run the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## Quickstart with curl

```bash
# 1. Register (with MAIL_DEV=true: check server console and `otp` in JSON; with MAIL_DEV=false: check inbox)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.edu","password":"hunter2!","college":"Example University"}'

# 2. Verify (replace 1 / 123456 with the values you got)
curl -X POST http://localhost:4000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"otp":"123456"}'

# 3. Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.edu","password":"hunter2!"}'
```

Use the returned `accessToken` as `Authorization: Bearer <token>` for all other endpoints.

---

## Feature checklist

- [x] College-email registration + OTP verification
- [x] JWT auth (access + refresh, hashed refresh in DB)
- [x] Product listings (sell / rent) with filters, search, pagination
- [x] Image uploads (local in dev, S3-ready interface)
- [x] Wishlist
- [x] Orders (buy / rent) with status transitions
- [x] Real-time chat (Socket.IO) with typing indicators & read receipts
- [x] Reviews (gated to completed orders) with denormalised seller rating
- [x] In-app notifications (live via socket + REST history)
- [x] Listing reports + auto-hide threshold (no admin needed)

---

## Architecture

See the design doc bundled with this project for the full system design (architecture diagrams, ER model, API surface, deployment topology, scalability path, and future enhancements).
