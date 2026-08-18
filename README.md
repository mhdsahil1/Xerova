<div align="center">

# 🛡️ XEROVA

### Threat Intelligence & Cybersecurity Investigation Platform

*Investigate. Analyze. Respond.*

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-000000?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

[🌐 Live Demo](https://xerova-lab.vercel.app)
•
[📖 Documentation](#installation)
•
[🐞 Report Bug](../../issues)
•
[💡 Request Feature](../../issues)

</div>

---

# 📖 Overview

XEROVA is a modern cybersecurity intelligence platform designed to help security researchers, students, analysts, and developers investigate digital threats from a single interface.

Instead of manually visiting multiple threat intelligence providers, XEROVA aggregates data from multiple sources into one streamlined investigation workflow.

It provides real-time threat analysis for IP addresses, domains, URLs, file hashes, and CVEs while maintaining a clean dashboard for investigation history and reporting.

---

# ✨ Features

## 🔍 Threat Intelligence

- IP Reputation Lookup
- Domain Intelligence
- URL Analysis
- File Hash Analysis
- CVE Intelligence
- Unified Threat Scoring
- IOC Investigation

---

## 📊 Dashboard

- Live Threat Statistics
- Investigation History
- Severity Distribution
- Threat Trends
- Recent CVEs
- Search Analytics

---

## 📄 Reports

- Create Investigation Reports
- Edit Reports
- Delete Reports
- Export as JSON
- Export as Markdown

---

## 🤖 Assistant

- Extracts Indicators of Compromise (IOCs)
- Detects

  - IPs
  - Domains
  - URLs
  - File Hashes

- One-click Threat Lookup

---

## 🔐 Security

- Google OAuth Authentication
- Credentials Authentication
- Protected Routes
- Server-side API Keys
- Input Validation
- SSRF Protection
- Rate Limiting Ready

---

# 🌐 Integrated Threat Intelligence

| Service | Purpose |
|---------|---------|
| VirusTotal | Malware & Reputation Intelligence |
| AbuseIPDB | IP Abuse Reports |
| Shodan | Internet-wide Host Intelligence |
| NVD | CVE Database |

---

# 🛠 Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

### Backend

- Next.js Route Handlers
- Auth.js v5
- MongoDB Atlas
- Mongoose

### Security APIs

- VirusTotal API
- AbuseIPDB API
- Shodan API
- NVD API

---

# 📂 Project Structure

```text
src
├── app
├── components
├── lib
├── models
├── hooks
├── types
├── providers
├── styles
└── middleware
```

---

# 🚀 Installation

```bash
git clone https://github.com/mhdsahil1/XEROVA.git

cd XEROVA

npm install

cp .env.example .env.local

npm run dev
```

---

# ⚙️ Environment Variables

```env
AUTH_SECRET=

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

MONGODB_URI=

VIRUSTOTAL_API_KEY=

ABUSEIPDB_API_KEY=

SHODAN_API_KEY=

OPENAI_API_KEY=
```

---

# 📸 Screenshots

> 


---

# 🗺 Roadmap

- [x] Authentication
- [x] Dashboard
- [x] Threat Intelligence
- [x] Reports
- [x] IOC Extraction
- [x] Theme Support
- [ ] AI Investigation Assistant
- [ ] PDF Report Export
- [ ] Team Workspaces
- [ ] Organization Accounts
- [ ] SIEM Integrations

---

# 🤝 Contributing

Contributions, feature suggestions, and issue reports are always welcome.

If you'd like to improve XEROVA, feel free to fork the repository and open a Pull Request.

---

# 👥 Authors & Contributors

### 🚀 Project Creator & Lead

**Muhammed Sahil**  
*Lead Developer & Architect*

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mhdsahil1)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mhdsahil09)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://v0-sahil-dev.vercel.app/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:muhammedsahil182@gmail.com)

---

### 🌟 Contributors

Special thanks to the following contributors for their valuable contributions and support to the XEROVA platform:

- **Hamza Raseel** ([@hamzaraseel7](https://github.com/hamzaraseel7)) — *Malicious URL detection & heuristic pattern analysis*
- **Abhinav** — *Threat intelligence features & URL pattern algorithms*
- **Nikedh** — *Security testing, feature research & platform enhancements*

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It helps others discover the project and motivates future development.

---

<div align="center">

Built with ❤️, curiosity, and far more debugging than originally planned.

</div>