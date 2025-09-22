#!/usr/bin/env bash
set -euo pipefail

# Reseed closet.city D1 database with refreshed inventory
# Usage: ./reseed_d1.sh [--local]

DATASET="closet-db"
ARGS=("d1" "execute" "$DATASET" "--file=seeds/garments.sql")
if [[ ${1-} == "--local" ]]; then
  ARGS+=("--local")
else
  ARGS+=("--remote")
fi

set -x
npx wrangler "${ARGS[@]}"
