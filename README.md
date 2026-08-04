# Queue Care: Authentication Foundation

Queue Care is a patient-flow management platform. This repository contains the complete authentication foundation featuring a secure **Google Sign-In authentication flow** powered by a Go backend and a React Native frontend.

## 🛠 Tech Stack Architecture

```
React Native App (Thin Client)
       │
       │ HTTP POST /api/v1/auth/google (Google ID Token)
       ▼
   Go Fiber Backend
       │
       ├─── Verify Google Token ➡️ Google OAuth API
       │
       ├─── User lookup / register (SQLx Queries)
       ▼
   PostgreSQL / Supabase Database (Project: velrytehextbrudkrszv)
```

* **Mobile Frontend:** React Native (Expo) with TS, React Navigation, Secure Store abstraction, and auto-refresh interceptors.
* **Backend:** Go (Fiber v2 web framework) using SQLx database library with `pgx` driver, official Google Token validation (`google.golang.org/api/idtoken`), and signed JWT session tokens.
* **Database:** PostgreSQL (with embedded migrations for users).

---

## 🔒 Security Implementations

1. **Official Google verification:** The Go backend validates the Google ID Token using Google's official library `"google.golang.org/api/idtoken"`, verifying client ID audience matching.
2. **Secure Mobile Storage:** Tokens are saved inside the hardware Keychain (iOS) and Keystore (Android) using `expo-secure-store`.
3. **Token Rotation / Refresh:** Short-lived access tokens (15 mins) and long-lived refresh tokens (30 days) rotate automatically in the API fetch interceptor without breaking user actions.

---

## 🏗 Directory Structures

### Go Backend

* `backend/main.go` - Entry point bootstrapping Fiber, logging, CORS, database connectivity, and router.
* `backend/config/config.go` - Environment configuration parser.
* `backend/errors/errors.go` - Enforced structured JSON errors.
* `backend/db/db.go` - Connection pooler & startup migration helper using Go's `embed` package.
* `backend/db/migrations/` - SQL schema migrations.
* `backend/models/user.go` - Database user models and JSON responses.
* `backend/repository/user_repository.go` - Database user query abstractions.
* `backend/service/auth_service.go` - Core authentication logic (Google token validation, JWT signing).
* `backend/middleware/auth.go` - JWT check extractor.
* `backend/handler/auth_handler.go` - Fiber controller handlers.
* `backend/router/router.go` - Router tree groups.

### React Native Frontend

* `Queue-care/src/components/` - Buttons, themes, layout components.
* `Queue-care/src/screens/` - LoginScreen, HomeScreen.
* `Queue-care/src/navigation/` - Stack navigators & Root persistent state gate.
* `Queue-care/src/services/` - API client and auth service (Google OAuth integration).
* `Queue-care/src/context/` - AuthContext session provider.
* `Queue-care/src/storage/` - Secure storage client.
* `Queue-care/src/utils/` - Error converters.

---

## 🚀 Getting Started & Configuration

### 1. Database Configuration

You need to connect the Go backend to your newly created Supabase database project .

1. Go to your **Supabase Dashboard** ➡️ select your project `velrytehextbrudkrszv`.
2. Go to **Settings** (gear icon) ➡️ **Database** ➡️ **Connection string** ➡️ select **URI**.
3. Copy the URI string and replace `[PASSWORD]` with your actual database password.
4. Open the backend environment file **`backend/.env`** and paste the URI as your `DATABASE_URL`, for example:
   ```ini
   DATABASE_URL=postgresql://postgres.velrytehextbrudkrszv:[YOUR-PASSWORD]@[YOUR-REGION].pooler.supabase.com:6543/postgres?default_query_exec_mode=cache_describe
   ```

### 2. Launch the Backend

1. Install the official Google API Go package:
   ```bash
   cd backend
   go mod tidy
   ```
2. Launch the Go server:
   ```bash
   go run .
   ```
   *Note: On startup, the server will connect to PostgreSQL, run the migrations to create the new Google-based user table, and listen on port `8080`.*

### 3. Launch the Frontend Mobile App

Navigate to the frontend directory:

```bash
cd Queue-care
npm install
npm run start
```

*Note: The frontend base API URL dynamically adapts based on the simulator platform (`127.0.0.1` for iOS, and Metro bundler host IP to access the host machine's port 8080 from the Android emulator). Ensure these parameters match your local networking inside `src/constants/api.ts`.*
