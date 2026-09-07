(function(global) {
  'use strict';

  global.PixelCatBalls = function(ctx) {
    const ballPhysics = {
      ball_baseball:   { img: ctx.u('assets/balls/baseball.png'),   bounciness: 0.62, gravMult: 1.0,  spinRate: 900,  groundFriction: 0.90, airDrag: 0.995 },
      ball_tennis:     { img: ctx.u('assets/balls/tennis.png'),     bounciness: 0.85, gravMult: 0.75, spinRate: 1400, groundFriction: 0.88, airDrag: 0.993 },
      ball_golf:       { img: ctx.u('assets/balls/golf.png'),       bounciness: 0.45, gravMult: 1.3,  spinRate: 350,  groundFriction: 0.82, airDrag: 0.998 },
      ball_basketball: { img: ctx.u('assets/balls/basketball.png'), bounciness: 0.82, gravMult: 0.55, spinRate: 650,  groundFriction: 0.86, airDrag: 0.994 },
      ball_football:   { img: ctx.u('assets/balls/football.png'),   bounciness: 0.55, gravMult: 1.0,  spinRate: 1600, groundFriction: 0.78, airDrag: 0.993 },
      ball_volleyball: { img: ctx.u('assets/balls/valleyball.png'), bounciness: 0.88, gravMult: 0.55, spinRate: 850,  groundFriction: 0.93, airDrag: 0.990 },
      ball_bowling:    { img: ctx.u('assets/balls/bowling.png'),    bounciness: 0.30, gravMult: 1.4,  spinRate: 400,  groundFriction: 0.985, airDrag: 0.995 }
    };
    const defaultBallPhysics = ballPhysics.ball_baseball;
    const BASKETBALL_ID = 'ball_basketball';
    const HOOP_SIZE = 64;
    const HOOP_SUPPORT_IMG = ctx.u('assets/balls/hoop-support.png');
    const HOOP_BACK_IMG = ctx.u('assets/balls/hoop-back.png');
    const HOOP_RIM_IMG = ctx.u('assets/balls/hoop-rim.png');
    const BOWLING_ID = 'ball_bowling';
    const PIN_IMG = ctx.u('assets/balls/Pins.png');
    const PIN_BASE_WIDTH = 13;
    const PIN_BASE_HEIGHT = 29;
    let ballTimerPausedForObject = false;
    let basketballScore = 0;
    let activeBowlingPins = null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function validNumber(value, fallback) {
      return Number.isFinite(value) ? value : fallback;
    }

    function ownsBall(ball) {
      return !ctx.ownsEntity || ctx.ownsEntity(ball);
    }

    function ballHasActivePropDrag(ball) {
      if (!ball) return false;
      if (ball.hoopIsHeld) return true;
      return !!(
        ball.ballId === BOWLING_ID &&
        activeBowlingPins &&
        activeBowlingPins.ball === ball &&
        activeBowlingPins.some((pin) => pin && pin.isHeld)
      );
    }

    function keepBallAliveDuringInteraction(ball) {
      if (!ball) return;
      ball.userInteracted = true;
      ball.manualSpawned = true;
      ball.persistentChase = true;
      ball.lifetime = Math.max(validNumber(ball.lifetime, 0), 15);
    }

    function syncPropFullscreenVisibility(el) {
      if (!el) return;
      const hidden = !!(
        (document.documentElement && document.documentElement.classList.contains('pixelcat-hidden-fullscreen')) ||
        (document.body && document.body.classList.contains('pixelcat-hidden-fullscreen'))
      );
      el.style.display = hidden ? 'none' : '';
    }

    function renderBall(ball) {
      if (!ball || !ball.el) return;
      const x = Math.round(validNumber(ball.x, 0));
      const y = Math.round(validNumber(ball.y, 0));
      const rot = validNumber(ball.rot, 0);
      ball.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot.toFixed(1)}deg)`;
    }

    function finishBasketballNetPass(ball) {
      if (!ball) return;
      ball.inBasketballNet = false;
      ball.netPassUntil = 0;
      if (ball.el) ball.el.style.zIndex = '';
    }

    function updateHoopNetVisual(ball) {
      if (!ball || !ball.hoopNetSegments || !ball.hoopNetPoints) return;
      if (!ball.hoopNetRowStates) {
        ball.hoopNetRowStates = [];
        for (let r = 0; r < 6; r++) {
          ball.hoopNetRowStates.push({ x: 0, vx: 0, y: 0, vy: 0 });
        }
      }
      const states = ball.hoopNetRowStates;
      const windTime = ball.hoopWindTime || 0;
      const isHeld = ball.hoopIsHeld;

      for (let i = 0; i < ball.hoopNetPoints.length; i++) {
        const pt = ball.hoopNetPoints[i];
        if (pt.pinned) {
          pt.x = pt.restX;
          pt.y = pt.restY;
          continue;
        }

        const r = pt.row;
        const s = states[r] || { x: 0, y: 0, vx: 0, vy: 0 };
        const rowLen = (r === 1 || r === 3) ? 4 : 5;
        const u = rowLen > 1 ? ((pt.col / (rowLen - 1)) - 0.5) * 2 : 0;
        const arcLift = -(s.x * s.x) * 0.024 * (r / 5);
        const billowX = (s.x > 0 ? (u > 0 ? u * 0.55 : u * 0.1) : (u < 0 ? u * 0.55 : u * 0.1)) * Math.abs(s.x) * 0.13;

        let tailFlutterX = 0;
        if (r === 5) {
          const flutterFreq = isHeld ? 16 : 7.5;
          const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
          const flutterAmp = isHeld ? Math.min(1.2, 0.3 + speed * 0.015) : 0.45;
          tailFlutterX = Math.sin(windTime * flutterFreq + pt.col * 1.7) * flutterAmp;
        }

        pt.x = pt.restX + s.x + billowX + tailFlutterX;
        pt.y = pt.restY + s.y + arcLift;
      }

      if (ball.hoopNetCanvasCtx) {
        const ctx2d = ball.hoopNetCanvasCtx;
        ctx2d.clearRect(0, 0, HOOP_SIZE, HOOP_SIZE);
        ctx2d.lineWidth = 1;
        ctx2d.lineCap = 'round';
        for (let i = 0; i < ball.hoopNetSegments.length; i++) {
          const segment = ball.hoopNetSegments[i];
          const isShadow = segment.type === 'diag-right';
          ctx2d.strokeStyle = isShadow ? '#c7c2b3' : '#ffffff';
          ctx2d.beginPath();
          ctx2d.moveTo(segment.a.x, segment.a.y);
          ctx2d.lineTo(segment.b.x, segment.b.y);
          ctx2d.stroke();
        }
      } else {
        for (let i = 0; i < ball.hoopNetSegments.length; i++) {
          const segment = ball.hoopNetSegments[i];
          if (!segment.el) continue;
          const dx = segment.b.x - segment.a.x;
          const dy = segment.b.y - segment.a.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          segment.el.style.left = `${segment.a.x.toFixed(1)}px`;
          segment.el.style.top = `${segment.a.y.toFixed(1)}px`;
          segment.el.style.width = `${length.toFixed(1)}px`;
          segment.el.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        }
      }
    }

    function updateHoopNetPhysics(ball, dt) {
      if (!ball || !ball.hoopNetPoints) return;
      if (!ball.hoopNetRowStates) {
        ball.hoopNetRowStates = [];
        for (let r = 0; r < 6; r++) {
          ball.hoopNetRowStates.push({ x: 0, vx: 0, y: 0, vy: 0 });
        }
      }
      const step = Math.min(0.04, Math.max(0.001, dt || 0.016));
      const states = ball.hoopNetRowStates;

      if (!ball.hoopIsHeld && !ball.inBasketballNet) {
        ball.hoopWindTime = (ball.hoopWindTime || 0) + step;
      }

      if (!ball.hoopIsHeld) {
        ball.hoopDragVx = (ball.hoopDragVx || 0) * Math.exp(-12 * step);
        ball.hoopDragVy = (ball.hoopDragVy || 0) * Math.exp(-12 * step);
      }

      const dragForceX = -(ball.hoopDragVx || 0) * 4.2;
      const dragForceY = -(ball.hoopDragVy || 0) * 2.8;

      for (let r = 1; r < 6; r++) {
        const s = states[r];
        const parent = states[r - 1];

        const kSpring = r === 5 ? 190 : 230;
        const tensionX = (parent.x - s.x) * kSpring;
        const tensionY = (parent.y - s.y) * kSpring;

        let childPullX = 0;
        let childPullY = 0;
        if (r < 5) {
          const child = states[r + 1];
          childPullX = (child.x - s.x) * 95;
          childPullY = (child.y - s.y) * 95;
        }

        const kRest = 50;
        const restoreX = -s.x * kRest;
        const restoreY = -s.y * (kRest * 1.5);

        let windX = 0;
        let windY = 0;
        if (!ball.hoopIsHeld && !ball.inBasketballNet) {
          const wTime = ball.hoopWindTime || 0;
          const wPhase = wTime * 2.6 - r * 0.75;
          const wAmp = (r / 5) * 16;
          windX = Math.sin(wPhase) * wAmp + Math.sin(wTime * 5.2 + r) * (wAmp * 0.35);
          windY = Math.cos(wPhase * 1.1) * (wAmp * 0.15);
        }

        const frac = r / 5;
        const totalFx = tensionX + childPullX + restoreX + dragForceX * frac + windX;
        const totalFy = tensionY + childPullY + restoreY + dragForceY * frac + windY;

        const damp = Math.exp(-7.2 * step);
        s.vx = (s.vx + totalFx * step) * damp;
        s.vy = (s.vy + totalFy * step) * damp;

        s.x += s.vx * step;
        s.y += s.vy * step;

        s.x = clamp(s.x, -13, 13);
        s.y = clamp(s.y, -7, 9);
      }

      ball.netSway = states[5].x;
      ball.netSwayVelocity = states[5].vx;

      updateHoopNetVisual(ball);
    }

    function kickHoopNet(ball, horizontalImpulse, verticalImpulse) {
      if (!ball || !ball.hoopNetPoints) return;
      if (!ball.hoopNetRowStates) {
        ball.hoopNetRowStates = [];
        for (let r = 0; r < 6; r++) {
          ball.hoopNetRowStates.push({ x: 0, vx: 0, y: 0, vy: 0 });
        }
      }
      const hImp = clamp(horizontalImpulse || 0, -1200, 1200);
      const vImp = clamp(verticalImpulse || 0, -800, 800);

      for (let r = 1; r < 6; r++) {
        const s = ball.hoopNetRowStates[r];
        const frac = r / 5;
        s.x = clamp(s.x + hImp * 0.012 * frac, -13, 13);
        s.y = clamp(s.y + vImp * 0.008 * frac, -7, 9);
        s.vx = clamp(s.vx + hImp * 0.1 * frac, -160, 160);
        s.vy = clamp(s.vy + vImp * 0.08 * frac, -120, 120);
      }
      ball.netSway = ball.hoopNetRowStates[5].x;
      ball.netSwayVelocity = ball.hoopNetRowStates[5].vx;
    }

    function buildBasketballNet(netEl) {
      const canvas = document.createElement('canvas');
      canvas.className = 'pixel-basketball-net-canvas';
      canvas.width = HOOP_SIZE;
      canvas.height = HOOP_SIZE;
      netEl.appendChild(canvas);
      const canvasCtx = canvas.getContext ? canvas.getContext('2d') : null;

      const rowPoints = [
        [
          { x: 12, y: 22 },
          { x: 20, y: 26 },
          { x: 31, y: 28 },
          { x: 43, y: 26 },
          { x: 51, y: 22 }
        ],
        [
          { x: 16, y: 33 },
          { x: 25, y: 35 },
          { x: 38, y: 35 },
          { x: 47, y: 33 }
        ],
        [
          { x: 19, y: 41 },
          { x: 25, y: 43 },
          { x: 31, y: 44 },
          { x: 38, y: 43 },
          { x: 44, y: 41 }
        ],
        [
          { x: 22, y: 49 },
          { x: 28, y: 50 },
          { x: 35, y: 50 },
          { x: 41, y: 49 }
        ],
        [
          { x: 24, y: 56 },
          { x: 28, y: 57 },
          { x: 32, y: 57 },
          { x: 35, y: 57 },
          { x: 39, y: 56 }
        ],
        [
          { x: 23.5, y: 58 },
          { x: 28, y: 58.5 },
          { x: 32, y: 58.5 },
          { x: 35.5, y: 58.5 },
          { x: 39.5, y: 58 }
        ]
      ];

      const points = [];
      const grid = [];
      const segments = [];

      for (let r = 0; r < rowPoints.length; r++) {
        const gridRow = [];
        for (let c = 0; c < rowPoints[r].length; c++) {
          const pt = rowPoints[r][c];
          const point = { x: pt.x, y: pt.y, restX: pt.x, restY: pt.y, row: r, col: c, pinned: r === 0 };
          gridRow.push(point);
          points.push(point);
        }
        grid.push(gridRow);
      }

      function connect(a, b, type) {
        const el = document.createElement('div');
        el.className = 'pixel-basketball-net-segment';
        if (type) el.dataset.netType = type;
        netEl.appendChild(el);
        const link = { a, b, el, type };
        segments.push(link);
      }

      for (let r = 1; r < 5; r++) {
        const prevRow = grid[r - 1];
        const currRow = grid[r];
        if (currRow.length === 4) {
          for (let c = 0; c < 4; c++) {
            connect(prevRow[c], currRow[c], 'diag-left');
            connect(prevRow[c + 1], currRow[c], 'diag-right');
          }
        } else {
          for (let c = 0; c < 5; c++) {
            if (c > 0) connect(prevRow[c - 1], currRow[c], 'diag-right');
            if (c < 4) connect(prevRow[c], currRow[c], 'diag-left');
          }
        }
      }

      const bottomRow = grid[4];
      const tailRow = grid[5];
      for (let c = 0; c < 5; c++) {
        connect(bottomRow[c], tailRow[c], 'tail');
      }

      return { rows: rowPoints.length, points, segments, canvas, canvasCtx };
    }

    function guideBasketballThroughNet(ball, ballSize) {
      if (!ball || !ball.inBasketballNet) return;
      if (!ball.hoopEl || !ball.hoopEl.isConnected) {
        finishBasketballNetPass(ball);
        return;
      }

      const targetX = ball.hoopX + HOOP_SIZE / 2 - ballSize / 2;
      ball.x += (targetX - ball.x) * 0.38;
      ball.vx *= 0.58;
      ball.vy = Math.max(ball.vy, 160);

      const centerY = ball.y + ballSize / 2;
      const netExitY = ball.hoopY + 59;
      if (centerY >= netExitY || ctx.safeNow() >= ball.netPassUntil) {
        finishBasketballNetPass(ball);
      }
    }

    function nextBallSpawnDelay() {
      const multipliers = { rare: 1.8, normal: 1, often: 0.55 };
      const multiplier = multipliers[ctx.ballFrequency] || 1;
      return (90 + Math.random() * 180 + (Math.random() < 0.15 ? 60 : 0)) * multiplier;
    }

    function attachDragListeners(el, b) {
      let listeningForRelease = false;

      function removeReleaseListeners() {
        if (!listeningForRelease) return;
        listeningForRelease = false;
        window.removeEventListener('mouseup', finishDrag);
        window.removeEventListener('touchend', finishDrag);
        window.removeEventListener('touchcancel', finishDrag);
        window.removeEventListener('blur', finishDrag);
      }

      function finishDrag() {
        removeReleaseListeners();
        if (!b.isHeld && ctx.draggedBall !== b) return;
        b.isHeld = false;
        b.vx = clamp(validNumber(b.vx, 0), -1300, 1300);
        b.vy = clamp(validNumber(b.vy, 0), -1300, 1300);
        b.vrot = b.vx * 2;
        if (ctx.draggedBall === b) ctx.draggedBall = null;
        if (el && el.isConnected) el.style.cursor = 'grab';
        keepBallAliveDuringInteraction(b);
      }

      function listenForRelease() {
        if (listeningForRelease) return;
        listeningForRelease = true;
        window.addEventListener('mouseup', finishDrag);
        window.addEventListener('touchend', finishDrag, { passive: true });
        window.addEventListener('touchcancel', finishDrag, { passive: true });
        window.addEventListener('blur', finishDrag);
      }

      function startDrag(clientX, clientY) {
        if (b.removing || b.sinking || b.exiting) return;
        if (typeof ctx.canInteractWithEntity === 'function' && !ctx.canInteractWithEntity(b, 'ball')) return;
        finishBasketballNetPass(b);
        keepBallAliveDuringInteraction(b);
        b.isHeld = true;
        b.manualSpawned = true;
        b.userInteracted = true;
        b.persistentChase = true;
        ctx.draggedBall = b;
        ctx.ballDragOffsetX = clientX - b.x;
        ctx.ballDragOffsetY = clientY - b.y;
        b.vx = 0;
        b.vy = 0;
        b.vrot = 0;
        b.onGround = false;
        ctx.targetBall = b;
        ctx.lastBallDragX = b.x;
        ctx.lastBallDragY = b.y;
        ctx.lastBallDragTs = ctx.safeNow();
        el.style.cursor = 'grabbing';
        listenForRelease();
        if (typeof ctx.speakObjectInteraction === 'function') ctx.speakObjectInteraction('ball');
        if (typeof ctx.go === 'function' && ctx.state !== 'dragged') ctx.go('ball_play');
      }

      el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        startDrag(e.clientX, e.clientY);
      });

      el.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        startDrag(t.clientX, t.clientY);
      }, { passive: false });
      b.cancelBallDrag = finishDrag;
    }

    function updateHoopTransform(ball, tilt) {
      if (!ball || !ball.hoopEl) return;
      if (Number.isFinite(tilt)) ball.hoopTilt = tilt;
      ball.hoopEl.style.transform = `translate3d(${Math.round(ball.hoopX)}px, ${Math.round(ball.hoopY)}px, 0) rotate(${ball.hoopTilt || 0}deg)`;
    }

    function attachHoopDragListeners(ball) {
      const el = ball.hoopEl;
      let pointerId = null;
      let offsetX = 0;
      let offsetY = 0;
      let lastX = 0;
      let lastY = 0;
      let lastMoveTs = 0;

      let listeningOnWindow = false;

      function addWindowListeners() {
        if (listeningOnWindow) return;
        listeningOnWindow = true;
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', stopHoopDrag, { passive: false });
        window.addEventListener('pointercancel', stopHoopDrag, { passive: false });
        window.addEventListener('blur', stopHoopDrag);
      }

      function removeWindowListeners() {
        if (!listeningOnWindow) return;
        listeningOnWindow = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stopHoopDrag);
        window.removeEventListener('pointercancel', stopHoopDrag);
        window.removeEventListener('blur', stopHoopDrag);
      }

      function onPointerDown(event) {
        if (event.button !== undefined && event.button !== 0) return;
        if (ball.removing || ball.sinking || ball.exiting) return;
        if (typeof ctx.canInteractWithEntity === 'function' && !ctx.canInteractWithEntity(ball, 'ball')) return;
        event.preventDefault();
        event.stopPropagation();
        pointerId = event.pointerId;
        offsetX = event.clientX - ball.hoopX;
        offsetY = event.clientY - ball.hoopY;
        lastX = event.clientX;
        lastY = event.clientY;
        lastMoveTs = (typeof ctx.safeNow === 'function' ? ctx.safeNow() : Date.now());
        ball.hoopIsHeld = true;
        ball.hoopDragVx = 0;
        ball.hoopDragVy = 0;
        keepBallAliveDuringInteraction(ball);
        el.classList.add('pixel-basketball-hoop-dragging');
        try { el.setPointerCapture(pointerId); } catch (error) {}
        addWindowListeners();
      }

      function onPointerMove(event) {
        if (pointerId === null || event.pointerId !== pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        ball.hoopX = clamp(event.clientX - offsetX, 0, Math.max(0, ctx.vw - HOOP_SIZE));
        ball.hoopY = clamp(event.clientY - offsetY, 0, Math.max(0, ctx.vh - HOOP_SIZE));
        const moveX = event.clientX - lastX;
        const moveY = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;

        const now = (typeof ctx.safeNow === 'function' ? ctx.safeNow() : Date.now());
        const dtMove = Math.max(0.005, Math.min(0.06, (now - (lastMoveTs || now)) / 1000));
        lastMoveTs = now;
        const instVx = clamp(moveX / dtMove, -1500, 1500);
        const instVy = clamp(moveY / dtMove, -1500, 1500);
        ball.hoopDragVx = (ball.hoopDragVx || 0) * 0.35 + instVx * 0.65;
        ball.hoopDragVy = (ball.hoopDragVy || 0) * 0.35 + instVy * 0.65;

        kickHoopNet(ball, -moveX * 6, -moveY * 3);
        updateHoopTransform(ball, 0);
        updateHoopNetVisual(ball);
      }

      function stopHoopDrag(event) {
        if (pointerId === null) {
          removeWindowListeners();
          ball.hoopIsHeld = false;
          return;
        }
        if (event && event.pointerId !== undefined && event.pointerId !== pointerId) return;
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        try { el.releasePointerCapture(pointerId); } catch (error) {}
        pointerId = null;
        ball.hoopIsHeld = false;
        keepBallAliveDuringInteraction(ball);
        removeWindowListeners();
        el.classList.remove('pixel-basketball-hoop-dragging');
        updateHoopTransform(ball, 0);
      }

      function onLostPointerCapture() {
        if (pointerId === null) return;
        pointerId = null;
        ball.hoopIsHeld = false;
        keepBallAliveDuringInteraction(ball);
        removeWindowListeners();
        el.classList.remove('pixel-basketball-hoop-dragging');
        updateHoopTransform(ball, 0);
      }

      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', stopHoopDrag);
      el.addEventListener('pointercancel', stopHoopDrag);
      el.addEventListener('lostpointercapture', onLostPointerCapture);
      ball.stopHoopDrag = () => {
        const capturedId = pointerId;
        pointerId = null;
        ball.hoopIsHeld = false;
        removeWindowListeners();
        if (capturedId !== null) {
          try { el.releasePointerCapture(capturedId); } catch (error) {}
        }
        el.classList.remove('pixel-basketball-hoop-dragging');
      };
    }

    function createBasketballHoop(ball) {
      if (!ball || ball.ballId !== BASKETBALL_ID || ball.hoopEl || !document.body) return;

      const el = document.createElement('div');
      el.className = 'pixel-basketball-hoop';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Drag basketball hoop');
      el.title = 'Drag the hoop and score!';

      const artEl = document.createElement('div');
      artEl.className = 'pixel-basketball-hoop-art';

      const supportEl = document.createElement('div');
      supportEl.className = 'pixel-basketball-rim-support';
      const backRimEl = document.createElement('div');
      backRimEl.className = 'pixel-basketball-rim-back';
      const netEl = document.createElement('div');
      netEl.className = 'pixel-basketball-net';
      const netMesh = buildBasketballNet(netEl);

      const rimEl = document.createElement('div');
      rimEl.className = 'pixel-basketball-rim';

      if (HOOP_SUPPORT_IMG) supportEl.style.backgroundImage = `url("${HOOP_SUPPORT_IMG}")`;
      if (HOOP_BACK_IMG) backRimEl.style.backgroundImage = `url("${HOOP_BACK_IMG}")`;
      if (HOOP_RIM_IMG) rimEl.style.backgroundImage = `url("${HOOP_RIM_IMG}")`;

      artEl.appendChild(supportEl);
      artEl.appendChild(backRimEl);
      artEl.appendChild(netEl);
      artEl.appendChild(rimEl);
      el.appendChild(artEl);

      const scoreEl = document.createElement('div');
      scoreEl.className = 'pixel-basketball-score';
      scoreEl.textContent = 'SCORE ';
      const scoreValueEl = document.createElement('span');
      scoreValueEl.className = 'pixel-basketball-score-value';
      scoreValueEl.textContent = String(basketballScore);
      scoreEl.appendChild(scoreValueEl);
      el.appendChild(scoreEl);

      ball.hoopEl = el;
      ball.hoopArtEl = artEl;
      ball.hoopBackRimEl = backRimEl;
      ball.hoopNetEl = netEl;
      ball.hoopNetCanvas = netMesh.canvas;
      ball.hoopNetCanvasCtx = netMesh.canvasCtx;
      ball.hoopNetRows = netMesh.rows;
      ball.hoopNetPoints = netMesh.points;
      ball.hoopNetSegments = netMesh.segments;
      ball.hoopRopeEls = netMesh.segments.map((segment) => segment.el);
      ball.hoopScoreEl = scoreEl;
      ball.hoopScoreValueEl = scoreValueEl;
      ball.hoopScore = basketballScore;
      ball.goalArmed = true;
      ball.hoopTilt = 0;
      ball.netSway = 0;
      ball.netSwayVelocity = 0;
      ball.hoopNetRowStates = [
        { x: 0, vx: 0, y: 0, vy: 0 },
        { x: 0, vx: 0, y: 0, vy: 0 },
        { x: 0, vx: 0, y: 0, vy: 0 },
        { x: 0, vx: 0, y: 0, vy: 0 },
        { x: 0, vx: 0, y: 0, vy: 0 },
        { x: 0, vx: 0, y: 0, vy: 0 }
      ];
      ball.hoopDragVx = 0;
      ball.hoopDragVy = 0;
      ball.hoopX = clamp(ctx.vw - HOOP_SIZE - 48, 0, Math.max(0, ctx.vw - HOOP_SIZE));
      ball.hoopY = clamp(ctx.vh - 240, 0, Math.max(0, ctx.vh - HOOP_SIZE));

      if (ctx.ownerId) el.dataset.pixelcatOwner = ctx.ownerId;
      if (ctx.petKind) el.dataset.pixelcatOwnerPet = ctx.petKind;

      updateHoopTransform(ball, 0);
      syncPropFullscreenVisibility(el);
      document.body.appendChild(el);
      attachHoopDragListeners(ball);
      updateHoopNetVisual(ball);
    }

    function removeBasketballHoop(ball, immediate) {
      if (!ball) return;
      if (typeof ball.stopHoopDrag === 'function') ball.stopHoopDrag();
      ball.stopHoopDrag = null;
      if (immediate) {
        if (ball.hoopEl && ball.hoopEl.isConnected) ball.hoopEl.remove();
        ball.hoopEl = null;
        ball.hoopArtEl = null;
        ball.hoopBackRimEl = null;
        ball.hoopNetEl = null;
        ball.hoopNetCanvas = null;
        ball.hoopNetCanvasCtx = null;
        ball.hoopNetPoints = null;
        ball.hoopNetSegments = null;
        ball.hoopRopeEls = null;
        ball.hoopScoreEl = null;
        ball.hoopScoreValueEl = null;
        return;
      }
      fadeOutBasketballHoop(ball);
    }

    function fadeOutBasketballHoop(ball) {
      if (!ball || !ball.hoopEl) return;
      if (typeof ball.stopHoopDrag === 'function') ball.stopHoopDrag();
      ball.stopHoopDrag = null;
      const hoopEl = ball.hoopEl;
      hoopEl.style.pointerEvents = 'none';
      hoopEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      hoopEl.style.opacity = '0';
      hoopEl.style.transform = `translate3d(${Math.round(ball.hoopX)}px, ${Math.round(ball.hoopY)}px, 0) scale(0.85)`;
      const removeHoopDOM = () => {
        if (hoopEl && hoopEl.isConnected) hoopEl.remove();
      };
      if (typeof ctx.addTimeout === 'function') ctx.addTimeout(removeHoopDOM, 450);
      else setTimeout(removeHoopDOM, 450);

      ball.hoopEl = null;
      ball.hoopArtEl = null;
      ball.hoopBackRimEl = null;
      ball.hoopNetEl = null;
      ball.hoopNetPoints = null;
      ball.hoopNetSegments = null;
      ball.hoopRopeEls = null;
      ball.hoopScoreEl = null;
      ball.hoopScoreValueEl = null;
    }

    function renderPin(pin) {
      if (!pin || !pin.el) return;
      pin.el.style.transform = `translate3d(${Math.round(pin.x)}px, ${Math.round(pin.y)}px, 0) rotate(${pin.rot.toFixed(1)}deg)`;
    }

    function attachPinDragListeners(pin, ball) {
      const el = pin.el;
      let isDraggingThisPin = false;
      let pointerId = null;
      let offsetX = 0;
      let offsetY = 0;
      let lastX = 0;
      let lastY = 0;
      let lastTs = 0;

      function onStart(clientX, clientY, e) {
        if (isDraggingThisPin || pin.sinking || !ball || ball.removing || ball.sinking || ball.exiting) return;
        if (e && e.button !== undefined && e.button !== 0) return;
        if (typeof ctx.canInteractWithEntity === 'function' && !ctx.canInteractWithEntity(ball, 'ball')) return;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        isDraggingThisPin = true;
        keepBallAliveDuringInteraction(ball);
        pin.isHeld = true;
        pin.isStanding = true;
        pin.onGround = false;
        pin.hitCooldown = 0;
        pin.vx = 0;
        pin.vy = 0;
        pin.vrot = 0;
        pin.rot = 0;

        offsetX = pin.width / 2;
        offsetY = pin.height / 2;
        pin.x = clamp(clientX - offsetX, 0, Math.max(0, ctx.vw - pin.width));
        pin.y = clamp(clientY - offsetY, 0, Math.max(0, ctx.vh - pin.height));
        renderPin(pin);

        lastX = clientX;
        lastY = clientY;
        lastTs = ctx.safeNow();
        pin.throwVx = 0;
        pin.throwVy = 0;

        el.classList.add('pixel-bowling-pin-dragging');
        if (e && e.pointerId !== undefined) {
          pointerId = e.pointerId;
          try { el.setPointerCapture(pointerId); } catch (_) {}
        }

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerEnd, { passive: false });
        window.addEventListener('pointercancel', onPointerEnd, { passive: false });
        window.addEventListener('mousemove', onMouseMove, { passive: false });
        window.addEventListener('mouseup', onPointerEnd, { passive: false });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onPointerEnd, { passive: false });
        window.addEventListener('touchcancel', onPointerEnd, { passive: false });
        window.addEventListener('blur', onPointerEnd);
      }

      function onMoveCoords(clientX, clientY) {
        if (!isDraggingThisPin) return;
        const now = ctx.safeNow();
        const dt = Math.max(0.008, (now - lastTs) / 1000);
        pin.throwVx = (clientX - lastX) / dt;
        pin.throwVy = (clientY - lastY) / dt;
        lastX = clientX;
        lastY = clientY;
        lastTs = now;

        pin.x = clamp(clientX - offsetX, 0, Math.max(0, ctx.vw - pin.width));
        pin.y = clamp(clientY - offsetY, 0, Math.max(0, ctx.vh - pin.height));
        pin.rot = 0;
        renderPin(pin);
      }

      function onPointerMove(e) {
        if (!isDraggingThisPin) return;
        e.preventDefault();
        e.stopPropagation();
        onMoveCoords(e.clientX, e.clientY);
      }

      function onMouseMove(e) {
        if (!isDraggingThisPin) return;
        e.preventDefault();
        e.stopPropagation();
        onMoveCoords(e.clientX, e.clientY);
      }

      function onTouchMove(e) {
        if (!isDraggingThisPin || !e.touches || !e.touches[0]) return;
        e.preventDefault();
        e.stopPropagation();
        onMoveCoords(e.touches[0].clientX, e.touches[0].clientY);
      }

      function onPointerEnd(e) {
        if (!isDraggingThisPin) return;
        if (pointerId !== null && e && e.pointerId !== undefined && e.pointerId !== pointerId) return;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        isDraggingThisPin = false;
        pin.isHeld = false;
        el.classList.remove('pixel-bowling-pin-dragging');

        if (pointerId !== null) {
          try { el.releasePointerCapture(pointerId); } catch (_) {}
          pointerId = null;
        }

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerEnd);
        window.removeEventListener('pointercancel', onPointerEnd);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onPointerEnd);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onPointerEnd);
        window.removeEventListener('touchcancel', onPointerEnd);
        window.removeEventListener('blur', onPointerEnd);

        const uprightFloorY = ctx.vh - pin.height;
        const isNearFloor = pin.y >= uprightFloorY - 30;
        const speed = Math.hypot(pin.throwVx || 0, pin.throwVy || 0);

        if (speed > 250 && !isNearFloor) {
          pin.isStanding = false;
          pin.onGround = false;
          pin.hitCooldown = 0.25;
          pin.vx = clamp(pin.throwVx || 0, -500, 500);
          pin.vy = clamp(pin.throwVy || 0, -500, 500);
          pin.vrot = (pin.vx >= 0 ? 1 : -1) * 200;
        } else {
          pin.vx = 0;
          pin.vy = 0;
          pin.vrot = 0;
          pin.rot = 0;
          pin.isStanding = true;
          if (isNearFloor) {
            pin.y = uprightFloorY;
            pin.onGround = true;
          } else {
            pin.onGround = false;
          }
        }
        pin.throwVx = 0;
        pin.throwVy = 0;
        keepBallAliveDuringInteraction(ball);
        renderPin(pin);
      }

      function cancelPinDrag() {
        const capturedId = pointerId;
        pointerId = null;
        isDraggingThisPin = false;
        pin.isHeld = false;
        el.classList.remove('pixel-bowling-pin-dragging');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerEnd);
        window.removeEventListener('pointercancel', onPointerEnd);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onPointerEnd);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onPointerEnd);
        window.removeEventListener('touchcancel', onPointerEnd);
        window.removeEventListener('blur', onPointerEnd);
        if (capturedId !== null) {
          try { el.releasePointerCapture(capturedId); } catch (_) {}
        }
      }

      el.draggable = false;
      el.addEventListener('dragstart', (e) => e.preventDefault());
      el.addEventListener('pointerdown', (e) => onStart(e.clientX, e.clientY, e));
      el.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY, e));
      el.addEventListener('touchstart', (e) => {
        const t = e.touches && e.touches[0];
        if (t) onStart(t.clientX, t.clientY, e);
      }, { passive: false });
      el.addEventListener('lostpointercapture', cancelPinDrag);
      pin.cancelDrag = cancelPinDrag;
    }

    function createBowlingPins(ball) {
      if (!document.body || !ball || ball.ballId !== BOWLING_ID) return;
      const existingPins = Array.from(document.querySelectorAll('.pixel-bowling-pin')).filter(
        (el) => !ctx.ownerId || el.dataset.pixelcatOwner === ctx.ownerId
      );
      if (
        activeBowlingPins &&
        activeBowlingPins.ball === ball &&
        activeBowlingPins.length === 3 &&
        existingPins.length === 3 &&
        activeBowlingPins[0].el &&
        activeBowlingPins[0].el.isConnected
      ) {
        return;
      }
      removeBowlingPins();

      const scale = ctx.sizeMultiplier || 1;
      const pw = PIN_BASE_WIDTH * scale;
      const ph = PIN_BASE_HEIGHT * scale;
      const floorY = Math.max(0, ctx.vh - ph);

      const PIN_COUNT = 3;
      const pinSpacingX = 22 * scale;
      const totalWidth = (PIN_COUNT - 1) * pinSpacingX + pw;
      const spawnOnLeft = Math.random() < 0.5;
      const sideMargin = 50 + Math.random() * 20;
      const rackBaseX = spawnOnLeft
        ? clamp(sideMargin, 20, Math.max(20, ctx.vw - totalWidth - 40))
        : clamp(ctx.vw - totalWidth - sideMargin, 20, Math.max(20, ctx.vw - totalWidth - 20));

      const pins = [];
      pins.ball = ball;
      activeBowlingPins = pins;
      for (let i = 0; i < PIN_COUNT; i++) {
        const el = document.createElement('div');
        el.className = 'pixel-bowling-pin';
        el.style.backgroundImage = `url("${PIN_IMG}")`;
        el.style.width = `${Math.round(pw)}px`;
        el.style.height = `${Math.round(ph)}px`;
        el.style.zIndex = '9999996';
        el.draggable = false;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `Bowling pin ${i + 1}`);
        el.title = 'Drag to position';

        if (ctx.ownerId) el.dataset.pixelcatOwner = ctx.ownerId;
        if (ctx.petKind) el.dataset.pixelcatOwnerPet = ctx.petKind;

        const homeX = rackBaseX + i * pinSpacingX;
        const homeY = floorY;

        const pin = {
          el,
          id: i + 1,
          ownerId: ctx.ownerId,
          ownerPet: ctx.petKind,
          homeX,
          homeY,
          x: homeX,
          y: homeY,
          vx: 0,
          vy: 0,
          rot: 0,
          vrot: 0,
          width: pw,
          height: ph,
          isStanding: true,
          isHeld: false,
          onGround: true,
          throwVx: 0,
          throwVy: 0,
          hitCooldown: 0
        };

        pins.push(pin);
        renderPin(pin);
        syncPropFullscreenVisibility(el);
        document.body.appendChild(el);
        attachPinDragListeners(pin, ball);
      }
    }

    function sinkBowlingPins() {
      if (!activeBowlingPins || activeBowlingPins.length === 0) return;
      for (let i = 0; i < activeBowlingPins.length; i++) {
        const pin = activeBowlingPins[i];
        if (!pin || pin.sinking) continue;
        if (typeof pin.cancelDrag === 'function') pin.cancelDrag();
        pin.sinking = true;
        pin.sinkTimer = 0;
        pin.sinkDuration = 0.55;
        pin.sinkStartY = pin.y;
        pin.isHeld = false;
        pin.vx = 0;
        pin.vy = 0;
        pin.vrot = 0;
        if (pin.el) {
          pin.el.style.pointerEvents = 'none';
        }
      }
    }

    function removeBowlingPins() {
      if (activeBowlingPins) {
        for (let i = 0; i < activeBowlingPins.length; i++) {
          const pin = activeBowlingPins[i];
          if (pin && typeof pin.cancelDrag === 'function') pin.cancelDrag();
          if (pin && pin.el && pin.el.isConnected) {
            pin.el.remove();
          }
        }
        activeBowlingPins = null;
      }
      const leftover = document.querySelectorAll('.pixel-bowling-pin');
      leftover.forEach((el) => {
        if (!ctx.ownerId || el.dataset.pixelcatOwner === ctx.ownerId) el.remove();
      });
    }

    function onPinKnockedDown(pin) {
      if (!pin || !pin.el) return;
      pin.el.classList.remove('pixel-bowling-pin-hit');
      void pin.el.offsetWidth;
      pin.el.classList.add('pixel-bowling-pin-hit');
      if (typeof ctx.awardCoins === 'function') {
        ctx.awardCoins(1);
      }
    }

    function updateBowlingPins(dt) {
      if (!activeBowlingPins || activeBowlingPins.length === 0) return;

      const domPins = Array.from(document.querySelectorAll('.pixel-bowling-pin')).filter(
        (el) => !ctx.ownerId || el.dataset.pixelcatOwner === ctx.ownerId
      );
      if (domPins.length > 3 && activeBowlingPins) {
        domPins.forEach((el) => {
          if (!activeBowlingPins.some((p) => p.el === el)) {
            el.remove();
          }
        });
      }

      for (let i = 0; i < activeBowlingPins.length; i++) {
        const pin = activeBowlingPins[i];
        if (pin.hitCooldown > 0) pin.hitCooldown -= dt;
      }

      const bowlingBalls = ctx.activeBalls.filter(
        (ball) => ball && ball.ballId === BOWLING_ID && !ball.removing && !ball.sinking && ball.el && ball.el.isConnected
      );

      for (let bIdx = 0; bIdx < bowlingBalls.length; bIdx++) {
        const ball = bowlingBalls[bIdx];
        if (ball.exiting || ball.sinking || ball.isHeld) continue;

        const ballRadius = (20 * (ctx.sizeMultiplier || 1)) / 2;
        const bcx = ball.x + ballRadius;
        const bcy = ball.y + ballRadius;
        const ballSpeed = Math.hypot(ball.vx || 0, ball.vy || 0);

        for (let i = 0; i < activeBowlingPins.length; i++) {
          const pin = activeBowlingPins[i];
          if (pin.isHeld) continue;

          const pinBoxW = pin.isStanding ? pin.width : pin.height;
          const pinBoxH = pin.isStanding ? pin.height : pin.width;
          const pinBoxX = pin.x;
          const pinBoxY = pin.isStanding ? pin.y : Math.max(0, ctx.vh - pinBoxH);

          const closestX = clamp(bcx, pinBoxX, pinBoxX + pinBoxW);
          const closestY = clamp(bcy, pinBoxY, pinBoxY + pinBoxH);
          const dx = bcx - closestX;
          const dy = bcy - closestY;
          const distSq = dx * dx + dy * dy;

          if (distSq < ballRadius * ballRadius) {
            if ((pin.hitCooldown || 0) <= 0) {
              pin.hitCooldown = 0.35;
              const hitDirX = Math.abs(ball.vx) > 15 ? Math.sign(ball.vx) : (ball.x < pin.x ? 1 : -1);
              const pushSpeed = clamp(Math.abs(ball.vx) * 0.65, 100, 260);

              if (pin.isStanding) {
                pin.isStanding = false;
                pin.onGround = false;
                pin.vx = hitDirX * pushSpeed + (Math.random() - 0.5) * 30;
                pin.vy = -140 - Math.random() * 40;
                pin.vrot = hitDirX * (220 + Math.random() * 60);
                ball.vx *= 0.92;
                ball.vy *= 0.88;
                onPinKnockedDown(pin);
              } else if (ballSpeed > 60) {
                pin.vx = hitDirX * Math.min(ballSpeed * 0.4, 160);
                pin.vy = -40;
                pin.onGround = false;
                ball.vx *= 0.94;
              }
            }
          }
        }
      }

      for (let i = 0; i < activeBowlingPins.length; i++) {
        const p1 = activeBowlingPins[i];
        const p1Speed = Math.hypot(p1.vx, p1.vy);

        for (let j = i + 1; j < activeBowlingPins.length; j++) {
          const p2 = activeBowlingPins[j];
          const p2Speed = Math.hypot(p2.vx, p2.vy);

          if ((p1.isStanding && p2.isStanding) || (p1Speed < 50 && p2Speed < 50)) continue;

          const dx = (p2.x + p2.width / 2) - (p1.x + p1.width / 2);
          const dy = (p2.y + p2.height / 2) - (p1.y + p1.height / 2);
          const distSq = dx * dx + dy * dy;
          const hitRadius = (p1.width + p2.width) * 0.9;

          if (distSq < hitRadius * hitRadius) {
            const mover = p1Speed >= p2Speed ? p1 : p2;
            const target = mover === p1 ? p2 : p1;

            if (!mover.isStanding && target.isStanding && (target.hitCooldown || 0) <= 0) {
              target.isStanding = false;
              target.onGround = false;
              target.hitCooldown = 0.3;
              const hitDirX = mover.vx !== 0 ? Math.sign(mover.vx) : 1;
              target.vx = hitDirX * clamp(Math.abs(mover.vx) * 0.7, 80, 200);
              target.vy = -120 - Math.random() * 30;
              target.vrot = hitDirX * (180 + Math.random() * 60);
              mover.vx *= 0.6;
              onPinKnockedDown(target);
            }
          }
        }
      }

      let allSunk = true;
      for (let i = 0; i < activeBowlingPins.length; i++) {
        const pin = activeBowlingPins[i];
        if (pin.isHeld) {
          allSunk = false;
          continue;
        }

        if (pin.sinking) {
          pin.sinkTimer = (pin.sinkTimer || 0) + dt;
          const duration = pin.sinkDuration || 0.55;
          const p = Math.min(1, pin.sinkTimer / duration);

          const currentY = pin.sinkStartY + p * (pin.height + 15);
          const scaleY = Math.max(0.05, 1 - p * 0.85);
          const scaleX = Math.max(0.2, 1 - p * 0.35);
          const opacity = Math.max(0, 1 - p * p);

          if (pin.el) {
            pin.el.style.transform = `translate3d(${Math.round(pin.x)}px, ${Math.round(currentY)}px, 0) rotate(${pin.rot.toFixed(1)}deg) scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)})`;
            pin.el.style.opacity = opacity.toFixed(2);
          }

          if (p >= 1) {
            if (pin.el && pin.el.isConnected) pin.el.remove();
          } else {
            allSunk = false;
          }
          continue;
        }

        allSunk = false;

        if (pin.isStanding) {
          const floorY = ctx.vh - pin.height;
          if (!pin.onGround) {
            pin.vy += ctx.GRAVITY * 1.5 * dt;
            pin.y += pin.vy * dt;
            pin.x += pin.vx * dt;
            pin.rot *= 0.9;
            if (pin.y >= floorY) {
              pin.y = floorY;
              pin.vy = 0;
              pin.vx = 0;
              pin.vrot = 0;
              pin.rot = 0;
              pin.onGround = true;
            }
          } else {
            pin.y = floorY;
            pin.vx = 0;
            pin.vy = 0;
            pin.vrot = 0;
            pin.rot = 0;
          }
        } else {
          if (!pin.onGround) {
            if (pin.vrot !== 0) {
              if (pin.vrot > 0) {
                pin.rot = Math.min(90, pin.rot + pin.vrot * dt);
                if (pin.rot >= 90) pin.vrot = 0;
              } else {
                pin.rot = Math.max(-90, pin.rot + pin.vrot * dt);
                if (pin.rot <= -90) pin.vrot = 0;
              }
            }

            let rad = Math.abs(pin.rot) * (Math.PI / 180);
            let maxOffset = pin.height + (pin.width / 2) * Math.sin(rad);
            let floorY = ctx.vh - maxOffset;

            pin.vy += ctx.GRAVITY * 1.5 * dt;
            pin.vx *= Math.exp(-2.0 * dt);
            pin.x += pin.vx * dt;
            pin.y += pin.vy * dt;

            if (pin.y >= floorY) {
              pin.vy = -pin.vy * 0.25;
              pin.vx *= 0.72;

              const targetRot = pin.rot >= 0 ? 90 : -90;
              pin.rot += (targetRot - pin.rot) * 0.35;

              rad = Math.abs(pin.rot) * (Math.PI / 180);
              maxOffset = pin.height + (pin.width / 2) * Math.sin(rad);
              pin.y = ctx.vh - maxOffset;

              if (Math.abs(pin.vy) < 35 && Math.abs(pin.vx) < 20) {
                pin.vy = 0;
                pin.vx = 0;
                pin.vrot = 0;
                pin.rot = targetRot;
                pin.y = ctx.vh - (pin.height + pin.width / 2);
                pin.onGround = true;
              }
            }
          } else {
            pin.y = ctx.vh - (pin.height + pin.width / 2);
            pin.vx = 0;
            pin.vy = 0;
            pin.vrot = 0;
            pin.rot = pin.rot >= 0 ? 90 : -90;
          }
        }

        const maxPinX = Math.max(0, ctx.vw - pin.width);
        if (pin.x < 0) {
          pin.x = 0;
          pin.vx = Math.abs(pin.vx) * 0.5;
        } else if (pin.x > maxPinX) {
          pin.x = maxPinX;
          pin.vx = -Math.abs(pin.vx) * 0.5;
        }

        renderPin(pin);
      }

      if (allSunk && activeBowlingPins && activeBowlingPins.some((p) => p.sinking)) {
        removeBowlingPins();
      }
    }

    function registerBasketballGoal(ball) {
      ball.goalArmed = false;
      ball.lastGoalAt = ctx.safeNow();
      ball.inBasketballNet = true;
      ball.netPassUntil = ball.lastGoalAt + 900;
      ball.el.style.zIndex = '9999996';
      kickHoopNet(ball, ball.vx, Math.max(ball.vy, 180));
      basketballScore += 1;
      ball.hoopScore = basketballScore;
      if (typeof ctx.awardCoins === 'function') ctx.awardCoins(1);
      if (ball.hoopScoreValueEl) {
        ball.hoopScoreValueEl.textContent = String(ball.hoopScore);
        ball.hoopScoreValueEl.classList.remove('pixel-basketball-score-value-changed');
        void ball.hoopScoreValueEl.offsetWidth;
        ball.hoopScoreValueEl.classList.add('pixel-basketball-score-value-changed');
      }
      ball.hoopArtEl.classList.remove('pixel-basketball-hoop-goal');
      void ball.hoopArtEl.offsetWidth;
      ball.hoopArtEl.classList.add('pixel-basketball-hoop-goal');

      const finishScoreColorChange = () => {
        if (ball.hoopScoreValueEl) ball.hoopScoreValueEl.classList.remove('pixel-basketball-score-value-changed');
        if (ball.hoopArtEl) ball.hoopArtEl.classList.remove('pixel-basketball-hoop-goal');
      };
      if (typeof ctx.addTimeout === 'function') ctx.addTimeout(finishScoreColorChange, 1500);
      else setTimeout(finishScoreColorChange, 1500);

      if (typeof ctx.onBasketballGoal === 'function') ctx.onBasketballGoal(ball.hoopScore, ball);
    }

    function resolveBasketballRimCollision(ball, previousCenterY, ballSize) {
      if (!ball || ball.ballId !== BASKETBALL_ID || !ball.hoopEl || !ball.hoopEl.isConnected) return;
      if (ball.isHeld || ball.exiting || ball.inBasketballNet) return;

      const radius = ballSize / 2;
      const metalRadius = 2.5;
      const contactDistance = radius + metalRadius;
      const rimY = ball.hoopY + 18;
      const segments = [
        [ball.hoopX + 4, ball.hoopX + 9],
        [ball.hoopX + 52, ball.hoopX + 57]
      ];

      for (let i = 0; i < segments.length; i++) {
        const startX = segments[i][0];
        const endX = segments[i][1];
        let centerX = ball.x + radius;
        let centerY = ball.y + radius;
        const closestX = clamp(centerX, startX, endX);
        const dx = centerX - closestX;
        const dy = centerY - rimY;
        const distanceSquared = dx * dx + dy * dy;
        let nx = 0;
        let ny = 0;
        let penetration = 0;

        if (distanceSquared < contactDistance * contactDistance) {
          const distance = Math.sqrt(distanceSquared);
          if (distance > 0.001) {
            nx = dx / distance;
            ny = dy / distance;
          } else {
            ny = previousCenterY <= rimY ? -1 : 1;
          }
          penetration = contactDistance - distance;
        } else {
          const contactY = rimY - contactDistance;
          const sweptDownward = previousCenterY <= contactY && centerY >= contactY && ball.vy > 0;
          const overlapsMetalX = centerX >= startX - radius && centerX <= endX + radius;
          if (!sweptDownward || !overlapsMetalX) continue;
          nx = 0;
          ny = -1;
          penetration = centerY - contactY;
        }

        ball.x += nx * penetration;
        ball.y += ny * penetration;
        const impactSpeed = ball.vx * nx + ball.vy * ny;
        if (impactSpeed < 0) {
          const restitution = 0.68;
          ball.vx -= (1 + restitution) * impactSpeed * nx;
          ball.vy -= (1 + restitution) * impactSpeed * ny;
          ball.vx *= 0.9;
          ball.vy *= 0.9;
          ball.vrot += clamp(ball.vx * 2.5, -600, 600);
          ball.onGround = false;
        }
      }
    }

    function checkBasketballGoal(ball, previousCenterY, ballSize) {
      if (!ball || !ball.hoopEl || !ball.hoopEl.isConnected || ball.isHeld || ball.exiting) return;

      ball.hoopX = clamp(ball.hoopX, 0, Math.max(0, ctx.vw - HOOP_SIZE));
      ball.hoopY = clamp(ball.hoopY, 0, Math.max(0, ctx.vh - HOOP_SIZE));
      updateHoopTransform(ball);

      const centerX = ball.x + ballSize / 2;
      const centerY = ball.y + ballSize / 2;
      const rimY = ball.hoopY + 18;
      const rimLeft = ball.hoopX + 16;
      const rimRight = ball.hoopX + 48;

      if (centerY < rimY - 12) ball.goalArmed = true;
      if (!ball.goalArmed || ball.vy <= 0) return;
      if (ball.lastGoalAt && ctx.safeNow() - ball.lastGoalAt < 650) return;

      const crossedRimDownward = previousCenterY <= rimY && centerY >= rimY;
      if (crossedRimDownward && centerX >= rimLeft && centerX <= rimRight) registerBasketballGoal(ball);
    }

    function spawnBall(customX, customY) {
      if (!document.body) return false;
      for (let i = ctx.activeBalls.length - 1; i >= 0; i--) {
        const staleBall = ctx.activeBalls[i];
        if (typeof ctx.ownsEntity === 'function' && !ctx.ownsEntity(staleBall)) continue;
        if (staleBall && staleBall.el && staleBall.el.isConnected && !staleBall.removing) continue;
        removeBall(staleBall);
        const staleIndex = ctx.activeBalls.indexOf(staleBall);
        if (staleIndex >= 0) ctx.activeBalls.splice(staleIndex, 1);
      }
      if (ctx.activeBalls.some((ball) => !ctx.ownsEntity || ctx.ownsEntity(ball))) return false;
      if (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup()) return false;
      if (typeof ctx.claimActivePickup === 'function' && !ctx.claimActivePickup('ball')) return false;

      const ballId = ctx.activeBallId;
      const physics = ballPhysics[ballId] || defaultBallPhysics;

      const el = document.createElement('div');
      el.className = ballId === BASKETBALL_ID ? 'pixel-ball pixel-ball-basketball' : (ballId === BOWLING_ID ? 'pixel-ball pixel-ball-bowling' : 'pixel-ball');
      el.style.backgroundImage = `url("${physics.img}")`;

      const ballSize = 20 * (ctx.sizeMultiplier || 1);
      const requestedX = customX !== undefined ? Number(customX) : (ctx.vw / 2 + (Math.random() - 0.5) * 400);
      const initialX = Math.min(Math.max(0, ctx.vw - ballSize), Math.max(0, Number.isFinite(requestedX) ? requestedX : ctx.vw / 2));
      const requestedY = customY !== undefined ? Number(customY) : -ballSize;
      const initialY = Number.isFinite(requestedY) ? requestedY : -ballSize;

      const b = {
        el,
        ballId,
        ownerId: ctx.ownerId,
        ownerPet: ctx.petKind,
        x: initialX,
        y: initialY,
        vx: customX !== undefined ? 0 : (Math.random() - 0.5) * 400,
        vy: customY !== undefined ? 0 : 100,
        rot: 0,
        vrot: (Math.random() - 0.5) * physics.spinRate,
        onGround: false,
        isHeld: false,
        bounciness: physics.bounciness,
        gravMult: physics.gravMult,
        groundFriction: physics.groundFriction,
        airDrag: physics.airDrag,
        lifetime: 25 + Math.random() * 30,
        age: 0,
        hitCount: 0,
        exitAfter: 18 + Math.random() * 28,
        exitHitAfter: 4 + Math.floor(Math.random() * 5),
        exiting: false,
        removing: false,
        exitOnWall: false
      };

      if (ctx.ownerId) el.dataset.pixelcatOwner = ctx.ownerId;
      if (ctx.petKind) el.dataset.pixelcatOwnerPet = ctx.petKind;

      el.style.transform = `translate3d(${initialX | 0}px, ${initialY | 0}px, 0)`;
      try {
        document.body.appendChild(el);
        attachDragListeners(el, b);
        ctx.activeBalls.push(b);
        if (ctx.ballPropsEnabled === true) {
          createBasketballHoop(b);
          if (b.ballId === BOWLING_ID) {
            createBowlingPins(b);
          }
        }
      } catch (error) {
        removeBall(b, true);
        return false;
      }
      return true;
    }

    function releaseBall(ball) {
      if (!ball || ball.pickupReleased) return;
      ball.pickupReleased = true;
      if (typeof ctx.releaseActivePickup === 'function') ctx.releaseActivePickup('ball');
    }

    function removeBall(ball, immediate) {
      if (!ball || ball.removing) return;
      ball.removing = true;
      if (typeof ball.cancelBallDrag === 'function') ball.cancelBallDrag();
      ball.cancelBallDrag = null;
      ball.isHeld = false;
      ball.hoopIsHeld = false;
      if (ctx.targetBall === ball) ctx.targetBall = null;
      if (ctx.draggedBall === ball) ctx.draggedBall = null;
      releaseBall(ball);
      removeBasketballHoop(ball, immediate === true);
      if (ball.ballId === BOWLING_ID && activeBowlingPins && activeBowlingPins.ball === ball) {
        removeBowlingPins();
      }
      if (ball.el && ball.el.isConnected) ball.el.remove();
      const idx = ctx.activeBalls.indexOf(ball);
      if (idx > -1) ctx.activeBalls.splice(idx, 1);
    }

    function sinkBallIntoGround(ball) {
      if (!ball || ball.removing || ball.sinking) return;
      if (typeof ball.cancelBallDrag === 'function') ball.cancelBallDrag();
      ball.sinking = true;
      ball.exiting = true;
      ball.sinkTimer = 0;
      ball.sinkDuration = 0.55;
      ball.sinkStartY = ball.y;
      ball.isHeld = false;
      ball.hoopIsHeld = false;
      ball.onGround = false;
      ball.exitOnWall = false;
      ball.vx = 0;
      ball.vy = 0;
      ball.vrot = 0;
      if (ball.el) {
        ball.el.style.animation = 'none';
        ball.el.style.pointerEvents = 'none';
      }
      if (ctx.targetBall === ball) ctx.targetBall = null;
      if (ctx.draggedBall === ball) ctx.draggedBall = null;
      releaseBall(ball);

      if (ball.ballId === BASKETBALL_ID) {
        fadeOutBasketballHoop(ball);
      }

      if (ball.ballId === BOWLING_ID && activeBowlingPins && activeBowlingPins.ball === ball) {
        sinkBowlingPins();
      }
    }

    function sendBallOffscreen(ball) {
      sinkBallIntoGround(ball);
    }

    function updateBalls(dt) {
      dt = Number.isFinite(dt) ? clamp(dt, 0, 0.05) : 0;
      if (!ctx.catEnabled) {
        if (ctx.activeBalls.length > 0) {
          for (let i = ctx.activeBalls.length - 1; i >= 0; i--) {
            const b = ctx.activeBalls[i];
            if (typeof ctx.ownsEntity === 'function' && !ctx.ownsEntity(b)) continue;
            removeBall(b);
          }
        }
        removeBowlingPins();
        ballTimerPausedForObject = false;
        return;
      }

      const propsEnabled = ctx.ballPropsEnabled === true;
      const liveOwnedBall = ctx.activeBalls.find(
        (ball) => ownsBall(ball) && ball && !ball.removing && !ball.sinking && ball.el && ball.el.isConnected
      ) || null;

      if (!propsEnabled) {
        if (activeBowlingPins) {
          removeBowlingPins();
        }
        for (let i = 0; i < ctx.activeBalls.length; i++) {
          const b = ctx.activeBalls[i];
          if (b && b.ballId === BASKETBALL_ID && b.hoopEl) {
            removeBasketballHoop(b, true);
          }
        }
      } else {
        if (liveOwnedBall && liveOwnedBall.ballId === BOWLING_ID &&
            (!activeBowlingPins || activeBowlingPins.ball !== liveOwnedBall)) {
          removeBowlingPins();
          createBowlingPins(liveOwnedBall);
        }
        for (let i = 0; i < ctx.activeBalls.length; i++) {
          const b = ctx.activeBalls[i];
          if (b && b.ballId === BASKETBALL_ID && !b.hoopEl && !b.removing && !b.sinking && b.el && b.el.isConnected) {
            createBasketballHoop(b);
          }
        }
      }

      const sinkingBowlingProps = !!(
        activeBowlingPins &&
        activeBowlingPins.ball &&
        activeBowlingPins.ball.sinking
      );
      if (!propsEnabled) {
        removeBowlingPins();
      } else if ((liveOwnedBall && liveOwnedBall.ballId === BOWLING_ID) || sinkingBowlingProps) {
        updateBowlingPins(dt);
      } else {
        removeBowlingPins();
      }

      const hasOwnedBall = ctx.activeBalls.some((ball) => !ctx.ownsEntity || ctx.ownsEntity(ball));
      const spawnBlocked = hasOwnedBall || (typeof ctx.hasActivePickup === 'function' && ctx.hasActivePickup());
      if (ctx.ballEnabled) {
        if (spawnBlocked) {
          ballTimerPausedForObject = true;
        } else {
          if (ballTimerPausedForObject) {
            ctx.ballSpawnTimer = nextBallSpawnDelay();
            ballTimerPausedForObject = false;
          }
          ctx.ballSpawnTimer -= dt;
          if (ctx.ballSpawnTimer <= 0) {
            if (spawnBall()) {
              ctx.ballSpawnTimer = nextBallSpawnDelay();
              ballTimerPausedForObject = true;
            } else {
              ctx.ballSpawnTimer = nextBallSpawnDelay();
            }
          }
        }
      } else {
        ballTimerPausedForObject = false;
      }

      const size = ctx.sizeMultiplier || 1;
      const ballSize = 20 * size;
      const floorY = Math.max(0, ctx.vh - ballSize);
      const maxBallX = Math.max(0, ctx.vw - ballSize);
      for (let i = ctx.activeBalls.length - 1; i >= 0; i--) {
        const b = ctx.activeBalls[i];
        if (typeof ctx.ownsEntity === 'function' && !ctx.ownsEntity(b)) continue;
        if (!b || !b.el || !b.el.isConnected) {
          if (b) removeBall(b);
          else ctx.activeBalls.splice(i, 1);
          continue;
        }
        if (b.removing) continue;

        b.x = validNumber(b.x, Math.max(0, (ctx.vw - ballSize) / 2));
        b.y = validNumber(b.y, -ballSize);
        b.vx = validNumber(b.vx, 0);
        b.vy = validNumber(b.vy, 0);
        b.rot = validNumber(b.rot, 0);
        b.vrot = validNumber(b.vrot, 0);
        b.lifetime = validNumber(b.lifetime, 25);
        if (b.isHeld && ctx.draggedBall !== b) {
          b.isHeld = false;
          b.vx = 0;
          b.vy = 0;
          if (b.el) b.el.style.cursor = 'grab';
        }

        updateHoopNetPhysics(b, dt);

        if (b.sinking) {
          b.sinkTimer = (b.sinkTimer || 0) + dt;
          const duration = b.sinkDuration || 0.55;
          const p = Math.min(1, b.sinkTimer / duration);
          const startY = (b.sinkStartY !== undefined) ? b.sinkStartY : floorY;
          b.y = startY + p * (ballSize + 15);
          const sY = Math.max(0.05, 1 - p * 0.85);
          const sX = Math.max(0.2, 1 - p * 0.35);
          const opacity = Math.max(0, 1 - p * p);
          if (b.el) {
            b.el.style.transform = `translate3d(${Math.round(b.x)}px, ${Math.round(b.y)}px, 0) scale(${sX.toFixed(2)}, ${sY.toFixed(2)}) rotate(${b.rot.toFixed(1)}deg)`;
            b.el.style.opacity = opacity.toFixed(2);
          }
          if (p >= 1) {
            removeBall(b);
          }
          continue;
        }

        if (b.exiting) {
          sinkBallIntoGround(b);
          continue;
        }

        if (!b.isHeld && !ballHasActivePropDrag(b)) {
          b.age += dt;
          b.lifetime -= dt;
          if (b.lifetime <= 0) {
            sinkBallIntoGround(b);
            continue;
          }
          if (!b.warningStarted && b.lifetime <= 5) {
            b.warningStarted = true;
            b.el.style.animation = 'ballWarning 0.5s ease-in-out 10';
          }
        }

        if (b.isHeld) {
          b.rot += (b.vx * 0.05);
          b.idleTimer = 0;
        } else {
          const previousCenterY = b.y + ballSize / 2;
          b.vx *= (b.airDrag || 0.995);
          b.vrot *= 0.992;

          b.vy += ctx.GRAVITY * (b.gravMult || 1.0) * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vrot * dt;

          if (b.y >= floorY) {
            b.y = floorY;
            b.vy = -b.vy * b.bounciness;
            b.vx *= (b.groundFriction || 0.92);
            if (Math.abs(b.vy) < 60) { b.vy = 0; b.onGround = true; }
          }

          if (b.onGround && b.ballId === BOWLING_ID) {
            const ballRadius = ballSize / 2;
            b.vrot = (b.vx / ballRadius) * (180 / Math.PI);
          }

          if (b.x < 0) {
            if (b.exitOnWall) {
              b.x = 0;
              sinkBallIntoGround(b);
              continue;
            } else {
              b.x = 0;
              const wallBounce = b.ballId === BOWLING_ID ? 0.50 : 0.7;
              b.vx = Math.abs(b.vx) * wallBounce;
              b.vrot *= -0.8;
            }
          }
          if (b.x > maxBallX) {
            if (b.exitOnWall) {
              b.x = maxBallX;
              sinkBallIntoGround(b);
              continue;
            } else {
              b.x = maxBallX;
              const wallBounce = b.ballId === BOWLING_ID ? 0.50 : 0.7;
              b.vx = -Math.abs(b.vx) * wallBounce;
              b.vrot *= -0.8;
            }
          }

          if (Math.abs(b.vx) < 5 && Math.abs(b.vy) < 5 && b.onGround) {
            b.idleTimer = (b.idleTimer || 0) + dt;
            if (b.idleTimer > 20) {
              sinkBallIntoGround(b);
              continue;
            }
          } else {
            b.idleTimer = 0;
          }

          resolveBasketballRimCollision(b, previousCenterY, ballSize);
          checkBasketballGoal(b, previousCenterY, ballSize);
          guideBasketballThroughNet(b, ballSize);
        }

        renderBall(b);
      }
    }

    return {
      spawnBall,
      updateBalls,
      resetSpawnTimer() { ctx.ballSpawnTimer = nextBallSpawnDelay(); },
      removeBall
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
