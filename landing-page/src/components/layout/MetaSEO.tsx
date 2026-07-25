/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

interface MetaSEOProps {
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
  readonly hashPath: string;
  readonly schema?: Record<string, unknown>;
  readonly imageUrl?: string;
  readonly baseUrl?: string;
}

// Hoist utility outside the component to prevent recreation
const getOrCreateMetaTag = (attributeName: string, attributeValue: string): HTMLMetaElement => {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  return element;
};

export default function MetaSEO({
  title,
  description,
  keywords,
  hashPath,
  schema,
  imageUrl = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop',
  baseUrl = 'https://Demopharma.com'
}: MetaSEOProps) {
  
  // Stringify schema to avoid infinite re-render loops on inline object references
  const schemaString = schema ? JSON.stringify(schema) : null;

  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // 2. Set Meta Description
    const metaDescription = getOrCreateMetaTag('name', 'description');
    metaDescription.setAttribute('content', description);

    // 3. Set Meta Keywords
    const metaKeywords = getOrCreateMetaTag('name', 'keywords');
    metaKeywords.setAttribute('content', keywords);

    // 4. Set Canonical Link
    const canonicalUrl = hashPath === 'home' || hashPath === '' 
      ? baseUrl 
      : `${baseUrl}/${hashPath}`;
    
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 5. Open Graph Meta Tags
    const ogTitle = getOrCreateMetaTag('property', 'og:title');
    ogTitle.setAttribute('content', title);

    const ogDescription = getOrCreateMetaTag('property', 'og:description');
    ogDescription.setAttribute('content', description);

    const ogUrl = getOrCreateMetaTag('property', 'og:url');
    ogUrl.setAttribute('content', canonicalUrl);

    const ogType = getOrCreateMetaTag('property', 'og:type');
    ogType.setAttribute('content', 'website');

    const ogImage = getOrCreateMetaTag('property', 'og:image');
    ogImage.setAttribute('content', imageUrl);

    // 6. Twitter Card Meta Tags
    const twitterCard = getOrCreateMetaTag('name', 'twitter:card');
    twitterCard.setAttribute('content', 'summary_large_image');

    const twitterTitle = getOrCreateMetaTag('name', 'twitter:title');
    twitterTitle.setAttribute('content', title);

    const twitterDesc = getOrCreateMetaTag('name', 'twitter:description');
    twitterDesc.setAttribute('content', description);

    const twitterImage = getOrCreateMetaTag('name', 'twitter:image');
    twitterImage.setAttribute('content', imageUrl);

    // 7. Inject JSON-LD Schema
    const schemaScriptId = 'seo-json-ld';
    let schemaScript = document.getElementById(schemaScriptId) as HTMLScriptElement;

    if (schemaString) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        schemaScript.setAttribute('id', schemaScriptId);
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = schemaString;
    } else {
      if (schemaScript) {
        schemaScript.remove();
      }
    }

    // Cleanup function to remove schema script on unmount
    return () => {
      const script = document.getElementById(schemaScriptId);
      if (script) {
        script.remove();
      }
    };
  }, [title, description, keywords, hashPath, schemaString, imageUrl, baseUrl]);

  return null;
}

