# ResolveX CMS - Backend Server (Fastify + TypeScript + Prisma + PostgreSQL)

Production-grade, Redis-free Complaint Management System backend architecture.

## Tech Stack
- **Framework**: Fastify 5.x (blazing fast, low overhead)
- **Language**: TypeScript with ES2022 / NodeNext
- **ORM**: Prisma ORM 6.x
- **Database**: PostgreSQL
- **Documentation**: OpenAPI 3.0 & Swagger UI at `/docs`
- **Validation**: Zod
- **Auth**: JWT via `@fastify/jwt` + bcryptjs password hashing
- **SLA Engine**: In-process recurrent ticker (zero external Redis dependency)

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database instance running locally or on cloud (e.g. Neon, Supabase, Railway, Docker)

### 2. Setup Environment
```bash
cd server
copy .env.example .env
```
Update `DATABASE_URL` in `.env` to your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cms_v2_db?schema=public"
```

### 3. Install Dependencies & Generate Prisma Client
```bash
cd server
npm install
npx prisma db push
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
The server will boot up at:
- **API Base**: `http://localhost:5000`
- **Swagger Interactive Documentation**: `http://localhost:5000/docs`
- **Health Check**: `http://localhost:5000/health`

---

## Pre-seeded Accounts (For College Viva & Demo)
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@college.edu` | `Password@123` |
| **Staff (IT)** | `alex.staff@college.edu` | `Password@123` |
| **Staff (Hostel)** | `priya.staff@college.edu` | `Password@123` |
| **Student** | `student.rahul@college.edu` | `Password@123` |

---

## Key API Endpoints
- `POST /api/auth/register` - Create user profile
- `POST /api/auth/login` - Authenticate & obtain JWT
- `GET /api/auth/me` - Authenticated user details
- `GET /api/tickets` - List tickets (with filters: status, category, priority, search)
- `GET /api/tickets/stats` - Analytics counters for dashboard
- `GET /api/tickets/:id` - Full ticket details with comments and audit logs
- `POST /api/tickets` - File a new ticket (auto-computes SLA)
- `PATCH /api/tickets/:id/status` - Transition status + write history log
- `POST /api/tickets/:id/comments` - Post comment / internal note
- `POST /api/tickets/:id/reassign` - Transfer ticket to another staff member
- `POST /api/tickets/:id/propose-resolution` - Staff proposes fix
- `POST /api/tickets/:id/confirm-resolution` - Student confirms resolution
- `POST /api/tickets/:id/reject-resolution` - Student rejects resolution & re-opens
