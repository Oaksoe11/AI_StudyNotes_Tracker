# Future Architecture Upgrade Notes

These are not needed for the MVP, but the current structure leaves room for them.

## Queue System

Upgrade FastAPI `BackgroundTasks` to Celery + Redis when processing needs:
- Retries
- Scheduled jobs
- Worker autoscaling
- Progress events
- Longer-running or parallel PDF/AI tasks

Likely queue jobs:
- Extract PDF
- Render slide images
- Generate notes
- Regenerate notes
- Export PDF

## AI Search

Add `pgvector` when notes and slides need semantic search.

Possible tables:
- `slide_embeddings`
- `note_embeddings`

Search targets:
- Find related lecture slides
- Search across notes by meaning
- Surface definitions and examples from old lectures

## RAG Chat

Add retrieval-augmented generation after search exists.

Flow:
1. User asks a question.
2. Search relevant slides and notes with embeddings.
3. Send retrieved context to Gemini.
4. Return an answer with references to folders, documents, slides, and notes.

## Payments

Add Stripe after usage limits or premium features matter.

Possible limits:
- PDFs processed per month
- Gemini generations per month
- Storage quota
- Export formats

## Team Folders

Add shared folders after single-user study flow is stable.

Future needs:
- Folder membership table
- Roles: owner, editor, viewer
- Shared notes
- Activity log
- Invite flow

