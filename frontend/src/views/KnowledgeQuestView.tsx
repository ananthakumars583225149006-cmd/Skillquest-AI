import React, { useState, useEffect } from 'react';
import { CourseTrack, KnowledgeQuestData, UserProfile } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { KaTeXRenderer, FormattedMathText } from '../components/KaTeXRenderer';
import { SocraticDrawer } from '../components/SocraticDrawer';
import { soundManager } from '../utils/soundManager';
import { api } from '../api';
import {
  Skull, Sparkles, Award, ArrowLeft, ArrowRight,
  RotateCw, CheckCircle2, Zap, Brain, ShieldAlert,
  ChevronRight, Lock
} from 'lucide-react';

interface KnowledgeQuestViewProps {
  track: CourseTrack;
  moduleIndex: number;
  profile: UserProfile | null;
  onBack: () => void;
  onUnlockBoss: (bossLevelId: string) => void;
  onRefreshProfile?: () => void;
}

export const KnowledgeQuestView: React.FC<KnowledgeQuestViewProps> = ({
  track,
  moduleIndex,
  profile,
  onBack,
  onUnlockBoss,
  onRefreshProfile,
}) => {
  const [questData, setQuestData] = useState<KnowledgeQuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSocraticOpen, setIsSocraticOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const outfitCode = profile?.equipped_outfit_code || 'SAFARI_EXPLORER';
  const bossLevelNumber = moduleIndex * 10;
  const bossLevelId = `${track.toLowerCase()}-lvl-${bossLevelNumber}`;

  useEffect(() => {
    loadQuest();
  }, [track, moduleIndex]);

  const loadQuest = async () => {
    setLoading(true);
    try {
      const data = await api.getKnowledgeQuest(track, moduleIndex);
      setQuestData(data);
      setIsCompleted(data.is_completed);
      setActiveCardIdx(0);
      setIsFlipped(false);
    } catch (err) {
      console.warn('Error loading knowledge quest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlipCard = () => {
    soundManager.playVineSwing();
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    if (!questData) return;
    soundManager.playVineSwing();
    setIsFlipped(false);
    setActiveCardIdx((prev) => (prev + 1) % questData.practice_flashcards.length);
  };

  const handlePrevCard = () => {
    if (!questData) return;
    soundManager.playVineSwing();
    setIsFlipped(false);
    setActiveCardIdx((prev) => (prev - 1 + questData.practice_flashcards.length) % questData.practice_flashcards.length);
  };

  const handleCompleteQuest = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await api.completeKnowledgeQuest(track, moduleIndex);
      setIsCompleted(true);
      soundManager.playLevelVictory();
      if (onRefreshProfile) onRefreshProfile();
      // Proceed to boss level
      setTimeout(() => {
        onUnlockBoss(bossLevelId);
      }, 1000);
    } catch (err) {
      console.error('Error completing knowledge quest:', err);
      // Fallback: unlock boss directly
      onUnlockBoss(bossLevelId);
    } finally {
      setCompleting(false);
    }
  };

  const flashcards = questData?.practice_flashcards || [];
  const currentCard = flashcards[activeCardIdx];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#1C1917] via-[#292524] to-[#451A03] text-amber-50 pb-28 select-none">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b-3 border-amber-600 px-6 py-4 flex items-center justify-between shadow-xl">
        <button
          onClick={() => {
            soundManager.playVineSwing();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950 border border-amber-600 text-amber-300 font-bold text-xs hover:bg-amber-900 cursor-pointer transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Trail Map</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Trial of Knowledge • Module {moduleIndex}</span>
          </div>
          <span className="text-xs text-amber-400/80 font-bold hidden sm:inline">
            Levels {(moduleIndex - 1) * 10 + 1}-{bossLevelNumber} Synthesis
          </span>
        </div>

        <button
          onClick={() => setIsSocraticOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-400 text-purple-200 font-bold text-xs cursor-pointer transition-colors shadow-sm"
        >
          <SpikeRhinoAvatar outfit={outfitCode} state="socratic" size={20} animate={false} />
          <span>Ask Spike for Revision</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Banner: Pre-Boss Revision Warning */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/90 via-stone-900/90 to-amber-950/90 border-3 border-amber-500 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shrink-0 text-amber-300 shadow-inner">
              <Skull className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Mandatory Boss Gate
                </span>
                <span className="text-xs font-bold text-amber-300">Level {bossLevelNumber} Boss</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-amber-50 drop-shadow mt-1">
                {questData?.title || `Module ${moduleIndex} Knowledge Trial`}
              </h1>
              <p className="text-xs text-amber-200/90 max-w-xl mt-1 leading-relaxed">
                Before risking the emergency failure scenario in Level {bossLevelNumber}, test your formula recall and concept synthesis across all 10 preceding levels!
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-amber-950 border border-amber-500 p-1 flex items-center justify-center shadow-md">
              <SpikeRhinoAvatar outfit={outfitCode} state="excited" size={48} animate={false} />
            </div>
            <span className="text-[11px] font-black text-amber-300 mt-1">Spike is with you!</span>
          </div>
        </div>

        {/* 3D INTERACTIVE FLIP FLASHCARDS */}
        {loading ? (
          <div className="py-24 text-center text-amber-300 font-bold animate-pulse flex flex-col items-center gap-3">
            <Sparkles className="w-10 h-10 animate-spin text-amber-400" />
            <span>Unsealing ancient engineering flashcard tablets...</span>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-200">Interactive 3D Revision Flashcards</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-900 border border-amber-600 text-amber-300 text-xs font-bold">
                  Card {activeCardIdx + 1} of {flashcards.length}
                </span>
              </div>
              <div className="text-xs text-amber-400/80 font-bold flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click card to flip</span>
              </div>
            </div>

            {/* 3D Flippable Card Container */}
            <div className="perspective-1000 w-full min-h-[260px] cursor-pointer" onClick={handleFlipCard}>
              <div
                className={`relative w-full h-full min-h-[260px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-2xl ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* FRONT FACE (Prompt / Question) */}
                <div
                  className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#451A03] via-[#292524] to-[#1C1917] border-4 border-amber-500 rounded-3xl p-8 flex flex-col justify-between"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-amber-950 font-black text-xs uppercase tracking-wider">
                      {currentCard?.category || 'Concept Challenge'}
                    </span>
                    <span className="text-xs font-bold text-amber-400">Question Side</span>
                  </div>

                  <div className="my-auto text-center py-6">
                    <h3 className="text-xl md:text-2xl font-black text-amber-100 leading-snug drop-shadow">
                      {currentCard?.front}
                    </h3>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-bold">
                    <RotateCw className="w-4 h-4 animate-spin-slow" />
                    <span>Click or tap to reveal the solution & formula</span>
                  </div>
                </div>

                {/* BACK FACE (Answer / Solution & Formula) */}
                <div
                  className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#065F46] border-4 border-emerald-400 rounded-3xl p-8 flex flex-col justify-between"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-emerald-300 text-emerald-950 font-black text-xs uppercase tracking-wider">
                      Verified Formula / Answer
                    </span>
                    <span className="text-xs font-bold text-emerald-200">Solution Side</span>
                  </div>

                  <div className="my-auto text-center py-6 space-y-3">
                    <div className="text-lg md:text-xl font-black text-emerald-50 leading-relaxed drop-shadow">
                      <FormattedMathText text={currentCard?.back || ''} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-200 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Memory locked! Click to flip back.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcard Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrevCard}
                className="btn-3d px-5 py-2.5 rounded-xl text-xs font-black bg-stone-800 text-amber-200 border border-stone-600 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Card</span>
              </button>

              <div className="flex gap-1.5">
                {flashcards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundManager.playVineSwing();
                      setIsFlipped(false);
                      setActiveCardIdx(idx);
                    }}
                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                      idx === activeCardIdx
                        ? 'bg-amber-400 scale-125 ring-2 ring-amber-300/60'
                        : 'bg-stone-700 hover:bg-stone-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextCard}
                className="btn-3d px-5 py-2.5 rounded-xl text-xs font-black bg-stone-800 text-amber-200 border border-stone-600 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Next Card</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* CONCEPT SYNTHESIS & GOVERNING FORMULAS RECAP */}
        {questData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Concept Breakdown Card */}
            <div className="bg-stone-900/80 border-2 border-amber-600/60 rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                <Brain className="w-4 h-4 text-amber-400" />
                <span>10-Level Concept Breakdown</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                {questData.recap_summary}
              </p>
              <ul className="space-y-2 border-t border-amber-800/60 pt-3 text-xs text-amber-200/90">
                {questData.concept_breakdown?.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{typeof pt === 'string' ? pt : JSON.stringify(pt)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Formulas Deck */}
            <div className="bg-stone-900/80 border-2 border-amber-600/60 rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-yellow-400 font-black text-sm">
                <Zap className="w-4 h-4 fill-current text-yellow-400" />
                <span>Governing Module Formulas</span>
              </div>
              <div className="space-y-2.5">
                {questData.key_formulas?.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 bg-amber-950/70 border border-amber-700/50 rounded-2xl flex items-center justify-between gap-3 shadow-inner"
                  >
                    <span className="text-xs font-black text-amber-300 truncate max-w-[140px]">
                      {f.label}
                    </span>
                    <div className="px-3 py-1 bg-stone-950 rounded-xl border border-stone-800 text-xs font-mono text-white overflow-x-auto">
                      <KaTeXRenderer math={f.latex} block={false} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY CTA: COMPLETE TRIAL & UNLOCK BOSS */}
        <div className="bg-gradient-to-r from-amber-950 via-[#78350F] to-amber-950 border-3 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-300" />
              <h3 className="text-base font-black text-amber-100">
                {isCompleted ? 'Trial Completed • Boss Mission Unlocked!' : 'Ready to Face the Module Boss?'}
              </h3>
            </div>
            <p className="text-xs text-amber-200/90 mt-1">
              Completing this revision grants <span className="font-bold text-yellow-300">+50 Spark Coins</span> and <span className="font-bold text-yellow-300">+100 XP</span> and unlocks the Boss Emergency Scenario.
            </p>
          </div>

          <button
            onClick={handleCompleteQuest}
            disabled={completing}
            className="btn-3d btn-3d-brand px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 whitespace-nowrap shadow-[0_6px_0_#581C87] hover:scale-102 cursor-pointer active:translate-y-1 transition-all"
          >
            {completing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Unlocking Boss...</span>
              </>
            ) : isCompleted ? (
              <>
                <span>Launch Boss Mission 👑</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </>
            ) : (
              <>
                <span>Complete Trial & Unlock Boss 👑</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Socratic Drawer */}
      <SocraticDrawer
        isOpen={isSocraticOpen}
        onClose={() => setIsSocraticOpen(false)}
        outfitCode={outfitCode}
        topicTag={questData?.title || 'Boss Revision'}
        activeView="KNOWLEDGE_QUEST"
        contextId={String(moduleIndex)}
        initialPrompt="Can you give me a high-level briefing to prepare for this Boss emergency scenario?"
      />
    </div>
  );
};
