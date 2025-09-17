import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, Image as ImageIcon, LineChart, CloudSun, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const quickActions = [
  {
    title: "Crop Advisory",
    description: "Get personalized crop advice.",
    icon: Bot,
    href: "/crop-advisory",
  },
  {
    title: "Pest Detection",
    description: "Identify pests from an image.",
    icon: ImageIcon,
    href: "/pest-detection",
  },
  {
    title: "Market Prices",
    description: "View current market prices.",
    icon: LineChart,
    href: "/market-prices",
  },
  {
    title: "Weather Forecast",
    description: "Check local weather alerts.",
    icon: CloudSun,
    href: "/weather",
  },
];

const languages = [
    { value: 'Assamese', label: 'অসমীয়া (Assamese)' },
    { value: 'Bengali', label: 'বাংলা (Bengali)' },
    { value: 'English', label: 'English' },
    { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
    { value: 'Hindi', label: 'हिंदी (Hindi)' },
    { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
    { value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
    { value: 'Marathi', label: 'मराठी (Marathi)' },
    { value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)' },
    { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { value: 'Tamil', label: 'தமிழ் (Tamil)' },
    { value: 'Telugu', label: 'తెలుగు (Telugu)' },
    { value: 'Urdu', label: 'اردو (Urdu)' },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-xl shadow-lg">
        <div className="absolute right-4 top-4 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="h-4 w-4"/>
                  <span>English</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.value}>
                        {lang.label}
                    </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <Image
          src="https://picsum.photos/seed/hero-farmer/1200/400"
          width={1200}
          height={400}
          alt="Farmer using a smartphone in a field"
          className="aspect-[16/6] w-full object-cover"
          data-ai-hint="farmer smartphone field"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-black/70 to-black/20 p-8 md:p-12">
          <h1 className="max-w-2xl font-headline text-3xl font-bold text-white md:text-5xl">
            Your Personal AI Agri-Scientist, Always in Your Pocket.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
            Get personalized crop advice, pest control, and market prices in
            your own language, just by speaking.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link href="/crop-advisory">Get Started</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="flex h-full flex-col transition-shadow duration-300 hover:shadow-lg"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {action.title}
              </CardTitle>
              <action.icon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{action.description}</CardDescription>
            </CardContent>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={action.href}>Launch</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

    