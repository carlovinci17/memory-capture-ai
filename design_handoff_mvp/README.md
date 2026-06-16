# Handoff: Memory Capture AI — Phase 1 MVP

> A complete developer handover for building the **Memory Capture AI** Phase‑1 MVP in a real codebase using **VS Code + Claude Code**.
>
> **Read order:** this README first (orientation + how to run the prototype) → then `Engineering Scope.md` (the full build specification: stack, Azure AI Foundry, data models, APIs, accessibility, cost, milestones).

---

## 1. What this product is

**Memory Capture AI** is a *living memory journal*. An elderly (or any) storyteller sits with a warm AI "companion" that interviews them about their life. As they talk, their answers are transcribed, turned into soft **memory cards**, and the people / places / dates they mention are extracted automatically. Families can run the interview, take over the questioning, or let the AI lead.

**Emotional design goal:** gentle, unhurried, dignified. Warm paper‑and‑watercolor aesthetic.

**Phase‑1 core loop:** Create a storyteller profile → Interview (AI‑led or family‑led) → Session summary → Manage multiple profiles.

---

## 2. About the design files (read this first)

The files in **`prototype/`** are **design references built in HTML/React‑via‑Babel** — a working prototype that demonstrates the intended look, copy, and behavior. **They are not production code to ship directly.**

Your task is to **recreate this prototype in a real, deployable codebase** following the architecture in `Engineering Scope.md` (TypeScript + Next.js + Azure, all on free/low‑cost tiers). The prototype is the **UX + visual source of truth**; the scope doc is the **engineering source of truth**.

- The prototype runs entirely client‑side with **mocked logic** (regex extraction, static question pools, `localStorage` persistence).
- In production those mocks are replaced by **Azure AI Foundry** (questions, suggestions, extraction, summary), **Azure AI Speech** (voice), and a real **database + auth** — see the scope doc.
- Reuse the prototype's **CSS design system and watercolor components verbatim** — they're approved.

### Fidelity: **High‑fidelity (hifi)**
Final colors, typography, spacing, copy, and interactions. Recreate the UI faithfully using the target codebase's libraries and patterns. Exact tokens are in §7 below and in `prototype/app.css`.

---

## 3. How to run the prototype locally

It's a static site — no build step.

```bash
cd design_handoff_mvp/prototype
# any static server, e.g.:
npx serve .
#   or
python3 -m http.server 8000
```

Open the served URL and load **`Memory Capture AI - MVP.html`**. (Opening the file via `file://` may break font/asset loading and `localStorage` scoping — always serve over HTTP.)

**State lives in `localStorage`** under key `mcap_mvp_store_v1` (shape `{ profiles: [...], activeId }`). To reset to the first‑run create‑profile screen, clear that key in DevTools. A legacy single‑profile key `mcap_mvp_profile_v1` is auto‑migrated on load.

---

## 4. File map (what's in `prototype/`)

| File | Role |
|---|---|
| `Memory Capture AI - MVP.html` | Entry point. Loads fonts, CSS, React 18 + Babel, then the scripts below in order. |
| `mvp-app.jsx` | **App shell & state.** Multi‑profile store, `localStorage` persistence + migration, routing between screens, sidebar, top‑bar **profile switcher**, change‑interviewer wiring, Tweaks panel mounting. Renders `<App>`. |
| `mvp-screens.jsx` | `OnboardingScreen` (create/edit/add profile), `HomeScreen`, `ProfilesScreen` (list), `ProfileScreen` (detail), `SummaryScreen`. |
| `mvp-interview.jsx` | **The centerpiece.** `InterviewScreen`: 2 modes (AI asks / Manual), turn‑taking, three speaker bubble types, interviewer picker, live extraction (`extractFrom`, `deriveTitle`) and suggestion pools (replaced by AI in prod). |
| `mvp.css` | MVP‑specific styles: onboarding, profiles grid, profile switcher, interview modes/dock/picker, summary. |
| `app.css` | **Design system** — all CSS custom properties (color moods, type, spacing, shadows), app shell, sidebar, top‑bar, buttons, memory cards. |
| `screens.css` | Home + interview layout (hero, transcript, dock, extraction rail). |
| `screens2.css` | Profile detail + shared panel/section styles. |
| `ui.jsx` | Stroke‑path `ICONS` set + shared chrome helpers (`Icon`, `SectionHead`, `MemoryCard`). |
| `watercolor.jsx` | Generative watercolor components: `WatercolorDefs`, `Bloom`, `WatercolorArt`, `VoiceOrb`, `Waveform` (SVG `feTurbulence`/`feDisplacementMap`). Decorative — mark `aria-hidden`. |
| `data.js` | `window.DATA.personas` (the 4 interviewers) + demo content. **Lift personas into a typed `personas.ts`.** |
| `tweaks-panel.jsx` | Demo theming panel (color mood / type / texture). Optional in prod; doubles as a hook for the a11y text‑size / high‑contrast controls. |

