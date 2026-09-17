import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import { AssessmentAnswers, FastingProtocol } from '../types';
import { FASTING_PROTOCOLS } from '../constants';

interface ProtocolAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProtocol: (protocol: FastingProtocol) => void;
}

export const ProtocolAdvisorModal: React.FC<ProtocolAdvisorModalProps> = ({
  isOpen,
  onClose,
  onSelectProtocol,
}) => {
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<AssessmentAnswers>({
    experience: 'beginner',
    primaryGoal: 'weight_loss',
    dailySchedule: 'skip_breakfast',
    commitmentLevel: 'moderate',
  });
  const [recommendation, setRecommendation] = useState<FastingProtocol | null>(null);

  if (!isOpen) return null;

  const calculateRecommendation = () => {
    // Scoring logic based on user answers
    let targetId = '16:8';

    if (answers.experience === 'beginner') {
      if (answers.commitmentLevel === 'gentle' || answers.dailySchedule === 'regular_breakfast') {
        targetId = '12:12';
      } else if (answers.commitmentLevel === 'moderate') {
        targetId = '14:10';
      } else {
        targetId = '16:8';
      }
    } else if (answers.experience === 'some') {
      if (answers.primaryGoal === 'autophagy' || answers.commitmentLevel === 'strict') {
        targetId = '18:6';
      } else {
        targetId = '16:8';
      }
    } else {
      // Experienced
      if (answers.primaryGoal === 'autophagy' || answers.commitmentLevel === 'strict') {
        targetId = answers.dailySchedule === 'busy_lunch' ? '20:4' : '23:1';
      } else {
        targetId = '18:6';
      }
    }

    const matched = FASTING_PROTOCOLS.find(p => p.id === targetId) || FASTING_PROTOCOLS[2];
    setRecommendation(matched);
    setStep(5); // Result step
  };

  const handleReset = () => {
    setStep(1);
    setRecommendation(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative my-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {step < 5 && (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart Fasting Advisor</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              Find Your Ideal Fasting Protocol
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Answer 4 quick questions about your schedule and goals. We will calculate the perfect protocol for your body and routine.
            </p>

            {/* Step indicator */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    step >= s ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Experience */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-200 text-base">
              1. What is your experience with intermittent fasting?
            </h3>
            <div className="space-y-2.5">
              {[
                {
                  id: 'beginner',
                  title: 'Brand New / Beginner',
                  desc: 'Never fasted intentionally, or tried once and felt very hungry.',
                },
                {
                  id: 'some',
                  title: 'Some Experience',
                  desc: 'I regularly delay breakfast or have done 14-16h fasts before.',
                },
                {
                  id: 'experienced',
                  title: 'Experienced Faster',
                  desc: 'Accustomed to 16h-24h fasts and comfortable in ketosis.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, experience: opt.id as any })}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    answers.experience === opt.id
                      ? 'border-emerald-500 bg-emerald-950/20 text-white'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2 transition"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-200 text-base">
              2. What is your primary wellness goal?
            </h3>
            <div className="space-y-2.5">
              {[
                {
                  id: 'weight_loss',
                  title: 'Fat Loss & Body Composition',
                  desc: 'Burn stored fat and manage calorie intake comfortably.',
                },
                {
                  id: 'energy',
                  title: 'Stable All-Day Energy',
                  desc: 'Eliminate post-meal afternoon crashes and brain fog.',
                },
                {
                  id: 'autophagy',
                  title: 'Longevity & Cellular Cleanup (Autophagy)',
                  desc: 'Promote deep cellular rejuvenation and internal renewal.',
                },
                {
                  id: 'habit',
                  title: 'Daily Discipline & Healthy Routine',
                  desc: 'Stop late-night snacking and form structured eating habits.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, primaryGoal: opt.id as any })}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    answers.primaryGoal === opt.id
                      ? 'border-emerald-500 bg-emerald-950/20 text-white'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2 transition"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Daily Routine */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-200 text-base">
              3. What does your current daily routine look like?
            </h3>
            <div className="space-y-2.5">
              {[
                {
                  id: 'skip_breakfast',
                  title: 'Easy to skip breakfast',
                  desc: 'I can happily drink black coffee/tea and eat my first meal at lunch.',
                },
                {
                  id: 'regular_breakfast',
                  title: 'Love eating breakfast',
                  desc: 'I prefer breakfast and would rather finish eating early in the evening.',
                },
                {
                  id: 'busy_lunch',
                  title: 'Extremely busy midday',
                  desc: 'Meetings and work make it easier to feast mainly at dinner time.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, dailySchedule: opt.id as any })}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    answers.dailySchedule === opt.id
                      ? 'border-emerald-500 bg-emerald-950/20 text-white'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2 transition"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Commitment Level */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-200 text-base">
              4. How committed and intense do you want your start to be?
            </h3>
            <div className="space-y-2.5">
              {[
                {
                  id: 'gentle',
                  title: 'Gentle & Sustainable',
                  desc: 'Zero pressure, ease in smoothly without feeling deprived.',
                },
                {
                  id: 'moderate',
                  title: 'Balanced & Effective',
                  desc: 'Standard healthy challenge that yields noticeable real results.',
                },
                {
                  id: 'strict',
                  title: 'High Focus & Accelerated',
                  desc: 'Ready for deep discipline, maximum fat burn, and rapid autophagy.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, commitmentLevel: opt.id as any })}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    answers.commitmentLevel === opt.id
                      ? 'border-emerald-500 bg-emerald-950/20 text-white'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={calculateRecommendation}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Calculate Recommendation</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Recommendation Result */}
        {step === 5 && recommendation && (
          <div className="space-y-5">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30">
                Recommended Protocol
              </span>
              <h3 className="text-2xl font-bold text-white mt-2">
                {recommendation.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {recommendation.fastingHours}h Fast / {recommendation.eatingHours}h Eating Window • {recommendation.difficulty}
              </p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 text-sm space-y-2">
              <div>
                <span className="font-medium text-slate-200">Why it fits you: </span>
                <span className="text-slate-300">{recommendation.summary}</span>
              </div>
              <div className="text-xs text-slate-400 pt-1 border-t border-slate-700/40">
                <span className="font-semibold text-slate-300">Best for: </span>
                {recommendation.bestFor}
              </div>
            </div>

            {/* Eating schedule preview suggestion */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Example timing: Finish dinner by 8:00 PM, fast overnight, and break fast around {8 + (recommendation.fastingHours - 12)}:00 {recommendation.fastingHours >= 16 ? 'PM' : 'AM'}.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                onClick={() => {
                  onSelectProtocol(recommendation);
                  onClose();
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Adopt This Protocol</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
