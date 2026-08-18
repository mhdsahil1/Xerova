# XEROVA Malicious URL & Website Detection Module

## Overview

The Malicious URL & Website Detection module is XEROVA's advanced security feature for analyzing and detecting suspicious URLs and domains. It implements a sophisticated multi-stage analysis pipeline combining structural analysis, domain characteristics detection, and threat intelligence integration.

## Architecture

### Analysis Pipeline

```
URL Input
   ↓
URL Parser (Parse structure, extract components)
   ↓
Structural Analysis (HTTP/HTTPS, length, ports, encoding)
   ↓
Domain Analysis (Punycode, TLDs, hyphens, lookalikes, impersonation)
   ↓
Threat Intelligence Lookup (VirusTotal, AbuseIPDB)
   ↓
Risk Scoring Engine (Multi-factor scoring)
   ↓
Verdict & Report Generation
```

## Features

### 1. URL Structural Analysis

Detects malicious patterns in URL structure:

- **Protocol Detection**: HTTP vs HTTPS analysis
- **URL Length**: Excessive URLs (>75 chars) commonly hide malicious content
- **Subdomain Analysis**: Multiple subdomains often indicate phishing
- **IP-Based URLs**: Direct IP addresses instead of domains are suspicious
- **Suspicious Ports**: Non-standard ports (22, 23, 3389, etc.) indicate malicious intent
- **URL Encoding**: Hidden character encoding (e.g., %20, \x41)
- **Obfuscation Detection**: Unicode, hex escapes, and other obfuscation techniques

**Risk Score**: 0-25 points

### 2. Domain Characteristics Analysis

Identifies malicious domain patterns:

- **Punycode Detection** (xn--): Used in homograph attacks to impersonate legitimate domains
- **Suspicious TLDs**: Commonly abused extensions (.top, .tk, .ml, .ga, .cf, .xyz, etc.)
- **Excessive Hyphens**: More than 2 hyphens often indicate phishing domains
- **Lookalike Domains**: Detects misspellings of popular brands (e.g., "paypa1" → "paypal")
- **Brand Impersonation**: Patterns like "secure-login", "verify-account", "urgent-action"
- **Suspicious Keywords**: Detects phishing-related keywords in domain

**Risk Score**: 0-35 points

### 3. Threat Intelligence Integration

Multi-source threat intelligence:

#### VirusTotal Integration
- Malicious engines: Number of security vendors flagging as malicious
- Suspicious engines: Number of security vendors with concerns
- Reputation scoring
- Last analysis date tracking
- Category tracking (malware, phishing, trojan, etc.)

#### AbuseIPDB Integration
- Abuse confidence score (0-100%)
- Historical reports
- ASN and network information

#### Combined Intelligence
- Known malicious domain/URL detection
- Suspicious report aggregation
- Cross-source reputation verification

**Risk Score**: 0-40 points

### 4. Risk Scoring System

Multi-factor risk calculation:

```
Total Risk Score = URL Structural Risk + Domain Characteristic Risk + Threat Intelligence Risk
                 = (0-25) + (0-35) + (0-40)
                 = 0-100

Verdict Mapping:
- 0-24:   SAFE (Low Threat)
- 25-49:  SUSPICIOUS (Medium Threat)
- 50-74:  SUSPICIOUS (High Threat)
- 75-100: MALICIOUS (Critical Threat)
```

## API Endpoint

### URL Analysis Endpoint

**POST** `/api/threats/url-analysis`

#### Request
```json
{
  "url": "https://example.com/path"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "verdict": "SAFE",
    "riskScore": 15,
    "threatLevel": "LOW",
    
    "structural": {
      "protocol": "https",
      "domain": "example.com",
      "hostname": "example.com",
      "port": null,
      "path": "/",
      "query": "",
      "urlLength": 18,
      "subdominCount": 0,
      "isIPBased": false,
      "ipAddress": null
    },
    
    "urlCharacteristics": {
      "usesHTTPS": true,
      "hasExcessiveLength": false,
      "hasMultipleSubdomains": false,
      "hasIPAddress": false,
      "hasSuspiciousPort": false,
      "hasURLEncoding": false,
      "hasObfuscatedCharacters": false,
      "hasExcessiveRedirects": false,
      "redirectionChain": [],
      "issues": []
    },
    
    "domainCharacteristics": {
      "hasPunycode": false,
      "hasSuspiciousTLD": false,
      "hasExcessiveHyphens": false,
      "lookalikeDomains": [],
      "brandImpersonationDetected": false,
      "suspiciousKeywords": [],
      "domainAge": null,
      "issues": []
    },
    
    "threatIntelligence": {
      "virusTotal": {
        "reputation": 0,
        "maliciousEngines": 0,
        "suspiciousEngines": 0,
        "harmlessEngines": 50,
        "undetectedEngines": 20,
        "lastAnalysisDate": "2024-08-18T10:30:00Z",
        "categories": {}
      },
      "abuseScore": null,
      "isKnownMalicious": false,
      "suspiciousReports": 0
    },
    
    "riskBreakdown": {
      "urlStructuralRisk": 5,
      "domainCharacteristicRisk": 0,
      "threatIntelligenceRisk": 0,
      "totalRisk": 15
    },
    
    "findings": [
      {
        "category": "Protocol",
        "severity": "LOW",
        "description": "URL uses standard HTTPS protocol. Encrypted communication."
      }
    ]
  }
}
```

#### Rate Limiting
- **Limit**: 20 requests per minute per user
- **Status**: 429 if exceeded

#### Error Responses
- **400**: Invalid URL format
- **401**: Unauthorized (not authenticated)
- **429**: Rate limit exceeded
- **500**: Internal server error

