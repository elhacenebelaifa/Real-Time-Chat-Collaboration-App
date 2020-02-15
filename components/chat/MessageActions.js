import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

export default function MessageActions({ onReact, onReply, onEdit, onDelete, onPin, canEdit }) {
  return (
    <div className={styles.msgActions}>
      {['👍', '❤️', '🎉', '😂'].map((e) => (
        <button key={e} className={styles.msgActionBtn} onClick={() => onReact && onReact(e)} title="React">
          <span style={{ fontSize: 14 }}>{e}</span>
        </button>
      ))}
      <button className={styles.msgActionBtn} onClick={() => onReact && onReact('🔥')} title="Add reaction">
        <Icon name="smile" />
      </button>
      <div className={styles.msgActionDiv} />
      <button className={styles.msgActionBtn} onClick={onReply} title="Reply in thread"><Icon name="thread" /></button>
      <button className={styles.msgActionBtn} onClick={onPin} title="Pin"><Icon name="pin" /></button>
      {canEdit && <button className={styles.msgActionBtn} onClick={onEdit} title="Edit"><Icon name="edit" /></button>}
      {canEdit && <button className={styles.msgActionBtn} onClick={onDelete} title="Delete"><Icon name="trash" /></button>}
      <button className={styles.msgActionBtn} title="More"><Icon name="dots" /></button>
    </div>
  );
}
