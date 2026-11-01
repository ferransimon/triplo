"use client";

import dynamic from "next/dynamic";

/**
 * The game reads the saved run from localStorage on first render, so it's
 * client-only. The skeleton keeps the layout stable while JS boots.
 */
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="aspect-square w-[min(92vw,58dvh,30rem)] rounded-[6%] bg-board" />
    </main>
  ),
});

export function GameLoader() {
  return <Game />;
}
