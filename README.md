# Le Comrade
A standalone Louisiana political and historical journal on Cloudflare Workers.

## Included
- Responsive industrial-newspaper homepage with five pillars
- Vision, People's History, Follow the Money, Parish Dispatch, Reading Room, About and Sources & Corrections
- Public article listings and article detail pages
- Admin writing interface at `/admin`
- D1-backed draft and published articles
- Authenticated admin API with cryptographic Cloudflare Access JWT validation and explicit administrator email check

## Deployment status and what remains
The static website deploys using `npx wrangler deploy`. The article database and editor are **not operational** until D1 and Cloudflare Access are configured. If `DB` is missing, the API deliberately responds with HTTP 503. If Access is not configured, admin actions are denied.

### 1. Create a D1 database
In Cloudflare, go to **Storage & databases → D1 SQL Database → Create database**. Name it `le-comrade-content`. Copy its **database ID**.

In GitHub, open `wrangler.jsonc` and add this top-level entry (with a real ID, not the placeholder):
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "le-comrade-content",
    "database_id": "YOUR_ACTUAL_DATABASE_UUID"
  }
]
```
Keep the rest of the JSON intact and include the comma between entries. GitHub's commit triggers deployment.

Open the D1 database's **Console**, paste the contents of `schema.sql`, and execute it against your production database. Alternatively, from a local checkout run:
```sh
npx wrangler d1 execute le-comrade-content --remote --file=./schema.sql
```

### 2. Protect the editor with Cloudflare Access
In Cloudflare Zero Trust, create a **self-hosted Access application** scoped to `le-comrade.org/admin*` and `le-comrade.org/api/admin/*` (if necessary, separate Access applications with their own AUD tags; see below). Set an **Allow** policy restricted to your email address only. Do not protect the entire website: readers must be able to view public pages.

**Important:** Use **one Access application covering both admin routes with the same AUD tag**, or implement separate matching audience tags in the Worker. The current Worker accepts one `ACCESS_AUD` tag. A reliable alternative is to protect just `/api/admin/*` with Access, since the editor UI itself holds no private data; the API must be protected. Keep the site public.

Get the Application Audience (AUD) tag from that Access application.

In the Worker **Settings → Variables and Secrets**, configure:
- `ACCESS_TEAM_DOMAIN`: your actual `your-team.cloudflareaccess.com` hostname (no trailing slash).
- `ACCESS_AUD`: the exact audience tag of the API's Access application.
- `ADMIN_EMAIL`: your exact sign-in email address.

Do **not** put these values into `public/`. Set them as Worker variables, and keep authentication secrets out of GitHub.

### 3. Test
1. Visit `https://le-comrade.org`, `/vision`, `/history` and `/sources`.
2. Visit `https://le-comrade.org/admin`. Authenticate via Cloudflare Access when prompted by the protected API.
3. Write a test article, click **Save Draft**, and confirm it **does not** appear publicly.
4. Click **Publish Article**, then verify it appears in its section and at `/article/<slug>`.
5. Click **Unpublish** to remove it from public listings.

## Editorial conventions
Articles are stored as plain text and rendered using HTML escaping; paragraph breaks are maintained. HTML entered by authors is treated as text. This avoids injection but means rich text and images are not yet implemented. The homepage's five pillars are editorial outlines, not sourced factual research or finished statutory proposals. No historical essay has been fabricated for publication.

## Code
- `public/index.html`: page shell
- `public/styles.css`: responsive theme
- `public/app.js`: public routes and publishing interface
- `src/index.js`: API and Cloudflare Access JWT verification
- `schema.sql`: database schema

## Limitations
- Publishing requires D1 and Access setup.
- One admin account; no user management.
- Plain text editor; image uploads, formatted headings, and scheduled publication not implemented.
- Public pages use client-side routing; Cloudflare's SPA asset fallback must remain enabled.
- This is a working custom publishing foundation, not a fully configured managed CMS.
