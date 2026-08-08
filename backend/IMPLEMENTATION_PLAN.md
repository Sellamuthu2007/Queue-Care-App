# Backend Auth Boundary Implementation Plan

## Current workflow

The current backend auth flow is:

1. The frontend sends `/api/v1/auth/google` or `/api/v1/auth/login`.
2. The handler parses the request and calls the auth service.
3. The auth service:
   - talks to Supabase,
   - verifies the returned user/session,
   - syncs the user into PostgreSQL,
   - generates the application JWT access and refresh tokens.
4. The response returns the app user plus the new JWT session pair.

This works, but the service layer currently mixes three responsibilities in one place. That makes maintenance harder and increases the chance of changing one auth step while breaking another.

## Goal

Keep these responsibilities clearly separated:

1. Supabase validation
2. User sync in PostgreSQL
3. JWT generation and refresh rotation

The refactor should make the workflow easier to follow without changing the external API contract or breaking Expo mobile testing.

## What I will change

### 1. Split Supabase interaction into a dedicated auth client layer

I will move Supabase calls into focused helper functions so the service does not directly mix HTTP calls with business logic.

Expected outcome:
- One function for validating a Google/Supabase session.
- One function for email/password sign-in.
- One function for refresh exchange if needed.

### 2. Keep user sync isolated from Supabase transport details

I will keep the logic that maps Supabase user data into the local `models.User` and repository calls in one clearly named service step.

Expected outcome:
- The code that decides `google_id`, `email`, `name`, and `avatar_url` stays together.
- Repository calls remain the only part touching PostgreSQL user persistence.

### 3. Keep JWT token creation in one token helper

I will isolate access-token and refresh-token generation so JWT policy changes are made in one place.

Expected outcome:
- Access token expiry stays controlled in one function.
- Refresh token expiry stays controlled in one function.
- Rotation behavior remains predictable for Expo web and mobile testing.

### 4. Preserve the public auth endpoints

I will not change the routes or request shapes unless absolutely required.

Expected outcome:
- `/api/v1/auth/google`
- `/api/v1/auth/login`
- `/api/v1/auth/refresh`

All remain usable by the current frontend.

### 5. Add focused validation after each change

After the refactor, I will verify:
- login still works on web,
- login still works in Expo mobile testing,
- token refresh still rotates correctly,
- invalid refresh tokens clear the session cleanly,
- backend auth middleware still rejects expired access tokens.

## Refactor order

1. Extract Supabase-specific operations into a small helper/client layer.
2. Extract user normalization and sync into a separate service function.
3. Extract JWT creation into a token helper.
4. Update handlers to call the new service boundary without changing endpoint behavior.
5. Validate login, refresh, and logout flows on Expo web and mobile.

## Non-goals

- No endpoint redesign.
- No database schema changes unless a boundary issue forces it.
- No frontend flow rewrite.
- No change to Expo redirect setup beyond keeping it working.

## Notes

The frontend already depends on the current response shape and redirect behavior. Any backend refactor must keep the app session flow stable for Expo Go, web, and installed mobile builds.