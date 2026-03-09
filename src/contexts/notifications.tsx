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
  setUnreadCount: (count: number) => void;
  setNotifications: (notifications: Notification[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const token = getToken();
  
  const { onNewNotification } = useSocket(token || undefined);

  // Create and preload the notification audio once.
  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}notification-sound.mp3`);
    audio.preload = "auto";
    audio.volume = 1;
    audioRef.current = audio;

    if (typeof window !== "undefined" && "AudioContext" in window) {
      audioContextRef.current = new AudioContext();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
    };
  }, []);

  // Unlock audio playback after first user interaction to satisfy autoplay policies.
  useEffect(() => {
    const unlockAudio = async () => {
      const audio = audioRef.current;
      if (!audio) return;

      try {
        await audioContextRef.current?.resume();
        audio.muted = true;
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;

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
    const ctx = audioContextRef.current;

    const playFallbackBeep = async () => {
      if (!ctx) return;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    };

    if (!audio) {
      await playFallbackBeep();
      return;
    }

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn("Notification sound blocked or failed:", error);
      try {
        await playFallbackBeep();
      } catch (beepError) {
        console.warn("Fallback beep failed:", beepError);
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const handleNewNotification = (notification: Notification) => {
      console.log("New notification received:", notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      playNotificationSound(); // Play sound when new notification arrives
    };

    onNewNotification(handleNewNotification);
  }, [token, onNewNotification]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
      playNotificationSound(); // Play sound when adding unread notification
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

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
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
