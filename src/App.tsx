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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Loading...</p>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (profile?.onboarding_complete) {
    return <Navigate to="/home" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
