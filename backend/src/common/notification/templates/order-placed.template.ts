import { baseEmailTemplate } from './base.template';

export interface OrderPlacedTemplateParams {
  customerName: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  storeName: string;
  itemCount: number;
  trackingUrl?: string;
}

export function orderPlacedEmailTemplate(params: OrderPlacedTemplateParams): string {
  const body = `
    <p style="margin: 0 0 16px;">হ্যালো <strong>${params.customerName}</strong>,</p>
    <p style="margin: 0 0 24px;">
      আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে এবং আমরা এটি প্রক্রিয়া করছি। ধন্যবাদ <strong>${params.storeName}</strong>-এ কেনাকাটা করার জন্য!
    </p>

    <!-- Order Summary Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0"
           style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px 28px;">
          <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">
            অর্ডার সারসংক্ষেপ
          </p>
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">অর্ডার আইডি</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #111827; font-family: monospace;">
                #${params.orderId}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">তারিখ</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; color: #374151;">${params.orderDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">পণ্যের সংখ্যা</td>
              <td align="right" style="padding: 6px 0; font-size: 14px; color: #374151;">${params.itemCount} টি</td>
            </tr>
            <tr>
              <td style="padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 15px; font-weight: 700; color: #111827;">
                মোট পরিমাণ
              </td>
              <td align="right" style="padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #6366f1;">
                ৳${params.totalAmount}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      আপনার অর্ডারের সর্বশেষ আপডেটের জন্য নজর রাখুন। কোনো প্রশ্ন থাকলে ${params.storeName}-এর সাথে যোগাযোগ করুন।
    </p>
  `;

  return baseEmailTemplate({
    title: '✅ অর্ডার নিশ্চিত হয়েছে!',
    previewText: `আপনার অর্ডার #${params.orderId} সফলভাবে গৃহীত হয়েছে`,
    bodyHtml: body,
    ctaUrl: params.trackingUrl,
    ctaLabel: params.trackingUrl ? 'অর্ডার ট্র্যাক করুন' : undefined,
    footerNote: `Store: ${params.storeName}`,
  });
}
