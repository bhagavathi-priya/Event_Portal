# College Club & Event Voting Portal

A secure, responsive, and modern web application built using **React.js (Vite)**, **Tailwind CSS**, and **Role-Based Access Control (RBAC)**. The application simulates a realistic frontend-backend boundary using **Axios** and **Mock Service Worker (MSW)** for network interception, alongside **TanStack Query** for server-state caching/revalidation and **Framer Motion** for premium interactive animations.

---

## 🚀 Key Features

### 1. Role-Based Access Control (RBAC) & Authentication
The portal supports two authenticated roles with credentials validated against the `localStorage` mock database:
*   **Student Voter**:
    *   Browse candidate profiles and read campaign manifestos.
    *   Cast exactly one vote per category (e.g. President, Vice President, Treasurer).
    *   Review ballot before submission and receive a signed cryptographic receipt.
    *   **Student ID range restriction**: Logins are restricted to registered student IDs in the range **`23CS001` to `23CS050`**. IDs outside this range are rejected with a warning.
    *   Cannot add/edit candidates, toggle election windows, or view live tally charts.
*   **Election Manager**:
    *   Requires logging in at `/manager/login` with credentials:
        *   **Username/Email**: `admin` or `admin123@gmail.com`
        *   **Password**: `admin123`
    *   Access manager dashboards to control the active election status (OPEN / CLOSED).
    *   Perform full CRUD operations on candidates (Add, Edit, Delete).
    *   View real-time Leaderboards and Live Tally bar charts.
    *   Cannot cast votes or access student ballot actions.

*Security is enforced at three levels: Route-level protection (`ProtectedRoute.jsx`), UI-action gating (`PermissionGate.jsx`), and Mock API headers validation (returns `403 Forbidden` for violations).*

### 2. Mock Backend Database & Persistence
*   **Network Interception**: Emulated server interactions via **MSW v2** intercepting standard HTTP routes.
*   **LocalStorage Persistence**: Mock databases (elections, categories, candidates, votes, receipts) are stored in the browser's `localStorage` so that data modifications (like candidate updates or cast votes) survive browser refreshes and PC shutdowns.

### 3. Caching & Real-Time Polling
*   Queries and mutations are managed by **TanStack React Query v5**.
*   When voting is open, the Manager Tally dashboard initiates **real-time background polling** (every 3 seconds) to dynamically update vote percentages and active charts as ballots are submitted.

### 4. Interactive Framer Motion UI
*   Smooth, hardware-accelerated slide-up page transitions.
*   Interactive micro-animations for candidate hover states and confirmation modals.
*   Animated leader progress bars growing from 0% to the target percentage.
*   **Accessibility Overrides**: Listens to system preferences (`prefers-reduced-motion`) to automatically suppress transitions for users who prefer it.

---

## 🛠️ Core Technology Stack

*   **Frontend Framework**: React.js 19 (Vite 8)
*   **Styling**: Tailwind CSS v3
*   **Routing**: React Router DOM v7
*   **State Management (Auth/Role)**: React Context API (`AuthContext`)
*   **Server-State Caching**: TanStack React Query v5
*   **API Client**: Axios
*   **Mock Backend Interceptor**: MSW v2 (Mock Service Worker)
*   **Animations**: Framer Motion
*   **Testing**: Playwright (E2E)

---

## 📂 Project Architecture

```
src/
├── api/             # Axios client and API endpoints
├── components/      # UI components (common App shell, student, manager)
│   └── motion/      # Motion components (PageTransition, TallyBar, etc.)
├── context/         # AuthContext for active session role state
├── hooks/           # useRole permissions hook & TanStack Query hooks
├── layouts/         # Student and Manager layouts
├── mocks/           # MSW data seeds & interceptor handlers
├── pages/           # Student and Manager views, RoleSelection portal
├── providers/       # TanStack QueryClient provider wrappers
├── routes/          # App routing tree & Protected route guards
└── utils/           # Centralized permission matrix lists
```

---

## ⚙️ Running the Project

### 1. Setup & Installation
Install all npm packages:
```bash
npm install
```

### 2. Start Development Server
Launches the Vite dev server locally:
```bash
npm run dev
```
*(Once started, visit **`http://localhost:5173/`** in your browser)*

### 3. Run E2E Playwright Tests
Executes the E2E verification test suite (tests student flows, duplicate voting rejections, manager workflows, and responsiveness):
```bash
npx playwright test
```

### 4. Production Build
Compiles and builds the production bundles:
```bash
npm run build
```
