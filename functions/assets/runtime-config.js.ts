function hasOwn(env, key) {
  return Object.prototype.hasOwnProperty.call(env, key);
}

const runtimeEnvMap = {
  BLITZPOOL_API_URL: 'API_URL',
  BLITZPOOL_STRATUM_URL: 'STRATUM_URL',
  BLITZPOOL_SECURE_STRATUM_URL: 'SECURE_STRATUM_URL',
  BLITZPOOL_STRATUM_V2_URL: 'STRATUM_V2_URL',
  BLITZPOOL_PPLNS_STRATUM_URL: 'PPLNS_STRATUM_URL',
  BLITZPOOL_PPLNS_SECURE_STRATUM_URL: 'PPLNS_SECURE_STRATUM_URL',
  BLITZPOOL_PPLNS_STRATUM_V2_URL: 'PPLNS_STRATUM_V2_URL',
  BLITZPOOL_PPLNS_DATUM_URL: 'PPLNS_DATUM_URL'
};

const blitzpoolDefaults = {
  API_URL: '',
  STRATUM_URL: '',
  SECURE_STRATUM_URL: '',
  STRATUM_V2_URL: '',
  PPLNS_STRATUM_URL: '',
  PPLNS_SECURE_STRATUM_URL: '',
  PPLNS_STRATUM_V2_URL: '',
  PPLNS_DATUM_URL: ''
};

export function onRequestGet(context) {
  const config = { ...blitzpoolDefaults };

  for (const [envKey, configKey] of Object.entries(runtimeEnvMap)) {
    if (hasOwn(context.env, envKey)) {
      config[configKey] = context.env[envKey];
    }
  }

  return new Response(
    `window.__BLITZPOOL_CONFIG__ = ${JSON.stringify(config)};\n`,
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store'
      }
    }
  );
}
