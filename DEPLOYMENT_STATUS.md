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

## Working
- Production domain `https://closet.city/` renders storefront, `/shop`, `/virtual-try-on`, checkout success/cancel, invite, dashboard pages.
- API routes respond (e.g., `GET /api/garments`, `/api/garments/[id]`, `/api/model`, `/api/tryon`, `/api/orders/[id]`).
- `npm run build:pages` now emits `.open-next/_routes.json` and runs a no-op patch step (no `/inventory/*` rewrite).
- D1/R2 bindings wired; virtual try-on endpoints reachable (requires valid Gemini key to execute end-to-end).

## Outstanding / Needs Attention
- Static inventory assets under `/inventory/*.webp` may 404 in production. `_routes.json` now ships with the build and the patch step is a no-op; we do not rewrite `/inventory/*` in the worker. Serve inventory via existing public assets paths or API/R2 links instead.
- Generative AI flow has not been re-tested post-migration. Needs verification that Gemini responses stream successfully and cached R2 uploads still function.
- Optional: document new deploy runbook (`npm run build:pages` + `wrangler pages deploy .open-next --branch production`).
- Investigate whether compatibility flags should include `nodejs_compat_v2` for future Node polyfills, though current setup works with `compatibility_date = "2024-10-01"`.

## Suggested Next Steps
1. Debug the remaining `/inventory/*` 404 (evaluate final worker rewrite vs. adjusting assets to `/assets/inventory/*`).
2. Once imagery resolves, run smoke tests for virtual try-on (model/pose/tryon) with a valid `GEMINI_API_KEY`.
3. Update documentation/README with the new deployment commands and any manual steps for asset uploads.
4. Consider staging environment deploy to validate showroom generation scripts prior to pushing new inventory.
