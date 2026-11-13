import { useState, type ReactNode } from 'react';
import { AUDIENCES, type Audience } from '../../data/grantTypes';
import { daysUntil, formatAmount, type ScoredGrant } from '../../lib/grantSearch';
import styles from './ChatParts.module.css';

export function Bubble({ from, children }: { from: 'user' | 'bot'; children: ReactNode }) {
  return (
    <div className={`${styles.row} ${from === 'user' ? styles.rowUser : styles.rowBot}`}>
      <div className={`${styles.bubble} ${from === 'user' ? styles.user : styles.bot}`}>{children}</div>
    </div>
  );
}

export function TypingDots() {
  return (
    <div className={`${styles.row} ${styles.rowBot}`} aria-label="CivicText is typing" role="status">
      <div className={`${styles.bubble} ${styles.bot} ${styles.typing}`}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function deadlineText(iso: string | null): string {
  const d = daysUntil(iso);
  if (d === null) return 'Rolling';
  if (d <= 0) return 'Closes today';
  if (d <= 14) return `${d} day${d === 1 ? '' : 's'} left`;
  return new Date(iso as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface MatchListProps {
  results: ScoredGrant[];
  selected: Audience[];
  onDraft: (result: ScoredGrant) => void;
}

export function MatchList({ results, selected, onDraft }: MatchListProps) {
  return (
    <div className={`${styles.row} ${styles.rowBot}`}>
      <ol className={styles.matches}>
        {results.map((r, i) => (
          <li key={r.grant.id} className={styles.match}>
            <div className={styles.matchTop}>
              <span className={styles.rank}>{i + 1}</span>
              <div className={styles.matchHead}>
                <p className={styles.matchName}>{r.grant.name}</p>
                <p className={styles.matchFunder}>{r.grant.funder}</p>
              </div>
              <p className={styles.matchAmount}>{formatAmount(r.grant.amountMin, r.grant.amountMax)}</p>
            </div>
            <p className={styles.matchSummary}>{r.grant.summary}</p>
            <div className={styles.matchMeta}>
              <span className={daysUntil(r.grant.deadline) !== null && (daysUntil(r.grant.deadline) as number) <= 14 ? styles.urgent : ''}>
                {deadlineText(r.grant.deadline)}
              </span>
              {r.matchedAudiences.map((a) => (
                <span key={a} className={styles.hit}>
                  {AUDIENCES[a]}
                </span>
              ))}
              {selected.length > 0 && (
                <span className={styles.score}>
                  {r.matchedAudiences.length}/{selected.length} match
                </span>
              )}
            </div>
            <div className={styles.matchActions}>
              <button type="button" className={styles.primaryBtn} onClick={() => onDraft(r)}>
                Get a draft
              </button>
              <a className={styles.linkBtn} href={r.grant.url} target="_blank" rel="noopener noreferrer">
                Grant details
              </a>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface DraftCardProps {
  grantName: string;
  draft: string;
  canSave: boolean;
  saved: boolean;
  onSave: () => void;
}

export function DraftCard({ grantName, draft, canSave, saved, onSave }: DraftCardProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = draft;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className={`${styles.row} ${styles.rowBot}`}>
      <div className={styles.draft}>
        <p className={styles.draftLabel}>Application starter &middot; {grantName}</p>
        <pre className={styles.draftText}>{draft}</pre>
        <div className={styles.matchActions}>
          <button type="button" className={styles.primaryBtn} onClick={copy}>
            {copied ? 'Copied' : 'Copy text'}
          </button>
          {canSave ? (
            <button type="button" className={styles.secondaryBtn} onClick={onSave} disabled={saved}>
              {saved ? 'Saved to dashboard' : 'Save to dashboard'}
            </button>
          ) : (
            <span className={styles.hint}>Sign in to save this draft</span>
          )}
        </div>
      </div>
    </div>
  );
}
