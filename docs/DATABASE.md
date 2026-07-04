# Database Design

Database: PostgreSQL (Supabase)

ORM: Prisma

---

Core Tables:

- users
- roles
- user_roles
- creator_profiles
- creator_kyc
- salon_profiles
- salon_kyc
- videos
- comments
- likes
- followers
- categories
- notifications
- reports
- wallets
- bookings
- analytics_daily
- analytics_monthly

---

Rules:
- Use UUID primary keys
- Use foreign keys
- Normalize data
- Avoid duplication
- Use indexes for performance