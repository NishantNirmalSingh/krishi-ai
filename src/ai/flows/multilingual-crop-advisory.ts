// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Provides multilingual crop advisories to farmers.
 *
 * - getCropAdvisory - A function that provides crop recommendations based on user input.
 * - CropAdvisoryInput - The input type for the getCropAdvisory function.
 * - CropAdvisoryOutput - The return type for the getCropAdvisory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CropAdvisoryInputSchema = z.object({
  language: z
    .string()
    .describe(
      'The language in which the farmer will ask their question, and in which the response should be provided.'
    ),
  location: z.string().describe("The farmer's location (village/taluka)."),
  soilType: z.string().describe('The type of soil in the farmer’s field.'),
  question: z
    .string()
    .describe(
      'The farmer’s question about what to plant, asked in their local language.'
    ),
});
export type CropAdvisoryInput = z.infer<typeof CropAdvisoryInputSchema>;

const CropAdvisoryOutputSchema = z.object({
  recommendation: z
    .string()
    .describe('The AI’s recommendation on what to plant, in the farmer’s language.'),
});
export type CropAdvisoryOutput = z.infer<typeof CropAdvisoryOutputSchema>;

export async function getCropAdvisory(
  input: CropAdvisoryInput
): Promise<CropAdvisoryOutput> {
  return cropAdvisoryFlow(input);
}

const cropAdvisoryPrompt = ai.definePrompt({
  name: 'cropAdvisoryPrompt',
  input: {schema: CropAdvisoryInputSchema},
  output: {schema: CropAdvisoryOutputSchema},
  prompt: `You are a helpful agricultural advisor assisting farmers in India. You must respond in the same language the farmer used in their question.

  Here are the details:
  Language: {{{language}}}
  Location: {{{location}}}
  Soil Type: {{{soilType}}}

  Question: {{{question}}}

  Based on the information provided, what crop do you recommend the farmer plant?  Explain your reasoning in simple terms that a farmer can understand. Your response must be in the same language as the question.`,
});

const cropAdvisoryFlow = ai.defineFlow(
  {
    name: 'cropAdvisoryFlow',
    inputSchema: CropAdvisoryInputSchema,
    outputSchema: CropAdvisoryOutputSchema,
  },
  async input => {
    const {output} = await cropAdvisoryPrompt(input);
    return output!;
  }
);
