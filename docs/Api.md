# AMORA API Conventions (REST Standard)

## 1. Overview

This document defines strict API rules for AMORA backend.

All developers and AI agents MUST follow this to ensure:
- consistency
- scalability
- predictable frontend integration
- performance at 1000+ users

---

## 2. Base URL Structure

All APIs MUST use:


/api/v1


No exceptions.

---

## 3. API Design Style

- REST ONLY
- No GraphQL
- No RPC / gRPC
- No hybrid patterns

---

## 4. HTTP Methods Rules

| Method | Use Case |
|--------|----------|
| GET    | Fetch data |
| POST   | Create data |
| PUT    | Full update |
| PATCH  | Partial update |
| DELETE | Remove data |

---

## 5. Response Format (STRICT)

Every API MUST return:

```json id="response-format"
{
  "success": true,
  "message": "string",
  "data": {},
  "error": null
}
Error format:
{
  "success": false,
  "message": "Error description",
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
6. Pagination Rules (MANDATORY)

All list APIs MUST support cursor-based pagination.

Request:
GET /api/v1/videos?limit=10&cursor=abc123
Response:
{
  "success": true,
  "message": "Videos fetched",
  "data": {
    "items": [],
    "nextCursor": "xyz789"
  }
}

Rules:

- NEVER return full dataset
- default limit = 10
- max limit = 50

7. Authentication Rules

Headers:
Authorization: Bearer <token>

Rules:

All protected routes MUST validate token
Unauthorized request returns 401
Expired token returns 403

8. Role-Based Access Control (RBAC)

Roles:
- CUSTOMER
- CREATOR
- SALON
- ADMIN

Rules:
Each endpoint MUST define allowed roles
No role bypass allowed
Backend must enforce roles (not frontend)

9. Standard API Routes

Auth

POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me

Users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

Videos
POST   /api/v1/videos
GET    /api/v1/videos
GET    /api/v1/videos/:id
DELETE /api/v1/videos/:id
Feed
GET /api/v1/feed

Rules:

must be optimized (cached or precomputed)
no heavy DB joins in real-time
Likes
POST   /api/v1/videos/:id/like
DELETE /api/v1/videos/:id/like
Comments
POST   /api/v1/videos/:id/comments
GET    /api/v1/videos/:id/comments
DELETE /api/v1/comments/:id
Follow System
POST   /api/v1/users/:id/follow
DELETE /api/v1/users/:id/follow
Upload
POST /api/v1/upload

Rules:

uploads MUST go directly to Cloudinary
backend only stores URL
10. Validation Rules
All inputs MUST use DTO validation (class-validator)
Never trust frontend input
Reject invalid payload with 400
11. Performance Rules
MUST:
use pagination everywhere
cache feed and trending endpoints
avoid nested heavy DB queries
MUST NOT:
return full collections
block requests with heavy processing
do media processing inside request lifecycle
12. Error Handling Rules
Always return structured error format
Never expose stack traces in production
Use consistent error codes

Example codes:

AUTH_INVALID_TOKEN
USER_NOT_FOUND
VIDEO_NOT_FOUND
PERMISSION_DENIED
13. Security Rules
Rate limit auth routes
Validate all DTO inputs
Sanitize text inputs (comments, titles)
Prevent duplicate actions (likes, follows)
14. Caching Rules (Redis)

Use caching for:

feed data
trending videos
user profile summary

Cache must:

have TTL
be invalidated on updates
15. File Upload Rules
Only accept image/video files
Max size must be enforced
Upload flow:

Client → Cloudinary → Store URL in DB

16. AI / Developer Rules

If AI agent is used:

Follow this file strictly
Do NOT invent new endpoints
Do NOT change response structure
Do NOT skip pagination rules
If unsure → ask before implementing
17. FINAL RULE

If something is not defined here → it is NOT allowed by default.