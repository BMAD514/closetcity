# Closet City Deployment Snapshot (OpenNext Migration)

## Stack Overview
- **Frontend**: Next.js 15.5.2 (App Router, React 19, TypeScript)
- **Styling & UI**: Tailwind CSS 4, Framer Motion animations, custom merchandising helpers (`src/lib/productMeta.ts`)
- **Functions Runtime**: Cloudflare Pages + OpenNext worker (`.open-next/worker.js`) with Node-compatible overrides
- **APIs**:
  - Public product APIs served via Next routes bridging to Cloudflare Pages Functions (`functions/api/*`)
  - Virtual try-on endpoints (`model`, `pose`, `tryon`, `upload`) reusing Cloudflare D1/R2 bindings
- **Data & Storage**: Cloudflare D1 (garments table + caches), R2 (static inventory imagery)
- **Deployment Tooling**: `opennextjs-cloudflare` build, `_routes.json` emit, no-op worker patch (no `/inventory/*` rewrite), Wrangler Pages deploy (`wrangler pages deploy .open-next ...`)

## Deploy Checklist (operators)
- Build: `npm run build:pages` → publish `.open-next/assets`; enable `nodejs_compat` in Pages (Preview + Production)
- Bindings (Pages → Functions → Bindings):
  - D1: `DB` → database `closetcity-db` (ensure correct `database_id`)
  - R2: `R2` → bucket `closetcity-storage`
  - KV: `JOBS` → namespace `closetcity-jobs`
- Inventory upload to R2: `pwsh scripts/upload_inventory.ps1` or `bash scripts/upload_inventory.sh` (keys under `inventory/<file>`)
- Database:
  - Apply schema once; reseed as needed: `pwsh scripts/reseed_d1.ps1` (use `-Local` for local)
- Verify:
  - `/api/garments` returns items
  - `/api/image-proxy/bbc.webp` returns 200 with `x-inventory-proxy` header
- Optional manual deploy: `wrangler pages deploy .open-next --branch production`

## Working
- OpenNext build: `npm run build:pages` emits `.open-next/assets` and `_routes.json`; worker patch step is a no-op (no `/inventory/*` rewrite).
- D1 reseed verified locally against `closetcity-db` via `scripts/reseed_d1.ps1 -Local` (8 commands executed successfully).
- `/api/image-proxy/<file>` implemented to serve from ASSETS first, with fallback to R2 at `inventory/<file>`.
- API routes respond (`/api/garments`, `/api/garments/[id]`, `/api/model`, `/api/tryon`, `/api/pose`, `/api/upload`); generation requires valid `GEMINI_API_KEY`.

## Outstanding / Needs Attention
- Cloudflare Pages project likely still using pre-OpenNext settings. Update Build command to `npm run build:pages`, Output to `.open-next/assets`, enable `nodejs_compat`, bind `DB`/`R2`/`JOBS`, then redeploy. Until then, `/api/image-proxy/<file>` may 404.
- After redeploy, verify `/api/image-proxy/bbc.webp` returns 200 and shows `x-inventory-proxy` header (`hit-assets` or `hit-r2`). If 404, ensure R2 objects exist under `inventory/<file>`.
- Re-test model/try-on/pose in production with a valid `GEMINI_API_KEY` and confirm R2 uploads + cache writes succeed.

## Suggested Next Steps
1. Flip Cloudflare Pages build settings to `npm run build:pages` + `.open-next/assets`; enable `nodejs_compat`; confirm DB/R2/JOBS bindings.
2. Redeploy (Git-based or `wrangler pages deploy .open-next --branch production`).
3. Spot-check `/api/garments` and `/api/image-proxy/bbc.webp`.
4. Reseed remote DB if needed and upload inventory to R2 (`scripts/upload_inventory.*`).
5. Run an end-to-end try-on and verify outputs are written to R2 and referenced via `/api/image-proxy/...`.
