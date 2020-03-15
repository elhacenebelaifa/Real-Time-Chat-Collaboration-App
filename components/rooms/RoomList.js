import { useState } from 'react';
import RoomItem from './RoomItem';
import { usePopupWindows } from '../../hooks/usePopupWindows';
import styles from '../../styles/Chat.module.css';

const TABS = [
  ['all', 'All'],
  ['unread', 'Unread'],
  ['groups', 'Groups'],
  ['dms', 'DMs'],
];

export default function RoomList({ rooms, activeRoomId, currentUserId, onSelect }) {
  const [tab, setTab] = useState('all');
  const { openPopup } = usePopupWindows();

  const filtered = (rooms || []).filter((r) => {
    if (tab === 'all') return true;
    if (tab === 'unread') return (r.unreadCount || 0) > 0;
    if (tab === 'groups') return r.type !== 'dm';
    if (tab === 'dms') return r.type === 'dm';
    return true;
  });

  return (
    <div className={styles.convoListInner}>
      <div className={styles.tabRow}>
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`${styles.tabBtn} ${tab === id ? styles.tabBtnActive : ''}`}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.convoScroller}>
        {filtered.length === 0 ? (
          <div className={styles.emptyHint} style={{ padding: '18px 12px', textAlign: 'center' }}>
            No conversations yet. Create a group or start a DM.
          </div>
        ) : (
          filtered.map((room) => (
            <RoomItem
              key={room._id}
              room={room}
              active={room._id === activeRoomId}
              currentUserId={currentUserId}
              onClick={() => onSelect(room._id)}
              onPopOut={openPopup}
            />
          ))
        )}
      </div>
    </div>
  );
}
