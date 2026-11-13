export const AUDIENCES = {
  'black-owned': 'Black-owned business',
  'women-led': 'Women-led',
  youth: 'Youth-serving',
  'faith-based': 'Faith-based',
  immigrant: 'Immigrant-led',
  veteran: 'Veteran-owned',
  lgbtq: 'LGBTQ+-led',
  rural: 'Rural community',
  'first-time': 'First-time applicant',
  'formerly-incarcerated': 'Formerly incarcerated founders',
} as const;

export const ORG_TYPES = {
  business: 'For-profit business',
  nonprofit: 'Registered nonprofit',
  informal: 'Informal group or collective',
  individual: 'Individual',
} as const;

export const CATEGORIES = {
  'small-business': 'Small business',
  education: 'Education & mentorship',
  food: 'Food access',
  arts: 'Arts & culture',
  housing: 'Housing',
  health: 'Health & wellness',
  tech: 'Technology',
  environment: 'Environment',
  'civic': 'Civic engagement',
} as const;

export const SIZES = {
  micro: 'Up to $5,000',
  small: '$5,000 - $25,000',
  medium: '$25,000 - $100,000',
  large: 'Over $100,000',
} as const;

export type Audience = keyof typeof AUDIENCES;
export type OrgType = keyof typeof ORG_TYPES;
export type Category = keyof typeof CATEGORIES;
export type Size = keyof typeof SIZES;

export interface Grant {
  id: string;
  name: string;
  funder: string;
  summary: string;
  amountMin: number;
  amountMax: number;
  /** ISO date, or null for rolling applications. */
  deadline: string | null;
  /** Two-letter state codes. Empty means available nationwide. */
  states: string[];
  city?: string;
  audiences: Audience[];
  orgTypes: OrgType[];
  categories: Category[];
  url: string;
  requirements: string[];
}

export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export function sizeOf(amountMax: number): Size {
  if (amountMax <= 5_000) return 'micro';
  if (amountMax <= 25_000) return 'small';
  if (amountMax <= 100_000) return 'medium';
  return 'large';
}
