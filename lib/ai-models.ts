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

interface AnthropicModelEntry {
  id: string;
  display_name?: string;
  type?: string;
  created_at?: string;
}

interface AnthropicModelsResponse {
  data?: AnthropicModelEntry[];
  has_more?: boolean;
  first_id?: string;
  last_id?: string;
}

const PROVIDER_BASE_URL = "https://claudecn.top/v1";
const FILTER_KEYWORD = "claude";

/**
 * Fetch the live model catalog from the configured Anthropic-compatible
 * endpoint and keep only entries whose id contains "claude" (case-insensitive).
 * On any failure (network, auth, malformed response) returns an empty array
 * so the settings UI degrades gracefully.
 */
export async function fetchClaudeModels(): Promise<AIModel[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${PROVIDER_BASE_URL}/models`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(
        `[ai-models] /v1/models returned ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const json = (await res.json()) as AnthropicModelsResponse;
    const entries = Array.isArray(json.data) ? json.data : [];
    const filtered = entries.filter((m) =>
      m.id.toLowerCase().includes(FILTER_KEYWORD),
    );

    return filtered.map<AIModel>((m) => ({
      id: m.id,
      name: m.display_name ?? m.id,
    }));
  } catch (err) {
    console.warn("[ai-models] fetch failed", err);
    return [];
  }
}

/** Back-compat export for older imports that referenced the old name. */
export const fetchAnthropicModels = fetchClaudeModels;
