create table if not exists public.risk_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  capital numeric(18, 2) check (capital > 0),
  risk_percent numeric(5, 2) not null default 1 check (risk_percent > 0 and risk_percent <= 100),
  updated_at timestamptz not null default now()
);

create or replace trigger risk_settings_set_updated_at
before update on public.risk_settings
for each row execute function public.set_updated_at();

alter table public.risk_settings enable row level security;

create policy "Users can read their own risk settings"
  on public.risk_settings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own risk settings"
  on public.risk_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own risk settings"
  on public.risk_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
