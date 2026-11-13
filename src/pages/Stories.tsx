import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stories, type Story } from '../data/stories';
import Reveal from '../components/Reveal';
import styles from './Stories.module.css';

const toneClass: Record<Story['tone'], string> = {
  sage: styles.toneSage,
  peach: styles.tonePeach,
  rose: styles.toneRose,
  plum: styles.tonePlum,
};

function Avatar({ story, large = false }: { story: Story; large?: boolean }) {
  return (
    <span
      className={`${styles.avatar} ${toneClass[story.tone]} ${large ? styles.avatarLarge : ''}`}
      aria-hidden="true"
    >
      {story.initials}
    </span>
  );
}

export default function Stories() {
  useEffect(() => {
    document.title = 'Stories - CivicText';
  }, []);

  const featured = stories.find((s) => s.featured) ?? stories[0];
  const rest = stories.filter((s) => s.id !== featured.id);

  return (
    <section className={styles.section} id="stories">
      <div className="container">
        <header className={styles.header}>
          <p className={styles.kicker}>Stories</p>
          <h1 className={styles.title}>Illustrative community funding scenarios.</h1>
          <p className={styles.lead}>
            Examples of how a grant search could support organizers, owners
            and artists.
          </p>
          <p className={styles.sample}>
            These are fictional scenarios, not customer testimonials or
            verified awards. The programs shown are not connected to the
            Telegram backend catalog.
          </p>
        </header>

        <Reveal as="article" className={styles.featured}>
          <div className={styles.featuredBody}>
            <p className={styles.featuredLabel}>Featured story</p>
            <blockquote className={styles.featuredQuote}>
              &ldquo;{featured.quote}&rdquo;
            </blockquote>
            {featured.body.map((para) => (
              <p key={para} className={styles.featuredPara}>
                {para}
                </p>
            ))}
            <div className={styles.person}>
              <Avatar story={featured} large />
              <div>
                <p className={styles.name}>{featured.name}</p>
                <p className={styles.meta}>
                  {featured.role}, {featured.org} &middot; {featured.city}, {featured.state}
                </p>
              </div>
            </div>
          </div>
          <aside className={styles.featuredAside}>
            <p className={styles.asideLabel}>Illustrative grant</p>
            <p className={styles.asideGrant}>{featured.grant}</p>
            <p className={styles.asideAmount}>{featured.amount}</p>
            <p className={styles.asideCategory}>{featured.category}</p>
            <Link to="/grants" className={styles.asideLink}>
              Find grants like this <span aria-hidden="true">&rarr;</span>
            </Link>
          </aside>
        </Reveal>

        <ul className={styles.grid}>
          {rest.map((s, i) => (
            <Reveal as="li" key={s.id} delay={(i % 3) * 90}>
              <article className={styles.card}>
                <blockquote className={styles.quote}>&ldquo;{s.quote}&rdquo;</blockquote>
                <p className={styles.cardBody}>{s.body[0]}</p>
                <div className={styles.person}>
                  <Avatar story={s} />
                  <div>
                    <p className={styles.name}>{s.name}</p>
                    <p className={styles.meta}>
                      {s.org} &middot; {s.city}, {s.state}
                    </p>
                  </div>
                </div>
                <p className={styles.cardGrant}>
                  <span>{s.grant}</span>
                  <strong>{s.amount}</strong>
                </p>
              </article>
            </Reveal>
          ))}
        </ul>

        <Reveal className={styles.cta}>
          <h2>Have feedback about the grant finder?</h2>
          <p>
            Tell us how the Telegram bot works for you. Email a few details and
            we will follow up.
          </p>
          <a href="mailto:stories@civictext.org" className={styles.ctaBtn}>
            Send feedback
          </a>
        </Reveal>
      </div>
    </section>
  );
}
