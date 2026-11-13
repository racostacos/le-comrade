# Le Comrade

An independent Louisiana newspaper-style publication, hosted on Cloudflare at https://le-comrade.org.

## Publish an article (no website coding or editor login)

1. Write your article in Microsoft Word, Google Docs (export as Word), or another editor, and save as **.docx**.
2. Format the article title using **Heading 1** in the document. Use **Heading 2** for subheadings. Ordinary paragraphs, bold, italics, lists, tables, links, and inline pictures are converted automatically.
3. Name the DOCX file: `YYYY-MM-DD_section_Article Title.docx`, for example `2026-11-13_history_The German Coast Uprising.docx`. Sections are `vision`, `history`, `ledger`, `dispatch`, `reading`. If no section is specified, the article goes to the Reading Room.
4. In your browser, open **[Upload DOCX to Le Comrade](https://github.com/racostacos/le-comrade/upload/main/articles)**, select the file, and click **Commit changes**.
5. Cloudflare Workers Builds runs `npm run build` automatically through `wrangler.jsonc` when deploying, converts DOCX documents into safe HTML, then deploys the generated articles as part of the same build. Published articles appear in their respective section and on the front page.

The website's **/admin** page also links to the upload screen. There is **no separate website editor login** to configure. Your GitHub account is the upload permission system. Since uploads to the main repository publish automatically, **keep unfinished drafts in Word and only upload when ready**.

### Edit or unpublish

To edit, upload a revised DOCX with **the same filename** and replace the existing file in GitHub using its file management flow, or commit a change replacing that file. To unpublish, remove the DOCX from `articles/` in GitHub. The next Cloudflare deployment regenerates the article index. Do not edit generated `public/content/articles.json` manually.

### Troubleshooting

Open **Cloudflare → Workers & Pages → le-comrade → Deployments**. Check the latest build log. The Wrangler deployment command runs the document converter first; the log should show `Published 1 DOCX articles` (or the corresponding total). Cloudflare must install the dependencies from `package.json`. If there is no conversion log, ensure the latest `wrangler.jsonc` with `build.command` has deployed.

Files generated during a Cloudflare deployment are ephemeral build artifacts. They do not need to be committed back to GitHub. The `public/content/articles.json` file in GitHub may therefore lag behind the live deployed site; the live copy is regenerated from the Word documents at deployment time.

## Project structure

- `public/index.html`: existing masthead and navigation (left intact during DOCX publishing simplification)
- `public/styles.css`: responsive newspaper and document styling
- `public/app.js`: page routing and static article reader
- `articles/`: your Word documents, published from GitHub
- `scripts/build-articles.mjs`: converts DOCX to cleaned HTML, saves images
- `public/content/articles.json`: generated article index (do not edit manually)
- `wrangler.jsonc`: Cloudflare static site and automatic document build command

The previous D1 database API, administrator login code, and database schema have been removed from the repository. The site now serves static files and Word-generated articles only. The masthead is unchanged.\n\n**Cloudflare dashboard note:** The old D1 database and Zero Trust Access application are external Cloudflare resources; removing code does not delete those resources or their settings. If the old Access application still protects `/admin`, it may show a login screen before the upload instructions. The direct GitHub upload link works independently of that application.

## Editorial note

The built-in five-pillar policy statements are a preliminary outline, not sourced legislative proposals. Upload a researched history essay when ready; the site does not present a fabricated essay as historical fact.
