import styles from '../../styles/Chat.module.css';

export default function Sidebar({ children }) {
  return (
    <div className={styles.sidebar}>
      {children}
    </div>
  );
}
