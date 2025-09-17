
"use client";

import { PestDetectionClient } from './pest-detection-client';
import { PageHeader } from '@/components/page-header';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/hooks/use-translation';
import layoutTranslations from '@/lib/translations/layout.json';

export default function PestDetectionPage() {
  const { language } = useLanguage();
  const t = useTranslation(language, layoutTranslations);
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title={t.navPestDetection}
        description={t.descPestDetection}
      />
      <PestDetectionClient />
    </div>
  );
}
