# AI Study Notes Tracker

Upload lecture PDFs, extract slide content, and generate organized AI lecture notes with Gemini.

## Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: FastAPI
- AI: Google Gemini API
- Database: Supabase Postgres
- Storage: Supabase Storage
- PDF parsing: PyMuPDF

## Project Structure

```text
frontend/   Next.js app and UI
backend/    FastAPI app, services, and Supabase schema
```

## Local Setup

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## MVP Flow

1. Create a folder for a course.
2. Upload a lecture PDF into that folder.
3. Backend stores the PDF in Supabase Storage and creates a document record.
4. FastAPI starts a background task to extract page text and slide images with PyMuPDF.
5. User chooses a note tone.
6. Backend sends extracted content to Gemini.
7. Generated notes are saved in Supabase and shown in the dashboard.

## Architecture Notes

- [MVP technical decisions](docs/MVP_TECHNICAL_DECISIONS.md)
- [Future architecture upgrades](docs/FUTURE_ARCHITECTURE.md)
- [Deployment guide](docs/DEPLOYMENT.md)

## License

Copyright (c) 2026 Oak Soe Khant. All rights reserved.

This project is proprietary. Do not copy, distribute, modify, or reuse this code without written permission.
