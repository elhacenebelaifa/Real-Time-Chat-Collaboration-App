import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRoomChat } from '../../hooks/useRoomChat';
import { usePopupWindows } from '../../hooks/usePopupWindows';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import TypingIndicator from '../chat/TypingIndicator';
import ThreadPanel from '../chat/ThreadPanel';
import PopupHeader from './PopupHeader';
import styles from '../../styles/Chat.module.css';

export default function PopupWindow({ roomId, collapsed }) {
  const { user } = useAuth();
  const { closePopup, toggleCollapsed } = usePopupWindows();
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

  const [unread, setUnread] = useState(0);
  const [openThreadId, setOpenThreadId] = useState(null);
  const lastSeenLenRef = useRef(null);

  const openThreadParent = openThreadId
    ? messages.find((m) => m._id === openThreadId)
    : null;

  useEffect(() => {
    // First time messages populate (initial fetch), establish baseline without counting.
    if (lastSeenLenRef.current === null) {
      if (messages.length > 0) lastSeenLenRef.current = messages.length;
      return;
    }
    if (!collapsed) {
      setUnread(0);
      lastSeenLenRef.current = messages.length;
      return;
    }
    if (messages.length > lastSeenLenRef.current) {
      const newOnes = messages.slice(lastSeenLenRef.current);
      const fromOthers = newOnes.filter((m) => {
        const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
        return senderId !== user?._id;
      }).length;
      if (fromOthers > 0) setUnread((c) => c + fromOthers);
      lastSeenLenRef.current = messages.length;
    }
  }, [messages, collapsed, user]);

  const isDM = activeRoom?.type === 'dm';
  const otherUser = isDM
    ? (activeRoom.members || []).find((m) => m._id !== user?._id)
    : null;
  const displayName = activeRoom
    ? (isDM
      ? (otherUser?.displayName || otherUser?.username || 'Unknown')
      : (activeRoom.name || 'Chat'))
    : 'Loading…';
  const composerPlaceholder = activeRoom
    ? `Message ${isDM ? (otherUser?.displayName?.split(' ')[0] || otherUser?.username || '') : `#${activeRoom.name}`}…`
    : 'Message…';

  return (
    <div className={`${styles.popupWindow} ${collapsed ? styles.popupWindowCollapsed : ''}`}>
      <PopupHeader
        room={activeRoom}
        otherUser={otherUser}
        displayName={displayName}
        unread={unread}
        collapsed={collapsed}
        onToggle={() => toggleCollapsed(roomId)}
        onClose={() => closePopup(roomId)}
      />
      {!collapsed && (
        openThreadParent ? (
          <ThreadPanel
            roomId={roomId}
            parent={openThreadParent}
            currentUserId={user?._id}
            onClose={() => setOpenThreadId(null)}
            embedded
          />
        ) : (
          <div className={styles.popupBody}>
            <MessageList
              messages={messages}
              currentUserId={user?._id}
              onReact={react}
              onReply={setOpenThreadId}
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
        )
      )}
    </div>
  );
}
