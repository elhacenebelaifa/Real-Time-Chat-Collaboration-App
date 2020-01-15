import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import RoomList from '../../components/rooms/RoomList';
import UserSearch from '../../components/users/UserSearch';
import OnlineUsersList from '../../components/users/OnlineUsersList';
import CreateRoomModal from '../../components/rooms/CreateRoomModal';
import styles from '../../styles/Chat.module.css';

export default function ChatIndex() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await api.get('/rooms');
      setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  }, []);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const data = await api.get('/users/online');
      setOnlineUsers((data.users || []).filter((u) => u._id !== user?._id));
    } catch (err) {
      console.error('Failed to fetch online users:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchOnlineUsers();
    }
  }, [user, fetchRooms, fetchOnlineUsers]);

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

  const handleSelectRoom = (roomId) => {
    setSidebarOpen(false);
    router.push(`/chat/${roomId}`);
  };

  if (loading || !user) {
    return <div className={styles.loadingScreen}>Loading...</div>;
  }

  return (
    <div className={styles.appShell}>
      <Head>
        <title>Chat - Real-Time Chat</title>
      </Head>

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
          activeRoomId={null}
          currentUserId={user._id}
          onSelect={handleSelectRoom}
        />

        <OnlineUsersList users={onlineUsers} onSelectUser={handleStartDM} />

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
            <h3>Chat</h3>
          </div>
        </div>
        <div className={styles.noRoomSelected}>
          <h2>Welcome to Real-Time Chat</h2>
          <p>Select a conversation or start a new one</p>
        </div>
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
