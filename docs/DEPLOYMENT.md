# HostelFix Deployment Guide

Step-by-step instructions for deploying HostelFix in production across Vercel (Frontend) and Render (Backend).

## Deployment Overview

```
Frontend: Vercel (Vite Static Site / SPA)
Backend:  Render (Node.js Web Service)
Database: MongoDB Atlas (M0 / Dedicated Cluster)
Storage:  Cloudinary (Media & Photo Proofs)
Auth:     Google Cloud Console (Google Identity Services)
```

---

## 1. Frontend Deployment (Vercel)

### Root Configuration
The repository includes a top-level `vercel.json` configured for monorepo routing:
```json
{
  "buildCommand": "npm --prefix frontend run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
```

### Vercel Dashboard Setup
1. Import repository into Vercel.
2. Select **Vite** framework preset.
3. Configure **Root Directory**: `./` (leave default).
4. Configure **Environment Variables**:
   - `VITE_API_URL`: `https://hostelfix-api-5uzs.onrender.com/api` (your Render backend API)
   - `VITE_GOOGLE_CLIENT_ID`: `<your-google-client-id>.apps.googleusercontent.com`
5. Deploy.

### Headers & Rewrites
`vercel.json` automatically provides:
- Immutable 1-year caching for `/assets/*`
- 24-hour cache control for `/robots.txt` and `/sitemap.xml`
- SPA fallback rewrites for React Router routes while serving static files directly

---

## 2. Backend Deployment (Render)

### Render Web Service Setup
1. Create a new **Web Service** connected to your repository.
2. Configure settings:
   - **Environment**: `Node`
   - **Region**: Closest to your users (e.g., `Singapore` or `Frankfurt`)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Health Check Path**: `/api/health`

### Environment Variables
Set the following environment variables in the Render dashboard:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Production environment flag | `production` |
| `PORT` | Web service port | `5000` |
| `CLIENT_ORIGIN` | Allowed CORS frontend URL | `https://hostel-fix-kappa.vercel.app` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/hostelfix?retryWrites=true&w=majority` |
| `JWT_SECRET` | 64+ char random hex string | `a7f92b...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456...apps.googleusercontent.com` |
| `ADMIN_LOGIN_ID` | Seed Warden Email | `admin@hostelfix.edu` |
| `ADMIN_PASSWORD` | Seed Warden Password | `<secure_password>` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `hostelfix` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret | `abcde...` |

### Reverse Proxy & Keep-Alive Settings
Render's reverse proxy enforces a 60-second connection timeout. The backend server is pre-configured with:
- `server.keepAliveTimeout = 65000`
- `server.headersTimeout = 66000`
- Lightweight liveness endpoint `/api/health` responds in < 10ms without database querying.

---

## 3. Database Deployment (MongoDB Atlas)

1. **Network Access**: Add `0.0.0.0/0` (allow access from anywhere) to Atlas IP Access List so Render dynamic IP containers can connect.
2. **Database User**: Create a read-write database user for the `hostelfix` database.
3. **Connection Pooling**: HostelFix handles pooling automatically with:
   - `maxPoolSize: 10`
   - `minPoolSize: 2`
   - `serverSelectionTimeoutMS: 5000`

---

## 4. Google OAuth 2.0 Setup

1. Open **Google Cloud Console** $\rightarrow$ **APIs & Services** $\rightarrow$ **Credentials**.
2. Edit your **OAuth 2.0 Web Client ID**.
3. **Authorized JavaScript Origins**:
   - `http://localhost:5173`
   - `https://hostel-fix-kappa.vercel.app` (your Vercel production domain)
4. **Authorized Redirect URIs**:
   - `http://localhost:5173`
   - `https://hostel-fix-kappa.vercel.app`

---

## 5. Post-Deployment Verification Checklist

- [ ] Visit `https://<your-vercel-domain>/robots.txt` $\rightarrow$ Returns text/plain with sitemap reference.
- [ ] Visit `https://<your-vercel-domain>/sitemap.xml` $\rightarrow$ Returns application/xml with canonical URLs.
- [ ] Visit `https://<your-render-domain>/api/health` $\rightarrow$ Returns `{"status":"ok"}` in < 50ms.
- [ ] Visit `https://<your-render-domain>/api/health/ready` $\rightarrow$ Returns `{"status":"ready","database":"connected"}`.
- [ ] Run automated test suite: `npm run test` and `npm run test:security`.

