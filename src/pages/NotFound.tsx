import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = 'Page not found - CivicText';
  }, []);

  return (
    <section className={styles.section} aria-labelledby="not-found-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.code} aria-hidden="true">
            404
          </p>
          <h1 id="not-found-title" className={styles.title}>
            This page got lost
            <br />
            in the mail.
          </h1>
          <p className={styles.lead}>
            We looked everywhere, but there is nothing at{' '}
            <code className={styles.path}>{pathname}</code>. The link may be
            outdated, or the address may have a typo.
          </p>

          <div className={styles.actions}>
            <Link to="/" className={styles.primary}>
              Back to Home
            </Link>
            <a href="/grants" className={styles.secondary}>
              View Active Grants <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        <div className={styles.thread} aria-hidden="true">
          <p className={`${styles.bubble} ${styles.user}`}>
            Hey, can you send me the page at {pathname}?
          </p>
          <p className={`${styles.bubble} ${styles.bot}`}>
            Hmm, that one does not exist. Want me to take you back to the
            homepage instead?
          </p>
          <p className={styles.status}>Not Delivered</p>
        </div>
      </div>
    </section>
  );
}
