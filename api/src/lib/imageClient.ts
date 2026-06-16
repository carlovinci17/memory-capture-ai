// imageClient.ts — AzureOpenAI client scoped to the gpt-image-1-mini deployment.
//
// gpt-image-1 is not available in all regions. If your chat model is in one
// region (e.g. australiaeast) but the image model must be in another (e.g. eastus),
// set AZURE_OPENAI_IMAGE_ENDPOINT + AZURE_OPENAI_IMAGE_API_KEY to point at the
// second resource. When those are absent the client falls back to the main
// AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY.
import { AzureOpenAI } from 'openai';

let cached: AzureOpenAI | null = null;

export function isImageConfigured(): boolean {
  const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_IMAGE_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  return Boolean(endpoint && apiKey && process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT);
}

export function getImageDeployment(): string {
  return process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT || '';
}

export function getImageClient(): AzureOpenAI {
  if (cached) return cached;
  const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_IMAGE_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT;
  if (!endpoint || !apiKey || !deployment) {
    throw new Error('Image generation not configured (missing AZURE_OPENAI_IMAGE_DEPLOYMENT).');
  }
  cached = new AzureOpenAI({
    endpoint,
    apiKey,
    // gpt-image-1 requires 2025-04-01-preview or later.
    apiVersion: '2025-04-01-preview',
    deployment,
  });
  return cached;
}
