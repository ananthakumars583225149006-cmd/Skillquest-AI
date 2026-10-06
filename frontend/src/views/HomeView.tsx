import React, { useState, useEffect } from 'react';
import { UserProfile, TrackSummary, CourseTrack } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { FormattedMathText } from '../components/KaTeXRenderer';
import { api } from '../api';
import { ArrowRight, Compass, Sparkles, CheckCircle2, AlertTriangle, BookOpen, BrainCircuit } from 'lucide-react';

interface HomeViewProps {
  profile: UserProfile | null;
  onNavigateToMap: (track: CourseTrack) => void;
  onNavigateToWardrobe: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  onNavigateToMap,
  onNavigateToWardrobe,
}) => {
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [drill, setDrill] = useState<any>(null);
  const [drillAnswer, setDrillAnswer] = useState<number | null>(null);
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null);
  const [loadingDrill, setLoadingDrill] = useState(false);

  useEffect(() => {
    loadTracks();
    loadAdaptiveDrill();
  }, [profile?.active_track]);

  const loadTracks = async () => {
    try {
      const data = await api.getTracksSummary();
      setTracks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdaptiveDrill = async () => {
    setLoadingDrill(true);
    try {
      const data = await api.generateAdaptiveDrill(profile?.active_track || 'EEE');
      setDrill(data);
      setDrillAnswer(null);
      setDrillFeedback(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDrill(false);
    }
  };

  const handleSelectDrillOption = (index: number) => {
    if (drillAnswer !== null) return;
    setDrillAnswer(index);
    if (index === drill?.correct_index) {
      setDrillFeedback(`✅ Correct! ${drill?.explanation}`);
    } else {
      setDrillFeedback(`💡 Spike Hint: ${drill?.explanation}`);
    }
  };

  const outfitCode = profile?.equipped_outfit_code || 'EEE_HIGH_VOLTAGE';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      {/* 1. HERO MASCOT GREETING BANNER */}
      <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F3EEFF] rounded-bl-full pointer-events-none -z-0 opacity-60" />

        {/* Spike Avatar Stage */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-36 h-36 rounded-2xl bg-[#FAFAFC] border-2 border-[#E5E7EB] flex items-center justify-center p-2 shadow-inner group cursor-pointer"
               onClick={onNavigateToWardrobe}>
            <SpikeRhinoAvatar outfit={outfitCode} state="excited" size={130} />
          </div>
          <button
            onClick={onNavigateToWardrobe}
            className="mt-2 text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Change Wardrobe</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Dialogue Bubble */}
        <div className="relative z-10 flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EEFF] border border-[#A78BFA] text-[#7C3AED] text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spike's Morning Engineering Brief</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight leading-snug">
            Welcome back, {profile?.username || 'Engineer'}! Ready to solve today's circuits?
          </h1>
          <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed max-w-2xl">
            You're currently advancing along the <strong className="text-[#18181B]">{profile?.active_track} Track</strong>.
            Your Bayesian Knowledge score is strong, but daily practice keeps your circuits from decaying!
          </p>

          <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              onClick={() => onNavigateToMap(profile?.active_track || 'EEE')}
              className="btn-3d btn-3d-brand px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Continue Learning Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3 TRACK CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#18181B] tracking-tight">Engineering Disciplines</h2>
            <p className="text-xs text-[#6B7280]">Select a track to launch interactive simulations and winding paths</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tracks.map((t) => {
            const isEee = t.track === 'EEE';
            const isCse = t.track === 'CSE';
            const isEce = t.track === 'ECE';
            const accentBg = isEee ? 'border-[#F97316]' : isCse ? 'border-[#A855F7]' : 'border-[#F59E0B]';
            const btnClass = isEee ? 'btn-3d-eee' : isCse ? 'btn-3d-cse' : 'btn-3d-ece';
            const badgeBg = isEee ? 'bg-orange-50 text-[#F97316] border-orange-200' : isCse ? 'bg-purple-50 text-[#A855F7] border-purple-200' : 'bg-amber-50 text-[#F59E0B] border-amber-200';

            return (
              <div
                key={t.track}
                className={`bg-white border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                  profile?.active_track === t.track ? `border-2 ${accentBg} ring-4 ring-purple-50` : 'border-[#E5E7EB]'
                }`}
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-gray-100 text-[#18181B] font-mono">
                      {t.track}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {t.badge_text}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg text-[#18181B] leading-snug">
                      {t.name}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1">
                      {isEee && 'Ohm’s law, KCL/KVL, AC phasors, RLC resonance, transients, and microgrid Boss missions.'}
                      {isCse && 'Memory layout, pointers, BST, Dijkstra graphs, relational SQL, and cloud crash Boss missions.'}
                      {isEce && 'Semiconductors, BJT Q-points, Fourier, Nyquist sampling, Smith charts, and space telemetry.'}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="my-6 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#6B7280]">
                    <span>Level {t.unlocked_level_number} of {t.total_levels}</span>
                    <span>{t.progress_percent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, t.progress_percent)}%`,
                        backgroundColor: t.accent_color,
                      }}
                    />
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => onNavigateToMap(t.track)}
                  className={`btn-3d ${btnClass} w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2`}
                >
                  <span>Launch {t.track} Map</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BKT ADAPTIVE DRILL CARD (REVIEW WEAKEST TOPIC) */}
      {drill && (
        <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#18181B] flex items-center gap-2">
                  <span>Bayesian Mastery Booster Drill</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[#B45309]">
                    Adaptive Review
                  </span>
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Targeted at your lowest mastery concept: <strong>{drill.target_topic}</strong> (P = {Math.round((drill.current_mastery || 0.3) * 100)}%)
                </p>
              </div>
            </div>
            <button
              onClick={loadAdaptiveDrill}
              disabled={loadingDrill}
              className="text-xs text-[#7C3AED] hover:underline font-bold self-start sm:self-auto cursor-pointer"
            >
              Regenerate Drill ↺
            </button>
          </div>

          {/* Drill Question Prompt */}
          <div className="space-y-2">
            <h4 className="font-bold text-base text-[#18181B]">{drill.title}</h4>
            <p className="text-sm text-[#4B5563]">{drill.prompt}</p>
            {drill.equation && (
              <div className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E5E7EB] text-center my-2">
                <FormattedMathText text={drill.equation} />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {drill.options?.map((opt: string, idx: number) => {
              const isSelected = drillAnswer === idx;
              const isCorrect = idx === drill.correct_index;
              let btnStyle = 'border-gray-200 hover:border-[#7C3AED] hover:bg-[#F3EEFF]';

              if (drillAnswer !== null) {
                if (isCorrect) {
                  btnStyle = 'border-[#10B981] bg-emerald-50 text-emerald-900 font-bold';
                } else if (isSelected) {
                  btnStyle = 'border-[#EF4444] bg-red-50 text-red-900 font-bold';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectDrillOption(idx)}
                  className={`p-3.5 rounded-2xl border-2 text-left text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {drillAnswer !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                  {drillAnswer !== null && isSelected && !isCorrect && <AlertTriangle className="w-4 h-4 text-[#EF4444]" />}
                </button>
              );
            })}
          </div>

          {/* Drill Feedback */}
          {drillFeedback && (
            <div className="p-4 rounded-2xl bg-[#F3EEFF] border border-[#A78BFA] text-sm text-[#5B21B6] font-medium animate-fade-in">
              <FormattedMathText text={drillFeedback} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
