(function(){
  var c=document.getElementById('crosshair'),ctx=c.getContext('2d');
  // Dark outline
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.fillRect(6,3,3,9); ctx.fillRect(3,6,9,3);
  // White cross — 1px arms
  ctx.fillStyle='#ffffff';
  ctx.fillRect(7,4,1,7); ctx.fillRect(4,7,7,1);
})();

(function(){
  // ── Pause icon: 3-bar hamburger (old MCPE menu style) ────────────
  var pc = document.getElementById('pause-icon');
  var px = pc.getContext('2d');
  px.imageSmoothingEnabled = false;
  var bars = [2, 9, 16]; // y positions for 3 bars
  // shadow
  px.fillStyle = 'rgba(0,0,0,0.6)';
  bars.forEach(function(y){ px.fillRect(2,y+1,16,3); });
  // white bars
  px.fillStyle = '#ffffff';
  bars.forEach(function(y){ px.fillRect(2,y,16,3); });

  // ── Chat icon: old MCPE speech bubble PNG style ───────────────────
  var cc = document.getElementById('chat-icon');
  var cx = cc.getContext('2d');
  cx.imageSmoothingEnabled = false;
  // Outer bubble body shadow
  cx.fillStyle = 'rgba(0,0,0,0.6)';
  cx.fillRect(2,1,16,12);
  cx.fillRect(2,13,3,3); cx.fillRect(3,14,2,1);
  // White bubble fill
  cx.fillStyle = '#ffffff';
  cx.fillRect(1,0,16,12);
  cx.fillRect(1,12,3,3); cx.fillRect(2,13,2,1);
  // Dark text lines inside bubble
  cx.fillStyle = 'rgba(0,0,0,0.45)';
  cx.fillRect(3,3,10,2);
  cx.fillRect(3,7,7,2);
})();

(function(){
  var cv = document.getElementById('inv-dot-icon');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  var dots = [4, 11, 18];
  var y = 10, r = 3;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  dots.forEach(function(x){ ctx.fillRect(x+1, y+1, r, r); });
  ctx.fillStyle = '#ffffff';
  dots.forEach(function(x){ ctx.fillRect(x, y, r, r); });
})();

(function(){
  var C = '#3d3228';
  var SH = 'rgba(0,0,0,0.45)';

  function arrow(id, dir) {
    var cv = document.getElementById(id);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    var W = cv.width, H = cv.height;
    var cx = Math.floor(W/2), cy = Math.floor(H/2);
    ctx.clearRect(0,0,W,H);
    var rows = 8;

    function tri(ox, oy, col) {
      ctx.fillStyle = col;
      for (var i=0;i<rows;i++) {
        if (dir==='up') {
          var w=i*2+1; ctx.fillRect(cx-i+ox,cy-4+i+oy,w,1);
        } else if (dir==='down') {
          var w=(rows-1-i)*2+1; ctx.fillRect(cx-(rows-1-i)+ox,cy-4+i+oy,w,1);
        } else if (dir==='left') {
          var h=i*2+1; ctx.fillRect(cx-4+i+ox,cy-i+oy,1,h);
        } else {
          var h=(rows-1-i)*2+1; ctx.fillRect(cx-4+i+ox,cy-(rows-1-i)+oy,1,h);
        }
      }
    }
    tri(1,1,SH);
    tri(0,0,C);
  }

  function diamond(id) {
    var cv = document.getElementById(id);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    var W = cv.width, H = cv.height;
    var cx = Math.floor(W/2), cy = Math.floor(H/2);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = SH;
    for (var i=0;i<=5;i++) {
      ctx.fillRect(cx-i+1,cy-5+i+1,1,1); ctx.fillRect(cx+i+1,cy-5+i+1,1,1);
      ctx.fillRect(cx-i+1,cy+5-i+1,1,1); ctx.fillRect(cx+i+1,cy+5-i+1,1,1);
    }
    ctx.fillStyle = C;
    for (var i=0;i<=5;i++) {
      ctx.fillRect(cx-i,cy-5+i,1,1); ctx.fillRect(cx+i,cy-5+i,1,1);
      ctx.fillRect(cx-i,cy+5-i,1,1); ctx.fillRect(cx+i,cy+5-i,1,1);
    }
  }

  arrow('dpad-cv-up','up');
  arrow('dpad-cv-down','down');
  arrow('dpad-cv-left','left');
  arrow('dpad-cv-right','right');
  diamond('dpad-cv-center');
})();

/* =================================================================
   Craft3D — single-file Three.js (r128) Minecraft-style sandbox
   ================================================================= */

/* ---------- 1. Canvas helpers (crack overlay + grass tuft) ---------- */

function makeCanvas(size = 16) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}
function px(ctx, x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
function shade(hex, amt) {
  const c = parseInt(hex.slice(1), 16);
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); }
  return `rgb(${r|0},${g|0},${b|0})`;
}

/* ---------- 2. Real Minecraft Textures (CDN) ---------- */
// Loads authentic Minecraft Java Edition 1.20 textures via jsDelivr CDN.
// Falls back gracefully — Three.js renders frames continuously, so textures
// fill in automatically once each image finishes loading.
const MC_BASE = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/block/';
const tLoader = new THREE.TextureLoader();
tLoader.crossOrigin = 'anonymous';

function loadTex(name) {
  // Offscreen canvas used to darken the texture for the old Minecraft look
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext('2d');

  const t = tLoader.load(
    MC_BASE + name + '.png',
    (tex) => {
      // Draw original texture at full brightness (lighting handled by Three.js)
      ctx.drawImage(tex.image, 0, 0, 16, 16);
      t.image = canvas;
      t.needsUpdate = true;
      if (typeof refreshHotbarIcons === 'function') refreshHotbarIcons();
    },
    undefined,
    () => console.warn('[Craft3D] Texture missing:', name)
  );
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}


// Tall grass tuft — several blades of grass at the bottom of a 16x16 canvas.
// Used as a billboard texture scattered on top of grass blocks for "grass detail".
function texGrassTuft() {
  const c = makeCanvas(), ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 16, 16);
  const greens = ['#3a7a22', '#4a8d2a', '#5cab3a', '#6cba45', '#2f6318'];
  const bladeCount = 5 + ((Math.random() * 3) | 0);
  for (let b = 0; b < bladeCount; b++) {
    const bx = 3 + b * (10 / bladeCount) + (Math.random() * 1.5 - 0.75);
    const bh = 6 + ((Math.random() * 5) | 0);
    const tilt = (Math.random() * 2 - 1) * 0.9;
    for (let h = 0; h < bh; h++) {
      const offset = (h / bh) * tilt;
      ctx.fillStyle = greens[(Math.random() * greens.length) | 0];
      ctx.fillRect(bx + offset, 15 - h, 1, 1);
      // widen at the base so blades connect visually
      if (h < 2 && Math.random() < 0.4) {
        ctx.fillRect(bx + offset - 1, 15 - h, 1, 1);
      }
    }
  }
  return c;
}

// Procedural crack overlay texture for breaking animation.
// `stage` is 0..9 — 0 = no cracks, 9 = almost shattered.
// Drawn as black crack lines on transparent background.
function texCracks(stage) {
  const c = makeCanvas(), ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 16, 16);
  if (stage <= 0) return c;
  // Deterministic-ish crack pattern that grows with stage
  // Use a seeded approach so cracks accumulate rather than jump around
  const rng = mulberry32(42);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 1;
  // Number of crack lines grows with stage
  const lineCount = Math.min(stage * 2, 18);
  for (let i = 0; i < lineCount; i++) {
    let x = 8 + (rng() - 0.5) * 12;
    let y = 8 + (rng() - 0.5) * 12;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segments = 2 + Math.floor(rng() * 3);
    for (let s = 0; s < segments; s++) {
      x += (rng() - 0.5) * 8;
      y += (rng() - 0.5) * 8;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Add some shattered pixels at higher stages
  if (stage >= 5) {
    const dotCount = (stage - 4) * 8;
    for (let i = 0; i < dotCount; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1);
    }
  }
  return c;
}

// Tiny seeded PRNG so crack textures are deterministic per stage
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- 3. Build THREE.Texture from canvas (used for crack overlays + grass tufts) ---------- */
function toTexture(canvas, repeat = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}

// Real Minecraft Java 1.20 textures — loaded from jsDelivr CDN.
// Three.js renders every frame so textures pop in automatically as they load.
const T = {
  grassTop:  loadTex('grass_block_top'),
  grassSide: loadTex('grass_block_side'),
  dirt:      loadTex('dirt'),
  stone:     loadTex('stone'),
  sand:      loadTex('sand'),
  water:     loadTex('water_still'),
  logTop:    loadTex('oak_log_top'),
  logSide:   loadTex('oak_log'),
  leaves:    loadTex('oak_leaves'),
  grassTuft: toTexture(texGrassTuft()),   // kept procedural — used for billboard grass sprites
  glass:     loadTex('glass'),
  oakPlanks: loadTex('oak_planks'),
  snow:      loadTex('snow'),
  snowSide:  loadTex('grass_block_snow'), // snowy grass side (dirt+snow cap)
  gravel:    loadTex('gravel'),
  coalOre:   loadTex('coal_ore'),
  ironOre:   loadTex('iron_ore'),
  bedrock:   loadTex('bedrock'),
  brick:     loadTex('bricks'),
  cobble:    loadTex('cobblestone'),
  goldBlock: loadTex('gold_block'),
  ironBlock: loadTex('iron_block'),
  diamondBlock: loadTex('diamond_block'),
  bookshelf: loadTex('bookshelf'),
  booksTop:  loadTex('oak_planks'),
  tntTop:    loadTex('tnt_top'),
  tntSide:   loadTex('tnt_side'),
  tntBottom: loadTex('tnt_bottom'),
  sponge:    loadTex('sponge'),
  mossy:     loadTex('mossy_cobblestone'),
  torch:     loadTex('torch'),
};

// Wrap a texture in a MeshLambertMaterial. `opts` for transparency etc.
function mat(tex, opts = {}) {
  return new THREE.MeshLambertMaterial(Object.assign({ map: tex }, opts));
}

/* ---------- 4. Per-block material sets. Order: [+X, -X, +Y(top), -Y(bottom), +Z, -Z] ---------- */
const BLOCKS = {
  // grass_block_top & oak_leaves are grayscale in Minecraft's raw assets.
  // Set material.color to simulate the default Plains biome tint (multiplied with texture).
  grass:  { name:'Grass',  mats:[ mat(T.grassSide), mat(T.grassSide), mat(T.grassTop, { color:0x79C05A }), mat(T.dirt), mat(T.grassSide), mat(T.grassSide) ] },
  dirt:   { name:'Dirt',   mats:[ mat(T.dirt), mat(T.dirt), mat(T.dirt), mat(T.dirt), mat(T.dirt), mat(T.dirt) ] },
  stone:  { name:'Stone',  mats:[ mat(T.stone), mat(T.stone), mat(T.stone), mat(T.stone), mat(T.stone), mat(T.stone) ] },
  sand:   { name:'Sand',   mats:[ mat(T.sand), mat(T.sand), mat(T.sand), mat(T.sand), mat(T.sand), mat(T.sand) ] },
  log:    { name:'Log',    mats:[ mat(T.logSide), mat(T.logSide), mat(T.logTop), mat(T.logTop), mat(T.logSide), mat(T.logSide) ] },
  leaves: { name:'Leaves', mats:[ mat(T.leaves, { transparent:true, alphaTest:0.5, side:THREE.DoubleSide, color:0x48B518 }) ] },
  water:  { name:'Water',  mats:[ mat(T.water, { transparent:true, opacity:0.7, depthWrite:false, color:0x3F76E4 }) ] },
  glass:  { name:'Glass',  mats:[ mat(T.glass, { transparent:true, opacity:0.55, depthWrite:false, side:THREE.DoubleSide }) ] },
  oak:    { name:'Oak',    mats:[ mat(T.oakPlanks), mat(T.oakPlanks), mat(T.oakPlanks), mat(T.oakPlanks), mat(T.oakPlanks), mat(T.oakPlanks) ] },
  snow:   { name:'Snow',   mats:[ mat(T.snowSide), mat(T.snowSide), mat(T.snow), mat(T.dirt), mat(T.snowSide), mat(T.snowSide) ] },
  gravel:   { name:'Gravel',   mats:[ mat(T.gravel),  mat(T.gravel),  mat(T.gravel),  mat(T.gravel),  mat(T.gravel),  mat(T.gravel)  ] },
  coalOre:  { name:'Coal Ore', mats:[ mat(T.coalOre), mat(T.coalOre), mat(T.coalOre), mat(T.coalOre), mat(T.coalOre), mat(T.coalOre) ] },
  ironOre:  { name:'Iron Ore', mats:[ mat(T.ironOre), mat(T.ironOre), mat(T.ironOre), mat(T.ironOre), mat(T.ironOre), mat(T.ironOre) ] },
  bedrock:  { name:'Bedrock',  mats:[ mat(T.bedrock), mat(T.bedrock), mat(T.bedrock), mat(T.bedrock), mat(T.bedrock), mat(T.bedrock) ] },
  brick:       { name:'Brick',       mats:[ mat(T.brick),       mat(T.brick),       mat(T.brick),       mat(T.brick),       mat(T.brick),       mat(T.brick)       ] },
  cobble:      { name:'Cobblestone', mats:[ mat(T.cobble),      mat(T.cobble),      mat(T.cobble),      mat(T.cobble),      mat(T.cobble),      mat(T.cobble)      ] },
  mossy:       { name:'Mossy Stone', mats:[ mat(T.mossy),       mat(T.mossy),       mat(T.mossy),       mat(T.mossy),       mat(T.mossy),       mat(T.mossy)       ] },
  goldBlock:   { name:'Gold Block',  mats:[ mat(T.goldBlock),   mat(T.goldBlock),   mat(T.goldBlock),   mat(T.goldBlock),   mat(T.goldBlock),   mat(T.goldBlock)   ] },
  ironBlock:   { name:'Iron Block',  mats:[ mat(T.ironBlock),   mat(T.ironBlock),   mat(T.ironBlock),   mat(T.ironBlock),   mat(T.ironBlock),   mat(T.ironBlock)   ] },
  diamondBlock:{ name:'Diamond',     mats:[ mat(T.diamondBlock),mat(T.diamondBlock),mat(T.diamondBlock),mat(T.diamondBlock),mat(T.diamondBlock),mat(T.diamondBlock)] },
  bookshelf:   { name:'Bookshelf',   mats:[ mat(T.bookshelf),   mat(T.bookshelf),   mat(T.booksTop),    mat(T.booksTop),    mat(T.bookshelf),   mat(T.bookshelf)   ] },
  tnt:         { name:'TNT',         mats:[ mat(T.tntSide),     mat(T.tntSide),     mat(T.tntTop),      mat(T.tntBottom),   mat(T.tntSide),     mat(T.tntSide)     ] },
  sponge:      { name:'Sponge',      mats:[ mat(T.sponge),      mat(T.sponge),      mat(T.sponge),      mat(T.sponge),      mat(T.sponge),      mat(T.sponge)      ] },
  torch:       { name:'Torch',       mats:[ mat(T.torch, { transparent:true, alphaTest:0.1, side:THREE.DoubleSide }) ] },
};
// Procedural meat texture — Minecraft raw beef style
function texMeat() {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,16,16);

  const px = (x,y,col) => { ctx.fillStyle=col; ctx.fillRect(x,y,1,1); };

  const RED   = '#c0392b';
  const DKRED = '#922b21';
  const LTRED = '#e74c3c';
  const PINK  = '#e8a09a';
  const FAT   = '#f5e6c8';
  const BONE  = '#f0ead2';
  const BONSH = '#ccc2a0';
  const SHADOW= '#6e1a10';

  // Steak outline (dark border)
  const outline = [
    [3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],
    [2,2],[10,2],
    [1,3],[11,3],
    [1,4],[11,4],
    [1,5],[11,4],
    [1,6],[11,6],
    [2,7],[10,7],
    [2,8],[10,8],
    [2,9],[9,9],
    [3,10],[4,10],[5,10],[6,10],[7,10],[8,10],
    // bone stem
    [3,11],[7,11],
    [4,12],[6,12],
    [5,13],
  ];
  outline.forEach(([x,y]) => px(x,y,SHADOW));

  // Meat fill
  for (let y=2;y<=9;y++) {
    for (let x=2;x<=10;x++) px(x,y,RED);
  }
  // Shape corrections
  px(2,2,SHADOW); px(10,2,SHADOW); px(1,3,SHADOW); px(11,3,SHADOW);
  // Trim corners
  [[2,2],[3,2],[2,3]].forEach(([x,y])=>px(x,y,RED));
  [[9,2],[10,2],[10,3]].forEach(([x,y])=>px(x,y,RED));

  // Fat cap top
  [2,3,4,5,6,7,8,9,10].forEach(x => px(x,2,FAT));
  [3,4,5,6,7,8,9].forEach(x => px(x,1,FAT));

  // Fat on left side
  px(2,3,FAT); px(2,4,FAT); px(2,5,FAT);
  px(2,6,RED); px(2,7,RED);

  // Marbling streaks
  const marble = [
    [4,4],[5,4],[6,4],
    [7,5],[8,5],
    [3,6],[4,6],
    [6,7],[7,7],[8,7],
    [5,5],
  ];
  marble.forEach(([x,y]) => px(x,y,PINK));

  // Fat flecks
  [[8,3],[9,4],[9,6],[3,8],[5,8],[8,8]].forEach(([x,y]) => px(x,y,FAT));

  // Highlights
  px(4,3,LTRED); px(5,3,LTRED); px(3,5,LTRED);

  // Shadows on right/bottom of meat
  [3,4,5,6,7,8,9].forEach(x => px(x,9,DKRED));
  [7,8,9].forEach(y => px(10,y,DKRED));

  // Bone handle
  px(4,10,BONE); px(5,10,BONE); px(6,10,BONE); px(7,10,BONE);
  px(4,11,BONE); px(5,11,BONE); px(6,11,BONE); px(7,11,BONE);
  px(5,12,BONE); px(6,12,BONE);
  px(5,13,BONE);
  // Bone shadow
  px(7,12,BONSH); px(7,11,BONSH); px(6,13,BONSH);

  return c;
}
const T_meat = toTexture(texMeat());
BLOCKS.meat     = { name:'Cooked Beef', mats:[ mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }) ] };
BLOCKS.raw_meat = { name:'Raw Beef',    mats:[ mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }), mat(T_meat, { transparent:true, alphaTest:0.1 }) ] };

// Apple item — placeholder texture (replaced by real MC PNG on load)
function texApplePlaceholder() {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,16,16);
  ctx.fillStyle = '#cc2200'; ctx.beginPath(); ctx.arc(8,9,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#553300'; ctx.fillRect(8,2,1,3);
  ctx.fillStyle = '#33aa00'; ctx.fillRect(9,2,3,2);
  return c;
}
const T_apple = toTexture(texApplePlaceholder());
const _appleMatOpts = { transparent:true, alphaTest:0.1 };
BLOCKS.apple = { name:'Apple', mats:[ mat(T_apple,_appleMatOpts), mat(T_apple,_appleMatOpts), mat(T_apple,_appleMatOpts), mat(T_apple,_appleMatOpts), mat(T_apple,_appleMatOpts), mat(T_apple,_appleMatOpts) ] };

// === Real Minecraft beef icons — update BLOCKS material so hand 3D item shows correct texture ===
const COOKED_BEEF_URL = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/item/cooked_beef.png';
const RAW_BEEF_URL    = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/item/beef.png';

function makeTexFromImg(img) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  c.getContext('2d').drawImage(img, 0, 0, 16, 16);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  return t;
}

function refreshItemIcon(type, img) {
  // Patch BLOCKS material so held 3D item uses CDN texture
  const newTex = makeTexFromImg(img);
  BLOCKS[type].mats.forEach(m => { m.map = newTex; m.needsUpdate = true; });
  if (typeof currentHeld !== 'undefined' && currentHeld === type) currentHeld = null;
  // Hotbar icons
  if (typeof hotbarEl !== 'undefined') {
    Array.from(hotbarEl.children).forEach((slot, i) => {
      if (HOTBAR[i] === type) {
        const icon = slot.querySelector('canvas.icon');
        if (icon) {
          const ictx = icon.getContext('2d');
          ictx.clearRect(0, 0, 64, 64);
          ictx.imageSmoothingEnabled = false;
          ictx.drawImage(img, 0, 0, 64, 64);
        }
      }
    });
  }
}

const meatIconImg = new Image();
meatIconImg.crossOrigin = 'anonymous';
meatIconImg.onload = () => { refreshItemIcon('meat', meatIconImg); currentHeld = null; updateHeldItem(); };
meatIconImg.src = COOKED_BEEF_URL;

const rawMeatIconImg = new Image();
rawMeatIconImg.crossOrigin = 'anonymous';
rawMeatIconImg.onload = () => { refreshItemIcon('raw_meat', rawMeatIconImg); currentHeld = null; updateHeldItem(); };
rawMeatIconImg.src = RAW_BEEF_URL;

// === Real Minecraft apple icon ===
const APPLE_URL = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/item/apple.png';
const appleIconImg = new Image();
appleIconImg.crossOrigin = 'anonymous';
appleIconImg.onload = () => { refreshItemIcon('apple', appleIconImg); currentHeld = null; updateHeldItem(); };
appleIconImg.src = APPLE_URL;

// Procedural leather texture — Minecraft leather item style (tan hide)
function texLeather() {
  const c = makeCanvas(16), ctx = c.getContext('2d');
  ctx.fillStyle = '#8B5A2B';  // leather base (tan brown)
  ctx.fillRect(0, 0, 16, 16);
  // Darker speckles for hide texture
  ctx.fillStyle = '#6B4520';
  [[3,2],[10,4],[5,8],[12,10],[2,12],[14,2],[7,13]].forEach(([x,y]) => ctx.fillRect(x, y, 2, 2));
  // Lighter highlights
  ctx.fillStyle = '#A0703A';
  [[6,3],[11,7],[3,11],[8,9],[13,13]].forEach(([x,y]) => ctx.fillRect(x, y, 1, 1));
  // Edge shadow (bottom + right)
  ctx.fillStyle = '#5A3A1A';
  for (let x = 0; x < 16; x++) ctx.fillRect(x, 15, 1, 1);
  for (let y = 0; y < 16; y++) ctx.fillRect(15, y, 1, 1);
  return c;
}
const T_leather = toTexture(texLeather());
BLOCKS.leather = { name:'Leather', mats:[ mat(T_leather), mat(T_leather), mat(T_leather), mat(T_leather), mat(T_leather), mat(T_leather) ] };

// Oak Sign — thin placeable sign; rendered as custom mesh (not a cube voxel).
// Icon uses a quick procedural wood planks look for the hotbar/inventory.
const T_signIcon = (() => {
  const c = makeCanvas(16), ctx = c.getContext('2d');
  ctx.fillStyle = '#c09050'; ctx.fillRect(0,0,16,16);
  ctx.fillStyle = '#a07040';
  for (let y=3;y<16;y+=4) ctx.fillRect(0,y,16,1);
  ctx.fillStyle = '#8a5c30';
  ctx.fillRect(0,13,16,3);
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(7,13,2,3);
  return c;
})();
const T_sign = toTexture(T_signIcon);
BLOCKS.sign = { name:'Oak Sign', mats:[ mat(T_sign), mat(T_sign), mat(T_sign), mat(T_sign), mat(T_sign), mat(T_sign) ] };

const HOTBAR = ['dirt','stone','sand','log','leaves','glass','oak',undefined];

/* ---------- 5. Scene setup ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 55, 110);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.getElementById('game').appendChild(renderer.domElement);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a7a44, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfffbe8, 0.75);
sun.position.set(40, 80, 30);
scene.add(sun);

// Moonlight (opposite to sun, dim blue-white)
const moon = new THREE.DirectionalLight(0x8899cc, 0.0);
scene.add(moon);

// ===== DAY / NIGHT CYCLE =====
// dayTime: 0 = midnight, 0.25 = noon, 0.5 = midnight, 0.75 = noon...
// Full cycle = 1200s (20 min), same as real Minecraft
let dayTime = 0.25; // start at noon
const DAY_SPEED = 1 / 1200;
let dayLocked = false; // when true, dayTime is frozen at noon

const _SKY_DAY   = new THREE.Color(0x87ceeb);
const _SKY_DAWN  = new THREE.Color(0xff8844);
const _SKY_NIGHT = new THREE.Color(0x07091a);
const _SUN_DAY   = new THREE.Color(0xfffbe8);
const _SUN_DAWN  = new THREE.Color(0xff9944);

function _lerpCol(a, b, t) {
  return new THREE.Color(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

function updateDayCycle(dt) {
  if (!dayLocked) dayTime = (dayTime + DAY_SPEED * dt) % 1;

  // Sun orbits: at dayTime=0.25 → top (noon), dayTime=0/0.5 → horizon, dayTime=0.75 → bottom (midnight)
  const angle = dayTime * Math.PI * 2; // 0 at midnight, PI/2 at noon
  const sinA = Math.sin(angle);   // +1 = noon, -1 = midnight
  const cosA = Math.cos(angle);

  // Sun & moon positions (opposite sides)
  sun.position.set(cosA * 100, sinA * 100, 40);
  moon.position.set(-cosA * 100, -sinA * 100, 40);

  // Day factor: 0 = full night, 1 = full noon
  const dayF   = Math.max(0, sinA);             // 0 night → 1 noon
  const horizF = Math.max(0, 1 - Math.abs(sinA) / 0.35); // peaks at horizon (sunrise/sunset)
  const clampedHorizF = Math.min(1, horizF);

  // Sky colour
  let skyCol;
  if (sinA <= 0) {
    // Night
    skyCol = _SKY_NIGHT.clone();
  } else if (sinA < 0.35) {
    // Dawn / dusk blend: night → dawn → day
    const t = sinA / 0.35;
    const dawnMix = Math.sin(t * Math.PI);      // bell curve peaking at mid-transition
    skyCol = _lerpCol(_lerpCol(_SKY_NIGHT, _SKY_DAY, t), _SKY_DAWN, dawnMix * 0.7);
  } else {
    skyCol = _SKY_DAY.clone();
  }

  scene.background = skyCol;
  scene.fog.color.copy(skyCol);

  // Ambient (hemi) light
  hemi.intensity = 0.04 + dayF * 0.81;

  // Sun intensity & colour
  sun.intensity = Math.max(0, sinA) * 0.75;
  const sunT = Math.min(1, sinA / 0.35);
  sun.color.copy(_lerpCol(_SUN_DAWN, _SUN_DAY, sunT));

  // Moon — faint at night only
  moon.intensity = Math.max(0, -sinA) * 0.18;
}

/* ---------- SFX: synthesized via Web Audio API (no external files) ---------- */
const SFX = (() => {
  let ctx = null;
  let masterGain = null;
  let lastFootstep = 0;
  let enabled = true;

  function ensure() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);
    } catch (e) { ctx = null; }
  }
  // Resume on first user gesture (browsers require this)
  function resume() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  document.addEventListener('click', resume, { once:false });
  document.addEventListener('touchstart', resume, { once:false });
  document.addEventListener('keydown', resume, { once:false });

  // Generic noise burst — used for footsteps, breaks, places
  function noiseBurst({ duration = 0.12, freq = 800, q = 1.0, gain = 0.4, type = 'bandpass', sweep = 0 } = {}) {
    if (!enabled) return;
    ensure(); if (!ctx) return;
    const now = ctx.currentTime;
    // Generate a short buffer of white noise
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = type; filt.frequency.value = freq; filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    if (sweep !== 0) {
      filt.frequency.setValueAtTime(freq, now);
      filt.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), now + duration);
    }
    src.connect(filt); filt.connect(g); g.connect(masterGain);
    src.start(now); src.stop(now + duration);
  }

  // Tone-ish thud (for place) — short sine + noise
  function thud({ freq = 180, gain = 0.45, duration = 0.18 } = {}) {
    if (!enabled) return;
    ensure(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + duration);
    // plus a soft noise click for "block settling"
    noiseBurst({ duration: 0.06, freq: 2200, q: 0.7, gain: 0.15, type: 'bandpass' });
  }

  // Footstep: very short filtered noise — pitch varies with surface block type
  function footstep(surfaceType) {
    const now = performance.now();
    if (now - lastFootstep < 220) return; // throttle
    lastFootstep = now;
    let freq = 500, q = 0.8, gain = 0.18, dur = 0.07;
    if (surfaceType === 'stone') { freq = 380; q = 1.2; gain = 0.22; }
    else if (surfaceType === 'sand') { freq = 300; q = 0.6; gain = 0.16; dur = 0.09; }
    else if (surfaceType === 'wood' || surfaceType === 'log') { freq = 280; q = 1.4; gain = 0.24; dur = 0.08; }
    else if (surfaceType === 'leaves') { freq = 700; q = 0.4; gain = 0.12; }
    else { freq = 500; q = 0.8; } // grass/dirt default
    noiseBurst({ duration: dur, freq, q, gain, type: 'lowpass' });
  }

  // Break: noisy crunch with downward sweep. Pitch depends on block hardness.
  function breakBlock(type) {
    let freq = 900, sweep = -500, gain = 0.4, dur = 0.22, q = 0.7;
    if (type === 'stone') { freq = 700; sweep = -400; gain = 0.45; dur = 0.28; }
    else if (type === 'log') { freq = 600; sweep = -200; gain = 0.4; dur = 0.2; q = 1.2; }
    else if (type === 'sand') { freq = 1400; sweep = -700; gain = 0.35; dur = 0.25; q = 0.5; }
    else if (type === 'leaves') { freq = 2000; sweep = -800; gain = 0.25; dur = 0.18; q = 0.4; }
    else if (type === 'dirt' || type === 'grass') { freq = 800; sweep = -400; gain = 0.4; dur = 0.22; }
    noiseBurst({ duration: dur, freq, q, gain, sweep, type: 'bandpass' });
  }

  // Place: short tonal thud (block snapping into position)
  function placeBlock(type) {
    let freq = 200;
    if (type === 'stone') freq = 160;
    else if (type === 'log') freq = 240;
    else if (type === 'sand') freq = 220;
    else if (type === 'leaves') freq = 320;
    thud({ freq, gain: 0.4, duration: 0.16 });
  }

  // Explosion: layered boom + debris noise
  function explosion() {
    if (!enabled) return;
    ensure(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.65);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, now);
    g1.gain.exponentialRampToValueAtTime(0.75, now + 0.012);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc.connect(g1); g1.connect(masterGain);
    osc.start(now); osc.stop(now + 0.65);
    noiseBurst({ duration: 0.55, freq: 350, q: 0.25, gain: 0.65, sweep: -280, type: 'bandpass' });
    noiseBurst({ duration: 0.28, freq: 1600, q: 0.4, gain: 0.38, sweep: -1100, type: 'highpass' });
  }

  // Cow hit: fleshy thwack
  function cowHit() {
    noiseBurst({ duration: 0.09, freq: 320, q: 1.2, gain: 0.35, type: 'bandpass' });
    thud({ freq: 140, gain: 0.28, duration: 0.12 });
  }

  return {
    footstep, break: breakBlock, place: placeBlock,
    explosion, cowHit,
    setEnabled: (v) => { enabled = v; if (v) resume(); },
    isEnabled: () => enabled,
    resume,
  };
})();

