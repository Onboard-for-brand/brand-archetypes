import "server-only";

export interface OpenRouterPricing {
  prompt?: string | null;
  completion?: string | null;
  request?: string | null;
  image?: string | null;
}

export interface OpenRouterModel {
  id: string;
  name?: string;
  description?: string | null;
  context_length?: number | null;
  pricing?: OpenRouterPricing | null;
  created?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string | null;
  } | null;
}

interface OpenRouterListResponse {
  data: OpenRouterModel[];
}

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

/**
 * Fetch the OpenRouter model catalog. Cached for an hour at the
 * fetch layer; the listing is public and changes infrequently.
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(OPENROUTER_MODELS_URL, {
    next: { revalidate: 3600 },
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter list failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as OpenRouterListResponse;
  return Array.isArray(json.data) ? json.data : [];
}

/** Models whose id is owned by Anthropic on OpenRouter (anthropic/...). */
export async function fetchAnthropicModels(): Promise<OpenRouterModel[]> {
  const all = await fetchOpenRouterModels();
  return all
    .filter((m) => m.id.startsWith("anthropic/"))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
}
