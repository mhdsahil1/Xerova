// ============================================
// XEROVA Type Definitions
// ============================================

// --- User ---
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  provider: "credentials" | "google";
  role: "analyst" | "admin";
  apiKeys?: {
    virusTotal?: string;
    shodan?: string;
    abuseIPDB?: string;
  };
  preferences?: {
    theme: "dark" | "light" | "system";
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// --- Threat Intelligence ---
export type ThreatType = "ip" | "domain" | "hash" | "url" | "cve";

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";

export interface ThreatSearchResult {
  query: string;
  type: ThreatType;
  riskScore: number;
  severity: SeverityLevel;
  summary: string;
  details: Record<string, unknown>;
  tags: string[];
  references: string[];
  timestamp: Date;
}

export interface IP2LocationData {
  ip: string;
  countryCode: string;
  countryName: string;
  regionName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  zipCode: string;
  timeZone: string;
  asn: string;
  asName: string;
  isProxy: boolean;
}

export interface HostedDomainsData {
  ip: string;
  totalDomains: number;
  page: number;
  perPage: number;
  totalPages: number;
  domains: string[];
}

export interface IP2WhoisContact {
  name?: string;
  organization?: string;
  streetAddress?: string;
  city?: string;
  region?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  fax?: string;
  email?: string;
}

export interface IP2WhoisData {
  domain: string;
  domainId?: string;
  status?: string;
  createDate?: string;
  updateDate?: string;
  expireDate?: string;
  domainAge?: number;
  whoisServer?: string;
  registrar?: {
    ianaId?: string;
    name?: string;
    url?: string;
  };
  registrant?: IP2WhoisContact;
  admin?: IP2WhoisContact;
  tech?: IP2WhoisContact;
  billing?: IP2WhoisContact;
  nameservers?: string[];
}

export interface IPStackSecurity {
  isProxy: boolean;
  proxyType?: string;
  isCrawler: boolean;
  crawlerName?: string;
  crawlerType?: string;
  isTor: boolean;
  threatLevel: string;
  threatTypes: string[];
}

export interface IPStackData {
  ip: string;
  type: string;
  continentCode: string;
  continentName: string;
  countryCode: string;
  countryName: string;
  regionCode: string;
  regionName: string;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
  asn?: string;
  isp?: string;
  security?: IPStackSecurity;
}

export interface PhishStatsData {
  id?: string;
  url: string;
  domain?: string;
  ip?: string;
  country?: string;
  countryCode?: string;
  asn?: string;
  score: number; // 0-10
  tags: string[];
  targetBrand?: string;
  title?: string;
  threatType?: string;
  date?: string;
}

export interface URLScanData {
  uuid: string;
  url: string;
  domain: string;
  ip?: string;
  country?: string;
  asn?: string;
  server?: string;
  screenshotUrl?: string;
  reportUrl?: string;
  malicious: boolean;
  score: number;
  categories: string[];
  technologies: string[];
  status?: number;
  title?: string;
  date?: string;
}

export interface CheckPhishData {
  jobId: string;
  url: string;
  status: "PENDING" | "DONE";
  disposition: "phish" | "clean" | "suspicious" | "unknown";
  brand?: string;
  insights?: string;
  scanTime?: string;
  screenshotUrl?: string;
  resolved: boolean;
}

export interface CloudmersiveData {
  cleanResult: boolean;
  websiteThreatType?: string;
  foundViruses: Array<{ fileName: string; virusName: string }>;
  isThreat?: boolean;
  threatType?: string;
}

export interface GoogleSafeBrowsingData {
  isSafe: boolean;
  isThreat: boolean;
  threatTypes: string[];
  platformTypes: string[];
  matches?: Array<{
    threatType: string;
    platformType: string;
    threatEntryType: string;
    url?: string;
  }>;
}

export type TargetClassification = "url" | "domain" | "ip";

export interface AnalysisCoverage {
  totalRelevant: number;
  responded: number;
  threats: number;
  clean: number;
  errors: number;
  timeouts: number;
  unavailable: number;
  unknown: number;
  percentage: number;
}

export type ProviderStatus =
  | "threat"
  | "clean"
  | "error"
  | "timeout"
  | "unavailable"
  | "unknown";

export interface NormalizedProviderResult {
  provider: string;
  status: ProviderStatus;
  evidence: string[];
  scoreContribution: number;
  error?: string;
  relevance?: "exact" | "domain" | "related" | "historical";
  details?: Record<string, unknown>;
}

export interface IPResult {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  zipCode?: string;
  timeZone?: string;
  isp: string;
  org: string;
  asn: string;
  hostname?: string;
  reputation: number;
  isVPN: boolean;
  isTor: boolean;
  isProxy: boolean;
  isBot: boolean;
  abuseReports: number;
  lastReportedAt?: string;
  whois: Record<string, string>;
  ports?: number[];
  threats: ThreatReference[];
  ip2location?: IP2LocationData | null;
  ipstack?: IPStackData | null;
  hostedDomains?: HostedDomainsData | null;
  cloudmersive?: CloudmersiveData | null;
  sources?: string[];
  riskScore?: number;
  severity?: SeverityLevel;
}

export interface DomainResult {
  domain: string;
  registrar: string;
  registeredDate: string;
  expiryDate: string;
  domainAge?: number | null;
  nameservers: string[];
  status: string[];
  country: string;
  reputation: number;
  dnsRecords: DNSRecord[];
  sslCert?: SSLCertInfo;
  threats: ThreatReference[];
  ip2whois?: IP2WhoisData | null;
  urlscan?: URLScanData | null;
  phishstats?: PhishStatsData | null;
  googleSafeBrowsing?: GoogleSafeBrowsingData | null;
  sources?: string[];
  riskScore?: number;
  severity?: SeverityLevel;
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

export interface SSLCertInfo {
  issuer: string;
  validFrom: string;
  validTo: string;
  subject: string;
  serialNumber: string;
  fingerprint: string;
}

export interface HashResult {
  hash: string;
  hashType: "md5" | "sha1" | "sha256";
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  detections: Detection[];
  detectionRate: string;
  firstSeen?: string;
  lastSeen?: string;
  tags: string[];
}

export interface Detection {
  engine: string;
  detected: boolean;
  result?: string;
  version?: string;
}

export interface CVEResult {
  id: string;
  description: string;
  cvssScore: number;
  cvssVector: string;
  severity: SeverityLevel;
  publishedDate: string;
  modifiedDate: string;
  affectedProducts: AffectedProduct[];
  references: CVEReference[];
  cwe: string[];
  exploitAvailable: boolean;
  patchAvailable: boolean;
}

export interface AffectedProduct {
  vendor: string;
  product: string;
  versions: string[];
}

export interface CVEReference {
  url: string;
  source: string;
  tags: string[];
}

export interface ThreatReference {
  source: string;
  description: string;
  date: string;
  severity: SeverityLevel;
}

// --- AI Assistant ---
export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  relatedThreats: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

// --- Reports ---
export interface Report {
  _id: string;
  userId: string;
  title: string;
  type: "investigation" | "threat_analysis" | "incident";
  summary: string;
  findings: Finding[];
  iocs: IOC[];
  riskScore: number;
  relatedSearches: string[];
  relatedConversations: string[];
  status: "draft" | "finalized";
  createdAt: Date;
  updatedAt: Date;
}

export interface Finding {
  title: string;
  description: string;
  severity: SeverityLevel;
  evidence: string;
}

export interface IOC {
  type: "ip" | "domain" | "hash" | "url" | "email" | "cve";
  value: string;
  context: string;
}

// --- Dashboard ---
export interface DashboardStats {
  totalInvestigations: number;
  threatScore: number;
  criticalThreats: number;
  reportsGenerated: number;
  recentSearches: ThreatSearchResult[];
  riskDistribution: RiskDistributionItem[];
  trendData: TrendDataPoint[];
}

export interface RiskDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface TrendDataPoint {
  date: string;
  investigations: number;
  threats: number;
}

// --- Settings ---
export interface UserSettings {
  userId: string;
  theme: "dark" | "light" | "system";
  apiKeys: {
    virusTotal?: string;
    shodan?: string;
    abuseIPDB?: string;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    digest: boolean;
  };
}

// --- Navigation ---
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}
