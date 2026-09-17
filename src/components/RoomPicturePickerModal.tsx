import React, { useState, useRef } from 'react';
import { ROOM_PICTURE_PRESETS, getRoomPictureUrl } from '../roomPictures';
import { ImageIcon, Check, Upload, Link2, X, Smartphone, Sparkles, RefreshCw } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FastingRoom } from '../types';
import { optimizeImageFromDevice } from '../lib/imageUtils';

interface RoomPicturePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: FastingRoom;
  onPictureUpdated?: (newPictureUrl: string) => void;
}

export const RoomPicturePickerModal: React.FC<RoomPicturePickerModalProps> = ({
  isOpen,
  onClose,
  room,
  onPictureUpdated,
}) => {
  const currentPic = room.picture || ROOM_PICTURE_PRESETS[0].url;
  const [selectedUrl, setSelectedUrl] = useState<string>(getRoomPictureUrl(currentPic));
  const [customInputUrl, setCustomInputUrl] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'device' | 'presets' | 'custom'>('device');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingInfo, setProcessingInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (url: string) => {
    setSelectedUrl(url);
    setError(null);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    if (!customInputUrl.startsWith('http://') && !customInputUrl.startsWith('https://')) {
      setError('Please enter a valid web image URL starting with https://');
      return;
    }
    setSelectedUrl(customInputUrl.trim());
    setError(null);
  };

  const processSelectedFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    setProcessingInfo(`Optimizing "${file.name}" from your device...`);

    try {
      const optimizedBase64 = await optimizeImageFromDevice(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.84,
      });

      setSelectedUrl(optimizedBase64);
      setProcessingInfo(`Ready! Picture optimized from device.`);
    } catch (err: any) {
      console.error('Error processing device image:', err);
      setError(err.message || 'Could not load image from your device. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    // reset input value so re-selecting same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleSavePicture = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'rooms', room.id), {
        picture: selectedUrl,
      });

      if (onPictureUpdated) {
        onPictureUpdated(selectedUrl);
      }
      onClose();
    } catch (err: any) {
      console.error('Error updating room picture:', err);
      setError(err.message || 'Failed to update room picture.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Choose Room Picture</h3>
            <p className="text-xs text-slate-400">
              Pick an image from your device or choose a curated theme for "{room.name}"
            </p>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="my-4 relative h-36 rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner group bg-slate-950">
          <img
            src={selectedUrl}
            alt="Room Cover Preview"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20">
                Live Preview
              </span>
              <span className="text-xs text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-xs">
                {room.name}
              </span>
            </div>

            {selectedUrl.startsWith('data:') && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                From Device
              </span>
            )}
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className="text-xs font-semibold text-emerald-300">{processingInfo}</span>
            </div>
          )}
        </div>

        {/* Picker Mode Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('device')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === 'device'
                ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>From Device</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('presets')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === 'presets'
                ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Themes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('custom')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === 'custom'
                ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Web Link</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Tab 1: Choose from Device */}
        {activeMode === 'device' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/30 ring-4 ring-emerald-500/20'
                : 'border-slate-700 hover:border-emerald-500/60 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              Choose a photo from your device
            </p>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              Click to browse your phone or computer photos, or drag & drop an image here.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Browse Device Photos</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-3">
              Supports JPEG, PNG, WebP, Camera photos. Automatically resized and optimized.
            </p>
          </div>
        )}

        {/* Tab 2: Curated Presets Grid */}
        {activeMode === 'presets' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {ROOM_PICTURE_PRESETS.map((preset) => {
              const isSelected = selectedUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`relative h-20 rounded-xl overflow-hidden border text-left transition group ${
                    isSelected
                      ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/45 flex flex-col justify-between p-2">
                    {isSelected ? (
                      <span className="self-end p-1 bg-emerald-500 rounded-full text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-[11px] font-bold text-white leading-tight drop-shadow">
                      {preset.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Custom URL Input */}
        {activeMode === 'custom' && (
          <form onSubmit={handleApplyCustomUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Image Web Link
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 pr-10"
                />
                <Link2 className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-xl transition border border-slate-700"
            >
              Preview Custom Image
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2.5 mt-6 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {selectedUrl.startsWith('data:') ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Custom device photo selected
              </span>
            ) : (
              <span>Select or upload an image above</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || isProcessing}
              onClick={handleSavePicture}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Set Room Picture'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
