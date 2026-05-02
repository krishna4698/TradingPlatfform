# TradingPlatform

TradingPlatform is a full-stack crypto trading simulator built as an npm/Turborepo monorepo. It includes a Next.js frontend, an Express API, a Redis-backed matching/position engine, a live price poller, and shared database/Redis/config packages.

The current product focuses on BTC/USDC trading. Users can register, log in, deposit USDC, view BTC market data, open long or short leveraged positions, set take-profit and stop-loss prices, close orders manually, and track order history and PnL.

## Tech Stack

- **Monorepo:** Turborepo, npm workspaces
- **Frontend:** Next.js 16, React 19, Tailwind CSS, TanStack Query, lightweight-charts
- **API:** Express 5, Zod, JWT auth, bcrypt, cookie-based sessions
- **Engine:** Node.js/TypeScript service consuming Redis streams
- **Market data:** Backpack Exchange WebSocket and REST APIs
- **Database:** PostgreSQL with Prisma
- **Messaging:** Redis streams with ioredis
- **Language:** TypeScript

## Workspace Layout

```text
.
|-- apps
|   |-- api                  # Express HTTP API
|   |-- engine               # Redis stream consumer and order/PnL engine
|   |-- price-poller-service # Backpack WebSocket price feed -> Redis stream
|   `-- web                  # Next.js frontend
|-- packages
|   |-- db                   # Prisma client, schema, migrations
|   |-- redis                # Shared Redis client
|   |-- ui                   # Shared React UI package
|   |-- eslint-config        # Shared ESLint configs
|   `-- typescript-config    # Shared TypeScript configs
|-- package.json
|-- turbo.json
`-- README.md
```

## How It Works

The system is split into four main runtime services:

1. **Web app** runs on `http://localhost:3000`.
2. **API server** runs on `http://localhost:3001` by default and handles auth, balances, candles, and trade requests.
3. **Price poller** connects to Backpack Exchange WebSocket market data and writes BTC/USDC price updates into the Redis `engine-stream` for now.
4. **Engine** consumes `engine-stream`, maintains open orders in memory, persists order snapshots to PostgreSQL, updates balances, and writes responses to the Redis `callback-queue`.

Order creation flow:

```text
Frontend -> API -> Redis engine-stream -> Engine -> PostgreSQL(like updation of balances ans pnl) -> Redis callback-queue -> API -> Frontend
```

The API waits briefly for an engine callback when opening or closing an order. This keeps the frontend response tied to the actual engine result instead of only confirming that a request was queued.

## Features

- User registration and login
- JWT authentication stored in an HTTP-only cookie
- Authenticated `/auth/me` session check
- USDC balance deposit and balance polling
- BTC/USDC chart data from Backpack candles
- Live BTC price/order data through Backpack WebSocket usage in the app and poller
- Long and short order creation
- Leverage, quantity, take-profit, and stop-loss inputs
- Manual order close
- Engine-side balance deduction and crediting
- PnL calculation
- Automatic closure by take profit, stop loss, or liquidation checks
- Order persistence and order history

## Prerequisites

Install these before running the project locally:

- Node.js `>=18`
- npm `10.9.7` or compatible
- PostgreSQL database
- Redis server

The repository includes a `.nvmrc`, so if you use nvm you can run:

```bash
nvm use
```

## Environment Variables

Create a `.env` file in the repository root. The shared database and Redis packages load environment variables from the root `.env`.

```env
# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/trading_platform"

# Redis
REDIS_URL="redis://localhost:6379"
# Or use these instead of REDIS_URL:
# REDIS_HOST="127.0.0.1"
# REDIS_PORT="6379"
# REDIS_PASSWORD=""
# REDIS_DB="0"

# API
PORT="3001"
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="replace-this-with-a-strong-secret"

# Web
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Notes:

- `DATABASE_URL` is required by `packages/db`.
- `REDIS_URL` is optional if you provide host/port values or run Redis locally on `127.0.0.1:6379`.
- `JWT_SECRET` defaults to `secret` in code, but you should always set a real value.
- In production, cookies are configured with `secure: true` and `sameSite: "none"` when `NODE_ENV=production`.

## Installation

Install all workspace dependencies from the repository root:

```bash
npm install
```

Generate the Prisma client:

```bash
npm --workspace @repo/db run db:generate
```

Apply database migrations:

```bash
npm --workspace @repo/db run db:migrate
```

For quick local schema sync without creating a migration, you can use:

```bash
npm --workspace @repo/db run db:push
```

## Running Locally

Start PostgreSQL and Redis first.

Then run the whole monorepo:

```bash
npm run dev
```

Because the services are persistent, Turborepo will run the available `dev` scripts together.

You can also run services individually:

```bash
npm --workspace web run dev
npm --workspace api run dev
npm --workspace engine run dev
npm --workspace price-poller-service run dev
```

Local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API health check: `http://localhost:3001/health`

