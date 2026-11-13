import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTelegramBotUrl } from '../lib/platform';
import styles from './Demo.module.css';

export default function Demo() {
  const botUrl = getTelegramBotUrl();

  useEffect(() => {
    document.title = 'Open CivicText on Telegram';
  }, []);

  return (
    <section className={styles.section}>
      <div className={`container ${styles.content}`}>
        <div className={styles.intro}>
          <div className={styles.copy}>
            <p className={styles.kicker}>CivicText on Telegram</p>
            <h1 className={styles.title}>Tell the bot what your business needs.</h1>
            <p className={styles.lead}>
              Describe your business or community project and what you need funding
              for. The backend searches its current grant catalog and sends matching
              grant details back in Telegram.
            </p>

            <a className={styles.action} href={botUrl} target="_blank" rel="noopener noreferrer">
              Open CivicText on Telegram <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <figure className={styles.qrCard}>
            <img
              className={styles.qrImage}
              src="/civictext-telegram-qr.png"
              alt="QR code for opening CivicText's @CivicS123_bot on Telegram"
            />
            <figcaption className={styles.qrCaption}>
              <strong>Scan to open the bot</strong>
              <span>Find us on Telegram at @CivicS123_bot</span>
              <a className={styles.qrLink} href={botUrl} target="_blank" rel="noopener noreferrer">
                Or open the bot on Telegram <span aria-hidden="true">&rarr;</span>
              </a>
            </figcaption>
          </figure>
        </div>

        <div className={styles.details}>
          <article className={styles.card}>
            <h2>What to include</h2>
            <p>
              Your state, what your business or project does, and what you need
              funding for can help narrow the search.
            </p>
          </article>
          <article className={styles.card}>
            <h2>What you&rsquo;ll get</h2>
            <p>
              When a match is found, the bot shares the grant title, amount,
              deadline, eligibility information, and application link from its
              current catalog.
            </p>
          </article>
        </div>

        <p className={styles.privacy}>
          Your message is processed by the grant-finding backend and sent to
          Google Gemini to understand the request. Don&rsquo;t include sensitive
          personal information. Always confirm eligibility and deadlines with
          the funder. The backend catalog is still being prepared and may
          include fictional sample grants.
        </p>

        <p className={styles.sampleLink}>
          Want to browse the site&rsquo;s separate sample catalog?{' '}
          <Link to="/grants">View fictional sample listings</Link>.
        </p>
      </div>
    </section>
  );
}
