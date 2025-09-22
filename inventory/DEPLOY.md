# Inventory Deployment Guide

1. **Populate Cloud Storage**
   - Sync `public/inventory/*.webp` to your production bucket (R2 or equivalent) so `https://closet.city/inventory/...` resolves. Run:
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
   - Use `inventory/tryon_queue.json` to drive your rendering pipeline. Each entry includes the garment image URL and an output placeholder path (e.g. `https://closet.city/inventory/tryon/bbc-look.webp`).
   - After generating a try-on asset, upload it to storage and update `listing_media` with the final URL using `scripts/apply_tryon_results.ps1` and a JSON payload (see `inventory/tryon_results.sample.json`).

4. **Verify in the app**
   - `npm run dev` (or deploy) and check `/` and `/shop` to confirm the new inventory and carousels render as expected.
