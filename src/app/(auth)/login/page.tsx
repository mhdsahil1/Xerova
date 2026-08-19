"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations";
import BlackHole from "@/components/originkit/ui/blackhole";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-[440px] mx-4 my-8"
    >
      {/* Outer Ambient Glow */}
      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-cyan-500/25 via-blue-500/15 to-purple-500/25 blur-2xl opacity-75 -z-10" />

      {/* Glassmorphic Card Container */}
      <div className="relative rounded-2xl bg-[#080d1a]/85 backdrop-blur-2xl border border-cyan-500/20 p-8 sm:p-9 shadow-[0_0_50px_-10px_rgba(6,182,212,0.2)] overflow-hidden">
        {/* Top Glowing Hairline */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

        {/* Cyber Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/30 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/30 rounded-br" />

        {/* Card Header & Brand Emblem */}
        <div className="flex flex-col items-center mb-7">
          {/* Security Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span>SECURE ACCESS • SOC 2 TYPE II</span>
          </div>

          {/* High-Contrast Logo Badge */}
          <div className="px-5 py-2.5 rounded-xl bg-white/95 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.2)] border border-white/40 mb-3 flex items-center justify-center transition-transform hover:scale-[1.02]">
            <Image
              src="/XEROVA final.svg"
              alt="XEROVA — Observe. Analyze. Defend."
              width={180}
              height={48}
              className="h-10 w-auto object-contain drop-shadow-sm"
              priority
            />
          </div>

          <p className="text-xs text-slate-400 font-mono tracking-wide text-center">
            Enter credentials to access the intelligence console
          </p>
        </div>

        {/* Registration Success Message */}
        {isRegistered && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 shadow-inner"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Account created successfully! Please sign in to your dashboard.
            </span>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 shadow-inner"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        {/* Quick Test / Demo Credentials Banner */}
        <div className="mb-4 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 font-mono text-[11px] text-slate-300">
            <span className="text-cyan-400 font-bold">Demo:</span> admin@xerova.io / admin123
          </div>
          <button
            type="button"
            onClick={() => setFormData({ email: "admin@xerova.io", password: "admin123" })}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Auto-Fill
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-slate-200 block"
            >
              Work Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="analyst@xerova.io"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10 h-11 bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/25 transition-all text-sm"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-slate-200 block"
              >
                Password
              </Label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10 pr-10 h-11 bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/25 transition-all text-sm font-mono tracking-wide"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 mt-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating Session...</span>
              </>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-mono">
            <span className="bg-[#080d1a] px-3 text-slate-400">
              or continue with
            </span>
          </div>
        </div>

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 bg-slate-900/90 hover:bg-slate-800/90 text-slate-100 border-slate-700/80 hover:border-slate-600 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
          ) : (
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </Button>

        {/* Register Link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors underline-offset-4 hover:underline"
          >
            Create Account
          </Link>
        </p>

        {/* Bottom Security Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono tracking-tight">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/80" />
          <span>End-to-End Encrypted Session</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="dark relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black text-foreground select-none px-4 py-8">
      {/* 3D Black Hole Accretion Disk Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06)_0%,rgba(2,6,23,0.3)_45%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none z-[1]" />

      {/* Form with Suspense boundary for useSearchParams */}
      <Suspense
        fallback={
          <div className="relative z-10 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
