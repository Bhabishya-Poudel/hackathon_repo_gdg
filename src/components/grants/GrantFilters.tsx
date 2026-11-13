import {
  AUDIENCES,
  CATEGORIES,
  ORG_TYPES,
  SIZES,
  US_STATES,
  type Audience,
  type Category,
} from '../../data/grantTypes';
import type { Filters } from '../../lib/grantSearch';
import styles from './GrantFilters.module.css';

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  activeCount: number;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function GrantFilters({ filters, onChange, onReset, activeCount }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <form className={styles.panel} onSubmit={(e) => e.preventDefault()} aria-label="Filter grants">
      <div className={styles.head}>
        <h2 className={styles.title}>Your background</h2>
        {activeCount > 0 && (
          <button type="button" className={styles.reset} onClick={onReset}>
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <fieldset className={styles.group}>
        <legend>Who you are</legend>
        <p className={styles.help}>Pick everything that applies. More matches rank higher.</p>
        <div className={styles.chips}>
          {(Object.keys(AUDIENCES) as Audience[]).map((a) => {
            const on = filters.audiences.includes(a);
            return (
              <button
                key={a}
                type="button"
                className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                aria-pressed={on}
                onClick={() => set('audiences', toggle(filters.audiences, a))}
              >
                {AUDIENCES[a]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>What you are</legend>
        <div className={styles.radios}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="org"
              checked={filters.orgType === ''}
              onChange={() => set('orgType', '')}
            />
            Any
          </label>
          {(Object.keys(ORG_TYPES) as (keyof typeof ORG_TYPES)[]).map((o) => (
            <label key={o} className={styles.radio}>
              <input
                type="radio"
                name="org"
                checked={filters.orgType === o}
                onChange={() => set('orgType', o)}
              />
              {ORG_TYPES[o]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Focus area</legend>
        <div className={styles.chips}>
          {(Object.keys(CATEGORIES) as Category[]).map((c) => {
            const on = filters.categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                aria-pressed={on}
                onClick={() => set('categories', toggle(filters.categories, c))}
              >
                {CATEGORIES[c]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.row}>
        <label className={styles.select}>
          <span>State</span>
          <select value={filters.state} onChange={(e) => set('state', e.target.value)}>
            <option value="">Anywhere in the US</option>
            {Object.entries(US_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.select}>
          <span>Grant size</span>
          <select
            value={filters.size}
            onChange={(e) => set('size', e.target.value as Filters['size'])}
          >
            <option value="">Any amount</option>
            {Object.entries(SIZES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
