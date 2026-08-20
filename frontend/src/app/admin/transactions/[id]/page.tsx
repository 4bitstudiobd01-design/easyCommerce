'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { INITIAL_TRANSACTIONS } from '@/components/dashboard/transactions/transactionsMockData';
import { TransactionDetailsView } from '@/components/dashboard/transactions/details/TransactionDetailsView';

export default function TransactionDynamicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const txnId = (params?.id as string) || 'TXN-2026-0008456';

  const foundTxn =
    INITIAL_TRANSACTIONS.find(
      (t) => t.id.toLowerCase() === txnId.toLowerCase()
    ) || INITIAL_TRANSACTIONS[0];

  const handleBack = () => {
    router.push('/admin/transactions');
  };

  return <TransactionDetailsView transaction={foundTxn} onBack={handleBack} />;
}
