/* ============================================================
   O SEGREDO DA FLORESTA — game.js  (v2 — fix botões)
   ============================================================ */
"use strict";

const TILE       = 16;
const GRAVITY    = 0.45;
const JUMP_VEL   = -9.5;
const MOVE_SPEED = 3.2;

const $      = id => document.getElementById(id);
const rand   = (a, b) => Math.random() * (b - a) + a;
const randInt= (a, b) => Math.floor(rand(a, b + 1));
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const PAL = {
  sky1:'#0d0f1a',sky2:'#1a1030',moon:'#d4d0c0',moonGlow:'#3a3060',
  ground:'#1a3d10',groundDk:'#0f2a0a',grass:'#2e7d1a',grassLt:'#3a9e20',
  capRed:'#cc2020',capDark:'#8b1010',skinLt:'#f8d4b0',skinDk:'#e0a070',
  dress:'#e8e0d0',dressDk:'#c8b8a0',basketBr:'#8b5a2b',
  fire1:'#ff8c00',fire2:'#ff4500',fire3:'#ffdd00',
  monGreen:'#1a6b1a',monDark:'#0d4a0d',monEye:'#ff2020',
  bossRed:'#8b0000',bossGold:'#d4a800',
  white:'#f0f0e8',black:'#000000',grey:'#4a4a5a',
  bark:'#3d2b0a',leaf1:'#1a5c1a',leaf2:'#237723',leaf3:'#2ea82e',
  neonG:'#39ff14',gold:'#f5c518',red:'#e03030',
};

const N = null;
function drawSprite(ctx, sprite, x, y, flipX){
  ctx.save();
  if(flipX){ ctx.scale(-1,1); x=-x-sprite[0].length; }
  sprite.forEach(function(row,ry){ row.forEach(function(col,rx){
    if(col){ctx.fillStyle=col;ctx.fillRect(x+rx,y+ry,1,1);}
  });});
  ctx.restore();
}

function makeChapSprite(frame){
  var R=PAL.capRed,RD=PAL.capDark,S=PAL.skinLt,D=PAL.dress,DD=PAL.dressDk,B=PAL.basketBr;
  var leg=frame===0?[[N,N,D,N,N,N,D,N],[N,N,D,N,N,N,D,N],[N,N,S,N,N,N,S,N]]:
                    [[N,N,D,N,N,N,N,D],[N,N,N,D,N,N,D,N],[N,N,S,N,N,N,S,N]];
  return[[N,N,N,RD,R,R,RD,N],[N,N,RD,R,R,R,R,RD],[N,N,R,R,R,R,R,R],
         [N,N,S,S,S,S,N,N],[N,N,S,S,S,S,N,N],[N,N,S,S,S,S,N,N],
         [N,DD,D,D,D,D,DD,N],[N,D,D,D,D,D,D,B],[DD,D,D,D,D,D,D,B]].concat(leg);
}
var CHAP_SPRITES=[makeChapSprite(0),makeChapSprite(1)];

function makeMonsterSprite(frame){
  var G=PAL.monGreen,GD=PAL.monDark,E=PAL.monEye,BK=PAL.black;
  var arm=frame===0?[[G,N,N,N,N,G],[G,N,N,N,G,N]]:[[N,G,N,N,G,N],[N,G,N,G,N,N]];
  return[[N,GD,GD,GD,GD,N],[GD,G,G,G,G,GD],[GD,G,E,G,E,GD],
         [GD,G,G,G,G,GD],[GD,G,BK,BK,G,GD],[N,GD,G,G,GD,N]].concat(arm).concat([[N,G,N,N,G,N],[N,G,N,N,G,N]]);
}