/* ---------- 6. World generation ---------- */
const WORLD = 64;       // width/depth
const HALF = WORLD / 2;
const WATER_LEVEL = 6;  // y of water surface
const SEA_FLOOR = 2;
const MAX_TERRAIN_Y = 52; // highest possible block

// ---- Proper 2D gradient (Perlin) noise — seeded ----
function makePerlin2D(seed) {
  const rng2 = mulberry32(seed);
  const SZ = 256;
  const perm = new Uint8Array(SZ * 2);
  const tmp  = new Uint8Array(SZ);
  for (let i = 0; i < SZ; i++) tmp[i] = i;
  for (let i = SZ - 1; i > 0; i--) { const j=(rng2()*(i+1))|0; const t=tmp[i]; tmp[i]=tmp[j]; tmp[j]=t; }
  for (let i = 0; i < SZ*2; i++) perm[i] = tmp[i & (SZ-1)];
  const G2 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a+t*(b-a); }
  function grad(h,x,z){ const g=G2[h&7]; return g[0]*x+g[1]*z; }
  return function(x, z) {
    const xi=Math.floor(x)&255, zi=Math.floor(z)&255;
    const xf=x-Math.floor(x), zf=z-Math.floor(z);
    const u=fade(xf), v=fade(zf);
    const a=perm[xi]+zi, b=perm[xi+1]+zi;
    return lerp(
      lerp(grad(perm[a  ],xf  ,zf  ), grad(perm[b  ],xf-1,zf  ), u),
      lerp(grad(perm[a+1],xf  ,zf-1), grad(perm[b+1],xf-1,zf-1), u), v);
  };
}

// ---- 3D Perlin noise for cave carving ----
function makePerlin3D(seed) {
  const rng2 = mulberry32(seed);
  const SZ = 256;
  const perm = new Uint8Array(SZ * 2);
  const tmp  = new Uint8Array(SZ);
  for (let i = 0; i < SZ; i++) tmp[i] = i;
  for (let i = SZ-1; i > 0; i--) { const j=(rng2()*(i+1))|0; const t=tmp[i]; tmp[i]=tmp[j]; tmp[j]=t; }
  for (let i = 0; i < SZ*2; i++) perm[i] = tmp[i & (SZ-1)];
  const G3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a+t*(b-a); }
  function grad(h,x,y,z){ const g=G3[h%12]; return g[0]*x+g[1]*y+g[2]*z; }
  return function(x,y,z) {
    const xi=Math.floor(x)&255, yi=Math.floor(y)&255, zi=Math.floor(z)&255;
    const xf=x-Math.floor(x), yf=y-Math.floor(y), zf=z-Math.floor(z);
    const u=fade(xf), v=fade(yf), w=fade(zf);
    const aaa=perm[perm[perm[xi  ]+yi  ]+zi  ],aba=perm[perm[perm[xi  ]+yi+1]+zi  ];
    const aab=perm[perm[perm[xi  ]+yi  ]+zi+1],abb=perm[perm[perm[xi  ]+yi+1]+zi+1];
    const baa=perm[perm[perm[xi+1]+yi  ]+zi  ],bba=perm[perm[perm[xi+1]+yi+1]+zi  ];
    const bab=perm[perm[perm[xi+1]+yi  ]+zi+1],bbb=perm[perm[perm[xi+1]+yi+1]+zi+1];
    return lerp(
      lerp(lerp(grad(aaa,xf,yf,zf),grad(baa,xf-1,yf,zf),u),lerp(grad(aba,xf,yf-1,zf),grad(bba,xf-1,yf-1,zf),u),v),
      lerp(lerp(grad(aab,xf,yf,zf-1),grad(bab,xf-1,yf,zf-1),u),lerp(grad(abb,xf,yf-1,zf-1),grad(bbb,xf-1,yf-1,zf-1),u),v),
      w);
  };
}

// Fractal Brownian Motion (layered octaves of noise)
function fbm2(nfn, x, z, octs, persist, lacun) {
  let v=0, amp=1, freq=1, mx=0;
  for (let i=0; i<octs; i++) { v+=nfn(x*freq,z*freq)*amp; mx+=amp; amp*=persist; freq*=lacun; }
  return v/mx;
}

// block store: key "x,y,z" -> type
const blocks = new Map();
function key(x,y,z){ return x+','+y+','+z; }
function setBlock(x,y,z,type){ blocks.set(key(x,y,z), type); }
function getBlock(x,y,z){ return blocks.get(key(x,y,z)); }
function delBlock(x,y,z){ blocks.delete(key(x,y,z)); }

// Seedable PRNG (mulberry32) so a multiplayer world_id always generates the
// SAME terrain (tree placement etc.) on every player's machine. Singleplayer
// just uses Math.random (no need to reproduce it elsewhere).
let rng = Math.random;
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStringToSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return h >>> 0;
}
// Fast integer hash for deterministic ore placement (no RNG needed)
function hashOre(x, y, z) {
  let h = (x * 374761393 + y * 1234567891 + z * 987654321) | 0;
  h ^= h >>> 13; h = Math.imul(h, 1540483477); h ^= h >>> 15;
  return (h >>> 0);
}

function generate() {
  // ── Noise layers ─────────────────────────────────────────────────────────
  const nContinent = makePerlin2D(13579);  // large-scale land/sea shape
  const nRidge     = makePerlin2D(24680);  // mountain ridge lines
  const nDetail    = makePerlin2D(97531);  // fine surface texture
  const nTemp      = makePerlin2D(55123);  // temperature (biome)
  const nMoist     = makePerlin2D(86420);  // moisture (biome)
  const nCave1     = makePerlin3D(11111);  // cave worm A
  const nCave2     = makePerlin3D(33333);  // cave worm B

  // ── Helpers ───────────────────────────────────────────────────────────────
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function lerpH(a, b, t) { return a + clamp01(t) * (b - a); }
  function sstep(e0, e1, x) { const t=clamp01((x-e0)/(e1-e0)); return t*t*(3-2*t); }

  // ── Spline: continent noise → base height ─────────────────────────────────
  // The KEY to Minecraft-style terrain: a wide noise range maps to FLAT plains
  // (small height delta), while a narrow range maps to STEEP mountains (large delta).
  // Breakpoints: [continent_value, world_y]
  // NOTE: fbm2 Perlin output is practically bounded ~[-0.55, 0.55], so spline
  // must be calibrated to that range — NOT to the theoretical [-1, 1].
  const SPLINE = [
    [-0.55,  1],  // abyssal ocean floor
    [-0.38,  2],  // deep ocean
    [-0.18,  4],  // shallow ocean
    [-0.05,  6],  // coast (water level edge)
    [ 0.00,  7],  // sandy beach
    [ 0.06,  9],  // plains start
    [ 0.20, 11],  // plains end     ← wide range = FLAT
    [ 0.30, 16],  // foothills      ← terrain rises
    [ 0.40, 24],  // mountain base
    [ 0.50, 32],  // upper mountain
    [ 0.58, 40],  // extreme peak
  ];
  function splineHeight(c) {
    for (let i = 1; i < SPLINE.length; i++) {
      if (c <= SPLINE[i][0]) {
        const t = (c - SPLINE[i-1][0]) / (SPLINE[i][0] - SPLINE[i-1][0]);
        return SPLINE[i-1][1] + clamp01(t) * (SPLINE[i][1] - SPLINE[i-1][1]);
      }
    }
    return SPLINE[SPLINE.length-1][1];
  }

  // ── Per-column height ─────────────────────────────────────────────────────
  // 1. Continental shape (very low freq) feeds the spline → flat plains + ocean
  // 2. Ridge noise (1-|noise|)² adds sharp mountain peaks only on high ground
  // 3. Small detail noise adds realistic surface roughness everywhere
  function getHeight(x, z) {
    const cx = x * 0.018, cz = z * 0.018;  // was 0.0055 — increased so 64-block world spans full noise range
    const continent = fbm2(nContinent, cx, cz, 5, 0.52, 2.05);
    const base = splineHeight(continent);

    // Ridge noise: transforms smooth humps into sharp ridges by taking (1-|n|)^2
    const mtnMask = sstep(0.30, 0.46, continent); // start ridge only well into foothills
    const rv = fbm2(nRidge, x * 0.060, z * 0.060, 5, 0.55, 2.1);
    const ridge = Math.pow(Math.max(0, 1.0 - Math.abs(rv) * 1.8), 2.5);
    const mtnAdd = ridge * mtnMask * 16;

    // Detail: gentle surface roughness — keep low so beaches & plains stay at correct height
    const landMask = sstep(-0.15, 0.15, continent);
    const detail = fbm2(nDetail, x * 0.10, z * 0.10, 4, 0.5, 2.1) * 1.0 * landMask;

    return base + mtnAdd + detail;
  }

  // ── Biome ─────────────────────────────────────────────────────────────────
  function getBiome(x, z, continent, height) {
    if (continent < -0.05) return 'ocean';
    const temp  = fbm2(nTemp,  x * 0.011 + 300, z * 0.011 + 300, 3, 0.6, 2.0);
    const moist = fbm2(nMoist, x * 0.011 - 300, z * 0.011 - 300, 3, 0.6, 2.0);
    if (height >= 26) return temp < -0.1 ? 'tundra' : 'mountains';
    if (temp  < -0.28) return 'tundra';
    if (temp  >  0.32 && moist < 0.05) return 'desert';
    if (moist >  0.20) return 'forest';
    return 'plains';
  }

  // ── Main generation loop ───────────────────────────────────────────────────
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      const continent = fbm2(nContinent, x*0.018, z*0.018, 5, 0.52, 2.05);
      const rawH   = getHeight(x, z);
      const height = Math.max(1, Math.min(MAX_TERRAIN_Y, Math.round(rawH)));
      const biome  = getBiome(x, z, continent, height);

      // Bedrock
      setBlock(x, 0, z, 'bedrock');

      for (let y = 1; y <= height; y++) {
        // ── Cave carving ─────────────────────────────────────────────────────
        // Worm caves: two 3D noise channels; where both approach 0 a tunnel exists.
        // Only carve well below surface and not in shallow ocean floor.
        if (y >= 2 && y <= height - 2 && height > 9) {
          const c1 = nCave1(x * 0.08, y * 0.10, z * 0.08);
          const c2 = nCave2(x * 0.08 + 53, y * 0.10 + 53, z * 0.08 + 53);
          if (c1 * c1 + c2 * c2 < 0.065) continue; // air — cave
        }

        // ── Block selection ────────────────────────────────────────────────
        const fromTop = height - y; // 0 = surface
        let block;

        if (fromTop === 0) {
          if (height <= WATER_LEVEL + 1) {
            block = 'sand'; // ocean floor / beach — all sand
          } else if (biome === 'desert') {
            block = 'sand';
          } else if (biome === 'tundra' || height >= 30) {
            block = 'snow';     // tundra & high alpine
          } else if (height >= 24) {
            block = 'stone';    // exposed rocky peak
          } else {
            block = 'grass';
          }
        } else if (fromTop <= 3) {
          if (biome === 'desert' || height <= WATER_LEVEL + 2) {
            block = 'sand';
          } else if (height >= 24 || biome === 'tundra') {
            block = 'stone';
          } else {
            block = 'dirt';
          }
        } else {
          block = 'stone';
          // Ore veins — only deep underground stone
          if (y <= height - 4) {
            const h = hashOre(x, y, z);
            if (y <= 12 && (h % 14) === 0) block = 'ironOre';  // iron: deep, rarer
            else if ((h % 7) === 0)         block = 'coalOre';  // coal: common, any depth
          }
        }

        setBlock(x, y, z, block);
      }

      // Water fill
      if (height < WATER_LEVEL) {
        for (let y = height + 1; y <= WATER_LEVEL; y++) setBlock(x, y, z, 'water');
      }
    }
  }

  // ── Trees ────────────────────────────────────────────────────────────────
  for (let x = -HALF + 4; x < HALF - 4; x++) {
    for (let z = -HALF + 4; z < HALF - 4; z++) {
      let topY = -1;
      for (let y = MAX_TERRAIN_Y; y >= 1; y--) {
        const b = getBlock(x, y, z);
        if (b && b !== 'water') { topY = y; break; }
      }
      if (topY < 0 || topY <= WATER_LEVEL + 1) continue;

      const topBlock  = getBlock(x, topY, z);
      const continent = fbm2(nContinent, x*0.018, z*0.018, 5, 0.52, 2.05);
      const biome     = getBiome(x, z, continent, topY);

      if (topBlock === 'grass') {
        if      (biome === 'forest' && rng() < 0.055) plantTree(x, topY+1, z, 'tall');
        else if (biome === 'plains' && rng() < 0.020) plantTree(x, topY+1, z, 'normal');
        else if (biome === 'mountains' && rng() < 0.012) plantTree(x, topY+1, z, 'pine');
      } else if (topBlock === 'snow' && biome === 'tundra' && rng() < 0.015) {
        plantTree(x, topY+1, z, 'pine');
      }
    }
  }
}

function plantTree(x, y, z, style) {
  if (style === 'tall') {
    // Tall forest tree: 6-8 trunk, wide 5x5 canopy
    const trunk = 6 + ((rng()*3)|0);
    for (let i = 0; i < trunk; i++) setBlock(x, y + i, z, 'log');
    const topY = y + trunk;
    for (let ly = topY - 3; ly <= topY + 1; ly++) {
      const radius = (ly <= topY - 1) ? 2 : 1;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) === radius && Math.abs(dz) === radius) continue; // round corners
          if (dx === 0 && dz === 0 && ly < topY - 1) continue; // trunk gap
          if (!getBlock(x+dx, ly, z+dz)) setBlock(x+dx, ly, z+dz, 'leaves');
        }
      }
    }
  } else if (style === 'pine') {
    // Pine/spruce: tall narrow tree with tiered layers (tundra/snowy)
    const trunk = 7 + ((rng()*3)|0);
    for (let i = 0; i < trunk; i++) setBlock(x, y + i, z, 'log');
    const topY = y + trunk;
    // Tiered layers from top down, shrinking radii
    for (let layer = 0; layer <= 5; layer++) {
      const ly = topY - layer;
      const radius = Math.min(3, Math.floor(layer * 0.7));
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) + Math.abs(dz) > radius + (radius > 1 ? 1 : 0)) continue;
          if (!getBlock(x+dx, ly, z+dz)) setBlock(x+dx, ly, z+dz, 'leaves');
        }
      }
    }
  } else {
    // Normal plains tree: 4-5 trunk, 3x3 canopy
    const trunk = 4 + ((rng()*2)|0);
    for (let i = 0; i < trunk; i++) setBlock(x, y + i, z, 'log');
    const topY = y + trunk;
    for (let ly = topY - 1; ly <= topY + 1; ly++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0 && ly < topY) continue;
          if (ly === topY + 1 && Math.abs(dx) + Math.abs(dz) > 1) continue;
          if (!getBlock(x+dx, ly, z+dz)) setBlock(x+dx, ly, z+dz, 'leaves');
        }
      }
    }
  }
}

generate();

/* ---------- 4b. Grass detail tufts ---------- */
// Small billboard sprites scattered on top of grass blocks for "grass detail".
// Uses InstancedMesh so all tufts render in a single draw call.
const tuftGeo = new THREE.PlaneGeometry(0.7, 0.7);
const tuftMat = new THREE.MeshLambertMaterial({
  map: T.grassTuft,
  transparent: true,
  alphaTest: 0.4,
  side: THREE.DoubleSide,
  depthWrite: false,
});
let tuftMesh = null;

function rebuildGrassTufts() {
  if (tuftMesh) {
    scene.remove(tuftMesh);
    tuftMesh.dispose && tuftMesh.dispose();
    tuftMesh = null;
  }
  // Seeded RNG so tuft placement is deterministic across rebuilds (no flicker).
  const rng = mulberry32(98765);
  const positions = [];
  const rotY = [];
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      // find top solid (non-water) block
      let topY = -1, topType = null;
      for (let y = MAX_TERRAIN_Y; y >= 1; y--) {
        const b = getBlock(x, y, z);
        if (b && b !== 'water') { topY = y; topType = b; break; }
      }
      if (topType !== 'grass') continue;
      // skip if there's a block directly above (e.g. tree trunk or player-built)
      if (getBlock(x, topY + 1, z)) continue;
      if (rng() < 0.4) {
        const n = 1 + Math.floor(rng() * 2);
        for (let t = 0; t < n; t++) {
          positions.push(new THREE.Vector3(
            x + 0.5 + (rng() - 0.5) * 0.6,
            topY + 1.05,
            z + 0.5 + (rng() - 0.5) * 0.6
          ));
          rotY.push(rng() * Math.PI);
        }
      }
    }
  }
  if (positions.length === 0) return;
  tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, positions.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  const axis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < positions.length; i++) {
    q.setFromAxisAngle(axis, rotY[i]);
    m.compose(positions[i], q, s);
    tuftMesh.setMatrixAt(i, m);
  }
  tuftMesh.instanceMatrix.needsUpdate = true;
  scene.add(tuftMesh);
}
rebuildGrassTufts();

/* ---------- 7. Build merged BufferGeometry per block type ---------- */
// Face definitions: normal + 4 corner offsets (CCW when viewed from outside)
const FACES = [
  { dir:[ 1,0,0], n:[ 1,0,0], corners:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]] }, // +X
  { dir:[-1,0,0], n:[-1,0,0], corners:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]] }, // -X
  { dir:[0, 1,0], n:[0, 1,0], corners:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]] }, // +Y top
  { dir:[0,-1,0], n:[0,-1,0], corners:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]] }, // -Y bottom
  { dir:[0,0, 1], n:[0,0, 1], corners:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]] }, // +Z
  { dir:[0,0,-1], n:[0,0,-1], corners:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }, // -Z
];

// per face UVs (matching corner order)
const FACE_UV = [
  [ [0,0],[0,1],[1,1],[1,0] ],
];

function isTransparent(type) { return type === 'water' || type === 'leaves' || type === 'torch'; }

function buildMeshes() {
  // For each block type, build a BufferGeometry with only visible faces
  // Group water separately so it renders last

  const groups = {}; // type -> {positions:[], normals:[], uvs:[], indices:[]}
  for (const t of Object.keys(BLOCKS)) groups[t] = geoBucket();

  function geoBucket() { return { positions:[], normals:[], uvs:[], indices:[], idx:0 }; }

  for (const [k, type] of blocks.entries()) {
    const [x,y,z] = k.split(',').map(Number);
    if (type === 'sign' || type === 'torch') continue; // rendered as custom sprite meshes
    if (type === 'water') {
      // only render top face of water (and skip if block above is water)
      // We'll handle water specially: render +Y face only, and side faces if adjacent to non-water
      for (const f of FACES) {
        const nx = x + f.dir[0], ny = y + f.dir[1], nz = z + f.dir[2];
        const nb = getBlock(nx, ny, nz);
        if (nb === 'water') continue;
        if (nb && nb !== 'leaves') {
          // skip faces hidden by opaque neighbor
          // but allow top face to render even if neighbor exists? top of water has no neighbor.
          if (f.dir[1] !== 1) continue;
        }
        // for water top face, lower it slightly for visual
        addFace(groups.water, x, y, z, f, type, 0.9);
      }
      continue;
    }

    for (const f of FACES) {
      const nx = x + f.dir[0], ny = y + f.dir[1], nz = z + f.dir[2];
      const nb = getBlock(nx, ny, nz);
      // hide face if neighbor is opaque solid
      if (nb && !isTransparent(nb)) continue;
      // for leaves, hide faces between adjacent leaves (still renders outer)
      if (type === 'leaves' && nb === 'leaves') continue;
      addFace(groups[type], x, y, z, f, type, 1.0);
    }
  }

  function addFace(g, x, y, z, f, type, heightScale) {
    const matIndex = FACES.indexOf(f);
    // UVs from block def
    const uv = FACE_UV[0];
    for (let i = 0; i < 4; i++) {
      const c = f.corners[i];
      const cy = c[1] === 1 ? (heightScale === 1 ? 1 : heightScale) : c[1];
      g.positions.push(x + c[0], y + cy, z + c[2]);
      g.normals.push(...f.n);
      g.uvs.push(uv[i][0], uv[i][1]);
    }
    const base = g.idx;
    g.indices.push(base, base+1, base+2, base, base+2, base+3);
    g.idx += 4;
  }

  // Build meshes. For multi-material blocks (grass, log) we use a single geometry per material face set.
  // Better: one geometry per type, but use 6 groups + 6 materials.
  const out = [];
  for (const type of Object.keys(BLOCKS)) {
    if (type === 'sign') continue; // rendered as custom mesh
    const g = groups[type];
    if (g.positions.length === 0) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(g.normals, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(g.uvs, 2));
    geo.setIndex(g.indices);

    if (type === 'grass' || type === 'log' || type === 'snow') {
      // 6 materials; one geometry per type, with 6 face groups for 6 materials
      const mesh = buildGroupedGeometry(type); // returns Mesh (already added to scene inside)
      if (mesh) out.push(mesh);
    } else {
      geo.computeBoundingSphere();
      const mat = BLOCKS[type].mats[0];
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.type = type;
      if (type === 'water') mesh.renderOrder = 10; // render water last for transparency
      out.push(mesh);
    }
  }
  return out;
}

// For multi-material blocks (grass, log): one geometry with 6 groups (one per face direction)
function buildGroupedGeometry(type) {
  const positions = [], normals = [], uvs = [];
  const faceGroups = [[],[],[],[],[],[]]; // 6 face dirs
  let idx = 0;

  for (const [k, t] of blocks.entries()) {
    if (t !== type) continue;
    const [x,y,z] = k.split(',').map(Number);

    for (let fi = 0; fi < FACES.length; fi++) {
      const f = FACES[fi];
      const nx = x + f.dir[0], ny = y + f.dir[1], nz = z + f.dir[2];
      const nb = getBlock(nx, ny, nz);
      if (nb && !isTransparent(nb)) continue;
      if (t === 'leaves' && nb === 'leaves') continue;

      const uv = FACE_UV[0];
      for (let i = 0; i < 4; i++) {
        const c = f.corners[i];
        positions.push(x + c[0], y + c[1], z + c[2]);
        normals.push(...f.n);
        uvs.push(uv[i][0], uv[i][1]);
      }
      const base = idx;
      faceGroups[fi].push(base, base+1, base+2, base, base+2, base+3);
      idx += 4;
    }
  }

  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));

  let offset = 0;
  const allIdx = [];
  const groups = [];
  for (let fi = 0; fi < 6; fi++) {
    if (faceGroups[fi].length === 0) {
      groups.push({ start: offset, count: 0, materialIndex: fi });
      continue;
    }
    allIdx.push(...faceGroups[fi]);
    groups.push({ start: offset, count: faceGroups[fi].length, materialIndex: fi });
    offset += faceGroups[fi].length;
  }
  geo.setIndex(allIdx);
  for (const gr of groups) geo.addGroup(gr.start, gr.count, gr.materialIndex);

  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, BLOCKS[type].mats); // multi-material array
  mesh.userData.type = type;
  scene.add(mesh);
  return mesh;
}

let meshes = buildMeshes();
let meshDirty = false;
let grassDirty = false;
// buildMeshes returns array of all block meshes. grass/log were added to scene
// inside buildGroupedGeometry; single-material meshes need to be added here.
for (const m of meshes) {
  if (!m.parent) scene.add(m);
}

// Ocean floor under everything — visible past the world's edges as open water
// instead of a black void. Uses the water texture with a high repeat and a deep
// blue tint so it reads as ocean. The texture offset is animated in the loop.
const floorTex = T.water.clone();
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(WORLD / 2, WORLD / 2);
floorTex.needsUpdate = true;
const floorGeo = new THREE.PlaneGeometry(WORLD * 6, WORLD * 6);
floorGeo.rotateX(-Math.PI / 2);
const floor = new THREE.Mesh(floorGeo, new THREE.MeshLambertMaterial({
  map: floorTex,
  color: 0x3a6a9a,
  transparent: true,
  opacity: 0.92,
}));
floor.position.y = -0.5;
scene.add(floor);

