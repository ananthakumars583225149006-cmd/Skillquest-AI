import React, { useState, useEffect } from 'react';
import { CourseTrack, LevelNode, UserProfile } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { api } from '../api';
import { soundManager } from '../utils/soundManager';
import { Star, Lock, Skull, Sparkles, Compass } from 'lucide-react';

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
    soundManager.startAmbient();
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none pb-32">
      {/* ========================================================== */}
      {/* 1. FULL-BLEED CONTINUOUS ILLUSTRATED CARTOON NATURE BG      */}
      {/* ========================================================== */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Continuous Biome Gradient Canvas */}
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
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-yellow-200/20 via-emerald-300/10 to-transparent pointer-events-none" />

        {/* Dangling Canopy Liana Vines (Left & Right) */}
        <div className="absolute top-0 left-2 w-16 h-80 opacity-90">
          <svg viewBox="0 0 60 300" fill="none" className="w-full h-full">
            <path d="M10 0C25 60 5 120 20 180C35 240 10 300 15 300" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="22" cy="70" rx="8" ry="14" fill="#22C55E" transform="rotate(30 22 70)" />
            <ellipse cx="10" cy="140" rx="7" ry="13" fill="#16A34A" transform="rotate(-40 10 140)" />
            <ellipse cx="24" cy="210" rx="8" ry="14" fill="#4ADE80" transform="rotate(25 24 210)" />
          </svg>
        </div>
        <div className="absolute top-0 right-4 w-16 h-80 opacity-90">
          <svg viewBox="0 0 60 300" fill="none" className="w-full h-full">
            <path d="M50 0C35 60 55 120 40 180C25 240 50 300 45 300" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="38" cy="80" rx="8" ry="14" fill="#22C55E" transform="rotate(-30 38 80)" />
            <ellipse cx="50" cy="160" rx="7" ry="13" fill="#16A34A" transform="rotate(40 50 160)" />
          </svg>
        </div>

        {/* Animated Flying Toucan with Chirping Speech Bubble (Biome 1) */}
        <div className="absolute top-36 left-8 sm:left-24 animate-pulse duration-1000 z-10 hidden sm:flex items-center gap-2">
          <svg width="48" height="40" viewBox="0 0 60 50" fill="none">
            {/* Toucan Body */}
            <ellipse cx="25" cy="25" rx="14" ry="16" fill="#0F172A" />
            <circle cx="20" cy="18" r="10" fill="#0F172A" />
            {/* White/Yellow Throat */}
            <circle cx="24" cy="20" r="6" fill="#FDE047" />
            {/* Giant Colorful Beak */}
            <path d="M26 14C38 12 50 18 48 24C44 28 32 26 26 22Z" fill="#F97316" stroke="#C2410C" strokeWidth="1.5" />
            <path d="M42 16L48 24L38 22Z" fill="#EF4444" />
            {/* Eye */}
            <circle cx="20" cy="18" r="2.5" fill="#38BDF8" />
            <circle cx="20" cy="18" r="1" fill="#0F172A" />
            {/* Wings */}
            <path d="M12 25C8 30 14 36 22 34Z" fill="#1E293B" />
          </svg>
          <div className="bg-white/95 px-3 py-1 rounded-2xl border-2 border-emerald-400 text-[11px] font-black text-emerald-950 shadow-md">
            "Chirp! KCL holds at all nodes! 🦜"
          </div>
        </div>

        {/* Animated Swinging Cartoon Monkey (Biome 1) */}
        <div className="absolute top-96 right-8 sm:right-28 hidden sm:flex flex-col items-center animate-bounce duration-700">
          <svg width="44" height="60" viewBox="0 0 50 70" fill="none">
            {/* Hanging Vine */}
            <line x1="25" y1="0" x2="25" y2="28" stroke="#15803D" strokeWidth="4" />
            {/* Monkey Body */}
            <circle cx="25" cy="38" r="10" fill="#78350F" />
            <circle cx="25" cy="28" r="8" fill="#78350F" />
            <ellipse cx="25" cy="29" rx="5" ry="4" fill="#FDE68A" />
            <circle cx="23" cy="28" r="1.5" fill="#000" />
            <circle cx="27" cy="28" r="1.5" fill="#000" />
            {/* Tail */}
            <path d="M25 48C35 52 35 62 28 62" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-extrabold text-amber-200 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600">
            Cheeky Climber 🐒
          </span>
        </div>

        {/* Rickety Wooden Rope Bridge across Misty Turquoise Gorge */}
        <div className="absolute top-[820px] inset-x-0 h-44 flex flex-col items-center justify-center opacity-85">
          <div className="w-full max-w-lg h-24 relative flex items-center justify-center">
            {/* Gorge Mist Particles */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-300/40 to-teal-400/20 rounded-full blur-xl animate-pulse" />
            {/* Suspension Ropes */}
            <svg viewBox="0 0 500 80" className="w-full h-full overflow-visible">
              <path d="M20 15 Q250 65 480 15" stroke="#78350F" strokeWidth="5" fill="none" />
              <path d="M20 45 Q250 85 480 45" stroke="#78350F" strokeWidth="5" fill="none" />
              {/* Planks */}
              {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440].map((x, i) => (
                <rect key={i} x={x} y={35 + Math.sin(i * 0.5) * 6} width="16" height="6" rx="2" fill="#B45309" stroke="#451A03" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
          <div className="text-xs font-black text-teal-100 bg-teal-950/70 px-4 py-1 rounded-full border border-teal-500 shadow-md">
            🌊 Misty Turquoise Gorge Rope Bridge
          </div>
        </div>

        {/* Alpine Snowy Transmission Towers (Levels 11–20) */}
        <div className="absolute top-[1600px] inset-x-0 h-64 flex justify-between px-12 pointer-events-none opacity-80">
          {/* Left Tower */}
          <div className="w-24 flex flex-col items-center">
            <svg viewBox="0 0 60 120" className="w-full h-40">
              <polygon points="30,10 10,120 50,120" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <line x1="15" y1="50" x2="45" y2="50" stroke="#E2E8F0" strokeWidth="2.5" />
              <line x1="20" y1="85" x2="40" y2="85" stroke="#E2E8F0" strokeWidth="2.5" />
              <line x1="5" y1="45" x2="55" y2="45" stroke="#BAE6FD" strokeWidth="3" />
              {/* Snow Caps */}
              <ellipse cx="30" cy="10" rx="8" ry="4" fill="#FFFFFF" />
            </svg>
            <span className="text-[10px] font-black text-sky-100 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-400">
              ⚡ High-Voltage Pylon
            </span>
          </div>
          {/* Right Tower */}
          <div className="w-24 hidden sm:flex flex-col items-center">
            <svg viewBox="0 0 60 120" className="w-full h-40">
              <polygon points="30,10 10,120 50,120" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <line x1="15" y1="50" x2="45" y2="50" stroke="#E2E8F0" strokeWidth="2.5" />
              <line x1="5" y1="45" x2="55" y2="45" stroke="#BAE6FD" strokeWidth="3" />
              <ellipse cx="30" cy="10" rx="8" ry="4" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* Tech Desert Ancient Runic Pyramids (Levels 21–30) */}
        <div className="absolute top-[2600px] inset-x-0 h-80 flex flex-col items-center justify-center pointer-events-none opacity-85">
          <svg viewBox="0 0 300 120" className="w-64 h-32 overflow-visible">
            {/* Pyramid Base */}
            <polygon points="150,10 40,110 260,110" fill="#F59E0B" stroke="#92400E" strokeWidth="3" />
            <polygon points="150,10 150,110 260,110" fill="#D97706" />
            {/* Glowing Solar Crystal Beacon */}
            <polygon points="150,0 158,12 150,22 142,12" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.5" className="animate-pulse" />
          </svg>
          <span className="text-xs font-black text-amber-100 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500 shadow-md">
            ☀️ Ancient Solar Runic Pyramid
          </span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. ADVENTURE QUEST TRAIL NODES & SPIKE MASCOT               */}
      {/* ========================================================== */}
      <div className="max-w-2xl mx-auto pt-6 px-4 flex flex-col items-center relative z-20">
        {levels.map((lvl, idx) => {
          const isCurrentActive = lvl.level_number === unlockedLevelNumber;
          const isBoss = lvl.is_boss_level;
          const offsetPx = getNodeOffset(idx);
          const biome = getBiomeInfo(lvl.level_number);

          // Biome Marker Milestone divider at Level 1, Level 11, Level 21
          const showBiomeHeader = lvl.level_number === 1 || lvl.level_number === 11 || lvl.level_number === 21;

          return (
            <React.Fragment key={lvl.id}>
              {/* Biome Zone Announcement Banner */}
              {showBiomeHeader && (
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
                    {/* Bouncy Cartoon Dialogue Bubble */}
                    <div className="bg-white border-3 border-amber-600 px-3.5 py-1.5 rounded-2xl shadow-[0_4px_0_#92400E] text-center whitespace-nowrap mb-1">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                        Watch out for the gorge! 🦏⚡
                      </span>
                    </div>

                    {/* Spike 3D Cartoon Avatar in Safari Explorer Suit */}
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
                      if (lvl.is_unlocked) onSelectLevel(lvl.id);
                      else setSelectedBoss(lvl);
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
                      onSelectLevel(lvl.id);
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
                      onSelectLevel(lvl.id);
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
                      onSelectLevel(lvl.id);
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

      {/* Boss Scenario Modal */}
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
