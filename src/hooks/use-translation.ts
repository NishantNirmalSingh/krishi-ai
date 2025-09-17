
"use client";

export function useTranslation(lang: string, translations: any) {
  return translations[lang] || translations['English'] || {};
}

    