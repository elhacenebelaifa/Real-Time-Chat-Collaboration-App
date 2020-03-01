import { useState } from 'react';
import Avatar from '../shared/Avatar';
import Icon from '../shared/Icon';
import MessageActions from './MessageActions';
import ReactionsRow from './ReactionsRow';
import { fmtTime, renderMessageBody, fmtRelative } from '../../lib/format';
import useAuthImage from '../../hooks/useAuthImage';
import styles from '../../styles/Chat.module.css';

function isImageFile(mimeType) {
  return mimeType && mimeType.startsWith('image/');
}

function AuthImage({ url, alt, className }) {
  const { blobUrl, error } = useAuthImage(url);
  if (error) return <div className={className}>Failed to load image</div>;
  if (!blobUrl) return <div className={className} aria-busy="true" />;
  return <img src={blobUrl} alt={alt} className={className} />;
}

function AuthFileLink({ url, fileName, size, className, iconClassName, nameClassName, sizeClassName }) {
  const { blobUrl } = useAuthImage(url);
  return (
    <a
      href={blobUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className={className}
      onClick={(e) => {
        if (!blobUrl) e.preventDefault();
      }}
    >
      <div className={iconClassName}>
        <Icon name="file" />
      </div>
      <div>
        <div className={nameClassName}>{fileName}</div>
        <div className={sizeClassName}>{size || ''}</div>
      </div>
    </a>
  );
}

export default function MessageItem({ message, currentUserId, onReact, onReply, onPin, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  const sender = message.sender || {};
  const isMe = (sender._id || sender.id) === currentUserId;
  const author = isMe ? 'You' : (sender.displayName || sender.username || 'Unknown');
  const file = message.fileAttachment;

  if (message.deleted) {
    return (
      <div className={styles.msgDeleted}>
        <Icon name="trash" size={11} color="#64748b" />
        &nbsp;Message deleted
      </div>
    );
  }

  return (
    <div
      className={`${styles.msgRow} ${hover ? styles.msgRowHover : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={styles.msgAvatarCol}>
        <Avatar user={sender} size={32} />
      </div>
      <div className={styles.msgBody}>
        <div className={styles.msgMeta}>
          <span className={styles.msgAuthor}>{author}</span>
          <span className={`${styles.msgTime} ${styles.mono}`}>{fmtTime(message.createdAt)}</span>
          {message.edited && <span className={styles.msgEdited}>(edited)</span>}
          {message.encrypted && <span className={styles.encryptedBadge}>encrypted</span>}
          {isMe && message.read && <Icon name="checkDouble" size={12} color="#4f46e5" />}
        </div>

        {message.content && (
          <div className={styles.msgText}>{renderMessageBody(message.content)}</div>
        )}

        {message.type === 'file' && file && (
          <div className={styles.msgAttachment}>
            {isImageFile(file.mimeType) ? (
              <AuthImage url={file.url} alt={file.fileName} className={styles.msgImage} />
            ) : (
              <AuthFileLink
                url={file.url}
                fileName={file.fileName}
                size={file.size}
                className={styles.fileAttachChip}
                iconClassName={styles.fileAttachIcon}
                nameClassName={styles.fileAttachName}
                sizeClassName={styles.fileAttachSize}
              />
            )}
          </div>
        )}

        <ReactionsRow
          reactions={message.reactions}
          currentUserId={currentUserId}
          onToggle={(e) => onReact && onReact(message._id, e)}
        />

        {message.threadCount > 0 && (
          <button
            className={styles.threadCountPill}
            onClick={() => onReply && onReply(message._id)}
            type="button"
          >
            <span>{message.threadCount} replies</span>
            <span className={`${styles.threadLatest} ${styles.mono}`}>
              last {fmtRelative(message.threadLatest)}
            </span>
          </button>
        )}
      </div>

      {hover && (
        <div className={styles.msgActionsWrap}>
          <MessageActions
            onReact={(e) => onReact && onReact(message._id, e)}
            onReply={() => onReply && onReply(message._id)}
            onPin={() => onPin && onPin(message._id)}
            onEdit={() => onEdit && onEdit(message._id)}
            onDelete={() => onDelete && onDelete(message._id)}
            canEdit={isMe}
          />
        </div>
      )}
    </div>
  );
}
