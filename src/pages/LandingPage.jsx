import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { useNavigate } from 'react-router-dom';

// Import Landing Page Components
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Problem from '../components/Problem';
import Solution from '../components/Solution';
import Workflow from '../components/Workflow';
import Features from '../components/Features';
import DashboardShowcase from '../components/DashboardShowcase';
import Stats from '../components/Stats';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import Auth from '../components/Auth';

export default function LandingPage() {
  const [view, setView] = useState('landing');
  const navigate = useNavigate();

  useEffect(() => {
    if (view !== 'landing') return;

    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleHeroScroll = () => {
      const hero = document.getElementById('hero');
      if (hero) {
        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        const opacity = Math.max(0, 1 - (scrollY / (vh * 0.75)));
        hero.style.opacity = opacity;
      }
    };
    window.addEventListener('scroll', handleHeroScroll);

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));

    return () => {
      lenisInstance.destroy();
      observer.disconnect();
      window.removeEventListener('scroll', handleHeroScroll);
    };
  }, [view]);

  if (view === 'login' || view === 'signup') {
    return (
      <Auth 
        initialView={view} 
        onBackToHome={() => setView('landing')} 
        onSuccess={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <>
      <Navbar setView={setView} />
      <main>
        <Hero setView={setView} />
        <Problem />
        <Solution />
        <Workflow />
        <Features />
        <DashboardShowcase />
        <Stats />
        <Testimonials />
        <CTA setView={setView} />
      </main>
      <Footer />
    </>
  );
}
