import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { searchSpotify } from '../lib/spotify';

const LANGUAGES = [
  'Tamil', 'Telugu', 'Hindi', 'Malayalam', 'Kannada',
  'Bengali', 'Marathi', 'Punjabi', 'Odia', 'Assamese',
  'Gujarati', 'Bhojpuri', 'Urdu', 'English'
];

const ERAS = [
  { label: 'Pre-1980s', years: 'Before 1980' },
  { label: '1980s', years: '1980-1989' },
  { label: '1990s', years: '1990-1999' },
  { label: '2000s', years: '2000-2009' },
  { label: '2010s', years: '2010-2019' },
  { label: '2020s', years: '2020+' },
];

const MUSIC_DIRECTORS = [
  'A.R. Rahman', 'Anirudh Ravichander', 'Yuvan Shankar Raja',
  'Harris Jayaraj', 'Ilaiyaraaja', 'Sid Sriram', 'D. Imman',
  'Arijit Singh', 'Pritam', 'Devi Sri Prasad'
];

function OnboardingLanguage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();
      if (data?.onboarding_complete === true) {
        window.location.href = '/home';
      }
    };
    check();
  }, [user]);

  const toggleLanguage = (lang: string) => {
    setSelected(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  async function handleContinue() {
    if (!user || selected.length === 0) return;
    setLoading(true);

    try {
      await supabase
        .from('users')
        .update({ preferred_languages: selected })
        .eq('id', user.id);
      navigate('/onboarding/era');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-heading text-3xl text-text-primary">Step 1 of 4</h2>
        <button onClick={async () => {
          if (user) {
            await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id);
          }
          window.location.href = '/home';
        }} className="text-text-muted hover:text-text-primary transition-colors font-body">
          Skip
        </button>
      </div>

      <h1 className="font-heading text-4xl text-text-primary mb-8">What do you listen to?</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
        {LANGUAGES.map(lang => (
          <button
            key={lang}
            onClick={() => toggleLanguage(lang)}
            className={`p-4 rounded-lg border-2 transition-all font-body ${
              selected.includes(lang)
                ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                : 'border-border-primary hover:border-accent-primary'
            }`}
          >
            <span className={selected.includes(lang) ? 'text-accent-primary' : 'text-text-primary'}>
              {lang}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading || selected.length === 0}
        className="w-full bg-accent-primary hover:bg-accent-hover text-text-primary font-body font-semibold py-3 rounded-full transition-all disabled:opacity-50 mt-auto"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}

function OnboardingEra() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();
      if (data?.onboarding_complete === true) {
        window.location.href = '/home';
      }
    };
    check();
  }, [user]);

  const toggleEra = (era: string) => {
    setSelected(prev => prev.includes(era) ? prev.filter(e => e !== era) : [...prev, era]);
  };

  async function handleContinue() {
    if (!user) return;
    setLoading(true);

    try {
      await supabase
        .from('users')
        .update({ preferred_eras: selected })
        .eq('id', user.id);
      navigate('/onboarding/directors');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-heading text-3xl text-text-primary">Step 2 of 4</h2>
        <button onClick={async () => {
          if (user) {
            await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id);
          }
          window.location.href = '/home';
        }} className="text-text-muted hover:text-text-primary transition-colors font-body">
          Skip
        </button>
      </div>

      <h1 className="font-heading text-4xl text-text-primary mb-8">Which era defines your taste?</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {ERAS.map(era => (
          <button
            key={era.label}
            onClick={() => toggleEra(era.label)}
            className={`p-6 rounded-lg border-2 transition-all text-center ${
              selected.includes(era.label)
                ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                : 'border-border-primary hover:border-accent-primary'
            }`}
          >
            <p className={`font-heading text-xl ${selected.includes(era.label) ? 'text-accent-primary' : 'text-text-primary'}`}>
              {era.label}
            </p>
            <p className="text-text-very text-sm font-body mt-1">{era.years}</p>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full bg-accent-primary hover:bg-accent-hover text-text-primary font-body font-semibold py-3 rounded-full transition-all disabled:opacity-50 mt-auto"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}

function OnboardingDirectors() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();
      if (data?.onboarding_complete === true) {
        window.location.href = '/home';
      }
    };
    check();
  }, [user]);

  const toggleDirector = (director: string) => {
    setSelected(prev => prev.includes(director) ? prev.filter(d => d !== director) : [...prev, director]);
  };

  async function handleContinue() {
    if (!user) return;
    setLoading(true);

    try {
      await supabase
        .from('users')
        .update({ favorite_music_directors: selected })
        .eq('id', user.id);
      navigate('/onboarding/artists');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-heading text-3xl text-text-primary">Step 3 of 4</h2>
        <button onClick={async () => {
          if (user) {
            await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id);
          }
          window.location.href = '/home';
        }} className="text-text-muted hover:text-text-primary transition-colors font-body">
          Skip
        </button>
      </div>

      <h1 className="font-heading text-4xl text-text-primary mb-8">Who creates your favourite music?</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {MUSIC_DIRECTORS.map(director => (
          <button
            key={director}
            onClick={() => toggleDirector(director)}
            className={`aspect-square rounded-full border-2 transition-all flex items-center justify-center text-center p-4 ${
              selected.includes(director)
                ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                : 'border-border-primary hover:border-accent-primary'
            }`}
          >
            <p className={`font-body text-sm ${selected.includes(director) ? 'text-accent-primary' : 'text-text-primary'}`}>
              {director}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full bg-accent-primary hover:bg-accent-hover text-text-primary font-body font-semibold py-3 rounded-full transition-all disabled:opacity-50 mt-auto"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}

function OnboardingArtists() {
  const [artists, setArtists] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();
      if (data?.onboarding_complete === true) {
        window.location.href = '/home';
      }
    };
    check();
  }, [user]);

  useEffect(() => {
    loadArtists();
  }, []);

  async function loadArtists() {
    const artistNames = [
      'A.R. Rahman', 'Anirudh Ravichander', 'Yuvan Shankar Raja',
      'Harris Jayaraj', 'Ilaiyaraaja', 'The Weeknd'
    ];

    try {
      const results = await Promise.all(
        artistNames.map(name => searchSpotify(name, 'artist').then(data => data.artists?.items?.[0]).catch(() => null))
      );
      setArtists(results.filter(Boolean));
    } catch (err) {
      console.error(err);
    }
  }

  const toggleArtist = (artistId: string) => {
    setSelected(prev => prev.includes(artistId) ? prev.filter(id => id !== artistId) : [...prev, artistId]);
  };

  async function handleFinish() {
    if (!user) return;
    setLoading(true);

    try {
      await supabase
        .from('users')
        .update({ favorite_artists: selected, onboarding_complete: true })
        .eq('id', user.id);

      window.location.href = '/home';
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 flex flex-col">
      <h2 className="font-heading text-3xl text-text-primary mb-8">Step 4 of 4</h2>
      <h1 className="font-heading text-4xl text-text-primary mb-2">Pick artists you love</h1>
      <p className="text-text-muted font-body mb-8">Select at least 3 artists (or skip)</p>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
        {artists.map(artist => (
          <button
            key={artist.id}
            onClick={() => toggleArtist(artist.id)}
            className={`aspect-square rounded-full border-2 transition-all flex flex-col items-center justify-center ${
              selected.includes(artist.id)
                ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                : 'border-border-primary hover:border-accent-primary'
            }`}
          >
            {artist.images?.[0]?.url ? (
              <img src={artist.images[0].url} alt={artist.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full bg-bg-card flex items-center justify-center text-accent-primary font-bold text-xl rounded-full">
                {artist.name[0]}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mt-auto">
        <button
          onClick={async () => {
            if (user) {
              await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id);
            }
            window.location.href = '/home';
          }}
          className="flex-1 border border-border-primary text-text-primary font-body font-semibold py-3 rounded-full transition-all hover:border-accent-primary"
        >
          Skip
        </button>
        <button
          onClick={handleFinish}
          disabled={loading}
          className="flex-1 bg-accent-primary hover:bg-accent-hover text-text-primary font-body font-semibold py-3 rounded-full transition-all disabled:opacity-50"
        >
          {loading ? 'Finishing...' : 'Finish'}
        </button>
      </div>
    </div>
  );
}

export { OnboardingLanguage, OnboardingEra, OnboardingDirectors, OnboardingArtists };
