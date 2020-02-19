import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import AuthShell from '../components/shared/AuthShell';
import Icon from '../components/shared/Icon';
import styles from '../styles/Auth.module.css';

function scorePassword(pw) {
  const criteria = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  return { criteria, score };
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const { criteria, score } = useMemo(() => scorePassword(password), [password]);
  const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][score];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!agree) return setError('Please accept the terms to continue.');
    if (score < 3) return setError('Please choose a stronger password.');
    setSubmitting(true);
    try {
      await register(username, email, password);
      router.push('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = username
    ? `ripple.app/@${username.toLowerCase().replace(/[^a-z0-9_]/g, '')}`
    : 'ripple.app/@yourhandle';

  return (
    <>
      <Head><title>Create account</title></Head>
      <AuthShell>
        <div className={styles.switchRow}>
          <span>Already have an account?</span>
          <Link href="/login"><a className={styles.switchLink}>Sign in →</a></Link>
        </div>

        <div className={styles.formBody}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={`${styles.eyebrow} ${styles.mono}`}>● join ripple</div>
            <h2 className={styles.title}>Create your account.</h2>
            <p className={styles.subtitle}>Free for teams of up to 10.</p>

            {error && <div className={styles.topError}>{error}</div>}

            <label className={styles.field}>
              <div className={styles.fieldHead}>
                <span>Username</span>
                <span className={`${styles.fieldHint} ${styles.mono}`}>{handlePreview}</span>
              </div>
              <div className={styles.inputShell}>
                <input
                  className={styles.input}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_handle"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>
            </label>

            <label className={styles.field}>
              <div className={styles.fieldHead}>
                <span>Work email</span>
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
                {password && (
                  <span className={`${styles.fieldHint} ${styles.mono}`}>{strengthLabel}</span>
                )}
              </div>
              <div className={styles.inputShell}>
                <input
                  className={styles.input}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="at least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.inputRight}
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? 'hide' : 'show'}
                </button>
              </div>

              <div className={styles.pwMeter}>
                {[0, 1, 2, 3, 4].map((i) => {
                  const filled = i < score;
                  const cls = score <= 2 ? styles.pwSegWeak : score <= 3 ? styles.pwSegMed : styles.pwSegStrong;
                  return <div key={i} className={`${styles.pwSegment} ${filled ? cls : ''}`} />;
                })}
              </div>

              <div className={styles.pwCriteria}>
                {[
                  ['length', '8+ characters'],
                  ['upper', 'Uppercase letter'],
                  ['lower', 'Lowercase letter'],
                  ['digit', 'Number'],
                  ['symbol', 'Symbol'],
                ].map(([key, label]) => (
                  <span key={key} className={criteria[key] ? styles.pwCriteriaMet : ''}>
                    {criteria[key] ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            </label>

            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>I agree to the Terms and Privacy Policy.</span>
            </label>

            <button className={styles.primaryBtn} type="submit" disabled={submitting}>
              {submitting ? <span className={styles.spinner} /> : <Icon name="lock" size={14} color="#fff" />}
              {submitting ? 'Creating account…' : 'Create account'}
            </button>

            <div className={styles.legal}>E2E encrypted · no spam · cancel anytime</div>
          </form>
        </div>
      </AuthShell>
    </>
  );
}
