"use client";

import React from "react";
import { ShieldCheck, Lock, Key, EyeOff, CheckCircle2 } from "lucide-react";

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II Aligned",
    description:
      "Engineered from the ground up to meet stringent security, availability, and confidential data-handling standards.",
  },
  {
    icon: Lock,
    title: "AES-256-GCM Encryption",
    description:
      "All telemetry queries, API credentials, and incident dossiers are protected with industry-standard military-grade encryption.",
  },
  {
    icon: EyeOff,
    title: "Zero-Query Retention",
    description:
      "Your proprietary internal IP addresses, sensitive URLs, and incident notes remain private and are never used for AI training.",
  },
  {
    icon: Key,
    title: "Hardened Auth.js v5",
    description:
      "Enterprise authentication with Google OAuth2, secure transactional token validation, and reCAPTCHA v3 bot defenses.",
  },
];

export function SecurityTrustSection() {
  return (
    <section id="security" className="py-20 md:py-28 bg-[#091820]/40 border-t border-[#17313A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A] mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>ENTERPRISE COMPLIANCE & PRIVACY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight">
            Security That Protects the Protectors
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Security analysts handle the most sensitive breach disclosures and vulnerability
            intelligence. XEROVA provides uncompromising privacy, encryption, and zero data leakage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl sm:rounded-3xl border border-[#17313A] bg-[#091820] backdrop-blur-xl hover:border-[#00D9E8]/40 transition-colors shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#050B10] border border-[#17313A] flex items-center justify-center text-[#00D9E8] mb-4">
                    <Icon className="w-6 h-6 text-[#00D9E8]" />
                  </div>
                  <h3 className="text-base font-bold text-[#F1F5F9]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#17313A] flex items-center gap-1.5 text-xs font-mono text-[#00D9E8]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00D9E8]" />
                  <span>Enforced by default</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SecurityTrustSection;
