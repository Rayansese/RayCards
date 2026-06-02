# RayCards

AI flashcards from textbook pages — **Gemini 3.1 Flash-Lite**, Next.js 16, Prisma/SQLite.

## Quick start

```bash
cd RayCards
cp .env.example .env.local   # add GEMINI_API_KEY
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000 — use **Try Demo** without an API key.

For phone/LAN access, dev binds to `0.0.0.0` (e.g. http://192.168.x.x:3000).

## Features

- Create books, paste page text or upload PDF (text extraction)
- Server-rendered book list (works on network IP)
- Study mode with shuffled cards
- Demo book seed (`SEED_DEMO=true`)
- Rate limit on AI page generation

## API

| Method | Path |
|--------|------|
| GET | `/api/demo` |
| GET/POST | `/api/books` |
| POST | `/api/books/:id/upload` |
| POST/DELETE | `/api/books/:id/pages`, `/api/books/:id/pages/:pageId` |
| GET | `/api/books/:id/study?from=1&to=50` |
| PATCH | `/api/flashcards/:id` |

## Env

See `.env.example`.

MIT — [LICENSE](LICENSE)
