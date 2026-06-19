// ═══════════════════════════════════════════════════════════
//  O SEGREDO DA FLORESTA  —  pixel platformer
// ═══════════════════════════════════════════════════════════

(function(){
"use strict";

// ── Paleta pixel art ──────────────────────────────────────
const P = {
    black:   "#0a0208", darkBrown:"#1a0d05", brown:   "#3b1f0a",
    tan:     "#7a4a1e", skin:     "#f4c28a", skinD:   "#d4935a",
    red:     "#cc2200", redL:     "#ff4422", cape:    "#dd1111",
    capeD:   "#991100", white:    "#f0ece0", whiteD:  "#c8c4b0",
    gray:    "#666677", grayD:    "#333344", blue:    "#3355cc",
    blueL:   "#6688ff", green:    "#226622", greenL:  "#44aa44",
    greenD:  "#113311", treeD:    "#0d2210", leaf:    "#2d7a2d",
    leafL:   "#44bb44", leafD:    "#1a4a1a", ground:  "#3d2510",
    groundL: "#5a3820", groundD:  "#251508", sky:     "#1a0a2e",
    skyM:    "#2a1040", moon:     "#f0e8c0", moonG:   "#c8c088",
    fire1:   "#ff8800", fire2:    "#ffcc00", fire3:   "#ff3300",
    purple:  "#551177", purpleL:  "#882299", purpleD: "#330055",
    wolf:    "#445566", wolfD:    "#223344", wolfL:   "#6677aa",
    granny:  "#886644", grannyD:  "#664422", grannyL: "#aa8866",
    fog:     "#e8d8c0", fogA:     "rgba(232,216,192,",
    hp1:     "#ff2244", hp2:      "#ff6688",
    coin:    "#ffdd00", coinL:    "#ffff88",
    mush:    "#cc3311", mushL:    "#ff5533", mushW:   "#f0ece0",
};

// ── Utilitários ───────────────────────────────────────────
function rect(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function px(ctx, x, y, col) { rect(ctx, x, y, 1, 1, col); }

// Desenha sprite a partir de array de strings (. = transparente)
function drawSprite(ctx, sprite, x, y, palette, scaleX=1) {
    const rows = sprite;
    for (let row = 0; row < rows.length; row++) {
        for (let col = 0; col < rows[row].length; col++) {
            const c = rows[row][col];
            if (c === '.') continue;
            const color = palette[c] || '#ff00ff';
            const dx = scaleX < 0 ? (rows[row].length - 1 - col) : col;
            rect(ctx, x + dx, y + row, 1, 1, color);
        }
    }
}

// ── Sprites (pixel art 16×16 ou menor) ────────────────────

// Chapeuzinho 16×20
const HOOD_PALETTE = {
    'K': P.black, 'S': P.skin, 'D': P.skinD,
    'R': P.cape,  'r': P.capeD, 'W': P.white,
    'w': P.whiteD,'B': P.brown, 'b': P.darkBrown,
    'H': '#8b5e3c', // cabelo
};
const HOOD_IDLE = [
    "....RRRRRR....",
    "...RRRRRRRR...",
    "..RRSSSSSSRR..",
    "..RSSSSSSSSR..",
    "..RSSDDSSSRR..",  // olhos
    "..RSSSSSSRR...",
    "...RRRRRRR....",
    "....WWWWWW....",
    "...WWWWWWWW...",
    "...WWrWWWWW...",
    "..WWrrWWWWWW..",
    "..WrrrrrWWWW..",
    "...rrrrrrrr..",
    "....rrrrrr...",
    "....rr..rr...",
    "...BB....BB..",
];
const HOOD_RUN1 = [
    "....RRRRRR....",
    "...RRRRRRRR...",
    "..RRSSSSSSRR..",
    "..RSSSSSSSSR..",
    "..RSSDDSSSRR..",
    "..RSSSSSSRR...",
    "...RRRRRRR....",
    "....WWWWWW....",
    "...WWWWWWWW...",
    "...WWrWWWWW...",
    "..WWrrWWWWWW..",
    "..WrrrrrWWWW..",
    "...rrrrrrrr..",
    "....rrrrrr...",
    ".....rr.rr...",
    "....BB...BB..",
];
const HOOD_RUN2 = [
    "....RRRRRR....",
    "...RRRRRRRR...",
    "..RRSSSSSSRR..",
    "..RSSSSSSSSR..",
    "..RSSDDSSSRR..",
    "..RSSSSSSRR...",
    "...RRRRRRR....",
    "....WWWWWW....",
    "...WWWWWWWW...",
    "...WWrWWWWW...",
    "..WWrrWWWWWW..",
    "..WrrrrrWWWW..",
    "...rrrrrrrr..",
    "....rrrrrr...",
    "....BB.rr...",
    ".....B..BB..",
];
const HOOD_JUMP = [
    "....RRRRRR....",
    "...RRRRRRRR...",
    "..RRSSSSSSRR..",
    "..RSSSSSSSSR..",
    "..RSSDDSSSRR..",
    "..RSSSSSSRR...",
    "...RRRRRRR....",
    "....WWWWWW....",
    "...WWWWWWWW...",
    "...WWrWWWWW...",
    "..WWrrWWWWWW..",
    "..WrrrrrWWWW..",
    "...rrrrrrrr..",
    ".BB.rrrrrr.BB",
    "...........",
];

// Bola de fogo 6×6
const FIRE_PAL = { 'A': P.fire1, 'B': P.fire2, 'C': P.fire3, 'D': '#ffff88' };
const FIRE_SPR = [
    "..BB..",
    ".ABBA.",
    "AABBBA",
    "ACBBBA",
    ".CCBA.",
    "..CC..",
];
const FIRE_SPR2 = [
    "..CC..",
    ".CCBA.",
    "ABBBCA",
    "AABBBA",
    ".ABBA.",
    "..BB..",
];

// Monstro (vovó disfarçada) 18×22 — sombra com capa
const MONSTER_PAL = {
    'K': P.black, 'P': P.purple, 'p': P.purpleL, 'D': P.purpleD,
    'R': '#ff2244', 'G': '#44ff88', 'W': P.white, 'g': P.grayD,
    'E': '#ff0000', // olho vermelho brilhante
};
const MONSTER_IDLE = [
    "......PPPPPP......",
    ".....PPPPPPPP.....",
    "....PPPPPPPPPP....",
    "....PpppppppPP....",
    "....PpEKKEppPP....",
    "....PpppGpppPP....",
    ".....PppppppP.....",
    "......PPPPPP......",
    "...DDDPPPPDDDD....",
    "..DDDDppppDDDDD...",
    ".DDDDDppppDDDDDD..",
    "DDDDDDppppDDDDDDD.",
    "DDDDDppppppDDDDDD.",
    "DDDDppppppppDDDDD.",
    "...pppppppppp.....",
    "...pppppppppp.....",
    "...pp......pp.....",
    "...DD......DD.....",
];
const MONSTER_WALK1 = [
    "......PPPPPP......",
    ".....PPPPPPPP.....",
    "....PPPPPPPPPP....",
    "....PpppppppPP....",
    "....PpEKKEppPP....",
    "....PpppGpppPP....",
    ".....PppppppP.....",
    "......PPPPPP......",
    "...DDDPPPPDDDD....",
    "..DDDDppppDDDDD...",
    ".DDDDDppppDDDDDD..",
    "DDDDDDppppDDDDDDD.",
    "DDDDDppppppDDDDDD.",
    "DDDDppppppppDDDDD.",
    "..ppppppppppp.....",
    ".pppppppppppp.....",
    ".Dpp.......pp....",
    ".DD.........DD...",
];

// Vovó revelada 16×20
const GRANNY_PAL = {
    'K': P.black, 'S': P.skin, 'D': P.skinD, 'W': P.white,
    'w': P.whiteD,'G': P.granny,'g': P.grannyD,'L': P.grannyL,
    'H': '#c8c8c8', // cabelo branco
    'R': P.red,
};
const GRANNY_SPR = [
    "....HHHHHH....",
    "...HHHHHHHH...",
    "..HHSSSSSSSH..",
    "..HSSSSSSSSH..",
    "..HSSDDSSSH...",
    "..HSSS_SSSH...",  // boca surpresa
    "...HHHHHH.....",
    "....GGGGGG....",
    "...GGGGGGGG...",
    "...GGWGGGGG...",
    "..GGWwGGGGGG..",
    "..GgggggGGGG..",
    "...gggggggg...",
    "....gggggg....",
    "....gg..gg....",
    "...GG....GG...",
];

// Árvore pixel (24×36)
function drawTree(ctx, x, y, variant=0) {
    // tronco
    rect(ctx, x+9, y+22, 6, 14, P.brown);
    rect(ctx, x+10, y+23, 4, 12, P.tan);
    // copa camadas
    const cols = variant===0 ? [P.leafD, P.leaf, P.leafL] : [P.treeD, P.greenD, P.green];
    rect(ctx, x+4,  y+14, 16, 10, cols[0]);
    rect(ctx, x+2,  y+8,  20, 10, cols[1]);
    rect(ctx, x+5,  y+2,  14, 10, cols[2]);
    rect(ctx, x+7,  y,    10,  6, cols[1]);
    // detalhes claros
    rect(ctx, x+7,  y+4,  4,  2, P.leafL);
    rect(ctx, x+5,  y+10, 5,  2, P.leafL);
}

// Cogumelo obstáculo (10×12)
function drawMushroom(ctx, x, y) {
    rect(ctx, x+2, y+7,  6, 5, P.mushW);
    rect(ctx, x+1, y+8,  8, 3, P.mushW);
    rect(ctx, x,   y+2, 10, 7, P.mush);
    rect(ctx, x+1, y+1,  8, 3, P.mush);
    rect(ctx, x+3, y,    4, 3, P.mushL);
    rect(ctx, x+2, y+3,  2, 2, P.mushW);
    rect(ctx, x+6, y+4,  2, 2, P.mushW);
}

// Pedra (12×8)
function drawRock(ctx, x, y) {
    rect(ctx, x+2, y+4,  8, 4, P.grayD);
    rect(ctx, x+1, y+2, 10, 5, P.gray);
    rect(ctx, x,   y+3, 12, 3, P.gray);
    rect(ctx, x+2, y+2,  3, 2, P.white);
}

// Moeda 8×8
function drawCoin(ctx, x, y, frame) {
    const w = frame < 2 ? 6 : (frame < 3 ? 3 : 1);
    const ox = (6 - w) / 2;
    rect(ctx, x+ox+1, y+1, w, 6, P.coin);
    if(w > 2) rect(ctx, x+ox+2, y+2, Math.max(1,w-2), 2, P.coinL);
}

// Partícula fogo
function drawFireParticle(ctx, x, y, life) {
    const colors = [P.fire3, P.fire1, P.fire2, P.fire2, P.fire3];
    const s = Math.max(1, Math.ceil(life/3));
    rect(ctx, x, y, s, s, colors[Math.min(4, Math.floor((1-life/15)*5))]);
}

// ── Estado do jogo ─────────────────────────────────────────

const GRAVITY    = 0.32;
const JUMP_VEL   = -6.5;
const PLAYER_SPD = 1.8;
const SCROLL_SPD = 1.4;
const GROUND_Y   = 200;

let screen = "menu";
let tick   = 0;
let keys   = {};

// Player
let player, fireballs, particles;
// Mundo
let camX, worldObjs, bgLayers, groundTiles;
// Monstro
let monster;
// Jogo
let lives, score, coins, distance, phase, gameMessage, msgTimer;
// Cutscene
let cutTick, cutStep;
// GameOver
let goTick;

// ── Áudio simples ─────────────────────────────────────────
let audioCtx = null;
function getAC() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function beep(freq, type, vol, dur, delay=0) {
    try {
        const ac=getAC(), o=ac.createOscillator(), g=ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type=type; o.frequency.value=freq;
        g.gain.setValueAtTime(vol, ac.currentTime+delay);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+delay+dur);
        o.start(ac.currentTime+delay); o.stop(ac.currentTime+delay+dur);
    } catch(e){}
}
function sfx(name) {
    switch(name) {
        case 'jump':  beep(320,'sine',0.12,0.1); beep(480,'sine',0.08,0.08,0.05); break;
        case 'fire':  beep(440,'sawtooth',0.08,0.06); beep(660,'sine',0.06,0.06,0.03); break;
        case 'hit':   beep(150,'sawtooth',0.15,0.2); beep(100,'sawtooth',0.1,0.2,0.1); break;
        case 'coin':  beep(880,'sine',0.1,0.08); beep(1100,'sine',0.08,0.08,0.06); break;
        case 'die':   [300,250,200,150].forEach((f,i)=>beep(f,'sawtooth',0.18,0.18,i*0.15)); break;
        case 'reveal':[220,277,330,440,554,659].forEach((f,i)=>beep(f,'sine',0.18,0.22,i*0.1)); break;
        case 'start': beep(440,'sine',0.1,0.12); beep(550,'sine',0.1,0.12,0.1); beep(660,'sine',0.14,0.18,0.2); break;
    }
}

// Música de fundo — loop simples em intervalos
let bgMusicInt = null;
const bgNotes = [220,247,262,220,196,220,247,262,294,262,247,220];
let bgNoteIdx = 0;
function startBGMusic() {
    stopBGMusic();
    bgMusicInt = setInterval(()=>{
        try {
            const ac=getAC(), o=ac.createOscillator(), g=ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type='triangle';
            o.frequency.value=bgNotes[bgNoteIdx % bgNotes.length];
            bgNoteIdx++;
            g.gain.setValueAtTime(0.04,ac.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.22);
            o.start(); o.stop(ac.currentTime+0.25);
        } catch(e){}
    }, 300);
}
function stopBGMusic() {
    if (bgMusicInt) { clearInterval(bgMusicInt); bgMusicInt=null; }
}

// ── Init ──────────────────────────────────────────────────

function initGame() {
    player = {
        x: 40, y: GROUND_Y - 16, vy: 0,
        onGround: false, facing: 1,
        frame: 0, frameTick: 0,
        invincible: 0, hitFlash: 0,
        dead: false,
    };
    fireballs  = [];
    particles  = [];
    camX       = 0;
    lives      = 3;
    score      = 0;
    coins      = 0;
    distance   = 0;
    phase      = 1;  // 1=floresta, 2=floresta noite, 3=boss
    gameMessage = null;
    msgTimer    = 0;

    // Gerar objetos do mundo
    worldObjs  = generateWorld();
    bgLayers   = generateBG();

    // Monstro começa longe
    monster = {
        x: 360, y: GROUND_Y - 18, vy: 0,
        frame: 0, frameTick: 0,
        speed: 0.9, visible: false, hp: 20,
        showWarning: false, warningTick: 0,
        revealed: false,
    };

    sfx('start');
    startBGMusic();
}

function generateWorld() {
    const objs = [];
    // Plataformas, obstáculos e moedas ao longo de 3000px
    for (let i = 0; i < 80; i++) {
        const x = 200 + i * 38 + Math.random() * 20;
        const type = Math.random();
        if (type < 0.25) {
            objs.push({ type:'mush', x, y: GROUND_Y - 12, w:10, h:12, alive:true });
        } else if (type < 0.45) {
            objs.push({ type:'rock', x, y: GROUND_Y - 8,  w:12, h:8,  alive:true });
        } else if (type < 0.7) {
            objs.push({ type:'coin', x: x+2, y: GROUND_Y - 28, w:8, h:8, alive:true, frame:0, ftick:0 });
        } else if (type < 0.85) {
            // plataforma flutuante com moeda
            const py = GROUND_Y - 40 - Math.random()*30;
            objs.push({ type:'platform', x, y:py, w:28, h:6, alive:true });
            objs.push({ type:'coin', x:x+10, y:py-12, w:8, h:8, alive:true, frame:0, ftick:0 });
        }
    }
    return objs;
}

function generateBG() {
    // camadas parallax: árvores fundo, árvores meio, neblina
    const trees = [];
    for (let i = 0; i < 60; i++) {
        trees.push({
            x:    i * 55 + Math.random()*30,
            layer: Math.random() < 0.5 ? 0 : 1,
            variant: Math.floor(Math.random()*2),
        });
    }
    return trees;
}

// ── Canvases ──────────────────────────────────────────────

const menuCV    = document.getElementById('menuCanvas');
const gameCV    = document.getElementById('gameCanvas');
const cutCV     = document.getElementById('cutsceneCanvas');
const goCV      = document.getElementById('gameoverCanvas');
const mCtx      = menuCV.getContext('2d');
const gCtx      = gameCV.getContext('2d');
const cCtx      = cutCV.getContext('2d');
const oCtx      = goCV.getContext('2d');

const W = 320, H = 240;

// ── Telas ─────────────────────────────────────────────────

function showScreen(name) {
    screen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name).classList.add('active');
}

// ── MENU ─────────────────────────────────────────────────

let menuTick = 0;
let menuStars = [];
for (let i=0;i<40;i++) menuStars.push({x:Math.random()*W,y:Math.random()*H,b:Math.random()});

function drawMenu() {
    const ctx = mCtx;
    menuTick++;

    // céu noturno
    ctx.fillStyle = P.sky;
    ctx.fillRect(0, 0, W, H);

    // estrelas
    menuStars.forEach(s => {
        const bri = 0.3 + 0.7*Math.abs(Math.sin(menuTick*0.04 + s.b*10));
        ctx.fillStyle = `rgba(240,235,200,${bri})`;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    });

    // lua
    rect(ctx, 260, 18, 22, 22, P.moon);
    rect(ctx, 262, 19, 18, 18, P.moonG);
    rect(ctx, 265, 21,  8,  4, P.moon);

    // neblina fundo
    ctx.fillStyle = 'rgba(20,8,40,0.5)';
    ctx.fillRect(0, 140, W, 100);

    // árvores fundo
    for (let i=0;i<6;i++) drawTree(ctx, i*56-8, 90, 1);

    // chão
    rect(ctx, 0, 210, W, 30, P.groundD);
    rect(ctx, 0, 210, W,  6, P.ground);
    rect(ctx, 0, 210, W,  2, P.groundL);

    // árvores frente
    drawTree(ctx, -4,  140, 0);
    drawTree(ctx, 280, 138, 0);
    drawTree(ctx, 130, 148, 1);

    // Chapeuzinho parada no centro
    const bounce = Math.sin(menuTick*0.05)*1;
    drawSprite(ctx, HOOD_IDLE, 148, 192 + bounce, HOOD_PALETTE);

    // Monstro assombrando ao fundo com opacidade
    ctx.globalAlpha = 0.25 + 0.1*Math.sin(menuTick*0.03);
    drawSprite(ctx, MONSTER_IDLE, 240, 182, MONSTER_PAL);
    ctx.globalAlpha = 1;

    // Título pixelado
    drawPixelText(ctx, "O SEGREDO", 64, 38, 3, '#ffcc44');
    drawPixelText(ctx, "DA FLORESTA", 44, 62, 3, '#ff8822');

    // subtítulo
    drawPixelText(ctx, "UM CONTO SOMBRIO", 48, 96, 1, '#aa8844');

    // botão jogar piscando
    const blink = Math.sin(menuTick*0.08) > 0;
    if (blink) {
        rect(ctx, 100, 118, 120, 18, P.darkBrown);
        rect(ctx, 101, 119, 118, 16, P.brown);
        drawPixelText(ctx, "[ JOGAR ]", 110, 123, 1, '#ffdd88');
    }

    // instrução
    drawPixelText(ctx, "SPACE / ENTER / TOQUE", 48, 146, 1, '#666644');
    drawPixelText(ctx, "SETAS: MOVER  Z: FOGO", 48, 158, 1, '#555533');

    // créditos
    drawPixelText(ctx, "- O SEGREDO DA FLORESTA -", 42, 226, 1, '#443322');
}

// ── TEXTO PIXEL ───────────────────────────────────────────
// Fonte 3×5 básica para letras maiúsculas
const FONT = {
    'A':["010","101","111","101","101"],
    'B':["110","101","110","101","110"],
    'C':["011","100","100","100","011"],
    'D':["110","101","101","101","110"],
    'E':["111","100","110","100","111"],
    'F':["111","100","110","100","100"],
    'G':["011","100","101","101","011"],
    'H':["101","101","111","101","101"],
    'I':["111","010","010","010","111"],
    'J':["111","010","010","110","011"],
    'K':["101","110","100","110","101"],
    'L':["100","100","100","100","111"],
    'M':["101","111","111","101","101"],
    'N':["101","111","111","111","101"],
    'O':["010","101","101","101","010"],
    'P':["110","101","110","100","100"],
    'Q':["010","101","101","111","011"],
    'R':["110","101","110","110","101"],
    'S':["011","100","010","001","110"],
    'T':["111","010","010","010","010"],
    'U':["101","101","101","101","010"],
    'V':["101","101","101","010","010"],
    'W':["101","101","111","111","101"],
    'X':["101","010","010","010","101"],
    'Y':["101","101","010","010","010"],
    'Z':["111","001","010","100","111"],
    '0':["010","101","101","101","010"],
    '1':["010","110","010","010","111"],
    '2':["110","001","010","100","111"],
    '3':["111","001","011","001","111"],
    '4':["101","101","111","001","001"],
    '5':["111","100","110","001","110"],
    '6':["011","100","110","101","010"],
    '7':["111","001","010","010","010"],
    '8':["010","101","010","101","010"],
    '9':["010","101","011","001","110"],
    ':':["0","1","0","1","0"],
    '-':["000","000","111","000","000"],
    '!':["010","010","010","000","010"],
    '/':["001","001","010","100","100"],
    '[':["011","010","010","010","011"],
    ']':["110","010","010","010","110"],
    ' ':["000","000","000","000","000"],
    '.':["0","0","0","0","1"],
    '_':["000","000","000","000","111"],
};
function drawPixelText(ctx, text, x, y, scale=1, color='#ffffff') {
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of text.toUpperCase()) {
        const glyph = FONT[ch] || FONT[' '];
        for (let row=0;row<glyph.length;row++) {
            for (let col=0;col<glyph[row].length;col++) {
                if (glyph[row][col]==='1') {
                    ctx.fillRect(cx+col*scale, y+row*scale, scale, scale);
                }
            }
        }
        cx += (glyph[0].length + 1) * scale;
    }
}

