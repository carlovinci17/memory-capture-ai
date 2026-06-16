// client.ts — lazily-constructed AzureOpenAI client.
// The `openai` SDK's AzureOpenAI class is the current, supported path for
// Azure (the older @azure/openai package is being superseded). The API key
// lives only here, server-side, read from Functions app settings.
import { AzureOpenAI } from 'openai';

let cached: AzureOpenAI | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
}

export function getDeployment(): string {
  return process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
}

export function getClient(): AzureOpenAI {
  if (cached) return cached;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI is not configured (missing endpoint or key).');
  }
  cached = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    deployment: getDeployment(),
  });
  return cached;
}
