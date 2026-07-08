# GlobalScholar - Frontend & Backend

## A. Contributor
Isaac Igohe

## B. Overview
GlobalScholar is an international academic exchange management system, built with a Django REST Framework backend and a React + Vite frontend, deployed on Render.

The system supports three distinct user roles — **Student**, **Home Admin**, and **Host Coordinator** — each with a dedicated dashboard tailored to their responsibilities in the exchange process. A public, unauthenticated Explore Catalog also lets prospective students browse partner universities before creating an account.

Students can browse partner universities and programs, submit applications, and track them through a strict pipeline while uploading required compliance documents. Home Admins review submitted applications, verify or flag documents, and advance or reject them. Host Coordinators track inbound student placements and logistics once an application is approved.

## C. Requirements
The following software should be installed before running the project:

- Node.js v18+
- npm or yarn
- Python 3.10+
- PostgreSQL (or use SQLite for local development)
- GlobalScholar Backend (running locally or deployed on Render)

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

## E. Usage
1. **User Registration** — Students can register for an account to apply to universities; Home Admin and Host Coordinator accounts are role-assigned.
2. **Login** — Sign in using registered credentials. Role-based access determines the dashboard and available actions.
3. **Browse Universities** — View partner universities and programs, filtered by country and language, with travel advisory badges shown live.
4. **Apply to a University** — Select a university and submit an application, which enters the pipeline as `DRAFT`.
5. **Track & Upload Documents** — Follow application progress through `SUBMITTED → UNDER_REVIEW → COMPLIANCE_PHASE → APPROVED`, uploading required compliance documents as they're requested.
6. **Manage Applications (Staff)** — Home Admins review documents and advance or reject applications with a mandatory reason; Host Coordinators track approved placements and arrival logistics.

## F. Features

**1. User Authentication & Role-Based Access**
Secure login and registration with JWT token management. Three roles — Student, Home Admin, Host Coordinator — each routed to a scoped dashboard. Tokens stored in localStorage; Axios instance auto-attaches Authorization headers and silently refreshes expired tokens.

**2. University & Program Browsing**
Public, unauthenticated catalog with search, country, and language filters. University detail pages show admissions requirements and available programs. Travel advisory badges populated by a backend scraper.

**3. Application Management**
Students can track two or more concurrently active applications at once. Each application moves through a strict, server-validated pipeline that cannot skip a stage.

**4. Compliance Document Vault**
Per-application document tracking (passport scan, bank statement, transcript, and more), each independently `PENDING`, `AWAITING_REVIEW`, `APPROVED`, or `ACTION_REQUIRED`, with inline upload/re-upload.

**5. Admin Review Desk**
Split-panel view — a filterable applicant queue alongside full document inspection. A mandatory-reason safety guardrail disables rejecting an application or flagging a document until a real correction reason is typed.

**6. Host Coordinator Dashboard**
Placement tracking view with summary metric cards for inbound students, arrival state, and logistics checklists. *(Currently running on illustrative sample data — see note below.)*

**7. Admin University Registration**
Home Admins can register new partner universities directly from the review desk, with client-side GPA and language validation matching the backend's own rules.

**8. Landing Page**
Hero section with tagline "Study Abroad, Backed by an Institution You Can Trust," a public partner university catalog, and clear sign-in/create-account calls to action.

## G. Project Structure

**Frontend**
```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios instance, JWT interceptors, endpoint calls
│   │   ├── students.js        # Student-facing API wrappers
│   │   ├── admin.js           # Admin-facing API wrappers
│   │   ├── public.js          # Unauthenticated catalog endpoints
│   │   └── utils.js           # Shared response-normalizing helpers
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── ExploreCatalog.jsx
│   │   │   ├── UniversityDetail.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── AdminReviewDesk.jsx
│   │   │   ├── HostCoordinatorDashboard.jsx
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
│   │       └── RegisterPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── .env
├── index.html
├── vite.config.js
└── package.json
```

**Backend**
```
backend/
├── users/              # Custom user model (Student / Home Admin / Host Coordinator), auth views
├── universities/        # University, Program models + travel advisory scraper
├── applications/         # Application, DocumentChecklist, CreditTransferLog
├── config/
│   └── urls.py          # /api/v1/ route mounting
├── manage.py
└── requirements.txt
```

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

## I. Screenshots

**Landing Page**
Public, unauthenticated catalog of partner universities.
![Landing page](./images/landing-page.png)

**Student Dashboard**
Application pipeline tracker and pre-application catalog.
![Student dashboard](./images/student-dashboard.png)

**Admin Review Desk**
Split-panel document inspection with the mandatory-reason guardrail open.
![Admin review desk](./images/admin-review-desk.png)

**Host Coordinator Dashboard**
Placement tracking with summary metric cards.
![Host coordinator dashboard](./images/host-coordinator.png)