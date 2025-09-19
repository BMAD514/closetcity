# 🚀 Deployment Guide for closet.city

## ✅ Build Status: SUCCESS

Your closet.city application has been successfully built and is ready for deployment!

## 📋 Pre-Deployment Checklist

### 1. Get Google Gemini API Key
- Go to [Google AI Studio](https://aistudio.google.com/)
- Click "Get API Key" → "Create new API key"
- Copy the API key (you'll need this later)

### 2. Push to GitHub (Recommended)
```bash
# If you haven't already, create a GitHub repository and push:
git remote add origin https://github.com/yourusername/closetcity.git
git push -u origin master
```

## 🌐 Deploy to Cloudflare Pages

### Option A: GitHub Integration (Recommended)

1. **Go to [Cloudflare Pages](https://pages.cloudflare.com/)**
2. **Click "Create a project"**
3. **Connect to Git** → Select your GitHub repository
4. **Configure build settings**:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (leave empty)
   - **Environment variables**: Add later

5. **Click "Save and Deploy"**

### Option B: Direct Upload

1. **Go to [Cloudflare Pages](https://pages.cloudflare.com/)**
2. **Click "Create a project"**
3. **Choose "Upload assets"**
4. **Zip the `.next` folder** and upload it
5. **Set project name**: `closetcity`

## ⚙️ Configure Cloudflare Services

### Step 1: Create D1 Database

1. **Go to Cloudflare Dashboard** → **D1**
2. **Click "Create database"**
3. **Name**: `closetcity-db`
4. **Click "Create"**
5. **Copy the Database ID** (you'll need this)

### Step 2: Apply Database Schema

1. **Click on your database** → **Console tab**
2. **Copy and paste this SQL**:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Garments table
CREATE TABLE IF NOT EXISTS garments(
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  title TEXT,
  brand TEXT,
  size TEXT,
  image_url TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Cache table
CREATE TABLE IF NOT EXISTS pose_cache(
  cache_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt_version TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_garments_owner_id ON garments(owner_id);
CREATE INDEX IF NOT EXISTS idx_garments_created_at ON garments(created_at);
CREATE INDEX IF NOT EXISTS idx_pose_cache_prompt_version ON pose_cache(prompt_version);
CREATE INDEX IF NOT EXISTS idx_pose_cache_created_at ON pose_cache(created_at);
```

3. **Click "Execute"**

### Step 3: Create R2 Bucket

1. **Go to Cloudflare Dashboard** → **R2 Object Storage**
2. **Click "Create bucket"**
3. **Name**: `closetcity-storage`
4. **Choose location** (closest to your users)
5. **Click "Create bucket"**

### Step 4: Configure Environment Variables

In your Cloudflare Pages project:

1. **Go to Settings** → **Environment variables**
2. **Add these variables**:

**Production Variables:**
- `PROMPT_VERSION` = `v1`

**Production Secrets:**
- `GEMINI_API_KEY` = `your-gemini-api-key-here`

### Step 5: Configure Function Bindings

1. **Go to Settings** → **Functions**
2. **Add D1 Database Binding**:
   - **Variable name**: `DB`
   - **D1 database**: Select `closetcity-db`

3. **Add R2 Bucket Binding**:
   - **Variable name**: `R2`
   - **R2 bucket**: Select `closetcity-storage`

## 🧪 Test Your Deployment

1. **Visit your Cloudflare Pages URL**
2. **Click "Go to Dashboard"**
3. **Try uploading a model photo**
4. **Try uploading a garment image**
5. **Generate a try-on result**

## 🔧 Troubleshooting

### Common Issues:

**"R2 storage not configured"**
- Check R2 binding is set to variable name `R2`
- Ensure bucket `closetcity-storage` exists

**"Required services not configured"**
- Verify D1 binding is set to variable name `DB`
- Check `GEMINI_API_KEY` is set in secrets
- Ensure `PROMPT_VERSION` is set to `v1`

**"AI generation failed"**
- Verify Gemini API key is correct and has quota
- Check function logs in Cloudflare Pages dashboard

**Database errors**
- Ensure schema.sql was executed successfully
- Check D1 database binding configuration

### View Logs:
1. **Go to your Pages project**
2. **Click "Functions" tab**
3. **View real-time logs** for debugging

## 🎯 Next Steps

Once deployed successfully:

1. **Test all functionality**
2. **Set up custom domain** (optional)
3. **Configure R2 custom domain** for better performance
4. **Add user authentication** (future enhancement)
5. **Implement real Stripe payments** (future enhancement)

## 📞 Support

If you encounter issues:
- Check Cloudflare Pages function logs
- Verify all environment variables and bindings
- Ensure Gemini API key has sufficient quota
- Review the main README.md for detailed API documentation

## 🎉 Success!

Your closet.city virtual try-on platform should now be live and functional!

**Features Available:**
- ✅ File upload (model photos & garments)
- ✅ AI-powered virtual try-on generation
- ✅ Pose variation generation
- ✅ Smart caching system
- ✅ Responsive web interface

**Ready for alpha testing!** 🚀
