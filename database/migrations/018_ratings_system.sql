-- Migration 018: Ratings System
-- Description: Creates ratings and rating_photos tables with RLS policies for route feedback
-- Date: 2025-01-13
-- Sprint: 11-12

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL,

  -- Individual rating criteria (1-5 scale)
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_cleanliness INTEGER NOT NULL CHECK (rating_cleanliness >= 1 AND rating_cleanliness <= 5),
  rating_punctuality INTEGER NOT NULL CHECK (rating_punctuality >= 1 AND rating_punctuality <= 5),
  rating_driver INTEGER NOT NULL CHECK (rating_driver >= 1 AND rating_driver <= 5),
  rating_comfort INTEGER NOT NULL CHECK (rating_comfort >= 1 AND rating_comfort <= 5),

  -- Optional comment
  comment TEXT,

  -- Moderation status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moderated_at TIMESTAMP WITH TIME ZONE,

  -- Constraint: User can only rate each route once
  CONSTRAINT unique_user_route_rating UNIQUE (user_id, route_id)
);

-- =====================================================
-- RATING PHOTOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rating_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Ratings table indexes
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_route_id ON ratings(route_id);
CREATE INDEX IF NOT EXISTS idx_ratings_status ON ratings(status);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- Composite index for filtering approved ratings by route
CREATE INDEX IF NOT EXISTS idx_ratings_route_status ON ratings(route_id, status) WHERE status = 'approved';

-- Rating photos table indexes
CREATE INDEX IF NOT EXISTS idx_rating_photos_rating_id ON rating_photos(rating_id);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Function to check maximum 5 photos per rating
CREATE OR REPLACE FUNCTION check_rating_photos_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM rating_photos WHERE rating_id = NEW.rating_id) >= 5 THEN
    RAISE EXCEPTION 'Cannot add more than 5 photos to a rating';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce 5 photos limit
DROP TRIGGER IF EXISTS rating_photos_limit_trigger ON rating_photos;
CREATE TRIGGER rating_photos_limit_trigger
  BEFORE INSERT ON rating_photos
  FOR EACH ROW
  EXECUTE FUNCTION check_rating_photos_limit();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_photos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RATINGS TABLE POLICIES
-- =====================================================

-- Policy 1: Anyone can view approved ratings
CREATE POLICY "Anyone can view approved ratings"
  ON ratings FOR SELECT
  USING (status = 'approved');

-- Policy 2: Users can view their own ratings (any status)
CREATE POLICY "Users can view own ratings"
  ON ratings FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Users can insert their own ratings
CREATE POLICY "Users can insert own ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy 4: Users can update their own pending ratings
CREATE POLICY "Users can update own pending ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy 5: Users can delete their own pending ratings
CREATE POLICY "Users can delete own pending ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Policy 6: Admins can view all ratings
CREATE POLICY "Admins can view all ratings"
  ON ratings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy 7: Admins can update any rating (for moderation)
CREATE POLICY "Admins can update all ratings"
  ON ratings FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy 8: Admins can delete any rating
CREATE POLICY "Admins can delete all ratings"
  ON ratings FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- RATING PHOTOS TABLE POLICIES
-- =====================================================

-- Policy 1: Anyone can view photos for approved ratings
CREATE POLICY "Anyone can view photos for approved ratings"
  ON rating_photos FOR SELECT
  USING (
    rating_id IN (
      SELECT id FROM ratings WHERE status = 'approved'
    )
  );

-- Policy 2: Users can view photos for their own ratings
CREATE POLICY "Users can view own rating photos"
  ON rating_photos FOR SELECT
  USING (
    rating_id IN (
      SELECT id FROM ratings WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Users can insert photos for their own pending ratings
CREATE POLICY "Users can insert photos for own pending ratings"
  ON rating_photos FOR INSERT
  WITH CHECK (
    rating_id IN (
      SELECT id FROM ratings WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Policy 4: Users can delete photos from their own pending ratings
CREATE POLICY "Users can delete photos from own pending ratings"
  ON rating_photos FOR DELETE
  USING (
    rating_id IN (
      SELECT id FROM ratings WHERE user_id = auth.uid() AND status = 'pending'
    )
  );

-- Policy 5: Admins can view all photos
CREATE POLICY "Admins can view all rating photos"
  ON rating_photos FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy 6: Admins can delete any photo
CREATE POLICY "Admins can delete all rating photos"
  ON rating_photos FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Reuse existing update_updated_at_column function if it exists
-- Otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ratings table
DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER FOR MODERATION TIMESTAMP
-- =====================================================

-- Function to set moderated_at timestamp when status changes
CREATE OR REPLACE FUNCTION set_moderated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set moderated_at when status changes from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    NEW.moderated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for setting moderated_at
DROP TRIGGER IF EXISTS ratings_moderation_timestamp ON ratings;
CREATE TRIGGER ratings_moderation_timestamp
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION set_moderated_at();

-- =====================================================
-- HELPER VIEWS (Optional but useful)
-- =====================================================

-- View for route rating statistics
CREATE OR REPLACE VIEW route_rating_stats AS
SELECT
  route_id,
  COUNT(*) as total_ratings,
  AVG(rating_overall)::DECIMAL(3,2) as avg_overall,
  AVG(rating_cleanliness)::DECIMAL(3,2) as avg_cleanliness,
  AVG(rating_punctuality)::DECIMAL(3,2) as avg_punctuality,
  AVG(rating_driver)::DECIMAL(3,2) as avg_driver,
  AVG(rating_comfort)::DECIMAL(3,2) as avg_comfort,
  COUNT(CASE WHEN rating_overall = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating_overall = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating_overall = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating_overall = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating_overall = 1 THEN 1 END) as one_star_count
FROM ratings
WHERE status = 'approved'
GROUP BY route_id;

-- View for pending moderation queue
CREATE OR REPLACE VIEW pending_ratings_moderation AS
SELECT
  r.id,
  r.user_id,
  r.route_id,
  r.rating_overall,
  r.comment,
  r.created_at,
  COUNT(rp.id) as photo_count
FROM ratings r
LEFT JOIN rating_photos rp ON r.id = rp.rating_id
WHERE r.status = 'pending'
GROUP BY r.id, r.user_id, r.route_id, r.rating_overall, r.comment, r.created_at
ORDER BY r.created_at ASC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ratings IS 'Stores user ratings and feedback for routes';
COMMENT ON TABLE rating_photos IS 'Stores photos attached to ratings (max 5 per rating)';

COMMENT ON COLUMN ratings.rating_overall IS 'Overall rating from 1-5 stars';
COMMENT ON COLUMN ratings.rating_cleanliness IS 'Cleanliness rating from 1-5 stars';
COMMENT ON COLUMN ratings.rating_punctuality IS 'Punctuality rating from 1-5 stars';
COMMENT ON COLUMN ratings.rating_driver IS 'Driver behavior rating from 1-5 stars';
COMMENT ON COLUMN ratings.rating_comfort IS 'Comfort rating from 1-5 stars';
COMMENT ON COLUMN ratings.status IS 'Moderation status: pending (default), approved, or rejected';
COMMENT ON COLUMN ratings.moderated_at IS 'Timestamp when rating was moderated (approved/rejected)';

COMMENT ON CONSTRAINT unique_user_route_rating ON ratings IS 'Ensures each user can only rate a route once';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
