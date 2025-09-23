#!/usr/bin/env bash
set -euo pipefail

# Upload optimized inventory images to Cloudflare R2 so `/api/image-proxy/*` hits succeed
# Requires: wrangler authenticated with closetcity project

for file in bbc.webp burberry-rainbow.webp burberry-tshirt.webp evolution-short-sleeve-polo-shirt.webp gucci-mask.webp jw-hoodie.webp jwa-tshirt.webp p0.webp paul-smith-camp.webp paul-smith-polo.webp siberia-hills.webp stussy-vest.webp; do
  local="public/inventory/$file"
  remote="inventory/$file"
  wrangler r2 object put "closetcity-storage/$remote" --file="$local"
done
