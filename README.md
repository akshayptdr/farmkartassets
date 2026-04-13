# AssetTrack — Company Asset Management System

A complete full-stack system to track company IT assets, assignments, and history.

---

## Features

- **Asset Inventory** — Add/edit/delete laptops, desktops, keyboards, mouse, printers, CCTV, mobiles, and other IT equipment
- **Asset Assignment** — Assign assets to employees, track assignments and returns
- **Asset History** — Full audit trail for every asset (assignments, returns, repairs, updates)
- **Image Uploads** — Upload asset photos, bills/invoices, and documents
- **QR Codes** — Generate and download QR codes for each asset
- **Search & Filters** — Filter by type, status, department; search by ID, name, serial
- **Dashboard** — Visual overview with stats, charts, and recent activity
- **Reports & CSV Export** — Export assets and assignments as CSV
- **Role-Based Access** — Admin (full control) and Employee (view only) roles
- **Overdue Tracking** — Alerts for assets past their expected return date

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS      |
| Backend   | Node.js + Express                   |
| Database  | SQLite (via better-sqlite3)         |
| Auth      | JWT (JSON Web Tokens)               |
| Uploads   | Multer                              |
| QR Codes  | qrcode npm package                  |

---

## Folder Structure

```
assestsmgmtnew/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js      # SQLite connection
│   │   │   ├── schema.js        # Table definitions
│   │   │   └── seed.js          # Sample data
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT authentication
│   │   │   └── upload.js        # Multer file upload
│   │   └── routes/
│   │       ├── auth.js          # Login, user management
│   │       ├── assets.js        # Asset CRUD + QR + files
│   │       ├── assignments.js   # Assign & return assets
│   │       ├── employees.js     # Employee CRUD
│   │       ├── history.js       # Audit history
│   │       └── reports.js       # Stats & CSV export
│   ├── uploads/                 # Uploaded files (auto-created)
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/index.js         # Axios instance
│   │   ├── context/AuthContext  # Auth state
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── AssetForm.jsx
│   │   │   ├── AssignmentForm.jsx
│   │   │   ├── EmployeeForm.jsx
│   │   │   └── ReturnForm.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Assets.jsx
│   │       ├── AssetDetail.jsx
│   │       ├── Assignments.jsx
│   │       ├── Employees.jsx
│   │       ├── History.jsx
│   │       └── Reports.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## Installation & Setup

### Prerequisites
- **Node.js** v18 or higher — https://nodejs.org
- **npm** v9 or higher (bundled with Node.js)

---

### Step 1 — Install Backend Dependencies

```bash
cd backend
npm install
```

---

### Step 2 — Configure Environment

The `.env` file is already created with default values. You can edit it if needed:

```env
PORT=5000
JWT_SECRET=assetmgmt_super_secret_key_2024_change_in_prod
JWT_EXPIRES_IN=7d
DB_PATH=./asset_management.db
UPLOAD_DIR=./uploads
```

---

### Step 3 — Seed the Database (Sample Data)

```bash
cd backend
npm run seed
```

This creates the admin user account only. All asset, employee, and assignment data is entered manually through the UI.

**Login credentials:**
| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `admin123` |

---

### Step 4 — Start the Backend

```bash
cd backend
npm run dev       # Development (auto-restart on changes)
# OR
npm start         # Production
```

Backend runs at: **http://localhost:5000**

---

### Step 5 — Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

### Step 6 — Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Quick Start (Both servers together)

Open **two terminal windows**:

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run seed
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:5173**

---

## API Endpoints

### Authentication
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | /api/auth/login       | Login                |
| GET    | /api/auth/me          | Get current user     |
| POST   | /api/auth/change-password | Change password  |

### Assets
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| GET    | /api/assets               | List assets (w/ filters)  |
| POST   | /api/assets               | Create asset (admin)      |
| GET    | /api/assets/:id           | Get asset detail          |
| PUT    | /api/assets/:id           | Update asset (admin)      |
| DELETE | /api/assets/:id           | Delete asset (admin)      |
| POST   | /api/assets/:id/files     | Upload file               |
| DELETE | /api/assets/:id/files/:fid | Delete file              |
| GET    | /api/assets/:id/qrcode    | Get QR code               |

### Assignments
| Method | Endpoint                      | Description           |
|--------|-------------------------------|-----------------------|
| GET    | /api/assignments              | List assignments      |
| POST   | /api/assignments              | Assign asset (admin)  |
| PUT    | /api/assignments/:id/return   | Return asset (admin)  |
| DELETE | /api/assignments/:id          | Delete record (admin) |

### Employees
| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| GET    | /api/employees      | List employees        |
| POST   | /api/employees      | Create employee       |
| PUT    | /api/employees/:id  | Update employee       |
| DELETE | /api/employees/:id  | Deactivate employee   |

### Reports
| Method | Endpoint                          | Description         |
|--------|-----------------------------------|---------------------|
| GET    | /api/reports/stats                | Dashboard stats     |
| GET    | /api/reports/export/csv           | Export assets CSV   |
| GET    | /api/reports/export/assignments/csv | Export assignments |

---

## Database Schema

```
users          → System login accounts (admin/employee)
employees      → People assets are assigned to
assets         → All inventory items
asset_files    → Photos, bills, documents per asset
assignments    → Asset-to-employee assignment records
asset_history  → Complete audit trail of all actions
```

---

## Usage Guide

### Adding an Asset
1. Go to **Assets** → Click **Add Asset**
2. Fill in Asset ID, Type, Brand, Model
3. Set condition and status
4. Click **Create Asset**

### Assigning an Asset
1. From Assets list, click **+** on an available asset  
   OR go to **Assignments** → **New Assignment**
2. Select asset and employee
3. Set assigned date and expected return date
4. Click **Assign Asset**

### Returning an Asset
1. Go to **Assignments**
2. Find the active assignment → Click **Return**
3. Select return condition (good/fair/damaged)
4. If damaged, asset automatically moves to "Under Repair"

### Uploading Files
1. Open any asset detail page
2. Select file type (Photo / Bill / Document)
3. Click **Upload** and choose a file

### Generating QR Code
1. Open any asset (list or detail page)
2. Click the QR Code icon
3. Download the PNG for printing/labeling

---

## Notes

- The SQLite database file (`asset_management.db`) is created automatically in the `backend/` directory
- Uploaded files are stored in `backend/uploads/` (photos, bills, documents subdirectories)
- Re-running `npm run seed` after the DB already exists uses `INSERT OR IGNORE` so it won't duplicate data
- For production, change `JWT_SECRET` to a strong random string
