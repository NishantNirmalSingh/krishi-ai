
"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
  Wind,
  Waves,
  BellRing,
  Play,
  Pause,
} from "lucide-react";
import { handleWeatherForecast } from "../actions";
import type { WeatherForecastOutput } from "@/ai/flows/get-weather-forecast";
import { languages } from "@/lib/languages";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import weatherTranslations from "@/lib/translations/weather.json";
import { useLanguage } from "@/context/language-context";

const formSchema = z.object({
  language: z.string().min(1, "Please select a language."),
  location: z.string().min(2, "Location is required."),
});

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
};

type AudioPlaybackInfo = {
  url: string;
  startTime: number;
  endTime: number;
};

export function WeatherClient() {
  const [result, setResult] = useState<WeatherForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(language, weatherTranslations);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudio, setPlayingAudio] = useState<AudioPlaybackInfo | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: language,
      location: "",
    },
  });
  
  useEffect(() => {
    form.setValue('language', language);
  }, [language, form]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
        if (audio.currentTime >= (playingAudio?.endTime ?? 0)) {
            audio.pause();
            setPlayingAudio(null);
        }
    };
    const handlePause = () => setPlayingAudio(null);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('pause', handlePause);
    
    return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('pause', handlePause);
        audio.pause();
    }
  }, [playingAudio]);

  const handleLanguageChange = (langValue: string) => {
    setLanguage(langValue);
  };
  
  const handleSearch = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    if (playingAudio) {
      audioRef.current?.pause();
    }

    try {
      const searchResult = await handleWeatherForecast(data);
      setResult(searchResult);
    } catch (error: any) {
      console.error("Failed to fetch weather forecast:", error);
      let description = "Could not fetch weather data. Please try again.";
      if (error.message && error.message.includes("429")) {
        description = "You have exceeded the API quota for today. Please try again tomorrow.";
      } else if (error.message && error.message.includes("503")) {
        description = "The AI model is currently overloaded. Please try again in a few moments.";
      }
      toast({
        title: t.searchFailedTitle,
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = (audioInfo: AudioPlaybackInfo) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // If the clicked audio is already playing, pause it.
    if (playingAudio?.url === audioInfo.url && playingAudio?.startTime === audioInfo.startTime) {
        audio.pause();
        setPlayingAudio(null);
    } else {
        // If a different audio is playing, pause it first.
        if (!audio.paused) {
            audio.pause();
        }

        // Set the new source, update current time, play, and set state.
        if (audio.src !== audioInfo.url) {
            audio.src = audioInfo.url;
        }
        audio.currentTime = audioInfo.startTime;
        audio.play();
        setPlayingAudio(audioInfo);
    }
  };
  
  const getLoadingMessage = () => {
    const message = t.loadingMessage || 'Finding weather data for "{{location}}"...';
    return message.replace('{{location}}', form.getValues('location') || 'your location');
  }
  
  const getLastUpdatedMessage = () => {
      if (!result?.lastUpdated) return '';
      const message = t.lastUpdated || 'Last updated: {{time}}';
      return message.replace('{{time}}', result.lastUpdated);
  }

  const renderInitialState = () => (
    <Card className="lg:col-span-3">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full border border-dashed p-4">
              <CloudSun className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">{t.initialTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.initialMessage}</p>
        </CardContent>
    </Card>
  );

  const renderLoadingState = () => (
     <Card className="lg:col-span-3">
        <CardHeader>
            <CardTitle>{t.loadingTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20 text-muted-foreground">
            <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin"/>
                <p>{getLoadingMessage()}</p>
            </div>
        </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>{t.languageLabel}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleLanguageChange(value);
                    }}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.languagePlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t.locationLabel}</FormLabel>
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t.locationPlaceholder}
                        className="pl-10 pr-20"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        <span className="hidden lg:inline ml-2">{t.searchButton}</span>
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && renderLoadingState()}
        {!isLoading && !result && renderInitialState()}
        {result && !isLoading && (
            <>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t.currentConditions}</CardTitle>
                        <CardDescription>{getLastUpdatedMessage()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center justify-between">
                        <div>
                            <p className="text-6xl font-bold">{result.currentConditions.temperature}</p>
                            <p className="text-muted-foreground">{result.currentConditions.condition}</p>
                        </div>
                        {React.createElement(iconMap[result.currentConditions.icon] || CloudSun, { className: "h-24 w-24 text-muted-foreground"})}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Wind className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{t.wind}:</span>
                            <span>{result.currentConditions.wind}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Waves className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{t.humidity}:</span>
                            <span>{result.currentConditions.humidity}</span>
                        </div>
                        </div>
                        <div className="flex justify-between rounded-lg border bg-muted/50 p-4">
                        {result.weeklyForecast.map(({ day, icon, temp }) => {
                          const IconComponent = iconMap[icon] || Cloud;
                          return (
                            <div key={day} className="flex flex-col items-center space-y-2">
                                <span className="text-sm text-muted-foreground">{day}</span>
                                <IconComponent className="h-8 w-8 text-primary" />
                                <span className="font-semibold">{temp}</span>
                            </div>
                          )
                        })}
                        </div>
                    </CardContent>
                </Card>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                        <CardTitle>{t.predictiveAlerts}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.predictiveAlerts.length > 0 ? (
                                result.predictiveAlerts.map((alert, index) => {
                                    const audioInfo = {
                                        url: alert.audio.url,
                                        startTime: alert.audio.startTime,
                                        endTime: alert.audio.endTime,
                                    };
                                    const isPlaying = playingAudio?.url === audioInfo.url && playingAudio?.startTime === audioInfo.startTime;

                                    return (
                                        <Alert key={index} className="bg-accent text-accent-foreground border-accent/50">
                                            <div className="flex justify-between items-center">
                                                <BellRing className="h-4 w-4" />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-accent-foreground/80 hover:text-accent-foreground" onClick={() => toggleAudio(audioInfo)}>
                                                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                            <AlertTitle className="font-headline">{alert.title}</AlertTitle>
                                            <AlertDescription>
                                                {alert.description}
                                            </AlertDescription>
                                        </Alert>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground">{t.noAlerts}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </>
        )}
      </div>

    </div>
  );
}
