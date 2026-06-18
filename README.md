# Dwello

Dwello is a property-management prototype with a static browser app, an Express API, SQLite persistence, and optional Gmail email delivery for tenant contact workflows.

## Requirements

- Node.js 20 or newer
- npm

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create local environment configuration when email delivery or a custom database path is needed:

   ```bash
   cp .env.example .env
   ```

3. Build the CSS bundle:

   ```bash
   npm run build
   ```

4. Start the app:

   ```bash
   npm start
   ```

The app serves at http://localhost:3000 by default. The health endpoint is http://localhost:3000/api/health.

## Configuration

Environment variables are optional unless email delivery is required.

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Express server port | `3000` |
| `DB_PATH` | SQLite database location | `./data/dwello.sqlite` |
| `GMAIL_USER` | Gmail account used by `/api/send-email` | unset |
| `GMAIL_APP_PASSWORD` | Gmail app password used by `/api/send-email` | unset |

When Gmail credentials are not set, the app still runs and `/api/send-email` returns a JSON 503 response.

## Quality checks

```bash
npm run check
npm test
```

`npm run check` builds Tailwind CSS and runs syntax checks for the server, browser bootstrap, app logic, and tests. `npm test` runs the Node test suite against temporary SQLite databases.

## Project structure

```text
index.html                 Browser shell
src/bootstrap.js           Loads HTML partials and app logic
src/app.js                 Browser application logic
src/styles.css             Tailwind source and custom CSS
src/views/                 HTML view partials
server/app.mjs             Express entry point
server/routes/             API routes
server/db/                 SQLite schema and seed data
tests/                     Node test suite
```

Generated runtime files are intentionally ignored: `node_modules/`, `dist/`, `data/`, `.env`, logs, and screenshots.
