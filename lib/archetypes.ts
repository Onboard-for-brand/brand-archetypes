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

export type ArchetypeQuadrant =
  | "stability-belonging"
  | "stability-independence"
  | "mastery-independence"
  | "mastery-belonging";

export interface Archetype {
  id: ArchetypeId;
  nameEn: string;
  nameZh: string;
  /** Free-form display string used by the existing gallery / listing UI. */
  quadrant: string;
  /** Structured quadrant tag used by the radar. */
  quadrantTag: ArchetypeQuadrant;
  /** Position on the radar, 0-indexed from 12 o'clock, going clockwise. */
  position: number;
  motto: string;
  desire: string;
  fear: string;
  avatar: string;
}

export const archetypes: Archetype[] = [
  {
    id: "ruler",
    nameEn: "Ruler",
    nameZh: "统治者",
    quadrant: "Stability / Belonging",
    quadrantTag: "stability-belonging",
    position: 0,
    motto: "Power isn't everything. It's the only thing.",
    desire: "Stability and control",
    fear: "Chaos, being overthrown",
    avatar: "/archetypes/archetype-ruler.png",
  },
  {
    id: "creator",
    nameEn: "Creator",
    nameZh: "创造者",
    quadrant: "Stability / Independence",
    quadrantTag: "stability-independence",
    position: 1,
    motto: "If it can be imagined, it can be created.",
    desire: "To create things of enduring value",
    fear: "Mediocrity, lack of vision",
    avatar: "/archetypes/archetype-creator.png",
  },
  {
    id: "innocent",
    nameEn: "Innocent",
    nameZh: "纯真者",
    quadrant: "Stability / Independence",
    quadrantTag: "stability-independence",
    position: 2,
    motto: "Free to be you and me.",
    desire: "Paradise, simple goodness",
    fear: "Punishment for doing wrong",
    avatar: "/archetypes/archetype-innocent.png",
  },
  {
    id: "sage",
    nameEn: "Sage",
    nameZh: "智者",
    quadrant: "Stability / Independence",
    quadrantTag: "stability-independence",
    position: 3,
    motto: "The truth will set you free.",
    desire: "To find truth",
    fear: "Being deceived, ignorance",
    avatar: "/archetypes/archetype-sage.png",
  },
  {
    id: "explorer",
    nameEn: "Explorer",
    nameZh: "探索者",
    quadrant: "Mastery / Independence",
    quadrantTag: "mastery-independence",
    position: 4,
    motto: "Don't fence me in.",
    desire: "Freedom, authentic experience",
    fear: "Being trapped, conformity",
    avatar: "/archetypes/archetype-explorer.png",
  },
  {
    id: "magician",
    nameEn: "Magician",
    nameZh: "魔术师",
    quadrant: "Mastery / Independence",
    quadrantTag: "mastery-independence",
    position: 5,
    motto: "It can happen.",
    desire: "To understand the laws of the universe",
    fear: "Unintended consequences",
    avatar: "/archetypes/archetype-magician.png",
  },
  {
    id: "rebel",
    nameEn: "Rebel",
    nameZh: "反叛者",
    quadrant: "Mastery / Independence",
    quadrantTag: "mastery-independence",
    position: 6,
    motto: "Rules are meant to be broken.",
    desire: "Liberation, revolution",
    fear: "Powerlessness, irrelevance",
    avatar: "/archetypes/archetype-rebel.png",
  },
  {
    id: "hero",
    nameEn: "Hero",
    nameZh: "英雄",
    quadrant: "Mastery / Independence",
    quadrantTag: "mastery-independence",
    position: 7,
    motto: "Where there's a will, there's a way.",
    desire: "To prove worth through courageous action",
    fear: "Cowardice, weakness",
    avatar: "/archetypes/archetype-hero.png",
  },
  {
    id: "jester",
    nameEn: "Jester",
    nameZh: "乐子人",
    quadrant: "Mastery / Belonging",
    quadrantTag: "mastery-belonging",
    position: 8,
    motto: "You only live once.",
    desire: "To enjoy, to lighten the world",
    fear: "Boredom",
    avatar: "/archetypes/archetype-jester.png",
  },
  {
    id: "lover",
    nameEn: "Lover",
    nameZh: "情人",
    quadrant: "Mastery / Belonging",
    quadrantTag: "mastery-belonging",
    position: 9,
    motto: "I only have eyes for you.",
    desire: "Intimacy, sensual experience",
    fear: "Being alone, unloved",
    avatar: "/archetypes/archetype-lover.png",
  },
  {
    id: "everyman",
    nameEn: "Everyman",
    nameZh: "平凡人",
    quadrant: "Stability / Belonging",
    quadrantTag: "stability-belonging",
    position: 10,
    motto: "All people are created equal.",
    desire: "To belong, to connect",
    fear: "Standing out, exclusion",
    avatar: "/archetypes/archetype-everyman.png",
  },
  {
    id: "caregiver",
    nameEn: "Caregiver",
    nameZh: "照顾者",
    quadrant: "Stability / Belonging",
    quadrantTag: "stability-belonging",
    position: 11,
    motto: "Love your neighbor as yourself.",
    desire: "To protect and care for others",
    fear: "Ingratitude, selfishness",
    avatar: "/archetypes/archetype-caregiver.png",
  },
];

export const archetypesById: Record<ArchetypeId, Archetype> = Object.fromEntries(
  archetypes.map((a) => [a.id, a]),
) as Record<ArchetypeId, Archetype>;

/**
 * Position on a circle, 0-indexed from 12 o'clock, clockwise.
 * Returns SVG-space coordinates (y grows downward).
 */
export function archetypeNodePosition(
  position: number,
  radius: number,
  cx = 0,
  cy = 0,
): { x: number; y: number } {
  const angle = (position / 12) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export type ArchetypeScores = Partial<Record<ArchetypeId, number>>;

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
