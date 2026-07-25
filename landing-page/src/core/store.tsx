/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lightweight application state manager using a pub-sub store + useSyncExternalStore.
 * Resolves the Context-based re-render cascade with zero dependencies.
 */

import { useSyncExternalStore, useRef, useCallback, type ReactNode } from 'react';
import { PageKey, ProductItem, NewsArticle, DatabaseProduct, DatabaseNews } from './types';
import { NEWS_ARTICLES } from './constants/data';
import { supabase, isSupabaseConfigured } from './supabase';

// ============================================================================
// State Shape
// ============================================================================

interface ToastState {
  readonly show: boolean;
  readonly message: string;
  readonly type: 'success' | 'info';
}

interface AppState {
  readonly ui: {
    readonly currentPage: PageKey;
    readonly toast: ToastState;
  };
  readonly products: {
    readonly items: readonly ProductItem[];
    readonly selectedSegmentId: string;
    readonly searchQuery: string;
    readonly loading: boolean;
    readonly error: string | null;
  };
  readonly news: {
    readonly items: readonly NewsArticle[];
    readonly activeNews: NewsArticle | null;
    readonly loading: boolean;
    readonly error: string | null;
  };
  readonly inquiry: {
    readonly loading: boolean;
    readonly success: boolean;
    readonly error: string | null;
  };
}

// ============================================================================
// Action Types
// ============================================================================

type AppAction =
  // UI
  | { type: 'SET_CURRENT_PAGE'; payload: PageKey }
  | { type: 'SHOW_TOAST'; payload: { message: string; type?: 'success' | 'info' } }
  | { type: 'HIDE_TOAST' }
  // Products
  | { type: 'SET_SELECTED_SEGMENT'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'PRODUCTS_LOADING' }
  | { type: 'PRODUCTS_LOADED'; payload: ProductItem[] }
  | { type: 'PRODUCTS_ERROR'; payload: string }
  // News
  | { type: 'SET_ACTIVE_NEWS'; payload: NewsArticle | null }
  | { type: 'NEWS_LOADING' }
  | { type: 'NEWS_LOADED'; payload: NewsArticle[] }
  | { type: 'NEWS_ERROR'; payload: string }
  // Inquiry
  | { type: 'INQUIRY_LOADING' }
  | { type: 'INQUIRY_SUCCESS' }
  | { type: 'INQUIRY_ERROR'; payload: string }
  | { type: 'RESET_INQUIRY' };

// ============================================================================
// Action Creators (sync)
// ============================================================================

export const setCurrentPage = (page: PageKey): AppAction =>
  ({ type: 'SET_CURRENT_PAGE', payload: page });

export const showToast = (payload: { message: string; type?: 'success' | 'info' }): AppAction =>
  ({ type: 'SHOW_TOAST', payload });

export const hideToast = (): AppAction =>
  ({ type: 'HIDE_TOAST' });

export const setSelectedSegmentId = (id: string): AppAction =>
  ({ type: 'SET_SELECTED_SEGMENT', payload: id });

export const setSearchQuery = (query: string): AppAction =>
  ({ type: 'SET_SEARCH_QUERY', payload: query });

export const setActiveNews = (article: NewsArticle | null): AppAction =>
  ({ type: 'SET_ACTIVE_NEWS', payload: article });

export const resetInquiryStatus = (): AppAction =>
  ({ type: 'RESET_INQUIRY' });

// ============================================================================
// Initial State
// ============================================================================

