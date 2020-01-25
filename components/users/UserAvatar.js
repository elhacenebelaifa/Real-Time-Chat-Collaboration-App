import styles from '../../styles/Chat.module.css';

export default function UserAvatar({ user, size = 34, showStatus = false }) {
  const initial = (user?.displayName || user?.username || '?').charAt(0).toUpperCase();
  const isOnline = user?.status === 'online';

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div
        className={styles.messageAvatar}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </div>
      {showStatus && (
        <div
          className={isOnline ? styles.onlineDot : styles.offlineDot}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            border: '2px solid white',
            width: 10,
            height: 10,
          }}
        />
      )}
    </div>
  );
}