Recommended startup order when running services manually:

1. PostgreSQL
2. Redis
3. API
4. Engine
5. Price poller
6. Web

The engine needs Redis and PostgreSQL. The API also needs Redis and PostgreSQL. The price poller needs Redis and external network access to Backpack Exchange.

## Scripts

Root scripts:

```bash
npm run dev          # Run all workspace dev tasks through Turbo
npm run build        # Build all workspaces
npm run lint         # Run lint tasks
npm run check-types  # Run type checks
npm run format       # Format TypeScript, TSX, and Markdown files
```

Database package scripts:

```bash
npm --workspace @repo/db run db:generate
npm --workspace @repo/db run db:migrate
npm --workspace @repo/db run db:push
npm --workspace @repo/db run db:studio
```

Service scripts:

```bash
npm --workspace web run dev
npm --workspace api run build
npm --workspace api run start
npm --workspace engine run build
npm --workspace engine run start
npm --workspace price-poller-service run build
npm --workspace price-poller-service run start
```

## API Overview

Base URL in local development:

```text
http://localhost:3001
```

Auth routes:

- `POST /auth/register` - create a user
- `POST /auth/login` - log in and set the `token` cookie
- `GET /auth/me` - return the current user from the cookie
- `POST /auth/logout` - clear the auth cookie

Balance routes:

- `GET /balance` - get authenticated user balances
- `POST /balance/deposit` - deposit balance for the authenticated user

Trade routes:

- `POST /trade/open` - create an order through the engine
- `POST /trade/close` - close an open order through the engine
- `GET /trade/getorders` - list authenticated user orders

Market data route:

- `GET /getcandles` - fetch candles from Backpack Exchange

Example candle query:

```text
/getcandles?asset=BTCUSDC&ts=1h
```

## Redis Streams

The app uses Redis streams for asynchronous communication between the API, price poller, and engine.

### `engine-stream`

Consumed by `apps/engine`.

Message examples:

- `price-update` from the price poller
- `create_order` from the API
- `close-order` from the API

### `callback-queue`

Consumed by the API subscriber. The engine writes callbacks here so API requests can resolve with the final engine result.

Common statuses include:

- `created`
- `insufficientBalance`
- `priceNotReady`
- `no order found`

## Database Models

Prisma models live in `packages/db/prisma/schema.prisma`.

Main models:

- `User` - stores account identity and password hash
- `Asset` - stores user balances by symbol
- `Order` - stores order status, side, PnL, leverage, quantity, opening/closing prices, and close reason

Supported symbols in the current schema:

- `USDC`
- `BTC`

Supported order sides:

- `long`
- `short`

Supported order statuses:

- `open`
- `closed`

Supported close reasons:

- `TakeProfit`
- `StopLoss`
- `Manual`
- `Liquidation`

## Development Notes

- The app currently centers on BTC/USDC.
- The engine keeps open orders and balances in memory and also writes snapshots to PostgreSQL.
- The engine reloads open orders and balances from the database on startup.
- Order prices and PnL are stored in scaled integer form in PostgreSQL:
  - prices/PnL use 4 decimals in many fields
  - quantities use 2 decimals
- The frontend polls balance and orders every 2 seconds through TanStack Query.
- Backpack Exchange is used for both candle data and live price feed data.

## Troubleshooting

### `DATABASE_URL is not set`

Add `DATABASE_URL` to the root `.env` file or to `packages/db/.env`.

### Orders are rejected with `priceNotReady`

Start the price poller and engine, then wait a few seconds for the first Backpack price update to enter Redis.

### API request times out while creating or closing an order

Make sure Redis is running and the engine service is consuming `engine-stream`.

### Login works locally but cookies fail in production

Check `FRONTEND_URL`, API CORS origins, HTTPS, and `NODE_ENV=production`. Production cookies are sent with `secure` and `sameSite: "none"`.

### Candles fail to load

The candle endpoint fetches data from Backpack Exchange. Confirm the API service has external network access and the requested asset/timeframe is supported.

## Production Checklist

- Set a strong `JWT_SECRET`
- Use managed PostgreSQL and Redis instances
- Set `DATABASE_URL` and `REDIS_URL`
- Set `NEXT_PUBLIC_API_URL` to the deployed API URL
- Set `FRONTEND_URL` to the deployed web URL
- Run database migrations before starting services
- Run the API, engine, and price poller as separate long-running processes
- Configure CORS for the deployed frontend domain
- Use HTTPS for frontend and API deployments

## Current Limitations

- Trading logic is simplified and intended for a simulated environment.
- The active trading pair is BTC/USDC.
- The engine is in-memory between database snapshots, so production scaling would need stronger coordination before running multiple engine instances.
- There are placeholder `test` scripts in several packages, but no full automated test suite yet.
