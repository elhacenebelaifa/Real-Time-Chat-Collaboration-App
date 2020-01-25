import RoomItem from './RoomItem';
import styles from '../../styles/Chat.module.css';

export default function RoomList({ rooms, activeRoomId, currentUserId, onSelect }) {
  if (!rooms.length) {
    return (
      <div className={styles.roomList}>
        <div style={{ padding: '1rem', color: '#888', fontSize: '0.85rem', textAlign: 'center' }}>
          No conversations yet. Create a group or start a DM!
        </div>
      </div>
    );
  }

  return (
    <div className={styles.roomList}>
      {rooms.map((room) => (
        <RoomItem
          key={room._id}
          room={room}
          active={room._id === activeRoomId}
          currentUserId={currentUserId}
          onClick={() => onSelect(room._id)}
        />
      ))}
    </div>
  );
}
