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
    ? `<p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  ${previewText ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f3f4f6">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
               style="border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center"
                style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px 40px 28px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block; background: rgba(255,255,255,0.15);
                                border-radius: 12px; padding: 8px 20px;">
                      <span style="font-size: 22px; font-weight: 800; color: #ffffff;
                                   letter-spacing: -0.5px;">⚡ BitCommerce</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;
                               letter-spacing: -0.3px;">${title}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 48px 32px;">
              <div style="font-size: 15px; line-height: 1.7; color: #374151;">
                ${bodyHtml}
              </div>
              ${ctaBlock}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 48px 36px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                © ${new Date().getFullYear()} BitCommerce. All rights reserved.
              </p>
              ${footerBlock}
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
                This email was sent by the BitCommerce platform. If you have questions, contact your store administrator.
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
