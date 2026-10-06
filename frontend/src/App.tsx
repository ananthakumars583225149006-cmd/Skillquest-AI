import React, { useState, useEffect } from 'react';
import { UserProfile, CourseTrack } from './types';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { LearningMapView } from './views/LearningMapView';
import { WorkbenchView } from './views/WorkbenchView';
import { WardrobeView } from './views/WardrobeView';
import { LeaguesView } from './views/LeaguesView';
import { api } from './api';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'learn' | 'wardrobe' | 'leagues' | 'workbench'>('home');
  const [selectedTrack, setSelectedTrack] = useState<CourseTrack>('EEE');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('eee-lvl-1');

  useEffect(() => {
    loadProfile();
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
    handleTrackChange(track);
    setActiveView('learn');
  };

  const handleSelectLevel = (levelId: string) => {
    setSelectedLevelId(levelId);
    setActiveView('workbench');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#18181B] flex flex-col selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* Top Navigation Header */}
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
            onNavigateToWardrobe={() => setActiveView('wardrobe')}
          />
        )}

        {activeView === 'learn' && (
          <LearningMapView
            track={selectedTrack}
            profile={profile}
            onSelectLevel={handleSelectLevel}
            onTrackChange={handleTrackChange}
          />
        )}

        {activeView === 'workbench' && (
          <WorkbenchView
            levelId={selectedLevelId}
            profile={profile}
            onBack={() => setActiveView('learn')}
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
