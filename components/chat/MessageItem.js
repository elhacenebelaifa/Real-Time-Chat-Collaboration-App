import styles from '../../styles/Chat.module.css';
import AuthImage from './AuthImage';

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isImageFile(mimeType) {
  return mimeType && mimeType.startsWith('image/');
}

export default function MessageItem({ message, currentUserId }) {
  const sender = message.sender;
  const initial = (sender?.displayName || sender?.username || '?').charAt(0).toUpperCase();
  const isOwn = sender?._id === currentUserId;

  return (
    <div className={isOwn ? styles.messageGroupOwn : styles.messageGroup}>
      {!isOwn && <div className={styles.messageAvatar}>{initial}</div>}
      <div className={isOwn ? styles.messageContentOwn : styles.messageContentOther}>
        <div className={isOwn ? styles.messageMetaOwn : styles.messageMeta}>
          <span className={styles.messageSender}>
            {sender?.displayName || sender?.username || 'Unknown'}
          </span>
          <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
          {message.encrypted && <span className={styles.encryptedBadge}>encrypted</span>}
        </div>

        {message.type === 'file' && message.fileAttachment ? (
          <div className={styles.messageFile}>
            {isImageFile(message.fileAttachment.mimeType) ? (
              <AuthImage
                src={message.fileAttachment.url}
                alt={message.fileAttachment.fileName}
                className={styles.messageImage}
              />
            ) : (
              <a
                href={message.fileAttachment.url}
                className={styles.messageFileLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {message.fileAttachment.fileName}
              </a>
            )}
            {message.content && <div className={styles.messageText}>{message.content}</div>}
          </div>
        ) : (
          <div className={styles.messageText}>{message.content}</div>
        )}
      </div>
    </div>
  );
}
