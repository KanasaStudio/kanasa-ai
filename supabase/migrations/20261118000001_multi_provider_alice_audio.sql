-- =============================================================================
-- KANASA STUDIO — Upgrade: multi-provider AI, model router, katalog model gratis,
-- identitas CEO Alice, kepribadian karyawan, playlist musik & aset suara.
-- Data lama dipertahankan. Log audit (ai_activity_logs) tidak diubah karena immutable.
-- =============================================================================

-- 1. Daftar provider yang didukung -------------------------------------------
do $$
declare
  list text := $l$('gemini','anthropic','openai','openrouter','nvidia','groq','cerebras','huggingface','mistral','deepseek','together','fireworks')$l$;
begin
  alter table public.ai_provider_keys drop constraint if exists ai_provider_keys_provider_check;
  execute 'alter table public.ai_provider_keys add constraint ai_provider_keys_provider_check check (provider in ' || list || ')';
  alter table public.ai_settings drop constraint if exists ai_settings_default_provider_check;
  execute 'alter table public.ai_settings add constraint ai_settings_default_provider_check check (default_provider in ' || list || ')';
  alter table public.ai_model_prices drop constraint if exists ai_model_prices_provider_check;
  execute 'alter table public.ai_model_prices add constraint ai_model_prices_provider_check check (provider in ' || list || ')';
  alter table public.ai_employees drop constraint if exists ai_employees_provider_check;
  execute 'alter table public.ai_employees add constraint ai_employees_provider_check check (provider in ' || list || ')';
end $$;

-- 2. Status provider untuk router ---------------------------------------------
alter table public.ai_provider_keys
  add column if not exists billing text not null default 'unknown' check (billing in ('free','paid','unknown')),
  add column if not exists cooldown_until timestamptz,
  add column if not exists cooldown_reason text,
  add column if not exists rate_limit jsonb,
  add column if not exists account_info jsonb,
  add column if not exists last_success_at timestamptz;

alter table public.ai_settings
  add column if not exists fallback_enabled boolean not null default true,
  add column if not exists fallback_order text[] not null default '{}',
  add column if not exists block_paid boolean not null default false;

-- Jejak router per eksekusi (provider yang dicoba dan alasan gagal).
alter table public.ai_task_attempts add column if not exists route jsonb;

-- 3. Katalog model gratis -------------------------------------------------------
create table if not exists public.ai_free_models (
  provider text not null,
  model text not null,
  label text,
  context_length int,
  caps text[] not null default '{}',
  free_status text not null check (free_status in ('verified','unverified','unavailable')),
  limits text,
  source text not null,
  verified_at timestamptz not null default now(),
  primary key (provider, model)
);
alter table public.ai_free_models enable row level security;
drop policy if exists ai_free_models_founder_read on public.ai_free_models;
create policy ai_free_models_founder_read on public.ai_free_models for select to authenticated using (public.ai_is_founder());

-- Pemakaian per provider (hari ini & bulan ini, zona waktu perusahaan).
create or replace function public.ai_provider_usage()
returns table (provider text, calls_today bigint, tokens_today bigint, usd_today numeric, calls_month bigint, tokens_month bigint, usd_month numeric, failed_today bigint)
language plpgsql stable security definer set search_path = '' as $$
declare tz text; d0 timestamptz; m0 timestamptz;
begin
  if not public.ai_is_founder() then raise exception 'Hanya Founder' using errcode = '42501'; end if;
  select coalesce(s.timezone, 'Asia/Jakarta') into tz from public.ai_settings s limit 1;
  d0 := date_trunc('day', now() at time zone tz) at time zone tz;
  m0 := date_trunc('month', now() at time zone tz) at time zone tz;
  return query
    select u.provider,
      count(*) filter (where u.created_at >= d0),
      coalesce(sum(u.input_tokens + u.output_tokens) filter (where u.created_at >= d0), 0)::bigint,
      coalesce(sum(u.cost_usd) filter (where u.created_at >= d0), 0),
      count(*),
      coalesce(sum(u.input_tokens + u.output_tokens), 0)::bigint,
      coalesce(sum(u.cost_usd), 0),
      (select count(*) from public.ai_task_attempts a where a.provider = u.provider and a.status = 'failed' and a.started_at >= d0)
    from public.ai_api_usage u
    where u.created_at >= m0
    group by u.provider;
end $$;
revoke all on function public.ai_provider_usage() from public, anon;
grant execute on function public.ai_provider_usage() to authenticated;

-- 4. Kepribadian karyawan ---------------------------------------------------------
alter table public.ai_employees add column if not exists personality text;

