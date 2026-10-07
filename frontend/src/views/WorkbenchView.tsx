import React, { useState, useEffect } from 'react';
import { LevelDetail, ChallengeData, UserProfile } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { FormattedMathText } from '../components/KaTeXRenderer';
import { SocraticDrawer } from '../components/SocraticDrawer';
import { CelebrationModal } from '../components/CelebrationModal';
import { api } from '../api';
import { soundManager } from '../utils/soundManager';
import {
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Zap, Terminal,
  Sliders, Play, RefreshCw, HelpCircle, Activity, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface WorkbenchViewProps {
  levelId: string;
  profile: UserProfile | null;
  onBack: () => void;
  onRefreshProfile: () => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  levelId,
  profile,
  onBack,
  onRefreshProfile,
}) => {
  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Challenge Input State
  const [circuitR1, setCircuitR1] = useState(2200);
  const [circuitR2, setCircuitR2] = useState(1000);
  const [circuitL, setCircuitL] = useState('10mH');
  const [circuitC, setCircuitC] = useState('100nF');
  const [sliderVal, setSliderVal] = useState(10000);
  const [codeContent, setCodeContent] = useState('');
  const [truthTableInput, setTruthTableInput] = useState<any[]>([]);

  // Simulation Evaluation Telemetry
  const [evalResult, setEvalResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Socratic Drawer State
  const [isSocraticOpen, setIsSocraticOpen] = useState(false);

  // Level Clear Modal
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ xp: 100, coins: 15 });

  useEffect(() => {
    loadLevel();
  }, [levelId]);

  const loadLevel = async () => {
    setLoading(true);
    try {
      const data = await api.getLevelDetails(levelId);
      setLevel(data);
      setActiveChallengeIdx(0);
      initChallengeInputs(data.challenges[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initChallengeInputs = (challenge?: ChallengeData) => {
    if (!challenge) return;
    setEvalResult(null);
    if (challenge.challenge_type === 'CODE_DEBUG') {
      setCodeContent(challenge.initial_state?.code || 'def solve():\n    pass\n');
    } else if (challenge.challenge_type === 'SPICE_CIRCUIT') {
      setCircuitR1(challenge.initial_state?.r1 || 2200);
      setCircuitR2(challenge.initial_state?.r2 || 1000);
    } else if (challenge.challenge_type === 'TRUTH_TABLE') {
      setTruthTableInput(challenge.initial_state?.submitted_table || [{ Y: 0 }, { Y: 1 }]);
    } else if (challenge.challenge_type === 'SLIDER_TUNING') {
      setSliderVal(challenge.initial_state?.sampling_freq || 1000);
    }
  };

  const handleNextChallenge = () => {
    if (!level) return;
    if (activeChallengeIdx < level.challenges.length - 1) {
      const nextIdx = activeChallengeIdx + 1;
      setActiveChallengeIdx(nextIdx);
      initChallengeInputs(level.challenges[nextIdx]);
    } else {
      // Completed all challenges in level!
      setShowCelebration(true);
    }
  };

  const handleSubmitSolution = async () => {
    if (!level || submitting) return;
    const challenge = level.challenges[activeChallengeIdx];
    setSubmitting(true);

    let submissionData: any = {};
    if (challenge.challenge_type === 'SPICE_CIRCUIT') {
      submissionData = {
        r1: circuitR1,
        r2: circuitR2,
        v_in: challenge.initial_state?.v_in || 12.0,
      };
    } else if (challenge.challenge_type === 'PHASOR_ALIGN') {
      submissionData = {
        r: 50,
        l: circuitL,
        c: circuitC,
      };
    } else if (challenge.challenge_type === 'CODE_DEBUG') {
      submissionData = { code: codeContent };
    } else if (challenge.challenge_type === 'TRUTH_TABLE') {
      submissionData = { submitted_table: truthTableInput };
    } else if (challenge.challenge_type === 'SLIDER_TUNING') {
      submissionData = {
        rin: 10000,
        rf: sliderVal,
        sampling_freq: sliderVal,
      };
    }

    try {
      const result = await api.submitChallenge(level.id, challenge.id, submissionData);
      setEvalResult(result);
      onRefreshProfile();

      if (result.is_correct) {
        soundManager.playLevelVictory();
        soundManager.playCoinPickup();
        if (result.level_completed) {
          setCelebrationData({
            xp: result.xp_earned,
            coins: result.coins_earned,
          });
          setShowCelebration(true);
        }
      } else {
        soundManager.playHeartLoss();
        // If wrong, offer Socratic tutor hint automatically
        setIsSocraticOpen(true);
      }
    } catch (err: any) {
      setEvalResult({ is_correct: false, feedback: err.message || 'Submission error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !level) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
        <p className="text-sm font-bold text-[#6B7280]">Initializing SPICE circuits & sandbox environment...</p>
      </div>
    );
  }

  const currentChallenge = level.challenges[activeChallengeIdx];
  const outfitCode = profile?.equipped_outfit_code || 'EEE_HIGH_VOLTAGE';

  // Synthetic Waveform generation for visual feedback in SPICE circuit workbench
  const waveformData = [
    { t: 0, v: 0 },
    { t: 1, v: 2.1 },
    { t: 2, v: 3.8 },
    { t: 3, v: (evalResult?.measurements?.v_out || 3.3) },
    { t: 4, v: (evalResult?.measurements?.v_out || 3.3) * 0.98 },
    { t: 5, v: (evalResult?.measurements?.v_out || 3.3) },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-28">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#18181B] bg-white border border-[#E5E7EB] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Map</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-purple-50 text-[#7C3AED]">
            {level.track} Track
          </span>
          <span className="text-sm font-black text-[#18181B]">
            Level {level.level_number}: {level.title}
          </span>
        </div>

        {/* Challenge Step Pills */}
        <div className="flex items-center gap-1.5">
          {level.challenges.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === activeChallengeIdx
                  ? 'bg-[#7C3AED] scale-125 ring-2 ring-purple-200'
                  : idx < activeChallengeIdx
                  ? 'bg-[#10B981]'
                  : 'bg-gray-200'
              }`}
            />
          ))}
          <span className="text-xs font-bold text-[#6B7280] ml-1">
            {activeChallengeIdx + 1}/{level.challenges.length}
          </span>
        </div>
      </div>

      {/* Main Dual-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Micro-Lesson Card & Challenge Objective (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Micro-Lesson */}
          <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Engineering Micro-Lesson</span>
              </span>
              <span className="text-xs font-medium text-[#6B7280] font-mono">
                {level.topic_tag}
              </span>
            </div>

            <div className="text-sm text-[#374151] leading-relaxed space-y-2">
              <FormattedMathText text={level.short_lesson_markdown} />
            </div>
          </div>

          {/* Active Challenge Goal */}
          <div className="bg-[#F3EEFF] border-2 border-[#A78BFA] rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold uppercase">
                Challenge {activeChallengeIdx + 1} of {level.challenges.length}
              </span>
              <span className="text-xs font-mono font-bold text-[#7C3AED]">
                {currentChallenge.challenge_type}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-[#18181B] leading-snug">
              {currentChallenge.prompt_text}
            </h3>

            {/* Target Criteria */}
            <div className="p-3 bg-white/90 rounded-2xl border border-purple-200 text-xs text-[#4C1D95] font-mono">
              <strong>Ground-Truth Target:</strong>{' '}
              {JSON.stringify(currentChallenge.target_state)}
            </div>

            {/* Ask Spike Button */}
            <button
              onClick={() => setIsSocraticOpen(true)}
              className="btn-3d btn-3d-neutral w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-[#7C3AED]"
            >
              <HelpCircle className="w-4 h-4 text-[#7C3AED]" />
              <span>Ask Spike for a Socratic Hint</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Interactive Workbench (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-extrabold text-sm text-[#18181B]">Interactive Simulation Canvas</h3>
              </div>
              <span className="text-[11px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Deterministic Engine Active
              </span>
            </div>

            {/* 1. SPICE CIRCUIT BREADBOARD */}
            {currentChallenge.challenge_type === 'SPICE_CIRCUIT' && (
              <div className="space-y-6">
                {/* Schematic Visual Canvas */}
                <div className="p-6 bg-[#FAFAFC] rounded-2xl border border-[#E5E7EB] flex flex-col items-center">
                  <div className="font-mono text-xs text-gray-500 mb-2">DC Voltage Divider Schematic</div>
                  <div className="flex items-center gap-4 text-sm font-mono font-bold">
                    <div className="p-3 bg-white rounded-xl border border-gray-300 text-center shadow-xs">
                      <div className="text-[10px] text-gray-400">VIN</div>
                      <div>12.0 V</div>
                    </div>
                    <span className="text-gray-400">⟶ [ R1: {circuitR1} Ω ] ⟶</span>
                    <div className="p-3 bg-[#F3EEFF] rounded-xl border border-[#A78BFA] text-[#7C3AED] text-center shadow-xs">
                      <div className="text-[10px] text-[#A78BFA]">VOUT NODE</div>
                      <div>{evalResult?.measurements?.v_out ?? ((12.0 * circuitR2) / (circuitR1 + circuitR2)).toFixed(2)} V</div>
                    </div>
                    <span className="text-gray-400">⟶ [ R2: {circuitR2} Ω ] ⟶ GND</span>
                  </div>
                </div>

                {/* Resistor Tuning Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <label className="text-xs font-bold text-gray-700 flex justify-between">
                      <span>Resistor R1 (Pull-Up)</span>
                      <span className="font-mono text-[#7C3AED]">{circuitR1} Ω</span>
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="20000"
                      step="100"
                      value={circuitR1}
                      onChange={(e) => setCircuitR1(Number(e.target.value))}
                      className="w-full accent-[#7C3AED]"
                    />
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <label className="text-xs font-bold text-gray-700 flex justify-between">
                      <span>Resistor R2 (Ground Shunt)</span>
                      <span className="font-mono text-[#7C3AED]">{circuitR2} Ω</span>
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="20000"
                      step="100"
                      value={circuitR2}
                      onChange={(e) => setCircuitR2(Number(e.target.value))}
                      className="w-full accent-[#7C3AED]"
                    />
                  </div>
                </div>

                {/* Live Output Waveform */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-600">Nodal Voltage Transient Response (V vs time)</span>
                  <div className="h-40 w-full bg-[#FAFAFC] rounded-2xl border border-gray-200 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={waveformData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="t" stroke="#9CA3AF" fontSize={10} />
                        <YAxis stroke="#9CA3AF" fontSize={10} domain={[0, 12]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="v" stroke="#7C3AED" strokeWidth={3} dot={{ fill: '#7C3AED', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CODE SANDBOX WORKBENCH */}
            {currentChallenge.challenge_type === 'CODE_DEBUG' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFC] overflow-hidden">
                  <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600 font-mono">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>solution.py</span>
                    </div>
                    <span>Python 3.8 Sandbox</span>
                  </div>
                  <textarea
                    rows={9}
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    className="w-full p-4 font-mono text-sm bg-[#18181B] text-[#E2E8F0] focus:outline-none focus:ring-0 leading-relaxed resize-none"
                    spellCheck={false}
                  />
                </div>

                {/* Console Output */}
                {evalResult && (
                  <div className="p-4 rounded-2xl bg-gray-900 text-gray-100 font-mono text-xs space-y-1">
                    <div className="text-gray-400">Terminal Telemetry:</div>
                    {evalResult.stdout && <pre className="text-emerald-400">{evalResult.stdout}</pre>}
                    {evalResult.error && <pre className="text-red-400">{evalResult.error}</pre>}
                    <div className="text-gray-500 text-[10px]">Exec time: {evalResult.execution_time_ms} ms</div>
                  </div>
                )}
              </div>
            )}

            {/* 3. TRUTH TABLE WORKBENCH */}
            {currentChallenge.challenge_type === 'TRUTH_TABLE' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <table className="w-full text-center text-sm font-mono">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-xs">
                        <th className="py-2">Row</th>
                        <th>Target Bit (Y)</th>
                        <th>Toggle Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      {truthTableInput.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2.5 font-bold text-gray-600">State #{idx}</td>
                          <td className="font-bold text-[#7C3AED]">{row.Y}</td>
                          <td>
                            <button
                              onClick={() => {
                                const copy = [...truthTableInput];
                                copy[idx].Y = copy[idx].Y === 1 ? 0 : 1;
                                setTruthTableInput(copy);
                              }}
                              className="px-3 py-1 rounded-lg bg-white border border-gray-300 font-bold text-xs hover:border-[#7C3AED] cursor-pointer"
                            >
                              Flip to {row.Y === 1 ? '0' : '1'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. SLIDER TUNING WORKBENCH */}
            {currentChallenge.challenge_type === 'SLIDER_TUNING' && (
              <div className="space-y-5">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex justify-between font-bold text-sm">
                    <span>Target Parameter Setting</span>
                    <span className="font-mono text-[#7C3AED]">{sliderVal}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={sliderVal}
                    onChange={(e) => setSliderVal(Number(e.target.value))}
                    className="w-full accent-[#7C3AED]"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>100</span>
                    <span>25000</span>
                    <span>50000</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING ACTION DECK */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] py-4 px-6 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Feedback Banner */}
          <div className="flex-1 w-full sm:w-auto">
            {evalResult ? (
              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                  evalResult.is_correct
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {evalResult.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                )}
                <span>{evalResult.feedback}</span>
                {evalResult.xp_earned > 0 && (
                  <span className="ml-auto font-black text-emerald-700">+{evalResult.xp_earned} XP</span>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#6B7280] flex items-center gap-2">
                <SpikeRhinoAvatar outfit={outfitCode} state="neutral" size={28} animate={false} />
                <span>Adjust your circuit parameters above and verify with the SPICE simulator.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsSocraticOpen(true)}
              className="btn-3d btn-3d-neutral px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 text-[#7C3AED]"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask Spike</span>
            </button>

            {evalResult?.is_correct ? (
              <button
                onClick={handleNextChallenge}
                className="btn-3d btn-3d-brand px-7 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitSolution}
                disabled={submitting}
                className="btn-3d btn-3d-success px-7 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Simulating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Check Solution</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Socratic AI Drawer */}
      <SocraticDrawer
        isOpen={isSocraticOpen}
        onClose={() => setIsSocraticOpen(false)}
        outfitCode={outfitCode}
        topicTag={level.topic_tag}
        measurements={evalResult?.measurements || {}}
        targetGoal={currentChallenge.target_state}
      />

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onContinue={() => {
          setShowCelebration(false);
          onBack();
        }}
        outfitCode={outfitCode}
        levelTitle={level.title}
        xpEarned={celebrationData.xp}
        coinsEarned={celebrationData.coins}
        isBossLevel={level.is_boss_level}
      />
    </div>
  );
};
