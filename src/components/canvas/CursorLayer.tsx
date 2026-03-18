import React, { useEffect, useState, useMemo } from 'react';
import { useSocket } from '../../hooks/useSocket.ts';
import throttle from 'lodash/throttle';
import { useAuthStore } from '../../store/authStore.ts';

interface CursorLayerProps {
  boardId: string;
  isOwner: boolean;
}

export default function CursorLayer({ boardId, isOwner }: CursorLayerProps) {
  const socket = useSocket(boardId);
  const { user } = useAuthStore();
  const [cursors, setCursors] = useState<{ [key: string]: { x: number; y: number; userName?: string } }>({});

  const throttledEmitCursor = useMemo(
    () => throttle((cursor: { x: number; y: number }) => {
      const name = isOwner ? user?.name : undefined;
      socket.emit('cursor-move', { boardId, cursor, userId: socket.id, userName: name });
    }, 50),
    [boardId, socket, isOwner, user?.name]
  );

  useEffect(() => {
    socket.on('cursor-move', (data: { userId: string; cursor: { x: number; y: number }; userName?: string }) => {
      // Don't show our own cursor
      if (data.userId === socket.id) return;
      
      setCursors((prev) => ({
        ...prev,
        [data.userId]: { ...data.cursor, userName: data.userName },
      }));
    });

    const handleMouseMove = (e: MouseEvent) => {
      throttledEmitCursor({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      socket.off('cursor-move');
      window.removeEventListener('mousemove', handleMouseMove);
      throttledEmitCursor.cancel();
    };
  }, [socket, boardId, throttledEmitCursor]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {Object.entries(cursors).map(([userId, pos]: [string, any]) => (
        <div
          key={userId}
          className="absolute w-4 h-4 bg-indigo-500 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{ left: pos.x, top: pos.y }}
        >
          <span className="absolute left-6 top-0 text-xs font-bold text-white bg-indigo-500 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
            {pos.userName ? pos.userName : `Guest ${userId.substring(0, 4)}`}
          </span>
        </div>
      ))}
    </div>
  );
}
