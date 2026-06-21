# 🚀 VAANI Vercel Subdomain & Domain Deployment Guide

This guide details how to completely deploy **VAANI** with the custom domain `vaani.site` and dynamic subdomains (e.g. `citizen.vaani.site`, `officer.vaani.site`, `cm.vaani.site`, `dm.vaani.site`, `dept.vaani.site`) utilizing Vercel and Railway/VPS.

---

## 🗺️ Subdomain Routing Architecture

```
                                  DNS Requests (vaani.site)
                                             │
                                             ▼
                                     Vercel Edge Router
                                             │
                                             ▼
                                     Next.js Middleware
                       ┌─────────────────────┴─────────────────────┐
                       │ (Subdomain Extraction & Session Check)    │
                       ▼                                           ▼
             [Unauthenticated]                              [Authenticated]
         Rewrites to Login Page `/`                   Rewrites to Target Path
       Pre-selects role based on host             e.g., `citizen.vaani.site/` ➔ `/citizen`
```

---

## 📋 Steps to Deploy

### Step 1: Configure Custom Domain DNS Settings

To route traffic to Vercel, log in to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.) for `vaani.site` and add the following records:

| Record Type | Host | Value / Target | Description |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | Points apex domain `vaani.site` to Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | Redirects standard `www` to apex |
| **CNAME** | `*` | `cname.vercel-dns.com` | **Wildcard DNS** to support all subdomains (`citizen`, `cm`, etc.) |

---

### Step 2: Add Domains to Vercel Project

1. Open your project dashboard in **Vercel**.
2. Go to **Settings** ➔ **Domains**.
3. Add the apex domain: **`vaani.site`** (recommend checking "Redirect www.vaani.site to vaani.site").
4. Add the wildcard domain: **`*.vaani.site`**.
   - *Note: Vercel automatically generates SSL certificates for wildcard subdomains. The wildcard setup allows users to connect via any sub-prefix without you having to manually add each domain.*

---

### Step 3: Environment Variables Setup (Vercel)

Add the following frontend environment variables in Vercel under **Settings** ➔ **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://vaani-backend.yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://vaani-backend.yourdomain.com
NEXT_PUBLIC_DEMO_MODE=true
```

---

### Step 4: Next.js Subdomain Middleware (Already Integrated)

The project includes `middleware.js` in the frontend root that handles this routing:
- It parses incoming hostnames (`citizen.vaani.site`, `officer.vaani.site`, `cm.vaani.site`, etc.).
- Reads the `vaani_token` session cookie.
- If the session token is missing, it rewrites the request internally to `/` (the login screen) and locks the view to the specific subdomain's role (e.g. `citizen.vaani.site` only shows the Citizen Login screen).
- If authenticated, it rewrites requests internally to `/citizen`, `/officer`, or `/dashboard` while keeping the browser URL clean.

---

### Step 5: Backend API Cross-Origin Resource Sharing (CORS)

Since the frontend subdomains run on different hosts, the backend must accept requests from them.
Our backend uses the wildcard CORS configuration (`origin: '*'`), meaning **it will automatically accept and process calls from `citizen.vaani.site`, `cm.vaani.site`, etc.** out of the box:

```javascript
// backend/src/server.js
app.use(cors({ origin: '*' }));
```

---

## 🧪 Testing Subdomains Locally

To test the subdomain routing locally before pushing to production:

1. Edit your system `/etc/hosts` file (macOS/Linux):
   ```bash
   sudo nano /etc/hosts
   ```
2. Add the following loopback mappings:
   ```etc
   127.0.0.1  vaani.local
   127.0.0.1  citizen.vaani.local
   127.0.0.1  officer.vaani.local
   127.0.0.1  cm.vaani.local
   ```
3. Start the Next.js local server on port 3000:
   ```bash
   npm run dev
   ```
4. Visit `http://citizen.vaani.local:3000` or `http://cm.vaani.local:3000` in your browser. The app will auto-detect the subdomain and route you directly to the correct role view.
