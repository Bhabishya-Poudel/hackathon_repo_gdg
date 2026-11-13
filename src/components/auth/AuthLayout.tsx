import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

interface Props {
  title: string;
  subtitle: ReactNode;
  pageTitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  pageTitle,
  children,
  footer,
}: Props) {
  useEffect(() => {
    document.title = `${pageTitle} - CivicText`;
  }, [pageTitle]);

  return (
    <section className={styles.wrap}>
      <div className={`container ${styles.grid}`}>
        <aside className={styles.brandPanel} aria-hidden="true">
          <p className={styles.kicker}>CivicText</p>
          <h2 className={styles.brandTitle}>
            Grants that find you,
            <br />
            not the other way round.
          </h2>
          <div className={styles.thread}>
            <p className={`${styles.bubble} ${styles.user}`}>
              We feed 40 families every Sunday in Decatur. Any help with food
              costs?
            </p>
            <p className={`${styles.bubble} ${styles.bot}`}>
              Found 3 matches. The closest deadline is the DeKalb Food Access
              Fund, up to $5,000, due Dec 12.
            </p>
          </div>
          <ul className={styles.points}>
            <li>Free for community organizers</li>
            <li>Works on any phone, no app needed</li>
            <li>Your data is never sold</li>
          </ul>
        </aside>

        <div className={styles.card}>
          <Link to="/" className={styles.backHome}>
            <span aria-hidden="true">&larr;</span> Back to home
          </Link>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    </section>
  );
}
