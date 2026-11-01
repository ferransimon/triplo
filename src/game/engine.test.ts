import { describe, expect, it } from "vitest";
import { findGroup, newGame, place, preview, spawnValue } from "./engine";
import { CELLS, type Cell, type GameState } from "./types";

/** Build a 5x5 board from 25 numbers (0 = empty). */
function board(values: number[]): Cell[] {
  return values.map((v, i) => (v ? { id: 100 + i, value: v } : null));
}

function stateWith(values: number[], current: number): GameState {
  return { ...newGame(42), board: board(values), current, maxValue: Math.max(2, ...values) };
}

const at = (r: number, c: number) => r * 5 + c;

describe("engine", () => {
  it("starts with an empty board and spawnable tiles", () => {
    const s = newGame(1);
    expect(s.board).toHaveLength(CELLS);
    expect(s.board.every((c) => c === null)).toBe(true);
    expect([2, 4, 8]).toContain(s.current);
    expect([2, 4, 8]).toContain(s.next);
  });

  it("does not merge a pair (needs 3)", () => {
    const v = Array(25).fill(0);
    v[at(0, 0)] = 2;
    const r = place(stateWith(v, 2), at(0, 1))!;
    expect(r.steps).toHaveLength(0);
    expect(r.state.board[at(0, 0)]?.value).toBe(2);
    expect(r.state.board[at(0, 1)]?.value).toBe(2);
  });

  it("merges three equal tiles into the placed cell", () => {
    const v = Array(25).fill(0);
    v[at(0, 0)] = 2;
    v[at(0, 2)] = 2;
    const r = place(stateWith(v, 2), at(0, 1))!;
    expect(r.steps).toHaveLength(1);
    expect(r.state.board[at(0, 1)]?.value).toBe(4);
    expect(r.state.board[at(0, 0)]).toBeNull();
    expect(r.state.board[at(0, 2)]).toBeNull();
    expect(r.state.score).toBe(4);
  });

  it("chains merges with growing multiplier", () => {
    const v = Array(25).fill(0);
    v[at(0, 0)] = 2;
    v[at(0, 2)] = 2;
    v[at(1, 1)] = 4;
    v[at(2, 1)] = 4;
    const r = place(stateWith(v, 2), at(0, 1))!;
    expect(r.steps.map((s) => s.value)).toEqual([4, 8]);
    expect(r.state.board[at(0, 1)]?.value).toBe(8);
    expect(r.state.board[at(1, 1)]).toBeNull();
    expect(r.state.score).toBe(4 * 1 + 8 * 2);
  });

  it("jumps two powers with a group of 5+", () => {
    const v = Array(25).fill(0);
    v[at(1, 0)] = 2;
    v[at(1, 2)] = 2;
    v[at(0, 1)] = 2;
    v[at(2, 1)] = 2;
    const r = place(stateWith(v, 2), at(1, 1))!;
    expect(r.state.board[at(1, 1)]?.value).toBe(8);
  });

  it("rejects placing on an occupied cell", () => {
    const v = Array(25).fill(0);
    v[0] = 2;
    expect(place(stateWith(v, 2), 0)).toBeNull();
  });

  it("is game over when the board fills without merging", () => {
    // checkerboard of 2/4 with one hole; placing 8 cannot merge
    const v: number[] = Array.from({ length: 25 }, (_, i) => ((Math.floor(i / 5) + (i % 5)) % 2 ? 4 : 2));
    v[24] = 0;
    const r = place(stateWith(v, 8), 24)!;
    expect(r.state.over).toBe(true);
    expect(place(r.state, 0)).toBeNull();
  });

  it("finds connected groups only orthogonally", () => {
    const v = Array(25).fill(0);
    v[at(0, 0)] = 2;
    v[at(1, 1)] = 2;
    expect(findGroup(board(v), at(0, 0))).toEqual([at(0, 0)]);
  });

  it("previews the full chain without mutating the board", () => {
    const v = Array(25).fill(0);
    v[at(0, 0)] = 2;
    v[at(0, 2)] = 2;
    v[at(1, 1)] = 4;
    v[at(2, 1)] = 4;
    const b = board(v);
    const p = preview(b, at(0, 1), 2)!;
    expect(p.value).toBe(8);
    expect(p.chain).toBe(2);
    expect(p.cells.sort()).toEqual([at(0, 0), at(0, 2), at(1, 1), at(2, 1)].sort());
    expect(b[at(0, 1)]).toBeNull();
  });

  it("only spawns 2/4/8 early and unlocks more later", () => {
    let seed = 7;
    const early = new Set<number>();
    const late = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const [a, s1] = spawnValue(seed, 32);
      const [b, s2] = spawnValue(s1, 1024);
      early.add(a);
      late.add(b);
      seed = s2;
    }
    expect([...early].sort((x, y) => x - y)).toEqual([2, 4, 8]);
    expect(late.has(64)).toBe(true);
  });
});
