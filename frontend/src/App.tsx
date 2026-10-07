import React, { useState, useEffect } from 'react';
import { UserProfile, CourseTrack } from './types';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { LearningMapView } from './views/LearningMapView';
import { WorkbenchView } from './views/WorkbenchView';
import { WardrobeView } from './views/WardrobeView';
import { LeaguesView } from './views/LeaguesView';
import { api } from './api';
import { supabase } from './utils/supabaseClient';
import { soundManager } from './utils/soundManager';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'learn' | 'wardrobe' | 'leagues' | 'workbench'>('learn');
  const [selectedTrack, setSelectedTrack] = useState<CourseTrack>('EEE');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('eee-lvl-1');

  useEffect(() => {
    loadProfile();

    // Listen to Supabase OAuth State Change
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          await api.syncGoogleUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
          });
          await loadProfile();
        } catch (err) {
          console.warn('Google user sync error:', err);
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setSelectedTrack(data.active_track || 'EEE');
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleTrackChange = async (track: CourseTrack) => {
    setSelectedTrack(track);
    try {
      await api.setActiveTrack(track);
      await loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateToMap = (track: CourseTrack) => {
    soundManager.playVineSwing();
    handleTrackChange(track);
    setActiveView('learn');
  };

  const handleSelectLevel = (levelId: string) => {
    soundManager.playVineSwing();
    setSelectedLevelId(levelId);
    setActiveView('workbench');
  };

  return (
    <div className="min-h-screen bg-[#064E3B] text-amber-50 flex flex-col selection:bg-amber-400 selection:text-amber-950 font-sans">
      {/* Top Navigation Rustic Wooden Header */}
      {activeView !== 'workbench' && (
        <Header
          profile={profile}
          activeView={activeView}
          onNavigate={(view) => setActiveView(view as any)}
          onTrackChange={handleTrackChange}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeView === 'home' && (
          <HomeView
            profile={profile}
            onNavigateToMap={handleNavigateToMap}
            onNavigateToWardrobe={() => {
              soundManager.playVineSwing();
              setActiveView('wardrobe');
            }}
          />
        )}

        {activeView === 'learn' && (
          <LearningMapView
            track={selectedTrack}
            profile={profile}
            onSelectLevel={handleSelectLevel}
            onTrackChange={handleTrackChange}
            onRefreshProfile={loadProfile}
          />
        )}

        {activeView === 'workbench' && (
          <WorkbenchView
            levelId={selectedLevelId}
            profile={profile}
            onBack={() => {
              soundManager.playVineSwing();
              setActiveView('learn');
            }}
            onRefreshProfile={loadProfile}
          />
        )}

        {activeView === 'wardrobe' && (
          <WardrobeView
            profile={profile}
            onRefreshProfile={loadProfile}
          />
        )}

        {activeView === 'leagues' && (
          <LeaguesView
            profile={profile}
          />
        )}
      </main>
    </div>
  );
};

export default App;
