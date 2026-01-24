alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists payment_status text,
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text,
  add column if not exists payment_currency text,
  add column if not exists payment_amount_paise integer,
  add column if not exists payment_captured_at timestamptz,
  add column if not exists webhook_last_event_id text,
  add column if not exists webhook_last_event_at timestamptz,
  add column if not exists webhook_last_event_type text;

update public.orders
set payment_provider = coalesce(payment_provider, 'razorpay')
where payment_provider is null;

update public.orders
set payment_status = coalesce(payment_status, case when payment_id is null then 'created' else 'captured' end)
where payment_status is null;