// ── JOGO PRINCIPAL ────────────────────────────────────────

function updateGame() {
    if (player.dead) return;
    tick++;

    // ─── Player movimento ───
    let moving = false;
    if (keys['ArrowLeft'] || keys['a'] || keys['btnLeft']) {
        player.x -= PLAYER_SPD; player.facing = -1; moving = true;
        if (player.x < 30) player.x = 30;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['btnRight']) {
        player.x += PLAYER_SPD; player.facing = 1; moving = true;
        // câmera acompanha
        if (player.x > 120) { camX += PLAYER_SPD; distance += PLAYER_SPD; }
    } else {
        // scroll automático leve
        camX += SCROLL_SPD * 0.5;
        distance += SCROLL_SPD * 0.5;
    }

    // Pulo
    if ((keys['ArrowUp'] || keys[' '] || keys['w'] || keys['btnJump']) && player.onGround) {
        player.vy = JUMP_VEL; player.onGround = false; sfx('jump');
        keys['ArrowUp'] = false; keys[' '] = false; keys['btnJump'] = false;
    }

    // Tiro
    if ((keys['z'] || keys['Z'] || keys['btnFire']) && tick % 18 === 0) {
        fireballs.push({ x: player.x + 8, y: player.y + 6, vx: 3.5 * player.facing, vy: 0, frame:0, ftick:0 });
        sfx('fire');
        keys['btnFire'] = false;
    }

    // Física
    player.vy += GRAVITY;
    player.y  += player.vy;

    // Chão
    if (player.y >= GROUND_Y - 16) {
        player.y = GROUND_Y - 16; player.vy = 0; player.onGround = true;
    }

    // Plataformas
    player.onGround = player.y >= GROUND_Y - 16;
    worldObjs.filter(o=>o.type==='platform'&&o.alive).forEach(p=>{
        const wx = p.x - camX;
        if (player.x + 12 > wx && player.x < wx + p.w &&
            player.y + 16 >= p.y && player.y + 14 < p.y && player.vy > 0) {
            player.y = p.y - 16; player.vy = 0; player.onGround = true;
        }
    });

    // Animação player
    player.frameTick++;
    if (moving && player.onGround) {
        if (player.frameTick > 10) { player.frame = (player.frame+1)%2; player.frameTick=0; }
    } else if (!player.onGround) {
        player.frame = 3; // pulo
    } else {
        player.frame = 0;
    }

    if (player.invincible > 0) player.invincible--;
    if (player.hitFlash > 0)   player.hitFlash--;

    // ─── Fireballs ───
    fireballs.forEach(fb => {
        fb.x += fb.vx; fb.y += fb.vy; fb.vy += GRAVITY * 0.3;
        fb.ftick++; if (fb.ftick>4){fb.frame=(fb.frame+1)%2;fb.ftick=0;}
        // Partículas
        for(let i=0;i<2;i++) particles.push({
            x: fb.x+2+Math.random()*2, y: fb.y+2+Math.random()*2,
            vx:(Math.random()-0.5)*1, vy:-0.5-Math.random(),
            life: 8+Math.random()*8, type:'fire',
        });
    });
    fireballs = fireballs.filter(fb => fb.x - camX > -10 && fb.x - camX < W+10 && fb.y < H);

    // ─── Partículas ───
    particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.life--; });
    particles = particles.filter(p => p.life > 0);

    // ─── Objetos do mundo ───
    worldObjs.forEach(obj => {
        if (!obj.alive) return;
        const wx = obj.x - camX;
        if (wx < -20 || wx > W+20) return;

        // Coleta de moeda
        if (obj.type==='coin') {
            obj.ftick++; if(obj.ftick>8){obj.frame=(obj.frame+1)%4;obj.ftick=0;}
            if (player.x+12 > wx && player.x < wx+8 &&
                player.y+14 > obj.y && player.y < obj.y+8) {
                obj.alive=false; coins++; score+=10; sfx('coin');
                for(let i=0;i<8;i++) particles.push({
                    x:wx+4,y:obj.y+4,vx:(Math.random()-0.5)*3,vy:-1-Math.random()*2,
                    life:12,type:'coin',
                });
            }
        }

        // Colisão obstáculo
        if ((obj.type==='mush'||obj.type==='rock') && player.invincible===0) {
            if (player.x+10 > wx && player.x+2 < wx+obj.w &&
                player.y+14 > obj.y && player.y+2 < obj.y+obj.h) {
                hitPlayer();
            }
        }

        // Firebola acerta obstáculo
        if (obj.type==='mush') {
            fireballs.forEach(fb => {
                if (fb.x > obj.x-2 && fb.x < obj.x+obj.w+2 &&
                    fb.y > obj.y-2 && fb.y < obj.y+obj.h+2) {
                    obj.alive=false; score+=5;
                    for(let i=0;i<6;i++) particles.push({
                        x:wx+5,y:obj.y,vx:(Math.random()-0.5)*2,vy:-1-Math.random()*2,
                        life:10,type:'fire',
                    });
                }
            });
        }
    });

    // ─── Monstro ───
    // Aparece quando distance > 600
    if (distance > 400 && !monster.visible) {
        monster.visible = true;
        monster.x = camX + W + 20;
        monster.showWarning = true;
        monster.warningTick = 120;
    }

    if (monster.visible) {
        monster.warningTick = Math.max(0, monster.warningTick-1);
        monster.showWarning = monster.warningTick > 0 && Math.floor(monster.warningTick/10)%2===0;

        // Persegue o player
        const tx = camX + player.x;
        if (monster.x < tx - 80) monster.x += monster.speed;
        if (monster.x > tx - 60) monster.x -= monster.speed * 0.5;

        // Firebolas acertam monstro
        fireballs.forEach(fb => {
            const mx = monster.x - camX;
            if (fb.x > monster.x-8 && fb.x < monster.x+18 &&
                fb.y > monster.y-4 && fb.y < monster.y+18) {
                monster.hp = Math.max(0, monster.hp-1);
                fb.x = -999;
                score += 15;
                for(let i=0;i<10;i++) particles.push({
                    x:mx+9,y:monster.y+8,vx:(Math.random()-0.5)*3,vy:-1-Math.random()*2,
                    life:12,type:'fire',
                });
                if(monster.hp===0) triggerReveal();
            }
        });

        // Animação monstro
        monster.frameTick++;
        if (monster.frameTick > 14) { monster.frame = (monster.frame+1)%2; monster.frameTick=0; }

        // Atinge player
        const mx = monster.x - camX;
        if (player.invincible===0 && Math.abs(player.x - mx) < 14 && Math.abs(player.y - monster.y) < 16) {
            hitPlayer();
        }

        // Velocidade aumenta com a distância
        monster.speed = 0.9 + distance/3000;
    }

    // Fase 2 (floresta noturna) — após distância 800
    if (distance > 800 && phase < 2) { phase = 2; setMsg("A NOITE CAI...", 120); }
    // Boss phase
    if (distance > 1600 && phase < 3) { phase = 3; setMsg("ELE SE APROXIMA!", 120); }

    // Score por distância
    if (tick % 60 === 0) score += 2;
}

