import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, LogOut, Music } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { getUserLogs, getFollowers, getFollowing, followUser, unfollowUser, isFollowing } from '../lib/database';
import SongCard from '../components/SongCard';

export function ProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);

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
        getUserLogs(profileData.id, 50),
        getFollowers(profileData.id),
        getFollowing(profileData.id),
      ]);

      setLogs(logsData);
      setFollowers(followersData);
      setFollowing(followingData);

      if (user && profileData.id !== user.id) {
        const following = await isFollowing(user.id, profileData.id);
        setIsFollowingUser(following);
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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-body text-sm">Sign Out</span>
            </button>
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

          {!isOwnProfile && (
            <button
              onClick={handleFollowToggle}
              className={`px-8 py-2 rounded-full font-body font-semibold transition-all ${
                isFollowingUser
                  ? 'bg-bg-secondary border border-border-primary text-text-primary hover:border-accent-primary'
                  : 'bg-accent-primary text-text-primary hover:bg-accent-hover'
              }`}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}

          {topGenres.length > 0 && (
            <div className="mt-6">
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

        <section>
          <h2 className="font-heading text-2xl text-text-primary mb-4">Recent Logs</h2>
          {logs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {logs.map((log) => (
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
    </div>
  );
}
