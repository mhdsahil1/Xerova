"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "What threat intelligence engines and feeds are integrated into XEROVA?",
    answer:
      "XEROVA orchestrates telemetry across 22+ world-class cybersecurity sources simultaneously, including VirusTotal (70+ antivirus scanners), AlienVault OTX Threat Pulses, NIST National Vulnerability Database (NVD), URLScan.io DOM sandbox, Pulsedive IOC scoring, AbuseIPDB reputation, Shodan service recon, NewsData.io live cyber news, Google Safe Browsing, and MITRE ATT&CK framework mapping.",
  },
  {
    question: "How does the Anti-Quishing (QR Code) and Deep URL engine work?",
    answer:
      "Our Anti-Quishing engine uses computer vision and automated payload unravelling to safely decode QR code images or camera captures. It checks for recursive redirect hops (unshortening Bitly/TinyURL links), punycode and IDN homoglyphs (such as Cyrillic characters replacing Latin ones), and Levenshtein distance calculations against protected brands (e.g., PayPal, Microsoft, Google) to detect credential harvesters before any user clicks.",
  },
  {
    question: "What AI models power the Copilot, and is my proprietary data private?",
    answer:
      "XEROVA features a dual-engine AI architecture combining Google Gemini 1.5 Pro/Flash for deep semantic reasoning and Groq LLaMA 3 for ultra-low latency remediation playbooks. Under our zero-retention policy, your internal IP addresses, proprietary logs, and incident dossiers are never stored in AI training sets or shared with third parties.",
  },
  {
    question: "What formats can I export my incident investigation reports into?",
    answer:
      "You can export full dossiers with one click into boardroom-ready PDF reports generated via @react-pdf/renderer, clean GitHub-flavored Markdown for incident documentation wikis, or structured JSON formatted for direct ingestion into enterprise SIEM and SOAR platforms (Splunk, Microsoft Sentinel, IBM QRadar).",
  },
  {
    question: "What is the Browser Guard extension?",
    answer:
      "The XEROVA Browser Guard extension brings our threat intelligence engines directly into your Chromium browser. It intercepts suspicious links in real time, alerts analysts to typosquatting domains, and allows one-click pivoting of any highlighted text directly into the XEROVA investigation console.",
  },
  {
    question: "Is there a free tier for individual security researchers and students?",
    answer:
      "Yes! XEROVA provides full access to community telemetry engines, IOC lookups, live news feeds, and AI triage for individual researchers and SOC teams. You can sign in using Google OAuth or register an analyst account in under 30 seconds with no credit card required.",
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A] mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Have questions about telemetry feeds, API rate limits, or AI copilot privacy? Here are
            the answers.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#17313A] bg-[#091820]/80 backdrop-blur-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full py-4 px-5 sm:px-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#050B10]/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-semibold text-[#F1F5F9]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-[#94A3B8] shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180 text-[#00D9E8]"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#94A3B8] leading-relaxed border-t border-[#17313A] font-sans">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
