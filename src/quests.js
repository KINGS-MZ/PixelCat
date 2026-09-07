(function(global) {
  'use strict';

  const STORAGE_KEY = 'dailyQuestState';
  const STATS_KEY = 'dailyQuestStats';
  const QUEST_VERSION = 5;

  const QUEST_DEFINITIONS = [
    {
      id: 'pet_session',
      type: 'pet_sessions',
      icon: 'care',
      title: 'Pet Session',
      minXP: 0,
      targets: [1, 2, 3],
      description: (t) => `Complete ${t} pet session${t === 1 ? '' : 's'}.`
    },
    {
      id: 'fish_catch',
      type: 'fish_served',
      icon: 'treat',
      title: 'Catch Fish',
      minXP: 0,
      targets: [1, 2, 3],
      description: (t) => `Catch or feed ${t} fish${t === 1 ? '' : 'es'}.`
    },
    {
      id: 'watch_together',
      type: 'watch_seconds',
      icon: 'playback',
      title: 'Watch Together',
      minXP: 0,
      targets: [60, 120, 180],
      description: (t) => `Stay active for ${formatDuration(t)}.`
    },
    {
      id: 'coin_collection',
      type: 'coins_collected',
      icon: 'coin',
      title: 'Collect Coins',
      minXP: 0,
      targets: [3, 5, 8],
      description: (t) => `Collect ${t} coin drop${t === 1 ? '' : 's'}.`
    },
    {
      id: 'google_visit',
      type: 'google_visits',
      icon: 'google',
      title: 'Google Visit',
      minXP: 0,
      targets: [1, 2],
      description: (t) => `Open or visit Google ${t} time${t === 1 ? '' : 's'}.`
    },
    {
      id: 'google_search',
      type: 'google_searches',
      icon: 'google',
      title: 'Search Buddy',
      minXP: 0,
      targets: [1, 2, 3],
      description: (t) => `Do ${t} Google search${t === 1 ? '' : 'es'} with your pet.`
    },
    {
      id: 'google_patrol',
      type: 'google_active_seconds',
      icon: 'google',
      title: 'Google Patrol',
      minXP: 0,
      targets: [60, 120, 180],
      description: (t) => `Stay with your pet on Google for ${formatDuration(t)}.`
    },
    {
      id: 'ball_fetch',
      type: 'ball_catches',
      icon: 'ball',
      title: 'Play Fetch',
      minXP: 10,
      targets: [2, 4, 6],
      description: (t) => `Catch ${t} ball${t === 1 ? '' : 's'}.`
    },
    {
      id: 'spider_catch',
      type: 'spiders_caught',
      icon: 'shield',
      title: 'Catch Spiders',
      minXP: 25,
      targets: [1, 2, 3],
      description: (t) => `Catch ${t} spider${t === 1 ? '' : 's'}.`
    },
    {
      id: 'double_affection',
      type: 'pet_sessions',
      icon: 'care',
      title: 'Double Affection',
      minXP: 70,
      targets: [4, 5],
      description: (t) => `Complete ${t} pet sessions in one day.`
    },
    {
      id: 'fish_feast',
      type: 'fish_served',
      icon: 'treat',
      title: 'Fish Feast',
      minXP: 100,
      targets: [4, 5],
      description: (t) => `Feed ${t} fish treats in one day.`
    },
    {
      id: 'long_session',
      type: 'watch_seconds',
      icon: 'playback',
      title: 'Long Session',
      minXP: 100,
      targets: [300, 600],
      description: (t) => `Stay active for ${formatDuration(t)}.`
    },
  ];

  function localGet(storageArea, defaults) {
    try {
      const result = storageArea.get(defaults);
      if (result && typeof result.then === 'function') return result;
    } catch (e) { return Promise.reject(e); }
    return new Promise((resolve) => storageArea.get(defaults, resolve));
  }

  function localSet(storageArea, values) {
    try {
      const result = storageArea.set(values);
      if (result && typeof result.then === 'function') return result;
    } catch (e) { return Promise.reject(e); }
    return new Promise((resolve) => storageArea.set(values, resolve));
  }

  function clampInteger(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function getDateKey(date) {
    const source = date || new Date();
    return `${source.getFullYear()}-${String(source.getMonth()+1).padStart(2,'0')}-${String(source.getDate()).padStart(2,'0')}`;
  }

  function seedFromString(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function() {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(values, random) {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
    }
    return copy;
  }

  function normalizeStats(rawStats) {
    const stats = rawStats && typeof rawStats === 'object' ? rawStats : {};
    return {
      lifetimeCompleted:      clampInteger(stats.lifetimeCompleted),
      lifetimeSpidersCaught:  clampInteger(stats.lifetimeSpidersCaught),
      lifetimePets:           clampInteger(stats.lifetimePets),
      lifetimeFish:           clampInteger(stats.lifetimeFish),
      lifetimeCoins:          clampInteger(stats.lifetimeCoins),
      lifetimeBallCatches:    clampInteger(stats.lifetimeBallCatches),
      lifetimeGoogleVisits:   clampInteger(stats.lifetimeGoogleVisits),
      lifetimeGoogleSearches: clampInteger(stats.lifetimeGoogleSearches),
      lifetimeGoogleSeconds:  clampInteger(stats.lifetimeGoogleSeconds),
      perfectDays:            clampInteger(stats.perfectDays),
      lastPerfectDate:        typeof stats.lastPerfectDate === 'string' ? stats.lastPerfectDate : ''
    };
  }

  function getDefinition(type, definitionId) {
    if (typeof definitionId === 'string' && definitionId) {
      const exact = QUEST_DEFINITIONS.find((d) => d.id === definitionId && d.type === type);
      if (exact) return exact;
    }
    return QUEST_DEFINITIONS.find((d) => d.type === type) || null;
  }

  const TARGET_CAPS = Object.freeze({
    pet_sessions:          8,
    fish_served:           8,
    watch_seconds:         900,
    coins_collected:       16,
    google_visits:         4,
    google_searches:       5,
    google_active_seconds: 600,
    ball_catches:          10,
    spiders_caught:        5
  });

  function getQuestDifficulty(stats, dailyStreak, catXP) {
    const safeStats = normalizeStats(stats);
    const perfectDays = clampInteger(safeStats.perfectDays);
    const completedDays = Math.floor(clampInteger(safeStats.lifetimeCompleted) / 3);
    const streakDays = clampInteger(dailyStreak);
    const steadyDays = Math.max(perfectDays, completedDays, streakDays);
    const xp = Math.max(0, Number(catXP) || 0);
    const xpBonus = xp >= 175 ? 2 : (xp >= 100 ? 1 : 0);
    return Math.min(8, Math.max(0, steadyDays + xpBonus));
  }

  function scaleQuestTarget(type, baseTarget, difficultyLevel) {
    const base = clampInteger(baseTarget);
    const level = clampInteger(difficultyLevel);
    let next = base;

    if (type === 'watch_seconds' || type === 'google_active_seconds') {
      next = base + (level * 30);
      return Math.min(TARGET_CAPS[type], next);
    }

    if (type === 'google_visits' || type === 'google_searches') {
      next = base + Math.floor(level / 3);
      return Math.min(TARGET_CAPS[type], next);
    }

    if (type === 'coins_collected') {
      next = base + level;
      return Math.min(TARGET_CAPS.coins_collected, next);
    }

    if (type === 'spiders_caught') {
      next = base + Math.floor((level + 2) / 3);
      return Math.min(TARGET_CAPS.spiders_caught, next);
    }

    if (type === 'ball_catches') {
      next = base + Math.ceil(level / 2);
      return Math.min(TARGET_CAPS.ball_catches, next);
    }

    next = base + Math.ceil(level / 2);
    return Math.min(TARGET_CAPS[type] || next, next);
  }

  function isGoogleQuestType(type) {
    return type === 'google_visits' || type === 'google_searches' || type === 'google_active_seconds';
  }

  function generateState(dateKey, catXP, stats, dailyStreak, freePlayMode) {
    const isFreePlay = Boolean(freePlayMode);
    const xp = isFreePlay ? 270 : Math.max(0, catXP || 0);
    const difficultyLevel = getQuestDifficulty(stats, dailyStreak, xp);
    const random = mulberry32(seedFromString(`pixelcat:${dateKey}:quests:v${QUEST_VERSION}:${difficultyLevel}`));
    const pool = QUEST_DEFINITIONS.filter(d => isFreePlay || xp >= d.minXP);
    const googlePool = pool.filter(d => isGoogleQuestType(d.type));
    const normalPool = pool.filter(d => !isGoogleQuestType(d.type));
    const chosen = [];

    if (googlePool.length) {
      chosen.push(shuffle(googlePool, random)[0]);
    }

    shuffle(normalPool, random).forEach((definition) => {
      if (chosen.length < 3 && !chosen.some((item) => item.type === definition.type)) chosen.push(definition);
    });

    if (chosen.length < 3) {
      shuffle(googlePool, random).forEach((definition) => {
        if (chosen.length < 3 && !chosen.some((item) => item.type === definition.type)) chosen.push(definition);
      });
    }

    return {
      version: QUEST_VERSION,
      dateKey,
      difficultyLevel,
      quests: chosen.map((definition, index) => {
        const baseTarget = definition.targets[Math.floor(random() * definition.targets.length)];
        const target = scaleQuestTarget(definition.type, baseTarget, difficultyLevel);
        return {
          id: `${dateKey}:${definition.type}:${index}`,
          definitionId: definition.id,
          type: definition.type,
          target,
          progress: 0,
          completed: false
        };
      })
    };
  }

  function normalizeQuest(quest) {
    const definition = getDefinition(quest && quest.type, quest && quest.definitionId);
    if (!definition) return null;
    const target = clampInteger(quest.target) || definition.targets[0];
    const progress = Math.min(target, clampInteger(quest.progress));
    return {
      id: typeof quest.id === 'string' ? quest.id : `${definition.type}:${target}`,
      definitionId: definition.id,
      type: definition.type,
      target,
      progress,
      completed: Boolean(quest.completed) || progress >= target
    };
  }

  function ensureState(rawState, dateKey, catXP, stats, dailyStreak, freePlayMode) {
    const isFreePlay = Boolean(freePlayMode);
    const normalizedDateKey = dateKey || getDateKey();
    const state = rawState && typeof rawState === 'object' ? rawState : null;

    if (!state || state.version !== QUEST_VERSION || state.dateKey !== normalizedDateKey || !Array.isArray(state.quests)) {
      return { state: generateState(normalizedDateKey, catXP, stats, dailyStreak, isFreePlay), changed: true };
    }

    const quests = state.quests.map(normalizeQuest).filter(Boolean);
    const availableQuestCount = QUEST_DEFINITIONS.filter(d => (isFreePlay || Math.max(0, catXP || 0) >= d.minXP)).length;
    const expectedQuestCount = Math.min(3, availableQuestCount);
    if (quests.length < expectedQuestCount) {
      return { state: generateState(normalizedDateKey, catXP, stats, dailyStreak, isFreePlay), changed: true };
    }

    const changed = quests.length !== state.quests.length || quests.some((quest, index) => {
      const original = state.quests[index];
      return !original || quest.id !== original.id || quest.progress !== original.progress ||
             quest.completed !== original.completed || quest.target !== original.target ||
             quest.definitionId !== original.definitionId;
    });

    return { state: { version: QUEST_VERSION, dateKey: normalizedDateKey, difficultyLevel: clampInteger(state.difficultyLevel), quests }, changed };
  }

  function formatDuration(seconds) {
    const s = clampInteger(seconds);
    if (s >= 60) {
      const m = Math.floor(s / 60);
      const r = s % 60;
      return r === 0 ? `${m} min` : `${m} min ${String(r).padStart(2,'0')} sec`;
    }
    return `${s} sec`;
  }

  function formatQuestProgress(quest) {
    if (quest.type === 'watch_seconds' || quest.type === 'google_active_seconds') {
      return `${formatDuration(quest.progress)} / ${formatDuration(quest.target)}`;
    }
    return `${quest.progress} / ${quest.target}`;
  }

  function buildSnapshot(state, stats) {
    const quests = state.quests.map((quest) => {
      const definition = getDefinition(quest.type, quest.definitionId);
      return {
        id: quest.id,
        type: quest.type,
        icon: definition ? definition.icon : 'care',
        title: definition ? definition.title : quest.type,
        description: definition ? definition.description(quest.target) : '',
        target: quest.target,
        progress: quest.progress,
        completed: quest.completed,
        progressLabel: formatQuestProgress(quest)
      };
    });

    const completedCount = quests.filter((q) => q.completed).length;
    const totalCount = quests.length;
    return {
      storageKey: STORAGE_KEY,
      dateKey: state.dateKey,
      quests,
      completedCount,
      totalCount,
      allComplete: totalCount > 0 && completedCount === totalCount,
      difficultyLevel: clampInteger(state.difficultyLevel),
      stats,
      secondsUntilReset: getSecondsUntilReset()
    };
  }

  function getSecondsUntilReset(now) {
    const current = now || new Date();
    const next = new Date(current);
    next.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((next.getTime() - current.getTime()) / 1000));
  }

  let recordEventQueue = Promise.resolve();

  async function getSnapshotNow(storageArea) {
    const data = await localGet(storageArea, { [STORAGE_KEY]: null, [STATS_KEY]: null, catXP: 0, dailyStreak: 0, freePlayMode: false, unlockAll: false });
    const stats = normalizeStats(data[STATS_KEY]);
    const ensured = ensureState(data[STORAGE_KEY], getDateKey(), data.catXP || 0, stats, data.dailyStreak || 0, data.freePlayMode || data.unlockAll);
    if (ensured.changed) {
      await localSet(storageArea, { [STORAGE_KEY]: ensured.state, [STATS_KEY]: stats });
    }
    return buildSnapshot(ensured.state, stats);
  }

  function getSnapshot(storageArea) {
    recordEventQueue = recordEventQueue.catch(() => {}).then(() => getSnapshotNow(storageArea));
    return recordEventQueue;
  }

  function recordEvent(storageArea, type, amount) {
    recordEventQueue = recordEventQueue.catch(() => {}).then(() => recordEventNow(storageArea, type, amount));
    return recordEventQueue;
  }

  async function recordEventNow(storageArea, type, amount) {
    const increment = Math.max(0, Number(amount) || 0);
    if (!increment) return getSnapshotNow(storageArea);

    const data = await localGet(storageArea, { [STORAGE_KEY]: null, [STATS_KEY]: null, catXP: 0, dailyStreak: 0, freePlayMode: false, unlockAll: false });
    const stats = normalizeStats(data[STATS_KEY]);
    const ensured = ensureState(data[STORAGE_KEY], getDateKey(), data.catXP || 0, stats, data.dailyStreak || 0, data.freePlayMode || data.unlockAll);
    const state = ensured.state;
    let stateChanged = ensured.changed;
    let statsChanged = false;
    let questsJustCompleted = 0;
    let perfectDayJustUnlocked = false;

    if (type === 'spiders_caught')         { stats.lifetimeSpidersCaught += increment; statsChanged = true; }
    if (type === 'pet_sessions')           { stats.lifetimePets += increment; statsChanged = true; }
    if (type === 'fish_served')            { stats.lifetimeFish += increment; statsChanged = true; }
    if (type === 'coins_collected')        { stats.lifetimeCoins += increment; statsChanged = true; }
    if (type === 'ball_catches')           { stats.lifetimeBallCatches += increment; statsChanged = true; }
    if (type === 'google_visits')          { stats.lifetimeGoogleVisits += increment; statsChanged = true; }
    if (type === 'google_searches')        { stats.lifetimeGoogleSearches += increment; statsChanged = true; }
    if (type === 'google_active_seconds')  { stats.lifetimeGoogleSeconds += increment; statsChanged = true; }

    state.quests.forEach((quest) => {
      if (quest.type !== type || quest.completed) return;
      const nextProgress = Math.min(quest.target, quest.progress + increment);
      if (nextProgress !== quest.progress) {
        quest.progress = nextProgress;
        stateChanged = true;
      }
      if (quest.progress >= quest.target && !quest.completed) {
        quest.completed = true;
        stats.lifetimeCompleted += 1;
        questsJustCompleted += 1;
        stateChanged = true;
        statsChanged = true;
      }
    });

    if (state.quests.length > 0 && state.quests.every((q) => q.completed) && stats.lastPerfectDate !== state.dateKey) {
      stats.perfectDays += 1;
      stats.lastPerfectDate = state.dateKey;
      perfectDayJustUnlocked = true;
      statsChanged = true;
    }

    if (stateChanged || statsChanged) {
      await localSet(storageArea, { [STORAGE_KEY]: state, [STATS_KEY]: stats });
    }

    const snapshot = buildSnapshot(state, stats);
    snapshot.questsJustCompleted = questsJustCompleted;
    snapshot.perfectDayJustUnlocked = perfectDayJustUnlocked;
    return snapshot;
  }

  global.PixelCatQuests = {
    STORAGE_KEY,
    STATS_KEY,
    QUEST_DEFINITIONS,
    formatDuration,
    getDateKey,
    getSecondsUntilReset,
    getSnapshot,
    getDefinition,
    recordEvent
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
