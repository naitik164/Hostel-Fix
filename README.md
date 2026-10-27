# HostelFix — Smart Hostel Complaint & Maintenance Management System

> **Tagline:** *"Your Hostel. Your Voice. Better Living."*

HostelFix is a full-stack, enterprise-grade web application built to streamline complaint submission, maintenance routing, technician dispatch, and resolution workflows for university and collegiate hostels.

Students can authenticate via Google Identity Services (GIS) or one-click demo credentials, lodge categorized complaints with photo evidence, receive live status notifications, and submit post-resolution reviews. Wardens manage operations from a dark-navy liquid-glass administrative command center featuring MongoDB aggregation analytics, staff workload distribution, SLA compliance tracking, and tamper-resistant CSV exports.

---

## 1. Brand Identity & Blue Liquid-Glass Design System

HostelFix strictly adheres to the curated **six-color blue liquid-glass design system** inspired by glossy layered glass surfaces, ambient radial highlights, and luminous edge borders:

| Color Name | Hex Code | Role in Application |
| :--- | :--- | :--- |
| **Deep Navy** | `#03195B` | Warden sidebar, primary heading typography, dark ambient panels |
| **Royal Blue** | `#0B2CB1` | Primary action buttons, brand badges, active interactive states |
| **Electric Blue**| `#1951FC` | Focus rings, key glow accents, progress highlights, active tabs |
| **Bright Blue** | `#3781FC` | Secondary action highlights, chart series, link hover states |
| **Sky Blue** | `#77C1FC` | Card borders, translucent divider lines, subtle badge backgrounds |
| **Ice Blue** | `#CBE9FD` | Page background tints, frosted pill chips, table header tint |

