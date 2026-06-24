/* ============================================================
   O SEGREDO DA FLORESTA — game.js  (v2 — bugfix)
   ============================================================ */
"use strict";

/* ========== CONSTANTES ========== */
const TILE       = 16;
const GRAVITY    = 0.45;
const JUMP_VEL   = -9.5;
const MOVE_SPEED = 3.2;

/* ========== UTILITÁRIOS ========== */
const $ = id => document.getElementById(id);
const rand    = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ========== PALETA ========== */
const PAL = {
  sky1:'#0d0f1a', sky2:'#1a1030',
  moon:'#d4d0c0', moonGlow:'#3a3060',
  tree1:'#0a2e1a', tree2:'#0d3d1f',
  ground:'#1a3d10', groundDk:'#0f2a0a',
  grass:'#2e7d1a', grassLt:'#3a9e20',
  capRed:'#cc2020', capDark:'#8b1010',
  skinLt:'#f8d4b0', skinDk:'#e0a070',
  dress:'#e8e0d0', dressDk:'#c8b8a0',
  basketBr:'#8b5a2b',
  fire1:'#ff8c00', fire2:'#ff4500', fire3:'#ffdd00',
  monGreen:'#1a6b1a', monDark:'#0d4a0d', monEye:'#ff2020',
  bossRed:'#8b0000', bossGold:'#d4a800',
  white:'#f0f0e8', black:'#000000',
  grey:'#4a4a5a', greyLt:'#8a8a9a',
  bark:'#3d2b0a', barkLt:'#5a3f12',
  leaf1:'#1a5c1a', leaf2:'#237723', leaf3:'#2ea82e',
  gold:'#f5c518', neonG:'#39ff14',
  red:'#e03030', redBr:'#ff5555',
};

const N = null;

/* ========== SPRITES ========== */
function makeChapSprite(frame) {
  const R=PAL.capRed,RD=PAL.capDark,S=PAL.skinLt,SK=PAL.skinDk,
        D=PAL.dress,DD=PAL.dressDk,B=PAL.basketBr;
  const legs = frame===0
    ? [[N,N,D,N,N,N,D,N],[N,N,D,N,N,N,D,N],[N,N,D,N,N,N,D,N]]
    : [[N,N,D,N,N,N,N,D],[N,N,N,D,N,N,N,D],[N,N,N,D,N,N,D,N]];
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
    ...legs,
    [N,N,SK,N,N,N,SK,N],
  ];
}
const CHAP_SPRITES = [makeChapSprite(0), makeChapSprite(1)];

function makeMonsterSprite(frame) {
  const G=PAL.monGreen,GD=PAL.monDark,E=PAL.monEye;
  const arms = frame===0
    ? [[G,N,N,N,N,G],[G,N,N,N,G,N]]
    : [[N,G,N,N,G,N],[N,G,N,G,N,N]];
  return [
    [N,GD,GD,GD,GD,N],
    [GD,G,G,G,G,GD],
    [GD,G,E,G,E,GD],
    [GD,G,G,G,G,GD],
    [GD,G,PAL.black,PAL.black,G,GD],
    [N,GD,G,G,GD,N],
    ...arms,
    [N,G,N,N,G,N],
    [N,G,N,N,G,N],
  ];
}

function makeBossSprite(phase) {
  const B=PAL.bossRed,BD='#500000',E=PAL.monEye,
        W=PAL.white,SK=PAL.skinLt,GR=PAL.grey;
  if (phase==='monster') {
    return [
      [N,BD,B,B,B,BD,N],
      [BD,B,B,B,B,B,BD],
      [BD,B,E,B,E,B,BD],
      [BD,B,B,B,B,B,BD],
      [BD,B,PAL.black,PAL.black,B,B,BD],
      [N,BD,B,B,BD,N,N],
      [BD,B,N,N,B,BD,N],
      [BD,B,N,N,N,B,BD],
      [N,B,N,N,N,B,N],
      [N,B,N,N,N,B,N],
    ];
  }
  return [
    [N,GR,GR,GR,GR,N],
    [GR,W,W,W,W,GR],
    [GR,W,PAL.black,W,PAL.black,GR],
    [GR,W,W,W,W,GR],
    [GR,W,SK,SK,W,GR],
    [N,GR,SK,SK,GR,N],
    [N,GR,W,W,GR,N],
    [GR,W,W,W,W,GR],
    [N,GR,N,N,GR,N],
    [N,SK,N,N,SK,N],
  ];
}

