/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, HeartHandshake, CheckCircle2 } from 'lucide-react';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';


// --- Performance Optimization: Lazy Load ALL views to flatten network waterfall ---
// This prevents the deep chain: main.tsx → App.tsx → HomeView → ThreeMoleculeCanvas → three.js
// from blocking LCP. The browser can now download these in parallel after initial paint.
const HomeView = lazy(() => import('./features/home'));
const AboutView = lazy(() => import('./features/about'));
const ProductsView = lazy(() => import('./features/products'));
const PartnerView = lazy(() => import('./features/partner'));

const QualityView = lazy(() => import('./features/quality'));
const ContactView = lazy(() => import('./features/contact'));
const TermsView = lazy(() => import('./features/terms'));

const ViewLoader = () => (
  <div className="w-full min-h-[50vh] flex flex-col items-center justify-center space-y-4 bg-[#030712]" id="view-loader">
    <img 
      src="/Medical App.svg" 
      alt="Loading Animation" 
      className="w-32 h-32 select-none object-contain" 
    />
    <span className="text-[10px] font-bold tracking-widest text-brand-accent-light uppercase animate-pulse">
      Loading...
    </span>
  </div>
);

import { PageKey } from '@/src/core/types';
import MetaSEO from './components/layout/MetaSEO';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import {
  useAppDispatch,
  useAppSelector,
  setCurrentPage,
  showToast,
  hideToast,
  setSelectedSegmentId,
  setActiveNews,
  getPageFromPath,
} from './core/store';

const seoData: Record<PageKey, { title: string; description: string; keywords: string; schema?: Record<string, any> }> = {
  home: {
    title: "Demo Pharma — Better Medicine For A Better Tomorrow",
    description: "Demo Pharma is a leading pharmaceutical company delivering high-quality, affordable and innovative medicines across cardiovascular, anti-infective, neurocare, and pain management therapeutic areas.",
    keywords: "Demo Pharma, pharmaceutical manufacturer, generic medicines, cardiovascular drug formulations, anti-infective formulations, pain relief medicines",
    schema: {
      "@context": "https://schema.org",
      "@type": "MedicalOrganization",
      "name": "Demo Pharma",
      "alternateName": "Demo",
      "url": "https://Demopharma.com/",
      "logo": "https://Demopharma.com/logo_Demo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-78610-70183",
        "contactType": "customer service",
        "areaServed": "IN",
        "availableLanguage": "en"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "410, STC (Shivam Trade Center), Ambli",
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat",
        "postalCode": "380058",
        "addressCountry": "IN"
      }
    }
  },
  about: {
    title: "About Us — Demo Pharma Legacy & Guiding Pillars",
    description: "Discover the history, clinical philosophy, and corporate pathways that drive Demo Pharma to heal and sustain life daily since 2004.",
    keywords: "about Demo Pharma, pharmaceutical history, clinical philosophy, quality standards",
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Us - Demo Pharma",
      "description": "Discover the legacy and guiding principles of Demo Pharma, delivering healthcare excellence since 2004.",
      "url": "https://Demopharma.com/about"
    }
  },
  products: {
    title: "Formulation Catalog — Demo Specialty Products",
    description: "Explore the verified pharmaceutical formulation archives of Demo. Browse generic tablet, capsule, and sterile injectables.",
    keywords: "generic medicine catalog, Cefuroxime 500, Atorvastatin tablets, NSAIDs analgesics, medical supply India",
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": "https://Demopharma.com/products#collection",
      "name": "Pharmaceutical Formulation Catalog - Demo",
      "description": "Comprehensive list of anti-infectives, cardiovascular, pain management, and neurocare formulations.",
      "url": "https://Demopharma.com/products"
    }
  },
  partner: {
    title: "Partner With Us — Demo Onboarding Portal",
    description: "Expand your portfolio with a globally aligned supply chain. We invite visionary Super Stockists and Regional Distributors to drive the next phase of market growth.",
    keywords: "pharma distribution network, super stockist onboarding, regional distributor registration, pharmaceutical logistics partner"
  },

  quality: {
    title: "Quality Assurance & Control Auditing — Demo Mandate",
    description: "Zero-compromise analytical screening protocols. We utilize HPLC stability controls and chromatography audits to ensure formulation purity.",
    keywords: "pharma quality control, HPLC testing, chromatography audit, bio-availability assays, zero-defect drug testing"
  },
  contact: {
    title: "Contact Us — Demo Global Support Desk",
    description: "Connect with our wholesale supply representatives, dossier request managers, or schedule a physical audit tour at our Ahmedabad facilities.",
    keywords: "contact Demo Pharma, dossier request email, wholesale pharmaceutical supply, Ahmedabad pharma company",
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is your regular logistics lead time for PAN India supply?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Standard regional orders are packaged and dispatched within 48 hours. Shipments to core Indian distribution hubs take between 3 to 5 business days."
          }
        },
        {
          "@type": "Question",
          "name": "Can we solicit analytical test certificates / drug files?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely. Registered hospital networks and licensed bulk distributors can request CoA (Certificate of Analysis) sheets and bio-equivalence dossiers via our customer support desk."
          }
        },
        {
          "@type": "Question",
          "name": "Do you offer custom contract manufacturing or packaging?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we specialize in high-capacity contract formulation. We support customized blister sizes, alu-alu foils, syringe fills, and clinical packaging parameters."
          }
        }
      ]
    }
  },
  terms: {
    title: "Terms & Conditions — Demo Pharma Commercial & Manufacturing Policies",
    description: "Official commercial Terms and Conditions for Demo Pharma covering payment policy, private labeling, pricing, logistics, and quality assurance.",
    keywords: "Demo Pharma, terms and conditions, payment policy, private labeling, pharmaceutical contract manufacturing, logistics, quality assurance"
  }
};

