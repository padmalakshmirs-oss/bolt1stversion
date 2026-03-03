import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Star, MessageSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { getSongById, createLog, createReview, getSongReviews } from '../lib/database';
import { analyzeSentiment, analyzeToxicity } from '../lib/sentiment';
import { AudioPlayer } from '../components/AudioPlayer';

export function SongDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [song, setSong] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSongData();
    }
  }, [id]);

  async function loadSongData() {
    try {
      const songData = await getSongById(id!);
      setSong(songData);

      const reviewsData = await getSongReviews(id!, 20);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading song:', error);
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

  if (!song) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Song not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3">
            <div className="aspect-square rounded-lg overflow-hidden bg-bg-card mb-4">
              {song.cover_image ? (
                <img
                  src={song.cover_image}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-text-muted" />
                </div>
              )}
            </div>
            {song.preview_url && <AudioPlayer previewUrl={song.preview_url} />}
          </div>

          <div className="flex-1">
            <h1 className="font-heading text-4xl text-text-primary mb-2">{song.title}</h1>
            <button
              onClick={() => navigate(`/artist/${song.artist_id}`)}
              className="text-accent-primary hover:text-accent-hover text-lg font-body mb-4 transition-colors"
            >
              {song.artist_name}
            </button>
            <div className="space-y-2 mb-6">
              <p className="text-text-muted font-body text-sm">
                <span className="text-text-very">Album:</span> {song.album}
              </p>
              <p className="text-text-muted font-body text-sm">
                <span className="text-text-very">Year:</span> {song.year}
              </p>
              <p className="text-text-muted font-body text-sm">
                <span className="text-text-very">Language:</span> {song.language}
              </p>
              <p className="text-text-muted font-body text-sm">
                <span className="text-text-very">Total Logs:</span> {song.total_logs || 0}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLogModal(true)}
                className="bg-accent-primary hover:bg-accent-hover text-text-primary font-body font-semibold px-6 py-3 rounded-full transition-all"
              >
                Log This Song
              </button>
              {song.spotify_url && (
                <a
                  href={song.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent-spotify hover:opacity-90 text-text-primary font-body font-semibold px-6 py-3 rounded-full transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Spotify
                </a>
              )}
            </div>
          </div>
        </div>

        <section>
          <h2 className="font-heading text-2xl text-text-primary mb-4">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-bg-card border border-border-primary rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => navigate(`/profile/${review.user.username}`)}
                      className="text-accent-primary hover:text-accent-hover font-body font-semibold transition-colors"
                    >
                      {review.user.name}
                    </button>
                    <div className="flex items-center gap-1">
                      {review.sentiment_tag === 'positive' && (
                        <span className="text-green-500 text-xs">👍</span>
                      )}
                      {review.sentiment_tag === 'negative' && (
                        <span className="text-red-500 text-xs">👎</span>
                      )}
                    </div>
                  </div>
                  <p className="text-text-primary font-body text-sm">{review.text}</p>
                  <p className="text-text-very text-xs font-body mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-primary rounded-lg p-8 text-center">
              <MessageSquare className="w-12 h-12 text-text-very mx-auto mb-4" />
              <p className="text-text-muted font-body">No reviews yet. Be the first!</p>
            </div>
          )}
        </section>
      </div>

      {showLogModal && (
        <LogModal
          song={song}
          userId={user!.id}
          onClose={() => setShowLogModal(false)}
          onSuccess={() => {
            setShowLogModal(false);
            loadSongData();
          }}
        />
      )}
    </div>
  );
}

function LogModal({
  song,
  userId,
  onClose,
  onSuccess,
}: {
  song: any;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [listenedBefore, setListenedBefore] = useState(false);
  const [listenedAt, setListenedAt] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setLoading(true);

    try {
      await createLog(userId, song.id, rating, listenedBefore, listenedAt || undefined);

      if (reviewText.trim()) {
        const sentiment = analyzeSentiment(reviewText);
        const toxicity = analyzeToxicity(reviewText);

        if (toxicity < 0.5) {
          await createReview(
            userId,
            song.id,
            reviewText,
            sentiment.score,
            sentiment.tag,
            toxicity
          );
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating log:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border-primary rounded-lg max-w-md w-full p-6">
        <h2 className="font-heading text-2xl text-text-primary mb-4">Log Your Listen</h2>

        <div className="mb-4">
          <p className="text-text-muted font-body text-sm mb-2">Rate this song</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? 'fill-accent-star text-accent-star'
                      : 'text-text-very'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-text-primary font-body text-sm">
            <input
              type="checkbox"
              checked={listenedBefore}
              onChange={(e) => setListenedBefore(e.target.checked)}
              className="w-4 h-4 rounded border-border-primary"
            />
            I've listened to this before
          </label>
        </div>

        <div className="mb-4">
          <p className="text-text-muted font-body text-sm mb-2">When did you listen?</p>
          <input
            type="date"
            value={listenedAt}
            onChange={(e) => setListenedAt(e.target.value)}
            className="w-full bg-bg-primary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all font-body"
          />
        </div>

        <div className="mb-6">
          <p className="text-text-muted font-body text-sm mb-2">Write a review (optional)</p>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="w-full bg-bg-primary border border-border-primary rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all font-body resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-bg-primary border border-border-primary text-text-primary font-body font-semibold py-3 rounded-full hover:border-accent-primary transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 bg-accent-primary hover:bg-accent-hover text-text-primary font-body font-semibold py-3 rounded-full transition-all disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log It'}
          </button>
        </div>
      </div>
    </div>
  );
}
