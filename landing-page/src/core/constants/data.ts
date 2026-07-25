/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  NavLink, 
  FeatureBlock, 
  TherapeuticSegment, 
  NewsArticle, 
  StatMetric
} from '@/src/core/types';

// Global Corporate Meta Info
export const CORPORATE_INFO = {
  companyName: 'Demo Pharma',
  tagline: 'Better Medicine For A Better Tomorrow',
  subTagline: 'Caring For Life',
  aboutBrief: 'Demo Pharma is committed to improving lives by delivering high-quality, affordable and innovative pharmaceutical solutions.',
  address: 'Demo Pharma, 123 Demo Street, Tech City, 000000',
  phone: '+91 78610 70183',
  email: 'contact@demopharma.example',
  workingHours: 'Mon - Sat: 9:00 AM - 6:00 PM',
  socials: {
    facebook: 'https://facebook.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
    instagram: 'https://www.instagram.com'
  }
} as const;

// Scalable Site Navigation
export const NAV_LINKS: readonly NavLink[] = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About Us' },
  { key: 'products', label: 'Products' },
  { key: 'partner', label: 'Partner With Us' },

  { key: 'quality', label: 'Quality' },
  { key: 'contact', label: 'Contact Us' }
] as const;

// Highlight features listed in the home grid page (Advanced QA, Strict control, Patient centric, dynamic innovation)
export const FEATURE_BLOCKS: readonly FeatureBlock[] = [
  {
    id: 'f1',
    title: 'Quality Assurance',
    description: 'Strict quality control at every step to ensure safe and effective medicines that comply with world-class regulatory definitions.',
    icon: 'Award'
  },
  {
    id: 'f2',
    title: 'Innovation',
    description: 'Continuous research and innovation to develop advanced healthcare formulations and drug delivery mechanisms.',
    icon: 'Beaker'
  },
  {
    id: 'f3',
    title: 'State-of-the-art Manufacturing',
    description: 'Advanced production facilities with modern technology, automated systems, and cleanroom HVAC infrastructure.',
    icon: 'Building2'
  },
  {
    id: 'f4',
    title: 'Patient-Centric Approach',
    description: 'Committed to improving health outcomes, offering affordable access, and enhancing patient life quality worldwide.',
    icon: 'Users'
  }
] as const;

// Therapeutic Segments array (includes premium Unsplash URLs)
export const THERAPEUTIC_SEGMENTS: readonly TherapeuticSegment[] = [
  {
    id: 'anti_infective',
    name: 'Anti-Infectives',
    tagline: 'Defeating pathogens, restoring health.',
    description: 'High quality antibiotics, antivirals, and anti-infective formulations designed to halt infectious escalations.',
    imageUrl: '/img-seg-anti-infective.png',
    subcategories: ['Cephalosporins', 'Macrolides', 'Quinolones', 'Penicillins']
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    tagline: 'Nurturing heart health and vascular longevity.',
    description: 'A dedicated range of medicines designed for managing chronic arterial hypertension, coronary disease, and cholesterol.',
    imageUrl: '/img-seg-cardiovascular.png',
    subcategories: ['Beta Blockers', 'ACE Inhibitors', 'Calcium Channel Blockers', 'Statins']
  },
  {
    id: 'pain_management',
    name: 'Pain Management',
    tagline: 'Effective relief, enhanced recovery parameters.',
    description: 'Comprehensive, high-efficacy analgesics and anti-inflammatory options that return physical comfort and mobilities.',
    imageUrl: '/img-seg-pain-management.png',
    subcategories: ['NSAIDs', 'Muscle Relaxants', 'Analgesics', 'Neuropathic Pain Formulas']
  },
  {
    id: 'gastrointestinal',
    name: 'Gastrointestinal',
    tagline: 'Protecting microbiome balances and digestive comforts.',
    description: 'Symptomatic and curative formulas keeping the gut functioning beautifully and treating hyperacidity or ulcers.',
    imageUrl: '/img-seg-gastrointestinal.png',
    subcategories: ['Proton Pump Inhibitors', 'Antacids', 'Antiemetics', 'Probiotics']
  },
  {
    id: 'neurocare',
    name: 'Neurocare',
    tagline: 'Empowering core brain pathways and neurological stability.',
    description: 'Advanced CNS (Central Nervous System) psychiatric, anti-epileptic, and cognitive support supplements.',
    imageUrl: '/img-seg-neurocare.png',
    subcategories: ['Anxiolytics', 'Antidepressants', 'Anti-epileptics', 'Nootropics']
  },
  {
    id: 'dermocosmetics',
    name: 'Dermocosmetics',
    tagline: 'Advanced clinical skincare and dermatological treatments.',
    description: 'Specialized topical formulations addressing clinical skin conditions and promoting vibrant skin health.',
    imageUrl: '/img-seg-dermocosmetics.png',
    subcategories: ['Ointments', 'Creams', 'Lotions', 'Soaps', 'Serums']
  },
  {
    id: 'diabetic',
    name: 'Diabetic Care',
    tagline: 'Managing blood sugar levels for a healthier life.',
    description: 'Dedicated formulations for high-efficiency glycemic control and diabetic health.',
    imageUrl: '/img-seg-diabetic.png',
    subcategories: ['Oral Hypoglycemics', 'Combination Tablets']
  },
  {
    id: 'nutrition',
    name: 'Nutritional & Wellness',
    tagline: 'Nourishing vital health pathways.',
    description: 'Premium daily vitamins, minerals, proteins and dietary wellness supplements.',
    imageUrl: '/img-seg-nutrition.png',
    subcategories: ['Multivitamins', 'Proteins', 'Antioxidants', 'Malts']
  },
  {
    id: 'gynecare',
    name: 'Gynecare',
    tagline: 'Supporting female health and wellness.',
    description: 'Specialized care formulations for women\'s health, pregnancy, and iron supplements.',
    imageUrl: '/img-seg-dermocosmetics.png',
    subcategories: ['Hormonal Support', 'Iron & Folic Acid', 'Intimate Wash']
  },
  {
    id: 'dental',
    name: 'Dental & Oral',
    tagline: 'Preserving oral hygiene and dental strength.',
    description: 'Formulations for complete teeth, gum protection, and mouth comfort.',
    imageUrl: '/img-seg-gastrointestinal.png',
    subcategories: ['Tooth Pastes', 'Mouth Washes', 'Gum Paints', 'Ulcer Gels']
  },
  {
    id: 'respiratory',
    name: 'Respiratory',
    tagline: 'Promoting clear breathing and lung comfort.',
    description: 'Formulations for respiratory support, coughs, colds, and allergy relief.',
    imageUrl: '/img-seg-anti-infective.png',
    subcategories: ['Cough Syrups', 'Anti-allergics', 'Inhalers']
  },
  {
    id: 'ent',
    name: 'ENT Care',
    tagline: 'Specialist care for ears, nose, and throat.',
    description: 'Targeted drops and sprays addressing localized ENT blockages and infections.',
    imageUrl: '/img-seg-neurocare.png',
    subcategories: ['Eye Drops', 'Nasal Drops', 'Ear Drops']
  },
  {
    id: 'general',
    name: 'General Medicine',
    tagline: 'Universal care for everyday wellness.',
    description: 'Broad-spectrum essential medicines for general health and family care.',
    imageUrl: '/img-placeholder-pharma.png',
    subcategories: ['Analgesics', 'Antacids', 'General Health']
  },
  {
    id: 'surgicals',
    name: 'Surgicals & Consumables',
    tagline: 'Precision medical devices and sterile consumables.',
    description: 'High-grade sterile surgical gloves, IV sets, catheters, and respiratory consumables designed for absolute reliability.',
    imageUrl: '/img-quality-lab.png',
    subcategories: ['Surgical Gloves', 'Infusion Sets', 'Respiratory Consumables', 'Catheters']
  }
] as const;

