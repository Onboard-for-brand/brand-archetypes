/**
 * Radar session — pure types and functions.
 *
 * No React, no IO. The same code runs:
 *   • client-side, for optimistic updates from streamed tool calls
 *   • server-side, for AI tool `execute` callbacks before DB writes
 *
 * This is the contract that the AI tool call (`emitTurnAnalysis`) feeds.
 * Bounds match the v5 framework spec.
 */

import { z } from "zod";
import {
  archetypes,
  type ArchetypeId,
  type ArchetypeScores,
} from "@/lib/archetypes";

// ───────────── Bounds (per-turn delta limits) ─────────────

export const RADAR_BOUNDS = {
  archetypeDelta: 0.15, // each archetype, per turn
  journeyDelta: 0.05, // 6-stage external journey, per turn
  internalStructureDelta: 0.5, // why/how/want, per turn
} as const;

// ───────────── State shape ─────────────

export interface InternalStructure {
  why: number; // 0..4
  how: number;
  want: number;
}

export interface RadarState {
  archetypeScores: Record<ArchetypeId, number>; // 0..1 each
  primaryId: ArchetypeId | null; // derived: max-score archetype, null if all zero
  journeyPosition: number; // 0..1
  internalStructure: InternalStructure;
}

// ───────────── Per-turn deltas (what AI emits) ─────────────

export interface RadarDeltas {
  archetypeDeltas?: Partial<Record<ArchetypeId, number>>;
  journeyDelta?: number;
  internalStructureDelta?: Partial<InternalStructure>;
}

// ───────────── Snapshot (serializable, for DB jsonb / next-turn AI context) ─────────────

export type RadarSnapshot = RadarState;

// ───────────── Construction ─────────────

export function emptyRadarState(): RadarState {
  return {
    archetypeScores: Object.fromEntries(
      archetypes.map((a) => [a.id, 0]),
    ) as Record<ArchetypeId, number>,
    primaryId: null,
    journeyPosition: 0,
    internalStructure: { why: 0, how: 0, want: 0 },
  };
}

// ───────────── Helpers ─────────────

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** Top-scoring archetype, or null if every score is 0. */
export function pickPrimary(
  scores: Record<ArchetypeId, number>,
): ArchetypeId | null {
  let topId: ArchetypeId | null = null;
  let topScore = 0;
  for (const a of archetypes) {
    const s = scores[a.id] ?? 0;
    if (s > topScore) {
      topScore = s;
      topId = a.id;
    }
  }
  return topScore > 0 ? topId : null;
}

/** Clamp incoming deltas to per-turn bounds before they're applied. */
export function clampRadarDeltas(deltas: RadarDeltas): RadarDeltas {
  const out: RadarDeltas = {};
  if (deltas.archetypeDeltas) {
    out.archetypeDeltas = {};
    for (const [id, raw] of Object.entries(deltas.archetypeDeltas)) {
      if (typeof raw !== "number") continue;
      out.archetypeDeltas[id as ArchetypeId] = clamp(
        raw,
        -RADAR_BOUNDS.archetypeDelta,
        RADAR_BOUNDS.archetypeDelta,
      );
    }
  }
  if (typeof deltas.journeyDelta === "number") {
    out.journeyDelta = clamp(
      deltas.journeyDelta,
      -RADAR_BOUNDS.journeyDelta,
      RADAR_BOUNDS.journeyDelta,
    );
  }
  if (deltas.internalStructureDelta) {
    const isd = deltas.internalStructureDelta;
    const b = RADAR_BOUNDS.internalStructureDelta;
    out.internalStructureDelta = {};
    if (typeof isd.why === "number")
      out.internalStructureDelta.why = clamp(isd.why, -b, b);
    if (typeof isd.how === "number")
      out.internalStructureDelta.how = clamp(isd.how, -b, b);
    if (typeof isd.want === "number")
      out.internalStructureDelta.want = clamp(isd.want, -b, b);
  }
  return out;
}

/**
 * Apply a single turn's deltas. Bounds are enforced twice:
 *   1. each delta clamped to its per-turn limit
 *   2. each resulting score clamped to its absolute range
 */
