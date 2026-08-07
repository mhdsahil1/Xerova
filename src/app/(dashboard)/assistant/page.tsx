"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ShieldAlert, Wifi, Globe, Hash, Bot, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  iocs?: { type: string; value: string }[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am the XEROVA rule-based analyst assistant. Paste any text containing IP addresses, domains, or hashes, and I will extract them for you so you can quickly analyze them.",
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Simple Regex Extractors
  const extractIOCs = (text: string) => {
    const iocs: { type: string; value: string }[] = [];
    
    // Extract IPs (IPv4)
    const ipv4Regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = text.match(ipv4Regex) || [];
    ips.forEach(ip => {
      // Basic filter out local IPs
      if (!ip.startsWith("127.") && !ip.startsWith("10.") && !ip.startsWith("192.168.")) {
        if (!iocs.find(i => i.value === ip)) iocs.push({ type: "ip", value: ip });
      }
    });

    // Extract Hashes (MD5, SHA1, SHA256)
    const hashRegex = /\b[A-Fa-f0-9]{32}\b|\b[A-Fa-f0-9]{40}\b|\b[A-Fa-f0-9]{64}\b/g;
    const hashes = text.match(hashRegex) || [];
    hashes.forEach(hash => {
      if (!iocs.find(i => i.value === hash)) iocs.push({ type: "hash", value: hash });
    });

    // Extract Domains (very basic)
    const domainRegex = /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const domains = text.match(domainRegex) || [];
    domains.forEach(domain => {
      // Filter out IPs that got caught by domain regex
      if (!domain.match(/^[0-9.]+$/) && !iocs.find(i => i.value === domain)) {
        iocs.push({ type: "domain", value: domain });
      }
    });

    return iocs;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate processing delay
    setTimeout(() => {
      const extracted = extractIOCs(userMsg.content);
      
      let responseContent = "";
      if (extracted.length === 0) {
        responseContent = "I couldn't detect any actionable IOCs (IPs, domains, or hashes) in your message.";
      } else {
        responseContent = `I found ${extracted.length} indicator(s) of compromise. Click on any of them below to run a full threat analysis.`;
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        iocs: extracted,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800);
  };

  const runAnalysis = (ioc: { type: string; value: string }) => {
    window.location.href = `/threats?q=${encodeURIComponent(ioc.value)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-[calc(100vh-8rem)] flex flex-col"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-primary" />
          AI Assistant <Badge variant="secondary" className="text-[10px] ml-2">Rule-Based Mode</Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          Extract and analyze IOCs from raw logs, emails, or threat intel reports.
        </p>
      </div>

      <Card className="flex-1 flex flex-col bg-card/50 border-border/50 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-cyber-cyan to-cyber-blue text-white"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className={`space-y-2 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary/20 border border-primary/30 text-foreground"
                        : "bg-background/50 border border-border/50"
                    }`}
                  >
                    {msg.content}
                  </div>
                  
                  {/* Extracted IOCs */}
                  {msg.iocs && msg.iocs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.iocs.map((ioc, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs bg-background hover:bg-accent hover:border-primary transition-all group"
                          onClick={() => runAnalysis(ioc)}
                        >
                          {ioc.type === "ip" && <Wifi className="w-3 h-3 mr-1.5 text-blue-400 group-hover:text-primary transition-colors" />}
                          {ioc.type === "domain" && <Globe className="w-3 h-3 mr-1.5 text-green-400 group-hover:text-primary transition-colors" />}
                          {ioc.type === "hash" && <Hash className="w-3 h-3 mr-1.5 text-orange-400 group-hover:text-primary transition-colors" />}
                          {ioc.value}
                          <ShieldAlert className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 max-w-[80%]"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-blue text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <CardFooter className="p-4 border-t border-border/50 bg-background/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste logs, emails, or text containing IOCs..."
              className="flex-1 bg-background/50 border-border/50 focus:border-primary"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:opacity-90 text-white shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
