import React, { useState } from 'react';
import { UserProfile, CourseTrack } from '../types';
import { Flame, Coins, Heart, Compass, Shirt, Trophy, Home, Volume2, VolumeX, LogIn } from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { signInWithGoogle } from '../utils/supabaseClient';

interface HeaderProps {
  profile: UserProfile | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onTrackChange: (track: CourseTrack) => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeView,
  onNavigate,
  onTrackChange,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const currentTrack = profile?.active_track || 'EEE';

  const handleAudioToggle = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.startAmbient();
      soundManager.playCoinPickup();
    }
  };

  const handleGoogleSignIn = async () => {
    soundManager.playCoinPickup();
    try {
      await signInWithGoogle();
    } catch (e) {
      alert("Google OAuth: Check Supabase project keys in .env, or continue playing as Guest!");
    }
  };

  const trackLabels: Record<CourseTrack, string> = {
    EEE: '⚡ EEE Jungle Track',
    CSE: '💻 CSE Hacker Canopy',
    ECE: '📡 ECE Signal Oasis',
  };

  return (
    <header className="sticky top-0 z-40 w-full px-2 sm:px-6 pt-1 pb-3 transition-all select-none">
      {/* Dangling Liana Vines from Canopy above */}
      <div className="max-w-7xl mx-auto relative">
        {/* Vine suspenders */}
        <div className="absolute -top-3 left-10 w-3 h-6 bg-gradient-to-b from-[#15803D] to-[#166534] rounded-full shadow-md z-10 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
        </div>
        <div className="absolute -top-3 right-10 w-3 h-6 bg-gradient-to-b from-[#15803D] to-[#166534] rounded-full shadow-md z-10 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
        </div>

        {/* CARVED WOODEN SIGNBOARD CONTAINER */}
        <div className="bg-gradient-to-b from-[#92400E] via-[#78350F] to-[#451A03] border-4 border-[#B45309] rounded-3xl p-3 sm:p-4 shadow-[0_8px_0_#291305,0_12px_24px_rgba(0,0,0,0.45)] text-amber-100 flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden">
          {/* Subtle wood grain highlight overlays */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-amber-400/25 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-2 bg-black/40 pointer-events-none" />

          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-3 sm:gap-5 w-full md:w-auto justify-between md:justify-start">
            <button
              onClick={() => {
                soundManager.playVineSwing();
                onNavigate('home');
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-200 to-amber-400 border-2 border-amber-600 flex items-center justify-center text-2xl shadow-[0_4px_0_#78350F] group-hover:scale-105 transition-transform">
                🦏
              </div>
              <div>
                <div className="font-black text-lg sm:text-xl leading-none text-amber-50 drop-shadow flex items-center gap-1.5 tracking-tight">
                  <span>Skill Quest</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-[#F97316] text-white tracking-widest uppercase shadow-xs">
                    ADVENTURE
                  </span>
                </div>
                <div className="text-[11px] text-amber-300/90 font-bold mt-0.5">Spike's Engineering Expedition</div>
              </div>
            </button>

            {/* Navigation Tabs on Wooden Planks */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'learn', label: 'Quest Map', icon: Compass },
                { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
                { id: 'leagues', label: 'Leagues', icon: Trophy },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      soundManager.playVineSwing();
                      onNavigate(id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#F59E0B] text-amber-950 shadow-[0_3px_0_#B45309] -translate-y-0.5'
                        : 'bg-[#5B290B] hover:bg-[#6E340E] text-amber-200 border border-[#854D0E] shadow-[0_2px_0_#291305]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Tactile 3D Stat Containers & Action Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 justify-center md:justify-end w-full md:w-auto">
            {/* Active Track Shield */}
            <div className="flex items-center bg-[#5B290B] border-2 border-[#854D0E] rounded-xl p-0.5 gap-1 shadow-inner">
              {(['EEE', 'CSE', 'ECE'] as CourseTrack[]).map((trk) => {
                const isSelected = currentTrack === trk;
                return (
                  <button
                    key={trk}
                    onClick={() => {
                      soundManager.playVineSwing();
                      onTrackChange(trk);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F97316] text-white shadow-[0_2px_0_#9A3412]'
                        : 'text-amber-200/80 hover:text-white'
                    }`}
                  >
                    {trk}
                  </button>
                );
              })}
            </div>

            {/* Streak Flame */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 border-2 border-rose-400 text-white font-black text-xs shadow-[0_3px_0_#881337]">
              <Flame className="w-3.5 h-3.5 fill-current text-yellow-300" />
              <span>{profile?.streak_days || 1}d</span>
            </div>

            {/* Spark Coins */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 text-amber-950 font-black text-xs shadow-[0_3px_0_#78350F]">
              <Coins className="w-3.5 h-3.5 fill-current text-amber-100" />
              <span>{profile?.spark_coins ?? 100}</span>
            </div>

            {/* Heart Containers */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400 text-white font-black text-xs shadow-[0_3px_0_#7F1D1D]">
              <Heart className="w-3.5 h-3.5 fill-current text-pink-200" />
              <span>{profile?.hearts ?? 5}/{profile?.max_hearts ?? 5}</span>
            </div>

            {/* Audio Toggle Button */}
            <button
              onClick={handleAudioToggle}
              title={isMuted ? 'Unmute Jungle Audio' : 'Mute Audio'}
              className={`p-2 rounded-xl font-black text-xs flex items-center justify-center transition-all cursor-pointer ${
                isMuted
                  ? 'bg-[#5B290B] text-amber-400 border border-[#854D0E]'
                  : 'bg-emerald-600 border-2 border-emerald-400 text-white shadow-[0_3px_0_#064E3B]'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Google OAuth Login Button */}
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-[#18181B] font-extrabold text-xs shadow-[0_3px_0_#D1D5DB] transition-all cursor-pointer active:translate-y-0.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{profile?.email ? profile.username : 'Google Sign In'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
