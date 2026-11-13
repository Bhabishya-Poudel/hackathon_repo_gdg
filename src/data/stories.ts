export interface Story {
  id: string;
  name: string;
  role: string;
  org: string;
  city: string;
  state: string;
  grant: string;
  amount: string;
  category: string;
  quote: string;
  body: string[];
  /** Two-letter initials for the avatar. */
  initials: string;
  /** Avatar tone, maps to a CSS class. */
  tone: 'sage' | 'peach' | 'rose' | 'plum';
  featured?: boolean;
}

/**
 * SAMPLE DATA. The people, organizations and grants below are fictional
 * composites used to demonstrate the stories page.
 */
export const stories: Story[] = [
  {
    id: 'amara-mentorship',
    name: 'Amara Johnson',
    role: 'Founder',
    org: 'Westside Scholars Collective',
    city: 'Atlanta', state: 'GA',
    grant: 'Atlanta Rise Grant', amount: '$2,500', category: 'Education',
    quote: 'I texted one sentence on a Tuesday night. By Friday I had a draft application and a deadline on my calendar.',
    body: [
      'Amara runs a Saturday tutoring program out of a church basement for forty middle schoolers. She had never applied for a grant and assumed the paperwork would take weeks she did not have.',
      'The first match covered supply bags, graphing calculators and snacks for the spring semester. She has since applied for two more using the same drafts as a starting point.',
    ],
    initials: 'AJ', tone: 'plum', featured: true,
  },
  {
    id: 'darnell-barbershop',
    name: 'Darnell Reed',
    role: 'Owner',
    org: 'Crown & Clipper Barbershop',
    city: 'Birmingham', state: 'AL',
    grant: 'Main Street Forward Microgrant', amount: '$7,500', category: 'Small business',
    quote: 'Nobody told me there was money for a shop like mine. It paid for the second chair and the sign out front.',
    body: [
      'Darnell opened his shop eighteen months ago with savings and a loan from his uncle. He found out about storefront microgrants through a client who had used CivicText.',
      'The grant covered a second barber chair and exterior signage, which doubled his walk-in traffic within two months.',
    ],
    initials: 'DR', tone: 'peach',
  },
  {
    id: 'keisha-doulas',
    name: 'Keisha Alvarez',
    role: 'Lead doula',
    org: 'Rooted Birth Circle',
    city: 'Decatur', state: 'GA',
    grant: 'Wellness on the Block', amount: '$6,000', category: 'Health',
    quote: 'We were paying for birth kits out of pocket. Now every client gets one, and we added two more doulas.',
    body: [
      'Keisha and three other doulas support families who could not otherwise afford birth support. They had operated informally, without nonprofit status, which kept them out of most funding.',
      'A rolling grant that accepts informal collectives let them buy supplies and offer stipends to two doulas in training.',
    ],
    initials: 'KA', tone: 'sage',
  },
  {
    id: 'marcus-farm',
    name: 'Marcus Bell',
    role: 'Farmer',
    org: 'Bell Family Acres',
    city: 'Selma', state: 'AL',
    grant: 'Rural Roots Enterprise Grant', amount: '$18,000', category: 'Food access',
    quote: 'The irrigation system was a dream for five years. It took one application to make it real.',
    body: [
      'Marcus farms twelve acres that have been in his family for three generations. Dry summers had cut his yields in half twice in the last decade.',
      'The grant paid for a drip irrigation system and a walk-in cooler, which let him sell to two school districts for the first time.',
    ],
    initials: 'MB', tone: 'rose',
  },
  {
    id: 'tasha-mural',
    name: 'Tasha Greene',
    role: 'Muralist',
    org: 'Independent artist',
    city: 'Atlanta', state: 'GA',
    grant: 'Mural City Public Art Commission', amount: '$12,000', category: 'Arts',
    quote: 'I had the wall and the design. I did not have the words for a funder. The draft gave me the words.',
    body: [
      'Tasha had secured permission to paint a three-story wall in her neighborhood but could not fund scaffolding, paint and an assistant.',
      'Her commission funded the mural, which now anchors a monthly community market in the lot below it.',
    ],
    initials: 'TG', tone: 'plum',
  },
  {
    id: 'pastor-williams',
    name: 'Rev. Dana Williams',
    role: 'Pastor',
    org: 'New Hope Fellowship',
    city: 'Macon', state: 'GA',
    grant: 'Sanctuary Spaces Repair Grant', amount: '$42,000', category: 'Housing',
    quote: 'Our building hosts a food pantry, a GED class and a clinic. A new roof keeps all three open.',
    body: [
      'New Hope opens its doors six days a week to programs run by other groups. Years of leaks had closed the fellowship hall during heavy rain.',
      'The repair grant replaced the roof and added a ramp, so every program could keep its schedule through the winter.',
    ],
    initials: 'DW', tone: 'sage',
  },
];
