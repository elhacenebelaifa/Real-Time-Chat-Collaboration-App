import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../lib/api';
import RoomList from '../../components/rooms/RoomList';
import UserSearch from '../../components/users/UserSearch';
import CreateRoomModal from '../../components/rooms/CreateRoomModal';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const prevRoomRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Fetch rooms
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

  // Fetch active room details and messages
  useEffect(() => {
    if (!roomId || !user) return;

    api.get(`/rooms/${roomId}`)
      .then((data) => setActiveRoom(data.room))
      .catch((err) => console.error('Failed to fetch room:', err));

    api.get(`/messages/${roomId}`)
      .then((data) => setMessages(data.messages))
      .catch((err) => console.error('Failed to fetch messages:', err));
  }, [roomId, user]);

  // Socket.IO: join/leave rooms and listen for messages
  useEffect(() => {
    if (!socket || !roomId) return;

    // Leave previous room
    if (prevRoomRef.current && prevRoomRef.current !== roomId) {
      socket.emit('room:leave', { roomId: prevRoomRef.current });
    }

    // Join new room
    socket.emit('room:join', { roomId });
    prevRoomRef.current = roomId;

    const handleMessage = (message) => {
      if (message.roomId === roomId) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
      // Update room list last message
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

    socket.on('chat:message', handleMessage);
    socket.on('typing:update', handleTyping);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('typing:update', handleTyping);
    };
  }, [socket, roomId, user]);

  // Clear typing users when changing rooms
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

  const handleSelectRoom = (id) => {
    setSidebarOpen(false);
    router.push(`/chat/${id}`);
  };

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

    // Stop typing when sending
    socket.emit('typing:stop', { roomId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleTyping = () => {
    if (!socket || !roomId) return;

    socket.emit('typing:start', { roomId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomId });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  if (loading || !user) {
    return <div className={styles.loadingScreen}>Loading...</div>;
  }

  const isDM = activeRoom?.type === 'dm';
  const otherUser = isDM
    ? activeRoom.members.find((m) => m._id !== user._id)
    : null;
  const roomDisplayName = isDM
    ? (otherUser?.displayName || otherUser?.username || 'Unknown')
    : (activeRoom?.name || 'Chat');

  return (
    <div className={styles.appShell}>
      <Head>
        <title>{roomDisplayName} - Real-Time Chat</title>
      </Head>

      {!connected && <div className={styles.reconnecting}>Reconnecting...</div>}

      {/* Sidebar overlay for mobile */}
      <div
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>Chats</h2>
          <div className={styles.sidebarActions}>
            <button className={styles.iconButton} onClick={() => setShowCreateModal(true)} title="New Group" aria-label="Create new group chat">
              +
            </button>
          </div>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.onlineDot} />
          <strong>{user.displayName || user.username}</strong>
        </div>

        <UserSearch onStartDM={handleStartDM} />

        <div className={styles.sectionLabel}>Conversations</div>
        <RoomList
          rooms={rooms}
          activeRoomId={roomId}
          currentUserId={user._id}
          onSelect={handleSelectRoom}
        />

        <button className={styles.logoutButton} onClick={logout}>
          Sign Out
        </button>
      </div>

      {/* Main Panel */}
      <div className={styles.mainPanel}>
        <div className={styles.chatHeader}>
          <button
            className={styles.hamburgerButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <div className={styles.chatHeaderInfo}>
            <h3>{roomDisplayName}</h3>
            {!isDM && activeRoom && (
              <span>{activeRoom.members.length} members</span>
            )}
          </div>
        </div>

        <MessageList messages={messages} currentUserId={user._id} />

        <div className={styles.typingIndicator}>
          {typingUsers.length > 0 && (
            <span>
              {typingUsers.map((u) => u.username).join(', ')}{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          )}
        </div>

        <MessageInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          roomId={roomId}
        />
      </div>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}
