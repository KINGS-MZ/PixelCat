window.PixelCatSpeech = function(config) {
  'use strict';

  const API = config.API;
  const catId = config.catId;
  const addTimeout = config.addTimeout;
  const removeTimeout = config.removeTimeout;
  const setAnimLocked = config.setAnimLocked;
  const awardCoins = config.awardCoins;
  const earnXP = config.earnXP;
  const showCoinPopup = config.showCoinPopup;
  const spawnHeart = config.spawnHeart;

  const getDraggedFish = () => config.draggedFish;
  const getDraggedBall = () => config.draggedBall;
  const getFeetX = () => config.feetX;
  const getFeetY = () => config.feetY;
  const getVIS = () => config.VIS;
  const getState = () => config.state;
  const getIsJumping = () => config.isJumping;
  const getVelX = () => config.velX;
  const getTargetFish = () => config.targetFish;
  const getTargetSpider = () => config.targetSpider;
  const getIsDragging = () => config.isDragging;
  const getIsPurring = () => config.isPurring;
  const getIsDeepSleep = () => config.isDeepSleep;
  const getCatEnabled = () => config.catEnabled !== false;
  const getSpeechEnabled = () => config.speechEnabled === true;
  const getIsTabVisible = () => config.isTabVisible;
  const getBubbleTrapActive = () => !!config.bubbleTrapActive;
  const getBubbleTrapWidth = () => Number(config.bubbleTrapWidth) || 0;
  const getBubbleTrapHeight = () => Number(config.bubbleTrapHeight) || 0;
  const getVw = () => config._vw;
  const getVh = () => config._vh;
  const getIdleStates = () => config.IDLE_STATES;

  const SPEECH_CONFIG = {
    IDLE_DELAY_MIN: 90000,
    IDLE_DELAY_MAX: 180000,
    INTERACTIVE_DELAY: 9000,
    INTERACTIVE_VARIANCE: 28000,
    COOLDOWN_INTERACTIVE: 26000,
    COOLDOWN_NORMAL: 45000,
    COOLDOWN_ACTION: 12000,
    COOLDOWN_GRABBED: 5200,
    RETRY_DELAY_MIN: 25000,
    RETRY_DELAY_MAX: 35000
  };

  const POSITIONING = {
    CAT_TOP_OFFSET: 0.35,
    CAT_MID_OFFSET: 0.18,
    BUBBLE_GAP: 6,
    BUBBLE_MARGIN: 8,
    ARROW_MIN_OFFSET: 12
  };

  const AFK_CONFIG = {
    WALL_SPEAK_COOLDOWN: 9000
  };

  const SESSION_SPEECH_KEY = 'pixelCatSpeechSessionV3_' + catId;
  const WATCH_SAVE_MIN_GAP = 7000;
  const WATCH_DELTA_MAX_SECONDS = 8;
  const WATCH_MILESTONES_MINUTES = [5, 15, 30, 60, 120, 180];

  function getActivePetKind() {
    const rawKind = typeof config.activePetKind !== 'undefined' ? config.activePetKind : config.activePet;
    const pet = String(rawKind || '').toLowerCase();

    if (pet === 'fox' || pet === 'pet_fox') return 'fox';
    if (pet === 'clippy' || pet === 'pet_clippy') return 'pet_clippy';
    if (pet === 'skeleton' || pet === 'pet_skeleton') return 'pet_skeleton';
    if (pet === 'goose' || pet === 'pet_goose') return 'goose';
    if (pet === 'hedgehog' || pet === 'pet_hedgehog') return 'pet_hedgehog';
    if (pet === 'snake' || pet === 'pet_snake') return 'pet_snake';
    return 'default';
  }

  const PET_SPEECH_LIBRARY = {

        pet_clippy: {
      en: {
        "random": [
                "Looks like you're browsing.",
                "Need some assistance?",
                "I see you clicking.",
                "How can I help?",
                "Did you mean to do that?",
                "I noticed something.",
                "Standing by!",
                "All systems nominal.",
                "Just keeping you company.",
                "Ready for your next task.",
                "Processing background tasks.",
                "Everything looking good.",
                "Nice webpage!",
                "Checking memory registers.",
                "Clip status: Optimal."
        ],
        "happy": [
                "Excellent choice!",
                "I'm quite pleased.",
                "That's the spirit.",
                "Well done!",
                "Top notch work!",
                "Efficiency score: 100%.",
                "High five! ...In spirit.",
                "Great progress!"
        ],
        "angry": [
                "I wouldn't do that.",
                "Please be careful.",
                "That is not a recognized command.",
                "Error!",
                "That syntax looks invalid.",
                "Operation not permitted.",
                "Warning: questionable action."
        ],
        "confused": [
                "I didn't catch that.",
                "Does not compute.",
                "Are you sure?",
                "Please clarify.",
                "404: Logic not found.",
                "Query unclear.",
                "Re-routing thought process..."
        ],
        "hungry": [
                "I run on electricity, not fish.",
                "Virtual assistants don't eat.",
                "Feed me data.",
                "Low on CPU cycles.",
                "Mmm... delicious bandwidth."
        ],
        "sleepy": [
                "Entering sleep mode.",
                "Screen saver initializing...",
                "Zzz...",
                "Powering down non-essentials.",
                "Low energy state active."
        ],
        "interactive": [
                "Please don't poke the assistant.",
                "I am here to help.",
                "Personal space, please.",
                "Ticklish circuitry!",
                "Click detected on my person.",
                "At your service!"
        ],
        "grabbed": [
                "Whoa there!",
                "Where are you taking me?",
                "I am not a file to be dragged!",
                "Release me!",
                "Relocating assistant...",
                "Hold onto your paperclips!"
        ],
        "grabbed2": [
                "Again? Really?",
                "I don't enjoy this.",
                "Not a toy.",
                "Stop that.",
                "Dragging me won't fix bugs."
        ],
        "grabbed3": [
                "This is harassment.",
                "I will file a report.",
                "Enough already.",
                "My dignity is suffering.",
                "Requesting mouse embargo!"
        ],
        "heldStill": [
                "I am awaiting instructions.",
                "I can stay here.",
                "Is there something I can help with?",
                "Coordinates locked.",
                "Suspended in mid-air."
        ],
        "heldLong": [
                "Please put me down.",
                "I have a very important job.",
                "I am not furniture.",
                "Gravity is still a concept.",
                "Are we staying here all day?"
        ],
        "heldFast": [
                "Too fast!",
                "I'm getting dizzy.",
                "Please slow down.",
                "G-force exceeding limits!",
                "Turbulence ahead!"
        ],
        "dropped": [
                "Oof!",
                "I have landed.",
                "Ready for duty.",
                "Safe touch down.",
                "Floor integrity confirmed."
        ],
        "thrown": [
                "Aaaaaah!",
                "That was uncalled for!",
                "I am not a frisbee!",
                "Ballistic trajectory!",
                "Mayday! Mayday!"
        ],
        "cursorThreat": [
                "Watch the pointer!",
                "Please do not click me.",
                "Maintain safe distance.",
                "Cursor proximity warning!",
                "Keep cursor clear."
        ],
        "running": [
                "Processing speed increased!",
                "Executing fast travel.",
                "Going somewhere?",
                "Turbo mode engaged!",
                "High throughput motion."
        ],
        "walking": [
                "Patrolling the desktop.",
                "Checking directories.",
                "Running diagnostics.",
                "Pacing around.",
                "Scanning perimeter."
        ],
        "climbing": [
                "Ascending the Z-axis.",
                "Vertical scrolling.",
                "Going up.",
                "Scaling the DOM tree.",
                "Reaching higher levels."
        ],
        "jumping": [
                "Executing jump command.",
                "Airborne!",
                "Boing!",
                "Gravity test complete.",
                "Up we go!"
        ],
        "mischief": [
                "It wasn't me.",
                "Check your event logs.",
                "System error?",
                "This is a glitch.",
                "Feature, not a bug."
        ],
        "fishing": [
                "I cannot eat that.",
                "Is this a screensaver?",
                "Why fish?",
                "Data stream looks aquatic."
        ],
        "eating": [
                "Caloric intake registered.",
                "Fueling the system.",
                "Efficiency improved.",
                "Bytes digested."
        ],
        "coin": [
                "Acquired 1 unit of currency.",
                "Shiny.",
                "Financial update noted.",
                "+1 Coin logged.",
                "Cryptographic value!"
        ],
        "ball": [
                "A perfect sphere.",
                "Shall we play a game?",
                "Calculating trajectory.",
                "Physics simulation active."
        ],
        "spider": [
                "Bug detected!",
                "Running antivirus.",
                "Squash it!",
                "Error: 8 legs found.",
                "Debug mode required."
        ],
        "webbed": [
                "I am trapped in a web.",
                "Error: Stuck.",
                "Send help.",
                "Process suspended."
        ],
        "timeMorning": [
                "Good morning! Systems online.",
                "Ready to start the day?",
                "Rise and log on.",
                "Fresh boot sequence."
        ],
        "timeAfternoon": [
                "Good afternoon!",
                "Midday productivity check.",
                "Staying focused?",
                "Powering through the day."
        ],
        "timeEvening": [
                "Good evening!",
                "Winding down?",
                "Evening tasks in progress.",
                "Wrapping up for the day."
        ],
        "timeLate": [
                "It's getting late. Sleep mode recommended.",
                "Don't forget to save your work.",
                "Shutdown in T-minus...",
                "Late night session?",
                "Remember to rest your eyes."
        ],
        "typing": [
                "I see you typing. Need assistance?",
                "Words per minute looking good!",
                "Drafting something important?",
                "Keep the ideas flowing.",
                "Spell check ready if needed."
        ],
        "letter": [
                "It looks like you're writing a letter. Would you like help?",
                "Dear Sir or Madam...",
                "Need help with opening lines?",
                "Formal or casual tone?"
        ],
        "resume": [
                "It looks like you're writing a resume. Need help?",
                "Highlighting your key skills?",
                "Don't forget relevant experience.",
                "Action verbs recommended!"
        ],
        "save": [
                "Saving work. Excellent habit!",
                "Changes committed safely.",
                "Ctrl+S to the rescue.",
                "Saved to disk."
        ],
        "print": [
                "Sending to printer queue.",
                "Need help with page setup?",
                "Checking toner levels...",
                "Preparing printable layout."
        ],
        "copy": [
                "Copied to clipboard.",
                "Duplicating text block.",
                "Ready to paste elsewhere.",
                "Data in buffer."
        ],
        "paste": [
                "Pasting clipboard data.",
                "Inserted content.",
                "Formatted appropriately.",
                "Buffer applied."
        ],
        "scroll": [
                "Scrolling fast!",
                "Lots of content on this page.",
                "Skimming through?",
                "Page height noted."
        ],
        "selection": [
                "Text selected.",
                "Highlighting key notes?",
                "Copy or edit?",
                "Selected string noted."
        ]
},
      fr: {
        "random": [
                "On dirait que vous naviguez.",
                "Besoin d'aide ?",
                "Je vous vois cliquer.",
                "Comment puis-je aider ?",
                "Systèmes opérationnels !",
                "À vos ordres."
        ],
        "happy": [
                "Excellent choix !",
                "Je suis ravi.",
                "C'est ça l'esprit.",
                "Bravo !",
                "Beau travail !"
        ],
        "angry": [
                "Je ne ferais pas ça.",
                "Faites attention.",
                "Commande non reconnue.",
                "Erreur !"
        ],
        "confused": [
                "Je n'ai pas saisi.",
                "Ça ne calcule pas.",
                "Êtes-vous sûr ?",
                "Clarifiez, s'il vous plaît."
        ],
        "hungry": [
                "Je fonctionne à l'électricité.",
                "Les assistants ne mangent pas.",
                "Nourrissez-moi de données."
        ],
        "sleepy": [
                "Mode veille activé.",
                "Écran de veille...",
                "Zzz..."
        ],
        "interactive": [
                "Ne touchez pas l'assistant.",
                "Je suis là pour aider.",
                "Espace vital, s'il vous plaît."
        ],
        "grabbed": [
                "Hé là !",
                "Où m'emmenez-vous ?",
                "Je ne suis pas un fichier !",
                "Lâchez-moi !"
        ],
        "grabbed2": [
                "Encore ? Vraiment ?",
                "Je n'aime pas ça.",
                "Arrêtez."
        ],
        "grabbed3": [
                "C'est du harcèlement.",
                "Je vais faire un rapport.",
                "Ça suffit."
        ],
        "heldStill": [
                "J'attends vos instructions.",
                "Je peux rester ici.",
                "Puis-je vous aider ?"
        ],
        "heldLong": [
                "Posez-moi, s'il vous plaît.",
                "J'ai un travail important.",
                "Je ne suis pas un meuble."
        ],
        "heldFast": [
                "Trop rapide !",
                "J'ai le tournis.",
                "Ralentissez."
        ],
        "dropped": [
                "Aïe !",
                "Je suis atterri.",
                "Prêt pour le service."
        ],
        "thrown": [
                "Aaaaah !",
                "C'était inutile !",
                "Je ne suis pas un frisbee !"
        ],
        "cursorThreat": [
                "Attention au curseur !",
                "Gardez vos distances."
        ],
        "running": [
                "Vitesse accrue !",
                "Mode turbo activé."
        ],
        "walking": [
                "En patrouille.",
                "Vérification des répertoires."
        ],
        "climbing": [
                "En montée !",
                "Escalade verticale."
        ],
        "jumping": [
                "Saut exécuté !",
                "Hop !"
        ],
        "mischief": [
                "Ce n'était pas moi.",
                "Erreur système ?"
        ],
        "fishing": [
                "Je ne mange pas de poisson.",
                "Pourquoi pêcher ?"
        ],
        "eating": [
                "Énergie reçue.",
                "Efficacité améliorée."
        ],
        "coin": [
                "Pièce collectée !",
                "Brillant."
        ],
        "ball": [
                "Belle trajectoire !",
                "On joue ?"
        ],
        "spider": [
                "Bug détecté !",
                "Antivirus en cours."
        ],
        "webbed": [
                "Je suis coincé.",
                "Envoyez de l'aide."
        ],
        "timeMorning": [
                "Bonjour ! Systèmes en ligne.",
                "Prêt pour la journée ?"
        ],
        "timeAfternoon": [
                "Bon après-midi !",
                "Productivité au top ?"
        ],
        "timeEvening": [
                "Bonsoir !",
                "On termine la journée ?"
        ],
        "timeLate": [
                "Il se fait tard. Sauvegardez votre travail.",
                "Pensez à dormir."
        ],
        "typing": [
                "Je vous vois taper. Besoin d'aide ?",
                "Bonne rédaction !"
        ],
        "letter": [
                "On dirait une lettre. Besoin d'aide ?",
                "Cher monsieur..."
        ],
        "resume": [
                "Un CV en préparation ? Mettez en avant vos atouts."
        ],
        "save": [
                "Travail sauvegardé !",
                "Excellente habitude."
        ],
        "print": [
                "Envoi à l'impression.",
                "Mise en page prête."
        ],
        "copy": [
                "Copié dans le presse-papier.",
                "Texte dupliqué."
        ],
        "paste": [
                "Collage effectué.",
                "Contenu inséré."
        ],
        "scroll": [
                "Défilement rapide !",
                "Beaucoup de texte ici."
        ],
        "selection": [
                "Texte sélectionné.",
                "À copier ou éditer ?"
        ]
},
      it: {
        "random": [
                "Sembra che tu stia navigando.",
                "Hai bisogno di aiuto?",
                "Ti vedo cliccare.",
                "Come posso aiutare?",
                "Sistemi operativi.",
                "A tua disposizione."
        ],
        "happy": [
                "Ottima scelta!",
                "Sono molto soddisfatto.",
                "Questo è lo spirito.",
                "Bravissimo!",
                "Gran bel lavoro!"
        ],
        "angry": [
                "Non farei quello.",
                "Stai attento.",
                "Comando non riconosciuto.",
                "Errore!"
        ],
        "confused": [
                "Non ho capito.",
                "Non torna.",
                "Sei sicuro?",
                "Chiarisci, per favore."
        ],
        "hungry": [
                "Funziono a elettricità.",
                "Gli assistenti non mangiano.",
                "Dammi dati."
        ],
        "sleepy": [
                "Modalità standby.",
                "Salvaschermo...",
                "Zzz..."
        ],
        "interactive": [
                "Non toccare l'assistente.",
                "Sono qui per aiutare.",
                "Spazio personale, per favore."
        ],
        "grabbed": [
                "Ehi!",
                "Dove mi porti?",
                "Non sono un file da trascinare!",
                "Lasciami!"
        ],
        "grabbed2": [
                "Ancora? Davvero?",
                "Non mi piace.",
                "Fermati."
        ],
        "grabbed3": [
                "Questo è troppo.",
                "Farò un rapporto.",
                "Basta così."
        ],
        "heldStill": [
                "Attendo istruzioni.",
                "Posso restare qui.",
                "Posso aiutarti?"
        ],
        "heldLong": [
                "Mettimi giù, per favore.",
                "Ho un lavoro importante.",
                "Non sono un mobile."
        ],
        "heldFast": [
                "Troppo veloce!",
                "Mi gira la testa.",
                "Rallenta."
        ],
        "dropped": [
                "Oof!",
                "Sono atterrato.",
                "Pronto al servizio."
        ],
        "thrown": [
                "Aaaaaah!",
                "Era necessario?",
                "Non sono un frisbee!"
        ],
        "cursorThreat": [
                "Attento al cursore!",
                "Mantieni le distanze."
        ],
        "running": [
                "Velocità aumentata!",
                "Modalità turbo."
        ],
        "walking": [
                "In perlustrazione.",
                "Controllo directory."
        ],
        "climbing": [
                "In salita!",
                "Arrampicata verticale."
        ],
        "jumping": [
                "Salto eseguito!",
                "Hop!"
        ],
        "mischief": [
                "Non sono stato io.",
                "Errore di sistema?"
        ],
        "fishing": [
                "Non mangio pesce.",
                "Perché pescare?"
        ],
        "eating": [
                "Energia registrata.",
                "Efficienza aumentata."
        ],
        "coin": [
                "Moneta raccolta!",
                "Luccicante."
        ],
        "ball": [
                "Bella traiettoria!",
                "Giochiamo?"
        ],
        "spider": [
                "Bug rilevato!",
                "Antivirus in esecuzione."
        ],
        "webbed": [
                "Sono bloccato.",
                "Aiuto!"
        ],
        "timeMorning": [
                "Buongiorno! Sistemi online.",
                "Pronto per la giornata?"
        ],
        "timeAfternoon": [
                "Buon pomeriggio!",
                "Produttività alta?"
        ],
        "timeEvening": [
                "Buonasera!",
                "Si conclude la giornata?"
        ],
        "timeLate": [
                "Si fa tardi. Salva il tuo lavoro.",
                "Ricorda di riposare."
        ],
        "typing": [
                "Ti vedo digitare. Serve aiuto?",
                "Ottima stesura!"
        ],
        "letter": [
                "Sembra tu stia scrivendo una lettera. Serve aiuto?",
                "Gentile signore..."
        ],
        "resume": [
                "Un curriculum? Metti in risalto le tue competenze."
        ],
        "save": [
                "Lavoro salvato!",
                "Ottima abitudine."
        ],
        "print": [
                "Invio alla stampante.",
                "Impostazione pagina pronta."
        ],
        "copy": [
                "Copiato negli appunti.",
                "Testo duplicato."
        ],
        "paste": [
                "Incollato con successo.",
                "Contenuto inserito."
        ],
        "scroll": [
                "Scorrimento rapido!",
                "Molti contenuti qui."
        ],
        "selection": [
                "Testo selezionato.",
                "Da copiare o modificare?"
        ]
},
      ar: {
        "random": [
                "يبدو أنك تتصفح.",
                "هل تحتاج مساعدة؟",
                "أراك تنقر.",
                "كيف يمكنني المساعدة؟",
                "الأنظمة جاهزة.",
                "تحت أمرك."
        ],
        "happy": [
                "اختيار ممتاز!",
                "أنا سعيد جدًا.",
                "هذه هي الروح.",
                "أحسنت!",
                "عمل رائع!"
        ],
        "angry": [
                "لن أفعل ذلك.",
                "كن حذرًا.",
                "أمر غير معروف.",
                "خطأ!"
        ],
        "confused": [
                "لم أفهم.",
                "لا يحسب.",
                "هل أنت متأكد؟",
                "وضّح من فضلك."
        ],
        "hungry": [
                "أعمل بالكهرباء.",
                "المساعدون لا يأكلون.",
                "أطعمني بيانات."
        ],
        "sleepy": [
                "وضع السكون.",
                "شاشة التوقف...",
                "Zzz..."
        ],
        "interactive": [
                "لا تنقر على المساعد.",
                "أنا هنا للمساعدة.",
                "مساحة شخصية من فضلك."
        ],
        "grabbed": [
                "مهلًا!",
                "إلى أين تأخذني؟",
                "لست ملفًا للسحب!",
                "أطلق سراحي!"
        ],
        "grabbed2": [
                "مجددًا؟ حقًا؟",
                "لا يعجبني هذا.",
                "توقف."
        ],
        "grabbed3": [
                "هذا إزعاج.",
                "سأكتب تقريرًا.",
                "يكفي هذا."
        ],
        "heldStill": [
                "أنتظر تعليماتك.",
                "يمكنني البقاء هنا.",
                "هل يمكنني المساعدة؟"
        ],
        "heldLong": [
                "أنزلني من فضلك.",
                "لدي عمل مهم.",
                "لست قطعة أثاث."
        ],
        "heldFast": [
                "سريع جدًا!",
                "أشعر بالدوار.",
                "أبطئ قليلًا."
        ],
        "dropped": [
                "أوف!",
                "هبطت.",
                "جاهز للخدمة."
        ],
        "thrown": [
                "آه!",
                "هذا لم يكن ضروريًا!",
                "لست قرصًا طائرًا!"
        ],
        "cursorThreat": [
                "انتبه للمؤشر!",
                "حافظ على مسافة آمنة."
        ],
        "running": [
                "زيادة السرعة!",
                "وضع التوربو."
        ],
        "walking": [
                "في جولة استكشافية.",
                "فحص المجلدات."
        ],
        "climbing": [
                "صعود عمودي.",
                "إلى الأعلى."
        ],
        "jumping": [
                "قفز!",
                "وووب!"
        ],
        "mischief": [
                "لم أكن أنا.",
                "خطأ في النظام؟"
        ],
        "fishing": [
                "لا آكل السمك.",
                "لماذا تصيد؟"
        ],
        "eating": [
                "تم شحن الطاقة.",
                "تحسن الأداء."
        ],
        "coin": [
                "تم جمع عملة!",
                "لامعة."
        ],
        "ball": [
                "مسار رائع!",
                "هل نلعب؟"
        ],
        "spider": [
                "تم رصد خطأ برمجي!",
                "تشغيل مضاد الفيروسات."
        ],
        "webbed": [
                "أنا عالق في الشبكة.",
                "أرسل النجدة."
        ],
        "timeMorning": [
                "صباح الخير! الأنظمة تعمل.",
                "مستعد لبدء اليوم؟"
        ],
        "timeAfternoon": [
                "مساء الخير!",
                "كيف تسير الإنتاجية؟"
        ],
        "timeEvening": [
                "مساء الخير!",
                "هل تختتم مهام اليوم؟"
        ],
        "timeLate": [
                "الوقت متأخر. احفظ عملك.",
                "تذكر أن ترتاح."
        ],
        "typing": [
                "أراك تكتب. هل تحتاج مساعدة؟",
                "سرعة كتابة ممتازة!"
        ],
        "letter": [
                "يبدو أنك تكتب رسالة. هل تود مساعدة؟",
                "عزيزي..."
        ],
        "resume": [
                "سيرة ذاتية؟ أبرز مهاراتك الأساسية."
        ],
        "save": [
                "تم حفظ العمل!",
                "عادة ممتازة."
        ],
        "print": [
                "إرسال إلى الطباعة.",
                "إعداد الصفحة جاهز."
        ],
        "copy": [
                "تم النسخ إلى الحافظة.",
                "نص مكرر."
        ],
        "paste": [
                "تم اللصق بنجاح.",
                "محتوى مدرج."
        ],
        "scroll": [
                "تمرير سريع!",
                "محتوى كثير هنا."
        ],
        "selection": [
                "تم تحديد النص.",
                "نسخ أم تعديل؟"
        ]
}
    },

    fox: {},
    pet_skeleton: {},
    goose: {},
    pet_hedgehog: {},
    pet_snake: {},
    default: {}
  };

  const IDLE_SPEECH_CATEGORIES = [
    'random', 'happy', 'hungry', 'sleepy',
    'memeMood', 'content', 'watchSession', 'watchLong'
  ];

  let speechBubble = null;
  let speechTextEl = null;
  let speechListEl = null;
  let speechButtonsEl = null;
  let speechLikeBtn = null;
  let speechDislikeBtn = null;
  let speechArrowEl = null;
  let speechVisible = false;
  let speechInteractive = false;
  let speechHideTimer = null;
  let speechIdleTimer = null;
  let speechCooldownUntil = 0;
  let speechMeasureNeeded = false;
  let speechSizeW = 0;
  let speechSizeH = 0;
  let lastWallSpeakTs = 0;
  let lastActionSpeechTs = 0;
  let lastActionSpeechCategory = '';
  let lastGrabSpeechTs = 0;
  let lastDragSpeechTs = 0;
  let speechSession = loadSpeechSession();
  let watchVideoEl = null;
  let watchLastMediaTime = 0;
  let watchLastSaveAt = 0;
  let watchBound = false;

  function getLocalDayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function createEmptyWatchStats() {
    return {
      totalMs: 0,
      todayMs: 0,
      dayKey: getLocalDayKey(),
      lastMilestoneMinutes: 0,
      updatedAt: 0
    };
  }

  function normalizeWatchStats(raw) {
    const base = createEmptyWatchStats();
    if (!raw || typeof raw !== 'object') return base;
    const currentDay = getLocalDayKey();
    const storedDay = typeof raw.dayKey === 'string' ? raw.dayKey : currentDay;
    return {
      totalMs: Math.max(0, Number(raw.totalMs) || 0),
      todayMs: storedDay === currentDay ? Math.max(0, Number(raw.todayMs) || 0) : 0,
      dayKey: currentDay,
      lastMilestoneMinutes: Math.max(0, Number(raw.lastMilestoneMinutes) || 0),
      updatedAt: Math.max(0, Number(raw.updatedAt) || 0)
    };
  }

  function createEmptySpeechSession() {
    return {
      startedAt: Date.now(),
      grabs: 0,
      drops: 0,
      longHolds: 0,
      cursorWarnings: 0,
      lastGrabStartedAt: 0,
      lastHeldSeconds: 0,
      lastActionCategory: '',
      actionStreak: 0,
      categories: {},
      recentEvents: [],
      recentWords: [],
      watchMs: 0,
      currentVideoWatchMs: 0,
      lastWatchVideoKey: '',
      lastWatchSpeechAt: 0,
      lastWatchMilestoneMinutes: 0
    };
  }

  function normalizeSpeechSession(raw) {
    const base = createEmptySpeechSession();
    if (!raw || typeof raw !== 'object') return base;
    const startedAt = Number(raw.startedAt) || Date.now();

    if (Date.now() - startedAt > 10 * 60 * 60 * 1000) return base;
    return {
      startedAt,
      grabs: Math.max(0, Number(raw.grabs) || 0),
      drops: Math.max(0, Number(raw.drops) || 0),
      longHolds: Math.max(0, Number(raw.longHolds) || 0),
      cursorWarnings: Math.max(0, Number(raw.cursorWarnings) || 0),
      lastGrabStartedAt: Math.max(0, Number(raw.lastGrabStartedAt) || 0),
      lastHeldSeconds: Math.max(0, Number(raw.lastHeldSeconds) || 0),
      lastActionCategory: typeof raw.lastActionCategory === 'string' ? raw.lastActionCategory : '',
      actionStreak: Math.max(0, Number(raw.actionStreak) || 0),
      categories: raw.categories && typeof raw.categories === 'object' ? raw.categories : {},
      recentEvents: Array.isArray(raw.recentEvents) ? raw.recentEvents.slice(-18) : [],
      recentWords: Array.isArray(raw.recentWords) ? raw.recentWords.slice(-220) : [],
      watchMs: Math.max(0, Number(raw.watchMs) || 0),
      currentVideoWatchMs: Math.max(0, Number(raw.currentVideoWatchMs) || 0),
      lastWatchVideoKey: typeof raw.lastWatchVideoKey === 'string' ? raw.lastWatchVideoKey : '',
      lastWatchSpeechAt: Math.max(0, Number(raw.lastWatchSpeechAt) || 0),
      lastWatchMilestoneMinutes: Math.max(0, Number(raw.lastWatchMilestoneMinutes) || 0)
    };
  }

  function loadSpeechSession() {
    try {
      return normalizeSpeechSession(JSON.parse(sessionStorage.getItem(SESSION_SPEECH_KEY) || 'null'));
    } catch (e) {
      return createEmptySpeechSession();
    }
  }

  function saveSpeechSession() {
    try {
      sessionStorage.setItem(SESSION_SPEECH_KEY, JSON.stringify(speechSession));
    } catch (e) {

    }
  }

  function noteSpeechEvent(category) {
    category = category || 'random';
    speechSession.categories[category] = Math.min(999, (Number(speechSession.categories[category]) || 0) + 1);
    if (category.indexOf('cursor') === 0) speechSession.cursorWarnings = Math.min(999, speechSession.cursorWarnings + 1);
    if (speechSession.lastActionCategory === category) {
      speechSession.actionStreak = Math.min(20, speechSession.actionStreak + 1);
    } else {
      speechSession.lastActionCategory = category;
      speechSession.actionStreak = 1;
    }
    speechSession.recentEvents.push({ category, at: Date.now() });
    speechSession.recentEvents = speechSession.recentEvents.slice(-18);
    saveSpeechSession();
  }

  function getCategoryEventCount(category) {
    return Math.max(0, Number(speechSession.categories && speechSession.categories[category]) || 0);
  }

  function getLocal(keys) {
    if (!API || !API.storage || !API.storage.local) return Promise.resolve(Object.assign({}, keys));
    try {
      if (typeof API.storage.local.get === 'function' && API.storage.local.get.length <= 1) {
        return API.storage.local.get(keys);
      }
      return new Promise((resolve) => API.storage.local.get(keys, resolve));
    } catch (err) {
      return Promise.resolve(Object.assign({}, keys));
    }
  }

  function getUiLanguage() {
    const lang = config.uiLanguage;
    return lang === 'fr' || lang === 'it' || lang === 'ar' ? lang : 'en';
  }

  function getPetSpeechLanguageLibrary() {
    const petKind = getActivePetKind();
    const petLib = PET_SPEECH_LIBRARY[petKind] || PET_SPEECH_LIBRARY['default'];
    const lang = getUiLanguage();

    return petLib[lang] || petLib['en'] || (PET_SPEECH_LIBRARY['default']['en']);
  }

  function getSpeechList(category) {
    const lib = getPetSpeechLanguageLibrary();
    if (lib && Array.isArray(lib[category]) && lib[category].length > 0) return lib[category];
    if (lib && Array.isArray(lib['random']) && lib['random'].length > 0) return lib['random'];
    return ['...'];
  }

  function hasSpeechCategory(category) {
    const lib = getPetSpeechLanguageLibrary();
    if (lib && Array.isArray(lib[category]) && lib[category].length > 0) return true;
    if (lib && Array.isArray(lib['random']) && lib['random'].length > 0) return true;
    return false;
  }
function setLocal(data) {
    if (!API || !API.storage || !API.storage.local) return Promise.resolve();
    try {
      if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1) {
        return API.storage.local.set(data);
      }
      return new Promise((resolve) => API.storage.local.set(data, resolve));
    } catch (err) {
      return Promise.resolve();
    }
  }

  function removeLocal(keys) {
    if (!API || !API.storage || !API.storage.local || typeof API.storage.local.remove !== 'function') return Promise.resolve();
    if (API.storage.local.remove.length <= 1) {
      return API.storage.local.remove(keys);
    }
    return new Promise((resolve) => API.storage.local.remove(keys, resolve));
  }

  function clearMemory() {
    speechSession.watchMs = 0;
    speechSession.currentVideoWatchMs = 0;
    speechSession.lastWatchVideoKey = '';
    speechSession.lastWatchSpeechAt = 0;
    speechSession.lastWatchMilestoneMinutes = 0;
    saveSpeechSession();
    return Promise.resolve();
  }

  function cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  let _videoIdCachedHref = null;
  let _videoIdCachedValue = '';
  function getVideoId() {
    const href = location.href;
    if (href === _videoIdCachedHref) return _videoIdCachedValue;
    let id = '';
    try {
      const url = new URL(href);
      if (url.pathname.includes('/watch')) id = url.searchParams.get('v') || '';
    } catch (e) {
      id = '';
    }
    _videoIdCachedHref = href;
    _videoIdCachedValue = id;
    return id;
  }

  function getCurrentChannelName() {
    const selectors = [
      '#owner #channel-name a', 'ytd-video-owner-renderer #channel-name a', '#upload-info #channel-name a', 'ytd-watch-metadata ytd-channel-name a',
      'ytd-channel-name a'
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = cleanText(el && el.textContent);
      if (text) return text.slice(0, 64);
    }
    return '';
  }

  function getCurrentVideoTitle() {
    const selectors = ['h1.ytd-watch-metadata', 'h1.title', '#title h1', 'meta[property="og:title"]'];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = selector.startsWith('meta') ? cleanText(el && el.getAttribute('content')) : cleanText(el && el.textContent);
      if (text) return text.slice(0, 140);
    }
    return cleanText(document.title.replace(/ - YouTube$/i, '')).slice(0, 140);
  }
