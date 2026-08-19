"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Shield, Key, Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your account profile, intelligence engine integrations, and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="profile" className="text-xs md:text-sm"><User className="w-3.5 h-3.5 mr-1.5" /> Profile</TabsTrigger>
          <TabsTrigger value="api" className="text-xs md:text-sm"><Key className="w-3.5 h-3.5 mr-1.5" /> API Engines</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs md:text-sm"><Settings className="w-3.5 h-3.5 mr-1.5" /> Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-4">
          <Card className="bg-card border-border max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Profile Information</CardTitle>
              <CardDescription className="text-xs">Your analyst identity and organization privileges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <Input defaultValue={session?.user?.name || ""} disabled className="bg-background/60 border-border h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                <Input defaultValue={session?.user?.email || ""} disabled className="bg-background/60 border-border h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Security Role</label>
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border border-border">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium capitalize">{(session?.user as Record<string, unknown>)?.role as string || "SOC Analyst"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card className="bg-card border-border max-w-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Global Threat Intelligence &amp; AI Integrations
              </CardTitle>
              <CardDescription className="text-xs">
                Intelligence provider connectors are configured globally at the environment tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[
                  { name: "VirusTotal", key: "VIRUSTOTAL_API_KEY", desc: "Multi-engine malware, domain, URL & hash reputation" },
                  { name: "AbuseIPDB", key: "ABUSEIPDB_API_KEY", desc: "IP abuse confidence scoring and community reports" },
                  { name: "Shodan", key: "SHODAN_API_KEY", desc: "Port telemetry, banner analysis, and CVE detection" },
                  { name: "Criminal IP", key: "CRIMINAL_IP_API_KEY", desc: "Inbound/outbound risk, VPN/Tor/Proxy detection" },
                  { name: "Abusix", key: "ABUSIX_API_KEY", desc: "Threat intelligence blocklists and exploit monitoring" },
                  { name: "AlienVault OTX", key: "OTX_API_KEY", desc: "Global threat pulses, IOC validation, and adversary tracking" },
                  { name: "alphaMountain.ai / ThreatYeti", key: "ALPHA_MOUNTAIN_API", desc: "AI-driven URI reputation & category classification" },
                  { name: "URLQuery", key: "URL_QUERY_API_KEY", desc: "Web sandbox report search and malware scanning" },
                  { name: "Google Gemini AI", key: "GEMINI_API_KEY", desc: "Cybersecurity analyst assistant and natural language reasoning" },
                ].map((integ) => (
                  <div key={integ.name} className="p-3 rounded-md bg-background/50 border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{integ.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-status-success/15 border border-status-success/30 text-status-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{integ.desc}</p>
                    <div className="pt-1">
                      <Input value="••••••••••••••••••••••••••••••••" disabled type="password" className="h-7 text-[11px] bg-background/30 border-border font-mono" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-status-info/10 border border-status-info/20 text-status-info p-3.5 rounded-md text-xs leading-relaxed">
                ℹ️ XEROVA is currently running in managed deployment mode. All 9 threat intelligence and AI engines are active and queryable.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card className="bg-card border-border max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Appearance &amp; Preferences</CardTitle>
              <CardDescription className="text-xs">Customize your workstation console environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mounted && (
                <div className="flex items-center justify-between p-3 rounded-md bg-background/50 border border-border">
                  <div>
                    <h4 className="text-xs font-medium">Theme Mode</h4>
                    <p className="text-[11px] text-muted-foreground">Select console visual theme</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant={theme === "light" ? "default" : "outline"} size="sm" className="h-7 text-xs px-2.5" onClick={() => setTheme("light")}>
                      <Sun className="w-3 h-3 mr-1" />
                      Light
                    </Button>
                    <Button variant={theme === "dark" ? "default" : "outline"} size="sm" className="h-7 text-xs px-2.5" onClick={() => setTheme("dark")}>
                      <Moon className="w-3 h-3 mr-1" />
                      Dark
                    </Button>
                    <Button variant={theme === "system" ? "default" : "outline"} size="sm" className="h-7 text-xs px-2.5" onClick={() => setTheme("system")}>
                      <Monitor className="w-3 h-3 mr-1" />
                      System
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between p-3 rounded-md bg-background/50 border border-border">
                <div>
                  <h4 className="text-xs font-medium">Critical Threat Alerts</h4>
                  <p className="text-[11px] text-muted-foreground">Automated telemetry dispatches for high/critical IOC detections</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Active</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
