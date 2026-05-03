/**
 * The 42 + 5 questions of the v5 framework.
 *
 * Each entry pairs an English and Chinese reference wording. The real AI
 * personalizes the wording at runtime using the Terminology Registry; the
 * mock just renders these defaults verbatim.
 */

import type { PhaseId } from './phases';

export interface QuestionDef {
  /** "CQ1" through "CQ5" for calibration; "Q1" through "Q42" for the main interview */
  key: string;
  phase: PhaseId | 'CALIBRATION';
  sectionEn: string;
  sectionZh: string;
  promptEn: string;
  promptZh: string;
}

export const CALIBRATION: readonly QuestionDef[] = [
  {
    key: 'CQ1',
    phase: 'CALIBRATION',
    sectionEn: 'Language Protocol',
    sectionZh: '语言协议',
    promptEn: 'What is your native language?',
    promptZh: '你的母语是什么？',
  },
  {
    key: 'CQ2',
    phase: 'CALIBRATION',
    sectionEn: 'Brand–Person Relationship',
    sectionZh: '品牌与人的关系',
    promptEn: 'A hypothetical — whether you already have a brand or it\'s still just a shape in your head: imagine this thing succeeds. One day, you decide to walk away. Does it survive without you? And more honestly: do you want it to?',
    promptZh: '一个假设——不管你已经有了一个品牌，还是它只是脑海中的一个轮廓：想象这件事成功了。有一天，你决定抽身离开。它能在没有你的情况下存活吗？更诚实地说：你希望它能吗？',
  },
  {
    key: 'CQ3',
    phase: 'CALIBRATION',
    sectionEn: 'Mode Confirmation',
    sectionZh: '模式确认',
    promptEn: 'When you think about where this brand is headed, how much of that direction comes from your personal gut vs. the organization\'s collective logic?',
    promptZh: '当你思考这个品牌的走向时，有多少方向来自你个人的直觉，又有多少来自组织的集体逻辑？',
  },
  {
    key: 'CQ4',
    phase: 'CALIBRATION',
    sectionEn: 'Origin Impulse',
    sectionZh: '原始冲动',
    promptEn: 'The thing you\'re building — where did the original impulse come from? Did you see someone else doing something similar and want to do it better? Or was there something inside that simply demanded to exist? Or honestly — you\'re still figuring that out?',
    promptZh: '你正在构建的事情——最初的冲动来自哪里？是看到别人在做类似的事，你想做得更好？还是有什么东西在你内心一定要存在？或者老实说——你还在思索？',
  },
  {
    key: 'CQ5',
    phase: 'CALIBRATION',
    sectionEn: '30-Second Explanation',
    sectionZh: '30 秒解释',
    promptEn: 'If I gave you 30 seconds right now to explain what you\'re building to a stranger — what would you say? And after saying it — do you feel you actually said it clearly?',
    promptZh: '如果我现在给你 30 秒，向一个陌生人解释你正在做的事情——你会说什么？说完之后——你觉得自己真的说清楚了吗？',
  },
];

