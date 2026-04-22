-- 在 Supabase → SQL Editor 執行（先刪舊資料表再跑）
-- 注意：如果已有舊資料表，先執行下面的刪除

drop table if exists availability cascade;
drop table if exists participants cascade;
drop table if exists sessions cascade;

-- 球局
create table sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null default '羽球局',
  created_by uuid references auth.users(id),      -- 發起人（已登入）
  creator_name text not null,
  creator_avatar text default '😊',
  date_from date not null,
  date_to date not null,
  status text default 'open',                      -- open | confirmed | done
  confirmed_slot text,                             -- 確認的時段 "2024-05-10 19:00"
  confirmed_by text,                               -- 誰確認（預約）的
  booking_status text default 'pending',           -- pending | booked | failed
  booking_note text,                               -- 預約備註（例如幾號場）
  created_at timestamptz default now()
);

-- 參與者
create table participants (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references auth.users(id),          -- 已登入用戶
  name text not null,
  avatar text default '😊',
  join_code text,                                  -- 未登入用的識別碼
  created_at timestamptz default now(),
  unique(session_id, user_id)
);

-- 空閒時段
create table availability (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  slot text not null,
  created_at timestamptz default now(),
  unique(participant_id, slot)
);

-- RLS
alter table sessions enable row level security;
alter table participants enable row level security;
alter table availability enable row level security;

create policy "read sessions" on sessions for select using (true);
create policy "insert sessions" on sessions for insert with check (true);
create policy "update sessions" on sessions for update using (true);
create policy "delete sessions" on sessions for delete using (true);

create policy "read participants" on participants for select using (true);
create policy "insert participants" on participants for insert with check (true);
create policy "update participants" on participants for update using (true);
create policy "delete participants" on participants for delete using (true);

create policy "read availability" on availability for select using (true);
create policy "insert availability" on availability for insert with check (true);
create policy "delete availability" on availability for delete using (true);
