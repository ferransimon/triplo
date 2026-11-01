/** Pastel colour per power of two (index = log2(value) - 1); cycles after the last one. */
const PASTELS = [
  "#CDEFE0", // 2 mint
  "#FFD9C2", // 4 peach
  "#DCD3FF", // 8 lavender
  "#C9E6FF", // 16 sky
  "#FFCFE1", // 32 pink
  "#FFF1B8", // 64 lemon
  "#BFF0EE", // 128 aqua
  "#FFC2C2", // 256 coral
  "#EBCBFF", // 512 lilac
  "#D5EBC4", // 1024 sage
  "#FFE0A8", // 2048 apricot
  "#C7CEFF", // 4096 periwinkle
];

export function tileColor(value: number): string {
  const i = Math.max(0, Math.log2(value) - 1);
  return PASTELS[i % PASTELS.length];
}

/** Font size relative to the tile width (container query units). */
export function tileFontSize(value: number): string {
  const digits = String(value).length;
  return ["46cqi", "46cqi", "40cqi", "32cqi", "26cqi"][Math.min(digits, 5) - 1] ?? "22cqi";
}
