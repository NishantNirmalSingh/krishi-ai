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
import { Loader2, User, Bot, Send, Volume2 } from 'lucide-react';
import { handleCropAdvisory } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  location: z.string().min(2, 'Location is required.'),
  soilType: z.string().min(2, 'Soil type is required.'),
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
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: '',
      location: '',
      soilType: '',
      question: '',
    },
  });
  
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
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
          Context: {data.location}, {data.soilType}, {data.language}
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
      <ScrollArea className="flex-grow p-6">
        <div className="space-y-6" ref={scrollViewportRef}>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <FormField
                control={form.control}
                name="soilType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soil Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Black Cotton Soil" {...field} disabled={isLoading} />
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
