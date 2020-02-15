import styles from '../../styles/Chat.module.css';

export default function DayDivider({ label }) {
  return (
    <div className={styles.dayDivider}>
      <div className={styles.dayLine} />
      <div className={styles.dayLabel}>{label}</div>
      <div className={styles.dayLine} />
    </div>
  );
}
