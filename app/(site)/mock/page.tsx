"use client";

/**
 * Visual mock of the InterviewOverlay at "Q42 just finished, ready to offer
 * the report" moment. Static — no AI, no streaming, no DB. Use to iterate on
 * the chat layout + CTA card before wiring real plumbing.
 */

import type { CSSProperties } from "react";
import { RadarChart } from "@/components/RadarChart";
import { ReportOfferCard } from "@/components/ReportOfferCard";
import type { ArchetypeId } from "@/lib/archetypes";

// ─── mock state ───────────────────────────────────────────────────────────

const MOCK_CODE = "DEMO-2026-TEST";

const MOCK_SCORES: Record<ArchetypeId, number> = {
  innocent: 0.42,
  sage: 0.58,
  explorer: 0.18,
  rebel: 0.08,
  magician: 0.22,
  hero: 0.05,
  jester: 0.04,
  lover: 0.1,
  everyman: 0.06,
  caregiver: 0.34,
  ruler: 0.31,
  creator: 0.78,
};

const MOCK_PRIMARY: ArchetypeId = "creator";

interface MockTurn {
  id: string;
  role: "user" | "assistant";
  bridge?: string;
  question?: string;
  text?: string;
  cta?: boolean;
}

const MOCK_THREAD: MockTurn[] = [
  {
    id: "t-0",
    role: "assistant",
    bridge:
      "欢迎。在接下来的 42 个问题里，我会陪你把品牌从根到冠层一遍翻过来。\n第一个问题非常基础——",
    question: "你的母语是什么？",
  },
  {
    id: "t-1",
    role: "user",
    text: "中英文都用。中文用来感受，英文用来梳理结构。",
  },
  {
    id: "t-2",
    role: "assistant",
    bridge: "很好——双语不是事实，是两种思考方式。我们就两边并行。",
    question: "说出你最崇拜的 3 个品牌或人。",
  },
  {
    id: "t-3",
    role: "user",
    text: "Cornelia Oberlander，柔和但坚定。Buckminster Fuller，系统思维。Patagonia，价值观体现在每一个决定里。",
  },
  {
    id: "t-4",
    role: "assistant",
    bridge:
      "你说的不是声音大的人，是权威来自反复劳作的人。这是创造者—智者的指纹。",
    question: "如果你的品牌是一种行业、一种学科、一种知识体系——你希望它扎根在哪里？",
  },
  {
    id: "t-5",
    role: "user",
    text: "我想它在「设计教育」和「制造工艺」的交界处——既能做出东西，也能教别人怎么做。",
  },
  {
    id: "t-6",
    role: "assistant",
    bridge:
      "你已经把范围收得很窄了——这是好事。不是「设计」也不是「教育」，是它们的接缝。\n这是最后一个问题——",
    question:
      "三年后，如果有人对你说：「这就是你做的吗？」你希望他们指着的，是一个产品、一群人，还是一种说话的方式？",
  },
  {
    id: "t-7",
    role: "user",
    text: "一群人。我希望他们指着的是一个圈子——里面的人因为认识彼此，而做出更好的东西。",
  },
  {
    id: "t-8",
    role: "assistant",
    bridge:
      "答完了。\n你描述的那个圈子，本身就是一种创造——把「做事的人」聚到一起，让作品互相照亮。\n这是 Creator + Sage + Caregiver 的组合：创造、解释、照看。",
    cta: true,
  },
];

// ─── page ─────────────────────────────────────────────────────────────────

export default function MockPage() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 10, 10, 1)",
        padding: 6,
        display: "grid",
        gridTemplateColumns: "minmax(0, 38fr) minmax(0, 62fr)",
        gap: 6,
        overflow: "hidden",
        zIndex: 30,
      }}
    >
      {/* Left column — chat history (top) + input (bottom) */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: "minmax(0, 1fr) auto",
          gap: 6,
          minHeight: 0,
        }}
      >
        <ChatPanel />
        <InputPanel />
      </div>

      {/* Right column — radar */}
      <section
        style={{
          background: "#ffffff",
          padding: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <RadarChart
          scores={MOCK_SCORES}
          primaryId={MOCK_PRIMARY}
          size={720}
        />
      </section>

      <MockBadge />
    </div>
  );
}

