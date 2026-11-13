import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import TextField from '../components/auth/TextField';
import { useAuth } from '../auth/useAuth';
import { AuthError } from '../auth/types';
import { demoCredentials } from '../auth/mockAuthService';
import { validateEmail } from '../auth/validation';
import styles from './AuthForm.module.css';

interface LocationState {
  from?: string;
}

export default function SignIn() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  const fillDemo = () => {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setErrors({});
    setFormError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Enter your password.',
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await signIn({ email, password, remember });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      pageTitle="Sign in"
      title="Welcome back"
      subtitle={
        <>
          New to CivicText? <Link to="/signup">Create a free account</Link>
        </>
      }
      footer={
        <>
          Trouble signing in? <a href="mailto:hello@civictext.org">Contact us</a>
        </>
      }
    >
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
          error={errors.email}
          required
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          revealable
          required
        />

        <div className={styles.row}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div className={styles.demo}>
          <span>
            Demo account: <code>{demoCredentials.email}</code> /{' '}
            <code>{demoCredentials.password}</code>
          </span>
          <button type="button" className={styles.demoBtn} onClick={fillDemo}>
            Fill it in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
