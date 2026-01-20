create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code varchar not null unique,
  description text,
  discount_type varchar not null check (discount_type in ('percent', 'amount')),
  discount_value numeric not null check (discount_value > 0),
  min_order_amount numeric not null default 0 check (min_order_amount >= 0),
  max_discount numeric check (max_discount is null or max_discount >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit >= 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists subtotal_amount numeric,
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists coupon_code varchar,
  add column if not exists coupon_id uuid;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'orders'
      and constraint_name = 'orders_coupon_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_coupon_id_fkey
      foreign key (coupon_id) references public.coupons(id)
      on delete set null;
  end if;
end $$;

update public.orders
set subtotal_amount = total_amount
where subtotal_amount is null;