export const getPageFromPath = (pathname: string): PageKey => {
  const path = pathname.replace(/^\//, '');
  const validPages: PageKey[] = [
    'home', 'about', 'products', 'partner', 'quality', 'contact', 'terms',
  ];
  return validPages.includes(path as PageKey) ? (path as PageKey) : 'home';
};

const initialState: AppState = {
  ui: {
    currentPage: typeof window !== 'undefined' ? getPageFromPath(window.location.pathname) : 'home',
    toast: { show: false, message: '', type: 'success' },
  },
  products: {
    items: [],
    selectedSegmentId: 'all',
    searchQuery: '',
    loading: false,
    error: null,
  },
  news: {
    items: [],
    activeNews: null,
    loading: false,
    error: null,
  },
  inquiry: {
    loading: false,
    success: false,
    error: null,
  },
};

// ============================================================================
// Reducer
// ============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ---- UI ----
    case 'SET_CURRENT_PAGE':
      return { ...state, ui: { ...state.ui, currentPage: action.payload } };
    case 'SHOW_TOAST':
      return {
        ...state,
        ui: {
          ...state.ui,
          toast: { show: true, message: action.payload.message, type: action.payload.type || 'success' },
        },
      };
    case 'HIDE_TOAST':
      return { ...state, ui: { ...state.ui, toast: { ...state.ui.toast, show: false } } };

    // ---- Products ----
    case 'SET_SELECTED_SEGMENT':
      return { ...state, products: { ...state.products, selectedSegmentId: action.payload } };
    case 'SET_SEARCH_QUERY':
      return { ...state, products: { ...state.products, searchQuery: action.payload } };
    case 'PRODUCTS_LOADING':
      return { ...state, products: { ...state.products, loading: true, error: null } };
    case 'PRODUCTS_LOADED':
      return { ...state, products: { ...state.products, loading: false, items: action.payload } };
    case 'PRODUCTS_ERROR':
      return { ...state, products: { ...state.products, loading: false, error: action.payload } };

    // ---- News ----
    case 'SET_ACTIVE_NEWS':
      return { ...state, news: { ...state.news, activeNews: action.payload } };
    case 'NEWS_LOADING':
      return { ...state, news: { ...state.news, loading: true, error: null } };
    case 'NEWS_LOADED':
      return { ...state, news: { ...state.news, loading: false, items: action.payload } };
    case 'NEWS_ERROR':
      return { ...state, news: { ...state.news, loading: false, error: action.payload } };

    // ---- Inquiry ----
    case 'INQUIRY_LOADING':
      return { ...state, inquiry: { loading: true, success: false, error: null } };
    case 'INQUIRY_SUCCESS':
      return { ...state, inquiry: { loading: false, success: true, error: null } };
    case 'INQUIRY_ERROR':
      return { ...state, inquiry: { loading: false, success: false, error: action.payload } };
    case 'RESET_INQUIRY':
      return { ...state, inquiry: { loading: false, success: false, error: null } };

    default:
      return state;
  }
}

// ============================================================================
// Pub-Sub Store Core (Zero context re-render cascade)
// ============================================================================

let currentState = initialState;
const listeners = new Set<() => void>();

export const store = {
  getState: () => currentState,
  dispatch: (action: AppAction) => {
    currentState = appReducer(currentState, action);
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

// ============================================================================
// Provider (Retained as dummy wrapper for backward compatibility)
// ============================================================================

export function AppProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// ============================================================================
// Hooks
// ============================================================================

export function useAppSelector<T>(selector: (state: AppState) => T): T {
  const latestSelector = useRef(selector);
  const latestSelectedState = useRef<T | undefined>(undefined);
  const latestStoreState = useRef<AppState | undefined>(undefined);
  const previousSelector = useRef(selector);

  latestSelector.current = selector;

  const getSnapshot = useCallback(() => {
    const currentStoreState = store.getState();
    const selectorChanged = previousSelector.current !== latestSelector.current;

    if (
      !selectorChanged &&
      latestStoreState.current === currentStoreState &&
      latestSelectedState.current !== undefined
    ) {
      return latestSelectedState.current;
    }

    const nextSelected = latestSelector.current(currentStoreState);

    if (
      !selectorChanged &&
      latestSelectedState.current !== undefined &&
      (nextSelected === latestSelectedState.current ||
        JSON.stringify(nextSelected) === JSON.stringify(latestSelectedState.current))
    ) {
      latestStoreState.current = currentStoreState;
      return latestSelectedState.current;
    }

    previousSelector.current = latestSelector.current;
    latestStoreState.current = currentStoreState;
    latestSelectedState.current = nextSelected;
    return nextSelected;
  }, []);

  const getServerSnapshot = useCallback(() => {
    return latestSelector.current(initialState);
  }, []);

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

export function useAppDispatch() {
  return store.dispatch;
}

// ============================================================================
// Async Actions
// ============================================================================

export type AppDispatch = typeof store.dispatch;

/**
 * Load product catalog asynchronously. Queries Supabase database if configured, falling back to local JSON.
 */
export async function getProducts(dispatch: AppDispatch): Promise<void> {
  const state = store.getState();
  if (state.products.items.length > 0 || state.products.loading) {
    return;
  }
  dispatch({ type: 'PRODUCTS_LOADING' });
  try {
    if (isSupabaseConfigured && supabase) {
      console.log('[Supabase API] Querying product catalog from PostgreSQL...');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_id', { ascending: true });

      if (error) {
        throw error;
      }

      // Map snake_case database schema back to frontend camelCase type schema
      const items: ProductItem[] = (data as DatabaseProduct[] || []).map((p: DatabaseProduct) => ({
        id: p.product_id,
        name: p.name,
        segmentId: p.segment_id,
        dosageForm: p.dosage_form,
        composition: p.active_ingredients || '',
        strength: p.strength || '',
        packaging: p.packaging || '',
        indications: p.indications || ''
      }));

      console.info(`[Products] Catalog loaded from Supabase: ${items.length} products.`);
      dispatch({ type: 'PRODUCTS_LOADED', payload: items });
    } else {
      console.warn('[DB Fallback] Supabase not configured. Loading offline products catalog chunk...');
      const module = await import('./constants/products.json');
      const items = module.default as ProductItem[];
      console.info(`[Products] Catalog dynamically loaded from local JSON: ${items.length} products.`);
      dispatch({ type: 'PRODUCTS_LOADED', payload: items });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Products] Failed to load products catalog:', errorMessage);
    dispatch({ type: 'PRODUCTS_ERROR', payload: errorMessage });
  }
}

/**
 * Fetch news articles from Supabase with offline fallback.
 */
export async function getNews(dispatch: AppDispatch): Promise<void> {
  const state = store.getState();
  if (state.news.items.length > 0 || state.news.loading) {
    return;
  }
  dispatch({ type: 'NEWS_LOADING' });

  try {
    if (isSupabaseConfigured && supabase) {
      console.log('[Supabase API] Querying news articles from PostgreSQL...');
      const { data, error } = await supabase
        .from('news')
        .select('*');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const items = (data as DatabaseNews[]).map((n: DatabaseNews) => ({
          id: n.id,
          title: n.title,
          category: n.category,
          publishDate: n.publish_date,
          description: n.description,
          imageUrl: n.image_url,
          content: n.content
        })) as NewsArticle[];
        dispatch({ type: 'NEWS_LOADED', payload: items });
        return;
      }
    }
    
    // Default fallback to offline static news
    console.info('[News] Supabase unconfigured or empty. Serving offline NEWS_ARTICLES.');
    dispatch({ type: 'NEWS_LOADED', payload: [...NEWS_ARTICLES] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('[News] Supabase fetch failed, serving offline fallback:', errorMessage);
    dispatch({ type: 'NEWS_LOADED', payload: [...NEWS_ARTICLES] });
  }
}

// ============================================================================
// Inquiry Form Submission
// ============================================================================

export interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  department: string;
  subject: string;
  message: string;
}

function sanitizeString(str: string, maxLength = 1000): string {
  if (!str) return '';
  return str.trim().substring(0, maxLength);
}

export async function sendInquiryEmail(
  dispatch: AppDispatch,
  params: {
    readonly name: string;
    readonly email: string;
    readonly phone?: string;
    readonly department: string;
    readonly subject: string;
    readonly message: string;
  }
): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }
    // Proxy email request through Supabase Edge Function to avoid leaking client credentials
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        action: 'contact_inquiry',
        template_params: {
          from_name: sanitizeString(params.name, 100),
          from_email: sanitizeString(params.email, 150),
          from_phone: params.phone ? sanitizeString(params.phone, 30) : 'Not Provided',
          target_dept: sanitizeString(params.department, 80),
          subject_text: sanitizeString(params.subject, 200),
          message_body: sanitizeString(params.message, 1500)
        }
      }
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Email Proxy Error:', err);
    return false;
  }
}