function hitPlayer() {
    if (player.invincible > 0) return;
    lives--;
    player.invincible = 90;
    player.hitFlash   = 20;
    sfx('hit');
    for(let i=0;i<16;i++) particles.push({
        x:player.x+8,y:player.y+8,
        vx:(Math.random()-0.5)*4,vy:-2-Math.random()*2,
        life:16,type:'hit',
    });
    if (lives <= 0) { player.dead=true; sfx('die'); stopBGMusic(); setTimeout(()=>showScreen('gameover'),1200); }
}

function setMsg(txt, dur) { gameMessage=txt; msgTimer=dur; }

function triggerReveal() {
    stopBGMusic();
    sfx('reveal');
    monster.revealed = true;
    setTimeout(()=>{ showScreen('cutscene'); initCutscene(); }, 800);
}

function drawGame() {
    const ctx = gCtx;

    // Fundo — cor muda por fase
    const bgCol = phase >= 2 ? P.sky : '#1e2a10';
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, W, H);

    // Estrelas (fase 2+)
    if (phase >= 2) {
        menuStars.forEach(s => {
            const bri = 0.2 + 0.6*Math.abs(Math.sin(tick*0.03+s.b*8));
            ctx.fillStyle = `rgba(240,235,200,${bri})`;
            ctx.fillRect(Math.round(s.x),Math.round(s.y),1,1);
        });
        rect(ctx, 260, 12, 18, 18, P.moon);
    }

    // Parallax árvores fundo (layer 0 — lento)
    bgLayers.filter(t=>t.layer===0).forEach(t => {
        const tx = t.x - camX * 0.2;
        const sx = ((tx % (W+80)) + W+80) % (W+80) - 40;
        ctx.globalAlpha = 0.45;
        drawTree(ctx, sx, 120, t.variant);
        ctx.globalAlpha = 1;
    });

    // Neblina fundo
    if (phase >= 2) {
        ctx.fillStyle = 'rgba(10,5,25,0.3)';
        ctx.fillRect(0, 120, W, 80);
    }

    // Árvores frente (layer 1 — rápido)
    bgLayers.filter(t=>t.layer===1).forEach(t => {
        const tx = t.x - camX * 0.7;
        const sx = ((tx % (W+80)) + W+80) % (W+80) - 40;
        drawTree(ctx, sx, 148, t.variant);
    });

    // Chão
    rect(ctx, 0, GROUND_Y, W, H - GROUND_Y, P.groundD);
    rect(ctx, 0, GROUND_Y, W, 5, P.ground);
    rect(ctx, 0, GROUND_Y, W, 2, P.groundL);

    // Detalhes chão — grama
    for (let i=0;i<W;i+=8) {
        const h = 2 + Math.abs(Math.sin(i*0.3+camX*0.01))*2;
        rect(ctx, i, GROUND_Y-h, 1, h, P.greenL);
    }

    // Objetos do mundo
    worldObjs.forEach(obj => {
        if (!obj.alive) return;
        const wx = obj.x - camX;
        if (wx < -20 || wx > W+20) return;
        if (obj.type==='mush')     drawMushroom(ctx, wx, obj.y);
        if (obj.type==='rock')     drawRock(ctx, wx, obj.y);
        if (obj.type==='coin')     drawCoin(ctx, wx, obj.y, obj.frame);
        if (obj.type==='platform') {
            rect(ctx, wx, obj.y,   obj.w, obj.h,   P.groundD);
            rect(ctx, wx, obj.y,   obj.w, 2,        P.ground);
            rect(ctx, wx, obj.y,   obj.w, 1,        P.groundL);
        }
    });

    // Partículas
    particles.forEach(p => {
        if (p.type==='fire')  drawFireParticle(ctx, p.x-camX+2, p.y, p.life);
        else if (p.type==='coin') { ctx.fillStyle=P.coin; ctx.fillRect(p.x,p.y,2,2); }
        else if (p.type==='hit')  { ctx.fillStyle=P.hp1;  ctx.fillRect(p.x,p.y,2,2); }
    });

    // Fireballs
    fireballs.forEach(fb => {
        const spr = fb.frame===0 ? FIRE_SPR : FIRE_SPR2;
        drawSprite(ctx, spr, fb.x-camX, fb.y, FIRE_PAL);
    });

    // Monstro
    if (monster.visible) {
        const mx = monster.x - camX;
        if (mx > -20 && mx < W+20) {
            ctx.globalAlpha = monster.revealed ? 0.4 : 1;
            const mspr = monster.frame===0 ? MONSTER_IDLE : MONSTER_WALK1;
            drawSprite(ctx, mspr, mx, monster.y, MONSTER_PAL);
            ctx.globalAlpha = 1;

            // HP bar do monstro
            if (!monster.revealed && monster.hp < 20) {
                const bx = mx+1, by = monster.y-8, bw = 16;
                rect(ctx, bx, by, bw, 3, '#331111');
                rect(ctx, bx, by, Math.round(bw*(monster.hp/20)), 3, P.hp1);
            }

            // Aviso de proximidade
            if (monster.showWarning) {
                drawPixelText(ctx, "!", mx+7, monster.y-14, 2, '#ff2244');
            }
        }
    }

    // Player (pisca quando invencível)
    const showPlayer = player.invincible === 0 || Math.floor(player.invincible/6)%2===0;
    if (showPlayer) {
        const sprites = [HOOD_IDLE, HOOD_RUN1, HOOD_RUN2, HOOD_JUMP];
        const spr = sprites[player.frame] || HOOD_IDLE;
        // flip horizontal se indo para esquerda
        if (player.facing === -1) {
            ctx.save();
            ctx.translate(player.x+14, 0);
            ctx.scale(-1,1);
            drawSprite(ctx, spr, 0, player.y, HOOD_PALETTE);
            ctx.restore();
        } else {
            drawSprite(ctx, spr, player.x, player.y, HOOD_PALETTE);
        }
    }

    // Flash de hit
    if (player.hitFlash > 0) {
        ctx.fillStyle = `rgba(255,0,50,${player.hitFlash/20*0.4})`;
        ctx.fillRect(0,0,W,H);
    }

    // HUD
    drawHUD(ctx);

    // Mensagem de fase
    if (msgTimer > 0) {
        msgTimer--;
        const a = Math.min(1, msgTimer/20, (gameMessage ? 1 : 0));
        ctx.fillStyle = `rgba(0,0,0,${a*0.5})`;
        ctx.fillRect(0, H/2-14, W, 22);
        drawPixelText(ctx, gameMessage||"", Math.floor((W-gameMessage.length*5)/2), H/2-8, 1, `rgba(255,220,100,${a})`);
    }

    // Neblina noturna fundo
    if (phase >= 2) {
        ctx.fillStyle = 'rgba(5,0,20,0.18)';
        ctx.fillRect(0,0,W,H);
    }
}

