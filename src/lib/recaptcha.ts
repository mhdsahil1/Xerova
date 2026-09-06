interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Validates a Google reCAPTCHA v3 token on the server.
 *
 * @param token - The token returned by grecaptcha.execute() on the client
 * @param expectedAction - The action name passed to execute() (e.g. 'register')
 * @param minScore - Minimum acceptable score (0.0 = bot, 1.0 = human, default 0.5)
 * @param clientIp - Optional client IP address
 */
export async function verifyRecaptcha(
  token: string | undefined | null,
  expectedAction: string = "register",
  minScore: number = 0.5,
  clientIp?: string
): Promise<{ success: boolean; error?: string; score?: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // In development without configured keys, allow bypass
  if (!secretKey) {
    return { success: true, score: 1.0 };
  }

  if (!token) {
    return { success: false, error: "reCAPTCHA verification token is missing. Please reload the page." };
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(clientIp ? { remoteip: clientIp } : {}),
    });

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data: RecaptchaVerifyResponse = await res.json();

    if (!data.success) {
      console.warn("reCAPTCHA verification failed:", data["error-codes"]);
      return { success: false, error: "Security check failed. Please refresh and try again." };
    }

    // Check v3 action if returned
    if (data.action && data.action !== expectedAction) {
      console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`);
      return { success: false, error: "Security check verification mismatch." };
    }

    // Score validation for reCAPTCHA v3
    if (typeof data.score === "number" && data.score < minScore) {
      console.warn(`reCAPTCHA score too low (${data.score}) for action ${data.action}`);
      return { success: false, error: "Suspicious activity detected. Please try again later." };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error("reCAPTCHA validation error:", error);
    return { success: false, error: "Unable to verify security token. Please try again." };
  }
}
