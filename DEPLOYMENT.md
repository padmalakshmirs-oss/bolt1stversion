# Soundlog Deployment Guide

## Prerequisites

You need the following environment variables configured:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_LASTFM_API_KEY=your_lastfm_api_key
```

## Database Setup

Your database schema is already configured in:
- `supabase/migrations/20260303095912_001_create_core_tables.sql`

The migration includes:
- Users table with authentication and profile data
- Songs table with Spotify integration
- Logs table for user listening history
- Reviews table with sentiment analysis
- Follows table for social features
- Trending and recommendation cache tables

## Edge Functions

Two edge functions have been created but need to be deployed:

### 1. Seed Database Function
Location: `supabase/functions/seed-database/index.ts`

This function:
- Fetches trending songs from Last.fm
- Enriches them with Spotify data
- Creates virtual users for demo purposes
- Generates initial logs and activity

### 2. Generate Recommendations Function
Location: `supabase/functions/generate-recommendations/index.ts`

This function:
- Analyzes user listening history
- Calculates song similarity based on:
  - Language preferences
  - Era/year preferences
  - Audio features (danceability, energy, valence)
  - Genre matching
- Generates personalized recommendations

## Application Features

### Completed Features

1. **Authentication System**
   - Email/password signup and login
   - Protected routes
   - User profile management

2. **Onboarding Flow**
   - Language preferences
   - Era preferences
   - Favorite music directors
   - Favorite artists

3. **Home Screen**
   - Trending songs by language
   - Personalized recommendations
   - Activity feed from followed users
   - User's recent logs

4. **Search**
   - Search in local database
   - Fallback to Spotify API
   - Automatic song creation from Spotify

5. **Song Detail Page**
   - Full song information
   - 30-second audio preview player
   - Log modal (rating, review, listened date)
   - Reviews with sentiment analysis
   - Toxicity filtering

6. **Artist Page**
   - Artist information from Spotify
   - Top tracks
   - Link to Spotify profile

7. **Profile Page**
   - User stats (logs, followers, following)
   - Follow/unfollow functionality
   - Recent listening history
   - Preference tags

8. **Trending Page**
   - Filter by language
   - Ranked trending songs
   - Dynamic language tabs

9. **Audio Player Component**
   - 30-second previews
   - Play/pause controls
   - Seek functionality
   - Time display

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start development server (this happens automatically):
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Next Steps

To fully activate the application:

1. Deploy the edge functions using the Supabase dashboard or CLI
2. Set environment variables for edge functions (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, LASTFM_API_KEY)
3. Run the seed-database function to populate initial data
4. Generate recommendations for users after they log songs

## Usage Flow

1. User signs up and completes onboarding
2. User searches for songs and logs them with ratings
3. System generates personalized recommendations based on listening history
4. User can follow other users and see their activity
5. Trending page shows popular songs by language
6. Users can write reviews and read others' reviews

## Technical Architecture

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM
- **Database**: Supabase (PostgreSQL)
- **APIs**: Spotify Web API, Last.fm API
- **Authentication**: Supabase Auth
- **Edge Functions**: Deno runtime on Supabase

## Design System

- **Colors**: Dark theme with purple accents
- **Typography**: Cormorant Garamond (headings) + DM Sans (body)
- **Components**: Custom-built, no UI library dependencies
- **Icons**: Lucide React
