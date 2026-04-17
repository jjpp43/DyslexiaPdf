-- Run this in your Supabase SQL editor

create table pdfs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  status text not null default 'pending', -- pending | processing | done | error
  page_count int,
  error_message text,
  created_at timestamptz default now()
);

create table pdf_pages (
  id uuid primary key default gen_random_uuid(),
  pdf_id uuid references pdfs(id) on delete cascade not null,
  page_number int not null,
  page_data jsonb not null,
  created_at timestamptz default now(),
  unique(pdf_id, page_number)
);

-- Only the owner can access their PDFs
alter table pdfs enable row level security;
alter table pdf_pages enable row level security;

create policy "Users can manage their own PDFs"
  on pdfs for all
  using (auth.uid() = user_id);

create policy "Users can read their own pages"
  on pdf_pages for all
  using (
    exists (
      select 1 from pdfs where pdfs.id = pdf_pages.pdf_id and pdfs.user_id = auth.uid()
    )
  );

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  style jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users can manage their own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free',
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users can read their own profile"
  on user_profiles for select
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Storage bucket RLS (run after creating the 'pdfs' bucket)
create policy "Users can upload their own PDFs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read their own PDFs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own PDFs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
