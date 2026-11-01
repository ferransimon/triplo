export const SIZE = 5;
export const CELLS = SIZE * SIZE;
/** Minimum connected group (placed tile included) that triggers a merge. */
export const MIN_GROUP = 3;
/** Group size from which the merge jumps two powers (×4) instead of one. */
export const BIG_GROUP = 5;

export type Tile = { id: number; value: number };
export type Cell = Tile | null;

export type GameState = {
  board: Cell[];
  current: number;
  next: number;
  score: number;
  maxValue: number;
  moves: number;
  over: boolean;
  seed: number;
  nextId: number;
};

/** One link of a merge chain: `from` cells collapse into `into`, producing `value`. */
export type MergeStep = {
  into: number;
  from: number[];
  value: number;
  points: number;
  step: number;
};

export type PlaceResult = {
  state: GameState;
  steps: MergeStep[];
};