function makeFireball() {
  return [
    [N,PAL.fire3,N],
    [PAL.fire1,PAL.fire2,PAL.fire1],
    [N,PAL.fire3,N],
  ];
}
const FIREBALL_SP = makeFireball();

function drawSprite(ctx, sprite, x, y, flipX=false) {
  ctx.save();
  if (flipX) { ctx.scale(-1,1); x = -x - sprite[0].length; }
  sprite.forEach((row,ry) => row.forEach((col,rx) => {
    if (col) { ctx.fillStyle=col; ctx.fillRect(x+rx, y+ry, 1, 1); }
  }));
  ctx.restore();
}

function drawTree(ctx, x, y, w=5, h=10) {
  ctx.fillStyle = PAL.bark;
  ctx.fillRect(x + Math.floor(w/2)-1, y+h-4, 2, 4);
  const cols=[PAL.leaf1,PAL.leaf2,PAL.leaf3];
  for (let i=0;i<3;i++){
    ctx.fillStyle = cols[i%3];
    const tw = w - i*1.5;
    const tx = x + (w-tw)/2;
    ctx.fillRect(Math.round(tx), y+i*3, Math.round(tw), 3+(2-i));
  }
}

/* ========== GERENCIADOR DE TELAS ========== */
function showScreen(id) {
  ['menu-screen','game-screen','gameover-screen','reveal-screen'].forEach(s => {
    const el = $(s);
    if (el) { el.style.display='none'; el.classList.remove('active'); }
  });
  const t = $(id);
  if (t) { t.style.display='flex'; t.classList.add('active'); }
}

/* ========== INPUT ========== */
const Keys = { left:false, right:false, up:false, fire:false };
const KeyMap = {
  ArrowLeft:'left', KeyA:'left',
  ArrowRight:'right', KeyD:'right',
  ArrowUp:'up', KeyW:'up', Space:'up',
  KeyZ:'fire', KeyX:'fire',
};

function bindKeys() {
  document.addEventListener('keydown', e => {
    const k = KeyMap[e.code];
    if (k) { Keys[k]=true; e.preventDefault(); }
  });
  document.addEventListener('keyup', e => {
    const k = KeyMap[e.code];
    if (k) Keys[k]=false;
  });

  // Botões mobile — usa pointer events (funciona em touch E mouse)
  function bindMobileBtn(id, key) {
    const el = $(id);
    if (!el) return;
    const on  = () => { Keys[key]=true;  el.classList.add('pressed'); };
    const off = () => { Keys[key]=false; el.classList.remove('pressed'); };

    el.addEventListener('pointerdown',  on,  { passive:true });
    el.addEventListener('pointerup',    off, { passive:true });
    el.addEventListener('pointercancel',off, { passive:true });
    el.addEventListener('pointerleave', off, { passive:true });
  }

  bindMobileBtn('btn-left',  'left');
  bindMobileBtn('btn-right', 'right');
  bindMobileBtn('btn-jump',  'up');
  bindMobileBtn('btn-fire',  'fire');
}

/* ========== GERADOR DE FASE ========== */
function buildPhase(num) {
  const W=200, H=15;
  const pixW=W*TILE, pixH=H*TILE;

  const platforms = [
    { x:0, y:pixH-TILE*2, w:pixW, h:TILE*2 }
  ];
  for (let i=0; i<18+num*4; i++) {
    platforms.push({
      x: rand(2, W-6)*TILE,
      y: rand(5, H-4)*TILE,
      w: randInt(3,7)*TILE,
      h: TILE,
    });
  }

  const enemies = [];
  for (let i=0; i<4+num*3; i++) {
    enemies.push({
      x:rand(4,W-4)*TILE, y:pixH-TILE*3,
      vx:(Math.random()>0.5?1:-1)*rand(0.8,1.8+num*0.3),
      vy:0, w:14, h:14,
      hp:2+num, maxHp:2+num,
      frame:0, frameTimer:0, grounded:false, alive:true,
    });
  }

  const pickups = [];
  for (let i=0; i<12+num*2; i++) {
    pickups.push({
      x:rand(2,W-2)*TILE, y:rand(3,H-4)*TILE,
      collected:false,
      type:Math.random()>0.8?'heart':'star',
      bob:rand(0, Math.PI*2),
    });
  }

  const decos = [];
  for (let i=0; i<30; i++) {
    decos.push({ x:rand(0,W)*TILE, y:pixH-TILE*2, w:5, h:randInt(8,14) });
  }

  const names = ['FASE 1 — A FLORESTA','FASE 2 — O CAMINHO NEGRO','FASE 3 — O COVIL DA BESTA'];
  return { W, H, pixW, pixH, platforms, enemies, pickups, decos, name:names[num-1]||names[2], num };
}

