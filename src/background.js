globalThis.__PIXELCAT_FAIRPLAY_BACKGROUND__ = true;
const API = typeof browser !== "undefined" ? browser : chrome;
const FairPlay = globalThis.PixelCatFairPlay || null;
const SiteRules = globalThis.PixelCatSiteRules || null;
const CONTENT_URL_PATTERNS = ["<all_urls>"];

let activePetTabId = null;
let activePetWindowId = null;
const loadedRuntimeTabs = new Set();
const loadingRuntimeTabs = new Map();
const runtimeLoadGeneration = new Map();
const RUNTIME_FILES = [
  "src/site-rules.js",
  "src/quests.js",
  "src/fairplay.js",
  "src/cat-storage.js",
  "src/cat-coins.js",
  "src/cat-fish.js",
  "src/cat-balls.js",
  "src/cat-portals.js",
  "src/cat-speech.js",
  "src/content.js",
];

const ALLOWED_ACTIONS = new Set([
  "startCat",
  "stopCat",
  "startCompanion",
  "stopCompanion",
  "stopCompanionInstant",
  "restartCompanion",
  "updateSettings",
  "clearSpeechMemory",
  "transfer_pet_window",
  "get_active_pet_state",
  "load_owner_runtime",
  "progress_ensure",
  "progress_commit",
  "progress_commit_revision",
  "progress_mutate",
  "progress_quest_record",
  "progress_quest_snapshot",
]);

const PROGRESS_NUMBER_KEYS = new Set(["catXP", "coins", "dailyStreak"]);

const ALLOWED_SETTINGS = {
  catEnabled: "boolean",
  companionEnabled: "boolean",
  loyalMode: "boolean",
  aggressiveMode: "boolean",
  wallClimbEnabled: "boolean",
  uiMischiefEnabled: "boolean",
  speechEnabled: "boolean",
  rareEventsEnabled: "boolean",
  ballPropsEnabled: "boolean",
  autoFishSpawnEnabled: "boolean",
  ballEnabled: "boolean",
  spiderEnabled: "boolean",
  lowPowerMode: "boolean",
  hideInFullscreen: "boolean",
  showOnAllTabs: "boolean",
  portalEnabled: "boolean",
  memoryEnabled: "boolean",
  speedMultiplier: "number",
  sizeMultiplier: "number",
  uiMischiefRate: "number",
  catEnergyLevel: "string",
  uiLanguage: "string",
  catSkin: "string",
  hbabySkin: "string",
  foxSkin: "string",
  pigeonSkin: "string",
  skeletonSkin: "string",
  batSkin: "string",
  snakeSkin: "string",
  activeBall: "string",
  activeHat: "string",
  activePet: "string",
  companionPet: "string",
  ballFrequency: "string",
  fishFrequency: "string",
  spiderFrequency: "string",
  portalFrequency: "string",
  soapBubbleFrequency: "string",
  disabledSites: "string",
  siteFilterMode: "string",
  petName: "string",
  petSex: "string",
  shopOwned: "array",
  shopActiveBoosts: "array",
  disabledSitesList: "array",
  dragHandEnabled: "boolean",
  freePlayMode: "boolean",
  unlockAll: "boolean",
};

function isExtensionSender(sender) {
  const url = sender && sender.url;
  return !!(
    sender &&
    (sender.id === API.runtime.id ||
      (typeof url === "string" && url.startsWith(API.runtime.getURL(""))))
  );
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings))
    return null;
  const clean = {};
  Object.keys(ALLOWED_SETTINGS).forEach((key) => {
    if (!(key in settings)) return;
    const expected = ALLOWED_SETTINGS[key];
    const value = settings[key];
    if (expected === "boolean") {
      if (typeof value === "boolean") clean[key] = value;
      return;
    }
    if (expected === "number") {
      if (key === "speedMultiplier" || key === "sizeMultiplier")
        clean[key] = clampNumber(value, 0.5, 2.5, 1.0);
      else if (key === "uiMischiefRate")
        clean[key] = Math.round(clampNumber(value, 0, 100, 11));
      return;
    }
    if (expected === "string") {
      if (typeof value === "string") clean[key] = value.slice(0, 500);
      return;
    }
    if (expected === "array") {
      if (Array.isArray(value)) {
        clean[key] = value.slice(0, 100);
      }
    }
  });
  return Object.keys(clean).length ? clean : null;
}

