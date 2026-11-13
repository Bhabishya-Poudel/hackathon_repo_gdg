export const GOALS = ['More sales', 'Better marketing', 'Repeat customers', 'Smoother operations', 'Overall growth'] as const;
export const CHANNELS = ['Word of mouth', 'Instagram', 'Facebook', 'TikTok', 'Google / local search', 'Website / email', 'In person'] as const;

export interface BusinessProfile {
  business_name: string;
  description: string;
  customers: string;
  location: string;
  goal: typeof GOALS[number];
  monthly_budget_usd: number | null;
  channels: (typeof CHANNELS[number])[];
  challenges: string;
}

export interface CoachAction {
  title: string;
  reason: string;
  steps: string[];
  estimated_cost: string;
  metric: string;
}

export interface GrowthPlan {
  summary: string;
  quick_win: CoachAction;
  recommendations: (CoachAction & { category: string })[];
  weekly_plan: { week: number; action: string; measure: string }[];
  marketing_copy: { channel: string; caption: string; call_to_action: string };
  assumptions: string[];
  follow_up_questions: string[];
}

export const EMPTY_PROFILE: BusinessProfile = {
  business_name: '', description: '', customers: '', location: '',
  goal: 'Overall growth', monthly_budget_usd: null, channels: [], challenges: '',
};

export const EXAMPLE_PROFILE: BusinessProfile = {
  business_name: 'Petal & Stem',
  description: 'A neighborhood flower shop selling fresh bouquets, houseplants, and arrangements for small events. We have a storefront and take orders by phone.',
  customers: 'Local residents buying gifts and nearby offices ordering weekly flowers.',
  location: 'Atlanta, Georgia',
  goal: 'More sales',
  monthly_budget_usd: 100,
  channels: ['Word of mouth', 'Instagram', 'In person'],
  challenges: 'Weekdays are quiet, Instagram posts rarely lead to orders, and most customers only buy once.',
};

export async function generateGrowthPlan(profile: BusinessProfile, signal: AbortSignal): Promise<GrowthPlan> {
  let response: Response;
  try {
    response = await fetch('/api/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('We could not connect to Business Coach. Please try again shortly.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 422) throw new Error('Please check your business details and try again.');
    throw new Error(typeof body?.detail === 'string' ? body.detail : 'Business Coach is temporarily unavailable. Please try again shortly.');
  }
  if (!body || typeof body.summary !== 'string' || !body.quick_win || !Array.isArray(body.recommendations)
    || !Array.isArray(body.weekly_plan) || !body.marketing_copy || !Array.isArray(body.assumptions)
    || !Array.isArray(body.follow_up_questions)) {
    throw new Error('We received an incomplete plan. Please try again.');
  }
  return body as GrowthPlan;
}

export function planAsText(plan: GrowthPlan): string {
  const actionText = (action: CoachAction) => [
    action.title, action.reason, ...action.steps.map((step, i) => `${i + 1}. ${step}`),
    `Estimated cost: ${action.estimated_cost}`, `Track: ${action.metric}`,
  ].join('\n');
  return [
    'CivicText — Your 30-day growth plan', plan.summary,
    'START TODAY', actionText(plan.quick_win),
    'GROWTH IDEAS', ...plan.recommendations.map(actionText),
    'YOUR NEXT 30 DAYS', ...plan.weekly_plan.map((week) => `Week ${week.week}: ${week.action}\nTrack: ${week.measure}`),
    `MARKETING DRAFT (${plan.marketing_copy.channel})`, plan.marketing_copy.caption, plan.marketing_copy.call_to_action,
    'ASSUMPTIONS', ...plan.assumptions,
    'QUESTIONS TO EXPLORE', ...plan.follow_up_questions,
    'AI-generated suggestions. Review and adapt before using; results are not guaranteed.',
  ].join('\n\n');
}
