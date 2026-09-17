import React from 'react';
import { Medal, UserProfile } from '../types';
import { MEDALS_CATALOG, DAILY_MOTIVATIONS } from '../constants';
import { Trophy, Award, Lock, Sparkles, Flame, CheckCircle } from 'lucide-react';

interface MedalsShowcaseProps {
  currentUser: UserProfile;
}

export const MedalsShowcase: React.FC<MedalsShowcaseProps> = ({ currentUser }) => {
  const earnedMedalIds = new Set(currentUser.medals || []);
  const randomMotivation = DAILY_MOTIVATIONS[Math.floor(Math.random() * DAILY_MOTIVATIONS.length)];

  const categories = [
    { key: 'milestone', label: 'Milestones' },
    { key: 'streak', label: 'Consistency & Streaks' },
    { key: 'hours', label: 'Total Hours' },
    { key: 'special', label: 'Endurance & Feats' },
    { key: 'group', label: 'Group Spirit' },
  ];

  const totalMedals = MEDALS_CATALOG.length;
  const unlockedCount = MEDALS_CATALOG.filter((m) => earnedMedalIds.has(m.id)).length;
  const completionPercentage = Math.round((unlockedCount / totalMedals) * 100);

  return (
    <div className="space-y-6">
      {/* Daily Motivation Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 mt-1 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Daily Motivation & Science
            </span>
            <p className="text-base font-medium text-slate-100 mt-1 italic leading-relaxed">
              "{randomMotivation.quote}"
            </p>
            <p className="text-xs text-slate-400 mt-2 font-semibold">
              — {randomMotivation.author}
            </p>
          </div>
        </div>
      </div>

      {/* Medals Shelf */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {/* Header & Overall Progress */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-lg text-white">Medal Showcase & Achievements</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Earn medals by completing fasting windows, streaks, and supporting your group.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-700">
            <div className="text-right">
              <div className="text-xs font-bold text-amber-300">
                {unlockedCount} / {totalMedals} Unlocked
              </div>
              <div className="text-[10px] text-slate-400">{completionPercentage}% Collection</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-extrabold text-sm">
              🏆
            </div>
          </div>
        </div>

        {/* Medals grouped by category */}
        <div className="space-y-6">
          {categories.map((cat) => {
            const medalsInCat = MEDALS_CATALOG.filter((m) => m.category === cat.key);
            if (medalsInCat.length === 0) return null;

            return (
              <div key={cat.key}>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {cat.label}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {medalsInCat.map((medal) => {
                    const isUnlocked = earnedMedalIds.has(medal.id);

                    return (
                      <div
                        key={medal.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 relative ${
                          isUnlocked
                            ? `${medal.color} bg-slate-800/60 shadow-lg`
                            : 'bg-slate-850/40 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div
                          className={`text-2xl w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isUnlocked
                              ? 'bg-slate-800 border-amber-500/40'
                              : 'bg-slate-800/50 border-slate-700 grayscale'
                          }`}
                        >
                          {medal.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-sm text-white truncate">
                              {medal.title}
                            </h5>
                            {isUnlocked ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                            {medal.description}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-1 font-medium">
                            Criteria: {medal.requirementDescription}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
