"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "./storage";

const MUTE_KEY = "triplo:muted";
const PENTATONIC = [0, 2, 4, 7, 9];
const BASE_HZ = 330;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Pitch rises along a pentatonic scale as the value grows: always sounds pleasant. */
function noteFor(value: number): number {
  const n = Math.max(0, Math.log2(value) - 1);
  const semis = 12 * Math.floor(n / 5) + PENTATONIC[n % 5];
  return BASE_HZ * 2 ** (semis / 12);
}

type ToneOpts = { freq: number; at?: number; dur?: number; gain?: number; type?: OscillatorType; glideFrom?: number };

function tone(ac: AudioContext, { freq, at = 0, dur = 0.25, gain = 0.2, type = "sine", glideFrom = 0.85 }: ToneOpts) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * glideFrom, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.035);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function useSound() {
  const [muted, setMuted] = useState(() => storage.get(MUTE_KEY) === "1");
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
    storage.set(MUTE_KEY, muted ? "1" : "0");
  }, [muted]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const play = useCallback((fn: (ac: AudioContext) => void) => {
    if (mutedRef.current) return;
    const ac = audio();
    if (ac) fn(ac);
  }, []);

  /** Soft "tock" for placing without merging. */
  const placeSound = useCallback(
    () => play((ac) => tone(ac, { freq: 180, dur: 0.09, gain: 0.12, glideFrom: 1.4 })),
    [play],
  );

  /** Bubbly pop per merge; each chain link plays a step later and higher. */
  const mergeSound = useCallback(
    (values: number[]) =>
      play((ac) =>
        values.forEach((v, i) => {
          const f = noteFor(v);
          const at = i * 0.11;
          tone(ac, { freq: f, at, dur: 0.28, gain: 0.22 });
          tone(ac, { freq: f * 2, at: at + 0.01, dur: 0.16, gain: 0.06, type: "triangle" });
        }),
      ),
    [play],
  );

  const overSound = useCallback(
    () =>
      play((ac) =>
        [523, 440, 349, 262].forEach((f, i) =>
          tone(ac, { freq: f, at: i * 0.13, dur: 0.35, gain: 0.14, type: "triangle", glideFrom: 1 }),
        ),
      ),
    [play],
  );

  /** Call from a user gesture so iOS lets audio start. */
  const unlock = useCallback(() => {
    audio();
  }, []);

  return { muted, toggleMute, placeSound, mergeSound, overSound, unlock };
}
