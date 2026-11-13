import styles from './BotanicalDecor.module.css';

/** Decorative line-art leaves in the page corners, matching the reference design. */
export default function BotanicalDecor() {
  return (
    <>
      <svg
        className={`${styles.leaf} ${styles.left}`}
        viewBox="0 0 200 320"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M20 310c10-80 40-150 100-210" />
        <path d="M60 240c-30-10-50-40-55-75 35 0 65 25 55 75z" />
        <path d="M90 180c-35 0-60-25-70-60 40-5 70 20 70 60z" />
        <path d="M115 125c-30-10-45-40-45-75 35 10 55 40 45 75z" />
        <path d="M40 290c-20-20-30-50-25-80 25 15 35 45 25 80z" />
      </svg>

      <svg
        className={`${styles.leaf} ${styles.right}`}
        viewBox="0 0 220 320"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M200 10c-20 90-70 170-150 230" />
        <path d="M150 70c20-30 55-45 90-40-10 35-40 60-90 40z" />
        <path d="M120 130c25-20 60-25 95-10-20 30-55 45-95 10z" />
        <path d="M80 190c30-10 65 0 90 25-30 20-65 20-90-25z" />
        <path d="M175 35c10-20 30-30 50-30-5 25-25 40-50 30z" />
      </svg>
    </>
  );
}
