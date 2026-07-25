/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Hash, Sparkles, FileText, HeartHandshake, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { THERAPEUTIC_SEGMENTS } from '@/src/core/constants/data';
import { ProductItem, PageKey } from '@/src/core/types';
import { useAppDispatch, useAppSelector, getProducts, setSelectedSegmentId, setSearchQuery } from '@/src/core/store';
import { CATALOG_CONFIG, SURGICAL_SUBCATEGORIES } from '@/src/core/config/catalogConfig';

interface ProductsViewProps {
  onGetInTouch: (subject?: string, message?: string) => void;
  onPageChange: (page: PageKey) => void;
}

export default function ProductsView({
  onGetInTouch,
  onPageChange
}: ProductsViewProps) {

  const dispatch = useAppDispatch();
  const selectedSegmentId = useAppSelector((state) => state.products.selectedSegmentId);
  const searchQuery = useAppSelector((state) => state.products.searchQuery);
  const products = useAppSelector((state) => state.products.items);
  const isLoading = useAppSelector((state) => state.products.loading);

  const [selectedSurgicalSubcategoryId, setSelectedSurgicalSubcategoryId] = useState<string>('all');
  const [dosageFilter, setDosageFilter] = useState<string>('All');
  const [isDosageDropdownOpen, setIsDosageDropdownOpen] = useState(false);
  const [isSegmentsExpanded, setIsSegmentsExpanded] = useState(false);
  const [inquiredProduct, setInquiredProduct] = useState<ProductItem | null>(null);

  const inquiryModalRef = useRef<HTMLDivElement>(null);
  const modalCloseBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (inquiredProduct) {
      lastActiveElementRef.current = document.activeElement as HTMLElement;
      timerId = setTimeout(() => {
        modalCloseBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setInquiredProduct(null);
        } else if (e.key === 'Tab' && inquiryModalRef.current) {
          const focusableElements = inquiryModalRef.current.querySelectorAll(
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
        if (lastActiveElementRef.current) {
          lastActiveElementRef.current.focus();
        }
      };
    }
  }, [inquiredProduct]);

  // Fetch products dynamically with cache fallback
  useEffect(() => {
    getProducts(dispatch);
  }, [dispatch]);

  // Base products filtered by CATALOG_CONFIG mode
  const baseProducts = useMemo(() => {
    if (CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES) {
      return products.filter(p => p.segmentId === CATALOG_CONFIG.TARGET_SEGMENT_ID);
    }
    return products;
  }, [products]);

  // Available dosage forms dynamically computed from base products list
  const dosageForms = useMemo(() => {
    const forms = new Set(baseProducts.map(p => p.dosageForm).filter(Boolean));
    return ['All', ...Array.from(forms).sort()];
  }, [baseProducts]);

  // Limit category list size and allow expanding it (Full Catalog Mode)
  const visibleSegments = useMemo(() => {
    return isSegmentsExpanded ? THERAPEUTIC_SEGMENTS : THERAPEUTIC_SEGMENTS.slice(0, 6);
  }, [isSegmentsExpanded]);

  // Match and filter the catalog items
  const filteredProducts = useMemo(() => {
    return baseProducts.filter((product: ProductItem) => {
      // 1. Category / Subcategory Filter
      let matchesCategory = true;
      if (CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES) {
        const subcategoryDef = SURGICAL_SUBCATEGORIES.find(s => s.id === selectedSurgicalSubcategoryId);
        if (subcategoryDef) {
          matchesCategory = subcategoryDef.match(product);
        }
      } else {
        matchesCategory = selectedSegmentId === 'all' || product.segmentId === selectedSegmentId;
      }

      // 2. Search Query (matches formula name, active compound, indications)
      const matchesSearch =
        !searchQuery ||
        (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.composition || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.indications || '').toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Dosage Filter
      const matchesDosage = dosageFilter === 'All' || product.dosageForm === dosageFilter;

      return matchesCategory && matchesSearch && matchesDosage;
    });
  }, [baseProducts, selectedSegmentId, selectedSurgicalSubcategoryId, searchQuery, dosageFilter]);

  const activeSegmentData = useMemo(() => {
    return THERAPEUTIC_SEGMENTS.find(s => s.id === selectedSegmentId);
  }, [selectedSegmentId]);

  return (
    <div 
      className="w-full bg-cover bg-fixed bg-center min-h-screen"
      style={{ backgroundImage: "url('/bg-products.png')" }}
    >
      <div className="w-full bg-[#030712]/75 backdrop-blur-md min-h-screen">

      {/* Page banner */}
      <section className="relative bg-[#020617]/50 backdrop-blur-[1px] text-white py-18 md:py-24 px-4 text-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-block text-[10px] font-bold text-brand-accent-light bg-white/5 border border-white/10 px-3.5 py-1 rounded-full uppercase tracking-wider">
            {CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES 
              ? CATALOG_CONFIG.HERO_BADGE_SURGICALS 
              : CATALOG_CONFIG.HERO_BADGE_FULL}
          </div>
          {CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES ? (
            <h1 className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
              Surgical & Medical <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-light via-brand-accent to-emerald-400">Consumables</span>
            </h1>
          ) : (
            <h1 className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
              Our Pharmaceutical <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-light via-brand-accent to-emerald-400">Catalog</span>
            </h1>
          )}
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-light">
            {CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES 
              ? CATALOG_CONFIG.HERO_SUBTITLE_SURGICALS 
              : CATALOG_CONFIG.HERO_SUBTITLE_FULL}
          </p>

          {CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {CATALOG_CONFIG.SURGICAL_TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main product exploration frame */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Left Sidebar filters - static on Desktop, stacked on mobile */}
          <div className="space-y-6 text-left">

            {/* Category / Segment Selector */}
            <div className="glass-card p-6 rounded-[2rem] border border-white/10 shadow-sm space-y-5">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3.5 font-sans">
                <Filter className="w-4 h-4 text-brand-accent-light" />
                <span>
                  {CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES 
                    ? 'Consumable Categories' 
                    : 'Therapy Segments'}
                </span>
              </h3>
              <div className="space-y-1.5 font-sans">
                {CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES ? (
                  SURGICAL_SUBCATEGORIES.map((sub) => {
                    const count = baseProducts.filter(p => sub.match(p)).length;
                    const isActive = selectedSurgicalSubcategoryId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSurgicalSubcategoryId(sub.id)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex justify-between items-center cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-brand-accent to-brand-secondary text-white shadow-md shadow-brand-accent/10'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            isActive
                              ? 'bg-[#020617] text-white'
                              : 'bg-white/5 text-slate-300 border border-white/10'
                          }`}
                        >
                          {isLoading ? '...' : count}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <>
                    <button
                      onClick={() => dispatch(setSelectedSegmentId('all'))}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex justify-between items-center cursor-pointer ${
                        selectedSegmentId === 'all'
                          ? 'bg-gradient-to-r from-brand-accent to-brand-secondary text-white shadow-md shadow-brand-accent/10'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>All Segments</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          selectedSegmentId === 'all'
                            ? 'bg-[#020617] text-white'
                            : 'bg-white/5 text-slate-300 border border-white/10'
                        }`}
                      >
                        {isLoading ? '...' : products.length}
                      </span>
                    </button>

                    {visibleSegments.map((seg) => {
                      const count = products.filter(p => p.segmentId === seg.id).length;
                      const isActive = selectedSegmentId === seg.id;
                      return (
                        <button
                          key={seg.id}
                          onClick={() => dispatch(setSelectedSegmentId(seg.id))}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex justify-between items-center cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-brand-accent to-brand-secondary text-white shadow-md shadow-brand-accent/10'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{seg.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              isActive
                                ? 'bg-[#020617] text-white'
                                : 'bg-white/5 text-slate-300 border border-white/10'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {THERAPEUTIC_SEGMENTS.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setIsSegmentsExpanded(!isSegmentsExpanded)}
                        className="w-full mt-3 text-center text-[10px] font-bold text-brand-accent-light hover:text-white transition-colors cursor-pointer pt-2.5 border-t border-white/10 flex items-center justify-center gap-1 uppercase tracking-wider"
                      >
                        <span>
                          {isSegmentsExpanded
                            ? 'Show Less'
                            : `Show More (+${THERAPEUTIC_SEGMENTS.length - 6})`}
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isSegmentsExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Dosage format filter */}
            <div className="glass-card p-6 rounded-[2rem] border border-white/10 shadow-sm space-y-4 relative z-10 overflow-visible">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-3 font-sans">
                Dosage Form
              </h3>
              <div className="relative font-sans pt-1">
                <button
                  type="button"
                  onClick={() => setIsDosageDropdownOpen(!isDosageDropdownOpen)}
                  className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 text-slate-200 text-xs font-semibold py-3 px-4 pr-10 rounded-xl transition-all cursor-pointer flex justify-between items-center select-none"
                >
                  <span>{dosageFilter === 'All' ? 'All Dosage Formats' : dosageFilter}</span>
                  <svg className={`w-4 h-4 text-brand-accent-light transition-transform duration-200 ${isDosageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDosageDropdownOpen && (
                  <>
                    <div 
                      role="presentation"
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsDosageDropdownOpen(false)} 
                    />
                    <div className="absolute left-0 right-0 mt-2 bg-[#0b1329] border border-white/15 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto pr-1 py-1 custom-scrollbar">
                      {dosageForms.map((form) => {
                        const isSelected = dosageFilter === form;
                        return (
                          <button
                            key={form}
                            type="button"
                            onClick={() => {
                              setDosageFilter(form);
                              setIsDosageDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex justify-between items-center cursor-pointer ${isSelected
                                ? 'bg-gradient-to-r from-brand-accent to-brand-secondary text-white font-bold'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                              }`}
                          >
                            <span>{form === 'All' ? 'All Dosage Formats' : form}</span>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contact Promo Block */}
            <div className="bg-gradient-to-br from-brand-accent/20 to-brand-secondary/20 backdrop-blur-md p-7 rounded-[2rem] shadow-xl text-left relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent-light/10 rounded-full translate-x-5 -translate-y-5" />
              <div className="relative z-10 space-y-4">
                <span className="inline-block text-[9px] font-bold text-brand-accent-light bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Custom Dosages</span>
                <h4 className="font-bold text-sm text-slate-100 tracking-tight leading-snug">Need a Custom Strength Formulation?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  We handle dynamic contract manufacturing and customized formulation packaging models at our automated chemical plant.
                </p>
                <button
                  onClick={() => onGetInTouch()}
                  className="w-full bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white text-xs font-bold py-2.5 px-4 rounded-xl block text-center transition-colors shadow-lg shadow-brand-accent/10 cursor-pointer focus:outline-none uppercase tracking-wider"
                >
                  Inquire For Bulk Supply
                </button>
              </div>
            </div>

          </div>

          {/* Right Main Catalog Body */}
          <div className="lg:col-span-3 space-y-6">

            {/* Search Ribbon */}
            <div className="glass-card p-5 rounded-[2rem] border border-white/10 shadow-sm flex flex-col sm:flex-row gap-4 items-center font-sans">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Brand, Formulation Compound, or Indication..."
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  aria-label="Search by brand, compound, or indication"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent-light focus:bg-white/10 transition-all font-light"
                />
              </div>
              <div className="flex gap-3 items-center justify-between sm:justify-end w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-white/10 pt-3.5 sm:pt-0">
                {/* Reset filters trigger if anything active */}
                {(searchQuery || selectedSegmentId !== 'all' || selectedSurgicalSubcategoryId !== 'all' || dosageFilter !== 'All') && (
                  <button
                    onClick={() => {
                      dispatch(setSearchQuery(''));
                      dispatch(setSelectedSegmentId('all'));
                      setSelectedSurgicalSubcategoryId('all');
                      setDosageFilter('All');
                    }}
                    className="text-xs text-brand-accent-light hover:text-white font-semibold flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
                <span className="text-[11px] text-brand-accent-light font-semibold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  Showing <b>{filteredProducts.length}</b> matches
                </span>
              </div>
            </div>

            {/* Display Category / Subcategory Title details dynamically */}
            {CATALOG_CONFIG.SHOW_ONLY_SURGICALS_CONSUMABLES ? (
              selectedSurgicalSubcategoryId !== 'all' && (
                <div className="relative overflow-hidden bg-brand-accent/10 border border-white/10 p-6 rounded-[2rem] text-left space-y-1 my-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full translate-x-10 -translate-y-10" />
                  <h2 className="text-brand-accent-light text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-brand-accent-light" />
                    <span>Sub-Category Focus: {SURGICAL_SUBCATEGORIES.find(s => s.id === selectedSurgicalSubcategoryId)?.name}</span>
                  </h2>
                  <p className="text-slate-300 text-xs leading-relaxed font-light">
                    Showing clinical disposables and medical supplies under {SURGICAL_SUBCATEGORIES.find(s => s.id === selectedSurgicalSubcategoryId)?.name}.
                  </p>
                </div>
              )
            ) : (
              activeSegmentData && (
                <div className="relative overflow-hidden bg-brand-accent/10 border border-white/10 p-6 rounded-[2rem] text-left space-y-1 my-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full translate-x-10 -translate-y-10" />
                  <h2 className="text-brand-accent-light text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-brand-accent-light" />
                    <span>Category Focus: {activeSegmentData.name}</span>
                  </h2>
                  <p className="text-slate-300 text-xs leading-relaxed font-light">{activeSegmentData.description}</p>
                </div>
              )
            )}

            {/* Catalog Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-sans" id="products-loading-skeleton">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card rounded-[2.2rem] border border-white/10 shadow-sm p-7 flex flex-col justify-between space-y-5 animate-pulse">
                    <div className="space-y-4">
                      {/* Name & format badge skeleton */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="h-6 bg-white/10 rounded w-2/3" />
                        <div className="h-6 bg-white/5 rounded-full w-16 border border-white/10" />
                      </div>
                      {/* Composition skeleton */}
                      <div className="space-y-2">
                        <div className="h-3 bg-white/10 rounded w-1/4" />
                        <div className="h-12 bg-white/5 rounded-xl border border-white/10" />
                      </div>
                      {/* Strength & Packaging skeleton */}
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <div className="h-3 bg-white/10 rounded w-1/3" />
                          <div className="h-4 bg-white/10 rounded w-1/2" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-3 bg-white/10 rounded w-1/3" />
                          <div className="h-4 bg-white/10 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="h-10 bg-white/5 rounded-xl border border-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-sans">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="glass-card rounded-[2.2rem] border border-white/10 shadow-sm p-7 flex flex-col justify-between hover:shadow-2xl hover:border-brand-accent-light/50 hover:-translate-y-1 transition-all duration-350 space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Name & format badge */}
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-white text-[16px] sm:text-[17px] font-bold tracking-tight leading-snug">
                          {product.name}
                        </h4>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 bg-white/5 text-brand-accent-light border-white/10">
                          {product.dosageForm}
                        </span>
                      </div>

                      {/* Composition */}
                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-bold text-brand-accent-light uppercase tracking-widest">Active Formulation</span>
                        <p className="text-slate-200 text-xs font-semibold leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                          {product.composition}
                        </p>
                      </div>

                      {/* Strengths & Packaging specs */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Strength</span>
                          <span className="font-semibold text-white block mt-1">{product.strength}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Packaging Unit</span>
                          <span className="font-semibold text-white block mt-1">{product.packaging}</span>
                        </div>
                      </div>

                      {/* Indications */}
                      {product.indications && 
                       !product.indications.toLowerCase().includes('consult a healthcare professional') && (
                        <div className="space-y-1.5 pt-4 border-t border-white/10 font-sans">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-brand-accent-light" />
                            <span>Indications</span>
                          </span>
                          <p className="text-slate-300 text-xs leading-relaxed font-light">
                            {product.indications}
                          </p>
                        </div>
                      )}

                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setInquiredProduct(product)}
                        className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-brand-accent-light/50 text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
                      >
                        <HeartHandshake className="w-4 h-4 text-brand-accent-light" />
                        <span>Request Analytical Sheet</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card border border-white/10 rounded-3xl p-12 sm:p-16 text-center space-y-4 font-sans">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-400 mx-auto border border-white/10">
                  <Hash className="w-7 h-7" />
                </div>
                <h3 className="text-white font-bold text-lg">No Pharmaceutical Formulations Match</h3>
                <p className="text-slate-400 max-w-sm mx-auto text-xs leading-relaxed font-light">
                  Try clearing your search filters, adjusting the therapy segment choices, or altering the dosage parameters.
                </p>
                <button
                  onClick={() => {
                    dispatch(setSearchQuery(''));
                    dispatch(setSelectedSegmentId('all'));
                    setSelectedSurgicalSubcategoryId('all');
                    setDosageFilter('All');
                  }}
                  className="bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-all inline-block cursor-pointer shadow-lg shadow-brand-accent/10"
                >
                  Reset Catalog view
                </button>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── INQUIRY TERMS AGREEMENT MODAL ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {inquiredProduct && (
            <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
              {/* Backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setInquiredProduct(null)}
                className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm"
                aria-hidden="true"
              />

              <div className="flex min-h-screen items-center justify-center p-4 font-sans text-left relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-accent/10 rounded-full blur-[80px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-brand-accent-light/5 rounded-full blur-[60px] pointer-events-none z-0" />

                <motion.div
                  ref={inquiryModalRef}
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 180 }}
                  className="relative z-10 backdrop-blur-3xl bg-[#020617]/75 max-w-md w-full rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/10 p-7 sm:p-9 space-y-7"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-white text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Inquiry Acknowledgment
                      </h3>
                      <p className="text-xs text-slate-400 font-light tracking-wide">
                        Confirm commercial supply guidelines
                      </p>
                    </div>
                    <button
                      ref={modalCloseBtnRef}
                      onClick={() => setInquiredProduct(null)}
                      className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95 border border-transparent hover:border-white/10"
                      aria-label="Close dialog"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Details - Premium Card */}
                  <div className="relative bg-gradient-to-br from-white/[0.03] to-transparent p-6 rounded-[1.5rem] border border-white/5 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-bold text-brand-accent-light uppercase tracking-widest">Target Formulation</span>
                      <span className="text-[10px] bg-brand-accent/25 text-brand-accent-light px-2.5 py-0.5 rounded-full border border-brand-accent/40 font-semibold">{inquiredProduct.dosageForm}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-lg tracking-tight leading-snug">{inquiredProduct.name}</h4>
                      <p className="text-xs text-slate-400 leading-normal font-light">
                        <span className="text-slate-500 font-medium">Composition:</span> {inquiredProduct.composition}
                      </p>
                    </div>
                  </div>

                  {/* Guidelines - Sleek Glass Info Block */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-brand-accent/10 to-transparent p-6 rounded-[1.5rem] border border-white/5 flex gap-4">
                    {/* Left Neon Stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-brand-accent-light to-brand-accent" />
                    
                    <AlertTriangle className="w-5 h-5 text-brand-accent-light shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">Commercial Guidelines</h5>
                      <p className="text-xs text-slate-350 leading-relaxed font-light">
                        Wholesale orders operate under standard policies: <span className="text-white font-medium">100% advance payment</span> and <span className="text-white font-medium">batch-specific MOQs</span>.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        setInquiredProduct(null);
                        onPageChange('terms');
                      }}
                      className="w-full sm:order-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold py-3.5 rounded-full transition-all cursor-pointer text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:scale-[1.02] active:scale-[0.98] tracking-wider"
                    >
                      Read Terms
                    </button>
                    <button
                      onClick={() => {
                        const p = inquiredProduct;
                        setInquiredProduct(null);
                        onGetInTouch(
                          `Requesting Analytical Sheet for ${p.name}`,
                          `Dear Demo Team,\n\nWe would like to request the Analytical Sheet / Certificate of Analysis (CoA) and product dossiers for ${p.name} (Composition: ${p.composition}, Strength: ${p.strength}).\n\nPlease let us know the availability and clinical test document sets.\n\nBest regards,`
                        );
                      }}
                      className="w-full sm:order-1 bg-gradient-to-r from-brand-accent-light via-brand-accent to-brand-secondary hover:from-white hover:to-white hover:text-black text-white text-xs font-bold py-3.5 rounded-full transition-all duration-300 cursor-pointer text-center shadow-[0_8px_30px_-4px_rgba(35,213,255,0.3)] hover:scale-[1.02] active:scale-[0.98] tracking-wider"
                    >
                      Agree &amp; Proceed
                    </button>
                  </div>

                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      </div>
    </div>
  );
}
