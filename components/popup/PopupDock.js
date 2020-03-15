import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { usePopupWindows } from '../../hooks/usePopupWindows';
import PopupWindow from './PopupWindow';
import styles from '../../styles/Chat.module.css';

export default function PopupDock() {
  const { windows } = usePopupWindows();
  const { user } = useAuth();
  const router = useRouter();
  const activeRoomId = router.query?.roomId;

  if (!user || windows.length === 0) return null;

  const visible = windows.filter((w) => w.roomId !== activeRoomId);
  if (visible.length === 0) return null;

  return (
    <div className={styles.popupDock}>
      {visible.map((w) => (
        <PopupWindow key={w.roomId} roomId={w.roomId} collapsed={w.collapsed} />
      ))}
    </div>
  );
}
