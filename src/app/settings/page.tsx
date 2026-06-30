'use client';

/**
 * Settings Page — Notification thresholds and account preferences
 * Persists visual urgency thresholds to localStorage and manages user FCM/account cleanup.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Zap, ArrowLeft, Bell, Clock, Shield, Trash2, LogOut, Check } from 'lucide-react';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  // Settings states
  const [criticalThreshold, setCriticalThreshold] = useState(120); // mins
  const [highThreshold, setHighThreshold] = useState(480); // mins
  const [timezoneOverride, setTimezoneOverride] = useState('browser');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auth Gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('v2s_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.critical_threshold_minutes) setCriticalThreshold(parsed.critical_threshold_minutes);
        if (parsed.high_threshold_minutes) setHighThreshold(parsed.high_threshold_minutes);
        if (parsed.timezone_override) setTimezoneOverride(parsed.timezone_override);
      }
      
      // Check notification status
      if ('Notification' in window) {
        setPushEnabled(Notification.permission === 'granted');
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }, []);

  const handleSave = () => {
    try {
      const settings = {
        critical_threshold_minutes: criticalThreshold,
        high_threshold_minutes: highThreshold,
        timezone_override: timezoneOverride,
      };
      localStorage.setItem('v2s_settings', JSON.stringify(settings));
      setSaved(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error('Failed to save settings.');
    }
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === 'granted');
      if (permission === 'granted') {
        toast.success('Push notifications configured!');
      } else {
        toast.error('Notification permission denied.');
      }
    } catch {
      toast.error('Failed to request notification permission.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      toast.error('Failed to sign out.');
    }
  };

  // Delete all tasks from Firestore for the current user
  const handleDeleteAllData = async () => {
    if (!user) return;
    if (!window.confirm('🚨 WARNING: This will permanently delete all your task data from the server. This action cannot be undone! Are you absolutely sure?')) {
      return;
    }

    const toastId = toast.loading('Deleting data from database...');
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'tasks'), where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      toast.dismiss(toastId);
      toast.success('All task data deleted.');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error('Failed to delete user task data.');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Zap className="w-8 h-8 text-urgency animate-pulse" />
      </div>
    );
  }

  const detectedTimezone = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex flex-col text-text-primary">
      {/* Nav */}
      <nav className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-border-subtle/50 glass">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-xs text-text-secondary/60 hover:text-text-primary transition-colors uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <span className="text-sm font-black text-white">System Settings</span>
      </nav>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-white">Preferences</h1>
          <p className="text-xs text-text-secondary">Customize visual alert thresholds, test push alerts, and manage database exports.</p>
        </div>

        <div className="space-y-6">
          
          {/* Notification Thresholds */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-urgency" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Urgency Alert Thresholds</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-crisis">Critical Alert Level (Pulse & Glow)</span>
                  <span className="font-mono text-text-secondary">{criticalThreshold} minutes ({Math.round(criticalThreshold / 60)}h)</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="360"
                  step="30"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(parseInt(e.target.value))}
                  className="w-full accent-crisis h-1.5 bg-bg-base rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-urgency">High Alert Level (Solid Red/Orange)</span>
                  <span className="font-mono text-text-secondary">{highThreshold} minutes ({Math.round(highThreshold / 60)}h)</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="1440"
                  step="60"
                  value={highThreshold}
                  onChange={(e) => setHighThreshold(parseInt(e.target.value))}
                  className="w-full accent-urgency h-1.5 bg-bg-base rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* FCM token settings */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-mint" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Web Push Notifications</h2>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              We send crisis push reminders directly to your browser when an intervention step is pending and your time limit is ticking away.
            </p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold">Push permission status:</span>
              <span className={`text-xs font-bold ${pushEnabled ? 'text-mint' : 'text-crisis'}`}>
                {pushEnabled ? 'Granted' : 'Blocked / Unconfigured'}
              </span>
            </div>
            {!pushEnabled && (
              <button
                onClick={handleRequestPush}
                className="w-full py-2.5 rounded-xl bg-bg-raised hover:bg-bg-active border border-border-subtle text-xs font-bold text-text-primary transition-colors mt-2"
              >
                Configure & Enable Push
              </button>
            )}
          </div>

          {/* Timezone Override */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cool" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Timezone Settings</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Detected local timezone:</span>
                <span className="font-mono text-text-secondary">{detectedTimezone}</span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={timezoneOverride}
                  onChange={(e) => setTimezoneOverride(e.target.value)}
                  className="bg-bg-base border border-border-subtle text-xs rounded-lg p-2.5 w-full focus:outline-none cursor-pointer font-medium text-text-primary"
                >
                  <option value="browser">Use Browser Detection ({detectedTimezone})</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account Profile and Actions */}
          <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account Operations</h2>
            <div className="flex items-center gap-3 p-3 bg-bg-base/40 rounded-2xl border border-border-subtle/30">
              {user.photoURL && (
                <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-border-subtle" />
              )}
              <div>
                <p className="text-sm font-bold text-white">{user.displayName ?? 'No name set'}</p>
                <p className="text-xs text-text-secondary/70">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-raised hover:bg-bg-active border border-border-subtle text-xs font-bold text-text-primary transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <button
                onClick={handleDeleteAllData}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-crisis-bg/20 hover:bg-crisis-bg/50 border border-crisis/30 text-xs font-bold text-crisis transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Tasks
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-urgency-bg hover:bg-urgency-bg/90 text-urgency border border-urgency font-bold text-sm shadow-glow-urgency transition-all transform active:scale-95"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-mint animate-bounce" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
