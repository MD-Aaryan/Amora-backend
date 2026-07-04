# AMORA Backend Architecture (STRICT)

## 1. Purpose

This backend is designed for AMORA, a video-based beauty platform with roles:
- customer
- creator
- salon
- admin

It must support 1000+ concurrent users with stable performance.

---

## 2. Golden Rules (DO NOT BREAK)

- Do NOT change architecture without updating this file
- Do NOT introduce new databases or services
- Do NOT store media files in backend or database
- Do NOT write business logic inside controllers
- Do NOT skip pagination in list APIs
- Do NOT bypass service layer
- Do NOT create duplicate or unnecessary modules

---

## 3. Tech Stack (FIXED)

### Backend
- NestJS (TypeScript)

### Database
- PostgreSQL

### ORM
- Prisma (ONLY allowed ORM)

### Cache
- Redis

### Media Storage
- Cloudinary ONLY

### Queue System
- BullMQ (Redis based only)

---

## 4. Architecture Pattern

We follow layered architecture:

Controller → Service → Repository → Database

### Rules:
- Controller: request/response only
- Service: business logic only
- Repository: Prisma DB queries only

No direct DB calls in controllers.

---

## 5. Project Structure (MANDATORY)

Each module must follow:

/modules/<feature>/
  ├── controller.ts
  ├── service.ts
  ├── repository.ts
  ├── dto/
  ├── interfaces/

### Allowed modules only:
- auth
- user
- video
- feed
- upload
- notification
- admin

No extra modules unless approved.

---

## 6. Database Rules

- Every table must include:
  - id (UUID)
  - createdAt
  - updatedAt

### Required indexing:
- userId
- role
- createdAt
- foreign keys

### Forbidden:
- storing video/image binary data
- large JSON blobs without reason
- duplicate unnecessary data across tables

---

## 7. API Design Rules

Base path:
/api/v1/


### REST Only

- GET → fetch data
- POST → create data
- PUT → full update
- PATCH → partial update
- DELETE → remove

---

### Pagination (MANDATORY)

All list APIs MUST use:


?limit=10&cursor=abc123


No API is allowed to return full datasets.

---

## 8. Feed System Rules (CRITICAL)

Feed must NEVER be computed with heavy joins in real-time.

Allowed approaches:
1. Redis cached feed (preferred)
2. Precomputed feed table

Feed must be optimized for fast response.

---

## 9. Performance Rules

### MUST:
- Use Redis caching for:
  - feed
  - trending videos
  - frequently accessed users

- Use async processing for:
  - video uploads
  - thumbnail generation
  - notifications

### MUST NOT:
- perform heavy logic inside request lifecycle
- block API responses with long tasks

---

## 10. Authentication & Authorization

### Auth System:
- Firebase Auth OR JWT (choose one system only)

### Roles:
- customer
- creator
- salon
- admin

### Rules:
- Every protected route must validate role
- No hardcoded bypass allowed

---

## 11. Media Handling (VERY IMPORTANT)

Flow:
Client → Cloudinary Upload → Store URL in DB

### Rules:
- Backend must NEVER store raw media
- Only store URLs in database

---

## 12. Rate Limiting

Must be applied to:
- auth routes
- upload routes
- general API abuse prevention

Limits:
- strict for auth
- moderate for feed
- controlled for uploads

---

## 13. Logging & Monitoring

Must include:
- error logging
- request tracking (dev optional)

Recommended:
- Sentry integration

---

## 14. Scalability Target

System is optimized for:
- 1000 to 10,000 users initially

Supports future scaling via:
- Redis caching
- stateless backend design
- horizontal scaling readiness

---

## 15. AI / Developer Rules

If AI agent is used in this project:

- Follow this file strictly
- Do NOT create new architecture patterns
- Do NOT add new services without approval
- Prefer extending existing modules
- If unsure → ask instead of guessing

---

## 16. Final Rule

This architecture file overrides all assumptions and informal decisions.

If something is not mentioned here → it is NOT allowed by default.