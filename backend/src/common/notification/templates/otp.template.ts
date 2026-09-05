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
    ${params.recipientName ? `<p style="margin: 0 0 12px;">হ্যালো <strong>${params.recipientName}</strong>,</p>` : ''}
    <p style="margin: 0 0 24px;">
      আপনার <strong>${purpose}</strong> সম্পন্ন করতে নিচের কোডটি ব্যবহার করুন। এই কোডটি কারো সাথে শেয়ার করবেন না।
    </p>

    <!-- OTP Display -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="left" style="padding-bottom: 16px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%"
                 style="background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
                        border: 1px solid #e0e7ff; border-radius: 12px;">
            <tr>
              <td style="padding: 22px 28px;">
                <p style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase;
                          letter-spacing: 1.5px; color: #6366f1; font-weight: 700;">
                  যাচাইকরণ কোড
                </p>
                <p style="margin: 0; font-size: 36px; font-weight: 800; color: #1e1b4b;
                          letter-spacing: 10px; font-family: 'Courier New', monospace;">
                  ${params.otp}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #fff7ed; border-radius: 6px; padding: 6px 12px;">
          <span style="font-size: 12.5px; font-weight: 600; color: #c2410c;">
            ⏱ ${expiresIn} মিনিট পর মেয়াদোত্তীর্ণ হবে
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #9ca3af;">
      আপনি যদি এই কোড অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন এবং আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন।
    </p>
  `;

  return baseEmailTemplate({
    title: `${purpose} কোড`,
    previewText: `আপনার যাচাইকরণ কোড: ${params.otp}`,
    bodyHtml: body,
    footerNote: 'এই কোডটি গোপন রাখুন। কারো সাথে শেয়ার করবেন না।',
  });
}
