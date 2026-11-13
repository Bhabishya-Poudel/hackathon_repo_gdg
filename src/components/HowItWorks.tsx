import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import styles from './HowItWorks.module.css';

const paths = [
  {
    title: 'Find grants',
    description: 'Look for funding through our Telegram grant finder.',
    steps: [
      { title: 'Describe your funding need', body: 'Open the Telegram bot and share what your business or project does, where you are, and what you need funding for.' },
      { title: 'Explore available matches', body: 'The bot searches its grant catalog and shares available programs, amounts, deadlines, and eligibility details.' },
      { title: 'Review and apply', body: 'Follow the application links and confirm requirements with the funder. The catalog is in development and may include samples.' },
    ],
    href: '/demo', action: 'Start finding grants',
  },
  {
    title: 'Improve your business',
    description: 'Build a practical improvement plan here on the website.',
    steps: [
      { title: 'Tell us about your business', body: 'Share what you offer, who your customers are, and what is getting in the way.' },
      { title: 'Choose your priority', body: 'Pick a goal for sales, marketing, customer retention, or operations and share your budget.' },
      { title: 'Try your next steps', body: 'Get a quick win, a 30-day action plan, and a marketing draft. Review and adapt the AI suggestions to your business.' },
    ],
    href: '/business-coach', action: 'Get business improvement ideas',
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className="container">
        <Reveal><p className={styles.eyebrow}>Funding and practical next steps</p><h2 className={styles.heading}>Two ways to move forward.</h2><p className={styles.intro}>Find opportunities to fund your work, or explore ways to improve it.</p></Reveal>
        <div className={styles.paths}>{paths.map((path) => <Reveal key={path.href} className={styles.path}><h3>{path.title}</h3><p className={styles.pathDescription}>{path.description}</p><ol className={styles.pathSteps}>{path.steps.map((step) => <li key={step.title}><h4>{step.title}</h4><p>{step.body}</p></li>)}</ol><Link className={styles.pathAction} to={path.href}>{path.action} <span aria-hidden="true">→</span></Link></Reveal>)}</div>
      </div>
    </section>
  );
}