function drawHUD(ctx) {
    // Fundo HUD
    rect(ctx, 0, 0, W, 14, 'rgba(0,0,0,0.6)');

    // Vidas
    drawPixelText(ctx, "HP:", 3, 3, 1, '#ff8888');
    for (let i=0;i<lives;i++) {
        rect(ctx, 22+i*10, 3, 7, 7, P.hp1);
        rect(ctx, 23+i*10, 4, 2, 2, P.hp2);
    }

    // Score
    drawPixelText(ctx, "PT:" + String(score).padStart(5,'0'), 90, 3, 1, '#ffdd88');

    // Moedas
    rect(ctx, 184, 4, 5, 5, P.coin);
    rect(ctx, 185, 5, 2, 2, P.coinL);
    drawPixelText(ctx, "x" + String(coins).padStart(2,'0'), 191, 3, 1, '#ffdd44');

    // Distância
    drawPixelText(ctx, "DST:" + Math.floor(distance/10) + "M", 240, 3, 1, '#88cc88');
}

// ── CUTSCENE FINAL ────────────────────────────────────────

let cutScenes = [];
function initCutscene() {
    cutTick = 0; cutStep = 0;
    cutScenes = [
        { dur:180, text:["O MONSTRO CAI...", "QUEM SERA ELE?"] },
        { dur:200, text:["A CAPA SE RASGA...", "E REVELA..."] },
        { dur:240, text:["VOVO?!", "ERA ELA TODO ESSE TEMPO!"] },
        { dur:200, text:["VOCE SALVOU A FLORESTA,", "CHAPEUZINHO!"] },
        { dur:160, text:["FIM.", "OBRIGADA POR JOGAR!"] },
    ];
}

