'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useUserSocket = (
  userId: string | undefined,
  handlers: Partial<Record<string, (payload: unknown) => void>>
) => {
  useEffect(() => {
    if (!userId) return;

    if (!socket) {
      socket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        query: { userId },
        reconnectionAttempts: 3,
        timeout: 5000,
      });
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      if (handler) socket?.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        if (handler) socket?.off(event, handler);
      });
    };
  }, [userId, handlers]);
};
