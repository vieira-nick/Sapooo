/* ============================================================
   O SEGREDO DA FLORESTA — game.js
   Motor de jogo em canvas, pixel art pura, mobile-friendly
   ============================================================ */

"use strict";

/* ========== CONSTANTES GLOBAIS ========== */
const TILE  = 16;          // tamanho do tile base em pixels lógicos
const SCALE = 3;           // fator de escala de renderização
const GRAVITY    = 0.45;
const JUMP_VEL   = -9.5;
const MOVE_SPEED = 3.2;

/* ========== UTILITÁRIOS ========== */
const $ = id => document.getElementById(id);
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ========== PALETA DE CORES PIXEL ========== */
const PAL = {
  sky1:    '#0d0f1a', sky2:    '#1a1030',
  moon:    '#d4d0c0', moonGlow:'#3a3060',
  tree1:   '#0a2e1a', tree2:   '#0d3d1f', tree3:   '#134a24',
  ground:  '#1a3d10', groundDk:'#0f2a0a',
  grass:   '#2e7d1a', grassLt: '#3a9e20',
  path:    '#2a1f10', pathLt:  '#3a2a14',
  capRed:  '#cc2020', capDark: '#8b1010',
  skinLt:  '#f8d4b0', skinDk:  '#e0a070',
  dress:   '#e8e0d0', dressDk: '#c8b8a0',
  basketBr:'#8b5a2b', fire1:   '#ff8c00',
  fire2:   '#ff4500', fire3:   '#ffdd00',
  monGreen:'#1a6b1a', monDark: '#0d4a0d',
  monEye:  '#ff2020',
  bossRed: '#8b0000', bossGold:'#d4a800',
  white:   '#f0f0e8', black:   '#000000',
  grey:    '#4a4a5a', greyLt:  '#8a8a9a',
  bark:    '#3d2b0a', barkLt:  '#5a3f12',
  leaf1:   '#1a5c1a', leaf2:   '#237723', leaf3:   '#2ea82e',
  stump:   '#5a3a10',
  neonG:   '#39ff14',
  gold:    '#ffd700', // ADICIONADO: Cor gold que estava faltando e travava o jogo
  red:     '#ff0000', // ADICIONADO: Cor vermelha para as partículas de dano
};

/* ========== DESENHISTAS DE SPRITES ========== */
function drawSprite(ctx, sprite, x, y, flipX = false) {
  ctx.save();
  if (flipX) {
    ctx.scale(-1, 1);
    x = -x - sprite[0].length;
  }
  sprite.forEach((row, ry) => {
    row.forEach((col, rx) => {
      if (col !== null) {
        ctx.fillStyle = col;
        ctx.fillRect(x + rx, y + ry, 1, 1);
      }
    });
  });
  ctx.restore();
}

// ---- Sprites (14x18 → Chapeuzinho) ----
const N = null;
function makeChapSprite(frame) {
  const R = PAL.capRed, RD = PAL.capDark,
        S = PAL.skinLt, SK = PAL.skinDk,
        D = PAL.dress,  DD = PAL.dressDk,
        B = PAL.basketBr, BK = PAL.black;
  const leg1 = frame === 0 ? [[N,N,D,N,N,N,D,N],[N,N,D,N,N,N,D,N],[N,N,D,N,N,N,D,N]] :
                              [[N,N,D,N,N,N,N,D],[N,N,N,D,N,N,N,D],[N,N,N,D,N,N,D,N]];
  return [
    [N,N,N,RD,R,R,RD,N],
    [N,N,RD,R,R,R,R,RD],
    [N,N,R,R,R,R,R,R],
    [N,N,SK,S,S,SK,N,N],
    [N,N,S,S,S,S,N,N],
    [N,N,S,S,S,S,N,N],
    [N,DD,D,D,D,D,DD,N],
    [N,D,D,D,D,D,D,B],
    [DD,D,D,D,D,D,D,B],
    ...leg1,
    [N,N,SK,N,N,N,SK,N],
  ];
}

const CHAP_SPRITES = [makeChapSprite(0), makeChapSprite(1)];

