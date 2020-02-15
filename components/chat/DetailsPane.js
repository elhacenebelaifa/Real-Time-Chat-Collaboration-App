import Avatar from '../shared/Avatar';
import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

function Section({ title, count, children }) {
  return (
    <div className={styles.detailsSection}>
      <div className={styles.detailsSectionTitle}>
        {title}
        {count != null && <span className={styles.detailsSectionCount}>{count}</span>}
      </div>
      {children}
    </div>
  );
}

export default function DetailsPane({ room, currentUserId }) {
  if (!room) {
    return (
      <aside className={styles.detailsPane}>
        <div className={styles.detailsHeader}>
          <div className={`${styles.detailsLabel} ${styles.mono}`}>Details</div>
          <div className={styles.detailsName}>No conversation selected</div>
        </div>
      </aside>
    );
  }

  const isDM = room.type === 'dm';
  const other = isDM ? (room.members || []).find((m) => m._id !== currentUserId) : null;
  const displayName = isDM
    ? (other?.displayName || other?.username || 'Unknown')
    : `# ${room.name || ''}`;

  return (
    <aside className={styles.detailsPane}>
      <div className={styles.detailsHeader}>
        <div className={`${styles.detailsLabel} ${styles.mono}`}>Details</div>
        <div className={styles.detailsName}>{displayName}</div>
        {room.topic && <div className={styles.detailsTopic}>{room.topic}</div>}
      </div>

      <div className={styles.detailsBody}>
        {!isDM && (
          <Section title="Members" count={(room.members || []).length}>
            {(room.members || []).map((u) => (
              <div key={u._id} className={styles.memberRow}>
                <Avatar user={u} size={28} showDot dotColor="#fff" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className={styles.memberName}>{u._id === currentUserId ? 'You' : (u.displayName || u.username)}</div>
                  <div className={`${styles.memberStatus} ${styles.mono}`}>
                    {u.online ? 'active now' : (u.lastSeen || 'offline')}
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        <Section title="Pinned" count={room.pinnedMessage ? 1 : 0}>
          {!room.pinnedMessage ? (
            <div className={styles.emptyHint}>
              Nothing pinned yet. Hover a message → <Icon name="pin" size={11} />
            </div>
          ) : (
            <div className={styles.pinnedItem}>
              <div className={styles.pinnedItemAuthor}>
                {room.pinnedMessage.sender?.displayName || room.pinnedMessage.sender?.username || 'Unknown'}
              </div>
              <div className={styles.pinnedItemBody}>{room.pinnedMessage.content}</div>
            </div>
          )}
        </Section>

        <Section title="Shared files" count={(room.sharedFiles || []).length}>
          {(room.sharedFiles || []).length === 0 ? (
            <div className={styles.emptyHint}>No files shared yet.</div>
          ) : (
            (room.sharedFiles || []).map((f) => (
              <div key={f.name} className={styles.fileRow}>
                <Icon name="file" color="#64748b" />
                <span className={styles.fileName}>{f.name}</span>
                <span className={`${styles.fileDate} ${styles.mono}`}>{f.date || ''}</span>
              </div>
            ))
          )}
        </Section>

        <Section title="Notifications">
          <label className={styles.notifLabel}>
            <input type="checkbox" defaultChecked /> All messages
          </label>
          <label className={styles.notifLabel}>
            <input type="checkbox" /> Only @mentions
          </label>
        </Section>
      </div>
    </aside>
  );
}
