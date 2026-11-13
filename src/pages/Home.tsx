import { useEffect } from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import BusinessTools, { FundingCallout } from '../components/BusinessTools';

export default function Home() {
  useEffect(() => {
    document.title = 'CivicText — Find grants & improve your business';
  }, []);

  return (
    <>
      <Hero />
      <FundingCallout />
      <BusinessTools />
      <HowItWorks />
    </>
  );
}
