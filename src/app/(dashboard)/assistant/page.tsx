"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ShieldAlert, Wifi, Globe, Hash, Bot, User, Sparkles, Copy, Check } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      content: "Hello! I'm **XEROVA AI**, your cybersecurity analyst assistant. I can help you:\n\n- 🔍 **Analyze IOCs** — paste IPs, domains, hashes, or CVEs\n- 🛡️ **Explain threats** — understand attack patterns and TTPs\n- 📋 **Write playbooks** — incident response and remediation\n- 📊 **Summarize reports** — break down security advisories\n\nHow can I assist you today?",
    }
  ]);
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Auto-scroll to bottom whenever messages or typing status updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-h-0 flex flex-col space-y-3"
    >
      <div className="shrink-0">
        <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-primary" />
          AI Security Assistant
          <Badge variant="secondary" className="text-[10px] ml-2 gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-primary" />
            Groq AI
          </Badge>
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Cybersecurity copilot for threat analysis, IOC triage, and remediation advice.
        </p>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col bg-card border-border overflow-hidden shadow-sm">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
          <div className="space-y-5" role="log" aria-label="Conversation messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold ${
                    msg.role === "assistant"
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className={`space-y-1.5 min-w-0 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`p-3.5 rounded-lg text-xs md:text-sm leading-relaxed select-text cursor-text ${
                      msg.role === "user"
                        ? "bg-primary/10 border border-primary/20 text-foreground whitespace-pre-wrap inline-block text-left"
                        : "bg-background/80 border border-border prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs"
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
                  
                  {/* Message action bar: 1-click Copy button and clickable IOC badges */}
                  <div className={`flex flex-wrap items-center gap-1.5 pt-0.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors gap-1"
                      title="Copy message text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-status-success" />
                          <span className="text-[10px] text-status-success font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </Button>

                    {msg.iocs && msg.iocs.map((ioc, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] font-mono bg-card hover:bg-accent hover:border-primary/50 transition-colors duration-150 group"
                        onClick={() => runAnalysis(ioc)}
                      >
                        {ioc.type === "ip" && <Wifi className="w-2.5 h-2.5 mr-1 text-status-info" />}
                        {ioc.type === "domain" && <Globe className="w-2.5 h-2.5 mr-1 text-status-success" />}
                        {ioc.type === "hash" && <Hash className="w-2.5 h-2.5 mr-1 text-severity-high" />}
                        {ioc.type === "cve" && <ShieldAlert className="w-2.5 h-2.5 mr-1 text-severity-critical" />}
                        {ioc.value.length > 35 ? ioc.value.slice(0, 32) + "..." : ioc.value}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 max-w-[85%]"
                  aria-live="polite"
                >
                  <div className="w-7 h-7 rounded-md bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border flex items-center gap-1.5">
                    <span className="sr-only">XEROVA AI is analyzing</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scroll anchor to guarantee clean visibility of last line of text */}
            <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
          </div>
        </div>

        <CardFooter className="shrink-0 p-3 border-t border-border bg-card/90 backdrop-blur-sm z-10">
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
              placeholder="Ask about threats, paste IOCs, or request remediation guidance..."
              className="flex-1 h-9 bg-card border-border focus:border-primary/60 text-xs"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="h-9 px-3 bg-primary text-primary-foreground shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
