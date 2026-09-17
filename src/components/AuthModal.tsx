import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { AVATAR_EMOJIS } from '../constants';
import {
  Flame,
  Sparkles,
  LogIn,
  UserPlus,
  Smartphone,
  Camera,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Mail,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { optimizeImageFromDevice } from '../lib/imageUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (info: { isNewUser: boolean; displayName: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_EMOJIS[0]);
  const [devicePhoto, setDevicePhoto] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDevicePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessingPhoto(true);
    try {
      const optimized = await optimizeImageFromDevice(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });
      setDevicePhoto(optimized);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process photo from device.');
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      // Ensure user document exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      const isNewUser = !snap.exists();

      if (isNewUser) {
        await setDoc(userDocRef, {
          displayName: user.displayName || user.email?.split('@')[0] || 'Friend',
          email: user.email || '',
          avatarEmoji: selectedAvatar || AVATAR_EMOJIS[0],
          currentStreak: 0,
          longestStreak: 0,
          totalCompletedFasts: 0,
          totalHoursFasted: 0,
          medals: ['first_fast'],
          joinedRooms: [],
          activeRoomId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setGoogleLoading(false);
      onSuccess?.({
        isNewUser,
        displayName: user.displayName || user.email?.split('@')[0] || 'Friend',
      });
      onClose();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      let msg = err.message || 'Google sign-in failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in window was closed. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google sign-in is not enabled for this project yet. Please verify your Firebase Authentication configuration.';
      }
      setError(msg);
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address to receive a password reset link.');
      return;
    }
    setError(null);
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowed(true);
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'Failed to send password reset email.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOperationNotAllowed(false);
    setLoading(true);

    try {
      let resolvedName = '';
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('Please provide a display name so your friends recognize you.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        resolvedName = displayName.trim();

        await updateProfile(user, {
          displayName: resolvedName,
        });

        // Initialize Firestore profile for this user
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          displayName: resolvedName,
          email: user.email,
          avatarEmoji: selectedAvatar,
          photoURL: devicePhoto || null,
          currentStreak: 0,
          longestStreak: 0,
          totalCompletedFasts: 0,
          totalHoursFasted: 0,
          medals: ['first_fast'], // Give a starter welcome potential
          joinedRooms: [],
          activeRoomId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        resolvedName = cred.user.displayName || email.split('@')[0];
        // Ensure user document exists in firestore
        const userDocRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          await setDoc(userDocRef, {
            displayName: resolvedName,
            email: cred.user.email,
            avatarEmoji: selectedAvatar,
            currentStreak: 0,
            longestStreak: 0,
            totalCompletedFasts: 0,
            totalHoursFasted: 0,
            medals: [],
            joinedRooms: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setLoading(false);
      onSuccess?.({ isNewUser: isSignUp, displayName: resolvedName || 'Friend' });
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowed(true);
        msg = 'Email/Password sign-in is not enabled in Firebase Authentication yet.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Try signing in instead!';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify and try again.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white">
            {isSignUp ? 'Join Your Fasting Circle' : 'Welcome Back'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          {isSignUp
            ? 'Create an account to track fasts, join your friends’ room, and earn medals together.'
            : 'Sign in to access your fasting timers, medals, and room activity.'}
        </p>

        {operationNotAllowed && (
          <div className="mb-4 p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 w-full">
                <p className="font-semibold text-white">Enable Email/Password in your Firebase Console</p>
                <p className="text-amber-300/90 text-[11px] leading-relaxed">
                  In Firebase projects, Email/Password authentication must be enabled under Sign-in providers before users can register or log in with email:
                </p>
                <ol className="list-decimal list-inside text-[11px] text-amber-200/90 space-y-1 bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/20">
                  <li>Open the Firebase Authentication console for project <span className="font-mono text-white text-[10px]">{firebaseConfig.projectId}</span></li>
                  <li>Click <span className="font-semibold text-white">Email/Password</span> in the providers list</li>
                  <li>Toggle <span className="font-semibold text-white">Enable</span> to ON and click <span className="font-semibold text-white">Save</span></li>
                </ol>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                  >
                    <span>Open Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setOperationNotAllowed(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && !operationNotAllowed && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 leading-relaxed">
            {error}
          </div>
        )}

        {isForgotPassword ? (
          /* Forgot Password View */
          <form onSubmit={handlePasswordReset} className="space-y-3.5">
            <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
              <p className="text-xs text-slate-300">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {resetEmailSent ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white mb-1">Reset Link Sent!</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Check your inbox at <span className="font-semibold text-emerald-300">{email}</span> for instructions to reset your password.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            )}

            {!resetEmailSent && (
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {resetLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Password Reset Email</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setResetEmailSent(false);
                setError(null);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <>
            {/* Primary 1-Click Sign In: Google */}
            <div className="space-y-3 mb-5">
              <button
                type="button"
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-3 shadow-md active:scale-[0.99] disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  or with email
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Your Name / Nickname
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Profile Photo or Avatar
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDevicePhotoChange}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl mb-2.5">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-emerald-500/40 bg-slate-700 flex items-center justify-center shrink-0">
                        {devicePhoto ? (
                          <img src={devicePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{selectedAvatar}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <button
                          type="button"
                          disabled={isProcessingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/40 transition flex items-center gap-1.5"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>{isProcessingPhoto ? 'Optimizing...' : devicePhoto ? 'Change Photo from Device' : 'Choose Photo from Device'}</span>
                        </button>
                        {devicePhoto && (
                          <button
                            type="button"
                            onClick={() => setDevicePhoto(null)}
                            className="text-[10px] text-slate-400 hover:text-rose-400 mt-1 block"
                          >
                            Remove photo (use emoji instead)
                          </button>
                        )}
                      </div>
                    </div>

                    {!devicePhoto && (
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setSelectedAvatar(emoji)}
                            className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center border transition ${
                              selectedAvatar === emoji
                                ? 'bg-emerald-500/20 border-emerald-500 scale-105'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setOperationNotAllowed(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 transition"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-4 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              {isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError(null);
                      setOperationNotAllowed(false);
                    }}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError(null);
                      setOperationNotAllowed(false);
                    }}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
