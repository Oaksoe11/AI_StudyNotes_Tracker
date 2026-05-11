create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('lecture-pdfs', 'lecture-pdfs', true)
on conflict (id) do nothing;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  title text,
  file_name text not null,
  storage_path text not null,
  file_url text,
  selected_tone text not null default 'concise',
  status text not null default 'uploaded'
    check (status in ('uploaded', 'extracting', 'generating', 'completed', 'failed')),
  failure_reason text,
  -- These progress fields let the UI show messages like "Extracting slide 3 of 20".
  processing_step text,
  processing_current integer,
  processing_total integer,
  page_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  page_number integer not null,
  extracted_text text,
  image_storage_path text,
  image_url text,
  created_at timestamptz not null default now(),
  unique (document_id, page_number)
);

create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  page_number integer not null,
  text text,
  image_storage_path text,
  image_url text,
  created_at timestamptz not null default now(),
  unique (document_id, page_number)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  title text not null,
  tone text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  title text not null,
  difficulty text not null default 'mixed' check (difficulty in ('mixed', 'easy', 'medium', 'hard')),
  is_saved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade,
  level text not null check (level in ('easy', 'medium', 'hard')),
  question text not null,
  choices jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text not null,
  page_reference text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.documents add column if not exists file_url text;
alter table public.documents add column if not exists title text;
alter table public.documents add column if not exists selected_tone text not null default 'concise';
alter table public.documents add column if not exists failure_reason text;
alter table public.documents add column if not exists processing_step text;
alter table public.documents add column if not exists processing_current integer;
alter table public.documents add column if not exists processing_total integer;
alter table public.quizzes add column if not exists difficulty text not null default 'mixed';
alter table public.quizzes add column if not exists is_saved boolean not null default true;
alter table public.document_pages add column if not exists image_url text;
alter table public.slides add column if not exists image_url text;
alter table public.slides add column if not exists image_storage_path text;

-- Student note:
-- Indexes are like bookmarks for the database.
-- These match the queries the app runs most often, so lists and detail pages stay fast as data grows.
create index if not exists folders_user_created_idx
on public.folders (user_id, created_at desc);

create index if not exists documents_user_created_idx
on public.documents (user_id, created_at desc);

create index if not exists documents_folder_created_idx
on public.documents (folder_id, created_at desc);

create index if not exists slides_document_page_idx
on public.slides (document_id, page_number);

create index if not exists document_pages_document_page_idx
on public.document_pages (document_id, page_number);

create index if not exists notes_user_created_idx
on public.notes (user_id, created_at desc);

create index if not exists notes_folder_created_idx
on public.notes (folder_id, created_at desc);

create index if not exists notes_document_created_idx
on public.notes (document_id, created_at desc);

create index if not exists quizzes_user_saved_created_idx
on public.quizzes (user_id, is_saved, created_at desc);

create index if not exists quizzes_folder_created_idx
on public.quizzes (folder_id, created_at desc);

create index if not exists quiz_questions_quiz_position_idx
on public.quiz_questions (quiz_id, position);

insert into public.slides (document_id, page_number, extracted_text, image_storage_path, image_url, created_at)
select document_id, page_number, text, image_storage_path, image_url, created_at
from public.document_pages
on conflict (document_id, page_number) do update set
  extracted_text = excluded.extracted_text,
  image_storage_path = excluded.image_storage_path,
  image_url = excluded.image_url;

alter table public.users enable row level security;
alter table public.folders enable row level security;
alter table public.documents enable row level security;
alter table public.slides enable row level security;
alter table public.document_pages enable row level security;
alter table public.notes enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
