# ZTNA Architecture

## Zero Trust Principles Applied

1. **Never Trust, Always Verify** — JWT validated on every request; session checked in DB
2. **Least Privilege** — RBAC enforced at middleware level (Admin vs User)
3. **Assume Breach** — Suspicious IP changes terminate sessions immediately
4. **Continuous Monitoring** — All events logged with risk scores

## Authentication Flow

```
User → POST /auth/login (email + password)
     → OTP generated (6-digit, 5min TTL)
     → Pending session created (mfaVerified: false)
     ↓
User → POST /auth/verify-otp (OTP + sessionToken)
     → Session marked mfaVerified: true
     → JWT accessToken (15min) + refreshToken (7d) issued
     ↓
User → Authenticated requests (Bearer token)
     → IP checked vs session IP
     → Session activity updated
     ↓
Token expiry → POST /auth/refresh (refreshToken)
             → New accessToken issued
```

## Database Schema

### Users
- username, email, password (bcrypt), role, trustScore
- failedLoginAttempts, lockUntil (brute force protection)
- otpSecret, otpExpiry (MFA state)
- isActive, lastLogin, lastLoginIp

### Devices
- deviceId (SHA256 of IP+UA), userId, userAgent
- browser, os, deviceType, ipAddress
- trustScore, isBlocked, loginCount
- firstSeen, lastSeen

### Sessions
- userId, deviceId, sessionToken (UUID)
- refreshToken, ipAddress, mfaVerified
- isActive, isSuspicious, terminationReason
- TTL index on expiresAt

### Logs
- userId, action, status, ipAddress
- userAgent, deviceId, details
- riskScore (0-100), timestamp

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create new user |
| POST | /api/auth/login | Step 1: credentials → OTP |
| POST | /api/auth/verify-otp | Step 2: OTP → tokens |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Invalidate session |
| GET  | /api/auth/me | Current user profile |

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/dashboard/stats | Any | Activity stats + chart |
| GET | /api/dashboard/logs | Any | Filtered audit logs |
| GET | /api/dashboard/devices | Any | Device registry |
| GET | /api/dashboard/sessions | Any | Active sessions |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/users | Admin | List all users |
| PATCH | /api/admin/users/:id/toggle | Admin | Enable/disable user |
| PATCH | /api/admin/users/:id/role | Admin | Change user role |
| DELETE | /api/admin/sessions/:id | Admin | Terminate session |
| PATCH | /api/admin/devices/:deviceId/block | Admin | Block device |
| GET | /api/admin/system-stats | Admin | System overview |

## Security Controls

| Control | Implementation |
|---------|---------------|
| Password hashing | bcrypt (12 rounds) |
| Token signing | RS256 equivalent via HS256 + secrets |
| Token expiry | Access: 15min, Refresh: 7d |
| Brute force | 5 attempts → 30min lockout |
| Rate limiting | 100 req/15min global, 20 auth, 5 OTP |
| Session hijacking | IP change → auto-terminate |
| Input validation | express-validator on all endpoints |
| CORS | Whitelist origin only |
| Headers | X-Frame-Options, XSS, HSTS, nosniff |
