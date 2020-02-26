import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../lib/api';
import NavRail from '../../components/layout/NavRail';
import RoomList from '../../components/rooms/RoomList';
import UserSearch from '../../components/users/UserSearch';
import CreateRoomModal from '../../components/rooms/CreateRoomModal';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ChatHeader from '../../components/chat/ChatHeader';
import PinnedBanner from '../../components/chat/PinnedBanner';
import DetailsPane from '../../components/chat/DetailsPane';
import Icon from '../../components/shared/Icon';
import styles from '../../styles/Chat.module.css';

export default function ChatRoom() {
  const { user, loading, logout } = useAuth();
  const { socket, connected } = useSocket();
  const router = useRouter();
  const { roomId } = router.query;

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const prevRoomRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await api.get('/rooms');
      setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRooms();
  }, [user, fetchRooms]);

  useEffect(() => {
    if (!roomId || !user) return;

    api.get(`/rooms/${roomId}`)
      .then((data) => setActiveRoom(data.room))
      .catch((err) => console.error('Failed to fetch room:', err));

    api.get(`/messages/${roomId}`)
      .then((data) => setMessages(data.messages))
      .catch((err) => console.error('Failed to fetch messages:', err));
  }, [roomId, user]);

  useEffect(() => {
    if (!socket || !roomId) return;

    if (prevRoomRef.current && prevRoomRef.current !== roomId) {
      socket.emit('room:leave', { roomId: prevRoomRef.current });
    }

    socket.emit('room:join', { roomId });
    prevRoomRef.current = roomId;

    const handleMessage = (message) => {
      if (message.roomId === roomId) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
      setRooms((prev) =>
        prev.map((r) =>
          r._id === message.roomId
            ? { ...r, lastMessage: { content: message.content, sender: message.sender._id, timestamp: message.createdAt } }
            : r
        )
      );
    };

    const handleTyping = (data) => {
      if (data.roomId !== roomId) return;
      if (data.userId === user._id) return;

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
    };
  }, [socket, roomId, user]);

  useEffect(() => {
    setTypingUsers([]);
  }, [roomId]);

  const handleCreateRoom = async (name) => {
    const data = await api.post('/rooms', { name });
    setRooms((prev) => [data.room, ...prev]);
  };

  const handleStartDM = async (userId) => {
    const data = await api.post('/rooms/dm', { userId });
    setRooms((prev) => {
      const exists = prev.find((r) => r._id === data.room._id);
      if (exists) return prev;
      return [data.room, ...prev];
    });
    router.push(`/chat/${data.room._id}`);
  };

  const handleSelectRoom = (id) => router.push(`/chat/${id}`);

  const handleSendMessage = (content, type = 'text', fileAttachment = null) => {
    if (!socket || !roomId) return;
    socket.emit('chat:send', {
      roomId,
      content,
      type,
      encrypted: false,
      iv: '',
      fileAttachment,
    });
    socket.emit('typing:stop', { roomId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleReact = (messageId, emoji) => {
    if (!socket) return;
    socket.emit('message:react', { messageId, emoji });
  };

  const handlePin = (messageId) => {
    if (!socket || !roomId) return;
    socket.emit('message:pin', { roomId, messageId });
  };

  const handleEdit = (messageId) => {
    if (!socket) return;
    const current = messages.find((m) => m._id === messageId);
    const next = typeof window !== 'undefined' ? window.prompt('Edit message', current?.content || '') : null;
    if (next == null) return;
    socket.emit('message:edit', { messageId, content: next });
  };

  const handleDelete = (messageId) => {
    if (!socket) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this message?')) return;
    socket.emit('message:delete', { messageId });
  };

  const handleTyping = () => {
    if (!socket || !roomId) return;
    socket.emit('typing:start', { roomId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomId });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading…
      </div>
    );
  }

  const isDM = activeRoom?.type === 'dm';
  const otherUser = isDM ? activeRoom.members.find((m) => m._id !== user._id) : null;
  const roomDisplayName = isDM
    ? (otherUser?.displayName || otherUser?.username || 'Unknown')
    : (activeRoom?.name || 'Chat');

  const composerPlaceholder = activeRoom
    ? `Message ${isDM ? (otherUser?.displayName?.split(' ')[0] || otherUser?.username || '') : `#${activeRoom.name}`}…`
    : 'Message…';

  return (
    <div className={styles.appShell}>
      <Head><title>{roomDisplayName}</title></Head>
      {!connected && <div className={styles.reconnecting}>Reconnecting…</div>}

      <NavRail user={user} onLogout={logout} />

      <div className={styles.convoList}>
        <div className={styles.convoListHeader}>
          <div className={styles.convoListTop}>
            <div className={styles.convoListTitle}>Messages</div>
            <button
              className={styles.iconButton}
              onClick={() => setShowCreateModal(true)}
              title="New group"
              type="button"
            >
              <Icon name="compose" />
            </button>
          </div>
        </div>
        <UserSearch onStartDM={handleStartDM} />
        <RoomList
          rooms={rooms}
          activeRoomId={roomId}
          currentUserId={user._id}
          onSelect={handleSelectRoom}
        />
      </div>

      <div className={styles.mainPane}>
        <ChatHeader room={activeRoom} currentUserId={user._id} />
        {activeRoom?.pinnedMessage && (
          <PinnedBanner
            message={activeRoom.pinnedMessage}
            author={activeRoom.pinnedMessage.sender?.displayName || activeRoom.pinnedMessage.sender?.username}
          />
        )}
        <MessageList
          messages={messages}
          currentUserId={user._id}
          onReact={handleReact}
          onPin={handlePin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <TypingIndicator typingUsers={typingUsers} />
        <MessageInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          roomId={roomId}
          placeholder={composerPlaceholder}
        />
      </div>

      <DetailsPane room={activeRoom} currentUserId={user._id} />

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}
