# MAMU Logo Brand Identity

## Requirements

- Node.js 20 or newer
- Bun
- A Supabase project for authentication and data

## Setup

Install dependencies and start the development server:

```sh
bun install
bun run dev
```

Copy `.env.example` to `.env` and set the values from your Supabase project. The server-side `SUPABASE_SECRET_KEY` is required for brief submissions; never expose it with a `VITE_` prefix. `SUPABASE_SECRET_KEY` is also used for best-effort email notifications. For database migrations, set `DATABASE_URL` to the Supabase PostgreSQL connection string.

## Checks

```sh
bun run lint
bun run test
bun run build
```