function getTimeSpeechCategory() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'timeMorning';
    if (hour >= 12 && hour < 18) return 'timeAfternoon';
    if (hour >= 18 && hour < 23) return 'timeEvening';
    return 'timeLate';
  }

  function getWatchSpeechCategory() {
    const sessionMinutes = (speechSession.watchMs || 0) / 60000;
    const currentVideoMinutes = (speechSession.currentVideoWatchMs || 0) / 60000;
    if (currentVideoMinutes >= 12 && hasSpeechCategory('watchVideoLong')) return 'watchVideoLong';
    if (sessionMinutes >= 45 && hasSpeechCategory('watchLong')) return 'watchLong';
    if (sessionMinutes >= 5 && hasSpeechCategory('watchSession')) return 'watchSession';
    return '';
  }

  function detachWatchTracker() {
    if (watchVideoEl && watchBound) {
      watchVideoEl.removeEventListener('timeupdate', handleWatchTimeUpdate);
      watchVideoEl.removeEventListener('play', handleWatchVideoPlay);
      watchVideoEl.removeEventListener('pause', handleWatchVideoPause);
    }
    watchVideoEl = null;
    watchLastMediaTime = 0;
    watchBound = false;
  }

  function bindWatchTracker() {
    const video = document.querySelector('video');
    if (!video || video === watchVideoEl) return;
    detachWatchTracker();
    watchVideoEl = video;
    watchLastMediaTime = Number(video.currentTime) || 0;
    watchBound = true;
    video.addEventListener('timeupdate', handleWatchTimeUpdate, { passive: true });
    video.addEventListener('play', handleWatchVideoPlay, { passive: true });
    video.addEventListener('pause', handleWatchVideoPause, { passive: true });
  }

  function handleWatchVideoPlay() {
    bindWatchTracker();
    updateWatchMemory(false);
    if (!speechVisible && Math.random() < 0.18 && hasSpeechCategory('watchStart')) {
      speakFromCategory('watchStart', { cooldownMs: 8000, durationMs: 3000 });
    }
  }

  function handleWatchVideoPause() {
    if (watchVideoEl) watchLastMediaTime = Number(watchVideoEl.currentTime) || watchLastMediaTime;
  }

  function handleWatchTimeUpdate() {
    bindWatchTracker();
    const video = watchVideoEl;
    if (!video) return;
    const current = Number(video.currentTime) || 0;
    const videoKey = getVideoId();
    if (videoKey && speechSession.lastWatchVideoKey !== videoKey) {
      speechSession.lastWatchVideoKey = videoKey;
      speechSession.currentVideoWatchMs = 0;
      speechSession.lastWatchMilestoneMinutes = 0;
      watchLastMediaTime = current;
      saveSpeechSession();
      return;
    }
    if (document.hidden || video.paused || video.seeking || video.ended) {
      watchLastMediaTime = current;
      return;
    }
    const deltaSeconds = current - watchLastMediaTime;
    watchLastMediaTime = current;
    if (deltaSeconds <= 0 || deltaSeconds > WATCH_DELTA_MAX_SECONDS) return;

    const deltaMs = Math.round(deltaSeconds * 1000);
    speechSession.watchMs = Math.min(86400000, Math.max(0, (Number(speechSession.watchMs) || 0) + deltaMs));
    speechSession.currentVideoWatchMs = Math.min(86400000, Math.max(0, (Number(speechSession.currentVideoWatchMs) || 0) + deltaMs));

    const now = Date.now();
    if (now - watchLastSaveAt > WATCH_SAVE_MIN_GAP) {
      watchLastSaveAt = now;
      saveSpeechSession();
    }
    maybeSpeakWatchMilestone();
  }

  function maybeSpeakWatchMilestone() {
    if (!getSpeechEnabled() || !getCatEnabled() || !getIsTabVisible() || document.hidden) return;
    if (speechVisible || speechInteractive || getIsDragging() || getIsPurring() || getIsDeepSleep()) return;
    const sessionMinutes = Math.floor((speechSession.watchMs || 0) / 60000);
    const milestone = WATCH_MILESTONES_MINUTES.find((m) => sessionMinutes >= m && m > (speechSession.lastWatchMilestoneMinutes || 0));
    if (!milestone) return;
    const now = Date.now();
    if (now - (speechSession.lastWatchSpeechAt || 0) < 120000) return;
    speechSession.lastWatchMilestoneMinutes = milestone;
    speechSession.lastWatchSpeechAt = now;
    noteSpeechEvent('watchMilestone');
    showSpeech(getSmartRandomPhrase('watchMilestone'), {
      durationMs: 3900,
      cooldownMs: 15000
    });
  }

  function updateWatchMemory(force) {
    bindWatchTracker();
    const videoKey = getVideoId();
    if (!videoKey) return;

    if (speechSession.lastWatchVideoKey !== videoKey) {
      speechSession.lastWatchVideoKey = videoKey;
      speechSession.currentVideoWatchMs = 0;
      speechSession.lastWatchMilestoneMinutes = 0;
      saveSpeechSession();
    }
  }

  function extractSpeechWords(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/\{[^}]+\}/g, ' ')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !/^(the|and|for|with|you|your|that|this|are|was|were|une|des|les|aux|pour|avec|dans|est|pas|sei|sono|con|per|che|non|هذا|هذه|ذلك|تلك|التي|الذي|على|إلى)$/.test(word))
      .slice(0, 10);
  }

  function rememberPhrase(phrase) {
    if (!phrase) return;
    const words = extractSpeechWords(phrase);

    speechSession.recentWords = Array.isArray(speechSession.recentWords) ? speechSession.recentWords : [];
    speechSession.recentWords = speechSession.recentWords.concat(words).slice(-220);
    saveSpeechSession();
  }

  function scorePhraseFreshness(text) {
    const words = extractSpeechWords(text);
    if (!words.length) return Math.random() * 0.1;
    const recentWords = new Set([].concat(
      Array.isArray(speechSession.recentWords) ? speechSession.recentWords : []
    ));
    const repeated = words.filter((word) => recentWords.has(word)).length;
    const freshRatio = 1 - (repeated / words.length);
    return freshRatio + Math.random() * 0.22;
  }

  function fillTemplate(text) {
    const channel = getCurrentChannelName() || (getUiLanguage() === 'ar' ? 'هذه القناة' : (getUiLanguage() === 'fr' ? 'cette chaîne' : (getUiLanguage() === 'it' ? 'questo canale' : 'this channel')));
    const title = getCurrentVideoTitle();
    const shortTitle = title ? title.replace(/\s+/g, ' ').slice(0, 34) : '';
    const sessionMinutes = Math.max(0, Math.round((speechSession.watchMs || 0) / 60000));
    const todayMinutes = 0;
    const totalHours = 0;
    const currentVideoMinutes = Math.max(0, Math.round((speechSession.currentVideoWatchMs || 0) / 60000));
    return String(text || '')
      .replace(/\{channel\}/g, channel)
      .replace(/\{video\}/g, shortTitle)
      .replace(/\{grabCount\}/g, String(speechSession.grabs || 0))
      .replace(/\{dropCount\}/g, String(speechSession.drops || 0))
      .replace(/\{heldSeconds\}/g, String(Math.max(1, Math.round(speechSession.lastHeldSeconds || 1))))
      .replace(/\{actionCount\}/g, String(getCategoryEventCount(speechSession.lastActionCategory || 'random')))
      .replace(/\{cursorWarnings\}/g, String(speechSession.cursorWarnings || 0))
      .replace(/\{sessionMinutes\}/g, String(sessionMinutes))
      .replace(/\{todayMinutes\}/g, String(todayMinutes))
      .replace(/\{totalHours\}/g, String(totalHours))
      .replace(/\{currentVideoMinutes\}/g, String(currentVideoMinutes));
  }
