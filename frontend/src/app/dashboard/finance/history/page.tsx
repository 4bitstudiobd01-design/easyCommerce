import { FinanceHistoryView } from '@/features/finance/components/FinanceHistoryView';

export const metadata = {
  title: 'Financial History & Archives | BitCommerce',
  description: 'View previous months income and expense records and export statements',
};

export default function FinanceHistoryPage() {
  return <FinanceHistoryView />;
}
