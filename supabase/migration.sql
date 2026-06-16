-- ============================================================
-- Migration: Esquema inicial para Control de Stock
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. EXTENSIONES -----------------------------------------------

create extension if not exists "moddatetime" with schema extensions;

-- 2. TABLAS ----------------------------------------------------

create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text not null default '',
  barcode     text not null default '',
  category_id uuid references categories(id) on delete set null,
  price       numeric not null default 0,
  cost        numeric not null default 0,
  stock       integer not null default 0,
  min_stock   integer not null default 0,
  description text not null default '',
  images      text[] not null default '{}',
  enabled     boolean not null default true,
  user_id     uuid not null default auth.uid() references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table sales (
  id             uuid primary key default gen_random_uuid(),
  items          jsonb not null default '[]'::jsonb,
  total          numeric not null default 0,
  payment_method text not null,
  status         text not null default 'active',
  user_id        uuid not null default auth.uid() references auth.users(id),
  created_at     timestamptz not null default now()
);

create table purchases (
  id         uuid primary key default gen_random_uuid(),
  items      jsonb not null default '[]'::jsonb,
  total      numeric not null default 0,
  date       text not null default '',
  user_id    uuid not null default auth.uid() references auth.users(id),
  user_email text not null default '',
  created_at timestamptz not null default now()
);

create table profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone     text not null default '',
  avatar_url text not null default '',
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function moddatetime(updated_at);

-- 3. ÍNDICES ---------------------------------------------------

create index idx_products_category_id on products(category_id);
create index idx_products_barcode     on products(barcode);
create index idx_sales_created_at     on sales(created_at desc);
create index idx_purchases_created_at on purchases(created_at desc);

-- 4. RLS -------------------------------------------------------

alter table categories enable row level security;
alter table products   enable row level security;
alter table sales      enable row level security;
alter table purchases  enable row level security;

-- Todas las policies: cualquier usuario autenticado puede leer/escribir
-- (tienda compartida, el user_id es solo para trazabilidad)

create policy "auth_categories_select" on categories for select using (auth.role() = 'authenticated');
create policy "auth_categories_insert" on categories for insert with check (auth.role() = 'authenticated');
create policy "auth_categories_update" on categories for update using (auth.role() = 'authenticated');
create policy "auth_categories_delete" on categories for delete using (auth.role() = 'authenticated');

create policy "auth_products_select" on products for select using (auth.role() = 'authenticated');
create policy "auth_products_insert" on products for insert with check (auth.role() = 'authenticated');
create policy "auth_products_update" on products for update using (auth.role() = 'authenticated');
create policy "auth_products_delete" on products for delete using (auth.role() = 'authenticated');

create policy "auth_sales_select" on sales for select using (auth.role() = 'authenticated');
create policy "auth_sales_insert" on sales for insert with check (auth.role() = 'authenticated');
create policy "auth_sales_update" on sales for update using (auth.role() = 'authenticated');
create policy "auth_sales_delete" on sales for delete using (auth.role() = 'authenticated');

create policy "auth_purchases_select" on purchases for select using (auth.role() = 'authenticated');
create policy "auth_purchases_insert" on purchases for insert with check (auth.role() = 'authenticated');
create policy "auth_purchases_update" on purchases for update using (auth.role() = 'authenticated');
create policy "auth_purchases_delete" on purchases for delete using (auth.role() = 'authenticated');

alter table profiles enable row level security;

create policy "auth_profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "auth_profiles_insert" on profiles for insert with check (auth.role() = 'authenticated');
create policy "auth_profiles_update" on profiles for update using (auth.role() = 'authenticated');

-- 5. TRIGGER: updated_at automático ----------------------------

create trigger products_updated_at
  before update on products
  for each row execute function moddatetime(updated_at);

-- 6. STORAGE: bucket para imágenes de productos ----------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "auth_product_images_select"
  on storage.objects for select using (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );

create policy "auth_product_images_insert"
  on storage.objects for insert with check (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );

create policy "auth_product_images_update"
  on storage.objects for update using (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );

create policy "auth_product_images_delete"
  on storage.objects for delete using (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
  );

