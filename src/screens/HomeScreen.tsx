import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Home, User } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { seedDatabase } from '../lib/database';
import SongCard from '../components/SongCard';

export function HomeScreen() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [forYouSongs, setForYouSongs] = useState<any[]>([]);
  const [languageRows, setLanguageRows] = useState<Record<string, any[]>>({});
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (user) {
      initApp();
    }
  }, [user]);

  async function initApp() {
    setInitializing(true);

    try {
      const { count } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true });

      console.log('Songs in DB:', count);

      if (!count || count === 0) {
        console.log('Seeding now...');
        await seedDatabase();
        console.log('Seed done!');
      }

      await loadHomeData();
    } catch (err) {
      console.error('Init failed:', err);
    } finally {
      setInitializing(false);
    }
  }

  async function loadHomeData() {
    const langs = profile?.preferred_languages?.length
      ? profile.preferred_languages
      : ['Tamil', 'Hindi', 'English'];

    const { data: trending } = await supabase
      .from('songs')
      .select('*')
      .in('language', langs)
      .order('total_logs', { ascending: false })
      .limit(10);
    setTrendingSongs(trending || []);

    const { data: forYou } = await supabase
      .from('songs')
      .select('*')
      .in('language', langs)
      .order('average_rating', { ascending: false })
      .limit(12);
    setForYouSongs(forYou || []);

    const rows: Record<string, any[]> = {};
    for (const lang of langs.slice(0, 3)) {
      const { data } = await supabase
        .from('songs')
        .select('*')
        .eq('language', lang)
        .order('average_rating', { ascending: false })
        .limit(20);
      rows[lang] = data || [];
    }
    setLanguageRows(rows);

    const { data: logs } = await supabase
      .from('logs')
      .select('*, song:songs(*), user:users(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setUserLogs(logs || []);

    const { data: activity } = await supabase
      .from('logs')
      .select('*, song:songs(*), user:users(*)')
      .neq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setActivityFeed(activity || []);
  }

  if (initializing) {
    return (
      <div
        style={{
          background: '#09090B',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            fontFamily: 'Cormorant Garamond',
            fontSize: '32px',
            letterSpacing: '0.3em',
            color: '#FAFAFA',
          }}
        >
          SOUNDLOG
        </div>
        <div
          style={{
            color: '#71717A',
            fontSize: '14px',
            fontFamily: 'DM Sans',
          }}
        >
          Setting up your music world...
        </div>
        <div
          style={{
            width: '200px',
            height: '2px',
            background: '#27272A',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '40%',
              height: '100%',
              background: '#8B5CF6',
              animation: 'slide 1.5s infinite',
            }}
          />
        </div>
        <style>{`
          @keyframes slide {
            0% { left: -40%; }
            100% { left: 100%; }
          }
        `}</style>
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
          {trendingSongs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {trendingSongs.map((song, idx) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => navigate(`/song/${song.id}`)}
                  badge={`#${idx + 1}`}
                  badgeColor="accent-primary"
                />
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
              <p className="text-text-muted font-body">No trending songs yet</p>
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl text-text-primary">For You</h2>
          </div>
          {forYouSongs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forYouSongs.map((song) => (
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

        {Object.entries(languageRows).map(([lang, songs]) => (
          <section key={lang} className="mb-12">
            <h2 className="font-heading text-2xl text-text-primary mb-4">{lang}</h2>
            {songs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {songs.slice(0, 10).map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onClick={() => navigate(`/song/${song.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
                <p className="text-text-muted font-body">No {lang} songs available</p>
              </div>
            )}
          </section>
        ))}

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