/* ---------- 8. Player controller ---------- */
const player = {
  pos: new THREE.Vector3(0, 14, 0),
  vel: new THREE.Vector3(),
  yaw: 0, pitch: 0,
  onGround: false,
  height: 1.7,
  width: 0.3,
  eye: 1.6,
  // --- vitals (Minecraft-style: 20 = 10 icons, each icon = 2 points) ---
  health: 20, maxHealth: 20,
  hunger: 20, maxHunger: 20,

  // --- fall-damage tracking ---
  fallStart: null,   // y-coord where the fall began
  hungerTimer: 0,    // accumulates dt for slow hunger drain
  regenTimer: 0,     // accumulates dt for slow health regen
  flying: false,     // fly mode toggle
  sneaking: false,   // sneak toggle
};
function spawnPlayer() {
  // find a grass top near center
  for (let r = 0; r < 6; r++) {
    for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) {
      for (let y = MAX_TERRAIN_Y + 5; y >= 1; y--) {
        const b = getBlock(x, y, z);
        if (b && b !== 'water') {
          player.pos.set(x + 0.5, y + 1 + player.height, z + 0.5);
          return;
        }
      }
    }
  }
  player.pos.set(0.5, 20, 0.5);
}
spawnPlayer();

const keys = {};
addEventListener('keydown', e => { if (chatOpen) return; keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); });
addEventListener('keyup',   e => { if (chatOpen) return; keys[e.code] = false; });

// ---------- Fly toggle ----------
function setFly(enabled) {
  player.flying = enabled;
  if (enabled) {
    player.vel.y = 0;
    player.fallStart = null;
    document.getElementById('m-fly-down').classList.remove('hidden');
    document.getElementById('m-jump').textContent = '▲ UP';
  } else {
    joy.flyDown = false;
    document.getElementById('m-fly-down').classList.add('hidden');
    document.getElementById('m-jump').textContent = 'JUMP';
  }
}
addEventListener('keydown', e => {
  if (chatOpen) return;
  if (e.code === 'KeyF' && (locked || isMobile())) {
    setFly(!player.flying);
  }
});

// pointer lock
const canvas = renderer.domElement;
let locked = false;
canvas.addEventListener('click', () => { if (!locked && !isMobile()) canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
  locked = (document.pointerLockElement === canvas);
  if (!locked) {
    if (chatOpen) closeChat();
    // Only show pause menu when a world is loaded (overlay is hidden)
    if (overlay.classList.contains('hidden')) openPauseMenu();
  } else { closePauseMenu(); hideOverlay(); showChatHint(); }
});
document.addEventListener('mousemove', e => {
  if (!locked) return;
  player.yaw   -= e.movementX * getMouseSens();
  player.pitch -= e.movementY * getMouseSens();
  player.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, player.pitch));
});

/* ---------- 9. Collision ---------- */
function solidAt(x, y, z) {
  const b = getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
  if (!b) return false;
  if (b === 'water' || b === 'torch') return false;
  return true;
}
function collidesPlayer(px, py, pz) {
  const w = player.width, h = player.height;
  const minX = Math.floor(px - w), maxX = Math.floor(px + w);
  const minY = Math.floor(py - h), maxY = Math.floor(py + 0.1);
  const minZ = Math.floor(pz - w), maxZ = Math.floor(pz + w);
  for (let x = minX; x <= maxX; x++)
    for (let y = minY; y <= maxY; y++)
      for (let z = minZ; z <= maxZ; z++)
        if (solidAt(x + 0.5, y + 0.5, z + 0.5)) return true;
  return false;
}

function moveAndCollide(dt) {
  const speed = 4.3;
  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right   = new THREE.Vector3( Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  const move = new THREE.Vector3();
  if (keys['KeyW']) move.add(forward);
  if (keys['KeyS']) move.sub(forward);
  if (keys['KeyD']) move.add(right);
  if (keys['KeyA']) move.sub(right);

  // joystick input (mobile)
  if (joy.active) {
    move.add(forward.clone().multiplyScalar(-joy.y));
    move.add(right.clone().multiplyScalar(joy.x));
  }
  // D-pad input (mobile)
  if (dpadState.up)    move.add(forward);
  if (dpadState.down)  move.sub(forward);
  if (dpadState.right) move.add(right);
  if (dpadState.left)  move.sub(right);

  // Keyboard sneak: hold Shift while on ground (desktop)
  if (!player.flying) {
    if ((keys['ShiftLeft'] || keys['ShiftRight']) && player.onGround) {
      player.sneaking = true;
    } else if (!(keys['ShiftLeft'] || keys['ShiftRight'])) {
      // Only clear keyboard-sneak if not mobile-sneaking
      // (mobile sneak toggled separately via dpad center)
    }
  }

  // Sneak cancels when going airborne; sync UI
  if (player.sneaking && !player.onGround) {
    player.sneaking = false;
    const ce = document.getElementById('dpad-center');
    const sl = document.getElementById('sneak-label');
    if (ce) ce.classList.remove('sneaking');
    if (sl) sl.classList.remove('active');
  }

  const sneakMult = player.sneaking ? 0.3 : 1.0;
  if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * sneakMult * dt);

  if (player.flying) {
    // ---- FLY MODE: no gravity, free vertical movement ----
    player.vel.y = 0;
    let flyVert = 0;
    if (keys['Space'] || joy.jump)                                flyVert =  1;
    if (keys['ShiftLeft'] || keys['ShiftRight'] || joy.flyDown)  flyVert = -1;
    const FLY_SPEED = 6;
    // horizontal
    let nx = player.pos.x + move.x;
    if (!collidesPlayer(nx, player.pos.y, player.pos.z)) player.pos.x = nx;
    let nz = player.pos.z + move.z;
    if (!collidesPlayer(player.pos.x, player.pos.y, nz)) player.pos.z = nz;
    // vertical
    let ny = player.pos.y + flyVert * FLY_SPEED * dt;
    if (!collidesPlayer(player.pos.x, ny, player.pos.z)) player.pos.y = ny;
    player.onGround = false;
    player.fallStart = null;
  } else {
  // ---- NORMAL MODE ----

  // Water immersion check (feet block or mid-body block)
  const _wbx = Math.floor(player.pos.x), _wbz = Math.floor(player.pos.z);
  const _feetY = Math.floor(player.pos.y - player.height + 0.1);
  const _midY  = Math.floor(player.pos.y - player.height * 0.5);
  const inWater = getBlock(_wbx, _feetY, _wbz) === 'water'
               || getBlock(_wbx, _midY,  _wbz) === 'water';

  if (inWater) {
    // Buoyancy: net upward force makes player float to surface
    // Equilibrium speed = net_force / drag_coeff = 4/5 ≈ 0.8 m/s upward
    player.vel.y -= 22 * dt;        // gravity
    player.vel.y += 26 * dt;        // buoyancy (net +4 upward)
    player.vel.y -= player.vel.y * 5 * dt; // water drag
    player.vel.y = Math.max(-3, Math.min(5, player.vel.y));

    // Swim up with Space / jump button
    if (keys['Space'] || joy.jump) player.vel.y = Math.max(player.vel.y, 3.0);
    // Sink with sneak
    if (player.sneaking || keys['ShiftLeft'] || keys['ShiftRight']) player.vel.y = -2.0;
    // D-pad jump button also swims up
    if (joy.jump) player.vel.y = Math.max(player.vel.y, 3.0);

    // Slow horizontal movement in water
    move.multiplyScalar(0.45);

    player.fallStart = null; // no fall damage entering water
  } else {
    // gravity
    player.vel.y -= 22 * dt;
    if (player.vel.y < -30) player.vel.y = -30;

    // jump
    if ((keys['Space'] || joy.jump) && player.onGround) {
      player.vel.y = 7.6;
      player.onGround = false;
    }
  }

  // X axis
  let nx = player.pos.x + move.x;
  if (!collidesPlayer(nx, player.pos.y, player.pos.z)) player.pos.x = nx;
  // Z axis
  let nz = player.pos.z + move.z;
  if (!collidesPlayer(player.pos.x, player.pos.y, nz)) player.pos.z = nz;
  // Y axis
  let ny = player.pos.y + player.vel.y * dt;
  const wasOnGround = player.onGround;
  player.onGround = false;
  if (!collidesPlayer(player.pos.x, ny, player.pos.z)) {
    player.pos.y = ny;
    // Track fall start: when beginning to descend
    if (player.vel.y < 0 && player.fallStart === null) {
      player.fallStart = player.pos.y;
    }
  } else {
    if (player.vel.y < 0) {
      player.onGround = true;
      // Compute fall damage on landing
      if (player.fallStart !== null) {
        const fallDist = player.fallStart - player.pos.y;
        // 3-block fall = no damage; >3 blocks = (dist-3) damage
        if (fallDist > 3.5) {
          const dmg = Math.floor(fallDist - 3);
          damagePlayer(dmg, 'fell from a high place');
        }
        player.fallStart = null;
      }
    }
    player.vel.y = 0;
  }
  // floor safety
  if (player.pos.y < -5) {
    player.vel.set(0,0,0);
    player.fallStart = null;
    damagePlayer(player.maxHealth, 'fell out of the world');
  }

  } // end normal mode

  // Footstep audio: when on ground & moving horizontally, play footstep sound
  // for the surface block type beneath the player.
  if (player.onGround && move.lengthSq() > 0) {
    const bx = Math.floor(player.pos.x);
    const by = Math.floor(player.pos.y - player.height - 0.1);
    const bz = Math.floor(player.pos.z);
    const surface = getBlock(bx, by, bz) || 'grass';
    // Map grass top to a "grass" footstep
    SFX.footstep(surface === 'water' ? 'grass' : surface);
  }

  // --- Vitals tick ---
  // Slow hunger drain: -1 hunger per ~25 s when moving, ~50 s when idle.
  player.hungerTimer += dt;
  const drainInterval = move.lengthSq() > 0 ? 25 : 50;
  if (player.hungerTimer >= drainInterval) {
    player.hungerTimer = 0;
    if (player.hunger > 0) {
      player.hunger = Math.max(0, player.hunger - 1);
      updateHungerIcons();
    }
  }
  // Health regen: if hunger >= 18 and not full health, heal 1 hp per ~3 s.
  if (player.hunger >= 18 && player.health < player.maxHealth) {
    player.regenTimer += dt;
    if (player.regenTimer >= 3) {
      player.regenTimer = 0;
      player.health = Math.min(player.maxHealth, player.health + 1);
      updateHeartIcons();
    }
  } else {
    player.regenTimer = 0;
  }
  // Starvation: if hunger is 0, lose 1 hp per ~4 s down to 1 hp (don't die from it).
  if (player.hunger === 0 && player.health > 1) {
    player.regenTimer += dt;
    if (player.regenTimer >= 4) {
      player.regenTimer = 0;
      player.health = Math.max(1, player.health - 1);
      updateHeartIcons();
    }
  }
}

/* Damage player by n HP, clamp to 0; show game over if dead. Triggers heart refresh. */
function damagePlayer(n, reason) {
  if (n <= 0) return;
  player.health = Math.max(0, player.health - n);
  updateHeartIcons();
  if (player.health <= 0) {
    showGameOver(reason || 'took damage');
  }
}

/* Show the game over screen with Minecraft-style death message */
function showGameOver(reason) {
  if (currentGameMode !== 'survival') return; // no death in creative
  const name = myUsername || 'Player';
  const goScreen = document.getElementById('gameover-screen');
  document.getElementById('gameover-msg').textContent = name + ' ' + reason;
  document.getElementById('gameover-score').textContent =
    'Score: 0';
  if (document.pointerLockElement) document.exitPointerLock();
  document.getElementById('hud-bottom').classList.add('hidden');
  document.getElementById('hearts').classList.add('hidden');
  document.getElementById('hunger').classList.add('hidden');
  goScreen.classList.remove('hidden');
  // Slight delay so transition animates in
  requestAnimationFrame(() => { goScreen.classList.add('show'); });
}

function hideGameOver() {
  const goScreen = document.getElementById('gameover-screen');
  goScreen.classList.remove('show');
  setTimeout(() => {
    goScreen.classList.add('hidden');
    document.getElementById('hud-bottom').classList.remove('hidden');
    document.getElementById('hearts').classList.remove('hidden');
    document.getElementById('hunger').classList.remove('hidden');
  }, 400);
}

function doRespawn() {
  player.health = player.maxHealth;
  player.hunger = player.maxHunger;
  updateHeartIcons();
  updateHungerIcons();
  spawnPlayer();
  player.vel.set(0,0,0);
  player.fallStart = null;
  hideGameOver();
  if (!isMobile()) canvas.requestPointerLock();
}

/* ---------- 10. Camera & look ---------- */
function updateCamera(dt) {
  const sneakEyeOffset = player.sneaking ? -0.35 : 0;
  const eyeY = player.pos.y + player.eye - player.height + sneakEyeOffset;
  const dir = new THREE.Vector3(
    -Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch),
    -Math.cos(player.yaw) * Math.cos(player.pitch)
  );

  if (settings.cameraMode === 'third') {
    // Camera behind and above player (opposite of forward direction)
    const flatDir = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const thirdPos = new THREE.Vector3(
      player.pos.x - flatDir.x * 4,
      eyeY + 2.5,
      player.pos.z - flatDir.z * 4
    );
    const camBlock = getBlock(Math.floor(thirdPos.x), Math.floor(thirdPos.y), Math.floor(thirdPos.z));
    if (camBlock && camBlock !== 'water') thirdPos.y += 1.5;
    camera.position.copy(thirdPos);
    camera.lookAt(player.pos.x, eyeY + 0.3, player.pos.z);
    handContainer.visible = false;

    // Show and update local player model
    localPlayerModel.visible = true;
    localPlayerModel.position.set(player.pos.x, player.pos.y - player.height, player.pos.z);
    localPlayerModel.rotation.y = player.yaw + Math.PI; // face forward

    // Walk animation
    const isMoving = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                      (joy.active && (Math.abs(joy.x) > 0.1 || Math.abs(joy.y) > 0.1)) ||
                      dpadState.up || dpadState.down || dpadState.left || dpadState.right);
    const dtt = dt || 0.016;
    localSwingPhase += dtt * (isMoving && player.onGround ? 8 : 0);
    const targetAmp = (isMoving && player.onGround) ? 0.6 : 0;
    localSwingAmp += (targetAmp - localSwingAmp) * Math.min(1, dtt * 6);
    const swing = Math.sin(localSwingPhase) * localSwingAmp;
    const parts = localPlayerModel.userData.parts;
    parts.legL.rotation.x =  swing;
    parts.legR.rotation.x = -swing;
    parts.armL.rotation.x = -swing;
    parts.armR.rotation.x =  swing;
  } else {
    camera.position.set(player.pos.x, eyeY, player.pos.z);
    camera.lookAt(camera.position.clone().add(dir));
    handContainer.visible = true;
    localPlayerModel.visible = false;
  }
}

/* ---------- 11. Block targeting (raycast) ---------- */
const raycaster = new THREE.Raycaster();
raycaster.far = 6;
let targetBlock = null; // {x,y,z, nx,ny,nz (face normal), point}

function raycastTarget() {
  const origin = camera.position.clone();
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  // DDA voxel traversal
  let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
  const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);
  const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;
  let tMaxX = stepX > 0 ? (x + 1 - origin.x) * tDeltaX : (origin.x - x) * tDeltaX;
  let tMaxY = stepY > 0 ? (y + 1 - origin.y) * tDeltaY : (origin.y - y) * tDeltaY;
  let tMaxZ = stepZ > 0 ? (z + 1 - origin.z) * tDeltaZ : (origin.z - z) * tDeltaZ;
  if (stepX === 0) tMaxX = Infinity;
  if (stepY === 0) tMaxY = Infinity;
  if (stepZ === 0) tMaxZ = Infinity;

  let lastFace = { x:0, y:0, z:0 };
  let t = 0;
  for (let i = 0; i < 80 && t < 6; i++) {
    const b = getBlock(x, y, z);
    if (b && b !== 'water') {
      targetBlock = { x, y, z, nx:lastFace.x, ny:lastFace.y, nz:lastFace.z };
      return;
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; t = tMaxX; tMaxX += tDeltaX;
      lastFace = { x:-stepX, y:0, z:0 };
    } else if (tMaxY < tMaxZ) {
      y += stepY; t = tMaxY; tMaxY += tDeltaY;
      lastFace = { x:0, y:-stepY, z:0 };
    } else {
      z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ;
      lastFace = { x:0, y:0, z:-stepZ };
    }
  }
  targetBlock = null;
}

/* ---------- 10. Block highlight & breaking animation ---------- */
const hlGeo = new THREE.BoxGeometry(1.001, 1.001, 1.001);
const hlEdges = new THREE.EdgesGeometry(hlGeo);
const hlMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, depthTest:true });
const highlight = new THREE.LineSegments(hlEdges, hlMat);
highlight.visible = false;
scene.add(highlight);

// Crack overlay: 10 stages of progressive crack textures applied to a slightly
// larger transparent box placed over the targeted block while breaking.
const CRACK_STAGES = 10;
const crackTextures = [];
for (let i = 0; i < CRACK_STAGES; i++) {
  const tex = new THREE.CanvasTexture(texCracks(i));
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  crackTextures.push(tex);
}
const crackMat = new THREE.MeshBasicMaterial({
  map: crackTextures[0],
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
});
const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.005, 1.005, 1.005), crackMat);
crackMesh.visible = false;
scene.add(crackMesh);

// Breaking state. `breaking` holds the current target + accumulated time.
// `breakDuration` depends on block type (harder blocks take longer).
const BREAK_DURATIONS = { stone: 1.2, log: 0.9, dirt: 0.55, grass: 0.55, sand: 0.45, leaves: 0.3, water: 0.1, torch: 0.05 };
let breaking = null;       // { x, y, z, duration, t }
let mouseDown = false;     // left mouse button held

function startBreaking() {
  if (!targetBlock) { stopBreaking(); return; }
  const { x, y, z } = targetBlock;
  const b = getBlock(x, y, z);
  if (!b || b === 'bedrock') {
    stopBreaking();
    if (b === 'bedrock') showActionMessage('Cannot break bedrock');
    return;
  }
  // (Re)start if target changed
  if (!breaking || breaking.x !== x || breaking.y !== y || breaking.z !== z) {
    breaking = { x, y, z, duration: BREAK_DURATIONS[b] || 0.6, t: 0 };
    updateCrackOverlay();
  }
}
function stopBreaking() {
  if (breaking) {
    breaking = null;
    crackMesh.visible = false;
  }
}
function updateCrackOverlay() {
  if (!breaking) { crackMesh.visible = false; return; }
  const progress = Math.min(breaking.t / breaking.duration, 1);
  const stage = Math.min(CRACK_STAGES - 1, Math.floor(progress * CRACK_STAGES));
  crackMesh.position.set(breaking.x + 0.5, breaking.y + 0.5, breaking.z + 0.5);
  crackMesh.material.map = crackTextures[stage];
  crackMesh.material.needsUpdate = true;
  crackMesh.visible = true;
}
function tickBreaking(dt) {
  if (!mouseDown && !joy.breakBtn) { stopBreaking(); return; }
  if (!targetBlock) { stopBreaking(); return; }
  startBreaking();
  if (!breaking) return;
  breaking.t += dt;
  updateCrackOverlay();
  if (breaking.t >= breaking.duration) {
    breakBlockNow(breaking.x, breaking.y, breaking.z);
    stopBreaking();
  }
}

function updateHighlight() {
  raycastTarget();
  if (targetBlock) {
    highlight.position.set(targetBlock.x + 0.5, targetBlock.y + 0.5, targetBlock.z + 0.5);
    highlight.visible = true;
  } else {
    highlight.visible = false;
    stopBreaking();
  }
}

/* ---------- 11. Break / place ---------- */
// `breakBlockNow` is called when the hold-to-break timer completes.
// It removes the block, rebuilds meshes, and plays a break sound.
function explodeTNT(cx, cy, cz) {
  const RADIUS = 3;
  for (let dx = -RADIUS; dx <= RADIUS; dx++) {
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      for (let dz = -RADIUS; dz <= RADIUS; dz++) {
        if (dx*dx + dy*dy + dz*dz > RADIUS*RADIUS) continue;
        const bx = cx+dx, by = cy+dy, bz = cz+dz;
        const b = getBlock(bx, by, bz);
        if (b && b !== 'bedrock') {
          delBlock(bx, by, bz);
          if (currentSingleplayerWorldId) worldMods.set(key(bx,by,bz), null);
        }
      }
    }
  }
  if (currentSingleplayerWorldId) saveWorldMods(currentSingleplayerWorldId);
  rebuildMeshes();
  // Damage player if close
  const pd = Math.sqrt((player.pos.x-cx)**2 + (player.pos.y-cy)**2 + (player.pos.z-cz)**2);
  if (pd < RADIUS + 1.5) damagePlayer(Math.ceil((RADIUS + 1.5 - pd) * 3.5), 'was blown up');
  SFX.explosion();
  // Screen flash
  const fl = document.getElementById('break-flash');
  fl.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(255,200,60,0.55);border:none;opacity:1;transition:none;z-index:9;pointer-events:none;';
  requestAnimationFrame(() => {
    fl.style.transition = 'opacity 0.45s ease-out';
    fl.style.opacity = '0';
    setTimeout(() => { fl.style.cssText = ''; }, 500);
  });
  addChatLine('💥 TNT exploded!', 'system');
}

function breakBlockNow(x, y, z) {
  const b = getBlock(x, y, z);
  if (!b || b === 'bedrock') return; // bedrock protected
  if (b === 'tnt') { delBlock(x,y,z); if (currentSingleplayerWorldId) { worldMods.set(key(x,y,z), null); saveWorldMods(currentSingleplayerWorldId); } explodeTNT(x,y,z); return; }
  delBlock(x, y, z);
  if (currentSingleplayerWorldId) { worldMods.set(key(x,y,z), null); saveWorldMods(currentSingleplayerWorldId); }
  // Remove sign mesh and data if breaking a sign
  if (b === 'sign') {
    removeSignMesh(x, y, z);
    signTexts.delete(key(x,y,z));
    signFacings.delete(key(x,y,z));
    saveSignData();
    triggerSwing();
    flashBreak(); SFX.break('log');
    if (isMultiplayer) syncBlockChange(x, y, z, null);
    return;
  }
  if (b === 'torch') {
    delBlock(x, y, z);
    if (currentSingleplayerWorldId) { worldMods.set(key(x,y,z), null); saveWorldMods(currentSingleplayerWorldId); }
    removeTorchMesh(x, y, z);
    spawnDrop(x, y, z, 'torch');
    triggerSwing();
    flashBreak(); SFX.break('log');
    if (isMultiplayer) syncBlockChange(x, y, z, null);
    return;
  }
  spawnDrop(x, y, z, b);
  // Leaves have a 30% chance to drop an apple (like real Minecraft oak leaves)
  if (b === 'leaves' && Math.random() < 0.30) {
    spawnDrop(x, y + 0.2, z, 'apple');
  }
  // Grass tufts affected if breaking a grass block or block above grass
  rebuildMeshes(b === 'grass' || getBlock(x, y - 1, z) === 'grass');
  flashBreak();
  SFX.break(b);
  // Award XP: harder blocks = more XP (stone/log > leaves/grass)
  triggerSwing();
  if (isMultiplayer) syncBlockChange(x, y, z, null);
}

// Legacy `breakBlock` — kept for one-shot triggers (e.g. legacy mobile tap),
// but now also routes through the timed break for consistency.
function breakBlock() {
  if (!targetBlock) return;
  startBreaking();
  // For one-tap callers, immediately tick once; the rest happens on hold.
  if (breaking) {
    breaking.t = Math.max(breaking.t, breaking.duration * 0.5);
    updateCrackOverlay();
  }
}
function eatMeat() {
  if (player.hunger >= player.maxHunger) { addChatLine("You're not hungry!", 'info'); return; }
  player.hunger = Math.min(player.maxHunger, player.hunger + 6);
  updateHungerIcons();
  survivalCounts['meat'] = Math.max(0, (survivalCounts['meat'] || 1) - 1);
  if (survivalCounts['meat'] <= 0) {
    const idx = HOTBAR.indexOf('meat');
    if (idx !== -1) {
      HOTBAR[idx] = undefined;
      const slot = hotbarEl.children[idx];
      if (slot) { slot.querySelector('canvas.icon')?.remove(); slot.querySelector('.count-badge')?.remove(); slot.onclick = null; slot.ontouchstart = null; }
    }
    delete survivalCounts['meat'];
  } else {
    const idx = HOTBAR.indexOf('meat');
    const badge = idx >= 0 && hotbarEl.children[idx]?.querySelector('.count-badge');
    if (badge) badge.textContent = survivalCounts['meat'];
  }
  SFX.break('leaves');
  startEating();
  addChatLine('Nom! (+6 🍖)', 'system');
}

function eatRawMeat() {
  if (player.hunger >= player.maxHunger) { addChatLine("You're not hungry!", 'info'); return; }
  player.hunger = Math.min(player.maxHunger, player.hunger + 3);
  updateHungerIcons();
  survivalCounts['raw_meat'] = Math.max(0, (survivalCounts['raw_meat'] || 1) - 1);
  if (survivalCounts['raw_meat'] <= 0) {
    const idx = HOTBAR.indexOf('raw_meat');
    if (idx !== -1) {
      HOTBAR[idx] = undefined;
      const slot = hotbarEl.children[idx];
      if (slot) { slot.querySelector('canvas.icon')?.remove(); slot.querySelector('.count-badge')?.remove(); slot.onclick = null; slot.ontouchstart = null; }
    }
    delete survivalCounts['raw_meat'];
  } else {
    const idx = HOTBAR.indexOf('raw_meat');
    const badge = idx >= 0 && hotbarEl.children[idx]?.querySelector('.count-badge');
    if (badge) badge.textContent = survivalCounts['raw_meat'];
  }
  SFX.break('leaves');
  startEating();
  addChatLine('Nom! (+3 🥩 raw)', 'system');
}

function eatApple() {
  if (player.hunger >= player.maxHunger) { addChatLine("You're not hungry!", 'info'); return; }
  player.hunger = Math.min(player.maxHunger, player.hunger + 4);
  updateHungerIcons();
  survivalCounts['apple'] = Math.max(0, (survivalCounts['apple'] || 1) - 1);
  if (survivalCounts['apple'] <= 0) {
    const idx = HOTBAR.indexOf('apple');
    if (idx !== -1) {
      HOTBAR[idx] = undefined;
      const slot = hotbarEl.children[idx];
      if (slot) { slot.querySelector('canvas.icon')?.remove(); slot.querySelector('.count-badge')?.remove(); slot.onclick = null; slot.ontouchstart = null; }
    }
    delete survivalCounts['apple'];
  } else {
    const idx = HOTBAR.indexOf('apple');
    const badge = idx >= 0 && hotbarEl.children[idx]?.querySelector('.count-badge');
    if (badge) badge.textContent = survivalCounts['apple'];
  }
  SFX.break('leaves');
  startEating();
  addChatLine('Crunch! 🍎 (+4 hunger)', 'system');
}

function placeBlock() {
  if (!targetBlock) return;
  // Right-click on an existing sign → open editor
  const tbType = getBlock(targetBlock.x, targetBlock.y, targetBlock.z);
  if (tbType === 'sign') {
    openSignEditor(targetBlock.x, targetBlock.y, targetBlock.z);
    return;
  }
  const held = HOTBAR[selectedSlot];
  if (!held) return; // empty slot
  if (held === 'meat') { eatMeat(); return; }
  if (held === 'raw_meat') { eatRawMeat(); return; }
  if (held === 'apple') { eatApple(); return; }
  const x = targetBlock.x + targetBlock.nx;
  const y = targetBlock.y + targetBlock.ny;
  const z = targetBlock.z + targetBlock.nz;
  // bounds check
  if (x < -HALF || x >= HALF || z < -HALF || z >= HALF || y < 1 || y > 30) return;
  if (getBlock(x, y, z)) return;
  // don't place inside player
  const px = player.pos.x, py = player.pos.y - player.height, pz = player.pos.z;
  if (Math.abs(x + 0.5 - px) < 0.8 + player.width && Math.abs(z + 0.5 - pz) < 0.8 + player.width &&
      y + 0.5 > py && y + 0.5 < py + player.height + 0.2) return;
  // Sign placement — store block, build 3D mesh (no auto-editor; right-click to edit)
  if (held === 'sign') {
    setBlock(x, y, z, 'sign');
    if (currentSingleplayerWorldId) { worldMods.set(key(x,y,z), 'sign'); saveWorldMods(currentSingleplayerWorldId); }
    signFacings.set(key(x,y,z), player.yaw);
    saveSignData();
    buildSignMesh(x, y, z);
    SFX.place('log');
    triggerSwing();
    if (isMultiplayer) syncBlockChange(x, y, z, 'sign');
    return;
  }
  if (held === 'torch') {
    setBlock(x, y, z, 'torch');
    if (currentSingleplayerWorldId) { worldMods.set(key(x,y,z), 'torch'); saveWorldMods(currentSingleplayerWorldId); }
    buildTorchMesh(x, y, z);
    SFX.place('log');
    triggerSwing();
    if (isMultiplayer) syncBlockChange(x, y, z, 'torch');
    return;
  }
  setBlock(x, y, z, held);
  if (currentSingleplayerWorldId) { worldMods.set(key(x,y,z), held); saveWorldMods(currentSingleplayerWorldId); }
  // Only rebuild grass tufts if placing on top of a grass block (covers the tuft)
  const affectsGrass = getBlock(x, y - 1, z) === 'grass';
  rebuildMeshes(affectsGrass);
  SFX.place(held);
  triggerSwing();
  if (isMultiplayer) syncBlockChange(x, y, z, held);
}

