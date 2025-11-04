-- Migration: 004_create_storage_buckets
-- Description: Creates Supabase Storage buckets for profile pictures, ticket PDFs, and route images
-- Created: 2025-11-02
-- Dependencies: None (Storage is independent)

-- ==============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ==============================================================================

-- Profile Pictures Bucket (Public - anyone can view)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Ticket PDFs Bucket (Private - only ticket owner can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-pdfs',
  'ticket-pdfs',
  false,
  2097152, -- 2MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Route Images Bucket (Public - anyone can view route photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'route-images',
  'route-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. STORAGE POLICIES - PROFILE PICTURES
-- ==============================================================================

-- Allow authenticated users to upload their own profile picture
-- File path format: {user_id}/profile.{ext}
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own profile picture
CREATE POLICY "Users can update own profile picture"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own profile picture
CREATE POLICY "Users can delete own profile picture"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow everyone to view profile pictures (bucket is public)
CREATE POLICY "Profile pictures are publicly readable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-pictures');

-- ==============================================================================
-- 3. STORAGE POLICIES - TICKET PDFs
-- ==============================================================================

-- Allow authenticated users to upload ticket PDFs (via backend)
-- File path format: {user_id}/{ticket_id}.pdf
CREATE POLICY "Users can upload own ticket PDFs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ticket-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view only their own ticket PDFs
CREATE POLICY "Users can view own ticket PDFs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ticket-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow admins to view all ticket PDFs
CREATE POLICY "Admins can view all ticket PDFs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ticket-pdfs' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users cannot delete ticket PDFs (for audit purposes)
-- Only admins can delete if necessary

-- ==============================================================================
-- 4. STORAGE POLICIES - ROUTE IMAGES
-- ==============================================================================

-- Allow providers and admins to upload route images
-- File path format: {route_id}/{timestamp}_{filename}.{ext}
CREATE POLICY "Providers can upload route images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'route-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
  );

-- Allow providers and admins to update route images
CREATE POLICY "Providers can update route images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'route-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
  );

-- Allow providers and admins to delete route images
CREATE POLICY "Providers can delete route images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'route-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
  );

-- Allow everyone to view route images (bucket is public)
CREATE POLICY "Route images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'route-images');

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

-- Uncomment to verify buckets and policies:
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- WHERE id IN ('profile-pictures', 'ticket-pdfs', 'route-images');
--
-- SELECT * FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- Summary:
-- - 3 storage buckets created:
--   * profile-pictures (public, 5MB, images)
--   * ticket-pdfs (private, 2MB, PDFs only)
--   * route-images (public, 10MB, images)
-- - RLS policies configured for each bucket
-- ==============================================================================