function getLocal(defaults) {
  if (typeof browser !== "undefined") {
    return Promise.resolve(API.storage.local.get(defaults)).then(
      (data) => data || Object.assign({}, defaults)
    );
  }
  return new Promise((resolve, reject) => {
    try {
      API.storage.local.get(defaults, (data) => {
        const error = API.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(data || Object.assign({}, defaults));
      });
    } catch (error) {
      reject(error);
    }
  });
}

function setLocal(values) {
  if (typeof browser !== "undefined") {
    return Promise.resolve(API.storage.local.set(values));
  }
  return new Promise((resolve, reject) => {
    try {
      API.storage.local.set(values, () => {
        const error = API.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getTab(tabId) {
  if (typeof browser !== "undefined") {
    try {
      return Promise.resolve(API.tabs.get(tabId));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return new Promise((resolve, reject) => {
    API.tabs.get(tabId, (tab) => {
      const error = API.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(tab);
    });
  });
}

function queryTabs(queryInfo) {
  return new Promise((resolve, reject) => {
    API.tabs.query(queryInfo, (tabs) => {
      const err = API.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(tabs || []);
    });
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    API.tabs.sendMessage(tabId, message, (response) => {
      const err = API.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

async function updateActivePetTab(newTabId, windowId = null) {
  try {
    const data = await getLocal({ showOnAllTabs: false, catEnabled: true });
    if (data.showOnAllTabs || !Number.isInteger(newTabId)) return;
    if (activePetTabId === newTabId && activePetWindowId === windowId) return;
    if (Number.isInteger(activePetTabId) && activePetTabId !== newTabId) {
      await sendMessageToTab(activePetTabId, { action: "deactivate_tab_pet" }).catch(() => {});
    }
    activePetTabId = newTabId;
    activePetWindowId = windowId;
    await setLocal({ activePetTabId: newTabId, activePetWindowId: windowId });
    const loaded = await injectOwnerRuntime(newTabId);
    await sendMessageToTab(newTabId, {
      action: loaded ? "activate_tab_pet" : "deactivate_tab_pet",
    }).catch(() => {});
  } catch (_) {}
}

API.tabs.onActivated.addListener((activeInfo) => {
  if (activeInfo && activeInfo.tabId) {
    updateActivePetTab(activeInfo.tabId, activeInfo.windowId);
  }
});

if (API.windows && API.windows.onFocusChanged) {
  API.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === API.windows.WINDOW_ID_NONE) return;
    queryTabs({ active: true, windowId: windowId })
      .then((tabs) => {
        if (tabs && tabs[0]) {
          updateActivePetTab(tabs[0].id, windowId);
        }
      })
      .catch(() => {});
  });
}

API.runtime.onStartup.addListener(() => {
  recoverExistingTabs();
});

API.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    API.storage.local.get({ dragHandDefaultResetApplied: false }, (data) => {
      if (!data.dragHandDefaultResetApplied) {
        API.storage.local.set({
          dragHandEnabled: false,
          dragHandDefaultResetApplied: true,
        });
      }
    });
  } else if (details.reason === "install") {
    API.storage.local.set({ dragHandDefaultResetApplied: true });
  }
  recoverExistingTabs();
});

async function recoverExistingTabs() {
  try {
    const data = await getLocal({ catEnabled: true, showOnAllTabs: false });
    if (data.catEnabled !== true) return;
    const owner = await getActivePetOwner();
    if (data.showOnAllTabs) {
      const tabs = await queryTabs({});
      await Promise.allSettled(
        tabs
          .filter((tab) => Number.isInteger(tab.id) && typeof tab.url === "string")
          .map((tab) => injectOwnerRuntime(tab.id))
      );
    } else if (owner.tabId !== null) {
      const loaded = await injectOwnerRuntime(owner.tabId);
      await sendMessageToTab(owner.tabId, {
        action: loaded ? "activate_tab_pet" : "deactivate_tab_pet",
      }).catch(() => {});
    }
  } catch (_) {}
}

function invalidateRuntimeTab(tabId) {
  loadedRuntimeTabs.delete(tabId);
  runtimeLoadGeneration.set(tabId, (runtimeLoadGeneration.get(tabId) || 0) + 1);
}

async function injectOwnerRuntime(tabId) {
  if (!Number.isInteger(tabId)) return Promise.resolve(false);
  const masterState = await getLocal({
    catEnabled: true,
    disabledSites: "none",
    disabledSitesList: [],
    siteFilterMode: "blacklist",
  });
  if (masterState.catEnabled !== true) return false;
  const tab = await getTab(tabId).catch(() => null);
  if (!tab || !SiteRules || SiteRules.isRuntimeUrlBlocked(
    tab.url,
    masterState.disabledSites,
    masterState.disabledSitesList,
    masterState.siteFilterMode
  )) return false;
  if (loadedRuntimeTabs.has(tabId)) return Promise.resolve(true);
  const existing = await sendMessageToTab(tabId, { action: "runtime_status" }).catch(() => null);
  if (existing && existing.loaded === true) {
    loadedRuntimeTabs.add(tabId);
    return true;
  }
  const pending = loadingRuntimeTabs.get(tabId);
  if (pending) return pending;
  const generation = runtimeLoadGeneration.get(tabId) || 0;
  const task = (async () => {
    try {
      if (API.scripting && typeof API.scripting.executeScript === "function") {
        if (typeof API.scripting.insertCSS === "function") {
          await API.scripting.insertCSS({ target: { tabId }, files: ["ui/styles.css"] }).catch(() => {});
        }
        await API.scripting.executeScript({ target: { tabId }, files: RUNTIME_FILES });
      } else if (API.tabs && typeof API.tabs.executeScript === "function") {
        if (typeof API.tabs.insertCSS === "function") {
          await new Promise((resolve) => {
            try {
              const res = API.tabs.insertCSS(tabId, { file: "ui/styles.css" }, () => {
                if (API.runtime && API.runtime.lastError) {}
                resolve();
              });
              if (res && typeof res.then === "function") res.then(resolve, resolve);
            } catch (_) {
              resolve();
            }
          });
        }
        for (const file of RUNTIME_FILES) {
          await new Promise((resolve, reject) => {
            try {
              const res = API.tabs.executeScript(tabId, { file }, (result) => {
                const err = API.runtime && API.runtime.lastError;
                if (err) reject(new Error(err.message));
                else resolve(result);
              });
              if (res && typeof res.then === "function") res.then(resolve, reject);
            } catch (err) {
              reject(err);
            }
          });
        }
      } else {
        return false;
      }
      if (runtimeLoadGeneration.get(tabId) !== generation) return false;
      loadedRuntimeTabs.add(tabId);
      return true;
    } catch (_) {
      return false;
    } finally {
      loadingRuntimeTabs.delete(tabId);
    }
  })();
  loadingRuntimeTabs.set(tabId, task);
  return task;
}

async function ensureEligibleRuntime(tabId) {
  if (!Number.isInteger(tabId)) return false;
  const data = await getLocal({ catEnabled: true, showOnAllTabs: false });
  if (data.catEnabled !== true) return false;
  if (!data.showOnAllTabs) {
    const owner = await getActivePetOwner();
    if (owner.tabId !== tabId) return false;
  }
  return injectOwnerRuntime(tabId);
}

async function getActivePetOwner() {
  const stored = await getLocal({ activePetTabId: null, activePetWindowId: null });
  if (Number.isInteger(stored.activePetTabId)) {
    try {
      const tab = await getTab(stored.activePetTabId);
      if (tab && tab.id === stored.activePetTabId) {
        activePetTabId = tab.id;
        activePetWindowId = tab.windowId;
        return { tabId: tab.id, windowId: tab.windowId };
      }
    } catch (_) {}
  }
  const tabs = await queryTabs({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab || !Number.isInteger(tab.id)) return { tabId: null, windowId: null };
  activePetTabId = tab.id;
  activePetWindowId = tab.windowId;
  await setLocal({ activePetTabId: tab.id, activePetWindowId: tab.windowId });
  return { tabId: tab.id, windowId: tab.windowId };
}

async function routePetMessage(message) {
  const data = await getLocal({ showOnAllTabs: false });
  const broadcastActions = new Set(["stopCat", "stopCompanion", "stopCompanionInstant", "restartCompanion"]);
  if (data.showOnAllTabs || broadcastActions.has(message.action)) {
    return queryTabs({ url: CONTENT_URL_PATTERNS });
  }
  const owner = await getActivePetOwner();
  return Number.isInteger(owner.tabId) ? [{ id: owner.tabId, windowId: owner.windowId }] : [];
}

API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (!isExtensionSender(sender) && !["transfer_pet_window", "get_active_pet_state", "load_owner_runtime"].includes(msg.action)) {
      sendResponse({ success: false, error: "Untrusted sender" });
      return;
    }

    if (
      msg.action === "progress_ensure" ||
      msg.action === "progress_commit" ||
      msg.action === "progress_commit_revision" ||
      msg.action === "progress_mutate" ||
      msg.action === "progress_quest_record" ||
      msg.action === "progress_quest_snapshot"
    ) {
      if (!FairPlay || !API.storage || !API.storage.local) {
        sendResponse({ success: false, error: "Progress coordinator unavailable" });
        return;
      }

      let result;
      if (msg.action === "progress_ensure") {
        const defaults = msg.defaults === null || (msg.defaults && typeof msg.defaults === "object")
          ? msg.defaults
          : {};
        result = await FairPlay.ensure(API.storage.local, defaults);
      } else if (msg.action === "progress_commit") {
        const patch = msg.patch && typeof msg.patch === "object" && !Array.isArray(msg.patch)
          ? msg.patch
          : {};
        result = await FairPlay.commit(API.storage.local, patch);
      } else if (msg.action === "progress_commit_revision") {
        const patch = msg.patch && typeof msg.patch === "object" && !Array.isArray(msg.patch)
          ? msg.patch
          : {};
        result = await FairPlay.commitIfRevision(API.storage.local, patch, msg.expectedRevision);
      } else if (msg.action === "progress_quest_record") {
        if (typeof msg.type !== "string" || !Number.isFinite(Number(msg.amount))) {
          sendResponse({ success: false, error: "Invalid quest progress mutation" });
          return;
        }
        result = await FairPlay.recordQuestEvent(API.storage.local, msg.type, Number(msg.amount));
      } else if (msg.action === "progress_quest_snapshot") {
        result = await FairPlay.getQuestSnapshot(API.storage.local);
      } else {
        if (typeof msg.key !== "string" || !PROGRESS_NUMBER_KEYS.has(msg.key) || !Number.isFinite(Number(msg.delta))) {
          sendResponse({ success: false, error: "Invalid numeric progress mutation" });
          return;
        }
        result = await FairPlay.mutateNumber(API.storage.local, msg.key, Number(msg.delta), msg.options || {});
      }
      sendResponse({ success: true, result });
      return;
    }

    if (msg.action === "get_active_pet_state") {
      const data = await getLocal({ showOnAllTabs: false });
      if (data.showOnAllTabs) {
        sendResponse({ success: true, showOnAllTabs: true, isOwner: true, ownerTabId: null });
        return;
      }
      const owner = await getActivePetOwner();
      sendResponse({ success: true, showOnAllTabs: false, isOwner: !!(sender.tab && sender.tab.id === owner.tabId), ownerTabId: owner.tabId });
      return;
    }

    if (msg.action === "load_owner_runtime") {
      const masterState = await getLocal({
        catEnabled: true,
        showOnAllTabs: false,
        disabledSites: "none",
        disabledSitesList: [],
        siteFilterMode: "blacklist",
      });
      if (masterState.catEnabled !== true) {
        sendResponse({ success: true, disabled: true });
        return;
      }
      const tabId = sender && sender.tab ? sender.tab.id : null;
      if (!Number.isInteger(tabId)) {
        sendResponse({ success: false, error: "Invalid tab" });
        return;
      }
      if (!SiteRules || SiteRules.isRuntimeUrlBlocked(
        sender.tab && sender.tab.url,
        masterState.disabledSites,
        masterState.disabledSitesList,
        masterState.siteFilterMode
      )) {
        sendResponse({ success: true, disabled: true, siteBlocked: true });
        return;
      }
      if (!masterState.showOnAllTabs) {
        const owner = await getActivePetOwner();
        if (tabId !== owner.tabId) {
          sendResponse({ success: true, standby: true });
          return;
        }
      }
      const loaded = await injectOwnerRuntime(tabId);
      sendResponse({ success: loaded });
      return;
    }

    if (msg.action === "transfer_pet_window") {
      const senderTabId = sender && sender.tab ? sender.tab.id : null;
      const senderWindowId = sender && sender.tab ? sender.tab.windowId : null;
      const tx = Number(msg.screenX);
      const ty = Number(msg.screenY);
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) {
        sendResponse({ success: false, error: "Invalid screen coordinates" });
        return;
      }
      (async () => {
        let targetWindow = null;
        if (API.windows && typeof API.windows.getAll === "function") {
          try {
            const windows = await new Promise((resolve) => API.windows.getAll({ populate: true }, resolve));
            const otherWindows = (windows || []).filter((win) => win && win.id !== senderWindowId);
            targetWindow = otherWindows.find((win) => {
              if (!Number.isFinite(win.left) || !Number.isFinite(win.top) || !Number.isFinite(win.width) || !Number.isFinite(win.height)) return false;
              const margin = 40;
              return tx >= win.left - margin && tx <= win.left + win.width + margin &&
                     ty >= win.top - margin && ty <= win.top + win.height + margin;
            });
            if (!targetWindow && otherWindows.length === 1) {
              targetWindow = otherWindows[0];
            } else if (!targetWindow && otherWindows.length > 1) {
              let closest = null;
              let minDist = Infinity;
              for (const win of otherWindows) {
                if (Number.isFinite(win.left) && Number.isFinite(win.top) && Number.isFinite(win.width) && Number.isFinite(win.height)) {
                  const cx = win.left + win.width / 2;
                  const cy = win.top + win.height / 2;
                  const d = Math.hypot(tx - cx, ty - cy);
                  if (d < minDist) {
                    minDist = d;
                    closest = win;
                  }
                }
              }
              targetWindow = closest || otherWindows[0];
            }
          } catch (_) {}
        }
        let targetTab = null;
        if (targetWindow && Array.isArray(targetWindow.tabs)) {
          targetTab = targetWindow.tabs.find((tab) => tab.active && tab.id !== senderTabId) || targetWindow.tabs.find((tab) => tab.id !== senderTabId);
        }
        if (!targetTab || !Number.isInteger(targetTab.id)) {
          sendResponse({ success: false, error: "No target window found" });
          return;
        }
        const previousOwner = await getActivePetOwner();
        const previousOwnerTabId = previousOwner.tabId;
        const previousOwnerWindowId = previousOwner.windowId;
        let transferred = false;
        try {
          await setLocal({ activePetTabId: targetTab.id, activePetWindowId: targetTab.windowId });
          activePetTabId = targetTab.id;
          activePetWindowId = targetTab.windowId;
          const loaded = await injectOwnerRuntime(targetTab.id);
          if (!loaded) throw new Error("Target tab is not available for PixelCat");
          const delivered = await sendMessageToTab(targetTab.id, {
            action: "receive_transferred_pet",
            screenX: tx,
            screenY: ty,
            petType: msg.petType === "companion" ? "companion" : "main",
            dropVX: msg.dropVX || 0,
            dropVY: msg.dropVY || 0,
          });
          transferred = !!(delivered && delivered.success);
          if (!transferred) throw new Error("Target tab could not receive the pet");
          if (Number.isInteger(previousOwnerTabId) && previousOwnerTabId !== targetTab.id) {
            await sendMessageToTab(previousOwnerTabId, { action: "deactivate_tab_pet" }).catch(() => {});
          }
          if (Number.isInteger(senderTabId) && senderTabId !== targetTab.id && senderTabId !== previousOwnerTabId) {
            await sendMessageToTab(senderTabId, { action: "deactivate_tab_pet" }).catch(() => {});
          }
        } catch (_) {
          activePetTabId = previousOwnerTabId;
          activePetWindowId = previousOwnerWindowId;
          await setLocal({
            activePetTabId: previousOwnerTabId,
            activePetWindowId: previousOwnerWindowId,
          }).catch(() => {});
          await sendMessageToTab(targetTab.id, { action: "deactivate_tab_pet" }).catch(() => {});
          if (Number.isInteger(previousOwnerTabId)) {
            await sendMessageToTab(previousOwnerTabId, { action: "activate_tab_pet" }).catch(() => {});
          }
        }
        sendResponse({ success: transferred });
      })().catch(() => {
        sendResponse({ success: false, error: "Transfer failed" });
      });
      return true;
    }

    const safeMsg = ALLOWED_ACTIONS.has(msg.action)
      ? msg.action === "updateSettings"
        ? { action: "updateSettings", settings: sanitizeSettings(msg.settings) }
        : { action: msg.action }
      : null;

    if (!safeMsg) {
      sendResponse({ success: false, error: "Unsupported message" });
      return;
    }

    const tabs = await routePetMessage(safeMsg);
    await Promise.allSettled(
      tabs.map((tab) => sendMessageToTab(tab.id, safeMsg)),
    );
    sendResponse({ success: true, tabCount: tabs.length });
  })().catch((error) => {
    sendResponse({
      success: false,
      error: error && error.message ? error.message : "Message delivery failed",
      code: error && error.code ? error.code : undefined,
    });
  });

  return true;
});

if (API.tabs && API.tabs.onRemoved) {
  API.tabs.onRemoved.addListener((tabId) => {
    invalidateRuntimeTab(tabId);
    loadingRuntimeTabs.delete(tabId);
  });
}

if (API.tabs && API.tabs.onUpdated) {
  API.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab) return;
    if (changeInfo.status === "loading") {
      invalidateRuntimeTab(tabId);
      loadingRuntimeTabs.delete(tabId);
      if (tab.active) updateActivePetTab(tabId, tab.windowId);
      return;
    }
    if (changeInfo.status === "complete") {
      ensureEligibleRuntime(tabId).then((loaded) => {
        getActivePetOwner().then((owner) => {
          if (owner.tabId === tabId) {
            sendMessageToTab(tabId, {
              action: loaded ? "activate_tab_pet" : "deactivate_tab_pet",
            }).catch(() => {});
          }
        }).catch(() => {});
      }).catch(() => {});
    }
  });
}

