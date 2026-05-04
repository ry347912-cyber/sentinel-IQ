# 🔐 ZTNA System — Zero Trust Network Access

<div align="center">

![Zero Trust](https://img.shields.io/badge/Architecture-Zero%20Trust-cyan?style=for-the-badge&logo=shield)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?style=for-the-badge&logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20MFA-orange?style=for-the-badge)

**🎓 B.Tech Final Year Project · Cybersecurity + Full-Stack + Cloud**

*Enterprise-grade Zero Trust implementation: every user, every device, every request — verified. Always.*

[🚀 Live Demo](#) · [📖 Docs](./docs/architecture.md) · [🤝 Contribute](#contributing) · [📧 Contact](#author)

</div>

---

## 🎯 The Problem

Traditional "castle-and-moat" security fails in the modern threat landscape. Once inside the network, attackers move freely.

```
Traditional Model:          Zero Trust Model:
──────────────────          ─────────────────
🌐 Internet                 🌐 Internet
    │                           │
🔒 Firewall                 🔒 Firewall + MFA + Device Check
    │                           │
🏠 Trust Everyone Inside   🔍 Trust NOBODY — Verify Every Request
    │                           │
💀 One breach = full access ✅  Continuous verification + session monitoring
```

Every minute without Zero Trust:
- 🔓 **Credential stuffing bots** attempt thousands of logins silently
- 🕵️ **Lateral movement** spreads undetected inside "trusted" networks  
- 📱 **Unmanaged devices** connect with zero visibility
- 👴 **No session monitoring** — attackers stay logged in for weeks
- ❌ **No per-request authorization** — one valid token = full access

```
Auth Request Received:
  USER: rupesh@company.com | IP: 203.45.67.89
  Device: Chrome/Windows — FINGERPRINT: a3f9c2...

  🔐 ZTNA: STEP 1 — CREDENTIALS VERIFIED
  🔐 ZTNA: STEP 2 — OTP ISSUED → 482931
  🔐 ZTNA: STEP 3 — MFA PASSED → SESSION CREATED
  🛡️ ZTNA: ACCESS GRANTED · Trust Score: 87 · Role: USER
  📍 Session ID: 7f3a9c · IP Locked · Auto-expire: 15min
```

---

## ✨ Features

| | | |
|---|---|---|
| 🔐 **Multi-Factor Auth** | OTP + Password two-step login | Simulated email OTP, 5-min expiry |
| 🛡️ **Role-Based Access** | Admin and User isolation | Per-route authorization middleware |
| 📱 **Device Fingerprinting** | SHA-256 IP + User-Agent hash | Browser, OS, device type detection |
| 🔍 **Session Monitoring** | Real-time session tracking | Auto-terminate on IP change |
| 📊 **Live Dashboard** | Charts, alerts, activity feed | Recharts area graphs, severity breakdown |
| 🗃️ **Audit Logging** | Every event stored with risk score | Filterable by action, status, IP |
| ⚡ **Rate Limiting** | Per-endpoint request throttling | 5 OTP attempts, 20 auth/15min |
| 🔒 **Brute Force Protection** | 5 failed attempts → 30min lockout | Auto-unlock after cooldown |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      ZTNA SYSTEM ARCHITECTURE                         │
│                                                                        │
│  👤 User (Browser)                                                     │
│   │                                                                    │
│   ▼                                                                    │
│  ┌─────────────────────┐   HTTPS/REST    ┌──────────────────────────┐ │
│  │   React.js Frontend │ ─────────────►  │   Express.js Backend     │ │
│  │   (Tailwind CSS)    │ ◄─────────────  │   (Node.js 18+)          │ │
│  │                     │                 │                           │ │
│  │  • Home             │                 │  ┌──────────┐ ┌────────┐  │ │
│  │  • Login (2-step)   │                 │  │  Auth    │ │ Rate   │  │ │
│  │  • Register         │                 │  │  Layer   │ │Limiter │  │ │
│  │  • Dashboard        │                 │  │  JWT+MFA │ │        │  │ │
│  │  • Admin Panel      │                 │  └──────────┘ └────────┘  │ │
│  │  • Access Logs      │                 │  ┌──────────┐ ┌────────┐  │ │
│  │  • Devices          │                 │  │  RBAC    │ │Session │  │ │
│  └─────────────────────┘                 │  │Middleware│ │Monitor │  │ │
│  Vercel / Netlify                         │  └──────────┘ └────────┘  │ │
│                                           └──────────────┬────────────┘ │
│                                                          │               │
│                                                 ┌────────▼────────┐     │
│                                                 │    MongoDB       │     │
│                                                 │    Atlas         │     │
│                                                 │  Users/Devices   │     │
│                                                 │  Sessions/Logs   │     │
│                                                 └─────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│  Step 1     │     │  Step 2      │     │  Step 3      │     │  Every Request│
│  Credentials│────►│  OTP Verify  │────►│  JWT Issued  │────►│  Middleware   │
│             │     │              │     │              │     │  Check        │
│ email       │     │ 6-digit OTP  │     │ Access Token │     │ • Verify JWT  │
│ password    │     │ 5-min TTL    │     │ 15-min TTL   │     │ • Check DB    │
│             │     │              │     │ Refresh Token│     │ • Validate IP │
│ bcrypt      │     │ Session      │     │ 7-day TTL    │     │ • Check Role  │
│ compare     │     │ created      │     │              │     │ • Log access  │
└─────────────┘     └──────────────┘     └──────────────┘     └───────────────┘
      │                    │                    │                      │
   FAILURE              FAILURE              SUCCESS               SUSPICIOUS
      │                    │                    │                      │
  Log + Count          Log + Block          Grant Access          Terminate Session
  Lockout @5           Risk Score           Start Monitoring      Alert + Log
```

---

## 🧠 Security Model

| Layer | Mechanism | Detail |
|-------|-----------|--------|
| **L1 — Identity** | bcrypt password hashing | 12 rounds, salted |
| **L2 — MFA** | Time-limited OTP | 6-digit, 5-minute window |
| **L3 — Token** | JWT with short expiry | 15-min access, 7-day refresh |
| **L4 — Session** | DB-backed session validation | UUID token, IP-locked |
| **L5 — Device** | SHA-256 fingerprinting | IP + UserAgent hashed |
| **L6 — RBAC** | Role middleware | Admin/User separation |
| **L7 — Rate Limit** | Per-endpoint throttling | express-rate-limit |
| **L8 — Audit** | Every event logged | Risk score 0-100 |

---

## 🔥 Security Events Detected & Logged

| Event | Detection | Risk Score |
|-------|-----------|------------|
| 🔴 **Brute Force** | 5+ failed logins from same IP | 40–80 |
| 🔴 **Session Hijacking** | IP address changed mid-session | 90 |
| 🟠 **Permission Escalation** | Role accessing restricted route | 50 |
| 🟡 **OTP Abuse** | Multiple wrong OTP attempts | 50 |
| 🔴 **Account Lockout** | Max failed attempts exceeded | 70 |
| 🟡 **Unauthorized Access** | Valid token, wrong role | 50 |
| 🔴 **Admin Revoke** | Force session termination | 60 |

---

## 🚀 Quick Start

### Prerequisites

```
Node.js 18+    MongoDB 6+    npm / yarn
```

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ztna-system.git
cd ztna-system
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server
npm run dev
# ✅ ZTNA Backend running on http://localhost:5000
# ✅ MongoDB connected
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies  
npm install

# Start development server
npm start
# ✅ Dashboard running at http://localhost:3000
```

### 4. Create Admin Account

Register the **first account** — it will automatically receive the `admin` role. All subsequent registrations get the `user` role.

---

## 📡 API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | None | Create new user account |
| `POST` | `/api/auth/login` | None | Step 1: verify credentials → send OTP |
| `POST` | `/api/auth/verify-otp` | None | Step 2: verify OTP → issue JWT |
| `POST` | `/api/auth/refresh` | Refresh token | Refresh access token |
| `POST` | `/api/auth/logout` | Bearer JWT | Invalidate current session |
| `GET`  | `/api/auth/me` | Bearer JWT | Get current user profile |

### Dashboard Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard/stats` | Any | Activity stats + 7-day chart |
| `GET` | `/api/dashboard/logs` | Any | Filterable audit log |
| `GET` | `/api/dashboard/devices` | Any | Registered devices |
| `GET` | `/api/dashboard/sessions` | Any | Active sessions |

### Admin Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/users` | Admin | List all users with pagination |
| `PATCH` | `/api/admin/users/:id/toggle` | Admin | Enable / disable user |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Change user role |
| `DELETE` | `/api/admin/sessions/:id` | Admin | Force-terminate a session |
| `PATCH` | `/api/admin/devices/:deviceId/block` | Admin | Block a device |
| `GET` | `/api/admin/system-stats` | Admin | Full system overview |

---

## 🗃️ Database Schema

<details>
<summary>View MongoDB Collections</summary>

### Users Collection
```json
{
  "_id": "ObjectId",
  "username": "string (unique, 3-30 chars)",
  "email": "string (unique, normalized)",
  "password": "string (bcrypt, select: false)",
  "role": "user | admin",
  "trustScore": "number (0-100)",
  "failedLoginAttempts": "number",
  "lockUntil": "Date | null",
  "otpSecret": "string (select: false)",
  "otpExpiry": "Date (select: false)",
  "lastLogin": "Date",
  "lastLoginIp": "string",
  "isActive": "boolean",
  "createdAt": "Date"
}
```

### Devices Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId → User",
  "deviceId": "string (SHA-256 fingerprint)",
  "userAgent": "string",
  "browser": "string",
  "os": "string",
  "deviceType": "desktop | mobile | tablet | unknown",
  "ipAddress": "string",
  "isTrusted": "boolean",
  "trustScore": "number (0-100)",
  "isBlocked": "boolean",
  "blockedReason": "string",
  "loginCount": "number",
  "firstSeen": "Date",
  "lastSeen": "Date"
}
```

### Sessions Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId → User",
  "deviceId": "string",
  "sessionToken": "string (UUID, unique)",
  "refreshToken": "string (JWT)",
  "ipAddress": "string",
  "userAgent": "string",
  "isActive": "boolean",
  "isSuspicious": "boolean",
  "suspicionReason": "string",
  "mfaVerified": "boolean",
  "createdAt": "Date",
  "expiresAt": "Date (TTL index)",
  "lastActivity": "Date",
  "terminationReason": "logout | expired | suspicious | admin_revoke | new_login"
}
```

### Logs Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId → User",
  "username": "string",
  "action": "LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT | OTP_SENT | ...",
  "status": "SUCCESS | FAILURE | WARNING | CRITICAL",
  "ipAddress": "string",
  "userAgent": "string",
  "deviceId": "string",
  "resource": "string",
  "details": "string",
  "riskScore": "number (0-100)",
  "timestamp": "Date (indexed)"
}
```

</details>

---

## 📦 Project Structure

```
ztna-system/
│
├── 📁 backend/
│   ├── server.js              ← Express app + MongoDB init
│   ├── .env.example           ← Environment template
│   │
│   ├── 📁 auth/
│   │   └── jwtUtils.js        ← Token generation + OTP + device fingerprint
│   │
│   ├── 📁 middleware/
│   │   ├── auth.js            ← JWT verify + RBAC + session check + IP validation
│   │   ├── rateLimiter.js     ← Per-endpoint rate limits
│   │   └── validation.js      ← Input validation rules (express-validator)
│   │
│   ├── 📁 models/
│   │   ├── User.js            ← Schema + bcrypt hooks + lockout logic
│   │   ├── Device.js          ← Device fingerprint + UA parsing
│   │   ├── Session.js         ← TTL sessions + suspicious flag
│   │   └── Log.js             ← Audit trail + risk scores
│   │
│   └── 📁 routes/
│       ├── auth.js            ← Register, login, OTP, refresh, logout, /me
│       ├── dashboard.js       ← Stats, logs, devices, sessions
│       └── admin.js           ← User mgmt, session control, system stats
│
├── 📁 frontend/
│   ├── package.json           ← React + Tailwind + Recharts
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx            ← Routes + protected route wrapper
│       ├── index.js           ← React root
│       ├── index.css          ← Tailwind directives
│       │
│       ├── 📁 context/
│       │   └── AuthContext.jsx ← Global auth state + token refresh
│       │
│       ├── 📁 utils/
│       │   └── api.js         ← Axios instance + auto token refresh interceptor
│       │
│       ├── 📁 components/
│       │   ├── Navbar.jsx     ← Responsive nav + role-aware menu
│       │   └── shared.jsx     ← ProtectedRoute, StatusBadge, TrustScore, Spinner
│       │
│       └── 📁 pages/
│           ├── Home.jsx       ← Landing + Zero Trust principles
│           ├── Login.jsx      ← 2-step: credentials + OTP
│           ├── Register.jsx   ← Password strength meter + validation
│           ├── Dashboard.jsx  ← Stats + 7-day chart + recent alerts
│           ├── Logs.jsx       ← Filterable audit table + pagination
│           ├── Devices.jsx    ← Device cards + trust scores
│           └── AdminPanel.jsx ← User mgmt + session control + system stats
│
└── 📁 docs/
    └── architecture.md        ← System design + API reference + schema
