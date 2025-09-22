
'use server';

/**
 * @fileOverview AI-powered pest and disease detection for plants.
 *
 * - detectPestDisease - A function that handles the pest and disease detection process.
 * - DetectPestDiseaseInput - The input type for the detectPestDisease function.
 * - DetectPestDiseaseOutput - The return type for the detectPestDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {textToSpeech, TextToSpeechInput} from './text-to-speech';

const DetectPestDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a plant leaf or plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe("A text description of the plant's symptoms."),
  language: z.string().describe('The language for the diagnosis and recommendation.'),
}).refine(data => data.photoDataUri || data.description, {
  message: "Either a photo or a description must be provided.",
});
export type DetectPestDiseaseInput = z.infer<typeof DetectPestDiseaseInputSchema>;

const DetectPestDiseaseOutputSchema = z.object({
  disease: z.string().describe('The name of the identified plant disease or pest.'),
  confidence: z.number().describe('The confidence level of the identification (0-1).'),
  treatmentOptions: z.string().describe('Recommended treatment options for the identified pest or disease.'),
  audio: z
    .string()
    .describe(
      'A data URI of the audio of the diagnosis and treatment in WAV format.'
    ),
});
export type DetectPestDiseaseOutput = z.infer<typeof DetectPestDiseaseOutputSchema>;

export async function detectPestDisease(input: DetectPestDiseaseInput): Promise<DetectPestDiseaseOutput> {
  return detectPestDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectPestDiseasePrompt',
  input: {schema: DetectPestDiseaseInputSchema},
  output: {schema: z.object({
      disease: z.string().describe('The name of the identified plant disease or pest.'),
      confidence: z.number().describe('The confidence level of the identification (0-1).'),
      treatmentOptions: z.string().describe('Recommended treatment options for the identified pest or disease.'),
      summaryForAudio: z.string().describe('A single, concise sentence summarizing the diagnosis and key treatment advice for audio playback, in the requested language.'),
    })
  },
  prompt: `You are an expert plant pathologist. A farmer needs help identifying a pest or disease. Use the provided information (image and/or text description) to make your diagnosis.

You MUST respond fully in the requested language: {{{language}}}. All text fields in your output, including 'disease', 'treatmentOptions', and 'summaryForAudio' must be in this language. Your response must be easily understandable to a non-expert farmer.

If an image is provided, it is the primary source of information. If only a text description is provided, base your diagnosis on that. If both are provided, use them together. Provide a confidence level and suggest treatment options.

In 'summaryForAudio', create a single, natural-sounding sentence that summarizes the diagnosis and the most important treatment step. For example: "The plant appears to have Powdery Mildew. You should begin by applying a fungicide."

Analyze the following information and provide your diagnosis.

Language: {{{language}}}
{{#if description}}
Description: {{{description}}}
{{/if}}
{{#if photoDataUri}}
Photo: {{media url=photoDataUri}}
{{/if}}
  `,
});

const detectPestDiseaseFlow = ai.defineFlow(
  {
    name: 'detectPestDiseaseFlow',
    inputSchema: DetectPestDiseaseInputSchema,
    outputSchema: DetectPestDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a diagnosis from the AI model.');
    }
    
    const ttsInput: TextToSpeechInput = {
        text: output.summaryForAudio,
        language: input.language,
    };
    const audioData = await textToSpeech(ttsInput);

    return {
      disease: output.disease,
      confidence: output.confidence,
      treatmentOptions: output.treatmentOptions,
      audio: audioData,
    };
  }
);
