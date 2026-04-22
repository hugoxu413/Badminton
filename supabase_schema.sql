-- 在 Supabase → SQL Editor 執行這段建立資料表

-- 球局 sessions
create table sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null default '羽球局',
  created_by text not null,         -- 發起人暱稱
  date_from date not null,          -- 開放填寫的日期範圍開始
  date_to date not null,            -- 日期範圍結束
  status text default 'open',       -- open | confirmed | done
  confirmed_slot text,              -- 最終確認的時段 "2024-05-10 19:00"
  venue text,                       -- 確認的球場
  created_at timestamptz default now()
);

-- 參與者 participants
create table participants (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  name text not null,               -- 暱稱
  avatar text not null default '😊',
  join_code text not null,          -- 用來識別同一個人（存在 localStorage）
  created_at timestamptz default now()
);

-- 每人的空閒時段 availability
-- slot 格式: "2024-05-10 19:00"
create table availability (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  slot text not null,
  created_at timestamptz default now(),
  unique(participant_id, slot)
);

-- 開放 row level security（讓前端可以直接讀寫）
alter table sessions enable row level security;
alter table participants enable row level security;
alter table availability enable row level security;

-- 所有人都可以讀（球局是共享的）
create policy "anyone can read sessions" on sessions for select using (true);
create policy "anyone can read participants" on participants for select using (true);
create policy "anyone can read availability" on availability for select using (true);

-- 所有人都可以新增
create policy "anyone can insert sessions" on sessions for insert with check (true);
create policy "anyone can insert participants" on participants for insert with check (true);
create policy "anyone can insert availability" on availability for insert with check (true);

-- 所有人都可以更新（實際上會用 join_code 做保護）
create policy "anyone can update sessions" on sessions for update using (true);
create policy "anyone can update availability" on availability for update using (true);
create policy "anyone can delete availability" on availability for delete using (true);
