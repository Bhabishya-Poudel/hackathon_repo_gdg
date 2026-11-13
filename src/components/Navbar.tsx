import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const links = [
  { label: 'Find Grants', href: '/demo' },
  { label: 'Business Coach', href: '/business-coach' },
  { label: 'Stories', href: '/stories' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8);
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
            <NavLink key={l.href} to={l.href} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={close}>
              {l.label}
            </NavLink>
          ))}
          <a href="/#how-it-works" className={styles.link} onClick={close}>How it works</a>
          <Link className={styles.cta} to="/demo" onClick={close}>Find grants <span aria-hidden="true">&rarr;</span></Link>
        </nav>
      </div>
    </header>
  );
}
