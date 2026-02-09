# TypeScript Migration – Repo Analysis & Plan

## 1. Current State

### Framework & stack
- **Runtime**: Node.js
- **Framework**: Express 4.x
- **DB**: MongoDB via Mongoose 8.x
- **Auth**: JWT (jsonwebtoken), no refresh tokens
- **Validation**: express-validator (body/validationResult)
- **Logging**: Winston
- **File upload**: Multer (memory storage)

### Layering (current)
- **Entry**: `src/server.js` – dotenv, CORS, json/urlencoded, route mount, error handler, graceful shutdown
- **Routes** (6): `index`, `auth`, `dashboard`, `courses`, `profile`, `financial_assistance` – contain validation + direct model use + response logic
- **Models**: `User`, `StatusCheck` (Mongoose schemas in `src/models/`)
- **Config**: `database.js` (connect/disconnect/getDB), `logger.js` (Winston)
- **Middleware**: `auth.js` (createAccessToken, verifyToken, getCurrentUser), `errorHandler.js` (statusCode + `{ detail }`)

### Entrypoint & scripts
- **Main**: `src/server.js` → `node src/server.js`
- **Scripts**: `start`, `dev` (nodemon), `test` (jest) – no TS yet
- **Port**: `process.env.PORT || 8000`

### API surface (contracts to preserve)
- **Errors**: `res.status(statusCode).json({ detail: string })` everywhere
- **Auth**: `Authorization: Bearer <token>`; `req.user` = `{ sub: string, id: string }`
- **Success shapes**: various (e.g. `{ success, token, user }`, `{ user }`, `{ modules }`, `{ detail }` for validation) – do not change

---

## 2. Risks

| Risk | Mitigation |
|------|------------|
| **Env var naming** | Auth code uses `JWT_SECRET_KEY`; Render/sample used `JWT_SECRET`. Centralize in typed config and support both or document single name. |
| **Error shape** | All errors must stay `{ detail: string }`. Use `AppError` with `statusCode` and central middleware that always sends `detail`. |
| **Mongoose duplicate key** | `code === 11000` in auth → 400 + message. Map in error middleware or keep in auth flow. |
| **express-validator** | Keep validation in route layer; return 400 with `detail` when `!errors.isEmpty()`. |
| **Multer / req.file** | Add typings for `Request` with `file` and `user` so controllers stay type-safe. |
| **Response shape drift** | Introduce response helpers only for consistency; ensure they output the same JSON as today (no new wrappers like `{ data }`). |
| **Build/runtime** | Use `tsc` → `dist/`, run `node dist/server.js` in prod; dev with `ts-node-dev` so each step stays runnable. |

---

## 3. Migration Plan

### Phase 1 – Tooling & base (runnable)
- Add TypeScript, `tsconfig.json` (strict, outDir `dist/`).
- Add ESLint + Prettier + lint/format scripts.
- Add `types/` (e.g. `express.d.ts` for `req.user`, env types).
- Add typed `config/` (env validation / load).
- Move logger to `commonservice/` (e.g. `logger.ts`).
- Add `AppError` and central error middleware (preserve `{ detail }`).
- Add minimal response helpers if desired (e.g. `sendSuccess`, `sendError`) that mirror current `res.status().json()` shapes.
- Keep existing `server.js` or add `server.ts` that compiles; ensure `npm run build` + `npm start` and `npm run dev` work.

### Phase 2 – Repositories & models
- Add `repository/` (e.g. `userRepository.ts`, `statusCheckRepository.ts`) wrapping Mongoose models.
- Move/rewrite Mongoose models to TypeScript in a single place (e.g. keep under `models/` or colocate with repo); ensure `toJSON` and collections unchanged.
- No API or behavior change; only layering.

### Phase 3 – Services
- Add `services/` (auth, dashboard, courses, profile, financialAssistance, statusCheck).
- Move business logic from routes into services; services use repositories and commonservice (logger).
- Controllers call services and set `res` (same status + JSON as today).

### Phase 4 – Controllers & routes
- Add `controllers/` (one per route file); controllers receive req/res, call services, use response helpers or direct `res.json()` to preserve shapes.
- Routes only: wire method + path, validation middleware, auth middleware where needed, controller method.
- Keep validation (express-validator) at route level; optionally extract to `middlewares/validate.ts`.

### Phase 5 – Cleanup & docs
- Remove old `.js` files once TS equivalents are in place and tested.
- Update `README.md` with run instructions (install, build, dev, prod, env vars).
- Update `render.yaml` if needed (e.g. `startCommand: node dist/server.js`).

### Target structure
```
src/
  routes/
  controllers/
  services/
  repository/
  commonservice/   # logger (mailer, cache, etc. later)
  middlewares/
  config/          # typed env
  utils/           # pure helpers only
  types/           # DTOs, request typing, domain types
  models/          # Mongoose schemas (TS)
  server.ts        # entry
```

---

## 4. Out of scope (no feature changes)
- No new endpoints or removal of endpoints.
- No change to response JSON shapes.
- No new auth mechanism or token format.
- No DB schema changes.
- No new dependencies beyond TypeScript tooling and type definitions.
