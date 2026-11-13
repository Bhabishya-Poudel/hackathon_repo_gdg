import type { Audience, Category, OrgType } from '../data/grantTypes';

/** Lower-case phrases that signal each audience. Matched on word boundaries. */
export const AUDIENCE_KEYWORDS: Record<Audience, string[]> = {
  'black-owned': ['black', 'african american', 'african-american'],
  'women-led': ['women', 'woman', 'female', 'mothers', 'moms', 'girls', 'ladies'],
  youth: ['youth', 'kids', 'children', 'teens', 'teenagers', 'students', 'middle school', 'high school', 'after-school', 'after school', 'mentorship', 'mentoring', 'tutoring'],
  'faith-based': ['church', 'faith', 'ministry', 'congregation', 'mosque', 'pastor', 'temple', 'fellowship'],
  immigrant: ['immigrant', 'refugee', 'newcomer', 'esl', 'english classes'],
  veteran: ['veteran', 'veterans', 'vets', 'military', 'army', 'navy', 'marines', 'air force'],
  lgbtq: ['lgbtq', 'lgbt', 'queer', 'transgender', 'pride'],
  rural: ['rural', 'farm', 'farmer', 'farmers', 'small town', 'acres', 'co-op', 'coop'],
  'first-time': ['first grant', 'never applied', 'first time', 'first-time', 'new to grants', 'never gotten'],
  'formerly-incarcerated': ['incarcerated', 'prison', 'reentry', 're-entry', 'justice-involved', 'returning citizen', 'felony'],
};

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'small-business': ['business', 'shop', 'store', 'storefront', 'salon', 'barbershop', 'barber', 'restaurant', 'bakery', 'cafe', 'boutique', 'customers', 'inventory', 'equipment', 'llc', 'contractor', 'trucking', 'chair'],
  education: ['tutoring', 'mentorship', 'mentoring', 'school', 'students', 'scholarship', 'supplies', 'literacy', 'classes', 'curriculum', 'teach'],
  food: ['food', 'meals', 'pantry', 'fridge', 'groceries', 'hunger', 'farm', 'garden', 'produce', 'feed'],
  arts: ['mural', 'art', 'artist', 'music', 'dance', 'theater', 'theatre', 'festival', 'film', 'poetry', 'gallery'],
  housing: ['housing', 'roof', 'repair', 'repairs', 'shelter', 'rent', 'tenant', 'homeless', 'building', 'hvac', 'ramp', 'leaks'],
  health: ['health', 'clinic', 'doula', 'doulas', 'wellness', 'mental health', 'therapy', 'fitness', 'nurse', 'birth', 'maternal'],
  tech: ['coding', 'laptops', 'laptop', 'computers', 'tech', 'software', 'robotics', 'stem', 'digital', 'wifi', 'internet'],
  environment: ['environment', 'climate', 'solar', 'trees', 'clean up', 'cleanup', 'recycling', 'water', 'irrigation', 'land'],
  civic: ['voter', 'voting', 'organizing', 'advocacy', 'policy', 'tenant', 'community meeting', 'census', 'civic'],
};

/** Checked in order; the first hit wins. */
export const ORG_KEYWORDS: [OrgType, string[]][] = [
  ['nonprofit', ['nonprofit', 'non-profit', 'non profit', '501', 'charity', 'ngo']],
  ['business', ['my business', 'our business', 'small business', 'shop', 'store', 'salon', 'barbershop', 'restaurant', 'bakery', 'cafe', 'llc', 'company', 'storefront', 'customers']],
  ['informal', ['collective', 'group of', 'volunteers', 'we are a group', 'informal', 'club', 'circle', 'neighbors', 'mutual aid', 'not a nonprofit']],
  ['individual', ['i am an artist', 'as an artist', 'freelance', 'myself', 'independent artist', 'on my own']],
];

export const CITY_STATES: Record<string, string> = {
  atlanta: 'GA', decatur: 'GA', macon: 'GA', savannah: 'GA', augusta: 'GA', athens: 'GA',
  birmingham: 'AL', montgomery: 'AL', selma: 'AL', mobile: 'AL', huntsville: 'AL',
  jackson: 'MS', memphis: 'TN', nashville: 'TN', chattanooga: 'TN',
  charlotte: 'NC', raleigh: 'NC', durham: 'NC', greensboro: 'NC',
  columbia: 'SC', charleston: 'SC', 'new orleans': 'LA', 'baton rouge': 'LA',
  houston: 'TX', dallas: 'TX', austin: 'TX', miami: 'FL', jacksonville: 'FL', tampa: 'FL', orlando: 'FL',
  chicago: 'IL', detroit: 'MI', baltimore: 'MD', washington: 'DC', philadelphia: 'PA',
  'new york': 'NY', brooklyn: 'NY', oakland: 'CA', 'los angeles': 'CA', cleveland: 'OH',
};
