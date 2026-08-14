-- Supabase Data API roles need explicit table GRANTs when
-- api.auto_expose_new_tables is unset (cloud/local default).
-- RLS still restricts row access; without these, PostgREST returns
-- "permission denied for table …".

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select on table public.profiles to anon;
grant all on table public.profiles to service_role;

grant select, insert, update, delete on table public.teams to authenticated;
grant select on table public.teams to anon;
grant all on table public.teams to service_role;

grant select, insert, update, delete on table public.properties to authenticated;
grant select on table public.properties to anon;
grant all on table public.properties to service_role;

grant select, insert, update, delete on table public.scenes to authenticated;
grant select on table public.scenes to anon;
grant all on table public.scenes to service_role;

grant select, insert, update, delete on table public.hotspots to authenticated;
grant select on table public.hotspots to anon;
grant all on table public.hotspots to service_role;
