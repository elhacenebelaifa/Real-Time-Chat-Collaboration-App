import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useRoomChat } from '../../hooks/useRoomChat';
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    activeRoom,
    messages,
    typingUsers,
    send,
    react,
    pin,
    edit,
    deleteMessage,
    startTyping,
  } = useRoomChat(roomId);

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
    if (!socket) return;
    const handleAnyMessage = (message) => {
      if (!message?.roomId) return;
      setRooms((prev) =>
        prev.map((r) =>
          r._id === message.roomId
            ? {
                ...r,
                lastMessage: {
                  content: message.content,
                  sender: typeof message.sender === 'object' ? message.sender?._id : message.sender,
                  timestamp: message.createdAt,
                },
              }
            : r
        )
      );
    };
    socket.on('chat:notify', handleAnyMessage);
    return () => socket.off('chat:notify', handleAnyMessage);
  }, [socket]);

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
          onReact={react}
          onPin={pin}
          onEdit={edit}
          onDelete={deleteMessage}
        />
        <TypingIndicator typingUsers={typingUsers} />
        <MessageInput
          onSend={send}
          onTyping={startTyping}
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
