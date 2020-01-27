import styles from '../../styles/Chat.module.css';

function isImage(mimeType) {
  return mimeType && mimeType.startsWith('image/');
}

export default function FilePreview({ attachment }) {
  if (!attachment) return null;

  if (isImage(attachment.mimeType)) {
    return (
      <div className={styles.messageFile}>
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className={styles.messageImage}
        />
      </div>
    );
  }

  return (
    <div className={styles.messageFile}>
      <a
        href={attachment.url}
        className={styles.messageFileLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        {attachment.fileName}
        {attachment.fileSize && (
          <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '0.3rem' }}>
            ({(attachment.fileSize / 1024).toFixed(1)} KB)
          </span>
        )}
      </a>
    </div>
  );
}
