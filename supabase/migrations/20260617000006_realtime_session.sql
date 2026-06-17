-- Realtime for the live session:
--  * sessions          → players follow the master's active chapter switches
--  * campaign_members   → the master's roster updates when someone accepts
-- (Presence — who is online right now — travels over a Realtime channel and
-- needs no table publication.)

alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table campaign_members;
