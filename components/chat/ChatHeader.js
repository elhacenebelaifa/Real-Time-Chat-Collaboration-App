import Avatar from '../shared/Avatar';
import Icon from '../shared/Icon';
import { usePopupWindows } from '../../hooks/usePopupWindows';
import styles from '../../styles/Chat.module.css';

export default function ChatHeader({ room, currentUserId }) {
  const { openPopup } = usePopupWindows();
  if (!room) return null;
  const isDM = room.type === 'dm';
  const other = isDM ? (room.members || []).find((m) => m._id !== currentUserId) : null;
  const onlineCount = (room.members || []).filter((m) => m.online).length;

  return (
    <div className={styles.threadHeader}>
      {isDM ? (
        <>
          <Avatar user={other} size={32} showDot />
          <div style={{ minWidth: 0 }}>
            <div className={styles.threadName}>{other?.displayName || other?.username || 'Unknown'}</div>
            <div className={`${styles.threadMeta} ${styles.mono}`}>
              {other?.online ? '● online' : `◌ ${other?.lastSeen || 'offline'}`}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.hashChip}>#</div>
          <div style={{ minWidth: 0 }}>
            <div className={styles.threadName}># {room.name}</div>
            <div className={styles.threadMeta}>
              {(room.members || []).length} members
              {onlineCount ? <> · <span style={{ color: '#16a34a' }}>{onlineCount} online</span></> : null}
              {room.topic ? <> · <span className={styles.mono}>{room.topic}</span></> : null}
            </div>
          </div>
        </>
      )}
      <div style={{ flex: 1 }} />
      <button
        type="button"
        className={styles.headerBtn}
        onClick={() => openPopup(room._id)}
        title="Open in popup"
        aria-label="Open in popup"
      >
        <Icon name="popOut" />
      </button>
    </div>
  );
}