**Script load order matters** (globals are shared via `window`): React/Babel → `tweaks-panel.jsx` → `watercolor.jsx` → `ui.jsx` → `mvp-screens.jsx` → `mvp-interview.jsx` → `mvp-app.jsx`.

---

## 5. Screens & views

### 5.1 Onboarding — Create / Edit / Add storyteller (`OnboardingScreen`)
- **Purpose:** capture a storyteller so interviews can begin.
- **Layout:** full‑screen warm stage, **two columns** (`max-width: 1120px`, `grid-template-columns: 0.85fr 1fr`, gap 56px). Left = intro (brand, greeting, title, lead, 3‑step explainer). Right = the form panel (`.ob__panel`, surface card, radius `--r-xl`, `--shadow-lg`). Collapses to one column < 900px.
- **Fields (in order):** photo upload (optional, drag/click, stored as data URL in prototype → Blob in prod); **Name** (required); **Year born** (optional, numeric, 4 digits); **Where you're from** (optional); **A few words about you** (optional textarea); **Choose your interviewer** (2×2 persona cards, single‑select).
- **Modes of this screen:** `create` (first run, no cancel), `add` (additional storyteller, cancelable), `edit` (prefilled, adds **Delete profile** link with confirm).
- **Primary action:** "Create my journal" / "Create journal" / "Save changes" (disabled until Name present).
- **Copy:** greeting reads "Welcome" / "A new storyteller" / "A few refinements" by mode.

### 5.2 Home (`HomeScreen`)
- **Purpose:** warm landing for the active storyteller; route into an interview.
- **Layout:** hero card (greeting by time of day + first name, serif title, sub, two CTAs) → "Today's invitation" prompt card (persona avatar + sample question + Answer button) → "Recently captured" memory cards (or an empty state).
- **Behavior:** content adapts to whether any sessions exist yet; persona sample question comes from the chosen interviewer.

### 5.3 Interview (`InterviewScreen`) — the centerpiece
- **Purpose:** conduct the interview; capture memories live.
- **Layout:** two columns — **stage** (left, flex column) + **extraction rail** (right). Stage top: `VoiceOrb`, status pill, **interviewer name as a dropdown** (chevron → picker of all 4 interviewers, persists choice), **mode switch** (`AI asks` / `Manual`), mode description. Middle: scrolling **transcript** (`aria-live` in prod). Below transcript: turn indicator (Manual only, 10px bottom margin). Bottom: **dock** = mic button + text compose + send + End. Hint line under the dock.
- **Three speaker bubble styles:** `ai` (companion), `storyteller` (the person, serif text), `asker` (family — accent‑3 tinted, labeled "Family").
- **Mode: AI asks** — fully automated. The companion asks one question; the storyteller answers; the companion follows up. (Prod: `next-question` via Foundry; prototype: rotating `FOLLOWUPS` pool.)
- **Mode: Manual** — family asks (voice or text). Turn indicator alternates "Family's turn to ask" ↔ "{name} is answering". The **right rail shows optional AI follow‑up suggestions** (prod: `suggest-questions`, context‑aware; prototype: `QUESTION_POOL` + simple context). Persistent hint reminds the operator to **record both the question and the answer**.
- **Live extraction:** each substantive answer (≥ ~14 chars) becomes a **memory card** (title, era, palette) and adds **noticed** people/places/years to the rail. (Prod: `extract` structured output; prototype: `extractFrom`/`deriveTitle` regex.)
- **Rail extras:** newest memory card with watercolor art + "{n} this session" count; "Noticed in your words" chips; "A chapter is forming" once ≥ 2 memories.
- **End** → builds a session object and routes to Summary.

### 5.4 Summary (`SummaryScreen`)
- **Purpose:** close the session warmly; show what was captured.
- **Layout:** hero (check glyph, "Beautifully done, {first}.", sub) + stat row (memories captured, questions answered, time together, journal total) + CTAs (Keep going / Back home) → "Captured this session" memory cards → "Names, places & moments noticed" chips.
- **Prod addition:** optional one‑paragraph AI reflection, clearly labeled AI‑generated. Stats computed in code.