if (API.tabs && API.tabs.onReplaced) {
  API.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    invalidateRuntimeTab(removedTabId);
    loadingRuntimeTabs.delete(removedTabId);
    invalidateRuntimeTab(addedTabId);
    getActivePetOwner().then((owner) => {
      if (owner.tabId === addedTabId) injectOwnerRuntime(addedTabId);
    }).catch(() => {});
  });
}

if (API.tabs && API.tabs.onCreated) {
  API.tabs.onCreated.addListener((tab) => {
    if (!tab || !Number.isInteger(tab.id)) return;
    if (tab.status === "complete" && typeof tab.url === "string" && tab.url) {
      ensureEligibleRuntime(tab.id).then(() => {
        if (tab.active) updateActivePetTab(tab.id, tab.windowId);
      }).catch(() => {});
    }
  });
}

if (API.tabs && API.tabs.onAttached) {
  API.tabs.onAttached.addListener((tabId, attachInfo) => {
    ensureEligibleRuntime(tabId).then(() => {
      updateActivePetTab(tabId, attachInfo.newWindowId);
    }).catch(() => {});
  });
}

if (API.tabs && API.tabs.onDetached) {
  API.tabs.onDetached.addListener((tabId, detachInfo) => {
    queryTabs({ active: true, windowId: detachInfo.oldWindowId })
      .then((tabs) => {
        if (tabs && tabs[0]) {
          ensureEligibleRuntime(tabs[0].id).then(() => {
            updateActivePetTab(tabs[0].id, detachInfo.oldWindowId);
          }).catch(() => {});
        }
      })
      .catch(() => {});
  });
}

