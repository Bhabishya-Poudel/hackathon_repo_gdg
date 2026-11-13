import { AUDIENCES, CATEGORIES, US_STATES, type Audience } from '../../data/grantTypes';
import { daysUntil, formatAmount, parseDay, type ScoredGrant } from '../../lib/grantSearch';
import styles from './GrantCard.module.css';

interface Props {
  result: ScoredGrant;
  selectedAudiences: Audience[];
}

function deadlineLabel(iso: string | null): { text: string; urgent: boolean } {
  const days = daysUntil(iso);
  if (days === null) return { text: 'Rolling deadline', urgent: false };
  if (days <= 0) return { text: 'Closes today', urgent: true };
  if (days === 1) return { text: 'Closes tomorrow', urgent: true };
  if (days <= 14) return { text: `Closes in ${days} days`, urgent: true };
  const date = parseDay(iso as string).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return { text: `Due ${date}`, urgent: false };
}

function placeLabel(states: string[], city?: string): string {
  if (city) return city + (states[0] ? `, ${states[0]}` : '');
  if (states.length === 0) return 'Nationwide';
  if (states.length === 1) return US_STATES[states[0]] ?? states[0];
  return `${states.length} states`;
}

export default function GrantCard({ result, selectedAudiences }: Props) {
  const { grant, matchedAudiences, matchedCategories } = result;
  const deadline = deadlineLabel(grant.deadline);
  const total = selectedAudiences.length;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.name}>{grant.name}</h3>
          <p className={styles.funder}>{grant.funder}</p>
        </div>
        <p className={styles.amount}>{formatAmount(grant.amountMin, grant.amountMax)}</p>
      </div>

      <p className={styles.summary}>{grant.summary}</p>

      <ul className={styles.meta}>
        <li className={deadline.urgent ? styles.urgent : undefined}>{deadline.text}</li>
        <li>{placeLabel(grant.states, grant.city)}</li>
        {grant.categories.map((c) => (
          <li
            key={c}
            className={matchedCategories.includes(c) ? styles.hit : undefined}
          >
            {CATEGORIES[c]}
          </li>
        ))}
      </ul>

      <div className={styles.audiences}>
        <span className={styles.audLabel}>Built for</span>
        {grant.audiences.map((a) => (
          <span
            key={a}
            className={`${styles.aud} ${matchedAudiences.includes(a) ? styles.audHit : ''}`}
          >
            {AUDIENCES[a]}
          </span>
        ))}
      </div>

      <details className={styles.details}>
        <summary>Requirements</summary>
        <ul>
          {grant.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>

      <div className={styles.footer}>
        {total > 0 && (
          <span className={styles.matchPill}>
            Matches {matchedAudiences.length} of {total} in your background
          </span>
        )}
        <a
          className={styles.apply}
          href={grant.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View &amp; apply <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>
  );
}