export default function App() {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector((state) => state.ui.currentPage);
  const toast = useAppSelector((state) => state.ui.toast);
  const activeNews = useAppSelector((state) => state.news.activeNews);

  // State for passing product context to the Contact form
  const [inquirySubject, setInquirySubject] = useState<string>('');
  const [inquiryMessage, setInquiryMessage] = useState<string>('');

  const newsModalRef = useRef<HTMLDivElement>(null);
  const newsModalCloseBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveNewsElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (activeNews) {
      lastActiveNewsElementRef.current = document.activeElement as HTMLElement;
      timerId = setTimeout(() => {
        newsModalCloseBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          dispatch(setActiveNews(null));
        } else if (e.key === 'Tab' && newsModalRef.current) {
          const focusableElements = newsModalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        if (timerId) clearTimeout(timerId);
        window.removeEventListener('keydown', handleKeyDown);
        if (lastActiveNewsElementRef.current) {
          lastActiveNewsElementRef.current.focus();
        }
      };
    }
  }, [activeNews, dispatch]);

  // 1. Native scroll progress bar (replaces Lenis rAF loop)
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        if (progressPercentRef.current) {
          const scrollY = window.scrollY;
          const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
          if (totalScrollable > 0) {
            const percent = (scrollY / totalScrollable) * 100;
            progressPercentRef.current.style.width = `${percent}%`;
          } else {
            progressPercentRef.current.style.width = '0%';
          }
        }
        rafId = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // 2. Synchronize routing state and scroll to top (path-based routing)
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      dispatch(setCurrentPage(page));
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);

    // Intercept clicks on local links (ignore modifiers, downloads, external targets)
    const handleLinkClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        const hasDownload = anchor.hasAttribute('download');
        const targetAttr = anchor.getAttribute('target');

        if (href && href.startsWith('/') && !href.startsWith('//') && !targetAttr && !hasDownload) {
          e.preventDefault();
          window.history.pushState(null, '', href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    };
    window.addEventListener('click', handleLinkClick);

    // Trigger initial check on cold load
    const initialPage = getPageFromPath(window.location.pathname);
    dispatch(setCurrentPage(initialPage));
    if (initialPage === 'products') {
      dispatch(setSelectedSegmentId('surgicals'));
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('click', handleLinkClick);
    };
  }, [dispatch]);

  const handlePageChange = (page: PageKey) => {
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState(null, '', path);
    dispatch(setCurrentPage(page));
    window.scrollTo(0, 0);
  };

  // References for high-speed scrolling metrics to bypass React state re-rendering
  const progressPercentRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToastNotification = (msg: string, type: 'success' | 'info' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    dispatch(showToast({ message: msg, type }));
    toastTimerRef.current = setTimeout(() => {
      dispatch(hideToast());
      toastTimerRef.current = null;
    }, 4500);
  };

  const handleGetInTouch = (subject?: string, message?: string) => {
    setInquirySubject(subject || '');
    setInquiryMessage(message || '');
    handlePageChange('contact');
  };

  const handleSelectSegment = (id: string) => {
    dispatch(setSelectedSegmentId(id));
  };

  // Switcher to output correct sub-screen panel
  const renderContentView = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomeView
            onPageChange={handlePageChange}
            onSelectSegment={handleSelectSegment}
            onSelectNews={(article) => dispatch(setActiveNews(article))}
          />
        );
      case 'about':
        return <AboutView />;
      case 'products':
        return (
          <ProductsView
            onGetInTouch={handleGetInTouch}
            onPageChange={handlePageChange}
          />
        );
      case 'partner':
        return <PartnerView />;
      case 'quality':
        return <QualityView />;
      case 'contact':
        return (
          <ContactView
            onFormSubmitted={() => showToastNotification('Inquiry dispatched successfully!')}
            defaultSubject={inquirySubject}
            defaultMessage={inquiryMessage}
          />
        );
      case 'terms':
        return <TermsView />;
      default:
        return (
          <HomeView
            onPageChange={handlePageChange}
            onSelectSegment={handleSelectSegment}
            onSelectNews={(article) => dispatch(setActiveNews(article))}
          />
        );
    }
  };

  const currentSeo = seoData[currentPage] || seoData.home;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#030712] antialiased text-slate-100 font-sans relative overflow-x-clip">

      {/* 0. Technical SEO Metadata Dynamic Injection */}
      <MetaSEO
        title={currentSeo.title}
        description={currentSeo.description}
        keywords={currentSeo.keywords}
        hashPath={currentPage}
        schema={currentSeo.schema}
      />

      {/* Dynamic Scroll Progress Indicator fixed at the very top of viewport */}
      <div
        className="fixed top-0 left-0 w-full h-[4px] bg-brand-accent-light/10 z-[100] pointer-events-none"
        id="scroll-progress-hud"
      >
        <div
          ref={progressPercentRef}
          className="h-full w-0 bg-gradient-to-r from-brand-accent via-brand-secondary to-brand-accent-light shadow-[0_1px_8px_rgba(35,213,255,0.85)]"
        />
      </div>

      {/* Background orbs removed to restore font smoothing */}

      {/* 1. Header with brand logos & mobile toggling support */}
      <Header
        currentPage={currentPage}
        onPageChange={(page) => {
          if (page === 'products') {
            dispatch(setSelectedSegmentId('surgicals'));
          }
          handlePageChange(page);
        }}
        onGetInTouch={handleGetInTouch}
      />

      {/* 2. Main Page Scope with clean enter fades */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <ErrorBoundary>
              <Suspense fallback={<ViewLoader />}>
                {renderContentView()}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Footer site-maps and therapeutic pointers */}
      <Footer
        onPageChange={(page) => {
          if (page === 'products') {
            dispatch(setSelectedSegmentId('surgicals'));
          }
          handlePageChange(page);
        }}
        onSelectSegment={handleSelectSegment}
      />

      {/* 4. CLINICAL REPORT DETAILS DIALOG (Modal overlay) */}
      <AnimatePresence>
        {activeNews && (
          <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Solid backdrop overlay to prevent subpixel antialiasing degradation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setActiveNews(null))}
              className="fixed inset-0 bg-brand-dark-site/80"
              aria-hidden="true"
            />

            <div className="flex min-h-screen items-center justify-center p-4 font-sans">
              <motion.div
                ref={newsModalRef}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                className="relative bg-brand-warm-light max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 text-left flex flex-col justify-between"
              >

                {/* Header graphic */}
                <div className="relative h-60 bg-[#020617]">
                  <img
                    src={activeNews.imageUrl}
                    alt={activeNews.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-brand-accent to-brand-secondary text-white text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                    {activeNews.category}
                  </div>
                  <button
                    ref={newsModalCloseBtnRef}
                    onClick={() => dispatch(setActiveNews(null))}
                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full cursor-pointer shadow-sm transition-colors focus:outline-none flex items-center justify-center"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Article body contents */}
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="text-xs text-brand-accent-light font-semibold tracking-wider">
                    Published: {activeNews.publishDate}
                  </div>
                  <h3 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
                    {activeNews.title}
                  </h3>
                  <div className="border-t border-white/10 pt-4 text-xs sm:text-sm leading-relaxed space-y-3.5">
                    <p className="font-semibold text-slate-200">{activeNews.description}</p>
                    <p className="bg-[#020617]/50 border-l-4 border-brand-accent-light p-4 rounded-r-lg text-[13px] leading-relaxed italic text-slate-300">
                      {activeNews.content || 'Active press deployment details are current. Please check our regulatory file sections for dossiers.'}
                    </p>
                  </div>
                </div>

                {/* Footer action trigger */}
                <div className="p-6 bg-[#030712]/50 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold">
                    <HeartHandshake className="w-5 h-5 text-brand-accent-light shrink-0" />
                    <span>Inquire about this announcement?</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        dispatch(setActiveNews(null));
                        handleGetInTouch();
                      }}
                      className="bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-colors cursor-pointer"
                    >
                      Inquire Supply
                    </button>
                    <button
                      onClick={() => dispatch(setActiveNews(null))}
                      className="bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. FLOATING ALERT TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-dark-site border border-brand-accent-light text-slate-50 p-4.5 rounded-xl shadow-xl flex items-center gap-3 max-w-sm w-full"
          >
            <CheckCircle2 className="w-6 h-6 text-brand-accent-light shrink-0" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Mail Dispatched</p>
              <p className="text-[11px] text-[#EAF1FF] mt-0.5">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
