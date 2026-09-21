#!/bin/sh

js_escape() {
    printf '%s' "$1" | sed 's#\\#\\\\#g; s#"#\\"#g'
}

write_runtime_config() {
    config="{"
    separator=""

    for key in API_URL STRATUM_URL SECURE_STRATUM_URL STRATUM_V2_URL STRATUM_V2_PUBKEY \
        PPLNS_STRATUM_URL PPLNS_SECURE_STRATUM_URL PPLNS_STRATUM_V2_URL PPLNS_DATUM_URL; do
        eval "value=\${BLITZPOOL_${key}+x}"
        if [ -n "$value" ]; then
            eval "raw=\$BLITZPOOL_${key}"
            config="${config}${separator}\"${key}\":\"$(js_escape "$raw")\""
            separator=","
        fi
    done

    config="${config}}"

    cat > /var/www/html/assets/runtime-config.js <<EOF
window.__BLITZPOOL_CONFIG__ = ${config};
EOF
}

if [ ! -e "/etc/Caddyfile" ]; then
    sed -i "s#%%LOGLEVEL%%#${LOGLEVEL:-INFO}#g" /etc/Caddyfile.tpl
    sed -i "s#%%LOGFORMAT%%#${LOGFORMAT:-json}#g" /etc/Caddyfile.tpl
    sed -i "s#%%API_UPSTREAM%%#${API_UPSTREAM:-blitzpool-api:3334}#g" /etc/Caddyfile.tpl
    mv /etc/Caddyfile.tpl /etc/Caddyfile
else
    rm -f /etc/Caddyfile.tpl
fi

write_runtime_config

echo "Starting UI on port 80"
echo "Logs output: ${LOGLEVEL:-INFO} (${LOGFORMAT:-json})"

exec caddy run --config /etc/Caddyfile
