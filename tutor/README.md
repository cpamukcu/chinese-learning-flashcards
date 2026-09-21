# 说说 Shuōshuo — Chinese AI voice tutor

Practice spoken Mandarin daily with an AI voice tutor. Working name; change it in [`src/lib/site.ts`](src/lib/site.ts).

**Status: Milestone 2 (text tutor).** Landing page, Supabase auth (email magic link + Google), a dashboard shell, and a typed-chat tutor at `/session`. The voice loop, persistence and habit tracking arrive in Milestones 3–5. The full brief is in `CHINESE_AI_TUTOR_SPEC.md`.

Stack: Next.js (App Router) · TypeScript strict · Tailwind CSS v4 · shadcn/ui · Supabase Auth · system Chinese fonts (see Performance).

> This app lives in `tutor/`. The single-file flashcard app in the repo root is separate and untouched.

## Setup

Requires Node 20+.

```bash
cd tutor
npm install
cp .env.example .env.local
```

Then fill in `.env.local` (see below) and run:

```bash
npm run dev
```

Open <http://localhost:3000>. The landing page works with no keys at all; login needs Supabase.

### Just trying it yourself? Skip login

Put this in `.env.local` and you need **no Supabase account, no email and no login**. Only an `ANTHROPIC_API_KEY` for the tutor:

```
DEV_SKIP_AUTH=true
ANTHROPIC_API_KEY=sk-ant-...
```

`/login` then goes straight to the dashboard. This only works under `npm run dev`; it is ignored in production builds (`next build` / `next start` / any deployment), so it cannot switch off login on a live site. Restart the dev server after editing `.env.local`.

### Keys and accounts needed through Milestone 2

Supabase (login, not needed in skip-login mode) and Anthropic (the tutor). The remaining variables in `.env.example` are listed but aren't read until later milestones.

| Variable | Needed | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | now | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | now | same page → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Milestone 4 | same page → `service_role` key. **Server-only. Never expose it.** |
| `ANTHROPIC_API_KEY` | now (tutor) | console.anthropic.com → API keys. Usage is billed per token. |
| `STT_API_KEY`, `TTS_API_KEY` | Milestone 3 | provider chosen in Milestone 3 |

### Supabase configuration

1. Create a free project at <https://supabase.com>.
2. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback` (and your production URL + `/auth/callback` when you deploy).
3. **Email magic link** works out of the box. Supabase's built-in mailer is rate-limited (a few emails per hour), which is fine for testing.
4. **Google sign-in** (optional for testing, needed for the Google button):
   - Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID* (type: Web application).
   - Authorized redirect URI: the callback URL shown in Supabase → Authentication → Providers → Google (`https://<project-ref>.supabase.co/auth/v1/callback`).
   - Paste the client ID and secret into Supabase → Authentication → Providers → Google and enable it.

#### Optional: magic links that open on any device

By default the magic link must be opened in the **same browser** you requested it from (PKCE). On phones, in-app mail browsers can break that. To make links work anywhere, edit Supabase → Authentication → Email Templates → *Magic Link* and point the link at the token-hash endpoint this app already supports:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Log in</a>
```

## The tutor (Milestone 2)

Log in, click **Start today's session** (or open `/session`), pick a scenario and HSK level, and chat in Chinese. Each tutor message shows characters, pinyin and English (toggle each), plus new-word chips; each of your messages gets a correction card or a "Sounds natural" note.

- `POST /api/tutor` requires login, validates input (500 chars per message, last 20 turns), asks Claude for structured JSON, and returns `{ reply }` with the spec §6 shape. Errors return `{ error, message }` with a learner-safe message; provider details are only logged server-side.
- Pinyin is generated locally with `pinyin-pro`, one syllable at a time, not by the model.
- Conversations live in the browser only and are lost on reload. Saving them is Milestone 4.
- **Two model backends**, chosen by `TUTOR_PROVIDER`: `ollama` (free, runs locally, see below) or `anthropic` (Claude; needs an API key with prepaid credit). Claude's model and limits are in [`src/lib/tutor/config.ts`](src/lib/tutor/config.ts) (`claude-opus-5`, low effort; `claude-sonnet-5` is cheaper).
- Refusals: the request opts into Anthropic's server-side fallback, so a declined turn is retried on a fallback model instead of failing.

### Free local tutor with Ollama (no account, no API key)

1. Install Ollama from <https://ollama.com/download> and open it (a llama icon appears in the menu bar).
2. Download a model once (about 2 GB): `ollama pull qwen2.5:3b`
3. In `tutor/.env.local` set `TUTOR_PROVIDER=ollama`, then restart `npm run dev`.

The first reply after starting is slow while the model loads into memory. On a 16 GB+ Mac, `OLLAMA_MODEL=qwen2.5:7b` (about 4.7 GB) is noticeably better at spotting mistakes. Small local models are weaker than Claude at corrections, so judge them with that in mind. Note: the 3B Qwen model is licensed for non-commercial use.

## Performance and use in China

**Performance (measured on a production build, landing page, gzipped):** 207 KB total, down from 592 KB. Chinese text uses each device's built-in font instead of a downloaded web font (about 340 KB saved); the pinyin dictionary (about 135 KB) loads in the background only after a chat starts; the FAQ uses native `<details>` (no JavaScript). The page requests nothing from any outside host.

**Making it work in mainland China, no VPN.** Nothing in the browser bundle depends on a blocked service. What blocks access is the services around it, and each has a China-friendly setting:

| Piece | Problem in mainland China | What to use (already built in) |
|---|---|---|
| Login (Supabase, Google) | supabase.co and Google are unreliable or blocked | `ACCESS_PASSWORD`: one shared password, no third party |
| Tutor model (Claude) | Not available in China, and Hong Kong isn't a supported region either | `TUTOR_PROVIDER=openai-compatible` with a Chinese model API (below) |
| Hosting (Vercel, GitHub Pages, Cloudflare) | Slow, unreliable or blocked | Your own server in Hong Kong (below) |
| Voice (Milestone 3) | Chrome's built-in speech recognition uses Google servers | Not built yet; will need a Chinese speech provider (iFlytek, Alibaba, Tencent) |

### Login modes

Chosen by which variable is set, in this order: `DEV_SKIP_AUTH=true` (dev only, ignored in production) → `ACCESS_PASSWORD` (shared password, 8+ characters) → Supabase email/Google. Everyone using the password shares one identity, which is fine for you and a few friends. Changing the password logs everyone out. Wrong guesses are rate-limited (8 per IP per 15 minutes).

### A tutor model that works in China

Set `TUTOR_PROVIDER=openai-compatible` and three variables. Any provider with an "OpenAI-compatible" API works:

| Provider | `LLM_BASE_URL` | Example `LLM_MODEL` |
|---|---|---|
| Zhipu (GLM) | `https://open.bigmodel.cn/api/paas/v4` (the default) | `glm-4-flash` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| Alibaba Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| Moonshot Kimi | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |

