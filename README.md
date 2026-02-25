# TaskFlow — Task Management Application

A production-ready, full-stack task management application with JWT authentication, AES-256 payload encryption, and a modern dark-themed UI.

## 🏗️ Architecture

```
┌─────────────────────┐     HTTP-only Cookie      ┌──────────────────────┐
│                     │     (JWT Auth)             │                      │
│   Next.js Frontend  │ ◄──────────────────────── │   Express.js API     │
│   (Vercel)          │                            │   (Render)           │
│                     │     AES-256 Encrypted      │                      │
│   • Login/Register  │     Response Payloads      │   • Auth Routes      │
│   • Task Dashboard  │ ──────────────────────►   │   • Task CRUD Routes │
│   • Route Protection│                            │   • Middleware Stack  │
│                     │                            │                      │
└─────────────────────┘                            └──────────┬───────────┘
                                                              │
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │   MongoDB Atlas      │
                                                   │   • Users Collection │
                                                   │   • Tasks Collection │
                                                   └──────────────────────┘
```

### Tech Stack

| Layer      | Technology          | Purpose                          |
|------------|---------------------|----------------------------------|
| Frontend   | Next.js 15 (App Router) | SSR, Route protection, UI     |
| Backend    | Express.js          | REST API, Business logic         |
| Database   | MongoDB Atlas       | Document storage                 |
| Auth       | JWT + bcrypt        | Stateless auth, Password hashing |
| Encryption | AES-256 (CryptoJS) | Payload encryption               |
| Security   | Helmet, CORS        | HTTP headers, Cross-origin       |
| Validation | express-validator   | Input sanitization               |

## 🔐 Security Features

- **JWT in HTTP-only cookies** — Tokens stored in cookies with `HttpOnly`, `Secure`, `SameSite` flags (prevents XSS token theft)
- **Password hashing** — bcrypt with 12 salt rounds
- **AES-256 encryption** — All sensitive response payloads (user data, tasks) are encrypted
- **Helmet.js** — Sets secure HTTP headers automatically
- **Input validation** — Server-side validation with express-validator on all endpoints
- **NoSQL injection prevention** — Regex characters escaped in search queries
- **User scoping** — All task queries scoped to authenticated user's ID (authorization)
- **Body size limit** — 10KB JSON body limit to prevent payload attacks

## 📦 Project Structure

```
├── server/                    # Express.js Backend
│   └── src/
│       ├── config/            # Database & environment config
│       ├── controllers/       # Request handlers
│       ├── middleware/        # Auth, validation, error handling
│       ├── models/            # Mongoose schemas
│       ├── routes/            # API route definitions
│       ├── utils/             # Encryption utilities
│       └── index.js           # Entry point
├── client/                    # Next.js Frontend
│   └── src/
│       ├── app/               # Pages (App Router)
│       │   ├── login/         # Login page
│       │   ├── register/      # Register page
│       │   └── dashboard/     # Protected dashboard
│       ├── lib/               # API client, Auth context
│       └── middleware.ts      # Route protection
└── README.md
```

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)

### 1. Clone & Install

```bash
git clone <repository-url>
cd task-manager

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables

**Server** (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskmanager
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
AES_SECRET=your_aes_secret_key_minimum_32_characters
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Client** (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AES_SECRET=your_aes_secret_key_minimum_32_characters
```

> ⚠️ **Important**: `AES_SECRET` must be identical in both server and client `.env` files.

### 3. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📡 API Documentation

Base URL: `/api`

### Auth Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": "U2FsdGVkX1+..." // AES-encrypted user data
}
```
*Sets `token` HTTP-only cookie*

#### POST `/api/auth/login`
Authenticate and receive JWT cookie.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": "U2FsdGVkX1+..." // AES-encrypted: { id, name, email }
}
```

#### POST `/api/auth/logout`
Clear JWT cookie.

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/me`
Get current authenticated user.

**Response** `200 OK`:
```json
{
  "success": true,
  "data": "U2FsdGVkX1+..." // AES-encrypted user data
}
```

---

### Task Endpoints (All require authentication via cookie)

#### GET `/api/tasks`
List tasks with pagination, filtering, and search.

**Query Parameters:**
| Param    | Type   | Default | Description                      |
|----------|--------|---------|----------------------------------|
| page     | number | 1       | Page number                      |
| limit    | number | 10      | Items per page (max 50)          |
| status   | string | —       | Filter: `todo`, `in-progress`, `done` |
| search   | string | —       | Search by title (case-insensitive) |

**Response** `200 OK`:
```json
{
  "success": true,
  "data": "U2FsdGVkX1+..." // AES-encrypted: { tasks: [...], pagination: { currentPage, totalPages, totalTasks, limit, hasNextPage, hasPrevPage } }
}
```

#### POST `/api/tasks`
Create a new task.

**Request:**
```json
{
  "title": "Build feature X",
  "description": "Implement the new dashboard widget",
  "status": "todo"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": "U2FsdGVkX1+..." // AES-encrypted task object
}
```

#### PUT `/api/tasks/:id`
Update a task.

**Request:**
```json
{
  "title": "Updated title",
  "status": "in-progress"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": "U2FsdGVkX1+..." // AES-encrypted updated task
}
```

#### DELETE `/api/tasks/:id`
Delete a task.

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

### Error Response Format
All errors follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    { "field": "email", "message": "Please provide a valid email" }
  ]
}
```

**HTTP Status Codes Used:**
| Code | Meaning              |
|------|----------------------|
| 200  | Success              |
| 201  | Created              |
| 400  | Bad Request          |
| 401  | Unauthorized         |
| 404  | Not Found            |
| 409  | Conflict (duplicate) |
| 500  | Server Error         |

## 🌐 Deployment

### Backend → Render
1. Create new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add all environment variables from `server/.env`

### Frontend → Vercel
1. Import project on [Vercel](https://vercel.com)
2. Set **Root Directory** to `client`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
   - `NEXT_PUBLIC_AES_SECRET` = same AES secret as backend

## 📝 License

MIT
