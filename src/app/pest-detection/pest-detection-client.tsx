
"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Loader2, Upload, Play, Pause } from 'lucide-react';
import { handlePestDetection } from '@/app/actions';
import type { DetectPestDiseaseOutput } from '@/ai/flows/pest-disease-detection';
import { useToast } from '@/hooks/use-toast';
import { languages } from '@/lib/languages';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/hooks/use-translation';
import pestDetectionTranslations from '@/lib/translations/pest-detection.json';

const formSchema = z.object({
  language: z.string().min(1, 'Please select a language.'),
  plantImage: z.any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine((files) => files?.[0]?.size <= 5000000, `Max file size is 5MB.`)
    .refine(
      (files) => ['image/jpeg', 'image/png'].includes(files?.[0]?.type),
      'Only .jpg and .png formats are supported.'
    ),
});

export function PestDetectionClient() {
  const [result, setResult] = useState<DetectPestDiseaseOutput | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(language, pestDetectionTranslations);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: language,
      plantImage: undefined,
    }
  });

  useEffect(() => {
    form.setValue('language', language);
  }, [language, form]);

  const handleLanguageChange = (langValue: string) => {
    setLanguage(langValue);
    // If there is an image and a result, re-analyze with the new language
    if (imagePreview && result) {
      form.handleSubmit(onSubmit)();
    }
  };
  
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setPlayingAudio(null);
    audioRef.current.onpause = () => setPlayingAudio(null);
    
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
        }
    }
  }, []);

  const fileRef = form.register('plantImage');

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    if(playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    }

    const file = data.plantImage[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri); // Ensure preview is set
      try {
        const detectionResult = await handlePestDetection({ 
          photoDataUri: dataUri,
          language: data.language
        });
        setResult(detectionResult);
      } catch (e: any) {
        let description = 'An error occurred while analyzing the image. Please try again.';
        if (e.message && e.message.includes('429')) {
          description = 'You have exceeded the API quota for today. Please try again tomorrow.';
        } else if (e.message && e.message.includes('503')) {
          description = 'The AI model is currently overloaded. Please try again in a few moments.';
        }
        toast({
          variant: 'destructive',
          title: t.analysisFailedTitle,
          description,
        });
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: t.fileErrorTitle,
        description: t.fileErrorDescription,
      });
      setIsLoading(false);
    };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
    setResult(null);
    if(playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    }
  };

  const toggleAudio = (audioDataUri: string) => {
    if (!audioRef.current) return;
    
    if (playingAudio === audioDataUri) {
        audioRef.current.pause();
        setPlayingAudio(null);
    } else {
        if(playingAudio) {
            audioRef.current.pause();
        }
        audioRef.current.src = audioDataUri;
        audioRef.current.play();
        setPlayingAudio(audioDataUri);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t.uploadTitle}</CardTitle>
          <CardDescription>{t.uploadDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
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
                name="plantImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor="plantImage"
                      className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:border-primary"
                    >
                      {imagePreview ? (
                        <Image src={imagePreview} alt="Plant preview" width={400} height={225} className="h-full w-full rounded-lg object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">{t.uploadClick}</span> {t.uploadDrag}</p>
                          <p className="text-xs text-muted-foreground">{t.uploadFormat}</p>
                        </div>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...fileRef}
                        id="plantImage"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={(e) => {
                          field.onChange(e.target.files);
                          handleFileChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t.analyzeButton}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{t.resultTitle}</CardTitle>
          <CardDescription>{t.resultDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">{t.loadingMessage}</p>
            </div>
          )}
          {result && !isLoading && (
            <div className="space-y-4 w-full">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-muted-foreground">{t.identifiedIssueLabel}</h3>
                  <p className="text-2xl font-bold text-primary">{result.disease}</p>
                </div>
                {result.audio && (
                   <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => toggleAudio(result.audio!)}>
                     {playingAudio === result.audio ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                   </Button>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">{t.confidenceLabel}</h3>
                <p className="text-lg">{(result.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">{t.treatmentLabel}</h3>
                <p className="text-sm whitespace-pre-wrap">{result.treatmentOptions}</p>
              </div>
            </div>
          )}
          {!result && !isLoading && (
            <div className="text-center text-muted-foreground">
              <p>{t.initialResultMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    