import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { useNavigate } from 'react-router-dom';

import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingTrustBar from '../components/landing/LandingTrustBar';
import LandingReportIssue from '../components/landing/LandingReportIssue';
import LandingTransparency from '../components/landing/LandingTransparency';
import LandingRoles from '../components/landing/LandingRoles';
import LandingOwner from '../components/landing/LandingOwner';
import LandingCitizenControl from '../components/landing/LandingCitizenControl';
import LandingMetrics from '../components/landing/LandingMetrics';
import LandingTestimonials from '../components/landing/LandingTestimonials';
import LandingBottomCTA from '../components/landing/LandingBottomCTA';
import LandingFooter from '../components/landing/LandingFooter';
import Auth from '../components/Auth';

import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

export default function LandingPage({ initialMode = 'landing' }) {
  const [view, setView] = useState(initialMode);
  const navigate = useNavigate();
  const { role } = useAuth();

  // On mount, sync Supabase data in the background
  useEffect(() => {
    complaintService.syncFromSupabase().catch((err) => {
      console.warn('Initial Supabase sync notice:', err);
    });
  }, []);

  useEffect(() => {
    setView(initialMode);
  }, [initialMode]);

  // Smooth Lenis scrolling
  useEffect(() => {
    if (view !== 'landing') return;

    const lenisInstance = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    let rafId;
    function raf(time) {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      lenisInstance.destroy();
      cancelAnimationFrame(rafId);
    };
  }, [view]);

  // Smooth scroll handler
  const handleScrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auth view for Login, Register & Reset Password
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

  // Full Landing Page
  return (
    <div className="rx-landing-page">
      <LandingNavbar
        setView={setView}
        onScrollToSection={handleScrollToSection}
      />
      <main>
        <LandingHero setView={setView} />
        <LandingTrustBar />
        <LandingReportIssue />
        <LandingTransparency />
        <LandingRoles setView={setView} />
        <LandingOwner />
        <LandingCitizenControl />
        <LandingMetrics />
        <LandingTestimonials />
        <LandingBottomCTA setView={setView} />
      </main>
      <LandingFooter setView={setView} onScrollToSection={handleScrollToSection} />
    </div>
  );
}
