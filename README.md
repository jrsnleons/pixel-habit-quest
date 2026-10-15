# Pixel Habit Quest

A cozy habit tracker where a pixel pet thrives when you keep your habits. Do habits and avoid habits with weekday schedules, Monday recovery, sleep logging, HP/XP/levels/streaks, a bedroom that brightens or rains with your mood, and a build-your-own pixel companion.

## Stack

- Vite + React + TypeScript, installable as a PWA
- Supabase Auth (email + password or magic link) and Postgres with row level security
- Guest mode stores progress in the browser and moves it into an account on sign-up
- Hosted on GitHub Pages via `.github/workflows/deploy.yml`

## Develop

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # quest rules (Vitest)
npm run test:e2e     # browser flows (Playwright, desktop + mobile)
```

Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key. Deploys read the same two values from the repository's Actions secrets. The publishable key ends up in the browser bundle by design; data is protected by the row level security policies in `supabase/migrations`.

## How progress works

The whole quest is one JSON document per player (`quests.state`). HP, XP, level, mood and streaks are recomputed from the full history every time (`src/lib/quest.ts`), so undoing or editing a check-in never double-counts. Saves are revision-checked to stop two devices silently overwriting each other.

| Event | HP | XP |
| --- | --- | --- |
| Complete a do habit / keep an avoid habit | +5 | +15 |
| Miss a do habit / break an avoid habit | −8 | 0 |
| Meet the sleep goal | +8 | +20 |
| Log sleep under the goal | −3 | 0 |

HP stays between 10 and 100, so the pet never dies. A level is 100 XP. Unlogged do habits count as missed and unbroken avoid habits as kept once the day ends. With Monday recovery on, missed do habits on Mondays cost nothing.

## Pet art

Sprites are hand-authored 16×16 pixel grids in `src/pet/sprites.ts` (cat, bunny, bear, slime × 8 colours × 5 accessories × 6 expressions), drawn as SVG so they stay crisp. `npm run icons` regenerates the app icons from them.
