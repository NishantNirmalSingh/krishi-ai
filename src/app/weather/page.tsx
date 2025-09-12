import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Sun, Waves, Wind } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BellRing, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const weeklyForecast = [
  { day: "Mon", Icon: Sun, temp: "32°" },
  { day: "Tue", Icon: CloudSun, temp: "31°" },
  { day: "Wed", Icon: CloudRain, temp: "28°" },
  { day: "Thu", Icon: Cloud, temp: "29°" },
  { day: "Fri", Icon: CloudLightning, temp: "27°" },
  { day: "Sat", Icon: CloudDrizzle, temp: "29°" },
  { day: "Sun", Icon: Sun, temp: "33°" },
];

export default function WeatherPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Hyper-Local Weather"
        description="Real-time forecasts and predictive insights for your specific village/taluka."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Conditions</CardTitle>
            <CardDescription>Last updated: just now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-6xl font-bold">31°C</p>
                <p className="text-muted-foreground">Partly Cloudy</p>
              </div>
              <CloudSun className="h-24 w-24 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Wind className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Wind:</span>
                <span>12 km/h</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Waves className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Humidity:</span>
                <span>68%</span>
              </div>
            </div>
            <div className="flex justify-between rounded-lg border bg-muted/50 p-4">
              {weeklyForecast.map(({ day, Icon, temp }) => (
                <div key={day} className="flex flex-col items-center space-y-2">
                  <span className="text-sm text-muted-foreground">{day}</span>
                  <Icon className="h-8 w-8 text-primary" />
                  <span className="font-semibold">{temp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-accent bg-accent/20 text-accent-foreground">
                <BellRing className="h-4 w-4" />
                <AlertTitle className="font-headline">Heads Up!</AlertTitle>
                <AlertDescription>
                  Heavy rain expected in 48 hours. It is advised to delay fertilizer application.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Offline Access</CardTitle>
              <CardDescription>Key information available without internet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-muted-foreground">
                  <WifiOff className="h-8 w-8"/>
                  <p className="text-sm">
                  Critical information like pest guides and common advisories can be downloaded for offline access. This feature is coming soon to the mobile app.
                  </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
