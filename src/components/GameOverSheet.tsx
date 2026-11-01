"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { tileColor } from "./palette";

type Props = { score: number; best: number; maxValue: number; onRestart: () => void };

/** Bottom sheet: one big button, focused, so Enter/Space/R/tap all restart instantly. */
export function GameOverSheet({ score, best, maxValue, onRestart }: Props) {
  const button = useRef<HTMLButtonElement>(null);
  // Ignore input for a beat so the tap/key that ended the game doesn't skip this screen.
  const [armed, setArmed] = useState(false);
  const isRecord = score > 0 && score >= best;

  useEffect(() => {
    const t = setTimeout(() => {
      setArmed(true);
      button.current?.focus();
    }, 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-end justify-center bg-ink/15 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="over-title"
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        exit={{ y: "110%" }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        className="w-full max-w-[30rem] rounded-[2rem] bg-cream p-6 shadow-[0_-8px_40px_rgb(61_58_75/0.15)]"
      >
        <h2 id="over-title" className="text-center text-2xl font-bold">
          {isRecord ? "¡Nuevo récord!" : "¡Tablero lleno!"}
        </h2>
        <div className="mt-4 flex justify-center gap-3">
          <Summary label="puntos" value={score} />
          <Summary label="récord" value={best} />
          <Summary label="mejor ficha" value={maxValue} color={tileColor(maxValue)} />
        </div>
        <button
          ref={button}
          type="button"
          disabled={!armed}
          onClick={onRestart}
          className="mt-6 h-16 w-full rounded-full bg-accent text-xl font-bold text-accent-ink shadow-[0_6px_0_rgb(61_58_75/0.15)] transition-transform outline-none focus-visible:ring-4 focus-visible:ring-ink/30 active:translate-y-1 active:shadow-none disabled:opacity-70"
        >
          Otra vez
        </button>
      </motion.div>
    </motion.div>
  );
}

function Summary({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="min-w-[5.5rem] rounded-2xl bg-board px-3 py-2 text-center" style={color ? { background: color } : undefined}>
      <div className="text-[0.65rem] font-medium uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
