/* ========================================
   O SEGREDO DA FLORESTA - LÓGICA DO JOGO
   ======================================== */

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 240, H = 135;

const STAGES = ['FLORESTA', 'PÂNTANO', 'CAVERNA', 'REVELAÇÃO'];
let stage = 0, score = 0, hp = 3, frame = 0;
let gameState = 'menu'; // menu, howto, play, boss, win, dead, reveal
let keys = {};
let particles = [];
let fireballs = [];

// Jogador: apenas Chapeuzinho Vermelho
const player = {
  x: 30, y: 90, w: 10, h: 12, vx: 0, vy: 0,
  onGround: false, dir: 1, animFrame: 0,
  fireCooldown: 0, invincible: 0
};

let enemies = [];
let platforms = [];
let boss = null;
let scrollX = 0;
let levelLen = 800;
let bossAppeared = false;
let revealTimer = 0;
let stageTimer = 0;
let msgTimer = 0;
let spawnTimer = 0;
let bgScroll = 0;

// Arena do chefe (área travada de combate)
let bossArenaX = 0;
let bossIntroTimer = 0;
let revealPhase = 0; // 0=transformação, 1=revelada, 2=diálogo final
let lightningTimer = 0;
let screenShake = 0;

// Paletas de cores por fase
const palettes = [
  { sky: '#1a2a1a', ground: '#2d4a1e', groundTop: '#3a6b27', tree1: '#1e3d12', tree2: '#2d5a1e', fog: '#1a2a1aaa' },
  { sky: '#1a1a2a', ground: '#2a1f2a', groundTop: '#3d2b3d', tree1: '#151020', tree2: '#2a1a2a', fog: '#1a1a2aaa' },
  { sky: '#0a0a0a', ground: '#1a1410', groundTop: '#2a1e14', tree1: '#100c08', tree2: '#1a1208', fog: '#0a0a0aaa' },
  { sky: '#0a0a1a', ground: '#1a1a2a', groundTop: '#2a2a3a', tree1: '#0a0a20', tree2: '#1a1a30', fog: '#0a0a1aaa' }
];

function getPal() { return palettes[Math.min(stage, 3)]; }

/* ===================== INICIALIZAÇÃO DE FASE ===================== */
function initStage() {
  enemies = []; platforms = []; fireballs = [];
  scrollX = 0; bossAppeared = false; boss = null;
  player.x = 30; player.y = 70; player.vx = 0; player.vy = 0;
  spawnTimer = 0; stageTimer = 0;
  levelLen = 1400 + stage * 300; // fases bem mais longas: mais aventura
  bgScroll = 0;

  for (let i = 0; i < 10 + stage * 2; i++) {
    let px = 140 + i * (90 + Math.random() * 50);
    let py = 55 + Math.random() * 45;
    let pw = 22 + Math.random() * 22;
    platforms.push({ x: px, y: py, w: pw });
  }

  // Poucos inimigos, bem espaçados ao longo da fase mais longa
  const enemyCount = 4 + stage; // bem reduzido
  for (let i = 0; i < enemyCount; i++) {
    spawnEnemy(220 + i * (levelLen / enemyCount));
  }
}

function spawnEnemy(x) {
  const types = ['wolf', 'spider', 'bat', 'mushroom'];
  const t = types[Math.floor(Math.random() * Math.min(2 + stage, 4))];
  enemies.push({
    x: x || scrollX + 260, y: 90, w: 10, h: 10,
    vx: -(0.25 + Math.random() * 0.25 + stage * 0.08),
    vy: 0, type: t, animFrame: 0, hp: 1 + (stage > 1 ? 1 : 0)
  });
}

function spawnParticle(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 2, vy: -(Math.random() * 2 + 0.5),
      life: 20 + Math.random() * 15, color, size: 2
    });
  }
}

function shootFireball() {
  fireballs.push({
    x: player.x + (player.dir > 0 ? 9 : -2),
    y: player.y + 4,
    vx: 2.6 * player.dir,
    dir: player.dir,
    life: 90
  });
  spawnParticle(player.x + (player.dir > 0 ? 9 : -2), player.y + 4, '#ffaa00', 4);
}

/* ===================== MENSAGENS ===================== */
function showMsg(txt, dur) {
  const el = document.getElementById('msg');
  el.style.display = 'block';
  el.textContent = txt;
  msgTimer = dur || 180;
}

function hideMsg() {
  document.getElementById('msg').style.display = 'none';
}

