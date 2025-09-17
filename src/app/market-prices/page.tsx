
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus, Search, Loader2, Store, Globe, Mic, MicOff, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { handleMarketPriceSearch } from "../actions";
import type { MarketPriceOutput } from "@/ai/flows/get-market-price";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { languages } from "@/lib/languages";
import { useLanguage } from "@/context/language-context";
import { useTranslation } from "@/hooks/use-translation";
import marketPricesTranslations from "@/lib/translations/market-prices.json";
import layoutTranslations from '@/lib/translations/layout.json';


const formSchema = z.object({
  language: z.string().min(1, 'Please select a language.'),
  crop: z.string().min(2, 'Crop name is required.'),
});

export default function MarketPricesPage() {
  const [result, setResult] = useState<MarketPriceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(language, marketPricesTranslations);
  const t_layout = useTranslation(language, layoutTranslations);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: language,
      crop: '',
    },
  });

  useEffect(() => {
    form.setValue('language', language);
  }, [language, form]);

  const handleLanguageChange = (langValue: string) => {
    setLanguage(langValue);
  };

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setPlayingAudio(null);
    audioRef.current.onpause = () => setPlayingAudio(null);

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        form.setValue('crop', transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          variant: 'destructive',
          title: 'Speech Recognition Error',
          description: `An error occurred: ${event.error}`,
        });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsSpeechSupported(false);
    }
    
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
        }
    }
  }, [form, toast]);

  const toggleRecording = () => {
    if (!isSpeechSupported) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      const selectedLangCode = languages.find(l => l.value === form.getValues('language'))?.code || 'en-US';
      recognitionRef.current.lang = selectedLangCode;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };
  
  const toggleAudio = (audioDataUri: string) => {
    if (!audioRef.current) return;
    if (playingAudio === audioDataUri) {
      audioRef.current.pause();
      setPlayingAudio(null);
    } else {
      if(playingAudio) audioRef.current.pause();
      audioRef.current.src = audioDataUri;
      audioRef.current.play();
      setPlayingAudio(audioDataUri);
    }
  };

  const handleSearch = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    if(playingAudio) audioRef.current?.pause();

    try {
      const searchResult = await handleMarketPriceSearch(data);
      setResult(searchResult);
    } catch (error: any) {
      console.error("Failed to fetch market price:", error);
      let description = "Could not fetch market price data. Please try again.";
      if (error.message && error.message.includes('503')) {
        description = 'The AI model is currently overloaded. Please try again in a few moments.';
      }
      toast({
        title: "Search Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const trend = result ? (result.currentPrice > result.historicalPrice ? 'up' : result.currentPrice < result.historicalPrice ? 'down' : 'stable') : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t_layout.navMarketPrices}
        description={t_layout.descMarketPrices}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>{t.languageLabel}</FormLabel>
                  <Select onValueChange={(value) => {field.onChange(value); handleLanguageChange(value);}} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.languagePlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="crop"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t.cropLabel}</FormLabel>
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t.cropPlaceholder}
                        className="pl-10 pr-20"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       {isSpeechSupported && (
                        <Button type="button" size="icon" variant={isRecording ? 'destructive' : 'outline'} onClick={toggleRecording} disabled={isLoading} className="shrink-0 h-8 w-8">
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
      
      {isLoading && (
        <Card>
           <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.tableHeaderCrop}</TableHead>
                    <TableHead>{t.tableHeaderMarket}</TableHead>
                    <TableHead className="text-right">{t.tableHeaderCurrentPrice}</TableHead>
                    <TableHead className="text-right">{t.tableHeaderTrend}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin"/>
                          <span>{t.loadingMessage.replace('{{crop}}', form.getValues('crop'))}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                </TableBody>
              </Table>
            </CardContent>
        </Card>
      )}

      {!isLoading && !result && (
         <Card>
           <CardContent className="p-0">
             <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead>{t.tableHeaderCrop}</TableHead>
                    <TableHead>{t.tableHeaderMarket}</TableHead>
                    <TableHead className="text-right">{t.tableHeaderCurrentPrice}</TableHead>
                    <TableHead className="text-right">{t.tableHeaderTrend}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t.initialMessage}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <div className="flex flex-col gap-8">
            <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t.resultsTitle}</CardTitle>
                    {result.audio && (
                       <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => toggleAudio(result.audio!)}>
                         {playingAudio === result.audio ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                       </Button>
                    )}
                  </div>
                  <CardContent className="p-0 pt-4">
                    <p className="text-sm text-muted-foreground">{result.summary}</p>
                  </CardContent>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.tableHeaderCrop}</TableHead>
                      <TableHead>{t.tableHeaderMarket}</TableHead>
                      <TableHead className="text-right">{t.tableHeaderCurrentPrice}</TableHead>
                      <TableHead className="text-right">{t.tableHeaderTrend}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        <TableRow key={`${result.crop}-${result.market}`}>
                          <TableCell className="font-medium">{result.crop}</TableCell>
                          <TableCell>{result.market}</TableCell>
                          <TableCell className="text-right font-mono">₹{result.currentPrice.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right">
                            {trend && (
                              <Badge variant={trend === 'down' ? 'destructive' : trend === 'up' ? 'default' : 'secondary'} className="gap-1">
                                {trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                {trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                {trend === 'stable' && <Minus className="h-3 w-3" />}
                                {t[trend]}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>{t.onlinePlatformsTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.onlinePlatforms.map((platform, index) => (
                    <div key={index}>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform.details}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0">
                  <Store className="h-5 w-5 text-primary"/>
                  <CardTitle>{t.offlinePlatformsTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.offlinePlatforms.map((platform, index) => (
                    <div key={index}>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform.details}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
        </div>
      )}
    </div>
  );
}
