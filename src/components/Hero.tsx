import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

const pillIcon = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const tags = [
  {
    label: 'Grassroots-First',
    tone: styles.tagSage,
    icon: (
      <svg {...pillIcon} aria-hidden="true">
        <path d="M12 21V11" />
        <path d="M12 11C12 6 8 4 4 4c0 5 3 8 8 7z" />
        <path d="M12 14c0-4 3-6 8-6 0 4-3 7-8 6z" />
      </svg>
    ),
  },
  {
    label: 'Equitable Capital',
    tone: styles.tagPeach,
    icon: (
      <svg {...pillIcon} aria-hidden="true">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    ),
  },
  {
    label: 'Telegram bot',
    tone: styles.tagRose,
    icon: (
      <svg {...pillIcon} aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-4.6A8.4 8.4 0 1 1 21 11.5z" />
      </svg>
    ),
  },
];

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <h1 className={styles.title}>
            <span className={styles.titleLine}>Find grants through</span>{' '}
            <span className={styles.titleLine}>Telegram.</span>
          </h1>
          <p className={styles.lead}>
            Tell CivicText&rsquo;s Telegram bot about your business or community
            project. It searches the backend&rsquo;s grant catalog and replies
            with relevant programs, funding details, and application links.
          </p>

          <div className={styles.actions}>
            <Link to="/demo" className={styles.primary}>
              Try the Demo
            </Link>
            <Link to="/grants" className={styles.secondary}>
              Browse sample listings <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <ul className={styles.tags} aria-label="Highlights">
            {tags.map((t) => (
              <li key={t.label} className={`${styles.tag} ${t.tone}`}>
                <span className={styles.tagIcon}>{t.icon}</span>
                {t.label}
              </li>
            ))}
          </ul>
          <p className={styles.catalogNote}>
            The backend catalog is still in development and may include
            fictional sample grants. Verify opportunities with the funder.
          </p>
        </div>

        <div className={styles.visual}>
          <div className={styles.photoWrap}>
            <img
              className={styles.photo}
              src="https://images.unsplash.com/photo-1611432579699-484f7990b127?auto=format&fit=crop&w=900&q=80"
              alt="A smiling Black woman community organizer in a white top, photographed against a bright background"
              loading="eager"
            />
          </div>
          <div className={styles.preview}>
            <p className={styles.previewLabel}>A real request can be simple</p>
            <p className={styles.previewMessage}>
              &ldquo;I run a flower shop and need funding for pots.&rdquo;
            </p>
            <p className={styles.previewReply}>
              CivicText searches its grant catalog and shares matching details
              when available.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
