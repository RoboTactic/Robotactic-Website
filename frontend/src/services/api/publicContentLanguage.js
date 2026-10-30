import { useSyncExternalStore } from 'react';

/*
  Public-site language. <html lang> is the single source of truth: every public component
  reads it, and useContentLanguage() re-renders a component whenever it changes. Arabic is the
  default; a visitor's choice is remembered in localStorage. (The Dashboard keeps its own
  language toggle and restores <html lang/dir> when it unmounts.)
*/
const STORAGE_KEY = 'robotactic-language';

export const contentLanguage = () => document.documentElement.lang === 'en' ? 'en' : 'ar';
export const translated = (record, key, language = contentLanguage()) => record?.[`${key}_${language}`] || record?.[`${key}_${language === 'ar' ? 'en' : 'ar'}`] || '';

function applyLanguage(language) {
  const root = document.documentElement;
  root.lang = language;
  root.dir = language === 'en' ? 'ltr' : 'rtl';
}

/* Before the first render, so the page never flashes in the wrong direction. */
export function initContentLanguage() {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* storage unavailable: use the default */ }
  applyLanguage(saved === 'en' ? 'en' : 'ar');
}

export function setContentLanguage(language) {
  const next = language === 'en' ? 'en' : 'ar';
  applyLanguage(next);
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* the choice still applies to this visit */ }
}

// Live version for components that must follow a language change without a route change
// (the mobile menu stays mounted): re-reads <html lang> whenever the attribute changes.
const subscribeToLanguage = (onChange) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  return () => observer.disconnect();
};
export const useContentLanguage = () => useSyncExternalStore(subscribeToLanguage, contentLanguage);

/* `t('عربي', 'English')` or `t(['عربي', 'English'])` → the text for the active language. */
export function useLanguage() {
  const language = useContentLanguage();
  const en = language === 'en';
  const t = (ar, english) => (Array.isArray(ar) ? ar[en ? 1 : 0] : en ? english : ar);
  return { language, en, dir: en ? 'ltr' : 'rtl', t };
}
