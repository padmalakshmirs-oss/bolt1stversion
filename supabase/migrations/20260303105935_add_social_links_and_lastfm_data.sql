/*
  # Add Social Links and Last.fm Data
  
  1. New Columns
    - users.spotify_profile_url: User's Spotify profile URL
    - users.instagram_url: User's Instagram URL
    - songs.lastfm_tags: Community tags from Last.fm
  
  2. Changes
    - Added spotify_profile_url to users table
    - Added instagram_url to users table
    - Added lastfm_tags as text array to songs table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'spotify_profile_url'
  ) THEN
    ALTER TABLE users ADD COLUMN spotify_profile_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE users ADD COLUMN instagram_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'songs' AND column_name = 'lastfm_tags'
  ) THEN
    ALTER TABLE songs ADD COLUMN lastfm_tags text[] DEFAULT '{}';
  END IF;
END $$;
