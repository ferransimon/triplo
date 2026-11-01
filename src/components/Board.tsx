"use client";

import { AnimatePresence } from "motion/react";
import { useMemo, useRef, type PointerEvent } from "react";
import { preview } from "@/game/engine";
import { CELLS, SIZE, type GameState } from "@/game/types";
import type { LastMove } from "@/hooks/useGame";
import { Tile, type ExitTarget } from "./Tile";

type Props = {
  state: GameState;
  last: LastMove | null;
  /** Cell under the finger/mouse or keyboard cursor (-1 = none). */
  target: number;
  showCursor: boolean;
  onTarget: (idx: number) => void;
  onCommit: (idx: number) => void;
};

const cells = Array.from({ length: CELLS }, (_, i) => i);

export function Board({ state, last, target, showCursor, onTarget, onCommit }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pressed = useRef(false);

  const exits = useMemo(() => {
    const map = new Map<number, ExitTarget>();
    for (const s of last?.steps ?? []) {
      for (const from of s.from) {
        map.set(from, {
          dx: (s.into % SIZE) - (from % SIZE),
          dy: Math.floor(s.into / SIZE) - Math.floor(from / SIZE),
          delay: (s.step - 1) * 0.11,
        });
      }
    }
    return map;
  }, [last]);

  const hint = useMemo(
    () => (target >= 0 && !state.over ? preview(state.board, target, state.current) : null),
    [state, target],
  );
  const willMerge = useMemo(() => new Set(hint?.cells), [hint]);

  function cellAt(e: PointerEvent): number {
    const rect = ref.current!.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE);
    return c < 0 || r < 0 || c >= SIZE || r >= SIZE ? -1 : r * SIZE + c;
  }

  return (
    <div
      ref={ref}
      role="grid"
      aria-label="Tablero"
      className="relative grid aspect-square w-[min(92vw,58dvh,30rem)] touch-none grid-cols-5 gap-[2.2%] rounded-[6%] bg-board p-[2.2%]"
      onPointerDown={(e) => {
        pressed.current = true;
        onTarget(cellAt(e));
      }}
      onPointerMove={(e) => {
        if (pressed.current || e.pointerType === "mouse") onTarget(cellAt(e));
      }}
      onPointerUp={(e) => {
        if (!pressed.current) return;
        pressed.current = false;
        onCommit(cellAt(e));
        if (e.pointerType !== "mouse") onTarget(-1);
      }}
      onPointerCancel={() => {
        pressed.current = false;
        onTarget(-1);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onTarget(-1);
      }}
    >
      {cells.map((i) => {
        const tile = state.board[i];
        const isTarget = i === target && !tile && !state.over;
        const merged = tile && last?.idx === i && last.steps.length > 0;
        return (
          <div
            key={i}
            role="gridcell"
            aria-label={tile ? String(tile.value) : "vacía"}
            className={`relative rounded-[22%] bg-slot ${
              showCursor && i === target ? "outline-[0.2rem] outline-offset-2 outline-accent outline-solid" : ""
            }`}
          >
            <AnimatePresence custom={exits.get(i)}>
              {tile && (
                <Tile
                  key={tile.id}
                  value={tile.value}
                  popKey={merged ? `${last.at}-${tile.value}` : undefined}
                  className={willMerge.has(i) ? "will-merge" : ""}
                />
              )}
              {isTarget && <Tile key="ghost" value={state.current} ghost />}
            </AnimatePresence>
            {isTarget && hint && hint.chain > 0 && (
              <span className="pointer-events-none absolute -top-2 -right-2 z-10 rounded-full bg-ink px-1.5 py-0.5 text-xs font-semibold text-cream">
                {hint.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
