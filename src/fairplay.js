(function(global) {
  'use strict';

  const API = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const MAX_XP = 270;
  const MAX_COINS = 999999;
  const INSTALL_KEY = 'pcInstallId';
  const SEAL_KEY = 'pcProgressSeal';
  const BACKUP_KEY = 'pcProgressBackup';
  const SEAL_VERSION = 1;
  const BACKUP_VERSION = 2;
  const BUILD_TAG = 'pixelcat-progress-v1';

  const BALL_IDS = new Set([
    'ball_baseball', 'ball_tennis', 'ball_golf', 'ball_basketball',
    'ball_football', 'ball_volleyball', 'ball_bowling'
  ]);
  const BOOST_IDS = new Set(['toy_feather', 'treat_gold', 'coin_magnet', 'lucky_charm']);
  const PET_IDS = new Set(['pet_cat', 'pet_fox', 'pet_frog', 'pet_red_panda', 'pet_pigeon', 'pet_skeleton', 'pet_penguin', 'pet_fairy', 'pet_clippy', 'pet_bat', 'pet_zombie', 'pet_hbaby', 'pet_hedgehog', 'pet_snake']);
  const HAT_IDS = new Set(['hat_none', 'hat_clown', 'hat_cowboy', 'hat_pirate', 'hat_tophat', 'hat_viking', 'hat_funnyglasses']);
  const SHOP_IDS = new Set([...BALL_IDS, ...BOOST_IDS, ...PET_IDS, ...HAT_IDS]);
  const QUEST_TYPES = new Set(['pet_sessions', 'fish_served', 'watch_seconds', 'coins_collected', 'ball_catches', 'spiders_caught', 'google_visits', 'google_searches', 'google_active_seconds']);
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  const PROTECTED_DEFAULTS = Object.freeze({
    freePlayMode: false,
    unlockAll: false,
    catXP: 0,
    coins: 0,
    shopOwned: [],
    shopActiveBoosts: [],
    activeBall: 'ball_baseball',
    activePet: 'pet_cat',
    activeHat: 'hat_none',
    dailyStreak: 0,
    lastStreakDate: '',
    speechEnabled: false,
    ballEnabled: false,
    spiderEnabled: false,
    sizeMultiplier: 1.0,
    companionEnabled: false,
    uiMischiefEnabled: false,
    portalEnabled: false,
    catEnergyLevel: 'active',
    uiMischiefRate: 11,
    dailyQuestState: null,
    dailyQuestStats: null
  });

  const PROTECTED_KEYS = new Set(Object.keys(PROTECTED_DEFAULTS));
  PROTECTED_KEYS.add(INSTALL_KEY);
  PROTECTED_KEYS.add(SEAL_KEY);
  PROTECTED_KEYS.add(BACKUP_KEY);

  function isExtensionContextValid() {
    try {
      const api = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
      return !!(api && api.runtime && api.runtime.id);
    } catch (_) {
      return false;
    }
  }

  function isBackgroundCoordinator() {
    return global.__PIXELCAT_FAIRPLAY_BACKGROUND__ === true;
  }

  function sendCoordinatorMessage(message) {
    if (!isExtensionContextValid() || !API.runtime || typeof API.runtime.sendMessage !== 'function') {
      return Promise.reject(new Error('PixelCat progress coordinator is unavailable'));
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (response, error) => {
        if (settled) return;
        settled = true;
        if (error) {
          reject(error);
          return;
        }
        if (!response || response.success !== true) {
          const responseError = new Error((response && response.error) || 'PixelCat progress operation failed');
          if (response && response.code) responseError.code = response.code;
          reject(responseError);
          return;
        }
        resolve(response.result);
      };

      try {
        if (typeof browser !== 'undefined' && browser.runtime) {
          Promise.resolve(browser.runtime.sendMessage(message)).then(
            (response) => finish(response, null),
            (error) => finish(null, error instanceof Error ? error : new Error(String(error)))
          );
          return;
        }

        API.runtime.sendMessage(message, (response) => {
          const runtimeError = API.runtime.lastError;
          finish(response, runtimeError ? new Error(runtimeError.message) : null);
        });
      } catch (error) {
        finish(null, error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  function storageGet(storageArea, defaults) {
    if (!isExtensionContextValid() || !storageArea) {
      return Promise.reject(new Error('PixelCat storage is unavailable'));
    }
    if (typeof browser !== 'undefined') {
      return Promise.resolve(storageArea.get(defaults)).then((res) => res || defaults || {});
    }
    return new Promise((resolve, reject) => {
      try {
        storageArea.get(defaults, (res) => {
          const runtimeError = API && API.runtime && API.runtime.lastError;
          if (runtimeError) reject(new Error(runtimeError.message));
          else resolve(res || defaults || {});
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function storageSet(storageArea, values) {
    if (!isExtensionContextValid() || !storageArea || !values || typeof values !== 'object') {
      return Promise.reject(new Error('PixelCat storage is unavailable'));
    }
    if (typeof browser !== 'undefined') {
      return Promise.resolve(storageArea.set(values));
    }
    return new Promise((resolve, reject) => {
      try {
        storageArea.set(values, () => {
          const runtimeError = API && API.runtime && API.runtime.lastError;
          if (runtimeError) reject(new Error(runtimeError.message));
          else resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
  }

  function clampInteger(value, min, max, fallback) {
    return Math.round(clampNumber(value, min, max, fallback));
  }

  function roundXP(value) {
    return Math.round(clampNumber(value, 0, MAX_XP, 0) * 100) / 100;
  }

  function uniqueValidStrings(values, allowed, limit) {
    const out = [];
    const seen = new Set();
    (Array.isArray(values) ? values : []).forEach((id) => {
      if (typeof id !== 'string' || !allowed.has(id) || seen.has(id)) return;
      seen.add(id);
      out.push(id);
    });
    return out.slice(0, limit || 50);
  }

  function normalizeStats(rawStats) {
    if (!rawStats || typeof rawStats !== 'object' || Array.isArray(rawStats)) return null;
    return {
      lifetimeCompleted:      clampInteger(rawStats.lifetimeCompleted, 0, 100000, 0),
      lifetimeSpidersCaught:  clampInteger(rawStats.lifetimeSpidersCaught, 0, 100000, 0),
      lifetimePets:           clampInteger(rawStats.lifetimePets, 0, 100000, 0),
      lifetimeFish:           clampInteger(rawStats.lifetimeFish, 0, 100000, 0),
      lifetimeCoins:          clampInteger(rawStats.lifetimeCoins, 0, 1000000, 0),
      lifetimeBallCatches:    clampInteger(rawStats.lifetimeBallCatches, 0, 100000, 0),
      lifetimeGoogleVisits:   clampInteger(rawStats.lifetimeGoogleVisits, 0, 100000, 0),
      lifetimeGoogleSearches: clampInteger(rawStats.lifetimeGoogleSearches, 0, 100000, 0),
      lifetimeGoogleSeconds:  clampInteger(rawStats.lifetimeGoogleSeconds, 0, 10000000, 0),
      perfectDays:            clampInteger(rawStats.perfectDays, 0, 10000, 0),
      lastPerfectDate:        typeof rawStats.lastPerfectDate === 'string' && DATE_RE.test(rawStats.lastPerfectDate) ? rawStats.lastPerfectDate : ''
    };
  }

  function normalizeQuestState(rawState) {
    if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) return null;
    const dateKey = typeof rawState.dateKey === 'string' && DATE_RE.test(rawState.dateKey) ? rawState.dateKey : '';
    if (!dateKey || !Array.isArray(rawState.quests)) return null;
    const quests = rawState.quests.slice(0, 3).map((quest, index) => {
      if (!quest || typeof quest !== 'object' || !QUEST_TYPES.has(quest.type)) return null;
      const target = clampInteger(quest.target, 1, 10000, 1);
      const progress = Math.min(target, clampInteger(quest.progress, 0, target, 0));
      return {
        id: typeof quest.id === 'string' ? quest.id.slice(0, 120) : `${dateKey}:${quest.type}:${index}`,
        definitionId: typeof quest.definitionId === 'string' ? quest.definitionId.slice(0, 80) : '',
        type: quest.type,
        target,
        progress,
        completed: Boolean(quest.completed) || progress >= target
      };
    }).filter(Boolean);
    return {
      version: clampInteger(rawState.version, 1, 9, 1),
      dateKey,
      difficultyLevel: clampInteger(rawState.difficultyLevel, 0, 8, 0),
      quests
    };
  }

  function normalizeState(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const isFreePlay = Boolean(source.freePlayMode || source.unlockAll);
    const xp = roundXP(source.catXP);
    const canonicalShopId = (id) => id === 'pet_babycat' ? 'pet_hbaby' : id;
    const ownedSource = Array.isArray(source.shopOwned)
      ? source.shopOwned.map(canonicalShopId)
      : source.shopOwned;
    const owned = uniqueValidStrings(ownedSource, SHOP_IDS, 50);
    const ownedSet = new Set(owned);
    const boostSource = Array.isArray(source.shopActiveBoosts)
      ? source.shopActiveBoosts
      : owned.filter((id) => BOOST_IDS.has(id));
    const activeBoosts = uniqueValidStrings(boostSource, BOOST_IDS, 20)
      .filter((id) => isFreePlay || ownedSet.has(id));
    let activeBall = typeof source.activeBall === 'string' && BALL_IDS.has(source.activeBall) ? source.activeBall : 'ball_baseball';
    if (!isFreePlay && activeBall !== 'ball_baseball' && !ownedSet.has(activeBall)) activeBall = 'ball_baseball';
    const requestedPet = canonicalShopId(source.activePet);
    let activePet = typeof requestedPet === 'string' && PET_IDS.has(requestedPet) ? requestedPet : 'pet_cat';
    if (!isFreePlay && activePet !== 'pet_cat' && !ownedSet.has(activePet)) activePet = 'pet_cat';
    let activeHat = typeof source.activeHat === 'string' && HAT_IDS.has(source.activeHat) ? source.activeHat : 'hat_none';
    if (!isFreePlay && activeHat !== 'hat_none' && !ownedSet.has(activeHat)) activeHat = 'hat_none';

    const state = {
      freePlayMode: isFreePlay,
      unlockAll: isFreePlay,
      catXP: xp,
      coins: clampInteger(source.coins, 0, MAX_COINS, 0),
      shopOwned: owned,
      shopActiveBoosts: activeBoosts,
      activeBall,
      activePet,
      activeHat,
      dailyStreak: clampInteger(source.dailyStreak, 0, 3660, 0),
      lastStreakDate: typeof source.lastStreakDate === 'string' && DATE_RE.test(source.lastStreakDate) ? source.lastStreakDate : '',
      speechEnabled: Boolean(source.speechEnabled),
      ballEnabled: Boolean(source.ballEnabled),
      spiderEnabled: Boolean(source.spiderEnabled),
      sizeMultiplier: Math.round(clampNumber(source.sizeMultiplier, 0.5, 2.5, 1.0) * 100) / 100,
      companionEnabled: Boolean(source.companionEnabled),
      uiMischiefEnabled: Boolean(source.uiMischiefEnabled),
      portalEnabled: Boolean(source.portalEnabled),
      catEnergyLevel: ['sleepy', 'active', 'hyper'].includes(source.catEnergyLevel) ? source.catEnergyLevel : 'active',
      uiMischiefRate: clampInteger(source.uiMischiefRate, 0, 100, 11),
      dailyQuestState: normalizeQuestState(source.dailyQuestState),
      dailyQuestStats: normalizeStats(source.dailyQuestStats)
    };

    applyLevelLocks(state);
    return state;
  }

  function applyLevelLocks(data) {
    if (data && (data.freePlayMode || data.unlockAll)) return data;
    const xp = roundXP(data && data.catXP);
    if (xp < 10) {
      data.speechEnabled = false;
      data.ballEnabled = false;
    }
    if (xp < 25)  data.spiderEnabled = false;
    if (xp < 70)  data.companionEnabled = false;
    if (xp < 100) data.uiMischiefEnabled = false;
    if (xp < 135) data.portalEnabled = false;
    if (xp < 175 && data.catEnergyLevel === 'hyper') data.catEnergyLevel = 'active';
    return data;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }

  function hashText(input) {
    let h1 = 0x811c9dc5;
    let h2 = 0x45d9f3b;
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= code + i;
      h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    }
    h1 ^= h2 >>> 16;
    h2 ^= h1 >>> 13;
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  function makeId() {
    const cryptoObj = global.crypto || (API && API.crypto);
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      cryptoObj.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
  }

  function createSealPayload(state) {
    return state;
  }

  function createLegacySealPayloads(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) return [];
    const payloads = [];

    if (state.activePet === 'pet_cat') {
      const p = Object.assign({}, state);
      delete p.activePet;
      payloads.push(p);
    }

    const hasBaby = (Array.isArray(state.shopOwned) && state.shopOwned.includes('pet_hbaby')) || state.activePet === 'pet_hbaby';
    const hasQuests = Boolean(state.dailyQuestState && typeof state.dailyQuestState === 'object');

    if (hasBaby || hasQuests) {
      const bases = [state, ...payloads];
      for (const base of bases) {
        const copy = JSON.parse(JSON.stringify(base));
        if (hasBaby) {
          if (Array.isArray(copy.shopOwned)) {
            copy.shopOwned = copy.shopOwned.map((id) => (id === 'pet_hbaby' ? 'pet_babycat' : id));
          }
          if (copy.activePet === 'pet_hbaby') {
            copy.activePet = 'pet_babycat';
          }
        }
        if (hasQuests && copy.dailyQuestState) {
          delete copy.dailyQuestState.difficultyLevel;
          if (Array.isArray(copy.dailyQuestState.quests)) {
            copy.dailyQuestState.quests.forEach((q) => {
              if (q && q.definitionId === '') delete q.definitionId;
            });
          }
        }
        payloads.push(copy);
      }
    }

    return payloads;
  }

  function createSealFromPayload(payload, installId) {
    return `${SEAL_VERSION}.${hashText(`${BUILD_TAG}|${installId}|${stableStringify(payload)}`)}`;
  }

  function createSeal(state, installId) {
    return createSealFromPayload(createSealPayload(state), installId);
  }

  function isValidSealForState(rawSeal, state, installId) {
    if (typeof rawSeal !== 'string' || !rawSeal) return false;
    if (rawSeal === createSeal(state, installId)) return true;
    const legacyPayloads = createLegacySealPayloads(state);
    return legacyPayloads.some((payload) => rawSeal === createSealFromPayload(payload, installId));
  }

  function isSameValue(a, b) {
    return stableStringify(a) === stableStringify(b);
  }

  function getReadDefaults(defaults) {
    const readDefaults = Object.assign({}, PROTECTED_DEFAULTS);
    if (defaults && typeof defaults === 'object' && !Array.isArray(defaults)) Object.assign(readDefaults, defaults);
    readDefaults[INSTALL_KEY] = '';
    readDefaults[SEAL_KEY] = '';
    readDefaults[BACKUP_KEY] = null;
    return readDefaults;
  }

  function hasProtectedKey(keys) {
    if (keys == null) return true;
    if (typeof keys === 'string') return PROTECTED_KEYS.has(keys);
    if (Array.isArray(keys)) return keys.some((key) => PROTECTED_KEYS.has(key));
    if (typeof keys === 'object') return Object.keys(keys).some((key) => PROTECTED_KEYS.has(key));
    return false;
  }

  function getProtectedPatch(state) {
    const patch = {};
    Object.keys(PROTECTED_DEFAULTS).forEach((key) => { patch[key] = state[key]; });
    return patch;
  }

  function getValidBackup(rawBackup, installId) {
    if (!rawBackup || typeof rawBackup !== 'object') return null;
    const backupInstallId = typeof rawBackup.installId === 'string' && rawBackup.installId.length >= 8
      ? rawBackup.installId
      : installId;
    if (!backupInstallId || (installId && backupInstallId !== installId)) return null;
    const state = normalizeState(rawBackup.state || {});
    if (!isValidSealForState(rawBackup.seal, state, backupInstallId)) return null;
    return {
      state,
      installId: backupInstallId,
      revision: clampInteger(rawBackup.revision, 0, Number.MAX_SAFE_INTEGER, 0)
    };
  }

  function restoreValidBackupPreferences(rawSource, backupState) {
    const restored = normalizeState(backupState || {});
    if (!rawSource || !Object.prototype.hasOwnProperty.call(rawSource, 'activePet')) return restored;
    const requestedPet = typeof rawSource.activePet === 'string' ? rawSource.activePet : 'pet_cat';
    const petIsUnlocked = requestedPet === 'pet_cat'
      || restored.freePlayMode
      || (Array.isArray(restored.shopOwned) && restored.shopOwned.includes(requestedPet));
    if (PET_IDS.has(requestedPet) && petIsUnlocked) restored.activePet = requestedPet;
    return normalizeState(restored);
  }

  function makeBackup(state, seal, installId, revision) {
    return {
      version: BACKUP_VERSION,
      revision: Math.max(1, clampInteger(revision, 1, Number.MAX_SAFE_INTEGER, 1)),
      updatedAt: Date.now(),
      state,
      seal,
      installId
    };
  }

  async function ensureLocal(storageArea, defaults) {
    if (!storageArea) return Object.assign({}, defaults || {}, PROTECTED_DEFAULTS);
    const stored = await storageGet(storageArea, null);
    const raw = Object.assign({}, getReadDefaults(defaults), stored || {});

    let installId = typeof raw[INSTALL_KEY] === 'string' && raw[INSTALL_KEY].length >= 8 ? raw[INSTALL_KEY] : '';
    if (!installId && raw[BACKUP_KEY] && typeof raw[BACKUP_KEY] === 'object' && typeof raw[BACKUP_KEY].installId === 'string') {
      installId = raw[BACKUP_KEY].installId;
    }
    if (!installId) {
      installId = makeId();
    }

    const backupObj = raw[BACKUP_KEY] && typeof raw[BACKUP_KEY] === 'object' ? raw[BACKUP_KEY] : null;
    const rawState = normalizeState(raw);
    const rawSealValid = isValidSealForState(raw[SEAL_KEY], rawState, installId);
    const validBackup = getValidBackup(backupObj, installId);
    const backupState = backupObj && backupObj.state && typeof backupObj.state === 'object'
      ? normalizeState(backupObj.state)
      : null;

    let state = rawState;
    if (!rawSealValid && validBackup) {
      state = restoreValidBackupPreferences(stored, validBackup.state);
    } else if (!rawSealValid && (raw[SEAL_KEY] || backupState)) {
      state = normalizeState(PROTECTED_DEFAULTS);
    }

    const seal = createSeal(state, installId);
    const backupRevision = validBackup
      ? validBackup.revision
      : clampInteger(backupObj && backupObj.revision, 0, Number.MAX_SAFE_INTEGER, 0);
    const backupIsCurrent = !!(
      validBackup &&
      backupObj.version === BACKUP_VERSION &&
      validBackup.installId === installId &&
      validBackup.state &&
      isSameValue(validBackup.state, state) &&
      backupObj.seal === seal
    );
    const protectedStateChanged = !isSameValue(getProtectedPatch(rawState), getProtectedPatch(state));
    const shouldPersist = raw[INSTALL_KEY] !== installId || raw[SEAL_KEY] !== seal || !backupIsCurrent || protectedStateChanged;
    const backup = shouldPersist
      ? makeBackup(state, seal, installId, backupRevision + 1)
      : backupObj;

    if (shouldPersist) {
      await storageSet(storageArea, Object.assign({}, getProtectedPatch(state), {
        [INSTALL_KEY]: installId,
        [SEAL_KEY]: seal,
        [BACKUP_KEY]: backup
      }));
    }

    return Object.assign({}, raw, state, { [INSTALL_KEY]: installId, [SEAL_KEY]: seal, [BACKUP_KEY]: backup });
  }

  let operationQueue = Promise.resolve();

  function enqueueOperation(operation) {
    operationQueue = operationQueue.catch(() => {}).then(operation);
    return operationQueue;
  }

  function ensure(storageArea, defaults) {
    if (!isBackgroundCoordinator() && isExtensionContextValid()) {
      return sendCoordinatorMessage({ action: 'progress_ensure', defaults: defaults === undefined ? null : defaults });
    }
    return enqueueOperation(() => ensureLocal(storageArea, defaults));
  }

  async function writeMergedStateLocal(storageArea, base, patch) {
    const merged = Object.assign({}, base, patch || {});
    let installId = typeof base[INSTALL_KEY] === 'string' && base[INSTALL_KEY] ? base[INSTALL_KEY] : makeId();
    const state = normalizeState(merged);
    const seal = createSeal(state, installId);
    const previousRevision = clampInteger(base[BACKUP_KEY] && base[BACKUP_KEY].revision, 0, Number.MAX_SAFE_INTEGER, 0);
    const backup = makeBackup(state, seal, installId, previousRevision + 1);
    const writePatch = Object.assign({}, patch || {}, getProtectedPatch(state), {
      [INSTALL_KEY]: installId,
      [SEAL_KEY]: seal,
      [BACKUP_KEY]: backup
    });
    await storageSet(storageArea, writePatch);
    return Object.assign({}, base, writePatch, state);
  }

  function commit(storageArea, patch) {
    if (!isBackgroundCoordinator() && isExtensionContextValid()) {
      return sendCoordinatorMessage({ action: 'progress_commit', patch: patch || {} });
    }
    return enqueueOperation(async () => {
      const base = await ensureLocal(storageArea, {});
      return writeMergedStateLocal(storageArea, base, patch);
    });
  }

  function commitIfRevision(storageArea, patch, expectedRevision) {
    const expected = clampInteger(expectedRevision, 0, Number.MAX_SAFE_INTEGER, 0);
    if (!isBackgroundCoordinator() && isExtensionContextValid()) {
      return sendCoordinatorMessage({
        action: 'progress_commit_revision',
        patch: patch || {},
        expectedRevision: expected
      });
    }
    return enqueueOperation(async () => {
      const base = await ensureLocal(storageArea, {});
      const currentRevision = clampInteger(base[BACKUP_KEY] && base[BACKUP_KEY].revision, 0, Number.MAX_SAFE_INTEGER, 0);
      if (currentRevision !== expected) {
        const conflict = new Error('PixelCat progress changed; retry the operation');
        conflict.code = 'progress_conflict';
        throw conflict;
      }
      return writeMergedStateLocal(storageArea, base, patch);
    });
  }

  function recordQuestEvent(storageArea, type, amount) {
    if (!isBackgroundCoordinator() && isExtensionContextValid()) {
      return sendCoordinatorMessage({ action: 'progress_quest_record', type, amount });
    }
    const questEngine = global.PixelCatQuests;
    if (!questEngine || typeof questEngine.recordEvent !== 'function') {
      return Promise.reject(new Error('PixelCat quest coordinator is unavailable'));
    }
    const coordinatedStorage = {
      get: (defaults) => ensure(storageArea, defaults),
      set: (values) => commit(storageArea, values)
    };
    return questEngine.recordEvent(coordinatedStorage, type, amount);
  }

  function getQuestSnapshot(storageArea) {
    if (!isBackgroundCoordinator() && isExtensionContextValid()) {
      return sendCoordinatorMessage({ action: 'progress_quest_snapshot' });
    }
    const questEngine = global.PixelCatQuests;
    if (!questEngine || typeof questEngine.getSnapshot !== 'function') {
      return Promise.reject(new Error('PixelCat quest coordinator is unavailable'));
    }
    const coordinatedStorage = {
      get: (defaults) => ensure(storageArea, defaults),
      set: (values) => commit(storageArea, values)
    };
    return questEngine.getSnapshot(coordinatedStorage);
  }

  function mutateNumber(storageArea, key, delta, options) {
    if (!isBackgroundCoordinator() && isExtensionContextValid()) {
      return sendCoordinatorMessage({ action: 'progress_mutate', key, delta, options: options || {} });
    }
    return enqueueOperation(async () => {
      const base = await ensureLocal(storageArea, {});
      const amount = Number(delta) || 0;
      if (!amount || !PROTECTED_KEYS.has(key)) return base[key];
      const min = options && options.min !== undefined ? options.min : 0;
      const max = options && options.max !== undefined ? options.max : (key === 'catXP' ? MAX_XP : MAX_COINS);
      const fallback = options && options.defaultValue !== undefined ? options.defaultValue : 0;
      const current = key === 'catXP' ? roundXP(base[key]) : clampNumber(base[key], min, max, fallback);
      const next = key === 'catXP'
        ? roundXP(Math.min(max, Math.max(min, current + amount)))
        : clampInteger(current + amount, min, max, fallback);
      await writeMergedStateLocal(storageArea, base, { [key]: next });
      return next;
    });
  }

  async function reset(storageArea, values) {
    const clean = Object.assign({}, PROTECTED_DEFAULTS, values || {});
    return commit(storageArea, clean);
  }

  function filterSettingsForProgress(settings, progress) {
    const clean = Object.assign({}, settings || {});
    const source = Object.assign({}, PROTECTED_DEFAULTS, progress || {}, clean);
    applyLevelLocks(source);
    ['speechEnabled', 'ballEnabled', 'spiderEnabled', 'sizeMultiplier', 'companionEnabled', 'uiMischiefEnabled', 'portalEnabled', 'catEnergyLevel'].forEach((key) => {
      if (key in clean) clean[key] = source[key];
    });
    if ('activeBall' in clean) {
      const state = normalizeState(Object.assign({}, progress || {}, { activeBall: clean.activeBall }));
      clean.activeBall = state.activeBall;
    }
    if ('activePet' in clean) {
      const state = normalizeState(Object.assign({}, progress || {}, { activePet: clean.activePet }));
      clean.activePet = state.activePet;
    }
    if ('activeHat' in clean) {
      const state = normalizeState(Object.assign({}, progress || {}, { activeHat: clean.activeHat }));
      clean.activeHat = state.activeHat;
    }
    if ('shopOwned' in clean || 'shopActiveBoosts' in clean || 'activePet' in clean || 'activeHat' in clean) {
      const state = normalizeState(Object.assign({}, progress || {}, clean));
      if ('shopOwned' in clean) clean.shopOwned = state.shopOwned;
      if ('shopActiveBoosts' in clean) clean.shopActiveBoosts = state.shopActiveBoosts;
      if ('activePet' in clean) clean.activePet = state.activePet;
      if ('activeHat' in clean) clean.activeHat = state.activeHat;
    }
    return clean;
  }

  global.PixelCatFairPlay = Object.freeze({
    PROTECTED_KEYS,
    hasProtectedKey,
    normalizeState,
    applyLevelLocks,
    filterSettingsForProgress,
    ensure,
    commit,
    commitIfRevision,
    mutateNumber,
    recordQuestEvent,
    getQuestSnapshot,
    reset
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
