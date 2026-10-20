alter table public.trades
  add column if not exists manual_price numeric(18, 4) check (manual_price > 0);

alter table public.trades
  add column if not exists manual_price_date date;

alter table public.trades
  add constraint trades_manual_price_date_check check (manual_price is null or manual_price_date is not null);
