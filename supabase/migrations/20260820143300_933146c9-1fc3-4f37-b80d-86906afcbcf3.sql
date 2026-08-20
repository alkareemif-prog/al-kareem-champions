
CREATE POLICY "Users upload own photo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own photo" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own photo or staff" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'evaluator')));
CREATE POLICY "Signed-in read certificate assets" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificate-assets');
CREATE POLICY "Admins manage certificate assets" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'certificate-assets' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'certificate-assets' AND public.is_admin(auth.uid()));
