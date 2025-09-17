
"use client";

import { WeatherClient } from './weather-client';
import { PageHeader } from '@/components/page-header';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/hooks/use-translation';
import layoutTranslations from '@/lib/translations/layout.json';

export default function WeatherPage() {
  const { language } = useLanguage();
  const t = useTranslation(language, layoutTranslations);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t.navWeather}
        description={t.descWeather}
      />
      <WeatherClient />
    </div>
  );
}