### 5.5 Profiles list (`ProfilesScreen`)
- **Purpose:** manage all storytellers; create a new one.
- **Layout:** `SectionHead` + intro line + **responsive grid** (`repeat(3,1fr)`, → 2 cols < 1100px). Each **tile**: avatar (56px, radius 18), "Current" badge on the active one, name, born/from line, memory & session counts, "Open journal →". Final tile = dashed **"Add a storyteller"** card.
- **Behavior:** opening a tile switches the active profile and routes to that person's detail.

### 5.6 Profile detail (`ProfileScreen`)
- **Purpose:** view one storyteller's journal.
- **Layout:** "← All profiles" chip → hero (portrait/photo, name, bio, fact chips: Born / From / Memories / Sessions) with actions (Start a session / Edit profile / **Delete profile**) → two panels: "Your interviewer" (persona + sample + change link) and "Memories ({n})" list.

### 5.7 Global chrome
- **Sidebar** (`.sidebar`, 256px): brand "Memory Capture AI" + nav (Home / Interview / Profiles). No bottom profile block (moved to top‑bar).
- **Top‑bar** (`.topbar`): screen eyebrow + title (left); **profile switcher** (right) = avatar + name + memory count + chevron → dropdown listing all storytellers (current checked) + "Add a new storyteller".

---

## 6. Interactions & behavior

- **Routing:** single‑page state machine in `mvp-app.jsx` (`screen` ∈ `onboarding | edit | home | interview | profiles | profile | summary`). No URL router in the prototype — **add real routes in prod** (see scope §14).
- **Persistence:** every mutation writes the whole store to `localStorage` immediately. In prod, swap behind a repository interface (local → Cosmos/Table).
- **Profile switching:** changing active profile re‑renders all screens against that person's data; lands on Home.
- **Change interviewer:** dropdown on the interviewer name; selection persists to the profile's `personaId`.
- **Turn‑taking (Manual):** asking flips phase to "answer"; answering flips back to "question" and regenerates suggestions.
- **Delete:** `window.confirm` then removes that profile; falls back to another profile, or onboarding if it was the last.
- **Voice (prototype):** mic button is a visual toggle only. **Prod:** Azure Speech STT writes into the compose field; typing always remains available.
- **Animations:** entrance via `.rise` (≈ `.22s cubic-bezier(.2,.7,.2,1)`); dropdowns animate in. **All gated on `prefers-reduced-motion`** — preserve this.
- **Empty/loading/error states:** prototype shows empty states; **prod must add loading + graceful AI‑failure fallback** (static question pools) so the interview never hard‑stops.

---

## 7. Design tokens (from `app.css` — hifi, exact)

**Paper & ink (constant across moods)**
```
--bg: #F4EDE1;  --bg-deep: #ECE2D2;
--surface: #FCF8F1;  --surface-2: #F7F0E4;  --surface-3: #FBFAF6;
--ink: #34291F;  --ink-2: #6E6052;  --ink-3: #9C8E7E;  --ink-4: #BEB1A0;
--line: rgba(52,41,31,0.10);  --line-2: rgba(52,41,31,0.06);
```

**Accent — default mood "terracotta"** (4 moods exist; switchable via `data-mood`)
```
--accent: #C16B4A;  --accent-2: #CC7E73;  --accent-3: #9CA98C;
--accent-ink: #8A4327;  --accent-wash: #EBC9B4;
sage:     --accent #7E9A6C  --accent-ink #4F6B3F
lavender: --accent #9683B6  --accent-ink #6A578C
honey:    --accent #C2904A  --accent-ink #8A6326
```

**Watercolor blooms (terracotta):** `--bloom-a #E2A07E · --bloom-b #D98C8C · --bloom-c #A9BB97 · --bloom-d #E8C285`

**Shadows**
```
--shadow-sm: 0 1px 2px rgba(52,41,31,.04), 0 2px 8px rgba(52,41,31,.05);
--shadow-md: 0 4px 14px rgba(52,41,31,.07), 0 18px 40px rgba(52,41,31,.07);
--shadow-lg: 0 10px 30px rgba(52,41,31,.10), 0 40px 80px rgba(52,41,31,.10);
```

**Radii:** `--r-sm 10 · --r-md 16 · --r-lg 24 · --r-xl 34` (px). **Sidebar width:** 256px.

**Typography**
```
--font-display: 'Newsreader', Georgia, serif;       /* titles, serif, weights 400/500 + italic */
--font-body:    'Hanken Grotesk', system-ui, sans;  /* UI/body, 400/500/600/700 */
--font-hand:    'Caveat', cursive;                   /* handwritten accents (greetings) */
```
Loaded from Google Fonts in the HTML head. Display titles run large (e.g. onboarding 46px, hero/summary 36px) with `letter-spacing: -0.02em`; body 15–16px / line‑height ~1.6; eyebrows are uppercase 600 with letter‑spacing.

