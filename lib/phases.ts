/**
 * Interview phases. The 42-question journey is split into 4 phases mirroring
 * the tree metaphor (root → trunk → bark → canopy). Anchor Points sit between
 * phases to deliver a structured analytical pause.
 */

export type PhaseId = 'CALIBRATION' | 'ROOT' | 'TRUNK' | 'BARK' | 'CANOPY';

export interface Phase {
  id: PhaseId;
  labelEn: string;
  labelZh: string;
  startQ: number;
  endQ: number;
  /** Width on the progress bar, as a fraction (0..1) */
  widthFraction: number;
}

export const PHASES: readonly Phase[] = [
  { id: 'ROOT',   labelEn: 'Root',   labelZh: '根系', startQ: 1,  endQ: 16, widthFraction: 16 / 42 },
  { id: 'TRUNK',  labelEn: 'Trunk',  labelZh: '枝干', startQ: 17, endQ: 29, widthFraction: 13 / 42 },
  { id: 'BARK',   labelEn: 'Bark',   labelZh: '树皮', startQ: 30, endQ: 33, widthFraction:  4 / 42 },
  { id: 'CANOPY', labelEn: 'Canopy', labelZh: '树冠', startQ: 34, endQ: 42, widthFraction:  9 / 42 },
] as const;

export const ANCHOR_POINTS = [
  { number: 1, afterQ: 16, transitionTo: 'TRUNK' as PhaseId },
  { number: 2, afterQ: 29, transitionTo: 'BARK' as PhaseId },
  { number: 3, afterQ: 42, transitionTo: null },
] as const;

export function phaseForQuestion(q: number): PhaseId {
  const phase = PHASES.find((p) => q >= p.startQ && q <= p.endQ);
  return phase?.id ?? 'CALIBRATION';
}

export function progressFraction(q: number): number {
  return Math.max(0, Math.min(1, q / 42));
}
