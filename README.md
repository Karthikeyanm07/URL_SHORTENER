# 🔗 Sniply: High-Performance Full-Stack URL Shortener

Sniply is a modern, blazing-fast, and secure URL shortening platform built to transform long, messy web links into clean, trackable, and easily shareable short URLs. Designed with privacy, speed, and clean user experience in mind, the platform features a professional dashboard for managing links, tracking analytics, and securing user accounts.

---

## 🏗️ Monorepo Structure

This project is organized as a unified monorepo workspace dividing the ecosystem into independent layer architectures:

* **`apps/client`**: The interactive frontend built using **React**, **TypeScript**, **Vite (v8)**, **Tailwind CSS v4**, and **shadcn/ui**. Component state logic is tested using **Vitest**.
* **`apps/server`**: The secure backend API powered by **Node.js** and **TypeScript**, using **Prisma ORM** for standard relations and **Redis** for rate limiting and redirection tracking. Business services are tested using **Jest**.

---

## 🛠️ Global Installation & Local Bootup

### 1. Clone the Workspace
```bash
git clone https://github.com/Karthikeyanm07/URL_SHORTENER.git
cd URL_SHORTENER
```

### 2. Configure Local Environments
Ensure you navigate into both `apps/client` and `apps/server` to match their local configurations using their respective `.env.example` file profiles.

### 3. Run Development Environments
Run the individual project servers concurrently or independently using your localized scripts inside their corresponding directories:

* **Frontend Client (Port 5173)**: `npm run dev` (inside `apps/client`)
* **Backend API Server (Port 5000)**: `npm run dev` or equivalent boot scripts (inside `apps/server`)

---

## 🛡️ Testing & Validation Rules

Verify operational status across individual code layers by accessing their custom workspaces:
* **Client App Tests**: Execute `npm run test` inside `apps/client` for Vitest component evaluations.
* **Server Api Tests**: Execute `npm run test` inside `apps/server` for Jest endpoint evaluation blocks.
