import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';

interface Props {
  /** Element to render, e.g. "li" or "section". Defaults to a div. */
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Extra delay in milliseconds, handy for staggering siblings. */
  delay?: number;
  style?: CSSProperties;
  id?: string;
}

/**
 * Fades and lifts its children into view the first time they scroll on screen.
 * Styling lives in the global .reveal / .is-visible rules in index.css,
 * which also disable the motion for users who prefer reduced motion.
 */
export default function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  delay = 0,
  style,
  id,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  // Without IntersectionObserver support, show the content immediately.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vars = { ...style, '--reveal-delay': `${delay}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={vars}
    >
      {children}
    </Tag>
  );
}
