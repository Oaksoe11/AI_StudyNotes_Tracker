# Deployment Guide

This project deploys as two services:

- `frontend/`: Next.js app on Vercel
- `backend/`: FastAPI API on Render or Railway

Supabase stays as the hosted database/auth/storage provider, and Gemini stays as the AI provider.

## 1. Push The Repo

Commit and push the project to GitHub before deploying.

```bash
git add .
git commit -m "Prepare deployment configuration"
git push
```

## 2. Supabase

In Supabase:

1. Open SQL Editor.
2. Run `backend/supabase/schema.sql`.
3. Make sure Auth is enabled.
4. Make sure the `lecture-pdfs` storage bucket exists.

Copy these values:

- Project URL
- Anon public key
- Service role key

Important: use the anon key only in the frontend. Use the service role key only in the backend.

## 3. Backend On Render

Render can use the root `render.yaml` blueprint, or you can create a Web Service manually.

Manual settings:

```txt
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Backend environment variables:

```txt
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=lecture-pdfs
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

After deploy, copy the backend public URL. It will look like:

```txt
https://your-api.onrender.com
```

## 4. Backend On Railway

If using Railway instead of Render:

1. Create a new Railway project from GitHub.
2. Select this repo.
3. Set the service root directory to `backend`.
4. Railway will use `backend/railway.json`.
5. Add the same backend environment variables listed above.
6. Generate a public domain.

## 5. Frontend On Vercel

In Vercel:

```txt
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
```

Frontend environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-url
```

Do not put `SUPABASE_SERVICE_ROLE_KEY` in Vercel.

## 6. Final Production Test

After both services are deployed:

1. Open the Vercel frontend URL.
2. Create a user account or log in.
3. Create a folder.
4. Upload a PDF.
5. Wait for extraction.
6. Generate notes.
7. Generate a quiz.
8. Log out and log back in.
9. Confirm notes and quizzes still appear.

## Troubleshooting

If the frontend cannot call the backend:

- Check `NEXT_PUBLIC_API_URL` in Vercel.
- Check `FRONTEND_ORIGIN` and `FRONTEND_ORIGINS` in the backend host.
- Redeploy after changing environment variables.

If uploads fail:

- Check `SUPABASE_SERVICE_ROLE_KEY` is set in the backend.
- Check the `lecture-pdfs` storage bucket exists.
- Check `backend/supabase/schema.sql` was run.

If Gemini generation fails:

- Check `GEMINI_API_KEY`.
- Check API quota/rate limits.
- Try with a smaller PDF first.

