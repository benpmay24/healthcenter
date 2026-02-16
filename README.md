# Health Center

A personal health tracking web app: log meals with ingredients (search USDA foods or enter manually), track daily calories and macros, log weight, and view trends over time.

## Stack

- **API**: Node.js, Express, SQLite (dev) / PostgreSQL (production), USDA FoodData Central for food search
- **Frontend**: React (Vite), React Router, Recharts

## Setup

### 1. USDA API key (recommended — avoids rate limits)

The app uses the [USDA FoodData Central](https://fdc.nal.usda.gov/) API for food search. Without your own key it uses a demo key with **very low rate limits** (you’ll hit “rate limit exceeded” quickly). A free key gives you 1,000 requests/hour.

1. Go to [FoodData Central API key signup](https://fdc.nal.usda.gov/api-key-signup.html) and request a key.
2. In the project root, create `api/.env`:

```bash
FDC_API_KEY=your_key_here
```

3. Restart the API server. If you hit the rate limit, use **Enter manually** to add foods until the limit resets or you add a key.

### 2. Database (production: PostgreSQL)

- **Development**: No config. The API uses SQLite and creates `api/health.db` automatically.
- **Production**: Set `DATABASE_URL` in the environment to a PostgreSQL connection string. On startup the API runs `api/schema-postgres.sql` to create tables and indexes if they don’t exist.

Example `api/.env` for production (see also `api/.env.example`):

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
FDC_API_KEY=your_key_here
```

### 3. Run the API

```bash
cd api
npm install
npm run dev
```

API runs at **http://localhost:3001**.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` to the backend.

## Production deployment

### Environment variables

**API** (`api/.env` or your host’s env):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Production only | PostgreSQL connection string (e.g. `postgresql://user:password@host:5432/dbname`). If unset, the API uses SQLite and `api/health.db`. |
| `PORT` | No | Port the API listens on (default `3001`). |
| `FDC_API_KEY` | Recommended | USDA FoodData Central API key for food search. Without it, a demo key with strict rate limits is used. |
| `CORS_ORIGIN` | No | Allowed origin for CORS (e.g. `https://myapp.com`). If unset, all origins are allowed. |

**Frontend** (set at **build time**; Vite embeds `VITE_*` into the bundle):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL the frontend calls. Use when the API is on a different origin than the app. Examples: `https://api.myapp.com` (no trailing slash), or `https://myapp.com/api` if the API is under a path. If unset, the app uses relative `/api` (same origin or reverse proxy). See `frontend/.env.example`. |

### Build and run

1. **API**
   - Set `DATABASE_URL` (and optionally `PORT`, `FDC_API_KEY`, `CORS_ORIGIN`) in the environment.
   - Run `npm install` and `npm start` in `api/` (or use your process manager).

2. **Frontend**
   - If the API is on a different host or path, set `VITE_API_URL` when building, e.g.:
     ```bash
     cd frontend
     npm install
     VITE_API_URL=https://api.myapp.com npm run build
     ```
   - Serve the `frontend/dist/` folder with any static host (Nginx, Vercel, Netlify, etc.).

### CORS

If the frontend is served from a different origin than the API (e.g. app at `https://myapp.com`, API at `https://api.myapp.com`), the API must allow that origin. Set `CORS_ORIGIN` to your frontend URL (e.g. `https://myapp.com`) so the API only allows that origin; leave it unset to allow all origins.

### Render (two separate services)

Deploy the API and frontend as **two separate services** on [Render](https://render.com).

**Service 1 — API (Web Service)**

- **Root directory:** `api`
- **Build command:** `npm ci` (or `npm install` if you prefer)
- **Start command:** `npm start`
- **Environment variables:**
  - `DATABASE_URL` — your PostgreSQL connection string (required for production)
  - `FDC_API_KEY` — USDA API key (recommended)
  - `CORS_ORIGIN` — set to your frontend URL (e.g. `https://your-frontend.onrender.com`) so the API allows that origin

Render sets `PORT`; the API uses it.

**If the API build fails** with `npm error Exit handler never called!` (common on Render’s free tier when building native modules like `better-sqlite3`):

1. **Pin Node version:** The API has `api/.nvmrc` set to `20` so Render uses Node 20 LTS (avoids version mismatch with local Node 24 and can fix the npm error). Redeploy after committing.
2. In the **API** service on Render, go to **Environment** and add: **Key** `NODE_OPTIONS`, **Value** `--max-old-space-size=460`. Then trigger a new deploy.
3. If it still fails, try **Build command** `npm ci --prefer-offline --no-audit` or upgrade the service to a plan with more memory.

**Service 2 — Frontend**

You can use either a **Static Site** or a **Web Service**.

- **Root directory:** `frontend`
- **Build command:** `npm install && npm run build`
- **Environment variable (build time):** `VITE_API_URL` — your API base URL (e.g. `https://your-api.onrender.com`, no trailing slash)

Then either:

- **Static Site:** set **Publish directory** to `dist`. Add a redirect rule so all routes serve `index.html` (for React Router); on Render this is usually configured for SPAs.
- **Web Service:** **Start command:** `npm start` (serves `dist` with `serve`; Render sets `PORT`).

**Summary:** `VITE_API_URL` is the API base URL the frontend calls. `CORS_ORIGIN` on the API is the frontend origin to allow.

**If the API or frontend build fails** (e.g. "Exit handler never called" or OOM on the free tier), try adding `NODE_OPTIONS` = `--max-old-space-size=460` in that service’s Environment on Render.

## Features

- **Daily log**: Pick a date, add meals, add ingredients per meal via USDA search or manual entry. View calorie and macro totals for the day. Log weight for any day.
- **Today**: Quick view of today’s totals and weight with links to edit.
- **Trends**: Dashboards for weight over time and daily calories/macros over time (date range configurable).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/meals?date=YYYY-MM-DD` | List meals for date |
| POST | `/api/meals` | Create meal (body: `date`, `name`) |
| PATCH | `/api/meals/:id` | Update meal name |
| DELETE | `/api/meals/:id` | Delete meal and ingredients |
| POST | `/api/meals/:id/ingredients` | Add ingredient (body: name, calories, protein, carbs, fat, fiber, sodium; or fdc_id + quantity + serving_grams) |
| DELETE | `/api/meals/:mealId/ingredients/:id` | Remove ingredient |
| GET | `/api/totals/:date` | Daily totals (calories, macros) |
| GET | `/api/foods/search?q=...` | Search USDA foods |
| GET | `/api/foods/:fdcId` | Get food by FDC ID |
| GET | `/api/weight/:date` | Get weight for date |
| POST | `/api/weight` | Set weight (body: `date`, `weight_lbs`) |
| DELETE | `/api/weight/:date` | Remove weight entry |
| GET | `/api/trends/weight?from=&to=` | Weight trend |
| GET | `/api/trends/macros?from=&to=` | Daily macros trend |
