# Memory Capture AI

A gentle, living memory journal. A warm AI "companion" interviews a storyteller about their life; their
answers are transcribed, kept **exactly as said**, and turned into soft watercolor **memory cards** with the
people, places, and dates they mention extracted automatically.

## Tech stack

- **Front end:** Vite + React 18 + TypeScript (SPA).
- **Routing:** `react-router-dom`.
- **API:** Azure Functions (TypeScript, v4 programming model), managed by Azure Static Web Apps.
- **AI (text):** Azure AI Foundry (`gpt-4o-mini`) — next-question, follow-up suggestions, structured extraction, summary.
- **AI (image):** Azure OpenAI `gpt-image-1` — a square watercolor illustration generated per captured memory,
  stored in Blob; degrades silently to a procedural SVG watercolor when not configured.
- **Voice:** Azure AI Speech (STT + optional TTS) via short-lived server-minted tokens.
- **Data:** localStorage repository in guest/demo mode; Azure Cosmos DB (free tier, `accountId`-partitioned) +
  Blob Storage in production, behind a swappable repository interface.
- **Auth:** Azure Static Web Apps built-in auth, **Google** provider only, gated by an admin approval workflow —
  see [Authentication](#authentication-google-sign-in--admin-approval) below. Guest/demo mode needs no auth and
  preserves the fully offline experience.
- **Email:** Azure Communication Services — transactional email for the sign-up approval flow.
- **Hosting / CI:** Azure Static Web Apps (free tier) via GitHub Actions.

Everything targets free / near-free tiers (expected demo cost ≈ $0–2/month).

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run lint       # eslint (incl. jsx-a11y)
npm run typecheck  # tsc --noEmit
npm test           # vitest (unit + axe a11y)
npm run build      # production build to dist/
```

## Configuration

Copy `.env.example` to `.env`. Front-end vars are prefixed `VITE_`; all Azure keys are **server-only** and never
reach the browser bundle. The app runs fully offline in guest mode (`VITE_AUTH_PROVIDER=guest`, `VITE_AI_MODE` unset)
with no cloud dependencies.

## Enabling the AI interview (Azure AI Foundry)

The interview screen calls a swappable engine (`src/lib/ai`). With `VITE_AI_MODE=azure` it uses the Azure-backed
`HttpInterviewEngine`, which calls the Functions API in [`api/`](api/) (`/api/interview/*`) — next-question
(streaming), suggest-questions, extract (structured + verbatim-validated), and the optional session summary. Every
call **falls back to the offline engine** on error/timeout/over-budget, so the interview never hard-stops, and the
Azure key stays server-side.

### 1. Provision Azure (one-time, free/near-free)

```bash
# Sign in and pick a subscription
az login

# Create a resource group + Azure OpenAI (AI Foundry) resource
az group create -n memory-capture-rg -l eastus
az cognitiveservices account create \
  -n memory-capture-aoai -g memory-capture-rg \
  --kind OpenAI --sku S0 -l eastus --custom-domain memory-capture-aoai

# Deploy the cheapest capable chat model
az cognitiveservices account deployment create \
  -n memory-capture-aoai -g memory-capture-rg \
  --deployment-name gpt-4o-mini \
  --model-name gpt-4o-mini --model-version "2024-07-18" --model-format OpenAI \
  --sku-capacity 10 --sku-name Standard

# Read the values you need
az cognitiveservices account show -n memory-capture-aoai -g memory-capture-rg --query properties.endpoint -o tsv
az cognitiveservices account keys list -n memory-capture-aoai -g memory-capture-rg --query key1 -o tsv
```

(Or do the same in the Azure AI Foundry portal: create a project → deploy `gpt-4o-mini` → copy the endpoint + key.)

### 2. Run locally with AI

Local dev mirrors production via the **Static Web Apps CLI**, which serves the SPA and the Functions API together
under one origin (so `/api/*` resolves exactly as it will on Azure).

```bash
# one-time: Azure Functions Core Tools v4
npm i -g azure-functions-core-tools@4 --unsafe-perm true   # or: brew install azure-functions-core-tools@4

# api/local.settings.json already exists (Node runtime, empty keys). Add your values:
#   AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_VERSION
echo "VITE_AI_MODE=azure" >> .env

npm start            # http://localhost:4281
```

`npm start` runs two processes via `concurrently`:
- `start:api` — builds `api/` and runs the Functions host on **:7072** with your global `func`.
- `start:web` — `swa start` serves the SPA and **proxies `/api/*` to :7072** (`apiDevserverUrl` in
  `swa-cli.config.json`).

> Why not let the SWA CLI manage the Functions host itself? Its bundled auto-download of Core Tools is
> currently broken on macOS (fails to write/chmod its `gozip` binary), so we run the globally-installed
> `func` directly and point the emulator at it. The Functions host needs ~25–30s to index on first boot.

With empty `AZURE_OPENAI_*` (or `VITE_AI_MODE` unset) the app runs on the offline engine — the API
returns `502` and the client falls back, so the interview always works.

### 3. Deploy

`git push` to `main` runs the GitHub Action, which builds the SPA + `api/` and deploys to Azure Static Web Apps.
Then set the four `AZURE_OPENAI_*` values as **SWA application settings** (Azure portal → your SWA → Configuration,
or `az staticwebapp appsettings set`), and add `VITE_AI_MODE=azure` to the build environment.

## Enabling voice (Azure AI Speech) — optional

Voice is a progressive enhancement: the mic transcribes spoken answers (STT) and the companion can read its
questions aloud (TTS, off by default). Typing always works, and the heavy Speech SDK is lazy-loaded only when voice
is used. With no Speech key, `/api/speech/token` returns `503` and the UI simply hides the voice controls.

```bash
# Create a Speech resource (free F0 tier) and read its key + region
az cognitiveservices account create \
  -n memory-capture-speech -g memory-capture-rg \
  --kind SpeechServices --sku F0 -l eastus
az cognitiveservices account keys list -n memory-capture-speech -g memory-capture-rg --query key1 -o tsv
# region is the location you created it in, e.g. "eastus"
```

Add to `api/local.settings.json` (local) and to SWA application settings (deployed):
`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`. The Speech key never reaches the browser — the client uses a short-lived
token minted by `/api/speech/token`.

## Enabling cloud persistence (Cosmos DB + Blob) — optional

By default profiles live in the browser (`localStorage`, guest/demo mode). Production mode persists them in
**Azure Cosmos DB** via the `/api/profiles` Functions, with storyteller photos in **Blob Storage** (kept out of
Cosmos's 2 MB doc limit). Profiles are partitioned by `accountId`, which is the signed-in Google user's SWA
principal ID (see [Authentication](#authentication-google-sign-in--admin-approval)). The repository interface
is unchanged, so screens don't care which backing is active.

```bash
# Cosmos DB free tier (1000 RU/s + 25 GB, $0) — NoSQL (Core) API
az cosmosdb create -n memory-capture-cosmos -g memory-capture-rg --enable-free-tier true
az cosmosdb keys list -n memory-capture-cosmos -g memory-capture-rg --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv

# A storage account for photos (also reused for Functions storage)
az storage account create -n memorycapturestore -g memory-capture-rg -l eastus --sku Standard_LRS
az storage account show-connection-string -n memorycapturestore -g memory-capture-rg -o tsv
```

Add `COSMOS_CONNECTION_STRING` and `BLOB_CONNECTION_STRING` to `api/local.settings.json` (local) and
SWA application settings (deployed). The app creates the database, container, and photo container
automatically on first use. Switching a running app between demo (localStorage) and production
(Cosmos/Google) mode is done at runtime from the onboarding screen — see below — not via a rebuild.

## Enabling AI image generation (`gpt-image-1`) — optional

After a memory is captured, `POST /api/memories/illustrate` (`api/src/functions/illustrate.ts`) asks
Azure OpenAI's `gpt-image-1` for a square watercolor illustration (prompt built from the memory's title,
summary, theme, and era) and uploads it to Blob, returning a permanent URL + a 400px thumbnail. With no
image deployment configured it returns `503` and the card keeps its procedurally-generated SVG watercolor
— illustration is a progressive enhancement, never a blocker.

`gpt-image-1` isn't available in every region. If it isn't available alongside your chat deployment, create
a second Azure OpenAI resource in a supported region (e.g. `eastus`) and set `AZURE_OPENAI_IMAGE_ENDPOINT` /
`AZURE_OPENAI_IMAGE_API_KEY` / `AZURE_OPENAI_IMAGE_DEPLOYMENT`; otherwise leave them empty to reuse the main
`AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY`. Requires Blob Storage to also be configured.

## Authentication (Google sign-in + admin approval)

In production mode the app uses **Azure Static Web Apps built-in auth** with the **Google** provider
(GitHub/AAD/Twitter are explicitly disabled in `staticwebapp.config.json`). Unauthenticated visitors see a
sign-in screen; once signed in, profiles are scoped to their account (`/api/profiles*` and `/api/uploads/*`
return `401` without a valid principal). Guest/demo mode has no auth and runs fully offline.

Sign-in is gated by an **admin approval workflow** (`api/src/lib/users.ts`) — this is a private, invite-only
deployment, not open sign-up:

1. A new Google sign-in creates a `pending` user record in Cosmos (the `NOTIFY_EMAIL` address is
   auto-approved as the app owner). Two emails go out via Azure Communication Services: an **admin
   notification** with single-use Approve/Reject links (HMAC-signed with `ADMIN_APPROVE_SECRET`), and a
   **"request received"** confirmation to the user.
2. The admin clicks a link → `GET /api/users/review` (`admin-approve.ts`) verifies the token, updates the
   user's status in Cosmos, and sends the matching outcome email (**approved** with a sign-in link, or
   **rejected**).
3. A denied user can re-apply (`POST /api/users/reapply`), which resets them to `pending` and re-fires the
   notification pair. A pending user can also cancel their own request (`POST /api/users/cancel`), which
   deletes the record and notifies both sides.
4. All email sends are soft-fail — logged and skipped, never a thrown error — including an honest warning
   when the Azure Communication Services Managed Domain's 10-sends/hour quota is hit.

- Sign in / out: `/.auth/login/google` and `/.auth/logout` (also `/login` and `/logout` shortcuts).
- Requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` as **SWA application settings** (Azure portal → your
  SWA → Configuration), registered per `staticwebapp.config.json`'s `identityProviders.google` block.
- The public AI + speech endpoints stay anonymous but are **rate-limited per IP** (`api/src/lib/rateLimit.ts`)
  to cap abuse/spend; the client also enforces a per-session budget.

Locally, the SWA CLI emulates auth: visit `http://localhost:4281/.auth/login/google` to mock a login.

## Switching a live deployment between demo and production mode

The choice between **Demo mode** (data stored on the visiting device only, safe for public visitors) and
**Production mode** (data in Azure Cosmos DB, gated by Google sign-in + approval) is made from the onboarding
screen (`src/screens/OnboardingScreen.tsx`, reached at `/onboarding?access=1`), not via an env var rebuild —
choosing "Sign in with Google" there kicks off `/.auth/login/google?...&post_login_redirect_uri=/home?mcap_setup=1`,
and `App.tsx` flips `mcap_mode` to `production` in `localStorage` once that redirect confirms a session. A
sign-out control in the Sidebar/TopBar reverses this (`setRuntimeMode('demo')` + `/.auth/logout`).

## Project status

Phase 1 MVP, built milestone by milestone:

- [x] **M1** — Scaffold, tooling, CI, SWA config.
- [x] **M2** — Design-system port (tokens, watercolor, icons).
- [x] **M3** — Domain types + personas + localStorage repository (Zod-validated).
- [x] **M4** — Screens at prototype parity + routing.
- [x] **M5** — Interview UI (2 modes) behind a swappable engine + verbatim-excerpt guard.
- [x] **M6** — Azure AI Foundry wired in: `api/` Functions (next-question streaming, suggest-questions,
      extract, summary) + `HttpInterviewEngine` with graceful offline fallback. Verified live end-to-end.
- [x] **M7** — Voice (Azure AI Speech): `/api/speech/token` + lazy-loaded browser SDK for mic STT and optional
      read-aloud TTS, with token minted server-side. _Add a Speech key to enable; typing always works._
- [x] **M8** — Cloud persistence: `/api/profiles` CRUD (Cosmos DB, `accountId`-partitioned) + `/api/uploads/photo`
      (Blob) behind the repository interface; `ApiProfileRepository` activates with `VITE_AUTH_PROVIDER=swa`.
      _Provision Cosmos + Blob to enable; localStorage remains the default._
- [x] **M10** — Accessibility (WCAG 2.1 AA): high-contrast + larger-text modes, ≥44px hit targets, skip link,
      `<main>` landmark, focus rings, reduced-motion; automated `axe-core` tests on key screens.
- [x] **M11** — Hardening: JSON memory export, consent notice at profile creation, loading + error/retry states.
- [x] **M9** — Auth: SWA built-in GitHub sign-in, account-scoped data (`401` when anonymous), sign-in gate +
      sign-out, and per-IP rate limiting on the public AI/speech endpoints. **All 11 milestones complete.**

The app is fully usable offline today: create/edit/switch/delete storytellers, run interviews in
both modes, capture verbatim memory cards, and review session summaries — all persisted to
`localStorage`. The repository (`src/lib/db`) and interview engine (`src/lib/ai`) sit behind
interfaces so the Azure implementations drop in without touching screen code.

**Post-launch additions (beyond the original 11 milestones):**
- AI-generated watercolor illustrations per memory (`gpt-image-1` → Blob), with SVG fallback.
- Auth provider switched from GitHub to **Google**, plus an admin **approval workflow** gating
  production sign-in (pending/approved/denied, Azure Communication Services email, one-click
  admin approve/reject, user reapply/cancel) — see [Authentication](#authentication-google-sign-in--admin-approval).
- Runtime demo/production mode switching from the onboarding screen (`?access=1`), independent of rebuilds.
