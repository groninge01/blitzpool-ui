# BlitzpoolUi

Web UI for [blitzpool-server-rust](https://github.com/warioishere/blitzpool-server-rust), built with Angular and Angular Material.

## Dependencies

Requires `blitzpool-server-rust` to be running (API on port `3334` by default).

## Development server

Run `npm start` for a dev server on `http://localhost:4200/`. API requests to `/api/*` are proxied per `proxy.config.local.json` (defaults to `http://localhost:3334`).

## Build

Run `npm run build`. Artifacts are written to `dist/blitzpool-ui/`.

## Running unit tests

Run `npm test` (Vitest).

## Runtime configuration

The app reads `assets/runtime-config.js` at startup, which may define `window.__BLITZPOOL_CONFIG__` with any of:

* `API_URL` – base URL of the blitzpool API (e.g. `http://localhost:3334`); empty means same origin
* `STRATUM_URL`, `SECURE_STRATUM_URL`, `STRATUM_V2_URL`
* `PPLNS_STRATUM_URL`, `PPLNS_SECURE_STRATUM_URL`, `PPLNS_STRATUM_V2_URL`, `PPLNS_DATUM_URL`

When running in Docker these are sourced from `BLITZPOOL_API_URL`, `BLITZPOOL_STRATUM_URL`, etc. When deployed to Cloudflare Pages, set the same `BLITZPOOL_*` env vars and the Pages Function in `functions/assets/runtime-config.js.ts` serves them.

## Deployment

Install pm2 (https://pm2.keymetrics.io/)

```bash
$ pm2 serve --spa dist/blitzpool-ui/ 3335 --name ui
```

## Docker

```bash
$ docker build -t blitzpool-ui .
$ docker run --name blitzpool-ui --rm -p 8080:80 \
    -e BLITZPOOL_API_URL=http://your-api-host:3334 \
    blitzpool-ui
```

The site will be accessible on [http://localhost:8080](http://localhost:8080). Caddy listens on port 80 inside the container; binding it to 8080 lets you run the image without root.

Available variables:
* `BLITZPOOL_API_URL`, `BLITZPOOL_STRATUM_URL`, `BLITZPOOL_SECURE_STRATUM_URL`, `BLITZPOOL_STRATUM_V2_URL`, `BLITZPOOL_PPLNS_*` – injected into the runtime config
* `LOGLEVEL`: loglevel in stdout (default: `INFO`)
* `LOGFORMAT`: log format in stdout (default: `json`)