// ---- Monstro (12x14) ----
function makeMonsterSprite(frame, hp_ratio = 1) {
  const G = PAL.monGreen, GD = PAL.monDark,
        E = PAL.monEye,   BK = PAL.black,
        W = PAL.white,    RD = hp_ratio < 0.5 ? '#cc0000' : PAL.monGreen;
  const arm = frame === 0 ? [[G,N,N,N,N,G],[G,N,N,N,G,N]] : [[N,G,N,N,G,N],[N,G,N,G,N,N]];
  return [
    [N,GD,GD,GD,GD,N],
    [GD,G,G,G,G,GD],
    [GD,G,E,G,E,GD],
    [GD,G,G,G,G,GD],
    [GD,G,BK,BK,G,GD],
    [N,GD,G,G,GD,N],
    ...arm,
    [N,G,N,N,G,N],
    [N,G,N,N,G,N],
  ];
}

// ---- Boss (vovó disfarçada, 14x16) ----
function makeBossSprite(phase, frame) {
  const B = PAL.bossRed, BD = '#500000',
        G = PAL.monGreen, E = PAL.monEye,
        BG = PAL.bossGold, W = PAL.white,
        SK = PAL.skinLt,   GR = PAL.grey,
        N = null, BK = PAL.black;
  if (phase === 'monster') {
    return [
      [N,BD,B,B,B,BD,N],
      [BD,B,B,B,B,B,BD],
      [BD,B,E,B,E,B,BD],
      [BD,B,B,B,B,B,BD],
      [BD,B,BK,BK,B,B,BD],
      [N,BD,B,B,BD,N,N],
      [BD,B,N,N,B,BD,N],
      [BD,B,N,N,N,B,BD],
      [N,B,N,N,N,B,N],
      [N,B,N,N,N,B,N],
    ];
  } else {
    // vovó revelada
    return [
      [N,GR,GR,GR,GR,N],
      [GR,W,W,W,W,GR],
      [GR,W,BK,W,BK,GR],
      [GR,W,W,W,W,GR],
      [GR,W,SK,SK,W,GR],
      [N,GR,SK,SK,GR,N],
      [N,GR,W,W,GR,N],
      [GR,W,W,W,W,GR],
      [N,GR,N,N,GR,N],
      [N,SK,N,N,SK,N],
    ];
  }
}

// ---- Bola de fogo ----
function makeFireball() {
  return [
    [N,PAL.fire3,N],
    [PAL.fire1,PAL.fire2,PAL.fire1],
    [N,PAL.fire3,N],
  ];
}

// ---- Árvore procedural ----
function drawTree(ctx, x, y, w = 5, h = 10) {
  // tronco
  ctx.fillStyle = PAL.bark;
  ctx.fillRect(x + Math.floor(w/2) - 1, y + h - 4, 2, 4);
  // copa
  const cols = [PAL.leaf1, PAL.leaf2, PAL.leaf3];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = cols[i % 3];
    const tw = w - i * 1.5;
    const tx = x + (w - tw) / 2;
    ctx.fillRect(Math.round(tx), y + i * 3, Math.round(tw), 3 + (2 - i));
  }
}

/* ========== TELAS / GERENCIADOR ========== */
const Screen = {
  _all: ['menu-screen', 'game-screen', 'gameover-screen', 'reveal-screen'],
  show(id) {
    this._all.forEach(s => {
      const el = $(s);
      if (el) {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    });
    const target = $(id);
    if (target) {
      target.style.display = 'flex';
      target.classList.add('active');
    }
  }
};

/* ========== MENU ========== */
function initMenu() {
  // estrelas
  const starsEl = $('stars');
  if (starsEl) {
    starsEl.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.cssText = `
        left:${rand(0,100)}%;
        top:${rand(0,100)}%;
        --d:${rand(1.5,5)}s;
        --o:${rand(0.3,0.9)};
      `;
      starsEl.appendChild(s);
    }
  }

  // desenha chapeuzinho no canvas de menu
  const mc = $('menu-char-canvas');
  if (mc) {
    const mctx = mc.getContext('2d');
    mctx.imageSmoothingEnabled = false;
    let mframe = 0;
    function animMenu() {
      mctx.clearRect(0, 0, 48, 48);
      mctx.fillStyle = 'transparent';
      const sp = CHAP_SPRITES[mframe];
      mctx.save();
      mctx.scale(48 / sp[0].length, 48 / sp.length);
      sp.forEach((row, ry) => {
        row.forEach((col, rx) => {
          if (col) { mctx.fillStyle = col; mctx.fillRect(rx, ry, 1, 1); }
        });
      });
      mctx.restore();
    }
    let mfTimer = 0;
    function menuLoop() {
      mfTimer++;
      if (mfTimer % 30 === 0) mframe = 1 - mframe;
      animMenu();
      requestAnimationFrame(menuLoop);
    }
    menuLoop();
  }

  const btnPlay = $('btn-play');
  if (btnPlay) btnPlay.onclick = () => Game.start();

  const ctrlBtn = $('btn-controls');
  const ctrlPanel = document.querySelector('.controls-panel');
  if (ctrlBtn && ctrlPanel) {
    ctrlBtn.onclick = () => ctrlPanel.classList.toggle('hidden');
  }
}

