alter table public.trades drop constraint trades_asset_type_check;

alter table public.trades
  add constraint trades_asset_type_check check (asset_type in ('stock', 'equity_fund', 'gold_fund'));

alter table public.trades
  add column if not exists fund_id text check (fund_id ~ '^[0-9]{1,10}$');

alter table public.trades
  alter column quantity type numeric(18, 4);
