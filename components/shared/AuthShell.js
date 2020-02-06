import { AVATAR_TONES } from '../../lib/format';
import styles from '../../styles/Auth.module.css';

function Bubble({ name, body, ts, tone = 'indigo', reacts = [], mine }) {
  const t = AVATAR_TONES[tone] || AVATAR_TONES.indigo;
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>
      {!mine && (
        <div className={styles.bubbleAvatar} style={{ background: t.bg, color: t.fg }}>
          {initials}
        </div>
      )}
      <div className={styles.bubbleBody}>
        <div className={styles.bubbleTop}>
          <span className={styles.bubbleName}>{name}</span>
          <span className={`${styles.bubbleTs} ${styles.mono}`}>{ts}</span>
        </div>
        <div className={styles.bubbleText}>{body}</div>
        {reacts.length > 0 && (
          <div className={styles.reactRow}>
            {reacts.map((r) => (
              <span key={r} className={styles.reactPill}>{r} 2</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthShell({ children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.brandPanel}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>R</div>
          <div className={styles.brandName}>Chat</div>
        </div>

        <div className={styles.brandMiddle}>
          <div className={styles.brandContent}>
            <div className={`${styles.kicker} ${styles.mono}`}>● team messaging</div>
            <h1 className={styles.headline}>
              Small talk,<br />
              <span className={styles.headlineAccent}>big shipping.</span>
            </h1>
            <p className={styles.lede}>
              Threaded rooms, 1:1 DMs, reactions and pinned decisions.
              Keyboard-fast. E2E encrypted. Made for teams who hate meetings.
            </p>

            <div className={styles.bubbles}>
              <Bubble name="Mira Okafor" tone="rose" body="Pushed v3 mocks — feedback welcome before crit." ts="2:14 PM" />
              <Bubble name="Dani Reyes" tone="amber" body="Pinning the crit rubric 📌" ts="2:18 PM" reacts={['📌', '🔥']} />
              <Bubble name="You" mine body="Coming at this fresh — density variant reads better." ts="2:42 PM" />
            </div>
          </div>
        </div>

        <div className={`${styles.brandFoot} ${styles.mono}`}>
          © 2026 ·<span className={styles.brandFootAccent}>v4.2</span> · status: all systems operational
        </div>
      </div>

      <div className={styles.formPanel}>{children}</div>
    </div>
  );
}
