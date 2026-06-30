'use client';

/**
 * useTabUrgency — Reactive Tab Title & Favicon Update Hook
 *
 * Scans user's active tasks, finds the most urgent countdown,
 * and dynamically updates document.title and tab favicon.
 */

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { calculateCountdown } from '@/lib/utils';
import type { FirestoreTask } from '@/types/task';

export function useTabUrgency() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);

  // Subscribe to user's active tasks
  useEffect(() => {
    if (!user) {
      // Reset title and favicon on logout
      document.title = 'Last-Minute Life Saver — AI Deadline Emergency Engine';
      updateFavicon('\u26a1');
      return;
    }


    const db = getFirebaseDb();
    const q = query(
      collection(db, 'tasks'),
      where('user_id', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirestoreTask[];
      
      const active = allTasks.filter((t) => t.archived === false);
      setTasks(active);
    }, (err) => {
      console.warn('[useTabUrgency] subscription error:', err);
    });


    return unsubscribe;
  }, [user]);

  // Tick effect to update title & favicon
  useEffect(() => {
    if (tasks.length === 0) {
      document.title = 'Last-Minute Life Saver — AI Deadline Emergency Engine';
      updateFavicon('\u26a1');
      return;
    }

    const tick = () => {
      // Find the most urgent task (smallest time remaining)
      let targetTask: FirestoreTask | null = null;
      let minSeconds = Infinity;

      tasks.forEach((t) => {
        const countdown = calculateCountdown(t.true_deadline);
        if (!countdown.isExpired && countdown.totalSeconds < minSeconds) {
          minSeconds = countdown.totalSeconds;
          targetTask = t;
        }
      });

      if (!targetTask) {
        document.title = 'Last-Minute Life Saver';
        updateFavicon('\ud83d\udfe2');
        return;
      }

      const countdown = calculateCountdown((targetTask as FirestoreTask).true_deadline);
      const hours = String(countdown.hours).padStart(2, '0');
      const minutes = String(countdown.minutes).padStart(2, '0');
      const seconds = String(countdown.seconds).padStart(2, '0');
      
      const timeStr = `${hours}:${minutes}:${seconds}`;
      let alertEmoji = '\ud83d\udfe2';
      if (countdown.urgencyLevel === 'critical') alertEmoji = '\ud83d\udea8';
      else if (countdown.urgencyLevel === 'high') alertEmoji = '\u26a0\ufe0f';
      else if (countdown.urgencyLevel === 'medium') alertEmoji = '\u26a1';

      document.title = `${alertEmoji} ${timeStr} | ${(targetTask as FirestoreTask).task_name}`;
      updateFavicon(alertEmoji);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

}

// Helper to update SVG favicon dynamically using Data URIs
function updateFavicon(emoji: string) {
  if (typeof window === 'undefined') return;
  
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  // Create an SVG text data URL representing the emoji
  const svgString = `<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
  link.href = `data:image/svg+xml,${svgString}`;
}
