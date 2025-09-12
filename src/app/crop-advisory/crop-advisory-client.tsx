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
import { Loader2, User, Bot, Send, Volume2, Mic, MicOff } from 'lucide-react';
import { handleCropAdvisory } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const languages = [
  { value: 'Assamese', label: 'অসমীয়া (Assamese)', code: 'as-IN' },
  { value: 'Bengali', label: 'বাংলা (Bengali)', code: 'bn-IN' },
  { value: 'English', label: 'English', code: 'en-US' },
  { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)', code: 'gu-IN' },
  { value: 'Hindi', label: 'हिंदी (Hindi)', code: 'hi-IN' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', code: 'kn-IN' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)', code: 'ml-IN' },
  { value: 'Marathi', label: 'मराठी (Marathi)', code: 'mr-IN' },
  { value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)', code: 'or-IN' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', code: 'pa-IN' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)', code: 'ta-IN' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)', code: 'te-IN' },
  { value: 'Urdu', label: 'اردو (Urdu)', code: 'ur-IN' },
];

const formSchema = z.object({
  language: z.string().min(1, 'Please select a language.'),
  location: z.string().min(2, 'Location is required.'),
  question: z.string().min(10, 'Please ask a detailed question.'),
});

type Message = {
  role: 'user' | 'bot';
  content: React.ReactNode;
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


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: '',
      location: '',
      question: '',
    },
  });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentQuestion = form.getValues('question');
        form.setValue('question', currentQuestion ? `${currentQuestion} ${transcript}`: transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let description = `An error occurred: ${event.error}. Please ensure microphone access is allowed.`;
        if (event.error === 'network') {
          description = 'A network error occurred. Please check your internet connection and try again.';
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
  }, [form, toast]);
  
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
      setIsRecording(false);
    } else {
      try {
        const selectedLanguageCode = languages.find(l => l.value === form.getValues('language'))?.code || 'en-US';
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
  
  const playAudio = (audioDataUri: string) => {
    const audio = new Audio(audioDataUri);
    audio.play();
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
    const userMessage: Message = { role: 'user', content: userMessageContent };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await handleCropAdvisory(data);
      const botMessage: Message = { role: 'bot', content: result.recommendation, audio: result.audio };
      setMessages(prev => [...prev, botMessage]);
      if(result.audio){
        playAudio(result.audio);
      }
      form.resetField('question');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Advisory Failed',
        description: 'An error occurred while getting advice. Please try again.',
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
              <p>Your conversation will appear here. <br/> Fill out the form below to start.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}>
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
                {message.audio && (
                   <Button variant="ghost" size="icon" className="mt-2 h-8 w-8" onClick={() => playAudio(message.audio!)}>
                    <Volume2 className="h-5 w-5" />
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
          {isLoading && (
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rampur Village" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Textarea placeholder="Ask your question here..." {...field} disabled={isLoading} className="min-h-[40px] resize-none" onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                          }
                      }}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isSpeechSupported && (
                <Button type="button" size="icon" variant={isRecording ? 'destructive' : 'outline'} onClick={toggleRecording} disabled={isLoading || !form.watch('language')} className="shrink-0">
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button type="submit" size="icon" disabled={isLoading} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
