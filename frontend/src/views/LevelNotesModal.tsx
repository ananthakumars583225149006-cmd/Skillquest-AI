import React, { useState, useEffect } from 'react';
import { LevelNoteData, CourseTrack } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { KaTeXRenderer, FormattedMathText } from '../components/KaTeXRenderer';
import { SocraticDrawer } from '../components/SocraticDrawer';
import { soundManager } from '../utils/soundManager';
import { api } from '../api';
import {
  X, Sparkles, BookOpen, Zap, Compass, CheckCircle2,
  HelpCircle, ChevronRight, Play, Wrench
} from 'lucide-react';

interface LevelNotesModalProps {
  isOpen: boolean;
  levelId: string;
  levelTitle: string;
  levelNumber: number;
  track: CourseTrack;
  outfitCode: string;
  onClose: () => void;
  onStartChallenge: () => void;
}

export const LevelNotesModal: React.FC<LevelNotesModalProps> = ({
  isOpen,
  levelId,
  levelTitle,
  levelNumber,
  track,
  outfitCode,
  onClose,
  onStartChallenge,
}) => {
  const [notes, setNotes] = useState<LevelNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSocraticOpen, setIsSocraticOpen] = useState(false);
  const [readConfirmed, setReadConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen && levelId) {
      loadNotes();
    }
  }, [isOpen, levelId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await api.getLevelNotes(levelId);
      setNotes(data);
      setReadConfirmed(data.is_read);
      // Mark as read in background
      api.markLevelNotesRead(levelId).catch(console.warn);
    } catch (err) {
      console.warn('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleStart = () => {
    soundManager.playVineSwing();
    api.markLevelNotesRead(levelId).catch(console.warn);
    onStartChallenge();
  };

  const handleAskSpike = () => {
    soundManager.playVineSwing();
    setIsSocraticOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#292524] via-[#1C1917] to-[#0C0A09] border-4 border-amber-500 rounded-3xl shadow-[0_12px_0_#451A03] text-amber-50 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Storybook Wooden Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 border-b-3 border-amber-600 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-950 border-2 border-amber-400 p-1 flex items-center justify-center shadow-inner">
              <SpikeRhinoAvatar outfit={outfitCode} state="neutral" size={38} animate={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-amber-950 font-black text-[11px] uppercase tracking-wider">
                  Level {levelNumber} Primer
                </span>
                <span className="text-xs text-amber-300 font-bold">{track} Track</span>
              </div>
              <h2 className="text-lg font-black text-amber-100 truncate max-w-md drop-shadow">
                {levelTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playVineSwing();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-600 flex items-center justify-center text-amber-300 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Storybook Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-amber-300 animate-pulse">
              <Sparkles className="w-8 h-8 animate-spin text-amber-400" />
              <span className="font-bold text-sm">Spike is unrolling the explorer field notes...</span>
            </div>
          ) : notes ? (
            <>
              {/* CARD 1: 🌟 Mission Primer */}
              <div className="bg-amber-950/50 border-2 border-amber-600/70 rounded-2xl p-4.5 shadow-md">
                <div className="flex items-center gap-2 text-amber-300 font-black text-sm mb-2">
                  <span className="text-base">🌟</span>
                  <span>Mission Primer</span>
                </div>
                <p className="text-sm text-amber-100 leading-relaxed font-medium">
                  {notes.summary}
                </p>
                {notes.key_points && notes.key_points.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-amber-800/60 pt-2.5 text-xs text-amber-200/90">
                    {notes.key_points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* CARD 2: ⚡ Key Takeaways & Formulas */}
              <div className="bg-stone-900/80 border-2 border-amber-500/80 rounded-2xl p-4.5 shadow-md">
                <div className="flex items-center gap-2 text-yellow-400 font-black text-sm mb-3">
                  <Zap className="w-4 h-4 fill-current text-yellow-400" />
                  <span>Governing Laws & Formulas</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notes.formulas_rules?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-950/70 border border-amber-600/50 rounded-xl p-3 flex flex-col items-center text-center shadow-inner"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-1">
                        {item.label}
                      </span>
                      <div className="py-1 px-3 bg-stone-950/80 rounded-lg border border-amber-700/50 text-white font-mono text-sm w-full overflow-x-auto">
                        <KaTeXRenderer math={item.latex} block={false} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 3: 🔍 Worked Example */}
              {notes.worked_example && notes.worked_example.problem && (
                <div className="bg-stone-900/80 border-2 border-stone-700 rounded-2xl p-4.5 shadow-md">
                  <div className="flex items-center gap-2 text-sky-400 font-black text-sm mb-2">
                    <span className="text-base">🔍</span>
                    <span>Step-by-Step Worked Example</span>
                  </div>
                  <div className="text-xs text-sky-200/90 font-semibold mb-2">
                    {notes.worked_example.problem}
                  </div>
                  <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800 text-xs font-mono text-stone-300 whitespace-pre-line leading-relaxed">
                    {notes.worked_example.step_by_step}
                  </div>
                  <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <span className="text-emerald-400">💡 Solution:</span>
                    <span>{notes.worked_example.solution}</span>
                  </div>
                </div>
              )}

              {/* CARD 4: 🛠️ Real-World Connection */}
              <div className="bg-emerald-950/40 border-2 border-emerald-600/60 rounded-2xl p-4.5 shadow-md">
                <div className="flex items-center gap-2 text-emerald-300 font-black text-sm mb-2">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span>Real-World Engineering Application</span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                  {notes.real_world_connection}
                </p>
              </div>

              {/* CARD 5: 💡 Ask Spike About This Note */}
              <div className="bg-purple-950/40 border-2 border-purple-500/60 rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-400 p-0.5 flex items-center justify-center shrink-0">
                    <SpikeRhinoAvatar outfit={outfitCode} state="socratic" size={32} animate={false} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-purple-200">Got questions about this lesson?</h4>
                    <p className="text-[11px] text-purple-300/80">Spike is tuned into these formulas and ready to help.</p>
                  </div>
                </div>
                <button
                  onClick={handleAskSpike}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white border border-purple-300 shadow-[0_3px_0_#581C87] active:translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  Ask Spike 🦏
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Action Footer: Bouncy 3D "Ready for Challenge! 🎮" Primary CTA */}
        <div className="px-6 py-4 bg-stone-950 border-t-3 border-amber-600/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-amber-300/80 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Field notes logged to your progress</span>
          </div>
          <button
            onClick={handleStart}
            className="btn-3d btn-3d-success px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-[0_5px_0_#14532D] cursor-pointer hover:scale-102 active:translate-y-1 transition-all"
          >
            <span>Ready for Challenge! 🎮</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Socratic Drawer connected to notes */}
      <SocraticDrawer
        isOpen={isSocraticOpen}
        onClose={() => setIsSocraticOpen(false)}
        outfitCode={outfitCode}
        topicTag={levelTitle}
        activeView="LEVEL_NOTES"
        contextId={levelId}
        initialPrompt="Can you explain the key formula and worked example from this note?"
      />
    </div>
  );
};
