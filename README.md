# 🗂️ Project Management Frontend

A modern, type-safe, RTL-first project management frontend built with React 19 + Vite + TypeScript. Part of a full-stack system paired with a security-hardened Django REST API backend.

> **Note:** The UI is in Persian (Farsi) with full RTL layout using the Vazirmatn font. All code, comments, and configuration are in English.

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/Tests-34%2F34_passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🌟 Overview

This project is the frontend for a full-stack project management platform. It delivers a complete workspace for teams to organize projects, track tasks, collaborate through comments and reactions, and receive real-time notifications. The interface is in Persian and laid out right-to-left, targeting Persian-speaking teams.

The frontend is paired with a Django REST Framework backend that was independently hardened across five security pull-requests, closing roughly 50 vulnerabilities and shipping **337 regression tests** with zero failures. The frontend hardening pass in this repo follows the same standards: type safety end-to-end, no `any` leaking into the codebase, real token rotation, and a recoverable error layer.

The project showcases production-grade frontend discipline: a singleton API client with refresh rotation, server-state management via React Query, custom WebSocket service with reconnect logic, and a strict TypeScript surface that compiles clean and builds under 400 KB gzipped.

## ✨ Features

- 🔐 **Authentication** — JWT login/register with one-time-use refresh token rotation, protected routes, automatic 401 → refresh → retry
- 📊 **Dashboard** — Real-time stats via React Query, clickable stat cards, activity feed of recent events
- 📋 **Projects** — CRUD, member management (add/remove, role assignment), project statistics and reports
- ✅ **Tasks** — Kanban-style board with five statuses (TODO / IN_PROGRESS / IN_REVIEW / COMPLETED / BLOCKED), labels, time logging
- 👥 **Teams** — Team listing, member management, invitations, meetings, goals
- 🔔 **Notifications** — Real-time delivery over WebSocket, unread counter polling every 30 seconds, mark-as-read, preferences
- 📁 **Files** — Upload with progress tracking, list, download, delete
- 💬 **Comments** — Threaded comments with reactions, refresh on action
- 🎨 **UI** — Full Persian RTL layout with Vazirmatn font, custom dark gradient theme, lucide-react icons

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| UI Framework | React 19.2.0 |
| Build Tool | Vite 7.2 with `@vitejs/plugin-react-swc` |
| Language | TypeScript 5.9 (strict mode) |
| Routing | react-router-dom 7.10 |
| Server State | @tanstack/react-query 5.90 |
| HTTP Client | axios 1.13 (with refresh interceptor + singleton dedup) |
| WebSocket | Native WebSocket (custom reconnect service) |
| Icons | lucide-react 0.460 |
| Notifications | react-toastify 10.0 |
| Testing | vitest 4.0 + @testing-library/react + MSW |
| Linting | eslint 9 + typescript-eslint |

## 📸 Screenshots

<!-- Add screenshots here once the app is running -->
Screenshots will be added once a live deployment is available.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)

### Installation

```bash
git clone https://github.com/mirsadegh/project-management-frontend.git
cd project-management-frontend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000
```

`VITE_API_BASE_URL` is the REST API base. `VITE_WS_BASE_URL` is the WebSocket origin (no path, no trailing slash — the path `/ws/notifications/` is appended by the WebSocket service). For production, swap both to HTTPS / WSS equivalents.

### Running Locally

```bash
# Start the Django backend first (in another terminal)
cd ../manage_project
source .venv/bin/activate
python manage.py runserver

# Then start the frontend
cd ../project-management-frontend
npm run dev
```

The app will be available at http://localhost:5173.

### Running Tests

```bash
npm run test:run      # Run all tests once
npm run test          # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Vitest UI
```

### Building for Production

```bash
npm run build    # Type-check + Vite build to dist/
npm run preview  # Serve the production build locally
```

## 📁 Project Structure

