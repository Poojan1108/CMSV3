/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Beaker, 
  Heart, 
  Scale, 
  Target, 
  Eye,
  Activity,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface ValuePillar {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
}

interface BusinessVertical {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

const VALUE_PILLARS: readonly ValuePillar[] = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-brand-accent-light" />,
    title: 'Uncompromising Quality Assurance',
    description: 'Every product passing through our doors adheres to stringent global quality and safety guidelines. Our state-of-the-art facilities ensure maximum efficacy.'
  },
  {
    icon: <Beaker className="w-6 h-6 text-brand-accent-light" />,
    title: 'Innovation & Research',
    description: 'We continuously invest in R&D to optimize drug formulations, enhance therapeutic efficiency, and bring smarter medical solutions to market.'
  },
  {
    icon: <Heart className="w-6 h-6 text-brand-accent-light" />,
    title: 'Patient-Centric Approach',
    description: 'We listen to the needs of patients and care providers. Our therapeutic portfolio is continuously optimized to address real-world health challenges.'
  },
  {
    icon: <Scale className="w-6 h-6 text-brand-accent-light" />,
    title: 'Ethical Practices',
    description: 'Accountability, transparency, and integrity form the cornerstone of our corporate governance and supply-chain logistics.'
  }
] as const;

const BUSINESS_VERTICALS: readonly BusinessVertical[] = [
  {
    icon: <Activity className="w-5.5 h-5.5 text-brand-accent-light" />,
    title: 'Critical Care & Essential Medicines',
    description: 'Bulk supply and distribution of vital pharmaceutical formulations, including high-volume specialist injections, critical therapies, and chronic disease management medications.'
  },
  {
    icon: <Cpu className="w-5.5 h-5.5 text-brand-accent-light" />,
    title: 'Advanced Medical Imaging Systems',
    description: 'Sourcing, reselling, and deploying high-precision diagnostic infrastructure — such as digital mammography systems — to empower hospitals with superior screening capabilities.'
  },
  {
    icon: <Sparkles className="w-5.5 h-5.5 text-brand-accent-light" />,
    title: 'Specialized Dermatological Care',
    description: 'Development and commercialization of advanced, premium skincare formulations focused on clinical efficacy, barrier repair, and targeted skin health solutions.'
  },
  {
    icon: <Layers className="w-5.5 h-5.5 text-brand-accent-light" />,
    title: 'Surgical & Medical Consumables',
    description: 'Wide-range supply of single-use surgical disposables — IV sets, urine bags, catheters, gloves, and syringes — adhering strictly to premium international quality standards for institutional buyers.'
  }
] as const;

