import "server-only";

export interface AIModel {
  id: string;
  name?: string;
  description?: string | null;
  context_length?: number | null;
  pricing?: {
    /** USD per token. */
    prompt?: string | null;
    completion?: string | null;
  } | null;
}

/** Hardcoded Anthropic model catalog. Pricing is per-token in USD. */
const ANTHROPIC_MODELS: readonly AIModel[] = [
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    description: "Anthropic's most capable model.",
    context_length: 200_000,
    pricing: { prompt: "0.000015", completion: "0.000075" },
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    description: "Balanced for everyday production use.",
    context_length: 1_000_000,
    pricing: { prompt: "0.000003", completion: "0.000015" },
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    description: "Fast and inexpensive.",
    context_length: 200_000,
    pricing: { prompt: "0.000001", completion: "0.000005" },
  },
] as const;

export async function fetchAnthropicModels(): Promise<AIModel[]> {
  return [...ANTHROPIC_MODELS];
}