function updateCutscene() {
    cutTick++;
    if (cutScenes.length === 0) return;
    if (cutTick >= cutScenes[cutStep].dur) {
        cutTick = 0;
        cutStep++;
        if (cutStep >= cutScenes.length) {
            setTimeout(()=>showScreen('menu'), 500);
        }
    }
}

function drawCutscene() {
    const ctx = cCtx;
    if (cutStep >= cutScenes.length) return;
    const scene = cutScenes[cutStep];
    const prog  = cutTick / scene.dur;

    // Fundo floresta escura
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(0,0,W,H);

    // estrelas
    menuStars.forEach(s=>{
        ctx.fillStyle=`rgba(240,235,200,${0.2+0.5*Math.abs(Math.sin(cutTick*0.04+s.b*10))})`;
        ctx.fillRect(Math.round(s.x),Math.round(s.y),1,1);
    });

    // Árvores ao fundo
    ctx.globalAlpha=0.5;
    for(let i=0;i<6;i++) drawTree(ctx,i*56-8,90,1);
    ctx.globalAlpha=1;
    drawTree(ctx,-4,140,0); drawTree(ctx,280,138,0);

    // Chão
    rect(ctx,0,GROUND_Y,W,H-GROUND_Y,P.groundD);
    rect(ctx,0,GROUND_Y,W,2,P.groundL);

    // Chapeuzinho no lado esquerdo
    drawSprite(ctx, HOOD_IDLE, 40, GROUND_Y-16, HOOD_PALETTE);

    // Centro: monstro ou vovó
    if (cutStep < 2) {
        // monstro caindo/tremendo
        const shake = cutStep===0 ? Math.sin(cutTick*0.8)*3 : 0;
        drawSprite(ctx, MONSTER_IDLE, 150+shake, GROUND_Y-18, MONSTER_PAL);
    } else if (cutStep === 2) {
        // transição: monstro some, vovó aparece
        const alpha = Math.min(1, prog*2.5);
        ctx.globalAlpha = 1 - Math.min(1, prog*1.5);
        drawSprite(ctx, MONSTER_IDLE, 150, GROUND_Y-18, MONSTER_PAL);
        ctx.globalAlpha = alpha;
        drawSprite(ctx, GRANNY_SPR, 152, GROUND_Y-16, GRANNY_PAL);
        ctx.globalAlpha = 1;
        // efeito de luz
        const rg=ctx.createRadialGradient(160,GROUND_Y-8,0,160,GROUND_Y-8,50);
        rg.addColorStop(0,`rgba(255,200,100,${0.3*alpha})`);
        rg.addColorStop(1,'rgba(255,200,100,0)');
        ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    } else {
        // Vovó revelada
        drawSprite(ctx, GRANNY_SPR, 152, GROUND_Y-16, GRANNY_PAL);
        // Partículas de estrelinhas ao redor da vovó
        for(let i=0;i<6;i++){
            const a = cutTick*0.1+i*Math.PI/3;
            const sx = 160+Math.cos(a)*24, sy = GROUND_Y-20+Math.sin(a)*12;
            const c = ['#ffdd00','#ffcc44','#ff8800'][i%3];
            ctx.fillStyle=c; ctx.fillRect(Math.round(sx),Math.round(sy),2,2);
        }
    }

    // Caixa de texto
    const fadeIn  = Math.min(1, cutTick/20);
    const fadeOut = cutTick > scene.dur-20 ? (scene.dur-cutTick)/20 : 1;
    const alpha   = fadeIn * fadeOut;
    ctx.fillStyle = `rgba(10,5,20,${alpha*0.82})`;
    ctx.fillRect(10, 188, W-20, 46);
    rect(ctx, 10, 188, W-20, 2, `rgba(100,60,20,${alpha})`);

    scene.text.forEach((line, i) => {
        const col = i===0 ? `rgba(255,220,100,${alpha})` : `rgba(200,180,140,${alpha})`;
        drawPixelText(ctx, line, 20, 196 + i*14, 1, col);
    });

    // Indicador de continua
    if (prog > 0.8 && Math.sin(cutTick*0.2)>0) {
        drawPixelText(ctx, "...", W-24, 224, 1, `rgba(150,120,80,${alpha})`);
    }
}

