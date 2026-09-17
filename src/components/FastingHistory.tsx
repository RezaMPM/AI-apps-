import React, { useState } from 'react';
import { FastRecord } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2,
  Trophy,
  X,
  AlertCircle,
  Save,
} from 'lucide-react';

interface FastingHistoryProps {
  fasts: FastRecord[];
  onUpdateFast?: (
    fastId: string,
    updates: {
      startTime: string;
      endTime: string;
      notes?: string;
      mood?: string;
      targetHours?: number;
    }
  ) => Promise<void>;
  onDeleteFast?: (fastId: string) => Promise<void>;
}

const toLocalDatetimeInput = (dateInput: string | Date): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

export const FastingHistory: React.FC<FastingHistoryProps> = ({
  fasts,
  onUpdateFast,
  onDeleteFast,
}) => {
  const [editingFast, setEditingFast] = useState<FastRecord | null>(null);
  const [editStart, setEditStart] = useState<string>('');
  const [editEnd, setEditEnd] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editMood, setEditMood] = useState<string>('Energetic');
  const [editTargetHours, setEditTargetHours] = useState<number>(16);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = (fast: FastRecord) => {
    setEditingFast(fast);
    setEditStart(toLocalDatetimeInput(fast.startTime));
    setEditEnd(
      toLocalDatetimeInput(
        fast.endTime || new Date(new Date(fast.startTime).getTime() + (fast.completedHours || 16) * 3600 * 1000)
      )
    );
    setEditNotes(fast.notes || '');
    setEditMood(fast.mood || 'Energetic');
    setEditTargetHours(fast.targetHours || 16);
    setError(null);
  };

  const closeEditing = () => {
    setEditingFast(null);
    setError(null);
  };

  // Live calculated hours in edit modal
  const computedStartMs = editStart ? new Date(editStart).getTime() : 0;
  const computedEndMs = editEnd ? new Date(editEnd).getTime() : 0;
  const computedHours =
    computedStartMs && computedEndMs && computedEndMs > computedStartMs
      ? Number(((computedEndMs - computedStartMs) / (1000 * 3600)).toFixed(1))
      : 0;
  const hitTarget = computedHours >= editTargetHours;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFast || !onUpdateFast) return;

    if (!editStart || !editEnd) {
      setError('Both start and end dates/times are required.');
      return;
    }

    if (new Date(editEnd).getTime() <= new Date(editStart).getTime()) {
      setError('End time must be after the start time.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onUpdateFast(editingFast.id, {
        startTime: new Date(editStart).toISOString(),
        endTime: new Date(editEnd).toISOString(),
        notes: editNotes.trim(),
        mood: editMood,
        targetHours: editTargetHours,
      });
      closeEditing();
    } catch (err: any) {
      setError(err?.message || 'Failed to update fast record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingFast || !onDeleteFast) return;
    if (!window.confirm('Are you sure you want to delete this fast from your history?')) return;
    setSaving(true);
    try {
      await onDeleteFast(editingFast.id);
      closeEditing();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete fast record.');
    } finally {
      setSaving(false);
    }
  };

  if (fasts.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
        <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="font-bold text-white text-base">No Recorded Fasts Yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Start your first fast using the timer above. When you complete it, your duration, mood, and milestones will be logged here!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-lg text-white">Fasting History & Log</h3>
          <p className="text-xs text-slate-400">Past fasting sessions • Tap edit to adjust start or end times</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/20">
          {fasts.length} Fast{fasts.length === 1 ? '' : 's'} Total
        </span>
      </div>

      <div className="space-y-3">
        {fasts.map((fast) => {
          const startDate = new Date(fast.startTime);
          const endDate = fast.endTime ? new Date(fast.endTime) : null;
          const completedHours = fast.completedHours || 0;
          const hitGoal = completedHours >= fast.targetHours;

          return (
            <div
              key={fast.id}
              className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hitGoal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {hitGoal ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{fast.protocol}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        hitGoal
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {hitGoal ? 'Goal Achieved' : 'Partial'}
                    </span>
                  </div>

                  <div className="text-slate-400 mt-0.5">
                    {startDate.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    })}{' '}
                    • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {endDate && ` to ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </div>

                  {fast.notes && (
                    <div className="text-slate-300 italic mt-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                      "{fast.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 gap-2">
                <div className="text-right">
                  <div className="font-mono text-base font-extrabold text-white">
                    {completedHours.toFixed(1)} hrs
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Target: {fast.targetHours}h {fast.mood && `• Mood: ${fast.mood}`}
                  </div>
                </div>

                {onUpdateFast && (
                  <button
                    onClick={() => startEditing(fast)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center gap-1.5 transition"
                    title="Edit Start or End Time"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit Times</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Past Fast Modal */}
      {editingFast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={closeEditing}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Edit Fast Record</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Adjust your start time or end time if you forgot to start or stop the timer on time.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Start Time input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* End Time input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Live recalculated duration telemetry */}
              <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Recalculated Duration
                  </div>
                  <div className="text-lg font-mono font-bold text-white mt-0.5">
                    {computedHours > 0 ? `${computedHours} hours` : 'Invalid interval'}
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    hitTarget
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {hitTarget ? '🏆 Target Achieved' : 'Partial Fast'}
                </span>
              </div>

              {/* Mood selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fasting Mood
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Energetic', 'Focused', 'Normal', 'Challenged'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditMood(m)}
                      className={`py-1.5 text-xs rounded-xl border font-medium transition ${
                        editMood === m
                          ? 'border-emerald-500 bg-emerald-500/20 text-white font-bold'
                          : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reflection Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes on how this fast felt..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                {onDeleteFast && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-3 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={closeEditing}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

