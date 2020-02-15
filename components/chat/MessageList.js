import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import DayDivider from './DayDivider';
import { groupByDay } from '../../lib/format';
import styles from '../../styles/Chat.module.css';

export default function MessageList({ messages, currentUserId, onReact, onReply, onPin, onEdit, onDelete }) {
  const scroller = useRef(null);

  useEffect(() => {
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [messages?.length]);

  if (!messages || !messages.length) {
    return (
      <div className={styles.messageArea} ref={scroller}>
        <div className={styles.emptyChat}>No messages yet. Say hello!</div>
      </div>
    );
  }

  const items = groupByDay(messages, 'createdAt', '_id');

  return (
    <div className={styles.messageArea} ref={scroller}>
      {items.map((item) =>
        item.divider ? (
          <DayDivider key={item.key} label={item.divider} />
        ) : (
          <MessageItem
            key={item._id}
            message={item}
            currentUserId={currentUserId}
            onReact={onReact}
            onReply={onReply}
            onPin={onPin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      )}
    </div>
  );
}