### Design Tokens (`client/src/index.css`)
- **Main Background Surface:** `#F5F9FF` (with ambient radial lighting)
- **Glass Cards:** `backdrop-filter: blur(20px) saturate(155%)`, `border: 1px solid rgba(255, 255, 255, 0.85)`
- **Dark Glass Panels:** `linear-gradient(165deg, rgba(3, 25, 91, 0.95), rgba(11, 44, 177, 0.90))`
- **Glass Shadows:** `0 8px 30px rgba(3, 25, 91, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)`
- **Status Indicators:**
  - `Submitted` / `Assigned`: Blue & Sky Blue
  - `In Progress`: Amber
  - `Resolved`: Emerald Green
  - `Critical` / `Overdue`: Accessible Red (#EF4444)

---

## 2. Technology Stack

### Frontend
- **Framework:** React.js 19 with Vite 8
- **Styling:** Tailwind CSS with custom liquid-glass design tokens & vanilla CSS variables
- **Icons:** Lucide React
- **Routing:** React Router v7
- **HTTP Client:** Axios with cookie-credentials support & interceptors
- **Authentication:** Google Identity Services (`@react-oauth/google`) + Custom Warden ID/Password
- **Data Visualization:** Chart.js 4 & react-chartjs-2

### Backend
- **Runtime:** Node.js v20+ / v24+
- **Server Framework:** Express.js 4
- **Database:** MongoDB (Local or MongoDB Atlas) with Mongoose 8 ODM
- **Authentication:** Google OAuth Token Verification (`google-auth-library`), Bcrypt password hashing, JWT sessions in HttpOnly cookies
- **Security:** Helmet, express-rate-limit, CORS origin protection, NoSQL injection prevention, CSV formula injection sanitization
- **File Storage:** Cloudinary image streaming with automatic fallback to local disk storage (`/uploads`)

---

## 3. Project Structure

```
HostelFix/
├── package.json              # Monorepo convenience scripts (npm run dev, etc.)
├── README.md                 # Complete documentation and setup manual
├── server/
│   ├── .env.example          # Backend environment variables reference
│   ├── .env                  # Active local backend configuration
│   ├── package.json          # Backend dependencies & seed scripts
│   ├── scripts/
│   │   ├── seedAdmin.js      # Creates/updates initial Warden account safely
│   │   ├── seedDev.js        # Populates realistic blocks, staff, complaints & timeline
│   │   └── resetDb.js        # Drops and resets local development database
│   ├── src/
│   │   ├── app.js            # Express application setup, security headers & routes
│   │   ├── server.js         # HTTP server entrypoint connecting to MongoDB
│   │   ├── config/
│   │   │   ├── db.js         # Mongoose database connection
│   │   │   └── cloudinary.js # Cloudinary SDK initialization & fallback check
│   │   ├── models/
│   │   │   ├── User.js       # Student residents (googleSub, block, room)
│   │   │   ├── Admin.js      # Wardens (bcrypt passwordHash, role)
│   │   │   ├── HostelBlock.js# Block definitions (rooms, codes)
│   │   │   ├── Staff.js      # Maintenance staff (specialization, workload)
│   │   │   ├── Complaint.js  # Main complaint tickets (referenceId, priority, status)
│   │   │   ├── Counter.js    # Concurrency-safe atomic reference counter
│   │   │   ├── ComplaintHistory.js # Immutable audit timeline & notes
│   │   │   ├── Notification.js     # In-app notifications
│   │   │   ├── Feedback.js   # 1-5 star post-resolution student ratings
│   │   │   └── Setting.js    # Configurable SLA resolution target thresholds
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT & HttpOnly cookie verification
│   │   │   ├── roles.js      # requireStudent & requireAdmin authorization
│   │   │   ├── upload.js     # Multer 5MB file & MIME-type validation
│   │   │   └── errorHandler.js# Centralized error handler
│   │   ├── controllers/
│   │   │   ├── authController.js   # Google OAuth, Warden login, demo login, logout
│   │   │   ├── studentController.js# Student dashboard, complaints, feedback, profile
│   │   │   └── adminController.js  # Warden dashboard, analytics, staff, blocks, CSV
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   └── adminRoutes.js
│   │   └── utils/
│   │       ├── jwt.js        # Token signing & cookie configuration
│   │       ├── priorityRules.js    # Transparent safety keywords priority engine
│   │       ├── referenceGenerator.js# Atomic sequence generator (HF-2026-XXXX)
│   │       └── sanitize.js   # CSV formula injection prevention (CWE-1236)
└── client/
    ├── .env.example          # Frontend public environment variables reference
    ├── .env                  # Active local frontend environment
    ├── package.json          # Frontend dependencies & Vite scripts
    ├── index.html            # Main HTML with SEO meta tags & Google fonts
    ├── tailwind.config.js    # Custom Tailwind theme tokens for blue liquid glass
    ├── postcss.config.js     # PostCSS configuration
    └── src/
        ├── main.jsx          # React DOM entrypoint
        ├── App.jsx           # App root with Google OAuth & React Router routes
        ├── index.css         # Liquid glass styles, ambient lights, tokens
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   ├── StatusBadge.jsx
        │   └── PriorityBadge.jsx
        ├── layouts/
        │   ├── StudentLayout.jsx   # Frosted-glass navigation with unread badge
        │   └── AdminLayout.jsx     # Dark navy glass sidebar & warden menu
        ├── context/
        │   └── AuthContext.jsx     # Global authentication state & methods
        ├── services/
        │   └── api.js              # Axios instance with credentials
        └── pages/
            ├── auth/
            │   ├── LandingPage.jsx # Hero showcase, stats, 1-click portals
            │   ├── StudentLogin.jsx# Google Sign-In & demo student login
            │   └── AdminLogin.jsx  # Warden custom ID/password sign in
            ├── student/
            │   ├── StudentDashboard.jsx
            │   ├── StudentComplaints.jsx
            │   ├── NewComplaint.jsx
            │   ├── StudentComplaintDetail.jsx
            │   ├── StudentNotifications.jsx
            │   └── StudentProfile.jsx
            └── admin/
                ├── AdminDashboard.jsx
                ├── AdminComplaints.jsx
                ├── AdminComplaintDetail.jsx
                ├── AdminStaff.jsx
                ├── AdminBlocks.jsx
                ├── AdminStudents.jsx
                ├── AdminAnalytics.jsx
                ├── AdminNotifications.jsx
                └── AdminSettings.jsx
```

---

## 4. Quick Start & Local Setup

### Prerequisites
- **Node.js:** v18+ (tested on v24.16.0)
- **MongoDB:** A local MongoDB instance running on `localhost:27017` or a free MongoDB Atlas connection string.

### Step 1: Clone and Install Dependencies
```bash
# In the root repository directory
npm --prefix server install
npm --prefix client install
```

### Step 2: Configure Environment Variables
Copy the `.env.example` templates:

**Server (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hostelfix
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=hostelfix_super_secret_jwt_key_2026_dev
GOOGLE_CLIENT_ID=
ADMIN_LOGIN_ID=admin@hostelfix.edu
ADMIN_PASSWORD=Warden@Secure2026
ADMIN_NAME=Chief Warden Office
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Client (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### Setting Up Google Cloud OAuth 2.0 Credentials
To use Google Identity Services for student login:
1. Navigate to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create a project or select an existing one.
3. Configure the **OAuth Consent Screen** (User Type: External, App Name: *HostelFix*, add support email, and save).
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**.
5. Select Application Type: **Web application**.
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   *(When deploying to production, add your production domain, e.g., `https://hostelfix.vercel.app`)*
7. Copy the generated **Client ID**.
8. Set `GOOGLE_CLIENT_ID` in `server/.env` and `VITE_GOOGLE_CLIENT_ID` in `client/.env`.

### Step 3: Seed the Database
Run the automated development seed script to populate realistic hostel blocks, staff members, historical complaints with timelines, and demo accounts:
```bash
npm run seed:dev
```

You can also seed just the warden administrator account:
```bash
npm run seed:admin
```

### Step 4: Start Frontend and Backend
You can run both concurrently from the root directory:
```bash
npm run dev
```
Or in separate terminals:
```bash
# Terminal 1 - Backend Server (port 5000)
npm run server

# Terminal 2 - Frontend Client (port 5173)
npm run client
```

Open your browser at: **`http://localhost:5173`**

---

## 5. Seeded Demo Accounts for Instant Evaluation

| Role | Portal URL | Login Method / Credentials |
| :--- | :--- | :--- |
| **Chief Warden (Admin)** | `/admin/login` | **ID:** `admin@hostelfix.edu`<br>**Password:** `Warden@Secure2026`<br>*(Or click "Auto-Fill Seeded Warden Credentials")* |
| **Student Resident 1** | `/student/login` | **Email:** `aarav.sharma@hostelfix.edu`<br>*(Or click "Sign in as Aarav Sharma")* |
| **Student Resident 2** | `/student/login` | **Email:** `priya.patel@hostelfix.edu`<br>*(Or click "Sign in as Priya Patel")* |

---

## 6. End-to-End Workflow & Features

### 1. Student Complaint Submission
1. Student navigates to `/student/complaints/new`.
2. Form fields: Title, Category (12 hostel categories), Dynamic Subcategories, Description, Hostel Block, Room Number, Location, Photo Attachment (up to 4 images, 5MB limit), and Preferred Contact Method.
3. System suggests initial priority (Low, Medium, High, Critical) using transparent keyword and category safety rules.
4. An atomic, concurrency-safe reference ID is generated (e.g. `HF-2026-0001`).
5. Live notifications are pushed to both student and warden.

### 2. Warden Inspection, Assignment & Resolution
1. Warden visits `/admin/complaints` or clicks on notification.
2. Filters by status, category, block, priority, staff, or date range.
3. Assigns technician from the staff roster (filtered by trade specialization).
4. Updates status through standard transitions: `Submitted` → `Assigned` → `In Progress` → `Resolved` (or `Rejected` with required reason).
5. Wardens can add public updates (visible to students) and internal notes (private to hostel management).
6. Once resolved, the student is notified to rate the repair (1-5 stars) and submit review feedback.

### 3. Analytics & Intelligence Reporting (`/admin/analytics`)
- **Doughnut Chart:** Complaints distribution by status.
- **Bar Chart:** Complaints by facility category.
- **Bar Chart:** Complaints by hostel block.
- **Line Chart:** Incoming ticket volume over time.
- **Bar Chart:** Average turnaround hours by category.
- **Horizontal Bar Chart:** Active open backlog by hostel block.
- **Bar Chart:** Current staff member active workloads.
- **CSV Export:** Authorized one-click export with spreadsheet formula injection protection (CWE-1236).

---

## 7. Security Hardening Measures

- **Google ID Token Verification:** Validated via official `google-auth-library` ensuring token signature, audience, expiration, and verified email status.
- **Warden Authentication:** Passwords hashed with Bcrypt using 12 salt rounds.
- **Session Architecture:** Secure HttpOnly cookies with SameSite lax/none and Secure flags in production, alongside Bearer token header support.
- **Rate Limiting:** IP-based window rate-limiting on authentication endpoints (`express-rate-limit`).
- **Authorization & Ownership:** Student routes enforce `requireStudent` and strictly verify MongoDB ObjectId ownership on complaint inspection.
- **Private Internal Notes:** History timeline explicitly strips `internalNote` fields before returning payloads to students.
- **File Validation:** Multer restricts uploads to `image/jpeg`, `image/png`, `image/webp`, and `image/gif` up to 5MB.
- **Formula Injection Defense:** CSV generator prepends `'` to any cell starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.

---

## 8. Production Deployment Guide

### Backend on Render / Railway
1. Push repository to GitHub.
2. Create a new Web Service on Render linked to the repository.
3. Set **Root Directory** to `server`.
4. Set **Build Command:** `npm install`
5. Set **Start Command:** `npm start`
6. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A long secure random string.
   - `CLIENT_ORIGIN`: Your deployed frontend URL (e.g. `https://hostelfix.vercel.app`).
   - `GOOGLE_CLIENT_ID`: Your Google Cloud Console OAuth Client ID.
   - `ADMIN_LOGIN_ID` & `ADMIN_PASSWORD`: Your warden credentials.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optional).

### Frontend on Vercel
1. Import repository to Vercel.
2. Set **Root Directory** to `client`.
3. Set **Framework Preset:** Vite.
4. Add environment variables:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://hostelfix-api.onrender.com/api`).
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
5. In Google Cloud Console, add your Vercel domain to **Authorized JavaScript origins**.

---

## 9. License

Developed for the Hostel Administration & Residential Life Department.
Tagline: *"Your Hostel. Your Voice. Better Living."*