export const INTERVIEW: readonly QuestionDef[] = [
  // ROOT — North Star & Identity Positioning (Q1-Q10)
  { key: 'Q1',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'Name the 3 brands or people you admire most. Not "respect" — admire. Who are they, and what specifically triggers that response?',
    promptZh: '说出你最崇拜的 3 个品牌或人。不是「尊敬」——是崇拜。他们是谁？具体是什么触发了你的回应？' },
  { key: 'Q2',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'Who inspired the people or brands you just named? Trace one level deeper — their lineage.',
    promptZh: '是谁启发了你刚刚提到的那些人或品牌？再往下挖一层——他们的传承。' },
  { key: 'Q3',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'Beneath those individuals, are there entire traditions, movements, or foundational texts you draw from? Not people — the soil.',
    promptZh: '在那些具体的人之下，是否有整个传统、运动或基础文本是你的源泉？不是人——是土壤。' },
  { key: 'Q4',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'A widely-respected figure or brand in your field that makes you uneasy. Specifically — what\'s off?',
    promptZh: '在你的领域里，有谁/哪个品牌广受尊敬，但让你感到不舒服？具体——哪里不对劲？' },
  { key: 'Q5',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'How do you define your field? Are you accepting its existing definition or quietly redefining it?',
    promptZh: '你如何定义你所在的领域？你接受它现有的定义，还是悄悄地在重新定义它？' },
  { key: 'Q6',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'What\'s the specific absence in your industry — the thing that should exist but doesn\'t?',
    promptZh: '在你的行业里，什么是具体的「空缺」——本该存在但没有的东西？' },
  { key: 'Q7',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'When this brand succeeds, who specifically benefits? Force specificity — not "everyone." Give me a face, a situation.',
    promptZh: '当你正在做的这件事成功了——谁会受益？具体一点儿。不要用「所有人」。给我一个人，一种处境。' },
  { key: 'Q8',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'Through ___ (service), delivering ___ (core value), helping ___ (audience) achieve ___ (goal). Or rewrite the formula entirely.',
    promptZh: '通过 ___ (服务/媒介)，传递 ___ (核心价值)，帮助 ___ (受众) 达成 ___ (目标)。或者，重写这个公式。' },
  { key: 'Q9',  phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'Not the overlaps — the cracks. Where do love, skill, need, and payment fail to align?',
    promptZh: '不是重叠的部分——是裂缝。你热爱的 × 你擅长的 × 世界需要的 × 你能被付费的，这四样在哪里对不齐？' },
  { key: 'Q10', phase: 'ROOT', sectionEn: 'North Star & Identity Positioning', sectionZh: '北极星与身份定位',
    promptEn: 'Imagine someone uses your product or works with your brand. What words come out of their mouth describing it? Verbs and adjectives.',
    promptZh: '想象一个人使用了你的产品或跟你的品牌合作过。他们正在向朋友描述这段体验。什么词从他们嘴里出来？动词和形容词。' },
  // ROOT — Internal Structure (Q11-Q16)
  { key: 'Q11', phase: 'ROOT', sectionEn: 'Internal Structure — Why', sectionZh: '内部结构 — 为什么',
    promptEn: 'In all the things you could be doing, why this brand, this field, this mission? The personal story, not the pitch version.',
    promptZh: '在你可以花一辈子做的所有事情中——为什么是这个品牌、这个领域、这个使命？要的是真实的回答，不是路演版本。' },
  { key: 'Q12', phase: 'ROOT', sectionEn: 'Internal Structure — Why',  sectionZh: '内部结构 — 为什么',
    promptEn: 'What condition would make this mission no longer matter? What would make you stop?',
    promptZh: '什么会让你停下来？先不提钱或时间。而是世界必须变成什么样子，才会让你说「这个使命不再重要了」？' },
  { key: 'Q13', phase: 'ROOT', sectionEn: 'Internal Structure — How',  sectionZh: '内部结构 — 怎么做',
    promptEn: 'How are you actually building this? Walk through the method, the weekly practice, the framework — or its absence.',
    promptZh: '你实际上在怎么做这件事？不是愿景——是行动。回顾一遍目前的做法：你每周做什么来推进它？这些行动背后有没有一套哲学或框架，还是尚不明朗、正在边做边想？' },
  { key: 'Q14', phase: 'ROOT', sectionEn: 'Internal Structure — How',  sectionZh: '内部结构 — 怎么做',
    promptEn: 'What capability gap keeps you up at night?',
    promptZh: '什么能力短板让你夜不能寐？' },
  { key: 'Q15', phase: 'ROOT', sectionEn: 'Internal Structure — Want', sectionZh: '内部结构 — 想要',
    promptEn: 'If the brand succeeds beyond your wildest expectations — what does that give you personally? And then: tell me the shadow of that desire.',
    promptZh: '如果这个品牌成功得超出你最疯狂的期望——它会给你个人带来什么？然后：告诉我这种欲望的阴影面。' },
  { key: 'Q16', phase: 'ROOT', sectionEn: 'Internal Structure — Want', sectionZh: '内部结构 — 想要',
    promptEn: '10 years from now, the brand didn\'t happen — what specific thing remains uncreated? What goes missing from the world?',
    promptZh: '10 年后，这个品牌没有发生——什么具体的东西没有被创造出来？世界少了什么？' },
  // TRUNK — Beliefs (Q17-Q22)
  { key: 'Q17', phase: 'TRUNK', sectionEn: 'Beliefs & Contrarian Takes', sectionZh: '信念与反主流观点',
    promptEn: 'A core contrarian belief — the conviction that would make half a room uncomfortable.',
    promptZh: '一个核心的反主流观点——会让半个房间的人感到不舒服的那种信念。' },
  { key: 'Q18', phase: 'TRUNK', sectionEn: 'Beliefs & Contrarian Takes', sectionZh: '信念与反主流观点',
    promptEn: 'The belief underneath the one you just gave. The one you haven\'t quite said out loud.',
    promptZh: '在你刚才说的那个信念之下，还有一个——你还没完全说出口的那一个。' },
  { key: 'Q19', phase: 'TRUNK', sectionEn: 'Beliefs & Contrarian Takes', sectionZh: '信念与反主流观点',
    promptEn: 'Industry "best practice" you think is wrong or dangerously incomplete.',
    promptZh: '你所在行业的「最佳实践」中，哪一条你认为是错的、或者危险地不完整？' },
  { key: 'Q20', phase: 'TRUNK', sectionEn: 'Beliefs & Contrarian Takes', sectionZh: '信念与反主流观点',
    promptEn: 'Which belief has actually changed how you operate? Separates performed beliefs from operational ones.',
    promptZh: '哪一个信念真正改变了你的做事方式？这区分了「表演性信念」和「操作性信念」。' },
  { key: 'Q21', phase: 'TRUNK', sectionEn: 'Beliefs & Contrarian Takes', sectionZh: '信念与反主流观点',
    promptEn: 'Deeper philosophical positions — about human nature, change, individual-society relationship — that inform brand decisions.',
    promptZh: '更深的哲学立场——关于人性、变化、个体与社会的关系——是怎样支撑你的品牌决策的？' },
  { key: 'Q22', phase: 'TRUNK', sectionEn: 'Beliefs & Contrarian Takes', sectionZh: '信念与反主流观点',
    promptEn: 'A belief you used to hold but don\'t anymore. The direction of change reveals growth trajectory.',
    promptZh: '你曾经相信、但现在不再相信的一件事。变化的方向，揭示了成长的轨迹。' },
  // TRUNK — Expression & Voice (Q23-Q29)
  { key: 'Q23', phase: 'TRUNK', sectionEn: 'Expression & Voice', sectionZh: '表达与声音',
    promptEn: 'How you actually communicate vs. how you think you communicate. What\'s natural, what\'s forced.',
    promptZh: '你实际上的沟通方式 vs. 你以为的沟通方式。什么是自然的，什么是勉强的？' },
  { key: 'Q24', phase: 'TRUNK', sectionEn: 'Expression & Voice', sectionZh: '表达与声音',
    promptEn: 'What do you deliberately leave out? Strategic silence.',
    promptZh: '你刻意省略的是什么？战略性的沉默。' },
  { key: 'Q25', phase: 'TRUNK', sectionEn: 'Expression & Voice', sectionZh: '表达与声音',
    promptEn: 'Media or formats you gravitate toward naturally. And: forms from other fields that excite you.',
    promptZh: '你天然被吸引的媒介或形式。以及：来自其他领域、让你兴奋的形式。' },
  { key: 'Q26', phase: 'TRUNK', sectionEn: 'Expression & Voice', sectionZh: '表达与声音',
    promptEn: 'Words you overuse, words that excite you, words you\'d never use.',
    promptZh: '你过度使用的词，让你兴奋的词，你绝不会用的词。' },
  { key: 'Q27', phase: 'TRUNK', sectionEn: 'Expression & Voice', sectionZh: '表达与声音',
    promptEn: 'How you use humor + how you handle public disagreement. Personality under stress.',
    promptZh: '你怎么用幽默 + 你怎么处理公开分歧？压力下的人格。' },
  { key: 'Q28', phase: 'TRUNK', sectionEn: 'Expression & Voice', sectionZh: '表达与声音',
    promptEn: 'Brand expression that makes you physically cringe. Not bad quality — someone trying to be good and failing.',
    promptZh: '让你生理性反感的品牌表达。不是质量差——而是「想做好却没做好」。' },
  { key: 'Q29', phase: 'TRUNK', sectionEn: 'Expression & Voice', sectionZh: '表达与声音',
    promptEn: 'Signature openings and closings. Bookend patterns.',
    promptZh: '你标志性的开场白与结束语。书挡式的模式。' },
  // BARK — Taste Immune System (Q30-Q33)
  { key: 'Q30', phase: 'BARK', sectionEn: 'Taste Immune System', sectionZh: '品味免疫系统',
    promptEn: 'Things you\'d never do as a brand — even for money, audience, or short-term gain.',
    promptZh: '作为一个品牌，你绝对不会做的事——哪怕为了钱、受众、或短期收益。' },
  { key: 'Q31', phase: 'BARK', sectionEn: 'Taste Immune System', sectionZh: '品味免疫系统',
    promptEn: 'What distinguishes a brand that feels alive from one that feels hollow? Your quality framework.',
    promptZh: '一个有生命力的品牌 vs. 一个空洞的品牌——区别是什么？这是你的品质框架。' },
  { key: 'Q32', phase: 'BARK', sectionEn: 'Taste Immune System', sectionZh: '品味免疫系统',
    promptEn: 'Specific signals of inauthenticity. What tells you someone is performing rather than being?',
    promptZh: '你识别「假」的具体信号。什么告诉你：这个人在表演，而不是在做自己？' },
  { key: 'Q33', phase: 'BARK', sectionEn: 'Taste Immune System', sectionZh: '品味免疫系统',
    promptEn: 'Your deepest evaluative framework. The internal algorithm — the 2-3 things you\'re really checking for.',
    promptZh: '你最深层的评判框架。内部的算法——你真正在检查的 2-3 件事。' },
  // CANOPY — Content Architecture (Q34-Q39)
  { key: 'Q34', phase: 'CANOPY', sectionEn: 'Content Architecture', sectionZh: '内容架构',
    promptEn: 'How do you organize expression across weekly / monthly / quarterly / yearly horizons?',
    promptZh: '你如何在周/月/季/年的时间尺度上组织表达？' },
  { key: 'Q35', phase: 'CANOPY', sectionEn: 'Content Architecture', sectionZh: '内容架构',
    promptEn: 'Your relationship with depth vs. brevity. How do formats feed each other?',
    promptZh: '你与深度 vs. 简洁的关系。各种形式如何相互滋养？' },
  { key: 'Q36', phase: 'CANOPY', sectionEn: 'Content Architecture', sectionZh: '内容架构',
    promptEn: 'The single body of work, idea, or project that everything else derives from. Content center of gravity.',
    promptZh: '一切其他东西从中派生出来的那个作品/想法/项目。内容的重心。' },
  { key: 'Q37', phase: 'CANOPY', sectionEn: 'Content Architecture', sectionZh: '内容架构',
    promptEn: 'Is repetition a problem or a resource? What\'s the right balance between new and familiar?',
    promptZh: '重复是问题还是资源？新与熟悉之间，怎样才算合适的平衡？' },
  { key: 'Q38', phase: 'CANOPY', sectionEn: 'Content Architecture', sectionZh: '内容架构',
    promptEn: 'What\'s still the same about this brand in 30 years? Separates timeless DNA from current tactics.',
    promptZh: '30 年后，这个品牌仍然不变的部分是什么？这能把永恒的 DNA 与当前的战术分开。' },
  { key: 'Q39', phase: 'CANOPY', sectionEn: 'Content Architecture', sectionZh: '内容架构',
    promptEn: 'Energy allocation between proven, iterative, and experimental work.',
    promptZh: '已被证明的工作 / 迭代式的工作 / 实验性的工作——你的精力分配比例是多少？' },
  // CANOPY — Integration (Q40-Q42)
  { key: 'Q40', phase: 'CANOPY', sectionEn: 'Integration & Horizon', sectionZh: '整合与远景',
    promptEn: 'If the brand works at scale, what new problems does that create?',
    promptZh: '如果品牌真的成功并放大——会产生什么新问题？' },
  { key: 'Q41', phase: 'CANOPY', sectionEn: 'Integration & Horizon', sectionZh: '整合与远景',
    promptEn: 'One thing from this conversation to send to your future self 5 years from now.',
    promptZh: '从这次对话中，挑出一件事，送给 5 年后的你。' },
  { key: 'Q42', phase: 'CANOPY', sectionEn: 'Integration & Horizon', sectionZh: '整合与远景',
    promptEn: 'What did this conversation miss? The thing still sitting in you, unsaid. You close the interview, not the framework.',
    promptZh: '这次对话漏掉了什么？还停留在你心里、没说出口的那件事。是你结束这次访谈，不是框架。' },
];

export function questionByKey(key: string): QuestionDef | undefined {
  return CALIBRATION.find((q) => q.key === key) ?? INTERVIEW.find((q) => q.key === key);
}
