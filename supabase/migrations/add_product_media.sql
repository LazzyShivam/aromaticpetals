create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_media_product_id_idx on public.product_media(product_id);
create index if not exists product_media_product_id_sort_idx on public.product_media(product_id, sort_order, created_at);

alter table public.product_media enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_media'
      and policyname = 'Allow public read'
  ) then
    create policy "Allow public read" on public.product_media
      for select
      using (true);
  end if;
end $$;