function makeBoss(ph) {
  return {
    x:ph.pixW-TILE*6, y:ph.pixH-TILE*5,
    vx:-2.5, vy:0, w:22, h:24,
    hp:15, maxHp:15,
    grounded:false, alive:true,
    frame:0, frameTimer:0,
    attackTimer:0, jumpTimer:0,
    projectiles:[],
  };
}

/* ========== JOGO ========== */
const Game = {
  canvas:null, ctx:null, raf:null,
  state:'idle',
  lives:3, score:0, phaseNum:1,
  phase:null, boss:null, bossActive:false,
  player:null, camera:{ x:0 },
  fireballs:[], fireDelay:0,
  particles:[], damageFlash:0, phaseTransition:0,
  lastTime:0,

  /* ---------- START ---------- */
  start() {
    this.lives=3; this.score=0; this.phaseNum=1;
    this.loadPhase();
    showScreen('game-screen');
    // pequeno delay para garantir que a tela está visível antes do resize
    setTimeout(() => {
      this.resizeCanvas();
      if (this.raf) cancelAnimationFrame(this.raf);
      this.state='playing';
      this.lastTime=performance.now();
      const loop = ts => {
        const dt = Math.min((ts-this.lastTime)/16.67, 3);
        this.lastTime=ts;
        if (this.state==='playing') { this.update(dt); this.render(); }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }, 50);
  },

  loadPhase() {
    this.phase       = buildPhase(this.phaseNum);
    this.boss        = null;
    this.bossActive  = false;
    this.fireballs   = [];
    this.particles   = [];
    this.phaseTransition = 60;
    this.player = {
      x:TILE*2, y:this.phase.pixH-TILE*4,
      vx:0, vy:0, w:8, h:16,
      grounded:false, frame:0, frameTimer:0,
      facingLeft:false, invincible:0,
    };
    const pn = $('hud-phase-name');
    if (pn) pn.textContent = this.phase.name;
    this.updateHUD();
  },

  resizeCanvas() {
    const gs = $('game-screen');
    if (!gs || !this.phase) return;
    const hud = gs.querySelector('.hud');
    const mc  = gs.querySelector('.mobile-controls');
    const hudH = hud ? hud.offsetHeight : 36;
    const mcH  = mc  ? mc.offsetHeight  : 90;
    const availH = gs.clientHeight - hudH - mcH;
    const availW = gs.clientWidth;
    const logW=800, logH=this.phase.pixH;
    const ratio = Math.min(availW/logW, availH/logH, 1);
    const cw = Math.floor(logW*ratio);
    const ch = Math.floor(logH*ratio);
    const c = $('game-canvas');
    if (!c) return;
    c.style.width  = cw+'px';
    c.style.height = ch+'px';
    c.width=logW; c.height=logH;
    this.canvas=c;
    this.ctx=c.getContext('2d');
    this.ctx.imageSmoothingEnabled=false;
  },

  /* ---------- UPDATE ---------- */
  update(dt) {
    const ph=this.phase, pl=this.player;
    if (this.phaseTransition>0){ this.phaseTransition--; return; }

    // --- jogadora ---
    if (Keys.left)       { pl.vx=-MOVE_SPEED; pl.facingLeft=true;  }
    else if (Keys.right) { pl.vx= MOVE_SPEED; pl.facingLeft=false; }
    else pl.vx *= 0.7;

    if (Keys.up && pl.grounded) { pl.vy=JUMP_VEL; pl.grounded=false; }
    pl.vy = Math.min(pl.vy+GRAVITY, 14);
    pl.x += pl.vx; pl.y += pl.vy;
    pl.x = clamp(pl.x, 0, ph.pixW-pl.w);

    pl.frameTimer++;
    if (pl.frameTimer>=12){ pl.frameTimer=0; pl.frame=1-pl.frame; }
    if (pl.invincible>0) pl.invincible--;

    pl.grounded=false;
    ph.platforms.forEach(p => {
      if (!this.overlap(pl,p)) return;
      const ob=(pl.y+pl.h)-p.y, ot=(p.y+p.h)-pl.y,
            ol=(pl.x+pl.w)-p.x, or2=(p.x+p.w)-pl.x;
      const m=Math.min(ob,ot,ol,or2);
      if (m===ob && pl.vy>=0){ pl.y=p.y-pl.h; pl.vy=0; pl.grounded=true; }
      else if (m===ot && pl.vy<0){ pl.y=p.y+p.h; pl.vy=0; }
      else if (m===ol){ pl.x=p.x-pl.w; pl.vx=0; }
      else { pl.x=p.x+p.w; pl.vx=0; }
    });

    this.camera.x = clamp(pl.x-400+pl.w/2, 0, ph.pixW-800);

    // --- tiro ---
    this.fireDelay=Math.max(0,this.fireDelay-1);
    if (Keys.fire && this.fireDelay===0){
      this.fireDelay=18;
      this.fireballs.push({
        x:pl.x+(pl.facingLeft?-6:pl.w), y:pl.y+6,
        vx:pl.facingLeft?-6:6, vy:-0.5,
        alive:true, age:0,
      });
    }

    this.fireballs = this.fireballs.filter(f=>f.alive && f.age<80);
    this.fireballs.forEach(f=>{
      f.x+=f.vx; f.y+=f.vy; f.age++;
      ph.platforms.forEach(p=>{
        if (this.overlap({x:f.x,y:f.y,w:4,h:4},p)){
          f.alive=false; this.burst(f.x,f.y,PAL.fire1,5);
        }
      });
    });

    // --- inimigos ---
    ph.enemies.forEach(en=>{
      if (!en.alive) return;
      en.vy=Math.min(en.vy+GRAVITY,14);
      en.x+=en.vx; en.y+=en.vy; en.grounded=false;
      ph.platforms.forEach(p=>{
        if (this.overlap(en,p)){
          const ob=(en.y+en.h)-p.y;
          if (ob>0 && ob<20 && en.vy>=0){ en.y=p.y-en.h; en.vy=0; en.grounded=true; }
        }
      });
      if (en.x<=0 || en.x+en.w>=ph.pixW) en.vx*=-1;
      if (en.grounded){
        const ex=en.x+(en.vx>0?en.w+2:-2), ey=en.y+en.h+4;
        let ok=false;
        ph.platforms.forEach(p=>{ if(ex>=p.x&&ex<=p.x+p.w&&ey>=p.y&&ey<=p.y+p.h) ok=true; });
        if (!ok) en.vx*=-1;
      }
      en.frameTimer++; if(en.frameTimer>=16){en.frameTimer=0;en.frame=1-en.frame;}

      this.fireballs.forEach(f=>{
        if(!f.alive) return;
        if(this.overlap({x:f.x,y:f.y,w:4,h:4},en)){
          f.alive=false; en.hp--;
          this.burst(en.x+en.w/2,en.y+en.h/2,PAL.fire2,8);
          if(en.hp<=0){ en.alive=false; this.score+=100; this.burst(en.x,en.y,PAL.neonG,12); }
        }
      });
      if(pl.invincible===0 && this.overlap(pl,en)) this.hit();
    });

    // --- colecionáveis ---
    ph.pickups.forEach(pk=>{
      if(pk.collected) return;
      pk.bob+=0.05;
      const py=pk.y+Math.sin(pk.bob)*2;
      if(this.overlap(pl,{x:pk.x,y:py,w:8,h:8})){
        pk.collected=true;
        if(pk.type==='star'){ this.score+=50; this.burst(pk.x,pk.y,PAL.gold,6); }
        else { this.lives=Math.min(this.lives+1,5); this.updateHUD(); this.burst(pk.x,pk.y,PAL.redBr,8); }
      }
    });

    // --- boss ---
    if(!this.bossActive && pl.x>ph.pixW*0.85){
      this.boss=makeBoss(ph); this.bossActive=true;
    }
    if(this.bossActive && this.boss && this.boss.alive) this.updateBoss();

    // --- partículas ---
    this.particles=this.particles.filter(p=>p.life>0);
    this.particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life--; });

    if(pl.y>ph.pixH+50) this.hit(true);
    $('hud-score').textContent=this.score;
  },

  updateBoss(){
    const b=this.boss, pl=this.player, ph=this.phase;
    b.vy=Math.min(b.vy+GRAVITY*0.8,12);
    b.x+=b.vx; b.y+=b.vy; b.grounded=false;
    ph.platforms.forEach(p=>{
      if(this.overlap(b,p)){
        const ob=(b.y+b.h)-p.y;
        if(ob>0&&ob<20&&b.vy>=0){b.y=p.y-b.h;b.vy=0;b.grounded=true;}
      }
    });
    if(b.x<=ph.pixW*0.6||b.x+b.w>=ph.pixW-TILE) b.vx*=-1;
    b.jumpTimer++;
    if(b.grounded&&b.jumpTimer>80){b.vy=JUMP_VEL*0.9;b.grounded=false;b.jumpTimer=0;}
    b.frameTimer++; if(b.frameTimer>=14){b.frameTimer=0;b.frame=1-b.frame;}

    b.attackTimer++;
    const rate=b.hp<8?50:80;
    if(b.attackTimer>=rate){
      b.attackTimer=0;
      const dx=pl.x-b.x,dy=pl.y-b.y,len=Math.sqrt(dx*dx+dy*dy)||1,spd=3.5;
      b.projectiles.push({x:b.x+b.w/2,y:b.y+b.h/2,vx:(dx/len)*spd,vy:(dy/len)*spd,alive:true,age:0});
    }
    b.projectiles=b.projectiles.filter(p=>p.alive&&p.age<90);
    b.projectiles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.age++;
      if(pl.invincible===0&&this.overlap(pl,{x:p.x-3,y:p.y-3,w:6,h:6})){p.alive=false;this.hit();}
    });

    this.fireballs.forEach(f=>{
      if(!f.alive) return;
      if(this.overlap({x:f.x,y:f.y,w:5,h:5},b)){
        f.alive=false; b.hp--; this.burst(b.x+b.w/2,b.y,PAL.fire1,10); this.damageFlash=8;
        if(b.hp<=0){b.alive=false;this.score+=1000;this.triggerReveal();}
      }
    });
    if(pl.invincible===0&&this.overlap(pl,b)) this.hit();
  },

  hit(fell=false){
    this.lives--; this.updateHUD();
    this.player.invincible=90; this.player.vy=-6;
    this.damageFlash=20; this.burst(this.player.x,this.player.y,PAL.red,10);
    if(this.lives<=0){
      this.state='dead';
      setTimeout(()=>{ $('go-score').textContent=this.score; showScreen('gameover-screen'); },800);
    } else if(fell){
      this.player.x=TILE*2; this.player.y=this.phase.pixH-TILE*4; this.player.vy=0;
    }
  },

  burst(x,y,color,n){
    for(let i=0;i<n;i++) this.particles.push({x,y,vx:rand(-2.5,2.5),vy:rand(-3.5,-0.5),color,life:randInt(18,35)});
  },

  triggerReveal(){
    this.state='bosswin';
    $('final-score').textContent=this.score;
    showScreen('reveal-screen');
    const steps=['rv1','rv2','rv3','rv4'];
    let i=0;
    const next=()=>{
      if(i>0){ const prev=$(steps[i-1]); if(prev) prev.classList.add('hidden'); }
      if(i<steps.length){ const cur=$(steps[i]); if(cur) cur.classList.remove('hidden'); i++; if(i<steps.length) setTimeout(next,2800); }
    };
    setTimeout(next,300);
  },

  updateHUD(){
    const hl=$('hud-lives'), hs=$('hud-score');
    if(hl) hl.textContent=this.lives;
    if(hs) hs.textContent=this.score;
  },

  overlap(a,b){ return a.x<b.x+(b.w||TILE)&&a.x+(a.w||8)>b.x&&a.y<b.y+(b.h||TILE)&&a.y+(a.h||8)>b.y; },

  /* ---------- RENDER ---------- */
  render(){
    const ctx=this.ctx, ph=this.phase, pl=this.player;
    if(!ctx||!ph||!pl) return;
    const W=ctx.canvas.width, H=ctx.canvas.height;
    ctx.imageSmoothingEnabled=false;

    // céu
    const sg=ctx.createLinearGradient(0,0,0,H);
    sg.addColorStop(0,PAL.sky1); sg.addColorStop(1,PAL.sky2);
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);

    // lua
    ctx.fillStyle=PAL.moonGlow; ctx.beginPath(); ctx.arc(W*0.8,30,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=PAL.moon; ctx.beginPath(); ctx.arc(W*0.8,30,14,0,Math.PI*2); ctx.fill();

    // estrelas bg
    ctx.fillStyle=PAL.white;
    for(let si=0;si<40;si++) ctx.fillRect((si*97+13)%W,(si*53+7)%(H*0.6),1,1);

    ctx.save();
    ctx.translate(-this.camera.x,0);

    // árvores
    ph.decos.forEach(d=>{ if(d.x+80<this.camera.x||d.x>this.camera.x+W) return; drawTree(ctx,d.x,d.y-d.h+2,d.w,d.h); });

    // plataformas
    ph.platforms.forEach(p=>{
      if(p.x+p.w<this.camera.x||p.x>this.camera.x+W) return;
      ctx.fillStyle=PAL.groundDk; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle=PAL.ground;   ctx.fillRect(p.x,p.y+2,p.w,p.h-2);
      ctx.fillStyle=PAL.grass;    ctx.fillRect(p.x,p.y,p.w,2);
      ctx.fillStyle=PAL.grassLt;
      for(let gx=p.x;gx<p.x+p.w;gx+=4) ctx.fillRect(gx,p.y-1,2,2);
    });

    // colecionáveis
    ph.pickups.forEach(pk=>{
      if(pk.collected) return;
      const py=pk.y+Math.sin(pk.bob)*2;
      if(pk.type==='star'){
        ctx.fillStyle=PAL.gold; ctx.fillRect(pk.x+2,py,4,4);
        ctx.fillStyle='#fff'; ctx.fillRect(pk.x+3,py+1,2,2);
      } else {
        ctx.fillStyle='#ff5555';
        ctx.fillRect(pk.x+1,py+2,2,3); ctx.fillRect(pk.x+3,py,2,5); ctx.fillRect(pk.x+5,py+2,2,3);
      }
    });

    // inimigos
    ph.enemies.forEach(en=>{
      if(!en.alive||en.x+en.w<this.camera.x||en.x>this.camera.x+W) return;
      drawSprite(ctx,makeMonsterSprite(en.frame),Math.round(en.x),Math.round(en.y),en.vx>0);
      if(en.hp<en.maxHp){
        ctx.fillStyle='#300'; ctx.fillRect(en.x,en.y-3,en.w,2);
        ctx.fillStyle='#0f0'; ctx.fillRect(en.x,en.y-3,en.w*(en.hp/en.maxHp),2);
      }
    });

    // boss
    if(this.bossActive&&this.boss){
      const b=this.boss;
      drawSprite(ctx,makeBossSprite(b.alive?'monster':'granny'),Math.round(b.x),Math.round(b.y),b.vx>0);
      if(b.alive){
        const bw=50,bx=b.x+b.w/2-bw/2;
        ctx.fillStyle='#500'; ctx.fillRect(bx,b.y-6,bw,4);
        ctx.fillStyle='#f00'; ctx.fillRect(bx,b.y-6,bw*(b.hp/b.maxHp),4);
        ctx.fillStyle=PAL.white; ctx.textAlign='center';
        ctx.font='4px monospace'; ctx.fillText('???',b.x+b.w/2,b.y-9);
      }
      b.projectiles.forEach(p=>{
        if(!p.alive) return;
        ctx.fillStyle=PAL.bossRed; ctx.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,5,5);
        ctx.fillStyle=PAL.bossGold; ctx.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,3,3);
      });
    }

    // fireballs
    this.fireballs.forEach(f=>{ if(!f.alive) return; drawSprite(ctx,FIREBALL_SP,Math.round(f.x),Math.round(f.y)); });

    // partículas
    this.particles.forEach(p=>{
      ctx.globalAlpha=p.life/35; ctx.fillStyle=p.color;
      ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2);
    });
    ctx.globalAlpha=1;

    // jogadora
    const blink=pl.invincible>0&&Math.floor(pl.invincible/5)%2===0;
    if(!blink) drawSprite(ctx,CHAP_SPRITES[pl.frame],Math.round(pl.x-2),Math.round(pl.y-2),pl.facingLeft);

    ctx.restore();

    if(this.damageFlash>0){
      ctx.fillStyle=`rgba(255,0,0,${this.damageFlash/20*0.4})`;
      ctx.fillRect(0,0,W,H); this.damageFlash--;
    }
    if(this.phaseTransition>0){
      ctx.fillStyle=`rgba(0,0,0,${this.phaseTransition/60})`;
      ctx.fillRect(0,0,W,H);
    }
    if(this.bossActive&&this.boss&&this.boss.alive){
      ctx.fillStyle='#f00'; ctx.font='5px monospace'; ctx.textAlign='center';
      ctx.fillText('⚠ CHEFE À FRENTE ⚠',W/2,20);
    }
    if(!this.bossActive){
      const prog=Math.floor((pl.x/ph.pixW)*100);
      ctx.fillStyle=PAL.neonG; ctx.font='5px monospace'; ctx.textAlign='left';
      ctx.fillText(`→ ${prog}%`,8,H-6);
    }
  },
};

