export type ArchetypeId =
  | "ruler"
  | "creator"
  | "innocent"
  | "sage"
  | "explorer"
  | "magician"
  | "rebel"
  | "hero"
  | "jester"
  | "lover"
  | "everyman"
  | "caregiver";

export interface Archetype {
  id: ArchetypeId;
  nameEn: string;
  nameZh: string;
  quadrant: string;
  avatar: string;
}

export const archetypes: Archetype[] = [
  {
    id: "ruler",
    nameEn: "Ruler",
    nameZh: "统治者",
    quadrant: "Stability / Belonging",
    avatar: "/archetypes/archetype-ruler.png",
  },
  {
    id: "creator",
    nameEn: "Creator",
    nameZh: "创造者",
    quadrant: "Stability / Independence",
    avatar: "/archetypes/archetype-creator.png",
  },
  {
    id: "innocent",
    nameEn: "Innocent",
    nameZh: "纯真者",
    quadrant: "Stability / Independence",
    avatar: "/archetypes/archetype-innocent.png",
  },
  {
    id: "sage",
    nameEn: "Sage",
    nameZh: "智者",
    quadrant: "Stability / Independence",
    avatar: "/archetypes/archetype-sage.png",
  },
  {
    id: "explorer",
    nameEn: "Explorer",
    nameZh: "探索者",
    quadrant: "Mastery / Independence",
    avatar: "/archetypes/archetype-explorer.png",
  },
  {
    id: "magician",
    nameEn: "Magician",
    nameZh: "魔术师",
    quadrant: "Mastery / Independence",
    avatar: "/archetypes/archetype-magician.png",
  },
  {
    id: "rebel",
    nameEn: "Rebel",
    nameZh: "反叛者",
    quadrant: "Mastery / Independence",
    avatar: "/archetypes/archetype-rebel.png",
  },
  {
    id: "hero",
    nameEn: "Hero",
    nameZh: "英雄",
    quadrant: "Mastery / Independence",
    avatar: "/archetypes/archetype-hero.png",
  },
  {
    id: "jester",
    nameEn: "Jester",
    nameZh: "乐子人",
    quadrant: "Mastery / Belonging",
    avatar: "/archetypes/archetype-jester.png",
  },
  {
    id: "lover",
    nameEn: "Lover",
    nameZh: "情人",
    quadrant: "Mastery / Belonging",
    avatar: "/archetypes/archetype-lover.png",
  },
  {
    id: "everyman",
    nameEn: "Everyman",
    nameZh: "平凡人",
    quadrant: "Stability / Belonging",
    avatar: "/archetypes/archetype-everyman.png",
  },
  {
    id: "caregiver",
    nameEn: "Caregiver",
    nameZh: "照顾者",
    quadrant: "Stability / Belonging",
    avatar: "/archetypes/archetype-caregiver.png",
  },
];

export const phases = [
  {
    id: "ROOT",
    nameEn: "Root",
    nameZh: "根系",
    range: "Q1-Q16",
    descriptionEn: "North Star, identity positioning, internal structure.",
    descriptionZh: "北极星、身份定位、内部结构。",
  },
  {
    id: "TRUNK",
    nameEn: "Trunk",
    nameZh: "枝干",
    range: "Q17-Q29",
    descriptionEn: "Beliefs and expression. How conviction becomes voice.",
    descriptionZh: "信念与表达。确信如何变成声音。",
  },
  {
    id: "BARK",
    nameEn: "Bark",
    nameZh: "树皮",
    range: "Q30-Q33",
    descriptionEn: "Taste immune system. What you reject is who you are.",
    descriptionZh: "品味免疫系统。你拒绝什么，也定义了你是谁。",
  },
  {
    id: "CANOPY",
    nameEn: "Canopy",
    nameZh: "树冠",
    range: "Q34-Q42",
    descriptionEn: "Content architecture and integration.",
    descriptionZh: "内容架构与整合。",
  },
];
