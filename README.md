<picture>amora_logo.png</picture>

# AMORA Backend

A scalable backend for a beauty ecosystem — built with NestJS, PostgreSQL, Firebase Auth, and Cloudinary.

---

## Tech Stack

| Category   | Technology                        |
| ---------- | --------------------------------- |
| Runtime    | Node.js 20+                       |
| Framework  | NestJS 11 (TypeScript)            |
| Database   | PostgreSQL 15+ (Supabase)         |
| ORM        | Prisma 7                          |
| Auth       | Firebase Authentication + JWT     |
| Media      | Cloudinary                        |
| Validation | class-validator + class-transformer |
| Docs       | Swagger (OpenAPI)                 |

---

## Prerequisites

Install these on your system before proceeding:

| Tool           | Version | Purpose                       |
| -------------- | ------- | ----------------------------- |
| Node.js        | 20+     | JavaScript runtime            |
| npm            | 10+     | Package manager               |
| PostgreSQL     | 15+     | Database                      |
| Git            | Latest  | Version control               |
| Firebase Project | —      | Authentication                |
| Cloudinary Account | —   | Media storage                 |

### Verify Installations

```bash
node --version   # v20.x or higher
npm --version    # v10.x or higher
psql --version   # psql 15.x or higher
git --version    # git 2.x or higher
```

---

## Getting Started (Local Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/amora-backend.git
cd amora-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL Database

Create a database locally or use a remote instance (Supabase recommended).

```bash
# Option A: Local PostgreSQL
psql -U postgres
CREATE DATABASE amora;
\q

# Option B: Supabase (cloud)
# Create a project at https://supabase.com, copy the connection string.
```

### 4. Configure Environment Variables

Copy the example file and fill in every field:

```bash
cp .env.example .env
```

Then edit `.env` with your values:

```env
# ─── Database ──────────────────────────────────────────
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/amora?schema=public"

# ─── JWT ───────────────────────────────────────────────
JWT_SECRET=your-strong-random-secret-min-32-chars
JWT_REFRESH_SECRET=your-strong-random-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# ─── Firebase ──────────────────────────────────────────
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# ─── Cloudinary ────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_AVATAR_FOLDER=amora/avatars
CLOUDINARY_THUMBNAIL_FOLDER=amora/thumbnails
CLOUDINARY_VIDEO_FOLDER=amora/videos

# ─── App ───────────────────────────────────────────────
APP_URL=http://localhost:3001
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# ─── Rate Limiting ─────────────────────────────────────
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=20

# ─── Sessions ──────────────────────────────────────────
MAX_SESSIONS_PER_USER=10
JWT_REFRESH_EXPIRY_DAYS=30

# ─── Video Upload Limits ───────────────────────────────
VIDEO_MAX_SIZE_MB=200
THUMBNAIL_MAX_SIZE_MB=5
ALLOWED_VIDEO_TYPES=video/mp4,video/quicktime,video/webm
ALLOWED_THUMBNAIL_TYPES=image/jpeg,image/png,image/webp

# ─── Admin Emails (comma-separated) ────────────────────
ADMIN_EMAILS=admin@example.com
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables defined in `prisma/schema.prisma`.

### 6. Seed Initial Roles

```bash
npm run prisma:seed
```

Seeds the four roles: `CUSTOMER`, `CREATOR`, `SALON`, `ADMIN`.

### 7. Start the Development Server

```bash
npm run start:dev
```

The server starts at `http://localhost:3000`.

### 8. Verify It Works

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Swagger docs (open in browser)
open http://localhost:3000/docs/api
```

---

## Available Scripts

| Script              | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run start:dev` | Start dev server with hot-reload     |
| `npm run build`     | Compile to JavaScript                |
| `npm run start:prod`| Run compiled production build        |
| `npm run lint`      | Lint all TypeScript files            |
| `npm run format`    | Format code with Prettier            |
| `npm test`          | Run unit tests                       |
| `npm run test:e2e`  | Run end-to-end tests                 |
| `npm run prisma:seed` | Seed roles into database          |
| `npx prisma studio` | Open Prisma database UI              |

---

## API Documentation

Once the server is running, visit:

```
http://localhost:3000/docs/api
```

Swagger UI provides interactive API documentation with try-it-out functionality for every endpoint.

---

## Architecture

```
Request → Controller → Service → Repository → Prisma → PostgreSQL
```

