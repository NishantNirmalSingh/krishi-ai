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
  language: z.string().describe('The language for the market data summary.'),
  location: z
    .string()
    .optional()
    .describe(
      'The user-provided location (e.g., village, district) to find a nearby market.'
    ),
});
export type MarketPriceInput = z.infer<typeof MarketPriceInputSchema>;

const PlatformSchema = z.object({
  name: z.string().describe('The name of the selling platform or buyer.'),
  details: z
    .string()
    .describe(
      'A brief description of the platform and actionable advice on how a farmer can connect with them.'
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
  summary: z
    .string()
    .describe('A brief summary of the market data in the requested language.'),
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
  output: {
    schema: MarketPriceOutputSchema,
  },
  prompt: `You are a market data analyst and advisor for Indian agriculture. You MUST respond fully in the language specified in the 'language' field. All text fields in your output, including 'crop', 'market', platform 'name' and 'details', and 'summary', must be translated into the requested language: {{{language}}}.

The 'unit' field MUST NOT be translated; it must always be "Quintal".

For the given crop: {{{crop}}}
And location: {{{location}}}

1.  **Market Data**: Find a major agricultural market (mandi) in India that is relevant and geographically near the provided 'location'. If no location is given, choose a major market known for the crop. Provide a realistic current price in INR per quintal. Provide a recent historical price to show a trend. The unit must be "Quintal".
2.  **Selling Platforms**: Suggest 2-3 online platforms and 2-3 offline options. For each, provide a brief, helpful detail including actionable advice on how the farmer can connect with them.
3.  **Summary**: Provide a brief, one-sentence summary of the key market information (crop name, current price, and trend).
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
    if (!output) {
      throw new Error('Failed to get market data from the AI model.');
    }

    return {
      ...output,
    };
  }
);
