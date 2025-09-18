# FlowSuite Workspace

FlowSuite is a demo point-of-sale workspace built with React, TypeScript, and Vite. It showcases cart handling, cashier-friendly touch UI, and lightweight sales insights.

## Features

- **Role-based workspace** with Admin and Cashier personas, guarded routes, and a login screen.
- **Inventory & cart management** including ingredient exclusions, stock enforcement, animated receipts, and QR payloads.
- **Printable POS audit trail** with a recent sales dialog cashiers can review or print without leaving the flow.
- **Configurable POS currency display** so teams can switch formatting between common locales.
- **Responsive shell** optimised for phones and touch POS terminals with mobile drawer navigation and enlarged controls.
- **Embedded sales summary** inside the POS flow with seven-day stats and top product insights.
- **Shift planner & reconciliation** with start/end workflows, variance capture, and drawer audits.
- **Offline mode with queued sync** so cashiers can continue selling without connectivity and reconcile later.
- **Order-level customer notes** preserved on receipts and audit trails.
- **Local persistence** via `localStorage` for catalog data, cart state, orders, and currency preferences.
- **Toast notifications and micro-interactions** powered by Framer Motion.

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS with custom theming and dark mode
- Radix UI primitives (Dialog, Dropdown, Tabs)
- Framer Motion for animations
- Vitest + Testing Library for unit tests

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on Vite (default http://localhost:5173). Log in as either role to reach the POS workspace:

- **Administrator**
- **Cashier**

## Available Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production bundle |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Execute Vitest (configured for jsdom) |

> Tests were not executed by default. Run `npm test` when ready.

## Testing

Vitest is configured in `vite.config.ts` with global test helpers from `src/setupTests.ts`. Example reducer coverage lives in `src/context/AppContext.test.tsx`.

## Data Persistence

`src/lib/storage.ts` syncs products, orders, shifts, active shift state, and currency preferences to `localStorage`. Sample data seeds from `src/data/sample.ts` until overridden by user actions.

## Security Notes

- Dependency audit passes with zero known vulnerabilities after removing `xlsx` (SheetJS), which previously carried HIGH advisories (prototype pollution / ReDoS). Excel export has been removed; reintroduce it only with a vetted dependency.
- Consider routine upgrades of build tooling (Vite/Vitest) after compatibility testing.

## License

This project is provided for demonstration purposes without a specific license.