function rebuildMeshes(affectsGrass) {
  meshDirty = true;
  if (affectsGrass !== false) grassDirty = true;
}

function doRebuildMeshes() {
  // remove old meshes (includes both single-material and grouped multi-material)
  for (const m of meshes) {
    scene.remove(m);
    if (m.geometry) m.geometry.dispose();
  }
  // buildMeshes returns a fresh array; grass/log are added to scene inside buildGroupedGeometry.
  // Single-material meshes need to be added here.
  meshes = buildMeshes();
  for (const m of meshes) {
    if (!m.parent) scene.add(m);
  }
  // Rebuild grass tufts so they match the new world state (e.g. a grass block
  // being broken removes its tuft, placing a block on grass removes the tuft).
  rebuildGrassTufts();
  rebuildAllTorchMeshes();
}

/* ---------- 11b. Block drop system ---------- */
// Small rotating cube with the block's own texture, spawned when a block is broken.
// Falls with gravity, bobs on the ground, magnets toward the player, collects on touch.
const drops = []; // { mesh, type, x, y, z, vy, age, onGround }
const DROP_SIZE       = 0.38;  // bigger = easier to see
const DROP_LIFETIME   = 25;   // seconds until despawn
const DROP_MAGNET_R   = 3.2;  // start drifting toward player within this radius
const DROP_COLLECT_R  = 0.85; // pick up within this radius
const DROP_GRAVITY    = -14;

function spawnDrop(bx, by, bz, type) {
  if (type === 'water') return; // water drops nothing
  const blockDef = BLOCKS[type];
  if (!blockDef) return;
  const geo = new THREE.BoxGeometry(DROP_SIZE, DROP_SIZE, DROP_SIZE);
  const mats = blockDef.mats.length === 6 ? blockDef.mats : blockDef.mats[0];
  const mesh = new THREE.Mesh(geo, mats);
  mesh.position.set(bx + 0.5, by + 0.6, bz + 0.5);
  scene.add(mesh);
  drops.push({
    mesh, type,
    x: bx + 0.5, y: by + 0.6, z: bz + 0.5,
    spawnY: by + 0.6,   // never let drop fall below this
    vy: 2.0 + Math.random() * 1.5,
    age: 0, onGround: false,
    collectDelay: 0.5,  // can't be picked up for 0.5s after spawning
  });
}

// Add a collected block to the survival hotbar.
// If the block type already exists in a slot, stack it (count++).
// Otherwise fill the first empty slot.
const survivalCounts = {}; // type -> count

function collectBlock(type) {
  if (!type || type === 'water' || type === 'bedrock') return;

  const slots = [...hotbarEl.children];

  // Check if this block type is already in a slot
  const existing = HOTBAR.indexOf(type);
  if (existing !== -1) {
    survivalCounts[type] = (survivalCounts[type] || 1) + 1;
    // Update count badge on that slot
    const badge = slots[existing] && slots[existing].querySelector('.count-badge');
    if (badge) badge.textContent = survivalCounts[type];
    return;
  }

  // Find first empty slot (slot with no block type assigned)
  let emptyIdx = -1;
  for (let i = 0; i < 8; i++) {
    if (HOTBAR[i] === undefined || HOTBAR[i] === null) { emptyIdx = i; break; }
  }
  if (emptyIdx === -1) return; // hotbar full

  // Assign block to that slot
  HOTBAR[emptyIdx] = type;
  survivalCounts[type] = 1;

  // Update slot DOM
  const slot = slots[emptyIdx];
  if (!slot) return;

  // Draw icon
  const icon = document.createElement('canvas');
  icon.className = 'icon'; icon.width = icon.height = 64;
  drawBlockIcon(icon.getContext('2d'), 64, type);
  // Override with real Minecraft icon for meat items
  if (type === 'meat' && meatIconImg.complete && meatIconImg.naturalWidth > 0) {
    const ictx = icon.getContext('2d');
    ictx.clearRect(0, 0, 64, 64);
    ictx.imageSmoothingEnabled = false;
    ictx.drawImage(meatIconImg, 0, 0, 64, 64);
  } else if (type === 'raw_meat' && rawMeatIconImg.complete && rawMeatIconImg.naturalWidth > 0) {
    const ictx = icon.getContext('2d');
    ictx.clearRect(0, 0, 64, 64);
    ictx.imageSmoothingEnabled = false;
    ictx.drawImage(rawMeatIconImg, 0, 0, 64, 64);
  } else if (type === 'apple' && appleIconImg.complete && appleIconImg.naturalWidth > 0) {
    const ictx = icon.getContext('2d');
    ictx.clearRect(0, 0, 64, 64);
    ictx.imageSmoothingEnabled = false;
    ictx.drawImage(appleIconImg, 0, 0, 64, 64);
  }
  slot.insertBefore(icon, slot.firstChild);

  // Count badge
  const badge = document.createElement('div');
  badge.className = 'count-badge';
  badge.textContent = '1';
  badge.style.cssText = 'position:absolute;bottom:1px;right:2px;font-size:9px;color:#fff;font-weight:bold;font-family:Minecraftia,monospace;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;';
  slot.appendChild(badge);

  // Make slot clickable
  slot.onclick = () => selectSlot(emptyIdx);
  slot.ontouchstart = e => { e.stopPropagation(); e.preventDefault(); selectSlot(emptyIdx); };
}

function tickDrops(dt) {
  const px = player.pos.x;
  const py = player.pos.y - player.height * 0.5;
  const pz = player.pos.z;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.age += dt;
    if (d.age > DROP_LIFETIME) {
      scene.remove(d.mesh); d.mesh.geometry.dispose(); drops.splice(i, 1); continue;
    }
    const cdx = px - d.x, cdy = py - d.y, cdz = pz - d.z;
    const cdist = Math.sqrt(cdx*cdx + cdy*cdy + cdz*cdz);
    if (cdist < DROP_COLLECT_R && d.age >= d.collectDelay) {
      const collectedType = d.type;
      scene.remove(d.mesh); d.mesh.geometry.dispose(); drops.splice(i, 1);
      if (currentGameMode === 'survival' || collectedType === 'meat' || collectedType === 'apple') collectBlock(collectedType);
      const el = document.getElementById('break-flash');
      el.style.transition = 'none';
      el.style.background = 'rgba(255,255,160,0.18)';
      el.style.opacity = '1';
      requestAnimationFrame(() => { el.style.transition = 'opacity 0.3s ease-out'; el.style.opacity = '0'; });
      continue;
    }
    if (!d.onGround) { d.vy += DROP_GRAVITY * dt; d.y += d.vy * dt; }
    const gbx = Math.floor(d.x), gbz = Math.floor(d.z);
    let groundY = Math.floor(d.spawnY); // fallback: float at spawn height, never underground
    for (let gy = Math.min(60, Math.ceil(d.y) + 1); gy >= 0; gy--) {
      const b = getBlock(gbx, gy, gbz);
      if (b && b !== 'water') { groundY = gy + 1; break; }
    }
    const floorTarget = groundY + DROP_SIZE * 0.5;
    if (d.y <= floorTarget) {
      d.y = floorTarget;
      d.vy = d.vy < -0.5 ? -d.vy * 0.28 : 0;
      if (Math.abs(d.vy) < 0.3) { d.vy = 0; d.onGround = true; }
    } else { d.onGround = false; }
    if (cdist < DROP_MAGNET_R) {
      const speed = (1 - cdist / DROP_MAGNET_R) * 9.0 * dt;
      d.x += (cdx / cdist) * speed;
      d.z += (cdz / cdist) * speed;
      if (d.onGround) d.y += (cdy / cdist) * speed * 0.6;
    }
    const bob = d.onGround ? Math.sin(d.age * 2.8 + i) * 0.04 : 0;
    d.mesh.position.set(d.x, d.y + bob, d.z);
    d.mesh.rotation.y += dt * 2.2;
    d.mesh.rotation.x = Math.sin(d.age * 1.4 + i * 0.7) * 0.18;
  }
}


/* ---------- 11c. Cow entity (real Minecraft cow.png texture + model) ---------- */
let cow = null;
let cowAttackCooldown = 0;

// === Load real Minecraft cow.png from CDN ===
const COW_TEX_URL = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/entity/cow/cow.png';
let cowPngLoaded = false;
const cowPngImg = new Image();
cowPngImg.crossOrigin = 'anonymous';

// Cache for cropped cow textures (avoids recreating when cow is rebuilt)
const cowTexCache = {};

cowPngImg.onload = () => {
  cowPngLoaded = true;
  // Clear the texture cache so new crops use the real image
  for (const k in cowTexCache) { cowTexCache[k].dispose(); delete cowTexCache[k]; }
  // If cow already exists, rebuild it with real textures
  if (cow && !cow.dead) {
    scene.remove(cow.mesh);
    cow.mesh = buildCowMesh();
    scene.add(cow.mesh);
    // tickCow will update position next frame
  }
};
cowPngImg.onerror = () => console.warn('[Craft3D] cow.png failed to load — using placeholder');
cowPngImg.src = COW_TEX_URL;

// Helper: crop a region from cow.png → CanvasTexture (NearestFilter, pixel-perfect)
function cropCowTex(px, py, pw, ph) {
  const key = px + '_' + py + '_' + pw + '_' + ph;
  if (cowTexCache[key]) return cowTexCache[key];
  const c = document.createElement('canvas');
  c.width = Math.max(1, pw);
  c.height = Math.max(1, ph);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (cowPngLoaded) {
    ctx.drawImage(cowPngImg, px, py, pw, ph, 0, 0, pw, ph);
  } else {
    // Gray placeholder until cow.png loads
    ctx.fillStyle = '#999999';
    ctx.fillRect(0, 0, pw, ph);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  cowTexCache[key] = t;
  return t;
}

// Helper: build a cow cube with per-face textures cropped from cow.png
// Uses the standard Minecraft entity UV layout (then swaps FRONT/BACK, see note):
//   For a box at texture offset (texU, texV) with dimensions (w, h, d):
//     RIGHT (+X):  (texU,          texV+d)     size (d, h)
//     LEFT  (-X):  (texU+d+w,      texV+d)     size (d, h)
//     TOP   (+Y):  (texU+d,        texV)       size (w, d)
//     BOTTOM(-Y):  (texU+d,        texV+d+h)   size (w, d)
//     FRONT tex:   (texU+d,        texV+d)     size (w, h)  → applied to -Z face (snout)
//     BACK  tex:   (texU+2d+w,     texV+d)     size (w, h)  → applied to +Z face
// Material order returned matches Three.js BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z]
// NOTE: Cow faces -Z in this game (head is at -Z, forward = -Z).
// Minecraft's UV layout assumes forward = +Z, so we SWAP FRONT/BACK
// to put the snout/face texture on the -Z face (cow's actual forward).
// We also pass `offsetPush` to enable polygonOffset on parts that overlap
// the body (head, legs), preventing z-fighting on coplanar faces.
function buildCowBox(w, h, d, texU, texV, offsetPush = false) {
  const mkMat = (tex) => {
    const m = new THREE.MeshLambertMaterial({ map: tex });
    if (offsetPush) {
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
    }
    return m;
  };
  const mats = [
    mkMat(cropCowTex(texU,            texV+d,     d, h)),  // +X RIGHT
    mkMat(cropCowTex(texU+d+w,        texV+d,     d, h)),  // -X LEFT
    mkMat(cropCowTex(texU+d,          texV,       w, d)),  // +Y TOP
    mkMat(cropCowTex(texU+d,          texV+d+h,   w, d)),  // -Y BOTTOM
    mkMat(cropCowTex(texU+2*d+w,      texV+d,     w, h)),  // +Z BACK  (swapped: was FRONT)
    mkMat(cropCowTex(texU+d,          texV+d,     w, h)),  // -Z FRONT (swapped: was BACK — snout goes here)
  ];
  return mats;
}

function buildCowMesh() {
  const g = new THREE.Group();
  // Scale: Minecraft cow hitbox is ~1.4 blocks tall. The model is 18px tall
  // (top of head). At 1/16 scale that's only 1.125 blocks — too small.
  // 0.085 gives 18 * 0.085 = 1.53 blocks, matching the real cow hitbox.
  const SCALE = 0.085;

  // ===== Minecraft cow model dimensions (model pixels) + texture offsets =====
  // These match the vanilla Minecraft Java Edition cow model.
  // Texture: cow.png (64×32 pixels)
  //
  // Head: 8×8×8,  texture offset (0, 0)
  // Body: 8×8×10, texture offset (18, 4)
  // Legs: 3×10×3, texture offset (0, 16) — all 4 legs share the same texture

  const HEAD_W = 8, HEAD_H = 8, HEAD_D = 8;
  const BODY_W = 8, BODY_H = 8, BODY_D = 10;
  const LEG_W  = 3, LEG_H  = 10, LEG_D  = 3;

  // === BODY === (centered, sits on top of legs with slight overlap)
  // Legs are 10px tall (y=0 to y=10). Body center at y=12 (8 tall → y=8..16, overlaps legs by 2px)
  const bodyMats = buildCowBox(BODY_W, BODY_H, BODY_D, 18, 4, false);
  const body = new THREE.Mesh(new THREE.BoxGeometry(BODY_W * SCALE, BODY_H * SCALE, BODY_D * SCALE), bodyMats);
  body.position.set(0, 12 * SCALE, 0);
  g.add(body);

  // === HEAD === (in front of body at -Z, slightly raised)
  // Body front is at z = -BODY_D/2 = -5. Head depth = 8, overlap 3 → center at -5 - 4 + 3 = -6
  // Head y center at 14 (slightly above body center of 12, so head pokes up above the body)
  // offsetPush=true so head's coplanar +X/-X faces don't z-fight with body's +X/-X faces.
  const headMats = buildCowBox(HEAD_W, HEAD_H, HEAD_D, 0, 0, true);
  const head = new THREE.Mesh(new THREE.BoxGeometry(HEAD_W * SCALE, HEAD_H * SCALE, HEAD_D * SCALE), headMats);
  head.position.set(0, 14 * SCALE, -6 * SCALE);
  g.add(head);

  // === LEGS === (4 legs with pivot Groups at the hip for walk animation)
  // Build shared leg materials (all 4 legs use the same texture region).
  // offsetPush=true so leg's coplanar +X/-X faces don't z-fight with body.
  const legTexU = 0, legTexV = 16;
  const mkLegMat = (tex) => {
    const m = new THREE.MeshLambertMaterial({ map: tex });
    m.polygonOffset = true;
    m.polygonOffsetFactor = -1;
    m.polygonOffsetUnits = -1;
    return m;
  };
  const legMats = [
    mkLegMat(cropCowTex(legTexU,                   legTexV+LEG_D,       LEG_D, LEG_H)),  // +X RIGHT
    mkLegMat(cropCowTex(legTexU+LEG_D+LEG_W,        legTexV+LEG_D,       LEG_D, LEG_H)),  // -X LEFT
    mkLegMat(cropCowTex(legTexU+LEG_D,              legTexV,             LEG_W, LEG_D)),  // +Y TOP
    mkLegMat(cropCowTex(legTexU+LEG_D,              legTexV+LEG_D+LEG_H, LEG_W, LEG_D)),  // -Y BOTTOM (hoof)
    mkLegMat(cropCowTex(legTexU+2*LEG_D+LEG_W,      legTexV+LEG_D,       LEG_W, LEG_H)),  // +Z BACK  (swapped)
    mkLegMat(cropCowTex(legTexU+LEG_D,              legTexV+LEG_D,       LEG_W, LEG_H)),  // -Z FRONT (swapped)
  ];
  const legGeo = new THREE.BoxGeometry(LEG_W * SCALE, LEG_H * SCALE, LEG_D * SCALE);

  // Leg positions at the 4 corners of the body (inset slightly)
  const legX = BODY_W/2 - LEG_W/2;   // 2.5px from center
  const legZ = BODY_D/2 - LEG_D/2;   // 3.5px from center
  // Order: front-left, front-right, back-left, back-right (for walk animation)
  const legPositions = [
    [-legX, -legZ],  // front-left  (cow faces -Z, so front = -Z)
    [ legX, -legZ],  // front-right
    [-legX,  legZ],  // back-left
    [ legX,  legZ],  // back-right
  ];

  const legPivots = [];
  legPositions.forEach(([lx, lz]) => {
    const pivot = new THREE.Group();
    pivot.position.set(lx * SCALE, 10 * SCALE, lz * SCALE);  // hip at y=10px (top of legs = body bottom area)
    const leg = new THREE.Mesh(legGeo, legMats);
    leg.position.set(0, -LEG_H/2 * SCALE, 0);  // leg hangs below the pivot
    pivot.add(leg);
    g.add(pivot);
    legPivots.push(pivot);
  });

  // Save references for animation + hit flash
  g.userData.legs = legPivots;
  g.userData.body = body;
  g.userData.head = head;
  return g;
}

function spawnCow() {
  if (cow) { scene.remove(cow.mesh); cow = null; }
  // Find a grass surface a few blocks from spawn
  for (let r = 4; r < 20; r++) {
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        if (Math.abs(x) !== r && Math.abs(z) !== r) continue;
        for (let y = 55; y >= 1; y--) {
          if (getBlock(x, y, z) === 'grass' && !getBlock(x, y+1, z) && !getBlock(x, y+2, z)) {
            const mesh = buildCowMesh();
            mesh.position.set(x + 0.5, y + 1, z + 0.5);
            scene.add(mesh);
            cow = { mesh, x: x+0.5, y: y+1, z: z+0.5,
                    hp: 3, dead: false,
                    wanderTimer: 1, wanderDx: 0, wanderDz: 0,
                    legPhase: 0, vy: 0, onGround: true };
            return;
          }
        }
      }
    }
  }
}

function tickCow(dt) {
  if (!cow || cow.dead) return;
  if (cowAttackCooldown > 0) cowAttackCooldown -= dt;

  // --- Stuck detection: if cow barely moved in 1.5s, force new direction ---
  cow._stuckTimer = (cow._stuckTimer || 0) + dt;
  if (cow._stuckTimer > 1.5) {
    const moved = Math.abs(cow.x - (cow._lastX || cow.x)) + Math.abs(cow.z - (cow._lastZ || cow.z));
    if (moved < 0.08 && (cow.wanderDx !== 0 || cow.wanderDz !== 0)) {
      // Stuck against a wall — pick a fresh random direction
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.7 + Math.random() * 0.4;
      cow.wanderDx = Math.sin(ang) * spd;
      cow.wanderDz = Math.cos(ang) * spd;
      cow.wanderTimer = 1.5 + Math.random() * 2;
    }
    cow._lastX = cow.x; cow._lastZ = cow.z;
    cow._stuckTimer = 0;
  }

  // --- Wander AI ---
  cow.wanderTimer -= dt;
  if (cow.wanderTimer <= 0) {
    cow.wanderTimer = 2.5 + Math.random() * 4;
    if (Math.random() < 0.3) { cow.wanderDx = 0; cow.wanderDz = 0; }
    else {
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.6 + Math.random() * 0.5;
      cow.wanderDx = Math.sin(ang) * spd;
      cow.wanderDz = Math.cos(ang) * spd;
    }
  }

  // --- canMoveTo: returns groundY if passable at current height, false if blocked ---
  function canMoveTo(tx, tz) {
    const bx = Math.floor(tx), bz = Math.floor(tz);
    const footY = Math.floor(cow.y);
    if (getBlock(bx, footY, bz) || getBlock(bx, footY + 1, bz)) return false;
    for (let y = footY + 1; y >= Math.max(0, footY - 1); y--) {
      const b = getBlock(bx, y, bz);
      if (b && b !== 'water') {
        const gY = y + 1;
        if (gY - cow.y > 0.6) return false;
        return gY;
      }
    }
    return false;
  }

  // --- canMoveAirborne: only checks wall collision, no ground required (used while jumping) ---
  function canMoveAirborne(tx, tz) {
    const bx = Math.floor(tx), bz = Math.floor(tz);
    const footY = Math.floor(cow.y);
    return !getBlock(bx, footY, bz) && !getBlock(bx, footY + 1, bz);
  }

  // --- isJumpable: true if there's a 1-block wall ahead the cow can hop over ---
  function isJumpable(tx, tz) {
    const bx = Math.floor(tx), bz = Math.floor(tz);
    const footY = Math.floor(cow.y);
    // Wall = solid block at foot level
    if (!getBlock(bx, footY, bz)) return false;
    // Clear space above the wall top for cow body (footY+1 and footY+2)
    if (getBlock(bx, footY + 1, bz)) return false;
    if (getBlock(bx, footY + 2, bz)) return false;
    return true;
  }

  // --- Gravity ---
  if (!cow.onGround) {
    cow.vy -= 14 * dt;
    cow.y += cow.vy * dt;
    const bx = Math.floor(cow.x), bz = Math.floor(cow.z);
    const footY = Math.floor(cow.y);
    if (cow.vy <= 0) {
      // Scan for ground to land on
      for (let y = footY + 1; y >= 0; y--) {
        const b = getBlock(bx, y, bz);
        if (b && b !== 'water') {
          if (cow.y <= y + 1 + 0.1) {
            cow.y = y + 1;
            cow.vy = 0;
            cow.onGround = true;
          }
          break;
        }
      }
    }
  } else {
    // Keep grounded — snap to terrain
    const bx = Math.floor(cow.x), bz = Math.floor(cow.z);
    for (let y = Math.floor(cow.y) + 1; y >= 0; y--) {
      const b = getBlock(bx, y, bz);
      if (b && b !== 'water') { cow.y = y + 1; break; }
    }
  }

  // --- Movement with wall sliding ---
  const isMoving = cow.wanderDx !== 0 || cow.wanderDz !== 0;
  if (isMoving) {
    const nx = cow.x + cow.wanderDx * dt;
    const nz = cow.z + cow.wanderDz * dt;

    const fullGY = canMoveTo(nx, nz);
    if (fullGY !== false) {
      // Clear path — move freely
      cow.x = nx; cow.z = nz; cow.y = fullGY;
      cow.mesh.rotation.y = Math.atan2(-cow.wanderDx, -cow.wanderDz);
    } else if (!cow.onGround) {
      // Airborne — allow XZ movement through space, walls still block
      if (canMoveAirborne(nx, nz)) { cow.x = nx; cow.z = nz; }
      else if (canMoveAirborne(nx, cow.z)) { cow.x = nx; }
      else if (canMoveAirborne(cow.x, nz)) { cow.z = nz; }
    } else {
      // Try sliding along X only
      const slideXgY = canMoveTo(nx, cow.z);
      if (slideXgY !== false) {
        cow.x = nx; cow.y = slideXgY;
        cow.wanderDz = -cow.wanderDz * 0.5;
        cow.mesh.rotation.y = Math.atan2(-cow.wanderDx, -cow.wanderDz);
      } else {
        // Try sliding along Z only
        const slideZgY = canMoveTo(cow.x, nz);
        if (slideZgY !== false) {
          cow.z = nz; cow.y = slideZgY;
          cow.wanderDx = -cow.wanderDx * 0.5;
          cow.mesh.rotation.y = Math.atan2(-cow.wanderDx, -cow.wanderDz);
        } else {
          // Check if we can JUMP the 1-block wall ahead
          if (isJumpable(nx, nz) || isJumpable(nx, cow.z) || isJumpable(cow.x, nz)) {
            cow.vy = 5.5;
            cow.onGround = false;
          } else {
            // Fully blocked — bounce away
            const bounceAng = Math.atan2(-cow.wanderDz, -cow.wanderDx)
              + (Math.PI * 0.6 + Math.random() * Math.PI * 0.8);
            const spd = 0.6 + Math.random() * 0.4;
            cow.wanderDx = Math.cos(bounceAng) * spd;
            cow.wanderDz = Math.sin(bounceAng) * spd;
            cow.wanderTimer = 0.6 + Math.random();
          }
        }
      }
    }

    // Leg swing animation (Minecraft diagonal gait)
    cow.legPhase = (cow.legPhase || 0) + dt * 6;
    const swing = Math.sin(cow.legPhase) * 0.45;
    const legs = cow.mesh.userData.legs;
    if (legs && legs.length === 4) {
      legs[0].rotation.x =  swing;
      legs[3].rotation.x =  swing;
      legs[1].rotation.x = -swing;
      legs[2].rotation.x = -swing;
    }
  } else {
    const legs = cow.mesh.userData.legs;
    if (legs) legs.forEach(p => { p.rotation.x *= 0.85; });
  }

  // Body bob
  const bob = Math.sin(performance.now() * 0.0012) * 0.025;
  cow.mesh.position.set(cow.x, cow.y + bob, cow.z);
}

function tryHitCow() {
  if (!cow || cow.dead || cowAttackCooldown > 0) return false;
  const dx = cow.x - player.pos.x;
  const dy = (cow.y + 1.02) - player.pos.y;  // body center (~12px above feet, at scale 0.085)
  const dz = cow.z - player.pos.z;
  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
  if (dist > 4.5) return false;
  const lookX = -Math.sin(player.yaw) * Math.cos(player.pitch);
  const lookY =  Math.sin(player.pitch);
  const lookZ = -Math.cos(player.yaw) * Math.cos(player.pitch);
  if ((dx*lookX + dy*lookY + dz*lookZ) / dist < 0.55) return false;

  cowAttackCooldown = 0.45;
  cow.hp--;
  SFX.cowHit();
  triggerSwing();
  // Flash the whole cow red (handles shared materials via Map dedup)
  flashCowRed();
  if (cow.hp <= 0) { killCow(); return true; }
  addChatLine(`Cow: ${cow.hp}/3 ❤`, 'info');
  return true;
}

// Flash every material on the cow red for ~150ms.
// Works correctly even when multiple meshes share the same material instance
// (e.g. left/right body faces), by deduping via a Map.
function flashCowRed() {
  if (!cow || !cow.mesh) return;
  const states = new Map();
  cow.mesh.traverse(m => {
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach(mat => {
      if (!states.has(mat)) {
        states.set(mat, {
          color: mat.color.getHex(),
          emissive: mat.emissive ? mat.emissive.getHex() : null
        });
        mat.color.set(0xff3333);
        if (mat.emissive) mat.emissive.set(0x661111);
      }
    });
  });
  setTimeout(() => {
    states.forEach((s, mat) => {
      mat.color.setHex(s.color);
      if (mat.emissive && s.emissive !== null) mat.emissive.setHex(s.emissive);
    });
  }, 150);
}

