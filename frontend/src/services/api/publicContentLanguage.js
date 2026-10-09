export const contentLanguage = () => document.documentElement.lang === 'en' ? 'en' : 'ar';
export const translated = (record, key, language = contentLanguage()) => record?.[`${key}_${language}`] || record?.[`${key}_${language === 'ar' ? 'en' : 'ar'}`] || '';
