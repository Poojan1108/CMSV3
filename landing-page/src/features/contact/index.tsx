/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent, FormEvent, useCallback } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, ChevronDown, ChevronUp, CheckCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { CORPORATE_INFO } from '@/src/core/constants/data';
import { useAppDispatch, useAppSelector, submitInquiryForm, resetInquiryStatus } from '@/src/core/store';

interface ContactViewProps {
  readonly onFormSubmitted?: () => void;
  readonly defaultSubject?: string;
  readonly defaultMessage?: string;
}

interface FaqItem {
  readonly q: string;
  readonly a: string;
}

const FAQS: readonly FaqItem[] = [
  {
    q: 'What is your regular logistics lead time for PAN India supply?',
    a: 'Standard regional orders are packaged and dispatched within 48 hours. Shipments to core Indian distribution hubs take between 3 to 5 business days.'
  },
  {
    q: 'Can we solicit analytical test certificates / drug files?',
    a: 'Absolutely. Registered hospital networks and licensed bulk distributors can request CoA (Certificate of Analysis) sheets and bio-equivalence dossiers via our customer support desk.'
  },
  {
    q: 'Do you offer custom contract manufacturing or packaging?',
    a: 'Yes, we specialize in high-capacity contract formulation. We support customized blister sizes, alu-alu foils, syringe fills, and clinical packaging parameters.'
  }
] as const;