function makeBossSprite(phase){
  var B=PAL.bossRed,BD='#500000',E=PAL.monEye,BK=PAL.black,W=PAL.white,SK=PAL.skinLt,GR=PAL.grey;
  if(phase==='monster'){
    return[[N,BD,B,B,B,BD,N],[BD,B,B,B,B,B,BD],[BD,B,E,B,E,B,BD],
           [BD,B,B,B,B,B,BD],[BD,B,BK,BK,B,B,BD],[N,BD,B,B,BD,N,N],
           [BD,B,N,N,B,BD,N],[BD,B,N,N,N,B,BD],[N,B,N,N,N,B,N],[N,B,N,N,N,B,N]];
  }
  return[[N,GR,GR,GR,GR,N],[GR,W,W,W,W,GR],[GR,W,BK,W,BK,GR],
         [GR,W,W,W,W,GR],[GR,W,SK,SK,W,GR],[N,GR,SK,SK,GR,N],
         [N,GR,W,W,GR,N],[GR,W,W,W,W,GR],[N,GR,N,N,GR,N],[N,SK,N,N,SK,N]];
}

function makeFireball(){
  return[[N,PAL.fire3,N],[PAL.fire1,PAL.fire2,PAL.fire1],[N,PAL.fire3,N]];
}

function drawTree(ctx,x,y,w,h){
  w=w||5; h=h||10;
  ctx.fillStyle=PAL.bark;
  ctx.fillRect(x+Math.floor(w/2)-1,y+h-4,2,4);
  var cols=[PAL.leaf1,PAL.leaf2,PAL.leaf3];
  for(var i=0;i<3;i++){
    ctx.fillStyle=cols[i%3];
    var tw=w-i*1.5,tx=x+(w-tw)/2;
    ctx.fillRect(Math.round(tx),y+i*3,Math.round(tw),3+(2-i));
  }
}

var Screen={
  show:function(id){
    ['menu-screen','game-screen','gameover-screen','reveal-screen'].forEach(function(s){
      var el=document.getElementById(s);
      if(el){el.style.display='none';el.classList.remove('active');}
    });
    var t=document.getElementById(id);
    if(t){t.style.display='flex';t.classList.add('active');}
  }
};

function buildPhase(num){
  var W=200,H=15,pixW=W*TILE,pixH=H*TILE;
  var platforms=[{x:0,y:pixH-TILE*2,w:pixW,h:TILE*2}];
  for(var i=0;i<18+num*4;i++)
    platforms.push({x:rand(2,W-6)*TILE,y:rand(5,H-4)*TILE,w:randInt(3,7)*TILE,h:TILE});
  var enemies=[];
  for(var j=0;j<4+num*3;j++)
    enemies.push({x:rand(4,W-4)*TILE,y:pixH-TILE*2-TILE,vx:(Math.random()>0.5?1:-1)*rand(0.8,1.8+num*0.3),
      vy:0,w:14,h:14,hp:2+num,maxHp:2+num,frame:0,frameTimer:0,grounded:false,alive:true});
  var pickups=[];
  for(var k=0;k<12+num*2;k++)
    pickups.push({x:rand(2,W-2)*TILE,y:rand(3,H-4)*TILE,collected:false,
      type:Math.random()>0.8?'heart':'star',bobTimer:rand(0,Math.PI*2)});
  var decos=[];
  for(var d=0;d<30;d++) decos.push({x:rand(0,W)*TILE,y:pixH-TILE*2,w:5,h:randInt(8,14)});
  var names=['FASE 1 — A FLORESTA','FASE 2 — O CAMINHO NEGRO','FASE 3 — O COVIL DA BESTA'];
  return{W:W,H:H,pixW:pixW,pixH:pixH,platforms:platforms,enemies:enemies,
    pickups:pickups,decos:decos,phaseName:names[num-1]||names[0],num:num};
}

function makeBoss(phase){
  return{x:phase.pixW-TILE*6,y:phase.pixH-TILE*2-TILE*3,vx:-2.5,vy:0,
    w:22,h:24,hp:15,maxHp:15,grounded:false,alive:true,frame:0,frameTimer:0,
    attackTimer:0,projectiles:[],jumpTimer:0};
}

var Keys={left:false,right:false,up:false,fire:false};
var KeyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
            ArrowUp:'up',KeyW:'up',Space:'up',KeyZ:'fire',KeyX:'fire'};