```

---

## ☁️ Deployment

### Option A: Render + MongoDB Atlas (Recommended Free)

```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy backend on Render.com
#    - Build: npm install
#    - Start: node server.js
#    - Add env vars from .env.example

# 3. Deploy frontend on Vercel.com
#    - Framework: Create React App
#    - Add REACT_APP_API_URL=https://your-backend.onrender.com/api
```

### Option B: AWS EC2 + MongoDB Atlas (Production)

```bash
# Launch Ubuntu 22.04 EC2 (t3.small recommended)
sudo apt update && sudo apt install nodejs npm nginx -y
git clone https://github.com/yourusername/ztna-system.git
cd ztna-system/backend && npm install

# Run with PM2 (process manager)
npm install -g pm2
pm2 start server.js --name ztna-backend
pm2 startup && pm2 save
```

### Deployment Cost Reference

| Service | Platform | Cost |
|---------|----------|------|
| Backend API | Render.com | Free |
| Frontend | Vercel.com | Free |
| Database | MongoDB Atlas | Free (512MB) |
| Production Backend | AWS EC2 t3.small | ~$15/mo |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React.js + Tailwind CSS | Component-driven UI, utility-first styling |
| **Routing** | React Router v6 | Nested routes, protected route wrappers |
| **Charts** | Recharts | Lightweight, React-native data visualization |
| **Backend** | Node.js + Express | Fast, non-blocking, REST-friendly |
| **Database** | MongoDB + Mongoose | Flexible schema for security events |
| **Auth** | JWT (access + refresh) | Stateless tokens, short-lived access |
| **MFA** | Custom OTP (simulated) | 6-digit, time-limited, DB-stored |
| **Password** | bcrypt (12 rounds) | Adaptive hashing, timing-safe |
| **Validation** | express-validator | Schema-based input sanitization |
| **Rate Limit** | express-rate-limit | Per-endpoint throttling |
| **HTTP Client** | Axios | Interceptors for auto token refresh |

---

## 🤝 Contributing

Contributions are welcome!

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/AmazingFeature

# 3. Commit your changes
git commit -m 'Add: AmazingFeature'

# 4. Push and open a Pull Request
git push origin feature/AmazingFeature
```

