-- Enable Realtime (Postgres Changes) for campaign_invites so a player sees a
-- new invite live, without refreshing. A table only emits change events if it's
-- part of the supabase_realtime publication. RLS still applies: a subscriber
-- only receives events for rows they're allowed to SELECT (their own invites).

alter publication supabase_realtime add table campaign_invites;