/* ========== GERADOR DE FASE ========== */
function buildPhase(num) {
  const W = 200; // largura em tiles lógicos
  const H = 15;
  const pixW = W * TILE;
  const pixH = H * TILE;

  // plataformas base + flutuantes
  const platforms = [
    // chão base
    { x: 0, y: pixH - TILE * 2, w: pixW, h: TILE * 2, solid: true }
  ];

  // plataformas flutuantes
  for (let i = 0; i < 18 + num * 4; i++) {
    const x = rand(2, W - 6) * TILE;
    const y = rand(5, H - 4) * TILE;
    const w = randInt(3, 7) * TILE;
    platforms.push({ x, y, w, h: TILE, solid: true });
  }

  // inimigos (monstros)
  const enemies = [];
  const count = 4 + num * 3;
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: rand(4, W - 4) * TILE,
      y: pixH - TILE * 2 - TILE,
      vx: (Math.random() > 0.5 ? 1 : -1) * rand(0.8, 1.8 + num * 0.3),
      vy: 0,
      w: 14, h: 14,
      hp: 2 + num,
      maxHp: 2 + num,
      frame: 0,
      frameTimer: 0,
      grounded: false,
      alive: true,
      type: 'walker',
    });
  }

  // colecionáveis (cogumelos / estrelas)
  const pickups = [];
  for (let i = 0; i < 12 + num * 2; i++) {
    pickups.push({
      x: rand(2, W - 2) * TILE,
      y: rand(3, H - 4) * TILE,
      collected: false,
      type: Math.random() > 0.8 ? 'heart' : 'star',
      bobTimer: rand(0, Math.PI * 2),
    });
  }

  // decorações (árvores)
  const decos = [];
  for (let i = 0; i < 30; i++) {
    decos.push({ x: rand(0, W) * TILE, y: pixH - TILE * 2, w: 5, h: randInt(8, 14) });
  }

  const phaseName = num === 1 ? 'FASE 1 — A FLORESTA' :
                    num === 2 ? 'FASE 2 — O CAMINHO NEGRO' :
                                'FASE 3 — O COVIL DA BESTA';
  return { W, H, pixW, pixH, platforms, enemies, pickups, decos, phaseName, num };
}

/* ========== BOSS ========== */
function makeBoss(phase) {
  return {
    x: phase.pixW - TILE * 6,
    y: phase.pixH - TILE * 2 - TILE * 3,
    vx: -2.5,
    vy: 0,
    w: 22, h: 24,
    hp: 15,
    maxHp: 15,
    grounded: false,
    alive: true,
    frame: 0,
    frameTimer: 0,
    revealed: false,
    attackTimer: 0,
    projectiles: [],
    jumpTimer: 0,
    type: 'boss',
  };
}

/* ========== INPUT ========== */
const Keys = { left: false, right: false, up: false, fire: false };
const KeyMap = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', Space: 'up',
  KeyZ: 'fire', KeyX: 'fire',
};

