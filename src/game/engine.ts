import { nextRandom } from "./rng";
import {
  BIG_GROUP,
  CELLS,
  MIN_GROUP,
  SIZE,
  type Cell,
  type GameState,
  type MergeStep,
  type PlaceResult,
} from "./types";

/** Weighted pick of the next tile. Higher tiers unlock as the best tile grows. */
export function spawnValue(seed: number, maxValue: number): [number, number] {
  // tier 0: 2/4/8 · each power reached from 64 on unlocks one more (max 3 extra)
  const tier = Math.min(3, Math.max(0, Math.log2(maxValue) - 5));
  const weights = [70, 25, 5, 4, 3, 2].slice(0, 3 + tier);
  const total = weights.reduce((a, b) => a + b, 0);
  const [r, s] = nextRandom(seed);
  let roll = r * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return [2 ** (i + 1), s];
  }
  return [2, s];
}

export function newGame(seed: number): GameState {
  const [current, s1] = spawnValue(seed, 2);
  const [next, s2] = spawnValue(s1, 2);
  return {
    board: Array<Cell>(CELLS).fill(null),
    current,
    next,
    score: 0,
    maxValue: 2,
    moves: 0,
    over: false,
    seed: s2,
    nextId: 1,
  };
}

export function neighbors(idx: number): number[] {
  const r = Math.floor(idx / SIZE);
  const c = idx % SIZE;
  const out: number[] = [];
  if (r > 0) out.push(idx - SIZE);
  if (r < SIZE - 1) out.push(idx + SIZE);
  if (c > 0) out.push(idx - 1);
  if (c < SIZE - 1) out.push(idx + 1);
  return out;
}

/** Orthogonally connected cells holding the same value as `idx` (idx first). */
export function findGroup(board: Cell[], idx: number): number[] {
  const value = board[idx]?.value;
  if (value === undefined) return [];
  const seen = new Set([idx]);
  const queue = [idx];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of neighbors(cur)) {
      if (!seen.has(n) && board[n]?.value === value) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return [...seen];
}

/** Collapse groups at `idx` repeatedly. Mutates `board`; returns the chain. */
export function resolveChain(board: Cell[], idx: number): MergeStep[] {
  const steps: MergeStep[] = [];
  for (;;) {
    const tile = board[idx];
    if (!tile) break;
    const group = findGroup(board, idx);
    if (group.length < MIN_GROUP) break;
    const step = steps.length + 1;
    const value = tile.value * (group.length >= BIG_GROUP ? 4 : 2);
    const from = group.filter((i) => i !== idx);
    for (const i of from) board[i] = null;
    board[idx] = { id: tile.id, value };
    steps.push({ into: idx, from, value, points: value * step, step });
  }
  return steps;
}

export function emptyCount(board: Cell[]): number {
  return board.reduce((n, c) => n + (c ? 0 : 1), 0);
}

export function place(state: GameState, idx: number): PlaceResult | null {
  if (state.over || idx < 0 || idx >= CELLS || state.board[idx]) return null;
  const board = state.board.slice();
  board[idx] = { id: state.nextId, value: state.current };
  const steps = resolveChain(board, idx);

  const placedValue = board[idx]!.value;
  const maxValue = Math.max(state.maxValue, placedValue);
  const [spawned, seed] = spawnValue(state.seed, maxValue);
  return {
    steps,
    state: {
      board,
      current: state.next,
      next: spawned,
      score: state.score + steps.reduce((n, s) => n + s.points, 0),
      maxValue,
      moves: state.moves + 1,
      // a merge always frees cells, so a full board means no legal move left
      over: emptyCount(board) === 0,
      seed,
      nextId: state.nextId + 1,
    },
  };
}

export type Preview = {
  /** Cells (besides the target) that would be absorbed. */
  cells: number[];
  /** Final value at the target after the whole chain. */
  value: number;
  chain: number;
};

/** What would happen if `value` were placed at `idx` (null if not placeable). */
export function preview(board: Cell[], idx: number, value: number): Preview | null {
  if (idx < 0 || idx >= CELLS || board[idx]) return null;
  const copy = board.slice();
  copy[idx] = { id: -1, value };
  const steps = resolveChain(copy, idx);
  return {
    cells: steps.flatMap((s) => s.from),
    value: copy[idx]!.value,
    chain: steps.length,
  };
}
