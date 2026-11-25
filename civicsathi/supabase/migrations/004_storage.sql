-- CivicSathi - 004: private storage bucket for complaint photographs
-- Files are stored as "<user_id>/<random-uuid>.<ext>". The bucket is PRIVATE: photos are only
-- viewable through short-lived signed URLs, and only by the owner or an admin.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-images',
  'complaint-images',
  false,
  5242880,                                        -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "complaint_images_insert_own_folder" on storage.objects;
create policy "complaint_images_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "complaint_images_select_owner_or_admin" on storage.objects;
create policy "complaint_images_select_owner_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'complaint-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Owners may delete their own files (used to clean up when a submission fails).
drop policy if exists "complaint_images_delete_own_folder" on storage.objects;
create policy "complaint_images_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
