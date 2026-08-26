'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { CustomerDirectoryView } from '@/features/crm/components/customers/CustomerDirectoryView';
import { CustomerDetailDrawer360 } from '@/features/crm/components/customers/CustomerDetailDrawer360';
import { AddCustomerModal } from '@/features/crm/components/customers/AddCustomerModal';
import { QuickContactModal } from '@/features/crm/components/customers/QuickContactModal';
import { EditCustomerModal } from '@/features/customer/components/EditCustomerModal';
import { ImportCustomersModal } from '@/features/customer/components/ImportCustomersModal';
import { AddressModal } from '@/features/customer/components/AddressModal';
import { useGetCrmCustomersQuery } from '@/features/crm/api/crmApi';
import {
  useUpdateCustomerStatusMutation,
  useBulkUpdateCustomerStatusMutation,
  Customer as CustomerApiType,
} from '@/features/customer/api/customerApi';
import { Customer360 } from '@/features/crm/types/crm.types';
import { toast } from 'sonner';

export default function CrmCustomersPage() {
  const { data, isLoading, refetch } = useGetCrmCustomersQuery();
  const [localCustomers, setLocalCustomers] = useState<Customer360[]>([]);

  const [updateCustomerStatus] = useUpdateCustomerStatusMutation();
  const [bulkUpdateCustomerStatus] = useBulkUpdateCustomerStatusMutation();

  const customersList = data?.data && data.data.length > 0 ? data.data : localCustomers;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer360 | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Edit Customer Modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer360 | null>(null);

  // Address Modal state
  const [addressModalCustomer, setAddressModalCustomer] = useState<Customer360 | null>(null);

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
    refetch();
  };

  const handleToggleStatus = async (customer: Customer360) => {
    const nextStatus = customer.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    try {
      await updateCustomerStatus({
        id: customer.id,
        status: nextStatus,
      }).unwrap();
      toast.success(
        `Customer ${customer.fullName} is now ${nextStatus.toLowerCase()}.`
      );
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status.');
    }
  };

  const handleBulkUpdateStatus = async (
    customerIds: string[],
    status: 'ACTIVE' | 'BLOCKED'
  ) => {
    try {
      await bulkUpdateCustomerStatus({
        customerIds,
        status,
      }).unwrap();
      toast.success(
        `Successfully updated status of ${customerIds.length} customer(s) to ${status.toLowerCase()}.`
      );
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to perform bulk update.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <CrmNavigationHeader
        title="Customer Directory & 360° Profile"
        subtitle="Manage customer relationships, courier delivery reliability, lifetime order histories, omnichannel engagement, and notes"
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
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onEditCustomer={(c) => setEditingCustomer(c)}
        onToggleStatus={handleToggleStatus}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onOpenQuickContact={handleOpenQuickContact}
      />

      {/* Customer 360° Slide-over Drawer */}
      <CustomerDetailDrawer360
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        onOpenQuickContact={handleOpenQuickContact}
        onOpenEdit={(c) => setEditingCustomer(c)}
        onOpenAddAddress={(c) => setAddressModalCustomer(c)}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer as unknown as CustomerApiType}
          onClose={() => {
            setEditingCustomer(null);
            refetch();
          }}
        />
      )}

      {/* CSV Import Modal */}
      <ImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          refetch();
        }}
      />

      {/* Add / Manage Address Modal */}
      {addressModalCustomer && (
        <AddressModal
          isOpen={Boolean(addressModalCustomer)}
          customerId={addressModalCustomer.id}
          onClose={() => {
            setAddressModalCustomer(null);
            refetch();
          }}
        />
      )}

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
