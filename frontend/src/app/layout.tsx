import './globals.css';
import { ReduxProvider } from '@/store/provider';

export const metadata = {
  title: 'EasyCommerce | Merchant Portal',
  description: 'Enterprise Multi-Tenant eCommerce SaaS Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
