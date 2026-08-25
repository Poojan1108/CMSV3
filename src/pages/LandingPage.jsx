import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { useNavigate } from 'react-router-dom';

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
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export default function LandingPage({ initialMode = 'landing' }) {
  const [view, setView] = useState(initialMode);
  const navigate = useNavigate();
  const { role } = useAuth();

  // On initial mount, trigger background sync with Supabase
  useEffect(() => {
    complaintService.syncFromSupabase().catch((err) => {
      console.warn('Initial Supabase sync notice:', err);
    });
  }, []);

  useEffect(() => {
    setView(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (view !== 'landing') return;

    const lenisInstance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    let rafId;
    function raf(time) {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document
      .querySelectorAll('.landing .reveal-on-scroll')
      .forEach((el) => observer.observe(el));

    return () => {
      lenisInstance.destroy();
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [view]);

  if (view === 'login' || view === 'signup' || view === 'forgot-password') {
    return (
      <Auth
        initialView={view}
        onBackToHome={() => {
          setView('landing');
          navigate('/');
        }}
        onSuccess={() => {
          if (role === ROLES.ADMIN) {
            navigate('/admin/dashboard');
          } else if (role === ROLES.STAFF) {
            navigate('/staff/queue');
          } else {
            navigate('/dashboard');
          }
        }}
      />
    );
  }

  return (
    <div className="landing">
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
    </div>
  );
}
