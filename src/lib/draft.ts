import { AUDIENCES, CATEGORIES, ORG_TYPES, US_STATES, type Grant } from '../data/grantTypes';
import type { Intent } from './intent';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const stripEnd = (s: string) => s.replace(/[.!?\s]+$/, '');

function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Builds an application starter from the user's message and a matched grant.
 * Plain text so it pastes cleanly into email, a form, or a Word doc.
 */
const DESCRIPTORS: Record<string, string> = {
  'black-owned': 'Black-led',
  'women-led': 'women-led',
  youth: 'youth-serving',
  'faith-based': 'faith-based',
  immigrant: 'immigrant-led',
  veteran: 'veteran-owned',
  lgbtq: 'LGBTQ+-led',
  rural: 'rooted in a rural community',
  'first-time': 'applying for grant funding for the first time',
  'formerly-incarcerated': 'led by formerly incarcerated founders',
};

export function buildDraft(grant: Grant, intent: Intent, senderName?: string | null): string {
  const { filters, city, amount } = intent;
  const place = city
    ? `${city}, ${US_STATES[filters.state] ?? filters.state}`
    : filters.state
      ? US_STATES[filters.state] ?? filters.state
      : 'our community';

  const orgLabel = filters.orgType ? lowerFirst(ORG_TYPES[filters.orgType]) : 'community organization';
  const descriptors = filters.audiences.map((a) => DESCRIPTORS[a] ?? lowerFirst(AUDIENCES[a]));
  const focusWords = filters.categories.map((c) => lowerFirst(CATEGORIES[c]));
  const matched = grant.audiences
    .filter((a) => filters.audiences.includes(a))
    .map((a) => DESCRIPTORS[a] ?? lowerFirst(AUDIENCES[a]));

  const askNumber = amount ?? grant.amountMax;
  const ask = `$${askNumber.toLocaleString('en-US')}`;
  const need = stripEnd(intent.need) || 'support our work';
  const requirements = grant.requirements.map((r) => lowerFirst(stripEnd(r)));

  const about = [
    `About us: We are a ${orgLabel} based in ${place}.`,
    descriptors.length ? `We are ${joinWords(descriptors)}.` : '',
    focusWords.length ? `Our work focuses on ${joinWords(focusWords)}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const lines = [
    `Subject: ${grant.name} application`,
    '',
    `Dear ${grant.funder} team,`,
    '',
    `We are writing to apply for the ${grant.name}. In our own words, here is what we need: "${need}."`,
    '',
    about,
    '',
    `Our request: We are asking for ${ask} to cover the costs described above. We understand this fund supports ${lowerFirst(stripEnd(grant.summary))}, which is exactly the kind of work we do.`,
    '',
    matched.length
      ? `Why we fit: This program is built for organizations that are ${joinWords(matched)}, and that describes us.`
      : 'Why we fit: Our work sits squarely within the priorities described in your guidelines.',
    '',
    `We have reviewed your requirements (${joinWords(requirements)}) and can provide supporting materials on request. Thank you for considering our application.`,
    '',
    'Sincerely,',
    senderName || '[Your name]',
  ];

  return lines.join('\n');
}
