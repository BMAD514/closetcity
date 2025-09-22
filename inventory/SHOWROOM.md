# Showroom Render Workflow (Admin)

This script lets you take any raw garment photo, run it through the Gemini showroom prompt, and pull down the cleaned image while keeping the natural resale condition.

## Prereqs
- `wrangler` logged into the closetcity account (`wrangler login`).
- `GEMINI_API_KEY`, R2, and D1 bindings already configured on the project (production already has this; for local runs use `wrangler pages dev` with the bindings from `wrangler.toml`).

## Usage

1. Place the raw photo somewhere on disk (JPEG/PNG/WebP, under 8 MB).
2. From the repo root run:
   ```powershell
   pwsh scripts\generate_showroom.ps1 -Source "C:\path	o
aw.jpg"
   ```
   - The script uploads the source to `inventory/uploads/<timestamp>.<ext>` in R2.
   - It calls `POST /api/model` to generate the showroom image.
   - When the render finishes it saves the result to `inventory/showroom/<timestamp>-showroom.webp` and prints the public URL.
3. For local dev/testing add `-Local` (uses `https://closet.city` and uploads via `wrangler ... --local`).
4. To skip the download (for example if you just want the URL) add `-SkipDownload`.

The script polls `/api/jobs/<id>` when Gemini runs asynchronously, so you can always check status manually if needed.

Once the image looks right, update the garment record (seed or D1) to point at the new URL that the script prints.

## Batch processing

To process every image in a folder (e.g., the raw inventory shots), run:
```powershell
pwsh scripts\process_inventory_showroom.ps1 -Folder inventory
```
Add `-SkipExisting` to avoid re-processing files that already have a showroom output, `-Local` to target your Wrangler dev server, or `-SkipDownload` if you just need the URLs. Each underlying call defers to `generate_showroom.ps1`.
