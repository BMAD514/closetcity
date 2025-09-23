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
- `npm run build:pages` now emits `.open-next/_routes.json` and patched worker code automatically before deploy.
- D1/R2 bindings wired; virtual try-on endpoints reachable (requires valid Gemini key to execute end-to-end).

## Outstanding / Needs Attention
- Generative AI flow has not been re-tested post-migration. Needs verification that Gemini responses stream successfully and cached R2 uploads still function.
- Investigate whether compatibility flags should include `nodejs_compat_v2` for future Node polyfills, though current setup works with `compatibility_date = "2024-10-01"`.

## Suggested Next Steps
1. Run smoke tests for `/api/model`, `/api/pose`, and `/api/tryon` with a valid `GEMINI_API_KEY` to confirm end-to-end behaviour under the OpenNext worker.
2. Consider staging environment deploy to validate showroom generation scripts prior to pushing new inventory.
3. Monitor the first production deploy after the new `/api/image-proxy/*` URLs go live to confirm asset cache headers look correct.
