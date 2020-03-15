import Avatar from '../shared/Avatar';
import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

export default function PopupHeader({
  room,
  otherUser,
  displayName,
  unread,
  collapsed,
  onToggle,
  onClose,
}) {
  const isDM = room?.type === 'dm';

  const handleHeaderClick = (e) => {
    if (e.target.closest('button')) return;
    onToggle();
  };

  return (
    <div
      className={styles.popupHeader}
      onClick={handleHeaderClick}
      role="button"
      tabIndex={0}
      title={collapsed ? 'Expand' : 'Collapse'}
    >
      {isDM ? (
        <Avatar user={otherUser} size={28} showDot />
      ) : (
        <div className={styles.popupHashChip}>#</div>
      )}
      <div className={styles.popupHeaderName}>{displayName}</div>
      {unread > 0 && collapsed && (
        <span className={styles.popupUnreadDot}>{unread > 9 ? '9+' : unread}</span>
      )}
      <button
        type="button"
        className={styles.popupHeaderBtn}
        onClick={onToggle}
        title={collapsed ? 'Expand' : 'Collapse'}
        aria-label={collapsed ? 'Expand' : 'Collapse'}
      >
        <span style={{ display: 'inline-flex', transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}>
          <Icon name="chevron" size={14} />
        </span>
      </button>
      <button
        type="button"
        className={styles.popupHeaderBtn}
        onClick={onClose}
        title="Close"
        aria-label="Close"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
