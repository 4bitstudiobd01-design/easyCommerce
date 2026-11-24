/**
 * Mirrors the backend ENABLE_DEMO_DATA switch: demo-data seeding controls are only shown
 * when NEXT_PUBLIC_ENABLE_DEMO_DATA=true (local development / sales demos). Unset means
 * hidden, so merchants never see "seed demo data" actions in production.
 */
export const DEMO_DATA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === 'true';
