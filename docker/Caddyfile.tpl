:80 {
    root * /var/www/html

    # Same-origin proxy so the browser only ever talks to this container.
    # %%API_UPSTREAM%% resolves to the API container on the shared network
    # (default: blitzpool-api:3334).
    handle /api/* {
        reverse_proxy %%API_UPSTREAM%%
    }

    # SPA fallback — Angular routes (e.g. /address/...) must serve index.html.
    handle {
        try_files {path} /index.html
        file_server
    }

    log {
        output stdout
        format %%LOGFORMAT%%
        level %%LOGLEVEL%%
    }
}
