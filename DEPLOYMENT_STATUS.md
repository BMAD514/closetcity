# Closet City Deployment Snapshot (OpenNext Migration)

## Stack Overview
- **Frontend**: Next.js 15.5.2 (App Router, React 19, TypeScript)
- **Styling & UI**: Tailwind CSS 4, Framer Motion animations, custom merchandising helpers (`src/lib/productMeta.ts`)
- **Functions Runtime**: Cloudflare Pages + OpenNext worker (`.open-next/worker.js`) with Node-compatible overrides
- **APIs**:
  - Public product APIs served via Next routes bridging to Cloudflare Pages Functions (`functions/api/*`)
  - Virtual try-on endpoints (`model`, `pose`, `tryon`, `upload`) reusing Cloudflare D1/R2 bindings
- **Data & Storage**: Cloudflare D1 (garments table + caches), R2 (static inventory imagery)
- **Deployment Tooling**: `opennextjs-cloudflare` build, Wrangler Pages deploy (`wrangler pages deploy .open-next ...`)

## Working
- Production domain `https://closet.city/` renders storefront, `/shop`, `/virtual-try-on`, checkout success/cancel, invite, dashboard pages.
- API routes respond (e.g., `GET /api/garments`, `/api/garments/[id]`, `/api/model`, `/api/tryon`, `/api/orders/[id]`).
- OpenNext build flow succeeds locally (`npm run build:pages`) and deploys cleanly through Wrangler.
- D1/R2 bindings wired; virtual try-on endpoints reachable (requires valid Gemini key to execute end-to-end).

## Outstanding / Needs Attention
- Static inventory assets under `/inventory/*.webp` return 404 in production. Worker currently routes request to Next server instead of asset bucket. Options:
  - Add explicit asset passthrough/rewrite in `open-next.config.ts` (alias `inventory` to `assets/inventory`).
  - Serve images via `/_next/static` or store in R2 with absolute URLs (`https://closet.city/api/r2/...`).
- Generative AI flow has not been re-tested post-migration. Needs verification that Gemini responses stream successfully and cached R2 uploads still function.
- Optional: document new deploy runbook (`npm run build:pages` + `wrangler pages deploy .open-next --branch production`).
- Investigate whether compatibility flags should include `nodejs_compat_v2` for future Node polyfills, though current setup works with `compatibility_date = "2024-10-01"`.

## Suggested Next Steps
1. Fix static imagery delivery so `/inventory/*` resolves (either via config rewrite or adjusting asset paths).
2. Run smoke tests for virtual try-on (model/pose/tryon) with a valid `GEMINI_API_KEY` to ensure worker queue + caching still operate under OpenNext.
3. Update documentation/README with the new deployment commands and any manual steps for asset uploads.
4. Consider staging environment deploy to validate showroom generation scripts prior to pushing new inventory.
