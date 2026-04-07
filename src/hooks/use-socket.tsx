import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BASE_URL || "";

interface UseSocketReturn {
  sendMessage: (toUserId: string, message: string) => void;
  onNewMessage: (callback: (msg: any) => void) => void;
  onNewNotification: (callback: (notification: any) => void) => () => void;
  disconnect: () => void;
}

export const useSocket = (token?: string): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const notificationListenersRef = useRef<Set<(notification: any) => void>>(new Set());

  const notificationEvents = ["new_notification", "new_admin_notification", "new_store_notification"];

  const bindNotificationListener = useCallback((socket: Socket, callback: (notification: any) => void) => {
    notificationEvents.forEach((eventName) => socket.on(eventName, callback));
  }, []);

  const unbindNotificationListener = useCallback((socket: Socket, callback: (notification: any) => void) => {
    notificationEvents.forEach((eventName) => socket.off(eventName, callback));
  }, []);

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

      if (socketRef.current) {
        notificationListenersRef.current.forEach((listener) => {
          bindNotificationListener(socketRef.current as Socket, listener);
        });
      }
    });

    socketRef.current.on("connect_error", (err) => {
      console.warn("Socket connection error (notifications may not work):", err.message);
      // Don't throw error, just log it - app should still work without socket
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      if (socketRef.current) {
        notificationListenersRef.current.forEach((listener) => {
          unbindNotificationListener(socketRef.current as Socket, listener);
        });
      }
      socketRef.current?.disconnect();
    };
  }, [token, bindNotificationListener, unbindNotificationListener]);

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
    notificationListenersRef.current.add(callback);

    const socket = socketRef.current;
    if (socket) {
      bindNotificationListener(socket, callback);
    }

    return () => {
      notificationListenersRef.current.delete(callback);
      if (socketRef.current) {
        unbindNotificationListener(socketRef.current, callback);
      }
    };
  }, [bindNotificationListener, unbindNotificationListener]);

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