// ─── chat panel ───────────────────────────────────────────────────────────

function ChatPanel() {
  return (
    <section
      style={{
        background: "#ffffff",
        minHeight: 0,
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
      }}
    >
      <header style={chatHeaderStyle}>
        <span>SESSION</span>
        <span>CODE / {MOCK_CODE}</span>
      </header>

      <div
        data-lenis-prevent
        style={{
          overflow: "auto",
          minHeight: 0,
          padding: "20px 32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {MOCK_THREAD.map((turn) => (
          <MessageBlock key={turn.id} turn={turn} />
        ))}
      </div>
    </section>
  );
}

function MessageBlock({ turn }: { turn: MockTurn }) {
  const isUser = turn.role === "user";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={msgMarkerStyle}>{isUser ? "YOU" : "AI"}</div>

      {isUser ? (
        <div style={userTextStyle}>{turn.text}</div>
      ) : (
        <>
          {turn.bridge ? <div style={bridgeStyle}>{turn.bridge}</div> : null}
          {turn.question ? (
            <div style={questionStyle}>{turn.question}</div>
          ) : null}
          {turn.cta ? <ReportOfferCard code={MOCK_CODE} /> : null}
        </>
      )}
    </div>
  );
}

// ─── input panel (locked because the interview is over) ──────────────────

function InputPanel() {
  return (
    <section
      style={{
        background: "#ffffff",
        padding: "20px 24px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 200,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-framework)",
          fontSize: 10,
          letterSpacing: 2,
          color: "var(--brand-archetypes-gray-500)",
        }}
      >
        INTERVIEW COMPLETE
      </div>
      <textarea
        readOnly
        disabled
        placeholder="访谈结束 · Interview complete"
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "var(--font-body-zh)",
          fontSize: 15,
          lineHeight: 1.6,
          minHeight: 110,
          background: "transparent",
          color: "var(--brand-archetypes-black)",
          opacity: 0.5,
          cursor: "not-allowed",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-framework)",
          fontSize: 10,
          letterSpacing: 1.5,
          color: "var(--brand-archetypes-gray-500)",
        }}
      >
        <span>—</span>
        <span>OPEN REPORT ↑</span>
      </div>
    </section>
  );
}

// ─── corner badge so it's clearly a mock ─────────────────────────────────

function MockBadge() {
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 50,
        padding: "6px 10px",
        background: "var(--brand-archetypes-red)",
        color: "var(--brand-archetypes-white)",
        fontFamily: "var(--font-framework)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 2,
      }}
    >
      MOCK · 视觉预览
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────

const chatHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  fontFamily: "var(--font-framework)",
  fontSize: 10,
  letterSpacing: 2,
  color: "var(--brand-archetypes-gray-500)",
  padding: "20px 32px 16px",
  borderBottom: "1px solid var(--brand-archetypes-gray-200)",
};

const msgMarkerStyle: CSSProperties = {
  fontFamily: "var(--font-framework)",
  fontSize: 9,
  letterSpacing: 2,
  color: "var(--brand-archetypes-gray-500)",
};

const userTextStyle: CSSProperties = {
  fontFamily: "var(--font-body-zh)",
  fontSize: 15,
  lineHeight: 1.7,
  color: "var(--brand-archetypes-black)",
  whiteSpace: "pre-wrap",
};

const bridgeStyle: CSSProperties = {
  fontFamily: "var(--font-body-zh)",
  fontSize: 13,
  lineHeight: 1.75,
  color: "var(--brand-archetypes-gray-500)",
  whiteSpace: "pre-wrap",
};

const questionStyle: CSSProperties = {
  paddingLeft: 12,
  borderLeft: "2px solid var(--brand-archetypes-red)",
  fontFamily: "var(--font-body-zh)",
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 600,
  color: "var(--brand-archetypes-black)",
  whiteSpace: "pre-wrap",
};
