# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- `backend/`: NestJS API. TypeScript source lives in `src/`; unit tests use Vitest and sit beside the generated test setup under `test/`.
- `frontend/`: Next.js App Router application. Source lives in `src/app/`; styling uses Tailwind CSS v4.
- The projects are independent npm applications with separate `package.json` files and `node_modules` directories. Run npm commands from the relevant directory or use `npm --prefix <directory>` from the repository root.

## Commands

### Backend

```powershell
npm --prefix backend run start:dev
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:watch
npm --prefix backend run test:cov
npm --prefix backend run test:e2e
```

Run one backend test file:

```powershell
npm --prefix backend test -- src/app.controller.spec.ts
```

### Frontend

```powershell
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run start
npm --prefix frontend run lint
```

Frontend development runs on the Next.js dev server, normally `http://localhost:3000`. Backend development runs on the NestJS server, normally `http://localhost:3000`; change one port before running both together.

## Architecture

The backend is a standalone NestJS application. `src/main.ts` bootstraps the HTTP server; `src/app.module.ts` is the root module; generated controller/service files provide the initial feature boundary. Add domain features as Nest modules under `src/`, keeping controllers at the HTTP boundary and services for application logic.

The frontend is a standalone Next.js App Router application. `src/app/layout.tsx` defines the root layout and metadata; `src/app/page.tsx` is the initial route; `src/app/globals.css` contains global Tailwind/CSS setup. Add routes as directories under `src/app/`; use server components by default and mark a component `"use client"` only when it needs browser state or event handlers.

There is currently no shared package, database, authentication layer, API client, or frontend-backend integration. Add and document those boundaries when introduced.
