import { useEffect } from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';

export default function Home() {
  useEffect(() => {
    document.title = 'CivicText - Find grants through Telegram';
  }, []);

  return (
    <>
      <Hero />
      <HowItWorks />
    </>
  );
}
