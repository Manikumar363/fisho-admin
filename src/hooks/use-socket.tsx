import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BASE_URL || "";

interface UseSocketReturn {
  sendMessage: (toUserId: string, message: string) => void;
  onNewMessage: (callback: (msg: any) => void) => void;
  onNewNotification: (callback: (notification: any) => void) => void;
  disconnect: () => void;
}

export const useSocket = (token?: string): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    console.log("Attempting socket connection to:", SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current?.id);
      socketRef.current?.emit("join");
      // User is automatically in their notification room now
      console.log("User automatically subscribed to notifications via room join");
    });

    socketRef.current.on("connect_error", (err) => {
      console.warn("Socket connection error (notifications may not work):", err.message);
      // Don't throw error, just log it - app should still work without socket
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const sendMessage = useCallback((toUserId: string, message: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", { toUserId, message });
    } else {
      console.error("Socket not connected yet");
    }
  }, []);

  const onNewMessage = useCallback((callback: (msg: any) => void) => {
    socketRef.current?.on("new_message", callback);
  }, []);

  const onNewNotification = useCallback((callback: (notification: any) => void) => {
    socketRef.current?.on("new_notification", callback);
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return { 
    sendMessage, 
    onNewMessage, 
    onNewNotification,
    disconnect 
  };
};