function killCow() {
  if (!cow) return;
  const cx = cow.x, cy = cow.y, cz = cow.z;
  scene.remove(cow.mesh);
  cow.dead = true;
  cow = null;
  // Minecraft cows drop 1-3 raw beef + 0-2 leather
  const meatCount = 1 + Math.floor(Math.random() * 3);
  const leatherCount = Math.floor(Math.random() * 3);
  for (let i = 0; i < meatCount; i++) {
    const ox = (Math.random()-0.5)*0.8, oz = (Math.random()-0.5)*0.8;
    const geo = new THREE.BoxGeometry(DROP_SIZE, DROP_SIZE, DROP_SIZE);
    const dropMat = new THREE.MeshLambertMaterial({
      map: rawMeatIconImg.complete && rawMeatIconImg.naturalWidth > 0
           ? makeTexFromImg(rawMeatIconImg) : undefined,
      color: rawMeatIconImg.complete ? 0xffffff : 0xc07050
    });
    const mesh = new THREE.Mesh(geo, dropMat);
    mesh.position.set(cx+ox, cy+0.6, cz+oz);
    scene.add(mesh);
    drops.push({ mesh, type:'raw_meat', x:cx+ox, y:cy+0.6, z:cz+oz, spawnY:cy+0.5,
                 vy: 2.8 + Math.random(), age:0, onGround:false, collectDelay:0.5 });
  }
  for (let i = 0; i < leatherCount; i++) {
    const ox = (Math.random()-0.5)*0.8, oz = (Math.random()-0.5)*0.8;
    const geo = new THREE.BoxGeometry(DROP_SIZE, DROP_SIZE, DROP_SIZE);
    const mat2 = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
    const mesh = new THREE.Mesh(geo, mat2);
    mesh.position.set(cx+ox, cy+0.6, cz+oz);
    scene.add(mesh);
    drops.push({ mesh, type:'leather', x:cx+ox, y:cy+0.6, z:cz+oz, spawnY:cy+0.5,
                 vy: 2.8 + Math.random(), age:0, onGround:false, collectDelay:0.5 });
  }
  addChatLine(`🐄 Cow died! Dropped ${meatCount} raw beef + ${leatherCount} leather. (+8 XP)`, 'system');
  addChatLine(`🐄 A new cow will spawn in 20 seconds...`, 'info');
  setTimeout(() => {
    spawnCow();
    addChatLine(`🐄 A new cow has spawned!`, 'info');
  }, 20000);
}

function flashBreak() {
  const el = document.getElementById('break-flash');
  el.style.transition = 'none';
  el.style.opacity = '1';
  el.style.width = '40px';
  el.style.height = '40px';
  requestAnimationFrame(() => {
    el.style.transition = 'all .25s ease-out';
    el.style.opacity = '0';
    el.style.width = '0px';
    el.style.height = '0px';
  });
}

/* ---------- 12. Hotbar UI ---------- */
// Draw a flat 2D top-face texture icon for each block.
// Textures are loaded async from CDN; if not ready yet, draws a gray placeholder.
// `tintColor` (optional CSS color string) is multiplied onto the drawn image —
// used for blocks whose raw texture is grayscale but rendered tinted in 3D
// (e.g. grass_top is gray, but the world material multiplies it by 0x79C05A).
function drawFlatIcon(pctx, size, topImg, tintColor) {
  pctx.clearRect(0, 0, size, size);
  pctx.imageSmoothingEnabled = false;
  // topImg may be an HTMLImageElement (CDN, check .complete) or an
  // HTMLCanvasElement (procedural / post-load CDN, always ready).
  const ready = topImg && (
    topImg instanceof HTMLCanvasElement ||
    (topImg.complete && topImg.naturalWidth > 0)
  );
  if (ready) {
    try {
      pctx.drawImage(topImg, 0, 0, size, size);
      // Apply material color tint (e.g. grass_top is grayscale in vanilla
      // Minecraft; the 3D material multiplies by a biome green. Replicate
      // that here so the 2D icon matches what the player sees in-world.)
      if (tintColor) {
        pctx.globalCompositeOperation = 'multiply';
        pctx.fillStyle = tintColor;
        pctx.fillRect(0, 0, size, size);
        pctx.globalCompositeOperation = 'source-over';
      }
    } catch(e) {
      // Fallback if canvas is tainted or draw fails
      pctx.fillStyle = '#666';
      pctx.fillRect(0, 0, size, size);
    }
  } else {
    // Placeholder until texture arrives
    pctx.fillStyle = '#666';
    pctx.fillRect(0, 0, size, size);
  }
}

// Convenience: look up a block's top-face icon image + biome tint color,
// then draw it. Used everywhere we render a block icon to a 2D canvas.
// Pre-load oak_sign item icon from Minecraft CDN
const _signItemImg = new Image();
_signItemImg.crossOrigin = 'anonymous';
_signItemImg.src = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/item/oak_sign.png';
_signItemImg.onload = () => refreshHotbarIcons();


function drawBlockIcon(pctx, size, type) {
  if (!type || !BLOCKS[type]) {
    pctx.fillStyle = '#666';
    pctx.fillRect(0, 0, size, size);
    return;
  }
  // Sign: use the dedicated item PNG instead of the entity texture
  if (type === 'sign') {
    pctx.clearRect(0, 0, size, size);
    pctx.imageSmoothingEnabled = false;
    if (_signItemImg.complete && _signItemImg.naturalWidth > 0) {
      pctx.drawImage(_signItemImg, 0, 0, size, size);
    } else {
      pctx.fillStyle = '#b5851a';
      pctx.fillRect(0, 0, size, size);
    }
    return;
  }
  // Torch: draw block/torch.png (already loaded as T.torch) on transparent bg
  if (type === 'torch') {
    pctx.clearRect(0, 0, size, size);
    pctx.imageSmoothingEnabled = false;
    const tImg = T.torch && T.torch.image;
    if (tImg && (tImg instanceof HTMLCanvasElement || (tImg.complete && tImg.naturalWidth > 0))) {
      pctx.drawImage(tImg, 0, 0, size, size);
    }
    return;
  }
  const hasMulti = BLOCKS[type].mats.length >= 6;
  const m = hasMulti ? BLOCKS[type].mats[2] : BLOCKS[type].mats[0];
  const topImg = m.map ? m.map.image : null;
  const tintColor = m.color ? '#' + m.color.getHexString() : null;
  drawFlatIcon(pctx, size, topImg, tintColor);
}

// Re-draw all hotbar slot icons — called after CDN textures finish loading.
function refreshHotbarIcons() {
  const slots = Array.from(hotbarEl.querySelectorAll('.slot'));
  slots.forEach((slot, i) => {
    const type = HOTBAR[i];
    if (!type || !BLOCKS[type]) return;
    const icon = slot.querySelector('canvas.icon');
    if (!icon) return;
    drawBlockIcon(icon.getContext('2d'), 64, type);
  });
  // Also refresh inv grid if open
  if (typeof invOpen !== 'undefined' && invOpen) buildInvGrid();
}

let selectedSlot = 0;
const hotbarEl = document.getElementById('hotbar');
HOTBAR.forEach((type, i) => {
  const slot = document.createElement('div');
  slot.className = 'slot' + (i === 0 ? ' active' : '');
  slot.dataset.i = i;
  const icon = document.createElement('canvas');
  icon.className = 'icon';
  icon.width = icon.height = 64;
  drawBlockIcon(icon.getContext('2d'), 64, type);
  slot.appendChild(icon);
  slot.addEventListener('click', () => selectSlot(i));
  slot.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); selectSlot(i); }, { passive:false });
  hotbarEl.appendChild(slot);
});

/* ---------- 12b. Real Minecraft HUD icons from icons.png ---------- */
// Crops sprites directly from Minecraft Java Edition 1.20 icons.png (256×256).
// Sprite positions (9×9 each) in icons.png:
//   Hearts:  empty=16,0   full=52,0   half=61,0
//   Hunger:  empty=16,27  full=52,27  half=61,27

const ICON_SCALE = 2;

// Fallback procedural icons (used until PNG loads)
function _makeProceduralIcon(rows, colorMap, scale) {
  const W = rows[0].length, H = rows.length;
  const c = document.createElement('canvas');
  c.width = W * scale; c.height = H * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = rows[y][x];
      if (ch === ' ' || !colorMap[ch]) continue;
      ctx.fillStyle = colorMap[ch];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return c.toDataURL();
}
const _HC = { O:'#3C0000', R:'#BE0000', H:'#FF4040', G:'#7F7F7F' };
const _DC = { O:'#3C1A00', H:'#E09040', B:'#DDD4B0', P:'#B06020', G:'#7F7F7F' };
let heartFullURL  = _makeProceduralIcon([' ',' OHRO ',' OHRRRO',' ORRRRO',' ORRRO ',' ORRO  ','  OO   '].map(r=>r.padEnd(9)), _HC, ICON_SCALE);
let heartHalfURL  = heartFullURL;
let heartEmptyURL = _makeProceduralIcon(['         ','  GG  GG ',' G  GG  G',' G      G',' G      G','  G    G ','   G  G  ','    GG   ','         '], _HC, ICON_SCALE);
let drumFullURL   = _makeProceduralIcon(['   OOOO  ','  OHBBOO ',' OHBPPPOO','OHPPPPPOO','OPPPPPPOO',' OPPPPPO ','  OPPPO  ','   OPO   ','    O    '], _DC, ICON_SCALE);
let drumHalfURL   = drumFullURL;
let drumEmptyURL  = _makeProceduralIcon(['   GGGG  ','  G   GG ',' G     GG','G      GG','G      GG',' G     G ','  G   G  ','   G G   ','    G    '], _DC, ICON_SCALE);

// Helper: crop a 9×9 sprite from icons.png at (sx, sy), scaled up
function _cropSprite(img, sx, sy, scale) {
  const S = 9;
  const c = document.createElement('canvas');
  c.width = c.height = S * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, S, S, 0, 0, S * scale, S * scale);
  return c.toDataURL();
}

// Load real Minecraft icons.png and upgrade HUD icons when ready
(function() {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    heartEmptyURL = _cropSprite(img, 16, 0,  ICON_SCALE);
    heartFullURL  = _cropSprite(img, 52, 0,  ICON_SCALE);
    heartHalfURL  = _cropSprite(img, 61, 0,  ICON_SCALE);
    drumEmptyURL  = _cropSprite(img, 16, 27, ICON_SCALE);
    drumFullURL   = _cropSprite(img, 52, 27, ICON_SCALE);
    drumHalfURL   = _cropSprite(img, 61, 27, ICON_SCALE);
    // Refresh HUD with real icons
    if (typeof updateHeartIcons === 'function') { updateHeartIcons(); updateHungerIcons(); }
  };
  img.onerror = () => console.warn('[Craft3D] icons.png failed to load — using procedural fallback');
  img.src = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/gui/icons.png';
})();

const heartsEl = document.getElementById('hearts');
const hungerEl = document.getElementById('hunger');

// Build 10 heart imgs + 10 hunger imgs
const heartImgs = [];
const hungerImgs = [];
for (let i = 0; i < 10; i++) {
  const hi = document.createElement('img');
  hi.width = hi.height = 9 * ICON_SCALE;
  heartsEl.appendChild(hi);
  heartImgs.push(hi);
  const di = document.createElement('img');
  di.width = di.height = 9 * ICON_SCALE;
  hungerEl.appendChild(di);
  hungerImgs.push(di);
}

function updateHeartIcons() {
  const hp = Math.max(0, Math.min(player.maxHealth, player.health));
  for (let i = 0; i < 10; i++) {
    const v = hp - i * 2;
    heartImgs[i].src = v >= 2 ? heartFullURL : v === 1 ? heartHalfURL : heartEmptyURL;
  }
}

function updateHungerIcons() {
  const hg = Math.max(0, Math.min(player.maxHunger, player.hunger));
  for (let i = 0; i < 10; i++) {
    const idx = 9 - i;
    const v = hg - idx * 2;
    hungerImgs[i].src = v >= 2 ? drumFullURL : v === 1 ? drumHalfURL : drumEmptyURL;
  }
}

// Initial paint so HUD shows on first frame (before any movement).
updateHeartIcons();
updateHungerIcons();

function selectSlot(i) {
  selectedSlot = (i + HOTBAR.length) % HOTBAR.length;
  [...hotbarEl.children].forEach((c, j) => c.classList.toggle('active', j === selectedSlot));
  updateHeldItem();
}

addEventListener('keydown', e => {
  if (chatOpen) return;
  const n = parseInt(e.key);
  if (n >= 1 && n <= HOTBAR.length) selectSlot(n - 1);
});
addEventListener('wheel', e => {
  selectSlot(selectedSlot + (e.deltaY > 0 ? 1 : -1));
});
// Mobile hotbar swipe: swipe left/right to scroll through slots
let hotbarSwipeX = null;
hotbarEl.addEventListener('touchstart', e => { hotbarSwipeX = e.touches[0].clientX; }, { passive:true });
hotbarEl.addEventListener('touchend', e => {
  if (hotbarSwipeX === null) return;
  const dx = e.changedTouches[0].clientX - hotbarSwipeX;
  hotbarSwipeX = null;
  if (Math.abs(dx) > 30) selectSlot(selectedSlot + (dx < 0 ? 1 : -1));
}, { passive:true });

/* ---------- 12c. Block Inventory Panel ---------- */
const invPanel  = document.getElementById('inv-panel');
const invGrid   = document.getElementById('inv-grid');
const invBtn    = document.getElementById('inv-btn');
const invClose  = document.getElementById('inv-close');
let   invOpen   = false;

// All placeable blocks (exclude water + bedrock + drop-only items from picker)
const INV_EXCLUDE = new Set(['water','bedrock','torch','sign']);

function buildInvGrid() {
  invGrid.innerHTML = '';
  const allTypes = Object.keys(BLOCKS).filter(k => !INV_EXCLUDE.has(k));
  allTypes.forEach(type => {
    const blockDef = BLOCKS[type];
    const slot = document.createElement('div');
    slot.className = 'inv-slot';

    const icon = document.createElement('canvas');
    icon.width = icon.height = 64;
    if (type === 'meat' && meatIconImg.complete && meatIconImg.naturalWidth > 0) {
      const ictx = icon.getContext('2d');
      ictx.imageSmoothingEnabled = false;
      ictx.drawImage(meatIconImg, 0, 0, 64, 64);
    } else if (type === 'raw_meat' && rawMeatIconImg.complete && rawMeatIconImg.naturalWidth > 0) {
      const ictx = icon.getContext('2d');
      ictx.imageSmoothingEnabled = false;
      ictx.drawImage(rawMeatIconImg, 0, 0, 64, 64);
    } else if (type === 'apple' && appleIconImg.complete && appleIconImg.naturalWidth > 0) {
      const ictx = icon.getContext('2d');
      ictx.imageSmoothingEnabled = false;
      ictx.drawImage(appleIconImg, 0, 0, 64, 64);
    } else {
      drawBlockIcon(icon.getContext('2d'), 64, type);
    }

    const tip = document.createElement('div');
    tip.className = 'inv-tooltip';
    tip.textContent = blockDef.name;

    slot.appendChild(icon);
    slot.appendChild(tip);

    const pick = () => {
      // Replace selected hotbar slot with this block type
      HOTBAR[selectedSlot] = type;
      currentHeld = null; // force held-item refresh
      // Redraw the hotbar icon for the active slot
      const activeSlotEl = hotbarEl.children[selectedSlot];
      if (activeSlotEl) {
        let hotbarIcon = activeSlotEl.querySelector('canvas.icon');
        // Survival slots start without an icon canvas — create one if missing
        // so the picked block actually shows up in the hotbar.
        if (!hotbarIcon) {
          hotbarIcon = document.createElement('canvas');
          hotbarIcon.className = 'icon';
          hotbarIcon.width = hotbarIcon.height = 64;
          activeSlotEl.insertBefore(hotbarIcon, activeSlotEl.firstChild);
        }
        if (type === 'meat' && meatIconImg.complete && meatIconImg.naturalWidth > 0) {
          const ictx = hotbarIcon.getContext('2d');
          ictx.clearRect(0, 0, 64, 64);
          ictx.imageSmoothingEnabled = false;
          ictx.drawImage(meatIconImg, 0, 0, 64, 64);
        } else if (type === 'raw_meat' && rawMeatIconImg.complete && rawMeatIconImg.naturalWidth > 0) {
          const ictx = hotbarIcon.getContext('2d');
          ictx.clearRect(0, 0, 64, 64);
          ictx.imageSmoothingEnabled = false;
          ictx.drawImage(rawMeatIconImg, 0, 0, 64, 64);
        } else if (type === 'apple' && appleIconImg.complete && appleIconImg.naturalWidth > 0) {
          const ictx = hotbarIcon.getContext('2d');
          ictx.clearRect(0, 0, 64, 64);
          ictx.imageSmoothingEnabled = false;
          ictx.drawImage(appleIconImg, 0, 0, 64, 64);
        } else {
          drawBlockIcon(hotbarIcon.getContext('2d'), 64, type);
        }
      }
      updateHeldItem();
      closeInv();
    };

    slot.addEventListener('click', pick);
    slot.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); pick(); }, { passive:false });
    invGrid.appendChild(slot);
  });
}

function openInv() {
  buildInvGrid();
  invPanel.classList.remove('hidden');
  document.getElementById('inv-backdrop').classList.add('vis');
  invOpen = true;
}
function closeInv() {
  invPanel.classList.add('hidden');
  document.getElementById('inv-backdrop').classList.remove('vis');
  invOpen = false;
}

document.getElementById('inv-backdrop').addEventListener('click', closeInv);

invBtn.addEventListener('click', () => { if (invOpen) closeInv(); else openInv(); });
invBtn.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); if (invOpen) closeInv(); else openInv(); }, { passive:false });
invClose.addEventListener('click', closeInv);

/* ---------- 13. Mouse break/place ---------- */
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  if (!locked) return;
  if (e.button === 0) { if (tryHitCow()) { triggerSwing(); } else { mouseDown = true; startBreaking(); triggerSwing(); } }
  else if (e.button === 2) placeBlock();
});
addEventListener('mouseup', e => {
  if (e.button === 0) { mouseDown = false; stopBreaking(); }
});

/* ---------- 14. Mobile detection & controls ---------- */
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
}
if (isMobile()) document.getElementById('mobile').classList.add('show');

const joy = { active:false, x:0, y:0, jump:false, breakBtn:false, flyDown:false };

// ===== D-pad =====
const dpadState = { up:false, down:false, left:false, right:false };

function setupDpadBtn(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  function press(e) { e.preventDefault(); dpadState[key] = true; el.classList.add('pressed'); }
  function release(e) { e.preventDefault(); dpadState[key] = false; el.classList.remove('pressed'); }
  el.addEventListener('touchstart', press, { passive:false });
  el.addEventListener('touchend',   release, { passive:false });
  el.addEventListener('touchcancel',release, { passive:false });
  el.addEventListener('mousedown',  press);
  el.addEventListener('mouseup',    release);
  el.addEventListener('mouseleave', release);
}
setupDpadBtn('dpad-up',    'up');
setupDpadBtn('dpad-down',  'down');
setupDpadBtn('dpad-left',  'left');
setupDpadBtn('dpad-right', 'right');

// Center button = sneak toggle
(function(){
  const centerEl = document.getElementById('dpad-center');
  const sneakLabel = document.getElementById('sneak-label');
  if (!centerEl) return;
  function toggleSneak(e) {
    e.preventDefault();
    player.sneaking = !player.sneaking;
    centerEl.classList.toggle('sneaking', player.sneaking);
    if (sneakLabel) sneakLabel.classList.toggle('active', player.sneaking);
  }
  centerEl.addEventListener('touchend', toggleSneak, { passive:false });
  centerEl.addEventListener('click', toggleSneak);
})();

// look pad (right side swipe) — also handles 5s hold-to-fly on mobile
const lookpad = document.getElementById('lookpad');
let lookId = null, lookLast = null;
let flyHoldStart = null, flyHoldTimer = null;
const FLY_HOLD_MS = 5000;

function startFlyHold() {
  flyHoldStart = performance.now();
  flyHoldTimer = setInterval(() => {
    if (flyHoldStart === null) { clearInterval(flyHoldTimer); return; }
    const elapsed = performance.now() - flyHoldStart;
    if (elapsed >= FLY_HOLD_MS) {
      clearInterval(flyHoldTimer);
      flyHoldStart = null;
      setFly(true);
    }
  }, 50);
}
function cancelFlyHold() {
  flyHoldStart = null;
  clearInterval(flyHoldTimer);
}

lookpad.addEventListener('touchstart', e => {
  e.preventDefault();
  if (lookId === null) {
    const t = e.changedTouches[0];
    lookId = t.identifier;
    lookLast = { x: t.clientX, y: t.clientY };
    // Begin hold-to-fly only when not already flying
    if (!player.flying) startFlyHold();
  }
}, { passive:false });
lookpad.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== lookId) continue;
    const dx = t.clientX - lookLast.x, dy = t.clientY - lookLast.y;
    lookLast = { x: t.clientX, y: t.clientY };
    player.yaw -= dx * getTouchSens();
    player.pitch -= dy * getTouchSens();
    player.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, player.pitch));
    // Cancel fly hold if user is dragging (moved > 8px total)
    if (flyHoldStart !== null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) cancelFlyHold();
  }
}, { passive:false });
function endLook(e) {
  for (const t of e.changedTouches) {
    if (t.identifier !== lookId) continue;
    const touchDur = flyHoldStart !== null ? (performance.now() - flyHoldStart) : Infinity;
    cancelFlyHold();
    lookId = null; lookLast = null;
    // Short tap while flying → land (unfly)
    if (player.flying && touchDur < 300) setFly(false);
  }
}
lookpad.addEventListener('touchend', endLook);
lookpad.addEventListener('touchcancel', endLook);

// mobile buttons
const mJump = document.getElementById('m-jump');
const mBreak = document.getElementById('m-break');
const mPlace = document.getElementById('m-place');
const mFlyDown = document.getElementById('m-fly-down');
mJump.addEventListener('touchstart', e => { e.preventDefault(); joy.jump = true; }, { passive:false });
mJump.addEventListener('touchend',   e => { e.preventDefault(); joy.jump = false; }, { passive:false });
mFlyDown.addEventListener('touchstart', e => { e.preventDefault(); joy.flyDown = true; }, { passive:false });
mFlyDown.addEventListener('touchend',   e => { e.preventDefault(); joy.flyDown = false; }, { passive:false });
mFlyDown.addEventListener('touchcancel', e => { joy.flyDown = false; });
// Mobile break: touch and hold to break (uses the same timed-break logic as desktop)
mBreak.addEventListener('touchstart', e => { e.preventDefault(); if (tryHitCow()) { triggerSwing(); } else { joy.breakBtn = true; startBreaking(); triggerSwing(); } }, { passive:false });
mBreak.addEventListener('touchend',   e => { e.preventDefault(); joy.breakBtn = false; stopBreaking(); }, { passive:false });
mBreak.addEventListener('touchcancel', e => { joy.breakBtn = false; stopBreaking(); });
mPlace.addEventListener('click', (e) => { e.preventDefault(); placeBlock(); });
mPlace.addEventListener('touchstart', e => { e.preventDefault(); placeBlock(); triggerSwing(); }, { passive:false });

/* ---------- 15. Overlay / pause ---------- */
const overlay = document.getElementById('overlay');
const playBtn = document.getElementById('play-btn');
function showOverlay() { overlay.classList.remove('hidden'); fsCorner.classList.remove('hidden'); document.getElementById('top-bar').classList.add('hidden'); document.body.classList.add('in-menu'); }
function hideOverlay() { overlay.classList.add('hidden'); fsCorner.classList.add('hidden'); document.getElementById('top-bar').classList.remove('hidden'); document.body.classList.remove('in-menu'); }
// Shared "loading -> enter game" transition, used by both singleplayer Play
// and multiplayer (once a session is accepted).
function enterGame(loadingMs) {
  document.getElementById('menu-main').classList.add('hidden');
  document.getElementById('mp-panel').classList.add('hidden');
  document.getElementById('menu-loading').classList.remove('hidden');
  setTimeout(() => {
    hideOverlay();
    // Reset main menu for when player presses Escape
    document.getElementById('menu-main').classList.remove('hidden');
    document.getElementById('mp-panel').classList.add('hidden');
    document.getElementById('menu-loading').classList.add('hidden');
    if (!isMobile()) canvas.requestPointerLock();
  }, loadingMs == null ? 1400 : loadingMs);
}
playBtn.addEventListener('click', () => showWorldsPanel());
document.getElementById('play-multi-btn').addEventListener('click', () => {
  showPanel('play-panel');
  setTitleVisible(false);
  document.getElementById('tab-multi').classList.add('active');
  document.getElementById('tab-worlds').classList.remove('active');
  document.getElementById('tc-multi').classList.add('active');
  document.getElementById('tc-worlds').classList.remove('active');
});

/* ========== WORLDS SYSTEM ========== */
let currentGameMode = 'creative'; // 'survival' | 'creative'
const WORLDS_KEY = 'craft3d_worlds';

function loadWorlds() {
  try { return JSON.parse(localStorage.getItem(WORLDS_KEY)) || []; }
  catch { return []; }
}
function saveWorlds(worlds) {
  localStorage.setItem(WORLDS_KEY, JSON.stringify(worlds));
}

// ── Single-player world block persistence ────────────────────────────────────
// Track which blocks the player has placed/broken (diff from generated terrain).
const worldMods = new Map(); // key -> type string (placed) or null (broken)
let currentSingleplayerWorldId = null;

function saveWorldMods(worldId) {
  try {
    localStorage.setItem('craft3d_mods_' + worldId, JSON.stringify([...worldMods]));
  } catch(e) {}
}
function loadWorldMods(worldId) {
  try { return new Map(JSON.parse(localStorage.getItem('craft3d_mods_' + worldId)) || []); }
  catch { return new Map(); }
}

function showPanel(id) {
  ['menu-main','mp-panel','worlds-panel','create-panel','menu-loading','play-panel','settings-panel']
    .forEach(p => document.getElementById(p).classList.add('hidden'));
  if (id) document.getElementById(id).classList.remove('hidden');
}

// Draw a small pixel-art landscape thumbnail for a world entry.
function drawWorldThumbnail(seed) {
  const W = 64, H = 40;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  sky.addColorStop(0, '#3aa8e8'); sky.addColorStop(1, '#87ceeb');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // Sun
  ctx.fillStyle = '#ffe066';
  ctx.beginPath(); ctx.arc(W * 0.78, 7, 5, 0, Math.PI * 2); ctx.fill();
  // Hill heights using seed
  const rng = n => { let x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  const heights = [];
  for (let x = 0; x < W; x++) {
    const h = 0.45 + rng(x * 0.08) * 0.25 + rng(x * 0.04 + 1) * 0.15 + rng(x * 0.02 + 2) * 0.1;
    heights.push(Math.round(H * 0.35 + h * H * 0.3));
  }
  // Far hill
  ctx.fillStyle = '#7aa8c8';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x < W; x++) ctx.lineTo(x, heights[x] + 5);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // Grass top
  ctx.fillStyle = '#4a8a2a';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x < W; x++) ctx.lineTo(x, heights[x]);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6bc83e';
  for (let x = 0; x < W; x++) ctx.fillRect(x, heights[x], 1, 2);
  // Dirt
  ctx.fillStyle = '#7d5535';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x < W; x++) ctx.lineTo(x, heights[x] + 2);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // Trees
  [Math.round(rng(7) * (W - 20)) + 6, Math.round(rng(13) * (W - 20)) + 6].forEach(tx => {
    const ty = heights[Math.min(W - 1, tx)] - 1;
    ctx.fillStyle = '#6b4226'; ctx.fillRect(tx, ty - 7, 2, 7);
    ctx.fillStyle = '#2d7a1a'; ctx.fillRect(tx - 3, ty - 13, 8, 7);
    ctx.fillStyle = '#3d9a28'; ctx.fillRect(tx - 2, ty - 14, 6, 2);
  });
  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  return c.toDataURL();
}

