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
