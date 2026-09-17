import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, FastingRoom, RoomJoinRequest } from '../types';
import {
  Users,
  Plus,
  KeyRound,
  Check,
  Sparkles,
  Crown,
  Globe,
  Lock,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ImageIcon,
  AlertCircle,
  ArrowRight,
  Shield,
  Smartphone,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { ROOM_PICTURE_PRESETS, getRoomPictureUrl, DEFAULT_ROOM_PICTURE } from '../roomPictures';
import { optimizeImageFromDevice } from '../lib/imageUtils';

interface RoomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  currentRoom: FastingRoom | null;
  onRoomChanged: (room: FastingRoom) => void;
  initialTab?: 'available' | 'join' | 'create';
}

export const RoomManagerModal: React.FC<RoomManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRoom,
  onRoomChanged,
  initialTab = 'available',
}) => {
  const [tab, setTab] = useState<'available' | 'join' | 'create'>(initialTab);
  const [roomCode, setRoomCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newRoomPicture, setNewRoomPicture] = useState<string>(DEFAULT_ROOM_PICTURE);
  const [showPictureSelector, setShowPictureSelector] = useState(false);
  const [isProcessingDeviceImage, setIsProcessingDeviceImage] = useState(false);
  const deviceFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDeviceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessingDeviceImage(true);
    try {
      const optimized = await optimizeImageFromDevice(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.84,
      });
      setNewRoomPicture(optimized);
      setShowPictureSelector(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process image from your device.');
    } finally {
      setIsProcessingDeviceImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Available rooms state
  const [availableRooms, setAvailableRooms] = useState<FastingRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Form submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Real-time listener for Available Rooms
  useEffect(() => {
    if (!isOpen) return;
    setLoadingRooms(true);

    const q = query(collection(db, 'rooms'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rooms: FastingRoom[] = [];
        snapshot.forEach((docSnap) => {
          rooms.push({ id: docSnap.id, ...docSnap.data() } as FastingRoom);
        });
        // Sort: active room first, then by creation date
        rooms.sort((a, b) => {
          if (a.id === currentRoom?.id) return -1;
          if (b.id === currentRoom?.id) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        setAvailableRooms(rooms);
        setLoadingRooms(false);
      },
      (err) => {
        console.warn('Rooms listener error:', err);
        setLoadingRooms(false);
      }
    );

    return () => unsub();
  }, [isOpen, currentRoom?.id]);

  if (!isOpen) return null;

  // Filtered rooms
  const filteredRooms = availableRooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'public' && (r.type === 'public' || !r.type)) ||
      (filterType === 'private' && r.type === 'private');
    return matchesSearch && matchesFilter;
  });

  // Handle Joining a public room directly
  const handleJoinPublicRoom = async (room: FastingRoom) => {
    setLoading(true);
    setError(null);
    try {
      if (!room.members.includes(currentUser.id)) {
        await updateDoc(doc(db, 'rooms', room.id), {
          members: arrayUnion(currentUser.id),
        });
        room.members.push(currentUser.id);
      }

      await updateDoc(doc(db, 'users', currentUser.id), {
        joinedRooms: arrayUnion(room.id),
        activeRoomId: room.id,
      });

      setSuccess(`Joined "${room.name}" successfully!`);
      setTimeout(() => {
        onRoomChanged(room);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to join room.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Requesting to join a private room
  const handleRequestJoinPrivateRoom = async (room: FastingRoom) => {
    setLoading(true);
    setError(null);
    try {
      const existingReqs = room.pendingRequests || [];
      if (existingReqs.some((req) => req.userId === currentUser.id)) {
        setError('You have already submitted a join request for this private room. Waiting for creator approval.');
        setLoading(false);
        return;
      }

      const newRequest: RoomJoinRequest = {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        avatarEmoji: currentUser.avatarEmoji,
        requestedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'rooms', room.id), {
        pendingRequests: [...existingReqs, newRequest],
      });

      setSuccess(`Join request sent to ${room.createdByName || 'creator'}! Once approved, you will have access.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send join request.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to an already joined room
  const handleSwitchRoom = async (room: FastingRoom) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        activeRoomId: room.id,
      });
      onRoomChanged(room);
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Join by Code
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a room code.');
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'rooms'), where('code', '==', cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No room found with this code. Please double check with your friend.');
        setLoading(false);
        return;
      }

      const roomDoc = querySnapshot.docs[0];
      const roomData = { id: roomDoc.id, ...roomDoc.data() } as FastingRoom;

      // Check if user is already a member
      if (roomData.members && roomData.members.includes(currentUser.id)) {
        await handleSwitchRoom(roomData);
        return;
      }

      // If room is PRIVATE, joining requires creator confirmation
      if (roomData.type === 'private') {
        const existingReqs = roomData.pendingRequests || [];
        if (existingReqs.some((req) => req.userId === currentUser.id)) {
          setError(`"${roomData.name}" is a private room. Your join request is already pending creator confirmation.`);
          setLoading(false);
          return;
        }

        const newRequest: RoomJoinRequest = {
          userId: currentUser.id,
          displayName: currentUser.displayName,
          avatarEmoji: currentUser.avatarEmoji,
          requestedAt: new Date().toISOString(),
        };

        await updateDoc(doc(db, 'rooms', roomDoc.id), {
          pendingRequests: [...existingReqs, newRequest],
        });

        setSuccess(`"${roomData.name}" is private. Join request sent to creator for confirmation!`);
        setLoading(false);
        return;
      }

      // If room is PUBLIC, join directly
      await handleJoinPublicRoom(roomData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to join group.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!newRoomName.trim()) {
      setError('Please enter a name for your group circle.');
      setLoading(false);
      return;
    }

    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `FAST-${randomSuffix}`;

      const newRoomRef = doc(collection(db, 'rooms'));
      const newRoomData: FastingRoom = {
        id: newRoomRef.id,
        name: newRoomName.trim(),
        code,
        description: newRoomDesc.trim() || 'A circle of friends fasting together.',
        picture: newRoomPicture,
        type: newRoomType,
        createdById: currentUser.id,
        createdByName: currentUser.displayName,
        adminId: currentUser.id,
        members: [currentUser.id],
        pendingRequests: [],
        createdAt: new Date().toISOString(),
      };

      await setDoc(newRoomRef, newRoomData);

      await updateDoc(doc(db, 'users', currentUser.id), {
        joinedRooms: arrayUnion(newRoomRef.id),
        activeRoomId: newRoomRef.id,
      });

      setSuccess(`Created ${newRoomType === 'private' ? 'Private' : 'Public'} Circle "${newRoomData.name}"!`);
      setTimeout(() => {
        onRoomChanged(newRoomData);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-white">Friend Circles & Rooms</h2>
            <p className="text-xs text-slate-400">
              {currentRoom
                ? `Active Room: ${currentRoom.name} (${currentRoom.type === 'private' ? 'Private 🔒' : 'Public 🌐'})`
                : 'Discover public communities or create private circles'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('available');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'available'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Available Rooms ({availableRooms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Join with Code</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: AVAILABLE ROOMS LIST */}
        {tab === 'available' && (
          <div className="space-y-3.5">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search available rooms by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex bg-slate-800 rounded-xl p-0.5 text-xs">
                {(['all', 'public', 'private'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                      filterType === filter
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Rooms Cards Container */}
            <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
              {loadingRooms ? (
                <div className="text-center py-10 text-slate-400 text-xs flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading available circles...</span>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/30 border border-slate-800 rounded-2xl p-6">
                  <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">No rooms found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try changing your search or create the very first circle!
                  </p>
                  <button
                    onClick={() => setTab('create')}
                    className="mt-3 px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl"
                  >
                    Create a Room
                  </button>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const isMember = room.members?.includes(currentUser.id);
                  const isCurrent = currentRoom?.id === room.id;
                  const isPrivate = room.type === 'private';
                  const hasRequested =
                    isPrivate &&
                    (room.pendingRequests || []).some((req) => req.userId === currentUser.id);
                  const roomPic = getRoomPictureUrl(room.picture);

                  return (
                    <div
                      key={room.id}
                      className={`rounded-2xl border overflow-hidden transition-all ${
                        isCurrent
                          ? 'bg-slate-800/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Room Picture Display */}
                        <div className="relative sm:w-44 h-28 sm:h-auto shrink-0 overflow-hidden bg-slate-950">
                          <img
                            src={roomPic}
                            alt={room.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent to-slate-900/60" />
                          <div className="absolute top-2 left-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow backdrop-blur-md ${
                                isPrivate
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              <span>{isPrivate ? 'Private' : 'Public'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Room Details & Actions */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                  <span>{room.name}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                                      Active
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                                  {room.description || 'Fast together with companions.'}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs font-semibold text-emerald-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 block">
                                  {room.code}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>{room.members?.length || 0} members</span>
                              </span>
                              <span>•</span>
                              <span>Creator: {room.createdByName || 'Fasting Friend'}</span>
                            </div>
                          </div>

                          {/* Action Button depending on membership & privacy */}
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {isPrivate
                                ? '🔒 Member confirmation required'
                                : '🌐 Open to everyone'}
                            </span>

                            {isCurrent ? (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Current Room</span>
                              </span>
                            ) : isMember ? (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleSwitchRoom(room)}
                                className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition"
                              >
                                Switch to this Room
                              </button>
                            ) : isPrivate ? (
                              hasRequested ? (
                                <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                  <span>Pending Approval</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleRequestJoinPrivateRoom(room)}
                                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Request to Join</span>
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleJoinPublicRoom(room)}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow flex items-center gap-1"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>Join Room</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: JOIN WITH CODE */}
        {tab === 'join' && (
          <form onSubmit={handleJoinByCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room Invite Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. FAST-1234"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono uppercase tracking-wider text-white focus:outline-none focus:border-emerald-500 transition"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Enter your friend's invite code. If the room is private, your request will be
                automatically submitted to the creator for confirmation.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Join or Request Entry</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: CREATE NEW ROOM */}
        {tab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            {/* Room Picture Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Room Picture & Theme
              </label>

              {/* Hidden file input for device upload */}
              <input
                ref={deviceFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDeviceImageChange}
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <div className="w-20 h-16 rounded-2xl overflow-hidden border border-slate-700 relative shrink-0 shadow bg-slate-950">
                  <img
                    src={getRoomPictureUrl(newRoomPicture)}
                    alt="Selected room picture"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isProcessingDeviceImage && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isProcessingDeviceImage}
                      onClick={() => deviceFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/40 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{isProcessingDeviceImage ? 'Processing...' : 'Choose from Device'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPictureSelector(!showPictureSelector)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{showPictureSelector ? 'Hide Presets' : 'Curated Presets'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {newRoomPicture.startsWith('data:') ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Custom photo from your device selected
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        Upload your own photo or pick a wellness theme preset.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Presets Grid */}
              {showPictureSelector && (
                <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                    {ROOM_PICTURE_PRESETS.map((preset) => {
                      const isSelected = newRoomPicture === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setNewRoomPicture(preset.url);
                            setShowPictureSelector(false);
                          }}
                          className={`relative h-14 rounded-xl overflow-hidden border transition group ${
                            isSelected
                              ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                            <span className="text-[9px] font-bold text-white leading-none truncate">
                              {preset.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Room Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Metabolic Masters, Dawn Explorers"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Room Privacy Type: Public vs Private */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Room Access Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewRoomType('public')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    newRoomType === 'public'
                      ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public Circle</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Visible in Available Rooms. Anyone can join immediately.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewRoomType('private')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    newRoomType === 'private'
                      ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private Circle</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Joining needs creator confirmation. Fasting progress is member-only.
                  </p>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description & Shared Goal (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Keeping each other accountable for 16:8 daily with morning tea."
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 flex items-start gap-2.5">
              <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Creator Controls</span>
                <p className="text-[11px] text-amber-200/70 mt-0.5">
                  As the creator, you can change the room picture, approve join requests, and manage members.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Circle & Generate Code</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
