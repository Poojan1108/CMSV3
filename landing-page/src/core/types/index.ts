/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Union of supported Lucide icon names in the application */
export type IconName =
  | 'Award'
  | 'Beaker'
  | 'Building2'
  | 'Users'
  | 'Calendar'
  | 'PackageSearch'
  | 'Users2'
  | 'HeartHandshake';

/** Semantic type alias for ISO-8601 formatted date strings (e.g., YYYY-MM-DD) */
export type DateString = string;

/** Defines available page keys in the multi-page application */
export type PageKey = 
  | 'home' 
  | 'about' 
  | 'products' 
  | 'partner' 

  | 'quality' 
  | 'contact'
  | 'terms';

/** Nav link structure for scalable header & footer routing */
export interface NavLink {
  readonly key: PageKey;
  readonly label: string;
}

/** Stats metrics model */
export interface StatMetric {
  readonly id: string;
  readonly value: string;
  readonly label: string;
  readonly description: string;
  readonly icon: IconName;
}

/** Professional feature cards seen below the hero section */
export interface FeatureBlock {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
}

/** Therapeutic segment model */
export interface TherapeuticSegment {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly subcategories: readonly string[];
}

/** Product catalog entry model */
export interface ProductItem {
  readonly id: string;
  readonly name: string;
  readonly segmentId: string;
  readonly dosageForm: string;
  readonly composition: string;
  readonly strength: string;
  readonly packaging: string;
  readonly indications: string;
}

/** News article / press release entry model */
export interface NewsArticle {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly publishDate: DateString;
  readonly description: string;
  readonly imageUrl: string;
  readonly content?: string;
}

export interface DatabaseProduct {
  readonly product_id: string;
  readonly name: string;
  readonly segment_id: string;
  readonly dosage_form: string;
  readonly active_ingredients?: string;
  readonly strength?: string;
  readonly packaging?: string;
  readonly indications?: string;
}

export interface DatabaseNews {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly publish_date: DateString;
  readonly description: string;
  readonly image_url: string;
  readonly content?: string;
}




