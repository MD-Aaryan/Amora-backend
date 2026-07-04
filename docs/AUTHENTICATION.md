# Authentication System

Provider:
- Firebase Authentication

Methods:
- Google Login
- Phone OTP

---

Flow:

1. User logs in via Firebase
2. Firebase returns ID token
3. Backend verifies token
4. Check user in DB
5. Create if not exists
6. Generate JWT
7. Return session

---

JWT:
- Used for API authorization
- Stored in frontend
- Sent via headers