if (API.windows && API.windows.onCreated) {
  API.windows.onCreated.addListener((win) => {
    if (!win || !Number.isInteger(win.id)) return;
    queryTabs({ windowId: win.id })
      .then((tabs) =>
        Promise.allSettled(
          tabs
            .filter((t) => Number.isInteger(t.id) && typeof t.url === "string")
            .map((t) => ensureEligibleRuntime(t.id))
        ).then(() => tabs)
      )
      .then((tabs) => {
        const active = (tabs || []).find((t) => t.active);
        if (active) updateActivePetTab(active.id, win.id);
      })
      .catch(() => {});
  });
}

async function syncRuntimeScope(showOnAllTabs) {
  const data = await getLocal({ catEnabled: true });
  const tabs = await queryTabs({ url: CONTENT_URL_PATTERNS });
  if (showOnAllTabs && data.catEnabled === true) {
    await Promise.allSettled(tabs.map(async (tab) => {
      const loaded = await injectOwnerRuntime(tab.id);
      await sendMessageToTab(tab.id, {
        action: loaded ? "activate_tab_pet" : "deactivate_tab_pet",
      }).catch(() => {});
    }));
    return;
  }
  const activeTabs = await queryTabs({ active: true, lastFocusedWindow: true }).catch(
    () => [],
  );
  const activeTab = activeTabs[0];
  const owner = activeTab && Number.isInteger(activeTab.id)
    ? { tabId: activeTab.id, windowId: activeTab.windowId }
    : await getActivePetOwner();
  if (activeTab && Number.isInteger(activeTab.id)) {
    activePetTabId = activeTab.id;
    activePetWindowId = activeTab.windowId;
    await setLocal({
      activePetTabId: activeTab.id,
      activePetWindowId: activeTab.windowId,
    });
  }
  await Promise.allSettled(
    tabs
      .filter((tab) => tab.id !== owner.tabId)
      .map((tab) =>
        sendMessageToTab(tab.id, { action: "deactivate_tab_pet" }),
      ),
  );
  if (data.catEnabled === true && Number.isInteger(owner.tabId)) {
    const loaded = await injectOwnerRuntime(owner.tabId);
    await sendMessageToTab(owner.tabId, {
      action: loaded ? "activate_tab_pet" : "deactivate_tab_pet",
    }).catch(
      () => {},
    );
  }
}

