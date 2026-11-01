"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SIZE } from "@/game/types";
import { useGame } from "@/hooks/useGame";
import { useSound } from "@/hooks/useSound";
import { Board } from "./Board";
import { GameOverSheet } from "./GameOverSheet";
import { tileColor, tileFontSize } from "./palette";

const CONFIRM_MS = 2500;

export default function Game() {
  const { state, best, last, play, restart } = useGame();
  const sound = useSound();
  const [target, setTarget] = useState(-1);
  const [keyboard, setKeyboard] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const commit = useCallback(
    (idx: number) => {
      sound.unlock();
      const result = play(idx);
      if (!result) return;
      if (result.steps.length) {
        sound.mergeSound(result.steps.map((s) => s.value));
        navigator.vibrate?.(result.steps.length > 1 ? [12, 40, 18] : 12);
      } else {
        sound.placeSound();
      }
      if (result.state.over) setTimeout(sound.overSound, 250);
    },
    [play, sound],
  );

  const doRestart = useCallback(() => {
    clearTimeout(confirmTimer.current);
    setConfirming(false);
    restart();
  }, [restart]);

  /** Mid-game restart asks for a second tap so a stray touch never wipes a run. */
  const requestRestart = useCallback(() => {
    sound.unlock();
    if (state.over || state.moves === 0 || confirming) return doRestart();
    setConfirming(true);
    confirmTimer.current = setTimeout(() => setConfirming(false), CONFIRM_MS);
  }, [state.over, state.moves, confirming, doRestart, sound]);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  // Keyboard: arrows / WASD move the cursor, Space / Enter place, R restart, M mute.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const move: Record<string, [number, number]> = {
        arrowup: [-1, 0], w: [-1, 0],
        arrowdown: [1, 0], s: [1, 0],
        arrowleft: [0, -1], a: [0, -1],
        arrowright: [0, 1], d: [0, 1],
      };
      if (move[k] && !state.over) {
        e.preventDefault();
        setKeyboard(true);
        setTarget((t) => {
          const cur = t < 0 ? Math.floor((SIZE * SIZE) / 2) : t;
          const r = Math.min(SIZE - 1, Math.max(0, Math.floor(cur / SIZE) + move[k][0]));
          const c = Math.min(SIZE - 1, Math.max(0, (cur % SIZE) + move[k][1]));
          return r * SIZE + c;
        });
      } else if ((k === " " || k === "enter") && !state.over) {
        e.preventDefault();
        setKeyboard(true);
        if (target >= 0) commit(target);
        else setTarget(Math.floor((SIZE * SIZE) / 2));
      } else if (k === "r" && !e.repeat) {
        requestRestart();
      } else if (k === "m") {
        sound.toggleMute();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.over, target, commit, requestRestart, sound]);

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex w-[min(92vw,58dvh,30rem)] flex-1 flex-col justify-center gap-5">
        <header className="flex items-center gap-2">
          <h1 className="mr-auto text-3xl font-bold tracking-tight">
            triplo<span className="text-accent">.</span>
          </h1>
          <Stat label="puntos" value={state.score} />
          <Stat label="récord" value={best} />
        </header>

        <section className="flex items-center gap-4" aria-label="Fichas">
          <QueueTile value={state.current} size="big" label="ahora" />
          <QueueTile value={state.next} size="small" label="luego" />
          <p className="ml-auto max-w-[9rem] text-right text-sm leading-tight text-ink-soft">
            Junta <b className="text-ink">3 iguales</b> y suben de nivel
          </p>
        </section>

        <Board
          state={state}
          last={last}
          target={target}
          showCursor={keyboard}
          onTarget={(i) => {
            setKeyboard(false);
            setTarget(i);
          }}
          onCommit={commit}
        />

        <footer className="flex items-center justify-between gap-2">
          <IconButton onClick={sound.toggleMute} label={sound.muted ? "Activar sonido" : "Silenciar"}>
            {sound.muted ? <MutedIcon /> : <SoundIcon />}
          </IconButton>
          <span className="hidden text-xs text-ink-soft sm:block">
            Flechas/WASD · Espacio coloca · R reinicia
          </span>
          <button
            type="button"
            onClick={requestRestart}
            className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
              confirming ? "bg-ink text-cream" : "bg-board text-ink"
            }`}
          >
            <RestartIcon />
            {confirming ? "¿Seguro? Toca otra vez" : "Reiniciar"}
          </button>
        </footer>
      </div>

      <AnimatePresence>
        {state.over && (
          <GameOverSheet
            score={state.score}
            best={best}
            maxValue={state.maxValue}
            onRestart={doRestart}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[4.5rem] rounded-2xl bg-board px-3 py-1.5 text-center">
      <div className="text-[0.65rem] font-medium uppercase tracking-wider text-ink-soft">{label}</div>
      <motion.div
        key={value}
        initial={{ y: -4, opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-lg font-semibold leading-tight tabular-nums"
      >
        {value}
      </motion.div>
    </div>
  );
}

function QueueTile({ value, size, label }: { value: number; size: "big" | "small"; label: string }) {
  const px = size === "big" ? "w-16" : "w-11 opacity-70";
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        key={value + label}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
        className={`${px} flex aspect-square items-center justify-center rounded-[22%] font-semibold text-ink`}
        style={{ background: tileColor(value), containerType: "inline-size" }}
      >
        <span style={{ fontSize: tileFontSize(value) }}>{value}</span>
      </motion.div>
      <span className="text-[0.65rem] font-medium uppercase tracking-wider text-ink-soft">{label}</span>
    </div>
  );
}

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-11 items-center justify-center rounded-full bg-board text-ink"
    >
      {children}
    </button>
  );
}

const svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function SoundIcon() {
  return (
    <svg {...svg} aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg {...svg} aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="m16 9 6 6M22 9l-6 6" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg {...svg} width={18} height={18} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
