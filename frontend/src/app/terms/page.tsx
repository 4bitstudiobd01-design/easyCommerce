import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | EasyCommerce',
  description: 'Terms governing use of the EasyCommerce multi-tenant eCommerce platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-16 px-6 max-w-3xl mx-auto w-full">
        <div className="space-y-3 mb-10">
          <div className="p-3 bg-blue-50 w-fit rounded-xl border border-blue-100 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-slate prose-sm max-w-none space-y-8 text-slate-700 leading-relaxed">
          <p>
            These terms govern your use of EasyCommerce to create and operate an online store. By registering a
            store, you agree to the terms below.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Your account</h2>
            <p>
              You're responsible for the accuracy of your store information, product listings, and pricing, and for
              keeping your login credentials secure. You must be legally able to sell the products you list.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Payments & fulfillment</h2>
            <p>
              Order payments are processed through SSLCommerz using the gateway credentials you connect to your
              store; courier bookings are made through Steadfast or Pathao using your connected credentials.
              EasyCommerce is not a party to the underlying payment or delivery contract — that relationship is
              between you, your customer, and the respective provider.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Acceptable use</h2>
            <p>
              You may not use EasyCommerce to sell illegal goods, engage in fraud, or attempt to access another
              merchant's store data or bypass the platform's tenant isolation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Current stage of the platform</h2>
            <p>
              EasyCommerce is an early-access product. Features described on this site reflect what's built today;
              anything marked "Coming Soon" is not yet available. We'll update these terms as pricing, paid plans,
              and additional features go live.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Contact us</h2>
            <p>
              Questions about these terms? Reach out through our{' '}
              <a href="/contact" className="text-blue-600 font-semibold hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
