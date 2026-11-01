# triplo

Juego de números para móvil (PWA). Colocas la ficha que te sale en una plancha 5×5; si se juntan **3 o más iguales** conectadas, se fusionan en la siguiente potencia de 2 (con 5 o más, salta dos potencias) y pueden encadenar combos. Pierdes cuando la plancha se llena.

- **Táctil**: mantén el dedo para previsualizar la fusión y suelta para colocar.
- **Teclado**: flechas/WASD mueven el cursor, Espacio/Enter colocan, R reinicia (dos veces a mitad de partida), M silencia.

## Desarrollo

```bash
pnpm dev        # http://localhost:3000 (el service worker solo se registra en producción)
pnpm test       # tests del motor (Vitest)
pnpm build && pnpm start
```

## Estructura

- `src/game/`: motor puro en TS (sin React ni DOM), pensado para reutilizarse en React Native/Expo.
- `src/hooks/`: estado y persistencia (`useGame`) y sonido sintetizado con Web Audio (`useSound`).
- `src/components/`: UI (Tailwind v4 + motion).
- `src/app/manifest.ts`, `public/sw.js`: PWA (instalable y funciona offline).
- `scripts/icon.svg`: fuente de los iconos (`rsvg-convert -w 512 -h 512 scripts/icon.svg -o public/icons/icon-512.png`).

## Deploy

Importa el repo en Vercel; no necesita configuración extra.
