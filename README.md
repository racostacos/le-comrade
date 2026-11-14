# Le Comrade

An independent Louisiana newspaper-style publication at https://le-comrade.org, hosted on Cloudflare Workers with article editing through [Pages CMS](https://app.pagescms.org/).

## Write and publish an article

1. Go to https://app.pagescms.org/ and **sign in with GitHub**.
2. Authorize the Pages CMS GitHub App for `racostacos/le-comrade` when prompted.
3. Open `racostacos/le-comrade`, branch `main`, and click **Articles**.
4. Choose **New**, write your headline, pick a newspaper section, add a summary and date, and write in the visual rich-text editor.
5. Leave **Published on website** off while drafting. Switch it on when you're ready for visitors to see the article, then **Save**.
6. Your save commits an editable Markdown file to GitHub. Cloudflare deploys the updated publication automatically.

The public site's **Publish an article** link at `/publish` takes you to Pages CMS. The main **LE COMRADE masthead and navigation remain unchanged**.

### The newspaper sections

- `vision`: The Louisiana We Deserve
- `history`: The People's History
- `ledger`: Follow the Money
- `dispatch`: Parish Dispatch
- `reading`: Reading Room

### Draft privacy

Entries with `published: false` are excluded from the public website. However, **this repository is public**, so drafts committed to GitHub are *not confidential* even though they are hidden from the website. Do not save sensitive or private unpublished material in this repository.

### Existing article

**The State of Indigenous Louisiana** has been migrated from DOCX into `content/posts/2026-11-13-history-the-state-of-indigenous-louisiana.md`. It should appear in Pages CMS under Articles, and the existing public article URL remains the same.

### Building

- Pages CMS uses `.pages.yml` in the repository root.
- Markdown files are stored in `content/posts/`.
- Uploaded images are stored in `public/media/`.
- `scripts/build-articles.mjs` reads the Markdown files, filters by `published`, renders safe HTML, and writes `public/content/articles.json`.
- The `npm run build` script generates the article index.
- The `postinstall` script also runs this build when dependencies are installed on Cloudflare.
- `wrangler.jsonc` is configured for the static site and includes the local build definition. Cloudflare Workers Builds may ignore this Wrangler build setting; when needed set Cloudflare **Workers & Pages → le-comrade → Settings → Build → Build command** to `npm run build`. The deploy command remains `npx wrangler deploy`.

### Editing and unpublishing

Edit an article by opening it in Pages CMS and saving changes. To remove it from public pages, turn off **Published on website** and save. You can delete it in Pages CMS when you want to remove the source file.

### Troubleshooting

If the new article isn't visible, inspect the latest Cloudflare deployment log for `Built N published Pages CMS article(s)`. A successful deployment is required. If this message is missing, ensure the Cloudflare build command is `npm run build` and that the deployment has the latest GitHub commit.

The older custom D1 and Cloudflare Access editor has been removed from the GitHub repository. Any D1 database or Access application previously created in the Cloudflare dashboard is a separate external resource and is not deleted by removing its code.


## Data Centers Out pledge collection

The /data-centers-out page contains a resident pledge to sign a future Livingston Parish initiative petition. **An online pledge is not an official petition signature.** The page links the parish Home Rule Charter, Article VI, Section 6-01.

The API is in `src/pledge-worker.js`; `wrangler.jsonc` binds `PLEDGES` as a private Cloudflare Workers KV namespace and enables the API route. The current Wrangler documentation describes automatic KV provisioning on deploy, including from GitHub-based deployments. Confirm the deployment successfully provisioned the namespace: open `https://le-comrade.org/api/pledge`. A JSON response of `{"ready":true}` means the form can save pledges; `{"ready":false}` means it cannot. The form disables submissions if the storage binding is missing or the endpoint is unavailable and does not claim to have saved data.

Cloudflare dashboard: Workers & Pages > le-comrade > Settings > Bindings should show a KV namespace named `PLEDGES`. If it does not exist, complete the deployment and provision/bind the namespace manually. Do not open pledge collection until this check succeeds.

Pledge records (name, email, optional ZIP code, pledge and update selections, timestamps) are stored only in the private KV namespace, keyed by a SHA-256 digest of the normalized email address. Repeat submissions using the same email update their existing record. To review pledges, use the Cloudflare dashboard's KV storage interface. These are not official elector signatures, and should not be represented as official counts. Follow applicable data-protection and privacy rules. Consider adding verification and abuse controls before wide promotion.


### Viewing pledge submissions securely

Do **not** paste the Cloudflare KV example that writes and deletes `KEY` into the active Worker. It would overwrite pledge handling, delete the example key, and could expose KV data.

The Worker includes a read-only admin endpoint, `GET /api/admin/pledges`, using the existing private `PLEDGES` binding. It will not reveal records unless the Cloudflare Worker has a secret named `PLEDGE_ADMIN_TOKEN` and requests supply the matching Bearer token. This secret is never placed in the website or GitHub.

1. In Cloudflare, open Workers & Pages → le-comrade → Settings → Variables and Secrets; add a **Secret** called `PLEDGE_ADMIN_TOKEN` with a long random value (at least 32 random bytes recommended). Save and deploy as required.
2. On your own computer, request the pledges, supplying the secret via an environment variable instead of putting it in a website address or browser console:
   `curl -H "Authorization: Bearer $PLEDGE_ADMIN_TOKEN" https://le-comrade.org/api/admin/pledges`
3. Results contain up to 100 pledge records per response. If `more` is `true`, use the returned `cursor` as `?cursor=<URL-encoded cursor>` to fetch the next page. Do not publish or commit the resulting JSON, as it contains personal contact information.

The admin endpoint intentionally does not support write or delete operations. The existing public pledge endpoint continues to create and update pledges. If there is no admin secret yet, the endpoint responds with 503 and exposes no records.
