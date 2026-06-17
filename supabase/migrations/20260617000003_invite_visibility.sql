-- Let an invited user read the campaign they were invited to *before* they
-- accept (so the invites list can show the campaign name). This is an extra
-- permissive SELECT policy — it ORs with campaigns_select (membership), so
-- members keep their access and invitees gain read-only visibility.

create policy campaigns_select_invited on campaigns
  for select to authenticated using (
    exists (
      select 1 from campaign_invites i
      where i.campaign_id = campaigns.id
        and i.invited_user_id = auth.uid()
        and i.status = 'pending'
    )
  );