-- 8. STORAGE: bucket para avatares -------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "auth_avatars_select"
  on storage.objects for select using (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

create policy "auth_avatars_insert"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

create policy "auth_avatars_update"
  on storage.objects for update using (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

create policy "auth_avatars_delete"
  on storage.objects for delete using (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

-- 7. TABLA INVOICES ---------------------------------------------

create table invoices (
  id         uuid primary key default gen_random_uuid(),
  file_name  text not null default '',
  file_hash  text not null default '',
  date       text not null default '',
  total      numeric not null default 0,
  items      jsonb not null default '[]'::jsonb,
  image_url  text not null default '',
  status     text not null default 'processed',
  user_id    uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

alter table invoices enable row level security;

create policy "auth_invoices_select" on invoices for select using (auth.role() = 'authenticated');
create policy "auth_invoices_insert" on invoices for insert with check (auth.role() = 'authenticated');
create policy "auth_invoices_update" on invoices for update using (auth.role() = 'authenticated');
create policy "auth_invoices_delete" on invoices for delete using (auth.role() = 'authenticated');

create index idx_invoices_created_at on invoices(created_at desc);
create index idx_invoices_file_hash on invoices(file_hash);

alter table purchases add column iva numeric not null default 0;
alter table purchases add column iibb numeric not null default 0;
alter table invoices add column iva numeric not null default 0;
alter table invoices add column iibb numeric not null default 0;
alter table invoices add column user_email text not null default '';

-- 9. STORAGE: bucket para archivos de facturas --------------------

insert into storage.buckets (id, name, public)
values ('invoice-files', 'invoice-files', true)
on conflict (id) do nothing;

create policy "auth_invoice_files_select"
  on storage.objects for select using (
    bucket_id = 'invoice-files' and auth.role() = 'authenticated'
  );

create policy "auth_invoice_files_insert"
  on storage.objects for insert with check (
    bucket_id = 'invoice-files' and auth.role() = 'authenticated'
  );

create policy "auth_invoice_files_update"
  on storage.objects for update using (
    bucket_id = 'invoice-files' and auth.role() = 'authenticated'
  );

create policy "auth_invoice_files_delete"
  on storage.objects for delete using (
    bucket_id = 'invoice-files' and auth.role() = 'authenticated'
  );

-- 10. TABLA BACKUPS ------------------------------------------------

create table backups (
  id         uuid primary key default gen_random_uuid(),
  file_name  text not null default '',
  file_path  text not null default '',
  size_bytes integer not null default 0,
  duration_ms integer not null default 0,
  tables     text[] not null default '{}',
  status     text not null default 'completed',
  user_id    uuid not null default auth.uid() references auth.users(id),
  user_email text not null default '',
  created_at timestamptz not null default now()
);

alter table backups enable row level security;

create policy "auth_backups_select" on backups for select using (auth.role() = 'authenticated');
create policy "auth_backups_insert" on backups for insert with check (auth.role() = 'authenticated');
create policy "auth_backups_delete" on backups for delete using (auth.role() = 'authenticated');

-- 11. STORAGE: bucket para backups --------------------------------

insert into storage.buckets (id, name, public)
values ('backups', 'backups', true)
on conflict (id) do nothing;

create policy "auth_backups_files_select"
  on storage.objects for select using (
    bucket_id = 'backups' and auth.role() = 'authenticated'
  );

create policy "auth_backups_files_insert"
  on storage.objects for insert with check (
    bucket_id = 'backups' and auth.role() = 'authenticated'
  );

create policy "auth_backups_files_delete"
  on storage.objects for delete using (
    bucket_id = 'backups' and auth.role() = 'authenticated'
  );

create table bot_sessions (
  id         uuid primary key default gen_random_uuid(),
  chat_id    bigint not null,
  data       jsonb not null default '{}',
  status     text not null default 'waiting_category',
  created_at timestamptz not null default now()
);

alter table bot_sessions enable row level security;

create policy "service_bot_sessions_all" on bot_sessions
  using (true) with check (true);

create or replace function delete_old_bot_sessions()
returns void language sql as $$
  delete from bot_sessions
  where created_at < now() - interval '1 hour';
$$;

-- 12. DESCUENTO EN VENTAS ------------------------------------------

alter table sales add column discount_percent numeric not null default 0;