if (API.storage && API.storage.onChanged) {
  API.storage.onChanged.addListener((changes, areaName) => {
    if (areaName && areaName !== "local") return;
    if (!changes) return;
    if (changes.showOnAllTabs) {
      syncRuntimeScope(changes.showOnAllTabs.newValue === true).catch(() => {});
      return;
    }
    if (changes.disabledSites || changes.disabledSitesList || changes.siteFilterMode) {
      getLocal({ showOnAllTabs: false })
        .then((data) => syncRuntimeScope(data.showOnAllTabs === true))
        .catch(() => {});
    }
  });
}

(function() {
  const RUNNER_FRAME_COUNTS = { patrick: 6, amogus: 8, duck: 10 };
  const RUNNER_DIRS = { patrick: 'assets/runner/patrick/patrick-anim-', amogus: 'assets/runner/amogus/amogus-anim-', duck: 'assets/runner/duck/duck-anim-' };

  let currentRunner = 'none';
  let animationTimer = null;
  let frameIndex = 0;
  let currentImages = [];

  function getRunnerImages(runner) {
    const count = RUNNER_FRAME_COUNTS[runner];
    const dir = RUNNER_DIRS[runner];
    if (!count || !dir) return [];
    return Array.from({ length: count }, (_, i) => dir + i + '.png');
  }

  function setIcon(payload) {
    try {
      if (API.action && typeof API.action.setIcon === "function") {
        const p = API.action.setIcon(payload);
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else if (API.browserAction && typeof API.browserAction.setIcon === "function") {
        const p = API.browserAction.setIcon(payload, () => {
          if (API.runtime && API.runtime.lastError) {}
        });
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    } catch (_) {}
  }

  function startAnimationLoop() {
    if (animationTimer) clearTimeout(animationTimer);

    if (currentRunner === 'none' || currentImages.length === 0) {
      setIcon({ path: { "16": "assets/icons/icon16.png", "32": "assets/icons/icon32.png", "48": "assets/icons/icon48.png", "96": "assets/icons/icon96.png" } });
      return;
    }

    const tick = () => {
      const frame = currentImages[frameIndex];
      setIcon(typeof frame === 'string' ? { path: frame } : { imageData: frame });
      frameIndex = (frameIndex + 1) % currentImages.length;
      animationTimer = setTimeout(tick, 100);
    };

    tick();
  }

  async function updateRunner(runner) {
    currentRunner = runner || 'none';
    const paths = getRunnerImages(currentRunner);
    currentImages = paths;
    frameIndex = 0;
    startAnimationLoop();

    if (currentRunner !== 'none') {
      const loaded = [];
      for (const path of paths) {
        try {
          const url = API.runtime.getURL(path);
          const res = await fetch(url);
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          let canvas = null;
          let ctx = null;
          if (typeof OffscreenCanvas !== "undefined") {
            try {
              canvas = new OffscreenCanvas(32, 32);
              ctx = canvas.getContext("2d");
            } catch (_) {}
          }
          if (!ctx && typeof document !== "undefined" && typeof document.createElement === "function") {
            try {
              canvas = document.createElement("canvas");
              canvas.width = 32;
              canvas.height = 32;
              ctx = canvas.getContext("2d");
            } catch (_) {}
          }
          if (ctx) {
            ctx.clearRect(0, 0, 32, 32);
            ctx.drawImage(bitmap, 0, 0, 32, 32);
            loaded.push({ "32": ctx.getImageData(0, 0, 32, 32) });
          } else {
            loaded.push(path);
          }
          if (typeof bitmap.close === "function") bitmap.close();
        } catch(e) {
          loaded.push(path);
        }
      }
      if (currentRunner === runner) {
        currentImages = loaded;
      }
    }
  }

  if (API.storage && API.storage.local) {
    if (typeof API.storage.local.get === 'function' && API.storage.local.get.length <= 1) {
      API.storage.local.get('animatedFavicon').then(data => {
        if (data && data.animatedFavicon) updateRunner(data.animatedFavicon);
      }).catch(() => {});
    } else {
      API.storage.local.get(['animatedFavicon'], (data) => {
        if (data && data.animatedFavicon) updateRunner(data.animatedFavicon);
      });
    }
  }

  if (API.storage && API.storage.onChanged) {
    API.storage.onChanged.addListener((changes) => {
      if (changes.animatedFavicon) {
        updateRunner(changes.animatedFavicon.newValue);
      }
    });
  }

  if (API.runtime && API.runtime.onMessage) {
    API.runtime.onMessage.addListener((message) => {
      if (message && message.action === 'runnerChanged') {
        updateRunner(message.runner);
      }
    });
  }
})();