function bindKeys() {
  document.addEventListener('keydown', e => {
    const k = KeyMap[e.code];
    if (k) { Keys[k] = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', e => {
    const k = KeyMap[e.code];
    if (k) { Keys[k] = false; }
  });

  // Mobile touch buttons
  const binds = [
    { id: 'btn-left',  key: 'left' },
    { id: 'btn-right', key: 'right' },
    { id: 'btn-jump',  key: 'up' },
    { id: 'btn-fire',  key: 'fire' },
  ];

  binds.forEach(({ id, key }) => {
    const el = $(id);
    if (!el) return;
    const press = (e) => {
      e.preventDefault();
      Keys[key] = true;
      el.classList.add('pressed');
    };
    const release = (e) => {
      e.preventDefault();
      Keys[key] = false;
      el.classList.remove('pressed');
    };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
  });
}

/* ========== ENGINE PRINCIPAL ========== */
const Game = {
  canvas: null,
  ctx: null,
  raf: null,
  state: 'idle', // idle | playing | dead | bosswin

  // estado de jogo
  lives: 3,
  score: 0,
  phaseNum: 1,
  phase: null,
  boss: null,
  bossActive: false,

  player: null,
  camera: { x: 0, y: 0 },

  fireballs: [],
  fireDelay: 0,

  particles: [],
  damageFlash: 0,
  phaseTransition: 0,

  lastTime: 0,

  /* ---------- INICIAR ---------- */
  start() {
    this.lives     = 3;
    this.score     = 0;
    this.phaseNum  = 1;
    
    // Corrigido: Garante que a troca de tela aconteça ANTES do cálculo de dimensões do Canvas
    Screen.show('game-screen');
    this.loadPhase();
    this.resizeCanvas();
    
    if (this.raf) cancelAnimationFrame(this.raf);
    this.state = 'playing';
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  },

  loadPhase() {
    this.phase       = buildPhase(this.phaseNum);
    this.boss        = null;
    this.bossActive  = false;
    this.fireballs   = [];
    this.particles   = [];
    this.phaseTransition = 60;

    this.player = {
      x: TILE * 2,
      y: this.phase.pixH - TILE * 4,
      vx: 0, vy: 0,
      w: 8, h: 16,
      grounded: false,
      frame: 0,
      frameTimer: 0,
      facingLeft: false,
      invincible: 0,
      reachedEnd: false,
    };

    const phNameEl = $('hud-phase-name');
    if (phNameEl) phNameEl.textContent = this.phase.phaseName;
    this.updateHUD();
  },

  /* ---------- RESIZE ---------- */
  resizeCanvas() {
    const gs = $('game-screen');
    if (!gs) return;
    
    const hud = document.querySelector('.hud');
    const mc  = document.querySelector('.mobile-controls');
    const hudH = hud ? hud.offsetHeight : 36;
    const mcH  = mc  ? mc.offsetHeight  : 90;
    const availH = gs.clientHeight - hudH - mcH;
    const availW = gs.clientWidth;

    // razão lógica
    const logW = this.phase ? (this.phase.pixW < 800 ? this.phase.pixW : 800) : 800;
    const logH = this.phase ? this.phase.pixH : 240;
    const ratio = Math.min(availW / logW, availH / logH) || 1;
    const cw = Math.floor(logW * ratio);
    const ch = Math.floor(logH * ratio);

    const c = $('game-canvas');
    if (c) {
      c.style.width  = cw + 'px';
      c.style.height = ch + 'px';
      c.width  = 800;
      c.height = logH;
      this.canvas = c;
      this.ctx = c.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
    }
  },

  /* ---------- LOOP ---------- */
  loop(ts) {
    const dt = Math.min((ts - this.lastTime) / 16.67, 3);
    this.lastTime = ts;

    if (this.state === 'playing') {
      this.update(dt);
      this.render();
    }

    this.raf = requestAnimationFrame(t => this.loop(t));
  },

  /* ---------- UPDATE ---------- */
  update(dt) {
    const ph = this.phase;
    const pl = this.player;
    if (!ph || !pl) return;

    if (this.phaseTransition > 0) { this.phaseTransition--; return; }

    // -- jogadora --
    if (Keys.left)  { pl.vx = -MOVE_SPEED; pl.facingLeft = true; }
    else if (Keys.right) { pl.vx = MOVE_SPEED; pl.facingLeft = false; }
    else pl.vx *= 0.7;

    if (Keys.up && pl.grounded) { pl.vy = JUMP_VEL; pl.grounded = false; }

    pl.vy = Math.min(pl.vy + GRAVITY, 14);
    pl.x += pl.vx;
    pl.y += pl.vy;
    pl.x = clamp(pl.x, 0, ph.pixW - pl.w);

    // animação
    pl.frameTimer++;
    if (pl.frameTimer >= 12) { pl.frameTimer = 0; pl.frame = 1 - pl.frame; }
    if (pl.invincible > 0) pl.invincible--;

    // colisão plataformas
    pl.grounded = false;
    ph.platforms.forEach(p => {
      if (this.rectOverlap(pl, p)) {
        const overBottom = (pl.y + pl.h) - p.y;
        const overTop    = (p.y + p.h) - pl.y;
        const overLeft   = (pl.x + pl.w) - p.x;
        const overRight  = (p.x + p.w) - pl.x;
        const minOver    = Math.min(overBottom, overTop, overLeft, overRight);
        if (minOver === overBottom && pl.vy >= 0) {
          pl.y = p.y - pl.h; pl.vy = 0; pl.grounded = true;
        } else if (minOver === overTop && pl.vy < 0) {
          pl.y = p.y + p.h; pl.vy = 0;
        } else if (minOver === overLeft) {
          pl.x = p.x - pl.w; pl.vx = 0;
        } else {
          pl.x = p.x + p.w; pl.vx = 0;
        }
      }
    });

    // câmera
    this.camera.x = clamp(pl.x - 400 + pl.w / 2, 0, ph.pixW - 800);
    this.camera.y = 0;

    // tiro
    this.fireDelay = Math.max(0, this.fireDelay - 1);
    if (Keys.fire && this.fireDelay === 0) {
      this.fireDelay = 18;
      this.fireballs.push({
        x: pl.x + (pl.facingLeft ? -6 : pl.w),
        y: pl.y + 6,
        vx: pl.facingLeft ? -6 : 6,
        vy: -0.5,
        alive: true,
        age: 0,
      });
    }

    // update fireballs
    this.fireballs = this.fireballs.filter(f => f.alive && f.age < 80);
    this.fireballs.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      f.age++;
      ph.platforms.forEach(p => {
        if (this.rectOverlap({ x: f.x, y: f.y, w: 4, h: 4 }, p)) {
          f.alive = false;
          this.spawnParticles(f.x, f.y, PAL.fire1, 6);
        }
      });
    });

    // inimigos
    ph.enemies.forEach(en => {
      if (!en.alive) return;
      en.vy = Math.min(en.vy + GRAVITY, 14);
      en.x += en.vx;
      en.y += en.vy;
      en.grounded = false;

      ph.platforms.forEach(p => {
        if (this.rectOverlap(en, p)) {
          const overBottom = (en.y + en.h) - p.y;
          if (overBottom > 0 && overBottom < 16 && en.vy >= 0) {
            en.y = p.y - en.h; en.vy = 0; en.grounded = true;
          }
        }
      });

      // virar nas bordas ou buracos
      if (en.x <= 0 || en.x + en.w >= ph.pixW) en.vx *= -1;
      if (en.grounded) {
        const edgeX = en.x + (en.vx > 0 ? en.w + 2 : -2);
        const edgeY = en.y + en.h + 4;
        let onGround = false;
        ph.platforms.forEach(p => {
          if (edgeX >= p.x && edgeX <= p.x + p.w && edgeY >= p.y && edgeY <= p.y + p.h)
            onGround = true;
        });
        if (!onGround) en.vx *= -1;
      }

      en.frameTimer++;
      if (en.frameTimer >= 16) { en.frameTimer = 0; en.frame = 1 - en.frame; }

      // colisão com fireballs
      this.fireballs.forEach(f => {
        if (!f.alive) return;
        if (this.rectOverlap({ x: f.x, y: f.y, w: 4, h: 4 }, en)) {
          f.alive = false;
          en.hp--;
          this.spawnParticles(en.x + en.w/2, en.y + en.h/2, PAL.fire2, 8);
          if (en.hp <= 0) {
            en.alive = false;
            this.score += 100;
            this.spawnParticles(en.x, en.y, PAL.neonG, 12);
          }
        }
      });

      // dano ao jogador
      if (pl.invincible === 0 && this.rectOverlap(pl, { x: en.x, y: en.y, w: en.w, h: en.h })) {
        this.playerHit();
      }
    });

    // colecionáveis
    ph.pickups.forEach(pk => {
      if (pk.collected) return;
      pk.bobTimer += 0.05;
      if (this.rectOverlap(pl, { x: pk.x, y: pk.y + Math.sin(pk.bobTimer) * 2, w: 8, h: 8 })) {
        pk.collected = true;
        if (pk.type === 'star')  { this.score += 50; this.spawnParticles(pk.x, pk.y, PAL.gold, 6); }
        if (pk.type === 'heart') { this.lives = Math.min(this.lives + 1, 5); this.updateHUD(); this.spawnParticles(pk.x, pk.y, '#ff5555', 8); }
      }
    });

    // boss
    if (this.bossActive && this.boss && this.boss.alive) {
      this.updateBoss(dt);
    }

    // ativar boss quando jogadora chega nos últimos 15% do mapa
    if (!this.bossActive && !this.boss && pl.x > ph.pixW * 0.85) {
      this.boss = makeBoss(ph);
      this.bossActive = true;
    }

    // partículas
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
    });

    // score atualização
    const scoreEl = $('hud-score');
    if (scoreEl) scoreEl.textContent = this.score;

    // cair no abismo
    if (pl.y > ph.pixH + 50) this.playerHit(true);
  },

  updateBoss(dt) {
    const b = this.boss;
    const pl = this.player;

    b.vy = Math.min(b.vy + GRAVITY * 0.8, 12);
    b.x += b.vx;
    b.y += b.vy;

    b.grounded = false;
    this.phase.platforms.forEach(p => {
      if (this.rectOverlap(b, p)) {
        const ov = (b.y + b.h) - p.y;
        if (ov > 0 && ov < 20 && b.vy >= 0) {
          b.y = p.y - b.h; b.vy = 0; b.grounded = true;
        }
      }
    });

    if (b.x <= this.phase.pixW * 0.6 || b.x + b.w >= this.phase.pixW - TILE) b.vx *= -1;

    // pulo
    b.jumpTimer++;
    if (b.grounded && b.jumpTimer > 80) {
      b.vy = JUMP_VEL * 0.9; b.grounded = false; b.jumpTimer = 0;
    }

    b.frameTimer++;
    if (b.frameTimer >= 14) { b.frameTimer = 0; b.frame = 1 - b.frame; }

    // projéteis
    b.attackTimer++;
    const atkRate = b.hp < 8 ? 50 : 80;
    if (b.attackTimer >= atkRate) {
      b.attackTimer = 0;
      const dx = pl.x - b.x;
      const dy = pl.y - b.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = 3.5;
      b.projectiles.push({
        x: b.x + b.w / 2, y: b.y + b.h / 2,
        vx: (dx / len) * spd, vy: (dy / len) * spd,
        alive: true, age: 0,
      });
    }

    b.projectiles = b.projectiles.filter(p => p.alive && p.age < 90);
    b.projectiles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.age++;
      if (this.player.invincible === 0 &&
          this.rectOverlap(this.player, { x: p.x - 3, y: p.y - 3, w: 6, h: 6 })) {
        p.alive = false;
        this.playerHit();
      }
    });

    // fireballs vs boss
    this.fireballs.forEach(f => {
      if (!f.alive) return;
      if (this.rectOverlap({ x: f.x, y: f.y, w: 5, h: 5 }, b)) {
        f.alive = false;
        b.hp--;
        this.spawnParticles(b.x + b.w / 2, b.y, PAL.fire1, 10);
        this.damageFlash = 8;
        if (b.hp <= 0) {
          b.alive = false;
          this.score += 1000;
          this.triggerReveal();
        }
      }
    });

    // colisão física
    if (this.player.invincible === 0 &&
        this.rectOverlap(this.player, { x: b.x, y: b.y, w: b.w, h: b.h })) {
      this.playerHit();
    }
  },

  playerHit(fell = false) {
    this.lives--;
    this.updateHUD();
    this.player.invincible = 90;
    this.player.vy = -6;
    this.damageFlash = 20;
    this.spawnParticles(this.player.x, this.player.y, PAL.red, 10);

    if (this.lives <= 0) {
      this.state = 'dead';
      setTimeout(() => {
        const goScoreEl = $('go-score');
        if (goScoreEl) goScoreEl.textContent = this.score;
        Screen.show('gameover-screen');
      }, 800);
    } else if (fell) {
      this.player.x = TILE * 2;
      this.player.y = this.phase.pixH - TILE * 4;
      this.player.vy = 0;
    }
  },

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: rand(-2.5, 2.5),
        vy: rand(-3.5, -0.5),
        color,
        life: randInt(18, 35),
      });
    }
  },

  triggerReveal() {
    this.state = 'bosswin';
    Screen.show('reveal-screen');
    const finalScoreEl = $('final-score');
    if (finalScoreEl) finalScoreEl.textContent = this.score;

    // sequência de revelação
    const steps = ['rv1', 'rv2', 'rv3', 'rv4'];
    let i = 0;
    function next() {
      if (i > 0) {
        const prevEl = $(steps[i - 1]);
        if (prevEl) prevEl.classList.add('hidden');
      }
      if (i < steps.length) {
        const nextEl = $(steps[i]);
        if (nextEl) nextEl.classList.remove('hidden');
        i++;
        if (i < steps.length) setTimeout(next, 2800);
      }
    }
    setTimeout(next, 300);
  },

  updateHUD() {
    const livesEl = $('hud-lives');
    const scoreEl = $('hud-score');
    const ammoEl = $('hud-ammo');
    if (livesEl) livesEl.textContent = this.lives;
    if (scoreEl) scoreEl.textContent = this.score;
    if (ammoEl)  ammoEl.textContent  = '∞';
  },

  rectOverlap(a, b) {
    return a.x < b.x + (b.w || TILE) &&
           a.x + (a.w || 8) > b.x &&
           a.y < b.y + (b.h || TILE) &&
           a.y + (a.h || 8) > b.y;
  },

  /* ---------- RENDER ---------- */
  render() {
    const ctx = this.ctx;
    if (!ctx) return;
    
    const ph  = this.phase;
    const cam = this.camera;
    const pl  = this.player;
    ctx.imageSmoothingEnabled = false;

    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // ---- fundo / céu ----
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, PAL.sky1);
    skyGrad.addColorStop(1, PAL.sky2);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Lua
    ctx.fillStyle = PAL.moonGlow;
    ctx.beginPath();
    ctx.arc(W * 0.8, 30, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.moon;
    ctx.beginPath();
    ctx.arc(W * 0.8, 30, 14, 0, Math.PI * 2);
    ctx.fill();

    // Estrelas de fundo
    ctx.fillStyle = PAL.white;
    for (let si = 0; si < 40; si++) {
      const sx = ((si * 97 + 13) % W);
      const sy = ((si * 53 + 7) % (H * 0.6));
      ctx.fillRect(sx, sy, 1, 1);
    }

    // ---- câmera ----
    ctx.save();
    ctx.translate(-cam.x, 0);

    // ---- decorações (árvores) ----
    ph.decos.forEach(d => {
      if (d.x + d.w * TILE < cam.x || d.x > cam.x + W) return;
      drawTree(ctx, d.x, d.y - d.h + 2, d.w, d.h);
    });

    // ---- plataformas ----
    ph.platforms.forEach(p => {
      if (p.x + p.w < cam.x || p.x > cam.x + W) return;
      // terra
      ctx.fillStyle = PAL.ground;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // grama
      ctx.fillStyle = PAL.grass;
      ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = PAL.grassLt;
      for (let gx = p.x; gx < p.x + p.w; gx += 4) {
        ctx.fillRect(gx, p.y - 1, 2, 2);
      }
      // detalhe lateral
      ctx.fillStyle = PAL.groundDk;
      ctx.fillRect(p.x, p.y + 2, p.w, p.h - 2);
    });

    // ---- colecionáveis ----
    ph.pickups.forEach(pk => {
      if (pk.collected) return;
      const py = pk.y + Math.sin(pk.bobTimer) * 2;
      if (pk.type === 'star') {
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(pk.x + 2, py, 4, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(pk.x + 3, py + 1, 2, 2);
      } else {
        ctx.fillStyle = '#ff5555';
        ctx.fillRect(pk.x + 1, py + 2, 2, 3);
        ctx.fillRect(pk.x + 3, py, 2, 5);
        ctx.fillRect(pk.x + 5, py + 2, 2, 3);
      }
    });

    // ---- inimigos ----
    ph.enemies.forEach(en => {
      if (!en.alive) return;
      if (en.x + en.w < cam.x || en.x > cam.x + W) return;
      const sp = makeMonsterSprite(en.frame, en.hp / en.maxHp);
      const flip = en.vx > 0;
      drawSprite(ctx, sp, Math.round(en.x), Math.round(en.y), flip);
      // barra de HP
      if (en.hp < en.maxHp) {
        const bw = en.w;
        ctx.fillStyle = '#300';
        ctx.fillRect(en.x, en.y - 3, bw, 2);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(en.x, en.y - 3, bw * (en.hp / en.maxHp), 2);
      }
    });

    // ---- boss ----
    if (this.bossActive && this.boss) {
      const b = this.boss;
      const bsp = makeBossSprite(b.alive ? 'monster' : 'granny', b.frame);
      drawSprite(ctx, bsp, Math.round(b.x), Math.round(b.y), b.vx > 0);
      // barra de HP do boss
      if (b.alive) {
        const bw = 50;
        const bx = b.x + b.w / 2 - bw / 2;
        ctx.fillStyle = '#500';
        ctx.fillRect(bx, b.y - 6, bw, 4);
        ctx.fillStyle = '#f00';
        ctx.fillRect(bx, b.y - 6, bw * (b.hp / b.maxHp), 4);
        ctx.fillStyle = PAL.white;
        ctx.font = '4px Press Start 2P, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('???', b.x + b.w / 2, b.y - 9);
      }
      // projéteis do boss
      b.projectiles.forEach(p => {
        if (!p.alive) return;
        ctx.fillStyle = PAL.bossRed;
        ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 5, 5);
        ctx.fillStyle = PAL.bossGold;
        ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3);
      });
    }

    // ---- fireballs ----
    const fbsp = makeFireball();
    this.fireballs.forEach(f => {
      if (!f.alive) return;
      drawSprite(ctx, fbsp, Math.round(f.x), Math.round(f.y));
    });

    // ---- partículas ----
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 35;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    });
    ctx.globalAlpha = 1;

    // ---- jogadora ----
    const blink = pl.invincible > 0 && Math.floor(pl.invincible / 5) % 2 === 0;
    if (!blink) {
      const sp = CHAP_SPRITES[pl.frame];
      drawSprite(ctx, sp, Math.round(pl.x - 2), Math.round(pl.y - 2), pl.facingLeft);
    }

    ctx.restore();

    // ---- flash de dano ----
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.damageFlash / 20 * 0.4})`;
      ctx.fillRect(0, 0, W, H);
      ctx.damageFlash--;
    }

    // ---- transição de fase ----
    if (this.phaseTransition > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.phaseTransition / 60})`;
      ctx.fillRect(0, 0, W, H);
    }

    // ---- indicador boss ----
    if (this.bossActive && this.boss && this.boss.alive) {
      ctx.fillStyle = '#f00';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ CHEFE À FRENTE ⚠', W / 2, 20);
    }

    // ---- seta de direção ----
    if (!this.bossActive) {
      const prog = Math.floor((this.player.x / this.phase.pixW) * 100);
      ctx.fillStyle = PAL.neonG;
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`→ ${prog}%`, 8, H - 6);
    }
  },
};

/* ========== REINICIAR BOTÕES ========== */
document.addEventListener('DOMContentLoaded', () => {
  bindKeys();
  initMenu();

  $('btn-restart')?.addEventListener('click', () => Game.start());
  $('btn-menu-go')?.addEventListener('click', () => Screen.show('menu-screen'));
  $('btn-menu-win')?.addEventListener('click', () => Screen.show('menu-screen'));

  // resize
  window.addEventListener('resize', () => {
    if (Game.canvas) Game.resizeCanvas();
  });

  Screen.show('menu-screen');
});
