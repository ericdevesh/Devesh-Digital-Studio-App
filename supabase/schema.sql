-- Devesh Digital Studio production schema
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists frames (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text not null,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_from numeric(10,2) check (price_from >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) on delete set null,
  name text not null,
  phone text not null,
  event_date date not null,
  location text not null,
  service_id uuid references services(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','confirmed','advance_paid','in_progress','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists frame_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) on delete set null,
  frame_id uuid references frames(id) on delete set null,
  customer_name text not null,
  phone text not null,
  photo_path text,
  quantity integer not null default 1 check (quantity > 0),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  delivery_address text,
  status text not null default 'received' check (status in ('received','designing','printing','ready','delivered','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded')),
  payment_order_id text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table frames enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
alter table frame_orders enable row level security;

create policy "public can view active frames" on frames for select using (active = true);
create policy "public can view active services" on services for select using (active = true);

-- Customer writes should be performed through a server/API with validated identity.
-- Do not add permissive anonymous insert policies for production orders/bookings.
