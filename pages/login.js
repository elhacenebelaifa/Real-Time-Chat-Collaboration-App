import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import AuthShell from '../components/shared/AuthShell';
import Icon from '../components/shared/Icon';
import styles from '../styles/Auth.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>Sign in</title></Head>
      <AuthShell>
        <div className={styles.switchRow}>
          <span>New here?</span>
          <Link href="/register"><a className={styles.switchLink}>Create an account →</a></Link>
        </div>

        <div className={styles.formBody}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={`${styles.eyebrow} ${styles.mono}`}>● sign in</div>
            <h2 className={styles.title}>Welcome back.</h2>
            <p className={styles.subtitle}>Pick up where your team left off.</p>

            {error && <div className={styles.topError}>{error}</div>}

            <div className={styles.oauthRow}>
              <button type="button" className={styles.oauthBtn} disabled>
                <span style={{ fontWeight: 700 }}>G</span> Google
              </button>
              <button type="button" className={styles.oauthBtn} disabled>
                <span style={{ fontWeight: 700 }}>◆</span> SSO
              </button>
            </div>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={`${styles.dividerLabel} ${styles.mono}`}>or email</span>
              <div className={styles.dividerLine} />
            </div>

            <label className={styles.field}>
              <div className={styles.fieldHead}>
                <span>Email</span>
              </div>
              <div className={styles.inputShell}>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@team.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <div className={styles.fieldHead}>
                <span>Password</span>
                <button type="button" className={styles.fieldHintLink}>Forgot?</button>
              </div>
              <div className={styles.inputShell}>
                <input
                  className={styles.input}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.inputRight}
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? 'hide' : 'show'}
                </button>
              </div>
            </label>

            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Keep me signed in on this device</span>
            </label>

            <button className={styles.primaryBtn} type="submit" disabled={submitting}>
              {submitting ? <span className={styles.spinner} /> : <Icon name="lock" size={14} color="#fff" />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <div className={styles.legal}>secured by end-to-end encryption</div>
          </form>
        </div>
      </AuthShell>
    </>
  );
}
