import styles from '../../styles/Auth.module.css';

export default function Button({ children, onClick, disabled, type = 'button', variant = 'primary' }) {
  const className = variant === 'primary' ? styles.button : styles.modalCancel;
  return (
    <button className={className} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
}
