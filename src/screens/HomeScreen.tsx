import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Home, User } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { getTrendingSongs, getRecommendations, getActivityFeed, getUserLogs } from '../lib/database';
import SongCard from '../components/SongCard';

export function HomeScreen() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (user) {
      initializeApp();
    }
  }, [user]);

  useEffect(() => {
    const subscription = supabase
      .channel('logs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'logs'
      }, async (payload) => {
        try {
          const { data: log } = await supabase
            .from('logs')
            .select('*, song:songs(*), user:users(*)')
            .eq('id', payload.new.id)
            .single();
          if (log) {
            setActivityFeed(prev => [log, ...prev]);
          }
        } catch (err) {
          console.error('Error fetching new log:', err);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function initializeApp() {
    try {
      const { count } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/songs?select=id&count=exact&head=true`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          }
        }
      ).then(r => r.json()).catch(() => ({ count: 0 }));

      if (count === 0 || count === null) {
        setSeeding(true);
        try {
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-database`;
          await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });

          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.error('Seeding error:', err);
        }
        setSeeding(false);
      }

      await loadData();
    } catch (error) {
      console.error('Error initializing app:', error);
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      const language = profile?.preferred_languages?.[0] || 'English';

      const [trendingData, recsData, activityData, logsData] = await Promise.all([
        getTrendingSongs(language),
        getRecommendations(user!.id),
        getActivityFeed(user!.id, 10),
        getUserLogs(user!.id, 10),
      ]);

      setTrending(trendingData.slice(0, 10));
      setRecommendations(recsData.slice(0, 10));
      setActivityFeed(activityData);
      setUserLogs(logsData);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (seeding) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6">
        <h1 className="font-heading text-4xl text-text-primary">SOUNDLOG</h1>
        <p className="text-text-muted font-body">Setting up your music world...</p>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Loading your soundlog...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-4xl text-text-primary mb-1">SOUNDLOG</h1>
            <p className="text-text-muted text-sm font-body">Welcome back, {profile?.name}</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="bg-bg-secondary hover:bg-bg-card border border-border-primary rounded-full p-3 transition-all"
          >
            <Search className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl text-text-primary">Trending Now</h2>
            <button
              onClick={() => navigate('/trending')}
              className="text-accent-primary text-sm font-body hover:text-accent-hover transition-colors"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {trending.map((song, idx) => (
              <SongCard
                key={song.id}
                song={song}
                onClick={() => navigate(`/song/${song.id}`)}
                badge={`#${idx + 1}`}
                badgeColor="accent-primary"
              />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl text-text-primary">For You</h2>
          </div>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recommendations.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => navigate(`/song/${song.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
              <p className="text-text-muted font-body">
                Log more songs to get personalized recommendations
              </p>
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl text-text-primary mb-4">Activity Feed</h2>
          {activityFeed.length > 0 ? (
            <div className="space-y-3">
              {activityFeed.map((log) => (
                <div
                  key={log.id}
                  className="bg-bg-card border border-border-primary rounded-lg p-4 hover:border-accent-primary transition-all cursor-pointer"
                  onClick={() => navigate(`/song/${log.song_id}`)}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={log.song.cover_image}
                      alt={log.song.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-text-primary font-body text-sm">
                        <span className="text-accent-primary">{log.user.name}</span> logged{' '}
                        <span className="font-semibold">{log.song.title}</span>
                      </p>
                      <p className="text-text-very text-xs font-body mt-1">
                        {log.song.artist_name} · Rating: {log.rating}/5
                      </p>
                      <p className="text-text-very text-xs font-body mt-1">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
              <p className="text-text-muted font-body">
                Follow users to see their activity here
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-heading text-2xl text-text-primary mb-4">Your Recent Logs</h2>
          {userLogs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {userLogs.map((log) => (
                <SongCard
                  key={log.id}
                  song={log.song}
                  onClick={() => navigate(`/song/${log.song_id}`)}
                  badge={`${log.rating}/5`}
                  badgeColor="accent-star"
                />
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
              <p className="text-text-muted font-body mb-4">
                You haven't logged any songs yet
              </p>
              <button
                onClick={() => navigate('/search')}
                className="bg-accent-primary hover:bg-accent-hover text-text-primary font-body font-semibold px-6 py-2 rounded-full transition-all"
              >
                Start Logging
              </button>
            </div>
          )}
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-primary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around py-4">
            <button
              onClick={() => navigate('/home')}
              className="flex flex-col items-center gap-1 text-accent-primary"
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-body">Home</span>
            </button>
            <button
              onClick={() => navigate('/search')}
              className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <Search className="w-6 h-6" />
              <span className="text-xs font-body">Search</span>
            </button>
            <button
              onClick={() => navigate('/trending')}
              className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs font-body">Trending</span>
            </button>
            <button
              onClick={() => navigate(`/profile/${profile?.username}`)}
              className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-body">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
