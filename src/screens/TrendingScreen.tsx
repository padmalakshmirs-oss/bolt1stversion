import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { getTrendingSongs } from '../lib/database';
import SongCard from '../components/SongCard';

export function TrendingScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const languages = [
    'Tamil',
    'Telugu',
    'Hindi',
    'Malayalam',
    'Kannada',
    'English',
    'Bengali',
    'Marathi',
    'Punjabi',
  ];

  useEffect(() => {
    const defaultLang = profile?.preferred_languages?.[0] || 'English';
    setSelectedLanguage(defaultLang);
  }, [profile]);

  useEffect(() => {
    loadTrending();
  }, [selectedLanguage]);

  async function loadTrending() {
    setLoading(true);
    try {
      const data = await getTrendingSongs(selectedLanguage);
      setTrending(data);
    } catch (error) {
      console.error('Error loading trending:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-heading text-3xl text-text-primary">Trending</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 rounded-full font-body font-semibold whitespace-nowrap transition-all ${
                selectedLanguage === lang
                  ? 'bg-accent-primary text-text-primary'
                  : 'bg-bg-secondary border border-border-primary text-text-muted hover:border-accent-primary'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-text-muted font-body">Loading trending songs...</p>
          </div>
        ) : trending.length > 0 ? (
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
        ) : (
          <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
            <p className="text-text-muted font-body">No trending songs available for {selectedLanguage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
