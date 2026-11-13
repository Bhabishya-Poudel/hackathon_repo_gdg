import { Link } from 'react-router-dom';
import { AUDIENCES, CATEGORIES, ORG_TYPES, SIZES, US_STATES } from '../../data/grantTypes';
import { paramsFromFilters } from '../../lib/grantSearch';
import type { Intent } from '../../lib/intent';
import styles from './IntentPanel.module.css';

interface Props {
  intent: Intent | null;
}

/** Shows what the parser understood from the last message, so matching is not a black box. */
export default function IntentPanel({ intent }: Props) {
  const f = intent?.filters;
  const rows: { label: string; values: string[] }[] = f
    ? [
        { label: 'Who you are', values: f.audiences.map((a) => AUDIENCES[a]) },
        { label: 'Organization', values: f.orgType ? [ORG_TYPES[f.orgType]] : [] },
        { label: 'Focus', values: f.categories.map((c) => CATEGORIES[c]) },
        {
          label: 'Where',
          values: intent?.city
            ? [`${intent.city}, ${f.state}`]
            : f.state
              ? [US_STATES[f.state] ?? f.state]
              : [],
        },
        {
          label: 'Amount',
          values: intent?.amount ? [`$${intent.amount.toLocaleString('en-US')} (${SIZES[f.size || 'micro']})`] : [],
        },
      ]
    : [];

  const anything = rows.some((r) => r.values.length > 0);

  return (
    <aside className={styles.panel} aria-label="What we understood">
      <h2 className={styles.title}>What we understood</h2>
      {!intent && (
        <p className={styles.muted}>
          Send a message and we will show the details we picked out of it here. Matches are
          based only on these, so you can see exactly why a grant appeared.
        </p>
      )}
      {intent && !anything && (
        <p className={styles.muted}>
          We could not pick out a location, audience or purpose yet. Add a few specifics and
          try again.
        </p>
      )}
      {anything && (
        <>
          <dl className={styles.list}>
            {rows.map((r) => (
              <div key={r.label} className={styles.rowItem}>
                <dt>{r.label}</dt>
                <dd>
                  {r.values.length ? (
                    r.values.map((v) => (
                      <span key={v} className={styles.tag}>
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className={styles.none}>Not mentioned</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Link to={`/grants?${paramsFromFilters(f!).toString()}`} className={styles.link}>
            See all matches in the database <span aria-hidden="true">&rarr;</span>
          </Link>
        </>
      )}
      <p className={styles.tip}>
        Tip: mention your city, who you serve, and a dollar amount for the sharpest matches.
      </p>
    </aside>
  );
}
