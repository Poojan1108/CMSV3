/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductItem } from '../types';

/**
 * Catalog Feature Flags & Mode Configuration
 */
export const CATALOG_CONFIG = {
  /**
   * Set to true for "Surgicals & Consumables Only" mode.
   * Set to false to restore the full 14-segment pharmaceutical catalog.
   */
  SHOW_ONLY_SURGICALS_CONSUMABLES: true,

  /** Target Segment ID */
  TARGET_SEGMENT_ID: 'surgicals',

  /** Compliant Hero Content Overrides (No legal certification claims) */
  HERO_BADGE_SURGICALS: 'Hospital & Clinical Supplies',
  HERO_TITLE_SURGICALS: 'Surgical & Medical Consumables',
  HERO_SUBTITLE_SURGICALS: 'Precision sterile surgical equipment, IV administration sets, respiratory disposables, and clinical catheters designed for dependable hospital utility.',
  
  HERO_BADGE_FULL: 'Verified Formulation Archives',
  HERO_TITLE_FULL: 'Our Pharmaceutical Catalog',
  HERO_SUBTITLE_FULL: 'High-integrity therapeutic drug solutions manufactured under strict sterile quality standards and complete molecular testing.',

  /** Trust Badges displayed in Surgicals Mode */
  SURGICAL_TRUST_BADGES: [
    'Hospital Supplies',
    'Single-Use Sterile Packaging',
    'Precision Engineering'
  ]
} as const;

export interface SurgicalSubcategoryDef {
  readonly id: string;
  readonly name: string;
  readonly match: (product: ProductItem) => boolean;
}

export const SURGICAL_SUBCATEGORIES: readonly SurgicalSubcategoryDef[] = [
  {
    id: 'all',
    name: 'All Consumables',
    match: () => true
  },
  {
    id: 'infusion',
    name: 'Infusion & Fluid Systems',
    match: (p) => /infusion|fluid|burette|transfusion|pressure monitoring|stop cock|extension|scalp vein|microdrip|measured volume|butterfly/i.test(`${p.name} ${p.dosageForm} ${p.composition}`)
  },
  {
    id: 'gloves',
    name: 'Sterile Gloves',
    match: (p) => /glove/i.test(`${p.name} ${p.dosageForm} ${p.composition}`)
  },
  {
    id: 'respiratory',
    name: 'Respiratory Disposables',
    match: (p) => /cannula|oxygen mask|nebuliser|nebulizer|spirometer|endotracheal|airway|guedel|respirometer/i.test(`${p.name} ${p.dosageForm} ${p.composition}`)
  },
  {
    id: 'catheters',
    name: 'Catheters & Drainage',
    match: (p) => /urine bag|urometer|foley|catheter|drainage|wound suction|chest drainage/i.test(`${p.name} ${p.dosageForm} ${p.composition}`)
  },
  {
    id: 'syringes',
    name: 'Syringes & Disposables',
    match: (p) => /syringe|feeding tube|ryle|cord clamp|suction handle|yankauer/i.test(`${p.name} ${p.dosageForm} ${p.composition}`)
  }
] as const;
