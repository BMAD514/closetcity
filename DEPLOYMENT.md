# 🚀 Deployment Guide for closet.city

This guide captures the exact steps required to ship the OpenNext build of closet.city to Cloudflare Pages. Follow the checklist in order — each step unlocks the next.

---

## 1. Build the OpenNext bundle

```bash
npm run build:pages
```

This command:
- Runs the OpenNext Cloudflare adapter.
- Writes `.open-next/_routes.json` (routing rules for the worker).
- Patches the worker to use `/api/image-proxy/*` for inventory assets.

The output directory `.open-next/assets` must be the Pages publish directory.

---

## 2. Provision Cloudflare services (one-time per account)

```bash
npm install -g wrangler        # if not already installed
wrangler login
npx wrangler d1 create closetcity-db
npx wrangler r2 bucket create closetcity-storage
npx wrangler kv namespace create closetcity-jobs
```

Update `wrangler.toml` with the identifiers from the output so local and CI builds have the right bindings:

```toml
[[d1_databases]]
binding = "DB"
database_name = "closetcity-db"
database_id = "<YOUR_D1_ID>"

[[r2_buckets]]
binding = "R2"
bucket_name = "closetcity-storage"

[[kv_namespaces]]
binding = "JOBS"
id = "<YOUR_KV_ID>"
```

Pages automatically reuses these bindings if the IDs are present when you deploy.

---

## 3. Load schema, seed data, and assets

Apply the schema and seeds to the new D1 database:

```bash
npx wrangler d1 execute closetcity-db --file=./schema.sql
npx wrangler d1 execute closetcity-db --file=./seeds/garments.sql
```

Upload the curated inventory images to R2 so the `/api/image-proxy/*` URLs resolve:

```bash
bash scripts/upload_inventory.sh
# or
pwsh scripts/upload_inventory.ps1
```

The scripts place files under `inventory/<name>.webp`, matching the proxy expectations baked into the seeds.

If you want real try-on renders, process `inventory/tryon_queue.json`, upload the generated assets, and apply them with `scripts/apply_tryon_results.ps1`.

---

## 4. Configure environment variables & bindings in Cloudflare Pages

In the Pages project settings:

**Environment Variables**
- `PROMPT_VERSION` = `v1`

**Secrets**
- `GEMINI_API_KEY` = `<your Gemini key>`

**Function bindings**
- D1 binding: `DB` → select the `closetcity-db` database.
- R2 binding: `R2` → select the `closetcity-storage` bucket.
- KV binding: `JOBS` → select the KV namespace created earlier.

---

## 5. Deploy

### Option A – Git integration (recommended)
Configure the Pages build settings:
- Build command: `npm run build:pages`
- Build output directory: `.open-next/assets`
- Root directory: `/` (empty)

Pages will run the build on every push and publish the latest `.open-next` bundle.

### Option B – Manual Wrangler deploy

```bash
wrangler pages deploy .open-next --project-name closetcity --branch production
```

The command uploads static assets and the worker in one shot.

---

## 6. Post-deploy validation

1. Visit `/` and `/shop` — inventory images should load via `/api/image-proxy/...` (check the `x-inventory-proxy: hit` header).
2. Exercise `/virtual-try-on` to confirm uploads reach R2 and that `POST /api/model`, `/api/pose`, and `/api/tryon` respond (requires a valid `GEMINI_API_KEY`).
3. Inspect Cloudflare Pages → Functions logs for any runtime errors.
4. Optional: run the showroom scripts against staging before updating production seeds.

When all checks pass, the project is production-ready.
