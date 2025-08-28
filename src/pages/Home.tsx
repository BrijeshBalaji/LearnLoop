import React from 'react';
import { HeroSection } from '../components/Home/HeroSection';
import { HowItWorks } from '../components/Home/HowItWorks';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
    </div>
  );
};