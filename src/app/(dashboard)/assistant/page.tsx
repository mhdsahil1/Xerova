"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ShieldAlert, Wifi, Globe, Hash, Bot, User, Sparkles } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  iocs?: { type: string; value: string }[];
}

// Simple IOC extraction for clickable badges (fallback + enhancement)
function extractIOCs(text: string) {
  const iocs: { type: string; value: string }[] = [];
  const seen = new Set<string>();

  const addIOC = (type: string, value: string) => {
    const key = `${type}:${value}`;
    if (!seen.has(key)) {
      seen.add(key);
      iocs.push({ type, value });
    }
  };

  // Extract IPs (IPv4)
  const ipv4Regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const ips = text.match(ipv4Regex) || [];
  ips.forEach(ip => {
    if (!ip.startsWith("127.") && !ip.startsWith("10.") && !ip.startsWith("192.168.")) {
      addIOC("ip", ip);
    }
  });

  // Extract Hashes (MD5, SHA1, SHA256)
  const hashRegex = /\b[A-Fa-f0-9]{32}\b|\b[A-Fa-f0-9]{40}\b|\b[A-Fa-f0-9]{64}\b/g;
  const hashes = text.match(hashRegex) || [];
  hashes.forEach(hash => addIOC("hash", hash));

  // Extract Domains (basic)
  const domainRegex = /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  const domains = text.match(domainRegex) || [];
  domains.forEach(domain => {
    if (!domain.match(/^[0-9.]+$/)) {
      addIOC("domain", domain);
    }
  });

  // Extract CVEs
  const cveRegex = /\bCVE-\d{4}-\d{4,}\b/gi;
  const cves = text.match(cveRegex) || [];
  cves.forEach(cve => addIOC("cve", cve.toUpperCase()));

  return iocs;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm **XEROVA AI**, your cybersecurity analyst assistant powered by Gemini. I can help you:\n\n- 🔍 **Analyze IOCs** — paste IPs, domains, hashes, or CVEs\n- 🛡️ **Explain threats** — understand attack patterns and TTPs\n- 📋 **Write playbooks** — incident response and remediation\n- 📊 **Summarize reports** — break down security advisories\n\nHow can I assist you today?",
    }
  ]);
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userContent = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      iocs: extractIOCs(userContent),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Build messages array for the API (exclude the initial greeting)
      const chatMessages = [...messages.filter(m => m.id !== "1"), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Extract IOCs from the AI response too
      const responseIOCs = extractIOCs(data.response);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        iocs: responseIOCs.length > 0 ? responseIOCs : undefined,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Store conversation ID for follow-up messages
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err instanceof Error
          ? `⚠️ ${err.message}`
          : "⚠️ Something went wrong. Please try again.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const runAnalysis = (ioc: { type: string; value: string }) => {
    if (ioc.type === "cve") {
      router.push(`/threats?query=${encodeURIComponent(ioc.value)}&type=cve`);
    } else {
      router.push(`/threats?q=${encodeURIComponent(ioc.value)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-[calc(100dvh-8rem)] flex flex-col"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-primary" />
          AI Assistant
          <Badge variant="secondary" className="text-[10px] ml-2 gap-1">
            <Sparkles className="w-3 h-3" />
            Gemini-Powered
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered cybersecurity analyst — analyze threats, explain findings, and get remediation guidance.
        </p>
      </div>

      <Card className="flex-1 flex flex-col bg-card/50 border-border/50 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6" role="log" aria-label="Conversation messages">
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
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-primary/20 border border-primary/30 text-foreground whitespace-pre-wrap"
                        : "bg-background/50 border border-border/50 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  
                  {/* Extracted IOCs as clickable badges */}
                  {msg.iocs && msg.iocs.length > 0 && (
                    <div className={`flex flex-wrap gap-2 mt-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.iocs.map((ioc, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs bg-background hover:bg-accent hover:border-primary transition-all group"
                          onClick={() => runAnalysis(ioc)}
                        >
                          {ioc.type === "ip" && <Wifi className="w-3 h-3 mr-1.5 text-status-info group-hover:text-primary transition-colors" />}
                          {ioc.type === "domain" && <Globe className="w-3 h-3 mr-1.5 text-status-success group-hover:text-primary transition-colors" />}
                          {ioc.type === "hash" && <Hash className="w-3 h-3 mr-1.5 text-severity-high group-hover:text-primary transition-colors" />}
                          {ioc.type === "cve" && <ShieldAlert className="w-3 h-3 mr-1.5 text-severity-critical group-hover:text-primary transition-colors" />}
                          {ioc.value.length > 40 ? ioc.value.slice(0, 37) + "..." : ioc.value}
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
                  aria-live="polite"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-blue text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 flex items-center gap-1">
                    <span className="sr-only">XEROVA AI is thinking</span>
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
              placeholder="Ask about threats, paste IOCs, or describe a security issue..."
              className="flex-1 bg-background/50 border-border/50 focus:border-primary"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:opacity-90 text-white shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
