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

const DetectPestDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant leaf or plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectPestDiseaseInput = z.infer<typeof DetectPestDiseaseInputSchema>;

const DetectPestDiseaseOutputSchema = z.object({
  disease: z.string().describe('The name of the identified plant disease or pest.'),
  confidence: z.number().describe('The confidence level of the identification (0-1).'),
  treatmentOptions: z.string().describe('Recommended treatment options for the identified pest or disease.'),
});
export type DetectPestDiseaseOutput = z.infer<typeof DetectPestDiseaseOutputSchema>;

export async function detectPestDisease(input: DetectPestDiseaseInput): Promise<DetectPestDiseaseOutput> {
  return detectPestDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectPestDiseasePrompt',
  input: {schema: DetectPestDiseaseInputSchema},
  output: {schema: DetectPestDiseaseOutputSchema},
  prompt: `You are an expert plant pathologist. A farmer has uploaded a photo of a plant.  You must identify the pest or disease affecting the plant, provide a confidence level, and suggest treatment options. Respond in a way that is easily understandable to a non-expert farmer.

  Analyze the following image and provide your diagnosis:

  Photo: {{media url=photoDataUri}}
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
    return output!;
  }
);
