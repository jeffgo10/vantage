-- Public tours may expose the owner's contact email for the Free-tier
-- "Get in touch" mailto CTA without granting broad profiles SELECT.

create or replace function public.contact_email_for_active_tour(p_tour_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.email
  from public.tours t
  join public.profiles p on p.id = t.owner_user_id
  where t.id = p_tour_id
    and t.status = 'active'
$$;

revoke all on function public.contact_email_for_active_tour(uuid) from public;
grant execute on function public.contact_email_for_active_tour(uuid) to anon, authenticated, service_role;
