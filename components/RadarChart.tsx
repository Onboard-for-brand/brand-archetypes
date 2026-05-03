"use client";

import { useId } from "react";
import {
  archetypes,
  archetypeNodePosition,
  type ArchetypeId,
  type ArchetypeScores,
} from "@/lib/archetypes";

interface Props {
  scores: ArchetypeScores;
  /** Score >= threshold flips a node to active (red). */
  threshold?: number;
  /** Highest-ranked archetype gets a black square frame around its node. */
  primaryId?: ArchetypeId | null;
  /** Pixel size — chart is square. */
  size?: number;
  className?: string;
}

const RING_FRACTIONS = [0.33, 0.66, 1.0];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/** Round to 2 decimals to keep server- and client-side serialization identical. */
function r(n: number) {
  return Math.round(n * 100) / 100;
}

/** Polygon never collapses to the origin: every axis has a 5% baseline. */
const POLYGON_FLOOR = 0.05;

function polygonPoints(
  scores: ArchetypeScores,
  maxR: number,
  cx: number,
  cy: number,
) {
  return archetypes
    .map((a) => {
      const score = Math.max(POLYGON_FLOOR, clamp01(scores[a.id] ?? 0));
      const { x, y } = archetypeNodePosition(a.position, score * maxR, cx, cy);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function RadarChart({
  scores,
  threshold = 0.3,
  primaryId = null,
  size = 480,
  className,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.26;
  const labelR = size * 0.32;
  /** Quadrant label radius — sits outside the archetype label ring. */
  const quadR = size * 0.38;
  /** Extra viewBox space to include long quadrant labels in the painted box. */
  const padX = size * 0.12;
  const padY = size * 0.04;
  const vbX = -padX;
  const vbY = -padY;
  const vbW = size + padX * 2;
  const vbH = size + padY * 2;

  const polyPoints = polygonPoints(scores, maxR, cx, cy);

  const reactId = useId();
  const fillId = `radar-fill-${reactId.replace(/:/g, "")}`;

  return (
    <div
      className={["radar", className].filter(Boolean).join(" ")}
      style={{ width: "100%" }}
    >
      <svg
        className="radar__svg"
        viewBox={`${r(vbX)} ${r(vbY)} ${r(vbW)} ${r(vbH)}`}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        role="img"
        aria-label="Archetype composition radar"
      >
        <defs>
          {/* center fully transparent → edge translucent red */}
          <radialGradient
            id={fillId}
            gradientUnits="userSpaceOnUse"
            cx={r(cx)}
            cy={r(cy)}
            r={r(maxR)}
          >
            <stop offset="0%" stopColor="var(--brand-archetypes-red)" stopOpacity="0" />
            <stop offset="55%" stopColor="var(--brand-archetypes-red)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--brand-archetypes-red)" stopOpacity="0.28" />
          </radialGradient>
        </defs>

        {/* concentric circles */}
        <g className="radar__grid">
          {RING_FRACTIONS.map((f) => (
            <circle
              key={f}
              cx={r(cx)}
              cy={r(cy)}
              r={r(maxR * f)}
              fill="none"
              stroke="var(--brand-archetypes-gray-200)"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* spokes — one per archetype */}
        <g className="radar__spokes">
          {archetypes.map((a) => {
            const end = archetypeNodePosition(a.position, maxR, cx, cy);
            return (
              <line
                key={a.id}
                x1={r(cx)}
                y1={r(cy)}
                x2={r(end.x)}
                y2={r(end.y)}
                stroke="var(--brand-archetypes-gray-200)"
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* main crosshair — terminates at the outer ring */}
        <g className="radar__crosshair">
          <line
            x1={r(cx)}
            y1={r(cy - maxR)}
            x2={r(cx)}
            y2={r(cy + maxR)}
            stroke="var(--brand-archetypes-gray-300)"
            strokeWidth="0.5"
          />
          <line
            x1={r(cx - maxR)}
            y1={r(cy)}
            x2={r(cx + maxR)}
            y2={r(cy)}
            stroke="var(--brand-archetypes-gray-300)"
            strokeWidth="0.5"
          />
        </g>

        {/* tick numbers along the upper vertical axis */}
        <g className="radar__ticks">
          {RING_FRACTIONS.map((f) => (
            <text
              key={f}
              x={r(cx + 4)}
              y={r(cy - maxR * f)}
              fontFamily="var(--font-framework)"
              fontSize="8"
              fill="var(--brand-archetypes-gray-500)"
              dominantBaseline="middle"
            >
              {f.toFixed(2)}
            </text>
          ))}
        </g>

        {/* quadrant labels — single line, extends past viewBox if needed */}
        <g
          className="radar__quad-labels"
          fontFamily="var(--font-framework)"
          fontSize="10"
          letterSpacing="2"
          fill="var(--brand-archetypes-gray-500)"
        >
          <text
            x={r(cx)}
            y={r(cy - quadR)}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            STABILITY · 稳
          </text>
          <text
            x={r(cx)}
            y={r(cy + quadR)}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            MASTERY · 掌控
          </text>
          <text
            x={r(cx - quadR)}
            y={r(cy)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            BELONGING · 归属
          </text>
          <text
            x={r(cx + quadR)}
            y={r(cy)}
            textAnchor="start"
            dominantBaseline="middle"
          >
            INDEPENDENCE · 独立
          </text>
        </g>

        {/* live polygon */}
        <polygon
          className="radar__polygon"
          points={polyPoints}
          fill={`url(#${fillId})`}
          stroke="var(--brand-archetypes-red)"
          strokeWidth="1.5"
          strokeLinejoin="miter"
        />

        {/* archetype nodes — squares, not circles */}
        <g className="radar__nodes">
          {archetypes.map((a) => {
            const score = clamp01(scores[a.id] ?? 0);
            const nodePos = archetypeNodePosition(a.position, maxR, cx, cy);
            const labelPos = archetypeNodePosition(a.position, labelR, cx, cy);
            const isActive = score >= threshold;
            const isPrimary = primaryId === a.id;

            let textAnchor: "start" | "middle" | "end" = "middle";
            if (labelPos.x < cx - 8) textAnchor = "end";
            else if (labelPos.x > cx + 8) textAnchor = "start";

            const dotSize = isActive ? 5 : 2;
            const dotColor = isActive
              ? "var(--brand-archetypes-red)"
              : "var(--brand-archetypes-gray-500)";

            return (
              <g
                key={a.id}
                className="radar__node"
                data-archetype={a.id}
                data-active={isActive ? "true" : "false"}
                data-primary={isPrimary ? "true" : "false"}
              >
                {/* primary frame: 8x8 black square outline around the dot */}
                {isPrimary ? (
                  <rect
                    x={r(nodePos.x - 5)}
                    y={r(nodePos.y - 5)}
                    width={10}
                    height={10}
                    fill="none"
                    stroke="var(--brand-archetypes-black)"
                    strokeWidth="1.25"
                  />
                ) : null}

                <rect
                  className="radar__dot"
                  x={r(nodePos.x - dotSize / 2)}
                  y={r(nodePos.y - dotSize / 2)}
                  width={dotSize}
                  height={dotSize}
                  fill={dotColor}
                />

                <text
                  className="radar__label"
                  x={r(labelPos.x)}
                  y={r(labelPos.y)}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  fontFamily="var(--font-framework)"
                  fontSize="10"
                  letterSpacing="1.5"
                  fontWeight={isActive ? 700 : 500}
                  fill="var(--brand-archetypes-red)"
                  fillOpacity={isActive ? 1 : 0.55}
                >
                  {a.nameEn.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
