"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BlackHole from "@/components/originkit/ui/blackhole";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type VerificationStatus =
  | "verifying"
  | "success"
  | "invalid_or_expired"
  | "missing_token"
  | "server_error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || token.trim().length === 0) {
      setStatus("missing_token");
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch(
          `/api/verify-email?token=${encodeURIComponent(token!)}`
        );
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus("success");
        } else if (res.status === 400) {
          setStatus("invalid_or_expired");
          setErrorMessage(data.error || "Invalid or expired verification link.");
        } else {
          setStatus("server_error");
          setErrorMessage(data.error || "Verification failed due to a server error.");
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("server_error");
        setErrorMessage("Network error occurred while contacting the verification server.");
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResendError(data.error || "Failed to resend verification link.");
      } else {
        setResendSuccess(true);
      }
    } catch {
      setResendError("Network error. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative rounded-[28px] bg-card/85 dark:bg-slate-950/40 backdrop-blur-2xl backdrop-saturate-150 border border-border dark:border-white/[0.12] p-7 sm:p-8 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.3)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden text-card-foreground">
      {/* Subtle top rim reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-muted/80 dark:bg-black/40 text-primary border border-primary/25 mb-4 shadow-inner">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
          </span>
          <span>IDENTITY VERIFICATION</span>
        </div>

        <div className="px-5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 mb-3 flex items-center justify-center shadow-lg">
          <Image
            src="/XEROVA final.svg"
            alt="XEROVA"
            width={160}
            height={40}
            className="h-7 w-auto object-contain drop-shadow-sm"
            priority
          />
        </div>
      </div>

      {/* State: Verifying */}
      {status === "verifying" && (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">
              Verifying Security Token...
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Validating cryptographic credentials against server.
            </p>
          </div>
        </div>
      )}

      {/* State: Success */}
      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4 space-y-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-foreground">
              Email verified successfully
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your email ownership has been confirmed. Your analyst console account is now active and ready for use.
            </p>
          </div>

          <Link href="/login" className="block pt-2">
            <Button className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs tracking-wide rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2">
              <span>Sign in to Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* State: Invalid or Expired */}
      {status === "invalid_or_expired" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5 py-2"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Invalid or expired verification link
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This verification link has expired or has already been used. Please request a new verification email below.
            </p>
          </div>

          {resendSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 text-center space-y-1">
              <p className="font-medium">Verification email dispatched!</p>
              <p className="text-[11px] text-emerald-400/80">
                If the account exists and requires verification, a new link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-3 pt-1">
              {resendError && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                  {resendError}
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="pl-9 h-9 bg-background/80 border border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl text-xs"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isResending}
                className="w-full h-9 bg-muted/60 hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isResending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Send New Verification Link</span>
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="text-center pt-1">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Return to Sign In
            </Link>
          </div>
        </motion.div>
      )}

      {/* State: Missing Token */}
      {status === "missing_token" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Missing Verification Token
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No verification token was provided in the URL. Please click the link directly from your email.
            </p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button variant="outline" className="w-full h-9 text-xs border-border text-foreground hover:bg-muted/60">
              Return to Sign In
            </Button>
          </Link>
        </div>
      )}

      {/* State: Server Error */}
      {status === "server_error" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Verification Failed
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {errorMessage || "An unexpected error occurred while communicating with the verification service."}
            </p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button variant="outline" className="w-full h-9 text-xs border-border text-foreground hover:bg-muted/60">
              Return to Sign In
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-canvas-bg text-foreground">
      {/* Top Bar Controls */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Interactive Vortex Simulation */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <BlackHole
          colors={[
            "#00f0ff",
            "#38bdf8",
            "#3b82f6",
            "#6366f1",
            "#8b5cf6",
            "#ffffff",
          ]}
          particleCount={1300}
          particleSize={4}
          orbitSpeed={3.4}
          pullSpeed={0.5}
          outerRadius={95}
          tilt={22}
          tiltSideway={140}
          trail={46}
          showCenter={true}
          centre={{ voidRadius: 42, voidX: 50, voidY: 50 }}
          className="w-full h-full"
        />
      </div>

      {/* Cyber Gradient Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,rgba(2,6,23,0.35)_45%,rgba(0,0,0,0.85)_100%)] dark:block hidden pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 dark:block hidden pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06)_0%,rgba(240,244,248,0.4)_50%,rgba(226,232,240,0.8)_100%)] dark:hidden block pointer-events-none z-[1]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[430px] mx-4 my-6"
      >
        <Suspense
          fallback={
            <div className="rounded-[28px] bg-card/85 dark:bg-slate-950/40 backdrop-blur-2xl border border-border dark:border-white/[0.12] p-8 text-center text-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500 dark:text-cyan-400" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
