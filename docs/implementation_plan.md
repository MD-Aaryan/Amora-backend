# Implementation Plan: AMORA Authentication Module

This plan details the implementation of the authentication and authorization flows in the NestJS backend for the AMORA Beauty Platform. We will implement Firebase Authentication token verification, NestJS JWT generation, role switching, session tracking, and role-based guards.

---

## User Review Required

> [!IMPORTANT]
> - **Shared JWT Strategy:** The client logs in with Firebase (Google/Email/OTP) and sends a Firebase ID token. The backend validates it and issues a NestJS-signed JWT (15-minute access, 30-day refresh). Future requests use **only** the NestJS JWT.
> - **Refresh Token Security:** Refresh tokens will be cryptographically hashed (using SHA-256 or bcrypt) before being stored in the `sessions` table in the database to prevent compromises.
> - **Role Synchronization:** During login, if the user doesn't exist, we will create the user record in the database, seed/fetch the `customer` role from the `roles` table, and create a junction entry in `user_roles`. The active role is set to `CUSTOMER` by default.

---

## Open Questions

There are no blocking architectural questions. We will use standard NestJS `@nestjs/jwt`, `@nestjs/passport`, and `passport-jwt` libraries for JWT strategy construction.

---

## Proposed Changes

We will create and update the following module files under `src/`:

### 1. Database Integration

We will build a shared database module wrapping the Prisma client.

#### [NEW] [prisma.service.ts](file:///d:/Amora%20project/amora-backend/src/database/prisma.service.ts)
Provides standard Prisma lifecycle hooks (`onModuleInit`) to connect to Supabase/PostgreSQL.

#### [NEW] [prisma.module.ts](file:///d:/Amora%20project/amora-backend/src/database/prisma.module.ts)
Exports `PrismaService` globally.

---

### 2. Firebase Integration

#### [NEW] [firebase-admin.provider.ts](file:///d:/Amora%20project/amora-backend/src/firebase/firebase-admin.provider.ts)
Instantiates the Firebase Admin SDK using environment variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).

#### [NEW] [firebase.service.ts](file:///d:/Amora%20project/amora-backend/src/firebase/firebase.service.ts)
Exposes token verification APIs (`verifyIdToken`) wrapping the Admin SDK.

#### [NEW] [firebase.module.ts](file:///d:/Amora%20project/amora-backend/src/firebase/firebase.module.ts)
Registers the Firebase components.

---

### 3. Users and Roles Repositories

We will implement clean data access layers.

#### [NEW] [role.enum.ts](file:///d:/Amora%20project/amora-backend/src/common/enums/role.enum.ts)
Defines typescript role enums (`CUSTOMER`, `CREATOR`, `SALON`, `ADMIN`) matching database roles.

#### [NEW] [roles.repository.ts](file:///d:/Amora%20project/amora-backend/src/roles/roles.repository.ts)
Database operations for querying roles and assigning user roles.

#### [NEW] [roles.service.ts](file:///d:/Amora%20project/amora-backend/src/roles/roles.service.ts)
Service layer for role management.

#### [NEW] [roles.module.ts](file:///d:/Amora%20project/amora-backend/src/roles/roles.module.ts)
Registers and exports roles data services.

#### [NEW] [users.repository.ts](file:///d:/Amora%20project/amora-backend/src/users/users.repository.ts)
Wraps Prisma transactions for creating users, updating profiles, and managing relations.

#### [NEW] [users.service.ts](file:///d:/Amora%20project/amora-backend/src/users/users.service.ts)
Exposes base operations for fetching user info (`findOneByFirebaseUid`, `createUser`).

#### [NEW] [users.module.ts](file:///d:/Amora%20project/amora-backend/src/users/users.module.ts)
Exports `UsersService` and `UsersRepository`.

---

### 4. Common Decorators & Guards

#### [NEW] [public.decorator.ts](file:///d:/Amora%20project/amora-backend/src/common/decorators/public.decorator.ts)
Metadata flag to bypass authentication.

#### [NEW] [get-user.decorator.ts](file:///d:/Amora%20project/amora-backend/src/common/decorators/get-user.decorator.ts)
Custom parameter decorator to retrieve user payloads from Request contexts.

#### [NEW] [roles.decorator.ts](file:///d:/Amora%20project/amora-backend/src/common/decorators/roles.decorator.ts)
Attaches permitted role metadata to endpoints.

#### [NEW] [jwt-auth.guard.ts](file:///d:/Amora%20project/amora-backend/src/common/guards/jwt-auth.guard.ts)
Standard JWT Passport Auth Guard that checks for `@Public()` metadata.

#### [NEW] [roles.guard.ts](file:///d:/Amora%20project/amora-backend/src/common/guards/roles.guard.ts)
Checks request user roles against permitted endpoint roles.

#### [NEW] [active-role.guard.ts](file:///d:/Amora%20project/amora-backend/src/common/guards/active-role.guard.ts)
Verifies if the current request's active role matches endpoints requiring specialized routing.

---

### 5. Authentication Module (Core)

#### [NEW] [firebase-login.dto.ts](file:///d:/Amora%20project/amora-backend/src/auth/dto/firebase-login.dto.ts)
Input validator for login requests (`idToken`, optional `deviceToken`, `deviceType`).

#### [NEW] [switch-role.dto.ts](file:///d:/Amora%20project/amora-backend/src/auth/dto/switch-role.dto.ts)
Validates requested role changes (`activeRole` parameter).

#### [NEW] [refresh-token.dto.ts](file:///d:/Amora%20project/amora-backend/src/auth/dto/refresh-token.dto.ts)
Validates token renewal inputs (`refreshToken`).

#### [NEW] [jwt.strategy.ts](file:///d:/Amora%20project/amora-backend/src/auth/strategies/jwt.strategy.ts)
Passport JWT strategy processing incoming HTTP auth headers.

#### [NEW] [auth.service.ts](file:///d:/Amora%20project/amora-backend/src/auth/auth.service.ts)
Business logic for token verification, session lifecycle management, switch role execution, and JWT signature generations.

#### [NEW] [auth.controller.ts](file:///d:/Amora%20project/amora-backend/src/auth/auth.controller.ts)
Declares the required endpoints:
- `POST /auth/firebase/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/switch-role`

#### [NEW] [auth.module.ts](file:///d:/Amora%20project/amora-backend/src/auth/auth.module.ts)
Integrates auth strategies, modules, and config dependencies.

---

### 6. App Bootstrapping

#### [MODIFY] [app.module.ts](file:///d:/Amora%20project/amora-backend/src/app.module.ts)
Integrates the new business modules.

#### [MODIFY] [main.ts](file:///d:/Amora%20project/amora-backend/src/main.ts)
Binds the global `ValidationPipe` with DTO configuration rules and binds global filters.

---

## Verification Plan

### Automated Verification
1. Install passport and token validation dependencies:
   ```powershell
   npm install --save @nestjs/jwt @nestjs/passport passport passport-jwt
   npm install --save-dev @types/passport-jwt
   ```
2. Build the project using Nest CLI:
   ```powershell
   npm run build
   ```
   This compiles TypeScript files and verifies that there are no type conflicts or module loading errors.

### Manual Verification
- We will mock the Firebase Token verification response for manual integration testing (using custom test suites or validating controllers).
