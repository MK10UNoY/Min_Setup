# Low Setup Guru

A universal code testing platform supporting frontend (React/Svelte) and compiled languages (C/C++/Python/etc) using Judge0.

## Project Structure

- `frontend/` — SvelteKit + Monaco Editor + Tailwind CSS
- `backend/` — Node.js Express server (proxies to Judge0)

## Setup

### Frontend

```
cd frontend
npm install
npm run dev
```

### Backend

```
cd backend
npm install
npm run dev
```

## Configuration
- For Judge0, you may need a RapidAPI key for higher rate limits. See `backend/index.js` for details.
