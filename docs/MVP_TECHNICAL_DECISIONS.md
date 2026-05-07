# MVP Technical Decisions

This MVP is optimized for a simple, understandable upload-to-notes flow.

## Backend Jobs

The app uses FastAPI `BackgroundTasks` for PDF extraction after upload.

Why:
- It keeps the upload request fast.
- It avoids introducing a queue service before the workflow needs one.
- It is easy to debug locally with the existing FastAPI server.
- The current job is bounded: extract PDF text, render slide images, store results, and update status.

Celery is postponed because it adds Redis, worker process management, retry configuration, deployment complexity, and operational monitoring. Those are useful later, but too heavy for the MVP.

## AI Provider

Gemini is the main AI provider for generated lecture notes.

Why:
- It supports strong summarization and Markdown generation.
- It can accept text and selected slide images for visual context.
- It keeps the first AI integration focused on one provider.

Generated notes are stored as Markdown. Markdown keeps editing simple, renders cleanly in React, and is easy to export later.

## Supabase

Supabase is used for:
- Auth
- Postgres database records
- Storage for original PDFs and slide images

Why:
- It combines the core MVP backend services in one platform.
- Storage public URLs are simple to store with documents and slides.
- Postgres keeps the data model straightforward for folders, documents, slides, and notes.

## Current Processing Flow

1. Frontend uploads PDF, folder ID, and selected tone.
2. FastAPI stores the original PDF in Supabase Storage.
3. FastAPI creates a `documents` row with status `uploaded`.
4. FastAPI starts a background extraction task.
5. Background task updates status to `extracting`.
6. PyMuPDF extracts page text and renders slide images.
7. Slide records are saved with page numbers, extracted text, and image URLs.
8. User can generate Markdown notes with Gemini from the extracted slide content.

