import {
  AUDIENCES,
  CATEGORIES,
  ORG_TYPES,
  SIZES,
  sizeOf,
  type Audience,
  type Category,
  type Grant,
  type OrgType,
  type Size,
} from '../data/grantTypes';

export type SortKey = 'match' | 'deadline' | 'amount';

export interface Filters {
  q: string;
  audiences: Audience[];
  orgType: OrgType | '';
  categories: Category[];
  state: string;
  size: Size | '';
  sort: SortKey;
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  audiences: [],
  orgType: '',
  categories: [],
  state: '',
  size: '',
  sort: 'match',
};

export interface ScoredGrant {
  grant: Grant;
  /** Which of the user's selected audiences this grant explicitly serves. */
  matchedAudiences: Audience[];
  matchedCategories: Category[];
  score: number;
}

const isKey = <T extends object>(obj: T, k: string): k is Extract<keyof T, string> =>
  Object.prototype.hasOwnProperty.call(obj, k);

const splitList = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

/** Reads filters from a URLSearchParams, ignoring unknown values. */
export function filtersFromParams(params: URLSearchParams): Filters {
  const audiences = splitList(params.get('who')).filter((a): a is Audience =>
    isKey(AUDIENCES, a),
  );
  const categories = splitList(params.get('focus')).filter((c): c is Category =>
    isKey(CATEGORIES, c),
  );
  const orgType = params.get('org') ?? '';
  const size = params.get('size') ?? '';
  const sort = params.get('sort') ?? 'match';
  return {
    q: params.get('q') ?? '',
    audiences,
    orgType: isKey(ORG_TYPES, orgType) ? orgType : '',
    categories,
    state: (params.get('state') ?? '').toUpperCase().slice(0, 2),
    size: isKey(SIZES, size) ? size : '',
    sort: sort === 'deadline' || sort === 'amount' ? sort : 'match',
  };
}

/** Writes filters to URLSearchParams, omitting defaults to keep URLs short. */
export function paramsFromFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.audiences.length) p.set('who', f.audiences.join(','));
  if (f.orgType) p.set('org', f.orgType);
  if (f.categories.length) p.set('focus', f.categories.join(','));
  if (f.state) p.set('state', f.state);
  if (f.size) p.set('size', f.size);
  if (f.sort !== 'match') p.set('sort', f.sort);
  return p;
}

export function activeFilterCount(f: Filters): number {
  return (
    (f.q.trim() ? 1 : 0) +
    f.audiences.length +
    (f.orgType ? 1 : 0) +
    f.categories.length +
    (f.state ? 1 : 0) +
    (f.size ? 1 : 0)
  );
}

function matchesQuery(g: Grant, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [g.name, g.funder, g.summary, g.city ?? '', ...g.requirements]
    .join(' ')
    .toLowerCase();
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

/** Parses a YYYY-MM-DD string as local midnight so the day never shifts with timezone. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const deadlineValue = (g: Grant) =>
  g.deadline ? parseDay(g.deadline).getTime() : Number.POSITIVE_INFINITY;

/**
 * Filters and ranks grants. Hard filters: query, org type, state, size,
 * and (when any are picked) at least one audience and one category match.
 * Ranking: more matched audiences and categories first, then the chosen sort.
 */
export function searchGrants(grants: Grant[], f: Filters, now = new Date()): ScoredGrant[] {
  const today = now.getTime();
  const results: ScoredGrant[] = [];

  for (const grant of grants) {
    if (grant.deadline && parseDay(grant.deadline).getTime() < today) continue;
    if (!matchesQuery(grant, f.q)) continue;
    if (f.orgType && !grant.orgTypes.includes(f.orgType)) continue;
    if (f.state && grant.states.length > 0 && !grant.states.includes(f.state)) continue;
    if (f.size && sizeOf(grant.amountMax) !== f.size) continue;

    const matchedAudiences = f.audiences.filter((a) => grant.audiences.includes(a));
    if (f.audiences.length && matchedAudiences.length === 0) continue;

    const matchedCategories = f.categories.filter((c) => grant.categories.includes(c));
    if (f.categories.length && matchedCategories.length === 0) continue;

    // Nationwide grants are slightly less specific than local ones.
    const localBonus = f.state && grant.states.includes(f.state) ? 0.5 : 0;
    results.push({
      grant,
      matchedAudiences,
      matchedCategories,
      score: matchedAudiences.length + matchedCategories.length + localBonus,
    });
  }

  results.sort((a, b) => {
    if (f.sort === 'match' && b.score !== a.score) return b.score - a.score;
    if (f.sort === 'amount') return b.grant.amountMax - a.grant.amountMax;
    return deadlineValue(a.grant) - deadlineValue(b.grant);
  });

  return results;
}

export function daysUntil(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const ms = parseDay(iso).getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

export function formatAmount(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k` : `$${n}`;
  return min === max ? fmt(max) : `${fmt(min)} - ${fmt(max)}`;
}
