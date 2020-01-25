import styles from '../../styles/Chat.module.css';

export default function RoomMembers({ members, onlineUserIds = [] }) {
  if (!members || members.length === 0) return null;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {members.map((member) => {
        const isOnline = onlineUserIds.includes(member._id);
        return (
          <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
            <div className={isOnline ? styles.onlineDot : styles.offlineDot} />
            <span style={{ fontSize: '0.85rem' }}>
              {member.displayName || member.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
