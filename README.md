# tudu3

A Next.js app with shadcn/ui, Three.js (React Three Fiber), Prisma (MySQL), and WebAuthn (face/passkey) auth.

## Prerequisites
- Node 18+
- MySQL 8 (local or cloud)

## Setup
1. Create env file:
```
cp .env.example .env
```
2. Edit `.env`:
```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME"
SESSION_SECRET="replace-with-strong-secret"
```
3. Install deps and generate Prisma client:
```
npm install
npx prisma generate
```
4. Push schema and start dev server:
```
npx prisma db push
npm run dev
```

## Auth (Passkeys)
- Sign up or login with WebAuthn on `/(auth)`.
- Uses `@simplewebauthn` and cookie session.

## API
- `POST /api/webauthn/generate-registration-options`
- `POST /api/webauthn/verify-registration`
- `POST /api/webauthn/generate-authentication-options`
- `POST /api/webauthn/verify-authentication`
- `GET/POST /api/todos`
- `PATCH/DELETE /api/todos/:id`

## 3D Scene
- Todos are sticky-note boxes stacked in piles. Click to toggle.

## Notes
- For production, set correct `rpID` and HTTPS origin.
- Consider using a connection pooler for Prisma in serverless.
