(() => {
  const API = typeof browser !== "undefined" ? browser : chrome;
  let requested = false;
  let retryTimer = null;
  let idleHandle = null;
  let requestGeneration = 0;

  function requestRuntime() {
    idleHandle = null;
    if (requested || globalThis.__PixelCatRuntime || globalThis.__PixelCatLoading) return;
    requested = true;
    globalThis.__PixelCatLoading = true;
    const generation = ++requestGeneration;
    try {
      const result = API.runtime.sendMessage({ action: "load_owner_runtime" });
      if (result && typeof result.then === "function") {
        result.then((response) => {
          if (generation !== requestGeneration) return;
          globalThis.__PixelCatLoading = false;
          if (response && (response.disabled === true || response.standby === true)) {
            requested = false;
            return;
          }
          if (!response || response.success !== true) {
            requested = false;
            scheduleRuntime(900);
          }
        }).catch(() => {
          globalThis.__PixelCatLoading = false;
          if (generation !== requestGeneration) return;
          requested = false;
          scheduleRuntime(900);
        });
      } else {
        window.setTimeout(() => {
          if (generation !== requestGeneration || globalThis.__PixelCatRuntime) return;
          globalThis.__PixelCatLoading = false;
          requested = false;
          scheduleRuntime(900);
        }, 3500);
      }
    } catch (_) {
      if (generation !== requestGeneration) return;
      globalThis.__PixelCatLoading = false;
      requested = false;
      scheduleRuntime(900);
    }
  }

  function scheduleRuntime(delay = 0) {
    if (
      document.hidden ||
      globalThis.__PixelCatRuntime ||
      requested ||
      idleHandle !== null
    )
      return;
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    if (delay > 0) {
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        scheduleRuntime();
      }, delay);
      return;
    }
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(requestRuntime, { timeout: 2500 });
    } else {
      window.setTimeout(requestRuntime, 1200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRuntime, { once: true });
  } else {
    scheduleRuntime();
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) scheduleRuntime();
  });
  if (API.storage && API.storage.onChanged) {
    API.storage.onChanged.addListener((changes, areaName) => {
      if (areaName && areaName !== "local") return;
      if (!changes) return;
      const enabled = changes.catEnabled && changes.catEnabled.newValue === true;
      const allTabs =
        changes.showOnAllTabs && changes.showOnAllTabs.newValue === true;
      const siteRulesChanged = Boolean(
        changes.disabledSites ||
        changes.disabledSitesList ||
        changes.siteFilterMode
      );
      if (!enabled && !allTabs && !siteRulesChanged) return;
      requested = false;
      globalThis.__PixelCatLoading = false;
      scheduleRuntime();
    });
  }
})();
