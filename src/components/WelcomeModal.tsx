import React, { useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Activity,
  Users,
  Bot,
  Award,
  ArrowRight,
  CheckCircle2,
  Heart,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  avatarEmoji?: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  displayName,
  avatarEmoji = '🌱',
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Avatar & Greeting */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-emerald-500/10">
              {avatarEmoji}
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to FastingCircle, {displayName}! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Your account is set up and ready. We are excited to support your journey toward metabolic
            health, mental clarity, and cellular renewal.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Full Fasting Clock Flexibility</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                Forgot to press start or finish? You can edit the start and end times of any active
                or completed fast at any time.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl shrink-0 mt-0.5">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">8 Science-Backed Biological Phases</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                Explore in real-time what is happening inside your cells—from glycogen depletion to
                autophagy and stem cell rejuvenation.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Fasting Friends Circle</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                Join a room or invite friends to track fasts together, view live countdowns, and send
                supportive cheers.
              </p>
            </div>
          </div>
        </div>

        {/* Starter Reward Box */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-300">Starter Badge Awarded</span>
              <p className="text-[11px] text-slate-400">First Fast Explorer • Begin your first fast to level up</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-amber-400 font-mono px-2 py-0.5 rounded-md bg-amber-500/20">
            +50 XP
          </span>
        </div>

        {/* Call to Action */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-95"
        >
          <span>Start Your First Fast</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