Free tiers, prices and sign-up rules change, so check each provider's current terms. The correction check runs as a second focused call to the same model.

### Deploying on a Hong Kong server

A server in Hong Kong is reachable from mainland China without an ICP filing (a mainland server needs one). On any small Linux VPS (Alibaba Cloud, Tencent Cloud and others have Hong Kong regions):

```bash
# once: install Node 20+ and git, then
git clone <your repo> && cd <repo>/tutor
npm ci && npm run build
```

Create `.env.production` next to `package.json` with `ACCESS_PASSWORD`, `TUTOR_PROVIDER=openai-compatible`, `LLM_API_KEY` (and the other variables above), then run it and keep it alive:

```bash
PORT=80 npm run start        # or use pm2 / systemd to keep it running
```

Open port 80 (and 443 if you add HTTPS) in the provider's firewall. A domain plus HTTPS (for example with Caddy) is recommended: the login cookie is marked `Secure` automatically when the site is served over HTTPS, and the microphone in Milestone 3 requires HTTPS. Without a domain the site works over plain HTTP by IP address.

## Static edition on GitHub Pages (no server)

The same tutor also builds as plain files, hosted free on GitHub Pages at
`https://cpamukcu.github.io/chinese-learning-flashcards/app/` (next to the flashcard app).

Because GitHub Pages has no server, this edition has **no login and no shared model key**. The chat runs in each visitor's browser and calls the model provider directly, using **the visitor's own** key (Zhipu, DeepSeek, Qwen, Kimi or any OpenAI-compatible API) or their own local Ollama. The key is stored only in that browser's localStorage and sent only to the provider they chose. Never put your own key in this site: everything on GitHub Pages is public.

Rebuild after changing the code, then commit the `app/` folder and push:

```bash
npm run build:static      # from the repo root or from tutor/
git add app .nojekyll && git commit -m "Update static site" && git push
```

`scripts/build-static.mjs` builds a copy of the source with the server-only parts (login, `/api`, proxy) removed, so your real source is never touched. The four providers above were checked to allow browser calls from `cpamukcu.github.io` (CORS). Ollama blocks other websites by default; allow it once on a Mac with `launchctl setenv OLLAMA_ORIGINS "https://cpamukcu.github.io"` and reopen Ollama (Chrome, Edge and Firefox only; Safari blocks it).

Limits: `github.io` is slow or blocked on some networks in mainland China, and there is no server-side rate limiting, so each visitor's own key pays for their own use.

## Tests

```bash
npm test
```

Covers tutor JSON parsing, request validation, the prompt builder and pinyin.

## Project layout

```
src/app/
  page.tsx                  landing page
  (auth)/login/             login page (magic link + Google)
  auth/callback/route.ts    exchanges the auth code / token hash for a session
  auth/signout/route.ts     POST-only sign out
  dashboard/                protected dashboard shell
  session/                  typed-chat tutor page
  api/tutor/route.ts        tutor endpoint (login required)
src/components/             ui/ (shadcn), landing/, dashboard/, auth/, brand/
src/lib/
  supabase/                 browser client, server client, proxy session refresh
  env.server.ts             the only place server-side secrets are read (server-only)
  tutor/                    prompt, scenarios, JSON parsing, request validation, Claude call
  voice/                    VoiceProvider interface (spec §5); implemented in Milestone 3
  site.ts                   name, tagline
src/proxy.ts                refreshes the session and redirects /dashboard → /login when signed out
```

### Security notes

- Provider keys are read only in `src/lib/env.server.ts`, which imports `server-only`, so importing it from a client component fails the build.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` reach the browser. The anon key is safe by design and is restricted by row-level security (added in Milestone 4).
- Auth checks use `supabase.auth.getUser()` (validated server-side), not `getSession()`.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
npm test        # unit tests (vitest)
```

## Deploying

Import the repo in Vercel, set **Root Directory** to `tutor`, add the environment variables from `.env.example`, and add your production URL to the Supabase redirect URLs.
