-- Copy Campus Database Schema SQL
-- Use this file to initialize tables in your Supabase SQL Editor.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. OPERATORS TABLE
create table public.operators (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    shop_name text not null,
    upi_id text not null,
    open_hours_from text default '09:00',
    open_hours_to text default '18:00',
    open_days text[] default array['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    max_queue integer default 20,
    auto_accept boolean default false,
    closed_mode boolean default false,
    price_bw numeric default 2.0,
    price_color numeric default 7.0,
    price_a3_surcharge numeric default 3.0,
    price_binding numeric default 20.0,
    price_stapling numeric default 5.0,
    price_urgent numeric default 10.0,
    notify_sms boolean default true,
    notify_whatsapp boolean default true,
    notify_email boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.operators enable row level security;
create policy "Allow operators full access to their own data"
    on public.operators for all using (true); -- Simplified for mock integration

-- 2. PRINTERS TABLE
create table public.printers (
    id uuid default uuid_generate_v4() primary key,
    operator_id uuid references public.operators(id) on delete cascade,
    name text not null,
    type text not null check (type in ('B&W', 'Color')),
    paper_count integer default 500,
    ink_percent integer default 100,
    is_online boolean default true,
    supported_sizes text[] default array['A4'],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.printers enable row level security;
create policy "Allow operators full access to their own printers"
    on public.printers for all using (true);

-- 3. STUDENTS TABLE
create table public.students (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    branch text not null,
    section text not null,
    roll_no text not null unique,
    credit_balance integer default 100,
    total_orders integer default 0
);

alter table public.students enable row level security;
create policy "Allow read access to students profile"
    on public.students for select using (true);
create policy "Allow modify access to student profile"
    on public.students for all using (true);

-- 4. ORDERS TABLE
create table public.orders (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id),
    operator_id uuid references public.operators(id),
    printer_id uuid references public.printers(id) on delete set null,
    status text not null check (status in ('New', 'Printing', 'Ready', 'Done', 'Issue')),
    pages integer not null,
    type text not null check (type in ('B&W', 'Color')),
    size text not null default 'A4',
    finishing text default 'None',
    pdf_url text,
    credits_used integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    accepted_at timestamp with time zone,
    ready_at timestamp with time zone,
    collected_at timestamp with time zone,
    is_bulk boolean default false,
    reprint_reason text
);

alter table public.orders enable row level security;
create policy "Allow operators and students access to orders"
    on public.orders for all using (true);

-- 5. TRANSACTIONS TABLE
create table public.transactions (
    id uuid default uuid_generate_v4() primary key,
    operator_id uuid references public.operators(id) on delete cascade,
    order_id uuid references public.orders(id) on delete set null,
    type text not null check (type in ('Credit', 'Debit')),
    amount numeric not null,
    note text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create policy "Allow operator to view transactions"
    on public.transactions for all using (true);

-- 6. ALERTS TABLE
create table public.alerts (
    id uuid default uuid_generate_v4() primary key,
    operator_id uuid references public.operators(id) on delete cascade,
    type text not null check (type in ('Low Supply', 'New Order', 'Issue', 'Payment', 'Warning')),
    message text not null,
    is_read boolean default false,
    related_order_id uuid references public.orders(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.alerts enable row level security;
create policy "Allow operator full access to alerts"
    on public.alerts for all using (true);
