"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BlackHole from "@/components/originkit/ui/blackhole";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email verification prompt & resend states
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResend(false);
    setResendStatus(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        const errStr = String(result.error);
        if (
          errStr.toLowerCase().includes("verify") ||
          errStr === "email_not_verified"
        ) {
          setError("Please verify your email before logging in.");
          setShowResend(true);
        } else if (errStr === "CredentialsSignin") {
          setError("Invalid email or password");
          setShowResend(false);
        } else {
          setError(errStr);
          setShowResend(false);
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendFromLogin = async () => {
    if (!formData.email || isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      setResendStatus(
        data.message ||
          "If the account exists and requires verification, a verification email has been sent."
      );
    } catch {
      setResendStatus("Unable to resend email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0b0e]">
      {/* Background Interactive Vortex Particle Simulation */}
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

      {/* Cyber Gradient & Radial Vignette Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,rgba(2,6,23,0.35)_45%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none z-[1]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[430px] mx-4 my-6"
      >
        {/* Authentic macOS-style Frosted Glass Card */}
        <div className="relative rounded-[28px] bg-slate-950/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] p-7 sm:p-8 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
          {/* Subtle top rim light reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Card Header & Brand Emblem */}
          <div className="flex flex-col items-center mb-6">
            {/* Security Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-black/40 text-cyan-300 border border-cyan-500/25 mb-4 shadow-inner">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
              </span>
              <span>SECURE ACCESS • SOC 2 TYPE II</span>
            </div>

            {/* High-Contrast Logo Badge */}
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

            <p className="text-xs text-[#8a8f9d] font-mono tracking-wide text-center">
              Enter credentials to access the intelligence console
            </p>
          </div>

          {/* Registration Success Message */}
          {isRegistered && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300 backdrop-blur-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Account created successfully! Please sign in to your console.
              </span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 backdrop-blur-md space-y-2"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>

              {showResend && formData.email && (
                <div className="pt-2 border-t border-rose-500/20 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={handleResendFromLogin}
                    disabled={isResending}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline inline-flex items-center gap-1.5 cursor-pointer transition-colors w-fit"
                  >
                    {isResending ? (
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    ) : (
                      <RefreshCw className="w-3 h-3 text-cyan-400" />
                    )}
                    <span>Resend verification email to {formData.email}</span>
                  </button>
                  {resendStatus && (
                    <p className="text-[11px] text-cyan-300/90 font-mono">
                      {resendStatus}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
              >
                Work Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8f9d] group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="analyst@xerova.io"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10 h-10 bg-white/[0.05] backdrop-blur-md border-white/10 text-white placeholder:text-[#8a8f9d]/50 rounded-xl focus-visible:border-cyan-400 focus-visible:bg-white/[0.08] text-xs transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
                >
                  Password
                </Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8f9d] group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10 h-10 bg-white/[0.05] backdrop-blur-md border-white/10 text-white placeholder:text-[#8a8f9d]/50 rounded-xl focus-visible:border-cyan-400 focus-visible:bg-white/[0.08] text-xs font-mono transition-all"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a8f9d] hover:text-white transition-colors p-0.5 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 mt-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_24px_rgba(6,182,212,0.4)] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-mono">
              <span className="bg-[#0e1017]/80 px-3 py-0.5 rounded-full text-[#8a8f9d] border border-white/[0.06] backdrop-blur-md">
                or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md text-white border-white/10 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Redirecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          {/* Footer Navigation */}
          <div className="mt-5 text-center text-xs text-[#8a8f9d]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-colors"
            >
              Create Account
            </Link>
          </div>

          {/* Security Disclaimer */}
          <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-[10px] text-[#8a8f9d] font-mono">
            <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>End-to-End Encrypted Session</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
