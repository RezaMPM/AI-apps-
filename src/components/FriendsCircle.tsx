import React, { useState } from 'react';
import { UserProfile, Encouragement, FastingRoom, RoomJoinRequest } from '../types';
import { QUICK_CHEERS } from '../constants';
import { getRoomPictureUrl } from '../roomPictures';
import { RoomPicturePickerModal } from './RoomPicturePickerModal';
import {
  Flame,
  Send,
  Heart,
  MessageCircle,
  Trophy,
  Shield,
  UserPlus,
  UserMinus,
  PlusCircle,
  Crown,
  Settings,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
  Camera,
  Check,
  X,
  Clock,
  Users,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FriendsCircleProps {
  currentUser: UserProfile;
  currentRoom: FastingRoom | null;
  roomMembers: UserProfile[];
  encouragements: Encouragement[];
  onSendEncouragement: (targetUserId: string, targetUserName: string, emoji: string, message: string) => Promise<void>;
  onOpenRoomManager: () => void;
  onOpenCreateRoom?: () => void;
  onRemoveMember?: (userId: string) => Promise<void>;
  onAddMember?: (emailOrId: string) => Promise<void>;
  onPictureChanged?: (newPictureUrl: string) => void;
  onApproveJoinRequest?: (request: RoomJoinRequest) => Promise<void>;
  onDeclineJoinRequest?: (userId: string) => Promise<void>;
  onRequestJoinRoom?: () => Promise<void>;
  roomCode?: string;
  roomName?: string;
}

export const FriendsCircle: React.FC<FriendsCircleProps> = ({
  currentUser,
  currentRoom,
  roomMembers,
  encouragements,
  onSendEncouragement,
  onOpenRoomManager,
  onOpenCreateRoom,
  onRemoveMember,
  onAddMember,
  onPictureChanged,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onRequestJoinRoom,
  roomCode,
  roomName,
}) => {
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🔥');
  const [sending, setSending] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Picture Picker Modal State
  const [showPicturePicker, setShowPicturePicker] = useState<boolean>(false);

  // Admin Controls State
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberInput, setNewMemberInput] = useState<string>('');
  const [adminActionLoading, setAdminActionLoading] = useState<boolean>(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<UserProfile | null>(null);

  // Determine if current user is admin/creator of currentRoom
  const isRoomAdmin = Boolean(
    currentRoom &&
      currentUser &&
      (currentRoom.adminId === currentUser.id || currentRoom.createdById === currentUser.id)
  );

  // Privacy condition: Only people in a room can see each other's progress
  const isUserMember = Boolean(
    currentRoom &&
      currentUser &&
      currentRoom.members &&
      currentRoom.members.includes(currentUser.id)
  );

  const isPrivateRoom = currentRoom?.type === 'private';
  const hasPendingRequest = Boolean(
    currentRoom &&
      currentUser &&
      isPrivateRoom &&
      (currentRoom.pendingRequests || []).some((req) => req.userId === currentUser.id)
  );

  const roomPictureUrl = getRoomPictureUrl(currentRoom?.picture);

  const handleCopyCode = () => {
    const codeToCopy = roomCode || currentRoom?.code || '';
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendQuickCheer = async (targetUser: UserProfile, emoji: string, defaultMsg: string) => {
    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
      });
      await onSendEncouragement(targetUser.id, targetUser.displayName, emoji, defaultMsg);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend) return;
    setSending(true);
    try {
      await onSendEncouragement(
        selectedFriend.id,
        selectedFriend.displayName,
        selectedEmoji,
        customMsg.trim() || 'Keep going strong!'
      );
      setCustomMsg('');
      setSelectedFriend(null);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !onRemoveMember) return;
    setAdminActionLoading(true);
    try {
      await onRemoveMember(memberToRemove.id);
      setMemberToRemove(null);
      setAdminFeedback({ type: 'success', message: `${memberToRemove.displayName} was removed from the room.` });
      setTimeout(() => setAdminFeedback(null), 4000);
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Failed to remove member.' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberInput.trim() || !onAddMember) return;
    setAdminActionLoading(true);
    setAdminFeedback(null);
    try {
      await onAddMember(newMemberInput.trim());
      setNewMemberInput('');
      setShowAddMemberModal(false);
      setAdminFeedback({ type: 'success', message: 'Friend successfully added to room!' });
      setTimeout(() => setAdminFeedback(null), 4000);
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Failed to add friend.' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleApprove = async (req: RoomJoinRequest) => {
    if (!onApproveJoinRequest) return;
    setAdminActionLoading(true);
    try {
      await onApproveJoinRequest(req);
      setAdminFeedback({ type: 'success', message: `Approved ${req.displayName}! They can now see progress and fast together.` });
      setTimeout(() => setAdminFeedback(null), 4500);
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Failed to approve request.' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleDecline = async (userId: string, name: string) => {
    if (!onDeclineJoinRequest) return;
    setAdminActionLoading(true);
    try {
      await onDeclineJoinRequest(userId);
      setAdminFeedback({ type: 'success', message: `Declined join request from ${name}.` });
      setTimeout(() => setAdminFeedback(null), 4000);
    } catch (err: any) {
      setAdminFeedback({ type: 'error', message: err.message || 'Failed to decline request.' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {adminFeedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border transition-all ${
            adminFeedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {adminFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{adminFeedback.message}</span>
          </div>
          <button
            onClick={() => setAdminFeedback(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Room Hero Header with Picture */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 group">
        {/* Room Background Picture */}
        <div className="h-44 sm:h-52 w-full relative overflow-hidden">
          <img
            src={roomPictureUrl}
            alt={roomName || 'Circle Picture'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700 opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-black/30" />
        </div>

        {/* Change Picture Button (Accessible to room members) */}
        {currentRoom && isUserMember && (
          <button
            onClick={() => setShowPicturePicker(true)}
            className="absolute top-4 right-4 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-white/20 backdrop-blur-md transition flex items-center gap-1.5 shadow-lg group/btn"
            title="Pick and change the picture of this room"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:scale-110 transition" />
            <span>Change Room Picture</span>
          </button>
        )}

        {/* Overlay Content */}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow backdrop-blur-md ${
                  isPrivateRoom
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                }`}
              >
                {isPrivateRoom ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                <span>{isPrivateRoom ? 'Private Circle' : 'Public Circle'}</span>
              </span>

              {isRoomAdmin && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>You're Admin</span>
                </span>
              )}

              {isUserMember && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                  Confirmed Member ✓
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {roomName || currentRoom?.name || 'Friend Circle'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 line-clamp-2 drop-shadow">
              {currentRoom?.description || 'Fast together, keep each other accountable, and build healthy habits.'}
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentRoom?.members?.length || roomMembers.length || 1} member{roomMembers.length === 1 ? '' : 's'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span>Code:</span>
                <button
                  onClick={handleCopyCode}
                  className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  title="Click to copy code"
                >
                  <span>{roomCode || currentRoom?.code || 'FAST-DEFAULT'}</span>
                  <Copy className="w-3 h-3 text-slate-400 hover:text-white" />
                </button>
                {copiedCode && <span className="text-[10px] text-emerald-400">Copied!</span>}
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateRoom || onOpenRoomManager}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>

            {isRoomAdmin && (
              <button
                onClick={() => {
                  setShowAddMemberModal(true);
                  setAdminFeedback(null);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl border border-blue-500/30 transition flex items-center gap-1.5 shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            )}

            <button
              onClick={onOpenRoomManager}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 backdrop-blur-md transition flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Available Rooms</span>
            </button>
          </div>
        </div>
      </div>

      {/* Creator/Admin Review: Pending Join Requests Banner for Private Rooms */}
      {isRoomAdmin && currentRoom?.pendingRequests && currentRoom.pendingRequests.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-200">
                  Pending Join Requests ({currentRoom.pendingRequests.length})
                </h4>
                <p className="text-[11px] text-amber-300/70">
                  Because this is a private circle, new members need your creator confirmation before seeing progress.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentRoom.pendingRequests.map((req) => (
              <div
                key={req.userId}
                className="p-3 bg-slate-900/80 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-lg flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden">
                    {req.photoURL ? (
                      <img src={req.photoURL} alt={req.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{req.avatarEmoji || '👤'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white truncate">{req.displayName}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={adminActionLoading}
                    onClick={() => handleApprove(req)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    <span>Approve</span>
                  </button>
                  <button
                    disabled={adminActionLoading}
                    onClick={() => handleDecline(req.userId, req.displayName)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 rounded-xl transition border border-slate-700"
                    title="Decline request"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRIVACY CONSTRAINT: Only people in a room can see each other's progress */}
      {!isUserMember ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              {hasPendingRequest
                ? 'Join Request Pending Confirmation'
                : 'Fasting Progress is Member-Only'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {hasPendingRequest
                ? `Your request to join "${currentRoom?.name || 'this room'}" has been sent to the room creator (${currentRoom?.createdByName || 'Admin'}). Once confirmed, you will be able to see everyone's live timers and progress.`
                : isPrivateRoom
                ? `"${currentRoom?.name || 'This room'}" is a private circle. Only confirmed members can view each other's fasting timers, streaks, and progress.`
                : 'Join this circle to view members\' live timers, progress bars, and send cheers!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {hasPendingRequest ? (
              <span className="px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Awaiting Creator Approval</span>
              </span>
            ) : onRequestJoinRoom ? (
              <button
                onClick={onRequestJoinRoom}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isPrivateRoom ? 'Request Creator Confirmation' : 'Join Room'}</span>
              </button>
            ) : null}

            <button
              onClick={onOpenRoomManager}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
            >
              Browse Available Rooms
            </button>
          </div>
        </div>
      ) : (
        /* Confirmed Member: Full Progress Board */
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-bold text-lg text-white">Live Circle Progress</h3>
                <span className="text-xs text-slate-400 ml-1">
                  ({roomMembers.length} active member{roomMembers.length === 1 ? '' : 's'})
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">
                ● Live synchronized
              </span>
            </div>

            {/* Member cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {roomMembers.map((member) => {
                const isFasting = Boolean(member.activeFastStartedAt);
                const isMe = member.id === currentUser.id;
                const isMemberAdmin =
                  currentRoom &&
                  (currentRoom.adminId === member.id || currentRoom.createdById === member.id);
                let memberElapsedHours = 0;
                let memberProgress = 0;

                if (isFasting && member.activeFastStartedAt) {
                  const start = new Date(member.activeFastStartedAt).getTime();
                  const now = Date.now();
                  memberElapsedHours = Math.max(0, (now - start) / (1000 * 3600));
                  const target = member.activeFastTargetHours || 16;
                  memberProgress = Math.min(100, Math.round((memberElapsedHours / target) * 100));
                }

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isFasting
                        ? 'bg-slate-800/60 border-emerald-500/30'
                        : 'bg-slate-800/30 border-slate-800'
                    } relative`}
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-700/60 overflow-hidden flex items-center justify-center border border-slate-600/50 shrink-0">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{member.avatarEmoji || '🦊'}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                            <span>{member.displayName}</span>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded font-medium">
                                You
                              </span>
                            )}
                            {isMemberAdmin && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-500/30 rounded font-medium flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-400" />
                                <span>Admin</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400 inline" />
                            <span>{member.currentStreak || 0}d streak</span>
                            <span>•</span>
                            <Trophy className="w-3 h-3 text-amber-400 inline" />
                            <span>{member.medals?.length || 0} medals</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isFasting
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isFasting ? 'Fasting' : 'Resting'}
                      </span>
                    </div>

                    {/* Progress bar if fasting */}
                    {isFasting ? (
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span className="font-mono font-medium text-emerald-400">
                            {memberElapsedHours.toFixed(1)}h / {member.activeFastTargetHours || 16}h
                          </span>
                          <span className="font-semibold text-slate-400">{memberProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${memberProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-slate-500 italic">
                        Not currently in a fasting window.
                      </div>
                    )}

                    {/* Bottom Action Bar: Quick Encouragements + Admin Remove Button */}
                    <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between gap-1">
                      {!isMe ? (
                        <>
                          <div className="flex items-center gap-1">
                            {['🔥', '👏', '💪'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleSendQuickCheer(member, emoji, `${emoji} Cheering for you!`)}
                                className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-xs flex items-center justify-center transition active:scale-95"
                                title="Quick Cheer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedFriend(member)}
                              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-950/30 transition"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Cheer Note</span>
                            </button>

                            {/* Admin Remove Button */}
                            {isRoomAdmin && (
                              <button
                                onClick={() => setMemberToRemove(member)}
                                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-2 py-1 rounded-lg transition flex items-center gap-1"
                                title="Remove from room"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center justify-between w-full">
                          <span>Your personal progress in this circle</span>
                          {isRoomAdmin && (
                            <span className="text-amber-400/80 font-medium text-[10px]">Room Creator & Admin</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Encouragements & Motivation Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-base text-white">Circle Motivation Feed</h3>
              </div>
              <span className="text-xs text-slate-400">Team Spirit</span>
            </div>

            {encouragements.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-800/30 rounded-2xl border border-slate-800">
                No cheers sent yet in this circle. Send a quick cheer to motivate your friends!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {encouragements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <div>
                        <span className="font-bold text-white">{item.senderName}</span>
                        <span className="text-slate-400"> cheered </span>
                        <span className="font-semibold text-emerald-400">
                          {item.targetUserName || 'the room'}
                        </span>
                        <div className="text-slate-300 mt-0.5">{item.message}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Picture Picker Modal */}
      {currentRoom && (
        <RoomPicturePickerModal
          isOpen={showPicturePicker}
          onClose={() => setShowPicturePicker(false)}
          room={currentRoom}
          onPictureUpdated={(newPic) => {
            if (onPictureChanged) onPictureChanged(newPic);
          }}
        />
      )}

      {/* Admin: Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">Add User to Room</h4>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Friend's Email or Account ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. friend@gmail.com or UID"
                  value={newMemberInput}
                  onChange={(e) => setNewMemberInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  You can also have friends join instantly by sharing your invite code: <strong className="text-emerald-400 font-mono">{roomCode}</strong>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adminActionLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add to Circle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Confirm Remove Member Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Remove Member</h4>
                <p className="text-xs text-slate-400">Admin Control</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Are you sure you want to remove <strong className="text-white">{memberToRemove.displayName}</strong> from{' '}
              <strong className="text-white">{roomName || 'this room'}</strong>? They will no longer see this room's live timers and progress.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={adminActionLoading}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={adminActionLoading}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {adminActionLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Remove Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cheer Note Modal */}
      {selectedFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-white">
                Cheer on {selectedFriend.displayName}
              </h4>
              <button
                onClick={() => setSelectedFriend(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCustomMessage} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pick a reaction</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHEERS.map((c) => (
                    <button
                      key={c.emoji}
                      type="button"
                      onClick={() => {
                        setSelectedEmoji(c.emoji);
                        setCustomMsg(c.label);
                      }}
                      className={`px-2.5 py-1.5 text-xs rounded-xl border transition ${
                        selectedEmoji === c.emoji
                          ? 'border-emerald-500 bg-emerald-500/20 text-white'
                          : 'border-slate-800 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Custom Message</label>
                <textarea
                  rows={2}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="e.g. You're doing amazing, remember to drink lots of cold water!"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedFriend(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Cheer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
