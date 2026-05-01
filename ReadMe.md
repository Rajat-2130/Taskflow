# TaskFlow — Team Task Management App

A full-stack collaborative project and task management web application built with React, Node.js, Express, and NeDB.

## 🚀 Live Demo
[View on Railway](https://your-app.railway.app) <!-- Update after deployment -->

## ✨ Features
- **User Authentication** — Signup/Login with JWT
- **Project Management** — Create projects, invite members
- **Task Management** — Kanban board + List view with priorities and due dates
- **Role-Based Access** — Admin and Member roles
- **Dashboard** — Stats, task overview, recent activity

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router, Axios |
| Backend | Node.js, Express 5 |
| Database | NeDB (embedded NoSQL) |
| Auth | JWT (jsonwebtoken) |
| Build | Vite |
| Deploy | Railway |

## 📁 Project Structure
```
taskflow/
├── backend/
│   ├── routes/        # auth, projects, tasks, users
│   ├── middleware/    # JWT auth, role checks
│   ├── db/            # NeDB setup
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/     # Dashboard, Projects, ProjectDetail, MyTasks
│   │   ├── components/# Layout, TaskModal, ProjectModal, MembersModal
│   │   ├── api/       # Axios API client
│   │   └── context/   # AuthContext
│   └── index.html
├── package.json
└── railway.json
```

## ⚙️ Local Setup

### Prerequisites
- Node.js >= 18
- npm

### 1. Clone the repo
```bash
git clone https://github.com/Rajat-2130/Taskflow.git
cd Taskflow/taskflow
```

### 2. Install dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Environment variables
Create `backend/.env`:
```env
PORT=3001
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### 4. Run locally
```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

## 🚂 Deployment (Railway)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select this repo
4. Add environment variables:
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = production
5. Railway auto-detects `railway.json` and deploys

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project details |
| POST | `/api/projects/:id/members` | Add member |
| GET | `/api/tasks/project/:id` | Tasks by project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| GET | `/api/tasks/dashboard` | Dashboard stats |

## 👤 Author
Rajat Singh