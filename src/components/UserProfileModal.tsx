import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { AVATAR_EMOJIS } from '../constants';
import { optimizeImageFromDevice } from '../lib/imageUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  X,
  Smartphone,
  Upload,
  Check,
  Camera,
  Trash2,
  RefreshCw,
  Flame,
  Trophy,
  User,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated?: (updated: Partial<UserProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [selectedEmoji, setSelectedEmoji] = useState(profile.avatarEmoji || '🦊');
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(profile.photoURL || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);
    try {
      const optimized = await optimizeImageFromDevice(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
      });
      setCurrentPhoto(optimized);
      setFeedback('Photo selected from device! Click Save to apply.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not process image from your device.');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setCurrentPhoto(null);
    setFeedback('Removed custom photo. Will use avatar emoji.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updateData: Partial<UserProfile> = {
        displayName: displayName.trim(),
        avatarEmoji: selectedEmoji,
        photoURL: currentPhoto,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'users', profile.id), updateData);

      if (onProfileUpdated) {
        onProfileUpdated(updateData);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Your Profile</h3>
            <p className="text-xs text-slate-400">Personalize your name and profile picture</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {feedback && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
            {feedback}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Picture preview & Device upload */}
          <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="relative mb-3 group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/40 shadow-xl bg-slate-800 flex items-center justify-center">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">{selectedEmoji}</span>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full shadow-lg transition"
                title="Choose photo from device"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/40 transition flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Choose Photo from Device</span>
              </button>

              {currentPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1"
                  title="Remove photo and use emoji"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-400 mt-2">
              JPG, PNG, or camera photos. Automatically cropped and scaled.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Emoji Avatar fallback / alternative */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Avatar Emoji {!currentPhoto ? '(Active)' : '(Fallback)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center border transition ${
                    selectedEmoji === emoji
                      ? 'bg-emerald-500/20 border-emerald-500 scale-105 ring-2 ring-emerald-500/40'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isProcessing}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
