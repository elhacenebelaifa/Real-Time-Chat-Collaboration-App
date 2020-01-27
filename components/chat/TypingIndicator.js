import styles from '../../styles/Chat.module.css';

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.username).join(', ');
  const verb = typingUsers.length === 1 ? 'is' : 'are';

  return (
    <div className={styles.typingIndicator}>
      <span>{names} {verb} typing...</span>
    </div>
  );
}
