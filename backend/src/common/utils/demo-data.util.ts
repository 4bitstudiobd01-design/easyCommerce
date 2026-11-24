import { ForbiddenException } from '@nestjs/common';

/**
 * Demo/sample data (fake finance transactions, payroll runs, leads, customers) must never
 * be written into a real merchant's store. It is opt-in: only when the environment sets
 * ENABLE_DEMO_DATA=true (local development / sales demos). Unset means disabled, so a
 * production deploy that forgets the variable is still safe.
 */
export const isDemoDataEnabled = (): boolean => process.env.ENABLE_DEMO_DATA === 'true';

/** Guard for endpoints whose only purpose is to seed demo data. */
export const assertDemoDataEnabled = (): void => {
  if (!isDemoDataEnabled()) {
    throw new ForbiddenException('Demo data is disabled in this environment.');
  }
};
