# SQL Tutorial

An Angular site that shows SQL tutorial chapters written in Markdown, rendered with [ngx-markdown](https://github.com/jfcere/ngx-markdown). SQL code blocks are highlighted with Prism.

## Development

```bash
npm install
npm start      # http://localhost:4200/
npm test
```

## Content

All tutorial content lives in `public/assets/` and is served as static files:

```
public/assets/
  databases.json      # the databases shown in the top menu
  db1/
    toc.json          # table of contents for db1, in reading order
    01-intro.md
    ...
```

- **Rename or describe a database**: edit `name` / `description` in `databases.json`. The `id` must match the folder name. It also appears in the URL.
- **Add a chapter**: put the `.md` file in the database's folder and add `{ "title": "...", "file": "03-joins.md" }` to its `toc.json`.
- **Images**: put them next to the chapters and reference them from the site root, e.g. `![diagram](assets/db1/img/schema.png)`.

URLs use hash routing (`#/db1/01-intro`), so deep links and page refreshes work on GitHub Pages.

## Deploying to GitHub Pages

1. Push the repo to GitHub, with `main` as the default branch.
2. In the repo, go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds with `npm run build:gh` and publishes `dist/website/browser`.

`build:gh` uses a relative base href (`./`), so the site works both at `username.github.io` and at `username.github.io/<repo>/`.
