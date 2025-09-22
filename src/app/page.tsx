
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useLanguage } from "@/context/language-context";
import { useTranslation } from "@/hooks/use-translation";
import homeTranslations from "@/lib/translations/home.json";
import layoutTranslations from "@/lib/translations/layout.json";
import { languages } from "@/lib/languages";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardPage() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(language, homeTranslations);
  const t_layout = useTranslation(language, layoutTranslations);

  const quickActions = [
    {
      title: t_layout.navCropAdvisory,
      description: t_layout.descCropAdvisory,
      icon: Bot,
      href: "/crop-advisory",
    },
    {
      title: t_layout.navPestDetection,
      description: t_layout.descPestDetection,
      icon: ImageIcon,
      href: "/pest-detection",
    },
    {
      title: t_layout.navMarketPrices,
      description: t_layout.descMarketPrices,
      icon: LineChart,
      href: "/market-prices",
    },
    {
      title: t_layout.navWeather,
      description: t_layout.descWeather,
      icon: CloudSun,
      href: "/weather",
    },
  ];

  const selectedLanguageLabel = languages.find(l => l.value === language)?.label || 'English';

  return (
    <div className="flex flex-col gap-8">
       <div className="relative overflow-hidden rounded-xl shadow-lg">
        <Image
          src="https://picsum.photos/seed/hero-farmer/1200/400"
          width={1200}
          height={400}
          alt="Farmer using a smartphone in a field"
          className="aspect-[16/6] w-full object-cover"
          data-ai-hint="farmer smartphone field"
          priority
        />
        <div className="absolute inset-0 z-10 flex flex-col bg-gradient-to-t from-black/80 to-transparent">
            {/* Header for buttons */}
            <div className="flex justify-between p-4">
                <div className="md:hidden">
                    <SidebarTrigger className="bg-background/80 text-foreground hover:bg-background"/>
                </div>
                <div className="ml-auto">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="gap-2 bg-background/80 hover:bg-background">
                        <Globe className="h-4 w-4"/>
                        <span>{selectedLanguageLabel}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {languages.map((lang) => (
                            <DropdownMenuItem key={lang.value} onSelect={() => setLanguage(lang.value)}>
                                {lang.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 items-center justify-center p-6 text-center">
                <h1 className="font-headline text-2xl font-bold text-white sm:text-3xl md:text-5xl">
                    {t.heroTitle}
                </h1>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="flex h-full flex-col shadow-subtle transition-shadow duration-300 hover:shadow-subtle-lg"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">
                {action.title}
              </CardTitle>
              <action.icon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{action.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={action.href}>{t_layout.launchButton}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
