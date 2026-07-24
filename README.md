# Queue Care: Authentication Foundation

Queue Care is a patient-flow management platform. This repository contains the complete authentication foundation featuring a secure **Phone OTP registration and password creation flow** powered by a Go backend and a React Native frontend.

## 🛠 Tech Stack Architecture

```
React Native App
       │
       │ HTTPS (REST API)
       ▼
   Go Fiber Backend
       │
       │ SQLx (Queries & Pooling)
       ▼
   PostgreSQL / Supabase
```

* **Mobile Frontend:** React Native (Expo) with TS, React Navigation, Secure Store abstraction, and auto-refresh interceptors.
* **Backend:** Go (Fiber v2 web framework) using SQLx database library with `pgx` driver, Argon2id password hashing, and signed JWT session tokens.
* **Database:** PostgreSQL (with embedded migrations for users, OTP verification, and temporary tokens).

---

## 🔒 Security Implementations

1. **OTP Verification:** Hashed securely in the database (SHA-256) instead of stored in plain text. Prevents brute-forcing with rate limits (max 5 incorrect attempts before invalidating).
2. **Temporary Verification Tokens:** After successful OTP verify, a unique UUID token is generated. Its SHA-256 hash is saved in `otp_verification_sessions`. The frontend must send this token as a `Bearer` authorization token when requesting password setup. This prevents password updates without completing OTP.
3. **Argon2id Hashing:** Password hashes use salt and modern cryptographic configurations (Argon2id).
4. **Secure Mobile Storage:** Tokens are saved inside the hardware Keychain (iOS) and Keystore (Android) using `expo-secure-store`.
5. **Token Rotation / Refresh:** Short-lived access tokens (15 mins) and long-lived refresh tokens (30 days) rotate automatically in the API fetch interceptor without breaking user actions.

---

## 🏗 Directory Structures

### Go Backend

* `backend/main.go` - Entry point bootstrapping Fiber, logging, CORS, database connectivity, and router.
* `backend/config/config.go` - Environment configuration parser.
* `backend/errors/errors.go` - Enforced structured JSON errors.
* `backend/db/db.go` - Connection pooler & startup migration helper using Go's `embed` package.
* `backend/db/migrations/` - SQL schema migrations.
* `backend/models/models.go` - Database struct model mappings.
* `backend/repository/` - Database SQL query abstractions.
* `backend/service/` - Core domain (OTP generation, Argon2id, JWT signing).
* `backend/middleware/auth.go` - JWT check extractor.
* `backend/handler/auth.go` - Fiber controller handlers.
* `backend/router/router.go` - Router tree groups.

### React Native Frontend

* `Queue-care/src/components/` - Inputs (Phone, OTP, Password), Buttons, Checklists.
* `Queue-care/src/screens/` - PhoneAuthScreen, OtpVerificationScreen, SetPasswordScreen, HomeScreen.
* `Queue-care/src/navigation/` - Stack navigators & Root persistent state gate.
* `Queue-care/src/services/` - API wrapper client and auth endpoints.
* `Queue-care/src/context/` - AuthContext session provider.
* `Queue-care/src/storage/` - Secure storage client.
* `Queue-care/src/utils/` - Validation utilities (Phone/Password) and error converters.

---

## 🚀 Getting Started

### 1. Database Configuration

Ensure your PostgreSQL database is running. In your case, it is already configured to connect to your Supabase instance:

Inside the password, the special character `@` has been URL-encoded as `%40` so standard parsers do not fail.

### 2. Launch the Backend

Navigate to the backend directory and launch the Go server:

```bash
cd backend
# Build and start the Fiber app (runs database migrations on startup)
go run .
```

By default, the server binds to port `8080`.
*Note: In development mode (`APP_ENV=development`), the generated OTP is logged directly to the server terminal console for testing.*

### 3. Launch the Frontend Mobile App

Navigate to the frontend directory:

```bash
cd Queue-care
npm install
npm run start
```

*Note: The frontend base API URL dynamically adapts based on the simulator platform (`127.0.0.1` for iOS, and `10.0.2.2` to access the host machine's port 8080 from the Android emulator). Ensure these parameters match your local networking inside `src/constants/api.ts`.*

---

## 🧪 Testing

### Go Backend Tests

Run the Go unit tests verifying phone normalization, hashing, and token checks:

```bash
cd backend
go test ./...
```
