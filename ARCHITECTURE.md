# TaskFlow — Task Management Application

## Architecture & Technical Documentation

**Live Application**: https://assesment-phi-lilac.vercel.app  
**Backend API**: https://taskflow-api-vnjt.onrender.com  
**GitHub Repository**: https://github.com/sunnythesunless/assesment

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────┐                        ┌──────────────────────────────┐
│                             │     HTTP-only Cookie    │                              │
│   FRONTEND (Next.js 15)     │     (JWT Token)         │   BACKEND (Express.js)       │
│   Deployed on: Vercel       │ ◄─────────────────────► │   Deployed on: Render        │
│                             │     AES-256 Encrypted   │                              │
│   Pages:                    │     Response Payloads   │   Layers:                    │
│   ├── /login                │                         │   ├── Routes                 │
│   ├── /register             │                         │   ├── Auth Middleware        │
│   ├── /dashboard            │                         │   ├── Validation Middleware  │
│   │   ├── Task List         │                         │   ├── Controllers            │
│   │   ├── Create/Edit Modal │                         │   ├── AES Encryption Layer   │
│   │   ├── Search Bar        │                         │   ├── Mongoose ODM           │
│   │   ├── Status Filter     │                         │   └── Error Handler          │
│   │   └── Pagination        │                         │                              │
│   │                         │                         │                              │
│   Security:                 │                         │   Security:                  │
│   ├── Route Protection      │                         │   ├── Helmet.js Headers      │
│   ├── AES Decryption        │                         │   ├── CORS (credentials)     │
│   └── Auth Context          │                         │   ├── bcrypt (12 rounds)     │
│                             │                         │   ├── JWT (HTTP-only cookie) │
│                             │                         │   ├── AES-256 Encryption     │
│                             │                         │   └── Input Validation       │
└─────────────────────────────┘                        └──────────────┬───────────────┘
                                                                      │
                                                                      ▼
                                                       ┌──────────────────────────────┐
                                                       │   DATABASE (MongoDB Atlas)   │
                                                       │                              │
                                                       │   Collections:               │
                                                       │   ├── Users                  │
                                                       │   │   ├── name               │
                                                       │   │   ├── email (unique)      │
                                                       │   │   └── password (hashed)   │
                                                       │   │                           │
                                                       │   └── Tasks                  │
                                                       │       ├── title              │
                                                       │       ├── description        │
                                                       │       ├── status (enum)      │
                                                       │       ├── user (ref, indexed)│
                                                       │       └── createdAt          │
                                                       │                              │
                                                       │   Indexes:                   │
                                                       │   ├── (user, status)         │
                                                       │   └── (user, createdAt)      │
                                                       └──────────────────────────────┘
```

---

## 📁 Project Structure (Monorepo)

```
├── server/                          # Express.js Backend
│   └── src/
│       ├── config/
│       │   ├── db.js                # MongoDB connection
│       │   └── env.js               # Environment validation
│       ├── controllers/
│       │   ├── authController.js    # Register, Login, Logout, GetMe
│       │   └── taskController.js    # CRUD + Pagination + Filter + Search
│       ├── middleware/
│       │   ├── auth.js              # JWT cookie verification
│       │   ├── validate.js          # express-validator middleware
│       │   └── errorHandler.js      # Global error handler
│       ├── models/
│       │   ├── User.js              # User schema + bcrypt hooks
│       │   └── Task.js              # Task schema + compound indexes
│       ├── routes/
│       │   ├── authRoutes.js        # Auth endpoints
│       │   └── taskRoutes.js        # Task endpoints (protected)
│       ├── utils/
│       │   └── encryption.js        # AES-256 encrypt/decrypt
│       └── index.js                 # Express entry point
│
├── client/                          # Next.js 15 Frontend
│   └── src/
│       ├── app/
│       │   ├── layout.tsx           # Root layout + AuthProvider
│       │   ├── page.tsx             # Landing redirect
│       │   ├── login/page.tsx       # Login form
│       │   ├── register/page.tsx    # Registration form
│       │   └── dashboard/page.tsx   # Task dashboard (protected)
│       ├── lib/
│       │   ├── api.ts               # Axios client + AES decryption
│       │   └── auth-context.tsx     # React auth context
│       └── middleware.ts            # Route protection
│
├── README.md                        # Setup + API docs
└── ARCHITECTURE.md                  # This file
```

---

## 🔐 Security Implementation

### Authentication Flow

```
REGISTER/LOGIN                          SUBSEQUENT REQUESTS
─────────────                          ────────────────────
Client sends                           Client sends request
  email + password                       (cookie auto-attached)
       │                                        │
       ▼                                        ▼
Server validates input               Server reads JWT from
       │                               HTTP-only cookie
       ▼                                        │
Server hashes password                Server verifies JWT
  (bcrypt, 12 rounds)                          │
       │                                        ▼
       ▼                               Server attaches user
Server creates JWT                      to req.user
       │                                        │
       ▼                                        ▼
