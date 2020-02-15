import Avatar from '../shared/Avatar';
import styles from '../../styles/Chat.module.css';

function Dot({ delay }) {
  return (
    <span
      className={styles.typingDot}
      style={{ animation: `aBounce 1.2s ${delay}s infinite ease-in-out` }}
    />
  );
}

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;
  const first = typingUsers[0];
  const label = typingUsers.length === 1
    ? `${first.username} is typing…`
    : `${typingUsers.map((u) => u.username).join(', ')} are typing…`;

  return (
    <div className={styles.typingRow}>
      <Avatar user={{ displayName: first.username }} id={first.userId} size={28} />
      <div className={styles.typingBubble}>
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </div>
      <div className={styles.typingLabel}>{label}</div>
    </div>
  );
}
