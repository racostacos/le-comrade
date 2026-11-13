# Le Comrade

An independent Louisiana newspaper-style publication, hosted on Cloudflare at https://le-comrade.org.

## Publish an article (no website coding or editor login)

1. Write your article in Microsoft Word, Google Docs (export as Word), or another editor, and save as **.docx**.
2. Format the article title using **Heading 1** in the document. Use **Heading 2** for subheadings. Ordinary paragraphs, bold, italics, lists, tables, links, and inline pictures are converted automatically.
3. Name the DOCX file: `YYYY-MM-DD_section_Article Title.docx`, for example `2026-11-13_history_The German Coast Uprising.docx`. Sections are `vision`, `history`, `ledger`, `dispatch`, `reading`. If no section is specified, the article goes to the Reading Room.
4. In your browser, open **[Upload DOCX to Le Comrade](https://github.com/racostacos/le-comrade/upload/main/articles)**, select the file, and click **Commit changes**.
5. GitHub Actions automatically converts Word documents to safe HTML and commits `public/content/articles.json`; your existing Cloudflare GitHub integration deploys the result. Published articles appear in their respective section and on the front page.

The website's **/admin** page also links to the upload screen. There is **no separate website editor login** to configure. Your GitHub account is the upload permission system. Since uploads to the main repository publish automatically, **keep unfinished drafts in Word and only upload when ready**.

### Edit or unpublish

To edit, upload a revised DOCX with **the same filename** and replace the existing file in GitHub using its file management flow, or commit a change replacing that file. To unpublish, remove the DOCX from `articles/` in GitHub. The automation regenerates the article index. Do not delete generated `public/content/articles.json` manually.

### Troubleshooting

Check the **Actions → Publish Word documents** workflow in GitHub. The workflow needs repository Actions enabled and **contents: write** permission to commit the generated index. If your repository rules prevent GitHub Actions from pushing to main, approve the generated change through a permitted pull request or adjust the repository's workflow permissions. Cloudflare deploys when generated content is committed to main.

## Project structure

- `public/index.html`: existing masthead and navigation (left intact during DOCX publishing simplification)
- `public/styles.css`: responsive newspaper and document styling
- `public/app.js`: page routing and static article reader
- `articles/`: your Word documents, published from GitHub
- `scripts/build-articles.mjs`: converts DOCX to cleaned HTML, saves images
- `public/content/articles.json`: generated article index (do not edit manually)
- `.github/workflows/publish-docx.yml`: automatic publishing workflow
- `wrangler.jsonc`: existing Cloudflare Worker setup

The older D1 and Access-backed article API remains in the repository for now but **is not used for Word-based publishing**. Your public masthead is unchanged. The new publishing process requires only GitHub upload plus automatic deployment.

## Editorial note

The built-in five-pillar policy statements are a preliminary outline, not sourced legislative proposals. Upload a researched history essay when ready; the site does not present a fabricated essay as historical fact.
