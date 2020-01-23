import styles from '../../styles/Chat.module.css';

export default function Header({ title, subtitle, right }) {
  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderInfo}>
        <h3>{title}</h3>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