- **Controllers** — handle HTTP requests/responses only
- **Services** — contain business logic
- **Repositories** — Prisma database queries only

### Core Modules

| Module      | Purpose                              |
| ----------- | ------------------------------------ |
| Auth        | Signup, login, JWT, refresh tokens, role management |
| Users       | Profile, avatar, watch history, saved videos, follow |
| Video       | Upload, draft, publish, edit, delete |
| Feed        | Home feed, category/creator/salon feeds (cursor paginated) |
| Watch       | Video playback, view tracking        |
| Social      | Likes, comments, shares              |
| Search      | Full-text search, suggestions, history |
| Creator     | Creator profile, dashboard, analytics |
| Salon       | Salon profile, dashboard, services   |
| Admin       | User/creator/salon management, moderation, categories, reports |
| Cloudinary  | Image & video upload to Cloudinary   |
| Firebase    | Auth verification, push notifications |

---

## Role System

| Role       | Description                           |
| ---------- | ------------------------------------- |
| CUSTOMER   | Watch videos, like, comment, follow   |
| CREATOR    | Upload & manage videos, view analytics |
| SALON      | Manage salon profile & services       |
| ADMIN      | Full platform management & moderation |

Users can hold multiple roles and switch between them via the `switch-role` API.

---

## Deployment

### Build for Production

```bash
npm run build
```

### Run Production Server

```bash
npm run start:prod
```

For production deployment:

1. Set `NODE_ENV=production`
2. Use a process manager (PM2, systemd)
3. Configure reverse proxy (Nginx, Caddy) with SSL
4. Set up PostgreSQL and run migrations
5. Configure all environment variables

---

## Project Structure

```
src/
├── admin/          # Admin panel (users, creators, salons, moderation, categories, reports)
├── auth/           # Authentication (signup, login, JWT, refresh, roles)
├── cloudinary/     # Cloudinary media upload
├── common/         # Shared (decorators, guards, interceptors, filters, enums, utils)
├── creator/        # Creator features (profile, dashboard, apply)
├── database/       # Prisma service & module
├── feed/           # Home feed & filtered feeds (cursor paginated)
├── firebase/       # Firebase Auth & push notifications
├── salon/          # Salon features (profile, dashboard, services, apply)
├── search/         # Full-text search, discovery, history
├── sessions/       # Session & refresh token management
├── social/         # Likes, comments, shares, saved videos
├── users/          # User profile, avatar, watch history, follow
├── video/          # Video CRUD, draft workflow, thumbnails
├── watch/          # Video playback tracking
├── app.module.ts   # Root module
└── main.ts         # Entry point (Helmet, CORS, Swagger, ValidationPipe)
```

---

## Environment Variables Reference

| Variable                  | Required | Default              | Description                        |
| ------------------------- | -------- | -------------------- | ---------------------------------- |
| `DATABASE_URL`            | ✅       | —                    | PostgreSQL connection string       |
| `JWT_SECRET`              | ✅       | —                    | JWT signing secret                 |
| `JWT_REFRESH_SECRET`      | ✅       | —                    | Refresh token signing secret       |
| `FIREBASE_WEB_API_KEY`    | ✅       | —                    | Firebase Web API key               |
| `FIREBASE_PROJECT_ID`     | ✅       | —                    | Firebase project ID                |
| `FIREBASE_CLIENT_EMAIL`   | ✅       | —                    | Firebase service account email     |
| `FIREBASE_PRIVATE_KEY`    | ✅       | —                    | Firebase private key               |
| `CLOUDINARY_CLOUD_NAME`   | ✅       | —                    | Cloudinary cloud name              |
| `CLOUDINARY_API_KEY`      | ✅       | —                    | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`   | ✅       | —                    | Cloudinary API secret              |
| `PORT`                    | ❌       | `3000`               | Server port                        |
| `CORS_ORIGINS`            | ❌       | localhost:3000,3001  | Allowed CORS origins               |
| `THROTTLE_TTL_MS`         | ❌       | `60000`              | Rate limit window (ms)             |
| `THROTTLE_LIMIT`          | ❌       | `20`                 | Max requests per window            |
| `ADMIN_EMAILS`            | ❌       | —                    | Auto-promote these emails to ADMIN |
| `VIDEO_MAX_SIZE_MB`       | ❌       | `200`                | Max video upload size (MB)         |
| `THUMBNAIL_MAX_SIZE_MB`   | ❌       | `5`                  | Max thumbnail size (MB)            |

---

## License

MIT