export function applyRadarDeltas(
  state: RadarState,
  rawDeltas: RadarDeltas,
): RadarState {
  const deltas = clampRadarDeltas(rawDeltas);

  const nextScores = { ...state.archetypeScores };
  if (deltas.archetypeDeltas) {
    for (const [id, d] of Object.entries(deltas.archetypeDeltas)) {
      if (typeof d !== "number") continue;
      const cur = nextScores[id as ArchetypeId] ?? 0;
      nextScores[id as ArchetypeId] = clamp(cur + d, 0, 1);
    }
  }

  const nextJourney =
    typeof deltas.journeyDelta === "number"
      ? clamp(state.journeyPosition + deltas.journeyDelta, 0, 1)
      : state.journeyPosition;

  const nextInternal: InternalStructure = { ...state.internalStructure };
  if (deltas.internalStructureDelta) {
    const isd = deltas.internalStructureDelta;
    if (typeof isd.why === "number")
      nextInternal.why = clamp(nextInternal.why + isd.why, 0, 4);
    if (typeof isd.how === "number")
      nextInternal.how = clamp(nextInternal.how + isd.how, 0, 4);
    if (typeof isd.want === "number")
      nextInternal.want = clamp(nextInternal.want + isd.want, 0, 4);
  }

  return {
    archetypeScores: nextScores,
    primaryId: pickPrimary(nextScores),
    journeyPosition: nextJourney,
    internalStructure: nextInternal,
  };
}

/**
 * Replace archetype scores by absolute values (e.g. admin override / hydration).
 * Skips clamping deltas; clamps each score to 0..1.
 */
export function setRadarScores(
  state: RadarState,
  scores: Partial<Record<ArchetypeId, number>>,
): RadarState {
  const nextScores: Record<ArchetypeId, number> = { ...state.archetypeScores };
  for (const [id, v] of Object.entries(scores)) {
    if (typeof v !== "number") continue;
    nextScores[id as ArchetypeId] = clamp(v, 0, 1);
  }
  return {
    ...state,
    archetypeScores: nextScores,
    primaryId: pickPrimary(nextScores),
  };
}

/** Trim a state to a serializable snapshot — just the value object. */
export function radarSnapshot(state: RadarState): RadarSnapshot {
  return {
    archetypeScores: { ...state.archetypeScores },
    primaryId: state.primaryId,
    journeyPosition: state.journeyPosition,
    internalStructure: { ...state.internalStructure },
  };
}

// ───────────── Zod schemas (runtime validation) ─────────────

const archetypeIdValues = archetypes.map((a) => a.id) as [
  ArchetypeId,
  ...ArchetypeId[],
];

export const ArchetypeIdSchema = z.enum(archetypeIdValues);

export const ArchetypeScoresSchema = z.record(
  ArchetypeIdSchema,
  z.number().min(0).max(1),
);

const internalStructureValueSchema = z.number().min(0).max(4);

export const RadarStateSchema = z.object({
  archetypeScores: z.record(ArchetypeIdSchema, z.number().min(0).max(1)),
  primaryId: ArchetypeIdSchema.nullable(),
  journeyPosition: z.number().min(0).max(1),
  internalStructure: z.object({
    why: internalStructureValueSchema,
    how: internalStructureValueSchema,
    want: internalStructureValueSchema,
  }),
});

/**
 * What the AI tool call `emitTurnAnalysis` provides for the radar.
 * Bounds enforced — out-of-range values are rejected, not silently clamped.
 * Use `clampRadarDeltas()` afterwards if you want to be permissive.
 */
export const RadarDeltasSchema = z.object({
  archetypeDeltas: z
    .record(
      ArchetypeIdSchema,
      z
        .number()
        .min(-RADAR_BOUNDS.archetypeDelta)
        .max(RADAR_BOUNDS.archetypeDelta),
    )
    .optional(),
  journeyDelta: z
    .number()
    .min(-RADAR_BOUNDS.journeyDelta)
    .max(RADAR_BOUNDS.journeyDelta)
    .optional(),
  internalStructureDelta: z
    .object({
      why: z
        .number()
        .min(-RADAR_BOUNDS.internalStructureDelta)
        .max(RADAR_BOUNDS.internalStructureDelta)
        .optional(),
      how: z
        .number()
        .min(-RADAR_BOUNDS.internalStructureDelta)
        .max(RADAR_BOUNDS.internalStructureDelta)
        .optional(),
      want: z
        .number()
        .min(-RADAR_BOUNDS.internalStructureDelta)
        .max(RADAR_BOUNDS.internalStructureDelta)
        .optional(),
    })
    .optional(),
});

export type RadarDeltasInput = z.infer<typeof RadarDeltasSchema>;

// Re-export for convenience: callers can pass scores objects directly.
export type { ArchetypeId, ArchetypeScores };