// ── GAME OVER ─────────────────────────────────────────────

function drawGameOver() {
    const ctx = oCtx;
    goTick = (goTick||0)+1;

    ctx.fillStyle = '#0a0208';
    ctx.fillRect(0,0,W,H);

    menuStars.forEach(s=>{
        ctx.fillStyle=`rgba(200,180,160,${0.15+0.3*Math.abs(Math.sin(goTick*0.04+s.b*8))})`;
        ctx.fillRect(Math.round(s.x),Math.round(s.y),1,1);
    });

    ctx.globalAlpha=0.3;
    for(let i=0;i<6;i++) drawTree(ctx,i*56-8,90,1);
    ctx.globalAlpha=1;
    rect(ctx,0,GROUND_Y,W,H-GROUND_Y,P.groundD);

    // Chapeuzinho caída
    ctx.globalAlpha=0.7;
    drawSprite(ctx, HOOD_IDLE, 150, GROUND_Y-16, HOOD_PALETTE);
    ctx.globalAlpha=1;

    const fade = Math.min(1, goTick/40);
    ctx.fillStyle=`rgba(0,0,0,${fade*0.5})`;
    ctx.fillRect(0,0,W,H);

    drawPixelText(ctx, "FIM DE JOGO", 84, 60, 2, `rgba(220,60,60,${fade})`);
    drawPixelText(ctx, "A FLORESTA VENCEU...", 40, 104, 1, `rgba(200,160,120,${fade})`);
    drawPixelText(ctx, "PONTOS: " + String(score).padStart(5,'0'), 70, 124, 1, `rgba(255,220,80,${fade})`);
    drawPixelText(ctx, "MOEDAS: " + String(coins).padStart(2,'0'), 70, 138, 1, `rgba(255,220,80,${fade})`);

    if (goTick > 80 && Math.sin(goTick*0.1)>0) {
        rect(ctx, 80, 162, 160, 20, 'rgba(40,15,5,0.8)');
        rect(ctx, 81, 163, 158, 18, 'rgba(80,30,10,0.8)');
        drawPixelText(ctx, "[ TENTAR NOVAMENTE ]", 84, 167, 1, `rgba(255,200,80,${fade})`);
    }
    if (goTick > 100 && Math.sin(goTick*0.08)>0) {
        drawPixelText(ctx, "[ MENU ]", 124, 192, 1, `rgba(180,140,80,${fade})`);
    }
}

