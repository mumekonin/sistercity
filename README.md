# Sister City Web Portal  Adama & Aurora

A collaborative digital platform enabling the sister-city partnership between **Adama City** and **Aurora City** to manage joint projects, official communication, shared budgets, documents, events, and public news from a single, role-based portal.

---

## 🔗 Live Demo

| Service | URL |
|---|---|
| **Frontend** | [https://sistercity.vercel.app/](https://sistercity.vercel.app/) |
| **Backend API** | [https://sistercity.onrender.com](https://sistercity.onrender.com) |
---

## 🧪 Test Credentials

The system supports four roles with different permission levels. Use the accounts below to explore the portal from each perspective.

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@gmail.com` | `12345678` | Full access — both cities |
| **City Admin (Adama)** | `adama@gmail.com` | `12345678` | Manages Adama City only |
| **City Admin (Aurora)** | `aurora@gmail.com` | `12345678` | Manages Aurora City only |
| **Dept Officer (Adama)** | `adamaDpt@gmail.com` | `12345678` | Limited to own department, Adama City |
---

## ✨ Core Features

| # | Module | Description |
|---|---|---|
| 1 | **Authentication & Users** | JWT-based auth, bcrypt password hashing, account lockout after 5 failed attempts, role-based access control |
| 2 | **City Profiles** | Official identity card for each city — key officials, departments, population data, partnership history |
| 3 | **Projects, Tasks & Issues** | End-to-end lifecycle for joint projects: proposal → approval → milestones → tasks → issue tracking |
| 4 | **Document Sharing** | Versioned document uploads with approval workflow, access levels, and activity logging |
| 5 | **Official Communication** | Formal inter-department messaging with reference numbers, threading, priority-based response deadlines, and escalation |
| 6 | **Events & Meetings** | Shared calendar, RSVP tracking, agenda management, and joint meeting minutes requiring dual-city confirmation |
| 7 | **Budget & Equipment** | Dual-city budget planning, expenditure tracking with receipts, and shared equipment/resource logs |
| 8 | **News & Announcements** | Public-facing news feed with joint-approval workflow for shared announcements |
| 9 | **Notifications & Search** | Automatic in-app notifications for key events, plus global cross-module search |
| 10 | **Reports** | Generate and export partnership progress, budget, and activity reports (PDF/Excel) |

---

## 🏗️ Tech Stack

**Frontend**
- React (TypeScript)
- React Router
- Axios

**Backend**
- NestJS (TypeScript)
- MongoDB with Mongoose
- JWT Authentication
- bcrypt

**Deployment**
- Frontend: [Vercel](https://vercel.com)
- Backend: [Render](https://render.com)

---

## 👥 User Roles

| Role | Code | Description |
|---|---|---|
| Super Admin | `SUPER_ADMIN` | Manages the entire portal across both cities |
| City Admin | `CITY_ADMIN` | Manages their own city's data, users, and approvals |
| Dept Officer | `DEPT_OFFICER` | Staff-level access, scoped to their own department |
| Public | `PUBLIC` | No login required — access to public news, events, and city profiles only |

---

```

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- MongoDB instance (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run the backend:

```bash
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

---

## 📖 API Documentation

The backend exposes **63 REST endpoints** across 10 feature modules (Auth, City Profiles, Projects, Documents, Communication, Events, Budget & Equipment, News, Notifications & Search, and Reports). Every protected route requires a valid JWT in the `Authorization: Bearer <token>` header, obtained via `POST /auth/login`.

For the full schema and endpoint reference, see the project's API specification document.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

---

## 👤 Author

**Mulualem Mekonnen**
