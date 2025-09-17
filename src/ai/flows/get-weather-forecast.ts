'use server';
/**
 * @fileOverview Fetches and translates hyper-local weather forecasts.
 *
 * - getWeatherForecast - A function that returns weather data for a given location and language.
 * - WeatherForecastInput - The input type for the getWeatherForecast function.
 * - WeatherForecastOutput - The return type for the getWeatherForecast function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherForecastInputSchema = z.object({
  location: z
    .string()
    .describe('The village, taluka, or district in India to get the weather for.'),
  language: z.string().describe('The language for the weather report.'),
});
export type WeatherForecastInput = z.infer<typeof WeatherForecastInputSchema>;

const iconEnum = z.enum([
  'Sun',
  'CloudSun',
  'Cloud',
  'CloudRain',
  'CloudDrizzle',
  'CloudLightning',
]);

const WeatherForecastOutputSchema = z.object({
  lastUpdated: z.string().describe("How long ago the weather was updated, e.g., 'just now', '5 minutes ago', in the requested language."),
  currentConditions: z.object({
    temperature: z.string().describe('The current temperature, e.g., "31°C".'),
    condition: z.string().describe('The current weather condition, e.g., "Partly Cloudy", in the requested language.'),
    icon: iconEnum.describe('An icon name representing the current condition.'),
    wind: z.string().describe('The current wind speed, e.g., "12 km/h".'),
    humidity: z.string().describe('The current humidity, e.g., "68%".'),
  }),
  weeklyForecast: z.array(z.object({
      day: z.string().describe('The day of the week, abbreviated, e.g., "Mon", in the requested language.'),
      icon: iconEnum.describe('An icon name representing the forecast condition.'),
      temp: z.string().describe('The forecasted temperature, e.g., "32°".'),
    }))
    .length(7)
    .describe('A 7-day weather forecast.'),
  predictiveAlerts: z.array(z.object({
      title: z.string().describe('A short, catchy title for the alert, in the requested language.'),
      description: z.string().describe('The detailed alert message for the farmer, in the requested language.'),
    }))
    .describe('Any critical weather alerts for the next 48-72 hours.'),
});
export type WeatherForecastOutput = z.infer<typeof WeatherForecastOutputSchema>;


export async function getWeatherForecast(
  input: WeatherForecastInput
): Promise<WeatherForecastOutput> {
  return getWeatherForecastFlow(input);
}

const getWeatherForecastPrompt = ai.definePrompt({
  name: 'getWeatherForecastPrompt',
  input: {schema: WeatherForecastInputSchema},
  output: {
    schema: WeatherForecastOutputSchema,
  },
  prompt: `You are a hyper-local weather expert for Indian agriculture. For the given location, provide a realistic and detailed weather forecast.

  Location: {{{location}}}
  Language: {{{language}}}

  You MUST provide all text-based output, including conditions, day names, and alert details, strictly in the requested language.

  Provide the following information:
  1.  **Current Conditions**: Generate a realistic temperature, condition (in the requested language), wind speed, and humidity. Select an appropriate icon.
  2.  **Weekly Forecast**: Generate a 7-day forecast with abbreviated day names (translated to the requested language), an icon, and temperature for each day.
  3.  **Predictive Alerts**: If there are any potential weather events in the next 2-3 days that could impact farming (heavy rain, strong winds, heatwave), create 1-2 critical alerts. The title and description for these alerts must be in the requested language. If there are no major events, return an empty array. The alerts should be actionable for a farmer.
  `,
});

const getWeatherForecastFlow = ai.defineFlow(
  {
    name: 'getWeatherForecastFlow',
    inputSchema: WeatherForecastInputSchema,
    outputSchema: WeatherForecastOutputSchema,
  },
  async input => {
    const {output} = await getWeatherForecastPrompt(input);
    if (!output) {
      throw new Error('Failed to get weather data from the AI model.');
    }
    return output;
  }
);
