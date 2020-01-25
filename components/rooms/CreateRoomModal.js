import { useState } from 'react';
import styles from '../../styles/Chat.module.css';

export default function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Create Group Chat</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalField}>
            <label>Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Discussion"
              autoFocus
              maxLength={100}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.modalConfirm} disabled={submitting || !name.trim()}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