/* ========== MENU ========== */
function initMenu(){
  // estrelas
  const starsEl=$('stars');
  if(starsEl){
    starsEl.innerHTML='';
    for(let i=0;i<80;i++){
      const s=document.createElement('div');
      s.className='star';
      s.style.cssText=`left:${rand(0,100)}%;top:${rand(0,100)}%;--d:${rand(1.5,5)}s;--o:${rand(0.3,0.9)};`;
      starsEl.appendChild(s);
    }
  }

  // preview da chapeuzinho no menu
  const mc=$('menu-char-canvas');
  if(mc){
    const mctx=mc.getContext('2d');
    mctx.imageSmoothingEnabled=false;
    let mframe=0, mft=0;
    const menuLoop=()=>{
      mctx.clearRect(0,0,48,48);
      const sp=CHAP_SPRITES[mframe];
      mctx.save(); mctx.scale(48/sp[0].length,48/sp.length);
      sp.forEach((row,ry)=>row.forEach((col,rx)=>{ if(col){mctx.fillStyle=col;mctx.fillRect(rx,ry,1,1);} }));
      mctx.restore();
      mft++; if(mft%30===0) mframe=1-mframe;
      requestAnimationFrame(menuLoop);
    };
    menuLoop();
  }

  // controles toggle
  const ctrlBtn=$('btn-controls'), ctrlPanel=document.querySelector('.controls-panel');
  if(ctrlBtn&&ctrlPanel) ctrlBtn.onclick=()=>ctrlPanel.classList.toggle('hidden');
}

/* ========== BOOT ========== */
// Garante que tudo roda após o DOM estar pronto
function boot(){
  bindKeys();
  initMenu();

  // Botão JOGAR
  const btnPlay=$('btn-play');
  if(btnPlay) btnPlay.onclick=()=>Game.start();

  // Botões de game over / revelação
  const btnRestart=$('btn-restart');
  if(btnRestart) btnRestart.onclick=()=>Game.start();

  const btnMenuGo=$('btn-menu-go');
  if(btnMenuGo) btnMenuGo.onclick=()=>showScreen('menu-screen');

  const btnMenuWin=$('btn-menu-win');
  if(btnMenuWin) btnMenuWin.onclick=()=>showScreen('menu-screen');

  window.addEventListener('resize',()=>{ if(Game.canvas&&Game.phase) Game.resizeCanvas(); });

  showScreen('menu-screen');
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
