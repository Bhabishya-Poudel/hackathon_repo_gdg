import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import TextField from '../components/auth/TextField';
import { useAuth } from '../auth/useAuth';
import { AuthError } from '../auth/types';
import {
  passwordStrength,
  strengthLabels,
  validateEmail,
  validateName,
  validatePassword,
} from '../auth/validation';
import styles from './AuthForm.module.css';

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

export default function SignUp() {
  const { status, signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const strength = passwordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Errors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      terms: agreed ? undefined : 'Please accept the terms to continue.',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await signUp({ name, email, password });
      navigate('/dashboard', { replace: true });
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
      pageTitle="Create account"
      title="Create your account"
      subtitle={
        <>
          Already have one? <Link to="/signin">Sign in</Link>
        </>
      }
      footer="Free forever for grassroots organizers. No credit card required."
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={`${styles.alert} ${styles.alertError}`} role="alert">
            {formError}
          </p>
        )}

        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Amara Johnson"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="Mix upper and lower case, numbers and symbols for a stronger password."
          revealable
          required
        />

        {password && (
          <div className={styles.strength} aria-live="polite">
            <div className={styles.meter} data-score={strength} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className={styles.strengthLabel}>{strengthLabels[strength]}</span>
          </div>
        )}

        <label className={styles.terms}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={errors.terms ? true : undefined}
          />
          <span>
            I agree to the <a href="/#terms" className={styles.link}>Terms of Service</a>{' '}
            and <a href="/#privacy" className={styles.link}>Privacy Policy</a>.
          </span>
        </label>
        {errors.terms && (
          <p className={styles.fieldError} role="alert">
            {errors.terms}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
