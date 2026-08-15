"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Shield, Key } from "lucide-react";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and API integrations
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-background/50 border border-border/50">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="api"><Key className="w-4 h-4 mr-2" /> API Keys</TabsTrigger>
          <TabsTrigger value="preferences"><Settings className="w-4 h-4 mr-2" /> Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card className="bg-card/50 border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input defaultValue={session?.user?.name || ""} disabled className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input defaultValue={session?.user?.email || ""} disabled className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-sm capitalize">{(session?.user as Record<string, unknown>)?.role as string || "Analyst"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card className="bg-card/50 border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Global API Integrations</CardTitle>
              <CardDescription>
                These keys are configured at the environment level for all users in this deployment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">VirusTotal</label>
                <Input value="*************************" disabled type="password" className="bg-background/50" />
                <p className="text-xs text-muted-foreground">Status: Configured globally in .env</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">AbuseIPDB</label>
                <Input value="*************************" disabled type="password" className="bg-background/50" />
                <p className="text-xs text-muted-foreground">Status: Configured globally in .env</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shodan</label>
                <Input value="*************************" disabled type="password" className="bg-background/50" />
                <p className="text-xs text-muted-foreground">Status: Configured globally in .env</p>
              </div>
              <div className="bg-status-info/10 border border-status-info/20 text-status-info p-4 rounded-lg text-sm">
                XEROVA is currently running in managed mode. API keys are handled by the system administrator.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card className="bg-card/50 border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Appearance & Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mounted && (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Theme Preference</h4>
                    <p className="text-xs text-muted-foreground">Select your UI theme</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>Light</Button>
                    <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>Dark</Button>
                    <Button variant={theme === "system" ? "default" : "outline"} size="sm" onClick={() => setTheme("system")}>System</Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Email Alerts</h4>
                  <p className="text-xs text-muted-foreground">Receive critical threat alerts via email</p>
                </div>
                <Button variant="outline" size="sm" disabled>Enabled</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
