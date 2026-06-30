'use client';

/**
 * NotificationBanner — FCM Web Push Registration
 *
 * Prompts user to enable push notifications for deadline interventions.
 * Registers FCM token with the backend on permission grant.
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check, Loader2 } from 'lucide-react';
import { requestNotificationPermissionAndGetToken, listenForForegroundMessages } from '@/lib/fcm';
import { useAuth } from './AuthProvider';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type NotifStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export default function NotificationBanner() {
  const { user, getIdToken } = useAuth();
  const [status, setStatus] = useState<NotifStatus>('idle');
  const [dismissed, setDismissed] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Check existing permission status on mount
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setStatus('unsupported');
      setHidden(true);
      return;
    }

    if (Notification.permission === 'granted') {
      setStatus('granted');
      setHidden(true); // Already granted — no need to show banner
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    // Set up foreground message listener when granted
    if (status === 'granted') {
      let unsubscribe: (() => void) | null = null;
      listenForForegroundMessages((payload) => {
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-crisis flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-text-primary">
                  {payload.notification?.title ?? 'Deadline Alert'}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {payload.notification?.body ?? 'Check your active tasks now'}
                </p>
              </div>
              <button onClick={() => toast.dismiss(t.id)} className="ml-auto">
                <X className="w-4 h-4 text-text-secondary/60" />
              </button>
            </div>
          ),
          {
            duration: 8000,
            style: {
              background: '#690005',
              border: '1px solid #ffb4ab',
              color: '#e5e2e1',
              maxWidth: '400px',
            },
          }
        );
      }).then((unsub) => {
        unsubscribe = unsub;
      });
      return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [status]);

  const handleEnableNotifications = async () => {
    if (!user) return;
    setStatus('requesting');

    try {
      const token = await requestNotificationPermissionAndGetToken();

      if (!token) {
        setStatus('denied');
        toast.error('Notifications blocked. Please enable in browser settings.', {
          style: { background: '#690005', color: '#ffb4ab', border: '1px solid #ffb4ab' },
        });
        return;
      }

      // Register token with backend
      const idToken = await getIdToken();
      if (idToken) {
        await fetch('/api/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token, user_id: user.uid }),
        });
      }

      setStatus('granted');
      setHidden(true);
      toast.success('🔔 Deadline alerts enabled! You\'ll get push notifications when time is critical.', {
        duration: 5000,
        style: { background: '#003827', color: '#44dfab', border: '1px solid #44dfab' },
      });
    } catch (error) {
      console.error('[FCM] Token registration error:', error);
      setStatus('idle');
      toast.error('Failed to enable notifications. Please try again.', {
        style: { background: '#690005', color: '#ffb4ab', border: '1px solid #ffb4ab' },
      });
    }
  };

  // Don't show if already handled, dismissed, or unsupported
  if (hidden || dismissed || status === 'granted' || status === 'unsupported') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border animate-slide-up',
        status === 'denied'
          ? 'bg-crisis-bg/25 border-crisis/30 text-crisis'
          : 'bg-cool/10 border-cool/30 text-cool'
      )}
    >
      {status === 'denied' ? (
        <BellOff className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Bell className="w-4 h-4 flex-shrink-0 animate-float" />
      )}

      <div className="flex-1 min-w-0">
        {status === 'denied' ? (
          <p className="text-sm">
            Notifications blocked. Enable in{' '}
            <span className="font-bold">browser settings → Site Permissions</span> for deadline
            alerts.
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-bold">Enable push alerts</span> to get emergency notifications
            when your deadline is under 2 hours away.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {status !== 'denied' && (
          <button
            id="enable-notifications-btn"
            onClick={handleEnableNotifications}
            disabled={status === 'requesting'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
              'bg-bg-raised text-cool border-cool/40 hover:bg-bg-active hover:border-cool',
              status === 'requesting' && 'opacity-70 cursor-not-allowed'
            )}
          >
            {status === 'requesting' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {status === 'requesting' ? 'Enabling...' : 'Enable'}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-text-secondary/60 hover:text-text-secondary transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

