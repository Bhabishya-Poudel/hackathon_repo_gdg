import styles from './Footer.module.css';

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.brand}>CivicText</span>
        <p className={styles.note}>
          &copy; {currentYear} CivicText. Built for organizers, by
          organizers.
        </p>
        <nav className={styles.links} aria-label="Footer">
          <a href="/grants">Grants</a>
          <a href="/stories">Stories</a>
          <a href="mailto:hello@civictext.org">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