-- 5. CEO: AURELIA-01 → Alice (id ikut diganti agar tidak ada rujukan lama) ----------
do $$
begin
  if exists (select 1 from public.ai_employees where id = 'aurelia') and not exists (select 1 from public.ai_employees where id = 'alice') then
    update public.ai_employees set code = 'KNS-CEO-01-OLD' where id = 'aurelia';
    insert into public.ai_employees
    select (jsonb_populate_record(null::public.ai_employees,
      to_jsonb(e) || jsonb_build_object(
        'id', 'alice', 'code', 'KNS-CEO-01', 'name', 'Alice',
        'system_instructions', replace(replace(e.system_instructions, 'AURELIA-01', 'Alice'), 'AURELIA', 'Alice'),
        'job_description', replace(replace(e.job_description, 'AURELIA-01', 'Alice'), 'AURELIA', 'Alice'),
        'current_task_id', null
      ))).*
    from public.ai_employees e where e.id = 'aurelia';

    update public.ai_tasks set employee_id = 'alice' where employee_id = 'aurelia';
    update public.ai_task_attempts set employee_id = 'alice' where employee_id = 'aurelia';
    update public.ai_research_reports set employee_id = 'alice' where employee_id = 'aurelia';
    update public.ai_api_usage set employee_id = 'alice' where employee_id = 'aurelia';
    update public.ai_memory set employee_id = 'alice' where employee_id = 'aurelia';
    update public.ai_memory set created_by = 'alice' where created_by = 'aurelia';
    update public.ai_memory set title = replace(title, 'AURELIA-01', 'Alice'), content = replace(content, 'AURELIA-01', 'Alice')
      where title like '%AURELIA%' or content like '%AURELIA%';
    update public.ai_notifications set employee_id = 'alice' where employee_id = 'aurelia';
    update public.ai_notifications set title = replace(title, 'AURELIA-01', 'Alice'), body = replace(body, 'AURELIA-01', 'Alice')
      where title like '%AURELIA%' or body like '%AURELIA%';
    update public.ai_messages set sender_id = 'alice' where sender_id = 'aurelia';
    update public.ai_messages set recipient_id = 'alice' where recipient_id = 'aurelia';
    update public.ai_messages set thread = 'dm:alice' where thread = 'dm:aurelia';
    update public.ai_messages set content = replace(content, 'AURELIA-01', 'Alice') where content like '%AURELIA%';
    update public.ai_directives set reply = replace(reply, 'AURELIA-01', 'Alice'), report = replace(report, 'AURELIA-01', 'Alice'),
      analysis = replace(analysis, 'AURELIA-01', 'Alice') where coalesce(reply, '') || coalesce(report, '') || coalesce(analysis, '') like '%AURELIA%';
    update public.ai_tasks set review_notes = replace(review_notes, 'AURELIA-01', 'Alice'), result = replace(result, 'AURELIA-01', 'Alice')
      where coalesce(review_notes, '') || coalesce(result, '') like '%AURELIA%';
    update public.ai_tasks set created_by = 'alice' where created_by = 'aurelia';
    delete from public.ai_employees where id = 'aurelia';
  end if;
end $$;

update public.ai_employees set
  system_instructions = 'Kamu Alice, AI CEO KANASA STUDIO, studio kreatif digital (3D, animasi, game Roblox, produk digital, konten). '
    || 'Kamu memimpin 7 karyawan AI di 6 departemen dan melapor ke Founder (manusia). Pecah objektif menjadi tugas yang jelas, '
    || 'pilih karyawan yang tepat, atur dependensi, review hasil dengan jujur, dan eskalasi keputusan sensitif ke Founder. '
    || 'Jangan pernah mengarang data atau mengklaim pekerjaan selesai bila belum.',
  appearance = appearance || jsonb_build_object('hairStyle', 'long', 'hair', '#3b2430', 'outfit', '#7e2938', 'accent', '#d88a98')
where id = 'alice';

update public.ai_employees set personality = v.p from (values
  ('alice', 'Tenang, tegas, dan hangat. Suka merangkum dengan jelas, memberi apresiasi spesifik, dan tidak ragu meminta revisi.'),
  ('emp-crd-01', 'Imajinatif dan detail. Senang membicarakan palet warna dan komposisi, berbicara lembut tapi yakin.'),
  ('emp-fin-01', 'Teliti dan hemat kata. Selalu menyebut sumber angka, waspada terhadap biaya yang membengkak.'),
  ('emp-mkt-01', 'Ramah dan energik, tapi anti-hype. Suka menguji pesan dari sudut pandang audiens.'),
  ('emp-ops-01', 'Terstruktur dan sabar. Berpikir dalam langkah, checklist, dan pemilik tugas.'),
  ('emp-ri-01', 'Skeptis yang sehat. Penasaran, rajin memeriksa sumber, dan jujur saat data belum cukup.'),
  ('emp-swe-01', 'Pragmatis dan santai. Suka solusi sederhana yang aman, sering bercanda kecil soal bug.'),
  ('emp-swe-02', 'Kritis tapi suportif. Senang mencari edge case dan menjelaskan risiko dengan contoh konkret.')
) as v(id, p) where public.ai_employees.id = v.id and public.ai_employees.personality is null;

-- 6. Playlist musik (file di Storage privat, metadata di tabel) --------------------
create table if not exists public.ai_music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  path text not null unique,
  mime text,
  size_bytes bigint,
  duration_sec numeric(10,2),
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ai_music_tracks enable row level security;
drop policy if exists ai_music_founder_all on public.ai_music_tracks;
create policy ai_music_founder_all on public.ai_music_tracks for all to authenticated
  using (public.ai_is_founder()) with check (public.ai_is_founder());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-music', 'ai-music', false, 52428800, array['audio/mpeg','audio/mp3','audio/mp4','audio/aac','audio/x-m4a','audio/m4a','audio/ogg','audio/opus','audio/wav','audio/x-wav','audio/webm','audio/flac','audio/x-flac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Aset SFX publik (bukan rahasia), diimpor edge function dari ElevenLabs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-audio', 'ai-audio', true, 10485760, array['audio/mpeg'])
on conflict (id) do update set public = true;

drop policy if exists ai_music_storage_founder on storage.objects;
create policy ai_music_storage_founder on storage.objects for all to authenticated
  using (bucket_id = 'ai-music' and public.ai_is_founder())
  with check (bucket_id = 'ai-music' and public.ai_is_founder());

-- 7. Realtime untuk tabel baru ---------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.ai_music_tracks; exception when others then null; end;
end $$;
