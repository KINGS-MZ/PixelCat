(function() {
  'use strict';

  const API      = typeof browser !== 'undefined' ? browser : chrome;
  const FairPlay = (typeof globalThis !== 'undefined' && globalThis.PixelCatFairPlay) || null;

  const I18N = {
    en: {
      importTitle: 'Import backup',
      importDesc: 'Restore your saved companion, coins, shop items, quests, and settings.',
      importSelect: 'Select backup file',
      importNoFile: 'No file selected',
      importBackup: 'Import backup',
      readingBackup: 'Reading backup\u2026',
      invalidBackup: 'Not a valid PixelCat backup.',
      unsignedBackup: 'Backup has no integrity checksum.',
      verifyingBackup: 'Verifying backup\u2026',
      tamperedBackup: 'Backup integrity check failed.',
      restoringBackup: 'Restoring\u2026',
      successImport: 'Imported! Reopen PixelCat to see the restored data.',
      failedImport: 'Import failed. The file could not be restored.'
    },
    fr: {
      importTitle: 'Importer une sauvegarde',
      importDesc: 'Restaurer votre compagnon, vos pièces, objets du magasin, missions et réglages.',
      importSelect: 'Sélectionner un fichier de sauvegarde',
      importNoFile: 'Aucun fichier sélectionné',
      importBackup: 'Importer la sauvegarde',
      readingBackup: 'Lecture de la sauvegarde\u2026',
      invalidBackup: 'Sauvegarde PixelCat invalide.',
      unsignedBackup: 'La sauvegarde n\'a pas de somme de contrôle.',
      verifyingBackup: 'Vérification de la sauvegarde\u2026',
      tamperedBackup: 'Échec du contrôle d\'intégrité de la sauvegarde.',
      restoringBackup: 'Restauration en cours\u2026',
      successImport: 'Importé ! Rouvrez PixelCat pour voir les données restaurées.',
      failedImport: 'Échec de l\'importation. Le fichier n\'a pas pu être restauré.'
    },
    it: {
      importTitle: 'Importa un backup',
      importDesc: 'Ripristina compagno, monete, oggetti, missioni e impostazioni.',
      importSelect: 'Seleziona file di backup',
      importNoFile: 'Nessun file selezionato',
      importBackup: 'Importa backup',
      readingBackup: 'Lettura del backup\u2026',
      invalidBackup: 'Backup PixelCat non valido.',
      unsignedBackup: 'Il backup non contiene un checksum di integrità.',
      verifyingBackup: 'Verifica del backup\u2026',
      tamperedBackup: 'Controllo di integrità del backup non riuscito.',
      restoringBackup: 'Ripristino in corso\u2026',
      successImport: 'Importato! Riapri PixelCat per vedere i dati ripristinati.',
      failedImport: 'Importazione non riuscita. Impossibile ripristinare il file.'
    },
    ar: {
      importTitle: 'استيراد نسخة احتياطية',
      importDesc: 'استعادة رفيقك والعملات وأغراض المتجر والمهام والإعدادات.',
      importSelect: 'اختر ملف النسخة الاحتياطية',
      importNoFile: 'لم يتم اختيار أي ملف',
      importBackup: 'استيراد النسخة الاحتياطية',
      readingBackup: 'قراءة النسخة الاحتياطية\u2026',
      invalidBackup: 'نسخة PixelCat غير صالحة.',
      unsignedBackup: 'لا تحتوي النسخة الاحتياطية على رمز تحقق من السلامة.',
      verifyingBackup: 'التحقق من النسخة الاحتياطية\u2026',
      tamperedBackup: 'فشل التحقق من سلامة النسخة الاحتياطية.',
      restoringBackup: 'جارٍ الاستعادة\u2026',
      successImport: 'تم الاستيراد بنجاح! أعد فتح PixelCat لرؤية البيانات.',
      failedImport: 'فشل الاستيراد. تعذر استعادة الملف.'
    }
  };

  let currentLang = 'en';

  function getI18nText(key) {
    const dict = I18N[currentLang] || I18N.en;
    return dict[key] || I18N.en[key] || '';
  }

  function applyImportI18n() {
    if (!API || !API.storage || !API.storage.local) return;
    const get = (typeof API.storage.local.get.length <= 1)
      ? API.storage.local.get.bind(API.storage.local)
      : function(k) { return new Promise(function(r) { API.storage.local.get(k, r); }); };

    get({ uiLanguage: 'en' }).then(function(data) {
      currentLang = data.uiLanguage || 'en';
      const dict = I18N[currentLang] || I18N.en;
      document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', currentLang);
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      });
      if (!selectedFile && fileName) {
        fileName.textContent = dict.importNoFile || 'No file selected';
      }
    }).catch(function() {});
  }

  const fileInput  = document.getElementById('backupFile');
  const fileName   = document.getElementById('fileName');
  const importBtn  = document.getElementById('importBtn');
  const statusEl   = document.getElementById('status');
  const importCard = document.getElementById('importCard');
  let selectedFile = null;

  const LEGACY_IO_KEY = 'pcx\u0021v1\u2665' + 'K9mQ\u03c0\u03b1T' + 'seal\u00b72026\u00a7xZ';

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.className   = isError ? 'err' : (msg ? 'ok' : '');
  }

  function storageSet(values) {
    if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1)
      return API.storage.local.set(values);
    return new Promise((res) => API.storage.local.set(values, res));
  }

  function sendRuntimeMessage(msg) {
    try {
      const r = API.runtime.sendMessage(msg);
      if (r && typeof r.then === 'function') return r;
    } catch (_) {}
    return new Promise((res, rej) => {
      API.runtime.sendMessage(msg, (response) => {
        if (API.runtime.lastError) rej(new Error(API.runtime.lastError.message));
        else res(response);
      });
    });
  }

  function readFileAsText(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = (e) => res(e.target.result);
      reader.onerror = () => rej(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async function getKey() {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw', enc.encode(LEGACY_IO_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign', 'verify']
    );
  }

  function stableStringify(val) {
    if (val === null || typeof val !== 'object') return JSON.stringify(val);
    if (Array.isArray(val)) return '[' + val.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(val).sort().map(
      (k) => JSON.stringify(k) + ':' + stableStringify(val[k])
    ).join(',') + '}';
  }

  function legacyStringify(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  async function signText(text) {
    const enc = new TextEncoder();
    const key = await getKey();
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(text));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function checksumBackup(dataObj) {
    const bytes = new TextEncoder().encode(stableStringify(dataObj));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function verifyBackup(payload) {
    if (payload._checksum) return (await checksumBackup(payload.data)) === payload._checksum;
    if (!payload._sig) return false;
    const stableSig = await signText(stableStringify(payload.data));
    if (stableSig === payload._sig) return true;
    return (await signText(legacyStringify(payload.data))) === payload._sig;
  }

  async function restoreBackup(payload) {
    const data = payload.data;
    if (FairPlay && typeof FairPlay.commit === 'function')
      return FairPlay.commit(API.storage.local, data);
    await storageSet(data);
    return data;
  }

  async function importSelectedFile() {
    if (!selectedFile) return;
    importBtn.disabled = true;
    try {
      setStatus(getI18nText('readingBackup'), false);
      const text    = await readFileAsText(selectedFile);
      const payload = JSON.parse(text);

      if (!payload || !payload._pixelcat || !payload.data || typeof payload.data !== 'object') {
        setStatus(getI18nText('invalidBackup'), true); return;
      }
      if (!payload._checksum && !payload._sig) {
        setStatus(getI18nText('unsignedBackup'), true); return;
      }

      setStatus(getI18nText('verifyingBackup'), false);
      if (!(await verifyBackup(payload))) {
        setStatus(getI18nText('tamperedBackup'), true); return;
      }

      setStatus(getI18nText('restoringBackup'), false);
      const restored = await restoreBackup(payload);
      await sendRuntimeMessage({ action: 'updateSettings', settings: restored }).catch(() => {});
      setStatus(getI18nText('successImport'), false);
    } catch (err) {
      setStatus(getI18nText('failedImport'), true);
    } finally {
      importBtn.disabled = !selectedFile;
    }
  }

  fileInput.addEventListener('change', () => {
    selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    fileName.textContent = selectedFile ? selectedFile.name : getI18nText('importNoFile');
    importBtn.disabled   = !selectedFile;
    setStatus('', false);
  });

  if (importCard) {
    importCard.addEventListener('dragover', (e) => {
      e.preventDefault();
      importCard.classList.add('drag-over');
    });
    importCard.addEventListener('dragleave', () => importCard.classList.remove('drag-over'));
    importCard.addEventListener('drop', (e) => {
      e.preventDefault();
      importCard.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        selectedFile = file;
        fileName.textContent = file.name;
        importBtn.disabled   = false;
        setStatus('', false);
      }
    });
  }

  importBtn.addEventListener('click', importSelectedFile);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyImportI18n);
  } else {
    applyImportI18n();
  }

})();
