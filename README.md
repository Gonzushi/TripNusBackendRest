# TripNus Backend REST

> Backend service for **TripNus** — a motorcycle ride-hailing platform providing real-time ride booking, fare estimation, driver/rider management, and secure payment processing.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Local Development](#local-development)
  - [Production Build](#production-build)
  - [Docker](#docker)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Authentication](#authentication)
  - [Driver](#driver)
  - [Rider](#rider)
  - [Ride](#ride)
  - [Fare](#fare)
  - [Payment](#payment)
  - [Transactions](#transactions)
  - [Reviews](#reviews)
  - [Driver Bank Accounts](#driver-bank-accounts)
  - [Disbursement Channels](#disbursement-channels)
  - [Xendit Webhooks](#xendit-webhooks)
  - [Guests](#guests)
  - [Utils](#utils)
- [Authentication & Security](#authentication--security)
- [Background Jobs](#background-jobs)
- [Push Notifications](#push-notifications)
- [Swagger / API Docs](#swagger--api-docs)
- [CI/CD](#cicd)
- [Scripts Reference](#scripts-reference)

---

## Overview

TripNus Backend REST is a **Node.js + Express** REST API written in **TypeScript**. It powers the TripNus ride-hailing mobile app (built with Expo/React Native) by exposing endpoints for:

- User registration, login, and token management via **Supabase Auth**
- Driver and rider profile management (with photo upload)
- Real-time ride lifecycle: creation → matching → pickup → dropoff → payment confirmation
- Dynamic fare calculation based on distance and duration
- Payments via **Midtrans (GoPay)** and **Xendit (QRIS)**
- Driver earnings, wallet top-ups, and disbursements
- Push notifications via **Expo Push Notification Service**
- Background ride-matching queues powered by **BullMQ + Redis**

---

## Architecture

```
Mobile App (Expo)
       │
       ▼
  Express REST API  ──►  Supabase (PostgreSQL + Auth + Storage)
       │
       ├──► Redis (caching + pub/sub + BullMQ queues)
       ├──► Firebase Admin (FCM notifications)
       ├──► Expo Push Service (Expo notifications)
       ├──► Midtrans (GoPay payments)
       └──► Xendit (QRIS payments + disbursements)
```

The API uses **dual Supabase projects** (primary + secondary) allowing isolation between services or regions. JWT tokens issued by Supabase are verified server-side with `jsonwebtoken` using the `SUPABASE_JWT_SECRET`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 22 |
| Framework | Express 5 |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + JWT |
| Cache / Queue | Redis (ioredis) + BullMQ |
| Push Notifications | Expo Push SDK + Firebase Admin |
| Payments | Midtrans (GoPay), Xendit (QRIS + disbursements) |
| File Storage | Supabase Storage (via multer, in-memory) |
| Process Manager | PM2 |
| Containerization | Docker (multi-stage build) |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| CI/CD | GitHub Actions → Docker Hub → Coolify |

---

## Project Structure

```
TripNusBackendRest/
├── src/
│   ├── index.ts                    # App entry point, route mounting
│   ├── swagger.ts                  # Swagger/OpenAPI setup
│   ├── supabaseClient.ts           # Supabase client instances (primary + secondary)
│   ├── config/
│   │   ├── firebaseConfig.ts       # Firebase Admin SDK initialization
│   │   └── redisConfig.ts          # Redis + BullMQ connection config
│   ├── controllers/
│   │   ├── authController.ts       # Register, login, token refresh, password reset
│   │   ├── driverController.ts     # Driver profile CRUD, nearby drivers
│   │   ├── riderController.ts      # Rider profile CRUD + photo upload
│   │   ├── rideController.ts       # Full ride lifecycle management
│   │   ├── fareController.ts       # Fare calculation logic
│   │   ├── paymentController.ts    # Midtrans GoPay payment initiation
│   │   ├── transactionController.ts# Wallet top-ups, withdrawals, ride transactions
│   │   ├── reviewController.ts     # Post-ride reviews
│   │   ├── driverBankAccountController.ts  # Driver bank account management
│   │   ├── disbursementChannelController.ts # Xendit disbursement channels
│   │   ├── xenditController.ts     # Xendit webhook handlers (QRIS + disbursement)
│   │   ├── guestController.ts      # Guest/invitation management
│   │   └── utilsController.ts      # Utility endpoints
│   ├── middlewares/
│   │   ├── authHandler.ts          # JWT Bearer token verification
│   │   └── errorHandler.ts         # Global JSON parse + general error handlers
│   ├── queues/
│   │   └── rideMatchQueue.ts       # BullMQ queue for ride-matching jobs
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── driverRoutes.ts
│   │   ├── riderRoutes.ts
│   │   ├── rideRoutes.ts
│   │   ├── fareRoutes.ts
│   │   ├── paymentRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   ├── reviewRoutes.ts
│   │   ├── driverBankAccountRoute.ts
│   │   ├── disbursementChannelRoute.ts
│   │   ├── xenditRoutes.ts
│   │   ├── guestRoutes.ts
│   │   ├── healthRoutes.ts
│   │   └── utilsRoutes.ts
│   ├── services/
│   │   ├── notificationService.ts  # Expo push notification helpers
│   │   └── xendit.ts               # Xendit API client helpers
│   └── types/
│       ├── auth.d.ts               # DecodedToken type
│       ├── express.d.ts            # Express Request augmentation (req.user)
│       └── midtrans-client.d.ts    # Midtrans client type declarations
├── scripts/
│   └── ngrok.js                    # Helper to expose local server via ngrok
├── Dockerfile.prod                 # Multi-stage production Docker image
├── .github/
│   └── workflows/
│       └── docker-publish.yml      # CI/CD: build → push to Docker Hub → deploy via Coolify
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- **Node.js** `>= 22.x < 23.x`
- **npm** `>= 10`
- **Redis** instance (local or managed, e.g. Upstash)
- **Supabase** project(s) with:
  - Auth enabled
  - A `users` table (and all relevant domain tables)
  - Storage bucket for profile pictures
- **Firebase** project with a service account (for push notifications)
- **Midtrans** merchant account (for GoPay payments)
- **Xendit** account (for QRIS payments and disbursements)
- **Expo** project (for push notification tokens)

---

## Environment Variables

Create a `.env` file at the project root. Below are all required variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase (Primary)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_ROLE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Supabase (Secondary — optional second project)
SUPABASE_URL_2=https://your-second-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY_2=your-second-service-role-key
SUPABASE_ANON_ROLE_KEY_2=your-second-anon-key

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Firebase (paste the JSON as a single-line string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Midtrans
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

# Xendit
XENDIT_SECRET_KEY=your-xendit-secret-key
XENDIT_WEBHOOK_TOKEN=your-xendit-webhook-verification-token

# Build metadata (injected automatically by CI/CD)
GIT_COMMIT=
BUILD_TIME=
```

> **Never** commit your `.env` file. It is already listed in `.gitignore`.

---

## Getting Started

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Start the dev server with hot reload
npm run dev
```

The server starts on `http://localhost:3000`. Swagger UI is available at `http://localhost:3000/docs`.

To expose your local server publicly (e.g. for webhook testing with Midtrans/Xendit):

```bash
npm run ngrok
```

### Production Build

```bash
# Compile TypeScript to JavaScript
npm run build

# Start with PM2 (cluster mode)
npm start

# Stop the PM2 process
npm stop
```

### Docker

```bash
# Build the production image
npm run docker-build

# Run the container (reads .env file)
npm run docker-start

# Stop and remove the container
npm run docker-stop && npm run docker-rm

# View container logs
npm run docker-logs

# Open a shell inside the container
npm run docker-content
```

The Docker image uses a **multi-stage build**: a `builder` stage compiles TypeScript, and the final `node:22-slim` stage contains only the compiled `dist/` and production `node_modules`. PM2 runs in cluster mode inside the container via `pm2-runtime`.

---

## API Reference

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

### Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | Returns server status, version, uptime, memory, CPU, Supabase reachability, Redis reachability, and deployment metadata. |

### Authentication

Base path: `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register a new user with email and password. Sends activation email. |
| `POST` | `/auth/resend-activation` | No | Resend the account activation email. |
| `POST` | `/auth/login` | No | Log in with email and password. Returns access token and refresh token. |
| `POST` | `/auth/refresh-token` | No | Exchange a refresh token for a new access token. |
| `POST` | `/auth/logout` | Yes | Invalidate the current session. |
| `POST` | `/auth/reset-password` | No | Send a password reset email. |
| `POST` | `/auth/change-password` | Yes | Change the authenticated user's password. |
| `PUT` | `/auth/phone` | Yes | Update the authenticated user's phone number. |
| `GET` | `/auth/jwt-check` | Yes | Validate the current JWT token and return decoded payload. |

### Driver

Base path: `/driver` — All routes require authentication.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/driver/profile` | Create a driver profile (user identified from token). |
| `GET` | `/driver/profile` | Get the authenticated driver's profile. |
| `PUT` | `/driver/profile` | Update the authenticated driver's profile. |
| `POST` | `/driver/profile/picture` | Upload a profile picture (`multipart/form-data`). |
| `GET` | `/driver/nearby` | Get list of nearby available drivers (requires `latitude`, `longitude` query params). |

### Rider

Base path: `/rider` — All routes require authentication.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/rider/profile` | Create a rider profile (user identified from token). |
| `GET` | `/rider/profile` | Get the authenticated rider's profile. |
| `PUT` | `/rider/profile` | Update the authenticated rider's profile. |
| `POST` | `/rider/profile/picture` | Upload a profile picture (`multipart/form-data`). |

### Ride

Base path: `/ride` — All routes require authentication.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ride` | Create a new ride request (rider side). Queues ride-matching job. |
| `GET` | `/ride/rider` | Get the current active ride for the authenticated rider. |
| `GET` | `/ride/driver` | Get the current active ride for the authenticated driver. |
| `PUT` | `/ride/:rideId/confirm` | Driver confirms/accepts a ride. |
| `PUT` | `/ride/:rideId/reject` | Driver rejects a ride. |
| `PUT` | `/ride/:rideId/cancel-driver` | Driver cancels the ride. |
| `PUT` | `/ride/:rideId/cancel-rider` | Rider cancels the ride (before pickup). |
| `PUT` | `/ride/:rideId/arrived` | Driver marks arrival at pickup location. |
| `PUT` | `/ride/:rideId/pickup` | Driver confirms passenger pickup. |
| `PUT` | `/ride/:rideId/dropoff` | Driver confirms passenger dropoff. |
| `PUT` | `/ride/:rideId/payment` | Driver confirms payment received. |
| `PUT` | `/ride/:rideId` | Generic ride update (status or metadata). |
| `GET` | `/ride/history/rider` | Get ride history for the authenticated rider. |
| `GET` | `/ride/history/driver` | Get ride history for the authenticated driver. |

### Fare

Base path: `/fare` — Requires authentication.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/fare/calculate` | Calculate fare given `distanceM` (meters) and `durationSec` (seconds). Returns base fare, distance fare, duration fare, platform fee, driver earning, app commission, and total. |

### Payment

Base path: `/payment` — Requires authentication.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/payment/gopay` | Initiate a GoPay payment via Midtrans for a ride. |
| `POST` | `/payment/gopay/refund` | Refund a GoPay payment. |
| `POST` | `/payment/webhook/midtrans` | Midtrans webhook receiver for payment status updates (no auth, verified by Midtrans signature). |

### Transactions

Base path: `/transactions` — Requires authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/transactions/by-ride/:rideId` | Get the transaction record for a specific ride. |
| `GET` | `/transactions/driver` | Get all transactions for the authenticated driver. |
| `POST` | `/transactions/topup` | Create a wallet top-up transaction. |
| `POST` | `/transactions/topup/cancel` | Cancel a pending top-up transaction. |
| `POST` | `/transactions/withdrawal` | Request a driver wallet withdrawal/disbursement. |

### Reviews

Base path: `/reviews` — Requires authentication.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/reviews` | Submit a post-ride review. Body: `ride_id`, `reviewer_id`, `reviewee_id`, `reviewee_type`, `rating`, optional `comment`. |

### Driver Bank Accounts

Base path: `/driver-bank-accounts` — Requires authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/driver-bank-accounts/bank-accounts` | Get the authenticated driver's saved bank account. |
| `POST` | `/driver-bank-accounts/bank-accounts` | Save or update the driver's bank account. |

### Disbursement Channels

Base path: `/disbursement-channels` — Requires authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/disbursement-channels` | List all available disbursement channels (banks). |

### Xendit Webhooks

Base path: `/xendit` — No authentication (verified by Xendit webhook token).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/xendit/webhook/qr-payment` | Receives QRIS payment status updates from Xendit (`COMPLETED` / `EXPIRED`). |
| `POST` | `/xendit/webhook/disbursement` | Receives disbursement status updates from Xendit. |
| `POST` | `/xendit/simulate/qr-payment` | (Development only) Simulate a QRIS payment completion. |

### Guests

Base path: `/guests` — No authentication required.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/guests` | Create a new guest/invitation entry. |
| `GET` | `/guests` | List all guests. |
| `GET` | `/guests/:id` | Get a guest by ID. |
| `PUT` | `/guests/:id` | Update a guest entry. |
| `DELETE` | `/guests/:id` | Delete a guest entry. |
| `GET` | `/guests/wish/:id` | Get a wish/message by guest ID. |
| `GET` | `/guests/to/:to` | Get guest entries addressed to a specific recipient. |
| `POST` | `/guests/:id/view` | Record an invitation view event. |
| `GET` | `/guests/:id/view-summary` | Get invitation view analytics summary. |

### Utils

Base path: `/utils` — No authentication required.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/utils/...` | Utility/helper endpoints. |

---

## Authentication & Security

The API uses **Supabase-issued JWT tokens** for authentication. Every protected route passes through the `authenticateUser` middleware which:

1. Reads the `Authorization: Bearer <token>` header.
2. Verifies the JWT signature using `SUPABASE_JWT_SECRET`.
3. Attaches the decoded payload to `req.user` for downstream use.

**Error codes returned by auth middleware:**

| Code | HTTP Status | Meaning |
|---|---|---|
| `AUTH_HEADER_MISSING` | 401 | No or malformed `Authorization` header |
| `INVALID_TOKEN` | 401 | Token verification failed or expired |

---

## Background Jobs

Ride matching is handled asynchronously via a **BullMQ** queue backed by Redis.

When a rider creates a ride (`POST /ride`), a job is added to the `ride-matching` queue. A separate worker process (not in this repo) consumes jobs from this queue and handles driver assignment logic.

The queue uses a dedicated Redis connection with `maxRetriesPerRequest: null` as required by BullMQ.

---

## Push Notifications

Push notifications are sent using the **Expo Push Notification Service** via `expo-server-sdk`. The `notificationService.ts` module provides:

- `sendPushNotification(token, { title, body, data })` — Sends a high-priority push notification to a single Expo push token.
- `handleNotificationReceipts(tickets)` — Polls Expo for delivery receipts (useful for error tracking).

Firebase Admin SDK is also initialized for FCM integration (`firebaseConfig.ts`), with credentials loaded from the `FIREBASE_SERVICE_ACCOUNT` environment variable as a JSON string.

---

## Swagger / API Docs

Interactive API documentation is served at:

```
http://localhost:3000/docs
```

All routes are documented with JSDoc-style `@swagger` annotations directly in the route files. The Swagger spec is assembled at startup via `swagger-jsdoc` and served with `swagger-ui-express`.

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/docker-publish.yml`) runs on every push to `main`:

1. **Checks out** the code.
2. **Logs in** to Docker Hub using `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets.
3. **Builds** the Docker image tagged as `:latest` and `:<short-git-sha>`, injecting `GIT_COMMIT` and `BUILD_TIME` build args.
4. **Pushes** both tags to `hendrywidyanto/tripnus-backend-rest` on Docker Hub.
5. **Triggers a Coolify deployment** via a webhook (`COOLIFY_DEPLOY_HOOK` + `COOLIFY_API_TOKEN` secrets).

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |
| `COOLIFY_DEPLOY_HOOK` | Coolify webhook URL for deployment trigger |
| `COOLIFY_API_TOKEN` | Coolify API bearer token |

---

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server with hot reload via `ts-node-dev` |
| `build` | `npm run build` | Compile TypeScript to `dist/` |
| `start` | `npm start` | Start/reload via PM2 in cluster mode |
| `stop` | `npm stop` | Stop PM2 process |
| `ngrok` | `npm run ngrok` | Expose local server via ngrok tunnel |
| `docker-build` | `npm run docker-build` | Build production Docker image |
| `docker-start` | `npm run docker-start` | Run container on port 3000 |
| `docker-stop` | `npm run docker-stop` | Stop running container |
| `docker-rm` | `npm run docker-rm` | Remove stopped container |
| `docker-delete` | `npm run docker-delete` | Stop, remove, and delete the image |
| `docker-logs` | `npm run docker-logs` | Tail container logs |
| `docker-tag` | `npm run docker-tag` | Tag image for Docker Hub |
| `docker-push` | `npm run docker-push` | Push image to Docker Hub |
| `zip` | `npm run zip` | Create a zip archive (excluding `node_modules` and `dist`) |

---

## License

ISC
