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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: 'English',
      plantImage: undefined,
    }
  });
  
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
      try {
        const detectionResult = await handlePestDetection({ 
          photoDataUri: dataUri,
          language: data.language
        });
        setResult(detectionResult);
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'An error occurred while analyzing the image. Please try again.',
        });
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'File Error',
        description: 'Failed to read the image file.',
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
          <CardTitle>Upload Plant Image</CardTitle>
          <CardDescription>Select a language and a clear photo of the affected plant part.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
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
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB)</p>
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
                Analyze Image
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>Here is the diagnosis and recommendation from our AI.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing your image...</p>
            </div>
          )}
          {result && !isLoading && (
            <div className="space-y-4 w-full">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-muted-foreground">Identified Issue</h3>
                  <p className="text-2xl font-bold text-primary">{result.disease}</p>
                </div>
                {result.audio && (
                   <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => toggleAudio(result.audio!)}>
                     {playingAudio === result.audio ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                   </Button>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">Confidence Level</h3>
                <p className="text-lg">{(result.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">Recommended Treatment</h3>
                <p className="text-sm whitespace-pre-wrap">{result.treatmentOptions}</p>
              </div>
            </div>
          )}
          {!result && !isLoading && (
            <div className="text-center text-muted-foreground">
              <p>Your analysis result will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
