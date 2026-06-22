# AGENTS.md

## Project Structure

Two independent packages, not a monorepo (no workspaces). Each has its own `package.json`, `node_modules/`, and lockfile.

- `client/` — React 19 + Vite 6 + TypeScript + Tailwind v4 frontend
- `server/` — Express 5 + Node 20 backend (ESM, `"type": "module"`)
- Root `package.json` only runs husky/commitlint

## Commands

**Client:**
```bash
cd client && npm install
npm run dev       # Vite dev server (localhost:5173)
npm run build     # tsc -b && vite build
npm run lint      # ESLint (TypeScript + React)
npm run test      # vitest run
```

**Server:**
```bash
cd server && npm install
cp .env.example .env   # then fill in real values
npm run dev            # nodemon (localhost:5000)
npm run test           # node --test tests/**/*.test.js
```

No root-level `npm test`, `npm run lint`, or build commands exist. Run checks in each package individually.

## Commits

Husky `commit-msg` hook enforces Conventional Commits via commitlint.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Scope: kebab-case required
- Subject: lowercase, max 72 chars
- Body lines: max 100 chars

## Server Quirks

- **Env validation at startup** (`config/validateEnv.js`): server exits immediately if `.env` is missing or invalid. Zod validates all required vars. See `.env.example` for the full list.
- **`validateEnv.js` uses CJS** (`require`/`module.exports`) while the rest of the server is ESM. This works because Node ESM can import CJS, but it's inconsistent.
- **Redis is optional**: server starts and runs without Redis (graceful fallback logged to console). Don't assume Redis is available.
- **MongoDB + Cloudinary are required**: server will exit if `MONGO_URI` or Cloudinary vars are missing.
- **Express 5** (`express@5.1.0`), not Express 4. Some middleware APIs differ.
- **`server/tests/bandwidth.test.js`** is a standalone script (spins up its own Express app). It is **not** picked up by `npm test` (`node --test tests/**/*.test.js`). Run it manually with `node tests/bandwidth.test.js`.
- Background jobs start on server boot: `expirationJob`, `uploadSessionCleanupJob`, `quotaResetJob`.
- Deprecated `/upload` endpoint returns 410. Use `/api/files/upload/*` for chunked uploads.

## Client Quirks

- **Path alias**: `@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.json`).
- **Vite proxies `/api`** to `http://localhost:5000` during dev. No proxy in production — API URL set via `VITE_API_URL` env var (defaults to `http://localhost:5000`).
- **Tailwind v4** with `@tailwindcss/vite` plugin (not PostCSS-based). The `tailwind.config.js` only sets `darkMode: "class"`.
- **Tests**: Vitest with `environment: "node"` (not `jsdom`). Client tests live in `__tests__/` dirs alongside source.
- **`npm run build`** runs `tsc -b` first — type errors block the build.
- Frontend deploys to Vercel. Backend is separate.

## Architecture

```
Frontend (Vite:5173) --> proxy /api --> Backend (Express:5000)
                                           |
                                    MongoDB + Cloudinary + Redis (optional)
                                    Socket.IO for real-time notifications
```

Routes are split: `routers.js` (legacy auth/user routes), `files.js`, `shares.js`, `analytics.js`. All mounted under `/api/*`.

Key models: `UserSchema.js`, `File.js`, `ShareLink.js`, `Notification.js`, `UploadSession.js`.

## Skills

Project-specific AI skills live in [.agents/skills/](.agents/skills/). Invoke them in Claude Code with `/skill <name>`.

| Skill | What it does in this repo |
|---|---|
| `conventional-commit` | Inspects your staged diff and generates a valid Conventional Commit message — keeps the `commit-msg` Husky hook from rejecting your commit |
| `nodejs-express-server` | Patterns for Express 5 middleware, routing, error handling, and JWT auth — reference when adding or changing server-side code |
| `redis-best-practices` | Key naming, TTL policy, caching patterns, and connection pooling for the optional Redis layer (rate-limiting, sessions) |
| `vitest-testing-patterns` | Write and structure Vitest unit/component tests for the React client — covers `__tests__/` layout, mocking, and coverage setup |
| `wcag-audit-patterns` | Audit the React frontend for WCAG 2.2 violations and get remediation guidance for accessible components |

## CI

No build/test CI workflows exist. GitHub workflows are only automation (auto-assign, labeling, stale issues, welcome messages).
