# FlowSuite Workspace

FlowSuite is a demo CRM/POS dashboard built with React, TypeScript, and Vite. It showcases point-of-sale cart handling, client and employee management, business intelligence dashboards, and exportable reporting.

## Features

- **Role-based workspace** with Admin and Cashier personas, guarded routes, and a login screen.
- **Inventory & cart management** including ingredient exclusions, stock enforcement, animated receipts, and QR payloads.\r\n- **Responsive shell** optimised for phones and touch POS terminals with mobile drawer navigation and enlarged controls.\r\n- **CRM tools** for adding/editing clients and employees in Radix-styled dialogs.
- **Dashboard analytics** that aggregate persisted orders with selectable 7/30/90 day ranges and top product insights.
- **Reporting suite** that exports to CSV, Excel, and PDF plus saved date presets stored locally.
- **Local persistence** via `localStorage` for catalog data, customers, staff, orders, and workspace presets.
- **Toast notifications and micro-interactions** powered by Framer Motion.

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS with custom theming and dark mode
- Radix UI primitives (Dialog, Dropdown, Tabs)
- Recharts, html2canvas, jsPDF, and SheetJS (`xlsx`) for reporting
- Framer Motion for animations
- Vitest + Testing Library for unit tests

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on Vite (default http://localhost:5173). Log in as:

- **Administrator** for full access (Dashboard, CRM, Reports, POS)
- **Cashier** for POS-only access

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

`src/lib/storage.ts` syncs products, clients, employees, and orders to `localStorage`. Sample data seeds from `src/data/sample.ts` until overridden by user actions.

## Reporting Presets

Report date ranges and export options live in `Reports.tsx`. Saved presets are stored under the `flowsuite-report-presets@1` key in `localStorage`.

## Security Notes

- Dependency audit passes with zero known vulnerabilities after removing `xlsx` (SheetJS), which previously carried HIGH advisories (prototype pollution / ReDoS). Excel export remains disabled until reintroduced with a safe approach.
- Consider routine upgrades of build tooling (Vite/Vitest) after compatibility testing.

## License

This project is provided for demonstration purposes without a specific license.

