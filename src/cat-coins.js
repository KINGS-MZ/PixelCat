(function(global) {
  'use strict';

  global.PixelCatCoins = function(ctx) {
    let coinDropTimer = 40 + Math.random() * 30;
    let coinTimerPausedForObject = false;
    const activeCoinDrops = [];
    const globalRuntime = typeof window !== 'undefined' && window.PixelCatRuntime ? window.PixelCatRuntime : (typeof globalThis !== 'undefined' ? globalThis.__PixelCatRuntime : null);
    if (globalRuntime) {
      globalRuntime.coinDrops = activeCoinDrops;
    }
    const activeCoinPopups = new Set();
    const BUBBLE_DROP_CHANCE = 1.0;
    const BUBBLE_ORIGINS = ['top', 'ground', 'left', 'right'];
    let lastBubbleOrigin = null;
    let lastCoinDropDelay = 0;
    const BUBBLE_ORIGIN_ROTATION = {
      ground: 0,
      top: 180,
      left: 90,
      right: -90
    };
    const BUBBLE_ROTATION_RETURN_SPEED = 36;
    const BUBBLE_CHAMBER_CENTER_Y_RATIO = 11 / 28;
    const DEFAULT_SOAP_BUBBLE_SPEC = {
      frameWidth: 24,
      frameHeight: 28,
      frameCount: 20,
      growLastFrame: 13,
      popFirstFrame: 14,
      fps: 18,
      minXSpeed: 24,
      maxXSpeed: 52,
      minYSpeed: 20,
      maxYSpeed: 46
    };

    const COIN_TYPES = [
      { id: 'red_round',    row: 2, value: 3,  weight: 70, color: '#ef4444' },
      { id: 'silver_round', row: 5, value: 10, weight: 24, color: '#d1d5db' },
      { id: 'gold_round',   row: 7, value: 25, weight: 6,  color: '#fbbf24' }
    ];
    const COIN_TOTAL_WEIGHT = COIN_TYPES.reduce((s, c) => s + c.weight, 0);
    const coinSheetUrl = ctx.u('assets/animations/coins_sheet.png');

    function scheduleTimeout(fn, ms) {
      return typeof ctx.addTimeout === 'function' ? ctx.addTimeout(fn, ms) : setTimeout(fn, ms);
    }

    function nextCoinDropDelay() {
      const hasLuckyCharm = typeof ctx.hasShopBoost === 'function' && ctx.hasShopBoost('lucky_charm');
      const isVideo = isVideoPlayingForCoinDrops();

      let minDelay = 60;
      let maxDelay = 115;

      if (hasLuckyCharm) {
        minDelay = 35;
        maxDelay = 70;
      } else if (isVideo) {
        minDelay = 50;
        maxDelay = 95;
      }

      const u1 = Math.random();
      const u2 = Math.random();
      const u3 = Math.random();
      const organicFactor = (u1 * 0.45 + u2 * 0.35 + u3 * 0.20);

      const rhythmShift = (Math.random() - 0.5) * 10;
      let delay = minDelay + organicFactor * (maxDelay - minDelay) + rhythmShift;

      if (lastCoinDropDelay > 0 && Math.abs(delay - lastCoinDropDelay) < 6) {
        const bounce = (delay >= (minDelay + maxDelay) * 0.5 ? -1 : 1) * (6 + Math.random() * 5);
        delay += bounce;
      }

      const floorLimit = hasLuckyCharm ? 30 : (isVideo ? 45 : 55);
      const ceilingLimit = hasLuckyCharm ? 75 : (isVideo ? 100 : 120);
      delay = Math.max(floorLimit, Math.min(ceilingLimit, delay));

      lastCoinDropDelay = delay;
      return delay;
    }

    function isVideoPlayingForCoinDrops() {
      return typeof ctx.isVideoPlaying === 'function' ? ctx.isVideoPlaying() : true;
    }

    function isPageActiveForCoinDrops() {
      return typeof ctx.isPageActive === 'function' ? ctx.isPageActive() : true;
    }

    function canSpawnCoinDrop() {
      return !!(
        ctx.catEnabled &&
        !ctx.isCompanion &&
        !ctx.lowPowerMode &&
        !ctx.freePlayMode &&
        !ctx.unlockAll &&
        isPageActiveForCoinDrops()
      );
    }

    function getAvailablePetInstances() {
      const runtime = typeof window !== 'undefined' && window.PixelCatRuntime ? window.PixelCatRuntime : (typeof globalThis !== 'undefined' ? globalThis.__PixelCatRuntime : null);
      if (runtime && Array.isArray(runtime.instances) && runtime.instances.length > 0) {
        return runtime.instances.filter((inst) => inst && !inst.isDestroyed);
      }
      return [{
        feetX: ctx.feetX,
        feetY: ctx.feetY,
        state: ctx.state,
        isDragging: ctx.isDragging,
        isCompanion: ctx.isCompanion,
        canChaseCoin: () => (!ctx.criticalStates || !ctx.criticalStates.has(ctx.state)) && !ctx.isDragging,
        set coinChaseTarget(val) { ctx.coinChaseTarget = val; },
        get coinChaseTarget() { return ctx.coinChaseTarget; },
        onCatchCoin: () => {
          ctx.setAnimLocked('paw', 450);
          if (ctx.state === 'coinchase') ctx.go('sit');
        },
        jumpForCoin: () => {
          if (ctx.canJump !== false) {
            ctx.velY = -320;
            ctx.onGround = false;
            ctx.isJumping = true;
            ctx.setAnimLocked('jump', 350);
          }
        }
      }];
    }

    function getPetCoinReward() {
      return 1 + (ctx.hasShopBoost('toy_feather') ? 2 : 0);
    }

    function getFishCoinReward() {
      return ctx.hasShopBoost('treat_gold') ? 4 : 2;
    }

    function getCoinCatchRange() {
      const size = Math.max(1, ctx.sizeMultiplier || 1);
      const scaleBonusX = (size - 1) * 26;
      const scaleBonusY = (size - 1) * 32;
      return ctx.hasShopBoost('coin_magnet')
        ? { x: 42 + scaleBonusX, y: 62 + scaleBonusY }
        : { x: 32 + scaleBonusX, y: 55 + scaleBonusY };
    }

    function getMagnetRange() {
      return ctx.hasShopBoost('coin_magnet') ? 460 : 0;
    }

    function getMagnetStrength() {
      return ctx.hasShopBoost('coin_magnet') ? 1450 : 0;
    }

    function applyCoinMagnet(c, dt, floorY) {
      const magnetRange = getMagnetRange();
      const magnetStrength = getMagnetStrength();
      if (magnetRange <= 0 || magnetStrength <= 0) {
        c.magnetized = false;
        return false;
      }

      const coinHalf = 8 * Math.max(0.5, Number(ctx.sizeMultiplier) || 1);
      const coinCenterX = c.x + coinHalf;
      const coinCenterY = c.y + coinHalf;

      const allPets = getAvailablePetInstances();
      let targetX = ctx.feetX;
      let targetY = c.onGround ? c.y + coinHalf : Math.min(floorY, ctx.feetY - 22);
      let targetDist = Math.sqrt((targetX - coinCenterX) * (targetX - coinCenterX) + (targetY - coinCenterY) * (targetY - coinCenterY));

      for (const pet of allPets) {
        if (!pet || pet.isDestroyed) continue;
        const canChase = typeof pet.canChaseCoin === 'function' ? pet.canChaseCoin() : true;
        if (!canChase) continue;
        const pFeetX = Number(pet.feetX) || 0;
        const pFeetY = Number(pet.feetY) || 0;
        const pTargetY = c.onGround ? c.y + coinHalf : Math.min(floorY, pFeetY - 22);
        const pDist = Math.hypot(pFeetX - coinCenterX, pTargetY - coinCenterY);
        if (pDist < targetDist) {
          targetDist = pDist;
          targetX = pFeetX;
          targetY = pTargetY;
        }
      }

      const distX = targetX - coinCenterX;
      const distY = targetY - coinCenterY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist >= magnetRange || dist <= 0.001) {
        c.magnetized = false;
        return false;
      }

      c.magnetized = true;

      const dirX = distX / dist;
      const dirY = distY / dist;
      const force = magnetStrength * 0.35;

      c.vx += dirX * force * dt;
      if (!c.onGround) {
        c.vy += dirY * force * dt;
      }

      const homeSpeed = c.onGround ? 340 : 420;
      const homeStep = Math.min(dist, homeSpeed * dt);
      c.x += dirX * homeStep;
      if (!c.onGround) {
        c.y += dirY * homeStep;
      }

      const maxMagnetSpeed = c.onGround ? 360 : 560;
      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      if (speed > maxMagnetSpeed) {
        c.vx = (c.vx / speed) * maxMagnetSpeed;
        c.vy = (c.vy / speed) * maxMagnetSpeed;
      }

      return true;
    }

    function pickCoinType() {
      let r = Math.random() * COIN_TOTAL_WEIGHT;
      for (const ct of COIN_TYPES) {
        r -= ct.weight;
        if (r <= 0) return ct;
      }
      return COIN_TYPES[0];
    }

    function getSoapBubbleSpec() {
      return typeof ctx.getSoapBubbleSpec === 'function'
        ? ctx.getSoapBubbleSpec()
        : DEFAULT_SOAP_BUBBLE_SPEC;
    }

    function randomBubbleSpeed(min, max) {
      return min + Math.random() * (max - min);
    }

    function setCoinBubbleFrame(coin, frame) {
      if (!coin || !coin.bubbleEl) return;
      const spec = coin.bubbleSpec || DEFAULT_SOAP_BUBBLE_SPEC;
      coin.bubbleFrame = Math.max(0, Math.min(spec.frameCount - 1, frame | 0));
      if (typeof ctx.setSoapBubbleFrame === 'function') {
        ctx.setSoapBubbleFrame(coin.bubbleEl, coin.bubbleFrame, coin.bubbleWidth);
      } else {
        coin.bubbleEl.style.backgroundPosition = `${-coin.bubbleFrame * coin.bubbleWidth}px 0px`;
      }
    }

    function createCoinSoapBubble(scale, spec) {
      if (typeof ctx.createSoapBubble === 'function') {
        return ctx.createSoapBubble(scale, 'pixelcat-coin-bubble');
      }
      const el = document.createElement('div');
      el.className = 'pixelcat-trap-bubble pixelcat-coin-bubble';
      el.style.backgroundImage = `url("${ctx.u('assets/animations/bubble.png')}")`;
      el.style.width = `${spec.frameWidth * scale}px`;
      el.style.height = `${spec.frameHeight * scale}px`;
      el.style.backgroundSize = `${spec.frameWidth * spec.frameCount * scale}px ${spec.frameHeight * scale}px`;
      el.style.backgroundPosition = '0px 0px';
      return el;
    }

    function stepCoinBubbleMotion(coin, dt) {
      const bubbleDt = dt * 0.68;
      if (typeof ctx.stepSoapBubbleMotion === 'function') {
        ctx.stepSoapBubbleMotion(coin, bubbleDt);
        return;
      }
      const spec = coin.bubbleSpec || DEFAULT_SOAP_BUBBLE_SPEC;
      coin.x += coin.vx * bubbleDt;
      coin.y += coin.vy * bubbleDt;
      const minX = coin.width * 0.5 + 8;
      const maxX = Math.max(minX, ctx.vw - minX);
      const minY = coin.height * 0.5 + 8;
      const maxY = Math.max(minY, ctx.vh - Math.max(0, coin.height * 0.5 - 7));
      if (coin.x < minX) { coin.x = minX; coin.vx = randomBubbleSpeed(spec.minXSpeed, spec.maxXSpeed); }
      if (coin.x > maxX) { coin.x = maxX; coin.vx = -randomBubbleSpeed(spec.minXSpeed, spec.maxXSpeed); }
      if (coin.y < minY) { coin.y = minY; coin.vy = randomBubbleSpeed(spec.minYSpeed, spec.maxYSpeed); }
      if (coin.y > maxY) { coin.y = maxY; coin.vy = -randomBubbleSpeed(spec.minYSpeed, spec.maxYSpeed); }
    }

    function getCoinBubbleChamberCenter(coin) {
      const rotation = Number(coin.bubbleCurrentRotation) || 0;
      const radians = rotation * Math.PI / 180;
      const localY = coin.bubbleHeight * (BUBBLE_CHAMBER_CENTER_Y_RATIO - 0.5);
      return {
        x: coin.bubbleX - localY * Math.sin(radians),
        y: coin.bubbleY + localY * Math.cos(radians)
      };
    }

    function centerCoinInBubble(coin, coinSize) {
      const chamberCenter = getCoinBubbleChamberCenter(coin);
      coin.x = chamberCenter.x - coinSize * 0.5;
      coin.y = chamberCenter.y - coinSize * 0.5;
    }

    function settleCoinBubbleRotation(coin, dt) {
      if (!coin || coin.popping || coin.bubbleFrame < coin.bubbleSpec.growLastFrame) return;
      const rotation = Number(coin.bubbleCurrentRotation) || 0;
      const step = BUBBLE_ROTATION_RETURN_SPEED * dt;
      coin.bubbleCurrentRotation = Math.abs(rotation) <= step
        ? 0
        : rotation - Math.sign(rotation) * step;
    }

    function popCoinBubble(coin) {
      if (!coin) return;
      coin.bubbleMode = false;
      coin.popping = false;
      if (coin.bubbleEl && coin.bubbleEl.isConnected) coin.bubbleEl.remove();
      coin.bubbleEl = null;
      if (coin.shadow) coin.shadow.style.opacity = '';
    }

    function beginCoinBubblePop(coin) {
      if (!coin || !coin.bubbleMode || coin.popping || !coin.bubbleEl) return false;
      const spec = coin.bubbleSpec || DEFAULT_SOAP_BUBBLE_SPEC;
      coin.popping = true;
      coin.bubbleTrapped = false;
      coin.bubbleFrameAccum = 0;
      coin.vx = 0;
      coin.vy = 0;
      setCoinBubbleFrame(coin, spec.popFirstFrame);
      return true;
    }

    function checkCoinBubbleCollisions(c) {
      if (!c || !c.bubbleMode || c.popping || !c.bubbleTrapped) return;
      const myRadius = Math.max(14, (Number(c.bubbleWidth || c.width) || 32) * 0.48);
      const myX = Number(c.bubbleX !== undefined ? c.bubbleX : c.x) || 0;
      const myY = Number(c.bubbleY !== undefined ? c.bubbleY : c.y) || 0;

      const runtime = typeof window !== 'undefined' && window.PixelCatRuntime ? window.PixelCatRuntime : (typeof globalThis !== 'undefined' ? globalThis.__PixelCatRuntime : null);
      const instances = runtime && Array.isArray(runtime.instances) ? runtime.instances : [];
      for (const inst of instances) {
        if (!inst || inst.isDestroyed || !inst.bubbleTrapActive || inst.bubbleTrapPopping || !inst.bubbleTrapTrapped) continue;
        const petRadius = Math.max(18, (Number(inst.bubbleTrapWidth || 0) + Number(inst.bubbleTrapHeight || 0)) * 0.24);
        const dx = Number(inst.bubbleTrapX || 0) - myX;
        const dy = Number(inst.bubbleTrapY || 0) - myY;
        const maxDist = myRadius + petRadius - 4;

        if (dx * dx + dy * dy <= maxDist * maxDist) {
          beginCoinBubblePop(c);
          if (typeof inst.popBubbleTrap === 'function') inst.popBubbleTrap();
          return;
        }
      }

      for (let j = 0; j < activeCoinDrops.length; j++) {
        const otherCoin = activeCoinDrops[j];
        if (!otherCoin || otherCoin === c || !otherCoin.bubbleMode || otherCoin.popping || !otherCoin.bubbleTrapped) continue;
        const otherRadius = Math.max(14, (Number(otherCoin.bubbleWidth || otherCoin.width) || 32) * 0.48);
        const otherX = Number(otherCoin.bubbleX !== undefined ? otherCoin.bubbleX : otherCoin.x) || 0;
        const otherY = Number(otherCoin.bubbleY !== undefined ? otherCoin.bubbleY : otherCoin.y) || 0;
        const dx = otherX - myX;
        const dy = otherY - myY;
        const maxDist = myRadius + otherRadius - 4;

        if (dx * dx + dy * dy <= maxDist * maxDist) {
          beginCoinBubblePop(c);
          beginCoinBubblePop(otherCoin);
          return;
        }
      }
    }

    function spawnCoinDrop(options) {
      if (!document.body) return false;
      if (!canSpawnCoinDrop()) return false;
      for (let i = activeCoinDrops.length - 1; i >= 0; i--) {
        const staleCoin = activeCoinDrops[i];
        if (staleCoin && staleCoin.el && staleCoin.el.isConnected && !staleCoin.caught) continue;
        if (staleCoin && staleCoin.shadow && staleCoin.shadow.isConnected) staleCoin.shadow.remove();
        popCoinBubble(staleCoin);
        releaseCoinDrop(staleCoin);
        activeCoinDrops.splice(i, 1);
        if (ctx.coinChaseTarget === staleCoin) ctx.coinChaseTarget = null;
      }
      if (activeCoinDrops.length >= 1) return false;
      if (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup()) return false;
      if (typeof ctx.claimActivePickup === 'function' && !ctx.claimActivePickup('coin')) return false;
      const coinType = pickCoinType();
      const spawnOptions = options && typeof options === 'object' ? options : {};
      const bubbleMode = spawnOptions.bubble === false ? false : true;
      let bubbleOrigin = spawnOptions.origin;
      if (!BUBBLE_ORIGINS.includes(bubbleOrigin)) {
        let candidate = BUBBLE_ORIGINS[(Math.random() * BUBBLE_ORIGINS.length) | 0];
        if (candidate === lastBubbleOrigin && Math.random() < 0.65) {
          const alternateOrigins = BUBBLE_ORIGINS.filter(o => o !== candidate);
          candidate = alternateOrigins[(Math.random() * alternateOrigins.length) | 0];
        }
        bubbleOrigin = candidate;
        lastBubbleOrigin = candidate;
      }
      const bubbleRotation = BUBBLE_ORIGIN_ROTATION[bubbleOrigin] || 0;
      const size = Math.max(0.5, Number(ctx.sizeMultiplier) || 1);
      const coinSize = 16 * size;
      const bubbleSpec = getSoapBubbleSpec();
      const bubbleScale = Math.max(1.2, Math.min(3.15, 1.65 * size));
      const bubbleWidth = bubbleSpec.frameWidth * bubbleScale;
      const bubbleHeight = bubbleSpec.frameHeight * bubbleScale;
      const viewportWidth = Math.max(1, Number(ctx.vw) || 1);
      const viewportHeight = Math.max(1, Number(ctx.vh) || 1);
      const maxCoinX = Math.max(0, viewportWidth - coinSize);
      const maxCoinY = Math.max(0, viewportHeight - coinSize);
      const coinMargin = Math.min(60, Math.max(0, Math.min(maxCoinX / 2, viewportWidth * 0.2)));

      let x = Math.min(maxCoinX, coinMargin + Math.random() * Math.max(0, maxCoinX - coinMargin * 2));
      let y = -Math.max(30, coinSize);
      let vx = (Math.random() - 0.5) * 80;
      let vy = 20 + Math.random() * 30;
      let bubbleX = x + coinSize * 0.5;
      let bubbleY = y + coinSize * 0.5;

      if (bubbleMode) {
        const minBubbleX = bubbleWidth * 0.5 + 8;
        const maxBubbleX = Math.max(minBubbleX, viewportWidth - minBubbleX);
        const minBubbleY = bubbleHeight * 0.5 + 8;
        const maxBubbleY = Math.max(minBubbleY, viewportHeight - Math.max(0, bubbleHeight * 0.5 - 7));
        const randomBubbleX = minBubbleX + Math.random() * Math.max(0, maxBubbleX - minBubbleX);
        const randomBubbleY = minBubbleY + Math.random() * Math.max(0, maxBubbleY - minBubbleY);
        const spawnSpeedScale = 0.68;
        if (bubbleOrigin === 'top') {
          bubbleX = randomBubbleX;
          bubbleY = minBubbleY;
          vx = randomBubbleSpeed(bubbleSpec.minXSpeed, bubbleSpec.maxXSpeed) * spawnSpeedScale * (Math.random() < 0.5 ? -1 : 1);
          vy = randomBubbleSpeed(bubbleSpec.minYSpeed, bubbleSpec.maxYSpeed) * spawnSpeedScale;
        } else if (bubbleOrigin === 'ground') {
          bubbleX = randomBubbleX;
          bubbleY = maxBubbleY;
          vx = randomBubbleSpeed(bubbleSpec.minXSpeed, bubbleSpec.maxXSpeed) * spawnSpeedScale * (Math.random() < 0.5 ? -1 : 1);
          vy = -randomBubbleSpeed(bubbleSpec.minYSpeed, bubbleSpec.maxYSpeed) * spawnSpeedScale;
        } else if (bubbleOrigin === 'left') {
          bubbleX = minBubbleX;
          bubbleY = randomBubbleY;
          vx = randomBubbleSpeed(bubbleSpec.minXSpeed, bubbleSpec.maxXSpeed) * spawnSpeedScale;
          vy = randomBubbleSpeed(bubbleSpec.minYSpeed, bubbleSpec.maxYSpeed) * spawnSpeedScale * (Math.random() < 0.5 ? -1 : 1);
        } else {
          bubbleX = maxBubbleX;
          bubbleY = randomBubbleY;
          vx = -randomBubbleSpeed(bubbleSpec.minXSpeed, bubbleSpec.maxXSpeed) * spawnSpeedScale;
          vy = randomBubbleSpeed(bubbleSpec.minYSpeed, bubbleSpec.maxYSpeed) * spawnSpeedScale * (Math.random() < 0.5 ? -1 : 1);
        }
        x = bubbleX - coinSize * 0.5;
        y = bubbleY - coinSize * 0.5;
      }

      const el = document.createElement('div');
      el.className = 'pixel-coin-drop';
      el.style.backgroundImage = `url("${coinSheetUrl}")`;
      el.style.setProperty('--coin-row', `-${coinType.row * 16 * (ctx.sizeMultiplier || 1)}px`);

      const shadow = document.createElement('div');
      shadow.className = 'pixel-coin-shadow';
      shadow.style.position = 'fixed';
      shadow.style.width = '12px';
      shadow.style.height = '4px';
      shadow.style.background = 'rgba(0,0,0,0.3)';
      shadow.style.borderRadius = '50%';
      shadow.style.zIndex = '999998';
      shadow.style.pointerEvents = 'none';

      let bubbleEl = null;
      if (bubbleMode) {
        bubbleEl = createCoinSoapBubble(bubbleScale, bubbleSpec);
        shadow.style.opacity = '0';
      }
      [el, shadow, bubbleEl].forEach((node) => {
        if (!node) return;
        if (ctx.ownerId) node.dataset.pixelcatOwner = ctx.ownerId;
        if (ctx.petKind) node.dataset.pixelcatOwnerPet = ctx.petKind;
      });
      const coinObj = {
        el,
        ownerId: ctx.ownerId,
        ownerPet: ctx.petKind,
        shadow,
        bubbleEl,
        bubbleMode,
        bubbleOrigin,
        bubbleRotation,
        bubbleCurrentRotation: bubbleRotation,
        bubbleSpec,
        bubbleScale,
        bubbleWidth,
        bubbleHeight,
        width: bubbleWidth,
        height: bubbleHeight,
        bubbleFrame: 0,
        bubbleFrameAccum: 0,
        bubbleTrapped: false,
        popping: false,
        bubbleX,
        bubbleY,
        x,
        y,
        vx,
        vy,
        onGround: false,
        lifetime: 20,
        caught: false,
        chaseDelay: 0,
        jumpDone: false,
        row: coinType.row,
        value: coinType.value,
        color: coinType.color,
        popBubble() {
          return beginCoinBubblePop(coinObj);
        },
        beginBubblePop() {
          return beginCoinBubblePop(coinObj);
        }
      };
      if (bubbleMode) centerCoinInBubble(coinObj, coinSize);
      if (bubbleEl) {
        const popHandler = (event) => {
          if (event) {
            if (typeof event.preventDefault === 'function') event.preventDefault();
            if (typeof event.stopPropagation === 'function') event.stopPropagation();
          }
          beginCoinBubblePop(coinObj);
        };
        bubbleEl.addEventListener('mousedown', popHandler);
        bubbleEl.addEventListener('touchstart', popHandler, { passive: false });
        bubbleEl.addEventListener('contextmenu', popHandler);
        bubbleEl.addEventListener('keydown', (event) => {
          if (event && (event.key === 'Enter' || event.key === ' ')) popHandler(event);
        });
        bubbleEl.tabIndex = 0;
        if (typeof bubbleEl.setAttribute === 'function') {
          bubbleEl.setAttribute('role', 'button');
          bubbleEl.setAttribute('aria-label', 'Pop coin bubble');
        }
      }
      el.style.transform = `translate3d(${coinObj.x.toFixed(2)}px, ${coinObj.y.toFixed(2)}px, 0)`;
      shadow.style.transform = `translate3d(${Math.round(x + 2)}px, ${Math.round(viewportHeight + 14)}px, 0) scale(0.2)`;
      document.body.appendChild(shadow);
      if (bubbleEl) {
        bubbleEl.style.transform = `translate3d(${(bubbleX - bubbleWidth * 0.5).toFixed(2)}px, ${(bubbleY - bubbleHeight * 0.5).toFixed(2)}px, 0) rotate(${coinObj.bubbleCurrentRotation}deg)`;
        document.body.appendChild(bubbleEl);
      }
      document.body.appendChild(el);
      activeCoinDrops.push(coinObj);
      return true;
    }

    function releaseCoinDrop(c) {
      if (!c || c.pickupReleased) return;
      c.pickupReleased = true;
      if (typeof ctx.releaseActivePickup === 'function') ctx.releaseActivePickup('coin');
    }

    function showCoinPopup(x, y, amount, color, row, options) {
      const pop = document.createElement('div');
      if (ctx.ownerId) pop.dataset.pixelcatOwner = ctx.ownerId;
      const size = ctx.sizeMultiplier || 1;
      const popupOptions = options && typeof options === 'object' ? options : {};
      const iconOnly = popupOptions.iconOnly === true;
      pop.className = iconOnly ? 'coin-popup coin-popup-icon-only' : 'coin-popup';

      const spriteEl = document.createElement('span');
      spriteEl.style.cssText = [
        'display:inline-block',
        `width:${16 * size}px`,
        `height:${16 * size}px`,
        'vertical-align:middle',
        `background-image:url("${coinSheetUrl}")`,
        `background-size:${80 * size}px ${128 * size}px`,
        `background-position:0px -${(row || 0) * 16 * size}px`,
        'image-rendering:pixelated',
        `margin-right:${iconOnly ? 0 : 3}px`,
        'animation:coinSheetAnim 0.6s steps(5,end) infinite'
      ].join(';');

      pop.appendChild(spriteEl);
      if (!iconOnly) {
        const textEl = document.createElement('span');
        textEl.style.verticalAlign = 'middle';
        textEl.textContent = `${amount}`;
        pop.appendChild(textEl);
      }
      const popupX = popupOptions.centered ? x - 8 * size : x;
      pop.style.setProperty('--x', (popupX | 0) + 'px');
      pop.style.setProperty('--y', (y | 0) + 'px');
      if (color) pop.style.color = color;
      document.body.appendChild(pop);
      activeCoinPopups.add(pop);
      scheduleTimeout(() => {
        activeCoinPopups.delete(pop);
        if (pop.isConnected) pop.remove();
      }, 850);
    }

    function updateCoinDrops(dt) {
      for (let i = activeCoinDrops.length - 1; i >= 0; i--) {
        const c = activeCoinDrops[i];
        if (c && c.el && c.el.isConnected) continue;
        if (c && c.shadow && c.shadow.isConnected) c.shadow.remove();
        popCoinBubble(c);
        releaseCoinDrop(c);
        activeCoinDrops.splice(i, 1);
        if (ctx.coinChaseTarget === c) ctx.coinChaseTarget = null;
      }

      if (ctx.freePlayMode || ctx.unlockAll || ctx.lowPowerMode) {
        if (activeCoinDrops.length > 0) {
          for (let i = activeCoinDrops.length - 1; i >= 0; i--) {
            const c = activeCoinDrops[i];
            if (c.el && c.el.isConnected) c.el.remove();
            if (c.shadow && c.shadow.isConnected) c.shadow.remove();
            popCoinBubble(c);
            releaseCoinDrop(c);
          }
          activeCoinDrops.length = 0;
        }
        return;
      }
      const canSpawnCoinNow = canSpawnCoinDrop();

      const coinSpawnBlocked = activeCoinDrops.length > 0 || (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup());
      if (coinSpawnBlocked) {
        coinTimerPausedForObject = true;
      } else if (canSpawnCoinNow) {
        if (coinTimerPausedForObject) {
          coinDropTimer = nextCoinDropDelay();
          coinTimerPausedForObject = false;
        }
        coinDropTimer -= dt;
        if (coinDropTimer <= 0) {
          if (spawnCoinDrop()) {
            coinDropTimer = nextCoinDropDelay();
            coinTimerPausedForObject = true;
          } else {
            coinDropTimer = nextCoinDropDelay();
          }
        }
      }

      const size = ctx.sizeMultiplier || 1;
      const coinSize = 16 * size;
      const floorY = Math.max(0, ctx.vh - coinSize);
      const maxCoinX = Math.max(0, ctx.vw - coinSize);
      const coinEdgeInset = Math.min(10, maxCoinX / 2);
      const minCoinX = coinEdgeInset;
      const insetMaxCoinX = Math.max(minCoinX, maxCoinX - coinEdgeInset);
      for (let i = activeCoinDrops.length - 1; i >= 0; i--) {
        const c = activeCoinDrops[i];
        if (c.caught) continue;
        const wasBubbleMode = c.bubbleMode;
        if (c.bubbleMode && (!c.bubbleEl || !c.bubbleEl.isConnected)) {
          popCoinBubble(c);
          c.x = Math.min(maxCoinX, Math.max(0, c.x));
          c.y = Math.min(floorY, Math.max(0, c.y));
          c.vy = Math.max(20, c.vy || 0);
        }

        const magnetActive = !c.bubbleMode && applyCoinMagnet(c, dt, floorY);

        if (c.bubbleMode) {
          const spec = c.bubbleSpec || DEFAULT_SOAP_BUBBLE_SPEC;
          c.bubbleFrameAccum += dt;
          const frameStep = 1 / spec.fps;
          while (c.bubbleMode && c.bubbleFrameAccum >= frameStep) {
            c.bubbleFrameAccum -= frameStep;
            if (c.popping) {
              if (c.bubbleFrame < spec.frameCount - 1) {
                setCoinBubbleFrame(c, c.bubbleFrame + 1);
              } else {
                popCoinBubble(c);
                c.x = Math.min(maxCoinX, Math.max(0, c.x));
                c.y = Math.min(floorY, Math.max(0, c.y));
                c.vx = (Math.random() - 0.5) * 45;
                c.vy = 25;
                c.onGround = false;
                c.chaseDelay = 0.35;
              }
            } else if (c.bubbleFrame < spec.growLastFrame) {
              setCoinBubbleFrame(c, c.bubbleFrame + 1);
            }
          }

          const growProgress = Math.min(1, c.bubbleFrame / spec.growLastFrame);
          if (c.bubbleMode && !c.popping && !c.bubbleTrapped && growProgress >= 0.58) c.bubbleTrapped = true;
          if (c.bubbleMode && !c.popping && c.bubbleTrapped) {
            c.x = c.bubbleX;
            c.y = c.bubbleY;
            stepCoinBubbleMotion(c, dt);
            c.bubbleX = c.x;
            c.bubbleY = c.y;
            checkCoinBubbleCollisions(c);
          }
          if (c.bubbleMode) {
            settleCoinBubbleRotation(c, dt);
            centerCoinInBubble(c, coinSize);
          }
        } else if (!c.onGround) {
          c.vy += ctx.GRAVITY * dt * (magnetActive ? 0.28 : 1);

          c.x += c.vx * dt;
          c.y += c.vy * dt;

          if (c.y >= floorY) {
            c.y = floorY;
            c.vy = -c.vy * 0.5;
            c.vx *= 0.7;
            if (Math.abs(c.vy) < 40) {
              c.onGround = true;
              c.vy = 0;
              c.vx = 0;
            }
          }

          if (c.x < minCoinX) { c.x = minCoinX; c.vx = Math.abs(c.vx) * 0.5; }
          if (c.x > insetMaxCoinX) { c.x = insetMaxCoinX; c.vx = -Math.abs(c.vx) * 0.5; }
        } else if (magnetActive) {
          if (c.x < minCoinX) c.x = minCoinX;
          if (c.x > insetMaxCoinX) c.x = insetMaxCoinX;
        }

        if (!c.bubbleMode) {
          c.lifetime -= dt;
          if (!wasBubbleMode && c.chaseDelay > 0) c.chaseDelay = Math.max(0, c.chaseDelay - dt);
        }
        const coinRow = `-${c.row * 16 * size}px`;
        if (c.cachedRow !== coinRow) {
          c.cachedRow = coinRow;
          c.el.style.setProperty('--coin-row', coinRow);
        }
        const coinTransform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0)`;
        if (c.cachedTransform !== coinTransform) {
          c.cachedTransform = coinTransform;
          c.el.style.transform = coinTransform;
        }

        if (c.bubbleMode && c.bubbleEl) {
          const bubbleTransform = `translate3d(${(c.bubbleX - c.bubbleWidth * 0.5).toFixed(2)}px, ${(c.bubbleY - c.bubbleHeight * 0.5).toFixed(2)}px, 0) rotate(${c.bubbleCurrentRotation.toFixed(2)}deg)`;
          if (c.cachedBubbleTransform !== bubbleTransform) {
            c.cachedBubbleTransform = bubbleTransform;
            c.bubbleEl.style.transform = bubbleTransform;
          }
        }

        if (c.shadow) {
          const distToGround = Math.max(0, floorY - c.y);
          const shadowScale = Math.max(0.2, 1 - (distToGround / 200));
          const shadowAlpha = Math.max(0, 0.3 * shadowScale);
          const shadowBackground = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`;
          const shadowTransform = `translate3d(${Math.round(c.x + 2)}px, ${Math.round(floorY + 14)}px, 0) scale(${shadowScale.toFixed(3)})`;
          if (c.cachedShadowBackground !== shadowBackground) {
            c.cachedShadowBackground = shadowBackground;
            c.shadow.style.background = shadowBackground;
          }
          if (c.cachedShadowTransform !== shadowTransform) {
            c.cachedShadowTransform = shadowTransform;
            c.shadow.style.transform = shadowTransform;
          }
        }

        const allPets = getAvailablePetInstances();
        let catcherPet = null;
        for (const pet of allPets) {
          if (!pet || pet.isDestroyed) continue;
          const pFeetX = Number(pet.feetX) || 0;
          const pFeetY = Number(pet.feetY) || 0;
          const distX = Math.abs(pFeetX - (c.x + coinSize / 2));
          const distY = Math.abs(pFeetY - (c.y + coinSize / 2));

          if (!c.jumpDone && c.onGround && distX < 75 && pet.state === 'coinchase') {
            c.jumpDone = true;
            if (typeof pet.jumpForCoin === 'function') {
              pet.jumpForCoin();
            } else if (pet === ctx && ctx.canJump !== false) {
              ctx.velY = -320;
              ctx.onGround = false;
              ctx.isJumping = true;
              ctx.setAnimLocked('jump', 350);
            }
          }

          const catchRange = getCoinCatchRange();
          const canCatch = pet.state === 'coinchase' || (typeof pet.canChaseCoin === 'function' ? pet.canChaseCoin() : (!ctx.criticalStates || !ctx.criticalStates.has(pet.state)));
          if (!c.bubbleMode && c.chaseDelay <= 0 && distX < catchRange.x && distY < catchRange.y && canCatch) {
            catcherPet = pet;
            break;
          }
        }

        if (catcherPet) {
          c.caught = true;
          if (c.el && c.el.isConnected) c.el.remove();
          if (c.shadow && c.shadow.isConnected) c.shadow.remove();
          popCoinBubble(c);
          releaseCoinDrop(c);
          activeCoinDrops.splice(i, 1);

          const reward = c.value || 5;
          ctx.awardCoins(reward);
          ctx.recordQuestEvent('coins_collected', 1);

          for (const pet of allPets) {
            pet.coinChaseTarget = null;
          }

          if (typeof catcherPet.onCatchCoin === 'function') {
            catcherPet.onCatchCoin();
          } else {
            if (typeof catcherPet.setAnimLocked === 'function') catcherPet.setAnimLocked('paw', 450);
            if (catcherPet.state === 'coinchase' && typeof catcherPet.go === 'function') catcherPet.go('sit');
          }

          continue;
        }

        if (c.lifetime <= 0) {
          c.el.style.transition = 'opacity 0.4s';
          c.el.style.opacity = '0';
          if (c.shadow) c.shadow.style.opacity = '0';
          popCoinBubble(c);
          releaseCoinDrop(c);
          activeCoinDrops.splice(i, 1);
          scheduleTimeout(() => {
            if (c.el.isConnected) c.el.remove();
            if (c.shadow && c.shadow.isConnected) c.shadow.remove();
          }, 450);
          for (const pet of allPets) {
            if (pet.coinChaseTarget === c) {
              pet.coinChaseTarget = null;
              if (pet.state === 'coinchase' && typeof pet.go === 'function') pet.go('sit');
            }
          }
          if (ctx.coinChaseTarget === c) ctx.coinChaseTarget = null;
          if (ctx.state === 'coinchase') ctx.go('sit');
        }
      }

      const chaseableCoin = activeCoinDrops.find((coin) => coin && !coin.caught && !coin.bubbleMode && coin.chaseDelay <= 0);
      const allPets = getAvailablePetInstances();
      for (const pet of allPets) {
        if (!pet) continue;
        const canChase = typeof pet.canChaseCoin === 'function' ? pet.canChaseCoin() : ((!ctx.criticalStates || !ctx.criticalStates.has(pet.state)) && !pet.isDragging);
        if (chaseableCoin && canChase) {
          pet.coinChaseTarget = chaseableCoin;
        } else {
          pet.coinChaseTarget = null;
          if (pet.state === 'coinchase') {
            if (typeof pet.go === 'function') pet.go('sit');
          }
        }
      }
    }

    function cleanupCoinEffects() {
      activeCoinDrops.splice(0).forEach((c) => {
        releaseCoinDrop(c);
        if (c.el && c.el.isConnected) c.el.remove();
        if (c.shadow && c.shadow.isConnected) c.shadow.remove();
        popCoinBubble(c);
      });
      activeCoinPopups.forEach((pop) => {
        if (pop.isConnected) pop.remove();
      });
      activeCoinPopups.clear();
      const allPets = getAvailablePetInstances();
      for (const pet of allPets) {
        if (pet) {
          pet.coinChaseTarget = null;
          if (pet.state === 'coinchase' && typeof pet.go === 'function') pet.go('sit');
        }
      }
      ctx.coinChaseTarget = null;
    }

    return {
      getPetCoinReward,
      getFishCoinReward,
      spawnCoinDrop,
      updateCoinDrops,
      showCoinPopup,
      cleanupCoinEffects,
      resetSpawnTimer() {
        coinDropTimer = nextCoinDropDelay();
        coinTimerPausedForObject = false;
      },
      hasActiveDrop() {
        return activeCoinDrops.some((c) => c && !c.caught && c.el && c.el.isConnected);
      },
      getActiveBubbleCoins() {
        return activeCoinDrops.filter((c) => c && c.bubbleMode && !c.popping && c.bubbleTrapped);
      },
      popCoinBubble(coin) {
        return beginCoinBubblePop(coin);
      },
      getNextCoinDropDelay() {
        return nextCoinDropDelay();
      }
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
