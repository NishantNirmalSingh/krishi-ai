'use server';
/**
 * @fileOverview Fetches simulated market prices for agricultural crops.
 *
 * - getMarketPrice - A function that returns market data for a given crop.
 * - MarketPriceInput - The input type for the getMarketPrice function.
 * - MarketPriceOutput - The return type for the getMarketPrice function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketPriceInputSchema = z.object({
  crop: z
    .string()
    .describe('The name of the crop, fruit, or vegetable to search for.'),
});
export type MarketPriceInput = z.infer<typeof MarketPriceInputSchema>;

const MarketPriceOutputSchema = z.object({
  crop: z.string().describe('The name of the crop.'),
  market: z
    .string()
    .describe(
      'A major agricultural market (mandi) in India known for this crop.'
    ),
  currentPrice: z.number().describe('The current market price per quintal.'),
  historicalPrice: z
    .number()
    .describe('A recent historical price to show the trend.'),
  unit: z.string().describe('The unit of measurement, e.g., "Quintal".'),
});
export type MarketPriceOutput = z.infer<typeof MarketPriceOutputSchema>;

export async function getMarketPrice(
  input: MarketPriceInput
): Promise<MarketPriceOutput> {
  return getMarketPriceFlow(input);
}

const getMarketPricePrompt = ai.definePrompt({
  name: 'getMarketPricePrompt',
  input: {schema: MarketPriceInputSchema},
  output: {schema: MarketPriceOutputSchema},
  prompt: `You are a market data analyst for Indian agriculture. Provide a realistic but simulated market price for the following crop.

  Crop: {{{crop}}}

  Find a major agricultural market (mandi) in India relevant to this crop.
  Provide a realistic current price in INR per quintal.
  Provide a recent historical price to show a trend (it can be slightly higher, lower, or the same).
  The unit should always be "Quintal".
  `,
});

const getMarketPriceFlow = ai.defineFlow(
  {
    name: 'getMarketPriceFlow',
    inputSchema: MarketPriceInputSchema,
    outputSchema: MarketPriceOutputSchema,
  },
  async input => {
    const {output} = await getMarketPricePrompt(input);
    return output!;
  }
);
