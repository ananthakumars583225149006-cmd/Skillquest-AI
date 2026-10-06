import React, { useState, useEffect } from 'react';
import { CourseTrack, LevelNode, UserProfile } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { api } from '../api';
import { Star, Lock, Zap, Skull, ShieldAlert, Award, Play } from 'lucide-react';

interface LearningMapViewProps {
  track: CourseTrack;
  profile: UserProfile | null;
  onSelectLevel: (levelId: string) => void;
  onTrackChange: (track: CourseTrack) => void;
}

export const LearningMapView: React.FC<LearningMapViewProps> = ({
  track,
  profile,
  onSelectLevel,
  onTrackChange,
}) => {
  const [levels, setLevels] = useState<LevelNode[]>([]);
  const [unlockedLevelNumber, setUnlockedLevelNumber] = useState(1);
  const [selectedBoss, setSelectedBoss] = useState<LevelNode | null>(null);

  useEffect(() => {
    loadProgress();
  }, [track]);

  const loadProgress = async () => {
    try {
      const data = await api.getTrackProgress(track);
      setLevels(data.levels);
      setUnlockedLevelNumber(data.unlocked_level_number);
    } catch (err) {
      console.error(err);
    }
  };

  const outfitCode = profile?.equipped_outfit_code || 'EEE_HIGH_VOLTAGE';

  // Compute winding coordinates for Duolingo-style path
  // Alternates offset left and right: 0 -> center, 1 -> right, 2 -> center, 3 -> left
  const getNodeOffset = (index: number) => {
    const cycle = index % 4;
    if (cycle === 0) return 0;
    if (cycle === 1) return 80;
    if (cycle === 2) return 0;
    return -80;
  };

  const trackColor = track === 'EEE' ? '#F97316' : track === 'CSE' ? '#A855F7' : '#F59E0B';
  const trackName = track === 'EEE' ? 'Electrical Engineering' : track === 'CSE' ? 'Computer Science' : 'Electronics & Comms';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Map Header & Track Switcher */}
      <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block"
              style={{ backgroundColor: trackColor }}
            />
            <h1 className="text-xl sm:text-2xl font-black text-[#18181B] tracking-tight">
              {trackName} Quest Map
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            30 Data-Driven Levels • Boss Encounters at Levels 10, 20, 30
          </p>
        </div>

        {/* Track Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
          {(['EEE', 'CSE', 'ECE'] as CourseTrack[]).map((t) => (
            <button
              key={t}
              onClick={() => onTrackChange(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                track === t
                  ? 'bg-white text-[#18181B] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#18181B]'
              }`}
            >
              {t} Track
            </button>
          ))}
        </div>
      </div>

      {/* Winding Map Path Area */}
      <div className="relative py-12 flex flex-col items-center">
        {levels.map((lvl, idx) => {
          const isCurrentActive = lvl.level_number === unlockedLevelNumber;
          const isBoss = lvl.is_boss_level;
          const offsetPx = getNodeOffset(idx);

          // Node styling classes based on state
          let buttonBgClass = 'bg-white border-2 border-[#E5E7EB] text-[#9CA3AF] shadow-[0_4px_0_#D1D5DB]';
          if (lvl.is_completed) {
            buttonBgClass = 'bg-[#10B981] border-2 border-[#047857] text-white shadow-[0_4px_0_#065F46] hover:bg-[#059669]';
          } else if (lvl.is_unlocked) {
            if (track === 'EEE') buttonBgClass = 'bg-[#F97316] border-2 border-[#C2410C] text-white shadow-[0_4px_0_#9A3412] hover:bg-[#EA580C]';
            else if (track === 'CSE') buttonBgClass = 'bg-[#A855F7] border-2 border-[#7E22CE] text-white shadow-[0_4px_0_#6B21A8] hover:bg-[#9333EA]';
            else buttonBgClass = 'bg-[#F59E0B] border-2 border-[#B45309] text-white shadow-[0_4px_0_#92400E] hover:bg-[#D97706]';
          }

          return (
            <div
              key={lvl.id}
              className="relative my-6 flex flex-col items-center select-none"
              style={{
                transform: `translateX(${offsetPx}px)`,
                transition: 'transform 0.4s ease',
              }}
            >
              {/* Spike sitting on active node */}
              {isCurrentActive && (
                <div className="absolute -top-16 z-30 flex flex-col items-center animate-bounce">
                  <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-2xl border-2 border-[#A78BFA] p-1 shadow-lg">
                    <SpikeRhinoAvatar outfit={outfitCode} state="excited" size={48} animate={false} />
                  </div>
                  <div className="w-2 h-2 bg-[#7C3AED] rotate-45 -mt-1" />
                </div>
              )}

              {/* Decay Alert Indicator */}
              {lvl.has_decay_alert && (
                <div className="absolute -top-3 -right-3 z-20 px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-[#EF4444] text-[10px] font-black flex items-center gap-1 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  <span>DECAYED</span>
                </div>
              )}

              {/* 3D Round Node Button */}
              {isBoss ? (
                // Hexagonal Boss Node
                <button
                  onClick={() => {
                    if (lvl.is_unlocked) onSelectLevel(lvl.id);
                    else setSelectedBoss(lvl);
                  }}
                  disabled={!lvl.is_unlocked}
                  className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center p-2 relative group cursor-pointer transition-transform active:translate-y-1 ${
                    lvl.is_unlocked
                      ? 'bg-amber-400 border-4 border-amber-600 text-amber-950 shadow-[0_6px_0_#B45309]'
                      : 'bg-gray-100 border-4 border-gray-300 text-gray-400 shadow-[0_4px_0_#9CA3AF] opacity-60'
                  }`}
                >
                  <Skull className="w-7 h-7" />
                  <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">BOSS</span>
                </button>
              ) : (
                // Standard 3D Rounded Level Node
                <button
                  onClick={() => lvl.is_unlocked && onSelectLevel(lvl.id)}
                  disabled={!lvl.is_unlocked}
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-black text-lg transition-transform active:translate-y-1 cursor-pointer ${buttonBgClass} ${
                    lvl.has_decay_alert ? 'node-decay-alert' : ''
                  }`}
                >
                  {lvl.is_completed ? (
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-extrabold">{lvl.level_number}</span>
                      <div className="flex gap-0.5 -mt-0.5">
                        <Star className="w-2.5 h-2.5 fill-current text-yellow-300" />
                        <Star className="w-2.5 h-2.5 fill-current text-yellow-300" />
                        <Star className="w-2.5 h-2.5 fill-current text-yellow-300" />
                      </div>
                    </div>
                  ) : lvl.is_unlocked ? (
                    <span className="text-base font-black">{lvl.level_number}</span>
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              )}

              {/* Level Title Capsule */}
              <div
                className={`mt-2 text-center max-w-[220px] px-3 py-1 rounded-xl bg-white border text-xs font-semibold shadow-xs transition-colors ${
                  lvl.is_unlocked ? 'border-gray-200 text-[#18181B]' : 'border-gray-100 text-gray-400'
                }`}
              >
                <div className="truncate font-bold">
                  {isBoss && '👑 '}{lvl.title}
                </div>
                <div className="text-[10px] text-[#6B7280]">
                  {lvl.is_boss_level ? '250 XP • 50 Coins' : '100 XP • 15 Coins'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Boss Briefing Modal */}
      {selectedBoss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
              <Skull className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-[#18181B]">{selectedBoss.title}</h3>
              <p className="text-xs text-[#6B7280] mt-1">{selectedBoss.boss_scenario_brief}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
              ⚠️ Complete earlier levels to unlock this mission. Spike is standing by!
            </div>
            <button
              onClick={() => setSelectedBoss(null)}
              className="btn-3d btn-3d-neutral w-full py-2.5 rounded-xl font-bold text-sm"
            >
              Close Briefing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
