#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROUTES_PATH = path.join(process.cwd(), ".open-next", "_routes.json");
const ROUTES_DIR = path.dirname(ROUTES_PATH);

const ROUTES_PAYLOAD = {
  version: 1,
  include: [
    "/",
    "/shop",
    "/manifesto",
    "/virtual-try-on",
    "/product/*",
    "/checkout/*",
    "/inventory/*",
    "/invite",
    "/dashboard",
    "/api/*"
  ],
  exclude: [
    "/_next/static/*",
    "/_next/image",
    "/_next/image/*",
    "/__nextjs_original-stack-frame"
  ]
};

fs.mkdirSync(ROUTES_DIR, { recursive: true });
fs.writeFileSync(ROUTES_PATH, JSON.stringify(ROUTES_PAYLOAD, null, 2));
console.log(`wrote ${ROUTES_PATH}`);
