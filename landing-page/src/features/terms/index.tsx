/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Tag, 
  Coins, 
  Truck, 
  ShieldCheck, 
  FileText,
  HelpCircle
} from 'lucide-react';

interface Clause {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

interface TermSection {
  readonly id: string;
  readonly badge: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: React.ReactNode;
  readonly clauses: readonly Clause[];
}

const TERM_SECTIONS: readonly TermSection[] = [
  {
    id: 'payment',
    badge: '01',
    title: 'Payment & Finance',
    subtitle: 'Advance payment model & credit guidelines',
    icon: <CreditCard className="w-5 h-5" />,
    clauses: [
      {
        id: 'payment-1',
        title: '100% Advance Payment Model',
        description: "All commercial orders operate strictly on an advance payment model. Production cycles, raw material procurement, and product packaging will only commence once 100% of the total proforma invoice amount is cleared and credited to the Company's designated bank account."
      },
      {
        id: 'payment-2',
        title: 'No Credit Extensions',
        description: 'To maintain manufacturing efficiency, competitive pricing, and a smooth supply chain, the Company does not offer credit lines, post-dated check terms, or letters of credit unless formally agreed upon in writing for international trade.'
      },
      {
        id: 'payment-3',
        title: 'Transaction Charges Coverage',
        description: 'Any bank transfer fees, currency conversion fees, or intermediate routing charges are to be borne entirely by the Buyer.'
      }
    ]
  },
  {
    id: 'manufacturing',
    badge: '02',
    title: 'Private Labeling',
    subtitle: 'Contract manufacturing & regulatory compliance',
    icon: <Tag className="w-5 h-5" />,
    clauses: [
      {
        id: 'mfg-1',
        title: 'Custom Brand Customization',
        description: "The Company specializes in contract manufacturing and can manufacture products under the Buyer's proprietary brand name, trademark, or logo, subject to compliance with local and international drug regulations."
      },
      {
        id: 'mfg-2',
        title: 'Intellectual Property & Approvals',
        description: 'The Buyer warrants that they legally own or have the explicit right to use the brand names and trademarks submitted for manufacturing. The Buyer must provide all necessary brand artwork, trademark certificates, and design specifications.'
      },
      {
        id: 'mfg-3',
        title: 'Regulatory Compliance & Support',
        description: 'For private label manufacturing, the Buyer is responsible for obtaining any required marketing authorizations, brand registrations, or region-specific health ministry permissions. The Company will provide standard manufacturing documents (COA, dossiers) to support this process.'
      },
      {
        id: 'mfg-4',
        title: 'Minimum Order Quantities (MOQs)',
        description: 'Private label and third-party branded products are subject to batch-specific MOQs depending on the formulation, packaging type (blisters, strips, bottles, or injectables), and active pharmaceutical ingredients (APIs).'
      }
    ]
  },
  {
    id: 'pricing',
    badge: '03',
    title: 'Pricing Structure',
    subtitle: 'Formulation costs, quotations & taxes',
    icon: <Coins className="w-5 h-5" />,
    clauses: [
      {
        id: 'price-1',
        title: 'Product-Specific Variable Pricing',
        description: 'Pricing is variable and differs significantly from one product to another. Charges are calculated based on the cost of active ingredients, specific formulations, batch volumes, and specialized packaging requirements.'
      },
      {
        id: 'price-2',
        title: 'Price Quotation Validity',
        description: "All prices quoted in the Company's official rate list or Proforma Invoice are valid only for the timeframe specified in the quotation. Prices may change without prior notice due to fluctuations in global API costs, raw materials, or government regulatory pricing updates."
      },
      {
        id: 'price-3',
        title: 'Taxes, Levies & Customs Duties',
        description: 'Unless explicitly stated otherwise, product prices are exclusive of Goods and Services Tax (GST), export/import duties, customs clearance charges, and local levies. These will be added to the final invoice as applicable.'
      }
    ]
  },
  {
    id: 'logistics',
    badge: '04',
    title: 'Logistics & Delivery',
    subtitle: 'Incoterms, lead times & transit risks',
    icon: <Truck className="w-5 h-5" />,
    clauses: [
      {
        id: 'ship-1',
        title: 'Delivery Basis (Ex-Works / FOB)',
        description: 'All shipments are processed on an Ex-Works (EXW) or Free on Board (FOB) basis unless a different shipping arrangement is formally detailed in the commercial contract.'
      },
      {
        id: 'ship-2',
        title: 'Estimated Production Lead Times',
        description: 'Estimated production and dispatch timelines begin only after the advance payment is fully cleared and the private label artwork is approved by the Buyer. The Company is not liable for operational delays caused by shipping carrier bottlenecks, customs clearances, or transit disruptions.'
      },
      {
        id: 'ship-3',
        title: 'Transit Risk & Insurance Coverage',
        description: "Risk of loss or damage transfers entirely to the Buyer once the consignment leaves the Company's manufacturing unit or warehouse facility. Insurance coverage during transit is the sole responsibility of the Buyer."
      }
    ]
  },
  {
    id: 'quality',
    badge: '05',
    title: 'Quality & Returns',
    subtitle: 'GMP compliance, defect claims & policies',
    icon: <ShieldCheck className="w-5 h-5" />,
    clauses: [
      {
        id: 'qa-1',
        title: 'Strict Quality Standards (cGMP)',
        description: 'All products are manufactured under strict adherence to current Good Manufacturing Practices (cGMP) and regulatory quality baselines. Every batch undergoes rigorous quality testing before release.'
      },
      {
        id: 'qa-2',
        title: 'Non-Returnable Custom Batches',
        description: 'Because private label products are uniquely branded for the Buyer, custom-manufactured batches cannot be cancelled, returned, or exchanged once production has officially begun.'
      },
      {
        id: 'qa-3',
        title: 'Defect Claims & Timeline',
        description: 'Any claims regarding manufacturing defects, short-supplies, or deviations from the Certificate of Analysis (COA) must be filed in writing within 7 business days of cargo receipt, accompanied by verified laboratory test reports.'
      }
    ]
  }
];

export default function TermsView() {
  const [activeSectionId, setActiveSectionId] = useState(TERM_SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Monitor scroll to update active sidebar section in real-time
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-15% 0px -65% 0px',
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const headerOffset = 90;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - headerOffset,
        behavior: 'smooth'
      });
      setActiveSectionId(id);
    }
  };

  return (
    <div 
      className="w-full bg-cover bg-fixed bg-center min-h-screen"
      style={{ backgroundImage: "url('/bg-partner.png')" }}
    >
      <div className="w-full bg-[#030712]/85 backdrop-blur-md min-h-screen pb-24 relative">
      
      {/* Hero Header */}
      <section className="relative bg-[#020617]/50 backdrop-blur-[1px] text-white py-16 md:py-20 px-4 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-brand-secondary/10 to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-left">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight leading-tight">
              Terms &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-light via-brand-accent to-emerald-400">Conditions</span>
            </h1>
            <p className="text-slate-350 text-sm md:text-base font-light leading-relaxed max-w-2xl">
              Please review the commercial and manufacturing terms governing orders, private label contracts, and logistics operations with Demo Pharma.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* LEFT COLUMN: Navigation Sidebar */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
            
            {/* Desktop Sidebar menu */}
            <div className="hidden lg:block glass-panel border border-white/10 rounded-2xl p-4 space-y-1 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-2">Sections</span>
              {TERM_SECTIONS.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all group cursor-pointer focus:outline-none ${
                      isActive 
                        ? 'bg-gradient-to-r from-brand-accent to-brand-secondary text-white shadow-md' 
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-white/10 text-white' : 'bg-white/5 text-brand-accent-light group-hover:bg-white/10'
                    }`}>
                      {sec.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block truncate">{sec.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile Horizontal Pill Scroll Navigation */}
            <div className="block lg:hidden flex gap-2 overflow-x-auto pb-2 select-none no-scrollbar">
              {TERM_SECTIONS.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border focus:outline-none cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-brand-accent to-brand-secondary text-white border-brand-primary shadow-sm' 
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {sec.icon}
                    <span>{sec.title}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Help Callout */}
            <div className="hidden lg:flex gap-3.5 p-4.5 bg-[#0b1329]/30 backdrop-blur-md border border-white/10 rounded-2xl text-left">
              <div className="w-8 h-8 rounded-lg bg-white/5 shadow-sm flex items-center justify-center text-brand-accent-light shrink-0 border border-white/10">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-tight">Need help?</h4>
                <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                  For wholesale accounts, regulatory dossier requests, or custom dispatch schedules, please contact our support desk.
                </p>
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN: Document Clause Content */}
          <main className="lg:col-span-3 space-y-12 text-left">
            
            {TERM_SECTIONS.map((section) => (
              <div
                key={section.id}
                id={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
                className="scroll-mt-24 space-y-5"
              >
                
                {/* Section Title Header */}
                <div className="border-b border-white/10 pb-2.5">
                  <h2 className="text-base sm:text-lg font-bold font-sans text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="text-brand-accent-light shrink-0">{section.badge}</span>
                    <span>{section.title}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">{section.subtitle}</p>
                </div>

                {/* Clauses list - Fully expanded for ideal UX */}
                <div className="space-y-6">
                  {section.clauses.map((clause) => (
                    <div
                      key={clause.id}
                      className="glass-card border border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow font-sans space-y-3"
                    >
                      <h3 className="text-sm font-bold text-white tracking-wide border-l-3 border-brand-accent-light pl-3">
                        {clause.title}
                      </h3>
                      <p className="text-slate-300 text-sm md:text-base leading-relaxed font-light pl-4">
                        {clause.description}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            ))}

            {/* Support Callout Banner */}
            <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#020617]/80 via-[#0c225a]/60 to-[#030712]/80 border border-white/10 rounded-3xl text-center sm:text-left sm:flex sm:items-center sm:justify-between shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              <div className="space-y-1.5 max-w-lg relative z-10">
                <h3 className="text-white font-bold text-base tracking-tight">Require further support?</h3>
                <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                  We supply dossiers, analytical certificates, and customized packaging solutions for registered distributors and hospital networks.
                </p>
              </div>

              <div className="relative z-10 mt-4 sm:mt-0 shrink-0">
                <a
                  href="/contact"
                  className="inline-block bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-98"
                >
                  Contact Legal Desk
                </a>
              </div>
            </div>

          </main>
          
        </div>
      </div>
      </div>
    </div>
  );
}
