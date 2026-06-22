# 🌐 Sniply — Client Dashboard App

This is the frontend client application for Sniply, built with **React**, **TypeScript**, and **Vite**. It provides an
intuitive, high-performance web panel where users can shorten links, access analytics, and manage their personal
collections.

---

## ✨ Features Built-In

* **Advanced Layout Design**: Configured with the modern **shadcn/ui (v4)** components using the cohesive **Radix
  Engine + Vega Design Preset**.
* **Zero-Config Utilities**: Styled with **Tailwind CSS v4**, taking advantage of the high-speed Rust compiler and fully
  automated component class detection.
* **Mock Environment Resilience**: Configured setup hooks protecting test suites from standard browser runtime layout
  exceptions (such as `ResizeObserver` and `navigator.clipboard`).
* **Environment Safeguards**: Frontfaced variable parsing strictly requiring variables to be prefixed with `VITE_` to
  protect developer secrets.

---

## 🛠️ Technology Highlights

* **Framework**: React 18 / 19 with TypeScript
* **Build Engine**: Vite v8
* **Styling Layer**: Tailwind CSS v4 via `@tailwindcss/vite`
* **Component Primitives**: shadcn/ui + Radix UI Core
* **Test Automation**: Vitest + React Testing Library
* **DOM Runtime Simulation**: jsdom

---

## 🚀 Getting Started

### 1. Configure Local Environment Variables

Create a `.env` file in the root of this folder (or verify it matches the structural blueprint in `.env.example`):

```env
VITE_API_URL=http://localhost:5173
```

### 2. Launch Local Development Server

From the root repository directory (using workspace routing) or inside this folder, boot up your client server:

```bash
npm run dev
```

The app will run locally at [http://localhost:5173/](http://localhost:5173/). All client requests sent to `/api` are
automatically proxied through Vite directly to your backend server running on port `5000`.

### 3. Run Frontend Test Suites

Execute component checks, UI assertions, and state machine validation tests using Vitest:

```bash
npm run test
```

---

## 📂 Structural Codebase Overview

```text
src/
├── assets/         # Global static images, logos, and vector art assets
├── components/     # Atomic shadcn/ui layouts (Buttons, Inputs, Dialogs)
├── context/        # Authentication, Session states, and Global Contexts
├── lib/            # Shared utility definitions (Axios clients, class mergers)
├── pages/          # Full page structural modules (Login, Dashboard, Landing)
├── services/       # Core API fetch requests matching backend routes
├── tests/          # Vitest configurations and mock lifecycle scripts
└── types/          # Strict TypeScript interface and type mappings
```
