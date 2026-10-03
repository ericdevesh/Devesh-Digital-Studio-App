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


-- Admin-only catalogue writes. Admin status comes from profiles.role.
create policy "admins can manage frames" on frames for all using (
  exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
) with check (
  exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
);

create policy "admins can manage services" on services for all using (
  exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
) with check (
  exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
);

create policy "customers can create bookings" on bookings for insert with check (
  auth.uid() is not null and (customer_id is null or customer_id=auth.uid())
);
create policy "customers can view own bookings" on bookings for select using (
  customer_id=auth.uid() or exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
);

create policy "customers can create frame orders" on frame_orders for insert with check (
  auth.uid() is not null and (customer_id is null or customer_id=auth.uid())
);
create policy "customers can view own frame orders" on frame_orders for select using (
  customer_id=auth.uid() or exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
);

-- Storage buckets. Create these once in Supabase SQL editor.
insert into storage.buckets(id,name,public) values ('frame-images','frame-images',true) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values ('customer-uploads','customer-uploads',false) on conflict(id) do nothing;

create policy "public can read frame images" on storage.objects for select using (bucket_id='frame-images');
create policy "admins can upload frame images" on storage.objects for insert with check (
 bucket_id='frame-images' and exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
);
create policy "admins can update frame images" on storage.objects for update using (
 bucket_id='frame-images' and exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin')
);

create policy "authenticated users upload own customer photos" on storage.objects for insert with check (
 bucket_id='customer-uploads' and auth.uid() is not null
);
create policy "users read own customer photos" on storage.objects for select using (
 bucket_id='customer-uploads' and auth.uid()::text = (storage.foldername(name))[1]
);


-- Automatically create a customer profile after Supabase Auth signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,phone,role)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone','customer')
  on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Bootstrap an administrator manually after creating the account:
-- update public.profiles set role='admin' where id='<AUTH_USER_UUID>';
