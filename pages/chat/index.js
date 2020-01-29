import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import RoomList from '../../components/rooms/RoomList';
import UserSearch from '../../components/users/UserSearch';
import CreateRoomModal from '../../components/rooms/CreateRoomModal';
import styles from '../../styles/Chat.module.css';

export default function ChatIndex() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  useEffect(() => {
    if (user) fetchRooms();
  }, [user, fetchRooms]);

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
    router.push(`/chat/${roomId}`);
  };

  if (loading || !user) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div className={styles.appShell}>
      <Head>
        <title>Chat - Real-Time Chat</title>
      </Head>

      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Chats</h2>
          <div className={styles.sidebarActions}>
            <button className={styles.iconButton} onClick={() => setShowCreateModal(true)} title="New Group">
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

        <button className={styles.logoutButton} onClick={logout}>
          Sign Out
        </button>
      </div>

      {/* Main Panel */}
      <div className={styles.mainPanel}>
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
