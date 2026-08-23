'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { CustomerDirectoryView } from '@/features/crm/components/customers/CustomerDirectoryView';
import { CustomerDetailDrawer360 } from '@/features/crm/components/customers/CustomerDetailDrawer360';
import { AddCustomerModal } from '@/features/crm/components/customers/AddCustomerModal';
import { QuickContactModal } from '@/features/crm/components/customers/QuickContactModal';
import { useGetCrmCustomersQuery } from '@/features/crm/api/crmApi';
import { Customer360 } from '@/features/crm/types/crm.types';
import { mockCustomers } from '@/features/crm/data/crmMockData';

export default function CrmCustomersPage() {
  const { data, isLoading } = useGetCrmCustomersQuery();
  const [localCustomers, setLocalCustomers] = useState<Customer360[]>(mockCustomers);

  const customersList = data?.data && data.data.length > 0 ? data.data : localCustomers;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer360 | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Quick contact modal
  const [quickContactTarget, setQuickContactTarget] = useState<Customer360 | null>(null);
  const [quickContactChannel, setQuickContactChannel] = useState<'WHATSAPP' | 'CALL' | 'SMS'>('WHATSAPP');
  const [isQuickContactOpen, setIsQuickContactOpen] = useState(false);

  const handleSelectCustomer = (customer: Customer360) => {
    setSelectedCustomer(customer);
  };

  const handleOpenQuickContact = (customer: Customer360, channel: 'WHATSAPP' | 'CALL' | 'SMS') => {
    setQuickContactTarget(customer);
    setQuickContactChannel(channel);
    setIsQuickContactOpen(true);
  };

  const handleCustomerAdded = (newCustomer: Customer360) => {
    setLocalCustomers([newCustomer, ...localCustomers]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <CrmNavigationHeader
        title="Customer Directory & 360° Profile"
        subtitle="Manage customer relationships, lifetime order histories, omnichannel engagement, and notes"
        activeCount={customersList.length}
        addLabel="Add Customer"
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Main Customers Directory Table & Filters */}
      <CustomerDirectoryView
        customers={customersList}
        isLoading={isLoading}
        onSelectCustomer={handleSelectCustomer}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenQuickContact={handleOpenQuickContact}
      />

      {/* Customer 360° Slide-over Drawer */}
      <CustomerDetailDrawer360
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        onOpenQuickContact={handleOpenQuickContact}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Quick Contact Modal (WhatsApp / Call) */}
      <QuickContactModal
        contact={quickContactTarget}
        channel={quickContactChannel}
        isOpen={isQuickContactOpen}
        onClose={() => setIsQuickContactOpen(false)}
      />
    </div>
  );
}
