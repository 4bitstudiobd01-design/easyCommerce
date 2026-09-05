/**
 * Base branded HTML email template for BitCommerce.
 * Supports light/dark email clients via inline styles.
 */
export function baseEmailTemplate(params: {
  title: string;
  previewText?: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
  footerNote?: string;
}): string {
  const { title, previewText, bodyHtml, ctaUrl, ctaLabel, footerNote } = params;

  const ctaBlock =
    ctaUrl && ctaLabel
      ? `
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 32px auto 0 auto;">
        <tr>
          <td align="center" bgcolor="#6366f1" style="border-radius: 8px;">
            <a href="${ctaUrl}" target="_blank"
               style="display: inline-block; padding: 14px 32px; font-family: 'Segoe UI', Arial, sans-serif;
                      font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;
                      border-radius: 8px; letter-spacing: 0.3px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>
      </table>`
      : '';

  const footerBlock = footerNote
    ? `<p style="margin: 0; font-size: 12.5px; color: #6b7280; line-height: 1.6;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  ${previewText ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
</head>
<body style="margin:0; padding:0; background-color:#eef0f4; font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#eef0f4">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <table width="560" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
               style="border-radius: 16px; overflow: hidden; max-width: 560px; width: 100%;
                      box-shadow: 0 1px 2px rgba(17,24,39,0.04), 0 8px 24px rgba(17,24,39,0.06);">

          <!-- Header -->
          <tr>
            <td align="left" style="padding: 26px 40px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="padding-right: 10px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="28" height="28"
                           style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 8px;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 14px; line-height: 28px; color: #ffffff;">B</td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle">
                    <span style="font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.2px;">BitCommerce</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #f1f2f4; margin: 0;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 28px;">
              <h1 style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">${title}</h1>
              <div style="font-size: 14.5px; line-height: 1.7; color: #4b5563; text-align: left;">
                ${bodyHtml}
              </div>
              ${ctaBlock}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #f1f2f4; margin: 0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="left" style="padding: 20px 40px 28px; background-color: #fafafb;">
              ${footerBlock}
              <p style="margin: 8px 0 0 0; font-size: 11.5px; color: #9ca3af; line-height: 1.6;">
                © ${new Date().getFullYear()} BitCommerce &middot; এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে, কোনো প্রশ্ন থাকলে আপনার স্টোর অ্যাডমিনের সাথে যোগাযোগ করুন।
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