export default function AboutView() {
  return (
    <div 
      className="w-full bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('/bg-partner.png')" }}
    >
      <div className="w-full bg-[#030712]/85 backdrop-blur-md pb-24">
      
      {/* Banner Area */}
      <section className="relative bg-[#020617]/50 backdrop-blur-[1px] text-white py-18 md:py-24 px-4 text-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[45%] h-full bg-gradient-to-l from-brand-secondary/10 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-block text-[10px] font-bold text-brand-accent-light bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
            About Us
          </div>
          <h1 className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
            Advancing Healthcare <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-light via-brand-accent to-emerald-400 box-decoration-clone">Empowering Lives</span>
          </h1>
          <p className="text-slate-350 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light">
            Maintaining strict compliance across all production levels to deliver reliable B2B healthcare infrastructure.
          </p>
        </div>
      </section>

      {/* Intro block */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel border border-white/10 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-center text-left font-sans">
          
          <div className="flex-1 space-y-5">
            <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">
              Corporate Legacy
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
              About Demo Pharma
            </h2>
            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              <p>
                At Demo Pharma, we believe that access to high-quality healthcare is a fundamental right. As a progressive pharmaceutical company, we are dedicated to developing, manufacturing, and delivering safe, effective, and affordable medicines to meet evolving global healthcare needs.
              </p>
              <p>
                Through cutting-edge research, rigorous quality standards, and a patient-first approach, we strive to bridge the gap between scientific innovation and everyday well-being.
              </p>
            </div>
          </div>

          <div className="w-full md:w-2/5 shrink-0 relative group">
            <div className="relative rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-[1.5rem] rounded-bl-[1.5rem] overflow-hidden shadow-2xl bg-gradient-to-br from-brand-accent/20 to-brand-secondary/20 p-[1px] hover:scale-[1.02] transition-transform duration-500">
              <img
                src="/about us.png"
                alt="About Demo Pharma"
                width={500}
                height={320}
                loading="lazy"
                className="w-full h-[280px] object-cover rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-[1.5rem] rounded-bl-[1.5rem] filter brightness-95 group-hover:brightness-100 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      {/* Mission & Vision cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* Mission Card */}
          <div className="glass-card border border-white/10 rounded-tl-[3.5rem] rounded-br-[3.5rem] rounded-tr-2xl rounded-bl-2xl p-7 sm:p-8 shadow-sm flex gap-5 items-start">
            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-brand-accent-light shrink-0 mt-0.5 shadow-sm">
              <Target className="w-6 h-6 text-brand-accent-light" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-brand-accent-light uppercase tracking-wider block">Commitment</span>
              <h3 className="font-bold text-white text-base tracking-tight uppercase">Our Mission</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light pt-1">
                To improve global health outcomes by delivering reliable, high-quality pharmaceutical solutions that healthcare professionals trust and patients depend on.
              </p>
            </div>
          </div>

          {/* Vision Card */}
          <div className="glass-card border border-white/10 rounded-tr-[3.5rem] rounded-bl-[3.5rem] rounded-tl-2xl rounded-br-2xl p-7 sm:p-8 shadow-sm flex gap-5 items-start">
            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-brand-accent-light shrink-0 mt-0.5 shadow-sm">
              <Eye className="w-6 h-6 text-brand-accent-light" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-brand-accent-light uppercase tracking-wider block">Aspiration</span>
              <h3 className="font-bold text-white text-base tracking-tight uppercase">Our Vision</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light pt-1">
                To become a globally recognized leader in the pharmaceutical industry, driven by innovation, operational excellence, and an unwavering commitment to affordable and accessible healthcare.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Foundational Pillars Section */}
      <section className="py-16 bg-[#0b1329]/30 backdrop-blur-md border-y border-white/10 font-sans">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">
              What Sets Us Apart
            </span>
            <h2 className="text-2xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              Four Foundational Pillars
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-light">
              Building trust in healthcare requires uncompromising dedication. We anchor our daily operations around four core commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {VALUE_PILLARS.map((v, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-350 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shadow-inner text-brand-accent-light border border-white/10">
                    {v.icon}
                  </div>
                  <h3 className="text-white font-bold text-sm tracking-wide uppercase leading-tight">{v.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-light">{v.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Therapeutic Expertise & Business Verticals Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 font-sans text-left">
        <div className="space-y-10">
          
          <div className="space-y-3">
            <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">
              Therapeutic Expertise
            </span>
            <h2 className="text-2xl sm:text-4xl font-sans font-bold text-white tracking-tight">
              Our Business Verticals &amp; Portfolio
            </h2>
            <p className="text-slate-300 max-w-3xl text-xs sm:text-sm leading-relaxed font-light">
              At Demo Pharma, we optimize healthcare delivery by maintaining a robust, highly reliable supply chain that spans critical life-saving therapeutics, advanced medical technologies, and key global export markets. Our capabilities are strategically built around four core verticals:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {BUSINESS_VERTICALS.map((vertical, idx) => (
              <div 
                key={idx}
                className="glass-card border border-white/10 rounded-2xl p-6 shadow-sm flex gap-4.5 items-start hover:shadow-md hover:border-white/20 transition-all group"
              >
                <div className="w-11 h-11 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-brand-accent-light shrink-0 mt-0.5 group-hover:bg-brand-primary group-hover:text-white transition-all">
                  {vertical.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-white font-bold text-sm tracking-wide uppercase">
                    {vertical.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-light">
                    {vertical.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
      </div>
    </div>
  );
}
