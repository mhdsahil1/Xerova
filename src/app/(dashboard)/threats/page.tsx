"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Hash,
  Link2,
  ShieldAlert,
  Loader2,
  Clock,
  Wifi,
  MapPin,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRiskColor, getRiskLabel, getSeverityColor } from "@/lib/utils";

// --- API Error Handling ---
function ApiErrorAlert({ error }: { error: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3">
      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-sm">Lookup Failed</h4>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );
}

export default function ThreatsPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<string>("auto");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [resultType, setResultType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultData, setResultData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasResults(false);
    setResultData(null);

    try {
      const type = searchType === "auto" ? undefined : searchType;
      const res = await fetch("/api/threats/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lookup failed");
      }

      setResultType(data.type);
      setResultData(data.results);
      setHasResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 text-primary" />
          Threat Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Search and analyze IPs, domains, hashes, URLs, and CVEs
        </p>
      </div>

      {/* Search Bar */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter IP, domain, hash, URL, or CVE ID..."
                  className="pl-11 h-12 text-base bg-background/50 border-border/50 focus:border-primary font-mono"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-8 bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:opacity-90 text-white font-semibold"
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>

            {/* Type Selector */}
            <Tabs
              value={searchType}
              onValueChange={setSearchType}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-6 bg-background/50">
                <TabsTrigger value="auto" className="text-xs">
                  Auto
                </TabsTrigger>
                <TabsTrigger value="ip" className="text-xs">
                  <Wifi className="w-3 h-3 mr-1" />
                  IP
                </TabsTrigger>
                <TabsTrigger value="domain" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  Domain
                </TabsTrigger>
                <TabsTrigger value="hash" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  Hash
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs">
                  <Link2 className="w-3 h-3 mr-1" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="cve" className="text-xs">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  CVE
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ApiErrorAlert error={error} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <ShieldAlert className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Analyzing threat data across global sources...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {hasResults && !isSearching && resultData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {resultData.error ? (
              <ApiErrorAlert error={resultData.error} />
            ) : resultData.status === "queued" ? (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-4 rounded-lg flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Analysis Queued</h4>
                  <p className="text-sm mt-1">{resultData.message}</p>
                </div>
              </div>
            ) : resultType === "ip" || resultType === "domain" ? (
              <IPDomainResultView data={resultData} type={resultType} />
            ) : resultType === "cve" ? (
              <CVEResultView data={resultData} />
            ) : resultType === "hash" ? (
              <HashResultView data={resultData} />
            ) : resultType === "url" ? (
              <URLResultView data={resultData} />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!hasResults && !isSearching && !error && (
        <div className="text-center py-16">
          <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Enter a query to begin
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Search for an IP address, domain, file hash, URL, or CVE ID
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["8.8.8.8", "example.com", "CVE-2024-3094"].map((example) => (
              <Badge
                key={example}
                variant="outline"
                className="cursor-pointer hover:bg-accent/50 transition-colors font-mono"
                onClick={() => setQuery(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// Sub-components
// ==========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IPDomainResultView({ data, type }: { data: any; type: string }) {
  const isIP = type === "ip";
  const title = isIP ? data.ip : data.domain;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl font-mono font-bold">{title}</span>
              <Badge
                className={`capitalize border ${getSeverityColor(data.severity || "info")}`}
                variant="outline"
              >
                Risk: {data.riskScore}/100
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem
                icon={MapPin}
                label="Location"
                value={
                  data.country
                    ? `${data.city ? data.city + ", " : ""}${data.country}`
                    : "Unknown"
                }
              />
              {isIP && (
                <InfoItem icon={Server} label="ISP" value={data.isp || "N/A"} />
              )}
              {isIP && (
                <InfoItem icon={Globe} label="ASN" value={data.asn || "N/A"} />
              )}
              {!isIP && (
                <InfoItem
                  icon={Server}
                  label="Registrar"
                  value={data.registrar || "N/A"}
                />
              )}
              {isIP && (
                <InfoItem
                  icon={AlertTriangle}
                  label="Abuse Reports"
                  value={data.abuseReports?.toString() || "0"}
                />
              )}
              {!isIP && data.resolvedIP && (
                <InfoItem
                  icon={Wifi}
                  label="Resolved IP"
                  value={data.resolvedIP}
                />
              )}
            </div>
          </div>
          <div className="w-full md:w-48 p-6 flex flex-col items-center justify-center bg-background/30 border-t md:border-t-0 md:border-l border-border/30">
            <span
              className={`text-5xl font-bold ${getRiskColor(data.riskScore || 0)}`}
            >
              {data.riskScore || 0}
            </span>
            <span
              className={`text-sm font-medium mt-1 ${getRiskColor(data.riskScore || 0)}`}
            >
              {getRiskLabel(data.riskScore || 0)}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        {data.sources?.map((s: string) => (
          <Badge key={s} variant="secondary" className="text-[10px]">
            Source: {s}
          </Badge>
        ))}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Flags */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Detection Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FlagItem label="VPN" detected={data.isVPN || false} />
            <FlagItem label="Tor Exit Node" detected={data.isTor || false} />
            <FlagItem label="Proxy" detected={data.isProxy || false} />
            {isIP && <FlagItem label="Known Bot" detected={data.isBot || false} />}
          </CardContent>
        </Card>

        {/* Open Ports */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Open Ports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.ports?.length > 0 ? (
                data.ports.map((port: number) => (
                  <Badge key={port} variant="secondary" className="font-mono">
                    {port}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None detected</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Threats */}
        <Card className="bg-card/50 border-border/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Threat History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.threats?.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.threats.map((threat: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-[10px] capitalize border ${getSeverityColor(threat.severity)}`}
                      variant="outline"
                    >
                      {threat.severity}
                    </Badge>
                    <div>
                      <p className="text-sm">{threat.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {threat.source}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {threat.date}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No recent threat history found.</span>
            )}
          </CardContent>
        </Card>

        {/* WHOIS / SSL */}
        {(!isIP && data.sslCert) ? (
          <Card className="bg-card/50 border-border/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">SSL Certificate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between p-2 rounded bg-background/50">
                  <span className="text-sm text-muted-foreground">Issuer</span>
                  <span className="text-sm font-mono truncate max-w-[200px]">{data.sslCert.issuer}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-background/50">
                  <span className="text-sm text-muted-foreground">Subject</span>
                  <span className="text-sm font-mono truncate max-w-[200px]">{data.sslCert.subject}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-background/50">
                  <span className="text-sm text-muted-foreground">Valid From</span>
                  <span className="text-sm font-mono truncate">{data.sslCert.validFrom}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-background/50">
                  <span className="text-sm text-muted-foreground">Valid To</span>
                  <span className="text-sm font-mono truncate">{data.sslCert.validTo}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : data.whois && Object.keys(data.whois).length > 0 ? (
          <Card className="bg-card/50 border-border/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">WHOIS Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(data.whois).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between p-2 rounded bg-background/50"
                  >
                    <span className="text-sm text-muted-foreground">{key}</span>
                    <span className="text-sm font-mono truncate max-w-[200px]">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CVEResultView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl font-mono font-bold text-primary">
                {data.id}
              </span>
              <Badge
                className={`capitalize border ${getSeverityColor(data.severity)}`}
                variant="outline"
              >
                {data.severity}
              </Badge>
              {data.exploitAvailable && (
                <Badge variant="destructive" className="text-[10px]">
                  Exploit Available
                </Badge>
              )}
              {data.patchAvailable && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-green-400 border-green-400/30"
                >
                  Patch Available
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.description}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="text-muted-foreground">
                Published:{" "}
                <span className="text-foreground">{data.publishedDate}</span>
              </span>
              <span className="text-muted-foreground">
                Modified:{" "}
                <span className="text-foreground">{data.modifiedDate}</span>
              </span>
              {data.cwe?.length > 0 && (
                <span className="text-muted-foreground">
                  CWE: <span className="font-mono">{data.cwe.join(", ")}</span>
                </span>
              )}
            </div>
          </div>
          <div className="w-full md:w-48 p-6 flex flex-col items-center justify-center bg-background/30 border-t md:border-t-0 md:border-l border-border/30">
            <span
              className={`text-5xl font-bold ${getRiskColor(data.cvssScore * 10)}`}
            >
              {data.cvssScore}
            </span>
            <span className="text-xs text-muted-foreground mt-1 font-mono">
              CVSS
            </span>
            <span
              className={`text-sm font-medium mt-1 ${getRiskColor(data.cvssScore * 10)}`}
            >
              {getRiskLabel(data.cvssScore * 10)}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        {data.sources?.map((s: string) => (
          <Badge key={s} variant="secondary" className="text-[10px]">
            Source: {s}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.affectedProducts?.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Affected Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.affectedProducts.map((product: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{product.vendor}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm font-medium">{product.product}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {product.versions.slice(0, 10).map((v: any) => (
                      <Badge key={v} variant="secondary" className="font-mono text-xs">
                        {v}
                      </Badge>
                    ))}
                    {product.versions.length > 10 && (
                      <Badge variant="secondary" className="font-mono text-xs">...</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.references?.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">References</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.references.map((ref: any, idx: number) => (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{ref.source || "Link"}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {ref.url}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {ref.tags?.slice(0, 2).map((tag: any) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HashResultView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl font-mono font-bold truncate max-w-[300px]" title={data.meaningfulName || "Hash"}>
                {data.meaningfulName || "File Hash Analysis"}
              </span>
              <Badge
                className={`capitalize border ${getSeverityColor(data.severity || "info")}`}
                variant="outline"
              >
                Risk: {data.riskScore}/100
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">SHA-256</p>
                <p className="text-xs font-mono break-all">{data.sha256 || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">MD5</p>
                <p className="text-xs font-mono break-all">{data.md5 || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">File Type</p>
                <p className="text-sm">{data.fileType || "Unknown"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Detection Rate</p>
                <p className="text-sm font-semibold">{data.detectionRate}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="flex gap-2">
        {data.sources?.map((s: string) => (
          <Badge key={s} variant="secondary" className="text-[10px]">
            Source: {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function URLResultView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl font-mono font-bold truncate max-w-[300px]" title={data.url}>
                {data.url}
              </span>
              <Badge
                className={`capitalize border ${getSeverityColor(data.severity || "info")}`}
                variant="outline"
              >
                Risk: {data.riskScore}/100
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Final URL</p>
                <p className="text-sm font-mono break-all">{data.finalUrl || "N/A"}</p>
              </div>
              {data.title && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="text-sm">{data.title}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      <div className="flex gap-2">
        {data.sources?.map((s: string) => (
          <Badge key={s} variant="secondary" className="text-[10px]">
            Source: {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function FlagItem({
  label,
  detected,
}: {
  label: string;
  detected: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
      <span className="text-sm">{label}</span>
      {detected ? (
        <div className="flex items-center gap-1 text-severity-critical">
          <XCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Detected</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-medium">Clean</span>
        </div>
      )}
    </div>
  );
}
