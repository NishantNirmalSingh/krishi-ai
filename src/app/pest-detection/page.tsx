import { PestDetectionClient } from './pest-detection-client';
import { PageHeader } from '@/components/page-header';

export default function PestDetectionPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="AI Pest & Disease Detection"
        description="Upload an image of an infected leaf or plant. Our AI will analyze the image, identify the pest/disease, and recommend treatment options."
      />
      <PestDetectionClient />
    </div>
  );
}
