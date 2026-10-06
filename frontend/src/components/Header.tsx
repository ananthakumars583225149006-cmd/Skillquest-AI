import React from 'react';
import { UserProfile, CourseTrack } from '../types';
import { Flame, Coins, Zap, Heart, Shield, Compass, Shirt, Trophy, Home } from 'lucide-react';

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
  const currentTrack = profile?.active_track || 'EEE';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Navigation */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] border border-[#A78BFA] flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
              🦏
            </div>
            <div>
              <div className="font-extrabold text-lg leading-tight tracking-tight text-[#18181B] flex items-center gap-1.5">
                <span>Skill Quest</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#7C3AED] text-white tracking-widest uppercase">AI</span>
              </div>
              <div className="text-xs text-[#6B7280] font-medium">Engineering with Spike</div>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'home'
                  ? 'bg-[#F3EEFF] text-[#7C3AED]'
                  : 'text-[#6B7280] hover:text-[#18181B] hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Hub</span>
            </button>
            <button
              onClick={() => onNavigate('learn')}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'learn'
                  ? 'bg-[#F3EEFF] text-[#7C3AED]'
                  : 'text-[#6B7280] hover:text-[#18181B] hover:bg-gray-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Map</span>
            </button>
            <button
              onClick={() => onNavigate('wardrobe')}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'wardrobe'
                  ? 'bg-[#F3EEFF] text-[#7C3AED]'
                  : 'text-[#6B7280] hover:text-[#18181B] hover:bg-gray-100'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Wardrobe</span>
            </button>
            <button
              onClick={() => onNavigate('leagues')}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'leagues'
                  ? 'bg-[#F3EEFF] text-[#7C3AED]'
                  : 'text-[#6B7280] hover:text-[#18181B] hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leagues</span>
            </button>
          </nav>
        </div>

        {/* Track Selector & Player Telemetry Pills */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 justify-center md:justify-end w-full md:w-auto">
          {/* Active Track Switcher */}
          <div className="flex items-center bg-[#FAFAFC] border border-[#E5E7EB] rounded-xl p-1 gap-1">
            {(['EEE', 'CSE', 'ECE'] as CourseTrack[]).map((trk) => {
              const isSelected = currentTrack === trk;
              const accentColor = trk === 'EEE' ? 'bg-[#F97316]' : trk === 'CSE' ? 'bg-[#A855F7]' : 'bg-[#F59E0B]';
              return (
                <button
                  key={trk}
                  onClick={() => onTrackChange(trk)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? `${accentColor} text-white shadow-sm`
                      : 'text-[#6B7280] hover:text-[#18181B]'
                  }`}
                >
                  {trk}
                </button>
              );
            })}
          </div>

          {/* Daily Streak */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-[#FB7185] font-bold text-xs sm:text-sm">
            <Flame className="w-4 h-4 fill-current" />
            <span>{profile?.streak_days || 1}</span>
          </div>

          {/* Spark Coins */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[#F59E0B] font-bold text-xs sm:text-sm">
            <Coins className="w-4 h-4 fill-current" />
            <span>{profile?.spark_coins ?? 100}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED] font-bold text-xs sm:text-sm">
            <Zap className="w-4 h-4 fill-current" />
            <span>{profile?.xp ?? 0} XP</span>
          </div>

          {/* Hearts Lives */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-500 font-bold text-xs sm:text-sm">
            <Heart className="w-4 h-4 fill-current" />
            <span>{profile?.hearts ?? 5}/{profile?.max_hearts ?? 5}</span>
          </div>

          {/* League Tier */}
          <button
            onClick={() => onNavigate('leagues')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3EEFF] border border-[#A78BFA] text-[#7C3AED] font-bold text-xs sm:text-sm cursor-pointer hover:bg-[#E9D5FF] transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>{profile?.current_league || 'Bronze'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
