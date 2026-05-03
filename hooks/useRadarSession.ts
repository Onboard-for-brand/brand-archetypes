"use client";

import { useCallback, useState } from "react";
import {
  applyRadarDeltas,
  emptyRadarState,
  setRadarScores,
  radarSnapshot,
  type ArchetypeId,
  type RadarDeltas,
  type RadarSnapshot,
  type RadarState,
} from "@/lib/radar-session";

export interface UseRadarSession {
  /** Current radar state. Pass `state.archetypeScores` to <RadarChart>. */
  state: RadarState;
  /** Apply per-turn deltas (typical AI tool-call output path). */
  applyDeltas: (deltas: RadarDeltas) => void;
  /** Set archetype scores by absolute value (manual / admin override). */
  setScores: (scores: Partial<Record<ArchetypeId, number>>) => void;
  /** Replace the whole state — for hydration from server / preset switch. */
  hydrate: (next: Partial<RadarState>) => void;
  /** Reset to a fresh empty state. */
  reset: () => void;
  /** Read-only snapshot, e.g. to send back as next AI turn's context. */
  snapshot: () => RadarSnapshot;
}

export function useRadarSession(
  initial?: Partial<RadarState>,
): UseRadarSession {
  const [state, setState] = useState<RadarState>(() => ({
    ...emptyRadarState(),
    ...initial,
  }));

  const applyDeltas = useCallback((deltas: RadarDeltas) => {
    setState((prev) => applyRadarDeltas(prev, deltas));
  }, []);

  const setScores = useCallback(
    (scores: Partial<Record<ArchetypeId, number>>) => {
      setState((prev) => setRadarScores(prev, scores));
    },
    [],
  );

  const hydrate = useCallback((next: Partial<RadarState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const reset = useCallback(() => {
    setState(emptyRadarState());
  }, []);

  const snapshot = useCallback(() => radarSnapshot(state), [state]);

  return { state, applyDeltas, setScores, hydrate, reset, snapshot };
}
