"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession, signOut, SessionProvider } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Lock,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BlackHole from "@/components/originkit/ui/blackhole";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const dynamic = "force-dynamic";

function RegisterCompleteContent() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pre-fill name from Google session when loaded
  useEffect(() => {
    if (session?.user?.name && !formData.name) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || "",
      }));
    }
  }, [session?.user?.name, formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasDigit = /\d/.test(formData.password);

    if (!hasUpper || !hasLower || !hasDigit) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to complete registration.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);

      // Refresh Auth.js session so registrationCompleted is updated in JWT
      try {
        await update();
      } catch (updateErr) {
        console.error("Session update error:", updateErr);
      }

      // Seamless redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-canvas-bg text-foreground font-mono text-xs">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
        <p className="text-muted-foreground">Verifying Google identity tokens...</p>
      </div>
    );
  }

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

      {/* Cyber Gradient & Radial Vignette Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,rgba(2,6,23,0.35)_45%,rgba(0,0,0,0.85)_100%)] dark:block hidden pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 dark:block hidden pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06)_0%,rgba(240,244,248,0.4)_50%,rgba(226,232,240,0.8)_100%)] dark:hidden block pointer-events-none z-[1]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[450px] mx-4 my-6"
      >
        {/* Frosted Glass Card */}
        <div className="relative rounded-[28px] bg-card/85 dark:bg-slate-950/40 backdrop-blur-2xl backdrop-saturate-150 border border-border dark:border-white/[0.12] p-7 sm:p-8 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.3)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden text-card-foreground">
          {/* Subtle top rim light reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-muted/80 dark:bg-black/40 text-primary border border-primary/25 mb-4 shadow-inner">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
              </span>
              <span>GOOGLE ONBOARDING • FINALIZE REGISTRATION</span>
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

            <h2 className="text-base font-bold text-foreground text-center tracking-tight">
              Complete Your Registration
            </h2>
            <p className="text-xs text-muted-foreground font-mono tracking-wide text-center mt-1">
              New Google account detected. Set up your analyst credentials to finish provisioning your console.
            </p>
          </div>

          {/* Verified Google Account Badge */}
          {session?.user?.email && (
            <div className="mb-4 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block leading-none">
                    Verified Google Email
                  </span>
                  <span className="font-mono text-foreground font-medium truncate text-xs">
                    {session.user.email}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                Verified
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 backdrop-blur-md"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300 backdrop-blur-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Registration completed successfully! Initializing console session...
              </span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
              >
                Analyst Name
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="pl-10 h-10 bg-background/80 backdrop-blur-md border border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl focus-visible:border-cyan-500 focus-visible:bg-background text-xs transition-all"
                  disabled={isLoading || isSuccess}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
                >
                  Create Password
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Min 8 chars, Aa1
                </span>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10 h-10 bg-background/80 backdrop-blur-md border border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl focus-visible:border-cyan-500 focus-visible:bg-background text-xs font-mono transition-all"
                  disabled={isLoading || isSuccess}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
              >
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pl-10 pr-10 h-10 bg-background/80 backdrop-blur-md border border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl focus-visible:border-cyan-500 focus-visible:bg-background text-xs font-mono transition-all"
                  disabled={isLoading || isSuccess}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 mt-3 bg-cyan-500 hover:bg-cyan-400 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_24px_rgba(6,182,212,0.35)] active:scale-[0.98]"
              disabled={isLoading || isSuccess}
            >
              {isLoading || isSuccess ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Provisioning Credentials...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>

          {/* Footer / Disconnect options */}
          <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:underline transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Cancel / Use another account</span>
            </button>

            <div className="flex items-center gap-1 font-mono text-[10px]">
              <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Encrypted Credentials</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterCompletePage() {
  return (
    <SessionProvider>
      <Suspense
        fallback={
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-canvas-bg text-foreground font-mono text-xs">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
            <p className="text-muted-foreground">Loading onboarding session...</p>
          </div>
        }
      >
        <RegisterCompleteContent />
      </Suspense>
    </SessionProvider>
  );
}

