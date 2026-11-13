import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTelegramBotUrl } from '../lib/platform';
import styles from './Navbar.module.css';

const links = [
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Grants Database', href: '/grants' },
  { label: 'Stories', href: '/stories' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8);
  const botUrl = getTelegramBotUrl();
  const close = () => setOpen(false);

  // Deepen the header shadow once the page starts scrolling under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand} aria-label="CivicText home" onClick={close}>
          <span className={styles.brandName}>CivicText</span>
        </Link>

        <button
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="primary-nav"
          className={`${styles.nav} ${open ? styles.navOpen : ''}`}
          aria-label="Primary"
        >
          {links.map((l) => (
            <a key={l.href} href={l.href} className={styles.link} onClick={close}>
              {l.label}
            </a>
          ))}
          <a className={styles.cta} href={botUrl} target="_blank" rel="noopener noreferrer" onClick={close}>
            Open Telegram
          </a>
        </nav>
      </div>
    </header>
  );
}
