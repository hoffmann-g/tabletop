-- The owner must always be able to read their own campaign — independent of the
-- campaign_members row (which is created by the AFTER-INSERT trigger and isn't
-- visible to the STABLE is_campaign_member() within the same INSERT...RETURNING
-- statement). Without this, creating a campaign with PostgREST's
-- `return=representation` fails the SELECT visibility check and reports a
-- (misleading) RLS violation on the just-inserted row.
--
-- Permissive SELECT policies OR together, so this only widens visibility.

create policy campaigns_select_owner on campaigns
  for select to authenticated using (owner_id = auth.uid());
