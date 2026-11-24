import { redirect } from 'next/navigation';

/**
 * Budgeting has no backend yet (FinanceBudgetView is a UI scaffold), so the route is
 * not exposed in the Finance tabs. Old links land on the Finance overview instead.
 */
export default function FinanceBudgetPage() {
  redirect('/dashboard/finance/overview');
}
