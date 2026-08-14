-- Product language: "properties" → "tours" (container for scenes + hotspots).

alter table public.properties rename to tours;

alter table public.tours rename constraint properties_owner_check to tours_owner_check;

alter trigger properties_set_updated_at on public.tours rename to tours_set_updated_at;

alter table public.scenes rename column property_id to tour_id;

alter index scenes_property_id_order_idx rename to scenes_tour_id_order_idx;

-- Recreate policies with tour naming (expressions must use tour_id / tours).
drop policy if exists "properties_select_owner" on public.tours;
drop policy if exists "properties_select_public_active" on public.tours;
drop policy if exists "properties_insert_own" on public.tours;
drop policy if exists "properties_update_own" on public.tours;
drop policy if exists "properties_delete_own" on public.tours;

create policy "tours_select_owner"
  on public.tours for select
  using (owner_user_id = auth.uid());

create policy "tours_select_public_active"
  on public.tours for select
  using (status = 'active');

create policy "tours_insert_own"
  on public.tours for insert
  with check (owner_user_id = auth.uid());

create policy "tours_update_own"
  on public.tours for update
  using (owner_user_id = auth.uid());

create policy "tours_delete_own"
  on public.tours for delete
  using (owner_user_id = auth.uid());

drop policy if exists "scenes_select" on public.scenes;
drop policy if exists "scenes_write_owner" on public.scenes;

create policy "scenes_select"
  on public.scenes for select
  using (
    exists (
      select 1 from public.tours t
      where t.id = scenes.tour_id
        and (t.owner_user_id = auth.uid() or t.status = 'active')
    )
  );

create policy "scenes_write_owner"
  on public.scenes for all
  using (
    exists (
      select 1 from public.tours t
      where t.id = scenes.tour_id and t.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tours t
      where t.id = scenes.tour_id and t.owner_user_id = auth.uid()
    )
  );

drop policy if exists "hotspots_select" on public.hotspots;
drop policy if exists "hotspots_write_owner" on public.hotspots;

create policy "hotspots_select"
  on public.hotspots for select
  using (
    exists (
      select 1
      from public.scenes s
      join public.tours t on t.id = s.tour_id
      where s.id = hotspots.scene_id
        and (t.owner_user_id = auth.uid() or t.status = 'active')
    )
  );

create policy "hotspots_write_owner"
  on public.hotspots for all
  using (
    exists (
      select 1
      from public.scenes s
      join public.tours t on t.id = s.tour_id
      where s.id = hotspots.scene_id and t.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.scenes s
      join public.tours t on t.id = s.tour_id
      where s.id = hotspots.scene_id and t.owner_user_id = auth.uid()
    )
  );

-- Grants follow table rename by OID; restate for clarity / PostgREST.
grant select, insert, update, delete on table public.tours to authenticated;
grant select on table public.tours to anon;
grant all on table public.tours to service_role;
