export interface RoomPicturePreset {
  id: string;
  label: string;
  category: string;
  url: string;
  gradient: string;
}

export const ROOM_PICTURE_PRESETS: RoomPicturePreset[] = [
  {
    id: 'mountain',
    label: 'Alpine Sunrise',
    category: 'Discipline & High Energy',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-amber-600 to-indigo-900',
  },
  {
    id: 'zen_stones',
    label: 'Zen Stones & Water',
    category: 'Mindfulness & Balance',
    url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-slate-700 to-emerald-900',
  },
  {
    id: 'matcha',
    label: 'Matcha & Green Tea',
    category: 'Antioxidants & Autophagy',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-emerald-600 to-teal-900',
  },
  {
    id: 'citrus',
    label: 'Citrus & Pure Water',
    category: 'Electrolytes & Refreshment',
    url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-amber-500 to-emerald-800',
  },
  {
    id: 'waterfall',
    label: 'Clear Cascades',
    category: 'Hydration & Vitality',
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-cyan-600 to-blue-950',
  },
  {
    id: 'fire',
    label: 'Metabolic Flame',
    category: 'Fat Oxidation & Power',
    url: 'https://images.unsplash.com/photo-1517594422361-5eeb8ae275a9?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-rose-600 to-amber-700',
  },
  {
    id: 'forest',
    label: 'Pine Sanctuary',
    category: 'Regeneration & Grounding',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-teal-800 to-emerald-950',
  },
  {
    id: 'sunrise',
    label: 'Golden Dawn',
    category: 'Circadian Rhythm & Fast Break',
    url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-amber-500 to-orange-800',
  },
  {
    id: 'ocean',
    label: 'Deep Pacific Waves',
    category: 'Calm & Steady Endurance',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-blue-600 to-cyan-900',
  },
  {
    id: 'lotus',
    label: 'Lotus Meditation',
    category: 'Purity & Cellular Renewal',
    url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
    gradient: 'from-purple-600 to-emerald-900',
  },
];

export const DEFAULT_ROOM_PICTURE = ROOM_PICTURE_PRESETS[0].url;

export function getRoomPictureUrl(pictureKeyOrUrl?: string): string {
  if (!pictureKeyOrUrl) return DEFAULT_ROOM_PICTURE;
  if (pictureKeyOrUrl.startsWith('http://') || pictureKeyOrUrl.startsWith('https://') || pictureKeyOrUrl.startsWith('data:')) {
    return pictureKeyOrUrl;
  }
  const preset = ROOM_PICTURE_PRESETS.find((p) => p.id === pictureKeyOrUrl);
  return preset ? preset.url : DEFAULT_ROOM_PICTURE;
}
