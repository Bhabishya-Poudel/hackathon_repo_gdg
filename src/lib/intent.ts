import { US_STATES, sizeOf, type Audience, type Category } from '../data/grantTypes';
import { EMPTY_FILTERS, type Filters } from './grantSearch';
import { AUDIENCE_KEYWORDS, CATEGORY_KEYWORDS, CITY_STATES, ORG_KEYWORDS } from './intentKeywords';

export interface Intent {
  filters: Filters;
  city?: string;
  amount?: number;
  /** The user's own words, trimmed, for use in drafts. */
  need: string;
  /** True when nothing useful could be read from the message. */
  unknown: boolean;
}

/** True when any phrase appears in the text as whole words. */
function hasAny(text: string, phrases: string[]): boolean {
  const padded = ` ${text.replace(/[^a-z0-9'&]+/g, ' ')} `;
  return phrases.some((p) => padded.includes(` ${p.replace(/-/g, ' ')} `));
}

const NOT_A_NONPROFIT = ['not a nonprofit', 'not a non profit', 'not a 501', 'no nonprofit status', 'without nonprofit status', 'not registered', 'not incorporated'];

function titleCase(s: string): string {
  return s.replace(/(^|\s)([a-z])/g, (_, sp: string, c: string) => sp + c.toUpperCase());
}

function detectState(raw: string, text: string): { state: string; city?: string } {
  for (const [name, code] of Object.entries(CITY_STATES)) {
    if (hasAny(text, [name])) return { state: code, city: titleCase(name) };
  }
  for (const [code, name] of Object.entries(US_STATES)) {
    if (hasAny(text, [name.toLowerCase()])) return { state: code };
  }
  const codeMatch = raw.match(/(?:^|[\s,])([A-Z]{2})(?=[\s,.!?]|$)/);
  if (codeMatch && US_STATES[codeMatch[1]]) return { state: codeMatch[1] };
  return { state: '' };
}

function detectAmount(text: string): number | undefined {
  const money = text.match(/\$\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k)?|(\d+(?:\.\d+)?)\s*k(?=\s|$|[.,!?])/);
  if (!money) return undefined;
  const num = parseFloat((money[1] ?? money[3]).replace(/,/g, ''));
  const thousands = Boolean(money[2]) || Boolean(money[3]);
  return Math.round(thousands ? num * 1000 : num);
}

export function parseIntent(message: string): Intent {
  const raw = message.trim();
  const text = raw.toLowerCase();

  const audiences = (Object.keys(AUDIENCE_KEYWORDS) as Audience[]).filter((a) =>
    hasAny(text, AUDIENCE_KEYWORDS[a]),
  );
  const categories = (Object.keys(CATEGORY_KEYWORDS) as Category[]).filter((c) =>
    hasAny(text, CATEGORY_KEYWORDS[c]),
  );
  const orgCandidates = hasAny(text, NOT_A_NONPROFIT)
    ? ORG_KEYWORDS.filter(([type]) => type !== 'nonprofit')
    : ORG_KEYWORDS;
  const orgType = orgCandidates.find(([, words]) => hasAny(text, words))?.[0] ?? '';
  const { state, city } = detectState(raw, text);
  const amount = detectAmount(text);
  const unknown = !audiences.length && !categories.length && !orgType && !state;

  return {
    filters: {
      ...EMPTY_FILTERS,
      audiences,
      categories,
      orgType,
      state,
      size: amount ? sizeOf(amount) : '',
    },
    city,
    amount,
    need: raw.replace(/\s+/g, ' ').slice(0, 220),
    unknown,
  };
}
