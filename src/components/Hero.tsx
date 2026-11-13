import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><span aria-hidden="true" /> Grant discovery & business growth</p>
          <h1 className={styles.title}>Find funding.<br /><span>Grow your business.</span></h1>
          <p className={styles.lead}>Find grants for your business or community project, and get practical ideas to improve your sales, marketing, and daily operations. Two ways to move your business forward, in one place.</p>
          <div className={styles.actions}>
            <Link to="/demo" className={styles.primary}>Find grants <span aria-hidden="true">&rarr;</span></Link>
            <Link to="/business-coach" className={`${styles.secondary} ${styles.coachAction}`}>Improve my business <span aria-hidden="true">&rarr;</span></Link>
          </div>
          <ul className={styles.tags} aria-label="CivicText features"><li>Grant discovery</li><li>Business improvement plans</li><li>No account needed</li></ul>
          <p className={styles.fundingLink}>Prefer to browse? <Link to="/grants">Explore sample grant listings <span aria-hidden="true">&rarr;</span></Link></p>
        </div>

        <div className={styles.visual}>
          <div className={styles.plan}>
            <div className={styles.planHeader}><span className={styles.planMark} aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19V5m0 14h14M9 14l4-5 3 2 4-6M16 5h4v4" /></svg></span><div><p className={styles.planBrand}>Funding and ideas for your next step.</p><p className={styles.exampleLabel}>Example business needs · Flower shop</p></div><span className={styles.aiBadge}>CivicText</span></div>
            <div className={styles.businessBrief}><p className={styles.smallLabel}>The starting point</p><p>&ldquo;I run a flower shop. I need funding for supplies and ideas to bring in more orders.&rdquo;</p><div className={styles.briefTags}><span>Funding for supplies</span><span>More weekday sales</span></div></div>
            <div className={styles.planBody}>
              <div className={styles.planHeading}><h2>Choose where to start.</h2></div>
              <div className={styles.pathways}>
                <Link to="/demo" className={styles.pathway}><span className={`${styles.actionNumber} ${styles.sage}`} aria-hidden="true">01</span><div><p className={styles.category}>Find grants</p><h3>Discover funding opportunities.</h3><p className={styles.actionDetail}>Describe what you need on Telegram. Get available grant matches, eligibility details, and application links.</p></div><span aria-hidden="true">↗</span></Link>
                <Link to="/business-coach" className={styles.pathway}><span className={`${styles.actionNumber} ${styles.peach}`} aria-hidden="true">02</span><div><p className={styles.category}>Improve your business</p><h3>Make your next move a practical one.</h3><p className={styles.actionDetail}>Get sales, marketing, and operations ideas with a 30-day plan built around your business.</p></div><span aria-hidden="true">↗</span></Link>
              </div>
            </div>
            <div className={styles.planFooter}><span className={styles.leaf} aria-hidden="true">✧</span><p>One business. One step at a time.</p><span aria-hidden="true">↗</span></div>
          </div>
          <p className={styles.exampleNote}>Grant searches happen on Telegram. Business plans are created here on the website.</p>
        </div>
      </div>
    </section>
  );
}
