---
name: vercel-deploy
description: Deploy this Asset Management System to Vercel. Handles frontend (React+Vite) deployment and backend (Express+SQLite) deployment configuration. Use when the user wants to deploy, publish, or host the app on Vercel.
trigger: explicit
---

# Vercel Deployment Skill

You are helping the user deploy their **Asset Management System** to Vercel.

## Project Architecture
- **Frontend**: React + Vite + Tailwind CSS (located in `frontend/`)
- **Backend**: Node.js + Express + SQLite via `better-sqlite3` (located in `backend/`)

## Important Limitation: SQLite on Vercel
Vercel is a **serverless/ephemeral** platform — the filesystem resets on every deployment. SQLite (a file-based database) will **not persist data** between requests on Vercel. You MUST inform the user of this and offer two paths:

### Path A — Deploy frontend to Vercel, backend to Railway/Render (Recommended)
Best for keeping SQLite. Backend runs as a persistent server elsewhere.

### Path B — Convert backend to Vercel Serverless Functions + external DB
Replace SQLite with a hosted DB (PlanetScale MySQL, Neon PostgreSQL, Turso SQLite-compatible).

---

## Deployment Steps

### Step 1 — Ask the user which path they prefer
Present both options clearly before proceeding.

---

### PATH A: Frontend on Vercel + Backend on Railway

#### Frontend (Vercel)

1. **Create `frontend/vercel.json`**:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

2. **Set build config** in Vercel dashboard:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set environment variable** in Vercel:
   - `VITE_API_URL` = your Railway backend URL (e.g. `https://your-app.railway.app`)

4. **Update frontend API base URL** — check `frontend/src` for axios base URL config and ensure it reads from `import.meta.env.VITE_API_URL`.

5. **Push to GitHub**, then import repo in [vercel.com/new](https://vercel.com/new).

#### Backend (Railway)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set root directory to `backend/`
3. Add env variables: `JWT_SECRET`, `NODE_ENV=production`, `PORT=3000`
4. Railway auto-detects Node.js and runs `npm start`

---

### PATH B: Full Vercel Deployment (Serverless)

This requires converting Express routes to Vercel API routes and replacing SQLite with a hosted database. This is a significant refactor — only recommend if the user explicitly wants everything on Vercel.

Steps overview:
1. Create `api/` directory at project root with serverless function files
2. Replace `better-sqlite3` with a Vercel-compatible DB client (e.g. `@vercel/postgres` or `@libsql/client` for Turso)
3. Create `vercel.json` at project root routing `/api/*` to functions and `/*` to frontend
4. Migrate schema and seed data to hosted DB

---

## Checklist Before Deploying

- [ ] `.env` files are in `.gitignore` (never commit secrets)
- [ ] `JWT_SECRET` is set as an environment variable, not hardcoded
- [ ] CORS origin in backend allows the Vercel frontend domain
- [ ] File uploads (`multer`) path is checked — on serverless, use cloud storage (S3/Cloudinary) instead of local disk
- [ ] QR code generation (`qrcode`) works without filesystem writes

## CORS Fix for Production
In `backend/server.js` or wherever CORS is configured, ensure the origin includes the Vercel domain:
```js
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
})
```

Add `FRONTEND_URL=https://your-app.vercel.app` to Railway env vars.

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Vite build fails on Vercel | Check Node version — set `engines.node` in package.json or set Node 18 in Vercel settings |
| API calls return 404 | `VITE_API_URL` env var not set, or missing trailing slash |
| SQLite "no such file" error | SQLite can't be used on serverless — use Path A |
| File uploads disappear | Vercel filesystem is ephemeral — migrate uploads to Cloudinary or S3 |
| JWT invalid signature | `JWT_SECRET` env var not set in deployment environment |

---

When done, provide the user with:
1. The live Vercel URL for the frontend
2. The backend URL (Railway or otherwise)
3. Any remaining tasks (DB migration, file storage, etc.)
