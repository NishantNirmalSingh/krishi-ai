import { CropAdvisoryClient } from './crop-advisory-client';
import { PageHeader } from '@/components/page-header';

export default function CropAdvisoryPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-8">
      <PageHeader
        title="Multilingual Crop Advisory"
        description="Ask our AI a question about your crops in your preferred language. Get personalized advice based on your location and soil type."
      />
      <CropAdvisoryClient />
    </div>
  );
}
