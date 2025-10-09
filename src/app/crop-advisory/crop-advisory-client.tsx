
"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Bot, Send, Mic, MicOff, Play, Pause } from 'lucide-react';
import { handleCropAdvisory, handleTextToSpeech } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { languages } from '@/lib/languages';
import { useTranslation } from '@/hooks/use-translation';
import cropAdvisoryTranslations from '@/lib/translations/crop-advisory.json';
import { useLanguage } from '@/context/language-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CropAdvisoryOutput } from '@/ai/flows/multilingual-crop-advisory';

const formSchema = z.object({
  language: z.string().min(1, 'Please select a language.'),
  location: z.string().min(2, 'Location is required.'),
  question: z.string().min(10, 'Please ask a detailed question.'),
});

type Message = {
  id: number;
  role: 'user' | 'bot';
  content: React.ReactNode;
  textForAudio: string;
  audio?: string;
};

export function CropAdvisoryClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(language, cropAdvisoryTranslations);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: language,
      location: '',
      question: '',
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
        const currentQuestion = form.getValues('question');
        form.setValue('question', currentQuestion ? `${currentQuestion} ${transcript}`: transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let description = `An error occurred: ${event.error}. Please ensure microphone access is allowed.`;
        if (event.error === 'network') {
          description = 'A network error occurred. Please check your internet connection or try a different browser.';
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            description = 'Microphone access was denied. Please enable it in your browser settings.';
        }
        toast({
          variant: 'destructive',
          title: 'Speech Recognition Error',
          description: description,
        });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsSpeechSupported(false);
      console.warn("Speech recognition not supported in this browser.");
    }
    
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
        }
    }
  }, [toast, form]);
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const toggleRecording = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      toast({
        variant: 'destructive',
        title: 'Unsupported Feature',
        description: 'Speech recognition is not supported in your browser or has failed to initialize.',
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        const selectedLanguageCode = languages.find(l => l.value === form.getValues('language'))?.code;
        if (!selectedLanguageCode) {
            toast({
                variant: 'destructive',
                title: 'Language Not Selected',
                description: 'Please select a language before starting voice input.',
            });
            return;
        }
        recognitionRef.current.lang = selectedLanguageCode;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Could not start recording:", e);
        toast({
          variant: 'destructive',
          title: 'Recording Error',
          description: 'Could not start voice recording. Please check microphone permissions.',
        });
        setIsRecording(false);
      }
    }
  };
  
  const toggleAudio = async (message: Message) => {
    if (!audioRef.current) return;

    // If this message's audio is already playing, pause it.
    if (playingAudio === message.audio) {
        audioRef.current.pause();
        setPlayingAudio(null);
        return;
    }

    // If audio is already loaded, just play it.
    if(message.audio) {
      if(playingAudio) audioRef.current.pause(); // Pause any currently playing audio
      audioRef.current.src = message.audio;
      audioRef.current.play();
      setPlayingAudio(message.audio);
      return;
    }

    // If audio is not loaded, fetch it.
    setIsLoading(true);
    try {
        const audioDataUri = await handleTextToSpeech({ text: message.textForAudio, language: form.getValues('language')});

        // Update the specific message with the new audio data
        setMessages(prev => prev.map(m => 
            m.id === message.id ? { ...m, audio: audioDataUri } : m
        ));

        if(playingAudio) audioRef.current.pause();
        audioRef.current.src = audioDataUri;
        audioRef.current.play();
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


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const userMessageContent = (
      <div>
        <p className="text-sm">{data.question}</p>
        <p className="mt-2 text-xs text-primary-foreground/70">
          Context: {data.location}
        </p>
      </div>
    );
    const userMessage: Message = { 
        id: Date.now(),
        role: 'user', 
        content: userMessageContent,
        textForAudio: data.question,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result: CropAdvisoryOutput = await handleCropAdvisory(data);
      const botMessage: Message = { 
          id: Date.now() + 1,
          role: 'bot', 
          content: result.recommendation,
          textForAudio: result.recommendation,
      };
      setMessages(prev => [...prev, botMessage]);
      form.resetField('question');
    } catch (e: any) {
      let description = 'An error occurred while getting advice. Please try again.';
      if (e.message?.includes('429') || e.message?.includes('rate limit')) {
        description = 'You have made too many requests. Please wait a moment before trying again.';
      }
      toast({
        variant: 'destructive',
        title: 'Advisory Failed',
        description: description,
      });
      console.error(e);
      // Remove the user's message on error to allow retry
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-1 flex-col">
      <ScrollArea className="flex-grow p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Bot className="mx-auto mb-4 h-12 w-12" />
              <p>{t.initialMessage1} <br/> {t.initialMessage2}</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'bot' && (
                <Avatar className="border">
                  <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                'max-w-[75%] rounded-xl p-4 shadow-sm',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                {message.role === 'bot' && (
                   <Button variant="ghost" size="icon" className="mt-2 h-8 w-8" onClick={() => toggleAudio(message)} disabled={isLoading && !message.audio}>
                     {playingAudio === message.audio ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                   </Button>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="border">
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length-1]?.role === 'user' && (
             <div className="flex items-start gap-4 justify-start">
                <Avatar className="border">
                  <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="flex max-w-[75%] items-center rounded-xl bg-muted p-4 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t bg-background/95 p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.languageLabel}</FormLabel>
                    <Select onValueChange={handleLanguageChange} value={field.value} disabled={isLoading}>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.locationLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.locationPlaceholder} {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Textarea placeholder={t.questionPlaceholder} {...field} disabled={isLoading} rows={1} onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (!isLoading) form.handleSubmit(onSubmit)();
                          }
                      }}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="flex items-center gap-2">
                {isSpeechSupported && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" size="icon" variant={isRecording ? 'destructive' : 'outline'} onClick={toggleRecording} disabled={isLoading} className="shrink-0">
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.voiceInputTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Button type="submit" size="icon" disabled={isLoading} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
