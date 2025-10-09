"use server";

import { detectPestDisease, DetectPestDiseaseInput, DetectPestDiseaseOutput } from "@/ai/flows/pest-disease-detection";
import { getCropAdvisory, CropAdvisoryInput, CropAdvisoryOutput } from "@/ai/flows/multilingual-crop-advisory";
import { getMarketPrice, MarketPriceInput, MarketPriceOutput } from "@/ai/flows/get-market-price";
import { getWeatherForecast, WeatherForecastInput, WeatherForecastOutput } from "@/ai/flows/get-weather-forecast";
import { textToSpeech, TextToSpeechInput } from "@/ai/flows/text-to-speech";


export async function handlePestDetection(input: DetectPestDiseaseInput): Promise<DetectPestDiseaseOutput> {
  const result = await detectPestDisease(input);
  return result;
}

export async function handleCropAdvisory(input: CropAdvisoryInput): Promise<CropAdvisoryOutput> {
  const result = await getCropAdvisory(input);
  return result;
}

export async function handleMarketPriceSearch(input: MarketPriceInput): Promise<MarketPriceOutput> {
  const result = await getMarketPrice(input);
  return result;
}

export async function handleWeatherForecast(input: WeatherForecastInput): Promise<WeatherForecastOutput> {
  const result = await getWeatherForecast(input);
  return result;
}

export async function handleTextToSpeech(input: TextToSpeechInput): Promise<string> {
  const result = await textToSpeech(input);
  return result;
}
