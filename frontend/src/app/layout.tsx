import './globals.css';
import { ReduxProvider } from '@/store/provider';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EasyCommerce | Enterprise Multi-Tenant eCommerce Platform',
  description: 'Enterprise Multi-Tenant eCommerce SaaS Platform for merchants in Bangladesh and worldwide.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
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