function bindKeys(){
  document.addEventListener('keydown',function(e){var k=KeyMap[e.code];if(k){Keys[k]=true;e.preventDefault();}});
  document.addEventListener('keyup',  function(e){var k=KeyMap[e.code];if(k)Keys[k]=false;});
  [['btn-left','left'],['btn-right','right'],['btn-jump','up'],['btn-fire','fire']].forEach(function(pair){
    var el=document.getElementById(pair[0]),key=pair[1];
    if(!el)return;
    function on(e){e.preventDefault();Keys[key]=true;el.classList.add('pressed');}
    function off(e){e.preventDefault();Keys[key]=false;el.classList.remove('pressed');}
    el.addEventListener('touchstart',on,{passive:false});
    el.addEventListener('touchend',off,{passive:false});
    el.addEventListener('touchcancel',off,{passive:false});
    el.addEventListener('mousedown',on);
    el.addEventListener('mouseup',off);
    el.addEventListener('mouseleave',off);
  });
}

var Game={
  canvas:null,ctx:null,raf:null,state:'idle',
  lives:3,score:0,phaseNum:1,phase:null,
  boss:null,bossActive:false,
  player:null,camera:{x:0,y:0},
  fireballs:[],fireDelay:0,
  particles:[],damageFlash:0,phaseTransition:0,
  lastTime:0,

  start:function(){
    this.lives=3;this.score=0;this.phaseNum=1;
    this.loadPhase();
    Screen.show('game-screen');
    this.resizeCanvas();
    if(this.raf)cancelAnimationFrame(this.raf);
    this.state='playing';
    this.lastTime=performance.now();
    var self=this;
    function loop(ts){self.loop(ts);self.raf=requestAnimationFrame(loop);}
    this.raf=requestAnimationFrame(loop);
  },

  loadPhase:function(){
    this.phase=buildPhase(this.phaseNum);
    this.boss=null;this.bossActive=false;
    this.fireballs=[];this.particles=[];this.phaseTransition=60;
    this.player={x:TILE*2,y:this.phase.pixH-TILE*4,vx:0,vy:0,w:8,h:16,
      grounded:false,frame:0,frameTimer:0,facingLeft:false,invincible:0};
    var el=document.getElementById('hud-phase-name');
    if(el)el.textContent=this.phase.phaseName;
    this.updateHUD();
  },

  resizeCanvas:function(){
    var gs=document.getElementById('game-screen');if(!gs)return;
    var hud=document.querySelector('.hud'),mc=document.querySelector('.mobile-controls');
    var hudH=hud?hud.offsetHeight:36,mcH=mc?mc.offsetHeight:90;
    var availH=gs.clientHeight-hudH-mcH,availW=gs.clientWidth;
    var logH=this.phase?this.phase.pixH:240;
    var ratio=Math.min(availW/800,availH/logH);
    var c=document.getElementById('game-canvas');if(!c)return;
    c.style.width=Math.floor(800*ratio)+'px';
    c.style.height=Math.floor(logH*ratio)+'px';
    c.width=800;c.height=logH;
    this.canvas=c;this.ctx=c.getContext('2d');
    this.ctx.imageSmoothingEnabled=false;
  },

  loop:function(ts){
    var dt=Math.min((ts-this.lastTime)/16.67,3);
    this.lastTime=ts;
    if(this.state==='playing'){this.update(dt);this.render();}
  },

  over:function(a,b){
    return a.x<b.x+(b.w||TILE)&&a.x+(a.w||8)>b.x&&a.y<b.y+(b.h||TILE)&&a.y+(a.h||8)>b.y;
  },

  sparks:function(x,y,color,count){
    for(var i=0;i<count;i++)
      this.particles.push({x:x,y:y,vx:rand(-2.5,2.5),vy:rand(-3.5,-0.5),color:color,life:randInt(18,35)});
  },

  hit:function(fell){
    fell=fell||false;
    this.lives--;this.updateHUD();
    this.player.invincible=90;this.player.vy=-6;
    this.damageFlash=20;this.sparks(this.player.x,this.player.y,PAL.red,10);
    var self=this;
    if(this.lives<=0){
      this.state='dead';
      setTimeout(function(){
        var s=document.getElementById('go-score');if(s)s.textContent=self.score;
        Screen.show('gameover-screen');
      },800);
    } else if(fell){
      this.player.x=TILE*2;this.player.y=this.phase.pixH-TILE*4;this.player.vy=0;
    }
  },

  triggerReveal:function(){
    this.state='bosswin';
    var fs=document.getElementById('final-score');if(fs)fs.textContent=this.score;
    Screen.show('reveal-screen');
    var steps=['rv1','rv2','rv3','rv4'],i=0;
    function next(){
      if(i>0){var prev=document.getElementById(steps[i-1]);if(prev)prev.classList.add('hidden');}
      if(i<steps.length){var el=document.getElementById(steps[i]);if(el)el.classList.remove('hidden');i++;if(i<steps.length)setTimeout(next,2800);}
    }
    setTimeout(next,300);
  },

  updateHUD:function(){
    var hl=document.getElementById('hud-lives'),hs=document.getElementById('hud-score');
    if(hl)hl.textContent=this.lives;if(hs)hs.textContent=this.score;
  },

  update:function(dt){
    var ph=this.phase,pl=this.player,self=this;
    if(this.phaseTransition>0){this.phaseTransition--;return;}

    if(Keys.left){pl.vx=-MOVE_SPEED;pl.facingLeft=true;}
    else if(Keys.right){pl.vx=MOVE_SPEED;pl.facingLeft=false;}
    else pl.vx*=0.7;
    if(Keys.up&&pl.grounded){pl.vy=JUMP_VEL;pl.grounded=false;}
    pl.vy=Math.min(pl.vy+GRAVITY,14);
    pl.x+=pl.vx;pl.y+=pl.vy;
    pl.x=clamp(pl.x,0,ph.pixW-pl.w);
    pl.frameTimer++;if(pl.frameTimer>=12){pl.frameTimer=0;pl.frame=1-pl.frame;}
    if(pl.invincible>0)pl.invincible--;

    pl.grounded=false;
    ph.platforms.forEach(function(p){
      if(!self.over(pl,p))return;
      var oB=(pl.y+pl.h)-p.y,oT=(p.y+p.h)-pl.y,oL=(pl.x+pl.w)-p.x,oR=(p.x+p.w)-pl.x;
      var m=Math.min(oB,oT,oL,oR);
      if(m===oB&&pl.vy>=0){pl.y=p.y-pl.h;pl.vy=0;pl.grounded=true;}
      else if(m===oT&&pl.vy<0){pl.y=p.y+p.h;pl.vy=0;}
      else if(m===oL){pl.x=p.x-pl.w;pl.vx=0;}
      else{pl.x=p.x+p.w;pl.vx=0;}
    });

    this.camera.x=clamp(pl.x-400+pl.w/2,0,ph.pixW-800);

    this.fireDelay=Math.max(0,this.fireDelay-1);
    if(Keys.fire&&this.fireDelay===0){
      this.fireDelay=18;
      this.fireballs.push({x:pl.x+(pl.facingLeft?-6:pl.w),y:pl.y+6,
        vx:pl.facingLeft?-6:6,vy:-0.5,alive:true,age:0});
    }

    this.fireballs=this.fireballs.filter(function(f){return f.alive&&f.age<80;});
    this.fireballs.forEach(function(f){
      f.x+=f.vx;f.y+=f.vy;f.age++;
      ph.platforms.forEach(function(p){
        if(self.over({x:f.x,y:f.y,w:4,h:4},p)){f.alive=false;self.sparks(f.x,f.y,PAL.fire1,6);}
      });
    });

    ph.enemies.forEach(function(en){
      if(!en.alive)return;
      en.vy=Math.min(en.vy+GRAVITY,14);en.x+=en.vx;en.y+=en.vy;en.grounded=false;
      ph.platforms.forEach(function(p){
        if(self.over(en,p)){
          var oB=(en.y+en.h)-p.y;
          if(oB>0&&oB<16&&en.vy>=0){en.y=p.y-en.h;en.vy=0;en.grounded=true;}
        }
      });
      if(en.x<=0||en.x+en.w>=ph.pixW)en.vx*=-1;
      if(en.grounded){
        var ex=en.x+(en.vx>0?en.w+2:-2),ey=en.y+en.h+4,ok=false;
        ph.platforms.forEach(function(p){if(ex>=p.x&&ex<=p.x+p.w&&ey>=p.y&&ey<=p.y+p.h)ok=true;});
        if(!ok)en.vx*=-1;
      }
      en.frameTimer++;if(en.frameTimer>=16){en.frameTimer=0;en.frame=1-en.frame;}
      self.fireballs.forEach(function(f){
        if(!f.alive)return;
        if(self.over({x:f.x,y:f.y,w:4,h:4},{x:en.x,y:en.y,w:en.w,h:en.h})){
          f.alive=false;en.hp--;self.sparks(en.x+en.w/2,en.y+en.h/2,PAL.fire2,8);
          if(en.hp<=0){en.alive=false;self.score+=100;self.sparks(en.x,en.y,PAL.neonG,12);}
        }
      });
      if(pl.invincible===0&&self.over(pl,{x:en.x,y:en.y,w:en.w,h:en.h}))self.hit();
    });

    ph.pickups.forEach(function(pk){
      if(pk.collected)return;
      pk.bobTimer+=0.05;
      if(self.over(pl,{x:pk.x,y:pk.y+Math.sin(pk.bobTimer)*2,w:8,h:8})){
        pk.collected=true;
        if(pk.type==='star'){self.score+=50;self.sparks(pk.x,pk.y,PAL.gold,6);}
        else{self.lives=Math.min(self.lives+1,5);self.updateHUD();self.sparks(pk.x,pk.y,'#ff5555',8);}
      }
    });

    if(this.bossActive&&this.boss&&this.boss.alive)this.updateBoss();
    if(!this.bossActive&&!this.boss&&pl.x>ph.pixW*0.85){this.boss=makeBoss(ph);this.bossActive=true;}

    this.particles=this.particles.filter(function(p){return p.life>0;});
    this.particles.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.life--;});

    var hs=document.getElementById('hud-score');if(hs)hs.textContent=this.score;
    if(pl.y>ph.pixH+50)this.hit(true);
  },

  updateBoss:function(){
    var b=this.boss,pl=this.player,self=this;
    b.vy=Math.min(b.vy+GRAVITY*0.8,12);b.x+=b.vx;b.y+=b.vy;b.grounded=false;
    this.phase.platforms.forEach(function(p){
      if(self.over(b,p)){var ov=(b.y+b.h)-p.y;if(ov>0&&ov<20&&b.vy>=0){b.y=p.y-b.h;b.vy=0;b.grounded=true;}}
    });
    if(b.x<=this.phase.pixW*0.6||b.x+b.w>=this.phase.pixW-TILE)b.vx*=-1;
    b.jumpTimer++;if(b.grounded&&b.jumpTimer>80){b.vy=JUMP_VEL*0.9;b.grounded=false;b.jumpTimer=0;}
    b.frameTimer++;if(b.frameTimer>=14){b.frameTimer=0;b.frame=1-b.frame;}
    b.attackTimer++;
    if(b.attackTimer>=(b.hp<8?50:80)){
      b.attackTimer=0;
      var dx=pl.x-b.x,dy=pl.y-b.y,len=Math.sqrt(dx*dx+dy*dy)||1,spd=3.5;
      b.projectiles.push({x:b.x+b.w/2,y:b.y+b.h/2,vx:(dx/len)*spd,vy:(dy/len)*spd,alive:true,age:0});
    }
    b.projectiles=b.projectiles.filter(function(p){return p.alive&&p.age<90;});
    b.projectiles.forEach(function(p){
      p.x+=p.vx;p.y+=p.vy;p.age++;
      if(pl.invincible===0&&self.over(pl,{x:p.x-3,y:p.y-3,w:6,h:6})){p.alive=false;self.hit();}
    });
    this.fireballs.forEach(function(f){
      if(!f.alive)return;
      if(self.over({x:f.x,y:f.y,w:5,h:5},b)){
        f.alive=false;b.hp--;self.damageFlash=8;self.sparks(b.x+b.w/2,b.y,PAL.fire1,10);
        if(b.hp<=0){b.alive=false;self.score+=1000;self.triggerReveal();}
      }
    });
    if(pl.invincible===0&&this.over(pl,{x:b.x,y:b.y,w:b.w,h:b.h}))this.hit();
  },

  render:function(){
    var ctx=this.ctx,ph=this.phase,cam=this.camera,pl=this.player;
    if(!ctx||!ph)return;
    ctx.imageSmoothingEnabled=false;
    var W=ctx.canvas.width,H=ctx.canvas.height,self=this;

    var sk=ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,PAL.sky1);sk.addColorStop(1,PAL.sky2);
    ctx.fillStyle=sk;ctx.fillRect(0,0,W,H);

    ctx.fillStyle=PAL.moonGlow;ctx.beginPath();ctx.arc(W*0.8,30,18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=PAL.moon;    ctx.beginPath();ctx.arc(W*0.8,30,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=PAL.white;
    for(var si=0;si<40;si++)ctx.fillRect((si*97+13)%W,(si*53+7)%(H*0.6),1,1);

    ctx.save();ctx.translate(-cam.x,0);

    ph.decos.forEach(function(d){if(d.x+d.w*TILE<cam.x||d.x>cam.x+W)return;drawTree(ctx,d.x,d.y-d.h+2,d.w,d.h);});

    ph.platforms.forEach(function(p){
      if(p.x+p.w<cam.x||p.x>cam.x+W)return;
      ctx.fillStyle=PAL.groundDk;ctx.fillRect(p.x,p.y+2,p.w,p.h-2);
      ctx.fillStyle=PAL.ground;ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle=PAL.grass;ctx.fillRect(p.x,p.y,p.w,2);
      ctx.fillStyle=PAL.grassLt;for(var gx=p.x;gx<p.x+p.w;gx+=4)ctx.fillRect(gx,p.y-1,2,2);
    });

    ph.pickups.forEach(function(pk){
      if(pk.collected)return;
      var py=pk.y+Math.sin(pk.bobTimer)*2;
      if(pk.type==='star'){ctx.fillStyle=PAL.gold;ctx.fillRect(pk.x+2,py,4,4);ctx.fillStyle='#fff';ctx.fillRect(pk.x+3,py+1,2,2);}
      else{ctx.fillStyle='#ff5555';ctx.fillRect(pk.x+1,py+2,2,3);ctx.fillRect(pk.x+3,py,2,5);ctx.fillRect(pk.x+5,py+2,2,3);}
    });

    ph.enemies.forEach(function(en){
      if(!en.alive||en.x+en.w<cam.x||en.x>cam.x+W)return;
      drawSprite(ctx,makeMonsterSprite(en.frame),Math.round(en.x),Math.round(en.y),en.vx>0);
      if(en.hp<en.maxHp){ctx.fillStyle='#300';ctx.fillRect(en.x,en.y-3,en.w,2);ctx.fillStyle='#0f0';ctx.fillRect(en.x,en.y-3,en.w*(en.hp/en.maxHp),2);}
    });

    if(this.bossActive&&this.boss){
      var b=this.boss;
      drawSprite(ctx,makeBossSprite(b.alive?'monster':'granny'),Math.round(b.x),Math.round(b.y),b.vx>0);
      if(b.alive){
        var bw=50,bx=b.x+b.w/2-bw/2;
        ctx.fillStyle='#500';ctx.fillRect(bx,b.y-6,bw,4);
        ctx.fillStyle='#f00';ctx.fillRect(bx,b.y-6,bw*(b.hp/b.maxHp),4);
      }
      b.projectiles.forEach(function(p){
        if(!p.alive)return;
        ctx.fillStyle=PAL.bossRed;ctx.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,5,5);
        ctx.fillStyle=PAL.bossGold;ctx.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,3,3);
      });
    }

    var fbsp=makeFireball();
    this.fireballs.forEach(function(f){if(f.alive)drawSprite(ctx,fbsp,Math.round(f.x),Math.round(f.y));});

    this.particles.forEach(function(p){ctx.globalAlpha=p.life/35;ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2);});
    ctx.globalAlpha=1;

    if(!(pl.invincible>0&&Math.floor(pl.invincible/5)%2===0))
      drawSprite(ctx,CHAP_SPRITES[pl.frame],Math.round(pl.x-2),Math.round(pl.y-2),pl.facingLeft);

    ctx.restore();

    if(this.damageFlash>0){ctx.fillStyle='rgba(255,0,0,'+(this.damageFlash/20*0.4)+')';ctx.fillRect(0,0,W,H);this.damageFlash--;}
    if(this.phaseTransition>0){ctx.fillStyle='rgba(0,0,0,'+(this.phaseTransition/60)+')';ctx.fillRect(0,0,W,H);}
    if(this.bossActive&&this.boss&&this.boss.alive){
      ctx.fillStyle='#f00';ctx.font='5px monospace';ctx.textAlign='center';
      ctx.fillText('CHEFE A FRENTE',W/2,16);
    }
    if(!this.bossActive){
      var prog=Math.floor((this.player.x/this.phase.pixW)*100);
      ctx.fillStyle=PAL.neonG;ctx.font='5px monospace';ctx.textAlign='left';
      ctx.fillText('-> '+prog+'%',8,H-6);
    }
  }
};

