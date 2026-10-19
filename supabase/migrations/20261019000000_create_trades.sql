create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  symbol text not null check (char_length(symbol) between 1 and 30),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  buy_price numeric(18, 4) not null check (buy_price > 0),
  quantity bigint not null check (quantity > 0),
  stop_loss numeric(18, 4) check (stop_loss > 0),
  target_price numeric(18, 4) check (target_price > 0),
  sell_price numeric(18, 4) check (sell_price > 0),
  fees numeric(18, 2) not null default 0 check (fees >= 0),
  reason text not null default '' check (char_length(reason) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint closed_trade_has_sell_price check (status <> 'closed' or sell_price is not null)
);

create index if not exists trades_user_entry_date_idx on public.trades (user_id, entry_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trades_set_updated_at
before update on public.trades
for each row execute function public.set_updated_at();

alter table public.trades enable row level security;

create policy "Users can read their own trades"
  on public.trades for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own trades"
  on public.trades for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own trades"
  on public.trades for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own trades"
  on public.trades for delete to authenticated
  using ((select auth.uid()) = user_id);
