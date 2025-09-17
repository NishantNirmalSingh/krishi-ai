import { config } from 'dotenv';
config();

import '@/ai/flows/pest-disease-detection.ts';
import '@/ai/flows/multilingual-crop-advisory.ts';
import '@/ai/flows/text-to-speech';
import '@/ai/flows/get-soil-type';
import '@/ai/flows/get-market-price';
