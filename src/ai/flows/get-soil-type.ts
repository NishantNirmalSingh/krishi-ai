
'use server';
/**
 * @fileOverview A tool to detect soil type based on location.
 *
 * - getSoilType - A function that returns the soil type for a given location.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const getSoilType = ai.defineTool(
  {
    name: 'getSoilType',
    description:
      'Returns the likely soil type for a given village, taluka, or district in India.',
    inputSchema: z.object({
      location: z
        .string()
        .describe('The village, taluka, or district in India.'),
    }),
    outputSchema: z.string(),
  },
  async ({location}) => {
    // In a real application, you would use a database or an external API
    // to get accurate soil type data. For this example, we'll use a
    // simplified lookup with a Genkit prompt.
    const {text} = await ai.generate({
      prompt: `What is the most common soil type in the following location in India: ${location}? Respond with only the soil type name (e.g., "Alluvial Soil", "Black Cotton Soil").`,
      model: 'googleai/gemini-2.5-flash',
    });
    return text;
  }
);
