import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Music } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { getUserLogs, getFollowers, getFollowing, followUser, unfollowUser, isFollowing } from '../lib/database';
import SongCard from '../components/SongCard';

function EditProfileModal({ profile, onClose, onSave }: any) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || '');
  const [spotifyUrl, setSpotifyUrl] = useState(profile.spotify_profile_url || '');
  const [instagramUrl, setInstagramUrl] = useState(profile.instagram_url || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await supabase
        .from('users')
        .update({
          name,
          bio,
          spotify_profile_url: spotifyUrl,
          instagram_url: instagramUrl,
        })
        .eq('id', profile.id);
      onSave();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border-primary rounded-lg max-w-md w-full p-6">
        <h2 className="font-heading text-2xl text-text-primary mb-4">Edit Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="text-text-primary font-body text-sm mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-4 py-2 text-text-primary font-body text-sm focus:border-accent-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-text-primary font-body text-sm mb-1 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-4 py-2 text-text-primary font-body text-sm focus:border-accent-primary outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-text-primary font-body text-sm mb-1 block">Spotify Profile URL</label>
            <input
              type="url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/user/..."
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-4 py-2 text-text-primary font-body text-sm focus:border-accent-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-text-primary font-body text-sm mb-1 block">Instagram URL</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-4 py-2 text-text-primary font-body text-sm focus:border-accent-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border-primary text-text-primary rounded-lg font-body font-semibold hover:border-accent-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-accent-primary text-text-primary rounded-lg font-body font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function calculateTasteCompatibility(currentProfile: any, otherProfile: any, currentLogs: any[], otherLogs: any[]): number {
  let score = 0;

  const currentLanguages = new Set(currentProfile.preferred_languages || []);
  const otherLanguages = new Set(otherProfile.preferred_languages || []);
  const sharedLanguages = [...currentLanguages].filter(l => otherLanguages.has(l)).length;
  const totalLanguages = Math.max(currentLanguages.size, otherLanguages.size);
  const languageScore = totalLanguages > 0 ? (sharedLanguages / totalLanguages) : 0;

  const currentArtists = new Set(currentProfile.favorite_artists || []);
  const otherArtists = new Set(otherProfile.favorite_artists || []);
  const sharedArtists = [...currentArtists].filter(a => otherArtists.has(a)).length;
  const totalArtists = Math.max(currentArtists.size, otherArtists.size);
  const artistScore = totalArtists > 0 ? (sharedArtists / totalArtists) : 0;

  const currentEras = new Set(currentProfile.preferred_eras || []);
  const otherEras = new Set(otherProfile.preferred_eras || []);
  const sharedEras = [...currentEras].filter(e => otherEras.has(e)).length;
  const totalEras = Math.max(currentEras.size, otherEras.size);
  const eraScore = totalEras > 0 ? (sharedEras / totalEras) : 0;

  const weightedScore = (languageScore * 0.4) + (artistScore * 0.35) + (eraScore * 0.25);
  return Math.round(weightedScore * 100);
}

