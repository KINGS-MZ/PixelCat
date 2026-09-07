(function (global) {
  'use strict';

  const WEB_PROTOCOLS = new Set(['http:', 'https:']);
  const RUNTIME_PROTOCOLS = new Set(['http:', 'https:', 'file:', 'ftp:']);

  function parseUrl(input, allowBareHostname) {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    const candidate = allowBareHostname && !/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
      ? `https://${trimmed}`
      : trimmed;
    try {
      return new URL(candidate);
    } catch (_) {
      return null;
    }
  }

  function normalizeHostname(input) {
    const parsed = parseUrl(input, true);
    if (!parsed || !WEB_PROTOCOLS.has(parsed.protocol) || !parsed.hostname) return '';
    return parsed.hostname.toLowerCase().replace(/\.$/, '');
  }

  function hostnameMatchesList(hostname, sites) {
    const host = String(hostname || '').trim().toLowerCase().replace(/\.$/, '');
    if (!host || !Array.isArray(sites)) return false;
    return sites.some((site) => {
      const normalized = normalizeHostname(site);
      return normalized && (host === normalized || host.endsWith(`.${normalized}`));
    });
  }

  function isHostnameBlocked(hostname, disabledSites, disabledSitesList, siteFilterMode) {
    const host = String(hostname || '').trim().toLowerCase().replace(/\.$/, '');
    const mode = siteFilterMode === 'allowlist' ? 'allowlist' : 'blacklist';
    let matchesList = hostnameMatchesList(host, disabledSitesList);

    if (!matchesList && disabledSites && disabledSites !== 'none') {
      if (disabledSites === 'youtube' && (host === 'youtube.com' || host.endsWith('.youtube.com'))) matchesList = true;
      if (disabledSites === 'google' && (host === 'google.com' || host.endsWith('.google.com'))) matchesList = true;
      if (disabledSites === 'reddit' && (host === 'reddit.com' || host.endsWith('.reddit.com'))) matchesList = true;
    }

    return mode === 'allowlist' ? !matchesList : matchesList;
  }

  function isRuntimeUrlBlocked(url, disabledSites, disabledSitesList, siteFilterMode) {
    const parsed = parseUrl(url, false);
    if (!parsed || !RUNTIME_PROTOCOLS.has(parsed.protocol)) return true;
    if (!parsed.hostname) return siteFilterMode === 'allowlist';
    return isHostnameBlocked(parsed.hostname, disabledSites, disabledSitesList, siteFilterMode);
  }

  global.PixelCatSiteRules = Object.freeze({
    normalizeHostname,
    hostnameMatchesList,
    isHostnameBlocked,
    isRuntimeUrlBlocked
  });
})(globalThis);
