"use client";

import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Globe,
  Lock,
  Zap,
  ArrowRight,
  Eye,
  Server,
  MonitorSmartphone,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ============================================
// XEROVA Browser Guard — Info / Marketing Page
// ============================================

const features = [
  {
    icon: Shield,
    title: "Real-time URL Analysis",
    description:
      "Analyze any website with a single click. Get instant risk scores powered by multi-source threat intelligence.",
  },
  {
    icon: AlertTriangle,
    title: "Threat Detection",
    description:
      "Detect phishing, brand impersonation, suspicious domains, and malicious URL patterns before they cause harm.",
  },
  {
    icon: Server,
    title: "Multi-Source Intelligence",
    description:
      "Powered by VirusTotal, Criminal IP, AbuseIPDB, Abusix, Shodan, and XEROVA's own heuristic engine.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description:
      "URLs are only analyzed when you explicitly click. No silent tracking, no browsing history collection.",
  },
  {
    icon: Zap,
    title: "Lightweight & Fast",
    description:
      "Minimal permissions, no background polling. Opens instantly and doesn't slow down your browsing.",
  },
  {
    icon: Globe,
    title: "Full Investigation",
    description:
      "One click to open a complete investigation in the XEROVA platform with deep threat analysis.",
  },
];

const permissions = [
  {
    name: "activeTab",
    reason: "Read the URL of the current tab when you click the extension icon.",
  },
  {
    name: "storage",
    reason: "Cache recent analysis results locally for faster repeat lookups.",
  },
];

const installSteps = [
  "Clone the XEROVA repository and navigate to the extension/ directory",
  "Run npm install to install dependencies",
  "Run npm run build to compile the extension",
  "Open Chrome and navigate to chrome://extensions",
  "Enable Developer Mode (toggle in top right)",
  'Click "Load unpacked" and select the extension/dist folder',
  "Pin XEROVA Browser Guard to your toolbar",
  "Navigate to any website and click the extension to analyze it",
];

export default function BrowserGuardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Hero Section */}
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6"
        >
          <ShieldCheck className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          XEROVA Browser Guard
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Detect suspicious and malicious websites while you browse. Your
          first-line defense against phishing, scams, and dangerous URLs.
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Globe className="w-4 h-4" />
            Chrome / Chromium
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-muted-foreground text-sm font-medium">
            v1.0.0
          </span>
        </div>
      </div>

      {/* Architecture Overview */}
      <Card className="panel-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-primary" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center text-sm">
            {[
              { label: "You browse a website", icon: Globe },
              { label: "Click Browser Guard", icon: Shield },
              { label: "URL sent to XEROVA", icon: Server },
              { label: "Multi-source analysis", icon: Eye },
              { label: "Risk score displayed", icon: ShieldCheck },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-tight">
                  {step.label}
                </p>
                {i < 4 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 hidden md:block absolute" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="panel-card h-full">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Installation */}
      <Card className="panel-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Installation
          </h2>
          <ol className="space-y-3">
            {installSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground pt-0.5">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="panel-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Permissions Explained
          </h2>
          <div className="space-y-4">
            {permissions.map((perm, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border"
              >
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold font-mono text-foreground">
                    {perm.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {perm.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            XEROVA Browser Guard requests <strong>only the minimum permissions</strong>{" "}
            needed to function. No broad permissions like{" "}
            <code className="text-primary/80 bg-primary/10 px-1 rounded">&lt;all_urls&gt;</code>{" "}
            are used. Your browsing data is never collected or stored.
          </p>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="panel-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Privacy
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">No silent tracking.</strong> URLs
              are only sent to XEROVA servers when you explicitly click
              &quot;Analyze with XEROVA&quot;.
            </p>
            <p>
              <strong className="text-foreground">No browsing history.</strong> The
              extension does not monitor, record, or transmit your browsing activity.
            </p>
            <p>
              <strong className="text-foreground">No API keys in extension.</strong>{" "}
              All threat intelligence API calls are made server-side through the
              XEROVA backend, never from your browser.
            </p>
            <p>
              <strong className="text-foreground">Minimal data.</strong> Only the URL
              you choose to analyze is sent. Results are cached locally for
              performance and cleared automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supported Browsers */}
      <Card className="panel-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Supported Browsers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Chrome", supported: true },
              { name: "Edge", supported: true },
              { name: "Brave", supported: true },
              { name: "Opera", supported: true },
            ].map((browser, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border"
              >
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                <span className="text-sm font-medium">{browser.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Any Chromium-based browser with Manifest V3 support is compatible.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
