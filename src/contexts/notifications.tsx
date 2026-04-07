import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/use-socket";
import { apiFetch, getToken } from "../lib/api";

export interface Notification {
  _id: string;
  title: string;
  description: string;
  orderId: string | null;
  bulkOrderId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  addNotification: (notification: Notification | any) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const noop = () => undefined;
const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  notifications: [],
  addNotification: noop,
  markAsRead: noop,
  clearAll: noop,
  setUnreadCount: noop as React.Dispatch<React.SetStateAction<number>>,
  setNotifications: noop as React.Dispatch<React.SetStateAction<Notification[]>>,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAudioUnlockedRef = useRef(false);
  const token = getToken();
  
  const { onNewNotification } = useSocket(token || undefined);

  const isValidObjectId = useCallback((value: unknown) => {
    if (typeof value !== 'string') return false;
    return /^[a-fA-F0-9]{24}$/.test(value);
  }, []);

  const isTestNotification = useCallback((raw: any) => {
    const title = String(raw?.title || '').toLowerCase();
    const description = String(raw?.description || '').toLowerCase();
    return title.includes('test notification') || description.includes('test notification sound trigger');
  }, []);

  const normalizeNotificationPayload = useCallback((payload: any): Notification | null => {
    const raw = payload?.notification || payload?.data || payload;
    if (!raw) return null;
    if (isTestNotification(raw)) return null;

    const rawId = raw._id || raw.id || raw.notificationId;
    if (!rawId || !isValidObjectId(String(rawId))) {
      return null;
    }

    return {
      _id: String(rawId),
      title: raw.title || 'Notification',
      description: raw.description || '',
      orderId: raw.orderId || null,
      bulkOrderId: raw.bulkOrderId || null,
      isRead: raw.isRead === true,
      readAt: raw.readAt || null,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }, [isTestNotification, isValidObjectId]);

  const syncNotificationsFromServer = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiFetch<{
        success: boolean;
        notifications?: any[];
        message?: string;
      }>('/api/admin/notification/get-all');

      if (!response.success || !response.notifications) return;

      const normalized = response.notifications
        .map((item) => normalizeNotificationPayload(item))
        .filter((item): item is Notification => !!item);

      setNotifications(normalized);
      setUnreadCount(normalized.filter((item) => !item.isRead).length);
    } catch (error) {
      console.warn('Failed to sync notifications after realtime event:', error);
    }
  }, [token, normalizeNotificationPayload]);

  // Create and preload the notification audio once.
  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sound.mp3`);
    
    audio.preload = "auto";
    audio.volume = 1;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      isAudioUnlockedRef.current = false;
    };
  }, []);

  // Unlock audio playback after first user interaction to satisfy autoplay policies.
  useEffect(() => {
    const unlockAudio = async () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isAudioUnlockedRef.current) return;

      try {
        audio.muted = true;
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        isAudioUnlockedRef.current = true;

        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      } catch {
        audio.muted = false;
      }
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const playNotificationSound = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !isAudioUnlockedRef.current) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn("Notification sound blocked or failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const handleNewNotification = (payload: any) => {
      const notification = normalizeNotificationPayload(payload);
      if (!notification) {
        void playNotificationSound();
        void syncNotificationsFromServer();
        return;
      }

      setNotifications((prev) => {
        const existing = prev.find((n) => n._id === notification._id);
        if (existing) {
          return prev.map((n) => (n._id === notification._id ? { ...n, ...notification } : n));
        }

        if (!notification.isRead) {
          setUnreadCount((count) => count + 1);
        }
        void playNotificationSound();

        return [notification, ...prev];
      });

      if (notification.title === 'Notification' || !notification.description) {
        void syncNotificationsFromServer();
      }
    };

    const unsubscribe = onNewNotification(handleNewNotification);
    return () => {
      unsubscribe();
    };
  }, [token, onNewNotification, playNotificationSound, normalizeNotificationPayload, syncNotificationsFromServer]);

  const addNotification = useCallback((payload: Notification | any) => {
    const notification = normalizeNotificationPayload(payload);
    if (!notification) {
      void playNotificationSound();
      void syncNotificationsFromServer();
      return;
    }

    setNotifications((prev) => {
      const existing = prev.find((n) => n._id === notification._id);
      if (existing) {
        return prev.map((n) => (n._id === notification._id ? { ...n, ...notification } : n));
      }

      if (!notification.isRead) {
        setUnreadCount((count) => count + 1);
      }
      void playNotificationSound();

      return [notification, ...prev];
    });

    if (notification.title === 'Notification' || !notification.description) {
      void syncNotificationsFromServer();
    }
  }, [playNotificationSound, normalizeNotificationPayload, syncNotificationsFromServer]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        addNotification,
        markAsRead,
        clearAll,
        setUnreadCount,
        setNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  // Avoid crashing the app on transient provider-mount timing issues.
  if (!context) {
    console.warn("useNotifications is being used outside NotificationProvider");
  }
  return context;
};
