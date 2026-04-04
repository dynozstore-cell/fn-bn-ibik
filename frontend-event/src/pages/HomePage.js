import React from 'react';
import NavbarCustom from '../components/Navbar';
import CarouselBanner from '../components/CarouselBanner';
import EventCarousel from '../components/EventCarousel';
import StatsSection from '../components/StatsSection';
import EventSection from '../components/EventSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="homepage">
      <NavbarCustom />
      <CarouselBanner />
      <EventCarousel />
      <StatsSection />
      <EventSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default HomePage;
