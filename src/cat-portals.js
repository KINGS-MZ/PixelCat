(function (global) {
  "use strict";

  global.PixelCatPortals = function (ctx) {
    const PORTAL_SHEET_GREEN = ctx.u("assets/animations/green-portal.png");
    const PORTAL_SHEET_PURPLE = ctx.u("assets/animations/purple-portal.png");
    const PORTAL_CELL = 64;
    const PORTAL_SCALE = 1.5;
    const PORTAL_SIZE = PORTAL_CELL * PORTAL_SCALE;
    const HALF_PORTAL = PORTAL_SIZE / 2;
    const SPRITE_PAD = 48;

    const PORTAL_ANIMS = {
      idle: { row: 0, frames: 8, fps: 8 },
      opening: { row: 1, frames: 8, fps: 12 },
      closing: { row: 2, frames: 8, fps: 12 },
    };

    const PLACEMENT_ROTATION = { ground: 90, ceiling: 90, left: 0, right: 0 };

    let activePortals = [];
    let portalPairId = 0;

    function createPortal(x, y, color, pairId, placement) {
      const el = document.createElement("div");
      el.className = "pixel-portal";
      if (ctx.ownerId) el.dataset.pixelcatOwner = ctx.ownerId;
      if (ctx.petKind) el.dataset.pixelcatOwnerPet = ctx.petKind;
      el.style.position = "fixed";
      el.style.left = "0px";
      el.style.top = "0px";
      el.style.width = PORTAL_CELL * PORTAL_SCALE + "px";
      el.style.height = PORTAL_CELL * PORTAL_SCALE + "px";
      el.style.zIndex = "9999985";
      el.style.pointerEvents = "none";
      el.style.backgroundImage = `url("${color === "green" ? PORTAL_SHEET_GREEN : PORTAL_SHEET_PURPLE}")`;
      el.style.backgroundSize = `${8 * PORTAL_CELL * PORTAL_SCALE}px ${3 * PORTAL_CELL * PORTAL_SCALE}px`;
      el.style.backgroundRepeat = "no-repeat";
      el.style.imageRendering = "pixelated";

      const initialRotation = PLACEMENT_ROTATION[placement] || 0;
      const initialX = Math.round(x - HALF_PORTAL);
      const initialY = Math.round(y - HALF_PORTAL);
      el.style.transform = `translate3d(${initialX}px, ${initialY}px, 0) rotate(${initialRotation}deg)`;

      document.body.appendChild(el);

      return {
        el,
        ownerId: ctx.ownerId,
        ownerPet: ctx.petKind,
        x,
        y,
        color,
        pairId,
        placement,
        state: "opening",
        animAccum: 0,
        curFrame: 0,
        linkedPortal: null,
        isActive: false,
      };
    }

    function releasePortalPickup(pairId) {
      if (typeof ctx.releaseActivePickup !== "function") return;
      const stillActive = activePortals.some(
        (portal) => portal && portal.pairId === pairId,
      );
      if (!stillActive) ctx.releaseActivePickup("portal");
    }

    function spawnPortalPair() {
      if (!document.body) return false;
      if (activePortals.some((portal) => !portal || !portal.el || !portal.el.isConnected)) {
        updatePortals(0);
      }
      if (activePortals.length > 0) return false;
      if (typeof ctx.hasActivePickup === "function" && ctx.hasActivePickup())
        return false;
      if (
        typeof ctx.claimActivePickup === "function" &&
        !ctx.claimActivePickup("portal")
      )
        return false;

      const viewportWidth = Math.max(1, Number(ctx.vw) || 1);
      const viewportHeight = Math.max(1, Number(ctx.vh) || 1);
      const margin = Math.min(100, Math.max(20, Math.min(viewportWidth, viewportHeight) * 0.2));
      const randomBetween = (min, max) => max <= min ? (min + max) / 2 : min + Math.random() * (max - min);

      const groundX = randomBetween(margin, viewportWidth - margin);
      const groundY = viewportHeight - HALF_PORTAL + SPRITE_PAD;

      const placements = ["left", "right", "ceiling"];
      const placement2 =
        placements[Math.floor(Math.random() * placements.length)];

      let x2, y2;

      switch (placement2) {
        case "left":
          x2 = HALF_PORTAL - SPRITE_PAD;
          y2 = randomBetween(margin, viewportHeight - margin);
          break;
        case "right":
          x2 = viewportWidth - HALF_PORTAL + SPRITE_PAD;
          y2 = randomBetween(margin, viewportHeight - margin);
          break;
        case "ceiling":
          x2 = randomBetween(margin, viewportWidth - margin);
          y2 = HALF_PORTAL - SPRITE_PAD;
          break;
      }

      const id = portalPairId++;
      const portal1 = createPortal(groundX, groundY, "green", id, "ground");
      const portal2 = createPortal(x2, y2, "purple", id, placement2);

      portal1.linkedPortal = portal2;
      portal2.linkedPortal = portal1;

      activePortals.push(portal1, portal2);

      const lifetime = 14000 + Math.random() * 8000;
      ctx.addTimeout(() => {
        closePortalPair(portal1, portal2);
      }, lifetime);
      return true;
    }

    function closePortalPair(portal1, portal2) {
      if (portal1 && portal1.state !== "closing") {
        portal1.state = "closing";
        portal1.curFrame = 0;
        portal1.animAccum = 0;
        portal1.isActive = false;
      }
      if (portal2 && portal2.state !== "closing") {
        portal2.state = "closing";
        portal2.curFrame = 0;
        portal2.animAccum = 0;
        portal2.isActive = false;
      }
    }

    function updatePortals(dt) {
      const hasInvalidPortal = activePortals.some(
        (portal) => !portal || !portal.el || !portal.el.isConnected,
      );
      const invalidPairIds = new Set(
        activePortals
          .filter((portal) => !portal || !portal.el || !portal.el.isConnected)
          .map((portal) => portal && portal.pairId)
          .filter((pairId) => pairId !== undefined),
      );
      if (hasInvalidPortal) {
        activePortals = activePortals.filter((portal) => {
          if (!portal || invalidPairIds.has(portal.pairId)) {
            if (portal && portal.el && portal.el.isConnected) portal.el.remove();
            return false;
          }
          return true;
        });
        if (typeof ctx.releaseActivePickup === "function") ctx.releaseActivePickup("portal");
      }

      for (let i = activePortals.length - 1; i >= 0; i--) {
        const portal = activePortals[i];

        portal.animAccum += dt * 1000;
        let removed = false;
        while (true) {
          const animDef = PORTAL_ANIMS[portal.state];
          const msPerFrame = 1000 / animDef.fps;
          if (portal.animAccum < msPerFrame) break;
          portal.animAccum -= msPerFrame;
          portal.curFrame++;

          if (portal.curFrame >= animDef.frames) {
            if (portal.state === "opening") {
              portal.state = "idle";
              portal.curFrame = 0;
              portal.isActive = true;
            } else if (portal.state === "closing") {
              const closingPairId = portal.pairId;
              portal.el.remove();
              activePortals.splice(i, 1);
              releasePortalPickup(closingPairId);
              removed = true;
              break;
            } else {
              portal.curFrame = 0;
            }
          }
        }
        if (removed) continue;

        const finalAnimDef = PORTAL_ANIMS[portal.state];
        const bgX = -portal.curFrame * PORTAL_CELL * PORTAL_SCALE;
        const bgY = -finalAnimDef.row * PORTAL_CELL * PORTAL_SCALE;
        portal.el.style.backgroundPosition = `${bgX}px ${bgY}px`;

        const rotation = PLACEMENT_ROTATION[portal.placement] || 0;
        const px = Math.round(portal.x - HALF_PORTAL);
        const py = Math.round(portal.y - HALF_PORTAL);

        portal.el.style.transform = `translate3d(${px}px, ${py}px, 0) rotate(${rotation}deg)`;
      }
    }

    function checkCatPortalCollision(catX, catY) {
      for (let i = 0; i < activePortals.length; i++) {
        const portal = activePortals[i];

        if (
          !portal.isActive ||
          !portal.linkedPortal ||
          !portal.linkedPortal.isActive
        ) {
          continue;
        }

        const dx = catX - portal.x;
        const dy = catY - portal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let collisionRadius = 50;
        if (portal.placement === "left" || portal.placement === "right") {
          collisionRadius = 60;
        } else if (portal.placement === "ceiling") {
          collisionRadius = 55;
        }

        if (dist < collisionRadius) {
          return portal;
        }
      }
      return null;
    }

    function teleportCat(portal) {
      if (!portal.linkedPortal || !portal.linkedPortal.isActive) {
        return null;
      }

      const destination = portal.linkedPortal;
      let targetX = destination.x;
      let targetY = destination.y;

      const INNER = HALF_PORTAL - SPRITE_PAD;
      switch (destination.placement) {
        case "ground":
          targetY = destination.y - INNER - 10;
          break;
        case "ceiling":
          targetY = destination.y + INNER + 60;
          break;
        case "left":
          targetX = destination.x + INNER + 60;
          break;
        case "right":
          targetX = destination.x - INNER - 60;
          break;
      }

      return {
        x: targetX,
        y: targetY,
        portal: destination,
      };
    }

    function cleanup() {
      const hadPortals = activePortals.length > 0;
      for (let i = activePortals.length - 1; i >= 0; i--) {
        if (activePortals[i].el && activePortals[i].el.isConnected) {
          activePortals[i].el.remove();
        }
      }
      activePortals = [];
      if (hadPortals && typeof ctx.releaseActivePickup === "function")
        ctx.releaseActivePickup("portal");
    }

    function closePortal(portal) {
      if (!portal) return;
      if (portal.linkedPortal) {
        closePortalPair(portal, portal.linkedPortal);
      } else {
        closePortalPair(portal, null);
      }
    }

    return {
      spawnPortalPair,
      updatePortals,
      checkCatPortalCollision,
      teleportCat,
      closePortal,
      cleanup,
      get activePortals() {
        return activePortals;
      },
    };
  };
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
);
