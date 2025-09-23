# closet.city - Virtual Try-On Resale Platform

A minimal full-stack virtual try-on platform for resale fashion, built with Next.js and Cloudflare services.

## 🚀 Features

- **Virtual Try-On**: AI-powered garment visualization using Google Gemini
- **Guided Rack**: Curated editorial grid with AI staging, no filters or social proof
- **Pose Generation**: Generate different poses and angles from try-on results
- **Smart Caching**: Deterministic caching to avoid regenerating identical requests
- **File Upload**: Secure image upload to Cloudflare R2 storage
- **Edge Runtime**: Optimized for Cloudflare Pages with edge functions


Note: The Virtual Try-On UI now uses the builder’s production components under `src/features/virtualtryon/components`.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, TailwindCSS
- **Backend**: Cloudflare Pages Functions (API routes under `/api`)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for images
- **AI**: Google Gemini 2.5 Flash (server-side only)
- **Payments**: Stripe Checkout (placeholder ready)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/route.ts      # File upload endpoint
│   │   ├── tryon/route.ts       # Virtual try-on generation
│   │   ├── pose/route.ts        # Pose generation
│   │   ├── checkout/route.ts    # Stripe placeholder
│   │   └── r2/[key]/route.ts    # R2 file proxy
│   ├── dashboard/page.tsx       # Main dashboard UI
│   └── page.tsx                 # Home page
├── lib/
│   ├── utils.ts                 # Core utility functions
│   ├── constants.ts             # AI prompts and constants
│   └── types.ts                 # TypeScript definitions
├── schema.sql                   # Database schema
└── wrangler.toml               # Cloudflare configuration
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd closetcity
npm install
```

### 2. Set Up Cloudflare Services

#### Create D1 Database
```bash
npx wrangler d1 create closetcity-db
```

Copy the database ID and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "closetcity-db"
database_id = "your-database-id-here"
```

#### Apply Database Schema
```bash
npx wrangler d1 execute closetcity-db --file=./schema.sql
```

#### Create R2 Bucket
```bash
npx wrangler r2 bucket create closetcity-storage
```

### 3. Configure Environment Variables

#### Get Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy the key for use in environment variables

#### Set Environment Variables in Cloudflare Pages

In your Cloudflare Pages dashboard, go to Settings → Environment Variables and add:

**Variables:**
- `PROMPT_VERSION` = `v1`

**Secrets:**
- `GEMINI_API_KEY` = `your-gemini-api-key-here`

### 4. Configure Bindings

In Cloudflare Pages → Functions → Bindings, add:

**D1 Database:**
- Variable name: `DB`
- D1 database: `closetcity-db`

**R2 Bucket:**
- Variable name: `R2`
- R2 bucket: `closetcity-storage`

**KV Namespace:**
- Variable name: `JOBS`
- KV namespace: `closetcity-jobs`


### Seed the boutique
Load the curated closet data after applying the schema:

```bash
npx wrangler d1 execute closetcity-db --file=./seeds/garments.sql
```

The seed script wipes any matching IDs and repopulates six hero pieces with flat-lay and try-on imagery so the shop, product views, and virtual styling rack feel lived-in immediately.

Upload the supporting images to R2 so the `/api/image-proxy/*` URLs resolve:
```bash
bash scripts/upload_inventory.sh
# or
pwsh scripts/upload_inventory.ps1
```

### 5. Deploy to Cloudflare Pages

Use Cloudflare Pages Git integration:
- Framework preset: Next.js
- Build command: `npm run build:pages`
- Build output directory: `.open-next/assets`
- Configure bindings in Pages Settings → Functions (DB, R2) and Environment variables (PROMPT_VERSION, GEMINI_API_KEY)

## 🔧 Development

### Local Development
```bash
npm run dev
```

### Build for Production / Cloudflare Pages
```bash
npm run build:pages
```

This emits the `.open-next` worker bundle that Pages deploys via Git integration or `wrangler pages deploy`.


## User flow