function initMenu(){
  var starsEl=document.getElementById('stars');
  if(starsEl){
    starsEl.innerHTML='';
    for(var i=0;i<80;i++){
      var s=document.createElement('div');
      s.className='star';
      s.style.cssText='left:'+rand(0,100)+'%;top:'+rand(0,100)+'%;--d:'+rand(1.5,5)+'s;--o:'+rand(0.3,0.9)+';';
      starsEl.appendChild(s);
    }
  }
  var mc=document.getElementById('menu-char-canvas');
  if(mc){
    var mctx=mc.getContext('2d');
    mctx.imageSmoothingEnabled=false;
    var mf=0,mft=0;
    (function anim(){
      mctx.clearRect(0,0,48,48);
      var sp=CHAP_SPRITES[mf];
      mctx.save();mctx.scale(48/sp[0].length,48/sp.length);
      sp.forEach(function(row,ry){row.forEach(function(col,rx){if(col){mctx.fillStyle=col;mctx.fillRect(rx,ry,1,1);}});});
      mctx.restore();
      if(++mft>=30){mft=0;mf=1-mf;}
      requestAnimationFrame(anim);
    })();
  }
}

/* ===== BOOT ===== */
window.addEventListener('load',function(){
  bindKeys();
  initMenu();

  var btnPlay=document.getElementById('btn-play');
  if(btnPlay) btnPlay.addEventListener('click',function(){ Game.start(); });

  var btnCtrl=document.getElementById('btn-controls');
  var ctrlPanel=document.querySelector('.controls-panel');
  if(btnCtrl&&ctrlPanel) btnCtrl.addEventListener('click',function(){ ctrlPanel.classList.toggle('hidden'); });

  var btnRestart=document.getElementById('btn-restart');
  if(btnRestart) btnRestart.addEventListener('click',function(){ Game.start(); });

  var btnGoMenu=document.getElementById('btn-menu-go');
  if(btnGoMenu) btnGoMenu.addEventListener('click',function(){ Game.state='idle'; Screen.show('menu-screen'); });

  var btnWinMenu=document.getElementById('btn-menu-win');
  if(btnWinMenu) btnWinMenu.addEventListener('click',function(){ Game.state='idle'; Screen.show('menu-screen'); });

  window.addEventListener('resize',function(){ if(Game.canvas&&Game.phase) Game.resizeCanvas(); });

  Screen.show('menu-screen');
});
