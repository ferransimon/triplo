"use client";

import { motion, type Variants } from "motion/react";
import { tileColor, tileFontSize } from "./palette";

/** Where an absorbed tile flies to (in tile units) and when. */
export type ExitTarget = { dx: number; dy: number; delay: number };

const GAP_FACTOR = 1.1; // 1 tile + gap, in tile widths

const variants: Variants = {
  initial: { scale: 0.4, opacity: 0 },
  enter: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 700, damping: 30 } },
  exit: (t?: ExitTarget) =>
    t
      ? {
          x: `${t.dx * GAP_FACTOR * 100}%`,
          y: `${t.dy * GAP_FACTOR * 100}%`,
          scale: 0.6,
          opacity: 0,
          transition: { duration: 0.16, delay: t.delay, ease: "easeIn" },
        }
      : { scale: 0.4, opacity: 0, transition: { duration: 0.12 } },
};

type Props = {
  value: number;
  /** Bumps when a merge lands here, to replay the pop. */
  popKey?: string | number;
  ghost?: boolean;
  className?: string;
};

export function Tile({ value, popKey, ghost, className = "" }: Props) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={`absolute inset-0 rounded-[22%] ${ghost ? "opacity-45" : ""} ${className}`}
      style={{ background: tileColor(value), containerType: "inline-size", zIndex: ghost ? 0 : 1 }}
    >
      <motion.span
        key={popKey ?? value}
        initial={popKey ? { scale: 1.35 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
        className="flex h-full w-full items-center justify-center font-semibold leading-none tabular-nums text-ink"
        style={{ fontSize: tileFontSize(value) }}
      >
        {value}
      </motion.span>
    </motion.div>
  );
}
