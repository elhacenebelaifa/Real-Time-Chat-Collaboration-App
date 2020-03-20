import { useEffect, useRef } from 'react';
import { useThread } from '../../hooks/useThread';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

export default function ThreadPanel({ roomId, parent, currentUserId, onClose, embedded = false }) {
  const { replies, loading, sendReply, react } = useThread(roomId, parent?._id);
  const scroller = useRef(null);

  useEffect(() => {
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [replies.length]);

  if (!parent) return null;

  const replyLabel = `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`;
  const wrapperClass = embedded
    ? `${styles.popupBody} ${styles.threadPaneEmbedded}`
    : styles.threadPane;

  return (
    <aside className={wrapperClass}>
      <div className={styles.threadHeader}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          title={embedded ? 'Back' : 'Close thread'}
        >
          <Icon name={embedded ? 'chevron' : 'x'} size={14} />
        </button>
        <div className={styles.threadHeaderTitle}>
          <div className={`${styles.detailsLabel} ${styles.mono}`}>Thread</div>
          <div className={styles.threadHeaderCount}>{replyLabel}</div>
        </div>
      </div>

      <div className={styles.threadBody} ref={scroller}>
        <MessageItem
          message={parent}
          currentUserId={currentUserId}
          onReact={react}
        />
        <div className={styles.threadDivider}>
          <span className={styles.mono}>{replyLabel}</span>
        </div>
        {loading && replies.length === 0 ? (
          <div className={styles.emptyHint}>Loading replies…</div>
        ) : (
          replies.map((m) => (
            <MessageItem
              key={m._id}
              message={m}
              currentUserId={currentUserId}
              onReact={react}
            />
          ))
        )}
      </div>

      <MessageInput
        onSend={sendReply}
        roomId={roomId}
        placeholder="Reply in thread…"
      />
    </aside>
  );
}
