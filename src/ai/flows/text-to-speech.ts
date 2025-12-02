'use server';
/**
 * @fileOverview A text-to-speech AI agent with fallback mechanism.
 *
 * - textToSpeech - A function that converts text to speech.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import wav from 'wav';
import {TextToSpeechClient} from '@google-cloud/text-to-speech';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  language: z.string().describe('The language of the text.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<string> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Fallback client for Google Cloud Text-to-Speech API
const ttsClient = new TextToSpeechClient();

async function googleCloudTtsFallback(
  text: string,
  language: string
): Promise<string> {
  console.log('Using Google Cloud TTS fallback...');
  const [response] = await ttsClient.synthesizeSpeech({
    input: {text: text},
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'}, // Language mapping needed for production
    audioConfig: {audioEncoding: 'LINEAR16', sampleRateHertz: 24000},
  });

  if (!response.audioContent) {
    throw new Error('Fallback TTS failed to generate audio.');
  }
  // The audio is already WAV (LINEAR16), just need to base64 encode it.
  const base64 = Buffer.from(response.audioContent).toString('base64');
  return `data:audio/wav;base64,${base64}`;
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: z.string(),
  },
  async ({text, language}) => {
    try {
      // Primary TTS: Gemini 2.5 Flash TTS
      const {media} = await ai.generate({
        model: googleAI('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {voiceName: 'Algenib'},
            },
          },
        },
        prompt: text,
      });

      if (!media) {
        throw new Error('no media returned from primary TTS');
      }
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      const wavBase64 = await toWav(audioBuffer);
      return `data:audio/wav;base64,${wavBase64}`;
    } catch (error: any) {
      console.error('Primary TTS failed, attempting fallback:', error.message);
      // If the primary TTS fails (e.g., due to rate limiting), use the fallback.
      if (error.message && error.message.includes('429')) {
        return googleCloudTtsFallback(text, language);
      }
      // Re-throw other errors
      throw error;
    }
  }
);
