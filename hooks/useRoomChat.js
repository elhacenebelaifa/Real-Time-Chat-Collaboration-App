import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import { useMessages } from './useMessages';
import { api } from '../lib/api';

export function useRoomChat(roomId) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { messages, loading, hasMore, loadMore, addMessage, setMessages } = useMessages(roomId);
  const [activeRoom, setActiveRoom] = useState(null);
  const [notificationLevel, setNotificationLevelState] = useState('all');
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!roomId || !user) {
      setActiveRoom(null);
      setNotificationLevelState('all');
      return;
    }
    let cancelled = false;
    api.get(`/rooms/${roomId}`)
      .then((data) => {
        if (cancelled) return;
        setActiveRoom(data.room);
        setNotificationLevelState(data.notificationLevel || 'all');
      })
      .catch((err) => console.error('Failed to fetch room:', err));
    return () => { cancelled = true; };
  }, [roomId, user]);

  useEffect(() => {
    setTypingUsers([]);
  }, [roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('room:join', { roomId });

    const handleMessage = (message) => {
      if (message.roomId === roomId) addMessage(message);
    };

    const handleTyping = (data) => {
      if (data.roomId !== roomId) return;
      if (data.userId === user?._id) return;
      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (prev.find((u) => u.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, username: data.username }];
        }
        return prev.filter((u) => u.userId !== data.userId);
      });
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    };

    const handlePinned = ({ roomId: rid, pinnedMessage }) => {
      if (rid !== roomId) return;
      setActiveRoom((prev) => (prev ? { ...prev, pinnedMessage } : prev));
    };

    const handleEdited = ({ messageId, content, editedAt, mentions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, content, editedAt, mentions, edited: true } : m))
      );
    };

    const handleDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, deleted: true, content: '', fileAttachment: null } : m))
      );
    };

    const handleThreadCount = ({ parentId, threadCount, threadLatest }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === parentId ? { ...m, threadCount, threadLatest } : m))
      );
    };

    socket.on('chat:message', handleMessage);
    socket.on('typing:update', handleTyping);
    socket.on('chat:reaction', handleReaction);
    socket.on('chat:pinned', handlePinned);
    socket.on('chat:edited', handleEdited);
    socket.on('chat:deleted', handleDeleted);
    socket.on('chat:thread-count', handleThreadCount);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('typing:update', handleTyping);
      socket.off('chat:reaction', handleReaction);
      socket.off('chat:pinned', handlePinned);
      socket.off('chat:edited', handleEdited);
      socket.off('chat:deleted', handleDeleted);
      socket.off('chat:thread-count', handleThreadCount);
      socket.emit('room:leave', { roomId });
    };
  }, [socket, roomId, user, addMessage, setMessages]);

  const send = useCallback((content, type = 'text', fileAttachment = null, threadParent = null) => {
    if (!socket || !roomId) return;
    socket.emit('chat:send', {
      roomId,
      content,
      type,
      encrypted: false,
      iv: '',
      fileAttachment,
      threadParent,
    });
    socket.emit('typing:stop', { roomId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, roomId]);

  const react = useCallback((messageId, emoji) => {
    if (!socket) return;
    socket.emit('message:react', { messageId, emoji });
  }, [socket]);

  const pin = useCallback((messageId) => {
    if (!socket || !roomId) return;
    socket.emit('message:pin', { roomId, messageId });
  }, [socket, roomId]);

  const edit = useCallback((messageId) => {
    if (!socket) return;
    const current = messages.find((m) => m._id === messageId);
    const next = typeof window !== 'undefined' ? window.prompt('Edit message', current?.content || '') : null;
    if (next == null) return;
    socket.emit('message:edit', { messageId, content: next });
  }, [socket, messages]);

  const deleteMessage = useCallback((messageId) => {
    if (!socket) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this message?')) return;
    socket.emit('message:delete', { messageId });
  }, [socket]);

  const startTyping = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('typing:start', { roomId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomId });
      typingTimeoutRef.current = null;
    }, 2000);
  }, [socket, roomId]);

  const setNotificationLevel = useCallback(async (level) => {
    if (!roomId) return;
    const prev = notificationLevel;
    setNotificationLevelState(level);
    try {
      await api.put(`/rooms/${roomId}/notifications`, { level });
    } catch (err) {
      console.error('Failed to update notification level:', err);
      setNotificationLevelState(prev);
    }
  }, [roomId, notificationLevel]);

  return {
    activeRoom,
    messages,
    typingUsers,
    loading,
    hasMore,
    loadMore,
    send,
    react,
    pin,
    edit,
    deleteMessage,
    startTyping,
    notificationLevel,
    setNotificationLevel,
  };
}
