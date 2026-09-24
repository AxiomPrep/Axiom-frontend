# Axiom frontend

Web UI for Axiom Prep. Next.js 15 (App Router) on port **3000**. The API lives in a separate backend repo; this app proxies `/api/*` there.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

`.env.local`:

```
API_ORIGIN=https://axiom-backend-dwlc.onrender.com
```

Without the backend, a lot of screens still open and fall back to local/demo data after a 401.

## Scripts

- `npm run dev` — local server
- `npm run build` / `npm start` — production
- `npm run typecheck` — `tsc --noEmit`

## Routes

- `/` home
- `/top-teachers` faculty, chapters, lectures
- `/watch/[contentId]` lecture player
- `/originals` tools, quizzes, tracker, FSTs, etc.
- `/timer` Study Hub (timer, to-do, NCERT)
- `/read` PDF / flipbook
- `/login` `/practice` `/attempts/[id]`

## Notes

- Theme is stored as `axiom-theme` in localStorage (`dark` / `light`).
- Study Hub timer can keep a session in localStorage if the API is down.
- Don’t commit `.env.local`.
