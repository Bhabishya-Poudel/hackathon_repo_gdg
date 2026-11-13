import { AUDIENCES, CATEGORIES, US_STATES, type Grant } from '../data/grantTypes';
import { grants } from '../data/grants';
import { buildDraft } from './draft';
import { daysUntil, formatAmount, searchGrants, type ScoredGrant } from './grantSearch';
import { parseIntent, type Intent } from './intent';

export type Msg =
  | { id: string; from: 'user'; kind: 'text'; text: string }
  | { id: string; from: 'bot'; kind: 'text'; text: string }
  | { id: string; from: 'bot'; kind: 'matches'; results: ScoredGrant[]; intent: Intent }
  | { id: string; from: 'bot'; kind: 'draft'; grant: Grant; draft: string; userText: string };

let counter = 0;
export const nextId = () => `m${Date.now().toString(36)}${(counter += 1)}`;

export const SUGGESTIONS = [
  'I run a youth mentorship program in Atlanta and need supplies.',
  'Black-owned barbershop in Birmingham, need about $5,000 for a second chair.',
  'Our church in Macon hosts a food pantry and the roof leaks.',
  'Group of doulas in Decatur, not a nonprofit yet, need birth kits.',
];

export const MAX_MATCHES = 3;

function describe(intent: Intent): string {
  const bits: string[] = [];
  const { filters, city } = intent;
  if (filters.audiences.length) bits.push(filters.audiences.map((a) => AUDIENCES[a].toLowerCase()).join(' + '));
  if (filters.categories.length) bits.push(filters.categories.map((c) => CATEGORIES[c].toLowerCase()).join(', '));
  if (city) bits.push(`in ${city}`);
  else if (filters.state) bits.push(`in ${US_STATES[filters.state] ?? filters.state}`);
  if (intent.amount) bits.push(`around $${intent.amount.toLocaleString('en-US')}`);
  return bits.join(' / ');
}

function deadlinePhrase(g: Grant): string {
  const d = daysUntil(g.deadline);
  if (d === null) return 'rolling deadline';
  if (d <= 14) return `closes in ${d} day${d === 1 ? '' : 's'}`;
  return `deadline ${new Date(g.deadline as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

/** Turns a user message into the bot's reply messages. Pure apart from ids. */
export function buildReplies(userText: string, now = new Date()): { intent: Intent; messages: Msg[] } {
  const intent = parseIntent(userText);

  if (intent.unknown) {
    return {
      intent,
      messages: [
        {
          id: nextId(),
          from: 'bot',
          kind: 'text',
          text:
            'Got it. To find the right fit I need a little more. Tell me who you serve, what the money is for, and your city or state. For example: "We tutor middle schoolers in Decatur and need laptops."',
        },
      ],
    };
  }

  // The dollar amount is a preference, not a hard filter: a grant that can
  // cover the ask should rank first, but smaller ones still count as fits.
  const ranked = searchGrants(grants, { ...intent.filters, size: '', sort: 'match' }, now);
  const covers = (g: Grant) => (intent.amount ? g.amountMax >= intent.amount : true);
  const results = [...ranked].sort((a, b) => Number(covers(b.grant)) - Number(covers(a.grant)));
  const top = results.slice(0, MAX_MATCHES);
  const summary = describe(intent);

  if (top.length === 0) {
    const relaxed = searchGrants(grants, { ...intent.filters, size: '', orgType: '', sort: 'match' }, now).slice(0, MAX_MATCHES);
    const intro = `I read that as ${summary}. Nothing fits every detail yet, but here is what comes closest if we loosen the organization type:`;
    return {
      intent,
      messages: relaxed.length
        ? [
            { id: nextId(), from: 'bot', kind: 'text', text: intro },
            { id: nextId(), from: 'bot', kind: 'matches', results: relaxed, intent },
          ]
        : [
            {
              id: nextId(),
              from: 'bot',
              kind: 'text',
              text: `I read that as ${summary}. I do not have a match for that yet. Try describing the work a different way, or browse the full database.`,
            },
          ],
    };
  }

  const best = top[0].grant;
  const intro =
    `Hey! I read that as ${summary}. Found ${results.length} match${results.length === 1 ? '' : 'es'}. ` +
    `Top pick: the "${best.name}" offers ${formatAmount(best.amountMin, best.amountMax)}, ${deadlinePhrase(best)}.`;

  return {
    intent,
    messages: [
      { id: nextId(), from: 'bot', kind: 'text', text: intro },
      { id: nextId(), from: 'bot', kind: 'matches', results: top, intent },
    ],
  };
}

export function buildDraftReply(grant: Grant, userText: string, intent: Intent, senderName?: string | null): Msg[] {
  return [
    {
      id: nextId(),
      from: 'bot',
      kind: 'text',
      text: `Here is a starter for the ${grant.name}. Edit anything that does not sound like you, then paste it into their form.`,
    },
    { id: nextId(), from: 'bot', kind: 'draft', grant, draft: buildDraft(grant, intent, senderName), userText },
  ];
}
