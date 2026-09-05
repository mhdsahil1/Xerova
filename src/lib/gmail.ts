import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

function encodeMessage(message: string) {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Strip CRLF characters to prevent email header injection
  const safeTo = to.replace(/[\r\n]+/g, "").trim();
  const safeSubject = subject.replace(/[\r\n]+/g, "").trim();
  const safeFromUser = (process.env.GMAIL_USER || "").replace(/[\r\n]+/g, "").trim();

  if (!safeTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeTo)) {
    throw new Error("Invalid recipient email address");
  }

  const message = [
    `From: XEROVA <${safeFromUser}>`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");

  const raw = encodeMessage(message);

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
    },
  });

  return response.data;
}

/**
 * Send a branded XEROVA email verification message.
 */
export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: {
  to: string;
  name: string;
  verificationUrl: string;
}) {
  // Validate verification URL protocol
  if (!/^https?:\/\//i.test(verificationUrl)) {
    throw new Error("Invalid verification URL protocol");
  }

  const safeName = (name || "Analyst")
    .replace(/[&<>'"]/g, 
      (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your XEROVA Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #08090c; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #0f1117; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <div style="font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                XEROVA <span style="color: #06b6d4; font-size: 14px; letter-spacing: 1px; font-weight: 600;">INTEL</span>
              </div>
              <div style="font-size: 11px; color: #8a8f9d; margin-top: 4px; letter-spacing: 0.5px; font-family: monospace;">
                SECURITY OPERATIONS CONSOLE
              </div>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #94a3b8;">
                Hello <strong style="color: #f1f5f9;">${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #94a3b8;">
                Thank you for registering with XEROVA. To activate your analyst workstation and begin investigating cyber threats, please verify ownership of this email address.
              </p>
              <!-- Primary Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 12px 0 28px 0;">
                    <a href="${verificationUrl}" target="_blank" style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #ffffff; padding: 14px 36px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <div style="padding: 14px 16px; background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #cbd5e1;">
                  ⏱️ <strong>Expiration Notice:</strong> This verification link will expire in <strong>30 minutes</strong>.
                </p>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 18px; color: #64748b;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 18px; color: #06b6d4; word-break: break-all; font-family: monospace;">
                ${verificationUrl}
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748b;">
                If you did not create a XEROVA account, no further action is required; you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0a0b0e; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569; font-family: monospace;">
                XEROVA Defense Platform &bull; Autonomous Cybersecurity Operations
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({
    to,
    subject: "Verify Your XEROVA Account",
    html,
  });
}