// Stats metrics corresponding to the image's numbers: "20+, 200+, 500+, 10,000+"
export const CORPORATE_STATS: readonly StatMetric[] = [
  {
    id: 's1',
    value: '20+',
    label: 'Years of Excellence',
    description: 'Providing trusted global formulations since our clinical kickoff.',
    icon: 'Calendar'
  },
  {
    id: 's2',
    value: '200+',
    label: 'Quality Products',
    description: 'Covering essential therapeutic sectors and specialty portfolios.',
    icon: 'PackageSearch'
  },
  {
    id: 's3',
    value: '500+',
    label: 'Dedicated Employees',
    description: 'Top-tier researchers, molecular analysts, and clinical specialists.',
    icon: 'Users2'
  },
  {
    id: 's4',
    value: '10,000+',
    label: 'Healthcare Partners',
    description: 'Hospitals, distributors, and pharmaceutical outlets across PAN India.',
    icon: 'HeartHandshake'
  }
] as const;

// News articles corresponding to the bottom section of image
export const NEWS_ARTICLES: readonly NewsArticle[] = [
  {
    id: 'n1',
    title: 'Demo Pharma Expands Presence in Demo Region',
    category: 'Expansion',
    publishDate: 'May 20, 2024',
    description: 'Strengthening our footprint to bring innovating therapeutic healthcare closer to medical networks and patients across major Southern hubs.',
    imageUrl: '/bg-partner.png',
    content: 'Demo City — Demo Pharma today announced a strategic logistics and clinical partnership program to add 4 new distribution setups across South India. With these facilities, emergency anti-infectives and cardiovascular tablets will enjoy shortened shipping time, improving clinical availability at over 1,500 local hospital networks.'
  },
  {
    id: 'n2',
    title: 'New Product Launch in Cardiovascular Range',
    category: 'Product Launch',
    publishDate: 'April 10, 2024',
    description: 'Introducing an advanced premium combination tablet for high-efficiency arterial pressure management and cholesterol mitigation.',
    imageUrl: '/img-seg-cardiovascular.png',
    content: 'Demo City — Demo Pharma\'s manufacturing partners have advanced formulation optimizations for combined beta-blocker and statin therapy. Engineered to support vascular longevity and lipid control, this high-tolerance therapeutic combination provides cost-effective wellness options for the Indian market.'
  },
  {
    id: 'n3',
    title: 'Awarded for Excellence in Quality & Manufacturing',
    category: 'Award',
    publishDate: 'March 25, 2024',
    description: 'Recognized for our tireless dedication to international quality standards, safety-first sterile containment systems, and zero-defect audits.',
    imageUrl: '/img-about-lab.png',
    content: 'Demo City — The National Healthcare and Manufacturing Alliance honored Demo Pharma with the "Prestigious Quality Pioneer Badge." The jury cited our high scoring on automated electronic sterilization checks, zero particulate contamination records, and high carbon offset sustainability projects.'
  }
] as const;


