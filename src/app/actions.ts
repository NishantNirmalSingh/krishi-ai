"use server";

import { detectPestDisease, DetectPestDiseaseInput, DetectPestDiseaseOutput } from "@/ai/flows/pest-disease-detection";
import { getCropAdvisory, CropAdvisoryInput, CropAdvisoryOutput } from "@/ai/flows/multilingual-crop-advisory";

export async function handlePestDetection(input: DetectPestDiseaseInput): Promise<DetectPestDiseaseOutput> {
  const result = await detectPestDisease(input);
  return result;
}

export async function handleCropAdvisory(input: CropAdvisoryInput): Promise<CropAdvisoryOutput> {
  const result = await getCropAdvisory(input);
  return result;
}
