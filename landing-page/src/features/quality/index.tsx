/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, ShieldCheck, Microscope, TestTube2, Scale, ClipboardList } from 'lucide-react';

const TESTING_STEPS = [
  {
    icon: <CheckCircle2 className="w-5 h-5 text-brand-accent-light" />,
    title: 'Incoming Assay Testing',
    desc: 'All bulk ingredients are verified for chemical purity before formulation manufacturing starts.'
  },
  {
    icon: <Microscope className="w-5 h-5 text-brand-accent-light" />,
    title: 'In-Process Quality Audits',
    desc: 'Frequent batch extraction to verify tableting humidity, active distribution, and weight tolerances.'
  },
  {
    icon: <TestTube2 className="w-5 h-5 text-brand-accent-light" />,
    title: 'HPLC Stability Controls',
    desc: 'High-Performance Liquid Chromatography audits that ensure stability across dry shelf-lives.'
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-brand-accent-light" />,
    title: 'Final Batch Clearance',
    desc: 'Each physical drug item carries locked digital batches authenticated by qualified QA managers.'
  }
] as const;

export default function QualityView() {

  return (
    <div 
      className="w-full bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('/bg-quality.png')" }}
    >
      <div className="w-full bg-[#030712]/75 backdrop-blur-md">
      
      {/* Banner */}
      <section className="relative bg-[#020617]/50 backdrop-blur-[1px] text-white py-18 md:py-24 px-4 text-center overflow-hidden border-b border-white/10">
        {/* Soft abstract glows removed */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-block text-[10px] font-bold text-brand-accent-light bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Zero-Defect Mandates
          </div>
          <h1 className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
            Quality Assurance & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-light via-brand-accent to-emerald-400">Auditing</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-light">
            Our guiding mandate is zero compromise. We run continuous chemical assay testing, chromatograph curves, and micro-checks.
          </p>
        </div>
      </section>

      {/* Main visual and principles block */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center font-sans">
          
          <div className="relative group w-full">
            <div className="relative rounded-tl-[5rem] rounded-br-[5rem] rounded-tr-[2rem] rounded-bl-[2rem] overflow-hidden shadow-2xl bg-gradient-to-br from-brand-accent/25 to-brand-secondary/25 p-[1px] hover:scale-[1.01] transition-transform duration-500">
              <img
                src="/qulity.png"
                alt="HPLC testing and chromatography in clinical laboratory"
                className="w-full h-[360px] object-cover rounded-tl-[5rem] rounded-br-[5rem] rounded-tr-[2rem] rounded-bl-[2rem] filter brightness-95 group-hover:brightness-100 transition-all duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">Our Mandate</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight leading-tight">
              Zero-Defect Quality Standards
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              We understand that every tablet or injectable we market is a direct guardian of patient health. That is why we ensure all our formulation processes maintain strict compliance with global standards and quality guidelines.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex gap-4 p-5 rounded-2xl glass-card border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-accent-light shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase font-sans">Regulatory Verification</h4>
                  <p className="text-xs text-slate-400 mt-1 sm:mt-1.5 leading-relaxed font-light">Continuous audits ensure our manufacturing and cleanroom facilities adhere strictly to regulatory parameters and particulate thresholds.</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl glass-card border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-accent-light shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase font-sans">Absolute Bio-Availability</h4>
                  <p className="text-xs text-slate-400 mt-1 sm:mt-1.5 leading-relaxed font-light">We conduct rigorous dissolution study grids under simulated gastrointestinal and bloodstream liquids.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4 Steps grid list */}
      <section className="py-24 bg-[#0b1329]/30 backdrop-blur-md border-t border-white/10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block font-sans">Screening Protocol</span>
            <h2 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">Four-Tier Quality Controls</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-light font-sans">
              From physical raw compounds to post-sale feedback tracking, we integrate scientific audits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTING_STEPS.map((step, idx) => (
              <div key={idx} className="glass-card p-7 border border-white/10 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase font-sans">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>
      </div>
    </div>
  );
}
