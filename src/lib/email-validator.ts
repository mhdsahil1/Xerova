// ============================================
// XEROVA — Email Address & Spam Verifier
// ============================================
// Multi-layer verification:
// 1. Syntax & RFC Format Validation
// 2. High-risk & Disposable / Temporary Domain Blocklist
// 3. Mailboxlayer API Intelligence (if configured)

const getMailboxlayerKey = () => process.env.MAILBOXLAYER_API_KEY || "";

// Popular temporary / disposable / throwaway email domains
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "trashmail.com",
  "trashmail.net",
  "sharklasers.com",
  "dispostable.com",
  "fakeinbox.com",
  "getnada.com",
  "abaca.com",
  "generator.email",
  "emailondeck.com",
  "throwawaymail.com",
  "mytemp.email",
  "mohmal.com",
  "burnermail.io",
  "crazymailing.com",
  "maildrop.cc",
  "getairmail.com",
  "tempail.com",
  "disposablemail.com",
]);

export interface EmailVerificationResult {
  isValid: boolean;
  isDisposable: boolean;
  score?: number;
  reason?: string;
}

/**
 * Verify an email address to protect against spam, fake accounts, and throwaway inboxes.
 */
export async function verifyEmailAddress(
  email: string
): Promise<EmailVerificationResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Basic Format Validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      isDisposable: false,
      reason: "Please enter a valid email format.",
    };
  }

  const [, domain] = cleanEmail.split("@");
  if (!domain) {
    return {
      isValid: false,
      isDisposable: false,
      reason: "Invalid email domain.",
    };
  }

  // 2. Disposable Domain Blocklist Check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      isDisposable: true,
      reason: "Temporary and disposable email addresses are not permitted.",
    };
  }

  // 3. Mailboxlayer Threat & Quality Intelligence
  const apiKey = getMailboxlayerKey();
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `https://apilayer.net/api/check?access_key=${encodeURIComponent(
          apiKey
        )}&email=${encodeURIComponent(cleanEmail)}&smtp=1&format=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && !data.error) {
          if (data.format_valid === false) {
            return {
              isValid: false,
              isDisposable: false,
              reason: "Invalid email address format.",
            };
          }

          if (data.disposable === true) {
            return {
              isValid: false,
              isDisposable: true,
              score: data.score,
              reason: "Disposable and temporary inboxes are not allowed.",
            };
          }

          if (data.mx_found === false) {
            return {
              isValid: false,
              isDisposable: false,
              score: data.score,
              reason: "The email domain does not have valid mail exchange (MX) servers.",
            };
          }

          return {
            isValid: true,
            isDisposable: false,
            score: data.score ?? 1.0,
          };
        }
      }
    } catch (e) {
      console.warn("[Mailboxlayer] Verification error (falling back):", (e as Error).message);
    }
  }

  // Default clean pass if format and disposable list check succeed
  return {
    isValid: true,
    isDisposable: false,
  };
}
