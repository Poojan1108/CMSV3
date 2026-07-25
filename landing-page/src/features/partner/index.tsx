/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  ShieldCheck,
  HeartHandshake,
  Coins,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileText,
  X,
  Building,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/src/core/supabase';

interface UploadedFile {
  name: string;
  size: number;
}

const stepsConfig = [
  { number: 1, label: 'Profile Info' },
  { number: 2, label: 'Infrastructure & Market' },
  { number: 3, label: 'Compliance Uploads' }
];

export default function PartnerView() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    repName: '',
    designation: '',
    companyName: '',
    email: '',
    phone: '',
    role: '', // 'distributor' | 'stockist'

    // Distributor fields
    distributorTerritory: '',
    distributorSalesTarget: '',
    distributorOutlets: '',
    distributorInfrastructure: '',

    // Stockist fields
    stockistNetworkSize: '',
    stockistWarehouseArea: '',
    stockistColdChain: '', // 'yes' | 'no'
    stockistProcurementCapacity: '',
    stockistInvestmentCapacity: '', // '25-50' | '50-1cr' | '1cr+'
  });

  // State for simulated file uploads
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [rawFiles, setRawFiles] = useState<Record<string, File>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [appId, setAppId] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs for hidden file inputs
  const fileInputRefs = {
    gst: useRef<HTMLInputElement>(null),
    pan: useRef<HTMLInputElement>(null),
    license: useRef<HTMLInputElement>(null),
    profile: useRef<HTMLInputElement>(null),
  };

  const activeIntervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const activeTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(activeIntervalsRef.current).forEach(clearInterval);
      Object.values(activeTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Navigates to home using path routing
  const navigateToHome = () => {
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Field change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  }, []);

  // Validate current step
  const validateStep = () => {
    if (step === 1) {
      if (!formData.repName.trim()) return 'Representative Full Name is required.';
      if (!formData.designation.trim()) return 'Designation / Title is required.';
      if (!formData.companyName.trim()) return 'Company Legal Name is required.';
      if (!formData.email.trim()) return 'Registered Email is required.';

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        return 'Please enter a valid email address.';
      }

      if (!formData.phone.trim()) return 'Contact Phone Number is required.';
      if (formData.phone.trim().length < 10) return 'Phone number must be at least 10 digits.';
      if (!formData.role) return 'Please select a Preferred Relationship Role.';
    }

    if (step === 2) {
      if (formData.role === 'distributor') {
        if (!formData.distributorTerritory.trim()) return 'Target Territory is required.';
        if (!formData.distributorSalesTarget.trim()) return 'Monthly Sales Target is required.';
        if (!formData.distributorOutlets.trim()) return 'Number of serviced retail outlets/hospitals is required.';
        if (!formData.distributorInfrastructure.trim()) return 'Delivery Infrastructure detail is required.';
      } else if (formData.role === 'stockist') {
        if (!formData.stockistNetworkSize.trim()) return 'Active Downstream network size is required.';
        if (!formData.stockistWarehouseArea.trim()) return 'Warehouse Storage Carpet Area is required.';
        if (!formData.stockistColdChain) return 'Please select Cold Chain storage capability.';
        if (!formData.stockistProcurementCapacity.trim()) return 'Minimum committed monthly procurement capacity is required.';
        if (!formData.stockistInvestmentCapacity) return 'Please select your dedicated Financial Investment Capacity.';
      }
    }

    if (step === 3) {
      if (!uploadedFiles.gst) return 'GSTIN Registration Certificate is mandatory.';
      if (!uploadedFiles.license) return 'Wholesale Drug License / Trade License is mandatory.';
    }

    return '';
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      setErrorMsg(error);
      return;
    }
    setErrorMsg('');
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => prev - 1);
  };

  // Mock File Upload Handler
  const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // File validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload PDF, JPEG or PNG files.');
      return;
    }

    // Size limit: 5MB
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg('File is too large. Maximum size allowed is 5MB.');
      return;
    }

    setErrorMsg('');
    setIsUploading((prev) => ({ ...prev, [docType]: true }));
    setUploadProgress((prev) => ({ ...prev, [docType]: 0 }));

    // Clear any existing upload interval for this docType
    if (activeIntervalsRef.current[docType]) {
      clearInterval(activeIntervalsRef.current[docType]);
    }

    // Simulate progress increments
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        delete activeIntervalsRef.current[docType];
        const timer = setTimeout(() => {
          setUploadedFiles((prev) => ({
            ...prev,
            [docType]: { name: file.name, size: file.size }
          }));
          setRawFiles((prev) => ({
            ...prev,
            [docType]: file
          }));
          setIsUploading((prev) => ({ ...prev, [docType]: false }));
          delete activeTimeoutsRef.current[docType];
        }, 150);
        activeTimeoutsRef.current[docType] = timer;
      }
      setUploadProgress((prev) => ({ ...prev, [docType]: currentProgress }));
    }, 120);

    activeIntervalsRef.current[docType] = interval;
  };

  const removeFile = (docType: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    setRawFiles((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    setUploadProgress((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    // Reset file input value so same file can be uploaded again if needed
    if (fileInputRefs[docType as keyof typeof fileInputRefs]?.current) {
      fileInputRefs[docType as keyof typeof fileInputRefs].current!.value = '';
    }
  };

  const triggerFileInput = (docType: string) => {
    fileInputRefs[docType as keyof typeof fileInputRefs].current?.click();
  };

  // Submit form data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateStep();
    if (error) {
      setErrorMsg(error);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const secureRandomNum = 10000 + (array[0] % 90000);
    const generatedId = `CP-2026-${secureRandomNum}`;

    const submissionData = {
      applicationId: generatedId,
      timestamp: new Date().toISOString(),
      representativeName: formData.repName.trim(),
      designation: formData.designation.trim(),
      companyName: formData.companyName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,

      // Distributor data (if active)
      ...(formData.role === 'distributor' && {
        distributorTerritory: formData.distributorTerritory.trim(),
        distributorSalesTarget: formData.distributorSalesTarget.trim(),
        distributorOutlets: formData.distributorOutlets.trim(),
        distributorInfrastructure: formData.distributorInfrastructure.trim(),
      }),

      // Stockist data (if active)
      ...(formData.role === 'stockist' && {
        stockistNetworkSize: formData.stockistNetworkSize.trim(),
        stockistWarehouseArea: formData.stockistWarehouseArea.trim(),
        stockistColdChain: formData.stockistColdChain,
        stockistProcurementCapacity: formData.stockistProcurementCapacity.trim(),
        stockistInvestmentCapacity: formData.stockistInvestmentCapacity,
      }),

      // Upload files metadata
      files: {
        gst: uploadedFiles.gst ? { name: uploadedFiles.gst.name, size: uploadedFiles.gst.size } : null,
        pan: uploadedFiles.pan ? { name: uploadedFiles.pan.name, size: uploadedFiles.pan.size } : null,
        license: uploadedFiles.license ? { name: uploadedFiles.license.name, size: uploadedFiles.license.size } : null,
        profile: uploadedFiles.profile ? { name: uploadedFiles.profile.name, size: uploadedFiles.profile.size } : null,
      }
    };

    try {
      let filesMetadata = {
        gst: uploadedFiles.gst ? { name: uploadedFiles.gst.name, size: uploadedFiles.gst.size, path: null as string | null } : null,
        pan: uploadedFiles.pan ? { name: uploadedFiles.pan.name, size: uploadedFiles.pan.size, path: null as string | null } : null,
        license: uploadedFiles.license ? { name: uploadedFiles.license.name, size: uploadedFiles.license.size, path: null as string | null } : null,
        profile: uploadedFiles.profile ? { name: uploadedFiles.profile.name, size: uploadedFiles.profile.size, path: null as string | null } : null,
      };

      if (isSupabaseConfigured && supabase) {
        console.log('[Supabase Storage] Uploading compliance documents to private bucket...');

        // Loop through all uploaded raw files and write to bucket
        for (const [key, fileObj] of Object.entries(rawFiles)) {
          if (fileObj) {
            // Clean filename and structure path: applications/CP-2026-XXXXX/gst_[UUID]_filename.pdf
            const sanitizedName = fileObj.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
              ? crypto.randomUUID() 
              : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                  const r = (Math.random() * 16) | 0;
                  const v = c === 'x' ? r : (r & 0x3) | 0x8;
                  return v.toString(16);
                });
            const filePath = `applications/${generatedId}/${key}_${uniqueId}_${sanitizedName}`;

            console.log(`[Supabase Storage] Uploading ${key} document: ${filePath}`);
            const { error: uploadError } = await supabase.storage
              .from('partner-documents')
              .upload(filePath, fileObj, { upsert: false });

            if (uploadError) {
              console.error(`[Supabase Storage] Failed to upload ${key} file:`, uploadError.message);
              throw new Error(`Failed to upload ${key} document: ${uploadError.message}`);
            }

            // Save the storage reference path inside the file metadata record
            if (filesMetadata[key as keyof typeof filesMetadata]) {
              filesMetadata[key as keyof typeof filesMetadata]!.path = filePath;
            }
          }
        }

        console.log('[Supabase API] Writing channel partner onboarding application to PostgreSQL...');
        const dbData = {
          application_id: generatedId,
          representative_name: formData.repName.trim(),
          designation: formData.designation.trim(),
          company_name: formData.companyName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,

          distributor_territory: formData.role === 'distributor' ? formData.distributorTerritory.trim() : null,
          distributor_sales_target: formData.role === 'distributor' ? formData.distributorSalesTarget.trim() : null,
          distributor_outlets: formData.role === 'distributor' ? formData.distributorOutlets.trim() : null,
          distributor_infrastructure: formData.role === 'distributor' ? formData.distributorInfrastructure.trim() : null,

          stockist_network_size: formData.role === 'stockist' ? formData.stockistNetworkSize.trim() : null,
          stockist_warehouse_area: formData.role === 'stockist' ? formData.stockistWarehouseArea.trim() : null,
          stockist_cold_chain: formData.role === 'stockist' ? formData.stockistColdChain : null,
          stockist_procurement_capacity: formData.role === 'stockist' ? formData.stockistProcurementCapacity.trim() : null,
          stockist_investment_capacity: formData.role === 'stockist' ? formData.stockistInvestmentCapacity : null,

          files: filesMetadata
        };

        const { error: insertError } = await supabase
          .from('partner_applications')
          .insert([dbData]);

        if (insertError) {
          throw insertError;
        }
        console.log('[Supabase API] Partner application written successfully to PostgreSQL.');
      } else {
        console.warn('[DB Fallback] Supabase not configured. Simulating document uploads and database write...');
        // Add fake networking latency
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      setAppId(generatedId);
      setIsSubmitted(true);

      // Trigger client email receipt notification via Supabase Edge Function Email Proxy
      if (isSupabaseConfigured && supabase) {
        try {
          console.log('[Email API] Preparing onboarding confirmation email...');

          // Construct secure console links instead of signed URLs to prevent unauthorized viewing
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'your-project-ref';
          const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/storage/buckets/partner-documents`;

          const filePaths: string[] = [];
          const fileKeys = ['gst', 'pan', 'license', 'profile'] as const;

          fileKeys.forEach((key) => {
            const fileMeta = filesMetadata[key];
            if (fileMeta?.path) {
              const label = key === 'gst' ? 'GST Certificate' :
                key === 'pan' ? 'PAN Card' :
                  key === 'license' ? 'Drug License' : 'Company Profile';
              filePaths.push(`- ${label}: ${fileMeta.path}`);
            }
          });

          const detailsMessage = formData.role === 'distributor'
            ? `Target Territory / Districts Covered: ${formData.distributorTerritory}
Approx. Monthly Sales Target: INR ${formData.distributorSalesTarget}
Retail Outlets / Hospitals Serviced: ${formData.distributorOutlets}
Current Delivery Infrastructure: ${formData.distributorInfrastructure}`
            : `Downstream Distributors / Dealers: ${formData.stockistNetworkSize}
Storage Carpet Area: ${formData.stockistWarehouseArea} Sq. Ft.
Cold Chain Storage Capabilities: ${formData.stockistColdChain === 'yes' ? 'YES' : 'NO'}
Min. Committed Procurement (INR/Mo): ${formData.stockistProcurementCapacity}
Financial Dedicated Capital Investment: ${formData.stockistInvestmentCapacity}`;

          const fileSection = filePaths.length > 0
            ? `\n\nCOMPLIANCE DOCUMENTS UPLOADED (PRIVATE STORAGE):\n${filePaths.join('\n')}

To securely view or download these files, please log in to your Supabase Storage Console:
${dashboardUrl}`
            : '';

          // Format parameters in structured format; the Edge Function handles mapping if fallback is used
          const emailParams = {
            appId: generatedId,
            repName: formData.repName.trim(),
            designation: formData.designation.trim(),
            companyName: formData.companyName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            role: formData.role === 'distributor' ? 'Regional Distributor' : 'Super Stockist (SS)',
            timestamp: new Date().toLocaleString(),
            detailsMessage: `${detailsMessage}${fileSection}`
          };

          console.log('[Email API] Dispatching onboarding details via Supabase Edge Function...');
          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              action: 'partner_onboarding',
              template_params: emailParams,
            },
          });

          if (emailError) {
            console.error('[Email API] Onboarding confirmation dispatch failed:', emailError);
          } else {
            console.log('[Email API] Onboarding confirmation sent successfully.');
          }
        } catch (emailErr) {
          console.error('[Email API] Onboarding confirmation dispatch crashed:', emailErr);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[DB Onboarding Write] Transaction failed:', message);
      setErrorMsg(message || 'Transaction failed. Our databases could not write the profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy Application ID
  const copyToClipboard = () => {
    navigator.clipboard.writeText(appId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Plaintext Receipt Summary
  const downloadReceipt = () => {
    const content = `===========================================================
Demo Pharma - CHANNEL PARTNER ONBOARDING RECEIPT
===========================================================
Application Reference ID : ${appId}
Submission Date          : ${new Date().toLocaleString()}
SLA Verification Status  : UNDER ACTIVE REVIEW
Target Review Window     : 48 - 72 Business Hours

-----------------------------------------------------------
1. CORPORATE PROFILE DETAILS
-----------------------------------------------------------
Representative Name      : ${formData.repName}
Designation / Position   : ${formData.designation}
Company Legal Name       : ${formData.companyName}
Registered Email         : ${formData.email}
Contact Phone Number     : ${formData.phone}
Preferred Channel Role   : ${formData.role === 'distributor' ? 'Regional Distributor' : 'Super Stockist (SS)'}

-----------------------------------------------------------
2. OPERATIONAL CAPACITY & INFRASTRUCTURE
-----------------------------------------------------------
${formData.role === 'distributor' ? `Target Territory / Districts : ${formData.distributorTerritory}
Approx. Monthly Sales Target : INR ${formData.distributorSalesTarget}
Retail Outlets Serviced      : ${formData.distributorOutlets}
Current Delivery Logistics   : ${formData.distributorInfrastructure}` : `Active Downstream Dealers    : ${formData.stockistNetworkSize}
Warehouse Storage Space      : ${formData.stockistWarehouseArea} Sq. Ft.
Cold Chain Capabilities      : ${formData.stockistColdChain === 'yes' ? 'YES (Active Temperature Control)' : 'NO'}
Committed Monthly Purchase   : INR ${formData.stockistProcurementCapacity}
Dedicated Venture Capital    : ${formData.stockistInvestmentCapacity}`}

-----------------------------------------------------------
3. COMPLIANCE & LEGAL DOCUMENTS UPLOADED
-----------------------------------------------------------
GSTIN Registration Cert. : ${uploadedFiles.gst?.name ?? 'N/A'} (${uploadedFiles.gst ? (uploadedFiles.gst.size / 1024).toFixed(1) : '—'} KB)
Company PAN Card         : ${uploadedFiles.pan?.name ?? 'N/A'} (${uploadedFiles.pan ? (uploadedFiles.pan.size / 1024).toFixed(1) : '—'} KB)
Wholesale Drug License   : ${uploadedFiles.license?.name ?? 'N/A'} (${uploadedFiles.license ? (uploadedFiles.license.size / 1024).toFixed(1) : '—'} KB)
Corporate Brochure/Profile: ${uploadedFiles.profile?.name ?? 'Optional - None uploaded'} ${uploadedFiles.profile ? `(${(uploadedFiles.profile.size / 1024).toFixed(1)} KB)` : ''}

===========================================================
SERVICE LEVEL AGREEMENT (SLA) & ROADMAP
Our Channel Expansion Team reviews all corporate applications within 
48 to 72 business hours.

Next Steps:
1. Profile Verification: Compliance checks on GST & Licenses.
2. Territorial Grid Assessment: Checking vacant logistical sectors.
3. Direct Contact: Executive callbacks with Catalogs, Margins & NDA.

For immediate support, quote your ID (${appId}) at Demopharma@gmail.com.
===========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Demo_Partner_Application_${appId}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setFormData({
      repName: '',
      designation: '',
      companyName: '',
      email: '',
      phone: '',
      role: '',
      distributorTerritory: '',
      distributorSalesTarget: '',
      distributorOutlets: '',
      distributorInfrastructure: '',
      stockistNetworkSize: '',
      stockistWarehouseArea: '',
      stockistColdChain: '',
      stockistProcurementCapacity: '',
      stockistInvestmentCapacity: '',
    });
    setUploadedFiles({});
    setRawFiles({});
    setUploadProgress({});
    setIsUploading({});
    setStep(1);
    setIsSubmitted(false);
    setAppId('');
    setErrorMsg('');
  };

  // Benefit Pitch Cards Config
  const pitchCards = [
    {
      icon: <Truck className="w-6 h-6 text-brand-accent-light" />,
      title: 'Robust Supply Chain Resilience',
      desc: 'We ensure uninterrupted product availability, streamlined logistics, and efficient turnaround times to keep your inventory optimized.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-accent-light" />,
      title: 'Premium Quality Portfolio',
      desc: 'Gain exclusive access to high-demand, premium products manufactured under strict regulatory compliance.'
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-brand-accent-light" />,
      title: 'Structured Channel Support',
      desc: 'We believe in mutual growth. Our partners receive dedicated marketing collateral, clear territorial protection, and transparent commercial terms.'
    },
    {
      icon: <Coins className="w-6 h-6 text-brand-accent-light" />,
      title: 'Value-Driven Margins',
      desc: 'Our commercial structures are engineered to reward efficiency, high-volume throughput, and long-term market penetration.'
    }
  ];

  return (
    <div
      className="w-full bg-cover bg-fixed bg-center min-h-screen"
      style={{ backgroundImage: "url('/bg-partner.png')" }}
    >
      <div className="w-full bg-[#030712]/75 backdrop-blur-md min-h-screen">

        {/* 1. Header Banner */}
        <section className="relative bg-[#020617]/50 backdrop-blur-[1px] text-white py-18 md:py-24 px-4 text-center overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-5 relative z-10">
            <div className="inline-block text-[10px] font-bold text-brand-accent-light bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Channel Expansion 2026
            </div>
            <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
              Partner With Us <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-light via-brand-accent to-emerald-400 box-decoration-clone">Scale New Heights</span> <br /> in Distribution
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-light">
              Expand your portfolio with a globally aligned supply chain. We invite visionary Super Stockists and Regional Distributors to drive the next phase of market growth.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  document.getElementById('onboarding-wizard')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer inline-flex items-center gap-2 group border border-white/5 active:scale-95"
              >
                Begin Onboarding Application
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* 2. The Pitch Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <span className="text-xs font-bold text-brand-accent-light uppercase tracking-widest bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block font-sans">Why Partner?</span>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
                A Strategic Partnership for Exponential Growth
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-light leading-relaxed">
                We provide the framework, certifications, and support systems required to establish long-term secondary supply dominance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pitchCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-6 rounded-[2rem] rounded-tl-[3.5rem] rounded-br-[3.5rem] glass-card border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white mb-5 shadow-sm">
                      {card.icon}
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base tracking-tight leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mt-2.5 font-light">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Onboarding Wizard Form Container */}
        <section id="onboarding-wizard" className="py-12 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-[2.5rem] lg:rounded-[3rem] border border-white/10 shadow-2xl p-6 sm:p-10 relative overflow-hidden">

            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="form-wizard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Step Indicators */}
                  <div className="mb-10 max-w-md mx-auto relative">
                    {/* Track Line Container spanning between circle centers (1/6 to 5/6 of parent width) */}
                    <div className="absolute top-4.5 left-[16.67%] right-[16.67%] h-[2px] z-0">
                      {/* Background Track Line */}
                      <div className="w-full h-full bg-white/5 border-b border-white/10" />
                      {/* Active Track Line Fill */}
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-accent-light to-brand-accent transition-all duration-500"
                        style={{ width: `${((step - 1) / (stepsConfig.length - 1)) * 100}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 relative z-10">
                      {stepsConfig.map((s) => {
                        const isActive = step === s.number;
                        const isCompleted = step > s.number;
                        return (
                          <div key={s.number} className="flex flex-col items-center text-center px-1">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 backdrop-blur-md relative z-20 ${isCompleted
                                  ? 'bg-[#0b1329] border border-brand-accent-light text-brand-accent-light shadow-[0_0_15px_rgba(35,213,255,0.2)]'
                                  : isActive
                                    ? 'bg-gradient-to-r from-brand-accent to-brand-secondary border border-brand-accent-light/40 text-white scale-110 shadow-[0_0_15px_rgba(124,58,237,0.35)]'
                                    : 'bg-[#0b1329] border border-white/10 text-slate-400'
                                }`}
                            >
                              {isCompleted ? <Check className="w-4 h-4 text-brand-accent-light" /> : s.number}
                            </div>
                            <span className={`text-[10px] font-semibold mt-2.5 tracking-wider uppercase hidden sm:block ${isActive ? 'text-brand-accent-light font-bold' : isCompleted ? 'text-brand-accent-light font-medium' : 'text-slate-400 font-light'
                              }`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Elements */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMsg && (
                      <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/30 text-rose-300 text-xs flex items-center gap-2.5 animate-pulse">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-450" />
                        <span className="font-semibold">{errorMsg}</span>
                      </div>
                    )}

                    {/* Step 1: Representative & Company Profile */}
                    {step === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        <div className="border-b border-white/10 pb-3">
                          <h3 className="text-brand-accent-light font-bold text-base sm:text-lg flex items-center gap-2">
                            <Building className="w-5 h-5 text-brand-accent" />
                            Corporate Profile
                          </h3>
                          <p className="text-slate-400 text-[11px] font-light mt-0.5 font-sans">Please provide core information about your entity and primary representative.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5 text-left">
                            <label htmlFor="partner-repName" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Representative Full Name <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              name="repName"
                              id="partner-repName"
                              value={formData.repName}
                              onChange={handleChange}
                              placeholder="e.g. Rajesh Kumar"
                              className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                            />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label htmlFor="partner-designation" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Designation / Title <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              name="designation"
                              id="partner-designation"
                              value={formData.designation}
                              onChange={handleChange}
                              placeholder="e.g. Managing Partner / Director"
                              className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label htmlFor="partner-companyName" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Company Legal Name <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            name="companyName"
                            id="partner-companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="e.g. Kumar Pharma Distributors LLP"
                            className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5 text-left">
                            <label htmlFor="partner-email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Registered Email Address <span className="text-rose-500">*</span></label>
                            <input
                              type="email"
                              name="email"
                              id="partner-email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="e.g. contact@company.com"
                              className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                            />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label htmlFor="partner-phone" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Contact Phone Number <span className="text-rose-500">*</span></label>
                            <input
                              type="tel"
                              name="phone"
                              id="partner-phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="e.g. +91 98765 43210"
                              className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label htmlFor="partner-role" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-sans">Preferred Relationship Role <span className="text-rose-500">*</span></label>
                          <select
                            name="role"
                            id="partner-role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none font-light cursor-pointer appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%237C3AED' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                          >
                            <option value="" className="bg-[#0b1329] text-slate-200">Select Partnership Role...</option>
                            <option value="distributor" className="bg-[#0b1329] text-slate-200">Regional Distributor (Local Market Target)</option>
                            <option value="stockist" className="bg-[#0b1329] text-slate-200">Super Stockist (High Capacity Storage & Downstream Network)</option>
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Capacity & Infrastructure (Dynamic based on selected role) */}
                    {step === 2 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        <div className="border-b border-white/10 pb-3">
                          <h3 className="text-brand-accent-light font-bold text-base sm:text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-brand-accent" />
                            {formData.role === 'distributor' ? 'Regional Distributor Markets' : 'Super Stockist Infrastructure'}
                          </h3>
                          <p className="text-slate-400 text-[11px] font-light mt-0.5 font-sans">Please provide specific infrastructure detail for our evaluation.</p>
                        </div>

                        {formData.role === 'distributor' && (
                          <div className="space-y-5">
                            <div className="space-y-1.5 text-left">
                              <label htmlFor="partner-distributorTerritory" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Target Territory / Districts Covered <span className="text-rose-500">*</span></label>
                              <input
                                type="text"
                                name="distributorTerritory"
                                id="partner-distributorTerritory"
                                value={formData.distributorTerritory}
                                onChange={handleChange}
                                placeholder="e.g., Ahmedabad, Junagadh, North Gujarat"
                                className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              <div className="space-y-1.5 text-left">
                                <label htmlFor="partner-distributorSalesTarget" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Approx. Monthly Sales Target (INR) <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  name="distributorSalesTarget"
                                  id="partner-distributorSalesTarget"
                                  value={formData.distributorSalesTarget}
                                  onChange={handleChange}
                                  placeholder="e.g. 5,00,000"
                                  className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                                />
                              </div>
                              <div className="space-y-1.5 text-left">
                                <label htmlFor="partner-distributorOutlets" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-sans">Retail Outlets / Hospitals Serviced <span className="text-rose-500">*</span></label>
                                <input
                                  type="number"
                                  name="distributorOutlets"
                                  id="partner-distributorOutlets"
                                  value={formData.distributorOutlets}
                                  onChange={handleChange}
                                  placeholder="e.g. 120"
                                  className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                              <label htmlFor="partner-distributorInfrastructure" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Current Delivery Infrastructure <span className="text-rose-500">*</span></label>
                              <input
                                type="text"
                                name="distributorInfrastructure"
                                id="partner-distributorInfrastructure"
                                value={formData.distributorInfrastructure}
                                onChange={handleChange}
                                placeholder="e.g., Number of delivery vehicles/personnel"
                                className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                              />
                            </div>
                          </div>
                        )}

                        {formData.role === 'stockist' && (
                          <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              <div className="space-y-1.5 text-left">
                                <label htmlFor="partner-stockistNetworkSize" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Downstream Distributors / Dealers <span className="text-rose-500">*</span></label>
                                <input
                                  type="number"
                                  name="stockistNetworkSize"
                                  id="partner-stockistNetworkSize"
                                  value={formData.stockistNetworkSize}
                                  onChange={handleChange}
                                  placeholder="e.g. 45"
                                  className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                                />
                              </div>
                              <div className="space-y-1.5 text-left">
                                <label htmlFor="partner-stockistWarehouseArea" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Storage Carpet Area (Sq. Ft.) <span className="text-rose-500">*</span></label>
                                <input
                                  type="number"
                                  name="stockistWarehouseArea"
                                  id="partner-stockistWarehouseArea"
                                  value={formData.stockistWarehouseArea}
                                  onChange={handleChange}
                                  placeholder="e.g. 1500"
                                  className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              <div className="space-y-1.5 text-left">
                                <label htmlFor="partner-stockistColdChain" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Cold Chain Storage Capabilities? <span className="text-rose-500">*</span></label>
                                <select
                                  name="stockistColdChain"
                                  id="partner-stockistColdChain"
                                  value={formData.stockistColdChain}
                                  onChange={handleChange}
                                  className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none font-light cursor-pointer appearance-none"
                                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%237C3AED' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                                >
                                  <option value="" className="bg-[#0b1329] text-slate-200">Select option...</option>
                                  <option value="yes" className="bg-[#0b1329] text-slate-200">Yes</option>
                                  <option value="no" className="bg-[#0b1329] text-slate-200">No</option>
                                </select>
                              </div>
                              <div className="space-y-1.5 text-left">
                                <label htmlFor="partner-stockistProcurementCapacity" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Min. Committed Procurement (INR/Mo) <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  name="stockistProcurementCapacity"
                                  id="partner-stockistProcurementCapacity"
                                  value={formData.stockistProcurementCapacity}
                                  onChange={handleChange}
                                  placeholder="e.g. 15,00,000"
                                  className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none placeholder-slate-500 font-light"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                              <label htmlFor="partner-stockistInvestmentCapacity" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Financial Dedicated Capital Investment <span className="text-rose-500">*</span></label>
                              <select
                                name="stockistInvestmentCapacity"
                                id="partner-stockistInvestmentCapacity"
                                value={formData.stockistInvestmentCapacity}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 hover:border-brand-accent-light/50 focus:border-brand-accent-light focus:bg-white/10 text-white text-xs p-3.5 rounded-xl transition-all focus:outline-none font-light cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%237C3AED' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
                              >
                                <option value="" className="bg-[#0b1329] text-slate-200">Select Capital range...</option>
                                <option value="25-50 Lakhs" className="bg-[#0b1329] text-slate-200">25–50 Lakhs</option>
                                <option value="50 Lakhs to 1 Crore" className="bg-[#0b1329] text-slate-200">50 Lakhs to 1 Crore</option>
                                <option value="1 Crore+" className="bg-[#0b1329] text-slate-200">1 Crore+</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 3: Secure Document Upload Portal */}
                    {step === 3 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        <div className="border-b border-white/10 pb-3">
                          <h3 className="text-brand-accent-light font-bold text-base sm:text-lg flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-brand-accent" />
                            Compliance Document Portal
                          </h3>
                          <p className="text-slate-400 text-[11px] font-light mt-0.5 font-sans">Please securely upload digital copies (PDF or JPEG, max 5MB) of corporate legal credentials.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                          {/* GST Certificate */}
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">GSTIN Certificate <span className="text-rose-500">*</span></span>
                            <input
                              type="file"
                              ref={fileInputRefs.gst}
                              onChange={(e) => handleFileChange('gst', e)}
                              accept=".pdf, .jpg, .jpeg, .png"
                              className="hidden"
                            />
                            {uploadedFiles.gst ? (
                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="w-5 h-5 text-brand-accent-light shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-200 truncate">{uploadedFiles.gst.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{(uploadedFiles.gst.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile('gst')}
                                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : isUploading.gst ? (
                              <div className="p-4 rounded-xl bg-brand-warm border border-white/10 flex flex-col justify-center gap-2">
                                <span className="text-[10px] font-semibold text-brand-accent-light uppercase tracking-wider">Uploading Document...</span>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-brand-accent to-brand-primary h-full transition-all duration-150" style={{ width: `${uploadProgress.gst}%` }} />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerFileInput('gst')}
                                className="w-full p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-accent-light/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white animate-in fade-in"
                              >
                                <UploadCloud className="w-5 h-5 text-brand-accent-light" />
                                <span className="text-[11px] font-semibold uppercase tracking-wide">Upload GST Certificate</span>
                                <span className="text-[10px] text-slate-400 font-light">PDF, JPEG, or PNG up to 5MB</span>
                              </button>
                            )}
                          </div>

                          {/* Company PAN */}
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Company PAN Card <span className="text-slate-400 text-[10px] font-light lowercase">(optional)</span></span>
                            <input
                              type="file"
                              ref={fileInputRefs.pan}
                              onChange={(e) => handleFileChange('pan', e)}
                              accept=".pdf, .jpg, .jpeg, .png"
                              className="hidden"
                            />
                            {uploadedFiles.pan ? (
                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="w-5 h-5 text-brand-accent-light shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-200 truncate">{uploadedFiles.pan.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{(uploadedFiles.pan.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile('pan')}
                                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : isUploading.pan ? (
                              <div className="p-4 rounded-xl bg-brand-warm border border-white/10 flex flex-col justify-center gap-2">
                                <span className="text-[10px] font-semibold text-brand-accent-light uppercase tracking-wider">Uploading Document...</span>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-brand-accent to-brand-primary h-full transition-all duration-150" style={{ width: `${uploadProgress.pan}%` }} />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerFileInput('pan')}
                                className="w-full p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-accent-light/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white animate-in fade-in"
                              >
                                <UploadCloud className="w-5 h-5 text-brand-accent-light" />
                                <span className="text-[11px] font-semibold uppercase tracking-wide">Upload PAN Card</span>
                                <span className="text-[10px] text-slate-400 font-light">PDF, JPEG, or PNG up to 5MB</span>
                              </button>
                            )}
                          </div>

                          {/* Drug License / Trade Licenses */}
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Wholesale Drug / Trade License <span className="text-rose-500">*</span></span>
                            <input
                              type="file"
                              ref={fileInputRefs.license}
                              onChange={(e) => handleFileChange('license', e)}
                              accept=".pdf, .jpg, .jpeg, .png"
                              className="hidden"
                            />
                            {uploadedFiles.license ? (
                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="w-5 h-5 text-brand-accent-light shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-200 truncate">{uploadedFiles.license.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{(uploadedFiles.license.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile('license')}
                                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : isUploading.license ? (
                              <div className="p-4 rounded-xl bg-brand-warm border border-white/10 flex flex-col justify-center gap-2">
                                <span className="text-[10px] font-semibold text-brand-accent-light uppercase tracking-wider">Uploading Document...</span>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-brand-accent to-brand-primary h-full transition-all duration-150" style={{ width: `${uploadProgress.license}%` }} />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerFileInput('license')}
                                className="w-full p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-accent-light/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white animate-in fade-in"
                              >
                                <UploadCloud className="w-5 h-5 text-brand-accent-light" />
                                <span className="text-[11px] font-semibold uppercase tracking-wide">Upload Drug / Trade License</span>
                                <span className="text-[10px] text-slate-400 font-light">PDF, JPEG, or PNG up to 5MB</span>
                              </button>
                            )}
                          </div>

                          {/* Brochure / Company Profile (Optional) */}
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-semibold text-slate-305 uppercase tracking-wider block font-sans">Company Brochure / Profile <span className="text-slate-400 text-[10px] font-light lowercase">(optional)</span></span>
                            <input
                              type="file"
                              ref={fileInputRefs.profile}
                              onChange={(e) => handleFileChange('profile', e)}
                              accept=".pdf, .jpg, .jpeg, .png"
                              className="hidden"
                            />
                            {uploadedFiles.profile ? (
                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="w-5 h-5 text-brand-accent-light shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-200 truncate">{uploadedFiles.profile.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{(uploadedFiles.profile.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile('profile')}
                                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : isUploading.profile ? (
                              <div className="p-4 rounded-xl bg-brand-warm border border-white/10 flex flex-col justify-center gap-2">
                                <span className="text-[10px] font-semibold text-brand-accent-light uppercase tracking-wider">Uploading Document...</span>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-brand-accent to-brand-primary h-full transition-all duration-150" style={{ width: `${uploadProgress.profile}%` }} />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerFileInput('profile')}
                                className="w-full p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-accent-light/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white animate-in fade-in"
                              >
                                <UploadCloud className="w-5 h-5 text-brand-accent-light" />
                                <span className="text-[11px] font-semibold uppercase tracking-wide">Upload Company Profile</span>
                                <span className="text-[10px] text-slate-400 font-light">PDF, JPEG, or PNG up to 5MB</span>
                              </button>
                            )}
                          </div>

                        </div>

                        {/* SLA Acceptance Checklist */}
                        <div className="pt-4 border-t border-white/10 text-left">
                          <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              className="w-4.5 h-4.5 mt-0.5 rounded border-white/20 bg-white/5 checked:bg-brand-accent checked:border-brand-accent text-brand-accent focus:ring-brand-accent/50 focus:ring-offset-[#0b1329] cursor-pointer"
                            />
                            <span className="text-[11px] text-slate-400 leading-relaxed font-light font-sans">
                              I hereby declare that all provided company profiles, infrastructure capacities, and digital regulatory licenses represent true operational parameters. I acknowledge that Demo's SLA review process requires 48 to 72 business hours.
                            </span>
                          </label>
                        </div>

                      </motion.div>
                    )}

                    {/* Form Action Controls */}
                    <div className="pt-6 border-t border-white/10 flex justify-between gap-4">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={handleBack}
                          disabled={submitting}
                          className="bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs border border-white/10 py-3 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 select-none disabled:opacity-50"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Back
                        </button>
                      ) : (
                        <div />
                      )}

                      {step < 3 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="bg-gradient-to-r from-brand-secondary to-brand-accent hover:from-brand-accent hover:to-brand-secondary text-white font-semibold text-xs py-3 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 select-none shadow-md shadow-brand-accent/25"
                        >
                          Next Step
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-gradient-to-r from-brand-secondary via-brand-secondary to-brand-accent hover:from-brand-accent hover:to-brand-secondary text-white font-bold text-xs py-3 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 select-none disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/25"
                        >
                          {submitting ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving Profile...
                            </>
                          ) : (
                            <>
                              Submit Onboarding Application
                              <CheckCircle2 className="w-4 h-4 text-brand-accent-light animate-pulse" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              ) : (
                // 4. Professional SLA Confirmation Page
                <motion.div
                  key="sla-confirmation"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                  className="space-y-8 text-center sm:text-left"
                >
                  {/* Header Success Badge */}
                  <div className="flex flex-col sm:flex-row items-center gap-4.5 border-b border-white/10 pb-6">
                    <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-accent/20 shadow-inner">
                      <CheckCircle2 className="w-8 h-8 text-brand-accent-light" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-brand-accent-light tracking-tight">
                        Application Received: Channel Expansion Review
                      </h2>
                      <p className="text-slate-400 text-xs font-light font-sans mt-1 leading-relaxed">
                        Thank you for your interest in partnering with our trading network. Your corporate profile, infrastructure details, and compliance documents have been securely uploaded to our partner evaluation database.
                      </p>
                    </div>
                  </div>

                  {/* Unique Application ID display card */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-brand-accent-light uppercase tracking-wider block font-sans">Application Reference ID</span>
                      <p className="text-base sm:text-lg font-mono font-bold text-brand-accent">{appId}</p>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 select-none shadow-sm hover:shadow"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-brand-accent-light" />
                          Copied ID!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-brand-accent" />
                          Copy Reference ID
                        </>
                      )}
                    </button>
                  </div>

                  {/* SLA Block */}
                  <div className="p-5.5 rounded-2xl bg-brand-dark-site text-slate-200 border border-white/5 space-y-2 text-left relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-6 -translate-y-4 opacity-5 pointer-events-none">
                      <FileCheck className="w-36 h-36" style={{ transform: 'rotate(-15deg)' }} />
                    </div>
                    <h4 className="text-brand-accent-light font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <ShieldCheck className="w-4 h-4" />
                      Our Service Level Agreement (SLA) to Prospective Partners:
                    </h4>
                    <p className="text-xs leading-relaxed font-light text-slate-300 font-sans">
                      Our Channel Expansion Team reviews all institutional and distribution submissions within <strong className="text-white font-bold font-mono">48 to 72 business hours</strong>.
                    </p>
                  </div>

                  {/* Next Steps Grid Flow */}
                  <div className="space-y-4.5 text-left">
                    <h3 className="text-white font-bold text-sm sm:text-base uppercase tracking-wider border-b border-white/10 pb-2 font-sans">
                      Next Phases of Evaluation:
                    </h3>

                    <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
                      <div className="relative">
                        <span className="absolute -left-[32px] top-0.5 w-4 h-4 rounded-full bg-brand-accent-light border-4 border-[#0b1329] shadow-md shadow-brand-accent-light/25 flex items-center justify-center" />
                        <h5 className="text-xs font-bold text-brand-accent-light uppercase tracking-wide font-sans">Profile Verification</h5>
                        <p className="text-[11px] text-slate-400 font-light mt-1 font-sans leading-relaxed">Our compliance team will verify the uploaded GST and trade licensing data.</p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-[32px] top-0.5 w-4 h-4 rounded-full bg-brand-secondary border-4 border-[#0b1329] shadow-md shadow-brand-secondary/25 flex items-center justify-center" />
                        <h5 className="text-xs font-bold text-brand-accent-light uppercase tracking-wide font-sans">Territorial Assessment</h5>
                        <p className="text-[11px] text-slate-400 font-light mt-1 font-sans leading-relaxed">We will check your proposed logistics capability against our current vacant territories or Super Stockist zones.</p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-[32px] top-0.5 w-4 h-4 rounded-full bg-brand-accent border-4 border-[#0b1329] shadow-md shadow-brand-accent/25 flex items-center justify-center" />
                        <h5 className="text-xs font-bold text-brand-accent-light uppercase tracking-wide font-sans">Direct Contact</h5>
                        <p className="text-[11px] text-slate-400 font-light mt-1 font-sans leading-relaxed">If your profile aligns with our operational and territorial requirements, an executive from our corporate office will reach out to you directly via phone and email to share our Commercial Product Catalog, Margin Structures, and Draft NDA.</p>
                      </div>
                    </div>
                  </div>

                  {/* Urgent Contact Alert */}
                  <div className="text-left text-[11px] text-slate-400 bg-white/[0.02] p-4 border border-white/10 rounded-xl leading-relaxed font-light font-sans">
                    For urgent inventory or institutional supply inquiries, please quote your auto-generated Application ID (sent to your registered email) and contact our corporate desk at <a href="mailto:Demopharma@gmail.com" className="font-semibold text-brand-accent-light hover:underline">Demopharma@gmail.com</a> or call <span className="font-semibold text-brand-accent-light">+91 78610 70183</span>.
                  </div>

                  {/* Final Actions */}
                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4.5 justify-end">
                    <button
                      onClick={downloadReceipt}
                      className="bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold py-3.5 px-6 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95 transition-all select-none"
                    >
                      <Download className="w-4 h-4 text-brand-accent-light" />
                      Download Application Receipt
                    </button>
                    <button
                      onClick={resetForm}
                      className="bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold py-3.5 px-6 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95 transition-all select-none"
                    >
                      Submit New Application
                    </button>
                    <button
                      onClick={navigateToHome}
                      className="bg-gradient-to-r from-brand-secondary to-brand-accent hover:from-brand-accent hover:to-brand-secondary text-white text-xs font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all select-none"
                    >
                      Return to Home Page
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </section>

      </div>
    </div>
  );
}

// Visual FileCheck SVG container used in decorative background
function FileCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
