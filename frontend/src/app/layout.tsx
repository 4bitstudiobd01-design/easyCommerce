import './globals.css';
import { ReduxProvider } from '@/store/provider';
import { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'EasyCommerce | Enterprise Multi-Tenant eCommerce Platform',
  description: 'Enterprise Multi-Tenant eCommerce SaaS Platform for merchants in Bangladesh and worldwide.',
  icons: {
    icon: '/icon.png',
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
        <ReduxProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ReduxProvider>
      </body>
    </html>
  );
}
