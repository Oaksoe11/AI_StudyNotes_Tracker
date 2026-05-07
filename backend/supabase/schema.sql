create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('lecture-pdfs', 'lecture-pdfs', true)
on conflict (id) do nothing;

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
  file_name text not null,
  storage_path text not null,
  file_url text,
  selected_tone text not null default 'concise',
  status text not null default 'uploaded'
    check (status in ('uploaded', 'extracting', 'generating', 'completed', 'failed')),
  failure_reason text,
  page_count integer not null default 0,
  created_at timestamptz not null default now()
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

alter table public.documents add column if not exists file_url text;
alter table public.documents add column if not exists selected_tone text not null default 'concise';
alter table public.documents add column if not exists failure_reason text;
alter table public.document_pages add column if not exists image_url text;

alter table public.folders enable row level security;
alter table public.documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.notes enable row level security;