export default function ContactView({ 
  onFormSubmitted, 
  defaultSubject = '', 
  defaultMessage = '' 
}: ContactViewProps) {
  const dispatch = useAppDispatch();
  const { loading, success, error } = useAppSelector((state) => state.inquiry);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: defaultSubject ? 'Sales' : 'General',
    subject: defaultSubject,
    message: defaultMessage
  });

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const toggleFaq = useCallback((idx: number) => {
    setOpenFaqIdx(prev => prev === idx ? null : idx);
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFormSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please compile the required Name, Email and Message blocks.');
      return;
    }
    
    submitInquiryForm(dispatch, formData).then(() => {
      if (onFormSubmitted) {
        onFormSubmitted();
      }
    }).catch(() => {
      // Managed in store error state
    });
  }, [dispatch, formData, onFormSubmitted]);

  return (
    <div 
      className="w-full bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('/bg-partner.png')" }}
    >
      <div className="w-full bg-[#030712]/85 backdrop-blur-md">
      
      {/* Banner */}
      <section className="relative bg-[#020617]/50 backdrop-blur-[1px] text-white py-18 md:py-24 px-4 text-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-block text-[10px] font-bold text-brand-accent-light bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Responsive Corporate Desk
          </div>
          <h1 className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
            Contact Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-light via-brand-accent to-emerald-400">Global Desk</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-light">
            Get in touch for contract manufacturing inquiries, bulk supply terms, careers, or dossier downloads.
          </p>
        </div>
      </section>

      {/* Main Form and contact cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-left font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left info cards */}
          <div className="lg:col-span-5 space-y-7">
            <div className="space-y-4">
              <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">Connect Directly</span>
              <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight">Demo Pharma Headquarters</h2>
              <p className="text-slate-300 text-sm leading-relaxed font-light">
                Our central customer support team coordinates wholesale supply contracts and audits. Reach out or schedule a physical facility tour.
              </p>
            </div>

            <div className="space-y-4 pt-4 font-sans">
              
              <div className="flex gap-4 p-5 rounded-[2rem] rounded-tl-[3rem] rounded-br-[3rem] glass-card border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-accent-light shrink-0 mt-0.5 border border-white/10">
                  <MapPin className="w-5.5 h-5.5" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase">Industrial Address</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5 font-light">{CORPORATE_INFO.address}</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-[2rem] rounded-tl-[3rem] rounded-br-[3rem] glass-card border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-accent-light shrink-0 mt-0.5 border border-white/10">
                  <Phone className="w-5.5 h-5.5" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase">Phone Extensions</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5 font-light">{CORPORATE_INFO.phone}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-light">Available {CORPORATE_INFO.workingHours}</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-[2rem] rounded-tl-[3rem] rounded-br-[3rem] glass-card border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-accent-light shrink-0 mt-0.5 border border-white/10">
                  <Mail className="w-5.5 h-5.5" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase">Corporate Emails</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5 font-light">{CORPORATE_INFO.email}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-light">General Support: Demopharma@gmail.com</p>
                </div>
              </div>

            </div>
          </div>

          {/* Right inquiry form */}
          <div className="lg:col-span-7 font-sans">
            <div className="glass-panel rounded-[2.5rem] lg:rounded-[3rem] border border-white/10 shadow-xl p-6 sm:p-10">
              
              {success ? (
                <div className="text-center py-12 space-y-5">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-brand-accent-light mx-auto border border-white/10">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <h3 className="text-white font-bold text-xl">Thank you for your inquiry!</h3>
                  <p className="text-slate-400 px-4 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed font-light">
                    Our compliance managers and business representatives will process your query and reply within 12 business hours.
                  </p>
                  <button
                    onClick={() => {
                      setFormData({ name: '', email: '', phone: '', department: 'General', subject: '', message: '' });
                      dispatch(resetInquiryStatus());
                    }}
                    className="bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white text-xs font-bold py-3 px-8 rounded-xl transition-colors cursor-pointer uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-2 border-b border-white/10 pb-4">
                    <h3 className="text-white text-base font-bold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-brand-accent-light" />
                      <span>Inquiry & Dossier Requests</span>
                    </h3>
                    <p className="text-slate-400 text-xs font-light">Fill out the parameters below to establish instant secure clinical mail routing.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-name" className="block text-xs font-bold text-slate-300 tracking-wide">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        id="contact-name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-light/50 focus:bg-white/10 transition-all text-white placeholder-slate-500 font-light"
                        placeholder="e.g. Dr. Ramesh Kumar"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="contact-email" className="block text-xs font-bold text-slate-300 tracking-wide">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        id="contact-email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-light/50 focus:bg-white/10 transition-all text-white placeholder-slate-500 font-light"
                        placeholder="e.g. ramesh@hospital.org"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-300 tracking-wide">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        id="contact-phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-light/50 focus:bg-white/10 transition-all text-white placeholder-slate-500 font-light"
                        placeholder="e.g. +91 94444 55555"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="contact-department" className="block text-xs font-bold text-slate-300 tracking-wide">Target Department *</label>
                      <select
                        name="department"
                        id="contact-department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-light/50 focus:bg-white/10 text-white font-light cursor-pointer"
                      >
                        <option className="bg-[#030712] text-white" value="General">General / Wholesales Desk</option>
                        <option className="bg-[#030712] text-white" value="Sales">Wholesale Contract Supply</option>
                        <option className="bg-[#030712] text-white" value="R&D">Scientific Partnerships (R&D)</option>
                        <option className="bg-[#030712] text-white" value="Careers">Careers & Internships</option>
                        <option className="bg-[#030712] text-white" value="Manufacturing">Manufacturing Audit Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-300 tracking-wide">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      id="contact-subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-light/50 focus:bg-white/10 transition-all text-white placeholder-slate-500 font-light"
                      placeholder="e.g. Requesting Bulk Cefuroxime 500 COA sheet"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="block text-xs font-bold text-slate-300 tracking-wide">Message Body *</label>
                    <textarea
                      name="message"
                      id="contact-message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-light/50 focus:bg-white/10 transition-all text-white placeholder-slate-500 font-light"
                      placeholder="Compile details about the dosage formats, active elements, and shipping destinations required..."
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-950/30 border-l-4 border-red-500 rounded-r-xl text-red-200 text-xs font-sans leading-relaxed space-y-1">
                      <p className="font-bold">Submission Failed</p>
                      <p className="font-light">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span>Submitting Request...</span>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Submit Request</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                </form>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* Accordion FAQ Area */}
      <section className="bg-[#0b1329]/30 backdrop-blur-md py-24 border-t border-white/10 text-left font-sans">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block">Frequently Asked</span>
            <h2 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 sm:w-12 sm:h-12 text-brand-accent-light shrink-0" />
              <span>Wholesale FAQ Desk</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-light font-sans">
              Standard operational pathways, file downloads, dossiers, and dispatch parameters.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div 
                  key={idx} 
                  className="glass-card border border-white/10 rounded-[1.8rem] overflow-hidden transition-all duration-300 hover:bg-white/5"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-5 flex justify-between items-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 hover:bg-emerald-50/10 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-white text-xs sm:text-sm tracking-tight">{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/10 text-xs sm:text-sm text-slate-400 leading-relaxed font-light bg-transparent font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div></div>
  );
}