function showWorldsPanel() {
  showPanel('play-panel');
  setTitleVisible(false);
  // Activate worlds tab
  document.getElementById('tab-worlds').classList.add('active');
  document.getElementById('tab-multi').classList.remove('active');
  document.getElementById('tc-worlds').classList.add('active');
  document.getElementById('tc-multi').classList.remove('active');

  const worlds = loadWorlds();
  const listEl = document.getElementById('worlds-list');
  const emptyEl = document.getElementById('worlds-empty');
  listEl.innerHTML = '';

  if (worlds.length === 0) {
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    worlds.forEach((w, idx) => {
      const entry = document.createElement('div');
      entry.className = 'world-entry';
      const thumbSeed = w.created ? (w.created % 9999) : idx * 137;
      const thumbUrl = drawWorldThumbnail(thumbSeed);
      entry.innerHTML = `
        <img src="${thumbUrl}" style="width:64px;height:40px;image-rendering:pixelated;border:2px solid #555;flex-shrink:0;margin-right:10px;" />
        <div style="flex:1;min-width:0;">
          <div class="world-entry-name">${w.name}</div>
          <div class="world-entry-meta">${w.mode.toUpperCase()} MODE</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span class="world-entry-play">▶ PLAY</span>
          <button type="button" class="world-entry-del" data-idx="${idx}"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAHcUlEQVR4nE2XT69l1XHFf6tqn3Pvazf/bEchQ2dkaNpYGJvkC1jKJPE4HsaSIZ/BUQZxrPyR+CDGRGRkjwxGQoBIxzDIByCKZOQoEqF5r/vde3atDOq87gyudHV07z5Vq1attbZef/11qoxtjJFhMgmSmhMCTIEFBagogK0oiwhTBYRRCUefYQcS/YlEISwIiwgIBUaMaZCLsmEzjmIWTDZkU9PIxgKXIWDOCQbbaIIlmEVYlITooiMAQbhQJQowYjqYFMuSDNfEJaCYVZQLV1EGUdQU9uxWgNomlJme2MJlAoNFZXfoMEKEAimQTGaRlUyBUoTMnDCQscy0mSqoyXkWAspdiKuwC2xmuQuck1mFAYruNoJAKAKAlFAkMSCUbDKZK6pqpGSGaoerdgSqwBtzE1UbZZi14a2wzPm8sc3+uIoqUBmlWNeFiEQRhIIKESEGg1OZkYl8hpFEBLYZlvCEqoZ4VrGdCmPmeVJMztvG3IqqM+frM5cPLtnOG0Uhi6pCI7l1XBnLkYhBjmCJIHJQNmP0/M0kSiSgAQOaYBUTnwuXMcW2ze5029jOZ07nE3ObPDhd8T///Tn//tuPXBMHktK8ePdFXT/5BBcXJ5axsCwLNRbGaooCBypRIXIWCJgwqoynoUTJVBVbmW1unE5nTtcPuXp4xfXDE6fTFQ8fnvntvXsGiJAkrFj08Scf++4Ld/Xg6sDxeGA9Hrl1vMVScLxYmZrEEFHJDHrdIxjQZJBoQhlwMefGdj7x5dUV9+9/zgfvv+9nnv4af/+zf+RHfzVLQWCByi4UIa4ur/z2O2/z1lv/yovf/pb8zDN8RWZkMGIQHujRS0CYYVevE4UKih4DZbbtzNXVJe+9975/9ctf8emn/+llEXUOmbIpMSWHmTUdy+C733sFjaG3fvEvfunl72hZDxzWwoZpk9Fcs6BmMLJHQZW7sBIFnKc5b5Pz6QRl/uz730chWcJVRkgElSVVglDMvZk0YOy5r/IEm8Jom1QEwyZyMqxEMcmCGUIDYoNIyCU5XtzihTvP6+t/+Ef+61df4zfvvUtMi/8nra6yM/Tw6pJ1Wfjggw+4f/ml1uOBZQwiBspgkDBEKkCBnATR1UpBCFQB9B5nDC6OR24/9STvvvNrnnzqFvc+/Ii//OEP/fJLL3Pvo4/4m7/9Cc/duaMPP3yPJRfu3H2Be/92j9sXX+G4HhljZeRAgpCQkpBIQSaEQkBgueU2hRKCQUYyRrIuK4Wwwy+/8l1/44+/ASPqz//iBzx48ADLlsN/99OfkgwIyDUZYyFTKCBy7BIsCO3mlIyYzUorGwEJOYgERbSmRxfYNtNUCGbUtiEHI0LYwGwyI1IDxd5xBikjAqmLCIJQEZZwiBIgE96hsqHlnwDCgT33LTJUMNt3AdsC1LbbBNwNKfauyV5+BUgYgYOA/Xk/6hFE4QwUgMTm1olyWG6ltNoZG8pQu16fxW5GN/8HcO7qt3dluUdzs31Upwdh7IDav8uEoLbaXb6QUgiftw27UNmu6roU7ZxBBxVPjNBMqMCzeATivkx4h3/ODibdRVevErWP5fLyC3neYCV9ef8LIhPDTfVN5tlnpIStPk8ddpouJhRg9whi96kwyG2j2v3feyFO+IOvP1uNVQeQ64fXiLC8/9ns4tBkM8a+8ZjHIodo5ICQTPWRNMiGmjiy+0KN5YTpCmZ16jNYqjmr26zWk23b+oX7eV0soO3x/KsLsEx0HHP/JkBE57jqOcqFdn0wtlKW3fFuNsF7G7QHQJFK8J4lKcJml+tWQAWKpBcz3MWzk4YCEltNRKkZu89LEhrpjeJwOHYVNnNuOGRXPSYaQnv6jTA4MKbUEU8y+od//ifqNJuV2zWnMufTidP1A65PG5cPLvni88/5/e8/4/lv3vWPX32N3332XyBY15X7/3ufuRX3L79wjkXvvPs2//HxJ/ras8/y1See4tbt2xyPR5bDyrqurMsgY2EZC1qSUVW9q54tt7uaOQMHpJJlDI7rBW+8+QZvvPnzhrGKUrM9IqiyrCIZ5zt3n+OQCxrZCVnqsHojbtH3C1mMVow93e4xgQiGxURsmRwOR558+mn+9E9e0byZ1x7bhNg8O5oXKJPjxZH1eGDJJCPZE2CPtYWwc2Qkg60eMVLqdKwCMgmCdSR1PHJbwcXxwKxJbbskqfAUuEMsgnSQh4V1PbCsB5axEHnjhDcS3Nslw+gLwK5MBKglUy60BPLCYWkYqxaqZocXFZqmPNms/UJSpBONZCwLYxmPLifkbvd7ARMIimFERcciV1tyRFAaZACrmDVYnTgLq5iGMFRNDCzTzWiCwDjFyJXIYESSKTJ69dqOW96NGab6Dqh2rjn78BHBhkDR2eCiqEpmmcON8Xr0Cra0te+onVMhIvteENGup7baRmRf0XGjIdq3oJ2z5xXONqTRDI6ErJsR9dhUZrmRso4LnQPoG3DHMVAG+8Wt9ahtnKFdgEKibB7HDpMp+g4xEAWG2qMbHZxRtmO2fD2+lrOTTgoygrxB5JFNg0r8H/5jwiys2ytTAAAAAElFTkSuQmCC" alt="delete"></button>
        </div>`;
      // Delete button
      const delBtn = entry.querySelector('.world-entry-del');
      const doDelete = e => { e.stopPropagation(); e.preventDefault(); openDelConfirm(w.name, idx); };
      delBtn.addEventListener('touchstart', doDelete, { passive:false });
      delBtn.addEventListener('click', doDelete);
      entry.addEventListener('click', () => startWorld(w));
      listEl.appendChild(entry);
    });
  }
}

function showCreatePanel() {
  showPanel('create-panel');
  document.getElementById('world-name-input').value = '';
  selectedMode = 'survival';
  document.getElementById('mode-survival').classList.add('active');
  document.getElementById('mode-creative').classList.remove('active');
}

let selectedMode = 'survival';
document.getElementById('mode-survival').addEventListener('click', () => {
  selectedMode = 'survival';
  document.getElementById('mode-survival').classList.add('active');
  document.getElementById('mode-creative').classList.remove('active');
});
document.getElementById('mode-creative').addEventListener('click', () => {
  selectedMode = 'creative';
  document.getElementById('mode-creative').classList.add('active');
  document.getElementById('mode-survival').classList.remove('active');
});

document.getElementById('worlds-create-btn').addEventListener('click', showCreatePanel);
document.getElementById('play-back-btn').addEventListener('click', () => { setTitleVisible(true); showPanel('menu-main'); });
document.getElementById('create-back-btn').addEventListener('click', showWorldsPanel);

// Tab switching
document.getElementById('tab-worlds').addEventListener('click', () => {
  document.getElementById('tab-worlds').classList.add('active');
  document.getElementById('tab-multi').classList.remove('active');
  document.getElementById('tc-worlds').classList.add('active');
  document.getElementById('tc-multi').classList.remove('active');
  showWorldsPanel();
});
document.getElementById('tab-multi').addEventListener('click', () => {
  document.getElementById('tab-multi').classList.add('active');
  document.getElementById('tab-worlds').classList.remove('active');
  document.getElementById('tc-multi').classList.add('active');
  document.getElementById('tc-worlds').classList.remove('active');
  if (myUsername) document.getElementById('mp-username').value = myUsername;
});

document.getElementById('create-confirm-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('world-name-input');
  const name = nameInput.value.trim() || 'My World';
  const world = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), seed: (Math.random() * 2147483647) | 0, name, mode: selectedMode, created: Date.now() };
  const worlds = loadWorlds();
  worlds.unshift(world); // newest first
  saveWorlds(worlds);
  startWorld(world);
});

function startWorld(world) {
  currentGameMode = world.mode;
  applyGameMode(world.mode);

  // ── Regenerate terrain deterministically for this world ───────────────────
  currentSingleplayerWorldId = world.id || null;
  worldMods.clear();
  // Seed rng so tree placement is identical every load
  if (world.seed !== undefined) rng = mulberry32(world.seed);
  blocks.clear();
  generate();
  rebuildMeshes();

  // ── Re-apply any blocks the player placed or broke in a previous session ──
  if (world.id) {
    const mods = loadWorldMods(world.id);
    if (mods.size > 0) {
      for (const [k, type] of mods) {
        worldMods.set(k, type);
        if (type === null) blocks.delete(k);
        else blocks.set(k, type);
      }
      rebuildMeshes();
    }
  }

  // Load sign texts/facings and rebuild sign meshes
  signTexts.clear(); signFacings.clear();
  for (const [, g] of signObjects) scene.remove(g);
  signObjects.clear();
  if (world.id) {
    try {
      const sd = JSON.parse(localStorage.getItem('craft3d_signs_' + world.id) || '{}');
      if (sd.texts) for (const [k,v] of sd.texts) signTexts.set(k, v);
      if (sd.facings) for (const [k,v] of sd.facings) signFacings.set(k, v);
    } catch {}
    for (const [k, type] of blocks) {
      if (type === 'sign') {
        const [sx,sy,sz] = k.split(',').map(Number);
        buildSignMesh(sx, sy, sz);
      }
    }
  }

  spawnCow();

  showPanel('menu-loading');
  setTimeout(() => {
    hideOverlay(); // hides overlay + fsCorner, and crucially shows #top-bar (pause button)
    // Reset panels for ESC
    document.getElementById('menu-main').classList.remove('hidden');
    if (!isMobile()) canvas.requestPointerLock();
  }, 1400);
}

function applyGameMode(mode) {
  const CREATIVE_BLOCKS = ['dirt','stone','sand','log','leaves','glass','oak','sign','torch'];
  const SURVIVAL_SLOTS = 8;

  // Clear HOTBAR array
  HOTBAR.length = 0;
  if (mode === 'creative') CREATIVE_BLOCKS.forEach(b => HOTBAR.push(b));

  // Rebuild hotbar UI
  hotbarEl.innerHTML = '';

  if (mode === 'survival') {
    for (let i = 0; i < SURVIVAL_SLOTS; i++) HOTBAR.push(null);
    Object.keys(survivalCounts).forEach(k => delete survivalCounts[k]);
    for (let i = 0; i < SURVIVAL_SLOTS; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot' + (i === 0 ? ' active' : '');
      slot.dataset.i = i;
      slot.addEventListener('click', () => selectSlot(i));
      slot.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); selectSlot(i); }, { passive:false });
      hotbarEl.appendChild(slot);
    }
  } else {
    HOTBAR.forEach((type, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot' + (i === 0 ? ' active' : '');
      slot.dataset.i = i;
      const icon = document.createElement('canvas');
      icon.className = 'icon'; icon.width = icon.height = 64;
      drawBlockIcon(icon.getContext('2d'), 64, type);
      slot.appendChild(icon);
      slot.addEventListener('click', () => selectSlot(i));
      slot.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); selectSlot(i); }, { passive:false });
      hotbarEl.appendChild(slot);
    });
  }

  selectedSlot = 0;
  updateHeldItem();
}
document.getElementById('settings-btn').addEventListener('click', () => showSettingsPanel());

/* ========== SETTINGS SYSTEM ========== */
const SETTINGS_KEY = 'craft3d_settings';
const settings = (() => {
  const defaults = {
    cameraMode: 'first',   // 'first' | 'third'
    fov: 75,
    mouseSens: 5,          // 1-20 (maps to 0.0005*val)
    touchSens: 8,          // 1-20 (maps to 0.001*val)
    graphics: 'fancy',     // 'fast' | 'fancy'
    fogDist: 110,
    showFps: false,
  };
  try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}); }
  catch { return Object.assign({}, defaults); }
})();
function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

// Mouse sensitivity: slider 1-20 → multiplier 0.0005-0.010
function getMouseSens() { return settings.mouseSens * 0.0005; }
function getTouchSens() { return settings.touchSens * 0.001; }

function applyFov() {
  camera.fov = settings.fov;
  camera.updateProjectionMatrix();
}
function applyGraphics() {
  if (settings.graphics === 'fast') {
    renderer.setPixelRatio(1);
    scene.fog.near = settings.fogDist * 0.5;
    scene.fog.far  = settings.fogDist;
  } else {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    scene.fog.near = settings.fogDist * 0.5;
    scene.fog.far  = settings.fogDist;
  }
  renderer.setSize(innerWidth, innerHeight); // re-apply after pixel ratio change
}
function applyFog() {
  scene.fog.near = settings.fogDist * 0.5;
  scene.fog.far  = settings.fogDist;
}
function applyFpsCounter() {
  document.getElementById('fps-counter').classList.toggle('hidden', !settings.showFps);
}
// Apply all settings on load
applyFov();
applyGraphics();
applyFpsCounter();

function showSettingsPanel() {
  showPanel('settings-panel');
  setTitleVisible(false);
  // Sync UI to current settings
  document.getElementById('fov-slider').value = settings.fov;
  document.getElementById('fov-val').textContent = settings.fov + '°';
  document.getElementById('mouse-sens-slider').value = settings.mouseSens;
  document.getElementById('mouse-sens-val').textContent = settings.mouseSens;
  document.getElementById('touch-sens-slider').value = settings.touchSens;
  document.getElementById('touch-sens-val').textContent = settings.touchSens;
  document.getElementById('fog-slider').value = settings.fogDist;
  document.getElementById('fog-val').textContent = settings.fogDist;
  // Camera mode
  document.getElementById('cam-first').classList.toggle('active', settings.cameraMode === 'first');
  document.getElementById('cam-third').classList.toggle('active', settings.cameraMode === 'third');
  // Graphics
  document.getElementById('gfx-fast').classList.toggle('active', settings.graphics === 'fast');
  document.getElementById('gfx-fancy').classList.toggle('active', settings.graphics === 'fancy');
  // FPS
  document.getElementById('fps-on').classList.toggle('active', settings.showFps);
  document.getElementById('fps-off').classList.toggle('active', !settings.showFps);
}

// Camera mode toggles
document.getElementById('cam-first').addEventListener('click', () => {
  settings.cameraMode = 'first';
  document.getElementById('cam-first').classList.add('active');
  document.getElementById('cam-third').classList.remove('active');
  saveSettings();
});
document.getElementById('cam-third').addEventListener('click', () => {
  settings.cameraMode = 'third';
  document.getElementById('cam-third').classList.add('active');
  document.getElementById('cam-first').classList.remove('active');
  saveSettings();
});

// FOV slider
document.getElementById('fov-slider').addEventListener('input', e => {
  settings.fov = parseInt(e.target.value);
  document.getElementById('fov-val').textContent = settings.fov + '°';
  applyFov(); saveSettings();
});

// Mouse sensitivity
document.getElementById('mouse-sens-slider').addEventListener('input', e => {
  settings.mouseSens = parseInt(e.target.value);
  document.getElementById('mouse-sens-val').textContent = settings.mouseSens;
  saveSettings();
});

// Touch sensitivity
document.getElementById('touch-sens-slider').addEventListener('input', e => {
  settings.touchSens = parseInt(e.target.value);
  document.getElementById('touch-sens-val').textContent = settings.touchSens;
  saveSettings();
});

// Graphics toggles
document.getElementById('gfx-fast').addEventListener('click', () => {
  settings.graphics = 'fast';
  document.getElementById('gfx-fast').classList.add('active');
  document.getElementById('gfx-fancy').classList.remove('active');
  applyGraphics(); saveSettings();
});
document.getElementById('gfx-fancy').addEventListener('click', () => {
  settings.graphics = 'fancy';
  document.getElementById('gfx-fancy').classList.add('active');
  document.getElementById('gfx-fast').classList.remove('active');
  applyGraphics(); saveSettings();
});

// Fog/render distance slider
document.getElementById('fog-slider').addEventListener('input', e => {
  settings.fogDist = parseInt(e.target.value);
  document.getElementById('fog-val').textContent = settings.fogDist;
  applyFog(); saveSettings();
});

// FPS counter toggles
document.getElementById('fps-on').addEventListener('click', () => {
  settings.showFps = true;
  document.getElementById('fps-on').classList.add('active');
  document.getElementById('fps-off').classList.remove('active');
  applyFpsCounter(); saveSettings();
});
document.getElementById('fps-off').addEventListener('click', () => {
  settings.showFps = false;
  document.getElementById('fps-off').classList.add('active');
  document.getElementById('fps-on').classList.remove('active');
  applyFpsCounter(); saveSettings();
});

// Settings back button
document.getElementById('settings-back-btn').addEventListener('click', () => {
  setTitleVisible(true);
  showPanel('menu-main');
});

// Game over screen buttons
document.getElementById('gameover-respawn').addEventListener('click', doRespawn);
document.getElementById('gameover-quit').addEventListener('click', () => {
  hideGameOver();
  // Reset player vitals silently
  player.health = player.maxHealth;
  player.hunger = player.maxHunger;
  updateHeartIcons(); updateHungerIcons();
  spawnPlayer(); player.vel.set(0,0,0); player.fallStart = null;
  setTimeout(() => {
    // Fully reset overlay state: hide all panels, show menu-main + title
    showPanel('menu-main');
    setTitleVisible(true);
    showOverlay();
  }, 420);
});

// Fullscreen corner button
const fsCorner = document.getElementById('fs-corner');
function updateFsCorner() {
  fsCorner.textContent = document.fullscreenElement ? '⛶ EXIT FULLSCREEN' : '⛶ FULLSCREEN';
}
fsCorner.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
});
document.addEventListener('fullscreenchange', updateFsCorner);

// Title hide/show when entering play panel
function setTitleVisible(visible) {
  document.getElementById('menu-title').classList.toggle('hide-title', !visible);
  document.getElementById('menu-subtitle').classList.toggle('hide-title', !visible);
}
addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    if (typeof invOpen !== 'undefined' && invOpen) { closeInv(); return; }
    if (pauseOpen) { closePauseMenu(); if (!isMobile()) canvas.requestPointerLock(); }
    // pointer lock loss handles showing pause menu on desktop automatically
  }
});
addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  handCamera.aspect = innerWidth/innerHeight;
  handCamera.updateProjectionMatrix();
});

/* ---------- 15b. First-person hand / held block view ---------- */
const handScene = new THREE.Scene();
const handCamera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 10);
handCamera.position.set(0, 0, 0);

const handHemi = new THREE.HemisphereLight(0xffeedd, 0x445566, 1.5);
handScene.add(handHemi);
const handSun = new THREE.DirectionalLight(0xfffaf0, 1.1);
handSun.position.set(3, 4, 2);
handScene.add(handSun);
const handFill = new THREE.DirectionalLight(0x8899bb, 0.3);
handFill.position.set(-2, 1, -1);
handScene.add(handFill);

// Blocky Minecraft-style hand — shown when the held slot is empty.
function buildHand() {
  const hand = new THREE.Group();
  const skin      = new THREE.MeshLambertMaterial({ color: 0xD4956A });
  const skinShade = new THREE.MeshLambertMaterial({ color: 0xB8784E });
  const sleeve    = new THREE.MeshLambertMaterial({ color: 0x4A7CC2 });
  const sleeveDk  = new THREE.MeshLambertMaterial({ color: 0x2E5A9E });

  // Arm sleeve (upper portion)
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.72, 0.40), [
    sleeveDk, sleeveDk, sleeve, sleeveDk, sleeve, sleeveDk
  ]);
  arm.position.set(0, -0.42, 0);
  hand.add(arm);

  // Fist — single solid skin block, no wrist seam
  const fist = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.38), [
    skin, skin, skin, skinShade, skin, skinShade
  ]);
  fist.position.set(0, -0.02, 0);
  hand.add(fist);

  return hand;
}

const handContainer = new THREE.Group();
handScene.add(handContainer);

const handMesh = buildHand();
handMesh.visible = false;
handContainer.add(handMesh);

let heldBlockMesh = null;
let currentHeld = null;

function updateHeldItem() {
  const type = HOTBAR[selectedSlot];
  if (currentHeld === type) return;
  if (heldBlockMesh) {
    handContainer.remove(heldBlockMesh);
    heldBlockMesh = null;
  }
  if (type) {
    const geo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    let mats;
    // Use real PNG textures for meat items to avoid black transparent issue
    if (type === 'raw_meat' && rawMeatIconImg.complete && rawMeatIconImg.naturalWidth > 0) {
      const tex = makeTexFromImg(rawMeatIconImg);
      const m = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
      mats = [m,m,m,m,m,m];
    } else if (type === 'meat' && meatIconImg.complete && meatIconImg.naturalWidth > 0) {
      const tex = makeTexFromImg(meatIconImg);
      const m = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
      mats = [m,m,m,m,m,m];
    } else if (type === 'apple' && appleIconImg.complete && appleIconImg.naturalWidth > 0) {
      const tex = makeTexFromImg(appleIconImg);
      const m = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
      mats = [m,m,m,m,m,m];
    } else {
      mats = BLOCKS[type].mats.length >= 6 ? BLOCKS[type].mats : BLOCKS[type].mats[0];
    }
    heldBlockMesh = new THREE.Mesh(geo, mats);
    handContainer.add(heldBlockMesh);
    handMesh.visible = false;
  } else {
    handMesh.visible = true;
  }
  currentHeld = type;
}
updateHeldItem();

// Resting position: bottom-right corner, tilted like Minecraft
handContainer.position.set(0.65, -0.50, -1.0);
handContainer.rotation.set(-0.35, -0.55, 0.05);

let swingT = 0;
function triggerSwing() { swingT = 1; }

let eatT = 0; // 0 = idle, counts down from 1.6
function startEating() { eatT = 1.6; swingT = 0; }

/* ---------- 16. Multiplayer (Supabase) ---------- */
const SB_URL = 'https://mzhjmxmhjauhjzjmhixs.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aGpteG1oamF1aGp6am1oaXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTYwNDIsImV4cCI6MjA5NzI5MjA0Mn0.R8XINojvJkrIMoOE8tb5g6Nv-VpalrH00p_Bn6zjW14';
const sb = window.supabase.createClient(SB_URL, SB_ANON_KEY);

let myUsername = '';
let isMultiplayer = false;
let currentWorldId = null;
let inviteListenChannel = null; // listens for invites addressed to me
let inviteWatchChannel = null;  // watches the status of an invite I sent
let worldChannel = null;        // syncs block place/break for this world
let presenceChannel = null;     // broadcasts player positions (no DB writes)
const remotePlayers = {};       // username -> render/interpolation state

const mpStatusEl = document.getElementById('mp-status');
function mpStatus(msg, isErr) {
  mpStatusEl.textContent = msg;
  mpStatusEl.classList.toggle('err', !!isErr);
}

// =============================================
// ===== FRIEND SYSTEM — Sign In & Friends =====
// =============================================

// Hash password with SHA-256 (Web Crypto API)
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Auth tab switch
function switchAuthTab(tab) {
  document.getElementById('auth-tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('auth-tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('auth-submit-btn').textContent = tab === 'signin' ? 'SIGN IN' : 'SIGN UP';
  document.getElementById('auth-submit-btn').onclick = tab === 'signin' ? authSubmit : authSubmit;
  authStatus('');
  document.getElementById('auth-submit-btn').dataset.mode = tab;
}
function authStatus(msg, err) {
  const el = document.getElementById('mp-auth-status');
  el.textContent = msg; el.className = err ? 'err' : '';
}
function friendsStatus(msg) { document.getElementById('mp-friends-status').textContent = msg; }

// Sign in / Sign up
async function authSubmit() {
  const mode = document.getElementById('auth-submit-btn').dataset.mode || 'signin';
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!username) { authStatus('Enter a username.', true); return; }
  if (!password) { authStatus('Enter a password.', true); return; }
  if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
    authStatus('Username: letters, numbers, _ only (2-20 chars).', true); return;
  }
  authStatus('...');
  const hash = await hashPassword(password);
  if (mode === 'signup') {
    const { error } = await sb.from('game_users').insert({ username, password_hash: hash });
    if (error) {
      authStatus(error.code === '23505' ? 'Username already taken.' : 'Error: ' + error.message, true);
      return;
    }
    authStatus('Account created! Signing in...');
  }
  // Verify credentials
  const { data: user } = await sb.from('game_users')
    .select('username').eq('username', username).eq('password_hash', hash).maybeSingle();
  if (!user) { authStatus('Wrong username or password.', true); return; }

  // Signed in!
  myUsername = username;
  document.getElementById('mp-signed-name').textContent = username;

  document.getElementById('mp-auth').style.display = 'none';
  document.getElementById('mp-friends').classList.add('visible');
  await sb.from('online_players').upsert({ username, world_id: null });
  listenForInvites();
  listenForFriendRequests();
  refreshFriends();
}

function signOut() {
  myUsername = '';
  document.getElementById('mp-auth').style.display = '';
  document.getElementById('mp-friends').classList.remove('visible');
  document.getElementById('auth-password').value = '';
  document.getElementById('friend-search-results').innerHTML = '';
  if (inviteListenChannel) { sb.removeChannel(inviteListenChannel); inviteListenChannel = null; }
}

// ---- Search users ----
async function searchUsers() {
  const q = document.getElementById('friend-search-input').value.trim();
  const el = document.getElementById('friend-search-results');
  if (!q) { el.innerHTML = ''; return; }
  el.innerHTML = '<div style="color:#555;font-size:11px">Searching...</div>';
  const { data } = await sb.from('game_users')
    .select('username').ilike('username', '%' + q + '%').neq('username', myUsername).limit(8);
  if (!data || !data.length) { el.innerHTML = '<div style="color:#555;font-size:11px">No users found.</div>'; return; }
  // Get existing friendship/request status
  const names = data.map(r => r.username);
  const { data: reqs } = await sb.from('friend_requests')
    .select('from_username,to_username,status')
    .or(`from_username.eq.${myUsername},to_username.eq.${myUsername}`);
  const reqMap = {};
  (reqs||[]).forEach(r => {
    const other = r.from_username === myUsername ? r.to_username : r.from_username;
    reqMap[other] = r.status;
  });
  el.innerHTML = '';
  for (const row of data) {
    const status = reqMap[row.username];
    const div = document.createElement('div');
    div.className = 'search-result-row';
    let btn = '';
    if (status === 'accepted') btn = '<span style="color:#4f4;font-size:10px">✔ FRIENDS</span>';
    else if (status === 'pending') btn = '<span style="color:#ffdd77;font-size:10px">⏳ PENDING</span>';
    else btn = `<button class="friend-btn green" onclick="sendFriendRequest('${row.username}', this)">➕ ADD</button>`;
    div.innerHTML = `<div class="friend-avatar">👤</div><div class="friend-name">${row.username}</div>${btn}`;
    el.appendChild(div);
  }
}

