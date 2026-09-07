(function (global) {
  'use strict';

  const API = typeof browser !== 'undefined'
    ? browser
    : (typeof chrome !== 'undefined' ? chrome : null);
  const DEFAULT_SCALE = 1;
  const MIN_SCALE = 0.8;
  const MAX_SCALE = 1.5;
  const STEP = 0.05;
  const BASE_WIDTH = 275;

  function normalize(value) {
    const number = Number(value);
    const safe = Number.isFinite(number) ? number : DEFAULT_SCALE;
    const stepped = Math.round(safe / STEP) * STEP;
    return Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, stepped)) * 100) / 100;
  }

  function apply(value) {
    const scale = normalize(value);
    const root = document.documentElement;
    root.style.setProperty('--ui-scale', String(scale));
    root.style.setProperty('--popup-scaled-width', `${Math.round(BASE_WIDTH * scale)}px`);
    root.dataset.uiScale = Math.round(scale * 100) % 10 === 0 ? scale.toFixed(1) : scale.toFixed(2);
    return scale;
  }

  function load() {
    if (!API || !API.storage || !API.storage.local) return;
    const finish = (data) => apply(data && data.uiScale);
    try {
      if (typeof browser !== 'undefined') {
        Promise.resolve(API.storage.local.get({ uiScale: DEFAULT_SCALE })).then(finish).catch(() => apply(DEFAULT_SCALE));
      } else {
        API.storage.local.get({ uiScale: DEFAULT_SCALE }, finish);
      }
    } catch (_) {
      apply(DEFAULT_SCALE);
    }
  }

  global.PixelCatUiScale = Object.freeze({
    DEFAULT_SCALE,
    MIN_SCALE,
    MAX_SCALE,
    STEP,
    normalize,
    apply
  });

  apply(DEFAULT_SCALE);
  load();

  if (API && API.storage && API.storage.onChanged) {
    API.storage.onChanged.addListener((changes, areaName) => {
      if (areaName && areaName !== 'local') return;
      if (changes && changes.uiScale) apply(changes.uiScale.newValue);
    });
  }
})(globalThis);
