/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Beaker,
  Building2,
  Users,
  Check,
  ArrowRight,
  Shield,
  Heart,
  Activity,
  Layers,
  Brain,
  Sparkles
} from 'lucide-react';
import { PageKey, NewsArticle, FeatureBlock, TherapeuticSegment } from '@/src/core/types';

const ThreeMoleculeCanvas = lazy(() => import('@/src/components/canvas/ThreeMoleculeCanvas'));
import {
  CORPORATE_INFO,
  FEATURE_BLOCKS,
  THERAPEUTIC_SEGMENTS,
  NEWS_ARTICLES
} from '@/src/core/constants/data';
import { useAppDispatch, useAppSelector, getNews } from '@/src/core/store';

interface HomeViewProps {
  onPageChange: (page: PageKey) => void;
  onSelectSegment: (segmentId: string) => void;
  onSelectNews: (article: NewsArticle) => void;
}

/// Icon mapper helper
const mapIconToLucide = (name: string, sizeClass = "w-6 h-6 text-brand-accent") => {
  switch (name) {
    case 'Award': return <Award className={sizeClass} />;
    case 'Beaker': return <Beaker className={sizeClass} />;
    case 'Building2': return <Building2 className={sizeClass} />;
    case 'Users': return <Users className={sizeClass} />;

    default: return <Award className={sizeClass} />;
  }
};

const getIconBackground = (id: string) => {
  switch (id) {
    case 'anti_infective':
      return 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/35 text-emerald-400';
    case 'cardiovascular':
      return 'bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/15 group-hover:border-rose-500/35 text-rose-400';
    case 'pain_management':
      return 'bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/15 group-hover:border-amber-500/35 text-amber-400';
    case 'gastrointestinal':
      return 'bg-teal-500/10 border-teal-500/20 group-hover:bg-teal-500/15 group-hover:border-teal-500/35 text-teal-400';
    case 'neurocare':
      return 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/15 group-hover:border-cyan-500/35 text-cyan-400';
    case 'dermocosmetics':
      return 'bg-pink-500/10 border-pink-500/20 group-hover:bg-pink-500/15 group-hover:border-pink-500/35 text-pink-400';
    default:
      return 'bg-brand-accent-light/10 border-brand-accent-light/20 text-brand-accent-light';
  }
};

const renderSegmentIcon = (id: string) => {
  const sizeClass = "w-6 h-6 transition-transform duration-500 group-hover:scale-110";
  switch (id) {
    case 'anti_infective':
      return <Shield className={sizeClass} />;
    case 'cardiovascular':
      return <Heart className={sizeClass} />;
    case 'pain_management':
      return <Activity className={sizeClass} />;
    case 'gastrointestinal':
      return <Layers className={sizeClass} />;
    case 'neurocare':
      return <Brain className={sizeClass} />;
    case 'dermocosmetics':
      return <Sparkles className={sizeClass} />;
    default:
      return <Beaker className={sizeClass} />;
  }
};

