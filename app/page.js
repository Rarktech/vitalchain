import Nav from '@/components/landing/Nav';
import Hero from '@/components/landing/Hero';
import Demo from '@/components/landing/Demo';
import { Pillars, Numbers, EntityModel, Problem, Verify, Compare, Stack, FinalCTA, Footer } from '@/components/landing/Sections';

export const metadata = {
  title: 'VitalChain — Your health data. Your AI. Your chain.',
  description: 'A web3-native health intelligence platform where every reading is an entity on the Arkiv blockchain — owned by your wallet.',
};

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Demo />
        <Pillars />
        <Numbers />
        <EntityModel />
        <Problem />
        <Verify />
        <Compare />
        <Stack />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
