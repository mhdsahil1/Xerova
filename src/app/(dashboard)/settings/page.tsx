"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Shield, Moon, Sun, Monitor } from "lucide-react";
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
          Manage your account profile and workstation preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="profile" className="text-xs md:text-sm">
            <User className="w-3.5 h-3.5 mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs md:text-sm">
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Preferences
          </TabsTrigger>
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
                  <span className="text-xs font-medium capitalize">{session?.user?.role || "SOC Analyst"}</span>
                </div>
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

