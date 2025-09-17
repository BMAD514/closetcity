-- Database schema for closet.city virtual try-on platform
-- This file should be executed against your Cloudflare D1 database

-- Users table for basic user management
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Garments table for storing uploaded clothing items
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

-- Cache table for storing generated try-on and pose images
-- Uses deterministic cache keys to avoid regenerating identical requests
CREATE TABLE IF NOT EXISTS pose_cache(
  cache_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt_version TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_garments_owner_id ON garments(owner_id);
CREATE INDEX IF NOT EXISTS idx_garments_created_at ON garments(created_at);
CREATE INDEX IF NOT EXISTS idx_pose_cache_prompt_version ON pose_cache(prompt_version);
CREATE INDEX IF NOT EXISTS idx_pose_cache_created_at ON pose_cache(created_at);
