import { I18nText } from "@/components/I18nText";
import { phases } from "@/lib/archetypes";

const phaseCounts: Record<string, { zh: string; en: string }> = {
  ROOT: { zh: "16 个问题", en: "16 questions" },
  TRUNK: { zh: "13 个问题", en: "13 questions" },
  BARK: { zh: "4 个问题", en: "4 questions" },
  CANOPY: { zh: "9 个问题", en: "9 questions" },
};

export function MethodTree() {
  return (
    <div className="method-tree">
      {phases.map((phase) => (
        <div className="method-phase" key={phase.id}>
          <div className="method-phase__name">
            <I18nText block zh={phase.nameZh} en={phase.nameEn} />
          </div>
          <div className="method-phase__count">
            {phase.range.replace("-", " — ")} ·{" "}
            <I18nText
              zh={phaseCounts[phase.id].zh}
              en={phaseCounts[phase.id].en}
            />
          </div>
          <div className="method-phase__desc">
            <I18nText
              block
              zh={phase.descriptionZh}
              en={phase.descriptionEn}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
