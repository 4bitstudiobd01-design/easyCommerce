import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | BitCommerce',
  description: 'How BitCommerce collects, uses, and protects merchant and customer data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-16 px-6 max-w-3xl mx-auto w-full">
        <div className="space-y-3 mb-10">
          <div className="p-3 bg-blue-50 w-fit rounded-xl border border-blue-100 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-slate prose-sm max-w-none space-y-8 text-slate-700 leading-relaxed">
          <p>
            BitCommerce ("we", "our", "the platform") is a multi-tenant eCommerce SaaS platform that lets merchants
            create and run their own online stores. This policy explains what data we collect, how it's used, and how
            it's kept separate between merchants.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Merchant account data:</strong> name, email, phone, and store details you provide at registration.</li>
              <li><strong>Store configuration:</strong> product listings, pricing, courier and payment gateway credentials you connect to your store.</li>
              <li><strong>Customer order data:</strong> name, phone, delivery address, and order history collected on your storefront to fulfill orders.</li>
              <li><strong>Contact form submissions:</strong> name, email, phone, and message when you reach out to us directly.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">How your data is isolated</h2>
            <p>
              Each merchant's store data — products, orders, customers, and settings — is scoped to that merchant's
              account at the database level. Other merchants on the platform cannot access or view your store's data,
              and your customers' data is only visible to your store, not to other stores on the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">How we use data</h2>
            <p>
              Merchant and order data is used to operate your store — processing orders, initiating payments through
              your connected payment gateway, booking courier deliveries, and sending order-status notifications to
              your customers. We do not sell merchant or customer data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Third-party services</h2>
            <p>
              Depending on what you connect to your store, order and payment data may pass through SSLCommerz
              (payment processing) and Steadfast or Pathao (courier delivery) to complete transactions and deliveries.
              These providers process data under their own privacy terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Contact us</h2>
            <p>
              Questions about this policy or your data? Reach out through our{' '}
              <a href="/contact" className="text-blue-600 font-semibold hover:underline">Contact page</a>.
            </p>
          </section>

          <p className="text-xs text-slate-400 pt-4 border-t border-slate-200">
            BitCommerce is an early-stage platform. This policy will be expanded as the product and our legal review
            of it matures — check back for updates.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