## Example Malicious URLs Detection

### Example 1: Phishing with Brand Impersonation
```
URL: https://paypa1-secure-login.example.xyz/account
```

**Analysis Output**:
```
✅ VERDICT: MALICIOUS (Risk: 78/100)
🎯 Threat Level: CRITICAL

Issues Detected:
⚠️  Suspicious domain pattern
⚠️  Brand impersonation detected (similar to: paypal)
⚠️  Suspicious keyword: "secure-login"
⚠️  Unusual TLD: .xyz
⚠️  Multiple hyphens in domain
⚠️  Suspicious keywords: paypal, secure-login

Threat Intelligence:
🔴 VirusTotal: Flagged as phishing by 8 security vendors
🔴 Known impersonation pattern for PayPal

RECOMMENDATION: 🚨 DO NOT visit this URL. It is flagged as potentially malicious.
```

### Example 2: HTTP + Suspicious Characteristics
```
URL: http://192.168.1.1:8080/admin/login
```

**Analysis Output**:
```
✅ VERDICT: SUSPICIOUS (Risk: 65/100)
🎯 Threat Level: HIGH

Issues Detected:
⚠️  HTTP protocol (not HTTPS)
⚠️  IP-based URL instead of domain (192.168.1.1)
⚠️  Suspicious port: 8080
⚠️  Suspicious keyword: admin

RECOMMENDATION: ⚠️ Use caution. Verify the domain and avoid entering sensitive information.
```

### Example 3: URL Obfuscation
```
URL: https://g%6F%6F%67%6C%65.com/search (encodes "google")
```

**Analysis Output**:
```
✅ VERDICT: SUSPICIOUS (Risk: 58/100)
🎯 Threat Level: HIGH

Issues Detected:
⚠️  URL contains URL encoding (obfuscation technique)
⚠️  Lookalike domain detected (similar to: google)
⚠️  Excessive URL length for simple query

RECOMMENDATION: ⚠️ Use caution. This URL appears to be obfuscating its true destination.
```

## Integration with Dashboard

### URL Analysis Page
- **Route**: `/dashboard/assistant/url-analysis`
- **Features**:
  - Real-time URL analysis
  - Recent analysis history
  - Visual risk scoring
  - Detailed findings breakdown
  - Interactive result explorer

### Components

#### URLAnalysisComponent
Displays comprehensive analysis results with:
- Verdict and risk score display
- Risk breakdown visualization
- Structural analysis details
- URL characteristics issues
- Domain characteristics issues
- Threat intelligence findings
- Actionable recommendations

## Security Considerations

### Rate Limiting
- 20 requests per minute per user
- Prevents API abuse and excessive resource consumption

### SSRF Prevention
- Validates URLs before analysis
- Blocks private/reserved IP ranges
- Input sanitization and validation

### Threat Intelligence Caching
- 5-minute cache for URL/domain lookups
- 1-hour cache for CVE data
- Reduces API calls to external services

### Privacy
- Analysis data not stored by default
- User authentication required
- Rate limiting per user

## File Structure

```
src/
├── lib/
│   ├── url-analyzer.ts           # Core URL analysis engine
│   └── url-analysis-service.ts   # Integration service with threat APIs
├── app/
│   └── api/
│       └── threats/
│           └── url-analysis/
│               └── route.ts      # API endpoint
└── components/
    └── url-analysis/
        └── URLAnalysisComponent.tsx  # Result display component
```

## Usage Examples

### Via API (cURL)
```bash
curl -X POST http://localhost:3000/api/threats/url-analysis \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Via Frontend
1. Navigate to `/dashboard/assistant/url-analysis`
2. Enter URL in search box
3. Click "Analyze URL"
4. Review comprehensive results
5. Check findings and recommendations

### Via Code
```typescript
import { analyzeURL } from "@/lib/url-analysis-service";

const analysis = await analyzeURL("https://example.com");
console.log(`Risk Score: ${analysis.riskScore}/100`);
console.log(`Verdict: ${analysis.verdict}`);
console.log(`Threat Level: ${analysis.threatLevel}`);
```

## Contributing to XEROVA

### Contribution Statement

> **Developed XEROVA's malicious URL and domain analysis engine for detecting suspicious URL structures, obfuscation techniques, impersonation patterns, and other characteristics associated with fraudulent websites. Integrated multi-source threat intelligence (VirusTotal, AbuseIPDB) with advanced pattern recognition to identify phishing attempts, brand impersonation, malicious encoding, and domain manipulation tactics. Built comprehensive risk scoring system combining structural analysis (HTTP/HTTPS, URL length, encoding), domain characteristics (Punycode, TLDs, lookalike detection), and threat intelligence for accurate malicious URL detection.**

## Future Enhancements

- [ ] Machine learning-based phishing detection
- [ ] Historical URL reputation tracking
- [ ] Screenshot analysis for visual phishing indicators
- [ ] SSL certificate validation
- [ ] WHOIS information integration
- [ ] Redirect chain analysis and tracking
- [ ] Malware and ransomware detection
- [ ] Custom threat intelligence feeds
- [ ] Advanced report export (PDF, CSV)
- [ ] URL categorization and tagging
- [ ] Batch URL analysis
- [ ] Browser extension for real-time scanning

## References

- VirusTotal API: https://developers.virustotal.com/reference/urls
- AbuseIPDB API: https://www.abuseipdb.com/api
- OWASP Phishing: https://owasp.org/www-community/attacks/Phishing
- Punycode: https://en.wikipedia.org/wiki/Punycode
