import { baseEmailTemplate } from './base.template';

export interface OrderStatusTemplateParams {
  customerName: string;
  orderId: string;
  oldStatus: string;
  newStatus: string;
  statusMessage?: string;
  storeName: string;
  trackingUrl?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING:    { label: 'অপেক্ষমান',     color: '#f59e0b', emoji: '🕐' },
  CONFIRMED:  { label: 'নিশ্চিত হয়েছে',   color: '#3b82f6', emoji: '✅' },
  PROCESSING: { label: 'প্রক্রিয়াধীন',   color: '#8b5cf6', emoji: '⚙️' },
  SHIPPED:    { label: 'পাঠানো হয়েছে',   color: '#06b6d4', emoji: '🚚' },
  DELIVERED:  { label: 'ডেলিভারি হয়েছে', color: '#10b981', emoji: '🎉' },
  CANCELLED:  { label: 'বাতিল হয়েছে',   color: '#ef4444', emoji: '❌' },
  RETURNED:   { label: 'রিটার্ন হয়েছে',  color: '#f97316', emoji: '↩️' },
};

export function orderStatusEmailTemplate(params: OrderStatusTemplateParams): string {
  const statusInfo = STATUS_LABELS[params.newStatus] ?? {
    label: params.newStatus,
    color: '#6b7280',
    emoji: '📦',
  };

  const body = `
    <p style="margin: 0 0 16px;">হ্যালো <strong>${params.customerName}</strong>,</p>
    <p style="margin: 0 0 24px;">
      আপনার অর্ডার <strong>#${params.orderId}</strong>-এর স্ট্যাটাস আপডেট হয়েছে।
    </p>

    <!-- Status Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0"
           style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 28px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">${statusInfo.emoji}</div>
          <div style="display: inline-block; background: ${statusInfo.color}20; border: 1px solid ${statusInfo.color}40;
                      border-radius: 24px; padding: 8px 24px;">
            <span style="font-size: 16px; font-weight: 700; color: ${statusInfo.color};">
              ${statusInfo.label}
            </span>
          </div>
          ${params.statusMessage ? `<p style="margin: 16px 0 0; font-size: 14px; color: #6b7280;">${params.statusMessage}</p>` : ''}
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellpadding="0" cellspacing="0"
           style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 13px; color: #6b7280;">অর্ডার আইডি</td>
              <td align="right" style="font-size: 13px; font-weight: 600; color: #111827; font-family: monospace;">
                #${params.orderId}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      কোনো সমস্যা হলে <strong>${params.storeName}</strong>-এর সাথে যোগাযোগ করুন।
    </p>
  `;

  return baseEmailTemplate({
    title: `অর্ডার আপডেট — ${statusInfo.emoji} ${statusInfo.label}`,
    previewText: `আপনার অর্ডার #${params.orderId} এখন ${statusInfo.label}`,
    bodyHtml: body,
    ctaUrl: params.trackingUrl,
    ctaLabel: params.trackingUrl ? 'অর্ডার ট্র্যাক করুন' : undefined,
    footerNote: `Store: ${params.storeName}`,
  });
}
