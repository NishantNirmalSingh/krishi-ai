import { CropAdvisoryClient } from './crop-advisory-client';
import { PageHeader } from '@/components/page-header';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/context/language-context';
import layoutTranslations from '@/lib/translations/layout.json';

export default function CropAdvisoryPage() {
  const { language } = useLanguage();
  const t = useTranslation(language, layoutTranslations);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-8">
      <PageHeader
        title={t.navCropAdvisory}
        description={t.descCropAdvisory}
      />
      <CropAdvisoryClient />
    </div>
  );
}
