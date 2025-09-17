'use server';
/**
 * @fileOverview Fetches simulated market prices for agricultural crops and suggests selling platforms.
 *
 * - getMarketPrice - A function that returns market data and platform suggestions for a given crop.
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

const PlatformSchema = z.object({
  name: z.string().describe('The name of the selling platform or buyer.'),
  details: z
    .string()
    .describe(
      'A brief description of the platform and why it is a good option.'
    ),
});

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
  onlinePlatforms: z
    .array(PlatformSchema)
    .describe(
      'Suggestions for online platforms (e-commerce, B2B) to sell the crop.'
    ),
  offlinePlatforms: z
    .array(PlatformSchema)
    .describe(
      'Suggestions for offline channels (local co-ops, buyers, etc.) to sell the crop.'
    ),
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
  prompt: `You are a market data analyst and advisor for Indian agriculture. For the given crop, provide the following information:

  Crop: {{{crop}}}

  1.  **Market Data**: Find a major agricultural market (mandi) in India relevant to this crop. Provide a realistic current price in INR per quintal. Provide a recent historical price to show a trend. The unit must be "Quintal".
  2.  **Selling Platforms**: Suggest 2-3 online platforms (like agri-tech marketplaces, B2B portals) and 2-3 offline options (like farmer co-operatives, local food processors, or direct-to-consumer models) where the farmer could potentially get a good price for this crop. For each suggestion, provide a brief, helpful detail.
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
