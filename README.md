# Low Setup Guru

> ⚡ Open-source, self-hostable browser-based code playground.  
> A lightweight StackBlitz alternative built on SvelteKit.

Write and run **JavaScript, TypeScript, Python, C, C++, Java, Go, Rust** and 15+ more languages directly in your browser.

- **JS/TS** runs in-browser via Nodebox — no server needed
- **Everything else** runs via Judge0 CE on your machine via Docker
- **Zero cost** — everything runs locally

---

## Running Locally

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | 20+ | `docker --version` |
| [Node.js](https://nodejs.org/) | 18+ | `node --version` |
| [pnpm](https://pnpm.io/) | 8+ | `pnpm --version` |

### Step 1: Clone the repo

```bash
git clone https://github.com/yourusername/low-setup-guru.git
cd low-setup-guru
```

### Step 2: Set up environment

```bash
cp .env.example .env
# No changes needed for local development!
```

### Step 3: Start Judge0 (Docker)

```bash
docker-compose up -d
```

> ⏳ **First run takes 2-3 minutes** while Judge0 initializes its language database. Be patient!

### Step 4: Install dependencies and start the dev server

```bash
pnpm install
pnpm run dev
```

### Step 5: Open in browser

```
http://localhost:5173
```

That's it! JavaScript/TypeScript will run immediately via Nodebox. C/C++/Python/Java will work once Judge0 finishes initializing.

### Verify Judge0 is running

```bash
# Check if Judge0 is healthy
curl http://localhost:2358/about

# List available languages
curl http://localhost:2358/languages

# Or use the built-in health check
curl http://localhost:5173/api/execute
```

---

## Common Issues

### Docker not running

```
Error: Cannot connect to the Docker daemon
```

**Fix:** Start Docker Desktop, then re-run `docker-compose up -d`.

### Port 2358 already in use

```
Error: Bind for 0.0.0.0:2358 failed: port is already allocated
```

**Fix:** Stop whatever is using port 2358:
```bash
docker-compose down
# Or find and kill the process:
# Linux/Mac: lsof -i :2358
# Windows: netstat -ano | findstr 2358
```

### Judge0 returns empty responses

This usually means Judge0 hasn't finished initializing. **Wait 2-3 minutes** after the first `docker-compose up`, then try again:
```bash
# Watch the logs to see when it's ready
docker-compose logs -f server
```

### "Execution service unavailable" in the app

The app shows this when it can't reach Judge0. Check:
1. Is Docker running? `docker ps`
2. Is Judge0 healthy? `curl http://localhost:2358/about`
3. Did you start it? `docker-compose up -d`

---

## Architecture

```
Browser (SvelteKit frontend on :5173)
├── HTML/CSS    → iframe preview (no server)
├── JS/TS/Node  → Nodebox (in-browser, no server)
└── C/C++/Java/Python/Go/Rust/...
    ↓
    SvelteKit API Route (/api/execute)
    ↓
    Judge0 CE (Docker on :2358)
```

### Key directories

```
src/
├── lib/
│   ├── components/       # UI components (editor, sidebar, terminal, topbar, preview)
│   ├── execution/        # Execution layer
│   │   ├── router.ts     # Frontend router (nodebox vs judge0 vs iframe)
│   │   ├── judge0.ts     # Server-side Judge0 client
│   │   ├── nodeboxRunner.ts  # In-browser JS/TS execution
│   │   └── types.ts      # Shared types
│   ├── stores/           # Svelte stores (file, editor, execution, terminal, UI)
│   ├── utils/            # ANSI stripper, file type detection, language map
│   └── config.ts         # Server-side env config
├── routes/
│   ├── +page.svelte      # Main IDE layout
│   ├── embed/            # Embeddable iframe version
│   └── api/
│       ├── execute/      # POST — Judge0 proxy
│       └── languages/    # GET — supported language list
├── docker-compose.yml    # Local Judge0 stack
├── deploy.sh             # Production VPS deployment script
└── .env.example          # Environment template
```

---

## Production Deployment

When you're ready to deploy to a VPS ($6/month):

1. Get an Ubuntu 22.04 VPS (DigitalOcean, Hetzner, etc.)
2. Point a subdomain (e.g., `judge.yourdomain.com`) to the VPS IP
3. Edit `deploy.sh` — set `DOMAIN`, `EMAIL`, `AUTH_USER`, `AUTH_PASS`
4. Upload and run:
   ```bash
   scp deploy.sh root@your-vps-ip:~/
   ssh root@your-vps-ip "chmod +x deploy.sh && ./deploy.sh"
   ```
5. Update your app's `.env`:
   ```
   JUDGE0_URL=https://judge.yourdomain.com
   JUDGE0_TOKEN=<token from deploy output>
   RATE_LIMIT_ENABLED=true
   ```

**Zero code changes needed** — just swap the env vars.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit + TypeScript |
| Editor | Monaco Editor |
| Browser Execution | Nodebox (JS/TS) |
| Server Execution | Judge0 CE (Docker) |
| Styling | Tailwind CSS v4 |

## License

MIT
