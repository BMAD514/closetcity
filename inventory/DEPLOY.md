# Inventory Deployment Guide

1. **Build and Publish (OpenNext on Cloudflare Pages)**
   - Build the OpenNext bundle and publish the assets directory:
     ```bash
     npm run build:pages
     ```
     - In Cloudflare Pages, set Build command = `npm run build:pages` and Output dir = `.open-next/assets`.

2. **Upload Inventory Images to R2**
   - Upload optimized images to your R2 bucket under `inventory/<file>`; they are served via `/api/image-proxy/<file>`:
     ```powershell
     pwsh scripts/upload_inventory.ps1
     ```
     or
     ```bash
     bash scripts/upload_inventory.sh
     ```

2. **Reseed the D1 database**
   - Run the refreshed seed against the target environment. Example (production Pages project):
     ```powershell
     pwsh scripts/reseed_d1.ps1
     ```
     or
     ```bash
     bash scripts/reseed_d1.sh
     ```
   - For preview/local testing pass `--local`.

3. **Generate true try-on renders (optional but recommended)**
   - Use `inventory/tryon_queue.json` to drive your rendering pipeline. Each entry includes the garment image URL and an output placeholder path (e.g. `https://closet.city/api/image-proxy/tryon/bbc-look.webp`).
   - After generating a try-on asset, upload it to R2 under `tryon/<file>` and update `listing_media` with the final URL using `scripts/apply_tryon_results.ps1` and a JSON payload (see `inventory/tryon_results.sample.json`).

4. **Verify in the app**
   - `npm run dev` (or deploy) and check `/` and `/shop` to confirm the new inventory and carousels render as expected.