// ── LOOP PRINCIPAL ────────────────────────────────────────

function loop() {
    requestAnimationFrame(loop);
    switch(screen) {
        case 'menu':
            drawMenu();
            break;
        case 'game':
            updateGame();
            drawGame();
            break;
        case 'cutscene':
            updateCutscene();
            drawCutscene();
            break;
        case 'gameover':
            drawGameOver();
            break;
    }
}

// ── INPUT ─────────────────────────────────────────────────

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Menu
    if (screen==='menu' && (e.key===' '||e.key==='Enter')) {
        initGame(); showScreen('game');
    }
    // GameOver
    if (screen==='gameover') {
        if (e.key===' '||e.key==='Enter') { goTick=0; initGame(); showScreen('game'); }
        if (e.key==='Escape') { goTick=0; showScreen('menu'); }
    }
    // Cutscene — pular
    if (screen==='cutscene' && (e.key===' '||e.key==='Enter')) {
        cutTick = (cutScenes[cutStep]||{dur:0}).dur;
    }
    e.preventDefault();
});

document.addEventListener('keyup', e => { keys[e.key] = false; });

// Touch / click
menuCV.addEventListener('click', () => {
    if (screen==='menu') { initGame(); showScreen('game'); }
});
goCV.addEventListener('click', () => {
    if (screen==='gameover') {
        if ((goTick||0)>80) { goTick=0; initGame(); showScreen('game'); }
        else { goTick=0; showScreen('menu'); }
    }
});
cutCV.addEventListener('click', () => {
    if (screen==='cutscene') cutTick=(cutScenes[cutStep]||{dur:0}).dur;
});

// Botões mobile
function holdKey(key, el) {
    el.addEventListener('touchstart', e=>{ keys[key]=true; e.preventDefault(); }, {passive:false});
    el.addEventListener('touchend',   e=>{ keys[key]=false; e.preventDefault(); }, {passive:false});
    el.addEventListener('mousedown',  ()=>keys[key]=true);
    el.addEventListener('mouseup',    ()=>keys[key]=false);
}
holdKey('btnLeft',  document.getElementById('btn-left'));
holdKey('btnRight', document.getElementById('btn-right'));
holdKey('btnJump',  document.getElementById('btn-jump'));
holdKey('btnFire',  document.getElementById('btn-fire'));

// Inicia o loop
loop();

})();
