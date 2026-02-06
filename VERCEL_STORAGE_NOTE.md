# Vercel note about data storage

This app writes results to a local JSON file by default (`data/results.json`).

On Vercel Serverless Functions, the filesystem is **ephemeral**:
- It may work during a single function instance lifetime
- But it is **NOT guaranteed to persist** across deployments / cold starts / scaling

If you need persistent storage on Vercel, consider:
- Vercel KV / Postgres (Vercel Storage)
- Supabase (free tier) or other external DB
- Upstash Redis (free tier)