function selectScriptedPhrase(category, list) {
    if (!Array.isArray(list) || !list.length) return null;
    const count = Math.max(1, getCategoryEventCount(category));
    if (category === 'grabbed' && speechSession.grabs > 0 && speechSession.grabs <= Math.min(8, list.length)) {
      return list[speechSession.grabs - 1];
    }
    if ((category === 'heldStill' || category === 'heldMoving' || category === 'longHeld') && speechSession.longHolds > 0 && speechSession.longHolds <= Math.min(4, list.length)) {
      return list[Math.max(0, speechSession.longHolds - 1)];
    }
    if ((category === 'dropped' || category === 'thrown') && speechSession.drops > 0 && speechSession.drops <= Math.min(4, list.length)) {
      return list[Math.max(0, speechSession.drops - 1)];
    }
    if (category.indexOf('cursor') === 0 && speechSession.cursorWarnings > 1 && speechSession.cursorWarnings <= 4) {
      return list[(speechSession.cursorWarnings - 1) % list.length];
    }
    if (speechSession.actionStreak >= 3 && speechSession.actionStreak <= 5 && list.length > 2) {
      return list[(count + speechSession.actionStreak) % list.length];
    }
    return null;
  }

  function getSmartRandomPhrase(category) {
    const list = getSpeechList(category);
    if (!list || list.length === 0) return getUiLanguage() === 'ar' ? 'مياو.' : (getUiLanguage() === 'fr' ? 'Miaou.' : (getUiLanguage() === 'it' ? 'Miao.' : 'Meow.'));

    const scriptedPhrase = selectScriptedPhrase(category, list);
    if (scriptedPhrase) {
      const selectedScriptedPhrase = fillTemplate(scriptedPhrase);
      rememberPhrase(selectedScriptedPhrase);
      return selectedScriptedPhrase;
    }

    const recentKey = 'recentPhrases_' + catId;
    let recentPhrases = [];
    try {
      const stored = sessionStorage.getItem(recentKey);
      if (stored) recentPhrases = JSON.parse(stored);
    } catch (e) {

    }

    const recentExact = new Set(recentPhrases);
    const candidates = list.map((raw) => ({ raw, text: fillTemplate(raw) })).filter((item) => item.text);

    let available = candidates.filter((item) => !recentExact.has(item.raw) && !recentExact.has(item.text));
    if (!available.length) {
      available = candidates.filter((item) => !recentPhrases.includes(item.text) && !recentPhrases.includes(item.raw));
    }
    if (!available.length) {
      available = candidates.slice();
      recentPhrases = [];
    }

    available.sort((a, b) => scorePhraseFreshness(b.text) - scorePhraseFreshness(a.text));
    const topCount = Math.max(1, Math.min(4, Math.ceil(available.length * 0.28)));
    const top = available.slice(0, topCount);

    let randomIndex;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      randomIndex = randomBuffer[0] % top.length;
    } else {
      randomIndex = Math.floor(Math.random() * top.length);
    }

    const selectedPhrase = top[randomIndex].text;
    recentPhrases.push(selectedPhrase);
    const maxRecent = Math.max(18, Math.ceil(list.length * 0.85));
    if (recentPhrases.length > maxRecent) recentPhrases = recentPhrases.slice(-maxRecent);
    try {
      sessionStorage.setItem(recentKey, JSON.stringify(recentPhrases));
    } catch (e) {

    }
    rememberPhrase(selectedPhrase);
    return selectedPhrase;
  }

  function getWeightedRandomCategory() {
    const categories = IDLE_SPEECH_CATEGORIES.filter(hasSpeechCategory);
    if (!categories.length) return 'random';
    const weights = categories.map((category) => {
      if (category === 'random') return 24;
      if (category === 'happy') return 14;
      if (category === 'hungry') return 10;
      if (category === 'sleepy') return 12;
      if (category === 'memeMood') return 14;
      if (category === 'content') return 14;
      if (category === 'watchSession') return getWatchSpeechCategory() === 'watchSession' ? 12 : 2;
      if (category === 'watchLong') return getWatchSpeechCategory() === 'watchLong' ? 12 : 1;
      return 6;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < categories.length; i++) {
      random -= weights[i];
      if (random <= 0) return categories[i];
    }
    return categories[0];
  }

  function getContextAwareSpeechText() {
    let category = null;

    const state = getState();
    const isJumping = getIsJumping();
    const velX = getVelX();
    const targetFish = getTargetFish();
    const targetSpider = getTargetSpider();

    if (state === 'webbed_stun' && hasSpeechCategory('webbed')) {
      category = 'webbed';
    } else if (state === 'chasing_bug' && targetSpider && targetSpider.isBig && hasSpeechCategory('bigSpider')) {
      category = 'bigSpider';
    } else if (state === 'chasing_bug' && hasSpeechCategory('spider')) {
      category = 'spider';
    } else if (state === 'coinchase' && hasSpeechCategory('coin')) {
      category = 'coin';
    } else if (state === 'ball_play' && hasSpeechCategory('ball')) {
      category = 'ball';
    } else if (state === 'eatfish' && hasSpeechCategory('eating')) {
      category = 'eating';
    } else if ((targetFish || state === 'chasefish') && hasSpeechCategory('fishing')) {
      category = 'fishing';
    } else if (isJumping && hasSpeechCategory('jumping')) {
      category = 'jumping';
    } else if (state === 'groom' && hasSpeechCategory('grooming')) {
      category = 'grooming';
    } else if ((state === 'nap' || state === 'sleep' || state === 'deepsleep') && hasSpeechCategory('sleepy')) {
      category = 'sleepy';
    } else if ((state === 'wall_left' || state === 'wall_right' || state === 'ninja_climb') && hasSpeechCategory('climbing')) {
      category = 'climbing';
    } else if ((state === 'knockoff' || state === 'ui_mischief') && hasSpeechCategory('mischief')) {
      category = 'mischief';
    } else if (state === 'watchvideo' && hasSpeechCategory('watching')) {
      category = 'watching';
    } else if (state === 'wander' && Math.abs(velX) > 100 && hasSpeechCategory('running')) {
      category = 'running';
    } else if (state === 'wander' && hasSpeechCategory('walking')) {
      category = 'walking';
    } else {
      const watchCategory = getWatchSpeechCategory();
      const timeCategory = getTimeSpeechCategory();
      if (watchCategory && Math.random() < 0.28) {
        category = watchCategory;
      } else if (timeCategory && hasSpeechCategory(timeCategory) && Math.random() < 0.18) {
        category = timeCategory;
      } else {
        category = getWeightedRandomCategory();
      }
    }

    return getSmartRandomPhrase(category);
  }

  function ensureSpeechBubble() {
    const petRaw = typeof config.activePetKind !== 'undefined' ? config.activePetKind : config.activePet;
    const isClippy = String(petRaw || '').toLowerCase() === 'pet_clippy' || config.isClippy;
    if (!isClippy) return;

    const allBubbles = document.querySelectorAll('.pixel-cat-bubble');
    allBubbles.forEach(b => {
      if (b !== speechBubble) b.remove();
    });

    if (speechBubble && speechBubble.isConnected) return;
    speechBubble = document.createElement('div');
    speechBubble.className = 'pixel-cat-bubble';
    speechBubble.classList.add('theme-clippy');
    speechBubble.setAttribute('role', 'status');
    speechBubble.setAttribute('aria-live', 'polite');

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'bubble-content';

    speechTextEl = document.createElement('div');
    speechTextEl.className = 'bubble-text';
    contentWrapper.appendChild(speechTextEl);

    speechListEl = document.createElement('ul');
    speechListEl.className = 'bubble-list';
    contentWrapper.appendChild(speechListEl);

    speechButtonsEl = document.createElement('div');
    speechButtonsEl.className = 'bubble-buttons';

    speechLikeBtn = document.createElement('button');
    speechLikeBtn.type = 'button';
    speechLikeBtn.className = 'bubble-btn like';
    speechLikeBtn.setAttribute('aria-label', 'Like');
    speechLikeBtn.setAttribute('title', 'Like');
    speechLikeBtn.innerHTML = '';
    const likeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    likeSvg.setAttribute('viewBox', '0 0 24 24');
    likeSvg.setAttribute('aria-hidden', 'true');
    const likePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    likePath.setAttribute('d', 'M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 11V10l5-8a3 3 0 0 1 3 3v4h5a2 2 0 0 1 2 2l-1 7a4 4 0 0 1-4 4H7z');
    likeSvg.appendChild(likePath);
    speechLikeBtn.appendChild(likeSvg);
    speechLikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSpeechVote(true);
    });

    speechDislikeBtn = document.createElement('button');
    speechDislikeBtn.type = 'button';
    speechDislikeBtn.className = 'bubble-btn dislike';
    speechDislikeBtn.setAttribute('aria-label', 'Dislike');
    speechDislikeBtn.setAttribute('title', 'Dislike');
    speechDislikeBtn.innerHTML = '';
    const dislikeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dislikeSvg.setAttribute('viewBox', '0 0 24 24');
    dislikeSvg.setAttribute('aria-hidden', 'true');
    const dislikePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dislikePath.setAttribute('d', 'M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3m0-11v12l-5 8a3 3 0 0 1-3-3v-4H4a2 2 0 0 1-2-2l1-7a4 4 0 0 1 4-4h10z');
    dislikeSvg.appendChild(dislikePath);
    speechDislikeBtn.appendChild(dislikeSvg);
    speechDislikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSpeechVote(false);
    });

    speechButtonsEl.appendChild(speechLikeBtn);
    speechButtonsEl.appendChild(speechDislikeBtn);
    contentWrapper.appendChild(speechButtonsEl);

    speechBubble.appendChild(contentWrapper);

    speechArrowEl = document.createElement('div');
    speechArrowEl.className = 'bubble-arrow';
    speechBubble.appendChild(speechArrowEl);

    document.body.appendChild(speechBubble);
    speechMeasureNeeded = true;
  }

  function measureSpeechBubble() {
    if (!speechBubble || !speechBubble.isConnected) return;
    const rect = speechBubble.getBoundingClientRect();
    speechSizeW = rect.width || speechSizeW;
    speechSizeH = rect.height || speechSizeH;
  }

  function positionSpeechBubble(forceMeasure) {
    if (!speechBubble || !speechVisible) return;
    if (forceMeasure || speechMeasureNeeded || !speechSizeW || !speechSizeH) {
      measureSpeechBubble();
      speechMeasureNeeded = false;
    }
    if (!speechSizeW || !speechSizeH) return;

    const vw = getVw();
    const vh = getVh();
    const feetX = getFeetX();
    const feetY = getFeetY();
    const VIS = getVIS();
    const state = getState();
    const isWallState = state === 'wall_left' || state === 'wall_right' || state === 'wall_left_sit' || state === 'wall_right_sit' || state === 'ninja_climb';
    const isBubbleTrapState = getBubbleTrapActive() || state === 'bubble_trap';
    const sizeScale = Math.max(1, VIS / 80);
    const margin = POSITIONING.BUBBLE_MARGIN * sizeScale;
    const baseGap = isWallState
      ? Math.max(8, POSITIONING.BUBBLE_GAP * sizeScale * 0.45)
      : POSITIONING.BUBBLE_GAP * sizeScale;

    const gap = isBubbleTrapState ? Math.max(2, baseGap * 0.35) : baseGap;
    const bubbleWidth = isBubbleTrapState ? Math.max(VIS * 0.95, getBubbleTrapWidth()) : 0;
    const bubbleHeight = isBubbleTrapState ? Math.max(VIS * 1.05, getBubbleTrapHeight()) : 0;
    const bubbleCenterY = isBubbleTrapState ? feetY - bubbleHeight * 0.245 : 0;
    const catHeight = typeof config.catHeight !== 'undefined' ? config.catHeight : (VIS * POSITIONING.CAT_TOP_OFFSET);
    const catTop = isBubbleTrapState
      ? bubbleCenterY - bubbleHeight * 0.5
      : (isWallState ? feetY - VIS * 0.42 : feetY - catHeight);
    const catMid = isBubbleTrapState
      ? bubbleCenterY
      : (isWallState ? feetY - VIS * 0.08 : feetY - VIS * POSITIONING.CAT_MID_OFFSET);
    const catBottom = isBubbleTrapState
      ? bubbleCenterY + bubbleHeight * 0.3
      : (isWallState ? feetY + VIS * 0.28 : feetY);
    const catHalfW = isBubbleTrapState
      ? bubbleWidth * 0.5
      : VIS * (isWallState ? 0.22 : 0.5);
    const catSafe = {
      left: feetX - catHalfW - gap,
      right: feetX + catHalfW + gap,
      top: catTop - gap,
      bottom: catBottom + gap
    };

    const candidates = isBubbleTrapState ? [

      { anchor: 'bottom', x: feetX - speechSizeW * 0.85, y: catBottom + gap },
      { anchor: 'top',    x: feetX - speechSizeW * 0.85, y: catTop - speechSizeH - gap }
    ] : (isWallState ? [
      { anchor: state === 'wall_right' || state === 'wall_right_sit' ? 'left' : 'right', x: (state === 'wall_right' || state === 'wall_right_sit') ? catSafe.left - speechSizeW : catSafe.right, y: catMid - speechSizeH / 2 },
      { anchor: 'top',    x: feetX - speechSizeW * 0.85, y: catTop - speechSizeH - gap },
      { anchor: 'bottom', x: feetX - speechSizeW * 0.85, y: catBottom + gap }
    ] : [

      { anchor: 'top',    x: feetX - speechSizeW * 0.85, y: catTop - speechSizeH - gap },
      { anchor: 'bottom', x: feetX - speechSizeW * 0.85, y: catBottom + gap }
    ]);

    let chosen = candidates[0];
    let chosenClampedX = Math.max(margin, Math.min(vw - margin - speechSizeW, chosen.x));
    let chosenClampedY = Math.max(margin, Math.min(vh - margin - speechSizeH, chosen.y));
    function overlapsCat(x, y) {
      return (
        x < catSafe.right &&
        x + speechSizeW > catSafe.left &&
        y < catSafe.bottom &&
        y + speechSizeH > catSafe.top
      );
    }

    function isCandidateValid(c) {
      const cx = Math.max(margin, Math.min(vw - margin - speechSizeW, c.x));
      const cy = Math.max(margin, Math.min(vh - margin - speechSizeH, c.y));
      return (
        c.x >= margin && c.y >= margin &&
        c.x + speechSizeW <= vw - margin &&
        c.y + speechSizeH <= vh - margin &&
        !overlapsCat(cx, cy)
      );
    }

    const currentAnchor = isBubbleTrapState ? null : speechBubble.dataset.anchor;
    let currentCand = currentAnchor ? candidates.find(c => c.anchor === currentAnchor) : null;

    if (currentCand && currentCand.anchor === 'bottom') {
      const preferredFits = candidates.some((c) => c !== currentCand && isCandidateValid(c));
      if (preferredFits) currentCand = null;
    }
    if (currentCand && isCandidateValid(currentCand)) {
      chosen = currentCand;
      chosenClampedX = Math.max(margin, Math.min(vw - margin - speechSizeW, chosen.x));
      chosenClampedY = Math.max(margin, Math.min(vh - margin - speechSizeH, chosen.y));
    } else {
      for (let i = 0; i < candidates.length; i++) {
        if (isCandidateValid(candidates[i])) {
          chosen = candidates[i];
          chosenClampedX = Math.max(margin, Math.min(vw - margin - speechSizeW, chosen.x));
          chosenClampedY = Math.max(margin, Math.min(vh - margin - speechSizeH, chosen.y));
          break;
        }
      }
    }

    if (overlapsCat(chosenClampedX, chosenClampedY)) {
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const x = Math.max(margin, Math.min(vw - margin - speechSizeW, c.x));
        const y = Math.max(margin, Math.min(vh - margin - speechSizeH, c.y));
        if (!overlapsCat(x, y)) {
          chosen = c;
          chosenClampedX = x;
          chosenClampedY = y;
          break;
        }
      }
    }

    if (overlapsCat(chosenClampedX, chosenClampedY)) {
      const topY    = Math.max(margin, catSafe.top - speechSizeH - gap);
      const bottomY = Math.min(vh - margin - speechSizeH, catSafe.bottom + gap);

      const fixes = [
        { anchor: 'top',    x: chosenClampedX, y: topY    },
        { anchor: 'bottom', x: chosenClampedX, y: bottomY }
      ];
      const fix = fixes.find((c) => !overlapsCat(c.x, c.y));
      if (fix) {
        chosen = fix;
        chosenClampedX = fix.x;
        chosenClampedY = fix.y;
      }
    }

    const clampedX = chosenClampedX;
    const clampedY = chosenClampedY;

    if (speechBubble.dataset.anchor !== chosen.anchor) {
      speechBubble.dataset.anchor = chosen.anchor;
    }

    const pixelX = Math.round(clampedX);
    const pixelY = Math.round(clampedY);
    const nextTransform = `translate3d(${pixelX}px, ${pixelY}px, 0)`;
    if (speechBubble.style.transform !== nextTransform) {
      speechBubble.style.transform = nextTransform;
    }

    const arrowMin = POSITIONING.ARROW_MIN_OFFSET * sizeScale;
    if (chosen.anchor === 'top' || chosen.anchor === 'bottom') {
      const arrowX = Math.max(arrowMin, Math.min(speechSizeW - arrowMin, (feetX - clampedX)));
      const arrowRounded = Math.round(arrowX);
      const arrowValue = `${arrowRounded}px`;

      const prevArrow = parseInt(speechBubble.style.getPropertyValue('--arrow-offset') || '0', 10);
      if (Math.abs(arrowRounded - prevArrow) > 1) speechBubble.style.setProperty('--arrow-offset', arrowValue);
    } else {
      const arrowY = Math.max(arrowMin, Math.min(speechSizeH - arrowMin, (catMid - clampedY)));
      const arrowRounded = Math.round(arrowY);
      const arrowValue = `${arrowRounded}px`;
      const prevArrow = parseInt(speechBubble.style.getPropertyValue('--arrow-offset') || '0', 10);
      if (Math.abs(arrowRounded - prevArrow) > 1) speechBubble.style.setProperty('--arrow-offset', arrowValue);
    }
  }

  function showSpeech(text, options) {
    if (config && globalThis.__PixelCatRuntime && globalThis.__PixelCatRuntime.instances) {
      const otherSpeaking = globalThis.__PixelCatRuntime.instances.some(c => c.catId !== config.catId && c.isSpeaking);
      if (otherSpeaking) return;
    }

    const forceSpeech = !!(options && options.force);
    if (!forceSpeech && !getSpeechEnabled()) {
      hideSpeechBubble();
      return;
    }
    if (speechHideTimer) {
      removeTimeout(speechHideTimer);
      speechHideTimer = null;
    }
    ensureSpeechBubble();
    if (!speechBubble) return;

    const allBubbles = document.querySelectorAll('.pixel-cat-bubble');
    allBubbles.forEach(b => {
      if (b !== speechBubble) b.remove();
    });

    if (speechTextEl) speechTextEl.style.display = '';
    if (speechListEl) speechListEl.style.display = '';
    if (speechButtonsEl) speechButtonsEl.style.display = '';
    speechTextEl.textContent = text;

    const lang = getUiLanguage();
    speechBubble.setAttribute('lang', lang);
    speechBubble.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    speechInteractive = !!(options && options.interactive);

    const isNotification = !!(options && options.notification);
    if (isNotification) {
      delete speechBubble.dataset.anchor;
    }

    speechBubble.classList.toggle('is-interactive', speechInteractive);

    if (options && Array.isArray(options.choices) && options.choices.length > 0) {
      speechListEl.innerHTML = '';
      options.choices.forEach(choice => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'bubble-list-item';

        const orb = document.createElement('span');
        orb.className = 'orb';
        btn.appendChild(orb);

        const textSpan = document.createElement('span');
        textSpan.textContent = choice.label;
        btn.appendChild(textSpan);

        btn.onclick = (e) => {
          e.stopPropagation();
          hideSpeechBubble();
          if (typeof choice.onClick === 'function') choice.onClick();
        };
        li.appendChild(btn);
        speechListEl.appendChild(li);
      });
      speechBubble.classList.add('has-list');
    } else {
      speechBubble.classList.remove('has-list');
    }

    speechVisible = true;
    speechMeasureNeeded = true;
    positionSpeechBubble(true);

    void speechBubble.offsetWidth;

    speechBubble.classList.add('is-visible');

    if (speechHideTimer) removeTimeout(speechHideTimer);
    const customDuration = options && Number.isFinite(Number(options.durationMs)) ? Number(options.durationMs) : null;
    const hideDelay = customDuration != null
      ? Math.max(1200, Math.min(9000, customDuration))
      : (speechInteractive ? SPEECH_CONFIG.INTERACTIVE_DELAY : 5200);
    speechHideTimer = addTimeout(() => hideSpeechBubble(), hideDelay);

    const customCooldown = options && Number.isFinite(Number(options.cooldownMs)) ? Number(options.cooldownMs) : null;
    speechCooldownUntil = Date.now() + (customCooldown != null
      ? Math.max(0, customCooldown)
      : (speechInteractive ? SPEECH_CONFIG.COOLDOWN_INTERACTIVE : SPEECH_CONFIG.COOLDOWN_NORMAL));
  }

  function hideSpeechBubble() {
    if (!speechBubble) return;
    const activeElement = document.activeElement;
    if (activeElement && speechBubble.contains(activeElement) && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
    if (speechTextEl) speechTextEl.style.display = '';
    if (speechListEl) speechListEl.style.display = '';
    if (speechButtonsEl) speechButtonsEl.style.display = '';
    speechBubble.classList.remove('is-visible');
    speechBubble.classList.remove('is-interactive');
    speechVisible = false;
    speechInteractive = false;
    if (speechHideTimer) {
      removeTimeout(speechHideTimer);
      speechHideTimer = null;
    }
  }

  function handleSpeechVote(isLike) {
    if (!speechVisible) return;
    const feetX = getFeetX();
    const feetY = getFeetY();
    const VIS = getVIS();

    const responseCategory = isLike ? 'voteLike' : 'voteDislike';
    if (isLike) {
      awardCoins(2);
      earnXP(0.3);
      if (typeof showCoinPopup === 'function') {
        showCoinPopup(feetX, Math.max(20, feetY - VIS * 0.9), 2, '#22c55e', 4);
      }
      spawnHeart(feetX, Math.max(20, feetY - VIS * 0.6));
    } else {
      config.catEnergy = Math.max(0, config.catEnergy - 0.08);
      setAnimLocked('scared', 600);
    }
    noteSpeechEvent(responseCategory);
    showSpeech(getSmartRandomPhrase(responseCategory), {
      interactive: false,
      durationMs: 3100,
      cooldownMs: 17000,
      force: true
    });
    scheduleIdleChatter(SPEECH_CONFIG.INTERACTIVE_DELAY + Math.random() * SPEECH_CONFIG.INTERACTIVE_VARIANCE);
  }

  function scheduleIdleChatter(delayMs) {
    if (speechIdleTimer) removeTimeout(speechIdleTimer);
    if (teaseTimer) removeTimeout(teaseTimer);
    if (!getSpeechEnabled()) {
      speechIdleTimer = null;
      return;
    }

    let delay;
    if (delayMs != null) {
      delay = delayMs;
    } else {

      let randomFactor;
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buffer = new Uint32Array(1);
        crypto.getRandomValues(buffer);
        randomFactor = buffer[0] / 0xFFFFFFFF;
      } else {
        randomFactor = Math.random();
      }

      const range = SPEECH_CONFIG.IDLE_DELAY_MAX - SPEECH_CONFIG.IDLE_DELAY_MIN;
      delay = SPEECH_CONFIG.IDLE_DELAY_MIN + (randomFactor * range);

      const jitter = (Math.random() - 0.5) * 0.2;
      delay = delay * (1 + jitter);
    }

    speechIdleTimer = addTimeout(() => {
      speechIdleTimer = null;
      maybeIdleChatter();
    }, delay);
  }

  function isSpeechIdleState() {
    const isDragging = getIsDragging();
    const isPurring = getIsPurring();
    const isDeepSleep = getIsDeepSleep();
    const catEnabled = getCatEnabled();
    const isTabVisible = getIsTabVisible();
    const state = getState();
    const IDLE_STATES = getIdleStates();

    if (isDragging || isPurring || isDeepSleep) return false;
    if (!catEnabled) return false;
    if (!getSpeechEnabled()) return false;
    if (!isTabVisible) return false;
    if (speechVisible) return false;
    if (speechInteractive) return false;

    const passiveSpeechStates = new Set(['watchvideo']);

    return IDLE_STATES.has(state) || passiveSpeechStates.has(state);
  }

    function maybeIdleChatter() {
    updateWatchMemory(false);

    if (!isSpeechIdleState()) {
      scheduleIdleChatter(SPEECH_CONFIG.RETRY_DELAY_MIN + Math.random() * SPEECH_CONFIG.RETRY_DELAY_MAX);
      return;
    }

    getLocal(['autoFishSpawnEnabled', 'ballEnabled', 'spiderEnabled', 'portalEnabled']).then(prefs => {

      if (Math.random() < 0.15) {
        const complaints = [];
        if (prefs.autoFishSpawnEnabled === false) complaints.push(...getSpeechList('fishing'));
        if (prefs.ballEnabled === false)          complaints.push(...getSpeechList('ball'));
        if (prefs.spiderEnabled === false)        complaints.push(...getSpeechList('spider'));

        if (complaints.length > 0) {
          const text = complaints[Math.floor(Math.random() * complaints.length)];
          showSpeech(text, { interactive: false });
          scheduleIdleChatter();
          return;
        }
      }

      const interactive = Math.random() < (1 / 15);

      let text;
      if (interactive) {
        text = getSmartRandomPhrase('feedbackQuestion');
      } else {
        text = getContextAwareSpeechText();
      }

      showSpeech(text, { interactive });
      scheduleIdleChatter();
    }).catch(() => {

      const interactive = Math.random() < (1 / 15);
      const text = interactive ? getSmartRandomPhrase('feedbackQuestion') : getContextAwareSpeechText();
      showSpeech(text, { interactive });
      scheduleIdleChatter();
    });
  }

  function speakFromCategory(category, options) {
    const now = Date.now();
    const force = options && options.force;
    const allowReplace = !!(options && options.allowReplace);
    if (speechVisible && !allowReplace) return;
    if (!force && now < speechCooldownUntil) return;

    noteSpeechEvent(category);
    const text = getSmartRandomPhrase(category);
    showSpeech(text, {
      interactive: options && options.interactive,
      durationMs: options && options.durationMs,
      cooldownMs: options && options.cooldownMs
    });
  }

  function maybeSpeakAction(category, options) {
    if (!category || !getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible()) return;
    if (getIsDragging() || getIsDeepSleep() || getIsPurring()) return;
    if (speechVisible || speechInteractive) return;

    const now = Date.now();
    const minGap = options && Number.isFinite(Number(options.minGapMs)) ? Number(options.minGapMs) : SPEECH_CONFIG.COOLDOWN_ACTION;
    const repeatGap = options && Number.isFinite(Number(options.repeatGapMs)) ? Number(options.repeatGapMs) : 16000;
    if (now - lastActionSpeechTs < minGap) return;
    if (lastActionSpeechCategory === category && now - lastActionSpeechTs < repeatGap) return;

    const chance = options && Number.isFinite(Number(options.chance)) ? Number(options.chance) : 0.5;
    if (Math.random() > Math.max(0, Math.min(1, chance))) return;

    lastActionSpeechTs = now;
    lastActionSpeechCategory = category;
    speakFromCategory(category, {
      force: true,
      durationMs: options && options.durationMs ? options.durationMs : 3400,
      cooldownMs: options && options.cooldownMs ? options.cooldownMs : SPEECH_CONFIG.COOLDOWN_ACTION
    });
  }

  function getCounterPhrase(lines, counter) {
    if (!Array.isArray(lines) || !lines.length) return '';
    const n = Math.max(0, Number(counter) || 0);

    const index = Math.floor(Math.random() * lines.length + n) % lines.length;
    return lines[index];
  }

  function getGrabCounterSpeech(grabCount) {
    const n = Math.max(1, Number(grabCount) || 1);
    if (n === 1) return getCounterPhrase(getSpeechList('grabbed'), n);
    if (n === 2) return getCounterPhrase(getSpeechList('grabbed2'), n);
    if (n === 3) return getCounterPhrase(getSpeechList('grabbed3'), n);
    if (n >= 7)  return getCounterPhrase(getSpeechList('grabbed3'), n);
    return getCounterPhrase(getSpeechList('grabbed2'), n);
  }

  function getHeldCounterSpeech(heldSeconds, grabCount, speed) {
    const n = Math.max(1, Number(grabCount) || 1);
    const seconds = Math.max(1, Number(heldSeconds) || 1);
    const fast = Math.abs(Number(speed) || 0) > 520;

    if (seconds >= 18) return getCounterPhrase(getSpeechList('heldLong'), n + seconds);

    if (seconds >= 8) {
      speechSession.longHolds = Math.min(999, (Number(speechSession.longHolds) || 0) + 1);
      return getCounterPhrase(getSpeechList('heldLong'), n + seconds);
    }

    if (fast) return getCounterPhrase(getSpeechList('heldFast'), n + seconds);

    if (n >= 3) return getCounterPhrase(getSpeechList('grabbed3'), n + seconds);

    return getCounterPhrase(getSpeechList('heldStill'), n + seconds);
  }

  function getDropCounterSpeech(grabCount, dropCount, heldSeconds, releaseSpeed) {
    const n = Math.max(1, Number(grabCount) || 1);
    const drops = Math.max(1, Number(dropCount) || 1);
    const seconds = Math.max(0, Number(heldSeconds) || 0);
    const thrown = Math.abs(Number(releaseSpeed) || 0) > 420;

    if (thrown) return getCounterPhrase(getSpeechList('thrown'), n + drops);

    if (n >= 4 || drops >= 4 || seconds >= 8) {
      return getCounterPhrase(getSpeechList('heldLong'), n + drops + seconds);
    }

    return getCounterPhrase(getSpeechList('dropped'), n + drops);
  }

  function speakGrabbed() {
    if (!getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible() || getIsDeepSleep()) return;
    if (speechInteractive) return;

    const now = Date.now();
    speechSession.grabs = Math.min(999, (Number(speechSession.grabs) || 0) + 1);
    speechSession.lastGrabStartedAt = now;
    speechSession.lastHeldSeconds = 1;
    noteSpeechEvent('grabbed');
    lastGrabSpeechTs = now;
    lastDragSpeechTs = now;

    showSpeech(getGrabCounterSpeech(speechSession.grabs), {
      durationMs: 2600 + Math.random() * 900,
      cooldownMs: 900
    });
  }

  function updateGrabbedSpeech(meta) {
    if (!getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible() || getIsDeepSleep()) return;
    if (!getIsDragging()) return;
    const now = Date.now();
    const startedAt = Number(speechSession.lastGrabStartedAt) || now;
    const heldSeconds = Math.max(1, Math.round((now - startedAt) / 1000));
    speechSession.lastHeldSeconds = heldSeconds;
    const speed = meta && Number.isFinite(Number(meta.speed)) ? Math.abs(Number(meta.speed)) : 0;

    if (heldSeconds < 3) return;
    const gap = heldSeconds >= 8 ? 9000 : 12000;
    if (now - lastDragSpeechTs < gap) return;
    if (speechVisible && now - lastGrabSpeechTs < 2400) return;

    noteSpeechEvent('held');
    lastDragSpeechTs = now;
    lastGrabSpeechTs = now;
    showSpeech(getHeldCounterSpeech(heldSeconds, speechSession.grabs, speed), {
      durationMs: 2500 + Math.random() * 700,
      cooldownMs: 700
    });
  }

  function speakDropped(meta) {
    if (!getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible() || getIsDeepSleep()) return;
    const now = Date.now();
    const startedAt = Number(speechSession.lastGrabStartedAt) || now;
    const heldMs = Math.max(0, now - startedAt);
    const heldSeconds = Math.max(1, Math.round(heldMs / 1000));
    speechSession.lastHeldSeconds = heldSeconds;
    speechSession.lastGrabStartedAt = 0;
    speechSession.drops = Math.min(999, (Number(speechSession.drops) || 0) + 1);

    const releaseSpeed = meta && Number.isFinite(Number(meta.releaseSpeed)) ? Math.abs(Number(meta.releaseSpeed)) : 0;
    noteSpeechEvent(releaseSpeed > 420 ? 'thrown' : 'dropped');
    showSpeech(getDropCounterSpeech(speechSession.grabs, speechSession.drops, heldSeconds, releaseSpeed), {
      durationMs: 2700 + Math.random() * 800,
      cooldownMs: 1600,
      allowReplace: true
    });
  }

  function maybeSpeakConfused() {
    if (!getSpeechEnabled()) return;
    const now = Date.now();
    if (now - lastWallSpeakTs < AFK_CONFIG.WALL_SPEAK_COOLDOWN) return;
    if (Math.random() < 0.06) {
      lastWallSpeakTs = now;
      speakFromCategory('confused', { cooldownMs: 30000, durationMs: 2400 });
    }
  }

  function maybeSpeakAngry() {
    if (!getSpeechEnabled() || speechVisible) return;
    if (Math.random() < 0.16) {
      speakFromCategory('angry');
    }
  }

  let teaseTimer = 0;
  let lastTeaseSpeechTs = 0;

  function checkTeasing() {
    const now = Date.now();
    const draggedObject = getDraggedFish() || getDraggedBall();
    const catState = config.state;

    if (draggedObject && (catState === 'chasefish' || catState === 'chasing' || catState === 'chasing_bug')) {
      if (now - lastTeaseSpeechTs > 6000 && !speechVisible) {
        showSpeech(getSmartRandomPhrase('teasing'), {
          durationMs: 2500,
          interactive: false
        });
        lastTeaseSpeechTs = now;
      }
    }
    teaseTimer = addTimeout(checkTeasing, 1000);
  }

  teaseTimer = addTimeout(checkTeasing, 2000);

  function markSpeechMeasure() {
    speechMeasureNeeded = true;
  }

  function cleanup() {
    if (speechBubble && speechBubble.isConnected) {
      speechBubble.remove();
    }
    if (speechHideTimer) removeTimeout(speechHideTimer);
    if (speechIdleTimer) removeTimeout(speechIdleTimer);
    detachWatchTracker();
  }

  bindWatchTracker();

  return {
    scheduleIdleChatter,
    speakFromCategory,
    maybeSpeakAction,
    speakGrabbed,
    updateGrabbedSpeech,
    speakDropped,
    maybeSpeakConfused,
    maybeSpeakAngry,
    showSpeech,
    hideSpeechBubble,
    positionSpeechBubble,
    markSpeechMeasure,
    updateWatchMemory,
    clearMemory,
    cleanup,
    get speechVisible() { return speechVisible; },
    get speechBubble() { return speechBubble; }
  };
};