export function ProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [compatibility, setCompatibility] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (username) {
      loadProfileData();
    }
  }, [username, user]);

  async function loadProfileData() {
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setIsOwnProfile(profileData.id === user?.id);

      const [logsData, followersData, followingData] = await Promise.all([
        getUserLogs(profileData.id, 100),
        getFollowers(profileData.id),
        getFollowing(profileData.id),
      ]);

      setLogs(logsData);
      setFollowers(followersData);
      setFollowing(followingData);

      const topRatedSongs = logsData
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      setTopSongs(topRatedSongs);

      const artistCounts: Record<string, { artist: string, count: number, id: string }> = {};
      logsData.forEach((log: any) => {
        const artist = log.song.artist_name;
        if (!artistCounts[artist]) {
          artistCounts[artist] = { artist, count: 0, id: log.song.artist_id || '' };
        }
        artistCounts[artist].count++;
      });

      const topArtistsArray = Object.values(artistCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopArtists(topArtistsArray);

      if (user && profileData.id !== user.id && currentUserProfile) {
        const following = await isFollowing(user.id, profileData.id);
        setIsFollowingUser(following);

        const compatScore = calculateTasteCompatibility(currentUserProfile, profileData, logsData, logsData);
        setCompatibility(compatScore);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowToggle() {
    if (!user || !profile) return;

    try {
      if (isFollowingUser) {
        await unfollowUser(user.id, profile.id);
        setIsFollowingUser(false);
        setFollowers(followers.filter((f) => f.id !== user.id));
      } else {
        await followUser(user.id, profile.id);
        setIsFollowingUser(true);
        setFollowers([...followers, currentUserProfile]);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">User not found</p>
      </div>
    );
  }

  const topGenres = profile.preferred_languages || [];
  const topEras = profile.preferred_eras || [];

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {isOwnProfile && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full bg-accent-primary flex items-center justify-center mb-4">
            <span className="text-text-primary font-heading text-5xl">
              {profile.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="font-heading text-3xl text-text-primary mb-2">{profile.name}</h1>
          <p className="text-text-muted font-body text-sm mb-4">@{profile.username}</p>

          <div className="flex gap-8 mb-6">
            <div className="text-center">
              <p className="text-text-primary font-body font-bold text-xl">{logs.length}</p>
              <p className="text-text-muted font-body text-sm">Logs</p>
            </div>
            <div className="text-center">
              <p className="text-text-primary font-body font-bold text-xl">{followers.length}</p>
              <p className="text-text-muted font-body text-sm">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-text-primary font-body font-bold text-xl">{following.length}</p>
              <p className="text-text-muted font-body text-sm">Following</p>
            </div>
          </div>

          {profile.bio && (
            <p className="text-text-muted font-body text-sm mb-6 text-center max-w-md">
              {profile.bio}
            </p>
          )}

          {!isOwnProfile && (
            <button
              onClick={handleFollowToggle}
              className={`px-8 py-2 rounded-full font-body font-semibold transition-all mb-6 ${
                isFollowingUser
                  ? 'bg-bg-secondary border border-border-primary text-text-primary hover:border-accent-primary'
                  : 'bg-accent-primary text-text-primary hover:bg-accent-hover'
              }`}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}

          {!isOwnProfile && compatibility > 0 && (
            <div className="bg-bg-card border border-border-primary rounded-lg p-4 mb-6 max-w-md w-full">
              <div className="text-center mb-3">
                <p className="text-accent-primary font-heading text-2xl font-bold">{compatibility}%</p>
                <p className="text-text-primary font-body text-sm">Music Match</p>
              </div>
              {topGenres.length > 0 && (
                <p className="text-text-muted font-body text-xs mb-2">
                  Shared: {topGenres.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          )}

          {(profile.spotify_profile_url || profile.instagram_url) && (
            <div className="flex gap-3 mb-6">
              {profile.spotify_profile_url && (
                <a
                  href={profile.spotify_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-body text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.093-.899-.513-.12-.42.093-.781.513-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.98-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.6 10.561 19.14 12.84c.361.22.441.721.201 1.141zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.041-1.38-.62-.18-.601.041-1.2.62-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Spotify
                </a>
              )}
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full font-body text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.646.069 4.85 0 3.204-.012 3.584-.07 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
                  </svg>
                  Instagram
                </a>
              )}
            </div>
          )}

          {topGenres.length > 0 && (
            <div className="mt-4">
              <p className="text-text-very text-xs font-body mb-2 text-center">Listens to</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {topGenres.slice(0, 3).map((genre: string) => (
                  <span
                    key={genre}
                    className="bg-bg-card border border-border-primary text-text-primary px-3 py-1 rounded-full text-xs font-body"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topEras.length > 0 && (
            <div className="mt-3">
              <p className="text-text-very text-xs font-body mb-2 text-center">Favorite eras</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {topEras.slice(0, 3).map((era: string) => (
                  <span
                    key={era}
                    className="bg-bg-card border border-border-primary text-text-primary px-3 py-1 rounded-full text-xs font-body"
                  >
                    {era}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {topSongs.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl text-text-primary mb-4">Top 5 Songs</h2>
            <div className="space-y-2">
              {topSongs.map((log, idx) => (
                <div
                  key={log.id}
                  onClick={() => navigate(`/song/${log.song_id}`)}
                  className="bg-bg-card border border-border-primary rounded-lg p-4 hover:border-accent-primary transition-all cursor-pointer flex items-center gap-4"
                >
                  <span className="text-accent-primary font-heading font-bold text-lg">#{idx + 1}</span>
                  <img src={log.song.cover_image} alt={log.song.title} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-text-primary font-body text-sm font-semibold">{log.song.title}</p>
                    <p className="text-text-muted font-body text-xs">{log.song.artist_name}</p>
                  </div>
                  <span className="text-accent-primary font-body text-sm">★{log.rating}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {topArtists.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl text-text-primary mb-4">Top 5 Artists</h2>
            <div className="space-y-2">
              {topArtists.map((artist, idx) => (
                <div
                  key={artist.artist}
                  onClick={() => artist.id && navigate(`/artist/${artist.id}`)}
                  className="bg-bg-card border border-border-primary rounded-lg p-4 hover:border-accent-primary transition-all cursor-pointer flex items-center gap-4"
                >
                  <span className="text-accent-primary font-heading font-bold text-lg">#{idx + 1}</span>
                  <div className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-body text-sm font-semibold">{artist.artist}</p>
                    <p className="text-text-muted font-body text-xs">{artist.count} songs logged</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-heading text-2xl text-text-primary mb-4">Recent Logs</h2>
          {logs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {logs.slice(0, 20).map((log) => (
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
              <Music className="w-12 h-12 text-text-very mx-auto mb-4" />
              <p className="text-text-muted font-body">No logs yet</p>
            </div>
          )}
        </section>
      </div>

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            loadProfileData();
          }}
        />
      )}
    </div>
  );
}
