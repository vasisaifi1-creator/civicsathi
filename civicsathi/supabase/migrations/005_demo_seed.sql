-- CivicSathi - 005: OPTIONAL demo data for local development / the live demo.
--
-- Prerequisite: register at least one citizen account in the app first. The demo complaints
-- are attached to the oldest citizen account. Run this file only in the SQL editor of a
-- development/demo project. All demo titles start with "[Demo]" so they are easy to spot
-- and delete:   delete from public.complaints where title like '[Demo]%';
--
-- Demo complaints carry no photographs.

do $$
declare
  v_user uuid;
  v_admin uuid;
begin
  select id into v_user from public.profiles where role = 'citizen' order by created_at limit 1;
  if v_user is null then
    raise exception 'Register at least one citizen account in the app first, then run this seed again.';
  end if;

  if exists (select 1 from public.complaints where title like '[Demo]%') then
    raise notice 'Demo data already present - nothing inserted.';
    return;
  end if;

  select id into v_admin from public.profiles where role = 'admin' order by created_at limit 1;

  insert into public.complaints (user_id, title, description, category, state, city, locality, latitude, longitude)
  values
    (v_user, '[Demo] Deep pothole near Shastri Nagar crossing',
     'A large pothole has formed in the middle of the road near the crossing. Two-wheelers swerve to avoid it and it fills with water in the rain, which makes it dangerous at night.',
     'roads', 'Uttar Pradesh', 'Meerut', 'Shastri Nagar', 28.9845, 77.7064),
    (v_user, '[Demo] Garbage piling up near the community park',
     'Household waste has not been collected for more than a week next to the park entrance. The smell is spreading and stray animals are scattering the garbage onto the road.',
     'garbage', 'Uttar Pradesh', 'Ghaziabad', 'Indirapuram, Shakti Khand', null, null),
    (v_user, '[Demo] Streetlight not working on main lane',
     'Three consecutive streetlights on the main lane have been off for ten days. Women and elderly residents find it unsafe to walk here after sunset.',
     'streetlights', 'Uttar Pradesh', 'Meerut', 'Begum Bridge Road', 28.9931, 77.7058),
    (v_user, '[Demo] Water pipeline leaking on the roadside',
     'The main drinking water pipeline is leaking continuously near the bus stop. Clean water is flowing into the drain and the road surface is getting damaged.',
     'water_leakage', 'Uttar Pradesh', 'Lucknow', 'Gomti Nagar, Vishal Khand', null, null),
    (v_user, '[Demo] Blocked drain overflowing into the street',
     'The open drain behind the market is completely blocked with plastic waste and overflows into the street whenever it rains, entering shops and homes.',
     'drainage', 'Uttar Pradesh', 'Meerut', 'Kanker Khera', null, null);

  -- Give some of them a realistic history so the timeline and charts have content.
  -- (Direct inserts: the SQL editor runs with owner rights, so the admin RPC is not used.)
  update public.complaints set status = 'in_progress', admin_remarks = 'Inspection team assigned.'
   where title = '[Demo] Streetlight not working on main lane';
  insert into public.complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
  select id, 'pending', 'in_progress', 'Inspection team assigned.', v_admin
    from public.complaints where title = '[Demo] Streetlight not working on main lane';

  update public.complaints set status = 'resolved', admin_remarks = 'Pipeline repaired and road surface restored.'
   where title = '[Demo] Water pipeline leaking on the roadside';
  insert into public.complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
  select id, 'pending', 'in_progress', 'Repair crew dispatched.', v_admin
    from public.complaints where title = '[Demo] Water pipeline leaking on the roadside';
  insert into public.complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
  select id, 'in_progress', 'resolved', 'Pipeline repaired and road surface restored.', v_admin
    from public.complaints where title = '[Demo] Water pipeline leaking on the roadside';

  update public.complaints set status = 'rejected', admin_remarks = 'Duplicate of an existing complaint for the same drain.'
   where title = '[Demo] Blocked drain overflowing into the street';
  insert into public.complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
  select id, 'pending', 'rejected', 'Duplicate of an existing complaint for the same drain.', v_admin
    from public.complaints where title = '[Demo] Blocked drain overflowing into the street';
end $$;
