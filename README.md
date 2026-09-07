<div align="center">

<a href="https://xerova-lab.vercel.app" target="_blank" rel="noopener noreferrer">
  <img src="./public/xerova-icon.svg" alt="XEROVA Brand Emblem" width="100" height="100" />
</a>

# 🛡️ XEROVA `v2.0`

### Next-Gen Autonomous Threat Intelligence & Cybersecurity Investigation Platform

*Investigate. Correlate. Automate. Defend.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-000000?style=for-the-badge&logo=nextdotjs)](https://authjs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[🌐 Live Console](https://xerova-lab.vercel.app)
•
[📖 Documentation](#-installation)
•
[⚡ Telemetry Engines](#-integrated-threat-intelligence-22-engines)
•
[🗺️ Roadmap](#-roadmap)
•
[🐞 Report Bug](../../issues)

</div>

---

# 📖 Overview

**XEROVA v2.0** is an enterprise-grade threat intelligence and security operations platform engineered for security researchers, SOC analysts, incident responders, and developers. 

Instead of juggling dozens of disconnected threat lookup tools, XEROVA orchestrates and normalizes telemetry across **22+ cybersecurity engines**, AI reasoning models, and live news streams into a single, high-performance command center.

From real-time IP reputation and zero-day CVE tracking to deep URL heuristic inspection, QR-code phishing detection, and AI-assisted triage, XEROVA accelerates threat containment from hours to seconds.

---

# ✨ What's New in Version 2.0

- 📰 **Live Cyber Threat & Security News Feed**: Powered by NewsData.io with intelligent 15-minute caching and instant filtering for Data Breaches, Ransomware, Vulnerabilities, and AI Security.
- 🔗 **Deep Malicious URL & Brand Impersonation Engine**: Multi-stage structural inspection, punycode homograph detection, redirect chain unshortening, and dynamic risk scoring (0–100).
- 🤖 **Dual AI Copilot (Google Gemini + Groq LLaMA 3)**: Autonomous threat reasoning, instant IOC extraction, and tailored incident remediation playbooks.
- 📡 **Real-Time Telemetry Pulses**: Integrated AlienVault OTX Threat Pulses and NIST National Vulnerability Database (NVD) CVE live feeds.
- 📱 **QR Code Quishing Classifier**: Real-time QR decoder and payload classifier to identify obfuscated credential theft vectors.
- 📑 **High-Fidelity PDF & Markdown Reporting**: One-click executive incident report generation powered by `@react-pdf/renderer`.
- 🔐 **Hardened Auth & Email Verification**: Auth.js v5 with Google OAuth, Gmail OAuth2 transactional tokens with expiration notices, and Google reCAPTCHA v3 protection.
- ⚡ **Next-Gen Stack**: Upgraded to **Next.js 16**, **React 19**, **Tailwind CSS v4**, and responsive 3D tilt spotlight components.

---

# 🚀 Core Capabilities

### 🔍 1. Multi-Vector Threat Intelligence
- **IP Reputation**: Abuse confidence scoring, ISP/ASN data, geolocation, open ports, and VPN/Tor/Proxy flags.
- **Domain & DNS Intelligence**: WHOIS registration age, registrar history, reverse IP hosting, and passive DNS records.
- **URL & Website Analysis**: Heuristic scanning, sandbox DOM inspection, screenshot previews, and brand impersonation detection.
- **File Hash Analysis**: MD5, SHA-1, and SHA-256 multi-engine antivirus detection ratios.
- **CVE & Exploit Telemetry**: CVSS v3.1 severity metrics, affected software CPEs, and mitigation advisories.

### 📰 2. Live Cyber Threat News Stream
- Continuous news aggregation powered by NewsData.io API.
- Filter by: **All News**, **Breaches & Ransomware**, **Vulnerabilities**, and **AI Security**.
- Server-side caching protects API quota and ensures sub-second page loads.
- Direct source links, verified source favicons, and relative publication timestamps.

### 🔗 3. Deep URL Inspection & Phishing Defense
- Structural analysis: URL length, port anomalies, character encoding obfuscation, and protocol validation.
- Domain impersonation: Levenshtein distance matching against protected corporate brands (PayPal, Microsoft, Google, etc.).
- Punycode & IDN homograph attack identification.
- Redirect chain tracing to reveal hidden destination landing pages.

### 🤖 4. AI Security Analyst (Gemini & Groq)
- Automated extraction of Indicators of Compromise (IOCs) from unstructured logs, incident notes, or emails.
- Natural-language investigation assistance and threat landscape context.
- Generates executive summaries, technical impact analyses, and containment recommendations.

### 📊 5. Threat Operations Dashboard
- **Threat Score Gauge**: Unified 0–100 risk posture calculation.
- **Trend Visualizations**: 7-day threat intelligence curves and severity distribution charts via Recharts.
- **Live Threat Pulses**: Interactive 3D tilt cards showcasing real-time AlienVault OTX advisories.
- **Recent CVEs**: Live feeds from NIST NVD with instant threat lookup pivoting.

### 📑 6. Incident Reporting & Export
- Create, manage, and collaborate on investigation dossiers.
- Export findings into formatted **JSON**, clean **Markdown**, or boardroom-ready **PDF documents**.

---

# 🌐 Integrated Threat Intelligence (22+ Engines)

| Engine / Service | Primary Intelligence Role |
| :--- | :--- |
| **VirusTotal** | Multi-engine antivirus detection for hashes, URLs, domains, and IPs |
| **AbuseIPDB** | IP abuse confidence scoring and global blacklist community reports |
| **Shodan** | Internet-connected device telemetry, open ports, service banners, and SSL certs |
| **NewsData.io** | Real-time global cybersecurity news, ransomware advisories, and breach feeds |
| **AlienVault OTX** | Global threat pulses, adversary tracking, and community IOC verification |
| **NIST NVD** | Official National Vulnerability Database CVE scoring and vulnerability feeds |
| **Google Gemini AI** | Deep threat analysis, multi-stage reasoning, and autonomous investigation summaries |
| **Groq (LLaMA 3)** | Ultra-fast low-latency inference for real-time IOC extraction and parsing |
| **Criminal IP** | Inbound/outbound risk scoring, honeypot hits, VPN/Tor/Proxy/Darkweb mapping |
| **urlscan.io** | Automated browser sandbox execution, DOM analysis, and page screenshots |
| **CheckPhish.ai** | Computer vision and AI brand impersonation / credential theft detection |
| **PhishStats** | Real-time phishing URL threat feed and targeted brand scoring |
| **alphaMountain.ai** | AI-driven URI classification, risk level assessment, and domain categories |
| **URLQuery** | Web sandbox report search and malicious redirection tracking |
| **Yandex Safe Browsing** | Signature matches for malicious web assets and deceptive sites |
| **IP2Location** | High-precision IP geolocation, ASN routing, and proxy detection |
| **IP2WHOIS** | Domain registration WHOIS records, domain age, and reverse IP hosting |
| **IPStack** | IP geolocation telemetry and network connection verification |
| **Mailboxlayer** | MX record validation, disposable email detection, and SMTP syntax checks |
| **Cloudmersive Security** | Anti-malware website virus scanning and advanced threat detection |
| **Pulsedive** | Community-driven threat intelligence, active feeds, and risk scoring |
| **Google Safe Browsing** | Enterprise-grade phishing and malware domain verification |

---

# 🛠 Tech Stack

### Frontend & UI
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/) & [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/)

### Backend & Storage
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [Auth.js v5](https://authjs.dev/) (NextAuth v5 beta) with Google OAuth & Credentials
- **Email Infrastructure**: Gmail API via Google OAuth2 & Resend

### Security & Compliance
- **Anti-Bot Defense**: Google reCAPTCHA v3
- **Network Guards**: SSRF protection, strict input validation via Zod, and rate-limiting middleware

---

# 📂 Project Structure

```text
XEROVA/
├── public/                     # Brand emblems, SVGs, and static assets
│   ├── xerova-icon.svg         # Primary glowing emblem
│   └── XEROVA final.svg        # Official wordmark
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, Register, Email Verification
│   │   ├── (dashboard)/        # Main SOC Console & Features
│   │   │   ├── dashboard/      # Primary telemetry overview & Live News
│   │   │   ├── threats/        # Unified Threat & URL Investigator
│   │   │   ├── vulnerabilities/# CVE & NVD Vulnerability Explorer
│   │   │   ├── assistant/      # AI Copilot & Automated Analysis
│   │   │   ├── reports/        # Investigation Dossiers & PDF Generation
│   │   │   ├── browser-guard/  # Extension Management & Telemetry
│   │   │   └── settings/       # User Preferences & API Key Vault
│   │   └── api/                # Secure authenticated Next.js route handlers
│   │       ├── dashboard/      # Telemetry streams (News, CVEs, Pulses, Stats)
│   │       ├── threats/        # Multi-engine threat & URL analysis
│   │       ├── assistant/      # Gemini & Groq AI analyst endpoints
│   │       └── reports/        # Incident report CRUD & exports
│   ├── components/             # Reusable UI & dashboard instruments
│   │   ├── dashboard/          # LiveCyberNews, LatestCVEs, ThreatGauge, etc.
│   │   ├── layout/             # AppSidebar, Navbar, ThemeToggle
│   │   └── ui/                 # Accessible primitives & custom cards
│   ├── lib/                    # Security engines, AI clients & database
│   │   ├── news-api.ts         # NewsData.io integration & caching
│   │   ├── threat-apis.ts      # Multi-engine threat intelligence client
│   │   ├── url-analyzer.ts     # Deep heuristic URL & phishing engine
│   │   ├── gemini.ts & groq.ts # AI copilot integrations
│   │   ├── qr-classifier.ts    # QR code quishing detector
│   │   └── auth.ts             # Auth.js v5 configuration
│   ├── models/                 # Mongoose schemas (User, Report, SearchHistory)
│   └── types/                  # TypeScript interface declarations
└── README.md
```

---

# 🚀 Installation & Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- MongoDB database instance (e.g. MongoDB Atlas)

### Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/mhdsahil1/XEROVA.git
   cd XEROVA
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the template and fill in your API credentials:
   ```bash
   cp .env.example .env.local
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to access the console.

---

# ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following keys:

```env
# ===========================================
# Core Authentication & Application URL
# ===========================================
AUTH_SECRET=your-random-32-char-auth-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===========================================
# Database
# ===========================================
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/xerova?retryWrites=true&w=majority

# ===========================================
# Threat Intelligence & Telemetry APIs
# ===========================================
VIRUSTOTAL_API_KEY=your_virustotal_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
SHODAN_API_KEY=your_shodan_key
CRIMINAL_IP_API_KEY=your_criminal_ip_key
ABUSIX_API_KEY=your_abusix_key
OTX_API_KEY=your_alienvault_otx_key
NVD_API_KEY=your_nvd_api_key
PULSEDIVE_API_KEY=your_pulsedive_key
URL_QUERY_API_KEY=your_urlquery_key
ALPHA_MOUNTAIN_API=your_alphamountain_key
YANDEX_API_KEY=your_yandex_key
IP2LOCATION_API_KEY=your_ip2location_key
IP2WHOIS_API_KEY=your_ip2whois_key
IPSTACK_API_KEY=your_ipstack_key
MAILBOXLAYER_API_KEY=your_mailboxlayer_key
PHISHSTATS_API_KEY=your_phishstats_key
URLSCAN_IO_API_KEY=your_urlscan_key
CHECKPHISH_API_KEY=your_checkphish_key
CLOUDMERSIVE_API_KEY=your_cloudmersive_key
GOOGLE_SAFE_BROWSING_API_KEY=your_google_safe_browsing_key

# ===========================================
# Live Cyber News
# ===========================================
NEWSDATA_API_KEY=your_newsdata_api_key

# ===========================================
# AI Copilot Engines
# ===========================================
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# ===========================================
# Bot Defense (reCAPTCHA)
# ===========================================
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# ===========================================
# Transactional Email (Gmail OAuth / Resend)
# ===========================================
GMAIL_CLIENT_ID=your_gmail_oauth_client_id
GMAIL_CLIENT_SECRET=your_gmail_oauth_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
GMAIL_USER=your_email@gmail.com
RESEND_API_KEY=your_resend_key
```

---

# 🗺️ Roadmap

- [x] **Core Multi-Engine Threat Search** (IP, Domain, Hash, URL, CVE)
- [x] **Next.js 16 & React 19 Upgrade** with Tailwind CSS v4
- [x] **Real-Time Cyber News Stream** (NewsData.io integration with auto-categorization)
- [x] **Deep Malicious URL & Brand Impersonation Detector**
- [x] **AlienVault OTX & NIST NVD Live Telemetry Pulses**
- [x] **AI Security Analyst Copilot** (Gemini 2.5 + Groq LLaMA 3)
- [x] **High-Fidelity PDF & Markdown Report Export**
- [x] **Hardened Authentication with Gmail OAuth2 Verification**
- [x] **Dark / Light Glassmorphism Adaptive UI**
- [ ] **Multi-Tenant Team Workspaces & Role-Based Access (RBAC)**
- [ ] **Custom SIEM & Webhook Alerting (Splunk, Elastic, Discord, Slack)**
- [ ] **Automated Remediation Playbook Orchestration**
- [ ] **Chrome & Firefox Browser Guard Extension Store Release**

---

# 🤝 Contributing

Contributions, bug reports, and suggestions are warmly welcomed!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m "Add new threat engine integration"`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

# 👥 Authors & Contributors

### 🚀 Project Creator & Lead Architect

**Muhammed Sahil**  
*Lead Developer & Security Architect*

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mhdsahil1)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mhdsahil09)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://v0-sahil-dev.vercel.app/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:muhammedsahil182@gmail.com)

---

### 🌟 Contributors

Special thanks to the following contributors for their ongoing support to the XEROVA platform:

- **Hamza Raseel** ([@hamzaraseel7](https://github.com/hamzaraseel7)) — *Malicious URL detection & heuristic pattern analysis*
- **Abhinav** — *Threat intelligence features & URL pattern algorithms*
- **Nikedh** — *Security testing, feature research & platform enhancements*

---

## ⭐ Support

If XEROVA helps you investigate threats and protect your infrastructure, please consider giving it a ⭐ on GitHub!

---

<div align="center">

Built with ❤️ for the global cybersecurity and threat intelligence community.

</div>