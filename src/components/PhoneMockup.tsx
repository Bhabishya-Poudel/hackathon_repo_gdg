import type { CSSProperties } from 'react';
import styles from './PhoneMockup.module.css';

export interface ChatMessage {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

interface Props {
  messages: ChatMessage[];
}

export default function PhoneMockup({ messages }: Props) {
  return (
    <div
      className={styles.phone}
      role="img"
      aria-label="Example SMS conversation with CivicText"
    >
      <div className={styles.notch} />
      <div className={styles.screen}>
        <div className={styles.statusBar}>
          <span>9:41</span>
          <span className={styles.statusIcons}>
            <i /> <i /> <b />
          </span>
        </div>

        <div className={styles.contactBar}>
          <span className={styles.back} aria-hidden="true">
            &#8249;
          </span>
          <span className={styles.avatar}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-8 1.7-8 4v2h16v-2c0-2.3-4.7-4-8-4z" />
            </svg>
          </span>
          <span className={styles.contactName}>CivicText</span>
        </div>

        <div className={styles.thread}>
          {messages.map((m, i) => (
            <p
              key={m.id}
              className={`${styles.bubble} ${m.from === 'user' ? styles.user : styles.bot}`}
              style={{ '--i': i } as CSSProperties}
            >
              {m.text}
            </p>
          ))}
        </div>

        <div className={styles.composer}>
          <span className={styles.plus}>+</span>
          <span className={styles.input}>Message</span>
          <span className={styles.mic}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12z" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
