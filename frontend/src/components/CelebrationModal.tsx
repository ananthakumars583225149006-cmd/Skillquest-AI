import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpikeRhinoAvatar } from './SpikeRhinoAvatar';
import { Star, Zap, Coins, ArrowRight } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onContinue: () => void;
  outfitCode: string;
  levelTitle: string;
  xpEarned: number;
  coinsEarned: number;
  isBossLevel?: boolean;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onContinue,
  outfitCode,
  levelTitle,
  xpEarned,
  coinsEarned,
  isBossLevel = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#F97316', '#10B981', '#F59E0B', '#FB7185'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border-2 border-[#E5E7EB] rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#F3EEFF] rounded-full filter blur-2xl opacity-70" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-100 rounded-full filter blur-2xl opacity-70" />

        {/* Dancing Spike Avatar */}
        <div className="relative mb-4 flex justify-center">
          <div className="w-36 h-36 rounded-full bg-[#F3EEFF] border-2 border-[#A78BFA] flex items-center justify-center p-2 shadow-inner">
            <SpikeRhinoAvatar outfit={outfitCode} state="celebrating" size={130} />
          </div>
        </div>

        {/* Trophy Stars */}
        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3].map((star) => (
            <div
              key={star}
              className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-500 shadow-sm transform hover:scale-110 transition-transform"
            >
              <Star className="w-6 h-6 fill-current" />
            </div>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-[#18181B] tracking-tight mb-1">
          {isBossLevel ? '🏆 BOSS DEFEATED!' : '🎉 LEVEL CLEARED!'}
        </h2>
        <p className="text-sm font-semibold text-[#6B7280] mb-6">
          {levelTitle}
        </p>

        {/* Reward Badges */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-[#F3EEFF] border border-[#A78BFA] flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-[#7C3AED] fill-current" />
            <div className="text-left">
              <div className="text-xs text-[#7C3AED] font-bold uppercase tracking-wider">Experience</div>
              <div className="text-xl font-extrabold text-[#18181B]">+{xpEarned} XP</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center gap-2">
            <Coins className="w-6 h-6 text-[#F59E0B] fill-current" />
            <div className="text-left">
              <div className="text-xs text-[#B45309] font-bold uppercase tracking-wider">Spark Coins</div>
              <div className="text-xl font-extrabold text-[#18181B]">+{coinsEarned} 🪙</div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="btn-3d btn-3d-brand w-full py-4 rounded-2xl font-extrabold text-base tracking-wide flex items-center justify-center gap-2 uppercase"
        >
          <span>Continue Quest</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
