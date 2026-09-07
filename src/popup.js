(function() {
  const API = typeof browser !== 'undefined' ? browser : chrome;
  const QuestEngine = globalThis.PixelCatQuests || null;
  const FairPlay = globalThis.PixelCatFairPlay || null;
  const UiScale = globalThis.PixelCatUiScale || null;

  const defaultSettings = {
    freePlayMode: false,
    unlockAll: false,
    catEnabled: true,
    companionEnabled: false,
    companionPet: 'same',
    loyalMode: false,
    aggressiveMode: true,
    wallClimbEnabled: false,
    ballPropsEnabled: false,
    speedMultiplier: 1.0,
    catSkin: 'white',
    hbabySkin: 'white',
    foxSkin: 'orange',
    pigeonSkin: 'black',
    skeletonSkin: 'purple',
    batSkin: 'white',
    snakeSkin: 'purple',
    uiMischiefEnabled: false,
    speechEnabled: false,
    rareEventsEnabled: true,
    autoFishSpawnEnabled: false,
    lowPowerMode: false,
    hideInFullscreen: false,
    showOnAllTabs: false,
    sizeMultiplier: 1.0,
    uiScale: 1.0,
    uiMischiefRate: 11,
    catEnergyLevel: 'active',
    ballEnabled: false,
    spiderEnabled: false,
    portalEnabled: false,
    ballFrequency: 'normal',
    fishFrequency: 'normal',
    spiderFrequency: 'normal',
    portalFrequency: 'normal',
    soapBubbleFrequency: 'normal',
    catXP: 0,
    coins: 0,
    shopOwned: [],
    shopActiveBoosts: null,
    dailyStreak: 0,
    lastStreakDate: '',
    activeBall: 'ball_baseball',
    activePet: 'pet_cat',
    activeHat: 'hat_none',
    uiLanguage: 'en',
    disabledSites: 'none',
    disabledSitesList: [],
    petName: '',
    petSex: '',
    dragHandEnabled: false,
    animatedFavicon: 'none'
  };

  function normalizePetId(pet) {
    const id = String(pet || '').replace(/^pet_/, '');
    return id === 'babycat' ? 'hbaby' : id;
  }

  function isPet(pet, ...petIds) {
    return petIds.includes(normalizePetId(pet));
  }

  function isFlyingPet(pet) {
    return isPet(pet, 'bat', 'fairy');
  }

  function isClippyPet(pet) {
    return isPet(pet, 'clippy');
  }

  function isFrogPet(pet) {
    return isPet(pet, 'frog');
  }

  const DEFAULT_SKIN_CONFIG = Object.freeze({ key: 'catSkin', fallback: 'white' });
  const PET_SKIN_CONFIG = Object.freeze({
    fox: Object.freeze({ key: 'foxSkin', fallback: 'orange' }),
    red_panda: Object.freeze({ key: 'foxSkin', fallback: 'orange' }),
    pigeon: Object.freeze({ key: 'pigeonSkin', fallback: 'black' }),
    skeleton: Object.freeze({ key: 'skeletonSkin', fallback: 'purple' }),
    bat: Object.freeze({ key: 'batSkin', fallback: 'white' }),
    hbaby: Object.freeze({ key: 'hbabySkin', fallback: 'white' }),
    snake: Object.freeze({ key: 'snakeSkin', fallback: 'purple' })
  });

  function isNonCatPet(pet) {
    return isPet(pet, 'fox', 'red_panda', 'skeleton', 'penguin', 'fairy', 'pigeon', 'hedgehog', 'snake');
  }

  function isSkinLockedPet(pet) {
    return isPet(pet, 'frog', 'penguin', 'clippy', 'fairy', 'zombie', 'hedgehog');
  }

  function hasNoCompanionSupport(pet) {
    return isPet(pet, 'clippy', 'bat');
  }

  const TRANSLATIONS = {
    en: {
      coins: 'Coins', xpHint: 'Feed fish or play ball to earn XP',
      dailyBonusReady: 'Daily Bonus Ready!', tapToClaim: 'Tap to claim your coins', claim: 'Claim',
      level4needed: 'Reach Level 5', companion: 'Companion', loyalMode: 'Loyal Mode', catSkin: 'Pet Skin',
      quests: 'Quests', achievements: 'Achievements', dailyQuests: 'Daily Quests',
      energyLevel: 'Energy Level', affectsSpeed: 'Affects movement speed',
      sleepy: 'Sleepy', active: 'Active', autoSpawn: 'Auto Spawn', aggressiveMode: 'Aggressive Mode', walkOnWalls: 'Walk on Screen Sides',
      ballPropsEnabled: 'Ball Props', infoBallProps: 'Interactive basketball hoop and bowling pins.',
      basic: 'Basic', advanced: 'Advanced', danger: 'Danger', speed: 'Speed',
      requiresLevel2: 'Reach Level 2', speechBubbles: 'Speech Bubbles',
      hideFullscreen: 'Hide in Fullscreen', showOnAllTabs: 'Show on All Tabs', language: 'Language', lowPowerMode: 'Low Power Mode',
      infoShowOnAllTabs: 'Shows pets on all open tabs.',
      level5needed: 'Reach Level 6', pageMischief: 'Page Mischief', rareEvents: 'Rare Events',
      requiresLevel5: 'Reach Level 6', mischiefRate: 'Mischief Rate',
      size: 'Pet Size', uiSize: 'UI Size', sizeWarning: 'This might cause unexpected behavior',
      resetProgress: 'Reset Progress',
      items: 'ITEMS', balls: 'BALLS', hats: 'HATS', boosts: 'Boosts', pets: 'Pets',
      freePlayMode: 'Sandbox Mode'
    },
    fr: {
      donateBtnText: 'Faire un don',
      coins: 'Pièces', xpHint: 'Nourrissez le chat ou jouez pour gagner de l\'XP',
      dailyBonusReady: 'Bonus quotidien prêt !', tapToClaim: 'Appuyez pour réclamer vos pièces', claim: 'Réclamer',
      level4needed: 'Atteignez le niveau 5', companion: 'Compagnon', loyalMode: 'Mode Loyal', catSkin: 'Apparence',
      quests: 'Quêtes', achievements: 'Succès', dailyQuests: 'Quêtes du jour',
      energyLevel: 'Niveau d\'énergie', affectsSpeed: 'Affecte la vitesse de déplacement',
      sleepy: 'Somnolent', active: 'Actif', autoSpawn: 'Invocation auto', aggressiveMode: 'Mode agressif',
      basic: 'Basique', advanced: 'Avancé', danger: 'Danger', speed: 'Vitesse',
      requiresLevel2: 'Atteignez le niveau 2', speechBubbles: 'Bulles de dialogue',
      hideFullscreen: 'Masquer plein écran', showOnAllTabs: 'Afficher sur tous les onglets', language: 'Langue', lowPowerMode: 'Mode éco',
      level5needed: 'Atteignez le niveau 6', pageMischief: 'Espièglerie de page', rareEvents: 'Événements rares',
      requiresLevel5: 'Atteignez le niveau 6', mischiefRate: 'Taux de bêtises',
      size: 'Taille de l’animal', uiSize: 'Taille de l’interface', sizeWarning: 'Risque de bug',
      clearMemory: 'Effacer la mémoire', resetProgress: 'Réinitialiser la progression',
      items: 'OBJETS', balls: 'BALLES', hats: 'CHAPEAUX', boosts: 'Bonus', pets: 'Animaux',
      freePlayMode: 'Mode Sandbox'
    },
    it: {
      "coins": "Monete",
      "xpHint": "Dai pesci o gioca a palla per guadagnare XP",
      "dailyBonusReady": "Bonus giornaliero pronto!",
      "tapToClaim": "Tocca per reclamare le tue monete",
      "claim": "Riscatta",
      "level4needed": "Raggiungi il livello 5",
      "companion": "Compagno",
      "loyalMode": "Modalità fedele",
      "catSkin": "Skin pet",
      "quests": "Missioni",
      "achievements": "Obiettivi",
      "dailyQuests": "Missioni giornaliere",
      "energyLevel": "Livello energia",
      "affectsSpeed": "Influisce sulla velocità di movimento",
      "sleepy": "Sonnolento",
      "active": "Attivo",
      "autoSpawn": "Spawn automatico",
      "aggressiveMode": "Modalità aggressiva",
      "basic": "Base",
      "advanced": "Avanzato",
      "danger": "Pericolo",
      "speed": "Velocità",
      "requiresLevel2": "Raggiungi il livello 2",
      "speechBubbles": "Fumetti",
      "hideFullscreen": "Nascondi a schermo intero",
      "showOnAllTabs": "Mostra su tutte le schede",
      "language": "Lingua",
      "lowPowerMode": "Modalità risparmio",
      "level5needed": "Raggiungi il livello 6",
      "pageMischief": "Dispetti pagina",
      "rareEvents": "Eventi rari",
      "requiresLevel5": "Raggiungi il livello 6",
      "mischiefRate": "Tasso dispetti",
      "size": "Dimensione animale",
      "uiSize": "Dimensione interfaccia",
      "sizeWarning": "Potrebbe causare comportamenti strani",
      "resetProgress": "Reimposta progressi",
      "items": "OGGETTI",
      "balls": "PALLE",
      "hats": "CAPPELLI",
      "boosts": "Boost",
      "pets": "Animali",
      "freePlayMode": "Modalità Sandbox"
    },
    ar: {
      coins: 'عملات', xpHint: 'أطعم القطة أو العب لكسب نقاط الخبرة',
      dailyBonusReady: 'المكافأة اليومية جاهزة!', tapToClaim: 'اضغط للمطالبة بعملاتك', claim: 'اطلب',
      level4needed: 'الوصول إلى المستوى 5', companion: 'رفيق', loyalMode: 'الوضع الوفي', catSkin: 'مظهر الحيوان',
      quests: 'مهام', achievements: 'إنجازات', dailyQuests: 'المهام اليومية',
      energyLevel: 'مستوى الطاقة', affectsSpeed: 'يؤثر على سرعة الحركة',
      sleepy: 'نعسان', active: 'نشيط', autoSpawn: 'إنتاج تلقائي', aggressiveMode: 'الوضع العدواني',
      basic: 'أساسي', advanced: 'متقدم', danger: 'خطر', speed: 'السرعة',
      requiresLevel2: 'الوصول إلى المستوى 2', speechBubbles: 'فقاعات الكلام',
      hideFullscreen: 'إخفاء عند ملء الشاشة', showOnAllTabs: 'العرض على جميع علامات التبويب', language: 'اللغة', lowPowerMode: 'وضع توفير الطاقة',
      level5needed: 'الوصول إلى المستوى 6', pageMischief: 'شقاوة الصفحة', rareEvents: 'أحداث نادرة',
      requiresLevel5: 'الوصول إلى المستوى 6', mischiefRate: 'معدل الشقاوة',
      size: 'حجم الحيوان', uiSize: 'حجم الواجهة', sizeWarning: 'قد يسبب خللاً',
      clearMemory: 'مسح الذاكرة', resetProgress: 'إعادة تعيين التقدم',
      items: 'عناصر', balls: 'كرات', hats: 'قبعات', boosts: 'مُعززات', pets: 'حيوانات',
      freePlayMode: 'وضع Sandbox'
    }
  };

  const I18N_EXTRA = {
    en: {
      donateBtnText: 'Donate',
      disableOn: 'Disable on', siteNone: 'None', siteYouTube: 'YouTube', siteGoogle: 'Google', siteReddit: 'Reddit',
      disabled: 'Disabled', fish: 'Fish', food: 'Food', ball: 'Ball', spider: 'Spider', portal: 'Portal', hyper: 'Hyper',
      about: 'About', stats: 'Stats', unavailable: 'Unavailable', objectivesUnavailable: 'Objectives are unavailable in this session.',
      remaining: '{time} remaining', streak: 'Streak: {count}', complete: 'Complete',
      allObjectivesComplete: 'All objectives complete. {count} finished overall.',
      remainingToday: '{remaining} remaining today. {count} finished overall.',
      level: 'Level {level}', xpProgress: '{current} / {needed} XP', requires: 'Requires {level}',
      unlockSpeechBall: 'Reach Level 2 to unlock Speech & Ball', unlockSpiders: 'Reach Level 3 to unlock Spiders',
      unlockCompanion: 'Reach Level 5 to unlock Companion Cat', unlockSize: 'Reach Level 4 to unlock Size Scaling',
      unlockMischief: 'Reach Level 6 to unlock Page Mischief', unlockPortals: 'Reach Level 7 to unlock Portals',
      unlockHyper: 'Reach Level 8 to unlock Hyper Energy', level9Hint: 'Level 9 - Almost a master companion!',
      level10Hint: 'Level 10 - Max level reached!', maxLevel: 'Max Level! All features unlocked.',
      sandboxUnlockedHint: 'Sandbox Mode — All features & items unlocked',
      showSkillsTree: 'Show Skills Tree', hideSkillsTree: 'Hide Skills Tree',
      aboutPixelCatTitle: 'What is PixelCat?', aboutPixelCatBody: 'A pixel pet for YouTube, made by IMAD. It roams, plays, and grows as you watch videos.',
      aboutLevelsTitle: 'How levels work', aboutLevelsBody: 'Earn XP by petting, feeding, and playing. Level up to unlock new features.',
      aboutCoinsTitle: 'Earning coins', aboutCoinsBody: 'Coins drop during play. Click them to collect! Get daily bonuses by opening the popup.',
      aboutQuestsTitle: 'Daily quests', aboutQuestsBody: 'Complete 3 tasks every day to earn rewards and keep your streak going.',
      aboutAchievementsTitle: 'Achievements', aboutAchievementsBody: 'Earn badges for special milestones, like your first pet or catching many spiders.',
      aboutBugsTitle: 'Found a bug?', aboutBugsBody: "Please don't report bugs, I am too lazy to fix them hhhh. Just pretend it's a feature!",
      aboutSpawningTitle: 'Spawning items', aboutSpawningBody: 'Use Auto Spawn to drop fish, balls, or spiders for your cat to play with.',
      aboutShopTitle: 'Shop & boosts', aboutShopBody: 'Use coins to buy new ball skins and permanent boosts that help you earn more.',
      aboutTipsTitle: 'Tips & tricks', aboutTipsBody: 'Pet your cat after it eats for a bonus. Use Loyal Mode to make it follow your mouse.',
      supportPixelCat: 'Support PixelCat', supportKoFi: 'Support PixelCat on Ko-fi',
      statFishEaten: 'Fish Eaten', statSpidersCaught: 'Spiders Caught', statPetSessions: 'Pet Sessions',
      statCoinsCollected: 'Coins Collected', statBallCatches: 'Ball Catches', statQuestsDone: 'Quests Done',
      statPerfectDays: 'Perfect Days', statDailyStreak: 'Daily Streak',
      skillsTree: 'Skills Tree', dragTree: 'Drag the tree to explore', basicInstincts: 'Basic Instincts',
      core: 'Core', speechBubble: 'Speech Bubble', fishHunt: 'Fish Hunt', wallNinja: 'Wall Ninja',
      sizeWeight: 'Size & Weight', petBond: 'Pet Bond', ballChaser: 'Ball Chaser', spiderHunter: 'Spider Hunter',
      companionMode: 'Companion Mode', portalTraveler: 'Portal Traveler', hyperEnergy: 'Hyper Energy', madeBy: 'Made by',
      firstFriend: 'First Friend', hundredPets: '100 Pets', sevenDayStreak: '7 Day Streak', masterMischief: 'Mischief',
      buyCoins: '{price} coins', activeItem: 'Active', setActive: 'Set Active', enable: 'Enable', disable: 'Disable',
      claimCoinsToday: 'Claim +{count} coins today', coinsAmount: '+{count} coins',
      ballBaseball: 'Baseball', ballTennis: 'Tennis Ball', ballGolf: 'Golf Ball', ballBasketball: 'Basketball',
      ballFootball: 'Football', ballVolleyball: 'Volleyball', ballBowling: 'Bowling Ball', hatNone: 'No Hat',
      petCat: 'Cat', petFox: 'Fox', petFrog: 'Frog', petPenguin: 'Penguin', petRedPanda: 'Red Panda', petSkeleton: 'Skeleton', petFairy: 'Fairy', petPigeon: 'Pigeon', petClippy: 'Clippy', petBat: 'Bat', petZombie: 'Zombie', petHBaby: 'Baby', petHedgehog: 'Hedgehog', petSnake: 'Snake', upcoming: 'Upcoming', upcomingNote: 'In future updates',
      boostFeather: 'Feather Wand', boostFeatherDesc: '+2 coins per pet', boostTreat: 'Golden Treat',
      boostTreatDesc: 'Double fish coins', boostMagnet: 'Coin Magnet', boostMagnetDesc: 'Attracts nearby coins',
      boostLucky: 'Lucky Charm', boostLuckyDesc: 'More frequent drops',
      questPet: 'Pet Session', questFish: 'Give Fish', questWatch: 'Watch Together', questCoins: 'Collect Coins',
      questFetch: 'Play Fetch', questSpiders: 'Catch Spiders', questGoogleVisit: 'Google Visit', questGoogleSearch: 'Search Buddy', questGooglePatrol: 'Google Patrol', questDoubleAffection: 'Double Affection',
      questFishFeast: 'Fish Feast', questLongSession: 'Long Session',
      showToggleInfo: 'Show setting info', hideToggleInfo: 'Hide setting info',
      infoCompanion: 'Adds a second cat when unlocked.',
      infoLoyal: 'Makes the cat follow your cursor.',
      infoAggressive: 'Makes reactions and spider fights bolder.',
      infoSpeech: 'Lets the cat talk in speech bubbles.',
      infoFullscreen: 'Hides PixelCat during fullscreen videos.',
      infoShowOnAllTabs: 'Shows pets on all open tabs.',
      infoLowPower: 'Less animation, smoother mode.',
      infoMischief: 'Allows small playful page interactions.',
      infoRareEvents: 'Enables rare events like bubbles.',
      infoFreePlay: 'Unlock all content without XP or coins.',
      infoDragHand: 'Shows a hand icon when dragging the pet.',
      ecoBlockedInfo: 'Turn off Eco Mode first',
      confirm: 'Confirm', cancel: 'Cancel', openInfo: 'Open info',
      dragHand: 'Drag Hand', animals: 'Animals', characters: 'Characters',
      walkOnWalls: 'Walk on Screen Sides', infoWalkOnWalls: 'Lets the cat walk and climb along the screen edges.',
      infoBallProps: 'Interactive basketball hoop and bowling pins.',
      petNameField: 'Pet Name', identityField: 'Identity', male: 'Male', female: 'Female',
      onboardMeetTitle: 'Meet your companion!', onboardPick: 'Pick a name and identity.', onboardRename: 'Rename your companion', onboardPickNew: 'Pick a new name or identity.', onboardGive: 'Give your companion a name.', onboardQuick: 'One quick thing…', onboardSafeNote: '🛡️ Your progress is safe.', onboardCta: 'Let\'s go! 🐾',
      newIn: 'New in',
      reviewTitle: 'Give us a review!', reviewBonus: 'Claim +50 bonus coins',
      websiteRules: 'Website Rules', manageWebsiteRules: 'Manage website rules (Allowlist / Blacklist)', backToSettings: '← Back to Settings', allowlistOnly: 'Allowlist Only', addWebsite: 'Add Website', addSitePlaceholder: 'e.g. github.com', addCurrentSite: '+ Add Current Site', allowlist: 'Allowlist', blacklist: 'Blacklist', noSitesAdded: 'No websites added yet.', helpAllowlistOnly: 'Show ONLY on listed sites', helpBlacklist: 'Hide on listed sites',
      activityControls: 'Spawn Rates', manageActivityControls: 'Customize spawn rates',
      activityGroupPlay: 'Section 1', activityGroupEffects: 'Section 2', settingOn: 'On',
      ballAppearances: 'Ball appearances', foodAppearances: 'Food appearances', spiderVisits: 'Spider visits', portalVisits: 'Portal visits', soapBubbles: 'Soap bubbles',
      frequencyOff: 'Off', frequencyRare: 'Rare', frequencyBalanced: 'Balanced', frequencyOften: 'Often',
      disableSandboxMode: 'Disable Sandbox Mode', reachLevelToUnlock: 'Reach Level {level}', reachLevelForMore: 'Reach Level {level}', notAvailableForPet: 'Not available for {pet}', someUnavailableForPet: 'Some options are unavailable for {pet}',
      infoBallFrequency: 'Controls automatic balls. Manual balls are unchanged.', infoFishFrequency: 'Controls automatic food drops for your pet.', infoSpiderFrequency: 'Controls automatic spider challenges.', infoPortalFrequency: 'Controls automatic portal pairs after they are unlocked.', infoSoapBubbleFrequency: 'Controls floating soap-bubble surprises.',
      exportImport: 'Export / Import', exportSettings: 'Export Settings', importSettings: 'Import Settings',
      reportGitHub: 'Found an issue? Report on GitHub',
      goldRush: 'Gold Rush', spiderHero: 'Spider Hero', sushiMaster: 'Sushi Master', consistent: 'Consistent', fishmonger: 'Fishmonger', nightCrawler: 'Night Crawler',
      hatsHint: 'Hats currently work for the Frog only',
      importTitle: 'Import backup', importDesc: 'Restore your saved companion, coins, shop items, quests, and settings.', importSelect: 'Select backup file', importNoFile: 'No file selected', importBackup: 'Import backup',
      petNamePlaceholder: 'e.g. Luna, Max, Pixel…', onboardImportInstead: 'Import from backup instead'
    },
    fr: {
      disableOn: 'Désactiver sur', siteNone: 'Aucun', siteYouTube: 'YouTube', siteGoogle: 'Google', siteReddit: 'Reddit',
      coins: 'Pièces', xpHint: 'Poisson ou balle = XP',
      active: 'Actif', disabled: 'Désactivé', autoSpawn: 'Apparition auto', boosts: 'Bonus',
      fish: 'Poisson', food: 'Nourriture', ball: 'Balle', spider: 'Araignée', portal: 'Portail', hyper: 'Hyper',
      about: 'À propos', stats: 'Stats', unavailable: 'Indisponible', objectivesUnavailable: 'Objectifs indisponibles.',
      remaining: '{time} restantes', streak: 'Série : {count}', complete: 'Terminé',
      allObjectivesComplete: 'Tout est fini. Total : {count}.',
      remainingToday: '{remaining} restants. Total : {count}.',
      level: 'Niveau {level}', xpProgress: '{current} / {needed} XP', requires: '{level} requis',
      unlockSpeechBall: 'Niv. 2 : dialogue et balle', unlockSpiders: 'Niv. 3 : araignées',
      unlockCompanion: 'Niv. 5 : compagnon', unlockSize: 'Niv. 4 : taille',
      unlockMischief: 'Niv. 6 : bêtises', unlockPortals: 'Niv. 7 : portails',
      unlockHyper: 'Niv. 8 : hyper', level9Hint: 'Niv. 9 : presque maître !',
      level10Hint: 'Niv. 10 : défi final !', maxLevel: 'Niveau max ! Tout débloqué.',
      sandboxUnlockedHint: 'Mode Sandbox — Tout est débloqué',
      showSkillsTree: 'Afficher l’arbre', hideSkillsTree: 'Masquer l’arbre',
      aboutPixelCatTitle: 'Qu’est-ce que PixelCat ?', aboutPixelCatBody: 'Un chat pixel pour YouTube, créé par IMAD.',
      aboutLevelsTitle: 'Niveaux', aboutLevelsBody: 'Gagnez de l’XP pour débloquer des fonctions.',
      aboutCoinsTitle: 'Pièces', aboutCoinsBody: 'Cliquez les pièces et prenez le bonus du jour.',
      aboutQuestsTitle: 'Quêtes du jour', aboutQuestsBody: 'Terminez 3 tâches pour garder votre série.',
      aboutAchievementsTitle: 'Succès', aboutAchievementsBody: 'Des badges pour les grands moments.',
      aboutBugsTitle: 'Un bug ?', aboutBugsBody: "S'il vous plaît ne signalez pas de bugs, je suis trop paresseux pour les corriger hhhh. C'est une fonctionnalité !",
      aboutSpawningTitle: 'Apparitions', aboutSpawningBody: 'Ajoutez poissons, balles ou araignées.',
      aboutShopTitle: 'Boutique', aboutShopBody: 'Achetez des balles et bonus permanents.',
      aboutTipsTitle: 'Astuces', aboutTipsBody: 'Caressez après un repas pour un bonus.',
      supportPixelCat: 'Soutenir PixelCat', supportKoFi: 'Soutenir le développement sur Ko-fi',
      statFishEaten: 'Poissons mangés', statSpidersCaught: 'Araignées attrapées', statPetSessions: 'Câlins',
      statCoinsCollected: 'Pièces collectées', statBallCatches: 'Balles attrapées', statQuestsDone: 'Quêtes faites',
      statPerfectDays: 'Jours parfaits', statDailyStreak: 'Série quotidienne',
      skillsTree: 'Arbre des talents', dragTree: 'Faites glisser pour explorer', basicInstincts: 'Instincts de base',
      core: 'Base', speechBubble: 'Bulle de dialogue', fishHunt: 'Chasse au poisson', wallNinja: 'Ninja mural',
      sizeWeight: 'Taille et poids', petBond: 'Lien affectif', ballChaser: 'Chasseur de balle', spiderHunter: 'Chasseur d’araignées',
      companionMode: 'Mode compagnon', portalTraveler: 'Voyageur de portails', hyperEnergy: 'Énergie hyper', madeBy: 'Créé par',
      firstFriend: 'Premier ami', hundredPets: '100 caresses', sevenDayStreak: 'Série de 7 jours', masterMischief: 'Bêtises',
      buyCoins: '{price} pièces', activeItem: 'Actif', setActive: 'Activer', enable: 'Activer', disable: 'Désactiver',
      claimCoinsToday: '+{count} pièces aujourd’hui', coinsAmount: '+{count} pièces',
      ballBaseball: 'Balle de baseball', ballTennis: 'Balle de tennis', ballGolf: 'Balle de golf', ballBasketball: 'Ballon de basket',
      ballFootball: 'Ballon de football', ballVolleyball: 'Ballon de volley', ballBowling: 'Boule de bowling', hatNone: 'Sans chapeau',
      petCat: 'Chat', petFox: 'Renard', petFrog: 'Grenouille', petPenguin: 'Pingouin', petRedPanda: 'Panda Roux', petSkeleton: 'Squelette', petFairy: 'Fée', petPigeon: 'Pigeon', petClippy: 'Clippy', petBat: 'Chauve-souris', petZombie: 'Zombie', petHBaby: 'Baby', petHedgehog: 'Hérisson', petSnake: 'Serpent', upcoming: 'A venir', upcomingNote: 'Prochaines MAJ',
      boostFeather: 'Baguette plume', boostFeatherDesc: '+2 pièces par caresse', boostTreat: 'Friandise dorée',
      boostTreatDesc: 'Pièces poisson x2', boostMagnet: 'Aimant à pièces', boostMagnetDesc: 'Attire les pièces',
      boostLucky: 'Porte-bonheur', boostLuckyDesc: 'Butins fréquents',
      questPet: 'Session câlin', questFish: 'Donner du poisson', questWatch: 'Regarder ensemble', questCoins: 'Collecter des pièces',
      questFetch: 'Jouer à rapporter', questSpiders: 'Attraper des araignées', questGoogleVisit: 'Visite Google', questGoogleSearch: 'Recherche avec le pet', questGooglePatrol: 'Patrouille Google', questDoubleAffection: 'Double affection',
      questFishFeast: 'Festin de poisson', questLongSession: 'Longue session',
      showToggleInfo: 'Voir l’info', hideToggleInfo: 'Masquer l’info',
      infoCompanion: 'Ajoute un deuxième chat une fois débloqué.',
      infoLoyal: 'Le chat suit votre curseur.',
      infoAggressive: 'Réactions et combats plus audacieux.',
      infoSpeech: 'Active les bulles de dialogue du chat.',
      infoFullscreen: 'Cache PixelCat en plein écran.',
      infoShowOnAllTabs: 'Afficher sur tous les onglets simultanément.',
      infoLowPower: 'Moins d’animations, plus fluide.',
      infoMischief: 'Autorise de petites interactions avec la page.',
      infoRareEvents: 'Active les événements surprises comme les bulles et OVNI.',
      infoFreePlay: 'Débloque tout le contenu sans XP ou pièces.',
      infoDragHand: 'Affiche une main lors du glisser-déposer du pet.',
      ecoBlockedInfo: 'Turn off Eco Mode first',
      confirm: 'Confirmer', cancel: 'Annuler', openInfo: 'Ouvrir les infos',
      dragHand: 'Main de drag', animals: 'Animaux', characters: 'Personnages',
      walkOnWalls: 'Marcher sur les bords d\'écran', infoWalkOnWalls: 'Le chat peut marcher et grimper sur les bords de l\'écran.',
      ballPropsEnabled: 'Accessoires de balle', infoBallProps: 'Panier de basket et quilles interactifs.',
      petNameField: 'Nom du compagnon', identityField: 'Identité', male: 'Mâle', female: 'Femelle',
      onboardMeetTitle: 'Rencontrez votre compagnon !', onboardPick: 'Choisissez un nom et une identité.', onboardRename: 'Renommer votre compagnon', onboardPickNew: 'Choisissez un nouveau nom ou une nouvelle identité.', onboardGive: 'Donnez un nom à votre compagnon.', onboardQuick: 'Une petite chose…', onboardSafeNote: '🛡️ Votre progression est en sécurité.', onboardCta: 'C\'est parti ! 🐾',
      newIn: 'Nouveau dans',
      reviewTitle: 'Donnez-nous un avis !', reviewBonus: 'Gagnez +50 pièces bonus',
      websiteRules: 'Règles des sites', manageWebsiteRules: 'Gérer les règles des sites (Autorisés / Exclus)', backToSettings: '← Retour aux paramètres', allowlistOnly: 'Autoriser uniquement les sites listés', addWebsite: 'Ajouter un site', addSitePlaceholder: 'ex. github.com', addCurrentSite: '+ Ajouter le site actuel', allowlist: 'Sites autorisés', blacklist: 'Sites bloqués', noSitesAdded: 'Aucun site ajouté pour le moment.', helpAllowlistOnly: 'Afficher SEULEMENT sur les sites listés', helpBlacklist: 'Masquer sur les sites listés',
      activityControls: 'Taux d\'apparition', manageActivityControls: 'Personnaliser les taux d\'apparition',
      activityGroupPlay: 'Section 1', activityGroupEffects: 'Section 2', settingOn: 'Activé',
      ballAppearances: 'Apparition des balles', foodAppearances: 'Apparition de nourriture', spiderVisits: 'Visites d’araignées', portalVisits: 'Visites de portails', soapBubbles: 'Bulles de savon',
      frequencyOff: 'Non', frequencyRare: 'Rare', frequencyBalanced: 'Équilibré', frequencyOften: 'Souvent',
      disableSandboxMode: 'Désactivez le mode Sandbox', reachLevelToUnlock: 'Atteignez le niveau {level}', reachLevelForMore: 'Atteignez le niveau {level}', notAvailableForPet: 'Indisponible pour {pet}', someUnavailableForPet: 'Certaines options sont indisponibles pour {pet}',
      infoBallFrequency: 'Contrôle les balles automatiques. Les balles manuelles ne changent pas.', infoFishFrequency: 'Contrôle les dépôts automatiques de nourriture.', infoSpiderFrequency: 'Contrôle les défis automatiques avec les araignées.', infoPortalFrequency: 'Contrôle les portails automatiques après leur déblocage.', infoSoapBubbleFrequency: 'Contrôle les surprises en bulles de savon.',
      exportImport: 'Exporter / Importer', exportSettings: 'Exporter les réglages', importSettings: 'Importer les réglages',
      reportGitHub: 'Un problème ? Signalez-le sur GitHub',
      goldRush: 'Ruée vers l\'or', spiderHero: 'Héros des araignées', sushiMaster: 'Maître sushi', consistent: 'Assidu', fishmonger: 'Poissonnier', nightCrawler: 'Rampant nocturne',
      hatsHint: 'Les chapeaux fonctionnent pour le moment uniquement avec la Grenouille',
      importTitle: 'Importer une sauvegarde', importDesc: 'Restaurer votre compagnon, vos pièces, objets du magasin, missions et réglages.', importSelect: 'Sélectionner un fichier de sauvegarde', importNoFile: 'Aucun fichier sélectionné', importBackup: 'Importer la sauvegarde',
      petNamePlaceholder: 'ex. Luna, Max, Pixel…', onboardImportInstead: 'Importer depuis une sauvegarde à la place'
    },
    it: {
      "donateBtnText": "Dona",
      disableOn: 'Disabilita su', siteNone: 'Nessuno', siteYouTube: 'YouTube', siteGoogle: 'Google', siteReddit: 'Reddit',
      "disabled": "Disattivato",
      "fish": "Pesce",
      "food": "Cibo",
      "ball": "Palla",
      "spider": "Ragno",
      "portal": "Portale",
      "hyper": "Iper",
      "about": "Info",
      "stats": "Statistiche",
      "unavailable": "Non disponibile",
      "objectivesUnavailable": "Obiettivi non disponibili in questa sessione.",
      "remaining": "{time} rimanenti",
      "streak": "Serie: {count}",
      "complete": "Completo",
      "allObjectivesComplete": "Tutti gli obiettivi completati. {count} completati in totale.",
      "remainingToday": "{remaining} rimanenti oggi. {count} completati in totale.",
      "level": "Livello {level}",
      "xpProgress": "{current} / {needed} XP",
      "requires": "Richiede {level}",
      "unlockSpeechBall": "Raggiungi il livello 2 per sbloccare fumetti e palla",
      "unlockSpiders": "Raggiungi il livello 3 per sbloccare i ragni",
      "unlockCompanion": "Raggiungi il livello 5 per sbloccare il gatto compagno",
      "unlockSize": "Raggiungi il livello 4 per sbloccare la dimensione",
      "unlockMischief": "Raggiungi il livello 6 per sbloccare i dispetti pagina",
      "unlockPortals": "Raggiungi il livello 7 per sbloccare i portali",
      "unlockHyper": "Raggiungi il livello 8 per sbloccare energia iper",
      "level9Hint": "Livello 9 - Quasi un compagno maestro!",
      "level10Hint": "Livello 10 - Livello massimo raggiunto!",
      "maxLevel": "Livello massimo! Tutte le funzionalità sbloccate.",
      "sandboxUnlockedHint": "Modalità Sandbox — Tutto sbloccato",
      "showSkillsTree": "Mostra albero abilità",
      "hideSkillsTree": "Nascondi albero abilità",
      "aboutPixelCatTitle": "Che cos è PixelCat?",
      "aboutPixelCatBody": "Un pet pixel per YouTube, creato da IMAD. Gira, gioca e cresce mentre guardi video.",
      "aboutLevelsTitle": "Come funzionano i livelli",
      "aboutLevelsBody": "Guadagna XP accarezzando, nutrendo e giocando. Sali di livello per sbloccare nuove funzioni.",
      "aboutCoinsTitle": "Guadagnare monete",
      "aboutCoinsBody": "Le monete cadono durante il gioco. Cliccale per raccoglierle! Apri il popup per il bonus giornaliero.",
      "aboutQuestsTitle": "Missioni giornaliere",
      "aboutQuestsBody": "Completa 3 attività ogni giorno per ottenere ricompense e mantenere la serie.",
      "aboutAchievementsTitle": "Obiettivi",
      "aboutAchievementsBody": "Ottieni badge per traguardi speciali, come la prima carezza o tanti ragni catturati.",
      "aboutBugsTitle": "Trovato un bug?",
      "aboutBugsBody": "Per favore non segnalare bug, sono troppo pigro per risolverli hhhh. È solo una funzionalità!",
      "aboutSpawningTitle": "Generazione oggetti",
      "aboutSpawningBody": "Usa Spawn automatico per far cadere pesci, palle o ragni con cui il gatto può giocare.",
      "aboutShopTitle": "Shop e boost",
      "aboutShopBody": "Usa le monete per comprare nuove skin per le palle e boost permanenti.",
      "aboutTipsTitle": "Consigli",
      "aboutTipsBody": "Accarezza il gatto dopo che mangia per un bonus. Usa Modalità fedele per farlo seguire il mouse.",
      "supportPixelCat": "Supporta PixelCat",
      "supportKoFi": "Supporta PixelCat su Ko-fi",
      "statFishEaten": "Pesci mangiati",
      "statSpidersCaught": "Ragni catturati",
      "statPetSessions": "Sessioni carezze",
      "statCoinsCollected": "Monete raccolte",
      "statBallCatches": "Prese palla",
      "statQuestsDone": "Missioni completate",
      "statPerfectDays": "Giorni perfetti",
      "statDailyStreak": "Serie giornaliera",
      "skillsTree": "Albero abilità",
      "dragTree": "Trascina l albero per esplorare",
      "basicInstincts": "Istinti base",
      "core": "Base",
      "speechBubble": "Fumetto",
      "fishHunt": "Caccia al pesce",
      "wallNinja": "Ninja sul muro",
      "sizeWeight": "Dimensione e peso",
      "petBond": "Legame pet",
      "ballChaser": "Cacciatore di palla",
      "spiderHunter": "Cacciatore di ragni",
      "companionMode": "Modalità compagno",
      "portalTraveler": "Viaggiatore portali",
      "hyperEnergy": "Energia iper",
      "madeBy": "Creato da",
      "firstFriend": "Primo amico",
      "hundredPets": "100 carezze",
      "sevenDayStreak": "Serie 7 giorni",
      "masterMischief": "Dispetti",
      "buyCoins": "{price} monete",
      "activeItem": "Attivo",
      "setActive": "Rendi attivo",
      "enable": "Attiva",
      "disable": "Disattiva",
      "claimCoinsToday": "Riscatta +{count} monete oggi",
      "coinsAmount": "+{count} monete",
      "ballBaseball": "Baseball",
      "ballTennis": "Palla da tennis",
      "ballGolf": "Palla da golf",
      "ballBasketball": "Basketball",
      "ballFootball": "Pallone",
      "ballVolleyball": "Pallavolo",
      "ballBowling": "Palla da bowling",
      "hatNone": "Nessun cappello",
      "petCat": "Gatto",
      "petFox": "Volpe",
      "petFrog": "Rana",
      "petPenguin": "Pinguino",
      "petRedPanda": "Panda Rosso",
      "petSkeleton": "Scheletro",
      "petFairy": "Fata",
      "petPigeon": "Piccione",
      "petClippy": "Clippy",
      "petBat": "Pipistrello",
      "petZombie": "Zombi",
      "petHBaby": "Bebè",
      "petHedgehog": "Riccio",
      "petSnake": "Serpente",
      "upcoming": "In arrivo",
      "upcomingNote": "Nei prossimi aggiornamenti",
      "boostFeather": "Bacchetta piuma",
      "boostFeatherDesc": "+2 monete per carezza",
      "boostTreat": "Dolcetto dorato",
      "boostTreatDesc": "Monete pesce doppie",
      "boostMagnet": "Magnete monete",
      "boostMagnetDesc": "Attira monete vicine al gatto",
      "boostLucky": "Portafortuna",
      "boostLuckyDesc": "Drop più frequenti",
      "questPet": "Sessione coccole",
      "questFish": "Dai un pesce",
      "questWatch": "Guarda insieme",
      "questCoins": "Raccogli monete",
      "questFetch": "Gioca al riporto",
      "questSpiders": "Cattura ragni",
      "questGoogleVisit": "Visita Google",
      "questGoogleSearch": "Cerca insieme",
      "questGooglePatrol": "Pattuglia Google",
      "questDoubleAffection": "Doppio affetto",
      "questFishFeast": "Banchetto di pesce",
      "questLongSession": "Sessione lunga",
      "showToggleInfo": "Mostra info impostazione",
      "hideToggleInfo": "Nascondi info impostazione",
      "infoCompanion": "Aggiunge un secondo gatto quando sbloccato.",
      "infoLoyal": "Fa seguire il cursore al gatto.",
      "infoAggressive": "Rende reazioni e lotte con ragni più forti.",
      "infoSpeech": "Permette al gatto di parlare con i fumetti.",
      "infoFullscreen": "Nasconde PixelCat durante i video a schermo intero.",
      "infoShowOnAllTabs": "Mostra su tutte le schede.",
      "infoLowPower": "Meno animazione, modalità più fluida.",
      "infoMischief": "Permette piccole interazioni giocose con la pagina.",
      "infoRareEvents": "Attiva sorprese come le bolle.",
      "infoFreePlay": "Sblocca tutti i contenuti senza XP o monete.",
      "infoDragHand": "Mostra una mano durante il trascinamento del pet.",
      "ecoBlockedInfo": "Turn off Eco Mode first",
      "confirm": "Conferma",
      "cancel": "Annulla",
      "openInfo": "Apri info",
      "dragHand": "Mano per il trascinamento", "animals": "Animali", "characters": "Personaggi",
      "walkOnWalls": "Camminare sui bordi dello schermo", "infoWalkOnWalls": "Il gatto può camminare e arrampicarsi sui bordi dello schermo.",
      "ballPropsEnabled": "Accessori palla", "infoBallProps": "Canestro da basket e birilli interattivi.",
      "petNameField": "Nome del compagno", "identityField": "Identità", "male": "Maschio", "female": "Femmina",
      "onboardMeetTitle": "Incontra il tuo compagno!", "onboardPick": "Scegli un nome e un'identità.", "onboardRename": "Rinomina il tuo compagno", "onboardPickNew": "Scegli un nuovo nome o una nuova identità.", "onboardGive": "Dai un nome al tuo compagno.", "onboardQuick": "Una cosa veloce…", "onboardSafeNote": "🛡️ I tuoi progressi sono al sicuro.", "onboardCta": "Andiamo! 🐾",
      "newIn": "Novità in",
      "reviewTitle": "Lascia una recensione!", "reviewBonus": "Ottieni +50 monete bonus",
      "websiteRules": "Regole dei siti", "manageWebsiteRules": "Gestisci le regole dei siti (Consentiti / Bloccati)", "backToSettings": "← Indietro alle impostazioni", "allowlistOnly": "Solo siti consentiti", "addWebsite": "Aggiungi sito", "addSitePlaceholder": "es. github.com", "addCurrentSite": "+ Aggiungi sito attuale", "allowlist": "Consentiti", "blacklist": "Bloccati", "noSitesAdded": "Nessun sito aggiunto finora.", "helpAllowlistOnly": "Mostra SOLO sui siti elencati", "helpBlacklist": "Nascondi sui siti elencati",
      "activityControls": "Frequenze di spawn", "manageActivityControls": "Personalizza frequenze di spawn",
      "activityGroupPlay": "Sezione 1", "activityGroupEffects": "Sezione 2", "settingOn": "Attivo",
      "ballAppearances": "Comparsa delle palle", "foodAppearances": "Comparsa del cibo", "spiderVisits": "Visite dei ragni", "portalVisits": "Visite dei portali", "soapBubbles": "Bolle di sapone",
      "frequencyOff": "No", "frequencyRare": "Raro", "frequencyBalanced": "Bilanciato", "frequencyOften": "Spesso",
      "disableSandboxMode": "Disattiva la modalità Sandbox", "reachLevelToUnlock": "Raggiungi il livello {level}", "reachLevelForMore": "Raggiungi il livello {level}", "notAvailableForPet": "Non disponibile per {pet}", "someUnavailableForPet": "Alcune opzioni non sono disponibili per {pet}",
      "infoBallFrequency": "Controlla le palle automatiche. Quelle manuali non cambiano.", "infoFishFrequency": "Controlla il cibo automatico per il tuo pet.", "infoSpiderFrequency": "Controlla le sfide automatiche con i ragni.", "infoPortalFrequency": "Controlla i portali automatici dopo lo sblocco.", "infoSoapBubbleFrequency": "Controlla le sorprese con bolle di sapone.",
      "exportImport": "Esporta / Importa", "exportSettings": "Esporta impostazioni", "importSettings": "Importa impostazioni",
      "reportGitHub": "Un problema? Segnalalo su GitHub",
      "goldRush": "Corsa all'oro", "spiderHero": "Eroe dei ragni", "sushiMaster": "Maestro sushi", "consistent": "Costante", "fishmonger": "Pesciolino", "nightCrawler": "Nottambulo",
      "hatsHint": "I cappelli per ora funzionano solo con la Rana",
      "importTitle": "Importa un backup", "importDesc": "Ripristina compagno, monete, oggetti, missioni e impostazioni.", "importSelect": "Seleziona file di backup", "importNoFile": "Nessun file selezionato", "importBackup": "Importa backup",
      "petNamePlaceholder": "es. Luna, Max, Pixel…", "onboardImportInstead": "Importa da un backup invece"
    },
    ar: {
      donateBtnText: 'تبرع',
      disableOn: 'تعطيل على', siteNone: 'لا شيء', siteYouTube: 'يوتيوب', siteGoogle: 'جوجل', siteReddit: 'ريديت',
      coins: 'عملات', xpHint: 'أطعم السمك أو العب بالكرة لكسب الخبرة',
      active: 'نشط', disabled: 'متوقف', autoSpawn: 'ظهور تلقائي', boosts: 'تعزيزات',
      fish: 'سمك', food: 'الطعام', ball: 'كرة', spider: 'عنكبوت', portal: 'بوابة', hyper: 'فائق',
      about: 'حول', stats: 'الإحصائيات', unavailable: 'غير متاح', objectivesUnavailable: 'الأهداف غير متاحة.',
      remaining: 'متبقٍ {time}', streak: 'السلسلة: {count}', complete: 'مكتمل',
      allObjectivesComplete: 'اكتملت كلها. المجموع: {count}.',
      remainingToday: 'متبقٍ: {remaining}. المجموع: {count}.',
      level: 'المستوى {level}', xpProgress: '{current} / {needed} خبرة', requires: 'يتطلب {level}',
      unlockSpeechBall: 'مستوى 2: الكلام والكرة', unlockSpiders: 'مستوى 3: العناكب',
      unlockCompanion: 'مستوى 5: الرفيق', unlockSize: 'مستوى 4: الحجم',
      unlockMischief: 'مستوى 6: العبث', unlockPortals: 'مستوى 7: البوابات',
      unlockHyper: 'مستوى 8: طاقة فائقة', level9Hint: 'مستوى 9: اقتربت!',
      level10Hint: 'مستوى 10: التحدي الأخير!', maxLevel: 'المستوى الأقصى! الكل مفتوح.',
      sandboxUnlockedHint: 'وضع Sandbox — كل شيء مفتوح',
      showSkillsTree: 'إظهار شجرة المهارات', hideSkillsTree: 'إخفاء شجرة المهارات',
      aboutPixelCatTitle: 'ما هو PixelCat؟', aboutPixelCatBody: 'قط بكسل ليوتيوب، صنعه IMAD.',
      aboutLevelsTitle: 'المستويات', aboutLevelsBody: 'اكسب الخبرة لفتح ميزات جديدة.',
      aboutCoinsTitle: 'العملات', aboutCoinsBody: 'اجمع العملات وخذ مكافأة اليوم.',
      aboutQuestsTitle: 'مهام اليوم', aboutQuestsBody: 'أكمل 3 مهام للحفاظ على السلسلة.',
      aboutAchievementsTitle: 'الإنجازات', aboutAchievementsBody: 'شارات للحظات المهمة.',
      aboutBugsTitle: 'وجدت خطأ؟', aboutBugsBody: 'رجاءً لا تبلغ عن الأخطاء، أنا متكاسل جداً عن إصلاحها هههه. اعتبرها ميزة إضافية!',
      aboutSpawningTitle: 'العناصر', aboutSpawningBody: 'أضف سمكاً أو كرات أو عناكب.',
      aboutShopTitle: 'المتجر', aboutShopBody: 'اشتر كرات وتعزيزات دائمة.',
      aboutTipsTitle: 'نصائح', aboutTipsBody: 'داعبه بعد الطعام لمكافأة.',
      supportPixelCat: 'ادعم PixelCat', supportKoFi: 'ادعم التطوير على Ko-fi',
      statFishEaten: 'السمك المأكول', statSpidersCaught: 'العناكب المصادة', statPetSessions: 'جلسات المداعبة',
      statCoinsCollected: 'العملات المجمعة', statBallCatches: 'الكرات الملتقطة', statQuestsDone: 'المهام المكتملة',
      statPerfectDays: 'الأيام المثالية', statDailyStreak: 'السلسلة اليومية',
      skillsTree: 'شجرة المهارات', dragTree: 'اسحب الشجرة للاستكشاف', basicInstincts: 'الغرائز الأساسية',
      core: 'أساسي', speechBubble: 'فقاعة الكلام', fishHunt: 'صيد السمك', wallNinja: 'نينجا الجدار',
      sizeWeight: 'الحجم والوزن', petBond: 'رابطة المداعبة', ballChaser: 'مطارد الكرة', spiderHunter: 'صياد العناكب',
      companionMode: 'وضع الرفيق', portalTraveler: 'مسافر البوابات', hyperEnergy: 'طاقة فائقة', madeBy: 'صنع بواسطة',
      firstFriend: 'أول صديق', hundredPets: '100 مداعبة', sevenDayStreak: 'سلسلة 7 أيام', masterMischief: 'العبث',
      buyCoins: '{price} عملات', activeItem: 'نشط', setActive: 'اجعله نشطاً', enable: 'تفعيل', disable: 'تعطيل',
      claimCoinsToday: '+{count} عملات اليوم', coinsAmount: '+{count} عملات',
      ballBaseball: 'كرة بيسبول', ballTennis: 'كرة تنس', ballGolf: 'كرة غولف', ballBasketball: 'كرة سلة',
      ballFootball: 'كرة قدم', ballVolleyball: 'كرة طائرة', ballBowling: 'كرة بولينغ', hatNone: 'بدون قبعة',
      petCat: 'قطة', petFox: 'ثعلب', petFrog: 'ضفدع', petPenguin: 'بطريق', petRedPanda: 'باندا أحمر', petSkeleton: 'هيكل عظمي', petFairy: 'جنية', petPigeon: 'حمام', petClippy: 'Clippy', petBat: 'خفاش', petZombie: 'زومبي', petHBaby: 'Baby', petHedgehog: 'قنفذ', petSnake: 'ثعبان', upcoming: 'قريباً', upcomingNote: 'في التحديثات القادمة',
      boostFeather: 'عصا الريشة', boostFeatherDesc: '+2 عملات لكل مداعبة', boostTreat: 'حلوى ذهبية',
      boostTreatDesc: 'عملات السمك x2', boostMagnet: 'مغناطيس العملات', boostMagnetDesc: 'يجذب العملات',
      boostLucky: 'تميمة الحظ', boostLuckyDesc: 'إسقاطات أكثر',
      questPet: 'جلسة مداعبة', questFish: 'قدّم السمك', questWatch: 'شاهدوا معاً', questCoins: 'اجمع العملات',
      questFetch: 'العب جلب الكرة', questSpiders: 'اصطد العناكب', questGoogleVisit: 'زيارة Google', questGoogleSearch: 'بحث مع الرفيق', questGooglePatrol: 'دورية Google', questDoubleAffection: 'عاطفة مضاعفة',
      questFishFeast: 'وليمة سمك', questLongSession: 'جلسة طويلة',
      showToggleInfo: 'إظهار المعلومات', hideToggleInfo: 'إخفاء المعلومات',
      infoCompanion: 'يضيف قطاً ثانياً بعد فتحه.',
      infoLoyal: 'يجعل القط يتبع المؤشر.',
      infoAggressive: 'يجعل ردود الفعل أقوى.',
      infoSpeech: 'يفعّل فقاعات كلام القط.',
      infoFullscreen: 'يخفي PixelCat في وضع ملء الشاشة.',
      infoShowOnAllTabs: 'العرض على جميع علامات التبويب.',
      infoLowPower: 'حركات أقل، أداء أفضل.',
      infoMischief: 'يسمح بتفاعلات صغيرة مع الصفحة.',
      infoRareEvents: 'يفعّل الأحداث المفاجئة مثل الفقاعات.',
      infoFreePlay: 'فتح جميع المحتويات بدون الحاجة إلى نقاط خبرة أو عملات.',
      infoDragHand: 'يظهر أيقونة يد عند سحب الحيوان الأليف.',
      ecoBlockedInfo: 'Turn off Eco Mode first',
      confirm: 'تأكيد', cancel: 'إلغاء', openInfo: 'فتح المعلومات',
      dragHand: 'يد السحب', animals: 'الحيوانات', characters: 'الشخصيات',
      walkOnWalls: 'المشي على حواف الشاشة', infoWalkOnWalls: 'يستطيع القط المشي والتسلق على حواف الشاشة.',
      ballPropsEnabled: 'ملحقات الكرات', infoBallProps: 'طوق كرة السلة ودبابيس بولينج تفاعلية.',
      petNameField: 'اسم الحيوان الأليف', identityField: 'الهوية', male: 'ذكر', female: 'أنثى',
      onboardMeetTitle: 'قابل رفيقك!', onboardPick: 'اختر اسماً وهوية.', onboardRename: 'إعادة تسمية رفيقك', onboardPickNew: 'اختر اسماً وهوية جديدة.', onboardGive: 'أعطِ رفيقك اسماً.', onboardQuick: 'شيء واحد سريع…', onboardSafeNote: '🛡️ تقدمك في أمان.', onboardCta: 'هيا بنا! 🐾',
      newIn: 'الجديد في',
      reviewTitle: 'قيّمنا!', reviewBonus: 'احصل على +50 عملة مكافأة',
      websiteRules: 'قواعد المواقع', manageWebsiteRules: 'إدارة قواعد المواقع (قائمة مسموح بها / محظورة)', backToSettings: '← عودة إلى الإعدادات', allowlistOnly: 'المواقع المسموحة فقط', addWebsite: 'إضافة موقع', addSitePlaceholder: 'مثال: github.com', addCurrentSite: '+ إضافة الموقع الحالي', allowlist: 'مسموح', blacklist: 'محظور', noSitesAdded: 'لا توجد مواقع مضافة بعد.', helpAllowlistOnly: 'العرض حصرياً على المواقع المدرجة', helpBlacklist: 'الإخفاء على المواقع المدرجة',
      activityControls: 'معدلات الظهور', manageActivityControls: 'تخصيص معدلات الظهور',
      activityGroupPlay: 'القسم 1', activityGroupEffects: 'القسم 2', settingOn: 'تشغيل',
      ballAppearances: 'ظهور الكرات', foodAppearances: 'ظهور الطعام', spiderVisits: 'زيارات العناكب', portalVisits: 'زيارات البوابات', soapBubbles: 'فقاعات الصابون',
      frequencyOff: 'إيقاف', frequencyRare: 'نادر', frequencyBalanced: 'متوازن', frequencyOften: 'غالباً',
      disableSandboxMode: 'عطّل وضع Sandbox', reachLevelToUnlock: 'الوصول إلى المستوى {level}', reachLevelForMore: 'الوصول إلى المستوى {level}', notAvailableForPet: 'غير متاح لـ {pet}', someUnavailableForPet: 'بعض الخيارات غير متاحة لـ {pet}',
      infoBallFrequency: 'يتحكم في الكرات التلقائية دون تغيير الكرات اليدوية.', infoFishFrequency: 'يتحكم في ظهور طعام حيوانك تلقائياً.', infoSpiderFrequency: 'يتحكم في تحديات العناكب التلقائية.', infoPortalFrequency: 'يتحكم في البوابات التلقائية بعد فتحها.', infoSoapBubbleFrequency: 'يتحكم في مفاجآت فقاعات الصابون.',
      exportImport: 'تصدير / استيراد', exportSettings: 'تصدير الإعدادات', importSettings: 'استيراد الإعدادات',
      reportGitHub: 'وجدت مشكلة؟ أبلغ عنها على GitHub',
      goldRush: 'اندفاع الذهب', spiderHero: 'بطل العناكب', sushiMaster: 'سيد السوشي', consistent: 'منتظم', fishmonger: 'بائع السمك', nightCrawler: 'جالس الليل',
      hatsHint: 'القبعات تعمل حالياً مع الضفدع فقط',
      importTitle: 'استيراد نسخة احتياطية', importDesc: 'استعادة رفيقك والعملات وأغراض المتجر والمهام والإعدادات.', importSelect: 'اختر ملف النسخة الاحتياطية', importNoFile: 'لم يتم اختيار أي ملف', importBackup: 'استيراد النسخة الاحتياطية',
      petNamePlaceholder: 'مثال: لونا، ماكس، بيكسل…', onboardImportInstead: 'الاستيراد من نسخة احتياطية بدلاً من ذلك'
    }
  };

  Object.keys(I18N_EXTRA).forEach(lang => {
    TRANSLATIONS[lang] = Object.assign({}, TRANSLATIONS[lang] || {}, I18N_EXTRA[lang]);
  });

  let currentLanguage = 'en';

  function t(key, vars) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const fallback = TRANSLATIONS.en[key] || key;
    let text = dict[key] || fallback;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(vars[name]));
      });
    }
    return text;
  }

  function applyTranslations(lang) {
    currentLanguage = lang || 'en';
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) el.setAttribute('title', dict[key]);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });

    document.documentElement.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLanguage);
    document.body.classList.toggle('rtl-ui', currentLanguage === 'ar');
    updateMainToggleUI(toggle ? toggle.checked : false);
    refreshStaticI18nText();
    if (xpBarFill && xpValue && xpHint) applyXpUI(latestXP, false);
  }

  const SHOP_ITEMS = [

    { id: 'ball_baseball',  imgFile: 'baseball.png',  name: 'Baseball',    nameKey: 'ballBaseball',   price: 0,   type: 'ball', free: true },
    { id: 'ball_tennis',    imgFile: 'tennis.png',    name: 'Tennis Ball', nameKey: 'ballTennis',     price: 15,  type: 'ball' },
    { id: 'ball_golf',      imgFile: 'golf.png',      name: 'Golf Ball',   nameKey: 'ballGolf',       price: 15,  type: 'ball' },
    { id: 'ball_basketball',imgFile: 'basketball.png',name: 'Basketball',  nameKey: 'ballBasketball', price: 20,  type: 'ball' },
    { id: 'ball_football',  imgFile: 'football.png',  name: 'Football',    nameKey: 'ballFootball',   price: 20,  type: 'ball' },
    { id: 'ball_volleyball',imgFile: 'valleyball.png',name: 'Volleyball',  nameKey: 'ballVolleyball', price: 25,  type: 'ball' },
    { id: 'ball_bowling',   imgFile: 'bowling.png',   name: 'Bowling Ball',nameKey: 'ballBowling',    price: 30,  type: 'ball' },
    { id: 'ball_upcoming_1', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'ball', upcoming: true },
    { id: 'ball_upcoming_2', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'ball', upcoming: true },
    { id: 'ball_upcoming_3', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'ball', upcoming: true },
    { id: 'ball_upcoming_4', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'ball', upcoming: true },
    { id: 'ball_upcoming_5', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'ball', upcoming: true },

    { id: 'hat_none',         emoji: '🚫', name: 'No Hat',        nameKey: 'hatNone',        price: 0,   type: 'hat', free: true },
    { id: 'hat_clown',        hatClass: 'hat-clown', name: 'Clown Hat',      price: 15,  type: 'hat' },
    { id: 'hat_cowboy',       hatClass: 'hat-cowboy', name: 'Cowboy Hat',    price: 30,  type: 'hat' },
    { id: 'hat_pirate',       hatClass: 'hat-pirate', name: 'Pirate Hat',    price: 45,  type: 'hat' },
    { id: 'hat_tophat',       hatClass: 'hat-tophat', name: 'Top Hat',       price: 35,  type: 'hat' },
    { id: 'hat_viking',       hatClass: 'hat-viking', name: 'Viking Hat',    price: 40,  type: 'hat' },
    { id: 'hat_funnyglasses', hatClass: 'hat-funnyglasses', name: 'Funny Glasses', price: 25, type: 'hat' },
    { id: 'hat_upcoming_1', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'hat', upcoming: true },
    { id: 'hat_upcoming_2', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'hat', upcoming: true },
    { id: 'hat_upcoming_3', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'hat', upcoming: true },
    { id: 'hat_upcoming_4', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'hat', upcoming: true },
    { id: 'hat_upcoming_5', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'hat', upcoming: true },

    { id: 'pet_cat',       imgFile: 'cat_icon.gif',       name: 'Cat',       nameKey: 'petCat',      price: 0,  type: 'pet', subType: 'animal', free: true },
    { id: 'pet_fox',       imgFile: 'fox_icon.gif',       name: 'Fox',       nameKey: 'petFox',      price: 50, type: 'pet', subType: 'animal' },
    { id: 'pet_frog',      imgFile: 'frog_icon.gif',       name: 'Frog',      nameKey: 'petFrog',     price: 60, type: 'pet', subType: 'animal' },
    { id: 'pet_penguin',   imgFile: 'penguin_icon.gif',    name: 'Penguin',   nameKey: 'petPenguin',  price: 65, type: 'pet', subType: 'animal' },
    { id: 'pet_pigeon',    imgFile: 'pigeon_icon.gif',     name: 'Pigeon',    nameKey: 'petPigeon',   price: 70, type: 'pet', subType: 'animal' },
    { id: 'pet_hedgehog',  imgFile: 'hedgehog_icon.gif',  name: 'Hedgehog',  nameKey: 'petHedgehog', price: 75, type: 'pet', subType: 'animal' },
    { id: 'pet_snake',     imgFile: 'snake_icon.gif',     name: 'Snake',     nameKey: 'petSnake',    price: 80, type: 'pet', subType: 'animal' },
    { id: 'pet_red_panda', imgFile: 'red_panda_icon.gif',  name: 'Red Panda', nameKey: 'petRedPanda', price: 80, type: 'pet', subType: 'animal' },
    { id: 'pet_bat',       imgFile: 'bat_icon.gif',    name: 'Bat',      nameKey: 'petBat',      price: 90, type: 'pet', subType: 'animal' },
    { id: 'pet_upcoming_3', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'pet', subType: 'animal', upcoming: true },
    { id: 'pet_upcoming_4', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'pet', subType: 'animal', upcoming: true },
    { id: 'pet_upcoming_5', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'pet', subType: 'animal', upcoming: true },

    { id: 'pet_skeleton',  imgFile: 'skeleton_icon.gif', name: 'Skeleton',  nameKey: 'petSkeleton', price: 75, type: 'pet', subType: 'character' },
    { id: 'pet_fairy',     imgFile: 'fairy_icon.gif',    name: 'Fairy',     nameKey: 'petFairy',    price: 85, type: 'pet', subType: 'character' },
    { id: 'pet_hbaby',     imgFile: 'baby_icon.gif',     name: 'Baby',      nameKey: 'petHBaby',    price: 90, type: 'pet', subType: 'character' },
    { id: 'pet_zombie',    imgFile: 'zombie_icon.gif',   name: 'Zombie',    nameKey: 'petZombie',   price: 95, type: 'pet', subType: 'character' },
    { id: 'pet_clippy',    imgFile: 'clippy_icon.gif',   name: 'Clippy',    nameKey: 'petClippy',   price: 100, type: 'pet', subType: 'character' },
    { id: 'char_upcoming_3', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'pet', subType: 'character', upcoming: true },

    { id: 'toy_feather',  emoji: '✨', name: 'Feather Wand',  nameKey: 'boostFeather', desc: '+2 coins/pet',   price: 30,  type: 'boost', effect: 'petCoins' },
    { id: 'treat_gold',   emoji: '🍖', name: 'Golden Treat',  nameKey: 'boostTreat',   desc: '2x fish coins',  price: 50,  type: 'boost', effect: 'fishCoins' },
    { id: 'coin_magnet',  emoji: '🧲', name: 'Coin Magnet',   nameKey: 'boostMagnet',  desc: 'Attracts coins', price: 80,  type: 'boost', effect: 'coinMagnet' },
    { id: 'lucky_charm',  emoji: '🍀', name: 'Lucky Charm',   nameKey: 'boostLucky',   desc: 'More drops',     price: 100, type: 'boost', effect: 'luckyDrops' },
    { id: 'boost_upcoming_1', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'boost', upcoming: true },
    { id: 'boost_upcoming_2', emoji: '🔒', name: 'Upcoming', nameKey: 'upcoming', type: 'boost', upcoming: true },
  ];

  const LEVEL_XP_THRESHOLDS = Object.freeze([0, 10, 25, 45, 70, 100, 135, 175, 220, 270]);
  const MAX_LEVEL_XP = LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1];
  const MILESTONES = {
    speech:          { xp: 10,  level: 2,  label: 'Level 2'  },
    ball:            { xp: 10,  level: 2,  label: 'Level 2'  },
    spider:          { xp: 25,  level: 3,  label: 'Level 3'  },
    rainbowSkin:     { xp: 25,  level: 3,  label: 'Level 3'  },
    size:            { xp: 0,   level: 1,  label: 'Level 1'  },
    companion:       { xp: 70,  level: 5,  label: 'Level 5'  },
    uiMischief:      { xp: 100, level: 6,  label: 'Level 6'  },
    mischiefRate:    { xp: 100, level: 6,  label: 'Level 6'  },
    portal:          { xp: 135, level: 7,  label: 'Level 7'  },
    hyper:           { xp: 175, level: 8,  label: 'Level 8'  },
  };

  const toggle = document.getElementById('toggle');
  const statusText = document.getElementById('status-text');
  const dot = document.getElementById('dot');
  const loyalToggle = document.getElementById('loyalToggle');
  const companionToggle = document.getElementById('companionToggle');
  const companionPrevBtn = document.getElementById('companionPrevBtn');
  const companionNextBtn = document.getElementById('companionNextBtn');
  const companionPetLabel = document.getElementById('companionPetLabel');
  let currentCompanionPetVal = 'same';
  let lastValidCompanionPetVal = 'same';
  let lockedOthersTimeout = null;

  const COMPANION_PET_OPTIONS = [
    { value: 'same', label: 'Same as Main' },
    { value: 'pet_cat', label: 'Cat' },
    { value: 'pet_fox', label: 'Fox' },
    { value: 'pet_frog', label: 'Frog' },
    { value: 'pet_penguin', label: 'Penguin' },
    { value: 'pet_pigeon', label: 'Pigeon' },
    { value: 'pet_red_panda', label: 'Red Panda' },
    { value: 'pet_bat', label: 'Bat' },
    { value: 'pet_skeleton', label: 'Skeleton' },
    { value: 'pet_zombie', label: 'Zombie' },
    { value: 'pet_fairy', label: 'Fairy' },
    { value: 'pet_hbaby', label: 'Baby' },
    { value: 'pet_hedgehog', label: 'Hedgehog' },
    { value: 'pet_snake', label: 'Snake' }
  ];

  function normalizeCompanionPetValue(value, activePet) {
    const selected = value || 'same';
    if (selected === 'same' || selected === 'locked_others') return selected;
    return normalizePetId(selected) === normalizePetId(activePet) ? 'same' : selected;
  }

  function revertLockedOthersPreview() {
    if (lockedOthersTimeout) {
      clearTimeout(lockedOthersTimeout);
      lockedOthersTimeout = null;
    }
    if (currentCompanionPetVal === 'locked_others') {
      currentCompanionPetVal = normalizeCompanionPetValue(lastValidCompanionPetVal || 'same', latestActivePet);
      if (currentCompanionPetVal === 'locked_others') currentCompanionPetVal = 'same';
      lastValidCompanionPetVal = currentCompanionPetVal;
      const opt = COMPANION_PET_OPTIONS.find(o => o.value === currentCompanionPetVal) || COMPANION_PET_OPTIONS[0];
      if (companionPetLabel) {
        companionPetLabel.textContent = opt.label;
        companionPetLabel.style.color = '#f4f4f5';
        companionPetLabel.style.opacity = '1';
      }
      getLocal({ companionEnabled: false }).then((active) => {
        updateCompanionControlsState(active.companionEnabled, null, currentCompanionPetVal);
      }).catch(() => {});
    }
  }

  async function updateCompanionControlsState(enabled, options, currentVal) {
    const isEnabled = Boolean(enabled);
    if (companionPetLabel) {
      const box = companionPetLabel.parentElement;
      if (box) {
        box.style.opacity = isEnabled ? '1' : '0.4';
        box.style.pointerEvents = isEnabled ? 'auto' : 'none';
      }
    }

    if (!isEnabled) {
      if (companionPrevBtn) {
        companionPrevBtn.disabled = true;
        companionPrevBtn.style.opacity = '0.35';
        companionPrevBtn.style.pointerEvents = 'none';
        companionPrevBtn.style.cursor = 'not-allowed';
      }
      if (companionNextBtn) {
        companionNextBtn.disabled = true;
        companionNextBtn.style.opacity = '0.35';
        companionNextBtn.style.pointerEvents = 'none';
        companionNextBtn.style.cursor = 'not-allowed';
      }
      return;
    }

    const validOptions = options || (await getSortedCompanionOptions());
    const val = currentVal !== undefined ? currentVal : currentCompanionPetVal;
    let idx = validOptions.findIndex(o => o.value === val);
    if (idx < 0) {
      idx = validOptions.findIndex(o => o.value === lastValidCompanionPetVal);
      if (idx < 0) idx = 0;
    }

    const canPrev = idx > 0;
    const canNext = idx >= 0 && idx < validOptions.length - 1;

    if (companionPrevBtn) {
      companionPrevBtn.disabled = !canPrev;
      companionPrevBtn.style.opacity = canPrev ? '1' : '0.35';
      companionPrevBtn.style.pointerEvents = canPrev ? 'auto' : 'none';
      companionPrevBtn.style.cursor = canPrev ? 'pointer' : 'not-allowed';
    }
    if (companionNextBtn) {
      companionNextBtn.disabled = !canNext;
      companionNextBtn.style.opacity = canNext ? '1' : '0.35';
      companionNextBtn.style.pointerEvents = canNext ? 'auto' : 'none';
      companionNextBtn.style.cursor = canNext ? 'pointer' : 'not-allowed';
    }
  }

  async function updateCompanionUI(val) {
    if (lockedOthersTimeout) {
      clearTimeout(lockedOthersTimeout);
      lockedOthersTimeout = null;
    }
    currentCompanionPetVal = normalizeCompanionPetValue(val, latestActivePet);
    if (currentCompanionPetVal === 'locked_others') {
      currentCompanionPetVal = lastValidCompanionPetVal || 'same';
    }
    if (!companionPetLabel) return;

    const opt = COMPANION_PET_OPTIONS.find(o => o.value === currentCompanionPetVal) || COMPANION_PET_OPTIONS[0];
    const data = await getLocal({ freePlayMode: false, unlockAll: false, shopOwned: [], companionEnabled: false });
    const isFreePlay = Boolean(data.freePlayMode || data.unlockAll);
    const owned = Array.isArray(data.shopOwned) ? data.shopOwned : [];
    const isOwned = opt.value === 'same' || opt.value === 'pet_cat' || isFreePlay || owned.includes(opt.value);

    if (isOwned) {
      lastValidCompanionPetVal = opt.value;
      companionPetLabel.textContent = opt.label;
      companionPetLabel.style.color = '#f4f4f5';
      companionPetLabel.style.opacity = '1';
    } else {
      currentCompanionPetVal = 'same';
      lastValidCompanionPetVal = 'same';
      await setLocal({ companionPet: 'same' });
      await sendMessageToTabs({ action: 'updateSettings', settings: { companionPet: 'same' } });
      const sameOpt = COMPANION_PET_OPTIONS.find(o => o.value === 'same') || COMPANION_PET_OPTIONS[0];
      companionPetLabel.textContent = sameOpt.label;
      companionPetLabel.style.color = '#f4f4f5';
      companionPetLabel.style.opacity = '1';
    }
    await updateCompanionControlsState(data.companionEnabled, null, currentCompanionPetVal);
  }

  async function getSortedCompanionOptions() {
    const data = await getLocal({ freePlayMode: false, unlockAll: false, shopOwned: [] });
    const isFreePlay = Boolean(data.freePlayMode || data.unlockAll);
    const owned = Array.isArray(data.shopOwned) ? data.shopOwned : [];

    const isOwned = (val) => val === 'same' || val === 'pet_cat' || isFreePlay || owned.includes(val);
    const filtered = COMPANION_PET_OPTIONS.filter(o => o.value === 'same' || normalizePetId(o.value) !== normalizePetId(latestActivePet));

    const available = [];
    let hasLocked = false;
    for (const opt of filtered) {
      if (isOwned(opt.value)) {
        available.push(opt);
      } else {
        hasLocked = true;
      }
    }

    if (hasLocked) {
      available.push({ value: 'locked_others', label: '🔒 Others (Locked)', isLockedPlaceholder: true });
    }

    return available;
  }

  async function cycleCompanionPet(direction) {
    const active = await getLocal({ companionEnabled: false });
    if (!active.companionEnabled) return;
    const validOptions = await getSortedCompanionOptions();
    if (!validOptions.length) return;

    let idx = validOptions.findIndex(o => o.value === currentCompanionPetVal);
    if (idx < 0) {
      idx = validOptions.findIndex(o => o.value === lastValidCompanionPetVal);
      if (idx < 0) idx = 0;
    }

    if (direction === 'prev') {
      if (idx <= 0) {
        await updateCompanionControlsState(true, validOptions, currentCompanionPetVal);
        return;
      }
      idx = idx - 1;
    } else {
      if (idx >= validOptions.length - 1) {
        await updateCompanionControlsState(true, validOptions, currentCompanionPetVal);
        return;
      }
      idx = idx + 1;
    }

    if (lockedOthersTimeout) {
      clearTimeout(lockedOthersTimeout);
      lockedOthersTimeout = null;
    }

    const nextVal = validOptions[idx].value;

    if (nextVal === 'locked_others') {
      currentCompanionPetVal = 'locked_others';
      if (companionPetLabel) {
        companionPetLabel.textContent = '🔒 Others (Locked)';
        companionPetLabel.style.color = '#fbbf24';
        companionPetLabel.style.opacity = '0.95';
      }
      await updateCompanionControlsState(true, validOptions, 'locked_others');
      lockedOthersTimeout = setTimeout(() => {
        revertLockedOthersPreview();
      }, 1800);
      return;
    }

    currentCompanionPetVal = nextVal;
    lastValidCompanionPetVal = nextVal;
    await updateCompanionUI(nextVal);
    await setLocal({ companionPet: nextVal });
    const currentActive = await getLocal({ companionEnabled: false });
    if (currentActive.companionEnabled) {
      await sendMessageToTabs({ action: 'restartCompanion' });
    }
  }
  const aggroToggle = document.getElementById('aggroToggle');
  const wallClimbToggle = document.getElementById('wallClimbToggle');
  const aggroRow = aggroToggle ? aggroToggle.closest('.control-row') : null;
  const spiderSpawnBtn = document.getElementById('spiderSpawnBtn');
  const uiMischiefToggle = document.getElementById('uiMischiefToggle');
  const speechToggle = document.getElementById('speechToggle');
  const animatedFaviconSelect = document.getElementById('animatedFaviconSelect');
  const rareEventsToggle = document.getElementById('rareEventsToggle');
  const fishSpawnBtn = document.getElementById('fishSpawnBtn');
  const ballSpawnBtn = document.getElementById('ballSpawnBtn');
  const lowPowerToggle = document.getElementById('lowPowerToggle');
  const hideInFullscreenToggle = document.getElementById('hideInFullscreenToggle');
  const showOnAllTabsToggle = document.getElementById('showOnAllTabsToggle');
  const allowlistModeToggle = document.getElementById('allowlistModeToggle');

  const sizeMinus = document.getElementById('sizeMinus');
  const sizePlus = document.getElementById('sizePlus');
  const sizeVal = document.getElementById('sizeVal');
  const uiSizeMinus = document.getElementById('uiSizeMinus');
  const uiSizePlus = document.getElementById('uiSizePlus');
  const uiSizeVal = document.getElementById('uiSizeVal');
  const mischiefMinus = document.getElementById('mischiefMinus');
  const mischiefPlus = document.getElementById('mischiefPlus');
  const mischiefRateVal = document.getElementById('mischiefRateVal');
  const energyGroup = document.getElementById('energyGroup');
  const infoToggle = document.getElementById('infoToggle');
  let _cameFromInfo = false;
  let onboardingScreen = null;
  const tabButtons = document.querySelectorAll('.tab-button');
  const panels = document.querySelectorAll('.settings-panel');
  const subTabButtons = document.querySelectorAll('[data-subtab]');
  const settingsTabButtons = document.querySelectorAll('[data-settingstab]');
  const infoTabButtons = document.querySelectorAll('[data-infotab]');
  const dailyQuestsView = document.getElementById('dailyQuestsView');
  const achievementsView = document.getElementById('achievementsView');
  const settingsBasicView = document.getElementById('settingsBasicView');
  const settingsAdvancedView = document.getElementById('settingsAdvancedView');
  const settingsDangerView = document.getElementById('settingsDangerView');
  const aboutInfoView = document.getElementById('aboutInfoView');
  const statsInfoView = document.getElementById('statsInfoView');
  const questList = document.getElementById('questList');
  const questResetText = document.getElementById('questResetText');
  const questCompletedValue = document.getElementById('questCompletedValue');
  const questPerfectDaysValue = document.getElementById('questPerfectDaysValue');
  const xpBarFill = document.getElementById('xpBarFill');
  const xpValue = document.getElementById('xpValue');
  const levelValue = document.getElementById('levelValue');
  const xpHint = document.getElementById('xpHint');
  const coinCount = document.getElementById('coinCount');
  const statFish = document.getElementById('statFish');
  const statSpiders = document.getElementById('statSpiders');
  const statPets = document.getElementById('statPets');
  const statCoinsCollected = document.getElementById('statCoinsCollected');
  const statBalls = document.getElementById('statBalls');
  const statQuests = document.getElementById('statQuests');
  const statPerfectDays = document.getElementById('statPerfectDays');
  const statDailyStreak = document.getElementById('statDailyStreak');

  const companionLock = document.getElementById('companionLock');
  const dragHandToggle = document.getElementById('dragHandToggle');
  const companionSwitchWrap = document.getElementById('companionSwitchWrap');
  const companionRow = document.getElementById('companionRow');
  const skinSelect = document.getElementById('skinSelect');
  const skinRow = skinSelect ? skinSelect.closest('.control-row') : null;
  const speechLock = document.getElementById('speechLock');
  const speechSwitchWrap = document.getElementById('speechSwitchWrap');
  const speechRow = document.getElementById('speechRow');
  const sizeRow = document.getElementById('sizeRow');
  const mischiefLock = document.getElementById('mischiefLock');
  const mischiefSwitchWrap = document.getElementById('mischiefSwitchWrap');
  const mischiefRow = document.getElementById('mischiefRow');
  const mischiefRateRow = document.getElementById('mischiefRateRow');
  const mischiefRateLock = document.getElementById('mischiefRateLock');
  const hyperBtn = document.getElementById('hyperBtn');
  const hyperLock = document.getElementById('hyperLock');
  const ballLock = document.getElementById('ballLock');
  const spiderLock = document.getElementById('spiderLock');
  const portalSpawnBtn = document.getElementById('portalSpawnBtn');
  const portalLock = document.getElementById('portalLock');
  const languageSelect = document.getElementById('languageSelect');
  const freePlayToggle = document.getElementById('freePlayToggle');

  let prevXP = -1;
  let latestXP = 0;
  let latestFreePlayMode = false;
  let latestActivePet = defaultSettings.activePet;
  let latestDailyStreak = 0;
  let latestAchievementStats = {};

  const TOGGLE_INFO_ITEMS = [
    { toggleId: 'companionToggle', key: 'infoCompanion' },
    { toggleId: 'loyalToggle', key: 'infoLoyal' },
    { toggleId: 'aggroToggle', key: 'infoAggressive' },
    { toggleId: 'wallClimbToggle', key: 'infoWalkOnWalls' },
    { toggleId: 'speechToggle', key: 'infoSpeech' },
    { toggleId: 'hideInFullscreenToggle', key: 'infoFullscreen' },
    { toggleId: 'showOnAllTabsToggle', key: 'infoShowOnAllTabs' },
    { toggleId: 'lowPowerToggle', key: 'infoLowPower' },
    { toggleId: 'uiMischiefToggle', key: 'infoMischief' },
    { toggleId: 'rareEventsToggle', key: 'infoRareEvents' },
    { toggleId: 'freePlayToggle', key: 'infoFreePlay' },
    { toggleId: 'dragHandToggle', key: 'infoDragHand' },
    { toggleId: 'allowlistModeToggle', key: 'helpBlacklist' }
  ];

  const ECO_BLOCKED_TOGGLE_IDS = new Set([
    'companionToggle',
    'aggroToggle',
    'speechToggle',
    'uiMischiefToggle',
    'rareEventsToggle'
  ]);
  const ECO_BLOCKED_BUTTON_IDS = ['fishSpawnBtn', 'ballSpawnBtn', 'spiderSpawnBtn', 'portalSpawnBtn'];
  const ECO_BLOCKED_STEPPER_IDS = ['sizeMinus', 'sizePlus', 'mischiefMinus', 'mischiefPlus'];
  const ECO_FORCE_OFF_PATCH = {
    companionEnabled: false,
    aggressiveMode: false,
    uiMischiefEnabled: false,
    speechEnabled: false,
    rareEventsEnabled: false,
    autoFishSpawnEnabled: false,
    ballEnabled: false,
    spiderEnabled: false,
    portalEnabled: false
  };
  const ECO_RESTORE_KEY = 'ecoModePreviousState';
  const ECO_RESTORE_DEFAULTS = Object.freeze({
    [ECO_RESTORE_KEY]: null,
    companionEnabled: false,
    aggressiveMode: true,
    uiMischiefEnabled: false,
    speechEnabled: false,
    rareEventsEnabled: true,
    autoFishSpawnEnabled: false,
    ballEnabled: false,
    spiderEnabled: false,
    portalEnabled: false,
    catEnergyLevel: 'active',
    activePet: 'pet_cat',
    activeHat: 'hat_none',
    catXP: 0
  });
  let latestLowPowerMode = false;

  setupToggleInfoButtons();

  getLocal({ uiLanguage: 'en' }).then(result => {
    applyTranslations(result.uiLanguage || 'en');
    if (languageSelect) languageSelect.value = currentLanguage;
  });

  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      const lang = languageSelect.value;
      applyTranslations(lang);
      setLocal({ uiLanguage: lang });
      sendMessageToTabs({ action: 'updateSettings', settings: { uiLanguage: lang } });
      refreshQuests().catch(() => {});
      refreshShop().catch(() => {});
    });
  }

  if (dragHandToggle) {
    dragHandToggle.addEventListener('change', () => {
      const enabled = dragHandToggle.checked;
      setLocal({ dragHandEnabled: enabled });
      sendMessageToTabs({ action: 'updateSettings', settings: { dragHandEnabled: enabled } });
    });
  }

  const openDisabledSitesBtn = document.getElementById('openDisabledSitesBtn');
  const closeDisabledSitesBtn = document.getElementById('closeDisabledSitesBtn');
  const disabledSitesRow = document.getElementById('disabledSitesRow');
  const disabledSitesManagerContainer = document.getElementById('disabledSitesManagerContainer');
  const disabledSitesListContainer = document.getElementById('disabledSitesListContainer');
  const addDisabledSiteInput = document.getElementById('addDisabledSiteInput');
  const addDisabledSiteBtn = document.getElementById('addDisabledSiteBtn');
  const addCurrentSiteBtn = document.getElementById('addCurrentSiteBtn');
  const siteFilterModeHelpText = document.getElementById('siteFilterModeHelpText');
  const disabledSitesListCardTitle = document.getElementById('disabledSitesListCardTitle');

  const openActivityControlsBtn = document.getElementById('openActivityControlsBtn');
  const closeActivityControlsBtn = document.getElementById('closeActivityControlsBtn');
  const activityControlsContainer = document.getElementById('activityControlsContainer');
  const activityTabButtons = document.querySelectorAll('[data-activitytab]');
  const activityPlayView = document.getElementById('activityPlayView');
  const activityEffectsView = document.getElementById('activityEffectsView');
  const ballPropsActivitySelect = document.getElementById('ballPropsActivitySelect');
  const ACTIVITY_PET_RESTRICTIONS = Object.freeze({
    fairy: ['fish', 'ball', 'portal', 'spider'],
    bat: ['fish', 'ball', 'portal', 'spider'],
    pigeon: ['fish', 'ball', 'portal', 'spider'],
    frog: ['ball', 'spider'],
    clippy: ['fish', 'ball', 'portal', 'spider', 'bubble'],
    hbaby: ['fish', 'portal', 'spider'],
    skeleton: ['fish']
  });
  const activityFrequencyControls = [
    { select: document.getElementById('ballFrequencySelect'), frequencyKey: 'ballFrequency', enabledKey: 'ballEnabled', milestone: 'ball', kind: 'ball' },
    { select: document.getElementById('fishFrequencySelect'), frequencyKey: 'fishFrequency', enabledKey: 'autoFishSpawnEnabled', kind: 'fish' },
    { select: document.getElementById('spiderFrequencySelect'), frequencyKey: 'spiderFrequency', enabledKey: 'spiderEnabled', milestone: 'spider', kind: 'spider' },
    { select: document.getElementById('portalFrequencySelect'), frequencyKey: 'portalFrequency', enabledKey: 'portalEnabled', milestone: 'portal', kind: 'portal' },
    { select: document.getElementById('soapBubbleFrequencySelect'), frequencyKey: 'soapBubbleFrequency', enabledKey: 'rareEventsEnabled', kind: 'bubble' }
  ];
  const ACTIVITY_FREQUENCIES = new Set(['off', 'rare', 'normal', 'often']);

  let currentDisabledSitesList = [];

  function sanitizeDomainName(input) {
    if (!globalThis.PixelCatSiteRules) return '';
    return globalThis.PixelCatSiteRules.normalizeHostname(input);
  }

  async function renderDisabledSitesList() {
    if (!disabledSitesListContainer) return;
    disabledSitesListContainer.replaceChildren();

    const data = await getLocal({ disabledSitesList: [], disabledSites: 'none', siteFilterMode: 'blacklist' });
    let list = Array.isArray(data.disabledSitesList) ? data.disabledSitesList : [];
    const isAllowlist = data.siteFilterMode === 'allowlist';
    const mode = isAllowlist ? 'allowlist' : 'blacklist';

    if (allowlistModeToggle) allowlistModeToggle.checked = isAllowlist;

    if (siteFilterModeHelpText) {
      siteFilterModeHelpText.textContent = isAllowlist ? t('helpAllowlistOnly') : t('helpBlacklist');
    }
    refreshToggleInfoText();

    if (disabledSitesListCardTitle) {
      disabledSitesListCardTitle.textContent = isAllowlist ? t('allowlist') : t('blacklist');
    }

    if (list.length === 0 && data.disabledSites && data.disabledSites !== 'none') {
      if (data.disabledSites === 'youtube') list = ['youtube.com'];
      else if (data.disabledSites === 'google') list = ['google.com'];
      else if (data.disabledSites === 'reddit') list = ['reddit.com'];
      await setLocal({ disabledSitesList: list });
    }

    currentDisabledSitesList = list;

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'disabled-site-empty';
      empty.textContent = t('noSitesAdded');
      disabledSitesListContainer.appendChild(empty);
      return;
    }

    list.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'disabled-site-item';

      const name = document.createElement('span');
      name.className = 'disabled-site-domain';
      name.textContent = domain;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'disabled-site-delete-btn';
      delBtn.title = 'Remove ' + domain;
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';

      delBtn.addEventListener('click', async () => {
        const newList = currentDisabledSitesList.filter(d => d !== domain);
        await setLocal({ disabledSitesList: newList });
        sendMessageToTabs({ action: 'updateSettings', settings: { disabledSitesList: newList } });
        renderDisabledSitesList();
      });

      item.appendChild(name);
      item.appendChild(delBtn);
      disabledSitesListContainer.appendChild(item);
    });
  }

  function setDisabledSitesViewMode(showManager) {
    if (!settingsBasicView) return;
    const children = Array.from(settingsBasicView.children);
    children.forEach(child => {
      if (child === disabledSitesManagerContainer) {
        child.style.display = showManager ? 'flex' : 'none';
      } else if (child === activityControlsContainer) {
        child.style.display = 'none';
      } else {
        child.style.display = showManager ? 'none' : '';
      }
    });
    if (settingsAdvancedView) settingsAdvancedView.style.display = 'none';
    if (settingsDangerView) settingsDangerView.style.display = 'none';
    closeOtherToggleInfo(null, null);
  }

  function closeActivityInfoPanels() {
    document.querySelectorAll('.activity-info-panel').forEach(panel => { panel.hidden = true; });
    document.querySelectorAll('.activity-info-btn').forEach(button => {
      button.classList.remove('active');
      button.setAttribute('aria-expanded', 'false');
      const card = button.closest('.activity-setting-card');
      if (card) card.classList.remove('info-open');
    });
  }

  function setActiveActivityTab(activityTabName) {
    activityTabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.activitytab === activityTabName);
    });
    if (activityPlayView) activityPlayView.style.display = activityTabName === 'play' ? 'flex' : 'none';
    if (activityEffectsView) activityEffectsView.style.display = activityTabName === 'effects' ? 'flex' : 'none';
    closeActivityInfoPanels();
  }

  function setActivityControlsViewMode(showManager) {
    if (!settingsBasicView) return;
    const children = Array.from(settingsBasicView.children);
    children.forEach(child => {
      if (child === activityControlsContainer) {
        child.style.display = showManager ? 'flex' : 'none';
      } else if (child === disabledSitesManagerContainer) {
        child.style.display = 'none';
      } else {
        child.style.display = showManager ? 'none' : '';
      }
    });
    if (settingsAdvancedView) settingsAdvancedView.style.display = 'none';
    if (settingsDangerView) settingsDangerView.style.display = 'none';
    if (!showManager) closeActivityInfoPanels();
    else setActiveActivityTab('play');
  }

  if (openActivityControlsBtn) {
    openActivityControlsBtn.addEventListener('click', () => {
      setActivityControlsViewMode(true);
    });
  }

  if (closeActivityControlsBtn) {
    closeActivityControlsBtn.addEventListener('click', () => {
      setActivityControlsViewMode(false);
    });
  }

  document.querySelectorAll('.activity-info-btn').forEach(button => {
    button.title = t('showToggleInfo');
    button.setAttribute('aria-label', t('showToggleInfo'));
    button.addEventListener('click', () => {
      const panel = document.querySelector(`[data-activity-info-panel="${button.dataset.activityInfo}"]`);
      if (!panel) return;
      const shouldOpen = panel.hidden;
      closeActivityInfoPanels();
      panel.hidden = !shouldOpen;
      button.classList.toggle('active', shouldOpen);
      button.setAttribute('aria-expanded', String(shouldOpen));
      const card = button.closest('.activity-setting-card');
      if (card) card.classList.toggle('info-open', shouldOpen);
    });
  });

  if (openDisabledSitesBtn) {
    openDisabledSitesBtn.addEventListener('click', () => {
      setDisabledSitesViewMode(true);
      renderDisabledSitesList();
    });
  }

  if (closeDisabledSitesBtn) {
    closeDisabledSitesBtn.addEventListener('click', () => {
      setDisabledSitesViewMode(false);
    });
  }

  const closeDisabledSitesTopBtn = document.getElementById('closeDisabledSitesTopBtn');
  if (closeDisabledSitesTopBtn) {
    closeDisabledSitesTopBtn.addEventListener('click', () => {
      setDisabledSitesViewMode(false);
    });
  }

  if (allowlistModeToggle) {
    allowlistModeToggle.addEventListener('change', async (e) => {
      const newMode = e.target.checked ? 'allowlist' : 'blacklist';
      await setLocal({ siteFilterMode: newMode });
      sendMessageToTabs({ action: 'updateSettings', settings: { siteFilterMode: newMode } });
      renderDisabledSitesList();
    });
  }

  async function handleAddDisabledSite() {
    if (!addDisabledSiteInput) return;
    const domain = sanitizeDomainName(addDisabledSiteInput.value);
    if (!domain) return;

    if (!currentDisabledSitesList.includes(domain)) {
      const newList = [...currentDisabledSitesList, domain];
      await setLocal({ disabledSitesList: newList });
      sendMessageToTabs({ action: 'updateSettings', settings: { disabledSitesList: newList } });
      addDisabledSiteInput.value = '';
      renderDisabledSitesList();
    } else {
      addDisabledSiteInput.value = '';
    }
  }

  if (addDisabledSiteBtn) {
    addDisabledSiteBtn.addEventListener('click', handleAddDisabledSite);
  }

  if (addCurrentSiteBtn) {
    addCurrentSiteBtn.addEventListener('click', async () => {
      try {
        if (API.tabs && typeof API.tabs.query === 'function') {
          API.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
              const domain = sanitizeDomainName(tabs[0].url);
              if (domain && !currentDisabledSitesList.includes(domain)) {
                const newList = [...currentDisabledSitesList, domain];
                await setLocal({ disabledSitesList: newList });
                sendMessageToTabs({ action: 'updateSettings', settings: { disabledSitesList: newList } });
                renderDisabledSitesList();
              }
            }
          });
        }
      } catch (_) {}
    });
  }

  if (addDisabledSiteInput) {
    addDisabledSiteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddDisabledSite();
      }
    });
  }

  async function readPopupLocal(keys) {
    if (typeof API.storage.local.get === 'function' && API.storage.local.get.length <= 1) {
      return API.storage.local.get(keys);
    }
    return new Promise((resolve) => API.storage.local.get(keys, resolve));
  }

  async function getLocal(keys) {
    if (keys === null) {
      const raw = await readPopupLocal(null);
      if (FairPlay && typeof FairPlay.ensure === 'function') {
        try {
          const verified = await FairPlay.ensure(API.storage.local, null);
          Object.assign(raw, verified);
        } catch (_) {}
      }
      return raw;
    }

    if (FairPlay && typeof FairPlay.hasProtectedKey === 'function' && FairPlay.hasProtectedKey(keys)) {
      try {
        return await FairPlay.ensure(API.storage.local, keys);
      } catch (_) {
        return readPopupLocal(keys);
      }
    }
    return readPopupLocal(keys);
  }

  function setLocal(data) {
    if (FairPlay && typeof FairPlay.hasProtectedKey === 'function' && FairPlay.hasProtectedKey(data)) {
      return FairPlay.commit(API.storage.local, data);
    }
    if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1) {
      return API.storage.local.set(data);
    }
    return new Promise((resolve) => API.storage.local.set(data, resolve));
  }

  function getQuestStorageArea() {
    if (!FairPlay || typeof FairPlay.ensure !== 'function' || typeof FairPlay.commit !== 'function') {
      return API.storage.local;
    }
    return {
      get: (defaults) => FairPlay.ensure(API.storage.local, defaults),
      set: (values) => FairPlay.commit(API.storage.local, values)
    };
  }

  function removeLocal(keys) {
    if (typeof API.storage.local.remove === 'function' && API.storage.local.remove.length <= 1) {
      return API.storage.local.remove(keys);
    }
    return new Promise((resolve) => API.storage.local.remove(keys, resolve));
  }

  let storageWriteQueue = Promise.resolve();
  function updateLocal(defaults, updater) {
    storageWriteQueue = storageWriteQueue.catch(() => {}).then(async () => {
      let lastConflict = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const current = await getLocal(defaults);
        const next = updater(current);
        if (!next || !next.values) return next;

        const isProtectedUpdate = !!(
          FairPlay &&
          typeof FairPlay.hasProtectedKey === 'function' &&
          FairPlay.hasProtectedKey(next.values)
        );
        if (isProtectedUpdate && typeof FairPlay.commitIfRevision === 'function') {
          const revision = Math.max(0, Number(current.pcProgressBackup && current.pcProgressBackup.revision) || 0);
          try {
            await FairPlay.commitIfRevision(API.storage.local, next.values, revision);
            return next;
          } catch (error) {
            if (error && error.code === 'progress_conflict') {
              lastConflict = error;
              continue;
            }
            throw error;
          }
        }

        await setLocal(next.values);
        return next;
      }
      throw lastConflict || new Error('PixelCat progress changed too frequently; please retry');
    });
    return storageWriteQueue;
  }

  function sendRuntimeMessage(message) {
    try {
      const result = API.runtime.sendMessage(message);
      if (result && typeof result.then === 'function') {
        return result;
      }
    } catch (error) {
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      API.runtime.sendMessage(message, (response) => {
        if (API.runtime.lastError) {
          reject(new Error(API.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  function sendMessageToTabs(message) {
    return sendRuntimeMessage(message).catch(() => undefined);
  }

  function openImportPage() {
    const url = API.runtime.getURL('ui/import.html');
    if (API.tabs && typeof API.tabs.create === 'function') {
      try {
        const result = API.tabs.create({ url });
        if (result && typeof result.catch === 'function') {
          result.catch(() => window.open(url, '_blank'));
        }
        return;
      } catch (_) {}
    }
    window.open(url, '_blank');
  }

  function updateMainToggleUI(enabled) {
    toggle.checked = enabled;
    statusText.textContent = enabled ? t('active') : t('disabled');
    if (enabled) {
      dot.classList.add('active');
      document.body.classList.remove('pixelcat-disabled');
    } else {
      dot.classList.remove('active');
      document.body.classList.add('pixelcat-disabled');
    }
  }

  function setActiveSubTab(subTabName) {
    subTabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.subtab === subTabName);
    });
    if (dailyQuestsView) dailyQuestsView.style.display = subTabName === 'daily' ? 'flex' : 'none';
    if (achievementsView) achievementsView.style.display = subTabName === 'achievements' ? 'flex' : 'none';
  }

  function setActiveSettingsTab(settingsTabName) {
    settingsTabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.settingstab === settingsTabName);
    });
    if (settingsTabName === 'basic') {
      setActivityControlsViewMode(false);
      setDisabledSitesViewMode(false);
    }
    if (settingsBasicView) settingsBasicView.style.display = settingsTabName === 'basic' ? 'flex' : 'none';
    if (settingsAdvancedView) settingsAdvancedView.style.display = settingsTabName === 'advanced' ? 'flex' : 'none';
    if (settingsDangerView) settingsDangerView.style.display = settingsTabName === 'danger' ? 'flex' : 'none';
  }

  let activeItemSubTab = 'balls';
  let activePetSubTab = 'animals';

  function setActiveShopTab(shoptab) {
    document.querySelectorAll('[data-shoptab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shoptab === shoptab);
    });
    const itemsSubTabRow = document.getElementById('itemsSubTabRow');
    const petsSubTabRow = document.getElementById('petsSubTabRow');
    const shopBallsView = document.getElementById('shopBallsView');
    const shopHatsView = document.getElementById('shopHatsView');
    const shopAnimalsView = document.getElementById('shopAnimalsView');
    const shopCharactersView = document.getElementById('shopCharactersView');
    const shopBoostsView = document.getElementById('shopBoostsView');

    const isItemsTab = shoptab === 'balls' || shoptab === 'items';
    if (itemsSubTabRow) itemsSubTabRow.style.display = isItemsTab ? 'flex' : 'none';

    if (isItemsTab) {
      if (shopBallsView) shopBallsView.style.display = activeItemSubTab === 'balls' ? 'grid' : 'none';
      if (shopHatsView) shopHatsView.style.display = activeItemSubTab === 'hats' ? 'grid' : 'none';
    } else {
      if (shopBallsView) shopBallsView.style.display = 'none';
      if (shopHatsView) shopHatsView.style.display = 'none';
    }

    const isPetsTab = shoptab === 'pets';
    if (petsSubTabRow) petsSubTabRow.style.display = isPetsTab ? 'flex' : 'none';

    if (isPetsTab) {
      if (shopAnimalsView) shopAnimalsView.style.display = activePetSubTab === 'animals' ? 'grid' : 'none';
      if (shopCharactersView) shopCharactersView.style.display = activePetSubTab === 'characters' ? 'grid' : 'none';
    } else {
      if (shopAnimalsView) shopAnimalsView.style.display = 'none';
      if (shopCharactersView) shopCharactersView.style.display = 'none';
    }

    if (shopBoostsView) shopBoostsView.style.display = shoptab === 'boosts' ? 'grid' : 'none';
  }

  function setActiveItemSubTab(subtab) {
    activeItemSubTab = subtab;
    document.querySelectorAll('[data-itemtab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.itemtab === subtab);
    });
    const shopBallsView = document.getElementById('shopBallsView');
    const shopHatsView = document.getElementById('shopHatsView');
    if (shopBallsView) shopBallsView.style.display = subtab === 'balls' ? 'grid' : 'none';
    if (shopHatsView) shopHatsView.style.display = subtab === 'hats' ? 'grid' : 'none';
  }

  function setActivePetSubTab(subtab) {
    activePetSubTab = subtab;
    document.querySelectorAll('[data-pettab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pettab === subtab);
    });
    const shopAnimalsView = document.getElementById('shopAnimalsView');
    const shopCharactersView = document.getElementById('shopCharactersView');
    if (shopAnimalsView) shopAnimalsView.style.display = subtab === 'animals' ? 'grid' : 'none';
    if (shopCharactersView) shopCharactersView.style.display = subtab === 'characters' ? 'grid' : 'none';
  }

  function setActiveInfoTab(infotab) {
    infoTabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.infotab === infotab);
    });
    if (aboutInfoView) aboutInfoView.style.display = infotab === 'about' ? 'flex' : 'none';
    if (statsInfoView) statsInfoView.style.display = infotab === 'stats' ? 'grid' : 'none';
    if (infotab === 'stats') refreshStats().catch(() => {});
  }

  const toggleInfoAutoHideTimers = new Map();

  function syncToggleInfoState(button, panel, isOpen) {
    if (!button || !panel) return;
    panel.hidden = !isOpen;
    button.classList.toggle('active', isOpen);
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const titleKey = isOpen ? 'hideToggleInfo' : 'showToggleInfo';
    button.title = t(titleKey);
    button.setAttribute('aria-label', t(titleKey));
    const ownerRow = panel._ownerRow || null;
    if (ownerRow) ownerRow.classList.toggle('info-open', isOpen);
  }

  function clearToggleInfoTimer(button) {
    const existing = toggleInfoAutoHideTimers.get(button);
    if (existing) {
      clearTimeout(existing);
      toggleInfoAutoHideTimers.delete(button);
    }
  }

  function scheduleToggleInfoAutoHide(button, panel) {
    clearToggleInfoTimer(button);
    const timer = setTimeout(() => {
      syncToggleInfoState(button, panel, false);
      toggleInfoAutoHideTimers.delete(button);
    }, 3000);
    toggleInfoAutoHideTimers.set(button, timer);
  }

  function closeOtherToggleInfo(activeButton, activePanel) {
    document.querySelectorAll('.toggle-info-panel').forEach((panel) => {
      const button = document.querySelector(`.toggle-info-btn[data-info-for="${panel.dataset.infoPanelFor}"]`);
      if (panel !== activePanel) {
        if (button) clearToggleInfoTimer(button);
        syncToggleInfoState(button, panel, false);
      }
    });
    document.querySelectorAll('.toggle-info-btn').forEach((button) => {
      if (button !== activeButton && !toggleInfoAutoHideTimers.has(button)) {
        button.title = t('showToggleInfo');
        button.setAttribute('aria-label', t('showToggleInfo'));
      }
    });
  }

  function setupToggleInfoButtons() {
    TOGGLE_INFO_ITEMS.forEach(({ toggleId, key }) => {
      const input = document.getElementById(toggleId);
      const switchEl = input ? input.closest('.switch') : null;
      const row = input ? input.closest('.control-row') : null;
      const label = row ? row.querySelector('.control-label') : null;
      if (!input || !switchEl || !row || !label) return;
      if (label.querySelector('.control-desc:not(.toggle-info-line)')) return;
      if (document.querySelector(`[data-info-for="${toggleId}"]`)) return;

      const parentContainer = row.parentElement;
      const insideCard = !!(parentContainer && (parentContainer.classList.contains('locked-card') || parentContainer.classList.contains('warning-card')));
      let infoGroup = null;
      if (!insideCard) {
        infoGroup = row.closest('.toggle-info-group');
        if (!infoGroup) {
          infoGroup = document.createElement('div');
          infoGroup.className = 'toggle-info-group';
          parentContainer.insertBefore(infoGroup, row);
          infoGroup.appendChild(row);
        }
      }

      const infoPanel = document.createElement('div');
      infoPanel.className = 'toggle-info-panel';
      infoPanel.dataset.infoPanelFor = toggleId;
      infoPanel.hidden = true;
      infoPanel._ownerRow = row;

      const infoText = document.createElement('span');
      infoText.className = 'toggle-info-panel-text';
      infoText.dataset.i18n = key;
      infoText.textContent = t(key);
      infoPanel.appendChild(infoText);

      const infoButton = document.createElement('button');
      infoButton.type = 'button';
      infoButton.className = 'toggle-info-btn';
      infoButton.dataset.infoFor = toggleId;
      infoButton.dataset.infoKey = key;
      infoButton.textContent = '?';
      infoButton.title = t('showToggleInfo');
      infoButton.setAttribute('aria-label', t('showToggleInfo'));
      infoButton.setAttribute('aria-expanded', 'false');
      infoButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const shouldOpen = infoPanel.hidden;
        closeOtherToggleInfo(infoButton, infoPanel);
        syncToggleInfoState(infoButton, infoPanel, shouldOpen);
        if (shouldOpen) {
          scheduleToggleInfoAutoHide(infoButton, infoPanel);
        } else {
          clearToggleInfoTimer(infoButton);
        }
      });

      row.insertBefore(infoButton, switchEl);
      if (insideCard) {
        row.parentNode.insertBefore(infoPanel, row.nextSibling);
      } else if (infoGroup) {
        infoGroup.appendChild(infoPanel);
      }
    });

    refreshToggleInfoText();
  }

  function getToggleInfoText(line) {
    const key = line && line.dataset ? line.dataset.i18n : '';
    const panel = line ? line.closest('.toggle-info-panel') : null;
    const toggleId = panel ? panel.dataset.infoPanelFor : '';
    if (latestLowPowerMode && ECO_BLOCKED_TOGGLE_IDS.has(toggleId)) {
      return t('ecoBlockedInfo');
    }
    if (toggleId === 'allowlistModeToggle') {
      const toggleEl = (typeof allowlistModeToggle !== 'undefined' && allowlistModeToggle) || document.getElementById('allowlistModeToggle');
      const isAllowlist = toggleEl ? toggleEl.checked : false;
      if (line && line.dataset) line.dataset.i18n = isAllowlist ? 'helpAllowlistOnly' : 'helpBlacklist';
      return isAllowlist ? t('helpAllowlistOnly') : t('helpBlacklist');
    }
    return key ? t(key) : '';
  }

  function refreshToggleInfoText() {
    document.querySelectorAll('.toggle-info-panel-text').forEach((line) => {
      line.textContent = getToggleInfoText(line);
    });
    document.querySelectorAll('.toggle-info-btn').forEach((button) => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      const titleKey = isOpen ? 'hideToggleInfo' : 'showToggleInfo';
      button.title = t(titleKey);
      button.setAttribute('aria-label', t(titleKey));
    });
  }

  function getEcoPatch(data) {
    if (!data || !data.lowPowerMode) return {};
    const patch = {};
    Object.keys(ECO_FORCE_OFF_PATCH).forEach((key) => {
      if (data[key] !== ECO_FORCE_OFF_PATCH[key]) patch[key] = ECO_FORCE_OFF_PATCH[key];
    });
    return patch;
  }

  function setEcoDisabledState(el, blocked, label) {
    if (!el) return;
    if (blocked) {
      if (!el.dataset.ecoPreviousDisabled) {
        el.dataset.ecoPreviousDisabled = el.disabled ? '1' : '0';
      }
      el.disabled = true;
    } else if (el.dataset.ecoPreviousDisabled) {
      el.disabled = el.dataset.ecoPreviousDisabled === '1';
      delete el.dataset.ecoPreviousDisabled;
    }
    el.classList.toggle('eco-disabled', !!blocked);
    el.setAttribute('aria-disabled', blocked ? 'true' : 'false');
    if (blocked) el.title = label || t('ecoBlockedInfo');
    else if (el.title === t('ecoBlockedInfo')) el.removeAttribute('title');
  }

  function applyEcoModeUI(enabled) {
    latestLowPowerMode = !!enabled;
    document.body.classList.toggle('eco-mode-on', !!enabled);
    const ecoText = t('ecoBlockedInfo');

    ECO_BLOCKED_TOGGLE_IDS.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      const row = input.closest('.control-row') || input.closest('.locked-card');
      const switchEl = input.closest('.switch');
      if (enabled) input.checked = false;
      setEcoDisabledState(input, !!enabled, ecoText);
      if (switchEl) switchEl.classList.toggle('eco-disabled', !!enabled);
      if (row) {
        row.classList.toggle('eco-disabled', !!enabled);
        row.title = enabled ? ecoText : '';
      }
    });

    ECO_BLOCKED_BUTTON_IDS.forEach((id) => {
      const button = document.getElementById(id);
      if (!button) return;
      if (enabled) {
        button.classList.remove('active');
        setEcoDisabledState(button, true, ecoText);
      } else {
        setEcoDisabledState(button, false, ecoText);
      }
    });

    ECO_BLOCKED_STEPPER_IDS.forEach((id) => {
      const button = document.getElementById(id);
      if (!button) return;
      if (enabled) setEcoDisabledState(button, true, ecoText);
      else setEcoDisabledState(button, false, ecoText);
    });

    refreshToggleInfoText();
  }

  function sanitizeEcoRestoreSnapshot(snapshot, data) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
    const out = {};
    Object.keys(ECO_FORCE_OFF_PATCH).forEach((key) => {
      const fallback = (data && key in data) ? data[key] : defaultSettings[key];
      if (key === 'catEnergyLevel') {
        out[key] = ['sleepy', 'active', 'hyper'].includes(snapshot[key]) ? snapshot[key] : (fallback || 'active');
      } else {
        out[key] = typeof snapshot[key] === 'boolean' ? snapshot[key] : !!fallback;
      }
    });

    const xp = Math.min(270, Math.max(0, Number(data && data.catXP) || 0));
    const isFreePlay = Boolean(data && (data.freePlayMode || data.unlockAll));
    const activePet = (data && data.activePet) || 'pet_cat';
    if (!isFreePlay && xp < 10) {
      out.speechEnabled = false;
      out.ballEnabled = false;
    }
    if (!isFreePlay && xp < 25) out.spiderEnabled = false;
    if (!isFreePlay && xp < 70) out.companionEnabled = false;
    const foxLikePet = isNonCatPet(activePet);
    if (!isFreePlay && xp < 100 && !foxLikePet) out.uiMischiefEnabled = false;
    if (foxLikePet) out.uiMischiefEnabled = false;
    if (foxLikePet) out.aggressiveMode = false;
    if (!isFreePlay && xp < 135) out.portalEnabled = false;
    if (!isFreePlay && xp < 175 && out.catEnergyLevel === 'hyper') out.catEnergyLevel = 'active';
    return out;
  }

  function createEcoRestoreSnapshot(data) {
    const snapshot = {};
    Object.keys(ECO_FORCE_OFF_PATCH).forEach((key) => {
      snapshot[key] = (data && key in data) ? data[key] : defaultSettings[key];
    });
    return sanitizeEcoRestoreSnapshot(snapshot, data) || snapshot;
  }

  async function enableEcoMode(data) {
    const current = data || await getLocal(ECO_RESTORE_DEFAULTS);
    const existingSnapshot = current[ECO_RESTORE_KEY];
    const snapshot = existingSnapshot && typeof existingSnapshot === 'object'
      ? sanitizeEcoRestoreSnapshot(existingSnapshot, current)
      : createEcoRestoreSnapshot(current);
    const patch = Object.assign({ lowPowerMode: true, [ECO_RESTORE_KEY]: snapshot }, ECO_FORCE_OFF_PATCH);
    await setLocal(patch);
    await sendMessageToTabs({ action: 'stopCompanion' });
    await sendMessageToTabs({ action: 'updateSettings', settings: Object.assign({ lowPowerMode: true }, ECO_FORCE_OFF_PATCH) });
    return patch;
  }

  async function disableEcoMode(data) {
    const current = data || await getLocal(ECO_RESTORE_DEFAULTS);
    const restore = sanitizeEcoRestoreSnapshot(current[ECO_RESTORE_KEY], current) || {};
    const patch = Object.assign({ lowPowerMode: false }, restore);
    await setLocal(patch);
    await removeLocal(ECO_RESTORE_KEY);
    if (patch.companionEnabled) {
      await sendMessageToTabs({ action: 'startCompanion' });
    } else {
      await sendMessageToTabs({ action: 'stopCompanion' });
    }
    await sendMessageToTabs({ action: 'updateSettings', settings: patch });
    return patch;
  }

  async function enforceEcoModeIfNeeded(data) {
    if (!data || !data.lowPowerMode) return {};
    if (!data[ECO_RESTORE_KEY]) {
      data[ECO_RESTORE_KEY] = createEcoRestoreSnapshot(data);
    }
    const patch = getEcoPatch(data);
    if (!Object.keys(patch).length && data[ECO_RESTORE_KEY]) return {};
    Object.assign(data, patch);
    await setLocal(Object.assign({ [ECO_RESTORE_KEY]: data[ECO_RESTORE_KEY] }, patch));
    await sendMessageToTabs({ action: 'stopCompanion' });
    await sendMessageToTabs({ action: 'updateSettings', settings: Object.assign({ lowPowerMode: true }, patch) });
    return patch;
  }

  const STATIC_TEXT_TARGETS = [
    ['[data-infotab="about"]', 'about'],
    ['[data-infotab="stats"]', 'stats'],
    ['#homeBonusTitle', 'dailyBonusReady'],
    ['#toggleTreeBtn', 'showSkillsTree'],
    ['.coffee-title', 'supportPixelCat'],
    ['.coffee-desc', 'supportKoFi'],
    ['.tree-header > span:first-child', 'skillsTree'],
    ['.tree-header-sub', 'dragTree'],
    ['#treeNodeBase .tree-title', 'basicInstincts'],
    ['#treeNodeBase .tree-meta', 'core'],
    ['#treeNodeSpeech .tree-title', 'speechBubble'],
    ['#treeNodeFish .tree-title', 'fishHunt'],
    ['#treeNodeFish .tree-meta', 'core'],
    ['#treeNodeClimb .tree-title', 'wallNinja'],
    ['#treeNodeClimb .tree-meta', 'core'],
    ['#treeNodeSize .tree-title', 'sizeWeight'],
    ['#treeNodePetting .tree-title', 'petBond'],
    ['#treeNodePetting .tree-meta', 'core'],
    ['#treeNodeBall .tree-title', 'ballChaser'],
    ['#treeNodeSpider .tree-title', 'spiderHunter'],
    ['#treeNodeCompanion .tree-title', 'companionMode'],
    ['#treeNodeMischief .tree-title', 'pageMischief'],
    ['#treeNodePortal .tree-title', 'portalTraveler'],
    ['#treeNodeHyper .tree-title', 'hyperEnergy'],
    ['.popup-footer', 'madeBy']
  ];

  const ABOUT_CARD_KEYS = [
    ['aboutPixelCatTitle', 'aboutPixelCatBody'],
    ['aboutLevelsTitle', 'aboutLevelsBody'],
    ['aboutCoinsTitle', 'aboutCoinsBody'],
    ['aboutQuestsTitle', 'aboutQuestsBody'],
    ['aboutAchievementsTitle', 'aboutAchievementsBody'],
    ['aboutBugsTitle', 'aboutBugsBody'],
    ['aboutSpawningTitle', 'aboutSpawningBody'],
    ['aboutShopTitle', 'aboutShopBody'],
    ['aboutTipsTitle', 'aboutTipsBody']
  ];

  const STAT_LABEL_KEYS = [
    ['statFish', 'statFishEaten', '🐟'],
    ['statSpiders', 'statSpidersCaught', '🕷️'],
    ['statPets', 'statPetSessions', '✨'],
    ['statCoinsCollected', 'statCoinsCollected', ''],
    ['statBalls', 'statBallCatches', '🎾'],
    ['statQuests', 'statQuestsDone', '📜'],
    ['statPerfectDays', 'statPerfectDays', '🏆'],
    ['statDailyStreak', 'statDailyStreak', '🔥']
  ];

  function refreshStaticI18nText() {
    STATIC_TEXT_TARGETS.forEach(([selector, key]) => {
      const el = document.querySelector(selector);
      if (!el) return;
      if (selector === '.popup-footer') {
        el.textContent = t(key) + ' ';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = 'IMAD';
        el.appendChild(nameSpan);
      } else {
        el.textContent = t(key);
      }
    });

    document.querySelectorAll('.about-card').forEach((card, index) => {
      const keys = ABOUT_CARD_KEYS[index];
      if (!keys) return;
      const title = card.querySelector('.about-card-title');
      const body = card.querySelector('.about-card-body');
      if (title) title.textContent = t(keys[0]);
      if (body) body.textContent = t(keys[1]);
    });

    STAT_LABEL_KEYS.forEach(([valueId, key, icon]) => {
      const valueEl = document.getElementById(valueId);
      const card = valueEl ? valueEl.closest('.stat-card') : null;
      const label = card ? card.querySelector('.stat-label') : null;
      if (!label) return;
      if (valueId === 'statCoinsCollected') {
        const svg = label.querySelector('svg');
        label.textContent = '';
        if (svg) label.appendChild(svg);
        label.append(` ${t(key)}`);
      } else {
        label.textContent = `${icon} ${t(key)}`;
      }
    });

    document.querySelectorAll('.achievement-item').forEach((item) => {
      const name = item.querySelector('.achievement-name');
      if (!name) return;
      const id = item.id;
      if (id === 'achievementFirstFriend') name.textContent = t('firstFriend');
      if (id === 'achievementSpiderHunter') name.textContent = t('spiderHunter');
      if (id === 'achievement100Pets') name.textContent = t('hundredPets');
      if (id === 'achievement7DayStreak') name.textContent = t('sevenDayStreak');
      if (id === 'achievementMasterMischief') name.textContent = t('masterMischief');
      if (id === 'achievementGoldRush') name.textContent = t('goldRush');
      if (id === 'achievementSpiderHero') name.textContent = t('spiderHero');
      if (id === 'achievementSushiMaster') name.textContent = t('sushiMaster');
      if (id === 'achievementConsistent') name.textContent = t('consistent');
      if (id === 'achievementFishmonger') name.textContent = t('fishmonger');
      if (id === 'achievementNightCrawler') name.textContent = t('nightCrawler');
    });

    [
      ['#treeNodeSpeech .tree-meta', 2], ['#treeNodeSize .tree-meta', 4],
      ['#treeNodeBall .tree-meta', 2], ['#treeNodeSpider .tree-meta', 3],
      ['#treeNodeCompanion .tree-meta', 5], ['#treeNodeMischief .tree-meta', 6],
      ['#treeNodePortal .tree-meta', 7], ['#treeNodeHyper .tree-meta', 8]
    ].forEach(([selector, level]) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = t('level', { level });
    });

    if (toggleTreeBtn && treatsTreeContainer) {
      const isTreeVisible = treatsTreeContainer.style.display !== 'none';
      toggleTreeBtn.textContent = isTreeVisible ? t('hideSkillsTree') : t('showSkillsTree');
    }

    [
      [fishSpawnBtn, 'food', null],
      [ballSpawnBtn, 'ball', ballLock],
      [spiderSpawnBtn, 'spider', spiderLock],
      [portalSpawnBtn, 'portal', portalLock],
      [hyperBtn, 'hyper', hyperLock]
    ].forEach(([button, key, lockEl]) => {
      if (!button) return;
      Array.from(button.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .forEach((node) => node.remove());
      button.insertBefore(document.createTextNode(t(key) + (lockEl ? ' ' : '')), lockEl || button.firstChild);
    });

    [
      [infoToggle, 'openInfo'],
      [document.getElementById('confirmReset'), 'confirm'],
      [document.getElementById('cancelReset'), 'cancel']
    ].forEach(([el, key]) => {
      if (!el) return;
      el.title = t(key);
      el.setAttribute('aria-label', t(key));
    });

    refreshToggleInfoText();
  }

  function setActiveTab(tabName) {
    revertLockedOthersPreview();
    tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    if (infoToggle) infoToggle.classList.toggle('active', tabName === 'info');
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.panel === tabName);
    });

    const isHome = (tabName === 'essential');
    const homeBonusBanner = document.getElementById('homeBonusBanner');
    const reviewBanner = document.getElementById('reviewBanner');
    if (!isHome) {
      if (homeBonusBanner) homeBonusBanner.style.display = 'none';
      if (reviewBanner) reviewBanner.style.display = 'none';
    } else {
      refreshShop().catch(() => {});
    }

    if (tabName === 'quests') {
      setActiveSubTab('daily');
      refreshQuests().catch(() => renderQuestPanel(null));
    } else if (tabName === 'shop') {
      setActiveShopTab('balls');
    } else if (tabName === 'advanced') {
      setActiveSettingsTab('basic');
    } else if (tabName === 'info') {
      setActiveInfoTab('about');
    }
  }

  function updateAchievements(stats) {
    latestAchievementStats = stats || latestAchievementStats || {};
    const achievementStats = latestAchievementStats;
    const achievements = [

      { id: 'achievementFirstFriend',   unlocked: (achievementStats.lifetimePets || 0) >= 1 || (achievementStats.lifetimeFish || 0) >= 1 },
      { id: 'achievementSpiderHunter',  unlocked: (achievementStats.lifetimeSpidersCaught || 0) >= 10 },
      { id: 'achievement100Pets',       unlocked: (achievementStats.lifetimePets || 0) >= 100 },
      { id: 'achievement7DayStreak',    unlocked: latestDailyStreak >= 7 },
      { id: 'achievementMasterMischief',unlocked: latestXP >= MILESTONES.uiMischief.xp },
      { id: 'achievementGoldRush',      unlocked: (achievementStats.lifetimeCoins || 0) >= 1000 },

      { id: 'achievementSpiderHero',    unlocked: (achievementStats.lifetimeSpidersCaught || 0) >= 50 },
      { id: 'achievementSushiMaster',   unlocked: (achievementStats.lifetimeFish || 0) >= 500 },
      { id: 'achievementConsistent',    unlocked: latestDailyStreak >= 14 },
      { id: 'achievementFishmonger',    unlocked: (achievementStats.lifetimeFish || 0) >= 50 },
      { id: 'achievementNightCrawler',  unlocked: (achievementStats.lifetimeGoogleSeconds || 0) >= 3600 }
    ];

    if (latestFreePlayMode) {
      achievements.forEach(a => a.unlocked = true);
    }

    achievements.forEach(ach => {
      const el = document.getElementById(ach.id);
      if (el) {
        el.classList.toggle('locked', !ach.unlocked);
        el.classList.toggle('unlocked', ach.unlocked);
      }
    });
  }

  (function initAchPagination() {
    const pages = Array.from(document.querySelectorAll('.achievement-page'));
    const label = document.getElementById('achPageLabel');
    const prev  = document.getElementById('achPrev');
    const next  = document.getElementById('achNext');
    if (!pages.length || !prev || !next) return;

    let current = 0;
    const total = pages.length;

    function goTo(index) {
      current = Math.max(0, Math.min(total - 1, index));
      pages.forEach((p, i) => { p.style.display = i === current ? '' : 'none'; });
      if (label) label.textContent = (current + 1) + ' / ' + total;
      prev.disabled = current === 0;
      next.disabled = current === total - 1;
    }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    goTo(0);
  })();

    const PET_SKIN_OPTIONS = {
    pet_cat: [
      { id: 'white', title: 'White' },
      { id: 'orange', title: 'Orange' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    cat: [
      { id: 'white', title: 'White' },
      { id: 'orange', title: 'Orange' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    pet_fox: [
      { id: 'orange', title: 'Orange' },
      { id: 'white', title: 'White' },
      { id: 'blue', title: 'Nightly Blue' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    fox: [
      { id: 'orange', title: 'Orange' },
      { id: 'white', title: 'White' },
      { id: 'blue', title: 'Nightly Blue' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    pet_red_panda: [
      { id: 'orange', title: 'Orange' },
      { id: 'white', title: 'White' },
      { id: 'blue', title: 'Nightly Blue' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    red_panda: [
      { id: 'orange', title: 'Orange' },
      { id: 'white', title: 'White' },
      { id: 'blue', title: 'Nightly Blue' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    pet_pigeon: [
      { id: 'black', title: 'Black' },
      { id: 'white', title: 'White' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    pigeon: [
      { id: 'black', title: 'Black' },
      { id: 'white', title: 'White' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    pet_skeleton: [
      { id: 'purple', title: 'Purple' },
      { id: 'red', title: 'Red' },
      { id: 'grey', title: 'Grey' }
    ],
    skeleton: [
      { id: 'purple', title: 'Purple' },
      { id: 'red', title: 'Red' },
      { id: 'grey', title: 'Grey' }
    ],
    pet_bat: [
      { id: 'white', title: 'White' },
      { id: 'orange', title: 'Orange' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    bat: [
      { id: 'white', title: 'White' },
      { id: 'orange', title: 'Orange' },
      { id: 'rainbow', title: 'Rainbow' }
    ],
    pet_hbaby: [
      { id: 'white', title: 'White' },
      { id: 'dark', title: 'Dark' }
    ],
    hbaby: [
      { id: 'white', title: 'White' },
      { id: 'dark', title: 'Dark' }
    ],
    pet_snake: [
      { id: 'purple', title: 'Purple' },
      { id: 'green', title: 'Green' },
      { id: 'brown', title: 'Sandy Brown' }
    ],
    snake: [
      { id: 'purple', title: 'Purple' },
      { id: 'green', title: 'Green' },
      { id: 'brown', title: 'Sandy Brown' }
    ]
  };

  const LockSystem = {
    getContext(overrides = {}) {
      const activePet = overrides.activePet || latestActivePet || 'pet_cat';
      const xp = overrides.xp !== undefined ? Number(overrides.xp) : (overrides.catXP !== undefined ? Number(overrides.catXP) : Number(latestXP || 0));
      const sandbox = overrides.sandbox !== undefined ? Boolean(overrides.sandbox) : (overrides.freePlayMode !== undefined || overrides.unlockAll !== undefined ? Boolean(overrides.freePlayMode || overrides.unlockAll) : Boolean(latestFreePlayMode));
      const eco = overrides.eco !== undefined ? Boolean(overrides.eco) : (overrides.lowPowerMode !== undefined ? Boolean(overrides.lowPowerMode) : Boolean(latestLowPowerMode));
      return { activePet, xp, sandbox, eco, ...overrides };
    },

    getLockStatus(featureKey, context) {
      const ctx = this.getContext(context);
      const { activePet, xp, sandbox, eco } = ctx;
      const petLabel = getActivityPetLabel(activePet);
      const petReason = t('notAvailableForPet', { pet: petLabel });
      const ecoReason = t('ecoBlockedInfo');
      const levelReason = (milestone) => t('reachLevelToUnlock', { level: milestone.level });

      switch (featureKey) {
        case 'petSkin': {
          if (isSkinLockedPet(activePet)) {
            return { locked: true, reason: petReason, lockType: 'pet' };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'companion': {
          const noCompanion = hasNoCompanionSupport(activePet) || isFlyingPet(activePet);
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (noCompanion) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.companion.xp) {
            return { locked: true, reason: levelReason(MILESTONES.companion), lockType: 'level', level: MILESTONES.companion.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'speech': {
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (!isClippyPet(activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.speech.xp) {
            return { locked: true, reason: levelReason(MILESTONES.speech), lockType: 'level', level: MILESTONES.speech.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'uiMischief': {
          if (sandbox) return { locked: true, reason: t('disableSandboxMode'), lockType: 'sandbox' };
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isNonCatPet(activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.uiMischief.xp) {
            return { locked: true, reason: levelReason(MILESTONES.uiMischief), lockType: 'level', level: MILESTONES.uiMischief.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'mischiefRate': {
          if (sandbox) return { locked: true, reason: t('disableSandboxMode'), lockType: 'sandbox' };
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isNonCatPet(activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.mischiefRate.xp) {
            return { locked: true, reason: levelReason(MILESTONES.mischiefRate), lockType: 'level', level: MILESTONES.mischiefRate.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'ball': {
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isActivityUnavailableForPet({ kind: 'ball' }, activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.ball.xp) {
            return { locked: true, reason: levelReason(MILESTONES.ball), lockType: 'level', level: MILESTONES.ball.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'spider': {
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isActivityUnavailableForPet({ kind: 'spider' }, activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.spider.xp) {
            return { locked: true, reason: levelReason(MILESTONES.spider), lockType: 'level', level: MILESTONES.spider.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'portal': {
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isActivityUnavailableForPet({ kind: 'portal' }, activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.portal.xp) {
            return { locked: true, reason: levelReason(MILESTONES.portal), lockType: 'level', level: MILESTONES.portal.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'fish': {
          if (sandbox) return { locked: true, reason: t('disableSandboxMode'), lockType: 'sandbox' };
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isActivityUnavailableForPet({ kind: 'fish' }, activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          return { locked: false, reason: '', lockType: null };
        }

        case 'hyper': {
          if (!sandbox && xp < MILESTONES.hyper.xp) {
            return { locked: true, reason: t('reachLevelForMore', { level: MILESTONES.hyper.level }), lockType: 'level', level: MILESTONES.hyper.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'loyalMode': {
          if (isClippyPet(activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          return { locked: false, reason: '', lockType: null };
        }

        case 'aggressiveMode': {
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isNonCatPet(activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          return { locked: false, reason: '', lockType: null };
        }

        case 'rareEvents': {
          if (sandbox) return { locked: true, reason: t('disableSandboxMode'), lockType: 'sandbox' };
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          return { locked: false, reason: '', lockType: null };
        }

        case 'size': {
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          return { locked: false, reason: '', lockType: null };
        }

        case 'ballProps': {
          if (eco) return { locked: true, reason: ecoReason, lockType: 'eco' };
          if (isActivityUnavailableForPet({ kind: 'ball' }, activePet)) return { locked: true, reason: petReason, lockType: 'pet' };
          if (!sandbox && xp < MILESTONES.ball.xp) {
            return { locked: true, reason: levelReason(MILESTONES.ball), lockType: 'level', level: MILESTONES.ball.level };
          }
          return { locked: false, reason: '', lockType: null };
        }

        case 'autoSpawnGroup': {
          let autoReason = '';
          if (sandbox) autoReason = t('disableSandboxMode');
          else if (eco) autoReason = ecoReason;
          return { locked: Boolean(autoReason), reason: autoReason, lockType: autoReason ? (sandbox ? 'sandbox' : 'eco') : null };
        }

        default:
          return { locked: false, reason: '', lockType: null };
      }
    },

    getSkinLockStatus(skinId, activePet, context) {
      const ctx = this.getContext({ activePet, ...context });
      if (isSkinLockedPet(ctx.activePet)) {
        return {
          locked: true,
          reason: t('notAvailableForPet', { pet: getActivityPetLabel(ctx.activePet) }),
          lockType: 'pet'
        };
      }
      if (skinId === 'rainbow') {
        if (!ctx.sandbox && ctx.xp < MILESTONES.rainbowSkin.xp) {
          return {
            locked: true,
            reason: t('reachLevelToUnlock', { level: MILESTONES.rainbowSkin.level }),
            lockType: 'level',
            level: MILESTONES.rainbowSkin.level
          };
        }
      }
      return { locked: false, reason: '', lockType: null };
    },

    canUse(featureKey, context) {
      if (featureKey === 'skin') {
        const ctx = this.getContext(context);
        return !this.getSkinLockStatus(ctx.skinId, ctx.activePet, ctx).locked;
      }
      const ctx = this.getContext(context);
      return !this.getLockStatus(featureKey, ctx).locked;
    },

    getSettingsPatch(data) {
      const patch = {};
      const activePet = data?.activePet || 'pet_cat';
      const sandbox = Boolean(data?.freePlayMode || data?.unlockAll);
      const owned = Array.isArray(data?.shopOwned) ? data.shopOwned : [];
      const currentCompanion = data?.companionPet || 'same';

      if (normalizeCompanionPetValue(currentCompanion, activePet) === 'same' && currentCompanion !== 'same') {
        patch.companionPet = 'same';
      } else if (!sandbox && currentCompanion !== 'same' && currentCompanion !== 'pet_cat' && !owned.includes(currentCompanion)) {
        patch.companionPet = 'same';
      }
      const xp = Math.min(MAX_LEVEL_XP, Math.max(0, Number(data?.catXP) || 0));
      const eco = Boolean(data?.lowPowerMode);
      const ctx = { activePet, xp, sandbox, eco, data };

      if (this.getLockStatus('companion', ctx).locked && data.companionEnabled) {
        patch.companionEnabled = false;
      }
      if (this.getLockStatus('speech', ctx).locked && data.speechEnabled) {
        patch.speechEnabled = false;
      }
      if (this.getLockStatus('loyalMode', ctx).locked && data.loyalMode) {
        patch.loyalMode = false;
      }
      if (this.getLockStatus('aggressiveMode', ctx).locked && data.aggressiveMode) {
        patch.aggressiveMode = false;
      }
      if (this.getLockStatus('uiMischief', ctx).locked && data.uiMischiefEnabled) {
        patch.uiMischiefEnabled = false;
      }
      if (this.getLockStatus('ball', ctx).locked && data.ballEnabled) {
        patch.ballEnabled = false;
      }
      if (this.getLockStatus('spider', ctx).locked && data.spiderEnabled) {
        patch.spiderEnabled = false;
      }
      if (this.getLockStatus('portal', ctx).locked && data.portalEnabled) {
        patch.portalEnabled = false;
      }
      if (this.getLockStatus('hyper', ctx).locked && data.catEnergyLevel === 'hyper') {
        patch.catEnergyLevel = 'active';
      }
      if (this.getSkinLockStatus('rainbow', activePet, ctx).locked) {
        if (data.catSkin === 'rainbow') patch.catSkin = 'white';
        if (data.foxSkin === 'rainbow') patch.foxSkin = 'orange';
        if (data.pigeonSkin === 'rainbow') patch.pigeonSkin = 'black';
        if (data.batSkin === 'rainbow') patch.batSkin = 'white';
      }
      return patch;
    }
  };

  function updateSkinSwatches(activeSkin, activePet) {
    const skinSelect = document.getElementById('skinSelect');
    if (!skinSelect) return;
    skinSelect.innerHTML = '';
    const options = PET_SKIN_OPTIONS[activePet] || PET_SKIN_OPTIONS['pet_cat'];
    const ctx = LockSystem.getContext({ activePet });

    options.forEach(opt => {
      const box = document.createElement('div');
      box.className = `color-box val-${opt.id}`;
      box.dataset.skin = opt.id;
      box.title = opt.title;

      const isBat = isPet(activePet, 'bat');
      const isSnake = isPet(activePet, 'snake');
      const lockStatus = LockSystem.getSkinLockStatus(opt.id, activePet, ctx);
      const locked = lockStatus.locked;

      if (locked) {
        box.classList.add('skin-locked');
        if (lockStatus.level) {
          box.dataset.level = String(lockStatus.level);
        }
      }
      if (opt.id === activeSkin && !locked) box.classList.add('active');
      box.setAttribute('aria-disabled', String(locked));

      if (isBat) {
        if (opt.id === 'white' || opt.id === 'blue') box.style.background = 'linear-gradient(135deg, #3f3f46 0%, #18181b 100%)';
        else if (opt.id === 'orange') box.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f97316 45%, #dc2626 100%)';
        else if (opt.id === 'rainbow') box.style.background = 'linear-gradient(135deg, #86efac 0%, #22c55e 45%, #14532d 100%)';
      }
      if (isSnake) {
        if (opt.id === 'purple') box.style.background = 'linear-gradient(135deg, #d8b4fe 0%, #a855f7 55%, #6b21a8 100%)';
        else if (opt.id === 'green') box.style.background = 'linear-gradient(135deg, #86a84b 0%, #3f682f 55%, #1f3d22 100%)';
        else if (opt.id === 'brown') box.style.background = 'linear-gradient(135deg, #d6ad60 0%, #9a6335 55%, #55321f 100%)';
      }

      skinSelect.appendChild(box);
    });
  }

  function applyPetSpecificLocks(activePet) {
    const ctx = LockSystem.getContext({ activePet });
    const companionStatus = LockSystem.getLockStatus('companion', ctx);
    const speechStatus = LockSystem.getLockStatus('speech', ctx);
    const loyalStatus = LockSystem.getLockStatus('loyalMode', ctx);
    const aggroStatus = LockSystem.getLockStatus('aggressiveMode', ctx);
    const mischiefStatus = LockSystem.getLockStatus('uiMischief', ctx);
    const mischiefRateStatus = LockSystem.getLockStatus('mischiefRate', ctx);
    const skinStatus = LockSystem.getLockStatus('petSkin', ctx);

    if (companionToggle) {
      companionToggle.disabled = companionStatus.locked;
      if (companionStatus.locked) companionToggle.checked = false;
    }
    if (companionSwitchWrap) companionSwitchWrap.classList.toggle('control-locked', companionStatus.locked);
    if (companionRow) companionRow.classList.toggle('control-locked', companionStatus.locked);

    if (loyalToggle) {
      loyalToggle.disabled = loyalStatus.locked;
      if (loyalStatus.locked) loyalToggle.checked = false;
    }

    if (speechToggle) {
      speechToggle.disabled = speechStatus.locked;
      if (speechStatus.locked) speechToggle.checked = false;
    }
    if (speechSwitchWrap) speechSwitchWrap.classList.toggle('control-locked', speechStatus.locked);
    if (speechRow) speechRow.classList.toggle('control-locked', speechStatus.locked);

    if (skinSelect) {
      skinSelect.classList.toggle('control-locked', skinStatus.locked);
      skinSelect.disabled = skinStatus.locked;
    }
    if (skinRow) {
      skinRow.classList.toggle('control-locked', skinStatus.locked);
      skinRow.style.display = '';
    }

    if (aggroToggle) {
      aggroToggle.disabled = aggroStatus.locked;
      if (aggroStatus.locked) aggroToggle.checked = false;
    }
    if (aggroRow) aggroRow.classList.toggle('control-locked', aggroStatus.locked);

    if (uiMischiefToggle) {
      uiMischiefToggle.disabled = mischiefStatus.locked;
      if (mischiefStatus.locked) uiMischiefToggle.checked = false;
    }
    if (mischiefSwitchWrap) mischiefSwitchWrap.classList.toggle('control-locked', mischiefStatus.locked);
    if (mischiefRow) mischiefRow.classList.toggle('control-locked', mischiefStatus.locked);
    if (mischiefMinus) mischiefMinus.disabled = mischiefRateStatus.locked;
    if (mischiefPlus) mischiefPlus.disabled = mischiefRateStatus.locked;
    if (mischiefRateRow) mischiefRateRow.classList.toggle('control-locked', mischiefRateStatus.locked);

    [fishSpawnBtn, ballSpawnBtn, portalSpawnBtn].forEach((button) => {
      if (!button) return;
      button.style.opacity = '';
      button.style.pointerEvents = '';
    });
  }

  function formatResetCountdown(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }
    return `${minutes}m`;
  }

  function formatDurationI18n(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const minLabel = currentLanguage === 'ar' ? 'د' : 'min';
    const secLabel = currentLanguage === 'ar' ? 'ث' : (currentLanguage === 'fr' ? 's' : 'sec');
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      return remainder === 0
        ? `${minutes} ${minLabel}`
        : `${minutes} ${minLabel} ${String(remainder).padStart(2, '0')} ${secLabel}`;
    }
    return `${seconds} ${secLabel}`;
  }

  function getLevelFromXP(value) {
    const xp = Math.min(MAX_LEVEL_XP, Math.max(0, Number(value) || 0));
    for (let index = LEVEL_XP_THRESHOLDS.length - 1; index > 0; index -= 1) {
      if (xp >= LEVEL_XP_THRESHOLDS[index]) return index + 1;
    }
    return 1;
  }

  function getLevelProgress(value) {
    const totalXP = Math.min(MAX_LEVEL_XP, Math.max(0, Number(value) || 0));
    const level = getLevelFromXP(totalXP);
    const start = LEVEL_XP_THRESHOLDS[level - 1] || 0;
    const end = LEVEL_XP_THRESHOLDS[level] || MAX_LEVEL_XP;
    const needed = Math.max(1, end - start);
    const current = Math.min(needed, Math.max(0, totalXP - start));
    const percent = level >= 10 && totalXP >= MAX_LEVEL_XP ? 100 : Math.min(100, (current / needed) * 100);
    return { level, current, needed, percent, totalXP };
  }

  function isMilestoneUnlocked(key) {
    if (latestFreePlayMode) return true;
    const milestone = MILESTONES[key];
    return !milestone || latestXP >= milestone.xp;
  }

  function formatLevelRequirement(milestone) {
    return t('level', { level: milestone.level });
  }

  function getSkinStorageKey(activePet) {
    const config = PET_SKIN_CONFIG[normalizePetId(activePet)] || DEFAULT_SKIN_CONFIG;
    return config.key;
  }

  function getDefaultSkinForPet(activePet) {
    const config = PET_SKIN_CONFIG[normalizePetId(activePet)] || DEFAULT_SKIN_CONFIG;
    return config.fallback;
  }

  function getActiveSkinFromData(data, activePet) {
    const key = getSkinStorageKey(activePet);
    const fallback = getDefaultSkinForPet(activePet);
    const value = data && data[key];
    const options = PET_SKIN_OPTIONS[activePet] || PET_SKIN_OPTIONS[normalizePetId(activePet)] || [];
    return options.some((option) => option.id === value) ? value : fallback;
  }

  function getLockedSettingsPatch(data) {
    return LockSystem.getSettingsPatch(data);
  }

  async function forceCatOnlySettingsOffForFox(activePet) {
    if (activePet !== 'pet_fox' && activePet !== 'pet_red_panda' && activePet !== 'pet_skeleton' && activePet !== 'pet_penguin' && activePet !== 'pet_fairy' && activePet !== 'pet_pigeon' && activePet !== 'pet_hedgehog' && activePet !== 'pet_snake') return;
    const patch = { aggressiveMode: false, uiMischiefEnabled: false };
    await setLocal(patch);
    await sendMessageToTabs({ action: 'updateSettings', settings: patch });
  }

  const QUEST_TITLE_KEYS = {
    pet_sessions: 'questPet',
    fish_served: 'questFish',
    watch_seconds: 'questWatch',
    coins_collected: 'questCoins',
    ball_catches: 'questFetch',
    spiders_caught: 'questSpiders',
    google_visits: 'questGoogleVisit',
    google_searches: 'questGoogleSearch',
    google_active_seconds: 'questGooglePatrol'
  };

  function getQuestTitle(quest) {
    if (!quest) return '';
    if (quest.title === 'Double Affection') return t('questDoubleAffection');
    if (quest.title === 'Fish Feast') return t('questFishFeast');
    if (quest.title === 'Long Session') return t('questLongSession');
    return t(QUEST_TITLE_KEYS[quest.type] || '', {}) || quest.title;
  }

  function renderQuestPanel(snapshot) {
    if (dailyQuestsView && !dailyQuestsView.style.display) {
      dailyQuestsView.style.display = 'flex';
    }

    if (!questList) return;

    if (!snapshot) {
      if (questResetText) questResetText.textContent = t('unavailable');
      if (questCompletedValue) questCompletedValue.textContent = '--';
      if (questPerfectDaysValue) questPerfectDaysValue.textContent = '--';
      const empty = document.createElement('div');
      empty.className = 'quest-empty-card';
      empty.textContent = t('objectivesUnavailable') || 'Quests are not available right now. Reopen the popup to refresh.';
      questList.replaceChildren(empty);
      return;
    }

    updateAchievements(snapshot.stats);

    const displayTotalCount = snapshot.totalCount;
    const displayCompletedCount = latestFreePlayMode ? snapshot.totalCount : snapshot.completedCount;
    const displayPerfectDays = latestFreePlayMode ? '∞' : snapshot.stats.perfectDays;

    if (questResetText) questResetText.textContent = t('remaining', { time: formatResetCountdown(snapshot.secondsUntilReset) });
    if (questCompletedValue) questCompletedValue.textContent = `${displayCompletedCount} / ${displayTotalCount}`;
    if (questPerfectDaysValue) questPerfectDaysValue.textContent = t('streak', { count: displayPerfectDays });

    if (!Array.isArray(snapshot.quests) || snapshot.quests.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'quest-empty-card';
      empty.textContent = t('objectivesUnavailable') || 'No quests available right now. Reopen the popup to refresh.';
      questList.replaceChildren(empty);
      return;
    }

    const questCards = snapshot.quests.map((quest) => {
      const isCompleted = latestFreePlayMode ? true : quest.completed;
      const progress = latestFreePlayMode ? quest.target : quest.progress;
      const progressPct = quest.target > 0 ? Math.round((progress / quest.target) * 100) : 0;
      const card = document.createElement('article');
      card.className = `quest-card${isCompleted ? ' quest-complete' : ''}`;
      const body = document.createElement('div');
      body.className = 'quest-card-body';
      const top = document.createElement('div');
      top.className = 'quest-card-top';
      const title = document.createElement('div');
      title.className = 'quest-card-title';
      title.textContent = getQuestTitle(quest);

      let displayLabel = quest.progressLabel;
      if (latestFreePlayMode) {
        displayLabel = (quest.type === 'watch_seconds' || quest.type === 'google_active_seconds') ? '' : `${quest.target} / ${quest.target}`;
      }

      if (quest.type === 'watch_seconds' || quest.type === 'google_active_seconds') {
        const duration = document.createElement('span');
        duration.className = 'quest-title-meta';
        duration.textContent = ` (${formatDurationI18n(quest.target)})`;
        title.appendChild(duration);
        const progMins = Math.floor(progress / 60);
        const targMins = Math.floor(quest.target / 60);
        displayLabel = quest.target >= 60
          ? `${progMins} / ${targMins}`
          : `${progress} / ${quest.target}`;
      }

      const status = document.createElement('div');
      status.className = 'quest-card-status';
      status.textContent = isCompleted ? t('complete') : t('active');
      top.append(title, status);

      const row = document.createElement('div');
      row.className = 'quest-progress-row';
      const track = document.createElement('div');
      track.className = 'quest-progress-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('div');
      fill.className = 'quest-progress-fill';
      fill.style.width = `${progressPct}%`;
      track.appendChild(fill);
      const label = document.createElement('span');
      label.className = 'quest-progress-label';
      label.textContent = displayLabel;
      row.append(track, label);

      body.append(top, row);
      card.appendChild(body);
      return card;
    });
    questList.replaceChildren(...questCards);
  }

  async function refreshQuests() {
    if (!QuestEngine) {
      renderQuestPanel(null);
      return;
    }

    try {
      const snapshot = FairPlay && typeof FairPlay.getQuestSnapshot === 'function'
        ? await FairPlay.getQuestSnapshot(API.storage.local)
        : await QuestEngine.getSnapshot(getQuestStorageArea());
      renderQuestPanel(snapshot);
    } catch (error) {
      renderQuestPanel(null);
    }
  }

  function setStat(el, value) {
    if (!el) return;
    if (value === '∞') {
      el.textContent = '∞';
      return;
    }
    el.textContent = Math.max(0, Number(value) || 0).toLocaleString();
  }

  async function refreshStats() {
    const defaults = { dailyStreak: 0 };
    if (QuestEngine) {
      defaults[QuestEngine.STATS_KEY] = null;
    }

    const data = await getLocal(defaults);
    const stats = QuestEngine && data[QuestEngine.STATS_KEY] ? data[QuestEngine.STATS_KEY] : {};

    setStat(statFish, latestFreePlayMode ? '∞' : stats.lifetimeFish);
    setStat(statSpiders, latestFreePlayMode ? '∞' : stats.lifetimeSpidersCaught);
    setStat(statPets, latestFreePlayMode ? '∞' : stats.lifetimePets);
    setStat(statCoinsCollected, latestFreePlayMode ? '∞' : stats.lifetimeCoins);
    setStat(statBalls, latestFreePlayMode ? '∞' : stats.lifetimeBallCatches);
    setStat(statQuests, latestFreePlayMode ? '∞' : stats.lifetimeCompleted);
    setStat(statPerfectDays, latestFreePlayMode ? '∞' : stats.perfectDays);
    setStat(statDailyStreak, latestFreePlayMode ? '∞' : data.dailyStreak);

    latestDailyStreak = Math.max(0, Number(data.dailyStreak) || 0);
    updateAchievements(stats);
  }

  function isLevelLockReason(reason, lockType) {
    if (lockType === 'level') return true;
    if (lockType && lockType !== 'level') return false;
    if (!reason) return false;
    return /\b(level|niveau|livello|уровн)/i.test(reason) || (typeof reason === 'string' && reason.includes('المستوى'));
  }

  function updateBannerIcon(iconSvg, isLevel) {
    if (!iconSvg) return;
    iconSvg.replaceChildren();
    if (isLevel) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '3');
      rect.setAttribute('y', '11');
      rect.setAttribute('width', '18');
      rect.setAttribute('height', '11');
      rect.setAttribute('rx', '2');
      rect.setAttribute('ry', '2');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M7 11V7a5 5 0 0 1 10 0v4');
      iconSvg.append(rect, path);
    } else {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '4.93');
      line.setAttribute('y1', '4.93');
      line.setAttribute('x2', '19.07');
      line.setAttribute('y2', '19.07');
      iconSvg.append(circle, line);
    }
  }

  function applyXpUI(xp, flash) {
    const pct = Math.min(MAX_LEVEL_XP, Math.max(0, xp));
    const levelProgress = getLevelProgress(pct);
    const level = levelProgress.level;
    latestXP = pct;
    updateAchievements(latestAchievementStats);
    const currentLevelXP = Math.floor(levelProgress.current);
    const neededLevelXP = Math.floor(levelProgress.needed);
    if (latestFreePlayMode) {
      if (levelValue) levelValue.textContent = t('level', { level: '∞' });
      xpValue.textContent = '∞ / ∞ XP';
      xpBarFill.style.width = '100%';
      xpHint.textContent = t('sandboxUnlockedHint');
    } else {
      xpBarFill.style.width = levelProgress.percent + '%';
      if (levelValue) levelValue.textContent = t('level', { level });
      xpValue.textContent = t('xpProgress', { current: currentLevelXP, needed: neededLevelXP });

      if (pct < 10) {
        xpHint.textContent = t('unlockSpeechBall');
      } else if (pct < 25) {
        xpHint.textContent = t('unlockSpiders');
      } else if (pct < 45) {
        xpHint.textContent = t('unlockSize');
      } else if (pct < 70) {
        xpHint.textContent = t('unlockCompanion');
      } else if (pct < 100) {
        xpHint.textContent = t('unlockMischief');
      } else if (pct < 135) {
        xpHint.textContent = t('unlockPortals');
      } else if (pct < 175) {
        xpHint.textContent = t('unlockHyper');
      } else if (pct < 220) {
        xpHint.textContent = t('level9Hint');
      } else if (pct < 270) {
        xpHint.textContent = t('level10Hint');
      } else {
        xpHint.textContent = t('maxLevel');
      }
    }

    function updateLockBanner(bannerEl, unlocked, milestone) {
      if (!bannerEl) return;
      const textSpan = bannerEl.querySelector('.lock-text');
      const iconSvg = bannerEl.querySelector('.lock-icon');
      if (!textSpan || !iconSvg) return;

      if (unlocked) {
        bannerEl.classList.add('unlocked');
        bannerEl.classList.remove('banner-disabled');
      } else {
        textSpan.textContent = t('reachLevelToUnlock', { level: milestone.level });
        bannerEl.classList.remove('unlocked');
        bannerEl.classList.remove('banner-disabled');
        updateBannerIcon(iconSvg, true);
      }
    }

    function updateLockedButton(button, lockEl, unlocked) {
      if (!button) return;
      button.disabled = !unlocked;
      button.classList.toggle('control-locked', !unlocked);
      button.setAttribute('aria-disabled', String(!unlocked));
      if (lockEl) lockEl.style.display = unlocked ? 'none' : '';
      if (unlocked) {
        button.style.opacity = '';
        button.style.pointerEvents = '';
      } else {
        button.classList.remove('active');
        button.style.opacity = '0.45';
        button.style.pointerEvents = 'none';
      }
    }

    const speechUnlocked = isMilestoneUnlocked('speech');
    updateLockBanner(speechLock, speechUnlocked, MILESTONES.speech);
    if (speechUnlocked) {
      speechSwitchWrap.classList.remove('control-locked');
      speechToggle.disabled = false;
    } else {
      speechSwitchWrap.classList.add('control-locked');
      speechToggle.checked = false;
      speechToggle.disabled = true;
    }

    const ballUnlocked = isMilestoneUnlocked('ball');
    if (ballUnlocked) {
      updateLockedButton(ballSpawnBtn, ballLock, true);
    } else {
      updateLockedButton(ballSpawnBtn, ballLock, false);
    }

    const spiderUnlocked = isMilestoneUnlocked('spider');
    if (spiderUnlocked) {
      updateLockedButton(spiderSpawnBtn, spiderLock, true);
    } else {
      updateLockedButton(spiderSpawnBtn, spiderLock, false);
    }

    if (sizeRow) sizeRow.classList.remove('control-locked');
    if (sizeMinus) sizeMinus.disabled = false;
    if (sizePlus) sizePlus.disabled = false;

    const isMainFlyingPet = isFlyingPet(latestActivePet);
    const isMainClippy = isClippyPet(latestActivePet);
    const companionBlockedForMain = isMainFlyingPet || isMainClippy;
    const companionUnlocked = isMilestoneUnlocked('companion') && !companionBlockedForMain;

    updateLockBanner(companionLock, companionUnlocked, MILESTONES.companion);
    if (companionUnlocked) {
      companionSwitchWrap.classList.remove('control-locked');
      companionToggle.disabled = false;
    } else {
      companionSwitchWrap.classList.add('control-locked');
      companionToggle.checked = false;
      companionToggle.disabled = true;
      updateCompanionControlsState(false);
    }

    const mischiefBlocked = latestFreePlayMode || isNonCatPet(latestActivePet);
    const mischiefUnlocked = !mischiefBlocked && isMilestoneUnlocked('uiMischief');
    if (!mischiefBlocked) {
      updateLockBanner(mischiefLock, mischiefUnlocked, MILESTONES.uiMischief);
    }
    if (mischiefUnlocked) {
      mischiefSwitchWrap.classList.remove('control-locked');
      uiMischiefToggle.disabled = false;
    } else {
      mischiefSwitchWrap.classList.add('control-locked');
      uiMischiefToggle.checked = false;
      uiMischiefToggle.disabled = true;
    }

    const mischiefRateBlocked = latestFreePlayMode || isNonCatPet(latestActivePet);
    const mischiefRateUnlocked = !mischiefRateBlocked && isMilestoneUnlocked('mischiefRate');
    if (!mischiefRateBlocked) {
      updateLockBanner(mischiefRateLock, mischiefRateUnlocked, MILESTONES.mischiefRate);
    }
    if (mischiefRateUnlocked) {
      mischiefMinus.disabled = false;
      mischiefPlus.disabled = false;
    } else {
      mischiefMinus.disabled = true;
      mischiefPlus.disabled = true;
    }

    const portalUnlocked = isMilestoneUnlocked('portal');
    if (portalSpawnBtn) {
      if (portalUnlocked) {
        updateLockedButton(portalSpawnBtn, portalLock, true);
      } else {
        updateLockedButton(portalSpawnBtn, portalLock, false);
      }
    }

    const hyperUnlocked = isMilestoneUnlocked('hyper');
    if (hyperUnlocked) {
      updateLockedButton(hyperBtn, hyperLock, true);
    } else {
      updateLockedButton(hyperBtn, hyperLock, false);
    }

    if (flash && prevXP >= 0) {
      const milestones = [
        { threshold: MILESTONES.speech.xp,          el: speechRow },
        { threshold: MILESTONES.ball.xp,            el: ballSpawnBtn.closest('.control-row') },
        { threshold: MILESTONES.spider.xp,          el: spiderSpawnBtn.closest('.control-row') },
        { threshold: MILESTONES.size.xp,            el: sizeRow },
        { threshold: MILESTONES.companion.xp,       el: companionRow },
        { threshold: MILESTONES.uiMischief.xp,      el: mischiefRow },
        { threshold: MILESTONES.mischiefRate.xp,    el: mischiefRateRow },
        { threshold: MILESTONES.hyper.xp,           el: hyperBtn.closest('.control-row') || hyperBtn.parentElement },
        { threshold: MILESTONES.portal.xp,          el: portalSpawnBtn ? portalSpawnBtn.closest('.control-row') : null },
      ];
      milestones.forEach(m => {
        if (prevXP < m.threshold && pct >= m.threshold && m.el) {
          m.el.classList.remove('unlock-flash');
          void m.el.offsetWidth;
          m.el.classList.add('unlock-flash');
          setTimeout(() => m.el.classList.remove('unlock-flash'), 900);
        }
      });
    }

    document.querySelectorAll('.tree-item[data-xp]').forEach((node) => {
      const requiredXP = Number(node.dataset.xp) || 0;
      const unlocked = latestFreePlayMode || pct >= requiredXP;
      node.classList.toggle('unlocked', unlocked);
    });

    const currentSkinBox = document.querySelector('.color-box.active');
    const currentSkin = currentSkinBox ? currentSkinBox.dataset.skin : 'white';
    updateSkinSwatches(currentSkin, latestActivePet);

    prevXP = pct;
  }

  function normalizeActivityFrequency(value) {
    return ACTIVITY_FREQUENCIES.has(value) ? value : 'normal';
  }

  function isActivityUnavailableForPet(control, activePet) {
    if (!control || !control.kind) return false;
    const restrictions = ACTIVITY_PET_RESTRICTIONS[normalizePetId(activePet)] || [];
    return restrictions.includes(control.kind);
  }

  function getActivityPetLabel(activePet) {
    const normalized = normalizePetId(activePet);
    const item = SHOP_ITEMS.find((entry) => entry.type === 'pet' && normalizePetId(entry.id) === normalized);
    return item ? t(item.nameKey || '') || item.name : normalized;
  }

  function getActivityLockReason(control, data, unlocked) {
    if (latestFreePlayMode || data.freePlayMode || data.unlockAll) return t('disableSandboxMode');
    if (data.lowPowerMode) return t('ecoBlockedInfo');
    if (isActivityUnavailableForPet(control, data.activePet)) {
      return t('notAvailableForPet', { pet: getActivityPetLabel(data.activePet) });
    }
    if (!unlocked && control.milestone) {
      return t('reachLevelToUnlock', { level: MILESTONES[control.milestone].level });
    }
    return '';
  }

  function renderActivityLockBanner(card, reason, lockType) {
    if (!card) return;
    let banner = card.querySelector('.activity-lock-banner');
    if (!reason) {
      if (banner) banner.remove();
      card.classList.remove('control-locked');
      return;
    }
    const isLevel = isLevelLockReason(reason, lockType);
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'locked-card-banner activity-lock-banner';
      const text = document.createElement('span');
      text.className = 'lock-text';
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('class', 'lock-icon');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '2');
      icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round');
      icon.setAttribute('aria-hidden', 'true');
      banner.append(icon, text);
      card.insertBefore(banner, card.firstChild);
    }
    card.classList.add('control-locked');
    banner.classList.toggle('banner-disabled', !isLevel);
    const icon = banner.querySelector('.lock-icon');
    if (icon) updateBannerIcon(icon, isLevel);
    banner.querySelector('.lock-text').textContent = reason;
    banner.title = reason;
  }

  function setExistingLockBannerReason(banner, reason, lockType) {
    if (!banner) return;
    const card = banner.closest('.locked-card');
    const text = banner.querySelector('.lock-text');
    const icon = banner.querySelector('.lock-icon');
    if (!reason) {
      banner.classList.add('unlocked');
      banner.classList.remove('banner-disabled');
      banner.removeAttribute('title');
      if (card) card.classList.remove('control-locked');
      return;
    }
    if (text) text.textContent = reason;
    banner.classList.remove('unlocked');
    banner.title = reason;
    const isLevel = isLevelLockReason(reason, lockType);
    banner.classList.toggle('banner-disabled', !isLevel);
    if (icon) updateBannerIcon(icon, isLevel);
    if (card) card.classList.add('control-locked');
  }

  function renderSettingRowLockBanner(row, key, reason, lockType) {
    if (!row) return;
    let card = row.closest(`[data-setting-lock-card="${key}"]`);
    if (!card && !reason) return;
    if (!reason && card && card.classList.contains('dynamic-setting-lock-card')) {
      const banner = card.querySelector('.activity-lock-banner');
      if (banner) banner.remove();
      card.parentNode.insertBefore(row, card);
      card.remove();
      row.classList.remove('control-locked');
      return;
    }
    if (!card) {
      const infoGroup = row.closest('.toggle-info-group');
      if (infoGroup) {
        card = infoGroup;
        card.classList.add('locked-card');
      } else {
        card = document.createElement('div');
        card.className = 'locked-card dynamic-setting-lock-card';
        row.parentNode.insertBefore(card, row);
        card.appendChild(row);
      }
      card.dataset.settingLockCard = key;
    }
    card.classList.toggle('control-locked', Boolean(reason));
    renderActivityLockBanner(card, reason, lockType);
  }

  function applyAutoSpawnAvailability(data) {
    const ctx = LockSystem.getContext(data);
    const buttonByKind = { fish: fishSpawnBtn, ball: ballSpawnBtn, spider: spiderSpawnBtn, portal: portalSpawnBtn };
    const lockByKind = { ball: ballLock, spider: spiderLock, portal: portalLock };
    activityFrequencyControls.filter((control) => buttonByKind[control.kind]).forEach((control) => {
      const button = buttonByKind[control.kind];
      const lock = lockByKind[control.kind];
      const status = LockSystem.getLockStatus(control.kind, ctx);
      const locked = status.locked;
      button.disabled = locked;
      button.classList.toggle('control-locked', locked);
      button.setAttribute('aria-disabled', String(locked));
      if (lock) {
        lock.style.display = locked ? '' : 'none';
        const inlineSvg = lock.querySelector('.lock-icon');
        if (inlineSvg && locked) {
          updateBannerIcon(inlineSvg, status.lockType === 'level');
        }
      }
      if (locked) {
        button.classList.remove('active');
        button.style.opacity = '0.45';
        button.style.pointerEvents = 'none';
        button.title = status.reason;
        button.dataset.activityAvailabilityTitle = '1';
      } else {
        button.style.opacity = '';
        button.style.pointerEvents = '';
        if (button.dataset.activityAvailabilityTitle) {
          button.removeAttribute('title');
          delete button.dataset.activityAvailabilityTitle;
        }
      }
    });
  }

  function renderOtherSettingsLockReasons(data) {
    const ctx = LockSystem.getContext(data);

    const autoStatus = LockSystem.getLockStatus('autoSpawnGroup', ctx);
    renderSettingRowLockBanner(fishSpawnBtn?.closest('.control-row'), 'auto-spawn', autoStatus.reason, autoStatus.lockType);

    renderSettingRowLockBanner(energyGroup?.closest('.control-row'), 'energy', '');

    const skinStatus = LockSystem.getLockStatus('petSkin', ctx);
    renderSettingRowLockBanner(skinRow, 'pet-skin', skinStatus.reason, skinStatus.lockType);

    const loyalStatus = LockSystem.getLockStatus('loyalMode', ctx);
    renderSettingRowLockBanner(loyalToggle?.closest('.control-row'), 'loyal', loyalStatus.reason, loyalStatus.lockType);

    const aggroStatus = LockSystem.getLockStatus('aggressiveMode', ctx);
    renderSettingRowLockBanner(aggroRow, 'aggressive', aggroStatus.reason, aggroStatus.lockType);

    const rareStatus = LockSystem.getLockStatus('rareEvents', ctx);
    renderSettingRowLockBanner(rareEventsToggle?.closest('.control-row'), 'rare-events', rareStatus.reason, rareStatus.lockType);
    if (rareEventsToggle) {
      rareEventsToggle.disabled = rareStatus.locked;
      if (rareStatus.locked) rareEventsToggle.checked = false;
    }

    const sizeStatus = LockSystem.getLockStatus('size', ctx);
    renderActivityLockBanner(sizeRow, sizeStatus.reason, sizeStatus.lockType);

    const companionStatus = LockSystem.getLockStatus('companion', ctx);
    setExistingLockBannerReason(companionLock, companionStatus.reason, companionStatus.lockType);

    const speechStatus = LockSystem.getLockStatus('speech', ctx);
    setExistingLockBannerReason(speechLock, speechStatus.reason, speechStatus.lockType);

    const mischiefStatus = LockSystem.getLockStatus('uiMischief', ctx);
    setExistingLockBannerReason(mischiefLock, mischiefStatus.reason, mischiefStatus.lockType);
    if (uiMischiefToggle) {
      uiMischiefToggle.disabled = mischiefStatus.locked;
      if (mischiefStatus.locked) uiMischiefToggle.checked = false;
    }
    if (mischiefSwitchWrap) mischiefSwitchWrap.classList.toggle('control-locked', mischiefStatus.locked);
    if (mischiefRow) mischiefRow.classList.toggle('control-locked', mischiefStatus.locked);

    const mischiefRateStatus = LockSystem.getLockStatus('mischiefRate', ctx);
    setExistingLockBannerReason(mischiefRateLock, mischiefRateStatus.reason, mischiefRateStatus.lockType);
    if (mischiefMinus) mischiefMinus.disabled = mischiefRateStatus.locked;
    if (mischiefPlus) mischiefPlus.disabled = mischiefRateStatus.locked;
    if (mischiefRateRow) mischiefRateRow.classList.toggle('control-locked', mischiefRateStatus.locked);
  }

  function getBallPropsActivityLockReason(data) {
    const ctx = LockSystem.getContext(data);
    return LockSystem.getLockStatus('ballProps', ctx).reason;
  }

  function renderBallPropsActivityControl(data) {
    if (!ballPropsActivitySelect) return;
    const card = ballPropsActivitySelect.closest('.activity-setting-card');
    const ctx = LockSystem.getContext(data);
    const lockStatus = LockSystem.getLockStatus('ballProps', ctx);
    ballPropsActivitySelect.value = lockStatus.reason ? 'off' : (data.ballPropsEnabled === true ? 'on' : 'off');
    ballPropsActivitySelect.disabled = Boolean(lockStatus.reason);
    ballPropsActivitySelect.title = lockStatus.reason;
    card?.classList.toggle('activity-unavailable', Boolean(lockStatus.reason));
    card?.classList.toggle('control-locked', Boolean(lockStatus.reason));
    renderActivityLockBanner(card, lockStatus.reason, lockStatus.lockType);
  }

  function renderActivityFrequencyControls(data) {
    const ctx = LockSystem.getContext(data);
    activityFrequencyControls.forEach(control => {
      if (!control.select) return;
      const status = LockSystem.getLockStatus(control.kind, ctx);
      const unlocked = !control.milestone || latestFreePlayMode || Number(data.catXP || 0) >= MILESTONES[control.milestone].xp;
      const card = control.select.closest('.activity-setting-card');
      const lockReason = status.reason || getActivityLockReason(control, data, unlocked);
      const lockType = status.lockType || (lockReason ? (unlocked ? 'disabled' : 'level') : null);
      const unavailable = Boolean(lockReason);
      const enabled = !control.enabledKey || data[control.enabledKey] === true;
      control.select.value = control.kind === 'bubble'
        ? (unavailable ? 'off' : (enabled ? normalizeActivityFrequency(data[control.frequencyKey]) : 'off'))
        : (['rare', 'often'].includes(data[control.frequencyKey]) ? data[control.frequencyKey] : 'normal');
      control.select.disabled = Boolean(data.lowPowerMode || unavailable || !unlocked);
      control.select.title = lockReason;
      card?.classList.toggle('activity-unavailable', !unlocked || unavailable);
      card?.classList.toggle('control-locked', !unlocked || unavailable);
      renderActivityLockBanner(card, lockReason, lockType);
    });
    renderBallPropsActivityControl(data);
  }

  activityFrequencyControls.forEach(control => {
    if (!control.select) return;
    control.select.addEventListener('change', async () => {
      const current = await getLocal(defaultSettings);
      const unlocked = !control.milestone || current.freePlayMode || current.unlockAll || Number(current.catXP || 0) >= MILESTONES[control.milestone].xp;
      if (current.lowPowerMode || current.freePlayMode || current.unlockAll || !unlocked || isActivityUnavailableForPet(control, current.activePet)) {
        renderActivityFrequencyControls(current);
        return;
      }
      const value = normalizeActivityFrequency(control.select.value);
      const patch = { [control.frequencyKey]: value };
      if (control.kind === 'bubble' && control.enabledKey) patch[control.enabledKey] = value !== 'off';
      await setLocal(patch);
      await sendMessageToTabs({ action: 'updateSettings', settings: patch });
      await refresh();
    });
  });

  if (ballPropsActivitySelect) {
    ballPropsActivitySelect.addEventListener('change', async () => {
      const current = await getLocal(defaultSettings);
      if (getBallPropsActivityLockReason(current)) {
        renderBallPropsActivityControl(current);
        return;
      }
      const next = ballPropsActivitySelect.value === 'on';
      const patch = { ballPropsEnabled: next };
      await setLocal(patch);
      await sendMessageToTabs({ action: 'updateSettings', settings: patch });
      await refresh();
    });
  }

  async function refresh() {
    const data = await getLocal(defaultSettings);
    const freqMigrate = {};
    if (data.fishFrequency === 'off') freqMigrate.fishFrequency = 'normal';
    if (data.ballFrequency === 'off') freqMigrate.ballFrequency = 'normal';
    if (data.spiderFrequency === 'off') freqMigrate.spiderFrequency = 'normal';
    if (data.portalFrequency === 'off') freqMigrate.portalFrequency = 'normal';
    if (Object.keys(freqMigrate).length) {
      await setLocal(freqMigrate);
      Object.assign(data, freqMigrate);
    }
    latestLowPowerMode = !!data.lowPowerMode;
    latestFreePlayMode = !!(data.freePlayMode || data.unlockAll);
    await enforceEcoModeIfNeeded(data);
    const lockedPatch = getLockedSettingsPatch(data);
    if (Object.keys(lockedPatch).length) {
      Object.assign(data, lockedPatch);
      await setLocal(lockedPatch);
      await sendMessageToTabs({ action: 'updateSettings', settings: lockedPatch });
      if (lockedPatch.companionEnabled === false) {
        await sendMessageToTabs({ action: 'stopCompanion' });
      }
    }
    latestActivePet = data.activePet || 'pet_cat';
    const isFlyingPetActive = isFlyingPet(latestActivePet);
    const isClippyPetActive = isClippyPet(latestActivePet);
    if (isFlyingPetActive || isClippyPetActive) {
      data.companionEnabled = false;
    }
    updateMainToggleUI(data.catEnabled);
    if (freePlayToggle) freePlayToggle.checked = latestFreePlayMode;
    companionToggle.checked = data.companionEnabled;
    updateCompanionControlsState(data.companionEnabled);
    updateCompanionUI(data.companionPet);
    loyalToggle.checked = data.loyalMode;
    const isNonCat = isNonCatPet(data.activePet);
    const latestNonCat = isNonCatPet(latestActivePet);
    aggroToggle.checked = isNonCat ? false : data.aggressiveMode;
    if (wallClimbToggle) wallClimbToggle.checked = data.wallClimbEnabled === true;
    if (!latestFreePlayMode && data.spiderEnabled) spiderSpawnBtn.classList.add('active');
    else spiderSpawnBtn.classList.remove('active');
    uiMischiefToggle.checked = latestNonCat ? false : data.uiMischiefEnabled;
    speechToggle.checked = data.speechEnabled;
    if (animatedFaviconSelect) animatedFaviconSelect.value = data.animatedFavicon || 'none';
    rareEventsToggle.checked = data.rareEventsEnabled;
    lowPowerToggle.checked = data.lowPowerMode;
    if (hideInFullscreenToggle) hideInFullscreenToggle.checked = data.hideInFullscreen;
    if (showOnAllTabsToggle) showOnAllTabsToggle.checked = data.showOnAllTabs === true;
    if (dragHandToggle) dragHandToggle.checked = data.dragHandEnabled === true;
    renderActivityFrequencyControls(data);
    if (typeof renderDisabledSitesList === 'function') renderDisabledSitesList();

    sizeVal.textContent = formatSizeVal(data.sizeMultiplier);
    renderUiScaleControl(data.uiScale);
    mischiefRateVal.textContent = `${parseInt(data.uiMischiefRate, 10)}%`;
    if (latestNonCat && (data.aggressiveMode || data.uiMischiefEnabled)) {
      data.aggressiveMode = false;
      data.uiMischiefEnabled = false;
      uiMischiefToggle.checked = false;
      await forceCatOnlySettingsOffForFox(latestActivePet);
    }

    if (coinCount) coinCount.textContent = latestFreePlayMode ? '∞' : (data.coins || 0).toLocaleString();

    if (!latestFreePlayMode && data.autoFishSpawnEnabled) {
      fishSpawnBtn.classList.add('active');
    } else {
      fishSpawnBtn.classList.remove('active');
    }

    if (!latestFreePlayMode && data.ballEnabled) ballSpawnBtn.classList.add('active');
    else ballSpawnBtn.classList.remove('active');

    if (portalSpawnBtn) {
      if (!latestFreePlayMode && data.portalEnabled) portalSpawnBtn.classList.add('active');
      else portalSpawnBtn.classList.remove('active');
    }

    document.querySelectorAll('#energyGroup .group-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.energy === data.catEnergyLevel);
    });

    applyXpUI(data.catXP || 0, false);
    applyPetSpecificLocks(latestActivePet);
    updateSkinSwatches(getActiveSkinFromData(data, latestActivePet), latestActivePet);
    applyAutoSpawnAvailability(data);
    applySandboxAutoSpawnUI(latestFreePlayMode);
    applyEcoModeUI(!!data.lowPowerMode);
    renderOtherSettingsLockReasons(data);
    await refreshQuests();
    await refreshStats();
  }

  async function blockResourceControlIfEco(event) {
    const data = await getLocal({ lowPowerMode: latestLowPowerMode });
    if (!data.lowPowerMode) return false;
    latestLowPowerMode = true;
    if (event && event.target && 'checked' in event.target) event.target.checked = false;
    applyEcoModeUI(true);
    return true;
  }

  function applySandboxAutoSpawnUI(enabled) {
    [fishSpawnBtn, ballSpawnBtn, spiderSpawnBtn, portalSpawnBtn].forEach((button) => {
      if (!button) return;
      button.classList.toggle('sandbox-auto-disabled', !!enabled);
      if (enabled) {
        button.classList.remove('active');
        button.style.opacity = '0.45';
        button.style.pointerEvents = 'none';
        button.setAttribute('aria-disabled', 'true');
        button.title = t('freePlayMode');
      } else {
        button.setAttribute('aria-disabled', String(!!button.disabled));
        if (button.title === t('freePlayMode')) button.removeAttribute('title');
      }
    });
  }

  toggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    await setLocal({ catEnabled: next });
    await sendMessageToTabs({ action: next ? 'startCat' : 'stopCat' });
    if (!next) {

      await sendMessageToTabs({ action: 'stopCompanion' });
    } else {
      const companionData = await getLocal({ companionEnabled: false });
      if (companionData.companionEnabled) {
        await sendMessageToTabs({ action: 'startCompanion' });
      }
    }
    updateMainToggleUI(next);
  });

  if (freePlayToggle) {
    freePlayToggle.addEventListener('change', async (e) => {
      const next = e.target.checked;
      latestFreePlayMode = next;
      if (next) {
        const patch = { freePlayMode: true, unlockAll: true };
        await setLocal(patch);
        await sendMessageToTabs({ action: 'updateSettings', settings: patch });
      } else {
        const current = await getLocal(defaultSettings);
        current.freePlayMode = false;
        current.unlockAll = false;
        let sanitized = FairPlay && typeof FairPlay.normalizeState === 'function' ? FairPlay.normalizeState(current) : current;
        if (FairPlay && typeof FairPlay.applyLevelLocks === 'function') {
          sanitized = FairPlay.applyLevelLocks(sanitized);
        }
        const owned = Array.isArray(sanitized.shopOwned) ? sanitized.shopOwned : (Array.isArray(current.shopOwned) ? current.shopOwned : []);
        const companionVal = current.companionPet || 'same';
        if (companionVal !== 'same' && companionVal !== 'pet_cat' && !owned.includes(companionVal)) {
          sanitized.companionPet = 'same';
        } else if (normalizeCompanionPetValue(companionVal, sanitized.activePet) === 'same') {
          sanitized.companionPet = 'same';
        } else {
          sanitized.companionPet = companionVal;
        }
        await setLocal(sanitized);
        if (!sanitized.companionEnabled) {
          await sendMessageToTabs({ action: 'stopCompanionInstant' }).catch(() => {});
        } else {
          await sendMessageToTabs({ action: 'restartCompanion' }).catch(() => {});
        }
        await sendMessageToTabs({ action: 'updateSettings', settings: sanitized });
      }
      await refresh();
    });
  }

  loyalToggle.addEventListener('change', async (e) => {
    const active = await getLocal({ activePet: 'pet_cat' });
    const isClippy = isClippyPet(active.activePet);
    if (isClippy) {
      e.target.checked = false;
      await setLocal({ loyalMode: false });
      await sendMessageToTabs({ action: 'updateSettings', settings: { loyalMode: false } });
      return;
    }
    const next = e.target.checked;
    await setLocal({ loyalMode: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { loyalMode: next } });
  });

  companionToggle.addEventListener('change', async (e) => {
    revertLockedOthersPreview();
    if (await blockResourceControlIfEco(e)) return;
    const active = await getLocal({ activePet: 'pet_cat' });
    const isClippy = isClippyPet(active.activePet);
    const isFlyingPetUi = isFlyingPet(active.activePet);
    if (isClippy || isFlyingPetUi || !isMilestoneUnlocked('companion')) {
      e.target.checked = false;
      updateCompanionControlsState(false);
      await setLocal({ companionEnabled: false });
      await sendMessageToTabs({ action: 'stopCompanion' });
      return;
    }
    const next = e.target.checked;
    updateCompanionControlsState(next);
    await setLocal({ companionEnabled: next });
    await sendMessageToTabs({ action: next ? 'startCompanion' : 'stopCompanion' });
  });

  if (companionPrevBtn) {
    companionPrevBtn.addEventListener('click', () => cycleCompanionPet('prev'));
  }
  if (companionNextBtn) {
    companionNextBtn.addEventListener('click', () => cycleCompanionPet('next'));
  }

  window.addEventListener('pagehide', revertLockedOthersPreview);
  window.addEventListener('beforeunload', revertLockedOthersPreview);

  aggroToggle.addEventListener('change', async (e) => {
    if (await blockResourceControlIfEco(e)) return;
    const active = await getLocal({ activePet: 'pet_cat' });
    if (isNonCatPet(active.activePet)) {
      e.target.checked = false;
      await setLocal({ aggressiveMode: false });
      await sendMessageToTabs({ action: 'updateSettings', settings: { aggressiveMode: false } });
      return;
    }
    const next = e.target.checked;
    await setLocal({ aggressiveMode: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { aggressiveMode: next } });
  });

  if (wallClimbToggle) {
    wallClimbToggle.addEventListener('change', async (e) => {
      if (await blockResourceControlIfEco(e)) return;
      const next = e.target.checked;
      await setLocal({ wallClimbEnabled: next });
      await sendMessageToTabs({ action: 'updateSettings', settings: { wallClimbEnabled: next } });
    });
  }

  uiMischiefToggle.addEventListener('change', async (e) => {
    if (await blockResourceControlIfEco(e)) return;
    if (latestFreePlayMode) {
      e.target.checked = false;
      return;
    }
    const active = await getLocal({ activePet: 'pet_cat' });
    if (isNonCatPet(active.activePet)) {
      e.target.checked = false;
      await setLocal({ uiMischiefEnabled: false });
      await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefEnabled: false } });
      return;
    }
    if (!isMilestoneUnlocked('uiMischief')) {
      e.target.checked = false;
      return;
    }
    const next = e.target.checked;
    await setLocal({ uiMischiefEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefEnabled: next } });
  });

  if (animatedFaviconSelect) {
    animatedFaviconSelect.addEventListener('change', async (e) => {
      const val = e.target.value;
      await setLocal({ animatedFavicon: val });
      if (typeof API.runtime.sendMessage === 'function') {
        API.runtime.sendMessage({ action: 'runnerChanged', runner: val }).catch(() => {});
      }
    });
  }

  speechToggle.addEventListener('change', async (e) => {
    if (await blockResourceControlIfEco(e)) return;
    const active = await getLocal({ activePet: 'pet_cat' });
    const isClippy = isClippyPet(active.activePet);
    if (!isClippy || !isMilestoneUnlocked('speech')) {
      e.target.checked = false;
      await setLocal({ speechEnabled: false });
      await sendMessageToTabs({ action: 'updateSettings', settings: { speechEnabled: false } });
      return;
    }
    const next = e.target.checked;
    await setLocal({ speechEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { speechEnabled: next } });
  });

  rareEventsToggle.addEventListener('change', async (e) => {
    if (await blockResourceControlIfEco(e)) return;
    if (latestFreePlayMode) {
      rareEventsToggle.checked = false;
      return;
    }
    const next = e.target.checked;
    const data = await getLocal({ soapBubbleFrequency: 'normal' });
    const frequency = next && normalizeActivityFrequency(data.soapBubbleFrequency) === 'off' ? 'normal' : (next ? normalizeActivityFrequency(data.soapBubbleFrequency) : 'off');
    const patch = { rareEventsEnabled: next, soapBubbleFrequency: frequency };
    await setLocal(patch);
    await sendMessageToTabs({ action: 'updateSettings', settings: patch });
  });

  spiderSpawnBtn.addEventListener('click', async (e) => {
    if (await blockResourceControlIfEco(e)) return;
    if (latestFreePlayMode) return;
    if ((ACTIVITY_PET_RESTRICTIONS[normalizePetId(latestActivePet)] || []).includes('spider')) return;
    if (!isMilestoneUnlocked('spider')) return;
    const next = !spiderSpawnBtn.classList.contains('active');
    spiderSpawnBtn.classList.toggle('active', next);
    const data = await getLocal({ spiderFrequency: 'normal' });
    const frequency = ['rare', 'often'].includes(data.spiderFrequency) ? data.spiderFrequency : 'normal';
    const patch = { spiderEnabled: next, spiderFrequency: frequency };
    await setLocal(patch);
    await sendMessageToTabs({ action: 'updateSettings', settings: patch });
  });

  fishSpawnBtn.addEventListener('click', async (e) => {
    if (await blockResourceControlIfEco(e)) return;
    if (latestFreePlayMode) return;
    if ((ACTIVITY_PET_RESTRICTIONS[normalizePetId(latestActivePet)] || []).includes('fish')) return;
    const next = !fishSpawnBtn.classList.contains('active');
    fishSpawnBtn.classList.toggle('active', next);
    const data = await getLocal({ fishFrequency: 'normal' });
    const frequency = ['rare', 'often'].includes(data.fishFrequency) ? data.fishFrequency : 'normal';
    const patch = { autoFishSpawnEnabled: next, fishFrequency: frequency };
    await setLocal(patch);
    await sendMessageToTabs({ action: 'updateSettings', settings: patch });
  });

  ballSpawnBtn.addEventListener('click', async (e) => {
    if (await blockResourceControlIfEco(e)) return;
    if (latestFreePlayMode) return;
    if ((ACTIVITY_PET_RESTRICTIONS[normalizePetId(latestActivePet)] || []).includes('ball')) return;
    if (!isMilestoneUnlocked('ball')) return;
    const next = !ballSpawnBtn.classList.contains('active');
    ballSpawnBtn.classList.toggle('active', next);
    const data = await getLocal({ ballFrequency: 'normal' });
    const frequency = ['rare', 'often'].includes(data.ballFrequency) ? data.ballFrequency : 'normal';
    const patch = { ballEnabled: next, ballFrequency: frequency };
    await setLocal(patch);
    await sendMessageToTabs({ action: 'updateSettings', settings: patch });
  });

  if (portalSpawnBtn) {
    portalSpawnBtn.addEventListener('click', async (e) => {
      if (await blockResourceControlIfEco(e)) return;
      if (latestFreePlayMode) return;
      if ((ACTIVITY_PET_RESTRICTIONS[normalizePetId(latestActivePet)] || []).includes('portal')) return;
      if (!isMilestoneUnlocked('portal')) return;
      const next = !portalSpawnBtn.classList.contains('active');
      portalSpawnBtn.classList.toggle('active', next);
      const data = await getLocal({ portalFrequency: 'normal' });
      const frequency = ['rare', 'often'].includes(data.portalFrequency) ? data.portalFrequency : 'normal';
      const patch = { portalEnabled: next, portalFrequency: frequency };
      await setLocal(patch);
      await sendMessageToTabs({ action: 'updateSettings', settings: patch });
    });
  }

  document.querySelectorAll('#energyGroup .group-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.energy === 'hyper' && await blockResourceControlIfEco()) return;
      if (btn.dataset.energy === 'hyper' && !isMilestoneUnlocked('hyper')) return;
      document.querySelectorAll('#energyGroup .group-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const energy = btn.dataset.energy;
      await setLocal({ catEnergyLevel: energy });
      await sendMessageToTabs({ action: 'updateSettings', settings: { catEnergyLevel: energy } });
    });
  });

  lowPowerToggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    const current = await getLocal(ECO_RESTORE_DEFAULTS);
    const patch = next ? await enableEcoMode(current) : await disableEcoMode(current);
    latestLowPowerMode = !!patch.lowPowerMode;
    await refresh();
  });

  if (hideInFullscreenToggle) {
    hideInFullscreenToggle.addEventListener('change', async (e) => {
      const next = e.target.checked;
      await setLocal({ hideInFullscreen: next });
      await sendMessageToTabs({ action: 'updateSettings', settings: { hideInFullscreen: next } });
    });
  }

  if (showOnAllTabsToggle) {
    showOnAllTabsToggle.addEventListener('change', async (e) => {
      const next = e.target.checked;
      await setLocal({ showOnAllTabs: next });
      await sendMessageToTabs({ action: 'updateSettings', settings: { showOnAllTabs: next } });
    });
  }

  function formatSizeVal(val) {
    const n = parseFloat(val);
    if (!Number.isFinite(n)) return '1.0x';
    return (Math.round(n * 100) % 10 === 0 ? n.toFixed(1) : n.toFixed(2)) + 'x';
  }

  async function adjustSize(delta) {
    if (!isMilestoneUnlocked('size')) return;
    const data = await getLocal({ sizeMultiplier: 1.0 });
    const current = parseFloat(data.sizeMultiplier);
    const val = Math.min(2.5, Math.max(0.5, Math.round((current + delta) * 100) / 100));
    sizeVal.textContent = formatSizeVal(val);
    await setLocal({ sizeMultiplier: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { sizeMultiplier: val } });
  }

  sizeMinus.addEventListener('click', () => adjustSize(-0.05));
  sizePlus.addEventListener('click', () => adjustSize(0.05));

  function renderUiScaleControl(value) {
    const scale = UiScale ? UiScale.normalize(value) : Math.min(1.5, Math.max(0.8, Number(value) || 1));
    if (uiSizeVal) uiSizeVal.textContent = `${Math.round(scale * 100)}%`;
    if (uiSizeMinus) uiSizeMinus.disabled = scale <= (UiScale ? UiScale.MIN_SCALE : 0.8);
    if (uiSizePlus) uiSizePlus.disabled = scale >= (UiScale ? UiScale.MAX_SCALE : 1.5);
    return scale;
  }

  async function adjustUiSize(delta) {
    const data = await getLocal({ uiScale: 1.0 });
    const current = UiScale ? UiScale.normalize(data.uiScale) : Number(data.uiScale) || 1;
    const next = UiScale
      ? UiScale.normalize(current + delta)
      : Math.min(1.5, Math.max(0.8, Math.round((current + delta) * 100) / 100));
    if (UiScale) UiScale.apply(next);
    renderUiScaleControl(next);
    await setLocal({ uiScale: next });
  }

  if (uiSizeMinus) uiSizeMinus.addEventListener('click', () => adjustUiSize(-0.05));
  if (uiSizePlus) uiSizePlus.addEventListener('click', () => adjustUiSize(0.05));

  async function adjustMischiefRate(delta) {
    if (latestFreePlayMode) return;
    const data = await getLocal({ uiMischiefRate: 11, activePet: 'pet_cat' });
    if (isNonCatPet(data.activePet)) {
      await forceCatOnlySettingsOffForFox(data.activePet);
      return;
    }
    const current = parseInt(data.uiMischiefRate, 10);
    const val = Math.min(30, Math.max(5, current + delta));
    mischiefRateVal.textContent = `${val}%`;
    await setLocal({ uiMischiefRate: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefRate: val } });
  }

  mischiefMinus.addEventListener('click', () => adjustMischiefRate(-5));
  mischiefPlus.addEventListener('click', () => adjustMischiefRate(5));

  const skinSelectContainer = document.getElementById('skinSelect');
  if (skinSelectContainer) {
    skinSelectContainer.addEventListener('click', async (e) => {
      const box = e.target.closest('.color-box');
      if (!box) return;

      const active = await getLocal(defaultSettings);
      latestActivePet = active.activePet || 'pet_cat';
      const skin = box.dataset.skin;
      const ctx = {
        activePet: latestActivePet,
        xp: Number(active.catXP || 0),
        sandbox: Boolean(active.freePlayMode || active.unlockAll),
        eco: Boolean(active.lowPowerMode),
        skinId: skin
      };
      if (!LockSystem.canUse('skin', ctx)) {
        box.classList.remove('lock-shake');
        void box.offsetWidth;
        box.classList.add('lock-shake');
        setTimeout(() => box.classList.remove('lock-shake'), 260);
        return;
      }
      latestActivePet = active.activePet || 'pet_cat';
      const key = getSkinStorageKey(latestActivePet);
      updateSkinSwatches(skin, latestActivePet);
      await setLocal({ [key]: skin });
      await sendMessageToTabs({ action: 'updateSettings', settings: { [key]: skin } });
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveTab(btn.dataset.tab);
    });
  });

  const infoIconInfo   = document.getElementById('infoIconInfo');
  const infoIconReturn = document.getElementById('infoIconReturn');
  const infoIconClose  = document.getElementById('infoIconClose');

  let _lastTabBeforeInfo = 'essential';

  function openInfoPanel() {
    _lastTabBeforeInfo = document.querySelector('.tab-button.active')?.dataset.tab || 'essential';
    document.body.classList.add('info-panel-open');
    if (infoToggle) infoToggle.classList.add('active');
    if (infoIconInfo)   infoIconInfo.style.display   = 'none';
    if (infoIconReturn) infoIconReturn.style.display = '';
    if (infoIconClose)  infoIconClose.style.display  = 'none';

    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === 'info'));
    tabButtons.forEach(b => b.classList.remove('active'));
    setActiveInfoTab('about');
  }

  function closeInfoPanel() {
    document.body.classList.remove('info-panel-open');
    if (infoToggle) infoToggle.classList.remove('active');
    if (infoIconInfo)   infoIconInfo.style.display   = '';
    if (infoIconReturn) infoIconReturn.style.display = 'none';
    if (infoIconClose)  infoIconClose.style.display  = 'none';
    setActiveTab(_lastTabBeforeInfo);
  }

  if (infoToggle) {
    infoToggle.addEventListener('click', () => {

      if (onboardingScreen && onboardingScreen.style.display === 'flex') {
        _hideOnboarding();
        if (_cameFromInfo) {
          openInfoPanel();
          setActiveInfoTab('stats');
        }
        return;
      }

      if (document.body.classList.contains('info-panel-open')) {
        closeInfoPanel();
      } else {
        openInfoPanel();
      }
    });
  }

  subTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveSubTab(btn.dataset.subtab);
    });
  });

  activityTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveActivityTab(btn.dataset.activitytab);
    });
  });

  settingsTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveSettingsTab(btn.dataset.settingstab);
    });
  });

  infoTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveInfoTab(btn.dataset.infotab);
    });
  });

  const toggleTreeBtn = document.getElementById('toggleTreeBtn');
  const statsCardsContainer = document.getElementById('statsCardsContainer');
  const treatsTreeContainer = document.getElementById('treatsTreeContainer');
  const skillTreeMap = document.getElementById('skillTreeMap');
  const skillTreeViewport = skillTreeMap ? skillTreeMap.closest('.skill-tree-viewport') : null;
  let skillTreePanX = 0;
  let skillTreePanY = 0;
  let skillTreeDragging = false;
  let skillTreeDragStartX = 0;
  let skillTreeDragStartY = 0;
  let skillTreeDragBaseX = 0;
  let skillTreeDragBaseY = 0;

  function updateSkillTreePan() {
    if (!skillTreeMap) return;
    skillTreeMap.style.setProperty('--tree-pan-x', `${skillTreePanX}px`);
    skillTreeMap.style.setProperty('--tree-pan-y', `${skillTreePanY}px`);
  }

  function clampSkillTreePan() {
    if (!skillTreeMap || !skillTreeViewport) return;

    const mapW = skillTreeMap.offsetWidth || 800;
    const mapH = skillTreeMap.offsetHeight || 1000;
    const viewW = skillTreeViewport.offsetWidth || 215;
    const viewH = skillTreeViewport.offsetHeight || 266;

    const limitX = Math.max(0, (mapW - viewW) / 2);
    const limitY = Math.max(0, (mapH - viewH) / 2);

    skillTreePanX = Math.max(-limitX, Math.min(limitX, skillTreePanX));
    skillTreePanY = Math.max(-limitY, Math.min(limitY, skillTreePanY));
  }

  if (skillTreeViewport) {
    skillTreeViewport.addEventListener('pointerdown', (event) => {
      skillTreeDragging = true;
      skillTreeDragStartX = event.clientX;
      skillTreeDragStartY = event.clientY;
      skillTreeDragBaseX = skillTreePanX;
      skillTreeDragBaseY = skillTreePanY;
      skillTreeViewport.classList.add('is-dragging');
      skillTreeViewport.setPointerCapture(event.pointerId);
    });

    skillTreeViewport.addEventListener('pointermove', (event) => {
      if (!skillTreeDragging) return;
      skillTreePanX = skillTreeDragBaseX + event.clientX - skillTreeDragStartX;
      skillTreePanY = skillTreeDragBaseY + event.clientY - skillTreeDragStartY;
      clampSkillTreePan();
      updateSkillTreePan();
    });

    function stopSkillTreeDrag(event) {
      if (!skillTreeDragging) return;
      skillTreeDragging = false;
      skillTreeViewport.classList.remove('is-dragging');
      if (event && skillTreeViewport.hasPointerCapture(event.pointerId)) {
        skillTreeViewport.releasePointerCapture(event.pointerId);
      }
    }

    skillTreeViewport.addEventListener('pointerup', stopSkillTreeDrag);
    skillTreeViewport.addEventListener('pointercancel', stopSkillTreeDrag);
  }

  if (toggleTreeBtn && statsCardsContainer && treatsTreeContainer) {
    toggleTreeBtn.addEventListener('click', () => {
      const isTreeVisible = treatsTreeContainer.style.display !== 'none';
      if (isTreeVisible) {
        treatsTreeContainer.style.display = 'none';
        statsCardsContainer.style.display = 'grid';
        toggleTreeBtn.textContent = t('showSkillsTree');
      } else {
        treatsTreeContainer.style.display = 'flex';
        statsCardsContainer.style.display = 'none';
        toggleTreeBtn.textContent = t('hideSkillsTree');
        clampSkillTreePan();
        updateSkillTreePan();
      }
    });
  }

  document.querySelectorAll('.about-card').forEach((card) => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');

      document.querySelectorAll('.about-card').forEach((c) => {
        c.classList.remove('open');
        c.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        card.classList.add('open');
        card.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const resetCard = document.getElementById('resetCard');
  const resetActions = document.getElementById('resetActions');
  const resetIcon = document.getElementById('resetIcon');
  const confirmReset = document.getElementById('confirmReset');
  const cancelReset = document.getElementById('cancelReset');

  if (resetCard && resetActions) {
    resetCard.addEventListener('click', (e) => {
      if (e.target.closest('.confirm-box')) return;

      resetActions.style.display = 'flex';
      resetIcon.style.display = 'none';
    });

    cancelReset.addEventListener('click', (e) => {
      e.stopPropagation();
      resetActions.style.display = 'none';
      resetIcon.style.display = 'block';
    });

    confirmReset.addEventListener('click', async (e) => {
      e.stopPropagation();

      await API.storage.local.clear();
      if (FairPlay && typeof FairPlay.reset === 'function') {
        await FairPlay.reset(API.storage.local, {});
      }

      const prefKeys = ['catEnabled', 'catSkin', 'hbabySkin', 'foxSkin', 'pigeonSkin', 'skeletonSkin', 'batSkin', 'snakeSkin', 'loyalMode', 'aggressiveMode', 'wallClimbEnabled', 'ballPropsEnabled',
        'speedMultiplier', 'uiMischiefEnabled', 'speechEnabled',
        'rareEventsEnabled', 'autoFishSpawnEnabled', 'lowPowerMode', 'hideInFullscreen', 'showOnAllTabs',
        'sizeMultiplier', 'uiScale', 'uiMischiefRate', 'catEnergyLevel', 'uiLanguage', 'disabledSites', 'activeHat'];
      const prefDefaults = {};
      prefKeys.forEach(k => { if (k in defaultSettings) prefDefaults[k] = defaultSettings[k]; });
      await setLocal(prefDefaults);
      await sendMessageToTabs({ action: defaultSettings.catEnabled ? 'startCat' : 'stopCat' });
      await sendMessageToTabs({ action: 'stopCompanion' });
      await sendMessageToTabs({ action: 'updateSettings', settings: prefDefaults });
      window.location.reload();
    });
  }

  const exportDataBtn  = document.getElementById('exportDataBtn');
  const importDataBtn  = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  const ioStatusMsg     = document.getElementById('ioStatusMsg');

  const _LEGACY_IO_KEY = 'pcx\u0021v1\u2665' + 'K9mQ\u03c0\u03b1T' + 'seal\u00b72026\u00a7xZ';

  async function _ioGetKey() {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      enc.encode(_LEGACY_IO_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  function _ioStableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(_ioStableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map((key) => (
      JSON.stringify(key) + ':' + _ioStableStringify(value[key])
    )).join(',') + '}';
  }

  function _ioLegacyStringify(dataObj) {

    return JSON.stringify(dataObj, Object.keys(dataObj).sort());
  }

  async function _ioSignText(msg) {
    const enc = new TextEncoder();
    const key = await _ioGetKey();
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function _ioSign(dataObj) {
    return _ioSignText(_ioStableStringify(dataObj));
  }

  async function _ioSignLegacy(dataObj) {
    return _ioSignText(_ioLegacyStringify(dataObj));
  }

  async function _ioChecksum(dataObj) {
    const bytes = new TextEncoder().encode(_ioStableStringify(dataObj));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function _ioVerify(dataObj, expectedHex) {
    try {
      const actual = await _ioSign(dataObj);
      if (actual === expectedHex) return true;
      const legacy = await _ioSignLegacy(dataObj);
      return legacy === expectedHex;
    } catch (_) {
      return false;
    }
  }

  function showIOStatus(msg, isError) {
    const targets = [
      document.getElementById('ioStatusMsg'),
      document.getElementById('onboardIoStatusMsg')
    ];
    targets.forEach((el) => {
      if (!el) return;
      el.textContent = msg;
      el.className = 'io-status ' + (isError ? 'err' : 'ok');
      clearTimeout(el._hideTimer);
      el._hideTimer = setTimeout(() => {
        el.textContent = '';
        el.className = 'io-status';
      }, 4000);
    });
  }

  async function doExport() {
    try {

      const raw = await getLocal(null);

      const checksum = await _ioChecksum(raw);

      const payload = {
        _pixelcat: true,
        _exportedAt: new Date().toISOString(),
        _version: '3',
        _checksum: checksum,
        data: raw
      };

      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href     = url;
      a.download = `pixelcat-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      showIOStatus('Exported successfully!', false);
    } catch (err) {
      showIOStatus('Export failed.', true);
    }
  }

  function doImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const payload = JSON.parse(text);

        if (!payload || !payload._pixelcat || !payload.data || typeof payload.data !== 'object') {
          showIOStatus('Not a valid PixelCat backup.', true);
          return;
        }

        if (!payload._checksum && !payload._sig) {
          showIOStatus('Backup has no integrity checksum.', true);
          return;
        }

        showIOStatus('Verifying…', false);
        const valid = payload._checksum
          ? (await _ioChecksum(payload.data)) === payload._checksum
          : await _ioVerify(payload.data, payload._sig);
        if (!valid) {
          showIOStatus('Backup integrity check failed.', true);
          return;
        }

        const existingData = await getLocal({ reviewBannerDismissed: false });
        const data = payload.data;
        if (existingData && existingData.reviewBannerDismissed) {
          data.reviewBannerDismissed = true;
        }

        let restored = data;

        if (FairPlay && typeof FairPlay.commit === 'function') {
          restored = await FairPlay.commit(API.storage.local, data);
        } else if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1) {
          await API.storage.local.set(data);
        } else {
          await new Promise((res) => API.storage.local.set(data, res));
        }

        await sendMessageToTabs({ action: 'updateSettings', settings: restored }).catch(() => {});
        showIOStatus('Imported successfully! Reloading…', false);
        setTimeout(() => window.location.reload(), 900);
      } catch (err) {
        showIOStatus('Import failed — invalid file.', true);
      }
    };
    reader.onerror = () => {
      showIOStatus('Failed to read file.', true);
    };
    reader.readAsText(file);
  }

  if (exportDataBtn) exportDataBtn.addEventListener('click', doExport);

  if (importDataBtn) importDataBtn.addEventListener('click', () => {
    openImportPage();
  });

  if (importFileInput) {
    importFileInput.addEventListener('change', () => {
      const file = importFileInput.files && importFileInput.files[0];
      if (file) {
        doImport(file);
        importFileInput.value = '';
      }
    });
  }

  onboardingScreen           = document.getElementById('onboardingScreen');
  const mainContent          = document.querySelector('.content:not(#onboardingScreen)');
  const petNameInput         = document.getElementById('petNameInput');
  const sexMaleBtn           = document.getElementById('sexMaleBtn');
  const sexFemaleBtn         = document.getElementById('sexFemaleBtn');
  const onboardingConfirmBtn = document.getElementById('onboardingConfirmBtn');

  let _selectedSex = '';

  function _showOnboarding() {

    if (document.body.classList.contains('info-panel-open')) {
      closeInfoPanel();
    }

    if (infoToggle) {
      if (_cameFromInfo) {
        infoToggle.style.display = '';
        if (infoIconInfo)   infoIconInfo.style.display   = 'none';
        if (infoIconReturn) infoIconReturn.style.display = 'none';
        if (infoIconClose)  infoIconClose.style.display  = '';
      } else {
        infoToggle.style.display = 'none';
      }
    }

    if (onboardingScreen) onboardingScreen.style.display = 'flex';
    if (mainContent)      mainContent.style.display = 'none';
    if (petNameInput)     petNameInput.focus();
  }

  function _hideOnboarding() {
    if (infoIconClose)  infoIconClose.style.display  = 'none';
    if (infoToggle)     infoToggle.style.display     = '';
    if (onboardingScreen) onboardingScreen.style.display = 'none';
    if (mainContent)      mainContent.style.display = '';
  }

  if (API.storage.onChanged) {
    API.storage.onChanged.addListener((changes) => {
      if (changes.freePlayMode || changes.unlockAll) {
        latestFreePlayMode = !!((changes.freePlayMode && changes.freePlayMode.newValue) || (changes.unlockAll && changes.unlockAll.newValue));
        if (freePlayToggle) freePlayToggle.checked = latestFreePlayMode;
        if (coinCount) coinCount.textContent = latestFreePlayMode ? '∞' : (parseInt(coinCount.textContent.replace(/[^\d]/g, ''), 10) || 0).toLocaleString();
        applyXpUI(latestXP, false);
      }
      if (changes.catXP) {
        const nextXP = Math.min(MAX_LEVEL_XP, Math.max(0, Number(changes.catXP.newValue) || 0));
        applyXpUI(nextXP, true);
        applyPetSpecificLocks(latestActivePet);
        if (!latestFreePlayMode && nextXP < MILESTONES.rainbowSkin.xp) {
          getLocal({ catSkin: 'white', foxSkin: 'orange', pigeonSkin: 'black', skeletonSkin: 'purple', batSkin: 'white' }).then((data) => {
            const patch = {};
            if (data.catSkin === 'rainbow') patch.catSkin = 'white';
            if (data.foxSkin === 'rainbow') patch.foxSkin = 'orange';
            if (data.pigeonSkin === 'rainbow') patch.pigeonSkin = 'black';
            if (data.batSkin === 'rainbow') patch.batSkin = 'white';
            if (!Object.keys(patch).length) return;
            setLocal(patch);
            sendMessageToTabs({ action: 'updateSettings', settings: patch });
            getLocal(defaultSettings).then((fresh) => {
              const activePet = fresh.activePet || latestActivePet || 'pet_cat';
              updateSkinSwatches(getActiveSkinFromData(Object.assign({}, data, patch, fresh), activePet), activePet);
            }).catch(() => updateSkinSwatches(patch.batSkin || patch.skeletonSkin || patch.pigeonSkin || patch.foxSkin || patch.catSkin || getDefaultSkinForPet(latestActivePet), latestActivePet));
          }).catch(() => {});
        }
      }
      if (changes.activePet) {
        latestActivePet = changes.activePet.newValue || 'pet_cat';
        applyPetSpecificLocks(latestActivePet);
        getLocal(defaultSettings).then((data) => updateSkinSwatches(getActiveSkinFromData(data, latestActivePet), latestActivePet)).catch(() => {});
      }
      if (changes.activePet || changes.companionPet) {
        getLocal({ companionPet: 'same' }).then((data) => updateCompanionUI(data.companionPet)).catch(() => {});
      }
      const activeSkinKey = getSkinStorageKey(latestActivePet);
      if (changes[activeSkinKey]) {
        updateSkinSwatches(changes[activeSkinKey].newValue || getDefaultSkinForPet(latestActivePet), latestActivePet);
      }
      if (changes.coins && coinCount) {
        const newVal = changes.coins.newValue || 0;
        coinCount.textContent = latestFreePlayMode ? '∞' : newVal.toLocaleString();
        if (!latestFreePlayMode) {
          document.querySelectorAll('.shop-buy-btn').forEach(btn => {
             const price = parseInt(btn.textContent.replace(/[^\d]/g, ''), 10);
             if (!isNaN(price) && !btn.classList.contains('owned-btn') && !btn.classList.contains('ball-active-btn') && !btn.classList.contains('set-active-btn')) {
               btn.disabled = newVal < price;
             }
          });
        }
      }
      if ((QuestEngine && changes[QuestEngine.STORAGE_KEY]) || (QuestEngine && changes[QuestEngine.STATS_KEY])) {
        refreshQuests().catch(() => {});
        refreshStats().catch(() => {});
      }
      if (changes.dailyStreak) {
        refreshStats().catch(() => {});
      }
    });
  }

  function _onboardUpdateConfirm() {
    if (!onboardingConfirmBtn) return;
    const hasName = petNameInput && petNameInput.value.trim().length > 0;
    const hasSex  = _selectedSex !== '';
    onboardingConfirmBtn.disabled = !(hasName && hasSex);
  }

  function _selectSex(sex) {
    _selectedSex = sex;

    if (sexMaleBtn)   sexMaleBtn.classList.toggle('active',   sex === 'male');
    if (sexFemaleBtn) sexFemaleBtn.classList.toggle('active', sex === 'female');

    const iconEl = document.getElementById('onboardCatEmoji');
    if (iconEl) iconEl.textContent = sex === 'female' ? '😺' : '🐱';
    _onboardUpdateConfirm();
  }

  if (sexMaleBtn)   sexMaleBtn.addEventListener('click',  () => _selectSex('male'));
  if (sexFemaleBtn) sexFemaleBtn.addEventListener('click', () => _selectSex('female'));
  if (petNameInput) petNameInput.addEventListener('input', _onboardUpdateConfirm);

  if (onboardingConfirmBtn) {
    onboardingConfirmBtn.addEventListener('click', async () => {
      const name = petNameInput ? petNameInput.value.trim() : '';
      const sex  = _selectedSex;
      if (!name || !sex) return;

      await setLocal({ petName: name, petSex: sex });
      await sendMessageToTabs({ action: 'updateSettings', settings: { petName: name, petSex: sex } }).catch(() => {});
      _updatePetIdentityDisplay(name, sex);
      _hideOnboarding();

      if (_cameFromInfo) {
        openInfoPanel();
        setActiveInfoTab('stats');
      }
    });
  }

  function _updatePetIdentityDisplay(name, sex) {
    const nameEl  = document.getElementById('petNameDisplay');
    const badgeEl = document.getElementById('petSexBadge');
    if (nameEl)  nameEl.textContent = name || 'Your Pet';
    if (badgeEl) {
      badgeEl.textContent = sex === 'male' ? '♂' : sex === 'female' ? '♀' : '';
      badgeEl.setAttribute('data-sex', sex || '');
      badgeEl.style.display = sex ? 'inline-flex' : 'none';
    }
  }

  const onboardImportInput = document.getElementById('onboardImportInput');
  const onboardImportBtn   = document.getElementById('onboardImportBtn');
  const onboardImportRow   = document.getElementById('onboardImportRow');

  if (onboardImportBtn && onboardImportInput) {
    onboardImportBtn.addEventListener('click', openImportPage);
    onboardImportInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      doImport(file);
      onboardImportInput.value = '';
    });
  }

  const renameBtn = document.getElementById('renameBtn');
  if (renameBtn) {
    renameBtn.addEventListener('click', () => {
      getLocal({ petName: '', petSex: '' }).then((stored) => {
        if (petNameInput) petNameInput.value = stored.petName || '';
        if (stored.petSex) _selectSex(stored.petSex);
        else {
          _selectedSex = '';
          if (sexMaleBtn)   sexMaleBtn.classList.remove('active');
          if (sexFemaleBtn) sexFemaleBtn.classList.remove('active');
        }
        _onboardUpdateConfirm();

        const titleEl = document.getElementById('onboardTitle');
        const subEl   = document.getElementById('onboardSub');
        if (titleEl) titleEl.textContent = t('onboardRename');
        if (subEl)   subEl.textContent   = t('onboardPickNew');
        if (onboardImportRow) onboardImportRow.style.display = 'none';
        _cameFromInfo = true;
        _showOnboarding();
      }).catch(() => {});
    });
  }

  getLocal({ petName: '', petSex: '', catXP: 0, coins: 0 }).then((stored) => {
    if (!stored.petName) {
      const isNewUser = !stored.catXP && !stored.coins;

      const titleEl       = document.getElementById('onboardTitle');
      const subEl         = document.getElementById('onboardSub');
      const updateBadge   = document.getElementById('onboardUpdateBadge');
      const safeNote      = document.getElementById('onboardSafeNote');

      if (isNewUser) {

        if (titleEl)     titleEl.textContent  = t('onboardMeetTitle');
        if (subEl)       subEl.textContent    = t('onboardPick');
        if (updateBadge) updateBadge.style.display = 'none';
        if (safeNote)    safeNote.style.display    = 'none';
        if (onboardImportRow) onboardImportRow.style.display = 'block';
      } else {

        if (titleEl)     titleEl.textContent  = t('onboardQuick');
        if (subEl)       subEl.textContent    = t('onboardGive');
        if (updateBadge) updateBadge.style.display = 'inline-block';
        if (safeNote)    safeNote.style.display    = 'block';
        if (onboardImportRow) onboardImportRow.style.display = 'none';
      }

      _cameFromInfo = false;
      _showOnboarding();
      if (stored.petSex) _selectSex(stored.petSex);
    }
    _updatePetIdentityDisplay(stored.petName || '', stored.petSex || '');
  }).catch(() => {});

  setActiveTab('essential');
  refresh().catch(() => {});

  const shopBallsView = document.getElementById('shopBallsView');
  const shopBoostsView = document.getElementById('shopBoostsView');
  const shopAnimalsView = document.getElementById('shopAnimalsView');
  const shopCharactersView = document.getElementById('shopCharactersView');
  const homeBonusBanner = document.getElementById('homeBonusBanner');
  const homeBonusTitle  = document.getElementById('homeBonusTitle');
  const homeBonusSub    = document.getElementById('homeBonusSub');
  const homeBonusIcon   = document.getElementById('homeBonusIcon');
  const homeBonusBtn    = document.getElementById('homeBonusBtn');
  let _shopBallPage = 0;
  let _shopHatPage = 0;
  let _shopAnimalPage = 0;
  let _shopCharacterPage = 0;

  document.querySelectorAll('[data-shoptab]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveShopTab(btn.dataset.shoptab);
    });
  });
  document.querySelectorAll('[data-itemtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveItemSubTab(btn.dataset.itemtab);
    });
  });

  document.querySelectorAll('[data-pettab]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActivePetSubTab(btn.dataset.pettab);
    });
  });

  const STREAK_REWARDS = [5, 8, 12, 15, 20, 25, 35];

  function getDateKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, container, activeHat = 'hat_none') {
    const normalizedOwned = Array.isArray(owned) ? owned : [];
    const isFree    = !!item.free || item.id === 'pet_cat' || item.id === 'hat_none';
    const isFreePlay = !!latestFreePlayMode;
    const isOwned   = isFree || isFreePlay || normalizedOwned.includes(item.id);
    const isActive  = item.type === 'ball'
      ? activeBall === item.id
      : (item.type === 'hat' ? activeHat === item.id : (item.type === 'pet' ? activePet === item.id : (normalizedOwned.includes(item.id) || isFreePlay) && Array.isArray(activeBoosts) && activeBoosts.includes(item.id)));
    const canAfford = isFreePlay || coins >= item.price;

    let cardClass = 'shop-item';
    if (item.upcoming)                cardClass += ' cant-afford upcoming-item';
    else if (isActive)                cardClass += ' ball-active';
    else if (isOwned)                 cardClass += ' owned';
    else if (!canAfford && !isOwned)  cardClass += ' cant-afford';

    const card = document.createElement('div');
    card.className = cardClass;
    card.classList.add(`shop-type-${item.type}`);
    card.dataset.id = item.id;

    if (item.imgFile) {
      const basePath = item.type === 'pet' ? 'assets/animations' : 'assets/balls';
      const src = (typeof browser !== 'undefined' ? browser : chrome).runtime.getURL(`${basePath}/${item.imgFile}`);
      const img = document.createElement('img');
      img.className = `shop-item-img img-${item.id}`;
      img.src = src;
      img.alt = item.nameKey ? t(item.nameKey) : item.name;
      card.appendChild(img);
    } else if (item.hatClass) {
      const icon = document.createElement('div');
      icon.className = `shop-item-hat ${item.hatClass}`;
      card.appendChild(icon);
    } else {
      const emoji = document.createElement('div');
      emoji.className = 'shop-item-emoji';
      emoji.textContent = item.emoji;
      card.appendChild(emoji);
    }

    let btnLabel, btnClass, btnDisabled;
    if (item.upcoming) {
      btnLabel = t('upcoming') || 'Upcoming';
      btnClass = 'shop-buy-btn upcoming-btn';
      btnDisabled = true;
    } else if (item.type === 'ball' || item.type === 'pet' || item.type === 'hat') {
      if (isActive) {
        btnLabel = `* ${t('activeItem')}`; btnClass = 'shop-buy-btn ball-active-btn'; btnDisabled = true;
      } else if (isOwned) {
        btnLabel = t('setActive'); btnClass = 'shop-buy-btn set-active-btn'; btnDisabled = false;
      } else if (canAfford) {
        btnLabel = t('buyCoins', { price: item.price }); btnClass = 'shop-buy-btn'; btnDisabled = false;
      } else {
        btnLabel = t('buyCoins', { price: item.price }); btnClass = 'shop-buy-btn'; btnDisabled = true;
      }
    } else {

      if (isOwned) {
        btnLabel = isActive ? t('disable') : t('enable');
        btnClass = isActive ? 'shop-buy-btn boost-active-btn' : 'shop-buy-btn set-active-btn';
        btnDisabled = false;
      } else {
        btnLabel = t('buyCoins', { price: item.price }); btnClass = 'shop-buy-btn'; btnDisabled = !canAfford;
      }
    }

    const isFrogActive = isFrogPet(activePet);
    if (item.type === 'hat' && !isFrogActive && !isActive) {
      btnDisabled = true;
      card.style.opacity = '0.45';
      card.classList.add('control-locked');
    }

    const name = document.createElement('div');
    name.className = 'shop-item-name';
    name.textContent = item.nameKey ? t(item.nameKey) : item.name;
    card.appendChild(name);

    if (item.type !== 'ball' && item.type !== 'pet' && item.desc) {
      const desc = document.createElement('div');
      desc.className = 'shop-item-desc';
      desc.textContent = item.descKey ? t(item.descKey) : item.desc;
      card.appendChild(desc);
    }

    const btn = document.createElement('button');
    btn.className = btnClass;
    btn.disabled = btnDisabled;
    btn.textContent = btnLabel;
    card.appendChild(btn);
    btn.addEventListener('click', async () => {
      if (item.upcoming) return;
      if (item.type === 'hat' && !isFrogActive) {
        card.classList.remove('lock-shake');
        void card.offsetWidth;
        card.classList.add('lock-shake');
        setTimeout(() => card.classList.remove('lock-shake'), 260);
        return;
      }
      const result = await updateLocal({ freePlayMode: false, unlockAll: false, coins: 0, shopOwned: [], shopActiveBoosts: null, activeBall: 'ball_baseball', activePet: 'pet_cat', companionPet: 'same', activeHat: 'hat_none' }, (fresh) => {
          const isFreePlay = !!(fresh.freePlayMode || fresh.unlockAll);
          const freshCoins = fresh.coins || 0;
          const freshOwned = Array.isArray(fresh.shopOwned) ? fresh.shopOwned : [];
          const freshOwnedSet = new Set(freshOwned);
          const freshActiveBoosts = Array.isArray(fresh.shopActiveBoosts)
            ? fresh.shopActiveBoosts
            : freshOwned.filter(id => SHOP_ITEMS.some(shopItem => shopItem.id === id && shopItem.type === 'boost'));
          const nowOwned = item.free || item.id === 'pet_cat' || isFreePlay || freshOwnedSet.has(item.id);

          if (item.type === 'ball') {
            if (nowOwned) {
              return {
                values: { activeBall: item.id },
                settings: { activeBall: item.id }
              };
            }
            if (freshCoins < item.price) return null;
            const newOwned = Array.from(new Set([...freshOwned, item.id]));
            return {
              values: { coins: freshCoins - item.price, shopOwned: newOwned, activeBall: item.id },
              settings: { activeBall: item.id, shopOwned: newOwned }
            };
          }

          if (item.type === 'hat') {
            if (nowOwned) {
              return {
                values: { activeHat: item.id },
                settings: { activeHat: item.id }
              };
            }
            if (freshCoins < item.price) return null;
            const newOwned = Array.from(new Set([...freshOwned, item.id]));
            return {
              values: { coins: freshCoins - item.price, shopOwned: newOwned, activeHat: item.id },
              settings: { activeHat: item.id, shopOwned: newOwned }
            };
          }

          if (item.type === 'pet') {
            const foxPatch = isNonCatPet(item.id) ? { aggressiveMode: false, uiMischiefEnabled: false } : {};
            const batPatch = isPet(item.id, 'bat') ? { companionEnabled: false } : {};
            const companionPatch = normalizeCompanionPetValue(fresh.companionPet, item.id) === 'same' && fresh.companionPet !== 'same'
              ? { companionPet: 'same' }
              : {};
            const skinKey = getSkinStorageKey(item.id);
            const defaultSkin = getDefaultSkinForPet(item.id);
            const skinResetPatch = { [skinKey]: defaultSkin };
            const petPatch = { ...foxPatch, ...batPatch, ...companionPatch, ...skinResetPatch };
            if (nowOwned) {
              return {
                values: { activePet: item.id, ...petPatch },
                settings: { activePet: item.id, ...petPatch }
              };
            }
            if (freshCoins < item.price) return null;
            const newOwned = Array.from(new Set([...freshOwned, item.id]));
            return {
              values: { coins: freshCoins - item.price, shopOwned: newOwned, activePet: item.id, ...petPatch },
              settings: { activePet: item.id, shopOwned: newOwned, ...petPatch }
            };
          }

          if (nowOwned) {
            const activeSet = new Set(freshActiveBoosts);
            if (activeSet.has(item.id)) activeSet.delete(item.id);
            else activeSet.add(item.id);
            const nextActive = Array.from(activeSet);
            return {
              values: { shopActiveBoosts: nextActive },
              settings: { shopActiveBoosts: nextActive }
            };
          }

          if (freshCoins < item.price) return null;
          const newOwned = Array.from(new Set([...freshOwned, item.id]));
          const newActive = Array.from(new Set([...freshActiveBoosts, item.id]));
          return {
            values: { coins: freshCoins - item.price, shopOwned: newOwned, shopActiveBoosts: newActive },
            settings: { shopOwned: newOwned, shopActiveBoosts: newActive }
          };
        });

        if (!result) return;
        if (result.settings) {
          sendMessageToTabs({ action: 'updateSettings', settings: result.settings }).catch(() => {});
          if (result.settings.companionEnabled === false) {
            sendMessageToTabs({ action: 'stopCompanion' }).catch(() => {});
          }
        }

        card.classList.add('just-bought');
        setTimeout(() => card.classList.remove('just-bought'), 500);
        await refreshShop();
        if (item.type === 'pet') {
          latestActivePet = item.id;
          applyPetSpecificLocks(latestActivePet);
          const fresh = await getLocal(defaultSettings);
          applyXpUI(fresh.catXP || 0, false);
          updateSkinSwatches(getActiveSkinFromData(fresh, latestActivePet), latestActivePet);

          await refreshQuests().catch(() => {});
        }
      });

    container.appendChild(card);
    return card;
  }

  async function performStreakClaim() {
    if (latestFreePlayMode) return;
    const today = getDateKey();
    const result = await updateLocal({ coins: 0, dailyStreak: 0, lastStreakDate: '', freePlayMode: false, unlockAll: false }, (data) => {
      if (data.freePlayMode || data.unlockAll) return null;
      if (data.lastStreakDate === today) return null;

      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      const isConsecutive = data.lastStreakDate === yKey;
      const newStreak = isConsecutive ? (data.dailyStreak || 0) + 1 : 1;

      const rewardIdx = Math.min(newStreak - 1, STREAK_REWARDS.length - 1);
      const reward = STREAK_REWARDS[rewardIdx];
      const newCoins = (data.coins || 0) + reward;

      return {
        values: { coins: newCoins, dailyStreak: newStreak, lastStreakDate: today },
        coins: newCoins
      };
    });
    if (!result) return;
    await refreshShop();

    if (coinCount) coinCount.textContent = result.coins.toLocaleString();
  }

  async function refreshShop() {
    const data = await getLocal({ coins: 0, shopOwned: [], shopActiveBoosts: null, dailyStreak: 0, lastStreakDate: '', activeBall: 'ball_baseball', activePet: 'pet_cat', activeHat: 'hat_none', reviewBannerDismissed: false, freePlayMode: false, unlockAll: false });
    const coins      = data.coins || 0;
    const owned      = Array.from(new Set(Array.isArray(data.shopOwned) ? data.shopOwned : []));
    const activeBoosts = Array.isArray(data.shopActiveBoosts)
      ? data.shopActiveBoosts
      : owned.filter(id => SHOP_ITEMS.some(item => item.id === id && item.type === 'boost'));
    const streak     = data.dailyStreak || 0;
    const lastDate   = data.lastStreakDate || '';
    const activeBall = data.activeBall || 'ball_baseball';
    const activePet  = data.activePet || 'pet_cat';
    const sandboxMode = !!(data.freePlayMode || data.unlockAll);
    const today      = getDateKey();

    const alreadyClaimed = lastDate === today;
    const rewardIdx  = Math.min(streak, STREAK_REWARDS.length - 1);
    const nextReward = STREAK_REWARDS[rewardIdx];

    const activeTab = document.querySelector('.tab-button.active')?.dataset.tab || 'essential';
    const isHomeSection = (activeTab === 'essential' && !document.body.classList.contains('info-panel-open'));

    if (homeBonusBanner) {
      if (isHomeSection && !sandboxMode && !alreadyClaimed) {
        homeBonusBanner.style.display = 'flex';
        if (homeBonusTitle) homeBonusTitle.textContent = t('dailyBonusReady');
        if (homeBonusSub) homeBonusSub.textContent = t('claimCoinsToday', { count: nextReward });
        if (homeBonusBtn) homeBonusBtn.textContent = t('claim') || 'Claim';
      } else {
        homeBonusBanner.style.display = 'none';
      }
    }

    let syncDismissed = false;
    try {
      if (API && API.storage && API.storage.sync) {
        const syncRes = await new Promise((res) => {
          try {
            const p = API.storage.sync.get({ reviewBannerDismissed: false }, (r) => {
              if (API.runtime && API.runtime.lastError) {}
              res(r);
            });
            if (p && typeof p.then === 'function') p.then(res).catch(() => res(null));
          } catch (_) {
            res(null);
          }
        });
        if (syncRes && syncRes.reviewBannerDismissed) syncDismissed = true;
      }
    } catch (e) {}

    const isDismissed = data.reviewBannerDismissed || syncDismissed;
    const reviewBanner = document.getElementById('reviewBanner');
    if (reviewBanner) {
      if (isHomeSection && !sandboxMode && !isDismissed) {
        reviewBanner.style.display = 'flex';
      } else {
        reviewBanner.style.display = 'none';
      }
    }

    if (shopBallsView) {
      shopBallsView.replaceChildren();
      const allBalls = SHOP_ITEMS.filter(i => i.type === 'ball');
      const PAGE_SIZE = 6;
      const totalPages = Math.ceil(allBalls.length / PAGE_SIZE);
      if (_shopBallPage >= totalPages) _shopBallPage = Math.max(0, totalPages - 1);
      const pageBalls = allBalls.slice(_shopBallPage * PAGE_SIZE, (_shopBallPage + 1) * PAGE_SIZE);

      pageBalls.forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopBallsView);
        card.style.animationDelay = `${idx * 40}ms`;
      });

      if (totalPages > 1) {
        const nav = document.createElement('div');
        nav.className = 'ball-page-nav';
        const prev = document.createElement('button');
        prev.className = 'ball-page-btn';
        prev.id = 'ballPrev';
        prev.disabled = _shopBallPage === 0;
        prev.textContent = '<';
        const label = document.createElement('span');
        label.className = 'ball-page-label';
        label.textContent = `${_shopBallPage + 1} / ${totalPages}`;
        const next = document.createElement('button');
        next.className = 'ball-page-btn';
        next.id = 'ballNext';
        next.disabled = _shopBallPage >= totalPages - 1;
        next.textContent = '>';
        nav.append(prev, label, next);
        shopBallsView.appendChild(nav);
        prev.addEventListener('click', () => {
          if (_shopBallPage > 0) { _shopBallPage--; refreshShop(); }
        });
        next.addEventListener('click', () => {
          if (_shopBallPage < totalPages - 1) { _shopBallPage++; refreshShop(); }
        });
      }
    }

    const shopHatsView = document.getElementById('shopHatsView');
    if (shopHatsView) {
      shopHatsView.replaceChildren();

      const activePet = data.activePet || 'pet_cat';
      const isFrogActive = isFrogPet(activePet);

      const hint = document.createElement('div');
      hint.style.gridColumn = '1 / -1';
      hint.style.textAlign = 'center';
      hint.style.fontSize = '11px';
      hint.style.fontWeight = '600';
      hint.style.color = '#ffaa22';
      hint.style.backgroundColor = 'rgba(255, 170, 34, 0.12)';
      hint.style.border = '1px solid rgba(255, 170, 34, 0.3)';
      hint.style.borderRadius = '6px';
      hint.style.padding = '6px 8px';
      hint.style.marginBottom = '6px';
      hint.style.whiteSpace = 'nowrap';
      hint.style.overflow = 'hidden';
      hint.style.textOverflow = 'ellipsis';
      hint.textContent = t('hatsHint');
      shopHatsView.appendChild(hint);

      const allHats = SHOP_ITEMS.filter(i => i.type === 'hat');
      const activeHat = data.activeHat || 'hat_none';
      const PAGE_SIZE = 6;
      const totalPages = Math.ceil(allHats.length / PAGE_SIZE);
      if (_shopHatPage >= totalPages) _shopHatPage = Math.max(0, totalPages - 1);
      const pageHats = allHats.slice(_shopHatPage * PAGE_SIZE, (_shopHatPage + 1) * PAGE_SIZE);

      pageHats.forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopHatsView, activeHat);
        card.style.animationDelay = `${idx * 40}ms`;
      });

      if (totalPages > 1) {
        const nav = document.createElement('div');
        nav.className = 'ball-page-nav';
        const prev = document.createElement('button');
        prev.className = 'ball-page-btn';
        prev.disabled = _shopHatPage === 0;
        prev.textContent = '<';
        const label = document.createElement('span');
        label.className = 'ball-page-label';
        label.textContent = `${_shopHatPage + 1} / ${totalPages}`;
        const next = document.createElement('button');
        next.className = 'ball-page-btn';
        next.disabled = _shopHatPage >= totalPages - 1;
        next.textContent = '>';
        nav.append(prev, label, next);
        shopHatsView.appendChild(nav);
        prev.addEventListener('click', () => {
          if (_shopHatPage > 0) { _shopHatPage--; refreshShop(); }
        });
        next.addEventListener('click', () => {
          if (_shopHatPage < totalPages - 1) { _shopHatPage++; refreshShop(); }
        });
      }
    }

    if (shopAnimalsView) {
      shopAnimalsView.replaceChildren();
      const allAnimals = SHOP_ITEMS.filter(i => i.type === 'pet' && i.subType === 'animal');
      const PAGE_SIZE = 6;
      const totalPages = Math.ceil(allAnimals.length / PAGE_SIZE);
      if (_shopAnimalPage >= totalPages) _shopAnimalPage = Math.max(0, totalPages - 1);
      const pageAnimals = allAnimals.slice(_shopAnimalPage * PAGE_SIZE, (_shopAnimalPage + 1) * PAGE_SIZE);

      pageAnimals.forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopAnimalsView);
        card.style.animationDelay = `${idx * 40}ms`;
      });

      if (totalPages > 1) {
        const nav = document.createElement('div');
        nav.className = 'ball-page-nav';
        const prev = document.createElement('button');
        prev.className = 'ball-page-btn';
        prev.disabled = _shopAnimalPage === 0;
        prev.textContent = '<';
        const label = document.createElement('span');
        label.className = 'ball-page-label';
        label.textContent = `${_shopAnimalPage + 1} / ${totalPages}`;
        const next = document.createElement('button');
        next.className = 'ball-page-btn';
        next.disabled = _shopAnimalPage >= totalPages - 1;
        next.textContent = '>';
        nav.append(prev, label, next);
        shopAnimalsView.appendChild(nav);
        prev.addEventListener('click', () => {
          if (_shopAnimalPage > 0) { _shopAnimalPage--; refreshShop(); }
        });
        next.addEventListener('click', () => {
          if (_shopAnimalPage < totalPages - 1) { _shopAnimalPage++; refreshShop(); }
        });
      }
    }

    if (shopCharactersView) {
      shopCharactersView.replaceChildren();
      const allCharacters = SHOP_ITEMS.filter(i => i.type === 'pet' && i.subType === 'character');
      const PAGE_SIZE = 6;
      const totalPages = Math.max(1, Math.ceil(allCharacters.length / PAGE_SIZE));
      if (_shopCharacterPage >= totalPages) _shopCharacterPage = Math.max(0, totalPages - 1);
      const pageCharacters = allCharacters.slice(_shopCharacterPage * PAGE_SIZE, (_shopCharacterPage + 1) * PAGE_SIZE);

      pageCharacters.forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopCharactersView);
        card.style.animationDelay = `${idx * 40}ms`;
      });

      if (totalPages >= 1) {
        const nav = document.createElement('div');
        nav.className = 'ball-page-nav';
        const prev = document.createElement('button');
        prev.className = 'ball-page-btn';
        prev.disabled = _shopCharacterPage === 0;
        prev.textContent = '<';
        const label = document.createElement('span');
        label.className = 'ball-page-label';
        label.textContent = `${_shopCharacterPage + 1} / ${totalPages}`;
        const next = document.createElement('button');
        next.className = 'ball-page-btn';
        next.disabled = _shopCharacterPage >= totalPages - 1;
        next.textContent = '>';
        nav.append(prev, label, next);
        shopCharactersView.appendChild(nav);
        prev.addEventListener('click', () => {
          if (_shopCharacterPage > 0) { _shopCharacterPage--; refreshShop(); }
        });
        next.addEventListener('click', () => {
          if (_shopCharacterPage < totalPages - 1) { _shopCharacterPage++; refreshShop(); }
        });
      }
    }

    if (shopBoostsView) {
      shopBoostsView.replaceChildren();
      SHOP_ITEMS.filter(i => i.type === 'boost').forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopBoostsView);
        card.style.animationDelay = `${idx * 40}ms`;
      });
    }
  }

  if (homeBonusBtn) {
    homeBonusBtn.addEventListener('click', performStreakClaim);
  }

  const reviewClaimBtn = document.getElementById('reviewClaimBtn');

  if (reviewClaimBtn) {
    reviewClaimBtn.addEventListener('click', async () => {
      if (latestFreePlayMode) return;
      const reviewBanner = document.getElementById('reviewBanner');
      if (reviewBanner) {
        reviewBanner.style.transition = 'opacity 0.25s ease';
        reviewBanner.style.opacity = '0';
        setTimeout(() => { reviewBanner.style.display = 'none'; reviewBanner.style.opacity = ''; }, 260);
      }
      try {
        if (API && API.storage && API.storage.sync) {
          const p = API.storage.sync.set({ reviewBannerDismissed: true }, () => {
            if (API.runtime && API.runtime.lastError) {}
          });
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      } catch (err) {}
      const result = await updateLocal({ coins: 0, reviewBannerDismissed: false, freePlayMode: false, unlockAll: false }, (data) => {
        if (data.freePlayMode || data.unlockAll) return null;
        if (data.reviewBannerDismissed) return null;
        const newCoins = (data.coins || 0) + 50;
        return {
          values: { coins: newCoins, reviewBannerDismissed: true },
          coins: newCoins
        };
      });
      if (result && coinCount) {
        coinCount.textContent = result.coins.toLocaleString();
      }
      await refreshShop().catch(() => {});
      const isFirefox = typeof browser !== 'undefined' || navigator.userAgent.includes('Firefox');
      const reviewUrl = isFirefox
        ? 'https://addons.mozilla.org/en-US/firefox/addon/pixelcat/reviews/'
        : `https://chromewebstore.google.com/detail/${API.runtime.id}/reviews`;
      window.open(reviewUrl, '_blank');
    });
  }

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'shop') refreshShop().catch(() => {});
    });
  });

  if (API.storage && API.storage.onChanged) {
    let refreshScheduled = false;
    const schedulePopupRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      setTimeout(() => {
        refreshScheduled = false;
        refresh().catch(() => {});
        refreshShop().catch(() => {});
      }, 80);
    };

    API.storage.onChanged.addListener((changes, areaName) => {
      if (areaName && areaName !== 'local') return;
      if (!changes) return;
      const keys = Object.keys(changes);
      const affectsProgress = keys.some((key) => [
        'catXP', 'coins', 'dailyQuestState', 'dailyQuestStats',
        'dailyStreak', 'lastStreakDate', 'shopOwned', 'shopActiveBoosts', 'activeBall', 'activePet', 'activeHat',
        'freePlayMode', 'unlockAll'
      ].includes(key));
      if (affectsProgress) schedulePopupRefresh();
    });
  }

  refreshShop().catch(() => {});
})();
