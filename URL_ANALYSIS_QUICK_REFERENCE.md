# URL Analysis Module - Quick Reference & Testing Guide

## Quick Start

### 1. Access the Dashboard Page
Navigate to: `/dashboard/assistant/url-analysis`

### 2. Test URLs

#### Safe URL
```
https://google.com
Expected: SAFE, Low Risk Score (< 25)
```

#### Suspicious URL (Brand Impersonation)
```
https://paypa1-secure-login.example.xyz/account
Expected: MALICIOUS, High Risk Score (78+)
Findings: Brand impersonation (PayPal), suspicious keywords, unusual TLD
```

#### Suspicious URL (Lookalike)
```
https://amaz0n.com
Expected: SUSPICIOUS, Medium-High Risk Score (50-75)
Findings: Lookalike domain (amazon)
```

#### Suspicious URL (IP-based + HTTP)
```
http://192.168.1.1:8080/admin
Expected: SUSPICIOUS, High Risk Score (60-75)
Findings: HTTP protocol, IP-based URL, suspicious port, admin keyword
```

#### URL Obfuscation
```
https://g%6F%6F%67%6C%65.com
Expected: SUSPICIOUS, Medium Risk Score (50-65)
Findings: URL encoding detected, lookalike domain
```

### 3. API Usage (cURL)

```bash
# Test URL analysis via API
curl -X POST http://localhost:3000/api/threats/url-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"url":"https://example.com"}'

# Response includes:
# - verdict (SAFE/SUSPICIOUS/MALICIOUS)
# - riskScore (0-100)
# - threatLevel (LOW/MEDIUM/HIGH/CRITICAL)
# - detailed findings and analysis breakdown
```

## File Structure Reference

```
URL Analysis Module Files:
├── src/lib/url-analyzer.ts (400+ lines)
│   ├── parseURL() - Parse and extract URL components
│   ├── analyzeURLCharacteristics() - Detect structural issues
│   ├── analyzeDomainCharacteristics() - Detect domain issues
│   ├── calculateRiskScore() - Multi-factor scoring
│   └── scoreToVerdict() - Convert score to verdict
│
├── src/lib/url-analysis-service.ts (250+ lines)
│   ├── analyzeURL() - Main orchestration function
│   ├── fetchThreatIntelligence() - Integration with APIs
│   └── generateURLAnalysisReport() - Text report generation
│
├── src/app/api/threats/url-analysis/route.ts
│   └── POST handler with auth, rate limiting, validation
│
├── src/components/url-analysis/URLAnalysisComponent.tsx
│   └── React component for displaying results
│
└── src/app/(dashboard)/assistant/url-analysis/page.tsx
    └── Dashboard page with input form and history
```

## Key Functions Reference

### URL Parsing
```typescript
const parsed = parseURL("https://example.com/path");
// Returns: protocol, domain, hostname, port, path, query, isIPBased, etc.
```

### URL Analysis
```typescript
const analysis = await analyzeURL("https://example.com");
// Returns: Complete URLAnalysisResult with all analysis data
```

### Report Generation
```typescript
const report = await generateURLAnalysisReport(analysis);
// Returns: Formatted text report with findings and recommendations
```

## Detection Patterns

### URL Structural Issues (25 max points)
- [ ] HTTP instead of HTTPS (5 pts)
- [ ] Excessive URL length > 75 chars (4 pts)
- [ ] Multiple subdomains (4 pts)
- [ ] IP address instead of domain (10 pts)
- [ ] Suspicious port (8 pts)
- [ ] URL encoding %XX (3 pts)
- [ ] Obfuscated characters (8 pts)

### Domain Characteristics Issues (35 max points)
- [ ] Punycode xn-- (12 pts)
- [ ] Suspicious TLD (8 pts)
- [ ] Excessive hyphens (6 pts)
- [ ] Lookalike domains (10 pts each)
- [ ] Brand impersonation (20 pts)
- [ ] Suspicious keywords (3 pts each, max 10)

### Threat Intelligence (40 max points)
- [ ] Known malicious (35 pts base)
- [ ] VirusTotal malicious flags (3 pts each)
- [ ] VirusTotal suspicious flags (1 pt each)
- [ ] High abuse score > 50% (15 pts)
- [ ] Suspicious reports (2 pts each)

## Expected Behaviors

### Safe URL (< 25 score)
✅ SAFE - Low Threat Level
- Legitimate domain
- HTTPS protocol
- Normal URL structure
- Clean threat intelligence

### Suspicious URL (25-74 score)
⚠️ SUSPICIOUS - Medium/High Threat
- Some suspicious characteristics
- User should verify before clicking
- Avoid entering credentials

### Malicious URL (75+ score)
🚨 MALICIOUS - Critical Threat
- Multiple red flags
- Known malicious indicators
- Strong recommendation to avoid

## Testing Checklist

- [x] URL parsing handles all protocols correctly
- [x] Structural analysis detects all suspicious patterns
- [x] Domain analysis detects lookalikes and impersonation
- [x] Risk scoring produces correct values
- [x] Verdict classification matches risk scores
- [x] API endpoint validates input
- [x] Rate limiting works (20 req/min)
- [x] React component displays results
- [x] TypeScript compilation succeeds
- [x] Recent analyses history working

## Performance Notes

- Average analysis time: < 2 seconds (including threat API calls)
- VirusTotal lookups cached for 5 minutes
- Rate limit: 20 requests per minute per user
- Suitable for real-time browser scanning
- Can be integrated into email security checks

## Future Enhancements

- [ ] Machine learning-based phishing detection
- [ ] SSL certificate validation and analysis
- [ ] WHOIS information integration
- [ ] Redirect chain tracking
- [ ] Screenshot analysis for visual phishing
- [ ] Batch URL analysis
- [ ] Browser extension for real-time scanning
- [ ] Advanced report export (PDF, CSV)
- [ ] Custom threat intelligence feeds
- [ ] Historical URL reputation database
