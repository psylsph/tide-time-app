# UK Tide Times

A cross-platform mobile and web app for browsing tide times across UK
locations, aimed at people heading to the beach. Built with React Native, Expo
and TypeScript.

Tide data comes from the live **Stormglass** tide API via a caching serverless
proxy. If the proxy is unreachable or the daily request budget is exhausted,
the app automatically falls back to deterministic demo data and shows a clear
"Demo data" badge.

## Features

- Live high/low tide predictions for 60+ UK locations (Stormglass)
- Automatic, clearly-labelled demo-data fallback when live data is unavailable
- Tide graph with high/low water markers
- Smart location search with autocomplete
- "Use my location" button — finds your nearest beach on demand (opt-in;
  no permission is requested until you tap it). Works on iOS, Android and web.
- Cross-platform support (iOS, Android, Web)
- Modern, iOS-inspired Material design

## Tech stack

- React Native + Expo (TypeScript, strict)
- React Native Paper (Material Design)
- D3 + `react-native-svg` (graph rendering)
- Netlify Functions (live-data proxy)
- date-fns, Jest + jest-expo + Testing Library (tests)

## Architecture

```text
App ── getTideData(stationId, date) ──▶ /.netlify/functions/tides
                                            │  (holds STORMGLASS_API_KEY)
                                            ▼
                                   Stormglass tide/extremes
                                            │
                                            ▼
                          normalized TideEvent[]  ──▶  (CDN-cached 1 week)
```

- `netlify/functions/tides.ts` — serverless proxy. Holds the API key, looks up
  the station's coordinates, calls Stormglass, and returns normalized events.
  Successful responses are cached at the CDN for a week per `(station, date)`.
- `src/services/tideService.ts` — async `getTideData`. Calls the function, with
  a per-session client cache and deterministic demo-data fallback on any error.

### Why the proxy?

The app ships as a static bundle, so a secret API key cannot live in the
frontend. The Netlify Function holds the key in an environment variable and is
the only thing that talks to Stormglass.

### Why so much caching?

The Stormglass plan in use allows roughly **10 requests per day**. Tide
predictions are stable, so the proxy caches each `(station, date)` result for a
week at the CDN (`s-maxage=604800`). After the first lookup, repeated requests
for the same station and day never reach Stormglass — so the budget goes a long
way. The client also caches successful live results for the session.

## Getting started

### Prerequisites

- Node.js 18 or later
- npm
- A Stormglass API key (set as an environment variable — see below)

### Installation

```bash
git clone <your-repo-url>
cd tide-time-app
npm install
```

### Stormglass API key

Set `STORMGLASS_API_KEY` in the Netlify dashboard (Site settings → Environment
variables). **Never commit the key.** For local development of the function,
put it in a gitignored `.env` file and run via `netlify dev`:

```sh
echo "STORMGLASS_API_KEY=your-key-here" > .env   # .env is gitignored
```

### Run the development server

```bash
npm start
```

To exercise the live proxy locally, run the frontend through Netlify Dev so the
function is served too:

```bash
netlify dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the Expo dev server. |
| `npm run android` / `ios` / `web` | Run on a device, simulator, or browser. |
| `npm test` | Run the Jest test suite. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm run markdownlint` | Lint Markdown files. |
| `npm run build` | Export the production web bundle (`expo export`). |
| `npm run deploy` | Deploy the build to Netlify. |

## Testing

The project has unit and component tests covering the live-data normalization
and proxy, the demo fallback model, the curve math, nearest-station lookup,
date navigation, search, the graph, and the station dataset:

```bash
npm test
```

## Project structure

- `App.tsx` — top-level app, theme, date navigation, async data wiring.
- `index.ts` — Expo entry point.
- `netlify/functions/tides.ts` — live Stormglass proxy (serverless).
- `src/components/` — React components (`LocationSearch`, `TideGraph`).
- `src/services/` — domain logic (`tideService`: live fetch + demo fallback;
  `locationService`: opt-in nearest-beach detection).
- `src/utils/` — pure helpers (`locationUtils`, `tideCurve`, `dateUtils`).
- `src/data/` — the UK tide station dataset.
- `src/types/` — shared TypeScript types.
- `src/config/` — layout/model constants + API endpoint.
- `src/styles/` — shared style helpers (elevation).

## Deployment to Netlify

`netlify.toml` configures the build:

- Build command: `expo export`
- Publish directory: `dist/web`
- Functions directory: `netlify/functions` (bundled with esbuild)

Set `STORMGLASS_API_KEY` in the Netlify environment, then:

```bash
npm run build
netlify deploy --prod --dir dist/web
```

## Contributing

Contributions are welcome. Please open an issue first to discuss changes, and
ensure typechecks and tests pass before submitting a pull request:

```bash
npm run typecheck && npm test
```

## License

This project is licensed under the MIT License.

## Acknowledgments

- Live tide data: [Stormglass](https://stormglass.io).
- Tide station catalogue inspired by UK Admiralty EasyTide.
- Built with Expo and React Native Paper.
