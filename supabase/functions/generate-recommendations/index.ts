import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Song {
  id: string;
  audio_features: any;
  language: string;
  year: number;
  genre: string;
}

interface UserLog {
  rating: number;
  song: Song;
}

function calculateSimilarity(song1: Song, song2: Song): number {
  let score = 0;

  if (song1.language === song2.language) score += 30;

  const yearDiff = Math.abs(song1.year - song2.year);
  if (yearDiff <= 5) score += 20;
  else if (yearDiff <= 10) score += 10;

  if (song1.genre === song2.genre) score += 20;

  if (song1.audio_features && song2.audio_features) {
    const features1 = song1.audio_features;
    const features2 = song2.audio_features;

    const danceabilityDiff = Math.abs(features1.danceability - features2.danceability);
    const energyDiff = Math.abs(features1.energy - features2.energy);
    const valenceDiff = Math.abs(features1.valence - features2.valence);

    score += (1 - danceabilityDiff) * 10;
    score += (1 - energyDiff) * 10;
    score += (1 - valenceDiff) * 10;
  }

  return score;
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

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userLogs } = await supabase
      .from('logs')
      .select('rating, song:songs(*)')
      .eq('user_id', userId)
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!userLogs || userLogs.length === 0) {
      const { data: popularSongs } = await supabase
        .from('songs')
        .select('*')
        .order('total_logs', { ascending: false })
        .limit(20);

      await supabase.from('recommendation_cache').upsert({
        user_id: userId,
        songs: popularSongs || [],
      });

      return new Response(
        JSON.stringify({ recommendations: popularSongs || [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const likedSongs = (userLogs as UserLog[]).map((log) => log.song);
    const likedSongIds = likedSongs.map((s) => s.id);

    const preferredLanguages = [...new Set(likedSongs.map((s) => s.language))];
    const avgYear =
      likedSongs.reduce((sum, s) => sum + s.year, 0) / likedSongs.length;

    const { data: candidateSongs } = await supabase
      .from('songs')
      .select('*')
      .in('language', preferredLanguages)
      .not('id', 'in', `(${likedSongIds.join(',')})`)
      .limit(200);

    if (!candidateSongs || candidateSongs.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const scoredSongs = candidateSongs.map((candidate) => {
      let totalScore = 0;
      for (const likedSong of likedSongs) {
        totalScore += calculateSimilarity(likedSong, candidate);
      }
      return {
        song: candidate,
        score: totalScore / likedSongs.length,
      };
    });

    scoredSongs.sort((a, b) => b.score - a.score);
    const recommendations = scoredSongs.slice(0, 20).map((s) => s.song);

    await supabase.from('recommendation_cache').upsert({
      user_id: userId,
      songs: recommendations,
    });

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
