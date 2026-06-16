# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | ✅ Active development |

## Reporting a Vulnerability

We take the security of HalalChain seriously. If you believe you have found a security vulnerability, please **do not** open a public issue.

Instead, report it privately via one of the following methods:

1. **GitHub Security Advisory** — Go to the repository's Security tab and click "Report a vulnerability"
2. **Email** — Contact the maintainer directly (see repository profile for contact info)

Please include the following details in your report:
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if applicable)

We will acknowledge receipt within 48 hours and provide a timeline for a fix. We appreciate your responsible disclosure and will credit you in the release notes once the issue is resolved.

## Security Measures in HalalChain

### Authentication & Authorization
- JWT access tokens stored in **HttpOnly cookies** (not accessible via JavaScript)
- **Refresh Token rotation** — old tokens are invalidated upon refresh
- **Bcrypt-hashed** refresh tokens in the database (raw token never stored)
- **Token versioning** — ADMINs can force logout all sessions by incrementing token version
- **Rate limiting** — 5 requests per minute on `/api/auth/refresh`
- **User suspension** — suspended accounts are rejected at login

### Data Protection
- **Helmet.js** security headers (XSS, clickjacking, MIME sniffing protection)
- **Zod** input validation on all API endpoints
- **Parameterised queries** via Prisma ORM (SQL injection prevention)
- **CORS** configured to only allow the frontend origin
- **Password validation** — minimum 8 characters, hashed with bcrypt (12 rounds)

### File Uploads
- **Avatar uploads** resized to 256×256 WebP via Cloudinary (no raw file storage)
- **Certificate files** stored on Cloudinary, not on the server filesystem
- **Multer** used only for temporary upload handling

### Infrastructure
- **Docker** — services run in isolated containers
- **HTTPS** — recommended for all production deployments
- **Environment variables** — secrets never committed; `.env.example` files provided as templates