export default function HomeView({ onPageChange, onSelectSegment, onSelectNews }: HomeViewProps) {
  const dispatch = useAppDispatch();
  const news = useAppSelector((state) => state.news.items);
  const isLoadingNews = useAppSelector((state) => state.news.loading);

  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    getNews(dispatch);
  }, [dispatch]);

  const handleSegmentClick = (segmentId: string) => {
    onSelectSegment(segmentId);
    onPageChange('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAllProductsClick = () => {
    onSelectSegment('all');
    onPageChange('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80 } }
  } as const;

  const handleFeatureClick = (id: string) => {
    if (id === 'f1') {
      onPageChange('quality');
    } else {
      onPageChange('about');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="w-full bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('/bg-home.png')" }}
    >
      <div className="w-full bg-[#030712]/75 backdrop-blur-md">

        {/* 1. HERO SECTION (Clinical Background & Overlap Banner) */}
        <section className="relative bg-[#020617]/50 backdrop-blur-[1px] text-white min-h-[calc(100vh-4rem)] flex items-center py-12 md:py-16 overflow-hidden border-b border-white/10">
          {/* Fullscreen 3D Canvas Background (only visible on desktop to prevent mobile overlapping text issues) */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
            {isDesktop && (
              <Suspense fallback={<div className="absolute inset-0 bg-[#020617]/95" />}>
                <ThreeMoleculeCanvas />
              </Suspense>
            )}
          </div>

          {/* Deep tech abstract glows */}
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-brand-accent-light/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
          <div className="absolute top-0 left-1/3 w-full h-full bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:16px_16px] -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pointer-events-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Hero Left Content Text details */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="lg:col-span-7 space-y-6 text-left pointer-events-auto"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-secondary/20 border border-brand-accent/30 text-brand-accent-light text-xs font-semibold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-brand-accent-light animate-pulse" />
                  <span>{CORPORATE_INFO.subTagline}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-sans font-bold tracking-tight leading-[1.15] text-white">
                  Designing Medicine <br className="hidden sm:inline" />
                  For A <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#23D5FF] via-[#4F46E5] to-[#D946EF]">Brighter Tomorrow</span>
                </h1>

                <p className="text-slate-350 text-xs sm:text-base leading-relaxed max-w-xl font-light">
                  <span className="hidden sm:inline">
                    {CORPORATE_INFO.aboutBrief} Demo’s pioneering bio-equivalent assays and sterile containment guarantee unmatched formulation purity and cellular efficiency.
                  </span>
                  <span className="sm:hidden">
                    Demo’s pioneering bio-equivalent assays and sterile containment guarantee unmatched formulation purity.
                  </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-3 w-full sm:w-auto">
                  <button
                    onClick={handleAllProductsClick}
                    className="w-full sm:w-auto justify-center bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white font-semibold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all focus:outline-none flex items-center gap-2 group shadow-xl shadow-brand-accent/20 cursor-pointer"
                  >
                    Explore Formulation Catalog
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </button>
                  <button
                    onClick={() => onPageChange('about')}
                    className="w-full sm:w-auto justify-center bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 font-semibold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all focus:outline-none cursor-pointer"
                  >
                    Our Philosophy
                  </button>
                </div>

                {/* Mobile-only Map element: inline below the buttons */}
                <div className="lg:hidden w-full h-[380px] mt-8 relative overflow-hidden rounded-3xl bg-[#0b1329]/30 border border-white/5 shadow-2xl">
                  {!isDesktop && (
                    <Suspense fallback={null}>
                      <ThreeMoleculeCanvas />
                    </Suspense>
                  )}
                </div>
              </motion.div>

              {/* Empty Right Column spacer to keep DNA layout visible and interactive */}
              <div className="hidden lg:block lg:col-span-5 h-[350px] md:h-[420px] lg:h-[480px] pointer-events-none" />

            </div>
          </div>
        </section>

        {/* 2. OVERLAPPING FEATURE BLOCKS */}
        <section className="relative z-20 px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {FEATURE_BLOCKS.map((item: FeatureBlock) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  onClick={() => handleFeatureClick(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFeatureClick(item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Learn more about ${item.title}`}
                  className="glass-card rounded-[2rem] rounded-tl-[3.5rem] rounded-br-[3.5rem] shadow-xl hover:shadow-2xl transition-all duration-300 p-6.5 border border-white/10 text-left flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-light/50"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5.5 group-hover:bg-brand-accent transition-colors duration-300">
                      {mapIconToLucide(item.icon, "w-6 h-6 text-brand-accent-light group-hover:text-white transition-colors")}
                    </div>
                    <h3 className="text-white text-lg font-bold mb-3 tracking-tight group-hover:text-brand-accent-light transition-colors uppercase text-[15px]">{item.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-light">{item.description}</p>
                  </div>
                  <div className="mt-6 pt-3.5 border-t border-white/10 text-[10px] font-bold text-brand-accent-light uppercase tracking-widest flex items-center gap-1.5 cursor-pointer select-none group-hover:text-white">
                    <span>Learn More</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 3. ABOUT US OVERVIEW SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left: Laboratory R&D visual */}
            <div className="lg:col-span-5 relative group w-full pb-4">
              <div className="relative rounded-tl-[5rem] rounded-br-[5rem] rounded-tr-[2rem] rounded-bl-[2rem] overflow-hidden shadow-2xl bg-gradient-to-br from-brand-accent/25 to-brand-secondary/25 p-[1px] hover:scale-[1.01] transition-transform duration-500">
                <img
                  src="/homepage.png"
                  alt="Demo Pharma analytical research laboratory"
                  className="w-full h-[410px] object-cover rounded-tl-[5rem] rounded-br-[5rem] rounded-tr-[2rem] rounded-bl-[2rem] filter brightness-95 group-hover:brightness-100 transition-all duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* Right: Bullet explanations */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-block text-[11px] font-bold text-brand-accent-light bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">About Us</div>
              <h2 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight leading-tight">
                A Global Driver For Patient Health & Purity
              </h2>
              <p className="text-sm sm:text-base text-slate-305 leading-relaxed font-light">
                Demo Pharma is an integrated research-led pharmaceutical developer. Operating under a strict zero-compromise clinical framework, we supply critical life-saving anti-infectives, cardiovascular formulations, and pain-management therapeutic setups.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-left">
                <li className="flex gap-2.5 items-start text-xs font-medium text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-brand-accent-light" />
                  </div>
                  <span>Advanced quality & safety standards</span>
                </li>
                <li className="flex gap-2.5 items-start text-xs font-medium text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-brand-accent-light" />
                  </div>
                  <span>Wide range of specialty formulations</span>
                </li>
                <li className="flex gap-2.5 items-start text-xs font-medium text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-brand-accent-light" />
                  </div>
                  <span>Strong supply networks in PAN India</span>
                </li>
                <li className="flex gap-2.5 items-start text-xs font-medium text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-brand-accent-light" />
                  </div>
                  <span>Distinguished clinical scientific group</span>
                </li>
              </ul>

              <div className="pt-4">
                <button
                  onClick={() => onPageChange('about')}
                  className="bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white font-semibold py-3.5 px-7 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-brand-primary/10 flex items-center gap-2 cursor-pointer"
                >
                  Our Scientific Integrity
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="py-24 bg-[#0b1329]/30 backdrop-blur-md border-y border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">

            <div className="flex flex-col items-center space-y-4">
              <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">Therapeutic Solutions</span>
              <h2 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight relative pb-3.5 inline-block">
                Therapeutic Divisions
                <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-brand-accent to-brand-accent-light rounded-full" />
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-light">
                We manufacture and market high-efficacy formulation systems across essential cardiovascular, neurocare, and microbiological sectors.
              </p>
            </div>

            {/* Compact 3-column grid — show only 6 featured segments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {THERAPEUTIC_SEGMENTS.slice(0, 6).map((seg: TherapeuticSegment) => (
                <div
                  key={seg.id}
                  onClick={() => handleSegmentClick(seg.id)}
                  className="group glass-card border border-white/10 rounded-2xl hover:border-brand-accent-light/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center gap-4 p-3"
                >
                  {/* Modern vector icon with custom gradient glow */}
                  <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border transition-all duration-300 ${getIconBackground(seg.id)}`}>
                    {renderSegmentIcon(seg.id)}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-100 text-sm font-semibold tracking-tight group-hover:text-brand-accent-light transition-colors truncate">
                      {seg.name}
                    </h3>
                    <p className="text-slate-500 text-[11px] leading-snug mt-0.5 line-clamp-1 font-light">
                      {seg.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {seg.subcategories.slice(0, 2).map((sub, idx) => (
                        <span key={idx} className="bg-white/5 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full border border-white/5">
                          {sub}
                        </span>
                      ))}
                      {seg.subcategories.length > 2 && (
                        <span className="text-slate-500 text-[9px] px-1 py-0.5">
                          +{seg.subcategories.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-accent-light shrink-0 transition-colors" />
                </div>
              ))}
            </div>

            {/* Remaining segments count + CTA */}
            <div className="flex flex-col items-center gap-4 pt-2">
              <p className="text-slate-500 text-xs">
                +{THERAPEUTIC_SEGMENTS.length - 6} more therapeutic categories available
              </p>
              <button
                onClick={handleAllProductsClick}
                className="bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white font-bold py-3.5 px-8 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md focus:outline-none flex items-center gap-2.5 mx-auto cursor-pointer"
              >
                View All Formulations
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </motion.section>

        {/* 5.5. CUSTOMER TESTIMONIALS & REVIEWS SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="py-24 bg-transparent border-b border-white/10 text-left font-sans relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

            <div className="text-center space-y-4">
              <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">Client Trust</span>
              <h2 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">Customer Reviews</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-light">
                See how hospital networks, bulk distributors, and clinical researchers verify our formulation purity and logistical efficiency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "For our critical care and cardiovascular divisions, batch consistency is non-negotiable. Demo's formulations meet the highest therapeutic standards, backed by robust Certificate of Analysis sheets that make verification straightforward.",
                  author: "Dr. Suresh Pillai",
                  role: "Chief Medical Director",
                  org: "Apollo Hospitals Group, Chennai",
                  rating: 5,
                  initials: "SP"
                },
                {
                  quote: "Their distribution network and logistics turnaround across North India are highly reliable. Having immediate access to drug dossiers and real-time inventory updates has streamlined our stockist operations significantly.",
                  author: "Mr. Amit Sharma",
                  role: "Managing Director",
                  org: "Sharma Pharma Distributors, Delhi NCR",
                  rating: 5,
                  initials: "AS"
                },
                {
                  quote: "Demo's sterile injectables and anti-infective segments have consistently passed our stringent internal quality controls. Their transparent pricing and commitment to lead times make them a trusted supply partner.",
                  author: "Dr. Priya Nair",
                  role: "Head of Procurement & QC",
                  org: "Aster DM Healthcare, Kochi",
                  rating: 5,
                  initials: "PN"
                }
              ].map((review, i) => (
                <div key={i} className="glass-card rounded-2xl p-7 border border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Rating Stars */}
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, starIdx) => (
                        <svg key={starIdx} className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {/* Quote text */}
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light italic">
                      "{review.quote}"
                    </p>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-3.5 pt-5 mt-5 border-t border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-accent to-brand-secondary text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                      {review.initials}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xs sm:text-sm tracking-tight">{review.author}</h4>
                      <p className="text-[10px] text-slate-400 font-light mt-0.5">{review.role}, <span className="font-semibold text-brand-accent-light">{review.org}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>


      </div>
    </div>
  );
}
