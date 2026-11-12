# HostelFix Backend API

Production-ready Node.js + Express + MongoDB REST API for the HostelFix smart hostel complaint and maintenance platform.

## Architecture & Directory Layout

```
backend/
├── src/
│   ├── config/              # Central configuration (DB, Cloudinary, Google OAuth)
│   │   ├── database.js      # Canonical MongoDB Mongoose connection with pooling
│   │   ├── db.js            # Backward-compatible db wrapper
│   │   ├── cloudinary.js    # Cloudinary SDK media storage configuration
│   │   └── passport.js      # Google OAuth ID token verification
│   ├── controllers/         # Request handling & HTTP response mapping
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── staffController.js
│   │   └── studentController.js
│   ├── models/              # Mongoose data schemas and indexes
│   │   ├── Admin.js
│   │   ├── Complaint.js
│   │   ├── ComplaintHistory.js
│   │   ├── Counter.js
│   │   ├── Feedback.js
│   │   ├── HostelBlock.js
│   │   ├── Notification.js
│   │   ├── Session.js
│   │   ├── Setting.js
│   │   ├── Staff.js
│   │   └── User.js
│   ├── routes/              # Express API route declarations
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── staffRoutes.js
│   │   └── studentRoutes.js
│   ├── middleware/          # Security, auth, and upload middleware
│   │   ├── auth.js          # JWT & session cookie verification
│   │   ├── errorHandler.js  # Global exception & error response handler
│   │   ├── roles.js         # Role-based access control (RBAC)
│   │   └── upload.js        # Multer file upload stream handler
│   ├── services/            # Domain business logic & external integrations
│   │   ├── authService.js
│   │   ├── complaintService.js
│   │   └── notificationService.js
│   ├── utils/               # Cryptography, sanitize, priority, references
│   │   ├── jwt.js
│   │   ├── priorityRules.js
│   │   ├── referenceGenerator.js
│   │   └── sanitize.js
│   ├── validators/          # Input schema and payload validators
│   ├── constants/           # Enums, roles, priorities, categories
│   ├── jobs/                # SLA auditing and maintenance background jobs
│   ├── app.js               # Express app configuration & middleware pipeline
│   └── server.js            # Server entrypoint and cluster bootstrap
├── scripts/                 # Test suites, database seeding, and diagnostic tools
├── .env.example             # Documented template of required environment variables
├── package.json             # Dependencies and operational scripts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas cluster connection string
- Google OAuth 2.0 Web Client ID
- Cloudinary credentials

### Environment Setup
Copy `.env.example` to `.env` in the `backend/` directory:
```bash
cp .env.example .env
```
Fill in the credentials:
- `PORT`: Server port (default 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: High-entropy random secret key
- `GOOGLE_CLIENT_ID`: Google OAuth Web Client ID
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Installation & Execution
```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Run automated security and auth verification suites
npm run test:security
```

