import { fetchClaudeModels, type AIModel } from "@/lib/ai-models";
import { getActiveModel } from "@/lib/settings";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [models, activeModel] = await Promise.all([
    fetchClaudeModels().catch((): AIModel[] => []),
    getActiveModel(),
  ]);

  return <SettingsClient models={models} activeModel={activeModel} />;
}