Server sets JWT in                    Server scopes all
  HTTP-only cookie                      queries to user._id
  (Secure, SameSite)                           │
       │                                        ▼
       ▼                               Server encrypts response
Server encrypts user data               with AES-256
  with AES-256                                 │
       │                                        ▼
       ▼                               Client decrypts
Client receives encrypted               response data
  response + cookie
```

### Security Features Table

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| Password Hashing | bcrypt (12 salt rounds) | Protects passwords at rest |
| JWT Storage | HTTP-only cookie | Prevents XSS token theft |
| Cookie Flags | HttpOnly, Secure, SameSite | Defense in depth |
| Payload Encryption | AES-256 (CryptoJS) | Encrypts sensitive response data |
| HTTP Headers | Helmet.js | Sets security headers automatically |
| Input Validation | express-validator | Prevents injection attacks |
| Regex Escaping | Custom sanitization | Prevents NoSQL injection via search |
| Body Size Limit | 10KB JSON limit | Prevents payload attacks |
| User Scoping | All queries filtered by user._id | Authorization enforcement |
| Env Variables | dotenv + validation | No hardcoded secrets |

---

## 📡 API Design

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create new account |
| POST | `/api/auth/login` | ❌ | Authenticate user |
| POST | `/api/auth/logout` | ❌ | Clear JWT cookie |
| GET | `/api/auth/me` | ✅ | Get current user |

### Task Endpoints (All require authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?page=1&limit=10&status=todo&search=keyword` | List tasks (paginated, filterable, searchable) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Sample API Request/Response

**Register:**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}

Response (201 Created):
{
  "success": true,
  "message": "Registration successful",
  "data": "U2FsdGVkX1+..." ← AES-256 encrypted user data
}
+ Sets HTTP-only cookie: token=eyJhbGci...
```

**Create Task:**
```
POST /api/tasks
Cookie: token=eyJhbGci... (auto-sent)
Content-Type: application/json

{
  "title": "Build dashboard",
  "description": "Implement the task management UI",
  "status": "in-progress"
}

Response (201 Created):
{
  "success": true,
  "message": "Task created successfully",
  "data": "U2FsdGVkX1+..." ← AES-256 encrypted task data
}
```

**List Tasks (with pagination + filter + search):**
```
GET /api/tasks?page=1&limit=10&status=todo&search=dashboard
Cookie: token=eyJhbGci... (auto-sent)

Response (200 OK):
{
  "success": true,
  "data": "U2FsdGVkX1+..." ← AES-256 encrypted:
  {
    "tasks": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTasks": 25,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    { "field": "email", "message": "Please provide a valid email" }
  ]
}
```

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not Found |
| 409 | Conflict (duplicate email) |
| 500 | Internal Server Error |

---

## 🛠️ Tech Stack & Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend | Express.js | Lightweight, flexible, industry standard |
| Frontend | Next.js 15 (App Router) | SSR capability, middleware for route protection |
| Database | MongoDB Atlas (Free Tier) | Document-based, great Node.js integration, free hosting |
| Auth Storage | HTTP-only cookie | Prevents XSS token theft (safer than localStorage) |
| Encryption | AES-256 (CryptoJS) | Industry standard symmetric encryption |
| Password Hash | bcryptjs (12 rounds) | Pure JS, no native dependencies for easy deployment |
| Validation | express-validator | Battle-tested, middleware-based validation |
| Deployment | Render + Vercel | Free tiers, auto-deploy from GitHub |

---

## 🚀 Deployment Architecture

```
GitHub Repository (Monorepo)
    │
    ├──── Vercel (Auto-deploy on push)
    │     └── Root: /client
    │     └── Framework: Next.js
    │     └── Env: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_AES_SECRET
    │
    └──── Render (Auto-deploy on push)
          └── Root: /server
          └── Runtime: Node.js
          └── Env: MONGODB_URI, JWT_SECRET, AES_SECRET, CLIENT_URL
```

---

## 📋 Assessment Criteria Mapping

| Criteria (Weight) | Implementation |
|---|---|
| **Code Structure & Clean Architecture (20%)** | Monorepo with `server/` + `client/` separation. MVC pattern: Models → Controllers → Routes. Dedicated middleware layer. Utility modules. |
| **Authentication & Security (20%)** | JWT in HTTP-only cookies, bcrypt-12, AES-256 payload encryption, Helmet.js, CORS with credentials, express-validator, regex escaping |
| **Database Design & Query Handling (15%)** | Compound indexes `(user, status)` and `(user, createdAt)`. Schema validation. Efficient paginated queries with `Promise.all` for data + count |
| **API Design & Error Handling (15%)** | RESTful endpoints, proper status codes (200/201/400/401/404/409/500), structured error JSON, global error handler |
| **Frontend Integration & UX (10%)** | Next.js App Router, React Context for auth, debounced search, client-side route protection, dark theme with glassmorphism |
| **Deployment & DevOps (10%)** | Render + Vercel, environment variables externalized, CORS configured for cross-domain, auto-deploy from GitHub |
| **Documentation & Clarity (10%)** | Complete README, this architecture document, API docs with samples, setup instructions |
