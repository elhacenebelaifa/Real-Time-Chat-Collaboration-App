import styles from '../../styles/Chat.module.css';

export default function RoomItem({ room, active, currentUserId, onClick }) {
  const isDM = room.type === 'dm';
  const otherUser = isDM
    ? room.members.find((m) => m._id !== currentUserId)
    : null;

  const displayName = isDM
    ? (otherUser?.displayName || otherUser?.username || 'Unknown')
    : room.name;

  const initial = displayName.charAt(0).toUpperCase();

  const preview = room.lastMessage?.content
    ? (room.lastMessage.content.length > 40
        ? room.lastMessage.content.slice(0, 40) + '...'
        : room.lastMessage.content)
    : (isDM ? 'Start a conversation' : 'No messages yet');

  return (
    <div
      className={`${styles.roomItem} ${active ? styles.roomItemActive : ''}`}
      onClick={onClick}
    >
      <div className={styles.roomIcon}>{initial}</div>
      <div className={styles.roomInfo}>
        <div className={styles.roomName}>{displayName}</div>
        <div className={styles.roomPreview}>{preview}</div>
      </div>
    </div>
  );
}