```
project-management-frontend/
├── public/                       # Static assets served as-is
├── src/
│   ├── components/               # 21 React components (UI)
│   │   ├── ActivityFeed.tsx      # Recent-activity list (React Query)
│   │   ├── Dashboard.tsx         # Main dashboard with stats + activity
│   │   ├── ErrorBoundary.tsx     # App-level error fallback
│   │   ├── NotFound.tsx          # Catch-all 404
│   │   ├── TaskBoard.tsx         # Kanban task view
│   │   ├── ProjectDetail.tsx     # Project page with members + tabs
│   │   ├── ProjectSettings.tsx   # Visibility, danger zone
│   │   ├── NotificationListener.tsx # WS listener, toasts
│   │   └── ...                   # Login, Register, Profile, TeamsList, etc.
│   ├── services/                 # API + state layer
│   │   ├── api.ts                # axios instance + refresh interceptor
│   │   ├── authService.ts        # Login / register / current user
│   │   ├── projectService.ts     # Project CRUD + members + stats
│   │   ├── taskService.ts        # Task CRUD + board operations
│   │   ├── teamService.ts        # Teams + invitations + meetings
│   │   ├── notificationService.ts
│   │   ├── activityService.ts
│   │   ├── commentService.ts
│   │   ├── fileService.ts
│   │   ├── queryHooks.ts         # Typed React Query hooks
│   │   ├── websocket.ts          # Reconnecting WS service
│   │   ├── types.ts              # Centralized ApiError
│   │   ├── contexts/             # AuthContext + tests
│   │   └── pagination.ts
│   ├── tests/                # Vitest setup, MSW handlers, mocks
│   ├── utils/                # Persian label translations
│   ├── App.tsx               # Routes + providers
│   ├── App.css               # Component styles
│   └── main.tsx              # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 🧪 Testing

The test suite uses **vitest** with **jsdom** as the browser environment. API mocking is handled by **MSW** (Mock Service Worker) at the network layer — that lets interceptors and real axios code paths run unchanged, which is critical for the refresh-rotation test. **@testing-library/react** drives component tests.

Current coverage:

- **5 test files, 34 tests, all passing**
- `authService.test.ts` — 11 tests covering login, register, token storage
- `api.test.ts` — 6 tests covering the axios refresh interceptor
- `AuthContext.test.tsx` — 7 tests covering login state, logout, error paths
- `FileUpload.test.tsx` — 5 tests covering upload UX
- `Login.test.tsx` — 5 tests covering form rendering and validation

The mocking strategy intercepts at the network layer rather than mocking axios itself, which means interceptor logic (refresh rotation, singleton dedup, retry flag) is exercised end-to-end.

## 🔐 Security Features

Frontend-side hardening shipped across three commits:

- **Centralized `ApiError` type** in `src/services/types.ts` — replaces ad-hoc `err: any` and inline casts. `getErrorMessage` and `getErrorStatus` helpers ensure consistent error extraction across the app.
- **Error Boundary at app root** — catches unhandled render errors and shows a recoverable fallback with reload and clear-state options.
- **JWT refresh token rotation** — the backend uses `ROTATE_REFRESH_TOKENS` (one-time-use). The interceptor stores the rotated refresh token on every refresh; otherwise the next refresh would fail and the user would be force-logged out.
- **Concurrent refresh dedup** — multiple in-flight 401s share a single `refreshPromise` singleton, preventing race conditions where parallel requests each kick off their own refresh.
- **404 catch-all route** — unknown paths render a Persian 404 page instead of crashing.
- **Removed dead code and unused dependencies** — `CreateProject.tsx` was superseded by `CreateProjectModal` inside `ProjectsList.tsx`; `zustand` was declared but never imported.
- **TypeScript strict** — `npx tsc --noEmit` exits 0 with no `any` leaking in components.

The companion Django backend carries **337 regression tests** across five security PRs (BOLA, mass enumeration, refresh-token revocation, trusted-proxy allowlist, fail-closed virus scanning). See [`AUDIT_REPORT.md`](https://github.com/mirsadegh/manage_project) in the backend repo.

## 🌐 API Integration

The frontend talks to the backend over two channels:

**REST (axios)** — All HTTP calls go through a single `api` instance configured with `VITE_API_BASE_URL`. The request interceptor attaches the access token from `localStorage`. The response interceptor handles 401 by calling `/accounts/auth/refresh/`, storing both the new access token **and** the rotated refresh token, then retrying the original request. Refresh failures clear the session so `AuthContext` redirects to `/login`.

**WebSocket (native)** — A custom `WebSocketService` opens `ws://<VITE_WS_BASE_URL>/ws/notifications/?token=<accessToken>` and reconnects with exponential backoff on disconnect. `NotificationListener` mounts once at app root and surfaces incoming notifications as toasts.

## 📝 Related Projects

- [**Backend (Django REST Framework)**](https://github.com/mirsadegh/manage_project) — 337 tests, ~50 security vulnerabilities fixed, WebSocket via Django Channels.

## 🗺️ Roadmap

- [ ] Add i18n support (English alongside Persian)
- [ ] Dark mode toggle (currently dark theme only)
- [ ] Storybook for component documentation
- [ ] Production deployment (Vercel / Netlify)
- [ ] End-to-end tests with Playwright
- [ ] Migrate remaining inline `err: any` patterns in service files (out of scope for current commits)

## 📄 License

MIT License — see the [LICENSE](LICENSE) file for details.

## 👤 Author

**MirsadeghPor** — Security Engineer

- GitHub: [@mirsadegh](https://github.com/mirsadegh)
- Companion backend: [mirsadegh/manage_project](https://github.com/mirsadegh/manage_project)