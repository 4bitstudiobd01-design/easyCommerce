import { redirect } from 'next/navigation';

export default function SuppliersPage() {
  redirect('/dashboard/purchase?tab=suppliers');
}
