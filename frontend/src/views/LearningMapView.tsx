import React, { useState, useEffect } from 'react';
import { CourseTrack, LevelNode, UserProfile } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { LevelNotesModal } from './LevelNotesModal';
import { KnowledgeQuestView } from './KnowledgeQuestView';
import { api } from '../api';
import { soundManager } from '../utils/soundManager';
import { Star, Lock, Skull, Sparkles, Compass, Brain, CheckCircle2 } from 'lucide-react';

interface LearningMapViewProps {
  track: CourseTrack;
  profile: UserProfile | null;
  onSelectLevel: (levelId: string) => void;
  onTrackChange: (track: CourseTrack) => void;
  onRefreshProfile?: () => void;
}

export const LearningMapView: React.FC<LearningMapViewProps> = ({
  track,
  profile,
  onSelectLevel,
  onTrackChange,
  onRefreshProfile,
}) => {
  const [levels, setLevels] = useState<LevelNode[]>([]);
  const [unlockedLevelNumber, setUnlockedLevelNumber] = useState(1);
  const [completedQuestIds, setCompletedQuestIds] = useState<any[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<LevelNode | null>(null);

  // Modal Views State
  const [selectedNotesLevel, setSelectedNotesLevel] = useState<LevelNode | null>(null);
  const [activeKnowledgeQuestModule, setActiveKnowledgeQuestModule] = useState<number | null>(null);

  useEffect(() => {
    loadProgress();
    soundManager.startAmbient();
  }, [track]);

  const loadProgress = async () => {
    try {
      const data = await api.getTrackProgress(track);
      setLevels(data.levels);
      setUnlockedLevelNumber(data.unlocked_level_number);
      setCompletedQuestIds(data.completed_knowledge_quest_ids || []);
    } catch (err) {
      console.error(err);
    }
  };

  const outfitCode = profile?.equipped_outfit_code || 'SAFARI_EXPLORER';

  // Calculate S-curve winding coordinates for adventure trail
  const getNodeOffset = (index: number) => {
    const cycle = index % 6;
    if (cycle === 0) return 0;
    if (cycle === 1) return 85;
    if (cycle === 2) return 130;
    if (cycle === 3) return 90;
    if (cycle === 4) return -85;
    return -130;
  };

  // Identify biome by level index
  const getBiomeInfo = (levelNum: number) => {
    if (levelNum <= 10) {
      return {
        name: 'Jungle Gorge Biome',
        subtitle: 'Ancient Liana Canopy & Misty Gorge',
        badgeColor: 'bg-emerald-600 text-emerald-100 border-emerald-400',
      };
    } else if (levelNum <= 20) {
      return {
        name: 'Alpine Mountain Peaks',
        subtitle: 'Snowy Ledge & High-Voltage Transmission Towers',
        badgeColor: 'bg-sky-600 text-sky-100 border-sky-400',
      };
    } else {
      return {
        name: 'Tech Desert Oasis',
        subtitle: 'Golden Runic Pyramids & Solar Crystal Dunes',
        badgeColor: 'bg-amber-600 text-amber-100 border-amber-400',
      };
    }
  };

  const isQuestCompleted = (moduleIdx: number) => {
    return (
      completedQuestIds.includes(moduleIdx) ||
      completedQuestIds.includes(String(moduleIdx)) ||
      completedQuestIds.includes(`${track}-${moduleIdx}`)
    );
  };

  // Render Full Knowledge Quest View if activated
  if (activeKnowledgeQuestModule !== null) {
    return (
      <KnowledgeQuestView
        track={track}
        moduleIndex={activeKnowledgeQuestModule}
        profile={profile}
        onBack={() => {
          setActiveKnowledgeQuestModule(null);
          loadProgress();
        }}
        onUnlockBoss={(bossLevelId) => {
          setActiveKnowledgeQuestModule(null);
          loadProgress();
          onSelectLevel(bossLevelId);
        }}
        onRefreshProfile={onRefreshProfile}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none pb-32">
      {/* 1. CONTINUOUS ILLUSTRATED CARTOON NATURE BACKGROUND */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="w-full h-full min-h-[3600px] transition-colors duration-1000"
          style={{
            background: `linear-gradient(180deg, 
              #064E3B 0%, 
              #047857 8%, 
              #0D9488 18%, 
              #0284C7 32%, 
              #38BDF8 45%, 
              #F8FAFC 52%, 
              #BAE6FD 62%, 
              #FBBF24 75%, 
              #D97706 88%, 
              #78350F 100%)`,
          }}
        />

        {/* Ambient Sunlight Rays Shimmer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-200/20 via-transparent to-black/30 mix-blend-overlay" />

        {/* Jungle Foliage & Vine Canopy Silhouette Layer */}
        <div className="absolute top-0 inset-x-0 h-64 bg-repeat-x opacity-40 mix-blend-multiply" />
      </div>

      {/* 2. TRACK SWITCHER TABS */}
      <div className="pt-6 pb-2 px-4 max-w-xl mx-auto flex items-center justify-center gap-2 relative z-20">
        {(['EEE', 'CSE', 'ECE'] as CourseTrack[]).map((trk) => {
          const isActive = track === trk;
          return (
            <button
              key={trk}
              onClick={() => {
                soundManager.playVineSwing();
                onTrackChange(trk);
              }}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm tracking-wider uppercase transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-amber-950 border-3 border-yellow-200 shadow-[0_5px_0_#92400E] scale-105'
                  : 'bg-emerald-950/70 text-emerald-200 border-2 border-emerald-700/60 hover:bg-emerald-900/80'
              }`}
            >
              {trk} Map
            </button>
          );
        })}
      </div>

      {/* 3. ADVENTURE WINDING MAP CANVAS */}
      <div className="relative max-w-2xl mx-auto pt-10 pb-40 flex flex-col items-center">
        {/* SVG Continuous Winding Trail */}
        <svg
          className="absolute top-24 left-0 w-full h-[3200px] pointer-events-none -z-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 320 0 
               C 420 180, 480 320, 320 480 
               C 160 640, 160 800, 320 960 
               C 480 1120, 480 1280, 320 1440 
               C 160 1600, 160 1760, 320 1920 
               C 480 2080, 480 2240, 320 2400 
               C 160 2560, 160 2720, 320 2880
               C 480 3040, 400 3150, 320 3200"
            fill="none"
            stroke="#FEF3C7"
            strokeWidth="28"
            strokeLinecap="round"
            strokeDasharray="22 16"
            className="opacity-40"
          />
          <path
            d="M 320 0 
               C 420 180, 480 320, 320 480 
               C 160 640, 160 800, 320 960 
               C 480 1120, 480 1280, 320 1440 
               C 160 1600, 160 1760, 320 1920 
               C 480 2080, 480 2240, 320 2400 
               C 160 2560, 160 2720, 320 2880
               C 480 3040, 400 3150, 320 3200"
            fill="none"
            stroke="#92400E"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="18 18"
            className="opacity-70"
          />
        </svg>

        {levels.map((lvl, index) => {
          const offsetPx = getNodeOffset(index);
          const isCurrentActive = lvl.level_number === unlockedLevelNumber;
          const isBoss = lvl.is_boss_level;
          const biome = getBiomeInfo(lvl.level_number);
          const isBiomeStart = lvl.level_number === 1 || lvl.level_number === 11 || lvl.level_number === 21;
          const isQuestDone = isQuestCompleted(lvl.module_index);

          return (
            <React.Fragment key={lvl.id}>
              {/* Biome Region Title Waypoint Header */}
              {isBiomeStart && (
                <div className="w-full my-10 flex flex-col items-center animate-fade-in">
                  <div className={`px-5 py-2 rounded-2xl border-2 font-black text-xs sm:text-sm shadow-[0_4px_0_rgba(0,0,0,0.3)] tracking-wide flex items-center gap-2 ${biome.badgeColor}`}>
                    <Compass className="w-4 h-4" />
                    <span>{biome.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-white/90 drop-shadow mt-1">
                    {biome.subtitle}
                  </span>
                </div>
              )}

              {/* Waypoint Stone: Trial of Knowledge Revision Hub right before Boss (Levels 10, 20, 30) */}
              {isBoss && (
                <div className="relative my-4 flex flex-col items-center z-10 animate-fade-in">
                  <button
                    onClick={() => {
                      soundManager.playVineSwing();
                      setActiveKnowledgeQuestModule(lvl.module_index);
                    }}
                    className={`px-5 py-2.5 rounded-2xl border-3 flex items-center gap-2.5 font-black text-xs shadow-lg cursor-pointer transition-all hover:scale-105 active:translate-y-1 ${
                      isQuestDone
                        ? 'bg-emerald-900/90 border-emerald-400 text-emerald-200 shadow-[0_4px_0_#064E3B]'
                        : 'bg-purple-900/90 border-purple-400 text-purple-100 shadow-[0_4px_0_#4C1D95] animate-pulse'
                    }`}
                  >
                    <Brain className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Trial of Knowledge • Module {lvl.module_index}</span>
                    {isQuestDone ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-emerald-950 text-[10px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold">
                        Required for Boss
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Node Wrapper */}
              <div
                className="relative my-7 flex flex-col items-center"
                style={{
                  transform: `translateX(${offsetPx}px)`,
                  transition: 'transform 0.4s ease',
                }}
              >
                {/* SPIKE SITTING ON ACTIVE LEVEL NODE WITH BOUNCY SPEECH BUBBLE */}
                {isCurrentActive && (
                  <div className="absolute -top-24 z-30 flex flex-col items-center animate-bounce duration-1000">
                    <div className="bg-white border-3 border-amber-600 px-3.5 py-1.5 rounded-2xl shadow-[0_4px_0_#92400E] text-center whitespace-nowrap mb-1">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                        Watch out for the gorge! 🦏⚡
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-amber-100/90 border-3 border-amber-500 p-1 shadow-lg">
                      <SpikeRhinoAvatar outfit={outfitCode} state="excited" size={54} animate={false} />
                    </div>
                  </div>
                )}

                {/* TACTILE 3D LEVEL NODES */}
                {isBoss ? (
                  // Golden Boss Temple Ruin Node
                  <button
                    onClick={() => {
                      soundManager.playVineSwing();
                      if (lvl.is_unlocked) {
                        // Boss Unlock Guard: Require completed knowledge quest
                        if (isQuestDone) {
                          onSelectLevel(lvl.id);
                        } else {
                          setActiveKnowledgeQuestModule(lvl.module_index);
                        }
                      } else {
                        setSelectedBoss(lvl);
                      }
                    }}
                    className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center p-2 relative group cursor-pointer transition-transform active:translate-y-1.5 ${
                      lvl.is_unlocked
                        ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 border-4 border-yellow-200 text-amber-950 shadow-[0_8px_0_#78350F]'
                        : 'bg-stone-700 border-4 border-stone-500 text-stone-400 shadow-[0_6px_0_#292524] opacity-75'
                    }`}
                  >
                    <Skull className="w-8 h-8 drop-shadow" />
                    <span className="text-[11px] font-black uppercase tracking-wider mt-0.5">BOSS</span>
                  </button>
                ) : lvl.is_completed ? (
                  // Mossy Stone Slab with Golden 3D Stars
                  <button
                    onClick={() => {
                      soundManager.playVineSwing();
                      setSelectedNotesLevel(lvl);
                    }}
                    className="w-18 h-18 rounded-3xl flex flex-col items-center justify-center font-black bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 border-4 border-emerald-300 text-white shadow-[0_6px_0_#064E3B] hover:brightness-110 active:translate-y-1.5 cursor-pointer transition-transform"
                  >
                    <span className="text-base font-black drop-shadow">{lvl.level_number}</span>
                    <div className="flex gap-0.5 -mt-0.5">
                      <Star className="w-3 h-3 fill-current text-yellow-300 drop-shadow" />
                      <Star className="w-3 h-3 fill-current text-yellow-300 drop-shadow" />
                      <Star className="w-3 h-3 fill-current text-yellow-300 drop-shadow" />
                    </div>
                  </button>
                ) : isCurrentActive ? (
                  // Bouncy Pulsing Orange Wooden Drum Node
                  <button
                    onClick={() => {
                      soundManager.playVineSwing();
                      setSelectedNotesLevel(lvl);
                    }}
                    className="w-18 h-18 rounded-3xl flex items-center justify-center font-black text-xl bg-gradient-to-b from-orange-400 via-orange-500 to-orange-700 border-4 border-yellow-300 text-white shadow-[0_6px_0_#9A3412] hover:scale-105 active:translate-y-1.5 cursor-pointer transition-all ring-4 ring-yellow-300/60 animate-pulse"
                  >
                    <span className="drop-shadow">{lvl.level_number}</span>
                  </button>
                ) : lvl.is_unlocked ? (
                  // Unlocked Stepping-Stone Drum Node
                  <button
                    onClick={() => {
                      soundManager.playVineSwing();
                      setSelectedNotesLevel(lvl);
                    }}
                    className="w-16 h-16 rounded-3xl flex items-center justify-center font-black text-lg bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 border-3 border-amber-300 text-white shadow-[0_6px_0_#78350F] active:translate-y-1 cursor-pointer transition-transform"
                  >
                    <span>{lvl.level_number}</span>
                  </button>
                ) : (
                  // Overgrown Wooden Log Wrapped in Cartoon Vine Padlocks
                  <button
                    disabled
                    className="w-16 h-16 rounded-3xl flex flex-col items-center justify-center bg-stone-800/90 border-3 border-stone-600 text-stone-400 shadow-[0_5px_0_#1C1917] opacity-80 cursor-not-allowed"
                  >
                    <Lock className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-black text-stone-300 mt-0.5">{lvl.level_number}</span>
                  </button>
                )}

                {/* Level Title Wooden Label */}
                <div className="mt-2.5 max-w-[210px] px-3 py-1 rounded-2xl bg-amber-950/85 border-2 border-amber-700 text-center shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                  <div className="font-extrabold text-xs text-amber-100 truncate">
                    {isBoss && '👑 '}{lvl.title}
                  </div>
                  <div className="text-[10px] text-amber-300/80 font-bold">
                    {lvl.is_boss_level ? '250 XP • 50 Coins' : '100 XP • 15 Coins'}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Level Notes Modal */}
      {selectedNotesLevel && (
        <LevelNotesModal
          isOpen={true}
          levelId={selectedNotesLevel.id}
          levelTitle={selectedNotesLevel.title}
          levelNumber={selectedNotesLevel.level_number}
          track={track}
          outfitCode={outfitCode}
          onClose={() => setSelectedNotesLevel(null)}
          onStartChallenge={() => {
            const id = selectedNotesLevel.id;
            setSelectedNotesLevel(null);
            onSelectLevel(id);
          }}
        />
      )}

      {/* Boss Scenario Locked Modal */}
      {selectedBoss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-[#78350F] to-[#451A03] border-4 border-amber-500 rounded-3xl p-6 shadow-2xl text-amber-100 space-y-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-2xl border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-300">
              <Skull className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-amber-50">{selectedBoss.title}</h3>
              <p className="text-xs text-amber-200/90 mt-2 leading-relaxed">{selectedBoss.boss_scenario_brief}</p>
            </div>
            <div className="p-3 bg-amber-950/80 rounded-2xl border border-amber-600 text-xs text-amber-300 font-bold text-center">
              ⚠️ Clear earlier levels to unlock this boss mission with Spike!
            </div>
            <button
              onClick={() => {
                soundManager.playVineSwing();
                setSelectedBoss(null);
              }}
              className="w-full py-3 rounded-2xl font-black text-sm bg-amber-500 text-amber-950 shadow-[0_4px_0_#92400E] active:translate-y-1 cursor-pointer"
            >
              Back to Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
