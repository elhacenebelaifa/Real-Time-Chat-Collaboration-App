import Avatar from '../shared/Avatar';
import { fmtRelative } from '../../lib/format';
import styles from '../../styles/Chat.module.css';

export default function RoomItem({ room, active, currentUserId, onClick }) {
  const isDM = room.type === 'dm';
  const otherUser = isDM ? (room.members || []).find((m) => m._id !== currentUserId) : null;
  const displayName = isDM
    ? (otherUser?.displayName || otherUser?.username || 'Unknown')
    : room.name;

  const last = room.lastMessage;
  const preview = last?.content
    ? last.content
    : (isDM ? 'Start a conversation' : 'No messages yet');

  const senderName = last?.senderName;
  const unread = room.unreadCount || 0;

  return (
    <button
      className={`${styles.convoRow} ${active ? styles.convoRowActive : ''}`}
      onClick={onClick}
      type="button"
    >
      {active && <div className={styles.convoActiveBar} />}
      {isDM ? (
        <Avatar user={otherUser} size={34} showDot dotColor={active ? '#eef2ff' : '#fff'} />
      ) : (
        <div className={styles.hashChipSm}>#</div>
      )}
      <div className={styles.convoMain}>
        <div className={styles.convoTop}>
          <div className={`${styles.convoName} ${unread ? styles.convoNameUnread : ''}`}>
            {displayName}
          </div>
          <div className={`${styles.convoTime} ${styles.mono}`}>
            {last ? fmtRelative(last.timestamp || last.createdAt) : ''}
          </div>
        </div>
        <div className={`${styles.convoBottom} ${unread ? styles.convoBottomUnread : ''}`}>
          <div className={styles.convoPreview}>
            {senderName && !isDM && (
              <span className={styles.convoPreviewSender}>{senderName}: </span>
            )}
            {preview}
          </div>
          {unread > 0 && <span className={styles.unreadPill}>{unread}</span>}
        </div>
      </div>
    </button>
  );
}
