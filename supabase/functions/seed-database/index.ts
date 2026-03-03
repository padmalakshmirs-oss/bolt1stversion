import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const LASTFM_API_KEY = Deno.env.get('LASTFM_API_KEY');

async function getSpotifyToken() {
  const auth = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

async function spotifyFetch(endpoint: string, token: string) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

async function lastfmFetch(params: Record<string, any>) {
  const searchParams = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY!,
    format: 'json',
  });
  const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${searchParams}`);
  return response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const spotifyToken = await getSpotifyToken();

    const languages = [
      { name: 'Tamil', tag: 'tamil' },
      { name: 'Telugu', tag: 'telugu' },
      { name: 'Hindi', tag: 'bollywood' },
      { name: 'English', tag: 'pop' },
      { name: 'Malayalam', tag: 'malayalam' },
    ];

    const songsToInsert = [];

    for (const lang of languages) {
      const lastfmData = await lastfmFetch({
        method: 'tag.gettoptracks',
        tag: lang.tag,
        limit: 50,
      });

      const tracks = lastfmData.toptracks?.track || [];

      for (const track of tracks.slice(0, 20)) {
        try {
          const spotifySearch = await spotifyFetch(
            `/search?q=${encodeURIComponent(
              `${track.name} ${track.artist.name}`
            )}&type=track&limit=1`,
            spotifyToken
          );

          const spotifyTrack = spotifySearch.tracks?.items?.[0];
          if (!spotifyTrack) continue;

          const audioFeatures = await spotifyFetch(
            `/audio-features/${spotifyTrack.id}`,
            spotifyToken
          );

          songsToInsert.push({
            title: spotifyTrack.name,
            artist_name: spotifyTrack.artists[0].name,
            artist_id: spotifyTrack.artists[0].id,
            album: spotifyTrack.album.name,
            year: parseInt(spotifyTrack.album.release_date.split('-')[0]),
            spotify_id: spotifyTrack.id,
            spotify_url: spotifyTrack.external_urls.spotify,
            cover_image: spotifyTrack.album.images[0]?.url || '',
            preview_url: spotifyTrack.preview_url,
            audio_features: audioFeatures,
            language: lang.name,
            genre: lang.tag,
            total_logs: Math.floor(Math.random() * 500) + 50,
          });
        } catch (err) {
          console.error(`Error processing track:`, err);
        }
      }
    }

    const { error: songsError } = await supabase.from('songs').upsert(songsToInsert, {
      onConflict: 'spotify_id',
      ignoreDuplicates: true,
    });

    if (songsError) throw songsError;

    const virtualUsers = [
      { name: 'Priya Sharma', username: 'priya_music', is_virtual: true },
      { name: 'Arjun Menon', username: 'arjun_beats', is_virtual: true },
      { name: 'Ananya Reddy', username: 'ananya_tunes', is_virtual: true },
      { name: 'Karthik Kumar', username: 'karthik_melody', is_virtual: true },
      { name: 'Divya Nair', username: 'divya_sounds', is_virtual: true },
      { name: 'Rohan Patel', username: 'rohan_music', is_virtual: true },
      { name: 'Sneha Krishnan', username: 'sneha_vibes', is_virtual: true },
      { name: 'Vikram Iyer', username: 'vikram_tracks', is_virtual: true },
    ];

    for (const vUser of virtualUsers) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', vUser.username)
        .maybeSingle();

      if (!existingUser) {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert([{
            email: `${vUser.username}@virtual.soundlog`,
            name: vUser.name,
            username: vUser.username,
            is_virtual: true,
            onboarding_complete: true,
          }])
          .select()
          .single();

        if (userError) {
          console.error('Error creating virtual user:', userError);
          continue;
        }

        const { data: songs } = await supabase
          .from('songs')
          .select('id')
          .limit(30);

        if (songs && songs.length > 0) {
          const logsToInsert = [];
          for (let i = 0; i < 15; i++) {
            const randomSong = songs[Math.floor(Math.random() * songs.length)];
            logsToInsert.push({
              user_id: newUser.id,
              song_id: randomSong.id,
              rating: Math.floor(Math.random() * 3) + 3,
              listened_before: Math.random() > 0.5,
            });
          }

          await supabase.from('logs').insert(logsToInsert);
        }
      }
    }

    const { data: allSongs } = await supabase.from('songs').select('id, language');

    if (allSongs) {
      for (const lang of languages) {
        const langSongs = allSongs
          .filter((s) => s.language === lang.name)
          .sort(() => Math.random() - 0.5)
          .slice(0, 50);

        await supabase.from('trending_cache').upsert(
          {
            language: lang.name,
            songs: langSongs,
          },
          { onConflict: 'language' }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seeded ${songsToInsert.length} songs and ${virtualUsers.length} virtual users`,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
