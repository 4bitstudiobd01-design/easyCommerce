import { redirect } from 'next/navigation';

export default function SettingsBranchesRedirectPage() {
  redirect('/dashboard/inventory/branches');
}
