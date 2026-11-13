import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import TextField from '../components/auth/TextField';
import { useAuth } from '../auth/useAuth';
import { validateEmail } from '../auth/validation';
import styles from './AuthForm.module.css';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      setFormError('We could not send the email right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      pageTitle="Reset password"
      title="Reset your password"
      subtitle={
        sent ? (
          'Check your inbox.'
        ) : (
          <>
            Enter the email you signed up with and we will send a reset link.
            Remembered it? <Link to="/signin">Sign in</Link>
          </>
        )
      }
    >
      {sent ? (
        <div className={styles.success} aria-live="polite">
          <span className={styles.successIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className={`${styles.alert} ${styles.alertSuccess}`}>
            If an account exists for <strong>{email}</strong>, a reset link is on
            its way. It expires in 30 minutes.
          </p>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            Use a different email
          </button>
          <Link to="/signin" className={styles.link}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className={`${styles.alert} ${styles.alertError}`} role="alert">
              {formError}
            </p>
          )}
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@organization.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
          />
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
