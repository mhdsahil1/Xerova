"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  User,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import BlackHole from "@/components/originkit/ui/blackhole";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black text-foreground select-none px-4 py-8">
      {/* 3D Black Hole Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <BlackHole
          colors={[
            "#a855f7",
            "#6366f1",
            "#3b82f6",
            "#00f0ff",
            "#38bdf8",
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.06)_0%,rgba(2,6,23,0.3)_45%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none z-[1]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px] mx-4 my-8"
      >
        {/* Outer Glow */}
        <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-purple-500/25 via-blue-500/15 to-cyan-500/25 blur-2xl opacity-75 -z-10" />

        {/* Main Card */}
        <div className="relative rounded-2xl bg-[#080d1a]/85 backdrop-blur-2xl border border-purple-500/20 p-8 sm:p-9 shadow-[0_0_50px_-10px_rgba(168,85,247,0.2)] overflow-hidden">
          {/* Top Hairline */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/80 to-transparent" />

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400/60 rounded-tl" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400/60 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400/30 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400/30 rounded-br" />

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-purple-950/70 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)] mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
              </span>
              <span>ANALYST ONBOARDING PORTAL</span>
            </div>

            <div className="px-5 py-2.5 rounded-xl bg-white/95 backdrop-blur-md shadow-[0_0_25px_rgba(168,85,247,0.2)] border border-white/40 mb-3 flex items-center justify-center transition-transform hover:scale-[1.02]">
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
              Create your analyst credentials to deploy defense workflows
            </p>
          </div>

          {/* Error Banner */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-slate-200 block"
              >
                Full Name
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Alex Mercer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="pl-10 h-11 bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500/25 transition-all text-sm"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-200 block"
              >
                Work Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="analyst@xerova.io"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10 h-11 bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500/25 transition-all text-sm"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-slate-200 block"
              >
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10 h-11 bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500/25 transition-all text-sm font-mono tracking-wide"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-1.5 pt-1"
                >
                  <div
                    className="flex gap-1.5"
                    role="progressbar"
                    aria-valuenow={passwordStrength.level * 25}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Password strength: ${passwordStrength.label || "none"}`}
                  >
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          level <= passwordStrength.level
                            ? passwordStrength.color
                            : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-400">Security Score:</span>
                    <span className={passwordStrength.textColor}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-semibold uppercase tracking-wider text-slate-200 block"
              >
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pl-10 pr-10 h-11 bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500/25 transition-all text-sm font-mono tracking-wide"
                  disabled={isLoading}
                  required
                />
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-3 bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:via-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <span>Create Analyst Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Already have an analyst account?{" "}
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </p>

          {/* Bottom Security Footer */}
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono tracking-tight">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400/80" />
            <span>Encrypted Registration Pipeline</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function getPasswordStrength(password: string) {
  let level = 0;
  if (password.length >= 8) level++;
  if (/[A-Z]/.test(password)) level++;
  if (/[0-9]/.test(password)) level++;
  if (/[^A-Za-z0-9]/.test(password)) level++;

  const labels = ["", "Weak", "Moderate", "Good", "Strong"];
  const colors = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];
  const textColors = [
    "",
    "text-red-400",
    "text-amber-400",
    "text-blue-400",
    "text-emerald-400",
  ];

  return {
    level,
    label: labels[level],
    color: colors[level],
    textColor: textColors[level],
  };
}