From `/product/[id]`, users can click “Try this on” to open `/virtual-try-on` with the product’s image preselected via the `?garmentUrl=...` query parameter.

## 📋 API Endpoints

### GET `/api/garments`
List garments for the shop grid.

Response:
````json
{
  "ok": true,
  "items": [
    { "id": "uuid", "brand": "A.P.C.", "title": "Denim Jacket", "price_cents": 32000, "image_url": "https://..." }
  ]
}
````

### GET `/api/garments/[id]`
Detail with media (flat-lay and try-on).

Response:
````json
{
  "ok": true,
  "item": {
    "id": "uuid", "brand": "A.P.C.", "title": "Denim Jacket",
    "size": "M", "condition": "Good", "price_cents": 32000,
    "image_url": "https://..."
  },
  "media": {
    "flatlay": ["https://..."],
    "tryon": ["https://..."]
  }
}
````


### POST `/api/upload`
Upload model or garment images.

**Request:**
```typescript
FormData {
  file: File,
  kind: 'model' | 'garment'
}
```

**Response:**
```typescript
{
  success: boolean,
  url: string,
  error?: string
}
```

### POST `/api/tryon`
Generate virtual try-on images.

**Request:**
```typescript
{
  modelUrl: string,
  garmentUrl: string,
  poseKey: 'front' | 'three_quarter' | 'side' | 'back'
}
```

**Response:**
```typescript
{
  success: boolean,
  url: string,
  cached: boolean,
  error?: string
}
```

### POST `/api/pose`
Generate different poses from existing try-on results.

**Request:**
```typescript
{
  outfitUrl: string,
  poseKey: 'front' | 'three_quarter' | 'side' | 'back'
}
```

**Response:**
```typescript
{
  success: boolean,
  url: string,
  cached: boolean,
  error?: string
}
```

### POST `/api/checkout`
Stripe checkout placeholder (ready for integration).

**Request:**
```typescript
{
  garmentId?: string,
  priceId?: string,
  quantity?: number
}
```

**Response:**
```typescript
{
  ok: boolean,
  message: string
}
```

## 🎨 AI Prompts

The system uses versioned prompts for consistent results:

### Try-On Prompt (v1)
```
Task: Apply the provided garment image to the supplied model image.
- Replace visible clothing with the supplied garment.
- Preserve person identity, pose, and background.
- Preserve visible defects (pilling, fading) — do NOT beautify.
- Respect layering overlaps naturally (collars/hems).
- Match lighting, folds, and scale realistically.
Output image only. PromptVersion: v1
```

### Pose Prompt Template
```
Regenerate from pose: {POSE_KEY}. Preserve person, current outfit, background & lighting. Keep materials/defects identical. Output image only. PromptVersion: v1
```

## 🗄 Database Schema

```sql
-- Users table
CREATE TABLE users(
  id TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Garments table
CREATE TABLE garments(
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  title TEXT,
  brand TEXT,
  size TEXT,
  image_url TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Cache table for AI-generated images
CREATE TABLE pose_cache(
  cache_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt_version TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
```

## 🔒 Security & Limitations

- **File Size**: Maximum 8MB per upload
- **File Types**: JPEG, PNG, WebP only
- **API Timeout**: 30 seconds for AI generation
- **Secrets**: Gemini API key is server-side only
- **Caching**: Deterministic caching prevents duplicate AI calls

## 🚧 TODOs

### Stripe Integration
- [ ] Add real Stripe Checkout session creation
- [ ] Implement webhook handlers for payment events
- [ ] Add customer and order management

### Production Enhancements
- [ ] Set up custom R2 domain for direct file serving
- [ ] Add user authentication and sessions
- [ ] Implement garment marketplace features
- [ ] Add image optimization and resizing
- [ ] Set up monitoring and error tracking

### Performance
- [ ] Add image CDN and optimization
- [ ] Implement progressive loading
- [ ] Add request rate limiting
- [ ] Optimize AI prompt caching strategy

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the Cloudflare documentation for service-specific help
- Review the Google Gemini API documentation for AI-related issues

