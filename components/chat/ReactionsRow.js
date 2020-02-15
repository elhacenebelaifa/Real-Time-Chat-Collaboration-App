import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

export default function ReactionsRow({ reactions, currentUserId, onToggle }) {
  const entries = Object.entries(reactions || {}).filter(([, v]) => (v || []).length);
  if (!entries.length) return null;
  return (
    <div className={styles.reactionsRow}>
      {entries.map(([emoji, users]) => {
        const mine = (users || []).some((u) => (u._id || u) === currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => onToggle && onToggle(emoji)}
            className={`${styles.reactionPill} ${mine ? styles.reactionPillMine : ''}`}
          >
            <span style={{ fontSize: 12 }}>{emoji}</span>
            <span>{users.length}</span>
          </button>
        );
      })}
      <button
        onClick={() => onToggle && onToggle('🔥')}
        className={styles.reactionAdd}
        title="Add reaction"
      >
        <Icon name="smile" size={12} />
      </button>
    </div>
  );
}
