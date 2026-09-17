export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarEmoji: string;
  photoURL?: string | null;
  currentFastId?: string | null;
  activeFastStartedAt?: string | null;
  activeFastTargetHours?: number | null;
  protocol?: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletedFasts: number;
  totalHoursFasted: number;
  medals: string[]; // List of medal IDs earned
  joinedRooms: string[]; // List of room IDs
  activeRoomId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomJoinRequest {
  userId: string;
  displayName: string;
  avatarEmoji?: string;
  photoURL?: string | null;
  requestedAt: string;
}

export interface FastingRoom {
  id: string;
  name: string;
  code: string;
  description?: string;
  picture?: string; // image URL or preset key (e.g. 'mountain', 'zen_stones', etc.)
  type?: 'public' | 'private';
  createdById: string;
  createdByName: string;
  adminId: string; // User ID of the room creator/admin
  members: string[]; // user IDs
  pendingRequests?: RoomJoinRequest[];
  createdAt: string;
}

export interface FastRecord {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  roomId?: string;
  protocol: string;
  targetHours: number;
  startTime: string; // ISO string
  endTime?: string | null;
  completedHours?: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  mood?: string;
}

export interface Encouragement {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  targetUserId?: string;
  targetUserName?: string;
  type: 'cheer' | 'nudge' | 'medal_celebration' | 'message';
  emoji: string;
  message: string;
  createdAt: string;
}

export interface Medal {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'milestone' | 'hours' | 'group' | 'special';
  icon: string;
  color: string;
  requirementDescription: string;
}

export interface FastingStage {
  hours: number;
  endHours?: number;
  phaseNumber: number;
  title: string;
  scientificName: string;
  description: string;
  scientificExplanation: string;
  benefit: string;
  color: string;
  ringColor?: string;
  hormoneEffects: {
    insulin: string;
    glucagon: string;
    growthHormone: string;
    ketones: string;
    autophagy: string;
  };
  cellularProcesses: string[];
  clinicalHighlights: string[];
  physiologicalTip: string;
}

export interface FastingProtocol {
  id: string;
  name: string;
  fastingHours: number;
  eatingHours: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  summary: string;
  bestFor: string;
}

export interface AssessmentAnswers {
  experience: 'beginner' | 'some' | 'experienced';
  primaryGoal: 'weight_loss' | 'energy' | 'autophagy' | 'mental_clarity' | 'habit';
  dailySchedule: 'regular_breakfast' | 'skip_breakfast' | 'busy_lunch' | 'night_shift';
  commitmentLevel: 'gentle' | 'moderate' | 'strict';
}
