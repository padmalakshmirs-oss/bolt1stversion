import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getArtist, getArtistTopTracks } from '../lib/spotify';
import SongCard from '../components/SongCard';

export function ArtistScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadArtistData();
    }
  }, [id]);

  async function loadArtistData() {
    try {
      const artistData = await getArtist(id!);
      setArtist(artistData);

      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', id)
        .limit(20);

      if (songsData && songsData.length > 0) {
        setSongs(songsData);
      } else {
        const topTracks = await getArtistTopTracks(id!);
        setSongs(topTracks.tracks || []);
      }
    } catch (error) {
      console.error('Error loading artist:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Loading...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Artist not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="w-full md:w-1/4">
            <div className="aspect-square rounded-full overflow-hidden bg-bg-card mb-4">
              {artist.images?.[0]?.url ? (
                <img
                  src={artist.images[0].url}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-text-muted" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="font-heading text-5xl text-text-primary mb-4">{artist.name}</h1>
            <div className="space-y-2 mb-6">
              {artist.genres && artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artist.genres.slice(0, 5).map((genre: string) => (
                    <span
                      key={genre}
                      className="bg-bg-card border border-border-primary text-text-primary px-3 py-1 rounded-full text-xs font-body"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {artist.followers && (
                <p className="text-text-muted font-body text-sm">
                  <span className="text-text-very">Followers:</span>{' '}
                  {artist.followers.total.toLocaleString()}
                </p>
              )}
              {artist.popularity && (
                <p className="text-text-muted font-body text-sm">
                  <span className="text-text-very">Popularity:</span> {artist.popularity}/100
                </p>
              )}
            </div>

            {artist.external_urls?.spotify && (
              <a
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent-spotify hover:opacity-90 text-text-primary font-body font-semibold px-6 py-3 rounded-full transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Spotify
              </a>
            )}
          </div>
        </div>

        <section>
          <h2 className="font-heading text-2xl text-text-primary mb-4">Top Tracks</h2>
          {songs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => navigate(`/song/${song.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
              <Music className="w-12 h-12 text-text-very mx-auto mb-4" />
              <p className="text-text-muted font-body">No tracks available</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
