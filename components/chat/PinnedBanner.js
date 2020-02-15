import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

export default function PinnedBanner({ message, author, onDismiss }) {
  if (!message) return null;
  const first = String(message.content || '').split('\n')[0];
  return (
    <div className={styles.pinnedBanner}>
      <Icon name="pin" size={12} />
      {author ? <span style={{ fontWeight: 600 }}>{author}:</span> : null}
      <span className={styles.pinnedText}>{first}</span>
      {onDismiss ? (
        <button className={styles.pinnedClose} onClick={onDismiss} title="Unpin">
          <Icon name="x" size={10} />
        </button>
      ) : null}
    </div>
  );
}
