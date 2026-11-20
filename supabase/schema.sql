-- NOOR APP (همراه معنوی نور) — 2026 Production Schema
-- Compatible with Supabase (Free) & future migration to Iran PostgreSQL (Liara / Linux VPS)

create extension if not exists "pgcrypto";

create or replace function public.noor_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'کاربر نور',
  phone text unique,
  city_id text not null default 'mashhad',
  calculation_method text not null default 'tehran',
  notif_enabled boolean not null default true,
  theme_id text not null default 'emerald',
  adhan_id text not null default 'moazenzadeh_ardabili',
  app_settings jsonb not null default '{}'::jsonb,
  quran_state jsonb not null default '{}'::jsonb,
  reminders_backup jsonb not null default '{}'::jsonb,
  tawashih_config jsonb not null default '{}'::jsonb,
  surah_alarms jsonb not null default '{}'::jsonb,
  qaza_state jsonb not null default '{}'::jsonb,
  custom_dhikrs jsonb not null default '[]'::jsonb,
  last_synced_platform text default 'android',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasbih_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  dhikr_id text not null default 'salawat',
  count integer not null default 0 check (count >= 0),
  rounds integer not null default 0 check (rounds >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, log_date, dhikr_id)
);

create table if not exists public.media_catalog (
  id text primary key,
  category text not null check (category in ('adhan', 'pre_adhan', 'post_adhan', 'dua', 'surah')),
  title_fa text not null,
  subtitle_fa text not null default '',
  reciter_fa text not null default '',
  audio_url text not null,
  duration_fa text not null default '',
  file_size_kb integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  catalog_version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('android', 'web_ios', 'chrome_ext')),
  version_code integer not null,
  version_name text not null,
  download_url text not null,
  changelog_fa text not null default '',
  force_update boolean not null default false,
  is_active boolean not null default true,
  published_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.global_sync_meta (
  id integer primary key default 1 check (id = 1),
  catalog_version integer not null default 1,
  min_android_version_code integer not null default 1,
  announcement_fa text not null default '',
  announcement_active boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);
