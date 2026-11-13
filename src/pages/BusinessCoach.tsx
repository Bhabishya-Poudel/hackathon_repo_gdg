import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CHANNELS, EMPTY_PROFILE, EXAMPLE_PROFILE, GOALS, generateGrowthPlan, planAsText,
  type BusinessProfile, type CoachAction, type GrowthPlan,
} from '../lib/businessCoach';
import styles from './BusinessCoach.module.css';

function ActionDetails({ action }: { action: CoachAction }) {
  return (
    <>
      <h3>{action.title}</h3>
      <p>{action.reason}</p>
      <ol className={styles.steps}>{action.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
      <dl className={styles.actionMeta}>
        <div><dt>Estimated cost</dt><dd>{action.estimated_cost}</dd></div>
        <div><dt>What to track</dt><dd>{action.metric}</dd></div>
      </dl>
    </>
  );
}

export default function BusinessCoach() {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<BusinessProfile>(() => ({
    ...EMPTY_PROFILE,
    goal: GOALS.find((goal) => goal === searchParams.get('goal')) ?? EMPTY_PROFILE.goal,
  }));
  const [plan, setPlan] = useState<GrowthPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const controller = useRef<AbortController | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Business Coach — CivicText';
    return () => controller.current?.abort();
  }, []);

  const update = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError('');
    setPlan(null);
    setCopyStatus('');
    const timeout = window.setTimeout(() => request.abort('timeout'), 60_000);
    try {
      const next = await generateGrowthPlan(profile, request.signal);
      if (request.signal.aborted) return;
      setPlan(next);
      window.requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (failure) {
      if (!request.signal.aborted || request.signal.reason === 'timeout') {
        setError(request.signal.aborted ? 'Your plan took too long. Please try again.' : failure instanceof Error ? failure.message : 'Something went wrong. Please try again.');
      }
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === request) setLoading(false);
    }
  }

  function download() {
    if (!plan) return;
    const url = URL.createObjectURL(new Blob([planAsText(plan)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'civictext-growth-plan.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyCaption() {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(`${plan.marketing_copy.caption}\n\n${plan.marketing_copy.call_to_action}`);
      setCopyStatus('Caption copied.');
    } catch {
      setCopyStatus('Select the caption to copy it, or download your plan.');
    }
  }

  return (
    <section className={styles.section}>
      <div className="container">
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Your AI Business Coach</p>
          <h1>Your next move starts here.</h1>
          <p className={styles.lead}>Turn what&rsquo;s holding your business back into a practical plan for better sales, smarter marketing, and easier days.</p>
          <div className={styles.highlights}><span>Built around your business</span><span>Ideas for your budget</span><span>A clear 30-day plan</span></div>
        </header>

        <div className={styles.workspace}>
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.formHeading}><div><p className={styles.eyebrow}>01 / The starting point</p><h2>Tell us about your business</h2></div></div>
            <p className={styles.hint}>A few details help your coach give useful, specific ideas. Required fields are marked *.</p>
            <fieldset disabled={loading} className={styles.fields}>
              <label>Business name <span className={styles.optional}>(optional)</span><input maxLength={100} value={profile.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="e.g. Petal & Stem" autoComplete="organization" /></label>
              <label>What does your business do? *<textarea required minLength={20} maxLength={2000} rows={3} value={profile.description} onChange={(e) => update('description', e.target.value)} placeholder="What do you sell or offer? How do customers buy from you?" /></label>
              <label>Who are your customers? *<textarea required minLength={5} maxLength={500} rows={2} value={profile.customers} onChange={(e) => update('customers', e.target.value)} placeholder="e.g. Local families, office workers, or online shoppers" /></label>
              <div className={styles.formRow}>
                <label>Location <span className={styles.optional}>(optional)</span><input maxLength={200} value={profile.location} onChange={(e) => update('location', e.target.value)} placeholder="City, region, or online" /></label>
                <label>Monthly growth budget (USD)<input type="number" min="0" max="1000000" step="1" value={profile.monthly_budget_usd ?? ''} onChange={(e) => update('monthly_budget_usd', e.target.value === '' ? null : Number(e.target.value))} placeholder="0 for free ideas" /><span className={styles.hint}>Optional. What you can spend on improvements.</span></label>
              </div>
              <label>What would you most like to improve? *<select value={profile.goal} onChange={(e) => update('goal', e.target.value as BusinessProfile['goal'])}>{GOALS.map((goal) => <option key={goal}>{goal}</option>)}</select></label>
              <fieldset className={styles.channelGroup}><legend>How do customers find you?</legend><p className={styles.hint}>Optional. Select all that apply.</p><div className={styles.channels}>{CHANNELS.map((channel) => <label key={channel} className={styles.channel}><input type="checkbox" checked={profile.channels.includes(channel)} onChange={(e) => update('channels', e.target.checked ? [...profile.channels, channel] : profile.channels.filter((item) => item !== channel))} /><span>{channel}</span></label>)}</div></fieldset>
              <label>What&rsquo;s getting in the way? <span className={styles.optional}>(optional)</span><textarea maxLength={1000} rows={3} value={profile.challenges} onChange={(e) => update('challenges', e.target.value)} placeholder="e.g. Quiet weekdays, few repeat customers, or not enough time to post online" /></label>
              <p className={styles.privacy}>Your details are sent to Google Gemini to create your plan. Avoid private customer information or confidential business data. Google may use free-tier submissions to improve its products.</p>
              <button className={styles.primary} type="submit">{loading ? 'Creating your plan…' : 'Build my growth plan'} <span aria-hidden="true">&rarr;</span></button>
              <button className={styles.example} type="button" onClick={() => { setProfile({ ...EXAMPLE_PROFILE, channels: [...EXAMPLE_PROFILE.channels] }); setError(''); }}>Try example details</button>
            </fieldset>
            {error && <p className={styles.error} role="alert">{error} Your details are still here.</p>}
          </form>

          <div className={styles.results} aria-busy={loading}>
            {loading && <div className={styles.empty} role="status"><span className={styles.spinner} aria-hidden="true" /><p className={styles.eyebrow}>Connecting the dots</p><h2>Finding your next opportunities.</h2><p>We&rsquo;re putting together ideas around your customers, goals, and budget. This can take about a minute.</p></div>}
            {!loading && !plan && <div className={styles.empty}>
              <div className={styles.growthIcon} aria-hidden="true"><svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 36V13M8 36h33M15 28l9-10 7 5 10-13M32 10h9v9" /></svg></div>
              <p className={styles.eyebrow}>02 / Your way forward</p><h2>Small steps. Room to grow.</h2><p>Your plan will appear here, with practical things to try and clear ways to see what&rsquo;s working.</p>
              <ul className={styles.previewList}><li><strong>A quick win for today</strong><span>One useful change to get moving.</span></li><li><strong>Sales, marketing &amp; operations ideas</strong><span>Specific actions that fit your business.</span></li><li><strong>Your next 30 days</strong><span>A weekly focus and something to measure.</span></li><li><strong>A marketing draft</strong><span>A starting point you can make your own.</span></li></ul>
            </div>}
            {plan && <>
              <div className={styles.resultHeader}><div><p className={styles.eyebrow}>02 / Your way forward</p><h2 ref={resultHeading} tabIndex={-1}>Your 30-day growth plan</h2></div><button className={styles.secondary} type="button" onClick={download}>Download plan &darr;</button></div>
              <p className={styles.summary}>{plan.summary}</p>
              <article className={styles.quickWin}><p className={styles.eyebrow}>Start today</p><ActionDetails action={plan.quick_win} /></article>
              <div className={styles.recommendations}>{plan.recommendations.map((action, i) => <article className={styles.card} key={i}><span className={styles.badge}>{action.category}</span><ActionDetails action={action} /></article>)}</div>
              <section className={styles.card} aria-labelledby="weekly-plan"><p className={styles.eyebrow}>Make it happen</p><h2 id="weekly-plan">One week at a time.</h2><ol className={styles.timeline}>{plan.weekly_plan.map((week) => <li key={week.week}><span className={styles.week}>Week {week.week}</span><div><p>{week.action}</p><p className={styles.hint}>Track: {week.measure}</p></div></li>)}</ol></section>
              <section className={styles.marketing} aria-labelledby="marketing-draft"><p className={styles.eyebrow}>Words to get you started / {plan.marketing_copy.channel}</p><h2 id="marketing-draft">Make it yours, then share it.</h2><p className={styles.caption}>{plan.marketing_copy.caption}</p><p className={styles.callToAction}>{plan.marketing_copy.call_to_action}</p><button className={styles.secondary} type="button" onClick={copyCaption}>Copy caption</button><p className={styles.hint} role="status">{copyStatus}</p><p className={styles.hint}>Review the wording and replace any placeholders before posting.</p></section>
              <details className={styles.notes}><summary>Assumptions &amp; questions to explore</summary><h3>What this plan assumes</h3><ul>{plan.assumptions.map((item, i) => <li key={i}>{item}</li>)}</ul><h3>Helpful next questions</h3><ul>{plan.follow_up_questions.map((item, i) => <li key={i}>{item}</li>)}</ul></details>
              <p className={styles.disclaimer}>AI-generated ideas to help you experiment. Review what fits your business; costs are estimates and results aren&rsquo;t guaranteed. Your plan stays on this page until you leave or refresh. Download it to keep a copy.</p>
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}
