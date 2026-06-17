-- Row-Level Security: this is where campaign permissions actually live, since
-- there is no app server to enforce them. Every table is locked down and access
-- is granted through policies keyed on campaign membership/role.

-- ───────────────────────────────────── extra helpers (campaign lookups) ──
create or replace function chapter_campaign(chid uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select campaign_id from chapters where id = chid;
$$;

create or replace function session_campaign(sid uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select campaign_id from sessions where id = sid;
$$;

-- On campaign creation, make the owner a master and open its single session.
create or replace function handle_new_campaign()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into campaign_members (campaign_id, user_id, role)
    values (new.id, new.owner_id, 'master');
  insert into sessions (campaign_id) values (new.id);
  return new;
end;
$$;

create trigger on_campaign_created
  after insert on campaigns
  for each row execute function handle_new_campaign();

-- ──────────────────────────────────────────────────── enable RLS on all ──
alter table profiles          enable row level security;
alter table campaigns         enable row level security;
alter table campaign_members  enable row level security;
alter table campaign_invites  enable row level security;
alter table assets            enable row level security;
alter table maps              enable row level security;
alter table chapters          enable row level security;
alter table tokens            enable row level security;
alter table token_controllers enable row level security;
alter table sessions          enable row level security;
alter table session_events    enable row level security;
alter table audio_tracks      enable row level security;

-- ───────────────────────────────────────────────────────────── profiles ──
-- Readable by any authenticated user (needed to look up usernames for invites).
create policy profiles_select on profiles
  for select to authenticated using (true);
create policy profiles_insert_self on profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ──────────────────────────────────────────────────────────── campaigns ──
create policy campaigns_select on campaigns
  for select to authenticated using (is_campaign_member(id));
create policy campaigns_insert on campaigns
  for insert to authenticated with check (owner_id = auth.uid());
create policy campaigns_update on campaigns
  for update to authenticated using (is_campaign_master(id)) with check (is_campaign_master(id));
create policy campaigns_delete on campaigns
  for delete to authenticated using (owner_id = auth.uid());

-- ──────────────────────────────────────────────────── campaign_members ──
create policy members_select on campaign_members
  for select to authenticated using (is_campaign_member(campaign_id));
-- Master adds members directly; a user may add themselves if invited (accept).
create policy members_insert on campaign_members
  for insert to authenticated with check (
    is_campaign_master(campaign_id)
    or (
      user_id = auth.uid()
      and exists (
        select 1 from campaign_invites i
        where i.campaign_id = campaign_members.campaign_id
          and i.invited_user_id = auth.uid()
          and i.status = 'pending'
      )
    )
  );
create policy members_update on campaign_members
  for update to authenticated using (is_campaign_master(campaign_id));
create policy members_delete on campaign_members
  for delete to authenticated using (
    is_campaign_master(campaign_id) or user_id = auth.uid() -- master kicks, or self leaves
  );

-- ──────────────────────────────────────────────────── campaign_invites ──
-- Only the master can invite (per the design).
create policy invites_select on campaign_invites
  for select to authenticated using (
    invited_user_id = auth.uid() or is_campaign_master(campaign_id)
  );
create policy invites_insert on campaign_invites
  for insert to authenticated with check (
    is_campaign_master(campaign_id) and invited_by = auth.uid()
  );
create policy invites_update on campaign_invites
  for update to authenticated using (
    invited_user_id = auth.uid() or is_campaign_master(campaign_id)
  );
create policy invites_delete on campaign_invites
  for delete to authenticated using (is_campaign_master(campaign_id));

-- ─── campaign-scoped content: members read, masters write ─────────────────
create policy assets_select on assets
  for select to authenticated using (is_campaign_member(campaign_id));
create policy assets_write on assets
  for all to authenticated using (is_campaign_master(campaign_id)) with check (is_campaign_master(campaign_id));

create policy maps_select on maps
  for select to authenticated using (is_campaign_member(campaign_id));
create policy maps_write on maps
  for all to authenticated using (is_campaign_master(campaign_id)) with check (is_campaign_master(campaign_id));

create policy chapters_select on chapters
  for select to authenticated using (is_campaign_member(campaign_id));
create policy chapters_write on chapters
  for all to authenticated using (is_campaign_master(campaign_id)) with check (is_campaign_master(campaign_id));

create policy audio_select on audio_tracks
  for select to authenticated using (is_campaign_member(campaign_id));
create policy audio_write on audio_tracks
  for all to authenticated using (is_campaign_master(campaign_id)) with check (is_campaign_master(campaign_id));

-- ─────────────────────────────────────────────────────────────── tokens ──
-- Members see tokens of their campaign, EXCEPT hidden ones (master + assigned
-- controllers still see those).
create policy tokens_select on tokens
  for select to authenticated using (
    is_campaign_member(chapter_campaign(chapter_id))
    and (
      not is_hidden
      or is_campaign_master(chapter_campaign(chapter_id))
      or exists (
        select 1 from token_controllers tc
        where tc.token_id = tokens.id and tc.user_id = auth.uid()
      )
    )
  );
-- Master creates/deletes/edits any token; assigned controllers may update
-- (move) tokens they control. Column-level move-only restriction is enforced
-- client-side for now (trusted-table assumption).
create policy tokens_insert on tokens
  for insert to authenticated with check (is_campaign_master(chapter_campaign(chapter_id)));
create policy tokens_update on tokens
  for update to authenticated using (
    is_campaign_master(chapter_campaign(chapter_id))
    or exists (
      select 1 from token_controllers tc
      where tc.token_id = tokens.id and tc.user_id = auth.uid()
    )
  );
create policy tokens_delete on tokens
  for delete to authenticated using (is_campaign_master(chapter_campaign(chapter_id)));

create policy token_controllers_select on token_controllers
  for select to authenticated using (
    is_campaign_member(chapter_campaign((select chapter_id from tokens where id = token_id)))
  );
create policy token_controllers_write on token_controllers
  for all to authenticated using (
    is_campaign_master(chapter_campaign((select chapter_id from tokens where id = token_id)))
  ) with check (
    is_campaign_master(chapter_campaign((select chapter_id from tokens where id = token_id)))
  );

-- ───────────────────────────────────────────────────────────── sessions ──
create policy sessions_select on sessions
  for select to authenticated using (is_campaign_member(campaign_id));
create policy sessions_update on sessions
  for update to authenticated using (is_campaign_master(campaign_id)) with check (is_campaign_master(campaign_id));

-- session_events: any member may log an action they performed; master may flag
-- events as undone (undo/redo). No deletes — the log is append-only.
create policy events_select on session_events
  for select to authenticated using (is_campaign_member(session_campaign(session_id)));
create policy events_insert on session_events
  for insert to authenticated with check (
    is_campaign_member(session_campaign(session_id)) and actor_id = auth.uid()
  );
create policy events_update on session_events
  for update to authenticated using (is_campaign_master(session_campaign(session_id)));
