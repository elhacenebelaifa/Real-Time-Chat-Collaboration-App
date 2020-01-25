import styles from '../../styles/Chat.module.css';

export default function OnlineUsersList({ users, onSelectUser }) {
  if (!users || users.length === 0) return null;

  return (
    <div className={styles.onlineSection}>
      <div className={styles.sectionLabel}>Online - {users.length}</div>
      {users.map((user) => (
        <div
          key={user._id || user.userId}
          className={styles.onlineUser}
          onClick={() => onSelectUser && onSelectUser(user._id || user.userId)}
        >
          <div className={styles.onlineDot} />
          <span>{user.displayName || user.username}</span>
        </div>
      ))}
    </div>
  );
}
