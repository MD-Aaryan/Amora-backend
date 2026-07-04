# AMORA Backend Project Structure (NestJS)

## 1. Overview

This document defines the ONLY allowed folder structure for AMORA backend.

It ensures:
- scalability for 1000+ users
- clean modular architecture
- no random code placement
- predictable AI agent behavior

---

## 2. Root Structure


/src
/modules
/common
/config
/database
main.ts
app.module.ts


---

## 3. Core Principles

- Every feature MUST be a module
- No business logic outside modules
- No random utility dumping in root
- No duplication of logic across modules
- Shared logic goes ONLY in /common

---

## 4. Modules Structure (STRICT RULE)

Each feature must follow:


/modules/<feature>/
├── controller.ts
├── service.ts
├── dto/
├── interfaces/
├── guards/ (if needed)
├── pipes/ (if needed)


---

## 5. Allowed Modules (ONLY THESE)


auth
user
video
feed
upload
like
comment
follow
notification
admin


❌ No new modules unless explicitly added to ARCHITECTURE.md

---

## 6. /common Directory (SHARED LOGIC ONLY)


/common
├── decorators/
├── filters/
├── guards/
├── interceptors/
├── utils/
├── constants/
├── enums/


### Rules:
- No business logic here
- Only reusable helpers

---

## 7. /config Directory


/config
├── database.config.ts
├── redis.config.ts
├── cloudinary.config.ts
├── app.config.ts


### Rules:
- Only environment & service configs
- No logic allowed

---

## 8. /database Directory


/database
├── prisma.service.ts
├── prisma.module.ts
├── migrations/
├── seed.ts


### Rules:
- Prisma is the ONLY ORM layer
- No raw SQL unless necessary optimization

---

## 9. Module Responsibilities

### Controller
- Handle HTTP requests
- Call service only
- No business logic

### Service
- Business logic only
- Calls repository

### Repository
- Prisma database queries only

---

## 10. Data Flow Pattern


Request → Controller → Service → Repository → Prisma → Database


No shortcuts allowed.

---

## 11. Shared Rules Across Project

### MUST:
- Use DTO validation for all inputs
- Use pagination for all list endpoints
- Use async/await everywhere
- Keep functions small and single-purpose

### MUST NOT:
- No logic in controllers
- No direct DB access outside repository
- No large monolithic services
- No duplicate code across modules

---

## 12. Upload Handling

- Upload module ONLY handles:
  - receiving file metadata
  - sending to Cloudinary

- Actual file storage:
  → Cloudinary ONLY

- DB stores only URL

---

## 13. Feed System Rule

Feed module MUST:
- use Redis caching OR precomputed feed
- avoid heavy joins
- avoid real-time computation

---

## 14. Scalability Rules

This structure supports:
- 1000–10,000 users easily
- horizontal scaling
- microservice migration in future

---

## 15. AI / Developer Enforcement Rules

If AI agent is used:

- MUST follow folder structure strictly
- MUST NOT create new folders outside rules
- MUST NOT bypass module boundaries
- MUST reuse existing modules instead of duplicating logic
- If unsure → STOP and ask

---

## 16. FINAL RULE

If a file or folder is not defined here:
👉 It is NOT allowed by default.