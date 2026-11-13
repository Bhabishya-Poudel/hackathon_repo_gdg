import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './PageTransition.module.css';

/** Fades each route in and resets scroll position on navigation (hash links excepted). */
export default function PageTransition({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return (
    <div key={pathname} className={styles.enter}>
      {children}
    </div>
  );
}
