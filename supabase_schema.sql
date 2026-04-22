-- 先刪舊資料表
drop table if exists availability cascade;
drop table if exists participants cascade;
drop table if exists sessions cascade;
drop table if exists members cascade;

-- 成員表（每個帳號可以有多個成員）
create table members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  avatar text default '🏸',
  is_self boolean default true,   -- true = 本人, false = 代填的人
  created_at timestamptz default now()
);

-- 球局
create table sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null default '羽球局',
  created_by uuid references auth.users(id),
  creator_name text not null,
  date_from date not null,
  date_to date not null,
  status text default 'open',           -- open | confirmed | done
  confirmed_slot text,
  confirmed_by text,
  booking_status text default 'pending', -- pending | booked
  booking_note text,
  venue text default '貓羅羽球館',
  created_at timestamptz default now()
);

-- 球局參與者（帳號層級）
create table session_users (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references auth.users(id),
  joined_at timestamptz default now(),
  unique(session_id, user_id)
);

-- 每個成員的空閒時段
-- slot 格式: "2024-05-10 19:00"
-- filled_by: 哪個 user_id 幫填的
create table availability (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  member_name text not null,
  slot text not null,
  filled_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(session_id, member_id, slot)
);

-- RLS（全開，用 app 邏輯控制權限）
alter table members enable row level security;
alter table sessions enable row level security;
alter table session_users enable row level security;
alter table availability enable row level security;

create policy "all members" on members for all using (true) with check (true);
create policy "all sessions" on sessions for all using (true) with check (true);
create policy "all session_users" on session_users for all using (true) with check (true);
create policy "all availability" on availability for all using (true) with check (true);
