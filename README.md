# GlobalScholar - Frontend & Backend

## A. Contributor
Isaac Igohe

## B. Overview
GlobalScholar is an international academic exchange management system, built with a Django REST Framework backend and a React + Vite frontend, deployed on Render (backend) and Vercel (frontend).

The system supports three distinct user roles — **Student**, **Home Admin**, and **Host Coordinator** — each with a dedicated dashboard tailored to their responsibilities in the exchange process, plus a **Super Admin** oversight layer for verifying administrator accounts. A public, unauthenticated Explore Catalog also lets prospective students browse partner universities before creating an account.

Students can browse partner universities and programs, submit applications, and track them through a strict pipeline while uploading required compliance documents. Home Admins review submitted applications, manage program listings, verify or flag documents, and advance or reject them. Host Coordinators track inbound student placements at their university. Super Admins oversee and verify administrator accounts across the platform.

---

## C. Requirements
The following software should be installed before running the project:

- Node.js v18+
- npm or yarn
- Python 3.10+
- PostgreSQL (or use SQLite for local development)
- GlobalScholar Backend (running locally or deployed on Render)

---

## D. Installation

### 1. Clone the Repositories
```bash
git clone https://github.com/isaacigohe/Backend-System-of-globalScholar-.git
cd Backend-System-of-globalScholar-
```
```bash
git clone <your-frontend-repo-url>
cd <frontend-folder>
```

### 2. Backend Setup
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the frontend project root and set the following:
```
VITE_API_URL=http://127.0.0.1:8000/api/v1
```
Note: All environment variables must be prefixed with `VITE_` to be accessible in the browser. For production, set `VITE_API_URL` to the live Render backend URL:
```
VITE_API_URL=https://backend-system-of-globalscholar-1.onrender.com/api/v1
```

### 5. Start the Development Server
```bash
npm run dev
```
App will be available at `http://localhost:5173`.

---

## E. Usage
1. **User Registration** — Students can register for an account to apply to universities, including student type, GPA, major, home institution, and enrollment year; Home Admin and Host Coordinator accounts are role-assigned.
2. **Login** — Sign in using registered credentials. Role-based access determines the dashboard and available actions. A separate Super Admin access path is available from the login screen.
3. **Browse Universities** — View partner universities and programs, filtered by country and language, with travel advisory badges and GPA requirements shown live.
4. **Apply to a University** — Select a university and submit an application, which enters the pipeline as `DRAFT`.
5. **Track & Upload Documents** — Follow application progress through `SUBMITTED → UNDER_REVIEW → HOST_REVIEW → APPROVED`, uploading required compliance documents as they're requested.
6. **Manage Applications (Staff)** — Home Admins review documents, manage program listings, and advance or reject applications with a mandatory reason; Host Coordinators track and manage applications for their own university; Super Admins verify administrator accounts.

---

## F. Features

**1. User Authentication & Role-Based Access**
Secure login and registration with JWT token management. Four roles — Student, Home Admin, Host Coordinator, Super Admin — each routed to a scoped dashboard, with a dedicated Super Admin login path. Tokens stored in localStorage; Axios instance auto-attaches Authorization headers and silently refreshes expired tokens.

**2. University & Program Browsing**
Public, unauthenticated catalog with search, country, and language filters. University cards show GPA requirements and program counts at a glance; detail pages show admissions requirements and available programs. Travel advisory badges populated by a backend scraper.

**3. Application Management**
Students can track multiple concurrently active applications at once, each with a live pipeline status and stage counter. Each application moves through a strict, server-validated pipeline that cannot skip a stage.

**4. Compliance Document Vault**
Per-application document tracking (passport scan, bank statement, transcript, and more), each independently `PENDING`, `AWAITING_REVIEW`, `APPROVED`, or `ACTION_REQUIRED`, with inline upload/re-upload.

**5. Admin Review Desk**
Split-panel view — a filterable applicant queue with live status counters (Total, Submitted, Under Review, Host Review, Approved) alongside full document inspection. A mandatory-reason safety guardrail disables rejecting an application or flagging a document until a real correction reason is typed.

