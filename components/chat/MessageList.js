import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import styles from '../../styles/Chat.module.css';

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages.length) {
    return (
      <div className={styles.messageArea}>
        <div className={styles.emptyChat}>No messages yet. Say hello!</div>
      </div>
    );
  }

  return (
    <div className={styles.messageArea}>
      {messages.map((msg) => (
        <MessageItem key={msg._id} message={msg} currentUserId={currentUserId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
