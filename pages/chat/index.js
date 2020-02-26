import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import NavRail from '../../components/layout/NavRail';
import RoomList from '../../components/rooms/RoomList';
import UserSearch from '../../components/users/UserSearch';
import CreateRoomModal from '../../components/rooms/CreateRoomModal';
import Icon from '../../components/shared/Icon';
import DetailsPane from '../../components/chat/DetailsPane';
import styles from '../../styles/Chat.module.css';

export default function ChatIndex() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleSelectRoom = (roomId) => router.push(`/chat/${roomId}`);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading…
      </div>
    );
  }

  return (
    <div className={styles.appShell}>
      <Head><title>Chat</title></Head>

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
          activeRoomId={null}
          currentUserId={user._id}
          onSelect={handleSelectRoom}
        />
      </div>

      <div className={styles.mainPane}>
        <div className={styles.noRoomSelected}>
          <h2>Welcome</h2>
          <p>Select a conversation from the left, or start a new one.</p>
        </div>
      </div>

      <DetailsPane room={null} currentUserId={user._id} />

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}
