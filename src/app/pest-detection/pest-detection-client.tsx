
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
import { Loader2, Upload, Play, Pause, X, Mic, MicOff, Search } from 'lucide-react';
import { handlePestDetection, handleTextToSpeech } from '@/app/actions';
import type { DetectPestDiseaseOutput } from '@/ai/flows/pest-disease-detection';
import { useToast } from '@/hooks/use-toast';
import { languages } from '@/lib/languages';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/hooks/use-translation';
import pestDetectionTranslations from '@/lib/translations/pest-detection.json';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const formSchema = z.object({
  language: z.string().min(1, 'Please select a language.'),
  description: z.string().optional(),
  plantImage: z.any()
    .optional()
    .refine((files) => !files || files?.length !== 1 || files?.[0]?.size <= 5000000, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files?.length !== 1 || ['image/jpeg', 'image/png'].includes(files?.[0]?.type),
      'Only .jpg and .png file formats are supported.'
    ),
}).refine(data => data.plantImage?.length === 1 || (data.description && data.description.length > 0), {
    message: 'Please upload an image or provide a description.',
    path: ['description'], // Show error under description field
});

type ResultWithAudio = DetectPestDiseaseOutput & { audio?: string };

export function PestDetectionClient() {
  const [result, setResult] = useState<ResultWithAudio | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(language, pestDetectionTranslations);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: language,
      description: '',
      plantImage: undefined,
    }
  });

  useEffect(() => {
    form.setValue('language', language);
  }, [language, form]);

  const handleLanguageChange = (langValue: string) => {
    setLanguage(langValue);
    setResult(null);
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
      recognitionRef.current.lang = languages.find(l => l.value === language)?.code || 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        form.setValue('description', transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        let description = `An error occurred: ${event.error}. Please ensure microphone access is allowed.`;
        if (event.error === 'network') {
          description = 'A network error occurred. Please check your internet connection or try a different browser.';
        }
        toast({ variant: 'destructive', title: 'Speech Recognition Error', description });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => setIsRecording(false);
    } else {
      setIsSpeechSupported(false);
    }
    
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
        }
    }
  }, [language, toast, form]);

  const toggleRecording = () => {
    if (!isSpeechSupported || !recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = languages.find(l => l.value === form.getValues('language'))?.code || 'en-US';
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('plantImage', event.target.files);
      form.clearErrors('description');
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    if(playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    }
    
    const file = data.plantImage?.[0];
    const description = data.description;

    const processRequest = async (photoDataUri?: string) => {
        try {
            const detectionResult = await handlePestDetection({ 
                photoDataUri,
                description,
                language: data.language
            });
            setResult(detectionResult);
        } catch (e: any) {
            let errorDesc = 'An error occurred while analyzing your request. Please try again.';
            if (e.message?.includes('429') || e.message?.includes('rate limit')) {
              errorDesc = 'You have made too many requests. Please wait a moment before trying again.';
            }
            toast({
            variant: 'destructive',
            title: t.analysisFailedTitle,
            description: errorDesc,
            });
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };


    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => processRequest(reader.result as string);
        reader.onerror = () => {
            toast({ variant: 'destructive', title: t.fileErrorTitle, description: t.fileErrorDescription });
            setIsLoading(false);
        };
    } else {
        processRequest();
    }
  };

  const resetForm = () => {
    setImagePreview(null);
    setResult(null);
    form.reset({
        language: form.getValues('language'),
        description: '',
        plantImage: undefined
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if(playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    }
  };

  const toggleAudio = async () => {
    if (!audioRef.current || !result) return;
    const audio = audioRef.current;
    
    if (playingAudio === result.audio && !audio.paused) {
        audio.pause();
        setPlayingAudio(null);
        return;
    }
    
    if (result.audio) {
        if(!audio.paused) audio.pause();
        audio.src = result.audio;
        audio.play().catch(e => console.error("Error playing audio:", e));
        setPlayingAudio(result.audio);
        return;
    }

    setIsLoading(true);
    try {
        const audioDataUri = await handleTextToSpeech({ text: result.summaryForAudio, language: form.getValues('language')});
        setResult(prev => prev ? { ...prev, audio: audioDataUri } : null);

        if(!audio.paused) audio.pause();
        audio.src = audioDataUri;
        audio.play().catch(e => console.error("Error playing audio:", e));
        setPlayingAudio(audioDataUri);

    } catch (e: any) {
        let description = 'An error occurred while generating audio. Please try again.';
        if (e.message?.includes('429') || e.message?.includes('rate limit')) {
          description = 'The audio generation service is currently busy. Please try again in a moment.';
        }
        toast({
            variant: 'destructive',
            title: 'Audio Generation Failed',
            description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{t.uploadTitle}</CardTitle>
              <CardDescription>{t.uploadDescription}</CardDescription>
            </CardHeader>
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
                render={() => (
                  <FormItem>
                    <FormLabel
                      htmlFor="plantImage"
                      className={cn(
                        "relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 hover:border-primary",
                        {"cursor-default hover:border-dashed": imagePreview}
                      )}
                    >
                      {imagePreview ? (
                        <>
                          <Image src={imagePreview} alt="Plant preview" layout="fill" className="rounded-lg object-contain" />
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 z-10 h-7 w-7"
                            onClick={resetForm}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
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
                        ref={fileInputRef}
                        id="plantImage"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        disabled={isLoading || !!imagePreview}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="relative flex items-center justify-center">
                <Separator className="shrink" />
                <span className="absolute bg-card px-2 text-sm text-muted-foreground">{t.orSeparator}</span>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.descriptionLabel}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea 
                            placeholder={t.descriptionPlaceholder} 
                            {...field} 
                            disabled={isLoading} 
                            rows={2} 
                            className="pr-10"
                        />
                         {isSpeechSupported && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" size="icon" variant={isRecording ? 'destructive' : 'ghost'} onClick={toggleRecording} disabled={isLoading} className="absolute right-1 bottom-1 h-8 w-8">
                                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t.voiceInputTooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  {t.analyzeButton}
                </Button>
                {(imagePreview || form.getValues('description')) && (
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading} className="w-full">
                        {t.resetButton}
                    </Button>
                )}
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
          {isLoading && !result && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">{t.loadingMessage}</p>
            </div>
          )}
          {result && (
            <div className="space-y-4 w-full">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-muted-foreground">{t.identifiedIssueLabel}</h3>
                  <p className="text-2xl font-bold text-primary">{result.disease}</p>
                </div>
                 <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleAudio} disabled={isLoading && !result.audio}>
                   {playingAudio === result.audio ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                 </Button>
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
            <div className="text-center text-muted-foreground p-4">
              <p>{t.initialResultMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
