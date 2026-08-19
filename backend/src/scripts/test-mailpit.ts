/**
 * Quick Mailpit email test script.
 * Run: npx ts-node src/scripts/test-mailpit.ts
 *
 * Make sure Mailpit is running first:
 *   brew services start mailpit
 *   OR: mailpit &
 *
 * Then check your inbox at http://localhost:8025
 */

import * as nodemailer from 'nodemailer';
import { baseEmailTemplate } from '../common/notification/templates/base.template';
import { orderPlacedEmailTemplate } from '../common/notification/templates/order-placed.template';
import { orderStatusEmailTemplate } from '../common/notification/templates/order-status.template';
import { otpEmailTemplate } from '../common/notification/templates/otp.template';

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false,
  ignoreTLS: true,
});

async function send(subject: string, html: string, to = 'test@example.com') {
  const info = await transporter.sendMail({
    from: '"BitCommerce" <no-reply@bitcommerce.dev>',
    to,
    subject,
    html,
  });
  console.log(`✅ Sent: "${subject}" → messageId: ${info.messageId}`);
}

async function main() {
  console.log('🚀 Sending test emails to Mailpit...');
  console.log('   View at: http://localhost:8025\n');

  // 1. Order Placed
  await send(
    '✅ অর্ডার নিশ্চিত হয়েছে!',
    orderPlacedEmailTemplate({
      customerName: 'রাহেলা বেগম',
      orderId: 'BC-2026-00123',
      orderDate: '19 আগস্ট, 2026',
      totalAmount: '2,450',
      storeName: 'ফুলের বাজার',
      itemCount: 3,
      trackingUrl: 'http://localhost:3000/track/BC-2026-00123',
    }),
    'rahela@example.com',
  );

  // 2. Order Status
  await send(
    '🚚 অর্ডার স্ট্যাটাস আপডেট',
    orderStatusEmailTemplate({
      customerName: 'করিম সাহেব',
      orderId: 'BC-2026-00124',
      oldStatus: 'CONFIRMED',
      newStatus: 'SHIPPED',
      statusMessage: 'আপনার পণ্য কুরিয়ারে পাঠিয়ে দেওয়া হয়েছে।',
      storeName: 'টেক জোন',
      trackingUrl: 'http://localhost:3000/track/BC-2026-00124',
    }),
    'karim@example.com',
  );

  // 3. OTP
  await send(
    '🔐 লগইন যাচাই কোড',
    otpEmailTemplate({
      recipientName: 'সুমন হোসেন',
      otp: '847291',
      expiresInMinutes: 5,
      purpose: 'লগইন যাচাই',
    }),
    'sumon@example.com',
  );

  // 4. Generic branded email
  await send(
    '🎉 স্বাগতম BitCommerce-এ!',
    baseEmailTemplate({
      title: 'স্বাগতম! আপনার স্টোর প্রস্তুত',
      previewText: 'আপনার BitCommerce স্টোর সফলভাবে তৈরি হয়েছে',
      bodyHtml: `
        <p>আপনার মার্চেন্ট অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! 🎊</p>
        <p>এখন আপনি:</p>
        <ul style="padding-left: 20px; color: #374151;">
          <li style="margin-bottom: 8px;">পণ্য যোগ করতে পারবেন</li>
          <li style="margin-bottom: 8px;">স্টোর কাস্টমাইজ করতে পারবেন</li>
          <li style="margin-bottom: 8px;">অর্ডার ম্যানেজ করতে পারবেন</li>
        </ul>
      `,
      ctaUrl: 'http://localhost:3000/dashboard',
      ctaLabel: 'ড্যাশবোর্ডে যান',
    }),
    'merchant@example.com',
  );

  console.log('\n🎉 All emails sent! Open http://localhost:8025 to view them.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
