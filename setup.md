# Setup Guide for closet.city

This guide walks you through setting up the closet.city virtual try-on platform step by step.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Google AI Studio account (for Gemini API)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Cloudflare D1 Database

1. Install Wrangler CLI (if not already installed):
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Create D1 database:
```bash
npx wrangler d1 create closetcity-db
```

4. Copy the database ID from the output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "closetcity-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
```

5. Apply the database schema:
```bash
npx wrangler d1 execute closetcity-db --file=./schema.sql
```

## Step 3: Set Up Cloudflare R2 Storage

1. Create R2 bucket:
```bash
npx wrangler r2 bucket create closetcity-storage
```

2. The bucket name is already configured in `wrangler.toml`

## Step 4: Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the API key for the next step

## Step 5: Deploy to Cloudflare Pages

### Option A: Connect GitHub Repository

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect your GitHub account
4. Select this repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

### Option B: Direct Upload

1. Build the project:
```bash
npm run build
```

2. Upload the `dist` folder to Cloudflare Pages

## Step 6: Configure Environment Variables

In your Cloudflare Pages dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following:

**Production Variables:**
- `PROMPT_VERSION` = `v1`

**Production Secrets:**
- `GEMINI_API_KEY` = `your-gemini-api-key-here`

## Step 7: Configure Function Bindings

In your Cloudflare Pages dashboard:

1. Go to your project → Settings → Functions
2. Add the following bindings:

**D1 Database Binding:**
- Variable name: `DB`
- D1 database: Select `closetcity-db`

**R2 Bucket Binding:**
- Variable name: `R2`
- R2 bucket: Select `closetcity-storage`

## Step 8: Test the Application

1. Visit your Cloudflare Pages URL
2. Click "Go to Dashboard"
3. Upload a model photo and garment image
4. Generate a try-on result

## Troubleshooting

### Common Issues

**"R2 storage not configured" error:**
- Check that the R2 binding is correctly set up in Cloudflare Pages
- Ensure the binding name is exactly `R2`

**"Required services not configured" error:**
- Verify all environment variables are set
- Check that D1 and R2 bindings are configured
- Ensure the Gemini API key is valid

**"AI generation failed" error:**
- Check that the Gemini API key is correct
- Verify the API key has sufficient quota
- Check Cloudflare Pages function logs for detailed errors

**Database errors:**
- Ensure the schema.sql was applied correctly
- Check that the D1 database ID in wrangler.toml matches the created database

### Checking Logs

View function logs in Cloudflare Pages:
1. Go to your project dashboard
2. Click on "Functions" tab
3. View real-time logs for debugging

### Local Development

For local development with Cloudflare services:

1. Update `wrangler.toml` with your actual database ID
2. Run local development:
```bash
npm run pages:dev
```

This will start a local server with Cloudflare Workers runtime.

## Next Steps

Once deployed, you can:

1. **Add Stripe Integration**: Implement real payment processing
2. **Custom Domain**: Set up a custom domain for your R2 bucket
3. **User Authentication**: Add user accounts and sessions
4. **Monitoring**: Set up error tracking and analytics
5. **Performance**: Optimize images and add CDN

## Support

If you encounter issues:
1. Check the Cloudflare Pages function logs
2. Verify all environment variables and bindings
3. Test API endpoints individually
4. Review the README.md for detailed API documentation
