# Memory Capture AI — Engineering Scope & Build Specification

> **Audience:** Claude Code (autonomous build agent) + reviewing engineer.
> **Purpose:** Turn the approved interactive prototype (`Memory Capture AI - MVP.html` and its companion files in this project) into a real, deployed, web‑accessible application.
> **Status:** Phase 1 (MVP). Phase 2 features are explicitly out of scope (listed at the end).
> **Cost posture:** This is a portfolio / skills showcase. **Every service must run on a free or near‑free tier.** Prefer free tiers, consumption/serverless pricing, and the cheapest viable model. No reserved capacity, no premium SKUs.

---

## 1. Product overview

**Memory Capture AI** is a *living memory journal*. An elderly (or any) storyteller sits down with a warm AI "companion" that interviews them about their life. As they speak, their answers are transcribed, turned into soft **memory cards**, and key people/places/dates are extracted automatically. Families can run the interview themselves and even take over the questioning.

The emotional design goal: **gentle, unhurried, dignified.** The visual language is a warm, paper‑and‑watercolor aesthetic (already designed — see §13).

### Core loop (the whole MVP)
1. **Create a profile** for a storyteller (name, year born, where they're from, short bio, photo, chosen interviewer persona).
2. **Interview** them in one of two modes (AI‑led or family‑led). Answers become memory cards in real time; names/places/years are extracted.
3. **Session summary** — what was captured this session.
4. **Profiles** — manage multiple storytellers; switch between them; edit; delete.

---

## 2. Target users & guiding principles

- **Primary user (storyteller):** often elderly. May have limited tech comfort, reduced vision/dexterity, and may prefer **voice over typing**.
- **Secondary user (family operator):** a grandchild/child who sets things up, may ask questions, and reviews captured memories.

**Principles (non‑negotiable):**
1. **Accessibility first** — WCAG 2.1 AA minimum (see §11). Large hit targets, high contrast, full keyboard + screen‑reader support, voice as a first‑class input.
2. **Calm, low‑cognitive‑load UI** — one primary action per screen; no clutter; generous spacing; plain, warm language.
3. **Their words, kept exactly** — never paraphrase the storyteller's answers when storing them. AI is used to *ask*, *suggest*, and *organize* — not to rewrite the person's memories.
4. **Privacy by default** — these are deeply personal life stories (see §12).

---

## 3. Scope — what to build (Phase 1)

Build feature‑parity with the approved prototype, upgraded from mocked logic to real services.

| Area | Prototype behavior (mock) | Phase 1 production behavior |
|---|---|---|
| **Create profile** | Single‑page form, saved to `localStorage` | Same form/UX, saved to the database against the signed‑in account; photo to blob storage |
| **Multiple profiles** | `profiles[]` + `activeId` in `localStorage`; switcher dropdown; Profiles list page | Persisted per account; switcher + Profiles list backed by the API |
| **Home** | Greeting + invitation + recent memories | Same, driven by real profile + recent captured memories |
| **Interview — AI asks** | Canned follow‑ups from a fixed pool | **Azure AI Foundry** generates the next question from persona + profile + transcript |
| **Interview — Manual** | Family types questions; AI follow‑up suggestions from a static pool; turn‑taking | Family asks (voice or text); **AI generates optional, context‑aware follow‑up suggestions**; turn‑taking unchanged |
| **Voice** | Mic button = visual only | **Azure AI Speech** STT for answers/questions; optional TTS so the companion can *speak* its questions |
| **Live extraction** | Regex for years + capitalized words → memory card | **Azure AI Foundry structured output** extracts title, era, people, places, themes, and a faithful excerpt |
| **Change interviewer** | Dropdown on the interviewer name; persists to profile | Same |
| **Summary** | Counts + cards captured this session | Same, plus AI‑written one‑paragraph session reflection (optional, clearly labeled) |
| **Edit / delete profile** | `localStorage` mutation + confirm | API‑backed; soft‑delete with confirm |
| **Tweaks panel** | mood / type / texture theme switches | Keep as a *dev/demo* theming toggle (not required in prod, but cheap to retain) |

**Interview modes (final, 2 modes):** `AI asks` (fully automated) and `Manual` (family asks; AI offers optional follow‑ups). In Manual mode the UI must keep reminding the operator to **record both the question and the answer**.

---

## 4. Recommended tech stack (and why)

### Language & framework — **TypeScript + Next.js (App Router) + React 18**
- The prototype is already React; porting is direct.
- **TypeScript** gives type safety for the data models and AI response schemas.
- Next.js gives us **one repo** for the UI *and* the backend (Route Handlers / server actions), server‑side secret handling (Azure keys never reach the browser), great accessibility tooling, and first‑class deploy to **Azure Static Web Apps**.
- SSR/streaming helps perceived performance for the interview.

> If the reviewing engineer prefers a non‑Next split: a **Vite + React** SPA front end plus **Azure Functions (TypeScript)** API is an equally valid, equally cheap alternative. Default to Next.js unless told otherwise.

### Hosting — **Azure Static Web Apps (Free tier)**
- Free tier: global CDN, free SSL, **built‑in authentication**, and a **managed Functions API** included.
- Deploys from GitHub via the auto‑generated GitHub Action (free).

### Backend/API — **Azure Functions (TypeScript, Consumption plan)** *(managed by SWA)*
- Consumption plan: **1M free executions/month** + generous free GB‑s. Far beyond demo needs.
- Hosts: AI orchestration endpoints, profile CRUD, session/memory persistence, Speech token minting.

### AI — **Azure AI Foundry** (required)
- Provision an **Azure AI Foundry** project and deploy a chat model. **Use `gpt-4o-mini`** (or the cheapest capable chat deployment available in the tenant) for: next‑question generation, follow‑up suggestions, extraction, and summaries.
- Use **structured outputs / JSON schema / function‑calling** for extraction so we get reliable typed data, not regex.
- All model calls happen **server‑side** (Functions), never from the browser.

### Voice — **Azure AI Speech (Free F0 tier)**
- **STT:** free tier ≈ **5 audio hours/month**; **TTS:** free tier ≈ **0.5M characters/month** — plenty for a demo.
- Use the **Speech SDK in the browser** with a **short‑lived token minted server‑side** (never ship the Speech key). Optional neural TTS lets the companion read questions aloud (great for low‑vision users).

### Database — **Azure Cosmos DB (Free tier, serverless)** *(primary recommendation)*
- Free tier: **1000 RU/s + 25 GB free** per account. Document model fits our nested profile/memory data perfectly.
- **Cheaper/simpler alternative:** **Azure Table Storage** (pennies/month) if Cosmos free tier is unavailable in the subscription. Pick whichever is free in the target tenant; abstract behind a repository interface so it can be swapped.

### Blob storage — **Azure Blob Storage**
- Stores storyteller **photos** and (optionally) raw **audio clips**. Pennies/month at demo scale; lives in the same storage account SWA/Functions already need.

### Auth — **Azure Static Web Apps built‑in auth (free)**
- Use SWA's built‑in providers (GitHub and/or Microsoft Entra). Zero‑cost, no custom auth code.
- For a pure offline demo, support a **"local/guest" mode** that falls back to the prototype's `localStorage` persistence behind the same repository interface.

### CI/CD — **GitHub + GitHub Actions (free)**
- The SWA deploy workflow is auto‑generated. Add lint/test/typecheck steps.

**Everything above sits on free/near‑free tiers.** The only metered spend is AI tokens + Speech minutes beyond the free allotment, both trivial at demo volume (budget guardrails in §16).

---

## 5. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (Next.js / React, TypeScript)                         │
│   • Screens (Onboarding, Home, Interview, Summary, Profiles)   │
│   • Azure Speech SDK (STT mic, optional TTS) using short token │
│   • Calls /api/* only — no Azure keys client-side              │
└───────────────▲───────────────────────────┬───────────────────┘
                │ HTTPS (same origin)         │
┌───────────────┴───────────────────────────▼───────────────────┐
│  Azure Functions API (TypeScript) — secrets live here          │
│   /api/profiles        CRUD storyteller profiles               │
│   /api/sessions        create/append/end interview sessions    │
│   /api/interview/next-question     → Azure AI Foundry          │
│   /api/interview/suggest-questions → Azure AI Foundry          │
│   /api/interview/extract           → Azure AI Foundry (JSON)   │
│   /api/interview/summary           → Azure AI Foundry          │
│   /api/speech/token    mint short-lived Azure Speech token     │
│   /api/uploads/photo   SAS URL for Blob upload                 │
└───────┬───────────────────┬───────────────────┬───────────────┘
        │                   │                   │
   Azure AI Foundry    Azure AI Speech     Cosmos DB (free) +
   (gpt-4o-mini)       (F0 free tier)      Blob Storage
```

---

## 6. Data model

Use these TypeScript types as the source of truth. Persist as JSON documents (Cosmos) or serialized rows (Table Storage).

```ts
type PersonaId = 'historian' | 'journalist' | 'grandchild' | 'researcher';

interface Account {            // from SWA auth
  id: string;                  // provider subject id
  displayName?: string;
}

interface StorytellerProfile {
  id: string;
  accountId: string;           // owner
  name: string;
  yearBorn?: string;           // free text, validated 1900–current
  birthplace?: string;
  bio?: string;
  photoUrl?: string;           // Blob URL (or null)
  personaId: PersonaId;        // chosen interviewer
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;   // soft delete
  // denormalized counters for fast lists
  sessionCount: number;
  memoryCount: number;
}

interface Memory {             // a captured story = a "memory card"
  id: string;
  profileId: string;
  sessionId: string;
  title: string;               // AI-derived, short
  excerpt: string;             // the storyteller's words, verbatim (trimmed)
  era?: string;                // year/period or "Undated"
  theme?: string;
  palette: string[];           // 2–3 hex/token colors for the watercolor art
  createdAt: number;
}

interface ExtractedEntity {
  id: string;
  profileId: string;
  sessionId: string;
  kind: 'person' | 'place' | 'year';
  text: string;
  relation?: string;           // e.g. "Father", optional
}

interface TranscriptTurn {
  who: 'ai' | 'storyteller' | 'asker';
  text: string;
  askerLabel?: string;         // e.g. "Family"
  ts: number;
}

interface Session {
  id: string;
  profileId: string;
  mode: 'ai' | 'manual';
  personaId: PersonaId;
  startedAt: number;
  endedAt?: number;
  transcript: TranscriptTurn[];
  memoryIds: string[];
  entityIds: string[];
}

interface Persona {            // static config, not stored per user
  id: PersonaId;
  name: string;                // "Curious Historian"
  glyph: string;               // emoji used in prototype avatars
  accent: string;              // hex
  blurb: string;
  sample: string;              // example opening question
  // a system-prompt fragment describing this interviewer's voice/style
  promptStyle: string;
}
```

> **Persona definitions** already exist in `data.js` (`window.DATA.personas`). Lift them into a typed `personas.ts` and add a `promptStyle` field per persona to steer the model.

---

## 7. Azure AI Foundry integration

All AI lives behind server endpoints. Use the Azure OpenAI / Foundry **chat completions** API with the deployed `gpt-4o-mini`. Keep prompts short; keep temperature modest (0.5–0.8 for questions, 0 for extraction).

### 7.1 Next question (AI‑asks mode) — `POST /api/interview/next-question`
**Input:** `{ profile, persona, transcript }`
**Returns:** `{ question: string }`

System prompt (template):
```
You are {persona.name}, a warm, unhurried interviewer helping {profile.name}
record their life story. Voice/style: {persona.promptStyle}.
Ask ONE short, gentle question at a time. Build on what they just said.
Never rush, never stack multiple questions, never give advice.
Context about the storyteller: born {yearBorn} in {birthplace}. {bio}
Return only the question text.
```
Pass the last ~8 transcript turns as the conversation.

### 7.2 Follow‑up suggestions (Manual mode) — `POST /api/interview/suggest-questions`
**Input:** `{ profile, persona, transcript, count: 3 }`
**Returns:** `{ suggestions: string[] }`
Prompt: produce `count` warm, *family‑style* questions the operator could ask next, **grounded in the storyteller's most recent answer** (reference people/places they mentioned). Short sentences. Return a JSON array of strings (use JSON mode).

### 7.3 Extraction (live, after each storyteller answer) — `POST /api/interview/extract`
**Input:** `{ answerText, priorEntities }`
**Returns (strict JSON schema / structured output):**
```json
{
  "title": "string (≤ 6 words, evocative, no year)",
  "era": "string (a 4-digit year or short period, or 'Undated')",
  "theme": "string (1–2 words, e.g. 'Home', 'Family')",
  "excerpt": "string (the storyteller's words verbatim, trimmed to ≤ 160 chars)",
  "people": [{ "text": "string", "relation": "string|null" }],
  "places": ["string"],
  "years": ["string"]
}
```
- **Do not invent facts.** `excerpt` must be a substring (or light trim) of the input — preserve the person's wording. If the answer is too short to be a memory, return `title: null` and create no card.
- Replaces the prototype's regex in `mvp-interview.jsx` (`extractFrom`, `deriveTitle`).

### 7.4 Session summary — `POST /api/interview/summary`
**Input:** `{ profile, session }`
**Returns:** `{ paragraph: string, stats: {...} }`
One short, warm paragraph reflecting on what was shared today. Clearly UI‑labeled as AI‑generated. Stats are computed in code, not by the model.

**Implementation notes**
- Use the official `openai` SDK pointed at the Azure endpoint, or `@azure/openai`. Read `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` from env.
- Add a **timeout + graceful fallback**: if the model call fails, fall back to a small static question pool (port the prototype's `FOLLOWUPS` / `QUESTION_POOL`) so the interview never hard‑stops.
- Stream the next‑question response if convenient for snappy UX.

---

## 8. Voice (Azure AI Speech)

- **Token minting:** `GET /api/speech/token` returns `{ token, region }` (short‑lived). The browser uses the Speech SDK with this token. The Speech **key stays server‑side**.
- **STT:** continuous recognition while the mic is active; show interim results; commit final transcript into the answer (or question, in Manual mode) field. The storyteller can always edit/confirm before it's saved.
- **TTS (optional but recommended for low vision):** when enabled, the companion reads each AI question aloud using a warm neural voice. Provide a clear on/off toggle (default off; remember preference).
- Respect `prefers-reduced-motion` and provide captions/transcript at all times — **voice is an enhancement, never the only path.** Typing must always work.

---

## 9. API surface (summary)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/profiles` | list profiles for the signed‑in account |
| POST | `/api/profiles` | create profile |
| GET | `/api/profiles/:id` | get one |
| PATCH | `/api/profiles/:id` | edit (incl. change persona) |
| DELETE | `/api/profiles/:id` | soft delete |
| POST | `/api/sessions` | start a session |
| PATCH | `/api/sessions/:id` | append turn(s) / memories / end |
| POST | `/api/interview/next-question` | AI next question |
| POST | `/api/interview/suggest-questions` | AI follow‑up suggestions |
| POST | `/api/interview/extract` | structured memory extraction |
| POST | `/api/interview/summary` | session summary |
| GET | `/api/speech/token` | mint Speech token |
| POST | `/api/uploads/photo` | return SAS URL for photo upload |

All `/api/*` require an authenticated principal (SWA injects `x-ms-client-principal`); in guest/demo mode the client uses the local repository and skips the network.

---

## 10. Screens & flows (port from prototype)

The prototype is the **UX source of truth**. Recreate these screens 1:1, wired to the API:

1. **Onboarding / Create profile** (`OnboardingScreen`) — single page; fields per §6; also used in **edit** mode and **add‑another‑storyteller** mode. Includes **delete profile** (confirm) in edit mode.
2. **Home** (`HomeScreen`) — greeting, today's invitation (persona sample question), recently captured memories, primary CTA → interview.
3. **Interview** (`InterviewScreen`) — the centerpiece:
   - Orb + status + **interviewer name dropdown to change interviewer**.
   - **Mode switch:** `AI asks` / `Manual`.
   - Transcript with three speaker styles: `ai`, `storyteller`, `asker (Family)`.
   - **Manual mode:** turn indicator ("Family's turn to ask" / "{name} is answering"), optional AI follow‑up suggestions in the right rail, and persistent guidance to **record both questions and answers**.
   - Dock: mic (voice), text compose, send, End.
   - Right rail: live memory card + "noticed" people/places/years + "a chapter is forming".
4. **Summary** (`SummaryScreen`) — counts, cards captured this session, noticed entities, optional AI reflection, CTAs (keep going / home).
5. **Profiles** (`ProfilesScreen`) — grid of all storytellers (+ "Add a storyteller" card); open a card → that person's detail.
6. **Profile detail** (`ProfileScreen`) — hero, facts, interviewer, captured memories, edit/delete, "← All profiles".
7. **Top‑right profile switcher** — dropdown to switch storytellers or add a new one.

---

## 11. Accessibility (WCAG 2.1 AA — hard requirement)

- **Semantics:** real landmarks (`header/nav/main`), headings in order, `button` for actions, `label` for every input, `aria-live="polite"` on the transcript and the "noticed" rail so screen readers announce new content.
- **Keyboard:** every control reachable and operable; visible focus rings; logical tab order; Esc closes dropdowns/menus; Enter sends.
- **Targets & text:** ≥ **44×44px** hit targets; base body text ≥ 16px with a user **text‑size toggle** (the existing "type" tweak can power a larger‑text mode); never rely on color alone.
- **Contrast:** verify all text/!UI against AA (the warm palette is light — check the muted inks; bump where needed). Provide a **high‑contrast theme** option.
- **Voice & captions:** STT input as an alternative to typing; live transcript always visible; TTS optional with captions.
- **Motion:** honor `prefers-reduced-motion` (the prototype already gates animations); no essential info conveyed by motion.
- **Forms:** clear errors, programmatic association, no time limits on the interview.
- **Testing:** automated `axe-core` in CI + manual screen‑reader pass (NVDA/VoiceOver) on each screen. Document results.

---

## 12. Security & privacy

- **Sensitive data:** life stories + PII (names, places, photos of real people, possibly minors). Treat as confidential.
- **Secrets:** only in Functions app settings / Key Vault references. Never in client bundle or repo. `.env.example` documents required vars; real `.env` git‑ignored.
- **Transport & storage:** HTTPS only; encryption at rest is default on Azure storage/Cosmos.
- **AuthZ:** every profile/session/memory is scoped to `accountId`; reject cross‑account access server‑side.
- **Data control:** delete = hard‑remove documents + blobs after the soft‑delete grace window; provide an **export** of a storyteller's memories (JSON) as a basic data‑portability gesture.
- **AI data handling:** note in the README that prompts/answers are sent to Azure AI Foundry/Speech; do not log full transcripts in plaintext app logs; redact in telemetry.
- **Minor's content / consent:** add a short consent notice at profile creation ("you have permission to record this person's stories").

---

## 13. Design system & visual fidelity

Reuse the prototype's design language verbatim — it's approved.
- **Tokens & components:** port `app.css`, `screens.css`, `screens2.css`, `mvp.css` into the app's stylesheet/CSS‑modules. Keep the CSS custom properties (warm paper `--bg`, inks, accent moods terracotta/sage/lavender/honey, radii, shadows).
- **Type:** Newsreader (display, serif), Hanken Grotesk (body), Caveat (handwritten accents) via Google Fonts.
- **Watercolor system:** port `watercolor.jsx` (`WatercolorDefs`, `Bloom`, `WatercolorArt`, `VoiceOrb`, `Waveform`) — SVG `feTurbulence`/`feDisplacementMap` washes. These are decorative; mark `aria-hidden`.
- **Icons:** the stroke‑path `ICONS` set in `ui.jsx`.
- **Tweaks panel:** optional in prod; if kept, gate behind a dev flag or a settings affordance (it doubles as the text‑size / high‑contrast control for accessibility).

**Reference files in this project (study before building):**
`Memory Capture AI - MVP.html` (entry), `mvp-app.jsx` (shell, routing, multi‑profile store), `mvp-screens.jsx` (onboarding/home/profiles/profile/summary), `mvp-interview.jsx` (interview + 2 modes + extraction + interviewer picker), `ui.jsx` (icons/sidebar/topbar helpers), `watercolor.jsx`, `data.js` (personas + sample content), `tweaks-panel.jsx`.

---

## 14. Repository structure (Next.js variant)

```
/app
  /(marketing)            optional landing
  /onboarding             create / edit / add profile
  /home
  /interview
  /summary
  /profiles               list
  /profiles/[id]          detail
  /api/...                Route Handlers (or /functions for SWA managed API)
/components               ported screens + UI + watercolor
/lib
  /ai        foundry client + prompt builders + schemas
  /speech    token helper
  /db        repository interface + cosmos & table impls + local(localStorage) impl
  /domain    types from §6, persona config
/styles      ported CSS (design tokens)
/tests       unit + axe a11y
staticwebapp.config.json  routes, auth, fallback
.github/workflows/azure-static-web-apps.yml
.env.example
README.md
```

---

## 15. Configuration / environment variables

```
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
COSMOS_CONNECTION_STRING=        # or TABLE_STORAGE_CONNECTION_STRING
BLOB_CONNECTION_STRING=
AUTH_PROVIDER=swa                # swa | guest
```

---

## 16. Cost guardrails

- Model: **gpt‑4o‑mini**; cap output tokens (questions ≤ 60 tokens, suggestions ≤ 150, extraction ≤ 200). Cache nothing sensitive.
- Speech: free F0 tier; **disable TTS by default**; show remaining‑minutes awareness only if needed.
- DB/storage/host/CI: all on free tiers as listed.
- Add a simple **per‑session call budget** (e.g., refuse > N AI calls/minute) to prevent runaway spend in a public demo.
- Document expected demo cost in the README (target: **≈ $0–2/month**).

---

## 17. Build plan / milestones (suggested order for Claude Code)

1. **Scaffold** Next.js + TS + ESLint/Prettier + `axe` test setup; deploy an empty SWA via GitHub Actions (prove the free pipeline works).
2. **Design system port** — fonts, CSS tokens, watercolor components, icons. Static Home renders on brand.
3. **Domain + repository** — types (§6), persona config, `db` interface with a **local (localStorage) implementation first** so the whole UX works with zero cloud deps.
4. **Screens** — Onboarding, Home, Profiles list, Profile detail, switcher, edit/delete (against local repo). Reach prototype parity.
5. **Interview UI** — transcript, 2 modes, turn‑taking, interviewer picker, rail; still using the prototype's static pools/regex as fallback logic.
6. **Azure AI Foundry** — implement `next-question`, `suggest-questions`, `extract`, `summary` behind Functions; swap the mock logic; keep static fallback.
7. **Voice** — Speech token endpoint + STT in the dock + optional TTS.
8. **Cloud persistence** — Cosmos (or Table) implementation of the repository + Blob photo upload; switch repo via config.
9. **Auth** — SWA built‑in auth; scope data to account; keep guest mode.
10. **Accessibility pass** — axe in CI + manual SR/keyboard pass; fix; document.
11. **Hardening** — error/empty/loading states, budgets, privacy/export/delete, README + `.env.example`.

Each milestone should end green: typecheck + lint + tests + a working deploy.

---

## 18. Acceptance criteria (Phase 1 "done")

- [ ] A signed‑in (or guest) user can create, edit, switch, and delete multiple storyteller profiles, with photo upload.
- [ ] AI‑asks mode produces relevant, one‑at‑a‑time questions via Azure AI Foundry, with a static fallback if the API is down.
- [ ] Manual mode supports family asking (voice or text), shows context‑aware AI follow‑up suggestions, enforces turn‑taking, and reminds the operator to record both Q and A.
- [ ] Voice input transcribes answers via Azure AI Speech; typing always works as an alternative.
- [ ] Each substantive answer yields a faithful memory card (verbatim excerpt) + extracted people/places/years.
- [ ] Interviewer can be changed mid‑session and persists.
- [ ] Session summary shows accurate counts + captured cards.
- [ ] Data persists to the database and is scoped to the owner; delete removes data + photo; memories are exportable.
- [ ] WCAG 2.1 AA: axe passes, keyboard‑only and screen‑reader walkthroughs succeed; large‑text and high‑contrast options work.
- [ ] Deployed to Azure Static Web Apps via GitHub Actions; all services on free/low‑cost tiers; README documents setup, env, and cost.

---

## 19. Out of scope (Phase 2 — do **not** build now)

Timeline view, Memory Canvas gallery, semantic Search ("ask your memories anything"), the relationship map, the stats dashboard, sharing/collaboration, multi‑language, native mobile apps, real‑time voice‑to‑voice (Realtime API), and printed/keepsake export. These are intentionally deferred; design hooks may be left but no implementation.

---

*End of specification. The interactive prototype in this project demonstrates every Phase‑1 interaction and the exact visual language to reproduce.*
