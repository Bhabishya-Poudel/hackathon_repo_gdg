import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import GrantCard from '../components/grants/GrantCard';
import GrantFilters from '../components/grants/GrantFilters';
import { grants } from '../data/grants';
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filtersFromParams,
  paramsFromFilters,
  searchGrants,
  type Filters,
  type SortKey,
} from '../lib/grantSearch';
import styles from './Grants.module.css';

export default function Grants() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const [query, setQuery] = useState(filters.q);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    document.title = 'Grants Database - CivicText';
  }, []);

  // Keep the search box in sync if the URL changes from elsewhere (back button).
  useEffect(() => {
    setQuery(filters.q);
  }, [filters.q]);

  const update = (next: Filters) => setParams(paramsFromFilters(next), { replace: true });

  // Debounce typing so the URL does not change on every keystroke.
  useEffect(() => {
    if (query === filters.q) return;
    const t = setTimeout(() => update({ ...filters, q: query }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const results = useMemo(() => searchGrants(grants, filters), [filters]);
  const activeCount = activeFilterCount(filters);

  return (
    <section className={styles.section} id="grants">
      <div className="container">
        <header className={styles.header}>
          <p className={styles.kicker}>Grants Database</p>
          <h1 className={styles.title}>Find funding built for people like you.</h1>
          <p className={styles.lead}>
            Explore sample grant listings with filters for your organization and work.
          </p>
          <p className={styles.sample}>
            These examples are for demonstration only. Verify real opportunities
            and application details with each funder.
          </p>
          <p className={styles.sample}>
            Looking for a personalized search? <Link to="/demo">Ask CivicText on Telegram &rarr;</Link>
          </p>
        </header>

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span className="sr-only">Search grants</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search by keyword, city or funder"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <label className={styles.sort}>
            <span>Sort</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ ...filters, sort: e.target.value as SortKey })}
            >
              <option value="match">Best match</option>
              <option value="deadline">Soonest deadline</option>
              <option value="amount">Largest amount</option>
            </select>
          </label>

          <button
            type="button"
            className={styles.filterToggle}
            aria-expanded={panelOpen}
            aria-controls="grant-filters"
            onClick={() => setPanelOpen((v) => !v)}
          >
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>

        <div className={styles.layout}>
          <aside
            id="grant-filters"
            className={`${styles.sidebar} ${panelOpen ? styles.sidebarOpen : ''}`}
          >
            <GrantFilters
              filters={filters}
              onChange={update}
              onReset={() => {
                setQuery('');
                update({ ...EMPTY_FILTERS, sort: filters.sort });
              }}
              activeCount={activeCount}
            />
          </aside>

          <div className={styles.results}>
            <p className={styles.count} aria-live="polite">
              {results.length === 0
                ? 'No grants match yet'
                : `${results.length} grant${results.length === 1 ? '' : 's'} found`}
              {activeCount > 0 && results.length > 0 && ', closest fits first'}
            </p>

            {results.length === 0 ? (
              <div className={styles.empty}>
                <h2>Nothing matches all of that yet.</h2>
                <p>
                  Try removing a focus area or widening the grant size. Rolling
                  and nationwide grants often fit more situations than they
                  first appear to.
                </p>
                <button
                  type="button"
                  className={styles.emptyBtn}
                  onClick={() => {
                    setQuery('');
                    update(EMPTY_FILTERS);
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className={styles.list}>
                {results.map((r, i) => (
                  <li key={r.grant.id} style={{ '--i': Math.min(i, 8) } as CSSProperties}>
                    <GrantCard result={r} selectedAudiences={filters.audiences} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