/* ===================== DESENHO: FUNDO ===================== */
function drawBg() {
  const p = getPal();
  ctx.fillStyle = p.sky;
  ctx.fillRect(0, 0, W, H);

  if (stage > 0) {
    ctx.fillStyle = '#aaaacc';
    ctx.fillRect(200, 8, 6, 6);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(201, 9, 4, 4);
  } else {
    ctx.fillStyle = '#ffee88';
    for (let i = 0; i < 12; i++) {
      let sx = (i * 37 + 10) % W;
      let sy = 5 + (i * 13) % 25;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  ctx.fillStyle = p.tree1;
  for (let i = 0; i < 8; i++) {
    let tx = ((i * 40 - bgScroll * 0.3 + 800) % (W + 20)) - 10;
    drawTree(tx, 60, 10, 20);
  }

  ctx.fillStyle = p.ground;
  ctx.fillRect(0, 110, W, H - 110);
  ctx.fillStyle = p.groundTop;
  ctx.fillRect(0, 110, W, 3);

  ctx.fillStyle = p.groundTop;
  for (let i = 0; i < 12; i++) {
    let gx = ((i * 25 - scrollX * 0.8 + 1000) % (W + 10)) - 5;
    ctx.fillRect(gx, 107, 2, 3);
    ctx.fillRect(gx + 3, 108, 1, 2);
  }

  ctx.fillStyle = p.tree2;
  for (let i = 0; i < 5; i++) {
    let tx = ((i * 60 - bgScroll * 0.7 + 800) % (W + 30)) - 15;
    drawTree(tx, 75, 14, 30);
  }
}

function drawTree(x, y, w, h) {
  ctx.fillRect(x + w / 2 - 2, y + h * 0.6, 4, h * 0.4);
  ctx.fillRect(x, y, w, h * 0.4);
  ctx.fillRect(x + 2, y - h * 0.25, w - 4, h * 0.35);
}

function drawPlatforms() {
  platforms.forEach(p => {
    let sx = p.x - scrollX;
    if (sx < -30 || sx > W + 10) return;
    const pal = getPal();
    ctx.fillStyle = pal.groundTop;
    ctx.fillRect(sx, p.y, p.w, 5);
    ctx.fillStyle = pal.ground;
    ctx.fillRect(sx, p.y + 3, p.w, 4);
  });
}

/* ===================== DESENHO: AMBIENTAÇÃO EXTRA ===================== */
function drawFireflies() {
  // Pequenos vagalumes/partículas ambientes para dar vida à floresta (substitui obstáculos)
  for (let i = 0; i < 6; i++) {
    let fx = ((i * 73 + frame * 0.3) % (levelLen + 200)) - scrollX;
    if (fx < -5 || fx > W + 5) continue;
    let fy = 50 + Math.sin(frame * 0.03 + i * 2) * 30 + (i % 3) * 15;
    let glow = (Math.sin(frame * 0.1 + i) + 1) / 2;
    ctx.fillStyle = stage === 0 ? `rgba(255,238,150,${0.3 + glow * 0.5})` : `rgba(180,150,255,${0.2 + glow * 0.4})`;
    ctx.fillRect(fx, fy, 1, 1);
  }
}

/* ===================== DESENHO: INIMIGOS ===================== */
function drawEnemy(e) {
  let sx = e.x - scrollX;
  if (sx < -15 || sx > W + 15) return;
  let t = e.type, f = Math.floor(frame / 10) % 2;
  if (t === 'wolf') {
    ctx.fillStyle = '#887788';
    ctx.fillRect(sx, e.y - 2, 10, 7);
    ctx.fillStyle = '#998899';
    ctx.fillRect(sx + 1, e.y - 4, 5, 4);
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(sx + 7, e.y - 1, 2, 1);
    ctx.fillStyle = '#665566';
    ctx.fillRect(sx + 1, e.y + 5, 2, 2 + f);
    ctx.fillRect(sx + 5, e.y + 5, 2, 2 + (1 - f));
  } else if (t === 'spider') {
    ctx.fillStyle = '#222244';
    ctx.fillRect(sx + 2, e.y, 6, 5);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(sx + 3, e.y + 1, 1, 1);
    ctx.fillRect(sx + 6, e.y + 1, 1, 1);
    ctx.fillStyle = '#111133';
    ctx.fillRect(sx + f, e.y + 2, 2, 1);
    ctx.fillRect(sx + 8 - f, e.y + 2, 2, 1);
    ctx.fillRect(sx + 1, e.y + 3 + f, 1, 2);
    ctx.fillRect(sx + 8, e.y + 3 + f, 1, 2);
  } else if (t === 'bat') {
    e.y = 75 + Math.sin(frame * 0.05 + e.x) * 10;
    ctx.fillStyle = '#332244';
    ctx.fillRect(sx + 3, e.y + 1, 4, 4);
    ctx.fillStyle = '#221133';
    ctx.fillRect(sx, e.y + f, 3, 2);
    ctx.fillRect(sx + 7, e.y + f, 3, 2);
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(sx + 4, e.y, 1, 1);
    ctx.fillRect(sx + 5, e.y, 1, 1);
  } else if (t === 'mushroom') {
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(sx + 1, e.y - 2, 8, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 2, e.y - 1, 2, 1);
    ctx.fillRect(sx + 6, e.y - 1, 2, 1);
    ctx.fillStyle = '#ddccaa';
    ctx.fillRect(sx + 2, e.y + 3, 6, 4);
    if (f) {
      ctx.fillStyle = '#bb1111';
      ctx.fillRect(sx, e.y + 1, 1, 3);
      ctx.fillRect(sx + 9, e.y + 1, 1, 3);
    }
  }
}

/* ===================== DESENHO: CHEFE ===================== */
function drawBoss() {
  if (!boss) return;
  let sx = boss.x - scrollX;
  let f8 = Math.floor(frame / 8) % 4;
  let shake = boss.hit ? (Math.random() * 4 - 2) : 0;

  /* ---------- FASE DE REVELAÇÃO: A VOVÓ MONSTRO ---------- */
  if (gameState === 'reveal') {
    let groundY = boss.y;
    let bob = Math.sin(frame * 0.04) * 1.5;

    // Sombra no chão
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(sx - 8, groundY + 13, 36, 4);

    // Fase 0: ainda envolta em sombras escuras se rasgando (transformação)
    if (revealPhase === 0) {
      let dissolve = Math.min(1, revealTimer / 60);
      // Capa sombria se rasgando
      ctx.fillStyle = `rgba(20,5,30,${1 - dissolve * 0.7})`;
      ctx.fillRect(sx - 5 + shake, groundY - 25 + bob, 30, 40);
      // Rachaduras de luz roxa
      if (revealTimer % 6 < 3) {
        ctx.fillStyle = '#cc66ff';
        ctx.fillRect(sx + 2, groundY - 20 + bob, 1, 15 * dissolve);
        ctx.fillRect(sx + 18, groundY - 18 + bob, 1, 12 * dissolve);
      }
      // Olhos vermelhos ainda visíveis
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(sx + 5, groundY - 29 + bob, 3, 3);
      ctx.fillRect(sx + 12, groundY - 29 + bob, 3, 3);

      // Partículas de dissolução
      if (frame % 3 === 0) spawnParticle(sx + scrollX + 5 + Math.random() * 20, groundY - 20 + Math.random() * 30, '#9933cc', 2);
    } else {
      // Fase 1+: Vovó completamente revelada, capa roxa de bruxa boazinha-malvada
      // Capa
      ctx.fillStyle = '#7a2d8f';
      ctx.fillRect(sx - 6 + shake, groundY - 22 + bob, 32, 38);
      ctx.fillStyle = '#9933aa';
      ctx.fillRect(sx - 4 + shake, groundY - 20 + bob, 28, 34);
      // Vestido interno
      ctx.fillStyle = '#cc88dd';
      ctx.fillRect(sx + 2, groundY - 14 + bob, 16, 24);
      // Braços
      let armSwing = Math.sin(frame * 0.08) * 3;
      ctx.fillStyle = '#9933aa';
      ctx.fillRect(sx - 7, groundY - 10 + bob + armSwing, 6, 14);
      ctx.fillRect(sx + 21, groundY - 10 + bob - armSwing, 6, 14);
      ctx.fillStyle = '#ffddcc';
      ctx.fillRect(sx - 6, groundY + 2 + bob + armSwing, 5, 5);
      ctx.fillRect(sx + 21, groundY + 2 + bob - armSwing, 5, 5);

      // Cabeça
      ctx.fillStyle = '#ffddcc';
      ctx.fillRect(sx + 3, groundY - 33 + bob, 14, 14);
      // Rugas (detalhe de vovó)
      ctx.fillStyle = '#e8c0a8';
      ctx.fillRect(sx + 4, groundY - 27 + bob, 12, 1);

      // Touca de vovó (substituindo cabelo solto)
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(sx + 2, groundY - 38 + bob, 16, 7);
      ctx.fillRect(sx + 4, groundY - 41 + bob, 12, 4);
      ctx.fillStyle = '#dddddd';
      ctx.fillRect(sx + 1, groundY - 34 + bob, 18, 2);

      // Óculos
      ctx.fillStyle = '#222222';
      ctx.fillRect(sx + 4, groundY - 28 + bob, 5, 4);
      ctx.fillRect(sx + 11, groundY - 28 + bob, 5, 4);
      ctx.fillRect(sx + 9, groundY - 27 + bob, 2, 1);

      // Olhos (vermelhos se ainda agressiva, normais se já calma)
      let calm = revealPhase >= 2;
      ctx.fillStyle = calm ? '#553311' : '#ff2222';
      ctx.fillRect(sx + 5, groundY - 27 + bob, 2, 2);
      ctx.fillRect(sx + 12, groundY - 27 + bob, 2, 2);

      // Aura mágica residual (só fase 1, brigando ainda)
      if (revealPhase === 1) {
        for (let i = 0; i < 3; i++) {
          let ang = frame * 0.05 + i * 2.1;
          let ax = sx + 10 + Math.cos(ang) * 18;
          let ay = groundY - 15 + bob + Math.sin(ang) * 18;
          ctx.fillStyle = 'rgba(170,50,220,0.5)';
          ctx.fillRect(ax, ay, 3, 3);
        }
      }

      // Sorriso gentil quando acalmada (fase 2 - diálogo final)
      if (calm) {
        ctx.fillStyle = '#663322';
        ctx.fillRect(sx + 6, groundY - 23 + bob, 6, 1);
      }
    }

    // Barra de vida (só durante a luta, fase 0 e 1)
    if (revealPhase < 2) {
      let barW = Math.max(0, (boss.hp / boss.maxHp) * 70);
      ctx.fillStyle = '#2a0a2a';
      ctx.fillRect(sx - 9, groundY - 48 + bob, 70, 6);
      ctx.fillStyle = '#cc2255';
      ctx.fillRect(sx - 9, groundY - 48 + bob, barW, 6);
      ctx.fillStyle = '#ff77aa';
      ctx.fillRect(sx - 9, groundY - 48 + bob, barW, 2);
      ctx.strokeStyle = '#ffccee';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx - 9, groundY - 48 + bob, 70, 6);

      ctx.fillStyle = '#ffccee';
      ctx.font = '6px monospace';
      ctx.fillText(revealPhase === 0 ? '?????' : 'VOVÓ', sx + 18, groundY - 51 + bob);
    }
    return;
  }

  /* ---------- FASE DE COMBATE: SOMBRA MISTERIOSA ---------- */
  let bob = Math.sin(frame * 0.05) * 2;
  let groundY = boss.y;

  // Sombra no chão
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(sx - 6, groundY + 14, 32, 4);

  // Aura pulsante de fundo (telegraph de perigo)
  let pulse = (Math.sin(frame * 0.12) + 1) / 2;
  ctx.fillStyle = `rgba(140,0,200,${0.08 + pulse * 0.1})`;
  ctx.beginPath();
  ctx.arc(sx + 10, groundY - 5 + bob, 22 + pulse * 4, 0, Math.PI * 2);
  ctx.fill();

  // Tentáculos de capa ondulantes (mais elaborados, 5 ao invés de 3)
  ctx.fillStyle = '#0d0018';
  for (let i = 0; i < 5; i++) {
    let tOff = Math.sin(frame * 0.09 + i * 1.3) * 3;
    let tLen = 8 + f8 + (i % 2) * 2;
    ctx.fillRect(sx - 6 + i * 6 + tOff, groundY + 10 + bob, 4, tLen);
  }

  // Corpo / capa principal
  ctx.fillStyle = '#15002a';
  ctx.fillRect(sx - 3 + shake, groundY - 20 + bob, 26, 35);
  ctx.fillStyle = '#220033';
  ctx.fillRect(sx - 1 + shake, groundY - 18 + bob, 22, 28);

  // Capuz pontudo
  ctx.fillStyle = '#1a0030';
  ctx.fillRect(sx + 1, groundY - 30 + bob, 18, 14);
  ctx.fillRect(sx + 5, groundY - 35 + bob, 10, 7);

  // Olhos vermelhos brilhantes (piscam)
  let blink = Math.floor(frame / 30) % 8 === 0;
  ctx.fillStyle = blink ? '#330000' : '#ff0000';
  ctx.fillRect(sx + 3, groundY - 24 + bob, 4, blink ? 1 : 4);
  ctx.fillRect(sx + 13, groundY - 24 + bob, 4, blink ? 1 : 4);
  if (!blink) {
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(sx + 4, groundY - 23 + bob, 1, 1);
    ctx.fillRect(sx + 14, groundY - 23 + bob, 1, 1);
  }

  // Garras espectrais saindo da capa quando ataca
  if (frame % 90 < 15) {
    ctx.fillStyle = '#2a0a3a';
    ctx.fillRect(sx - 8, groundY - 8 + bob, 6, 2);
    ctx.fillRect(sx - 9, groundY - 6 + bob, 7, 2);
    ctx.fillRect(sx + 22, groundY - 8 + bob, 6, 2);
    ctx.fillRect(sx + 21, groundY - 6 + bob, 7, 2);
  }

  // Partículas de energia orbitando
  for (let i = 0; i < 4; i++) {
    let ang = frame * 0.04 + i * 1.6;
    let r = 16 + Math.sin(frame * 0.1 + i) * 3;
    let ox = sx + 10 + Math.cos(ang) * r;
    let oy = groundY - 8 + bob + Math.sin(ang) * r * 0.5;
    ctx.fillStyle = `rgba(200,0,255,${0.4 + pulse * 0.4})`;
    ctx.fillRect(ox, oy, 2, 2);
  }

  // Barra de vida
  let barW = Math.max(0, (boss.hp / boss.maxHp) * 70);
  ctx.fillStyle = '#2a0a2a';
  ctx.fillRect(sx - 9, groundY - 45 + bob, 70, 6);
  ctx.fillStyle = '#8800aa';
  ctx.fillRect(sx - 9, groundY - 45 + bob, barW, 6);
  ctx.fillStyle = '#cc44ff';
  ctx.fillRect(sx - 9, groundY - 45 + bob, barW, 2);
  ctx.strokeStyle = '#dd99ff';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(sx - 9, groundY - 45 + bob, 70, 6);

  ctx.fillStyle = '#dd99ff';
  ctx.font = '6px monospace';
  ctx.fillText('???', sx + 22, groundY - 48 + bob);
}

/* ===================== DESENHO: CHAPEUZINHO ===================== */
function drawPlayer() {
  let f = Math.floor(frame / 8) % 2;
  let blink = player.invincible > 0 && frame % 4 < 2;
  if (blink) return;

  let sx = player.x;

  ctx.fillStyle = '#cc2222';
  ctx.fillRect(sx + 1, player.y + 3, 8, 7);
  ctx.fillStyle = '#dd3333';
  ctx.fillRect(sx, player.y + 7, 10, 3);
  ctx.fillStyle = '#ffddcc';
  ctx.fillRect(sx + 2, player.y - 3, 6, 6);
  ctx.fillStyle = '#cc2222';
  ctx.fillRect(sx + 1, player.y - 4, 8, 4);
  ctx.fillRect(sx + 3, player.y - 6, 4, 3);
  ctx.fillStyle = '#332211';
  ctx.fillRect(sx + 3, player.y - 1, 1, 1);
  ctx.fillRect(sx + 6, player.y - 1, 1, 1);
  ctx.fillStyle = '#ffddcc';
  ctx.fillRect(sx + 2, player.y + 10, 2, 2 + f);
  ctx.fillRect(sx + 6, player.y + 10, 2, 2 + (1 - f));

  // Cesta na mão (detalhe)
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(sx + (player.dir > 0 ? -2 : 9), player.y + 6, 3, 3);
}

function drawFireballs() {
  fireballs.forEach(fb => {
    let sx = fb.x - scrollX;
    let glow = Math.floor(frame / 4) % 2;
    ctx.fillStyle = glow ? '#ffaa00' : '#ff5500';
    ctx.fillRect(sx - 2, fb.y - 2, 5, 5);
    ctx.fillStyle = '#ffee88';
    ctx.fillRect(sx - 1, fb.y - 1, 3, 3);
    // rastro
    ctx.fillStyle = 'rgba(255,120,0,0.4)';
    ctx.fillRect(sx - fb.dir * 4 - 1, fb.y, 3, 2);
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 35;
    ctx.fillRect(p.x - scrollX, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function drawHUD() {
  let hpStr = '';
  for (let i = 0; i < 3; i++) hpStr += (i < hp ? '♥' : '♡');
  document.getElementById('hp').textContent = hpStr;
  document.getElementById('stage').textContent = STAGES[Math.min(stage, 3)];
  document.getElementById('sc').textContent = 'PTS: ' + score;
}

/* ===================== ATUALIZAÇÃO / FÍSICA ===================== */
function update() {
  frame++;
  bgScroll += 0.5;

  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
    return p.life > 0;
  });

  if (msgTimer > 0) { msgTimer--; if (msgTimer === 0) hideMsg(); }

  if (gameState === 'menu' || gameState === 'howto') return;
  if (gameState === 'dead' || gameState === 'win') return;

  if (gameState === 'reveal') {
    revealTimer++;

    // Fase 0: transformação (sombras se rasgando) - dura 70 frames
    if (revealPhase === 0 && revealTimer > 70) {
      revealPhase = 1;
      screenShake = 12;
    }
    // Fase 1: vovó revelada, ainda com aura residual de raiva - dura até timer externo assumir
    if (revealPhase === 1 && revealTimer > 160) {
      revealPhase = 2; // acalma, sorriso gentil
    }

    if (screenShake > 0) screenShake -= 0.5;

    if (boss) {
      // Chefe centralizado suavemente na arena
      let targetX = scrollX + W / 2 - 10;
      boss.x += (targetX - boss.x) * 0.06;
      boss.y = 80;
      if (revealPhase === 1 && revealTimer % 50 === 0) {
        spawnParticle(boss.x + 10, boss.y - 10, '#aa00ff', 6);
      }
    }
    return;
  }

  stageTimer++;

  // Movimento
  if (keys['ArrowLeft'] || keys['a']) { player.vx = -1.5; player.dir = -1; }
  else if (keys['ArrowRight'] || keys['d']) { player.vx = 1.5; player.dir = 1; }
  else player.vx *= 0.7;

  // Pulo
  if ((keys['z'] || keys['Z'] || keys[' ']) && player.onGround) {
    player.vy = -3.5; player.onGround = false;
    spawnParticle(player.x + 5, player.y + 12, '#88cc44', 4);
  }

  // Bola de fogo (funciona em 'play' E em 'boss')
  if (player.fireCooldown > 0) player.fireCooldown--;
  if ((keys['x'] || keys['X']) && player.fireCooldown <= 0) {
    shootFireball();
    player.fireCooldown = 16;
  }

  player.vy += 0.2;
  player.x += player.vx;
  player.y += player.vy;

  const groundY = 98;
  if (player.y >= groundY) { player.y = groundY; player.vy = 0; player.onGround = true; }

  platforms.forEach(p => {
    let sx = p.x - scrollX;
    if (player.x + 8 > sx && player.x < sx + p.w &&
        player.y + 12 >= p.y && player.y + 12 <= p.y + 8 && player.vy >= 0) {
      player.y = p.y - 12; player.vy = 0; player.onGround = true;
    }
  });

  if (player.x < 5) player.x = 5;

  // ===== SCROLL DA CÂMERA: só acontece durante exploração normal =====
  // Durante a luta de chefe ('boss'), a câmera fica TRAVADA na arena para
  // garantir que o chefe sempre fique visível e as bolas de fogo acertem.
  if (gameState === 'play') {
    if (player.x > W * 0.5 && scrollX < levelLen - W) {
      let advance = player.x - W * 0.5;
      scrollX += advance * 0.08;
      player.x -= advance * 0.08;
    }
  } else if (gameState === 'boss') {
    // Arena travada: jogador não pode sair da área visível da arena
    let arenaMin = bossArenaX + 10;
    let arenaMax = bossArenaX + W - 18;
    if (player.x < arenaMin) player.x = arenaMin;
    if (player.x > arenaMax) player.x = arenaMax;
  }

  spawnTimer++;
  if (gameState === 'play' && spawnTimer > 280 - stage * 25) {
    spawnTimer = 0;
    spawnEnemy();
  }

  // Atualizar bolas de fogo
  fireballs = fireballs.filter(fb => {
    fb.x += fb.vx;
    fb.life--;
    let sx = fb.x - scrollX;
    if (sx < -10 || sx > W + 10 || fb.life <= 0) return false;

    // Colisão com inimigos
    let hit = false;
    enemies.forEach(e => {
      if (!hit && Math.abs(fb.x - e.x) < 8 && Math.abs(fb.y - e.y) < 8) {
        e.hp--;
        hit = true;
        spawnParticle(e.x, e.y, '#ff8800', 8);
        score += 10;
        if (e.hp <= 0) {
          spawnParticle(e.x, e.y, '#ffaa00', 12);
          score += 40;
          e.dead = true;
        }
      }
    });

    // Colisão com chefe (hitbox generosa, alinhada com o novo desenho)
    if (boss && !hit && gameState === 'boss') {
      let bossHitX = boss.x + 8;
      let bossHitY = boss.y - 5;
      if (Math.abs(fb.x - bossHitX) < 18 && Math.abs(fb.y - bossHitY) < 26) {
        boss.hp -= 1;
        boss.hit = true;
        boss.hitTimer = 8;
        score += 5;
        spawnParticle(bossHitX, bossHitY, '#cc00ff', 6);
        hit = true;
      }
    }

    return !hit;
  });

  enemies = enemies.filter(e => {
    let sx = e.x - scrollX;
    if (sx < -40 || e.dead) return false;

    if (e.type === 'bat') {
      e.x += e.vx;
    } else {
      e.x += e.vx;
      e.vy += 0.2;
      e.y += e.vy;
      if (e.y >= 90) { e.y = 90; e.vy = 0; }
    }

    if (sx < 10) e.vx = Math.abs(e.vx);

    if (player.invincible <= 0) {
      if (Math.abs(player.x + 5 - e.x - 5) < 12 && Math.abs(player.y + 6 - e.y - 5) < 12) {
        takeDamage();
      }
    }
    return true;
  });

  if (player.invincible > 0) player.invincible--;
  if (boss && boss.hitTimer > 0) { boss.hitTimer--; if (boss.hitTimer === 0) boss.hit = false; }

  // Chefe aparece — trava a arena no ponto atual
  if (scrollX > levelLen - W - 50 && !bossAppeared) {
    bossAppeared = true;
    bossArenaX = scrollX; // arena fixa a partir daqui
    bossIntroTimer = 0;
    showMsg('⚠ Uma sombra misteriosa se aproxima...', 130);
    boss = {
      x: scrollX + W * 0.72, y: 80,
      w: 25, h: 40,
      hp: 22 + stage * 9, maxHp: 22 + stage * 9,
      vx: -(0.3 + stage * 0.08), hit: false, hitTimer: 0
    };
    gameState = 'boss';
  }

  if (gameState === 'boss' && boss) {
    bossIntroTimer++;
    // Movimento do chefe contido dentro da arena travada
    boss.x += boss.vx + Math.sin(frame * 0.025) * 0.4;
    let arenaLeft = bossArenaX + 30;
    let arenaRight = bossArenaX + W - 25;
    if (boss.x < arenaLeft) { boss.x = arenaLeft; boss.vx = Math.abs(boss.vx); }
    if (boss.x > arenaRight) { boss.x = arenaRight; boss.vx = -Math.abs(boss.vx); }

    if (frame % (55 - stage * 4) === 0) {
      spawnParticle(boss.x + 10, boss.y - 10, '#8800ff', 6);
    }

    // Chefe só pode atacar depois de uma breve introdução (telegraph justo)
    if (player.invincible <= 0 && bossIntroTimer > 40) {
      let bsx2 = boss.x - scrollX;
      let psx = player.x;
      if (Math.abs(psx + 5 - bsx2 - 10) < 18 && Math.abs(player.y + 6 - boss.y - 5) < 24) {
        takeDamage();
      }
    }

    if (boss.hp <= 0) {
      if (stage < 2) {
        spawnParticle(boss.x + 10, boss.y, '#ffaa00', 24);
        spawnParticle(boss.x + 10, boss.y, '#ffffff', 18);
        score += 200;
        boss = null;
        stage++;
        gameState = 'play';
        showMsg('✓ Monstro derrotado!\n\nNovos perigos aguardam...', 160);
        setTimeout(() => initStage(), 2000);
      } else {
        // Início da sequência de revelação final
        gameState = 'reveal';
        revealTimer = 0;
        revealPhase = 0;
        screenShake = 8;
        boss.hp = boss.maxHp;
        spawnParticle(boss.x + 10, boss.y - 10, '#ffffff', 16);
        showMsg('⚡ A sombra começa a se desfazer... ⚡', 80);

        setTimeout(() => {
          showMsg('O SEGREDO É REVELADO...', 70);
        }, 1300);

        setTimeout(() => {
          showMsg('O monstro misterioso...\n\né a VOVÓ! 👵', 110);
        }, 2700);

        setTimeout(() => {
          showMsg('Ela só queria proteger\na floresta de todos\nos visitantes...', 140);
        }, 4600);

        setTimeout(() => {
          document.getElementById('msg').style.display = 'none';
          document.getElementById('msg').textContent = '🏆 PARABÉNS! 🏆\n\nVocê descobriu o segredo da floresta!\n\nPontuação final: ' + score + '\n\nPressione Z para jogar novamente';
          document.getElementById('msg').style.display = 'block';
          gameState = 'win';
        }, 7200);
      }
    }
  }
}

function takeDamage() {
  if (player.invincible > 0) return;
  hp--;
  player.invincible = 80;
  player.vy = -2;
  spawnParticle(player.x + 5, player.y, '#ff4444', 10);
  if (hp <= 0) {
    gameState = 'dead';
    showMsg('💀 Fim de jogo!\n\nO monstro venceu...\n\nPressione Z para tentar novamente', 9999);
  }
}

/* ===================== RENDERIZAÇÃO ===================== */
function render() {
  ctx.save();
  // Screen shake durante momentos de impacto (revelação)
  if (screenShake > 0) {
    let dx = (Math.random() - 0.5) * screenShake;
    let dy = (Math.random() - 0.5) * screenShake;
    ctx.translate(dx, dy);
  }

  ctx.clearRect(-10, -10, W + 20, H + 20);
  drawBg();
  drawPlatforms();
  drawFireflies();
  drawParticles();
  drawFireballs();
  enemies.forEach(e => drawEnemy(e));
  if (boss) drawBoss();
  drawPlayer();

  const p = getPal();
  ctx.fillStyle = p.fog;
  ctx.fillRect(0, 0, 30, H);
  ctx.fillRect(W - 30, 0, 30, H);

  // Flash branco no momento da quebra da sombra (revelação fase 0->1)
  if (gameState === 'reveal' && revealPhase === 0 && revealTimer > 65 && revealTimer < 72) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
  drawHUD();
}

function gameLoop() {
  update();
  if (gameState !== 'menu' && gameState !== 'howto') render();
  requestAnimationFrame(gameLoop);
}

/* ===================== CONTROLE DE TELAS ===================== */
const menuScreen = document.getElementById('menuScreen');
const howToScreen = document.getElementById('howToScreen');
const gameTitle = document.getElementById('title');
const ui = document.getElementById('ui');
const mobileControls = document.getElementById('mobileControls');
const controlsHint = document.getElementById('controlsHint');

function showMenu() {
  gameState = 'menu';
  menuScreen.classList.remove('hidden');
  howToScreen.classList.add('hidden');
  gameTitle.classList.add('hidden');
  canvas.classList.add('hidden');
  ui.classList.add('hidden');
  mobileControls.classList.add('hidden');
  controlsHint.classList.add('hidden');
  hideMsg();
}

function startGame() {
  hp = 3; score = 0; stage = 0; frame = 0; scrollX = 0;
  particles = []; fireballs = [];
  revealPhase = 0; revealTimer = 0; screenShake = 0; bossArenaX = 0; bossIntroTimer = 0;
  gameState = 'play';
  menuScreen.classList.add('hidden');
  howToScreen.classList.add('hidden');
  gameTitle.classList.remove('hidden');
  canvas.classList.remove('hidden');
  ui.classList.remove('hidden');
  controlsHint.classList.remove('hidden');
  if (isTouchDevice) mobileControls.classList.remove('hidden');
  hideMsg();
  initStage();
}

document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('howToBtn').addEventListener('click', () => {
  gameState = 'howto';
  menuScreen.classList.add('hidden');
  howToScreen.classList.remove('hidden');
});
document.getElementById('backBtn').addEventListener('click', showMenu);

/* ===================== INPUT: TECLADO ===================== */
document.addEventListener('keydown', e => {
  keys[e.key] = true;

  if ((gameState === 'dead' || gameState === 'win') && (e.key === 'z' || e.key === 'Z')) {
    startGame();
  }
  if (gameState === 'play' || gameState === 'boss') e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

/* ===================== INPUT: TOUCH (ANDROID / MOBILE) ===================== */
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function bindHold(id, key) {
  const el = document.getElementById(id);
  const press = ev => { ev.preventDefault(); keys[key] = true; };
  const release = ev => { ev.preventDefault(); keys[key] = false; };
  el.addEventListener('touchstart', press, { passive: false });
  el.addEventListener('touchend', release, { passive: false });
  el.addEventListener('touchcancel', release, { passive: false });
  el.addEventListener('mousedown', press);
  el.addEventListener('mouseup', release);
  el.addEventListener('mouseleave', release);
}

bindHold('btnLeft', 'ArrowLeft');
bindHold('btnRight', 'ArrowRight');
bindHold('btnJump', 'z');
bindHold('btnFire', 'x');

// Toque na mensagem de game over / vitória reinicia o jogo
document.getElementById('msg').addEventListener('click', () => {
  if (gameState === 'dead' || gameState === 'win') startGame();
});
document.getElementById('msg').addEventListener('touchstart', (ev) => {
  if (gameState === 'dead' || gameState === 'win') { ev.preventDefault(); startGame(); }
}, { passive: false });

// Previne o scroll da página durante o jogo no mobile
document.body.addEventListener('touchmove', e => {
  if (gameState !== 'menu' && gameState !== 'howto') e.preventDefault();
}, { passive: false });

/* ===================== INÍCIO ===================== */
showMenu();
gameLoop();
