import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { usePopupWindows } from '../../hooks/usePopupWindows';

const MAX_WINDOWS = 4;

export default function PopupAutoOpener() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const { windows, openPopup, isOpen } = usePopupWindows();

  useEffect(() => {
    if (!socket || !user) return;
    const handle = (message) => {
      if (!message?.roomId) return;
      const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
      if (senderId === user._id) return;
      if (router.query?.roomId === message.roomId) return;
      if (isOpen(message.roomId)) return;
      if (windows.length >= MAX_WINDOWS) return;
      openPopup(message.roomId);
    };
    socket.on('chat:notify', handle);
    return () => socket.off('chat:notify', handle);
  }, [socket, user, router.query?.roomId, openPopup, isOpen, windows.length]);

  return null;
}
