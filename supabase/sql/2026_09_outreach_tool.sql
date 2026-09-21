-- Outreach Tool (lead discovery + enrichment) schema.
-- Applied via the Supabase MCP connector's apply_migration (tracked as a
-- proper migration) — this file is kept in-repo as the source of truth
-- alongside it, matching how the rest of this schema was hand-built.

create extension if not exists pgcrypto;

-- ── outreach_leads ──────────────────────────────────────────────────────
create table if not exists outreach_leads (
  id                uuid primary key default gen_random_uuid(),
  member_id         text not null,
  audience          text not null check (audience in ('influencer', 'public')),
  platform          text not null check (platform in ('instagram', 'tiktok', 'linkedin', 'email')),
  handle            text,
  first_name        text,
  followers         integer,
  niche             text,
  notes             text,
  email             text,
  draft_message     jsonb,
  needs_enrichment  boolean not null default false,
  contacted         boolean not null default false,
  created_at        timestamptz not null default now(),
  contacted_at      timestamptz,
  updated_at        timestamptz not null default now()
);

create index if not exists outreach_leads_member_created_idx
  on outreach_leads (member_id, created_at desc);

-- ── member_affiliate_links (platform-wide pattern, not outreach-specific) ─
create table if not exists member_affiliate_links (
  member_id      text not null,
  provider       text not null,
  affiliate_url  text not null,
  updated_at     timestamptz not null default now(),
  primary key (member_id, provider)
);

-- ── member_email_integrations (BYOK email automation) ──────────────────
-- api_key_encrypted holds an AES-256-GCM ciphertext produced by lib/crypto.ts
-- (iv:authTag:ciphertext, base64) — never store the raw provider key.
create table if not exists member_email_integrations (
  member_id          text primary key,
  provider           text not null check (provider in ('brevo', 'mailchimp', 'convertkit', 'other')),
  api_key_encrypted  text not null,
  from_name          text,
  from_email         text,
  connected_at       timestamptz not null default now()
);

-- ── RLS — matches every other per-member table in this schema exactly:
-- RLS enabled + an "own row" policy keyed off current_setting('app.member_id').
-- The app only ever queries via the service-role key (which bypasses RLS),
-- so this is defense-in-depth, not the enforcement mechanism — but every
-- existing table in this project follows this same convention.
alter table outreach_leads enable row level security;
create policy outreach_leads_own on outreach_leads for all
  using (member_id = current_setting('app.member_id', true));

alter table member_affiliate_links enable row level security;
create policy member_affiliate_links_own on member_affiliate_links for all
  using (member_id = current_setting('app.member_id', true));

alter table member_email_integrations enable row level security;
create policy member_email_integrations_own on member_email_integrations for all
  using (member_id = current_setting('app.member_id', true));

-- ── Atomic "add lead" (single, from Add-Lead / enrich flow) ────────────
-- Locks the member's credit row, verifies balance, deducts, and inserts the
-- lead in one transaction — a failed check raises and nothing is written.
create or replace function outreach_add_lead(
  p_member_id text,
  p_cost int,
  p_lead jsonb
) returns outreach_leads
language plpgsql
as $$
declare
  v_remaining int;
  v_row outreach_leads;
begin
  select credits_remaining into v_remaining
    from member_credits
    where member_id = p_member_id
    for update;

  if v_remaining is null or v_remaining < p_cost then
    raise exception 'NO_CREDITS';
  end if;

  update member_credits
    set credits_remaining = credits_remaining - p_cost,
        updated_at = now()
    where member_id = p_member_id;

  insert into outreach_leads (
    member_id, audience, platform, handle, first_name, followers,
    niche, notes, email, draft_message, needs_enrichment
  ) values (
    p_member_id,
    p_lead->>'audience',
    p_lead->>'platform',
    p_lead->>'handle',
    p_lead->>'first_name',
    nullif(p_lead->>'followers', '')::int,
    p_lead->>'niche',
    p_lead->>'notes',
    p_lead->>'email',
    p_lead->'draft_message',
    coalesce((p_lead->>'needs_enrichment')::boolean, false)
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ── Atomic "generate leads" batch (discovery flow) ─────────────────────
-- p_leads is a jsonb array; charges p_cost_per_lead * jsonb_array_length(p_leads)
-- once, then inserts every row. All-or-nothing.
create or replace function outreach_add_leads_batch(
  p_member_id text,
  p_cost_per_lead int,
  p_leads jsonb
) returns setof outreach_leads
language plpgsql
as $$
declare
  v_remaining int;
  v_count int := jsonb_array_length(p_leads);
  v_total_cost int := v_count * p_cost_per_lead;
  v_lead jsonb;
begin
  if v_count = 0 then
    return;
  end if;

  select credits_remaining into v_remaining
    from member_credits
    where member_id = p_member_id
    for update;

  if v_remaining is null or v_remaining < v_total_cost then
    raise exception 'NO_CREDITS';
  end if;

  update member_credits
    set credits_remaining = credits_remaining - v_total_cost,
        updated_at = now()
    where member_id = p_member_id;

  for v_lead in select * from jsonb_array_elements(p_leads)
  loop
    return query
      insert into outreach_leads (
        member_id, audience, platform, handle, first_name, followers,
        niche, notes, email, draft_message, needs_enrichment
      ) values (
        p_member_id,
        v_lead->>'audience',
        v_lead->>'platform',
        v_lead->>'handle',
        v_lead->>'first_name',
        nullif(v_lead->>'followers', '')::int,
        v_lead->>'niche',
        v_lead->>'notes',
        v_lead->>'email',
        v_lead->'draft_message',
        coalesce((v_lead->>'needs_enrichment')::boolean, false)
      )
      returning *;
  end loop;
end;
$$;

-- ── Toggle "contacted" ──────────────────────────────────────────────────
create or replace function outreach_toggle_contacted(
  p_member_id text,
  p_lead_id uuid,
  p_contacted boolean
) returns outreach_leads
language plpgsql
as $$
declare
  v_row outreach_leads;
begin
  update outreach_leads
    set contacted = p_contacted,
        contacted_at = case when p_contacted then now() else null end,
        updated_at = now()
    where id = p_lead_id and member_id = p_member_id
    returning * into v_row;

  if v_row.id is null then
    raise exception 'NOT_FOUND';
  end if;

  return v_row;
end;
$$;

-- ── Pin search_path (fixes the security advisor's "function_search_path_mutable"
-- WARN) so a caller can't influence which objects an unqualified name resolves to.
alter function outreach_add_lead(text, int, jsonb) set search_path = public;
alter function outreach_add_leads_batch(text, int, jsonb) set search_path = public;
alter function outreach_toggle_contacted(text, uuid, boolean) set search_path = public;
