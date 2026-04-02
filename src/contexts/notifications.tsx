import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/use-socket";
import { getToken } from "../lib/api";

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
  addNotification: (notification: Notification) => void;
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
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn("Notification sound blocked or failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const handleNewNotification = (notification: Notification) => {
      console.log("New notification received:", notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      void playNotificationSound(); // Play sound when new notification arrives
    };

    onNewNotification(handleNewNotification);
  }, [token, onNewNotification, playNotificationSound]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
      void playNotificationSound(); // Play sound when adding unread notification
    }
  }, [playNotificationSound]);

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
