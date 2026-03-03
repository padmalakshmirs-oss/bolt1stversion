import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { searchSongs, createOrGetSong } from '../lib/database';
import { searchSpotify } from '../lib/spotify';
import SongCard from '../components/SongCard';

export function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [spotifyResults, setSpotifyResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'database' | 'spotify'>('database');

  useEffect(() => {
    if (query.length > 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setSpotifyResults([]);
    }
  }, [query]);

  async function handleSearch() {
    setLoading(true);
    try {
      const dbResults = await searchSongs(query, 20);
      setResults(dbResults);

      if (dbResults.length < 5) {
        setSearchMode('spotify');
        const spotifyData = await searchSpotify(query, 'track', 20);
        setSpotifyResults(spotifyData.tracks?.items || []);
      } else {
        setSearchMode('database');
        setSpotifyResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSpotifyTrackClick(track: any) {
    try {
      const song = await createOrGetSong(track.id);
      navigate(`/song/${song.id}`);
    } catch (error) {
      console.error('Error creating song:', error);
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
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border-primary rounded-full pl-12 pr-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all font-body"
              autoFocus
            />
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-text-muted font-body">Searching...</p>
          </div>
        )}

        {!loading && query.length > 2 && results.length === 0 && spotifyResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted font-body">No results found</p>
          </div>
        )}

        {results.length > 0 && (
          <section className="mb-8">
            <h2 className="font-heading text-2xl text-text-primary mb-4">From Soundlog</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {results.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => navigate(`/song/${song.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {spotifyResults.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl text-text-primary mb-4">From Spotify</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {spotifyResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSpotifyTrackClick(track)}
                  className="group text-left transition-all transform hover:scale-105"
                >
                  <div className="relative mb-3 rounded-t-lg overflow-hidden bg-bg-card aspect-square">
                    <img
                      src={track.album.images[0]?.url}
                      alt={track.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-2 space-y-1">
                    <h3 className="font-heading text-[13px] text-text-primary truncate">
                      {track.name}
                    </h3>
                    <p className="font-body text-[11px] text-text-muted truncate">
                      {track.artists[0].name}
                    </p>
                    <p className="font-body text-[10px] text-text-very">
                      {track.album.release_date.split('-')[0]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {query.length <= 2 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-text-very mx-auto mb-4" />
            <p className="text-text-muted font-body">
              Search for songs and artists to start logging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
