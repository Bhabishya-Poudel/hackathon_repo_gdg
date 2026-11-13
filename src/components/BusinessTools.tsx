import { Link } from 'react-router-dom';
import type { BusinessProfile } from '../lib/businessCoach';
import Reveal from './Reveal';
import styles from './BusinessTools.module.css';

const tools: { goal: BusinessProfile['goal']; title: string; description: string; detail: string; action: string; icon: string; tone: string }[] = [
  { goal: 'More sales', title: 'Bring in more sales.', description: 'Find practical ways to turn interest into orders and make the most of what you already offer.', detail: 'Offers, buying experience & follow-ups', action: 'Get sales ideas', icon: '↗', tone: styles.peach },
  { goal: 'Better marketing', title: 'Get the word out.', description: 'Choose useful channels, sharpen your message, and get a marketing draft you can make your own.', detail: 'Content, visibility & messaging', action: 'Get marketing ideas', icon: '◎', tone: styles.rose },
  { goal: 'Repeat customers', title: 'Give people a reason to return.', description: 'Explore simple ways to stay in touch, improve the experience, and build lasting customer relationships.', detail: 'Loyalty, reminders & customer care', action: 'Build customer loyalty', icon: '↺', tone: styles.sage },
  { goal: 'Smoother operations', title: 'Make the day run better.', description: 'Look for small improvements that save time and help you spend more of it on the work that matters.', detail: 'Routines, planning & everyday processes', action: 'Improve daily operations', icon: '≋', tone: styles.plum },
];

export default function BusinessTools() {
  return (
    <section className={styles.section} id="business-tools" aria-labelledby="business-tools-title">
      <div className="container">
        <Reveal className={styles.heading}><div><p className={styles.eyebrow}>Business improvement</p><h2 id="business-tools-title">Build a stronger business, too.</h2></div><p>Alongside finding funding, explore practical ways to improve your sales, marketing, customer relationships, and operations.</p></Reveal>
        <div className={styles.tools}>{tools.map((tool, i) => <Reveal key={tool.goal} delay={i * 70}><Link to={`/business-coach?goal=${encodeURIComponent(tool.goal)}`} className={styles.tool}><span className={`${styles.icon} ${tool.tone}`} aria-hidden="true">{tool.icon}</span><h3>{tool.title}</h3><p>{tool.description}</p><span className={styles.detail}>{tool.detail}</span><span className={styles.toolLink}>{tool.action} <span aria-hidden="true">↗</span></span></Link></Reveal>)}</div>
      </div>
    </section>
  );
}

export function FundingCallout() {
  return (
    <section className={styles.fundingSection} aria-labelledby="funding-title">
      <div className="container"><Reveal className={styles.funding}>
        <div className={styles.fundingCopy}><p className={styles.eyebrow}>Grant discovery</p><h2 id="funding-title">Find grants for your next step.</h2><p>Explore grant opportunities for your business or community project. Tell our Telegram bot what you need, or get familiar with the sample listings.</p><div className={styles.fundingActions}><Link to="/demo" className={styles.fundingPrimary}>Find grants on Telegram <span aria-hidden="true">&rarr;</span></Link><Link to="/grants" className={styles.fundingSecondary}>Browse sample listings <span aria-hidden="true">↗</span></Link></div></div>
        <div className={styles.fundingDetails}><span className={styles.fundingIcon} aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V11M12 11C12 6 8 4 4 4c0 5 3 8 8 7zM12 15c0-4 3-7 8-7 0 4-3 7-8 7z" /></svg></span><h3>Know what to look for.</h3><ul><li>Funding amounts &amp; deadlines</li><li>Eligibility &amp; requirements</li><li>Application links from the catalog</li></ul><p>The catalog is in development and may include fictional samples. Always check details with the funder.</p></div>
      </Reveal></div>
    </section>
  );
}
