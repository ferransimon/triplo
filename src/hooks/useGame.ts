"use client";

import { useCallback, useEffect, useState } from "react";
import { newGame, place } from "@/game/engine";
import { randomSeed } from "@/game/rng";
import { CELLS, type GameState, type MergeStep } from "@/game/types";
import { storage } from "./storage";

const STATE_KEY = "triplo:state:v1";
const BEST_KEY = "triplo:best";

function loadState(): GameState {
  try {
    const raw = storage.get(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as GameState;
      if (Array.isArray(s.board) && s.board.length === CELLS && !s.over) return s;
    }
  } catch {
    /* corrupt save: start fresh */
  }
  return newGame(randomSeed());
}

export type LastMove = { idx: number; steps: MergeStep[]; at: number };

export function useGame() {
  const [state, setState] = useState<GameState>(loadState);
  const [best, setBest] = useState(() => Number(storage.get(BEST_KEY)) || 0);
  const [last, setLast] = useState<LastMove | null>(null);

  useEffect(() => {
    storage.set(STATE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    storage.set(BEST_KEY, String(best));
  }, [best]);

  const play = useCallback(
    (idx: number) => {
      const result = place(state, idx);
      if (!result) return null;
      setState(result.state);
      setLast({ idx, steps: result.steps, at: Date.now() });
      setBest((b) => Math.max(b, result.state.score));
      return result;
    },
    [state],
  );

  const restart = useCallback(() => {
    setState(newGame(randomSeed()));
    setLast(null);
  }, []);

  return { state, best, last, play, restart };
}
