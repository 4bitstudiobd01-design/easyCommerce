import { baseEmailTemplate } from './base.template';

export interface OtpTemplateParams {
  recipientName?: string;
  otp: string;
  expiresInMinutes?: number;
  purpose?: string; // e.g. "লগইন যাচাই", "পাসওয়ার্ড রিসেট"
}

export function otpEmailTemplate(params: OtpTemplateParams): string {
  const purpose = params.purpose || 'যাচাইকরণ';
  const expiresIn = params.expiresInMinutes || 5;

  const body = `
    ${params.recipientName ? `<p style="margin: 0 0 16px;">হ্যালো <strong>${params.recipientName}</strong>,</p>` : ''}
    <p style="margin: 0 0 24px;">
      আপনার <strong>${purpose}</strong> কোড নিচে দেওয়া হয়েছে। এই কোডটি কারো সাথে শেয়ার করবেন না।
    </p>

    <!-- OTP Display -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                      border-radius: 16px; padding: 28px 48px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase;
                      letter-spacing: 2px; color: rgba(255,255,255,0.7); font-weight: 600;">
              আপনার OTP কোড
            </p>
            <p style="margin: 0; font-size: 42px; font-weight: 900; color: #ffffff;
                      letter-spacing: 12px; font-family: 'Courier New', monospace;">
              ${params.otp}
            </p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Expiry Warning -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0"
           style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 20px;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            ⚠️ এই কোডটি <strong>${expiresIn} মিনিট</strong> পর মেয়াদ শেষ হবে।
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #9ca3af;">
      আপনি যদি এই কোড অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন এবং আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন।
    </p>
  `;

  return baseEmailTemplate({
    title: `🔐 ${purpose} কোড`,
    previewText: `আপনার OTP কোড: ${params.otp}`,
    bodyHtml: body,
    footerNote: 'এই কোডটি গোপন রাখুন। কারো সাথে শেয়ার করবেন না।',
  });
}
