
import { WeatherClient } from './weather-client';
import { PageHeader } from '@/components/page-header';

export default function WeatherPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Hyper-Local Weather"
        description="Get real-time forecasts and predictive insights for your specific location, in your language."
      />
      <WeatherClient />
    </div>
  );
}

    