/**
 * Submit contact inquiry to Supabase database and dispatch EmailJS notification.
 */
export async function submitInquiryForm(
  dispatch: AppDispatch,
  formData: InquiryFormData
): Promise<void> {
  const sanitizedData = {
    name: sanitizeString(formData.name, 100),
    email: sanitizeString(formData.email, 100),
    phone: sanitizeString(formData.phone || '', 20),
    department: sanitizeString(formData.department, 50),
    subject: sanitizeString(formData.subject, 200),
    message: sanitizeString(formData.message, 2000),
    timestamp: new Date().toISOString(),
  };

  if (!sanitizedData.name || !sanitizedData.email || !sanitizedData.message) {
    const msg = 'Required fields (Name, Email, Message) are missing.';
    dispatch({ type: 'INQUIRY_ERROR', payload: msg });
    throw new Error(msg);
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitizedData.email)) {
    const msg = 'Invalid email address format.';
    dispatch({ type: 'INQUIRY_ERROR', payload: msg });
    throw new Error(msg);
  }

  dispatch({ type: 'INQUIRY_LOADING' });

  try {
    if (isSupabaseConfigured && supabase) {
      console.log('[Supabase API] Writing inquiry to PostgreSQL...');
      const { error: insertError } = await supabase
        .from('inquiries')
        .insert([sanitizedData]);

      if (insertError) {
        throw insertError;
      }
      console.log('[Inquiry] Inquiry posted to Supabase successfully.');
      
      // Dispatch email notification via proxy
      console.log('[Email API] Dispatching alert via secure Edge Function Email Proxy...');
      await sendInquiryEmail(dispatch, sanitizedData);
    } else {
      console.warn('[Inquiry Fallback] Supabase unconfigured. Simulating successful database write.');
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    dispatch({ type: 'INQUIRY_SUCCESS' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Inquiry] Submit failed:', errorMessage);
    dispatch({ type: 'INQUIRY_ERROR', payload: errorMessage });
    throw error;
  }
}

