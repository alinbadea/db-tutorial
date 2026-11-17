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

### Illustrations (GROUP BY, JOIN)

The SVG illustrations in `public/assets/<db>/img/` are generated from the sample data in each database's `03_insert.md`. To change the data or the wording, edit the script and regenerate:

```bash
node tools/illustrations/group_by.mjs public/assets   # chapter 6: group_by_*.svg
node tools/illustrations/join.mjs public/assets       # chapter 5: join_*_animatie.svg
```

Images whose file name ends in `animatie.svg` are animations with clickable steps. The chapter page swaps them from `<img>` to `<object>` (see `enableInteractiveAnimations()` in `src/app/chapter/chapter.ts`), because scripts don't run inside `<img>`.

## Deploying to GitHub Pages

1. Push the repo to GitHub, with `main` as the default branch.
2. In the repo, go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds with `npm run build:gh` and publishes `dist/website/browser`.

`build:gh` uses a relative base href (`./`), so the site works both at `username.github.io` and at `username.github.io/<repo>/`.
