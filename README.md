<div align="center">
  <img src="./public/logo.svg" alt="Ethio-Global Academy Teacher Portal" width="180" height="180">
  <br><br>
  <h1>Kelem Parent Dashboard</h1>
  <p><em>Parent-facing academic dashboard for attendance, grades, assignments, schedules, and school communication.</em></p>
  <br>
  <p>
    <strong>Course:</strong> Software Engineering Final Year Project<br>
    <strong>Institution:</strong> Addis Ababa Science and Technology University
  </p>
  <br>
  <p>
    <strong>Collaborators:</strong><br>
    <a href="https://github.com/fitiha">fitiha</a> ·
    <a href="https://github.com/NahomTesM">NahomTesM</a> ·
    <a href="https://github.com/oddegen">oddegen</a> ·
    <a href="https://github.com/RobelD420">RobelD420</a> ·
    <a href="https://github.com/Tonetor777">Tonetor777</a>
  </p>
</div>

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Configuration](#environment-configuration)
7. [Available Scripts](#available-scripts)
8. [Testing](#testing)
9. [API Integration](#api-integration)

---

## Project Overview

The Parent Dashboard is a Next.js web application for parents to follow their children’s academic progress in one place. It brings together attendance, grades, assignments, schedules, notifications, and parent-teacher messaging in a mobile-friendly dashboard.

---

## Features

| Area | What it provides |
|---|---|
| **Dashboard** | Child overview, quick stats, and shortcuts to the most-used parent workflows |
| **Attendance** | Attendance history, summaries, and parent-reported absence logging |
| **Grades** | Subject grades and gradebook-style academic breakdowns |
| **Assignments** | Assignment lists, due-state tracking, and homework confirmation flows |
| **Messages** | Parent-teacher messaging threads and reply flows |
| **Notifications** | Child-specific school and academic notifications |
| **Schedule & Planner** | Weekly schedule and academic calendar access |
| **Multi-child support** | Switch between linked children from the same parent account |
| **Responsive UI** | Separate mobile and desktop navigation patterns for easier parent access |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Data Fetching | TanStack Query |
| HTTP Client | Axios |
| Mocking | MSW |
| Charts | Recharts |
| Icons | Lucide React |
| Animation | Motion |
| Testing | Vitest + jsdom |

---

## Project Structure

```text
src/
├── app/                     # Next.js app entry, layout, providers, tests
├── components/
│   ├── features/            # Feature modules (attendance, grades, messages, etc.)
│   └── ui/                  # Shared UI building blocks
├── hooks/                   # Data and workflow hooks
├── lib/                     # Config, API client, utilities, constants
├── mocks/                   # Mock Service Worker setup and handlers
├── services/                # API-facing service modules
├── styles/                  # Global styles
└── types/                   # API and UI type definitions
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
git clone <your-repo-url>
cd Parent-Site
npm install
```

### Run Locally

1. Copy the environment file:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with your backend settings.

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

---

## Environment Configuration

The app currently depends on these frontend environment variables:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL for the backend API |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | No | Request timeout in milliseconds |

### Example

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_API_TIMEOUT_MS=10000
```

Notes:

- If `NEXT_PUBLIC_API_BASE_URL` is missing, the app throws at startup.

---

## Available Scripts

```bash
npm run dev       # Start Next.js dev server on port 3000
npm run build     # Build for production
npm run start     # Start the production server
npm run lint      # Run Next.js linting
npm run test      # Run Vitest test suite once
npm run test:watch
```

---

## Testing

This project uses **Vitest** for unit and component testing.

Run the full suite:

```bash
npm run test
```

Test coverage currently includes:

- feature module behavior
- custom hooks
- config and API client utilities
- shared UI error handling

---

## API Integration

Important integration points:

- The documented base path prefix is `/v1`
- Authentication uses access tokens plus refresh flow
- The frontend retries after `401` by attempting token refresh
- When mocks are enabled, MSW intercepts matching API requests in the browser

---

<div align="center">
  <p>
    <strong>Addis Ababa Science and Technology University</strong><br>
    Faculty of Electrical and Computer Engineering<br>
    Department of Software Engineering
  </p>
  <p>
    <em>© 2026 Kelem Parent Dashboard. All rights reserved.</em>
  </p>
</div>

