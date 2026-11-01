/** mulberry32: tiny seeded PRNG. Returns [value in [0,1), nextSeed]. */
export function nextRandom(seed: number): [number, number] {
  const s = (seed + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, s];
}

export function randomSeed(): number {
  return (Math.random() * 2 ** 32) | 0;
}