// ---- Friend Requests ----
async function sendFriendRequest(toUsername, btn) {
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  const { error } = await sb.from('friend_requests')
    .insert({ from_username: myUsername, to_username: toUsername });
  if (error) {
    friendsStatus('Could not send request: ' + error.message);
    if (btn) { btn.disabled = false; btn.textContent = '➕ ADD'; }
    return;
  }
  if (btn) btn.outerHTML = '<span style="color:#ffdd77;font-size:10px">⏳ PENDING</span>';
  friendsStatus('Friend request sent to ' + toUsername + '!');
}

async function acceptFriendRequest(id, fromUsername) {
  await sb.from('friend_requests').update({ status: 'accepted' }).eq('id', id);
  friendsStatus('You are now friends with ' + fromUsername + '!');
  refreshFriends();
}

async function declineFriendRequest(id) {
  await sb.from('friend_requests').delete().eq('id', id);
  refreshFriends();
}

// ---- Refresh friends list & pending requests ----
async function refreshFriends() {
  const { data: reqs } = await sb.from('friend_requests')
    .select('id,from_username,to_username,status')
    .or(`from_username.eq.${myUsername},to_username.eq.${myUsername}`);
  if (!reqs) return;

  // Online players
  const { data: online } = await sb.from('online_players').select('username,world_id');
  const onlineMap = {};
  (online||[]).forEach(o => { onlineMap[o.username] = o.world_id; });

  // Pending (incoming)
  const pendingEl = document.getElementById('friends-pending');
  const pending = reqs.filter(r => r.to_username === myUsername && r.status === 'pending');
  if (!pending.length) {
    pendingEl.innerHTML = '<div style="color:#555;font-size:11px">No pending requests</div>';
  } else {
    pendingEl.innerHTML = '';
    for (const r of pending) {
      const div = document.createElement('div');
      div.className = 'friend-row';
      div.innerHTML = `<div class="friend-avatar">👤</div>
        <div class="friend-name">${r.from_username}</div>
        <button class="friend-btn green" onclick="acceptFriendRequest(${r.id},'${r.from_username}')">✔</button>
        <button class="friend-btn red" onclick="declineFriendRequest(${r.id})">✘</button>`;
      pendingEl.appendChild(div);
    }
  }

  // Friends list (accepted both directions)
  const friendsEl = document.getElementById('friends-list');
  const accepted = reqs.filter(r => r.status === 'accepted');
  if (!accepted.length) {
    friendsEl.innerHTML = '<div style="color:#555;font-size:11px">No friends yet — search for someone!</div>';
  } else {
    friendsEl.innerHTML = '';
    for (const r of accepted) {
      const friendName = r.from_username === myUsername ? r.to_username : r.from_username;
      const worldId = onlineMap[friendName];
      const isOnline = !!worldId;
      const div = document.createElement('div');
      div.className = 'friend-row';
      div.innerHTML = `<div class="friend-avatar">👤</div>
        <div class="friend-name">${friendName}</div>
        <div class="friend-online${isOnline ? ' on' : ''}" title="${isOnline ? 'Online' : 'Offline'}"></div>
        ${isOnline && worldId !== '__solo__'
          ? `<button class="friend-btn blue" onclick="requestJoinFriend('${friendName}','${worldId}')">JOIN</button>`
          : ''}`;
      friendsEl.appendChild(div);
    }
  }
}

// ---- Request to join friend's world ----
async function requestJoinFriend(friendName, worldId) {
  friendsStatus('Joining ' + friendName + "'s world...");
  const { data, error } = await sb.from('invites')
    .insert({ from_username: myUsername, to_username: friendName, world_id: worldId })
    .select().single();
  if (error) { friendsStatus('Could not join: ' + error.message); return; }
  friendsStatus('Waiting for ' + friendName + ' to accept...');
  watchInvite(data.id, worldId, friendName);
}

// ---- Listen for incoming invites (to me) ----
function listenForInvites() {
  if (!myUsername) return;
  if (inviteListenChannel) { sb.removeChannel(inviteListenChannel); }
  inviteListenChannel = sb.channel('invites-to-' + myUsername)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'invites',
      filter: 'to_username=eq.' + myUsername
    }, (payload) => {
      if (payload.new.status === 'pending') showIncomingInvite(payload.new);
    })
    .subscribe();
}

// ---- Listen for new friend requests (live) ----
function listenForFriendRequests() {
  sb.channel('friend-req-' + myUsername)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'friend_requests',
      filter: 'to_username=eq.' + myUsername
    }, () => refreshFriends())
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'friend_requests',
      filter: 'from_username=eq.' + myUsername
    }, () => refreshFriends())
    .subscribe();
}

function showIncomingInvite(row) {
  if (document.pointerLockElement) document.exitPointerLock();
  const box = document.getElementById('mp-incoming');
  document.getElementById('mp-incoming-text').textContent = row.from_username + ' wants to play!';
  box.classList.remove('hidden');
  const acceptBtn = document.getElementById('mp-accept-btn');
  const denyBtn = document.getElementById('mp-deny-btn');
  const cleanup = () => { box.classList.add('hidden'); acceptBtn.onclick = null; denyBtn.onclick = null; };
  acceptBtn.onclick = async () => {
    cleanup();
    await sb.from('invites').update({ status: 'accepted' }).eq('id', row.id);
    joinWorld(row.world_id);
  };
  denyBtn.onclick = async () => {
    cleanup();
    await sb.from('invites').update({ status: 'denied' }).eq('id', row.id);
  };
}

function watchInvite(inviteId, worldId, friend) {
  if (inviteWatchChannel) { sb.removeChannel(inviteWatchChannel); }
  inviteWatchChannel = sb.channel('invite-watch-' + inviteId)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'invites',
      filter: 'id=eq.' + inviteId
    }, (payload) => {
      if (payload.new.status === 'accepted') {
        friendsStatus(friend + ' accepted! Joining...');
        joinWorld(worldId);
      } else if (payload.new.status === 'denied') {
        friendsStatus(friend + ' declined the invite.', true);
      }
    })
    .subscribe();
}

// ---- Joining / starting a shared world ----
async function joinWorld(worldId) {
  isMultiplayer = true;
  currentWorldId = worldId;
  // Regenerate deterministically from world_id so both players get identical
  // terrain (tree placement etc.), then layer in edits already made by others.
  blocks.clear();
  rng = mulberry32(hashStringToSeed(worldId));
  generate();
  rng = Math.random;
  const { data: rows } = await sb.from('world_blocks').select('x,y,z,type').eq('world_id', worldId);
  if (rows) for (const r of rows) { if (r.type) setBlock(r.x, r.y, r.z, r.type); else delBlock(r.x, r.y, r.z); }
  rebuildMeshes();
  rebuildGrassTufts();
  // Check if banned before joining
  const { data: banRow } = await sb.from('bans').select('username').eq('username', myUsername).maybeSingle();
  if (banRow) {
    addChatLine('🔨 You are banned from this server.', 'error');
    isMultiplayer = false;
    return;
  }
  // Mark player as online in this world
  if (myUsername) await sb.from('online_players').upsert({ username: myUsername, world_id: worldId });
  spawnPlayer();
  subscribeWorldChanges(worldId);
  subscribePresence(worldId);
  enterGame(900);
}

function subscribeWorldChanges(worldId) {
  if (worldChannel) { sb.removeChannel(worldChannel); }
  worldChannel = sb.channel('world-blocks-' + worldId)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'world_blocks',
      filter: 'world_id=eq.' + worldId
    }, (payload) => {
      const row = payload.new || payload.old;
      if (!row) return;
      if (row.type) setBlock(row.x, row.y, row.z, row.type); else delBlock(row.x, row.y, row.z);
      rebuildMeshes();
      rebuildGrassTufts();
    })
    .subscribe();
}

async function syncBlockChange(x, y, z, type) {
  try { await sb.from('world_blocks').upsert({ world_id: currentWorldId, x, y, z, type }); }
  catch (e) { /* best-effort, ignore network hiccups */ }
}

// ---- Remote player positions (Realtime Broadcast — no DB writes needed) ----
function subscribePresence(worldId) {
  if (presenceChannel) { sb.removeChannel(presenceChannel); }
  presenceChannel = sb.channel('presence-' + worldId)
    .on('broadcast', { event: 'pos' }, (msg) => {
      if (!msg.payload || msg.payload.username === myUsername) return;
      updateRemotePlayer(msg.payload);
    })
    .on('broadcast', { event: 'chat' }, (msg) => {
      if (!msg.payload || msg.payload.username === myUsername) return;
      addChatLine(`<${msg.payload.username}> ${msg.payload.text}`);
    })
    .on('broadcast', { event: 'kick' }, (msg) => {
      if (!msg.payload || msg.payload.target !== myUsername) return;
      isMultiplayer = false;
      if (presenceChannel) { sb.removeChannel(presenceChannel); presenceChannel = null; }
      addChatLine('⚠ You were kicked from the server.', 'error');
    })
    .on('broadcast', { event: 'ban' }, (msg) => {
      if (!msg.payload || msg.payload.target !== myUsername) return;
      isMultiplayer = false;
      if (presenceChannel) { sb.removeChannel(presenceChannel); presenceChannel = null; }
      addChatLine('🔨 You have been banned from this server.', 'error');
    })
    .subscribe();
}

// ---- Accurate Minecraft Steve player model ----
// Pixel scale: player.height (1.7) maps to 32 skin pixels tall
const PX = 1.7 / 32; // one skin pixel in world units (~0.053125)

// Steve's authentic colour palette
const STEVE_SKIN  = '#c68642';
const STEVE_HAIR  = '#59330c';
const STEVE_SHIRT = '#6d9fd5';
const STEVE_PANTS = '#2d5499';
const STEVE_BOOT  = '#5c3d1e';

// --- Per-face canvas textures for authentic look ---
function _faceTex(fn) {
  return new THREE.MeshLambertMaterial({ map: toTexture(fn()) });
}
function _solidMat(hex) {
  return new THREE.MeshLambertMaterial({ color: hex });
}

// HEAD front — proper Steve pixel-art face (64px canvas, 8px per cell)
function texSteveFace() {
  const sz = 64, p = 8;
  const c = makeCanvas(sz), x = c.getContext('2d');
  x.fillStyle = STEVE_SKIN; x.fillRect(0, 0, sz, sz);
  // Hair top 2 rows + side columns
  x.fillStyle = STEVE_HAIR;
  x.fillRect(0, 0, sz, p * 2);
  x.fillRect(0, 0, p, p * 4);
  x.fillRect(p * 7, 0, p, p * 4);
  // Forehead skin
  x.fillStyle = STEVE_SKIN; x.fillRect(p, p * 2, p * 6, p * 2);
  // Left eye white (rows 4-5, cols 1-2)
  x.fillStyle = '#e8e8e8'; x.fillRect(p, p * 4, p * 2, p * 2);
  // Right eye white (rows 4-5, cols 5-6)
  x.fillRect(p * 5, p * 4, p * 2, p * 2);
  // Pupils
  x.fillStyle = '#1c1c1c';
  x.fillRect(p * 2, p * 4, p, p * 2);
  x.fillRect(p * 5, p * 4, p, p * 2);
  // Nose shadow
  x.fillStyle = shade(STEVE_SKIN, -0.18);
  x.fillRect(p * 3, p * 5, p * 2, p);
  // Mouth corners + bottom
  x.fillStyle = '#6b3219';
  x.fillRect(p * 2, p * 6, p, p);
  x.fillRect(p * 5, p * 6, p, p);
  x.fillRect(p * 3, p * 7, p * 2, p);
  return c;
}
// HEAD sides (hair top half, skin bottom half)
function texSteveSide() {
  const c = makeCanvas(64), x = c.getContext('2d');
  x.fillStyle = STEVE_SKIN; x.fillRect(0, 0, 64, 64);
  x.fillStyle = STEVE_HAIR; x.fillRect(0, 0, 64, 34);
  return c;
}
// HEAD back (mostly hair, small skin at neck)
function texSteveBack() {
  const c = makeCanvas(64), x = c.getContext('2d');
  x.fillStyle = STEVE_HAIR; x.fillRect(0, 0, 64, 64);
  x.fillStyle = STEVE_SKIN; x.fillRect(10, 42, 44, 22);
  return c;
}
// HEAD top (all hair)
function texSteveTop() {
  const c = makeCanvas(32), x = c.getContext('2d');
  x.fillStyle = STEVE_HAIR; x.fillRect(0, 0, 32, 32);
  return c;
}
// BODY — shirt with shading stripes
function texSteveShirt() {
  const c = makeCanvas(64), x = c.getContext('2d');
  x.fillStyle = STEVE_SHIRT; x.fillRect(0, 0, 64, 64);
  x.fillStyle = shade(STEVE_SHIRT, -0.12);
  x.fillRect(0, 0, 7, 64); x.fillRect(57, 0, 7, 64);
  x.fillStyle = shade(STEVE_SHIRT, -0.08); x.fillRect(0, 56, 64, 8);
  return c;
}
// ARM — sleeve with skin wrist strip
function texSteveArm() {
  const c = makeCanvas(64), x = c.getContext('2d');
  x.fillStyle = STEVE_SHIRT; x.fillRect(0, 0, 64, 64);
  x.fillStyle = STEVE_SKIN; x.fillRect(0, 52, 64, 12);
  x.fillStyle = shade(STEVE_SHIRT, -0.1); x.fillRect(0, 0, 64, 6);
  return c;
}
// LEG — pants with boot at bottom
function texSteveLeg() {
  const c = makeCanvas(64), x = c.getContext('2d');
  x.fillStyle = STEVE_PANTS; x.fillRect(0, 0, 64, 64);
  x.fillStyle = STEVE_BOOT; x.fillRect(0, 48, 64, 16);
  x.fillStyle = shade(STEVE_PANTS, -0.12);
  x.fillRect(0, 0, 7, 48); x.fillRect(57, 0, 7, 48);
  return c;
}

// Material arrays [+X, -X, +Y, -Y, +Z, -Z]
function makeHeadMats() {
  return [
    _faceTex(texSteveSide), _faceTex(texSteveSide),
    _faceTex(texSteveTop),  _solidMat(STEVE_SKIN),
    _faceTex(texSteveBack), _faceTex(texSteveFace),
  ];
}
function makeBodyMats() {
  return [
    _solidMat(shade(STEVE_SHIRT,-0.1)), _solidMat(shade(STEVE_SHIRT,-0.1)),
    _solidMat(shade(STEVE_SHIRT, 0.05)), _solidMat(shade(STEVE_SHIRT,-0.05)),
    _faceTex(texSteveShirt), _faceTex(texSteveShirt),
  ];
}
function makeArmMats() {
  return [
    _faceTex(texSteveArm), _faceTex(texSteveArm),
    _solidMat(shade(STEVE_SHIRT,0.05)), _solidMat(STEVE_SKIN),
    _faceTex(texSteveArm), _faceTex(texSteveArm),
  ];
}
function makeLegMats() {
  return [
    _faceTex(texSteveLeg), _faceTex(texSteveLeg),
    _solidMat(STEVE_PANTS), _solidMat(STEVE_BOOT),
    _faceTex(texSteveLeg), _faceTex(texSteveLeg),
  ];
}

// Builds an accurate Minecraft Steve humanoid.
// Proportions from the skin template (1px = PX world units):
//   Head 8x8x8 | Body 8x12x4 | Arms 4x12x4 | Legs 4x12x4
//   Y from feet: Legs 0-12px, Body 12-24px, Head 24-32px
// Limbs use pivot groups so rotation.x swings from the joint.
function buildPlayerModel() {
  const g = new THREE.Group();

  // HEAD — center at y=28px from feet
  const head = new THREE.Mesh(new THREE.BoxGeometry(8*PX, 8*PX, 8*PX), makeHeadMats());
  head.position.set(0, 28*PX, 0);
  g.add(head);

  // BODY — center at y=18px
  const body = new THREE.Mesh(new THREE.BoxGeometry(8*PX, 12*PX, 4*PX), makeBodyMats());
  body.position.set(0, 18*PX, 0);
  g.add(body);

  // ARMS — pivot at shoulder (y=24px), arm mesh hangs down
  const armL = new THREE.Group();
  armL.position.set(-6*PX, 24*PX, 0);
  const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(4*PX, 12*PX, 4*PX), makeArmMats());
  armLMesh.position.set(0, -6*PX, 0);
  armL.add(armLMesh);
  g.add(armL);

  const armR = new THREE.Group();
  armR.position.set(6*PX, 24*PX, 0);
  const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(4*PX, 12*PX, 4*PX), makeArmMats());
  armRMesh.position.set(0, -6*PX, 0);
  armR.add(armRMesh);
  g.add(armR);

  // LEGS — pivot at hip (y=12px), leg mesh hangs down
  const legL = new THREE.Group();
  legL.position.set(-2*PX, 12*PX, 0);
  const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(4*PX, 12*PX, 4*PX), makeLegMats());
  legLMesh.position.set(0, -6*PX, 0);
  legL.add(legLMesh);
  g.add(legL);

  const legR = new THREE.Group();
  legR.position.set(2*PX, 12*PX, 0);
  const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(4*PX, 12*PX, 4*PX), makeLegMats());
  legRMesh.position.set(0, -6*PX, 0);
  legR.add(legRMesh);
  g.add(legR);

  g.userData.parts = { head, body, armL, armR, legL, legR };
  return g;
}

// ---- Local player model for third-person view ----
const localPlayerModel = buildPlayerModel();
localPlayerModel.visible = false;
scene.add(localPlayerModel);
let localSwingPhase = 0, localSwingAmp = 0;

function updateRemotePlayer(p) {
  let rp = remotePlayers[p.username];
  if (!rp) {
    const mesh = buildPlayerModel();
    scene.add(mesh);
    const tagEl = document.createElement('div');
    tagEl.className = 'mp-tag';
    tagEl.textContent = p.username;
    document.body.appendChild(tagEl);
    rp = remotePlayers[p.username] = {
      mesh, tagEl, x: p.x, y: p.y, z: p.z, yaw: p.yaw,
      tx: p.x, ty: p.y, tz: p.z, tyaw: p.yaw,
      lastSeen: performance.now(), swingPhase: 0, moving: false
    };
  }
  // Flag movement (for the walk-swing animation) based on how far the
  // target moved since the last broadcast we received.
  const dist = Math.hypot(p.x - rp.tx, p.z - rp.tz);
  rp.moving = dist > 0.01;
  rp.tx = p.x; rp.ty = p.y; rp.tz = p.z; rp.tyaw = p.yaw;
  rp.lastSeen = performance.now();
}

function tickRemotePlayers(dt) {
  const now = performance.now();
  for (const name in remotePlayers) {
    const rp = remotePlayers[name];
    if (now - rp.lastSeen > 6000) {
      scene.remove(rp.mesh);
      rp.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      rp.tagEl.remove();
      delete remotePlayers[name];
      continue;
    }
    if (now - rp.lastSeen > 400) rp.moving = false; // no recent updates = standing still
    const k = Math.min(1, dt * 10);
    rp.x += (rp.tx - rp.x) * k; rp.y += (rp.ty - rp.y) * k; rp.z += (rp.tz - rp.z) * k;
    rp.yaw += (rp.tyaw - rp.yaw) * k;
    // Model origin is at the feet; broadcast y is the TOP of the head
    // (same convention as player.pos.y), so drop down by the full height.
    rp.mesh.position.set(rp.x, rp.y - player.height, rp.z);
    rp.mesh.rotation.y = rp.yaw;

    // Simple walk animation: swing arms/legs opposite each other while moving.
    rp.swingPhase += dt * (rp.moving ? 8 : 4);
    const targetAmp = rp.moving ? 0.6 : 0;
    rp.swingAmp = (rp.swingAmp || 0) + (targetAmp - (rp.swingAmp || 0)) * Math.min(1, dt * 6);
    const swing = Math.sin(rp.swingPhase) * rp.swingAmp;
    const parts = rp.mesh.userData.parts;
    parts.legL.rotation.x = swing;
    parts.legR.rotation.x = -swing;
    parts.armL.rotation.x = -swing;
    parts.armR.rotation.x = swing;

    const v = new THREE.Vector3(rp.x, rp.y + 0.25, rp.z).project(camera);
    if (v.z > 1) { rp.tagEl.style.display = 'none'; continue; }
    rp.tagEl.style.display = 'block';
    rp.tagEl.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px';
    rp.tagEl.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
  }
}

let lastPosBroadcast = 0;
function broadcastPosition(now) {
  if (!isMultiplayer || !presenceChannel) return;
  if (now - lastPosBroadcast < 120) return;
  lastPosBroadcast = now;
  presenceChannel.send({
    type: 'broadcast', event: 'pos',
    payload: { username: myUsername, x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw }
  });
}

/* ---------- 17. Animation loop ---------- */

/* ===== Action Message (left side HUD) ===== */
let actionMsgTimer = null;
const actionMsgEl = document.getElementById('action-msg');
function showActionMessage(text, type = '') {
  actionMsgEl.textContent = text;
  actionMsgEl.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(actionMsgTimer);
  actionMsgTimer = setTimeout(() => {
    actionMsgEl.classList.remove('show');
  }, 2500);
}

/* ===== Chat System ===== */
const chatLogEl   = document.getElementById('chat-log');
const chatInputRow= document.getElementById('chat-input-row');
const chatInputEl = document.getElementById('chat-input');
const chatHintEl  = document.getElementById('chat-hint');
let chatOpen = false;
let chatFadeTimers = [];

function addChatLine(text, cls = '') {
  const el = document.createElement('div');
  el.className = 'chat-line' + (cls ? ' ' + cls : '');
  el.textContent = text;
  chatLogEl.appendChild(el);
  // Keep max 40 lines
  while (chatLogEl.children.length > 40) chatLogEl.removeChild(chatLogEl.firstChild);
  // Auto-scroll
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
  // Fade out after 8s (unless chat is open)
  const timer = setTimeout(() => {
    if (!chatOpen) el.classList.add('fade');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1100);
  }, 8000);
  chatFadeTimers.push(timer);
}

function openChat(prefill = '') {
  if (chatOpen) return;
  chatOpen = true;
  chatInputRow.classList.add('open');
  chatHintEl.style.display = 'none';
  chatInputEl.value = prefill;
  chatInputEl.focus();
  // Pause game breaking
  mouseDown = false; stopBreaking();
  // Unlock pointer so user can type
  if (document.pointerLockElement) document.exitPointerLock();
  // Show all chat lines (remove fade)
  [...chatLogEl.children].forEach(c => c.classList.remove('fade'));
  // Highlight the chat button
  document.getElementById('top-chat').classList.add('is-open');
}

function closeChat() {
  if (!chatOpen) return;
  chatOpen = false;
  chatInputRow.classList.remove('open');
  chatInputEl.blur();
  document.getElementById('top-chat').classList.remove('is-open');
  // Re-show hint briefly
  if (locked || isMobile()) {
    chatHintEl.style.display = 'block';
    setTimeout(() => { chatHintEl.style.display = 'none'; }, 3000);
  }
}

async function sendChat() {
  const raw = chatInputEl.value.trim();
  chatInputEl.value = '';
  closeChat();
  if (!raw) return;

  // Commands
  if (raw.startsWith('/')) {
    const parts = raw.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    if (cmd === 'help') {
      addChatLine('=== Commands ===', 'system');
      addChatLine('/fly — toggle fly mode', 'info');
      addChatLine('/tp <x> <y> <z> — teleport', 'info');
      addChatLine('/give <block> — add block to hotbar', 'info');
      addChatLine('/kill — respawn', 'info');
      addChatLine('/clear — clear chat', 'info');
      addChatLine('/pos — show position', 'info');
      addChatLine('/daytime lock — lock to daytime (no night)', 'info');
      addChatLine('/daytime unlock — restore day/night cycle', 'info');
      addChatLine('/kick <name> — kick a player (multiplayer)', 'info');
      addChatLine('/ban <name> — ban a player permanently (multiplayer)', 'info');
    } else if (cmd === 'fly') {
      player.flying = !player.flying;
      document.getElementById('m-fly-down').classList.toggle('hidden', !player.flying);
      addChatLine(player.flying ? '✈ Fly mode ON' : '⬇ Fly mode OFF', 'system');
    } else if (cmd === 'tp') {
      const tx = parseFloat(parts[1]), ty = parseFloat(parts[2]), tz = parseFloat(parts[3]);
      if (isNaN(tx) || isNaN(ty) || isNaN(tz)) {
        addChatLine('Usage: /tp <x> <y> <z>', 'error');
      } else {
        player.pos.set(tx, ty + player.height, tz);
        player.vel.set(0,0,0);
        addChatLine(`Teleported to ${tx} ${ty} ${tz}`, 'system');
      }
    } else if (cmd === 'give') {
      const blockName = parts[1] ? parts[1].toLowerCase() : '';
      if (!blockName || !BLOCKS[blockName]) {
        addChatLine(`Unknown block. Valid: ${Object.keys(BLOCKS).join(', ')}`, 'error');
      } else if (blockName === 'bedrock' || blockName === 'water') {
        addChatLine('Cannot give that block.', 'error');
      } else {
        if (!HOTBAR.includes(blockName)) {
          HOTBAR.push(blockName);
          // Add slot to hotbar UI
          const i = HOTBAR.length - 1;
          const slot = document.createElement('div');
          slot.className = 'slot'; slot.dataset.i = i;
          const icon = document.createElement('canvas'); icon.className='icon'; icon.width=icon.height=64;
          drawBlockIcon(icon.getContext('2d'), 64, blockName);
          slot.appendChild(icon);
          slot.addEventListener('click', () => selectSlot(i));
          hotbarEl.appendChild(slot);
        }
        addChatLine(`Given: ${BLOCKS[blockName].name}`, 'system');
      }
    } else if (cmd === 'kill') {
      damagePlayer(player.maxHealth, 'was killed');
    } else if (cmd === 'clear') {
      while (chatLogEl.firstChild) chatLogEl.removeChild(chatLogEl.firstChild);
    } else if (cmd === 'pos') {
      const px = player.pos.x.toFixed(1), py = (player.pos.y - player.height).toFixed(1), pz = player.pos.z.toFixed(1);
      addChatLine(`Position: ${px}, ${py}, ${pz}`, 'info');

    // ---- Daytime commands ----
    } else if (cmd === 'daytime') {
      const sub = (parts[1] || '').toLowerCase();
      if (sub === 'lock') {
        dayLocked = true;
        dayTime = 0.25; // snap to noon
        addChatLine('☀ Daytime locked — night disabled.', 'system');
      } else if (sub === 'unlock') {
        dayLocked = false;
        addChatLine('🌙 Day/night cycle restored.', 'system');
      } else {
        addChatLine('Usage: /daytime lock  |  /daytime unlock', 'error');
      }

    // ---- Multiplayer: kick ----
    } else if (cmd === 'kick') {
      if (!isMultiplayer || !presenceChannel) {
        addChatLine('⚠ /kick is only available in multiplayer.', 'error');
      } else {
        const target = parts.slice(1).join(' ').trim();
        if (!target) { addChatLine('Usage: /kick <player name>', 'error'); }
        else {
          presenceChannel.send({ type:'broadcast', event:'kick', payload:{ target, by: myUsername } });
          addChatLine(`⚡ Kicked ${target}.`, 'system');
        }
      }

    // ---- Multiplayer: ban ----
    } else if (cmd === 'ban') {
      if (!isMultiplayer || !presenceChannel) {
        addChatLine('⚠ /ban is only available in multiplayer.', 'error');
      } else {
        const target = parts.slice(1).join(' ').trim();
        if (!target) { addChatLine('Usage: /ban <player name>', 'error'); }
        else {
          try {
            await sb.from('bans').upsert({ username: target, banned_by: myUsername });
            presenceChannel.send({ type:'broadcast', event:'ban', payload:{ target, by: myUsername } });
            addChatLine(`🔨 Banned ${target}.`, 'system');
          } catch(e) {
            addChatLine(`Failed to ban: ${e.message}`, 'error');
          }
        }
      }

    } else {
      addChatLine(`Unknown command: /${cmd}  — type /help`, 'error');
    }
    return;
  }

  // Regular chat message
  const name = (typeof myUsername !== 'undefined' && myUsername) ? myUsername : 'Player';
  addChatLine(`<${name}> ${raw}`);
  // Broadcast if multiplayer
  if (typeof isMultiplayer !== 'undefined' && isMultiplayer && typeof presenceChannel !== 'undefined' && presenceChannel) {
    try {
      presenceChannel.send({ type:'broadcast', event:'chat', payload:{ username: name, text: raw } });
    } catch(e) {}
  }
}

chatInputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); sendChat(); }
  if (e.key === 'Escape') { e.preventDefault(); chatInputEl.value = ''; closeChat(); }
  e.stopPropagation(); // prevent game from getting keystrokes
});

// Open chat with T key (only when game is active/locked)
document.addEventListener('keydown', e => {
  if (chatOpen) return;
  if (!locked && !isMobile()) return;
  if (e.key === 't' || e.key === 'T') { e.preventDefault(); openChat(); }
  if (e.key === '/') { e.preventDefault(); openChat('/'); }
});

// Top bar buttons
/* ---------- In-game Pause Menu ---------- */
const pauseMenu = document.getElementById('pause-menu');
let pauseOpen = false;

function openPauseMenu() {
  pauseMenu.classList.remove('hidden');
  pauseOpen = true;
  // sync pause settings sliders to current values
  document.getElementById('p-fov-slider').value = settings.fov;
  document.getElementById('p-fov-val').textContent = settings.fov + '°';
  document.getElementById('p-mouse-sens-slider').value = settings.mouseSens;
  document.getElementById('p-mouse-sens-val').textContent = settings.mouseSens;
  document.getElementById('p-touch-sens-slider').value = settings.touchSens;
  document.getElementById('p-touch-sens-val').textContent = settings.touchSens;
  document.getElementById('p-fog-slider').value = settings.fogDist;
  document.getElementById('p-fog-val').textContent = settings.fogDist;
  ['p-cam-first','p-cam-third'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(settings.cameraMode === 'third' ? 'p-cam-third' : 'p-cam-first').classList.add('active');
  ['p-gfx-fast','p-gfx-fancy'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(settings.graphics === 'fast' ? 'p-gfx-fast' : 'p-gfx-fancy').classList.add('active');
  ['p-fps-on','p-fps-off'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(settings.showFps ? 'p-fps-on' : 'p-fps-off').classList.add('active');
  hidePauseSettings();
}
function closePauseMenu() {
  pauseMenu.classList.add('hidden');
  pauseOpen = false;
  hidePauseSettings();
}
function showPauseSettings() {
  document.getElementById('pause-settings-panel').classList.add('vis');
  document.getElementById('pause-settings-btn').textContent = '◀  BACK';
  document.getElementById('pause-resume-btn').classList.add('hide-btn');
}
function hidePauseSettings() {
  document.getElementById('pause-settings-panel').classList.remove('vis');
  document.getElementById('pause-settings-btn').textContent = '⚙  SETTINGS';
  document.getElementById('pause-resume-btn').classList.remove('hide-btn');
}

document.getElementById('pause-resume-btn').addEventListener('click', () => {
  closePauseMenu();
  if (!isMobile()) canvas.requestPointerLock();
});
document.getElementById('pause-settings-btn').addEventListener('click', () => {
  if (document.getElementById('pause-settings-panel').classList.contains('vis')) hidePauseSettings();
  else showPauseSettings();
});
document.getElementById('pause-quit-btn').addEventListener('click', () => {
  closePauseMenu();
  // Mark player as offline on quit
  if (myUsername) sb.from('online_players').upsert({ username: myUsername, world_id: null }).catch(()=>{});
  spawnPlayer(); player.vel.set(0,0,0); player.fallStart = null;
  player.health = player.maxHealth; player.hunger = player.maxHunger;
  updateHeartIcons(); updateHungerIcons();
  showPanel('menu-main'); setTitleVisible(true); showOverlay();
  // Refresh friends panel so online dots update
  if (myUsername && document.getElementById('mp-friends').classList.contains('visible')) refreshFriends();
});

// Pause settings sliders (mirror the main settings panel behaviour)
document.getElementById('p-fov-slider').addEventListener('input', e => {
  settings.fov = parseInt(e.target.value);
  document.getElementById('p-fov-val').textContent = settings.fov + '°';
  applyFov(); saveSettings();
});
document.getElementById('p-mouse-sens-slider').addEventListener('input', e => {
  settings.mouseSens = parseInt(e.target.value);
  document.getElementById('p-mouse-sens-val').textContent = settings.mouseSens;
  saveSettings();
});
document.getElementById('p-touch-sens-slider').addEventListener('input', e => {
  settings.touchSens = parseInt(e.target.value);
  document.getElementById('p-touch-sens-val').textContent = settings.touchSens;
  saveSettings();
});
document.getElementById('p-fog-slider').addEventListener('input', e => {
  settings.fogDist = parseInt(e.target.value);
  document.getElementById('p-fog-val').textContent = settings.fogDist;
  applyFog(); saveSettings();
});
document.getElementById('p-cam-first').addEventListener('click', () => {
  settings.cameraMode = 'first';
  document.getElementById('p-cam-first').classList.add('active');
  document.getElementById('p-cam-third').classList.remove('active');
  saveSettings();
});
document.getElementById('p-cam-third').addEventListener('click', () => {
  settings.cameraMode = 'third';
  document.getElementById('p-cam-third').classList.add('active');
  document.getElementById('p-cam-first').classList.remove('active');
  saveSettings();
});
document.getElementById('p-gfx-fast').addEventListener('click', () => {
  settings.graphics = 'fast';
  document.getElementById('p-gfx-fast').classList.add('active');
  document.getElementById('p-gfx-fancy').classList.remove('active');
  applyGraphics(); saveSettings();
});
document.getElementById('p-gfx-fancy').addEventListener('click', () => {
  settings.graphics = 'fancy';
  document.getElementById('p-gfx-fancy').classList.add('active');
  document.getElementById('p-gfx-fast').classList.remove('active');
  applyGraphics(); saveSettings();
});
document.getElementById('p-fps-on').addEventListener('click', () => {
  settings.showFps = true;
  document.getElementById('p-fps-on').classList.add('active');
  document.getElementById('p-fps-off').classList.remove('active');
  applyFpsCounter(); saveSettings();
});
document.getElementById('p-fps-off').addEventListener('click', () => {
  settings.showFps = false;
  document.getElementById('p-fps-off').classList.add('active');
  document.getElementById('p-fps-on').classList.remove('active');
  applyFpsCounter(); saveSettings();
});

document.getElementById('top-pause').addEventListener('click', () => {
  if (chatOpen) closeChat();
  if (pauseOpen) { closePauseMenu(); if (!isMobile()) canvas.requestPointerLock(); }
  else openPauseMenu();
});
document.getElementById('top-chat').addEventListener('click', () => {
  if (chatOpen) closeChat(); else openChat();
});

// Show chat hint after game starts
function showChatHint() {
  chatHintEl.style.display = 'block';
  setTimeout(() => { chatHintEl.style.display = 'none'; }, 5000);
}

// Welcome message on world load
setTimeout(() => {
  addChatLine('Welcome to Craft3D! Press T to chat or /help for commands.', 'system');
}, 1500);


let last = performance.now();
let fpsFrames = 0, fpsAccum = 0, fpsDisplay = 0;
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;

  // Flush deferred mesh rebuild (set by block place/break)
  if (meshDirty) {
    meshDirty = false;
    for (const m of meshes) { scene.remove(m); if (m.geometry) m.geometry.dispose(); }
    meshes = buildMeshes();
    for (const m of meshes) { if (!m.parent) scene.add(m); }
  }
  if (grassDirty) {
    grassDirty = false;
    rebuildGrassTufts();
  }

  // FPS counter
  fpsFrames++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    fpsDisplay = Math.round(fpsFrames / fpsAccum);
    fpsFrames = 0; fpsAccum = 0;
    const el = document.getElementById('fps-counter');
    if (!el.classList.contains('hidden')) el.textContent = fpsDisplay + ' FPS';
  }

  // Spin world slowly while main menu is visible (Minecraft title screen effect)
  if (!overlay.classList.contains('hidden')) {
    player.yaw += dt * 0.18; // ~10°/sec slow pan
    const menuEyeY = player.pos.y + player.eye + 7;
    const menuPitch = -0.22;
    const dir = new THREE.Vector3(
      -Math.sin(player.yaw) * Math.cos(menuPitch),
       Math.sin(menuPitch),
      -Math.cos(player.yaw) * Math.cos(menuPitch)
    );
    camera.position.set(player.pos.x, menuEyeY, player.pos.z);
    camera.lookAt(camera.position.clone().add(dir));
    handContainer.visible = false;
  }

  // only update physics if locked or mobile AND not in menu
  const inMenu = !overlay.classList.contains('hidden');
  const active = !inMenu && (locked || isMobile());
  if (active) {
    moveAndCollide(dt);
    updateCamera(dt);
    updateHighlight();
    tickBreaking(dt); // advance hold-to-break crack animation
    tickDrops(dt);       // animate & collect block drops
    tickCow(dt);         // cow AI + animations
    broadcastPosition(now);
  }
  if (isMultiplayer) tickRemotePlayers(dt);

  // Day / night cycle — sky, fog, sun/moon lighting
  updateDayCycle(dt);

  // water texture scroll + opacity pulse (set on the material, not the texture)
  T.water.offset.x = (now * 0.00008) % 1;
  T.water.offset.y = (now * 0.00005) % 1;
  // Animate the ocean floor's cloned water texture too.
  floorTex.offset.x = (now * 0.00008) % 1;
  floorTex.offset.y = (now * 0.00005) % 1;
  BLOCKS.water.mats[0].opacity = 0.65 + Math.sin(now * 0.001) * 0.08;

  // Hand / held-block overlay animation: swing on actions, idle bob otherwise.
  if (eatT > 0) {
    eatT = Math.max(0, eatT - dt);
    // 4 rapid bobs over 1.6s — like Minecraft chewing motion
    const prog = 1 - eatT / 1.6;
    const bob = Math.abs(Math.sin(prog * Math.PI * 4)) * 0.22;
    const sway = Math.sin(prog * Math.PI * 4) * 0.08;
    handContainer.rotation.x = -0.35 + bob * 1.4;
    handContainer.rotation.z =  0.05 + sway;
    handContainer.position.y = -0.50 + bob * 0.18;
    handContainer.position.x =  0.65 - bob * 0.10;
    handContainer.position.z = -1.0  + bob * 0.25; // lunge toward face
  } else if (swingT > 0) {
    swingT = Math.max(0, swingT - dt * 6);
    const s = Math.sin((1 - swingT) * Math.PI);
    handContainer.rotation.x = -0.35 - s * 0.75;
    handContainer.rotation.z = 0.05 + s * 0.18;
    handContainer.position.y = -0.50 - s * 0.10;
    handContainer.position.x = 0.65 + s * 0.04;
    handContainer.position.z = -1.0;
  } else {
    const bobY   = active ? Math.sin(now * 0.0030) * 0.020 : 0;
    const bobX   = active ? Math.sin(now * 0.0060) * 0.010 : 0;
    const bobRot = active ? Math.sin(now * 0.0030) * 0.018 : 0;
    handContainer.rotation.x = -0.35 + bobRot * 0.4;
    handContainer.rotation.z =  0.05 + bobRot;
    handContainer.position.y = -0.50 + bobY;
    handContainer.position.x =  0.65 + bobX;
    handContainer.position.z = -1.0;
  }

  // Render main scene, then hand overlay on top (clear depth in between
  // so the hand is never occluded by world geometry).
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth();
  renderer.render(handScene, handCamera);
}
/* ========== SIGN SYSTEM ========== */
const signObjects = new Map();  // key(x,y,z) → THREE.Group
const signTexts   = new Map();  // key(x,y,z) → string[4]
const signFacings = new Map();  // key(x,y,z) → yaw

// Oak sign entity PNG — 64×32 px
// Minecraft entity UV box formula for offset (tx,ty), box (w,h,d):
//   Top:    (tx+d,     ty),     w×d
//   Bottom: (tx+d+w,   ty),     w×d
//   Right:  (tx,       ty+d),   d×h
//   Front:  (tx+d,     ty+d),   w×h
//   Left:   (tx+d+w,   ty+d),   d×h
//   Back:   (tx+2d+w,  ty+d),   w×h
//
// Board (tx=0,ty=0, w=24,h=12,d=2):
//   Top=(2,0,24,2)  Bot=(26,0,24,2)
//   Right=(0,2,2,12)  Front=(2,2,24,12)  Left=(26,2,2,12)  Back=(28,2,24,12)
// Post  (tx=0,ty=16, w=2,h=14,d=2):
//   Top=(2,16,2,2)  Bot=(4,16,2,2)
//   Right=(0,18,2,14)  Front=(2,18,2,14)  Left=(4,18,2,14)  Back=(6,18,2,14)

const SIGN_PNG_URL = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/entity/signs/oak.png';
const signPngImg = new Image();
signPngImg.crossOrigin = 'anonymous';
let signPngLoaded = false;

signPngImg.onload = () => {
  signPngLoaded = true;
  // Rebuild all sign meshes so every face uses the real PNG
  for (const [k] of signObjects) {
    const [sx,sy,sz] = k.split(',').map(Number);
    buildSignMesh(sx, sy, sz);
  }
  if (!document.getElementById('sign-editor').classList.contains('hidden')) {
    drawSignPreview(getEditorLines());
  }
};
signPngImg.onerror = () => console.warn('[Craft3D] oak sign PNG failed');
signPngImg.src = SIGN_PNG_URL;

// Crop a region from the sign PNG into a CanvasTexture (NearestFilter)
// sx,sy = source top-left in PNG; sw,sh = source size; dw,dh = dest canvas size
function cropSignTex(sx, sy, sw, sh, dw, dh) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, dw); c.height = Math.max(1, dh);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (signPngLoaded && sw > 0 && sh > 0) {
    ctx.drawImage(signPngImg, sx, sy, sw, sh, 0, 0, dw, dh);
  } else {
    // Fallback oak plank color
    ctx.fillStyle = '#c09050'; ctx.fillRect(0, 0, dw, dh);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  return { tex: t, canvas: c };
}

// Build the front-face canvas: PNG crop + text overlay
function makeFrontFaceAsset(lines) {
  const dw = 192, dh = 96; // high-res for crisp text
  const c = document.createElement('canvas');
  c.width = dw; c.height = dh;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // Background from PNG front face region (2,2,24,12)
  if (signPngLoaded) {
    ctx.drawImage(signPngImg, 2, 2, 24, 12, 0, 0, dw, dh);
  } else {
    ctx.fillStyle = '#c09050'; ctx.fillRect(0, 0, dw, dh);
    ctx.fillStyle = '#a07040';
    for (let py = 16; py < dh; py += 16) ctx.fillRect(0, py, dw, 2);
  }
  // Text overlay (4 lines)
  const fSize = 14;
  ctx.font = `bold ${fSize}px monospace`;
  ctx.textAlign = 'center';
  const lineH = 22;
  const startY = 18;
  (lines || []).forEach((line, i) => {
    if (!line) return;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(line, dw/2+1, startY + i*lineH + 1, dw - 10);
    ctx.fillStyle = '#1a0800';
    ctx.fillText(line, dw/2, startY + i*lineH, dw - 10);
  });
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  return { canvas: c, tex: t };
}

// Preview for the editor UI — same draw logic but on the preview canvas
function drawSignPreview(lines) {
  const cv = document.getElementById('sign-preview-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0,0,W,H);
  ctx.imageSmoothingEnabled = false;
  if (signPngLoaded) {
    ctx.drawImage(signPngImg, 2, 2, 24, 12, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#c09050'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#a07040';
    for (let py=H/5;py<H;py+=H/5) ctx.fillRect(0,py,W,1);
  }
  const fSize = Math.round(H / 6);
  ctx.font = `bold ${fSize}px monospace`;
  ctx.textAlign = 'center';
  const lineH = Math.round(H / 4.5);
  const startY = Math.round(H * 0.18) + fSize;
  (lines || []).forEach((line, i) => {
    if (!line) return;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(line, W/2+1, startY+i*lineH+1, W-8);
    ctx.fillStyle = '#1a0800';
    ctx.fillText(line, W/2, startY+i*lineH, W-8);
  });
}

// Build or rebuild a sign mesh using per-face PNG crops
function buildSignMesh(x, y, z) {
  const k = key(x, y, z);
  removeSignMesh(x, y, z);

  const facing = signFacings.get(k) || 0;
  const lines  = signTexts.get(k)   || ['','','',''];

  // --- Board materials (Three.js face order: +X,-X,+Y,-Y,+Z,-Z) ---
  // With rotation.y = PI-facing, the -Z local face = front (toward placer)
  // Minecraft UV board (tx=0,ty=0, w=24,h=12, d=2):
  const frontAsset = makeFrontFaceAsset(lines);                // -Z (front)
  const boardMats = [
    new THREE.MeshLambertMaterial({ map: cropSignTex(26, 2,  2, 12, 16, 96).tex }),  // +X right
    new THREE.MeshLambertMaterial({ map: cropSignTex( 0, 2,  2, 12, 16, 96).tex }),  // -X left
    new THREE.MeshLambertMaterial({ map: cropSignTex( 2, 0, 24,  2,192, 16).tex }),  // +Y top
    new THREE.MeshLambertMaterial({ map: cropSignTex(26, 0, 24,  2,192, 16).tex }),  // -Y bottom
    new THREE.MeshLambertMaterial({ map: cropSignTex(28, 2, 24, 12,192, 96).tex }),  // +Z back
    new THREE.MeshLambertMaterial({ map: frontAsset.tex }),                           // -Z front
  ];
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.08), boardMats);
  board.position.set(0, 0.32, 0);

  // --- Post materials (tx=0,ty=16, w=2,h=14, d=2) ---
  const postMats = [
    new THREE.MeshLambertMaterial({ map: cropSignTex( 4, 18, 2, 14, 16,112).tex }), // +X right
    new THREE.MeshLambertMaterial({ map: cropSignTex( 0, 18, 2, 14, 16,112).tex }), // -X left
    new THREE.MeshLambertMaterial({ map: cropSignTex( 2, 16, 2,  2, 16, 16).tex }), // +Y top
    new THREE.MeshLambertMaterial({ map: cropSignTex( 4, 16, 2,  2, 16, 16).tex }), // -Y bottom
    new THREE.MeshLambertMaterial({ map: cropSignTex( 6, 18, 2, 14, 16,112).tex }), // +Z back
    new THREE.MeshLambertMaterial({ map: cropSignTex( 2, 18, 2, 14, 16,112).tex }), // -Z front
  ];
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.72, 0.09), postMats);
  post.position.set(0, -0.28, 0);

  const g = new THREE.Group();
  g.add(board); g.add(post);
  g.position.set(x + 0.5, y, z + 0.5);
  g.rotation.y = Math.PI - facing;

  g.userData = { signKey: k, frontAsset };
  scene.add(g);
  signObjects.set(k, g);
}

function removeSignMesh(x, y, z) {
  const k = key(x, y, z);
  const g = signObjects.get(k);
  if (!g) return;
  scene.remove(g);
  g.traverse(m => {
    if (!m.isMesh) return;
    m.geometry.dispose();
    (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => {
      if (mt.map) mt.map.dispose();
      mt.dispose();
    });
  });
  signObjects.delete(k);
}

// ===== TORCH SYSTEM =====
const torchObjects = new Map(); // key -> { group: THREE.Group, light: THREE.PointLight }

// Shared torch material (MeshBasicMaterial so it's always bright regardless of lighting)
const _torchMat = new THREE.MeshBasicMaterial({
  map: T.torch,
  transparent: true,
  alphaTest: 0.1,
  side: THREE.DoubleSide,
});

function buildTorchMesh(x, y, z) {
  const k = key(x, y, z);
  removeTorchMesh(x, y, z);

  // Cross-sprite: two planes at ±45° like Minecraft's torch model
  const W = 0.5, H = 0.9;
  const geo1 = new THREE.PlaneGeometry(W, H);
  const geo2 = new THREE.PlaneGeometry(W, H);
  const m1 = new THREE.Mesh(geo1, _torchMat);
  const m2 = new THREE.Mesh(geo2, _torchMat);
  m1.rotation.y = Math.PI / 4;
  m2.rotation.y = -Math.PI / 4;

  const g = new THREE.Group();
  g.add(m1);
  g.add(m2);
  // Center cross vertically: bottom at y, top at y+H, pivot at y+H/2
  g.position.set(x + 0.5, y + H / 2, z + 0.5);
  scene.add(g);

  // Warm orange-yellow point light — flame tip is near the top of the torch
  const light = new THREE.PointLight(0xffaa33, 1.8, 12);
  light.position.set(x + 0.5, y + H + 0.1, z + 0.5);
  scene.add(light);

  torchObjects.set(k, { group: g, light });
}

function removeTorchMesh(x, y, z) {
  const k = key(x, y, z);
  const entry = torchObjects.get(k);
  if (!entry) return;
  scene.remove(entry.group);
  scene.remove(entry.light);
  entry.light.dispose();
  torchObjects.delete(k);
}

function rebuildAllTorchMeshes() {
  // Remove all existing
  for (const entry of torchObjects.values()) {
    scene.remove(entry.group);
    scene.remove(entry.light);
    entry.light.dispose();
  }
  torchObjects.clear();
  // Re-create from world state
  for (const [k, type] of blocks.entries()) {
    if (type !== 'torch') continue;
    const [x, y, z] = k.split(',').map(Number);
    buildTorchMesh(x, y, z);
  }
}
// ===== END TORCH SYSTEM =====

// Redraw only the front face texture (after text edit)
function updateSignTexture(x, y, z) {
  const k = key(x, y, z);
  const g = signObjects.get(k);
  if (!g) return;
  const lines = signTexts.get(k) || ['','','',''];
  const { frontAsset } = g.userData;
  if (!frontAsset) return;
  const c = frontAsset.canvas;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.imageSmoothingEnabled = false;
  if (signPngLoaded) {
    ctx.drawImage(signPngImg, 2, 2, 24, 12, 0, 0, c.width, c.height);
  } else {
    ctx.fillStyle = '#c09050'; ctx.fillRect(0, 0, c.width, c.height);
  }
  const fSize = 14;
  ctx.font = `bold ${fSize}px monospace`;
  ctx.textAlign = 'center';
  const lineH = 22, startY = 18;
  lines.forEach((line, i) => {
    if (!line) return;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(line, c.width/2+1, startY+i*lineH+1, c.width-10);
    ctx.fillStyle = '#1a0800';
    ctx.fillText(line, c.width/2, startY+i*lineH, c.width-10);
  });
  frontAsset.tex.needsUpdate = true;
}

// ===== Sign editor =====
let editingSignKey = null;

function getEditorLines() {
  return [0,1,2,3].map(i => {
    const el = document.getElementById('sign-line-' + i);
    return el ? el.value : '';
  });
}

function openSignEditor(x, y, z) {
  editingSignKey = key(x, y, z);
  const saved = signTexts.get(editingSignKey) || ['','','',''];
  [0,1,2,3].forEach(i => {
    const inp = document.getElementById('sign-line-' + i);
    if (inp) inp.value = saved[i] || '';
  });
  document.getElementById('sign-editor').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  drawSignPreview(saved);
  setTimeout(() => { const el = document.getElementById('sign-line-0'); if(el) el.focus(); }, 80);
}

function closeSignEditor(save) {
  if (save && editingSignKey) {
    const lines = getEditorLines();
    signTexts.set(editingSignKey, lines);
    const [sx,sy,sz] = editingSignKey.split(',').map(Number);
    updateSignTexture(sx, sy, sz);
    saveSignData();
  }
  editingSignKey = null;
  document.getElementById('sign-editor').classList.add('hidden');
  if (!isMobile()) { try { canvas.requestPointerLock(); } catch {} }
}

function saveSignData() {
  if (!currentSingleplayerWorldId) return;
  localStorage.setItem('craft3d_signs_' + currentSingleplayerWorldId,
    JSON.stringify({ texts: [...signTexts], facings: [...signFacings] }));
}

// Live preview while typing
[0,1,2,3].forEach(i => {
  const inp = document.getElementById('sign-line-' + i);
  if (inp) inp.addEventListener('input', () => drawSignPreview(getEditorLines()));
});
// Keyboard shortcuts: Enter advances lines, Escape cancels
[0,1,2,3].forEach(i => {
  const inp = document.getElementById('sign-line-' + i);
  if (!inp) return;
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = document.getElementById('sign-line-' + (i + 1));
      if (next) next.focus(); else closeSignEditor(true);
    }
    if (e.key === 'Escape') { e.preventDefault(); closeSignEditor(false); }
  });
});
document.getElementById('sign-done-btn').addEventListener('click', () => closeSignEditor(true));
document.getElementById('sign-editor').addEventListener('mousedown', e => {
  if (e.target === document.getElementById('sign-editor')) closeSignEditor(true);
});

animate();


/* ===== Delete World Confirmation Modal ===== */
let _delIdx = -1, _delName = '';

function openDelConfirm(name, idx) {
  const delModal  = document.getElementById('del-confirm-modal');
  const delInput  = document.getElementById('del-confirm-input');
  const delOkBtn  = document.getElementById('del-confirm-ok');
  const delNameEl = document.getElementById('del-confirm-world-name');
  if (!delModal) { console.error('del-confirm-modal not found'); return; }
  _delIdx  = idx;
  _delName = name;
  delNameEl.textContent = '"' + name + '"';
  delInput.value = '';
  delOkBtn.classList.remove('ready');
  delModal.classList.remove('hidden');
  setTimeout(() => delInput.focus(), 80);
}
function closeDelConfirm() {
  const delModal = document.getElementById('del-confirm-modal');
  if (delModal) delModal.classList.add('hidden');
  _delIdx = -1; _delName = '';
}

// Wire modal buttons after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const delModal     = document.getElementById('del-confirm-modal');
  const delInput     = document.getElementById('del-confirm-input');
  const delOkBtn     = document.getElementById('del-confirm-ok');
  const delCancelBtn = document.getElementById('del-confirm-cancel');
  if (!delModal) return;

  delInput.addEventListener('input', () => {
    delOkBtn.classList.toggle('ready', delInput.value.trim() === _delName);
  });
  const doConfirmDelete = () => {
    if (!delOkBtn.classList.contains('ready')) return;
    const ws = loadWorlds();
    const deleted = ws.splice(_delIdx, 1)[0];
    if (deleted && deleted.id) localStorage.removeItem('craft3d_mods_' + deleted.id);
    saveWorlds(ws);
    closeDelConfirm();
    showWorldsPanel();
  };
  delOkBtn.addEventListener('touchstart', e => { e.preventDefault(); doConfirmDelete(); }, { passive:false });
  delOkBtn.addEventListener('click', doConfirmDelete);
  const doCancelDelete = e => { e && e.preventDefault(); closeDelConfirm(); };
  delCancelBtn.addEventListener('touchstart', e => { e.preventDefault(); doCancelDelete(); }, { passive:false });
  delCancelBtn.addEventListener('click', doCancelDelete);
  delModal.addEventListener('touchstart', e => { if (e.target === delModal) { e.preventDefault(); closeDelConfirm(); } }, { passive:false });
  delModal.addEventListener('click', e => { if (e.target === delModal) closeDelConfirm(); });
});