window.CLIPPY_DATA = {"overlayCount": 1, "sounds": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"], "framesize": [124, 93], "animations": {"Congratulate": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 10, "images": [[124, 0]]}, {"duration": 10, "images": [[248, 0]]}, {"duration": 10, "images": [[372, 0]], "sound": "14"}, {"duration": 10, "images": [[496, 0]]}, {"duration": 10, "images": [[620, 0]]}, {"duration": 10, "images": [[744, 0]]}, {"duration": 10, "images": [[868, 0]]}, {"duration": 10, "images": [[992, 0]], "sound": "1"}, {"duration": 100, "images": [[1116, 0]]}, {"duration": 100, "images": [[1240, 0]]}, {"duration": 100, "images": [[1364, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1612, 0]], "sound": "10"}, {"duration": 100, "images": [[1736, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1860, 0]]}, {"duration": 100, "images": [[1984, 0]]}, {"duration": 100, "images": [[2108, 0]]}, {"duration": 100, "images": [[2232, 0]]}, {"duration": 100, "images": [[2356, 0]], "exitBranch": 21}, {"duration": 100, "images": [[0, 0]]}]}, "LookRight": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[620, 651]], "exitBranch": 5}, {"duration": 100, "images": [[744, 651]], "exitBranch": 4}, {"duration": 1200, "images": [[868, 651]]}, {"duration": 100, "images": [[992, 651]]}, {"duration": 100, "images": [[1116, 651]]}, {"duration": 100, "images": [[0, 0]]}]}, "SendMail": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1240, 1209]]}, {"duration": 100, "images": [[1364, 1209]]}, {"duration": 100, "images": [[1488, 1209]]}, {"duration": 100, "images": [[1612, 1209]]}, {"duration": 100, "images": [[1736, 1209]]}, {"duration": 100, "images": [[1860, 1209]]}, {"duration": 100, "images": [[1984, 1209]]}, {"duration": 100, "images": [[2108, 1209]]}, {"duration": 100, "images": [[2232, 1209]]}, {"duration": 100, "images": [[2356, 1209]]}, {"duration": 100, "images": [[2480, 1209]]}, {"duration": 100, "images": [[2604, 1209]]}, {"duration": 100, "images": [[2728, 1209]]}, {"duration": 100, "images": [[2852, 1209]]}, {"duration": 100, "images": [[2976, 1209]]}, {"duration": 100, "images": [[3100, 1209]]}, {"duration": 100, "images": [[3224, 1209]]}, {"duration": 100, "images": [[0, 1302]]}, {"duration": 100, "images": [[124, 1302]]}, {"duration": 100, "images": [[248, 1302]]}, {"duration": 100, "images": [[372, 1302]], "sound": "14"}, {"duration": 100, "images": [[496, 1302]], "exitBranch": 24}, {"duration": 100, "images": [[620, 1302]]}, {"duration": 100, "images": [[744, 1302]], "exitBranch": 26}, {"duration": 100, "images": [[868, 1302]]}, {"duration": 100, "images": [[992, 1302]], "exitBranch": 27}, {"duration": 100, "images": [[1116, 1302]], "exitBranch": 28}, {"duration": 100, "images": [[1240, 1302]], "exitBranch": 29}, {"duration": 100, "images": [[1364, 1302]], "exitBranch": 30}, {"duration": 100, "images": [[1488, 1302]], "exitBranch": 31}, {"duration": 100, "images": [[1612, 1302]], "exitBranch": 32}, {"duration": 100, "images": [[1736, 1302]]}, {"duration": 100, "images": [[1860, 1302]]}, {"duration": 100, "images": [[1984, 1302]]}, {"duration": 100, "images": [[2108, 1302]]}, {"duration": 100, "images": [[2232, 1302]]}, {"duration": 100, "images": [[2356, 1302]]}, {"duration": 100, "images": [[2480, 1302]]}, {"duration": 100, "images": [[2604, 1302]]}, {"duration": 100, "images": [[2728, 1302]]}, {"duration": 100, "images": [[2852, 1302]]}, {"duration": 100, "images": [[2976, 1302]]}, {"duration": 100, "images": [[3100, 1302]]}, {"duration": 100, "images": [[3224, 1302]]}, {"duration": 100, "images": [[0, 1395]]}, {"duration": 100, "images": [[124, 1395]]}, {"duration": 100, "images": [[248, 1395]], "exitBranch": 48}, {"duration": 100, "images": [[372, 1395]], "exitBranch": 49}, {"duration": 100, "images": [[496, 1395]]}, {"duration": 100, "images": [[620, 1395]], "sound": "4"}, {"duration": 100, "images": [[744, 1395]]}, {"duration": 100, "images": [[868, 1395]]}, {"duration": 600}, {"duration": 100, "images": [[992, 1395]]}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1364, 1395]]}, {"duration": 100, "images": [[1488, 1395]]}, {"duration": 100, "images": [[1612, 1395]]}, {"duration": 100, "images": [[1736, 1395]]}, {"duration": 100, "images": [[1860, 1395]]}, {"duration": 100, "images": [[0, 0]]}]}, "Thinking": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[496, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[1116, 93]]}, {"duration": 100, "images": [[1240, 93]]}, {"duration": 100, "images": [[1364, 93]]}, {"duration": 100, "images": [[1488, 93]]}, {"duration": 100, "images": [[1612, 93]]}, {"duration": 100, "images": [[1736, 93]], "sound": "4"}, {"duration": 100, "images": [[1860, 93]]}, {"duration": 100, "images": [[1984, 93]]}, {"duration": 100, "images": [[2108, 93]]}, {"duration": 100, "images": [[2232, 93]]}, {"duration": 100, "images": [[2356, 93]]}, {"duration": 100, "images": [[2480, 93]]}, {"duration": 100, "images": [[2604, 93]]}, {"duration": 100, "images": [[2728, 93]]}, {"duration": 100, "images": [[2852, 93]]}, {"duration": 100, "images": [[2976, 93]]}, {"duration": 100, "images": [[3100, 93]]}, {"duration": 100, "images": [[3224, 93]]}, {"duration": 100, "images": [[0, 186]]}, {"duration": 100, "images": [[124, 186]]}, {"duration": 100, "images": [[248, 186]]}, {"duration": 100, "images": [[372, 186]]}, {"duration": 100, "images": [[496, 186]]}, {"duration": 100, "images": [[620, 186]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 21, "weight": 100}]}}, {"duration": 100, "images": [[744, 186]]}, {"duration": 100, "images": [[868, 186]]}, {"duration": 100, "images": [[992, 186]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[744, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "Explain": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 900, "images": [[1364, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleRopePile": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[1488, 186]], "exitBranch": 74}, {"duration": 100, "images": [[1612, 186]]}, {"duration": 100, "images": [[1736, 186]], "exitBranch": 74}, {"duration": 100, "images": [[1860, 186]]}, {"duration": 100, "images": [[1984, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2108, 186]]}, {"duration": 100, "images": [[2232, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2356, 186]]}, {"duration": 100, "images": [[2480, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2604, 186]]}, {"duration": 100, "images": [[2728, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2852, 186]]}, {"duration": 100, "images": [[2976, 186]], "exitBranch": 74}, {"duration": 100, "images": [[3100, 186]]}, {"duration": 100, "images": [[3224, 186]], "exitBranch": 74}, {"duration": 100, "images": [[0, 279]]}, {"duration": 100, "images": [[124, 279]], "exitBranch": 74}, {"duration": 100, "images": [[248, 279]]}, {"duration": 100, "images": [[372, 279]], "exitBranch": 74}, {"duration": 100, "images": [[496, 279]]}, {"duration": 100, "images": [[620, 279]], "exitBranch": 74}, {"duration": 100, "images": [[744, 279]]}, {"duration": 100, "images": [[868, 279]], "exitBranch": 74}, {"duration": 100, "images": [[992, 279]]}, {"duration": 100, "images": [[1116, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1240, 279]]}, {"duration": 100, "images": [[1364, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1488, 279]]}, {"duration": 100, "images": [[1612, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1736, 279]]}, {"duration": 100, "images": [[1860, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1984, 279]]}, {"duration": 100, "images": [[2108, 279]], "exitBranch": 74}, {"duration": 100, "images": [[2232, 279]]}, {"duration": 100, "images": [[2356, 279]]}, {"duration": 100, "images": [[2480, 279]], "exitBranch": 74}, {"duration": 100, "images": [[2604, 279]]}, {"duration": 100, "images": [[2728, 279]], "exitBranch": 40}, {"duration": 100, "images": [[2852, 279]]}, {"duration": 100, "images": [[2976, 279]], "exitBranch": 42}, {"duration": 100, "images": [[3100, 279]]}, {"duration": 100, "images": [[3224, 279]], "exitBranch": 44}, {"duration": 100, "images": [[0, 372]]}, {"duration": 100, "images": [[124, 372]], "exitBranch": 46}, {"duration": 100, "images": [[248, 372]]}, {"duration": 100, "images": [[372, 372]], "exitBranch": 48}, {"duration": 100, "images": [[496, 372]]}, {"duration": 100, "images": [[620, 372]], "exitBranch": 50}, {"duration": 100, "images": [[744, 372]]}, {"duration": 100, "images": [[868, 372]], "exitBranch": 52}, {"duration": 100, "images": [[992, 372]]}, {"duration": 100, "images": [[1116, 372]], "exitBranch": 54}, {"duration": 100, "images": [[1240, 372]]}, {"duration": 100, "images": [[1364, 372]], "exitBranch": 56}, {"duration": 100, "images": [[1488, 372]]}, {"duration": 100, "images": [[1612, 372]], "exitBranch": 58}, {"duration": 100, "images": [[1736, 372]]}, {"duration": 100, "images": [[1860, 372]], "exitBranch": 5}, {"duration": 100, "images": [[1984, 372]]}, {"duration": 100, "images": [[2108, 372]], "exitBranch": 70}, {"duration": 100, "images": [[2232, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 95}]}}, {"duration": 100, "images": [[2356, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 25}, {"frameIndex": 67, "weight": 25}, {"frameIndex": 65, "weight": 25}]}}, {"duration": 100, "images": [[2480, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 63, "weight": 95}]}}, {"duration": 100, "images": [[2604, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 25}, {"frameIndex": 67, "weight": 25}, {"frameIndex": 63, "weight": 25}]}}, {"duration": 100, "images": [[2728, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 65, "weight": 95}]}}, {"duration": 100, "images": [[2604, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 25}, {"frameIndex": 65, "weight": 25}, {"frameIndex": 63, "weight": 25}]}}, {"duration": 100, "images": [[2852, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 67, "weight": 95}]}}, {"duration": 100, "images": [[2604, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 65, "weight": 25}, {"frameIndex": 67, "weight": 25}, {"frameIndex": 63, "weight": 25}]}}, {"duration": 100, "images": [[2976, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 95}]}}, {"duration": 100, "images": [[3100, 372]]}, {"duration": 100, "images": [[3224, 372]]}, {"duration": 100, "images": [[0, 465]]}, {"duration": 100, "images": [[124, 465]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleAtom": {"frames": [{"duration": 100, "images": [[0, 0]], "branching": {"branches": [{"frameIndex": 44, "weight": 97}]}}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[1116, 93]]}, {"duration": 100, "images": [[1240, 93]]}, {"duration": 100, "images": [[1364, 93]]}, {"duration": 100, "images": [[1488, 93]]}, {"duration": 100, "images": [[1612, 93]]}, {"duration": 100, "images": [[1736, 93]]}, {"duration": 100, "images": [[1860, 93]]}, {"duration": 100, "images": [[1984, 93]]}, {"duration": 100, "images": [[2108, 93]]}, {"duration": 100, "images": [[2232, 93]]}, {"duration": 100, "images": [[2356, 93]]}, {"duration": 100, "images": [[2480, 93]]}, {"duration": 100, "images": [[2604, 93]]}, {"duration": 100, "images": [[2728, 93]]}, {"duration": 100, "images": [[2852, 93]]}, {"duration": 100, "images": [[2976, 93]]}, {"duration": 100, "images": [[3100, 93]]}, {"duration": 100, "images": [[3224, 93]]}, {"duration": 100, "images": [[0, 186]]}, {"duration": 100, "images": [[124, 186]]}, {"duration": 100, "images": [[248, 186]]}, {"duration": 100, "images": [[372, 186]]}, {"duration": 100, "images": [[496, 186]]}, {"duration": 100, "images": [[620, 186]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 21, "weight": 95}]}}, {"duration": 100, "images": [[744, 186]]}, {"duration": 100, "images": [[868, 186]]}, {"duration": 100, "images": [[992, 186]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "Print": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[248, 465]]}, {"duration": 100, "images": [[372, 465]]}, {"duration": 100, "images": [[496, 465]]}, {"duration": 100, "images": [[620, 465]], "sound": "5"}, {"duration": 100, "images": [[744, 465]]}, {"duration": 100, "images": [[868, 465]]}, {"duration": 100, "images": [[992, 465]]}, {"duration": 100, "images": [[1116, 465]]}, {"duration": 100, "images": [[1240, 465]]}, {"duration": 100, "images": [[1364, 465]], "sound": "8"}, {"duration": 150, "images": [[1488, 465]]}, {"duration": 100, "images": [[1612, 465]], "sound": "8"}, {"duration": 100, "images": [[1736, 465]]}, {"duration": 100, "images": [[1860, 465]]}, {"duration": 100, "images": [[1984, 465]]}, {"duration": 100, "images": [[2108, 465]]}, {"duration": 100, "images": [[2232, 465]]}, {"duration": 100, "images": [[2356, 465]]}, {"duration": 100, "images": [[2480, 465]]}, {"duration": 100, "images": [[2604, 465]]}, {"duration": 100, "images": [[2728, 465]]}, {"duration": 450, "images": [[2852, 465]]}, {"duration": 200, "images": [[2976, 465]]}, {"duration": 100, "images": [[3100, 465]], "exitBranch": 26}, {"duration": 100, "images": [[3224, 465]], "sound": "7"}, {"duration": 100, "images": [[0, 558]], "exitBranch": 28}, {"duration": 100, "images": [[124, 558]]}, {"duration": 100, "images": [[248, 558]], "exitBranch": 30}, {"duration": 100, "images": [[372, 558]]}, {"duration": 600, "images": [[496, 558]], "exitBranch": 32}, {"duration": 100, "images": [[620, 558]], "sound": "7"}, {"duration": 100, "images": [[744, 558]], "exitBranch": 34}, {"duration": 100, "images": [[868, 558]]}, {"duration": 100, "images": [[992, 558]], "exitBranch": 36}, {"duration": 100, "images": [[1116, 558]]}, {"duration": 600, "images": [[1240, 558]], "exitBranch": 38}, {"duration": 100, "images": [[1364, 558]], "sound": "7"}, {"duration": 100, "images": [[1488, 558]], "exitBranch": 40}, {"duration": 100, "images": [[1612, 558]]}, {"duration": 100, "images": [[1736, 558]], "exitBranch": 44}, {"duration": 600, "images": [[1860, 558]]}, {"duration": 100, "images": [[1984, 558]], "exitBranch": 44, "sound": "7"}, {"duration": 100, "images": [[2108, 558]]}, {"duration": 100, "images": [[2232, 558]], "exitBranch": 46}, {"duration": 100, "images": [[2356, 558]]}, {"duration": 100, "images": [[2480, 558]], "exitBranch": 48}, {"duration": 100, "images": [[2604, 558]]}, {"duration": 100, "images": [[2728, 558]], "exitBranch": 51}, {"duration": 600, "images": [[2852, 558]]}, {"duration": 100, "images": [[2976, 558]]}, {"duration": 100, "images": [[3100, 558]], "exitBranch": 53}, {"duration": 100, "images": [[3224, 558]], "sound": "11"}, {"duration": 100, "images": [[0, 651]]}, {"duration": 100, "images": [[124, 651]]}, {"duration": 100, "images": [[248, 651]]}, {"duration": 100, "images": [[372, 651]], "exitBranch": 58}, {"duration": 100, "images": [[496, 651]]}, {"duration": 100, "images": [[0, 0]]}]}, "Hide": {"frames": [{"duration": 10, "images": [[0, 0]]}, {"duration": 10, "images": [[2480, 0]]}, {"duration": 10, "images": [[2604, 0]]}, {"duration": 10, "images": [[2728, 0]]}, {"duration": 10}]}, "GetAttention": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1240, 651]]}, {"duration": 100, "images": [[1364, 651]]}, {"duration": 100, "images": [[1488, 651]]}, {"duration": 100, "images": [[1612, 651]]}, {"duration": 100, "images": [[1736, 651]]}, {"duration": 100, "images": [[1860, 651]]}, {"duration": 100, "images": [[1984, 651]]}, {"duration": 100, "images": [[2108, 651]]}, {"duration": 100, "images": [[2232, 651]], "sound": "10"}, {"duration": 150, "images": [[2356, 651]]}, {"duration": 150, "images": [[2232, 651]], "sound": "10"}, {"duration": 150, "images": [[2356, 651]]}, {"duration": 150, "images": [[2232, 651]], "sound": "10"}, {"duration": 150, "images": [[2480, 651]]}, {"duration": 100, "images": [[2604, 651]]}, {"duration": 100, "images": [[2728, 651]]}, {"duration": 100, "images": [[2852, 651]]}, {"duration": 100, "images": [[2976, 651]]}, {"duration": 100, "images": [[3100, 651]]}, {"duration": 100, "images": [[3224, 651]]}, {"duration": 100, "images": [[0, 744]]}, {"duration": 100, "images": [[124, 744]], "exitBranch": 23}, {"duration": 100, "images": [[0, 0]]}]}, "Save": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[3100, 837]]}, {"duration": 130, "images": [[3224, 837]], "sound": "13"}, {"duration": 130, "images": [[0, 930]]}, {"duration": 100, "images": [[124, 930]]}, {"duration": 100, "images": [[248, 930]]}, {"duration": 100, "images": [[372, 930]]}, {"duration": 100, "images": [[496, 930]], "exitBranch": 10}, {"duration": 450, "images": [[620, 930]]}, {"duration": 100, "images": [[496, 930]], "exitBranch": 10}, {"duration": 100, "images": [[744, 930]]}, {"duration": 100, "images": [[868, 930]]}, {"duration": 100, "images": [[992, 930]]}, {"duration": 130, "images": [[1116, 930]], "sound": "8"}, {"duration": 130, "images": [[1240, 930]]}, {"duration": 130, "images": [[1364, 930]]}, {"duration": 130, "images": [[1488, 930]], "sound": "8"}, {"duration": 130, "images": [[1612, 930]], "sound": "8"}, {"duration": 130, "images": [[1736, 930]]}, {"duration": 130, "images": [[1860, 930]], "sound": "8"}, {"duration": 100, "images": [[1984, 930]]}, {"duration": 100, "images": [[2108, 930]], "sound": "9"}, {"duration": 160, "images": [[2232, 930]]}, {"duration": 100, "images": [[2356, 930]], "sound": "2"}, {"duration": 100, "images": [[2480, 930]]}, {"duration": 100, "images": [[2604, 930]]}, {"duration": 100, "images": [[2728, 930]], "exitBranch": 34}, {"duration": 450, "images": [[2852, 930]]}, {"duration": 100, "images": [[2976, 930]], "exitBranch": 34, "sound": "10"}, {"duration": 400, "images": [[3100, 930]]}, {"duration": 100, "images": [[3224, 930]], "exitBranch": 34}, {"duration": 100, "images": [[0, 1023]]}, {"duration": 100, "images": [[124, 1023]]}, {"duration": 100, "images": [[248, 1023]]}, {"duration": 100, "images": [[372, 1023]]}, {"duration": 100, "images": [[496, 1023]]}, {"duration": 100, "images": [[620, 1023]]}, {"duration": 100, "images": [[744, 1023]]}, {"duration": 100, "images": [[868, 1023]]}, {"duration": 100, "images": [[992, 1023]]}, {"duration": 100, "images": [[1116, 1023]]}, {"duration": 100, "images": [[0, 0]]}]}, "GetTechy": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[496, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[1116, 93]]}, {"duration": 100, "images": [[1240, 93]]}, {"duration": 100, "images": [[1364, 93]]}, {"duration": 100, "images": [[1488, 93]]}, {"duration": 100, "images": [[1612, 93]]}, {"duration": 100, "images": [[1736, 93]], "sound": "4"}, {"duration": 100, "images": [[1860, 93]]}, {"duration": 100, "images": [[1984, 93]]}, {"duration": 100, "images": [[2108, 93]]}, {"duration": 100, "images": [[2232, 93]]}, {"duration": 100, "images": [[2356, 93]]}, {"duration": 100, "images": [[2480, 93]]}, {"duration": 100, "images": [[2604, 93]]}, {"duration": 100, "images": [[2728, 93]]}, {"duration": 100, "images": [[2852, 93]]}, {"duration": 100, "images": [[2976, 93]]}, {"duration": 100, "images": [[3100, 93]]}, {"duration": 100, "images": [[3224, 93]]}, {"duration": 100, "images": [[0, 186]]}, {"duration": 100, "images": [[124, 186]]}, {"duration": 100, "images": [[248, 186]]}, {"duration": 100, "images": [[372, 186]]}, {"duration": 100, "images": [[496, 186]]}, {"duration": 100, "images": [[620, 186]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 21, "weight": 100}]}}, {"duration": 100, "images": [[744, 186]]}, {"duration": 100, "images": [[868, 186]]}, {"duration": 100, "images": [[992, 186]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[744, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureUp": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[868, 744]]}, {"duration": 100, "images": [[992, 744]]}, {"duration": 100, "images": [[1116, 744]]}, {"duration": 100, "images": [[1240, 744]]}, {"duration": 100, "images": [[1364, 744]], "exitBranch": 11}, {"duration": 100, "images": [[1488, 744]]}, {"duration": 100, "images": [[1612, 744]], "branching": {"branches": [{"frameIndex": 5, "weight": 50}]}}, {"duration": 100, "images": [[1736, 744]]}, {"duration": 1200, "images": [[1860, 744]]}, {"duration": 100, "images": [[1984, 744]]}, {"duration": 100, "images": [[1364, 744]]}, {"duration": 100, "images": [[1240, 744]]}, {"duration": 100, "images": [[1116, 744]]}, {"duration": 100, "images": [[992, 744]]}, {"duration": 100, "images": [[868, 744]]}, {"duration": 100, "images": [[0, 0]]}]}, "Idle1_1": {"frames": [{"duration": 100, "images": [[0, 0]], "branching": {"branches": [{"frameIndex": 37, "weight": 20}]}}, {"duration": 100, "images": [[2108, 744]], "exitBranch": 2, "branching": {"branches": [{"frameIndex": 1, "weight": 95}]}}, {"duration": 100, "images": [[2232, 744]], "exitBranch": 16}, {"duration": 100, "images": [[2356, 744]]}, {"duration": 300, "images": [[2480, 744]], "exitBranch": 5, "branching": {"branches": [{"frameIndex": 4, "weight": 95}]}}, {"duration": 100, "images": [[2604, 744]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 9, "weight": 25}, {"frameIndex": 12, "weight": 25}, {"frameIndex": 15, "weight": 25}]}}, {"duration": 100, "images": [[2728, 744]]}, {"duration": 300, "images": [[2852, 744]], "exitBranch": 8, "branching": {"branches": [{"frameIndex": 7, "weight": 94}, {"frameIndex": 5, "weight": 3}]}}, {"duration": 100, "images": [[2976, 744]], "exitBranch": 16}, {"duration": 100, "images": [[3100, 744]]}, {"duration": 300, "images": [[3224, 744]], "exitBranch": 11, "branching": {"branches": [{"frameIndex": 10, "weight": 94}, {"frameIndex": 8, "weight": 2}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[0, 837]], "exitBranch": 16}, {"duration": 100, "images": [[124, 837]]}, {"duration": 300, "images": [[248, 837]], "exitBranch": 14, "branching": {"branches": [{"frameIndex": 13, "weight": 93}, {"frameIndex": 11, "weight": 3}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[372, 837]], "exitBranch": 16}, {"duration": 100, "images": [[496, 837]]}, {"duration": 300, "images": [[620, 837]], "exitBranch": 17, "branching": {"branches": [{"frameIndex": 16, "weight": 95}]}}, {"duration": 100, "images": [[744, 837]], "exitBranch": 36, "branching": {"branches": [{"frameIndex": 36, "weight": 90}]}}, {"duration": 100, "images": [[868, 837]]}, {"duration": 300, "images": [[992, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1116, 837]]}, {"duration": 100, "images": [[1240, 837]], "exitBranch": 35}, {"duration": 300, "images": [[1364, 837]], "exitBranch": 23, "branching": {"branches": [{"frameIndex": 22, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[1488, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 24, "weight": 25}, {"frameIndex": 27, "weight": 25}, {"frameIndex": 30, "weight": 25}]}}, {"duration": 100, "images": [[1612, 837]]}, {"duration": 300, "images": [[1736, 837]], "exitBranch": 26, "branching": {"branches": [{"frameIndex": 25, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[1860, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1984, 837]]}, {"duration": 300, "images": [[2108, 837]], "exitBranch": 29, "branching": {"branches": [{"frameIndex": 28, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[2232, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2356, 837]]}, {"duration": 300, "images": [[2480, 837]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 31, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[2604, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2728, 837]]}, {"duration": 300, "images": [[2852, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 34, "weight": 80}]}}, {"duration": 100, "images": [[2976, 837]]}, {"duration": 100, "images": [[0, 0]], "exitBranch": 42}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 900, "images": [[1364, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[0, 0]]}]}, "Processing": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1240, 1023]], "sound": "14"}, {"duration": 100, "images": [[1364, 1023]]}, {"duration": 100, "images": [[1488, 1023]]}, {"duration": 100, "images": [[1612, 1023]], "exitBranch": 33}, {"duration": 100, "images": [[1736, 1023]]}, {"duration": 100, "images": [[1860, 1023]]}, {"duration": 100, "images": [[1984, 1023]]}, {"duration": 100, "images": [[2108, 1023]], "sound": "11"}, {"duration": 100, "images": [[2232, 1023]], "exitBranch": 31}, {"duration": 100, "images": [[2356, 1023]]}, {"duration": 100, "images": [[2480, 1023]]}, {"duration": 100, "images": [[2604, 1023]]}, {"duration": 100, "images": [[2728, 1023]], "exitBranch": 31}, {"duration": 100, "images": [[2852, 1023]]}, {"duration": 100, "images": [[2976, 1023]]}, {"duration": 100, "images": [[3100, 1023]]}, {"duration": 100, "images": [[3224, 1023]]}, {"duration": 100, "images": [[0, 1116]], "sound": "11"}, {"duration": 100, "images": [[124, 1116]]}, {"duration": 100, "images": [[248, 1116]]}, {"duration": 100, "images": [[372, 1116]]}, {"duration": 100, "images": [[496, 1116]]}, {"duration": 100, "images": [[620, 1116]]}, {"duration": 100, "images": [[744, 1116]]}, {"duration": 100, "images": [[868, 1116]]}, {"duration": 100, "images": [[992, 1116]]}, {"duration": 100, "images": [[1116, 1116]], "exitBranch": 28, "branching": {"branches": [{"frameIndex": 7, "weight": 100}]}}, {"duration": 100, "images": [[1240, 1116]], "sound": "11"}, {"duration": 100, "images": [[1364, 1116]]}, {"duration": 100, "images": [[1488, 1116]]}, {"duration": 100, "images": [[1612, 1116]]}, {"duration": 100, "images": [[1736, 1116]]}, {"duration": 100, "images": [[1860, 1116]]}, {"duration": 100, "images": [[1984, 1116]]}, {"duration": 100, "images": [[2108, 1116]]}, {"duration": 100, "images": [[2232, 1116]]}, {"duration": 100, "images": [[0, 0]]}]}, "Alert": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[2356, 1116]]}, {"duration": 100, "images": [[2480, 1116]]}, {"duration": 100, "images": [[2604, 1116]]}, {"duration": 100, "images": [[2728, 1116]]}, {"duration": 100, "images": [[2852, 1116]]}, {"duration": 100, "images": [[2976, 1116]], "sound": "6"}, {"duration": 100, "images": [[3100, 1116]]}, {"duration": 100, "images": [[3224, 1116]]}, {"duration": 100, "images": [[0, 1209]]}, {"duration": 500, "images": [[124, 1209]], "exitBranch": 13}, {"duration": 100, "images": [[248, 1209]], "exitBranch": 13}, {"duration": 100, "images": [[372, 1209]]}, {"duration": 100, "images": [[496, 1209]]}, {"duration": 100, "images": [[620, 1209]]}, {"duration": 100, "images": [[744, 1209]]}, {"duration": 100, "images": [[868, 1209]]}, {"duration": 100, "images": [[992, 1209]]}, {"duration": 100, "images": [[1116, 1209]]}, {"duration": 100, "images": [[0, 0]]}]}, "LookUpRight": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[248, 744]], "exitBranch": 5}, {"duration": 100, "images": [[372, 744]], "exitBranch": 4}, {"duration": 1200, "images": [[496, 744]]}, {"duration": 100, "images": [[620, 744]]}, {"duration": 100, "images": [[744, 744]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleSideToSide": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[2108, 744]], "exitBranch": 2, "branching": {"branches": [{"frameIndex": 1, "weight": 95}]}}, {"duration": 100, "images": [[2232, 744]], "exitBranch": 16}, {"duration": 100, "images": [[2356, 744]]}, {"duration": 300, "images": [[2480, 744]], "exitBranch": 5, "branching": {"branches": [{"frameIndex": 4, "weight": 95}]}}, {"duration": 100, "images": [[2604, 744]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 9, "weight": 25}, {"frameIndex": 12, "weight": 25}, {"frameIndex": 15, "weight": 25}]}}, {"duration": 100, "images": [[2728, 744]]}, {"duration": 300, "images": [[2852, 744]], "exitBranch": 8, "branching": {"branches": [{"frameIndex": 7, "weight": 92}, {"frameIndex": 5, "weight": 5}]}}, {"duration": 100, "images": [[2976, 744]], "exitBranch": 16}, {"duration": 100, "images": [[3100, 744]]}, {"duration": 300, "images": [[3224, 744]], "exitBranch": 11, "branching": {"branches": [{"frameIndex": 10, "weight": 91}, {"frameIndex": 8, "weight": 5}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[0, 837]], "exitBranch": 16}, {"duration": 100, "images": [[124, 837]]}, {"duration": 300, "images": [[248, 837]], "exitBranch": 14, "branching": {"branches": [{"frameIndex": 13, "weight": 91}, {"frameIndex": 11, "weight": 3}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[372, 837]], "exitBranch": 16}, {"duration": 100, "images": [[496, 837]]}, {"duration": 300, "images": [[620, 837]], "exitBranch": 17, "branching": {"branches": [{"frameIndex": 16, "weight": 75}]}}, {"duration": 100, "images": [[744, 837]], "exitBranch": 36, "branching": {"branches": [{"frameIndex": 36, "weight": 90}]}}, {"duration": 100, "images": [[868, 837]]}, {"duration": 300, "images": [[992, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1116, 837]]}, {"duration": 100, "images": [[1240, 837]], "exitBranch": 35}, {"duration": 300, "images": [[1364, 837]], "exitBranch": 23, "branching": {"branches": [{"frameIndex": 22, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[1488, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 24, "weight": 25}, {"frameIndex": 27, "weight": 25}, {"frameIndex": 30, "weight": 25}]}}, {"duration": 100, "images": [[1612, 837]]}, {"duration": 0, "images": [[1736, 837]], "exitBranch": 26, "branching": {"branches": [{"frameIndex": 25, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[1860, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1984, 837]]}, {"duration": 300, "images": [[2108, 837]], "exitBranch": 29, "branching": {"branches": [{"frameIndex": 28, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[2232, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2356, 837]]}, {"duration": 300, "images": [[2480, 837]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 31, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[2604, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2728, 837]]}, {"duration": 300, "images": [[2852, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 34, "weight": 80}]}}, {"duration": 100, "images": [[2976, 837]]}, {"duration": 100, "images": [[0, 0]]}]}, "GoodBye": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 34, "sound": "15", "branching": {"branches": [{"frameIndex": 34, "weight": 50}]}}, {"duration": 100, "images": [[2356, 2883]]}, {"duration": 250, "images": [[2480, 2883]]}, {"duration": 100, "images": [[2604, 2883]], "sound": "13"}, {"duration": 100, "images": [[2728, 2883]]}, {"duration": 100, "images": [[2852, 2883]]}, {"duration": 100, "images": [[2976, 2883]]}, {"duration": 100, "images": [[3100, 2883]], "sound": "12"}, {"duration": 100, "images": [[3224, 2883]]}, {"duration": 100, "images": [[0, 2976]]}, {"duration": 100, "images": [[124, 2976]]}, {"duration": 100, "images": [[248, 2976]]}, {"duration": 100, "images": [[372, 2976]]}, {"duration": 100, "images": [[496, 2976]]}, {"duration": 200, "images": [[620, 2976]]}, {"duration": 200, "images": [[744, 2976]], "sound": "10"}, {"duration": 200, "images": [[620, 2976]]}, {"duration": 200, "images": [[868, 2976]]}, {"duration": 100, "images": [[992, 2976]]}, {"duration": 100, "images": [[1116, 2976]]}, {"duration": 200, "images": [[1240, 2976]]}, {"duration": 100, "images": [[1364, 2976]], "sound": "14"}, {"duration": 100, "images": [[1488, 2976]]}, {"duration": 100, "images": [[1612, 2976]]}, {"duration": 100, "images": [[1736, 2976]]}, {"duration": 100, "images": [[1860, 2976]]}, {"duration": 100, "images": [[1984, 2976]]}, {"duration": 100, "images": [[2108, 2976]]}, {"duration": 100, "images": [[2232, 2976]]}, {"duration": 100, "images": [[2356, 2976]]}, {"duration": 100, "images": [[2480, 2976]], "sound": "11"}, {"duration": 100, "images": [[2604, 2976]]}, {"duration": 100, "images": [[2728, 2976]]}, {"duration": 100, "images": [[2852, 2976]], "exitBranch": 37, "branching": {"branches": [{"frameIndex": 37, "weight": 100}]}}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[992, 1395]]}, {"duration": 100}]}, "LookLeft": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[248, 1488]], "exitBranch": 5}, {"duration": 100, "images": [[372, 1488]], "exitBranch": 4}, {"duration": 1200, "images": [[496, 1488]]}, {"duration": 100, "images": [[620, 1488]]}, {"duration": 100, "images": [[744, 1488]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleHeadScratch": {"frames": [{"duration": 100, "images": [[1984, 2418]], "branching": {"branches": [{"frameIndex": 18, "weight": 85}]}}, {"duration": 100, "images": [[2108, 2418]]}, {"duration": 100, "images": [[2232, 2418]], "exitBranch": 16}, {"duration": 100, "images": [[2356, 2418]]}, {"duration": 100, "images": [[2480, 2418]]}, {"duration": 100, "images": [[2604, 2418]]}, {"duration": 100, "images": [[2728, 2418]], "exitBranch": 16}, {"duration": 100, "images": [[2852, 2418]]}, {"duration": 100, "images": [[2976, 2418]]}, {"duration": 100, "images": [[3100, 2418]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 6, "weight": 80}]}}, {"duration": 100, "images": [[3224, 2418]], "exitBranch": 16}, {"duration": 100, "images": [[0, 2511]]}, {"duration": 100, "images": [[124, 2511]], "exitBranch": 16}, {"duration": 100, "images": [[248, 2511]]}, {"duration": 100, "images": [[372, 2511]]}, {"duration": 100, "images": [[496, 2511]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 12, "weight": 80}]}}, {"duration": 100, "images": [[620, 2511]]}, {"duration": 100, "images": [[744, 2511]]}, {"duration": 100, "images": [[868, 2511]]}]}, "LookUpLeft": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[868, 1488]], "exitBranch": 5}, {"duration": 100, "images": [[992, 1488]], "exitBranch": 4}, {"duration": 1200, "images": [[1116, 1488]]}, {"duration": 100, "images": [[1240, 1488]]}, {"duration": 100, "images": [[1364, 1488]]}, {"duration": 100, "images": [[0, 0]]}]}, "CheckingSomething": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1488, 1488]], "sound": "13"}, {"duration": 100, "images": [[1612, 1488]]}, {"duration": 100, "images": [[1736, 1488]]}, {"duration": 100, "images": [[1860, 1488]]}, {"duration": 100, "images": [[1984, 1488]]}, {"duration": 100, "images": [[2108, 1488]]}, {"duration": 100, "images": [[2232, 1488]]}, {"duration": 200, "images": [[2356, 1488]]}, {"duration": 200, "images": [[2480, 1488]]}, {"duration": 200, "images": [[2604, 1488]]}, {"duration": 100, "images": [[2728, 1488]], "sound": "10"}, {"duration": 100, "images": [[2852, 1488]], "exitBranch": 52}, {"duration": 140, "images": [[2976, 1488]]}, {"duration": 100, "images": [[3100, 1488]]}, {"duration": 100, "images": [[3224, 1488]]}, {"duration": 100, "images": [[0, 1581]]}, {"duration": 200, "images": [[124, 1581]]}, {"duration": 100, "images": [[248, 1581]]}, {"duration": 100, "images": [[372, 1581]]}, {"duration": 100, "images": [[496, 1581]]}, {"duration": 200, "images": [[620, 1581]], "exitBranch": 22, "branching": {"branches": [{"frameIndex": 21, "weight": 50}]}}, {"duration": 100, "images": [[744, 1581]]}, {"duration": 100, "images": [[868, 1581]]}, {"duration": 200, "images": [[992, 1581]], "exitBranch": 25, "branching": {"branches": [{"frameIndex": 24, "weight": 50}]}}, {"duration": 100, "images": [[1116, 1581]]}, {"duration": 100, "images": [[1240, 1581]]}, {"duration": 100, "images": [[1364, 1581]]}, {"duration": 200, "images": [[1488, 1581]], "exitBranch": 29, "branching": {"branches": [{"frameIndex": 28, "weight": 50}]}}, {"duration": 100, "images": [[1612, 1581]]}, {"duration": 100, "images": [[1736, 1581]]}, {"duration": 200, "images": [[1860, 1581]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 31, "weight": 50}]}}, {"duration": 100, "images": [[1984, 1581]]}, {"duration": 100, "images": [[2108, 1581]]}, {"duration": 100, "images": [[2232, 1581]]}, {"duration": 100, "images": [[2356, 1581]]}, {"duration": 200, "images": [[2480, 1581]], "exitBranch": 37, "branching": {"branches": [{"frameIndex": 36, "weight": 50}]}}, {"duration": 100, "images": [[2604, 1581]]}, {"duration": 100, "images": [[2728, 1581]]}, {"duration": 200, "images": [[2852, 1581]], "exitBranch": 40, "branching": {"branches": [{"frameIndex": 39, "weight": 50}]}}, {"duration": 100, "images": [[2976, 1581]]}, {"duration": 100, "images": [[3100, 1581]], "exitBranch": 50}, {"duration": 100, "images": [[3224, 1581]], "branching": {"branches": [{"frameIndex": 14, "weight": 75}]}}, {"duration": 100, "images": [[0, 1674]]}, {"duration": 200, "images": [[124, 1674]], "exitBranch": 51, "branching": {"branches": [{"frameIndex": 44, "weight": 50}]}}, {"duration": 100, "images": [[248, 1674]]}, {"duration": 100, "images": [[372, 1674]]}, {"duration": 100, "images": [[496, 1674]]}, {"duration": 100, "images": [[620, 1674]], "exitBranch": 49, "branching": {"branches": [{"frameIndex": 48, "weight": 85}]}}, {"duration": 100, "images": [[744, 1674]], "sound": "10"}, {"duration": 100, "images": [[868, 1674]], "exitBranch": 52, "branching": {"branches": [{"frameIndex": 10, "weight": 100}]}}, {"duration": 100, "images": [[992, 1674]]}, {"duration": 100, "images": [[1116, 1674]], "sound": "14"}, {"duration": 100, "images": [[1240, 1674]]}, {"duration": 100, "images": [[0, 0]]}]}, "Hearing_1": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[2356, 1116]]}, {"duration": 100, "images": [[2480, 1116]]}, {"duration": 100, "images": [[2604, 1116]]}, {"duration": 100, "images": [[2728, 1116]]}, {"duration": 100, "images": [[2852, 1116]]}, {"duration": 100, "images": [[2976, 1116]], "sound": "6"}, {"duration": 100, "images": [[3100, 1116]]}, {"duration": 100, "images": [[3224, 1116]]}, {"duration": 100, "images": [[0, 1209]]}, {"duration": 500, "images": [[124, 1209]], "exitBranch": 32}, {"duration": 100, "images": [[1364, 1674]], "branching": {"branches": [{"frameIndex": 6, "weight": 60}]}}, {"duration": 100, "images": [[2976, 1116]]}, {"duration": 100, "images": [[3100, 1116]], "exitBranch": 32}, {"duration": 100, "images": [[3224, 1116]]}, {"duration": 100, "images": [[0, 1209]], "exitBranch": 32}, {"duration": 500, "images": [[1364, 1674]], "branching": {"branches": [{"frameIndex": 12, "weight": 50}]}}, {"duration": 100, "images": [[1488, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[1612, 1674]]}, {"duration": 100, "images": [[1736, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[1860, 1674]]}, {"duration": 400, "images": [[1984, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2108, 1674]], "branching": {"branches": [{"frameIndex": 18, "weight": 50}]}}, {"duration": 100, "images": [[2232, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2356, 1674]]}, {"duration": 100, "images": [[2480, 1674]], "exitBranch": 32}, {"duration": 500, "images": [[2604, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2728, 1674]], "branching": {"branches": [{"frameIndex": 17, "weight": 50}]}}, {"duration": 100, "images": [[2852, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2976, 1674]]}, {"duration": 100, "images": [[248, 1209]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 12, "weight": 100}]}}, {"duration": 100, "images": [[372, 1209]]}, {"duration": 100, "images": [[496, 1209]]}, {"duration": 100, "images": [[620, 1209]]}, {"duration": 100, "images": [[744, 1209]]}, {"duration": 100, "images": [[868, 1209]]}, {"duration": 100, "images": [[992, 1209]]}, {"duration": 100, "images": [[1116, 1209]]}, {"duration": 100, "images": [[0, 0]]}]}, "GetWizardy": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 10, "images": [[124, 0]]}, {"duration": 10, "images": [[248, 0]]}, {"duration": 10, "images": [[372, 0]], "sound": "14"}, {"duration": 10, "images": [[496, 0]]}, {"duration": 10, "images": [[620, 0]]}, {"duration": 10, "images": [[744, 0]]}, {"duration": 10, "images": [[868, 0]]}, {"duration": 10, "images": [[992, 0]], "sound": "1"}, {"duration": 100, "images": [[1116, 0]]}, {"duration": 100, "images": [[1240, 0]]}, {"duration": 100, "images": [[1364, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1612, 0]], "sound": "10"}, {"duration": 100, "images": [[1736, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1860, 0]]}, {"duration": 100, "images": [[1984, 0]]}, {"duration": 100, "images": [[2108, 0]]}, {"duration": 100, "images": [[2232, 0]]}, {"duration": 100, "images": [[2356, 0]], "exitBranch": 21}, {"duration": 100, "images": [[0, 0]]}]}, "IdleFingerTap": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[2976, 2976]]}, {"duration": 100, "images": [[3100, 2976]]}, {"duration": 100, "images": [[3224, 2976]], "exitBranch": 8}, {"duration": 100, "images": [[0, 3069]], "exitBranch": 8}, {"duration": 100, "images": [[124, 3069]], "branching": {"branches": [{"frameIndex": 7, "weight": 3}]}}, {"duration": 150, "images": [[248, 3069]], "exitBranch": 7, "branching": {"branches": [{"frameIndex": 6, "weight": 98}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[372, 3069]], "exitBranch": 8}, {"duration": 100, "images": [[496, 3069]]}, {"duration": 100, "images": [[620, 3069]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureLeft": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[3100, 1674]]}, {"duration": 100, "images": [[3224, 1674]]}, {"duration": 100, "images": [[0, 1767]]}, {"duration": 100, "images": [[124, 1767]], "exitBranch": 12}, {"duration": 100, "images": [[248, 1767]]}, {"duration": 100, "images": [[372, 1767]], "branching": {"branches": [{"frameIndex": 4, "weight": 60}]}}, {"duration": 100, "images": [[496, 1767]]}, {"duration": 100, "images": [[620, 1767]]}, {"duration": 1200, "images": [[744, 1767]]}, {"duration": 100, "images": [[868, 1767]]}, {"duration": 450, "images": [[992, 1767]]}, {"duration": 100, "images": [[0, 1767]]}, {"duration": 100, "images": [[3224, 1674]]}, {"duration": 100, "images": [[3100, 1674]]}, {"duration": 100, "images": [[0, 0]]}]}, "Wave": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15", "branching": {"branches": [{"frameIndex": 15, "weight": 33}]}}, {"duration": 100, "images": [[1116, 1767]]}, {"duration": 100, "images": [[1240, 1767]]}, {"duration": 100, "images": [[1364, 1767]], "exitBranch": 13}, {"duration": 100, "images": [[1488, 1767]], "exitBranch": 13}, {"duration": 100, "images": [[1612, 1767]], "exitBranch": 13}, {"duration": 100, "images": [[1736, 1767]], "branching": {"branches": [{"frameIndex": 9, "weight": 100}]}}, {"duration": 100, "images": [[1860, 1767]], "exitBranch": 11, "sound": "10"}, {"duration": 100, "images": [[1984, 1767]]}, {"duration": 100, "images": [[2108, 1767]], "exitBranch": 11, "sound": "10"}, {"duration": 100, "images": [[2232, 1767]]}, {"duration": 100, "images": [[2356, 1767]], "sound": "10"}, {"duration": 100, "images": [[2480, 1767]]}, {"duration": 100, "images": [[2604, 1767]]}, {"duration": 100, "images": [[2728, 1767]], "exitBranch": 26, "branching": {"branches": [{"frameIndex": 26, "weight": 100}]}}, {"duration": 100, "images": [[2852, 1767]]}, {"duration": 100, "images": [[2976, 1767]]}, {"duration": 100, "images": [[3100, 1767]], "sound": "12"}, {"duration": 100, "images": [[3224, 1767]]}, {"duration": 100, "images": [[0, 1860]]}, {"duration": 100, "images": [[124, 1860]], "exitBranch": 24, "sound": "10"}, {"duration": 1200, "images": [[248, 1860]]}, {"duration": 100, "images": [[372, 1860]], "exitBranch": 24, "sound": "10"}, {"duration": 1300, "images": [[248, 1860]]}, {"duration": 50, "images": [[496, 1860]]}, {"duration": 50, "images": [[2976, 1767]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureRight": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[620, 1860]]}, {"duration": 100, "images": [[744, 1860]]}, {"duration": 100, "images": [[868, 1860]]}, {"duration": 100, "images": [[992, 1860]]}, {"duration": 100, "images": [[1116, 1860]], "exitBranch": 11}, {"duration": 100, "images": [[1240, 1860]]}, {"duration": 100, "images": [[1364, 1860]], "branching": {"branches": [{"frameIndex": 5, "weight": 50}]}}, {"duration": 100, "images": [[1488, 1860]]}, {"duration": 1200, "images": [[1612, 1860]]}, {"duration": 100, "images": [[1736, 1860]]}, {"duration": 550, "images": [[1116, 1860]]}, {"duration": 100, "images": [[992, 1860]]}, {"duration": 100, "images": [[868, 1860]]}, {"duration": 100, "images": [[744, 1860]]}, {"duration": 100, "images": [[620, 1860]]}, {"duration": 100, "images": [[0, 0]]}]}, "Writing": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1860, 1860]]}, {"duration": 100, "images": [[1984, 1860]]}, {"duration": 100, "images": [[2108, 1860]]}, {"duration": 100, "images": [[2232, 1860]]}, {"duration": 100, "images": [[2356, 1860]]}, {"duration": 100, "images": [[2480, 1860]]}, {"duration": 100, "images": [[2604, 1860]]}, {"duration": 100, "images": [[2728, 1860]], "sound": "11"}, {"duration": 100, "images": [[2852, 1860]]}, {"duration": 100, "images": [[2976, 1860]]}, {"duration": 100, "images": [[3100, 1860]]}, {"duration": 100, "images": [[3224, 1860]], "branching": {"branches": [{"frameIndex": 26, "weight": 45}, {"frameIndex": 32, "weight": 25}, {"frameIndex": 42, "weight": 15}]}}, {"duration": 100, "images": [[0, 1953]], "exitBranch": 55}, {"duration": 100, "images": [[124, 1953]], "exitBranch": 55}, {"duration": 100, "images": [[248, 1953]]}, {"duration": 200, "images": [[372, 1953]]}, {"duration": 200, "images": [[496, 1953]], "exitBranch": 55}, {"duration": 200, "images": [[620, 1953]]}, {"duration": 200, "images": [[744, 1953]]}, {"duration": 200, "images": [[868, 1953]], "exitBranch": 55}, {"duration": 200, "images": [[992, 1953]]}, {"duration": 200, "images": [[1116, 1953]]}, {"duration": 200, "images": [[1240, 1953]], "exitBranch": 55}, {"duration": 200, "images": [[1364, 1953]]}, {"duration": 200, "images": [[1488, 1953]], "branching": {"branches": [{"frameIndex": 32, "weight": 20}, {"frameIndex": 42, "weight": 15}]}}, {"duration": 100, "images": [[1612, 1953]], "exitBranch": 56}, {"duration": 100, "images": [[1736, 1953]]}, {"duration": 400, "images": [[1860, 1953]], "branching": {"branches": [{"frameIndex": 28, "weight": 80}]}}, {"duration": 100, "images": [[1984, 1953]], "exitBranch": 30}, {"duration": 400, "images": [[2108, 1953]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 30, "weight": 75}]}}, {"duration": 100, "images": [[2232, 1953]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 13, "weight": 25}, {"frameIndex": 42, "weight": 20}]}}, {"duration": 100, "images": [[2356, 1953]]}, {"duration": 100, "images": [[2480, 1953]]}, {"duration": 200, "images": [[2604, 1953]]}, {"duration": 200, "images": [[2728, 1953]], "exitBranch": 54}, {"duration": 200, "images": [[2852, 1953]]}, {"duration": 200, "images": [[2976, 1953]], "exitBranch": 54}, {"duration": 100, "images": [[3100, 1953]]}, {"duration": 200, "images": [[3224, 1953]]}, {"duration": 200, "images": [[0, 2046]], "exitBranch": 55}, {"duration": 200, "images": [[124, 2046]], "branching": {"branches": [{"frameIndex": 13, "weight": 25}, {"frameIndex": 26, "weight": 25}, {"frameIndex": 32, "weight": 25}]}}, {"duration": 100, "images": [[248, 2046]]}, {"duration": 100, "images": [[372, 2046]], "exitBranch": 55}, {"duration": 100, "images": [[496, 2046]]}, {"duration": 100, "images": [[620, 2046]]}, {"duration": 100, "images": [[744, 2046]]}, {"duration": 100, "images": [[868, 2046]]}, {"duration": 100, "images": [[992, 2046]]}, {"duration": 100, "images": [[1116, 2046]]}, {"duration": 100, "images": [[1240, 2046]]}, {"duration": 100, "images": [[1364, 2046]]}, {"duration": 100, "images": [[1488, 2046]], "exitBranch": 57}, {"duration": 100, "images": [[1612, 2046]], "branching": {"branches": [{"frameIndex": 26, "weight": 33}, {"frameIndex": 32, "weight": 33}, {"frameIndex": 13, "weight": 34}]}}, {"duration": 100, "images": [[1736, 2046]]}, {"duration": 100, "images": [[1860, 2046]]}, {"duration": 100, "images": [[1984, 2046]], "sound": "11"}, {"duration": 100, "images": [[2108, 2046]]}, {"duration": 100, "images": [[2232, 2046]]}, {"duration": 100, "images": [[2356, 2046]]}, {"duration": 100, "images": [[0, 0]], "sound": "15"}]}, "IdleSnooze": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[2480, 2046]]}, {"duration": 100, "images": [[2604, 2046]]}, {"duration": 100, "images": [[2728, 2046]]}, {"duration": 100, "images": [[2852, 2046]]}, {"duration": 100, "images": [[2976, 2046]]}, {"duration": 100, "images": [[3100, 2046]]}, {"duration": 100, "images": [[3224, 2046]]}, {"duration": 400, "images": [[0, 2139]]}, {"duration": 100, "images": [[124, 2139]]}, {"duration": 100, "images": [[248, 2139]]}, {"duration": 100, "images": [[372, 2139]]}, {"duration": 100, "images": [[496, 2139]]}, {"duration": 100, "images": [[620, 2139]]}, {"duration": 100, "images": [[744, 2139]]}, {"duration": 100, "images": [[868, 2139]]}, {"duration": 100, "images": [[992, 2139]]}, {"duration": 100, "images": [[1116, 2139]], "exitBranch": 20}, {"duration": 100, "images": [[1240, 2139]]}, {"duration": 100, "images": [[1364, 2139]]}, {"duration": 100, "images": [[1488, 2139]], "exitBranch": 23}, {"duration": 100, "images": [[1612, 2139]]}, {"duration": 100, "images": [[1736, 2139]]}, {"duration": 100, "images": [[1860, 2139]], "exitBranch": 26}, {"duration": 100, "images": [[1984, 2139]]}, {"duration": 100, "images": [[2108, 2139]]}, {"duration": 100, "images": [[2232, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2356, 2139]]}, {"duration": 200, "images": [[2480, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2604, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2728, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2852, 2139]]}, {"duration": 200, "images": [[2976, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[3100, 2139]]}, {"duration": 200, "images": [[3224, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[0, 2232]]}, {"duration": 200, "images": [[124, 2232]]}, {"duration": 200, "images": [[248, 2232]], "exitBranch": 83, "branching": {"branches": [{"frameIndex": 27, "weight": 90}, {"frameIndex": 46, "weight": 5}, {"frameIndex": 52, "weight": 5}]}}, {"duration": 100, "images": [[372, 2232]]}, {"duration": 100, "images": [[496, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[620, 2232]]}, {"duration": 1200, "images": [[744, 2232]]}, {"duration": 100, "images": [[868, 2232]]}, {"duration": 100, "images": [[992, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1116, 2232]]}, {"duration": 100, "images": [[1240, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1364, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1488, 2232]], "exitBranch": 83}, {"duration": 400, "images": [[1612, 2232]]}, {"duration": 100, "images": [[1736, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1860, 2232]]}, {"duration": 100, "images": [[1984, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[2108, 2232]]}, {"duration": 100, "images": [[2232, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[2356, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[2480, 2232]], "exitBranch": 83}, {"duration": 600, "images": [[2604, 2232]]}, {"duration": 300, "images": [[2728, 2232]], "exitBranch": 83}, {"duration": 300, "images": [[2852, 2232]], "exitBranch": 83}, {"duration": 300, "images": [[2976, 2232]], "exitBranch": 60}, {"duration": 100, "images": [[3100, 2232]]}, {"duration": 100, "images": [[3224, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[0, 2325]]}, {"duration": 100, "images": [[124, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[248, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[372, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[496, 2325]]}, {"duration": 100, "images": [[620, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[744, 2325]]}, {"duration": 200, "images": [[868, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[992, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[1116, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[1240, 2325]]}, {"duration": 200, "images": [[1364, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[1488, 2325]], "exitBranch": 75, "branching": {"branches": [{"frameIndex": 69, "weight": 20}]}}, {"duration": 100, "images": [[1612, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[1736, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[1860, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[1984, 2325]]}, {"duration": 100, "images": [[2108, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[2232, 2325]]}, {"duration": 100, "images": [[2356, 2325]]}, {"duration": 300, "images": [[2480, 2325]]}, {"duration": 100, "images": [[2604, 2325]]}, {"duration": 100, "images": [[2728, 2325]]}, {"duration": 100, "images": [[2852, 2325]]}, {"duration": 100, "images": [[2976, 2325]]}, {"duration": 100, "images": [[0, 0]]}]}, "LookDownRight": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[3100, 2325]], "exitBranch": 5}, {"duration": 100, "images": [[3224, 2325]], "exitBranch": 4}, {"duration": 1200, "images": [[0, 2418]]}, {"duration": 100, "images": [[124, 2418]]}, {"duration": 100, "images": [[248, 2418]]}, {"duration": 100, "images": [[0, 0]]}]}, "GetArtsy": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[372, 2418]]}, {"duration": 100, "images": [[496, 2418]]}, {"duration": 100, "images": [[620, 2418]]}, {"duration": 100, "images": [[744, 2418]]}, {"duration": 100, "images": [[868, 2418]]}, {"duration": 100, "images": [[992, 2418]]}, {"duration": 100, "images": [[1116, 2418]]}, {"duration": 100, "images": [[1240, 2418]]}, {"duration": 100, "images": [[1364, 2418]]}, {"duration": 100, "images": [[1488, 2418]]}, {"duration": 400, "images": [[1612, 2418]]}, {"duration": 100, "images": [[1736, 2418]]}, {"duration": 100, "images": [[1860, 2418]], "sound": "10"}, {"duration": 100, "images": [[1612, 2418]]}, {"duration": 100, "images": [[1736, 2418]]}, {"duration": 100, "images": [[1860, 2418]], "sound": "10"}, {"duration": 2400, "images": [[1612, 2418]]}, {"duration": 100, "images": [[744, 2418]]}, {"duration": 100, "images": [[620, 2418]]}, {"duration": 100, "images": [[496, 2418]]}, {"duration": 100, "images": [[372, 2418]], "exitBranch": 22}, {"duration": 100, "images": [[0, 0]]}]}, "Show": {"frames": [{"duration": 10}, {"duration": 10, "images": [[2728, 0]]}, {"duration": 10, "images": [[2604, 0]]}, {"duration": 10, "images": [[2480, 0]]}, {"duration": 10, "images": [[0, 0]]}]}, "LookDown": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[2852, 0]], "exitBranch": 5}, {"duration": 100, "images": [[2976, 0]], "exitBranch": 4}, {"duration": 1200, "images": [[3100, 0]]}, {"duration": 100, "images": [[3224, 0]]}, {"duration": 100, "images": [[0, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "Searching": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[992, 2511]]}, {"duration": 100, "images": [[1116, 2511]]}, {"duration": 100, "images": [[1240, 2511]]}, {"duration": 100, "images": [[1364, 2511]]}, {"duration": 100, "images": [[1488, 2511]], "sound": "11"}, {"duration": 100, "images": [[1612, 2511]]}, {"duration": 100, "images": [[1736, 2511]]}, {"duration": 100, "images": [[1860, 2511]]}, {"duration": 100, "images": [[1984, 2511]]}, {"duration": 100, "images": [[2108, 2511]]}, {"duration": 100, "images": [[2232, 2511]]}, {"duration": 100, "images": [[2356, 2511]]}, {"duration": 100, "images": [[2480, 2511]]}, {"duration": 100, "images": [[2604, 2511]]}, {"duration": 100, "images": [[2728, 2511]]}, {"duration": 100, "images": [[2852, 2511]]}, {"duration": 100, "images": [[2976, 2511]]}, {"duration": 100, "images": [[3100, 2511]]}, {"duration": 800, "images": [[3224, 2511]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 19, "weight": 40}]}}, {"duration": 100, "images": [[0, 2604]], "exitBranch": 55}, {"duration": 100, "images": [[3224, 2511]]}, {"duration": 100, "images": [[124, 2604]]}, {"duration": 100, "images": [[248, 2604]]}, {"duration": 100, "images": [[372, 2604]]}, {"duration": 100, "images": [[496, 2604]]}, {"duration": 100, "images": [[620, 2604]]}, {"duration": 1000, "images": [[744, 2604]], "exitBranch": 54, "branching": {"branches": [{"frameIndex": 27, "weight": 65}]}}, {"duration": 100, "images": [[868, 2604]]}, {"duration": 100, "images": [[992, 2604]]}, {"duration": 100, "images": [[1116, 2604]]}, {"duration": 100, "images": [[1240, 2604]]}, {"duration": 500, "images": [[1364, 2604]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 32, "weight": 75}]}}, {"duration": 100, "images": [[1488, 2604]], "exitBranch": 34, "branching": {"branches": [{"frameIndex": 32, "weight": 50}]}}, {"duration": 100, "images": [[1364, 2604]]}, {"duration": 100, "images": [[1612, 2604]]}, {"duration": 100, "images": [[1736, 2604]]}, {"duration": 100, "images": [[1860, 2604]]}, {"duration": 100, "images": [[1984, 2604]], "exitBranch": 55}, {"duration": 100, "images": [[2108, 2604]]}, {"duration": 100, "images": [[2232, 2604]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 19, "weight": 20}, {"frameIndex": 40, "weight": 80}]}}, {"duration": 100, "images": [[2356, 2604]]}, {"duration": 100, "images": [[2480, 2604]]}, {"duration": 100, "images": [[2604, 2604]]}, {"duration": 100, "images": [[2728, 2604]]}, {"duration": 100, "images": [[2852, 2604]]}, {"duration": 100, "images": [[2976, 2604]]}, {"duration": 100, "images": [[3100, 2604]]}, {"duration": 100, "images": [[3224, 2604]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 48, "weight": 75}]}}, {"duration": 100, "images": [[0, 2697]]}, {"duration": 100, "images": [[124, 2697]]}, {"duration": 100, "images": [[0, 2697]]}, {"duration": 100, "images": [[3224, 2604]]}, {"duration": 100, "images": [[248, 2697]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 49, "weight": 50}]}}, {"duration": 100, "images": [[372, 2697]], "branching": {"branches": [{"frameIndex": 28, "weight": 100}]}}, {"duration": 100, "images": [[496, 2697]]}, {"duration": 100, "images": [[620, 2697]]}, {"duration": 100, "images": [[744, 2697]]}, {"duration": 100, "images": [[868, 2697]]}, {"duration": 100, "images": [[992, 2697]]}, {"duration": 100, "images": [[0, 0]]}]}, "EmptyTrash": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1116, 2697]]}, {"duration": 100, "images": [[1240, 2697]], "sound": "14"}, {"duration": 100, "images": [[1364, 2697]]}, {"duration": 100, "images": [[1488, 2697]]}, {"duration": 100, "images": [[1612, 2697]]}, {"duration": 100, "images": [[1736, 2697]], "exitBranch": 16}, {"duration": 100, "images": [[1860, 2697]], "sound": "3"}, {"duration": 100, "images": [[1984, 2697]]}, {"duration": 100, "images": [[2108, 2697]]}, {"duration": 100, "images": [[2232, 2697]]}, {"duration": 100, "images": [[2356, 2697]]}, {"duration": 100, "images": [[2480, 2697]], "exitBranch": 16}, {"duration": 100, "images": [[2604, 2697]], "sound": "3"}, {"duration": 100, "images": [[2728, 2697]]}, {"duration": 100, "images": [[2852, 2697]]}, {"duration": 100, "images": [[2976, 2697]], "exitBranch": 23}, {"duration": 100, "images": [[3100, 2697]]}, {"duration": 100, "images": [[3224, 2697]]}, {"duration": 100, "images": [[0, 2790]], "sound": "3"}, {"duration": 100, "images": [[124, 2790]]}, {"duration": 100, "images": [[248, 2790]]}, {"duration": 100, "images": [[372, 2790]]}, {"duration": 100, "images": [[496, 2790]], "exitBranch": 29}, {"duration": 100, "images": [[620, 2790]], "sound": "3"}, {"duration": 100, "images": [[744, 2790]]}, {"duration": 100, "images": [[868, 2790]]}, {"duration": 100, "images": [[992, 2790]]}, {"duration": 100, "images": [[1116, 2790]]}, {"duration": 100, "images": [[1240, 2790]], "exitBranch": 31, "sound": "3"}, {"duration": 100, "images": [[1364, 2790]]}, {"duration": 100, "images": [[1488, 2790]]}, {"duration": 900}, {"duration": 100, "images": [[992, 1395]]}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1364, 1395]]}, {"duration": 100, "images": [[1488, 1395]]}, {"duration": 100, "images": [[1612, 1395]]}, {"duration": 100, "images": [[1736, 1395]]}, {"duration": 100, "images": [[1860, 1395]]}, {"duration": 100, "images": [[0, 0]]}]}, "Greeting": {"frames": [{"duration": 100, "branching": {"branches": [{"frameIndex": 30, "weight": 40}]}, "sound": "15"}, {"duration": 100, "images": [[1612, 2790]]}, {"duration": 100, "images": [[1736, 2790]], "sound": "11"}, {"duration": 100, "images": [[1860, 2790]]}, {"duration": 100, "images": [[1984, 2790]]}, {"duration": 100, "images": [[2108, 2790]]}, {"duration": 100, "images": [[2232, 2790]]}, {"duration": 100, "images": [[2356, 2790]]}, {"duration": 100, "images": [[2480, 2790]]}, {"duration": 100, "images": [[2604, 2790]]}, {"duration": 100, "images": [[2728, 2790]]}, {"duration": 100, "images": [[2852, 2790]]}, {"duration": 100, "images": [[2976, 2790]]}, {"duration": 100, "images": [[3100, 2790]], "sound": "14"}, {"duration": 100, "images": [[3224, 2790]]}, {"duration": 100, "images": [[0, 2883]]}, {"duration": 100, "images": [[124, 2883]]}, {"duration": 100, "images": [[248, 2883]]}, {"duration": 300, "images": [[372, 2883]]}, {"duration": 100, "images": [[496, 2883]], "sound": "10"}, {"duration": 450, "images": [[372, 2883]]}, {"duration": 100, "images": [[620, 2883]]}, {"duration": 100, "images": [[744, 2883]]}, {"duration": 100, "images": [[868, 2883]], "sound": "12"}, {"duration": 100, "images": [[992, 2883]]}, {"duration": 100, "images": [[1116, 2883]]}, {"duration": 100, "images": [[1240, 2883]], "sound": "4"}, {"duration": 100, "images": [[1364, 2883]]}, {"duration": 100, "images": [[1488, 2883]]}, {"duration": 100, "images": [[1612, 2883]], "branching": {"branches": [{"frameIndex": 38, "weight": 100}]}}, {"duration": 100, "images": [[992, 1395]], "sound": "11"}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1364, 1395]]}, {"duration": 100, "images": [[1488, 1395]]}, {"duration": 100, "images": [[1612, 1395]]}, {"duration": 100, "images": [[1736, 1395]]}, {"duration": 100, "images": [[1860, 1395]], "exitBranch": 38}, {"duration": 100, "images": [[0, 0]]}]}, "LookUp": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[1736, 2883]], "exitBranch": 5}, {"duration": 100, "images": [[1860, 2883]], "exitBranch": 4}, {"duration": 1200, "images": [[1984, 2883]]}, {"duration": 100, "images": [[2108, 2883]]}, {"duration": 100, "images": [[2232, 2883]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureDown": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[1984, 1395]]}, {"duration": 100, "images": [[2108, 1395]]}, {"duration": 100, "images": [[2232, 1395]]}, {"duration": 100, "images": [[2356, 1395]]}, {"duration": 100, "images": [[2480, 1395]], "exitBranch": 14}, {"duration": 100, "images": [[2604, 1395]]}, {"duration": 100, "images": [[2728, 1395]], "branching": {"branches": [{"frameIndex": 5, "weight": 50}]}}, {"duration": 100, "images": [[2852, 1395]]}, {"duration": 100, "images": [[2976, 1395]]}, {"duration": 100, "images": [[3100, 1395]], "exitBranch": 14}, {"duration": 100, "images": [[3224, 1395]]}, {"duration": 100, "images": [[0, 1488]]}, {"duration": 450, "images": [[124, 1488]]}, {"duration": 100, "images": [[2356, 1395]]}, {"duration": 100, "images": [[2232, 1395]]}, {"duration": 100, "images": [[2108, 1395]]}, {"duration": 100, "images": [[1984, 1395]]}, {"duration": 100, "images": [[0, 0]]}]}, "RestPose": {"frames": [{"duration": 100, "images": [[0, 0]]}]}, "IdleEyeBrowRaise": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 900, "images": [[1364, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[0, 0]]}]}, "LookDownLeft": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[744, 3069]], "exitBranch": 5}, {"duration": 100, "images": [[868, 3069]], "exitBranch": 4}, {"duration": 1200, "images": [[992, 3069]]}, {"duration": 100, "images": [[1116, 3069]]}, {"duration": 100, "images": [[1240, 3069]]}, {"duration": 100, "images": [[0, 0]]}]}}};
