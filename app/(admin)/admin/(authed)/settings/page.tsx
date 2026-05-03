import { fetchAnthropicModels, type OpenRouterModel } from "@/lib/openrouter";
import { getActiveModel } from "@/lib/settings";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [models, activeModel] = await Promise.all([
    fetchAnthropicModels().catch((): OpenRouterModel[] => []),
    getActiveModel(),
  ]);

  return <SettingsClient models={models} activeModel={activeModel} />;
}
