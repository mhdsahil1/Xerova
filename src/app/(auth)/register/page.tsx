"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BlackHole from "@/components/originkit/ui/blackhole";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0b0e] select-none">
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,rgba(2,6,23,0.35)_45%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none z-[1]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] mx-4 my-6"
      >
        {/* Authentic macOS-style Frosted Glass Card */}
        <div className="relative rounded-[28px] bg-slate-950/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] p-7 sm:p-8 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden">
          {/* Subtle top rim light reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-black/40 text-cyan-300 border border-cyan-500/25 mb-4 shadow-inner">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
              </span>
              <span>ANALYST ONBOARDING PORTAL</span>
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

            <p className="text-xs text-[#8a8f9d] font-mono tracking-wide text-center">
              Create your analyst credentials to deploy defense workflows
            </p>
          </div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
              >
                Full Name
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8f9d] group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Alex Mercer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="pl-10 h-10 bg-white/[0.05] backdrop-blur-md border-white/10 text-white placeholder:text-[#8a8f9d]/50 rounded-xl focus-visible:border-cyan-400 focus-visible:bg-white/[0.08] text-xs transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

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
                  placeholder="example@gmail.com"                                                   
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
              <Label
                htmlFor="password"
                className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
              >
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8f9d] group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-[11px] font-medium uppercase tracking-wider text-[#8a8f9d] block"
              >
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8f9d] group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pl-10 pr-10 h-10 bg-white/[0.05] backdrop-blur-md border-white/10 text-white placeholder:text-[#8a8f9d]/50 rounded-xl focus-visible:border-cyan-400 focus-visible:bg-white/[0.08] text-xs font-mono transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 mt-3 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_24px_rgba(6,182,212,0.4)] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <span>Create Analyst Account</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-5 text-center text-xs text-[#8a8f9d]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-colors"
            >
              Sign In
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
