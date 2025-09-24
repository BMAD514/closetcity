# Upload optimized inventory images to Cloudflare R2
# Requires: wrangler authenticated with closetcity project

$files = @(
    "bbc.webp"
    "burberry-rainbow.webp"
    "burberry-tshirt.webp"
    "evolution-short-sleeve-polo-shirt.webp"
    "gucci-mask.webp"
    "jw-hoodie.webp"
    "jwa-tshirt.webp"
    "p0.webp"
    "paul-smith-camp.webp"
    "paul-smith-polo.webp"
    "siberia-hills.webp"
    "stussy-vest.webp"
)

foreach ($file in $files) {
    $local = Join-Path 'public/inventory' $file
    $remote = "inventory/$file"
    wrangler r2 object put "closetcity-storage/$remote" --file=$local --remote
}
