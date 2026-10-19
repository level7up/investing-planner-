alter table public.trades
  add column if not exists asset_type text not null default 'stock' check (asset_type in ('stock', 'gold_fund')),
  add column if not exists exit_date date;

update public.trades
set exit_date = greatest(entry_date, updated_at::date)
where status = 'closed' and exit_date is null;

alter table public.trades
  add constraint trades_exit_after_entry check (exit_date is null or exit_date >= entry_date);

create table if not exists public.gold_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  purchase_date date not null,
  kind text not null check (kind in ('bar', 'coin', 'jewelry')),
  karat smallint not null check (karat in (24, 21, 18)),
  grams numeric(12, 3) not null check (grams > 0),
  price_per_gram numeric(18, 2) not null check (price_per_gram > 0),
  making_fee numeric(18, 2) not null default 0 check (making_fee >= 0),
  status text not null default 'held' check (status in ('held', 'sold')),
  sold_date date,
  sale_price_per_gram numeric(18, 2) check (sale_price_per_gram > 0),
  sale_fees numeric(18, 2) not null default 0 check (sale_fees >= 0),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gold_sold_is_complete check (status <> 'sold' or (sold_date is not null and sale_price_per_gram is not null)),
  constraint gold_sold_after_purchase check (sold_date is null or sold_date >= purchase_date)
);

create index if not exists gold_holdings_user_purchase_idx on public.gold_holdings (user_id, purchase_date desc);

create or replace trigger gold_holdings_set_updated_at
before update on public.gold_holdings
for each row execute function public.set_updated_at();

create table if not exists public.gold_prices (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  price_24 numeric(18, 2) check (price_24 > 0),
  price_21 numeric(18, 2) check (price_21 > 0),
  price_18 numeric(18, 2) check (price_18 > 0),
  updated_at timestamptz not null default now()
);

create or replace trigger gold_prices_set_updated_at
before update on public.gold_prices
for each row execute function public.set_updated_at();

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  occurred_on date not null,
  kind text not null check (kind in ('deposit', 'withdrawal')),
  amount numeric(18, 2) not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists cash_transactions_user_date_idx on public.cash_transactions (user_id, occurred_on desc);

alter table public.gold_holdings enable row level security;
alter table public.gold_prices enable row level security;
alter table public.cash_transactions enable row level security;

create policy "Users can read their own gold" on public.gold_holdings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own gold" on public.gold_holdings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own gold" on public.gold_holdings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own gold" on public.gold_holdings for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own gold prices" on public.gold_prices for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own gold prices" on public.gold_prices for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own gold prices" on public.gold_prices for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can read their own cash" on public.cash_transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own cash" on public.cash_transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own cash" on public.cash_transactions for delete to authenticated
  using ((select auth.uid()) = user_id);
