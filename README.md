# Nexus Bloom Cast (ChatGram)

A full-stack social app with JWT authentication, profile/follow system, posts with images, likes, comments, optimistic UI updates, and infinite scroll.

## Stack

- Frontend: React 18, TypeScript, Vite, Zustand, Tailwind CSS, Radix UI
- Backend: Node.js, Express
- Auth: JWT (`Authorization: Bearer <token>`)
- Database: SQLite (`server/chatgram.db`)
- Testing: Vitest, Testing Library

## Features

- Signup/login with JWT
- Protected API routes and frontend auth bootstrap
- Feed with pagination + infinite scroll
- Profile pages with follow/unfollow
- Post creation with optional image URL
- Like/unlike posts (optimistic update + rollback)
- Add/delete comments (optimistic update + rollback)
- Delete own post/comment
- Followers/following lists
- Demo data seeding with realistic timestamps + photos

## Project Structure

- [src](src): React app source
- [src/lib/store.ts](src/lib/store.ts): global app state and API-backed actions
- [src/lib/api.ts](src/lib/api.ts): API helper and token handling
- [server/index.js](server/index.js): Express API
- [server/db.js](server/db.js): SQLite init and query helpers
- [server/scripts/seed-demo.js](server/scripts/seed-demo.js): demo users/posts/comments/likes/follows seeding
- [public](public): static assets

## Prerequisites

- Node.js 18+
- npm 9+

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start backend (Terminal 1):

```bash
npm run dev:server
```

3. Start frontend (Terminal 2):

```bash
npm run dev
```

4. Open app:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:4000`

## Demo Data

Seed realistic demo data:

```bash
npm run seed:demo
```

This creates/updates demo users, posts, likes, comments, follows, avatars, and image URLs.

Default demo password:

```text
demo1234
```

## Available Scripts

- `npm run dev`: start frontend (Vite)
- `npm run dev:server`: start backend with watch mode
- `npm run server`: start backend without watch mode
- `npm run seed:demo`: seed demo data
- `npm run build`: production build
- `npm run build:dev`: development-mode build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint
- `npm run test`: run tests once
- `npm run test:watch`: run tests in watch mode

## Environment Variables

Frontend:

- `VITE_API_BASE_URL` (optional)
- Default: `http://localhost:4000`

Backend:

- `PORT` (optional, default `4000`)
- `JWT_SECRET` (recommended in non-dev environments)

## Database

- File path: [server/chatgram.db](server/chatgram.db)
- Auto-created when backend starts and `initDb()` runs
- Main tables: `users`, `posts`, `comments`, `likes`, `follows`

## API Overview

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/me`

Profiles:

- `PATCH /api/profiles/me`
- `GET /api/profiles/:username`
- `POST /api/profiles/:username/follow`
- `GET /api/profiles/:username/followers`
- `GET /api/profiles/:username/following`
- `GET /api/profiles/:username/posts?limit=&offset=`

Posts:

- `GET /api/posts?limit=&offset=`
- `POST /api/posts`
- `GET /api/posts/:postId`
- `DELETE /api/posts/:postId`
- `POST /api/posts/:postId/like`

Comments:

- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- `DELETE /api/posts/:postId/comments/:commentId`

Health:

- `GET /api/health`

## Troubleshooting

- Image URL not showing after posting:
- Use a direct image URL (`.jpg`, `.jpeg`, `.png`, `.webp`) that allows hotlinking.
- Preview in create-post confirms whether URL is loadable before submission.

- `pip install sqlite3` fails:
- Expected behavior. `sqlite3` is part of Python standard library and not a pip package.

- Console error: "A listener indicated an asynchronous response...":
- Usually caused by browser extensions, not app code.
- Test in incognito mode or disable extensions.

## Notes

- This repo currently uses SQLite for local-first simplicity.
- For production deployment, consider environment-specific CORS, stronger JWT secret management, and managed database options.