> **Accessibility note:** this is a *light* palette. `--ink-3`/`--ink-4` on `--bg` are below AA for body text — only use them for large/decorative text, and **provide a high‑contrast theme + larger‑text mode** (scope §11). Audit all text/UI to WCAG 2.1 AA.

---

## 8. The four interviewer personas (from `data.js`)

| id | name | glyph | accent | voice |
|---|---|---|---|---|
| `historian` | Curious Historian | 📜 | `#C16B4A` | places a life inside the wider world |
| `journalist` | The Journalist | 📰 | `#6E8FA8` | follows the thread to the turning point |
| `grandchild` | The Grandchild | 🧶 | `#C08AA0` | warm, wide‑eyed, family questions |
| `researcher` | Family Researcher | 🌿 | `#7E9A6C` | maps names/dates/places as you talk |

Each has a `blurb` and a `sample` opening question in `data.js`. **In prod, add a `promptStyle` per persona** to steer the model (scope §6/§7).

---

## 9. State & data model

The prototype's in‑memory shapes map directly to the production types in **`Engineering Scope.md` §6** (`StorytellerProfile`, `Memory`, `ExtractedEntity`, `Session`, `TranscriptTurn`, `Persona`). Key prototype state:

- **Store:** `{ profiles: StorytellerProfile[], activeId }` in `localStorage` (`mcap_mvp_store_v1`).
- **Profile (prototype):** `{ id, name, yearBorn, birthplace, bio, photo(dataURL), personaId, sessions, memories[], createdAt }`.
- **Memory (prototype):** `{ id, title, excerpt, era, palette[], theme, createdAt }`.
- **Interview‑local state:** `messages[]` (transcript), `memories[]`, `noticed[]`, `mode`, `phase`, `turns`, plus picker/listening UI flags.

**Production note:** keep the storyteller's words **verbatim** in `excerpt` — AI may title/organize but must never rewrite their memories.

---

## 10. Assets

- **Fonts:** Newsreader, Hanken Grotesk, Caveat — Google Fonts (already linked in the HTML head).
- **Icons:** inline stroke SVG paths in `ui.jsx` (`ICONS`). No icon library/dependency — port as a component or map to the target app's icon set.
- **Watercolor art:** generated at runtime via SVG filters in `watercolor.jsx` — no image files.
- **Persona avatars:** emoji glyphs on gradient washes (no image assets).
- **Photos:** user‑uploaded; data‑URL in prototype → **Azure Blob** in prod.
- **Screenshots:** `../screenshots/` contains reference captures (profiles list, interviewer picker, profile switcher). Ask if you want full per‑screen captures added.

---

## 11. What to build next (pointer to the scope doc)

`Engineering Scope.md` is the authoritative build spec. Highlights:
- **Stack:** TypeScript + Next.js (App Router) + React; Azure Static Web Apps (free) + Azure Functions (free consumption).
- **AI:** **Azure AI Foundry** (`gpt-4o-mini`) for next‑question, follow‑up suggestions, structured extraction, summary — all server‑side, with static fallbacks.
- **Voice:** **Azure AI Speech** (free F0) STT + optional TTS via short‑lived server‑minted tokens.
- **Data:** Cosmos DB free tier (or Table Storage) + Blob storage; SWA built‑in auth; **guest/local mode** preserving the prototype's offline behavior.
- **Cost:** everything free/near‑free; target ≈ $0–2/month for the demo.
- **Accessibility:** WCAG 2.1 AA is a hard requirement (large targets, keyboard, screen‑reader, voice, high‑contrast, larger text).
- **Build order:** 11 milestones from scaffold → design‑system port → local‑repo UX parity → Foundry → voice → cloud persistence → auth → a11y → hardening.

---

## 12. Suggested first prompt for Claude Code

> "Read `design_handoff_mvp/README.md` and `design_handoff_mvp/Engineering Scope.md`. Study the prototype in `design_handoff_mvp/prototype/` (start at `Memory Capture AI - MVP.html`, then `mvp-app.jsx`, `mvp-screens.jsx`, `mvp-interview.jsx`). Scaffold the Next.js + TypeScript app per scope §14, port the design system and watercolor components verbatim, and implement Milestone 1–4 (scaffold, design‑system port, domain + local repository, and the screens at prototype parity) using a `localStorage`‑backed repository first. Keep all Azure keys server‑side. Don't start Azure AI Foundry wiring until the local‑mode UX matches the prototype."

---

*Self‑contained: a developer who wasn't in the design conversation can build Phase 1 from this README + `Engineering Scope.md` + the `prototype/` files alone.*
