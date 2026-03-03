import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { OnboardingLanguage, OnboardingEra, OnboardingDirectors, OnboardingArtists } from './screens/OnboardingScreens';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { SongDetailScreen } from './screens/SongDetailScreen';
import { ArtistScreen } from './screens/ArtistScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TrendingScreen } from './screens/TrendingScreen';
import { supabase } from './lib/supabase';
import { getSpotifyToken } from './lib/spotify';

function DebugChecker() {
  useEffect(() => {
    const debug = async () => {
      console.log('=== SOUNDLOG DEBUG ===');

      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET ✅' : 'MISSING ❌');
      console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET ✅' : 'MISSING ❌');
      console.log('Spotify ID:', import.meta.env.VITE_SPOTIFY_CLIENT_ID ? 'SET ✅' : 'MISSING ❌');
      console.log('Spotify Secret:', import.meta.env.VITE_SPOTIFY_CLIENT_SECRET ? 'SET ✅' : 'MISSING ❌');
      console.log('LastFM Key:', import.meta.env.VITE_LASTFM_API_KEY ? 'SET ✅' : 'MISSING ❌');

      try {
        const { count, error } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true });
        console.log('Songs in DB:', count, error ? '❌ ' + error.message : '✅');
      } catch (e: any) {
        console.log('Supabase error:', e.message);
      }

      try {
        const token = await getSpotifyToken();
        console.log('Spotify token:', token ? 'WORKING ✅' : 'FAILED ❌');
      } catch (e: any) {
        console.log('Spotify error:', e.message);
      }

      try {
        const res = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=tamil&api_key=${import.meta.env.VITE_LASTFM_API_KEY}&format=json&limit=3`
        );
        const data = await res.json();
        console.log('LastFM working:', data.tracks ? 'YES ✅' : 'NO ❌');
      } catch (e: any) {
        console.log('LastFM error:', e.message);
      }
    };
    debug();
  }, []);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        background: '#09090B',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FAFAFA',
        fontFamily: 'Cormorant Garamond',
        fontSize: '32px',
        letterSpacing: '0.3em'
      }}>
        SOUNDLOG
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile && profile.onboarding_complete === false) {
    return <Navigate to="/onboarding/language" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        background: '#09090B',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FAFAFA',
        fontFamily: 'Cormorant Garamond',
        fontSize: '32px',
        letterSpacing: '0.3em'
      }}>
        SOUNDLOG
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.onboarding_complete === true) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DebugChecker />
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/onboarding/language" element={<OnboardingRoute><OnboardingLanguage /></OnboardingRoute>} />
          <Route path="/onboarding/era" element={<OnboardingRoute><OnboardingEra /></OnboardingRoute>} />
          <Route path="/onboarding/directors" element={<OnboardingRoute><OnboardingDirectors /></OnboardingRoute>} />
          <Route path="/onboarding/artists" element={<OnboardingRoute><OnboardingArtists /></OnboardingRoute>} />
          <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
          <Route path="/song/:id" element={<ProtectedRoute><SongDetailScreen /></ProtectedRoute>} />
          <Route path="/artist/:id" element={<ProtectedRoute><ArtistScreen /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          <Route path="/trending" element={<ProtectedRoute><TrendingScreen /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