### Ideas for Contributions

- 🔑 **Hardware TOTP** — Integrate Google Authenticator / Authy (RFC 6238)
- 📧 **Real email OTP** — Nodemailer + SendGrid / AWS SES integration
- 🌐 **GeoIP blocking** — MaxMind GeoIP2 for country-based access rules
- 📱 **React Native app** — Mobile monitoring dashboard
- 🐳 **Docker Compose** — One-command local deployment
- 📊 **Export to PDF/CSV** — Download audit logs
- 🔔 **Webhook alerts** — Slack / Teams notifications on CRITICAL events
- 🧪 **Test suite** — Jest + Supertest unit and integration tests

---

## 📋 Roadmap

- [x] User registration & login (bcrypt)
- [x] Two-factor authentication (OTP simulation)
- [x] JWT access + refresh token flow
- [x] Device fingerprinting (IP + User-Agent)
- [x] Role-based access control (Admin/User)
- [x] Session monitoring + IP-change detection
- [x] Brute force protection + account lockout
- [x] Rate limiting per endpoint
- [x] Full audit log with risk scores
- [x] Admin user management panel
- [x] Real-time dashboard with charts
- [ ] Real email OTP (Nodemailer)
- [ ] TOTP (Google Authenticator)
- [ ] GeoIP country blocking
- [ ] Docker Compose deployment
- [ ] Unit + integration test suite
- [ ] PDF/CSV log export
- [ ] Webhook alert integrations
- [ ] React Native mobile app

---

## 👨‍💻 Author

**Rupesh Yadav**  
B.Tech CSE | Cybersecurity & Full-Stack Enthusiast

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://linkedin.com)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?style=flat&logo=github)](https://github.com)

---

## 📄 License

MIT License — Free to use, modify, and distribute.  
See `LICENSE` file for full details.

---

## 🙏 Acknowledgements

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [React Router Documentation](https://reactrouter.com/)
- [JWT.io](https://jwt.io/) — JWT Debugger
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Security reference
- [NIST Zero Trust Architecture (SP 800-207)](https://csrc.nist.gov/publications/detail/sp/800-207/final)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

---

<div align="center">

⭐ **If this project helped you land that cybersecurity placement, please star it!** ⭐

*Built with a security-first mindset. No implicit trust granted.*

</div>