**6. Program Management**
A dedicated admin tab for adding, editing, and deleting university programs, separate from the application review queue.

**7. Host Coordinator Dashboard**
Live placement tracking for the coordinator's own university — applicant queue with status counters (Submitted, Under Review, Compliance Phase, Approved), searchable and filterable by student or program.

**8. Super Admin Dashboard**
System-level oversight for verifying and managing administrator accounts across the platform.

**9. Notifications**
In-app notification system with a live unread-count badge in the header.

**10. Admin University Registration**
Home Admins can register new partner universities directly from the review desk, with client-side GPA and language validation matching the backend's own rules.

**11. Landing & Auth Pages**
Hero section with tagline "Study Abroad, Backed by an Institution You Can Trust," a public partner university catalog, and a redesigned split-panel login/register experience with role-specific registration fields.

---

## G. Project Structure

**Frontend**
```text
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios instance, JWT interceptors, endpoint calls
│   │   ├── students.js        # Student-facing API wrappers
│   │   ├── admin.js           # Admin-facing API wrappers
│   │   ├── hostcoord.js       # Host Coordinator API wrappers
│   │   ├── public.js          # Unauthenticated catalog endpoints
│   │   └── utils.js           # Shared response-normalizing helpers
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── ExploreCatalog.jsx
│   │   │   ├── UniversityDetail.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── AdminReviewDesk.jsx
│   │   │   ├── HostCoordinatorDashboard.jsx
│   │   │   ├── SuperAdminDashboard.jsx
│   │   │   └── shared/DashboardUI.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── DashboardLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   └── auth/
│   │       ├── LoginPage.jsx
│   │       ├── SuperAdminLoginPage.jsx
│   │       └── RegisterPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── .env
├── index.html
├── vite.config.js
└── package.json
```

**Backend**
```text
backend/
├── users/              # Custom user model (Student / Home Admin / Host Coordinator), auth views
├── universities/        # University, Program models + travel advisory scraper
├── applications/         # Application, DocumentChecklist, CreditTransferLog
├── notifications/        # In-app notification system
├── core_backend/
│   ├── settings.py
│   └── urls.py           # /api/v1/ route mounting
├── manage.py
└── requirements.txt
```

---

## H. Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router Dom |
| HTTP Client | Axios (JWT interceptors) |
| Icons | lucide-react |
| Backend Framework | Django REST Framework |
| Authentication | Simple JWT |
| Database | PostgreSQL |
| Deployment (Backend) | Render |
| Deployment (Frontend) | Vercel |

---

## I. Screenshots

**Landing Page**
Public, unauthenticated catalog of partner universities with search and filter functionality.
![Landing Page](./images/landing-page.png%20images.png)


**Login Page**
Secure login page with role-based redirection and Super Admin access path.
![Login Page](./images/login-page.png%20images.png)

**Student Dashboard**
Application pipeline tracker and pre-application catalog where students can browse and apply to universities.
![Student Dashboard](./images/student-dashboard.png%20images.png)

**Admin Review Desk**
Split-panel document inspection with applicant queue and full document verification interface.
![Admin Review Desk](./images/admin-review-desk.png%20images.png)

**Program Management**
Admin interface for managing university programs with add, edit, and delete functionality.
![Program Management](./images/program-management.png%20images.png)

**University Detail Page**
Detailed view of a university showing programs, requirements, and admissions information.
![University Detail Page](./images/university-detail.png%20images.png)

**Host Coordinator Dashboard**
Placement tracking dashboard for managing inbound student applications.
![Host Coordinator Dashboard](./images/host-coordinator.png%20images.png)

**Super Admin Dashboard**
System oversight dashboard for verifying and managing administrator accounts.
![Super Admin Dashboard](./images/super-admin.png%20images.png)

---

## J. Deployment Links

| Environment | URL |
|---|---|
| Frontend (Vercel) | https://frontend-theta-bay-81.vercel.app |
| Backend (Render) | https://backend-system-of-globalscholar-1.onrender.com |

---

## K. License
This project is developed for educational purposes as part of the GlobalScholar academic exchange platform.

© 2026 GlobalScholar — International Academic Exchange Network