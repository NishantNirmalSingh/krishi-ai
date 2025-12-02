'use server';
/**
 * @fileOverview A multi-segment text-to-speech AI agent.
 *
 * - textToSpeechMulti - A function that converts multiple text segments to a single audio file.
 * - TextToSpeechMultiInput - The input type for the textToSpeechMulti function.
 * - TextToSpeechMultiOutput - The return type for the textToSpeechMulti function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import wav from 'wav';
import {config} from 'dotenv';

config();

const TextToSpeechMultiInputSchema = z.object({
  segments: z
    .array(z.string())
    .describe('The text segments to convert to speech.'),
  language: z.string().describe('The language of the text.'),
});
export type TextToSpeechMultiInput = z.infer<
  typeof TextToSpeechMultiInputSchema
>;

const AudioSegmentSchema = z.object({
  startTime: z.number().describe('Start time of the segment in seconds.'),
  endTime: z.number().describe('End time of the segment in seconds.'),
});

const TextToSpeechMultiOutputSchema = z.object({
  audio: z.string().describe('A data URI of the combined audio in WAV format.'),
  segments: z.array(AudioSegmentSchema),
});
export type TextToSpeechMultiOutput = z.infer<
  typeof TextToSpeechMultiOutputSchema
>;

export async function textToSpeechMulti(
  input: TextToSpeechMultiInput
): Promise<TextToSpeechMultiOutput> {
  return textToSpeechMultiFlow(input);
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

const textToSpeechMultiFlow = ai.defineFlow(
  {
    name: 'textToSpeechMultiFlow',
    inputSchema: TextToSpeechMultiInputSchema,
    outputSchema: TextToSpeechMultiOutputSchema,
  },
  async ({segments, language}) => {
    const multiSpeakerPrompt = segments
      .map((text, i) => `Speaker${(i % 2) + 1}: ${text}`)
      .join('\n');

    const {media, output} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO', 'TEXT'],
        speechConfig: {
          enableTimeStampsEstimation: true,
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Speaker1',
                voiceConfig: {
                  prebuiltVoiceConfig: {voiceName: 'Algenib'},
                },
              },
              {
                speaker: 'Speaker2',
                voiceConfig: {
                  prebuiltVoiceConfig: {voiceName: 'Achernar'},
                },
              },
            ],
          },
        },
      },
      prompt: multiSpeakerPrompt,
    });

    if (!media || !output?.message?.content) {
      throw new Error('No media or timing information returned from TTS API');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    const timings =
      output.message.content.find(p => !!p.timing)?.timing
        ?.audioTimestamps || [];

    // The API might return one extra timing for the whole audio, so we slice it.
    const segmentTimings = timings.slice(0, segments.length).map(t => ({
      startTime: t.startTimeSec,
      endTime: t.endTimeSec,
    }));

    return {
      audio: `data:audio/wav;base64,${wavBase64}`,
      segments: segmentTimings,
    };
  }
);
