"use client";

import { useState, useEffect, useCallback } from "react";
import { CivicNotification, INITIAL_NOTIFICATIONS, mockWebSocket } from "@/lib/websocket-mock";

export function useNotifications() {
  const [notifications, setNotifications] = useState<CivicNotification[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bhoomi_notifications");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [hasNewIncoming, setHasNewIncoming] = useState<boolean>(false);

  // Sync to local storage
  const persistNotifications = (items: CivicNotification[]) => {
    setNotifications(items);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("bhoomi_notifications", JSON.stringify(items));
      } catch {}
    }
  };

  useEffect(() => {
    const unsubConn = mockWebSocket.subscribeConnection((connected) => {
      setIsConnected(connected);
    });

    const unsubMsg = mockWebSocket.subscribe((incoming) => {
      setNotifications((prev) => {
        const next = [incoming, ...prev];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("bhoomi_notifications", JSON.stringify(next));
          } catch {}
        }
        return next;
      });
      setHasNewIncoming(true);
      setTimeout(() => setHasNewIncoming(false), 3000);
    });

    return () => {
      unsubConn();
      unsubMsg();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("bhoomi_notifications", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("bhoomi_notifications", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    persistNotifications([]);
  }, []);

  const simulatePush = useCallback(() => {
    mockWebSocket.simulateIncomingPush();
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    hasNewIncoming,
    markAsRead,
    markAllAsRead,
    clearAll,
    simulatePush,
  };
}
