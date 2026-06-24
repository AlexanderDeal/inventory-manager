# Inventory Manager

A full-stack university inventory management system with role-based access control, built as a portfolio project.

**[Live Demo](https://inventory-manager-demo.netlify.app)** · **[API Docs](https://inventory-manager-api-9mjl.onrender.com/docs)**

> ⚠️ The backend runs on Render's free tier and may take 30–60 seconds to wake up on first load.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@university.edu` | `password123` |
| Student | `student@university.edu` | `password123` |

---

## Features

- **Authentication** — JWT-based login with bcrypt password hashing
- **Role-based access** — Student, Staff, and Admin roles with different permissions
- **Inventory** — Browse, search, filter, and sort items by type, availability, and department
- **Three item types** — Loanable (free borrow with due date), Rentable (daily rate), Purchasable (balance deduction)
- **Item images** — Staff and admins can upload photos stored as base64 in the database
- **Balance system** — Users have a balance; purchases and rentals deduct from it
- **Overdue detection** — Active loans past their due date are flagged with an overdue badge
- **Analytics dashboard** — Loan trends, item type breakdown, most active users (admin only)
- **Toast notifications** — Feedback on every action (borrow, rent, buy, return)
- **Skeleton loading** — Loading states on all pages
- **Mobile responsive** — Filter sidebar collapses to a toggle on small screens

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS v4
- React Router v6
- Axios

**Backend**
- FastAPI (Python)
- SQLAlchemy ORM
- Alembic migrations
- JWT authentication (python-jose)
- bcrypt password hashing

**Database**
- PostgreSQL (Supabase)

**Deployment**
- Frontend: Netlify
- Backend: Render
- Database: Supabase

---

## Local Setup

**Backend**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # add your DATABASE_URL and SECRET_KEY
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Screenshots
<img width="1257" height="1341" alt="Screenshot 2026-06-23 185940" src="https://github.com/user-attachments/assets/0b18c3e9-0522-4d77-9ee4-c0f53110ecb2" />
<img width="1270" height="1340" alt="Screenshot 2026-06-23 185913" src="https://github.com/user-attachments/assets/eafb2ec1-45d9-437b-b935-4a3a0556510b" />
<img width="1274" height="761" alt="Screenshot 2026-06-23 185856" src="https://github.com/user-attachments/assets/b0be18a9-ec23-434f-ad30-63069dd29315" />

