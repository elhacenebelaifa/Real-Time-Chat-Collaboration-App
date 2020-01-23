import styles from '../../styles/Chat.module.css';

export default function AppShell({ sidebar, children }) {
  return (
    <div className={styles.appShell}>
      {sidebar}
      <div className={styles.mainPanel}>
        {children}
      </div>
    </div>
  );
}
