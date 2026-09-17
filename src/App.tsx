import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  arrayUnion,
  increment,
  limit,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import {
  UserProfile,
  FastingRoom,
  FastRecord,
  Encouragement,
  FastingProtocol,
  RoomJoinRequest,
} from './types';
import { FASTING_PROTOCOLS, AVATAR_EMOJIS } from './constants';
import { FastingTimer } from './components/FastingTimer';
import { FriendsCircle } from './components/FriendsCircle';
import { MedalsShowcase } from './components/MedalsShowcase';
import { FastingHistory } from './components/FastingHistory';
import { AuthModal } from './components/AuthModal';
import { WelcomeModal } from './components/WelcomeModal';
import { RoomManagerModal } from './components/RoomManagerModal';
import { ProtocolAdvisorModal } from './components/ProtocolAdvisorModal';
import { UserProfileModal } from './components/UserProfileModal';
import {
  Flame,
  Users,
  Trophy,
  Clock,
  Sparkles,
  LogIn,
  LogOut,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<{ displayName: string; avatarEmoji?: string } | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [roomManagerInitialTab, setRoomManagerInitialTab] = useState<'available' | 'join' | 'create'>('available');

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'timer' | 'friends' | 'medals' | 'history'>('timer');

  // Selected Protocol for timer
  const [selectedProtocol, setSelectedProtocol] = useState<FastingProtocol>(FASTING_PROTOCOLS[2]); // Default 16:8

  // Room & Friends data
  const [currentRoom, setCurrentRoom] = useState<FastingRoom | null>(null);
  const [roomMembers, setRoomMembers] = useState<UserProfile[]>([]);
  const [encouragements, setEncouragements] = useState<Encouragement[]>([]);
  const [userFasts, setUserFasts] = useState<FastRecord[]>([]);

  // 1. Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or subscribe to user doc
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubDoc = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              const data = { id: snap.id, ...snap.data() } as UserProfile;
              setProfile(data);
            } else {
              // Create user document if missing
              const initial: UserProfile = {
                id: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Friend',
                email: firebaseUser.email || '',
                avatarEmoji: AVATAR_EMOJIS[0],
                currentStreak: 0,
                longestStreak: 0,
                totalCompletedFasts: 0,
                totalHoursFasted: 0,
                medals: ['first_fast'],
                joinedRooms: [],
                activeRoomId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userRef, initial);
              setProfile(initial);
            }
          },
          (error) => {
            console.warn('User doc listener error:', error);
          }
        );

        setLoadingAuth(false);
        return () => unsubDoc();
      } else {
        setProfile(null);
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to Active Room and Room Members
  useEffect(() => {
    if (!profile?.activeRoomId) {
      setCurrentRoom(null);
      setRoomMembers(profile ? [profile] : []);
      return;
    }

    const roomRef = doc(db, 'rooms', profile.activeRoomId);
    let unsubMembers: (() => void) | null = null;

    const unsubRoom = onSnapshot(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          const rData = { id: snap.id, ...snap.data() } as FastingRoom;
          setCurrentRoom(rData);

          // Clean up previous members listener if room data changed
          if (unsubMembers) {
            unsubMembers();
            unsubMembers = null;
          }

          // Privacy Constraint: Only people in a room can see each other progress
          const isUserConfirmedMember = Boolean(
            profile?.id && rData.members && rData.members.includes(profile.id)
          );

          if (isUserConfirmedMember && rData.members && rData.members.length > 0) {
            const membersQuery = query(
              collection(db, 'users'),
              where('__name__', 'in', rData.members.slice(0, 10)) // Firestore limitation 10 items in 'in' query
            );
            unsubMembers = onSnapshot(
              membersQuery,
              (mSnap) => {
                const list: UserProfile[] = [];
                mSnap.forEach((d) => {
                  list.push({ id: d.id, ...d.data() } as UserProfile);
                });
                setRoomMembers(list);
              },
              (err) => {
                console.warn('Room members listener error:', err);
              }
            );
          } else {
            // Not a confirmed member: keep other members' progress hidden
            setRoomMembers([]);
          }
        } else {
          setCurrentRoom(null);
        }
      },
      (error) => {
        console.warn('Room listener error:', error);
      }
    );

    return () => {
      unsubRoom();
      if (unsubMembers) unsubMembers();
    };
  }, [profile?.activeRoomId]);

  // 3. Listen to Encouragements in active room
  useEffect(() => {
    if (!profile?.activeRoomId) {
      setEncouragements([]);
      return;
    }

    const q = query(
      collection(db, 'encouragements'),
      where('roomId', '==', profile.activeRoomId),
      limit(25)
    );

    const unsubEncouragements = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Encouragement[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Encouragement);
        });
        // Client sort descending by createdAt
        msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEncouragements(msgs);
      },
      (error) => {
        console.warn('Encouragements listener error:', error);
      }
    );

    return () => unsubEncouragements();
  }, [profile?.activeRoomId]);

  // 4. Listen to Current User's Past Fasts
  useEffect(() => {
    if (!profile?.id) {
      setUserFasts([]);
      return;
    }

    const q = query(
      collection(db, 'fasts'),
      where('userId', '==', profile.id),
      where('status', '==', 'completed'),
      limit(20)
    );

    const unsubFasts = onSnapshot(
      q,
      (snapshot) => {
        const list: FastRecord[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as FastRecord);
        });
        list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setUserFasts(list);
      },
      (error) => {
        console.warn('Past fasts listener error:', error);
      }
    );

    return () => unsubFasts();
  }, [profile?.id]);

  // Handler: Start a Fast (with optional custom start time)
  const handleStartFast = async (
    protocolName: string,
    targetHours: number,
    customStartTime?: string
  ) => {
    if (!profile) {
      setIsAuthOpen(true);
      return;
    }

    const startTime = customStartTime
      ? new Date(customStartTime).toISOString()
      : new Date().toISOString();
    const fastDocRef = await addDoc(collection(db, 'fasts'), {
      userId: profile.id,
      userDisplayName: profile.displayName,
      userAvatar: profile.avatarEmoji,
      roomId: profile.activeRoomId || null,
      protocol: protocolName,
      targetHours,
      startTime,
      status: 'active',
    });

    await updateDoc(doc(db, 'users', profile.id), {
      currentFastId: fastDocRef.id,
      activeFastStartedAt: startTime,
      activeFastTargetHours: targetHours,
      protocol: protocolName,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handler: Edit start time of the currently running fast
  const handleUpdateActiveFastStartTime = async (newStartTime: string) => {
    if (!profile) return;
    const startIso = new Date(newStartTime).toISOString();
    await updateDoc(doc(db, 'users', profile.id), {
      activeFastStartedAt: startIso,
      updatedAt: new Date().toISOString(),
    });
    if (profile.currentFastId) {
      await updateDoc(doc(db, 'fasts', profile.currentFastId), {
        startTime: startIso,
      });
    }
  };

  // Handler: End Fast & Calculate Medals / Streaks (with optional custom start and end times)
  const handleEndFast = async (
    notes?: string,
    mood?: string,
    customEndTime?: string,
    customStartTime?: string
  ) => {
    if (!profile || !profile.activeFastStartedAt) return;

    const startIso = customStartTime || profile.activeFastStartedAt;
    const endIso = customEndTime || new Date().toISOString();
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const completedHours = Math.max(0.1, Number(((end - start) / (1000 * 3600)).toFixed(1)));
    const targetHours = profile.activeFastTargetHours || 16;
    const hitTarget = completedHours >= targetHours;

    // Update the active fast doc
    if (profile.currentFastId) {
      await updateDoc(doc(db, 'fasts', profile.currentFastId), {
        startTime: startIso,
        endTime: endIso,
        completedHours,
        status: 'completed',
        notes: notes || '',
        mood: mood || 'Energetic',
      });
    }

    // Check & unlock medals
    const currentMedals = new Set(profile.medals || []);
    const newTotalFasts = (profile.totalCompletedFasts || 0) + 1;
    const newTotalHours = Number(((profile.totalHoursFasted || 0) + completedHours).toFixed(1));
    const newStreak = (profile.currentStreak || 0) + 1;
    const longestStreak = Math.max(newStreak, profile.longestStreak || 0);

    // Medal criteria evaluation
    currentMedals.add('first_fast');
    if (hitTarget) currentMedals.add('first_goal_reached');
    if (newStreak >= 3) currentMedals.add('streak_3');
    if (newStreak >= 7) currentMedals.add('streak_7');
    if (newStreak >= 14) currentMedals.add('streak_14');
    if (newStreak >= 30) currentMedals.add('streak_30');
    if (newTotalHours >= 50) currentMedals.add('hours_50');
    if (newTotalHours >= 100) currentMedals.add('hours_100');
    if (newTotalHours >= 250) currentMedals.add('hours_250');
    if (completedHours >= 20) currentMedals.add('warrior_20');
    if (completedHours >= 24) currentMedals.add('day_hero_24');
    if (profile.activeRoomId) currentMedals.add('team_spirit');

    // Update user profile
    await updateDoc(doc(db, 'users', profile.id), {
      currentFastId: null,
      activeFastStartedAt: null,
      activeFastTargetHours: null,
      totalCompletedFasts: newTotalFasts,
      totalHoursFasted: newTotalHours,
      currentStreak: newStreak,
      longestStreak,
      medals: Array.from(currentMedals),
      updatedAt: new Date().toISOString(),
    });

    // Notify room of completion if in a room
    if (profile.activeRoomId) {
      await addDoc(collection(db, 'encouragements'), {
        roomId: profile.activeRoomId,
        senderId: profile.id,
        senderName: profile.displayName,
        senderAvatar: profile.avatarEmoji,
        type: 'medal_celebration',
        emoji: '🎉',
        message: `completed a ${completedHours}h fast! Goal: ${targetHours}h ${hitTarget ? '🏆 Target reached!' : ''}`,
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Handler: Edit start and end times of any past recorded fast
  const handleUpdatePastFast = async (
    fastId: string,
    updates: {
      startTime: string;
      endTime: string;
      notes?: string;
      mood?: string;
      targetHours?: number;
    }
  ) => {
    if (!profile) return;
    const start = new Date(updates.startTime).getTime();
    const end = new Date(updates.endTime).getTime();
    const completedHours = Math.max(0.1, Number(((end - start) / (1000 * 3600)).toFixed(1)));

    await updateDoc(doc(db, 'fasts', fastId), {
      startTime: new Date(updates.startTime).toISOString(),
      endTime: new Date(updates.endTime).toISOString(),
      completedHours,
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.mood !== undefined ? { mood: updates.mood } : {}),
      ...(updates.targetHours !== undefined ? { targetHours: updates.targetHours } : {}),
    });
  };

  // Handler: Delete a past fast record
  const handleDeletePastFast = async (fastId: string) => {
    if (!profile) return;
    await deleteDoc(doc(db, 'fasts', fastId));
  };

  // Handler: Send Motivation / Cheer
  const handleSendEncouragement = async (
    targetUserId: string,
    targetUserName: string,
    emoji: string,
    message: string
  ) => {
    if (!profile || !profile.activeRoomId) return;

    await addDoc(collection(db, 'encouragements'), {
      roomId: profile.activeRoomId,
      senderId: profile.id,
      senderName: profile.displayName,
      senderAvatar: profile.avatarEmoji,
      targetUserId,
      targetUserName,
      type: 'cheer',
      emoji,
      message,
      createdAt: new Date().toISOString(),
    });

    // Chief Cheerleader medal check
    const currentMedals = new Set(profile.medals || []);
    if (!currentMedals.has('cheerleader')) {
      currentMedals.add('cheerleader');
      await updateDoc(doc(db, 'users', profile.id), {
        medals: Array.from(currentMedals),
      });
    }
  };

  // Handler: Remove member from room (Admin action)
  const handleRemoveMember = async (targetUserId: string) => {
    if (!currentRoom || !profile) return;
    const isAdmin = currentRoom.adminId === profile.id || currentRoom.createdById === profile.id;
    if (!isAdmin) {
      alert('Only the room admin can remove members.');
      return;
    }

    try {
      // Remove target user from room members
      const updatedMembers = currentRoom.members.filter((mId) => mId !== targetUserId);
      await updateDoc(doc(db, 'rooms', currentRoom.id), {
        members: updatedMembers,
      });

      // Remove room from target user's joinedRooms and activeRoomId
      const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
      if (targetUserDoc.exists()) {
        const targetUserData = targetUserDoc.data() as UserProfile;
        const remainingRooms = (targetUserData.joinedRooms || []).filter((rId) => rId !== currentRoom.id);
        const newActive = targetUserData.activeRoomId === currentRoom.id ? (remainingRooms[0] || null) : targetUserData.activeRoomId;
        await updateDoc(doc(db, 'users', targetUserId), {
          joinedRooms: remainingRooms,
          activeRoomId: newActive,
        });
      }

      // Add encouragement announcement
      await addDoc(collection(db, 'encouragements'), {
        roomId: currentRoom.id,
        senderId: profile.id,
        senderName: profile.displayName,
        senderAvatar: profile.avatarEmoji,
        type: 'message',
        emoji: 'ℹ️',
        message: `updated room members.`,
        createdAt: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error('Failed to remove member:', e);
      throw e;
    }
  };

  // Handler: Add member by user email/ID to room (Admin action)
  const handleAddMember = async (identifier: string) => {
    if (!currentRoom || !profile) return;
    const isAdmin = currentRoom.adminId === profile.id || currentRoom.createdById === profile.id;
    if (!isAdmin) {
      alert('Only the room admin can add members.');
      return;
    }

    const cleanInput = identifier.trim().toLowerCase();
    if (!cleanInput) return;

    // Search user by email or ID
    let foundUserId: string | null = null;
    let foundUser: UserProfile | null = null;

    // First try querying by email
    const emailQuery = query(collection(db, 'users'), where('email', '==', cleanInput), limit(1));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      foundUserId = emailSnap.docs[0].id;
      foundUser = { id: foundUserId, ...emailSnap.docs[0].data() } as UserProfile;
    } else {
      // Try direct ID lookup
      const idDoc = await getDoc(doc(db, 'users', cleanInput));
      if (idDoc.exists()) {
        foundUserId = idDoc.id;
        foundUser = { id: foundUserId, ...idDoc.data() } as UserProfile;
      }
    }

    if (!foundUserId || !foundUser) {
      throw new Error(`No user found with email or ID "${identifier}". Make sure your friend has signed in.`);
    }

    if (currentRoom.members.includes(foundUserId)) {
      throw new Error(`${foundUser.displayName} is already in this room!`);
    }

    // Add to room
    await updateDoc(doc(db, 'rooms', currentRoom.id), {
      members: arrayUnion(foundUserId),
    });

    // Add to user's joinedRooms and activeRoomId
    await updateDoc(doc(db, 'users', foundUserId), {
      joinedRooms: arrayUnion(currentRoom.id),
      activeRoomId: currentRoom.id,
    });

    // Post celebration notification in room
    await addDoc(collection(db, 'encouragements'), {
      roomId: currentRoom.id,
      senderId: profile.id,
      senderName: profile.displayName,
      senderAvatar: profile.avatarEmoji,
      type: 'message',
      emoji: '👋',
      message: `welcomed ${foundUser.displayName} to the room!`,
      createdAt: new Date().toISOString(),
    });
  };

  // Handler: Approve pending join request in private room
  const handleApproveJoinRequest = async (request: RoomJoinRequest) => {
    if (!currentRoom || !profile) return;
    const isAdmin = currentRoom.adminId === profile.id || currentRoom.createdById === profile.id;
    if (!isAdmin) {
      alert('Only the room creator/admin can approve join requests.');
      return;
    }

    try {
      const updatedRequests = (currentRoom.pendingRequests || []).filter(
        (r) => r.userId !== request.userId
      );

      // Add to room members and remove from pendingRequests
      await updateDoc(doc(db, 'rooms', currentRoom.id), {
        members: arrayUnion(request.userId),
        pendingRequests: updatedRequests,
      });

      // Update approved user's document
      await updateDoc(doc(db, 'users', request.userId), {
        joinedRooms: arrayUnion(currentRoom.id),
        activeRoomId: currentRoom.id,
      });

      // Post welcome announcement
      await addDoc(collection(db, 'encouragements'), {
        roomId: currentRoom.id,
        senderId: profile.id,
        senderName: profile.displayName,
        senderAvatar: profile.avatarEmoji,
        targetUserId: request.userId,
        targetUserName: request.displayName,
        type: 'message',
        emoji: '🎉',
        message: `approved ${request.displayName}'s request to join the circle!`,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Failed to approve join request:', err);
      throw err;
    }
  };

  // Handler: Decline pending join request in private room
  const handleDeclineJoinRequest = async (targetUserId: string) => {
    if (!currentRoom || !profile) return;
    const isAdmin = currentRoom.adminId === profile.id || currentRoom.createdById === profile.id;
    if (!isAdmin) {
      alert('Only the room creator/admin can decline join requests.');
      return;
    }

    try {
      const updatedRequests = (currentRoom.pendingRequests || []).filter(
        (r) => r.userId !== targetUserId
      );
      await updateDoc(doc(db, 'rooms', currentRoom.id), {
        pendingRequests: updatedRequests,
      });
    } catch (err: any) {
      console.error('Failed to decline join request:', err);
      throw err;
    }
  };

  // Handler: Request to join current room (or join directly if public)
  const handleRequestJoinCurrentRoom = async () => {
    if (!currentRoom || !profile) return;
    if (currentRoom.members && currentRoom.members.includes(profile.id)) return;

    if (currentRoom.type === 'private') {
      const existingReqs = currentRoom.pendingRequests || [];
      if (existingReqs.some((r) => r.userId === profile.id)) {
        alert('Your request is already awaiting creator confirmation.');
        return;
      }
      const newReq: RoomJoinRequest = {
        userId: profile.id,
        displayName: profile.displayName,
        avatarEmoji: profile.avatarEmoji,
        requestedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'rooms', currentRoom.id), {
        pendingRequests: [...existingReqs, newReq],
      });
    } else {
      await updateDoc(doc(db, 'rooms', currentRoom.id), {
        members: arrayUnion(profile.id),
      });
      await updateDoc(doc(db, 'users', profile.id), {
        joinedRooms: arrayUnion(currentRoom.id),
        activeRoomId: currentRoom.id,
      });
    }
  };

  // Handler: Update room picture
  const handleRoomPictureUpdated = (newPic: string) => {
    if (currentRoom) {
      setCurrentRoom({
        ...currentRoom,
        picture: newPic,
      });
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400 font-black text-lg">
                <Flame className="w-5 h-5 fill-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">
                FastingCircle
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Group intermittent fasting
              </span>
            </div>
          </div>

          {/* User Profile / Auth Button */}
          <div className="flex items-center gap-3">
            {profile ? (
              <div className="flex items-center gap-2.5">
                <div
                  onClick={() => setIsRoomManagerOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition text-xs"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">
                    {currentRoom ? currentRoom.name : 'Join a Room'}
                  </span>
                  {currentRoom && (
                    <span className="font-mono text-emerald-400 font-semibold">
                      ({currentRoom.code})
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2.5 bg-slate-800/60 hover:bg-slate-800 pl-2 pr-3 py-1 rounded-2xl border border-slate-700/60 transition group cursor-pointer text-left"
                  title="Edit Profile & Picture"
                >
                  <div className="w-7 h-7 rounded-xl overflow-hidden bg-slate-700 flex items-center justify-center border border-slate-600/60 shrink-0">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base">{profile.avatarEmoji || '🦊'}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block leading-tight group-hover:text-emerald-300 transition">
                      {profile.displayName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block leading-tight">
                      {profile.currentStreak || 0}d streak • {profile.medals?.length || 0} medals
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Join</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-1.5 sm:gap-2">
            {[
              { id: 'timer', label: 'Fasting Timer', icon: Clock },
              {
                id: 'friends',
                label: 'Friends Circle',
                icon: Users,
                badge: roomMembers.filter((m) => m.activeFastStartedAt).length,
              },
              { id: 'medals', label: 'Medals & Goals', icon: Trophy },
              { id: 'history', label: 'History', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-slate-950 text-emerald-400'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsAdvisorOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Protocol Advisor</span>
          </button>
        </div>

        {/* Room Notification banner if user hasn't joined a room yet */}
        {profile && !currentRoom && (
          <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  Fast with your friends in a private room!
                </h4>
                <p className="text-xs text-slate-300">
                  Create a custom circle or enter an invite code to view each other's timers, streaks, and send cheer reactions.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRoomManagerOpen(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs shrink-0 transition flex items-center justify-center gap-1 shadow"
            >
              <span>Create or Join Room</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'timer' && (
          <div className="space-y-6">
            <FastingTimer
              currentUser={profile}
              onStartFast={handleStartFast}
              onEndFast={handleEndFast}
              onUpdateFastStartTime={handleUpdateActiveFastStartTime}
              onOpenAdvisor={() => setIsAdvisorOpen(true)}
              selectedProtocol={selectedProtocol}
              onSelectProtocol={setSelectedProtocol}
            />

            {/* Quick group snapshot widget under timer (visible only to room members) */}
            {currentRoom && profile && currentRoom.members?.includes(profile.id) && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">
                      {currentRoom.name} Live Status
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('friends')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>View Circle</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {roomMembers.map((m) => {
                    const isFasting = Boolean(m.activeFastStartedAt);
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs"
                      >
                        <span className="text-xl">{m.avatarEmoji || '🦊'}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">
                            {m.displayName}
                          </div>
                          <div
                            className={`text-[10px] font-medium ${
                              isFasting ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {isFasting ? '🔥 Fasting' : '💤 Resting'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <FriendsCircle
            currentUser={
              profile || {
                id: 'guest',
                displayName: 'Guest',
                email: '',
                avatarEmoji: '🦊',
                currentStreak: 0,
                longestStreak: 0,
                totalCompletedFasts: 0,
                totalHoursFasted: 0,
                medals: [],
                joinedRooms: [],
                createdAt: '',
                updatedAt: '',
              }
            }
            currentRoom={currentRoom}
            roomMembers={roomMembers}
            encouragements={encouragements}
            onSendEncouragement={handleSendEncouragement}
            onOpenRoomManager={() => {
              setRoomManagerInitialTab('available');
              setIsRoomManagerOpen(true);
            }}
            onOpenCreateRoom={() => {
              setRoomManagerInitialTab('create');
              setIsRoomManagerOpen(true);
            }}
            onRemoveMember={handleRemoveMember}
            onAddMember={handleAddMember}
            onPictureChanged={handleRoomPictureUpdated}
            onApproveJoinRequest={handleApproveJoinRequest}
            onDeclineJoinRequest={handleDeclineJoinRequest}
            onRequestJoinRoom={handleRequestJoinCurrentRoom}
            roomCode={currentRoom?.code}
            roomName={currentRoom?.name}
          />
        )}

        {activeTab === 'medals' && (
          <MedalsShowcase
            currentUser={
              profile || {
                id: 'guest',
                displayName: 'Guest',
                email: '',
                avatarEmoji: '🦊',
                currentStreak: 0,
                longestStreak: 0,
                totalCompletedFasts: 0,
                totalHoursFasted: 0,
                medals: [],
                joinedRooms: [],
                createdAt: '',
                updatedAt: '',
              }
            }
          />
        )}

        {activeTab === 'history' && (
          <FastingHistory
            fasts={userFasts}
            onUpdateFast={handleUpdatePastFast}
            onDeleteFast={handleDeletePastFast}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(info) => {
          if (info?.isNewUser) {
            setWelcomeUser({
              displayName: info.displayName || profile?.displayName || 'Friend',
              avatarEmoji: profile?.avatarEmoji || '🌱',
            });
          }
        }}
      />

      <WelcomeModal
        isOpen={Boolean(welcomeUser)}
        displayName={welcomeUser?.displayName || profile?.displayName || 'Friend'}
        avatarEmoji={welcomeUser?.avatarEmoji || profile?.avatarEmoji || '🌱'}
        onClose={() => setWelcomeUser(null)}
      />

      <ProtocolAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        onSelectProtocol={(p) => {
          setSelectedProtocol(p);
          setActiveTab('timer');
        }}
      />

      {profile && (
        <RoomManagerModal
          isOpen={isRoomManagerOpen}
          onClose={() => setIsRoomManagerOpen(false)}
          currentUser={profile}
          currentRoom={currentRoom}
          initialTab={roomManagerInitialTab}
          onRoomChanged={(r) => {
            setCurrentRoom(r);
          }}
        />
      )}

      {profile && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={profile}
          onProfileUpdated={(updated) => {
            setProfile((prev) => (prev ? { ...prev, ...updated } : null));
          }}
        />
      )}
    </div>
  );
}
