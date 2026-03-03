import React, { useState } from 'react';
import { Music } from 'lucide-react';

interface SongCardProps {
  song: any;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
  matchScore?: number;
}

const SongCard = React.memo(function SongCard({ song, onClick, badge, badgeColor = 'accent-primary', matchScore }: SongCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);

  function openSpotify(e: React.MouseEvent) {
    e.stopPropagation();
    const url = song.spotify_url || `https://open.spotify.com/track/${song.spotify_id}`;
    window.open(url, '_blank');
  }

  const getBadgeStyles = () => {
    if (badgeColor === 'accent-star') {
      return 'bg-accent-primary text-text-primary';
    } else if (badgeColor === 'accent-primary') {
      return 'bg-accent-primary text-text-primary';
    }
    return 'bg-bg-card border border-border-primary text-text-muted';
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="group text-left transition-all transform hover:scale-105"
    >
      <div className="relative mb-3 rounded-t-lg overflow-hidden bg-bg-card aspect-square">
        {imageError || !song.cover_image ? (
          <div className="w-full h-full bg-bg-card flex items-center justify-center">
            <Music className="w-8 h-8 text-text-muted" />
          </div>
        ) : (
          <img
            src={song.cover_image}
            alt={song.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform ${isHovering ? 'scale-105' : ''}`}
          />
        )}

        {(badge || matchScore !== undefined) && (
          <div className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${getBadgeStyles()}`}>
            {matchScore !== undefined ? `${matchScore}% Match` : badge}
          </div>
        )}

        {isHovering && song.spotify_url && (
          <button
            onClick={openSpotify}
            className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.093-.899-.513-.12-.42.093-.781.513-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.98-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.6 10.561 19.14 12.84c.361.22.441.721.201 1.141zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.041-1.38-.62-.18-.601.041-1.2.62-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </button>
        )}

        {isHovering && !song.spotify_url && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <button className="bg-accent-primary text-text-primary rounded-full p-3 hover:bg-accent-hover transition-all">
              <Music className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      <div className="px-2 space-y-1">
        <h3 className="font-heading text-[13px] text-text-primary truncate">
          {song.title}
        </h3>
        <p className="font-body text-[11px] text-text-muted truncate">
          {song.artist_name}
        </p>
        <p className="font-body text-[10px] text-text-very">
          {song.year} · {song.language}
        </p>
      </div>
    </button>
  );
});

export default SongCard;
