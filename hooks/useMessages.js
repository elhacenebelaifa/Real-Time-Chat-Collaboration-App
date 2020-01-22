import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useMessages(roomId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch initial messages
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    api.get(`/messages/${roomId}?limit=50`)
      .then((data) => {
        setMessages(data.messages);
        setHasMore(data.messages.length >= 50);
      })
      .catch((err) => console.error('Failed to fetch messages:', err))
      .finally(() => setLoading(false));
  }, [roomId]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (!roomId || !hasMore || loading || messages.length === 0) return;

    const oldest = messages[0];
    setLoading(true);
    try {
      const data = await api.get(`/messages/${roomId}?before=${oldest.createdAt}&limit=50`);
      if (data.messages.length < 50) setHasMore(false);
      setMessages((prev) => [...data.messages, ...prev]);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId, hasMore, loading, messages]);

  // Add a new message (from socket)
  const addMessage = useCallback((message) => {
    setMessages((prev) => {
      if (prev.find((m) => m._id === message._id)) return prev;
      return [...prev, message];
    });
  }, []);

  return { messages, loading, hasMore, loadMore, addMessage, setMessages };
}
