# Deploying the web app

Two pieces, deployed separately:

| Piece | Where | What it is |
| --- | --- | --- |
| `api` + Postgres | Railway | Express API (`api/`), `packages/shared`, drizzle migrations |
| `client` | Vercel | Vite/React SPA (`client/`) |

The Tauri desktop apps (`apps/rust-*`) and `apps/whisper_local` are not part of
this path. Transcription is done by MeetingBaas (Gladia) on their side, so no
local speech-to-text is built or deployed here.

## Railway — API

Service settings (Railway no longer reads `railway.json`; set these on the
service, which is what the deployed service has):

| Setting | Value |
| --- | --- |
| Root directory | `/apps/react-app-with-ai-viewer-and-backend` |
| Builder | Dockerfile (`Dockerfile`) |
| Start command | `node api/dist/src/index.js` |
| Healthcheck path | `/api/health` |

`Dockerfile` builds `packages/shared` and the `api` workspace only; the client
is never built in the image. Migrations in `api/drizzle/migrations` are applied
on boot by `api/src/db/migrate.ts`. They can also be run on their own with
`npm run db:deploy --workspace api` against a built `api/dist`.

### Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | On Railway: `${{Postgres.DATABASE_URL}}` |
| `DATABASE_SSL` | no | `"true"` when connecting over a public TLS proxy |
| `PORT` / `HOST` | no | Default `3080` / `0.0.0.0` |
| `BASS_API_KEY` | for server-side bot invites | MeetingBaas API key |
| `OPENAI_API_KEY` | for summaries and `/api/chat` | Without it `/api/chat` answers 503 |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini` |
| `OPENAI_BASE_URL` | no | Defaults to `https://api.openai.com/v1` |
| `NOTION_API_KEY` | for the Notion sink | Webhook summaries are skipped without it |
| `DATABASE_ID` | for the Notion sink | Notion database id, not Postgres |

The server boots with all of the optional ones unset; it logs which are missing.

## Vercel — client

| Setting | Value |
| --- | --- |
| Root directory | `apps/react-app-with-ai-viewer-and-backend` |
| Build command | `npm run shared:build && npm run frontend:build` (from `vercel.json`) |
| Output directory | `client/dist` (from `vercel.json`) |

| Name | Notes |
| --- | --- |
| `VITE_API_BASE_URL` | Origin of the Railway API, no trailing slash. Leave empty to keep calls same-origin. |

`vercel.json` also proxies `/meetingbaas-api/*` and `/s3/*` the way the Vite dev
server does, so the browser-only (IndexedDB) mode works on Vercel without the
Express API.

## Modes

The client probes `GET /api/health`:

- reachable → **server mode**: bot invites, chat and the meeting list go
  through the Express API and Postgres.
- unreachable → **IndexedDB mode**: the browser talks to MeetingBaas directly
  with a key pasted into Settings, and stores meetings locally.

Either mode needs a MeetingBaas API key.
