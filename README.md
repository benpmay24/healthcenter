# Health Center

A personal health tracking web app: log meals with ingredients (search USDA foods or enter manually), track daily calories and macros, log weight, and view trends over time.

## Stack

- **API**: Node.js, Express, SQLite (better-sqlite3), USDA FoodData Central for food search
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

### 2. Run the API

```bash
cd api
npm install
npm run dev
```

API runs at **http://localhost:3001**.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` to the backend.

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
| POST | `/api/weight` | Set weight (body: `date`, `weight_kg`) |
| DELETE | `/api/weight/:date` | Remove weight entry |
| GET | `/api/trends/weight?from=&to=` | Weight trend |
| GET | `/api/trends/macros?from=&to=` | Daily macros trend |
