:80 {
    root * /var/www/html

    # Same-origin proxy so the browser only ever talks to this container.
    # %%API_UPSTREAM%% resolves to the API container on the shared network
    # (default: blitzpool-api:3334).
    handle /api/* {
        reverse_proxy %%API_UPSTREAM%%
    }

    # Content-hashed assets can be cached forever — a new build ships new
    # filenames. runtime-config.js is generated per container start and
    # must always revalidate.
    @static {
        path *.js *.css *.woff2 *.woff *.ttf *.png *.jpg *.jpeg *.gif *.svg *.ico *.webmanifest *.map
        not path /assets/runtime-config.js
    }
    handle @static {
        header Cache-Control "public, max-age=31536000, immutable"
        file_server
    }

    # SPA fallback — Angular routes (e.g. /address/...) must serve index.html.
    # no-cache so the browser always revalidates index.html and picks up
    # new bundles after a redeploy (ETag still gives cheap 304s).
    handle {
        header Cache-Control "no-cache"
        try_files {path} /index.html
        file_server
    }

    log {
        output stdout
        format %%LOGFORMAT%%
        level %%LOGLEVEL%%
    }
}
