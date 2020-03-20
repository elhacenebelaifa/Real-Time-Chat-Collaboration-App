import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { api } from '../lib/api';

export function useThread(roomId, parentId) {
  const { socket } = useSocket();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !parentId) {
      setReplies([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.get(`/messages/${roomId}/thread/${parentId}`)
      .then((data) => { if (!cancelled) setReplies(data.messages || []); })
      .catch((err) => console.error('Failed to load thread:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [roomId, parentId]);

  useEffect(() => {
    if (!socket || !roomId || !parentId) return;

    const handleReply = (message) => {
      if (message.roomId !== roomId) return;
      const replyParent = typeof message.threadParent === 'object'
        ? message.threadParent?._id
        : message.threadParent;
      if (replyParent !== parentId) return;
      setReplies((prev) => (prev.find((m) => m._id === message._id) ? prev : [...prev, message]));
    };

    const handleReaction = ({ messageId, reactions }) => {
      setReplies((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    };

    const handleEdited = ({ messageId, content, editedAt, mentions }) => {
      setReplies((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, content, editedAt, mentions, edited: true } : m))
      );
    };

    const handleDeleted = ({ messageId }) => {
      setReplies((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, deleted: true, content: '', fileAttachment: null } : m))
      );
    };

    socket.on('chat:thread-message', handleReply);
    socket.on('chat:reaction', handleReaction);
    socket.on('chat:edited', handleEdited);
    socket.on('chat:deleted', handleDeleted);

    return () => {
      socket.off('chat:thread-message', handleReply);
      socket.off('chat:reaction', handleReaction);
      socket.off('chat:edited', handleEdited);
      socket.off('chat:deleted', handleDeleted);
    };
  }, [socket, roomId, parentId]);

  const sendReply = useCallback((content, type = 'text', fileAttachment = null) => {
    if (!socket || !roomId || !parentId) return;
    socket.emit('chat:send', {
      roomId,
      content,
      type,
      encrypted: false,
      iv: '',
      fileAttachment,
      threadParent: parentId,
    });
  }, [socket, roomId, parentId]);

  const react = useCallback((messageId, emoji) => {
    if (!socket) return;
    socket.emit('message:react', { messageId, emoji });
  }, [socket]);

  return { replies, loading, sendReply, react };
}
