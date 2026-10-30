/* ============================================================
   AMONG SUS — game logic
   ============================================================ */
(() => {
"use strict";

// ---------------------------------------------------------------- helpers
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- palette
const COLORS = [
  { id: "red", name: "Kırmızı", hex: "#e03a3a" },
  { id: "blue", name: "Mavi", hex: "#3b6fe0" },
  { id: "green", name: "Yeşil", hex: "#3fbf5f" },
  { id: "pink", name: "Pembe", hex: "#ec6fc0" },
  { id: "orange", name: "Turuncu", hex: "#f08a2a" },
  { id: "yellow", name: "Sarı", hex: "#f2d437" },
  { id: "black", name: "Siyah", hex: "#454b59" },
  { id: "white", name: "Beyaz", hex: "#e8edf5" },
  { id: "purple", name: "Mor", hex: "#8a5cf0" },
  { id: "cyan", name: "Turkuaz", hex: "#45d6d0" },
  { id: "lime", name: "Fıstık", hex: "#8ce04a" },
  { id: "brown", name: "Kahve", hex: "#a1653a" }
];

function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (p >= 0) {
    r = Math.round(r + (255 - r) * p);
    g = Math.round(g + (255 - g) * p);
    b = Math.round(b + (255 - b) * p);
  } else {
    const k = 1 + p;
    r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k);
  }
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ---------------------------------------------------------------- world
const W = 1280, H = 760;
const ROOMS = [
  { id: "medbay", name: "REVİR", x: 170, y: 70, w: 190, h: 150, tint: "#192a3b", accent: "#6fe3f5" },
  { id: "cafe", name: "KAFETERYA", x: 470, y: 60, w: 330, h: 210, tint: "#1b2637", accent: "#ffd83d" },
  { id: "weapons", name: "SİLAHLAR", x: 990, y: 60, w: 200, h: 160, tint: "#2a2233", accent: "#ff8a9a" },
  { id: "electrical", name: "ELEKTRİK", x: 190, y: 350, w: 190, h: 160, tint: "#2b2a1c", accent: "#ffd83d" },
  { id: "admin", name: "YÖNETİM", x: 560, y: 380, w: 170, h: 140, tint: "#1c2c30", accent: "#5fe7f5" },
  { id: "nav", name: "NAVİGASYON", x: 1030, y: 370, w: 190, h: 160, tint: "#1a2b3d", accent: "#5fe7f5" },
  { id: "storage", name: "DEPO", x: 410, y: 580, w: 250, h: 150, tint: "#2a231c", accent: "#ffb066" },
  { id: "comms", name: "İLETİŞİM", x: 760, y: 555, w: 170, h: 130, tint: "#2a2036", accent: "#c8a6ff" },
  { id: "shields", name: "KALKANLAR", x: 1010, y: 590, w: 200, h: 140, tint: "#163036", accent: "#46e08a" }
];
const CORRIDORS = [
  { x: 360, y: 130, w: 110, h: 40 },
  { x: 800, y: 110, w: 190, h: 40 },
  { x: 250, y: 220, w: 40, h: 130 },
  { x: 620, y: 270, w: 44, h: 110 },
  { x: 730, y: 430, w: 300, h: 44 },
  { x: 260, y: 510, w: 40, h: 90 },
  { x: 300, y: 600, w: 110, h: 40 },
  { x: 615, y: 520, w: 40, h: 60 },
  { x: 660, y: 640, w: 100, h: 40 },
  { x: 930, y: 630, w: 80, h: 40 },
  { x: 1090, y: 530, w: 40, h: 60 },
  { x: 1090, y: 220, w: 40, h: 150 }
];
const WALK = [...ROOMS, ...CORRIDORS];

const TASK_DEFS = [
  { id: "t1", x: 228, y: 118, room: "Revir", name: "Numune Analizi", type: "calibrate" },
  { id: "t2", x: 320, y: 190, room: "Revir", name: "Kablolar", type: "wiring" },
  { id: "t3", x: 500, y: 235, room: "Kafeterya", name: "Kablolar", type: "wiring" },
  { id: "t4", x: 1135, y: 112, room: "Silahlar", name: "Kalibrasyon", type: "calibrate" },
  { id: "t5", x: 225, y: 465, room: "Elektrik", name: "Kablolar", type: "wiring" },
  { id: "t6", x: 640, y: 485, room: "Yönetim", name: "Veri İndir", type: "download" },
  { id: "t7", x: 1150, y: 480, room: "Navigasyon", name: "Veri İndir", type: "download" },
  { id: "t8", x: 445, y: 695, room: "Depo", name: "Yakıt", type: "calibrate" },
  { id: "t9", x: 890, y: 580, room: "İletişim", name: "Veri İndir", type: "download" },
  { id: "t10", x: 1160, y: 690, room: "Kalkanlar", name: "Kalibrasyon", type: "calibrate" }
];
const TASK_TYPE_NAME = { wiring: "Kabloları Bağla", download: "Veri İndir", calibrate: "Kalibrasyon" };

const VENTS = [
  { x: 500, y: 88, room: "Kafeterya" },
  { x: 330, y: 474, room: "Elektrik" },
  { x: 1180, y: 402, room: "Navigasyon" },
  { x: 630, y: 700, room: "Depo" }
];
const EMERGENCY = { x: 720, y: 102 };
const SPAWN = { x: 618, y: 178 };
const STEP = 16, COLS = Math.floor(W / STEP), ROWS = Math.floor(H / STEP);
const BODY_RADIUS = 11;

// ---------------------------------------------------------------- collision
function insideWalk(x, y) {
  for (let i = 0; i < WALK.length; i++) {
    const r = WALK[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}
function canStand(x, y, radius) {
  if (!insideWalk(x, y)) return false;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    if (!insideWalk(x + Math.cos(a) * radius, y + Math.sin(a) * radius)) return false;
  }
  return true;
}
function clearLine(ax, ay, bx, by, radius) {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(d / 9));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (!canStand(ax + (bx - ax) * t, ay + (by - ay) * t, radius)) return false;
  }
  return true;
}
function randomPointInWalkable() {
  for (let tries = 0; tries < 200; tries++) {
    const x = rand(200, W - 200), y = rand(90, H - 90);
    if (canStand(x, y, 16)) return { x, y };
  }
  return { x: SPAWN.x, y: SPAWN.y };
}

// ---------------------------------------------------------------- pathfinding
const walkGrid = new Uint8Array(COLS * ROWS);
function buildGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * STEP + STEP / 2, y = r * STEP + STEP / 2;
      walkGrid[r * COLS + c] = canStand(x, y, 13) ? 1 : 0;
    }
  }
}
function cellOf(x, y) {
  return {
    c: clamp(Math.floor(x / STEP), 0, COLS - 1),
    r: clamp(Math.floor(y / STEP), 0, ROWS - 1)
  };
}
function nearestWalkable(c, r) {
  if (walkGrid[r * COLS + c]) return { c, r };
  for (let rad = 1; rad < 12; rad++) {
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
        if (walkGrid[nr * COLS + nc]) return { c: nc, r: nr };
      }
    }
  }
  return null;
}
function findPath(sx, sy, tx, ty) {
  const s0 = nearestWalkable(cellOf(sx, sy).c, cellOf(sx, sy).r);
  const g0 = nearestWalkable(cellOf(tx, ty).c, cellOf(tx, ty).r);
  if (!s0 || !g0) return [];
  const sIdx = s0.r * COLS + s0.c, gIdx = g0.r * COLS + g0.c;
  if (sIdx === gIdx) return [{ x: tx, y: ty }];

  const size = COLS * ROWS;
  const gScore = new Float32Array(size).fill(Infinity);
  const fScore = new Float32Array(size).fill(Infinity);
  const came = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const open = [sIdx];
  const inOpen = new Uint8Array(size);
  inOpen[sIdx] = 1;
  gScore[sIdx] = 0;
  fScore[sIdx] = Math.hypot(g0.c - s0.c, g0.r - s0.r);

  const gc = g0.c, gr = g0.r;
  let guard = 0;
  while (open.length && guard++ < 9000) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (fScore[open[i]] < fScore[open[best]]) best = i;
    const cur = open.splice(best, 1)[0];
    inOpen[cur] = 0;
    if (cur === gIdx) {
      const pts = [];
      let n = cur;
      while (n !== -1) {
        const c = n % COLS, r = (n - c) / COLS;
        pts.push({ x: c * STEP + STEP / 2, y: r * STEP + STEP / 2 });
        n = came[n];
      }
      pts.reverse();
      pts[0] = { x: sx, y: sy };
      pts[pts.length - 1] = { x: tx, y: ty };
      return simplifyPath(pts);
    }
    closed[cur] = 1;
    const cc = cur % COLS, cr = (cur - cc) / COLS;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dc && !dr) continue;
        const nc = cc + dc, nr = cr + dr;
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
        const ni = nr * COLS + nc;
        if (!walkGrid[ni] || closed[ni]) continue;
        if (dc && dr) {
          if (!walkGrid[cr * COLS + nc] || !walkGrid[nr * COLS + cc]) continue;
        }
        const cost = dc && dr ? 1.4142 : 1;
        const tentative = gScore[cur] + cost;
        if (tentative < gScore[ni]) {
          came[ni] = cur;
          gScore[ni] = tentative;
          fScore[ni] = tentative + Math.hypot(gc - nc, gr - nr);
          if (!inOpen[ni]) { open.push(ni); inOpen[ni] = 1; }
        }
      }
    }
  }
  return [];
}
function simplifyPath(pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    for (; j > i + 1; j--) {
      if (clearLine(pts[i].x, pts[i].y, pts[j].x, pts[j].y, 10)) break;
    }
    out.push(pts[j]);
    i = j;
  }
  return out;
}
function moveTowards(p, tx, ty, speed, dt, collision) {
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.5) return true;
  const step = Math.min(d, speed * dt);
  const nx = p.x + (dx / d) * step;
  const ny = p.y + (dy / d) * step;
  if (!collision) {
    p.x = clamp(nx, 20, W - 20);
    p.y = clamp(ny, 20, H - 20);
    return true;
  }
  if (canStand(nx, ny, BODY_RADIUS)) { p.x = nx; p.y = ny; return true; }
  if (canStand(nx, p.y, BODY_RADIUS)) { p.x = nx; return true; }
  if (canStand(p.x, ny, BODY_RADIUS)) { p.y = ny; return true; }
  return false;
}

// ---------------------------------------------------------------- canvas
const canvas = $("#game");
const ctx = canvas.getContext("2d");
let dpr = 1, cw = 1280, ch = 760;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width = Math.floor(cw * dpr);
  canvas.height = Math.floor(ch * dpr);
}
window.addEventListener("resize", resize);
resize();

// ---------------------------------------------------------------- static map render
const mapCanvas = document.createElement("canvas");
mapCanvas.width = W;
mapCanvas.height = H;

function rr(c, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.lineTo(x + w - rad, y);
  c.quadraticCurveTo(x + w, y, x + w, y + rad);
  c.lineTo(x + w, y + h - rad);
  c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  c.lineTo(x + rad, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - rad);
  c.lineTo(x, y + rad);
  c.quadraticCurveTo(x, y, x + rad, y);
  c.closePath();
}

function drawMap() {
  const c = mapCanvas.getContext("2d");
  c.clearRect(0, 0, W, H);

  // wall silhouette
  c.save();
  c.shadowColor = "rgba(70, 190, 255, 0.32)";
  c.shadowBlur = 30;
  for (const r of WALK) {
    rr(c, r.x - 13, r.y - 13, r.w + 26, r.h + 26, 26);
    c.fillStyle = "#0a1422";
    c.fill();
  }
  c.restore();

  c.save();
  c.strokeStyle = "rgba(95, 231, 245, 0.14)";
  c.lineWidth = 2;
  for (const r of WALK) {
    rr(c, r.x - 13, r.y - 13, r.w + 26, r.h + 26, 26);
    c.stroke();
  }
  c.restore();

  // clip to walkable union
  const union = new Path2D();
  for (const r of WALK) {
    const rad = Math.min(20, r.w / 2, r.h / 2);
    union.moveTo(r.x + rad, r.y);
    union.lineTo(r.x + r.w - rad, r.y);
    union.quadraticCurveTo(r.x + r.w, r.y, r.x + r.w, r.y + rad);
    union.lineTo(r.x + r.w, r.y + r.h - rad);
    union.quadraticCurveTo(r.x + r.w, r.y + r.h, r.x + r.w - rad, r.y + r.h);
    union.lineTo(r.x + rad, r.y + r.h);
    union.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - rad);
    union.lineTo(r.x, r.y + rad);
    union.quadraticCurveTo(r.x, r.y, r.x + rad, r.y);
    union.closePath();
  }
  c.save();
  c.clip(union);

  c.fillStyle = "#101826";
  c.fillRect(0, 0, W, H);

  // corridor floors
  for (const r of CORRIDORS) {
    c.fillStyle = "#121b2a";
    c.fillRect(r.x, r.y, r.w, r.h);
    c.save();
    c.beginPath();
    c.rect(r.x, r.y, r.w, r.h);
    c.clip();
    c.strokeStyle = "rgba(255,255,255,0.028)";
    c.lineWidth = 1;
    for (let x = r.x; x < r.x + r.w; x += 24) {
      c.beginPath(); c.moveTo(x, r.y); c.lineTo(x, r.y + r.h); c.stroke();
    }
    for (let y = r.y; y < r.y + r.h; y += 24) {
      c.beginPath(); c.moveTo(r.x, y); c.lineTo(r.x + r.w, y); c.stroke();
    }
    c.restore();
  }

  // room floors
  for (const room of ROOMS) {
    const g = c.createLinearGradient(room.x, room.y, room.x + room.w * 0.4, room.y + room.h);
    g.addColorStop(0, room.tint);
    g.addColorStop(1, shade(room.tint, -0.3));
    c.save();
    c.beginPath();
    c.rect(room.x, room.y, room.w, room.h);
    c.clip();
    c.fillStyle = g;
    c.fillRect(room.x, room.y, room.w, room.h);

    // floor panel grid
    c.strokeStyle = "rgba(255,255,255,0.032)";
    c.lineWidth = 1;
    for (let x = room.x + 24; x < room.x + room.w; x += 32) {
      c.beginPath(); c.moveTo(x, room.y); c.lineTo(x, room.y + room.h); c.stroke();
    }
    for (let y = room.y + 24; y < room.y + room.h; y += 32) {
      c.beginPath(); c.moveTo(room.x, y); c.lineTo(room.x + room.w, y); c.stroke();
    }
    // corner glow
    const rg = c.createRadialGradient(room.x + 24, room.y + 24, 0, room.x + 24, room.y + 24, room.w * 0.75);
    rg.addColorStop(0, "rgba(255,255,255,0.05)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = rg;
    c.fillRect(room.x, room.y, room.w, room.h);
    c.restore();

    // accent line along top
    c.fillStyle = "rgba(95, 231, 245, 0.10)";
    c.fillRect(room.x + 16, room.y + 4, room.w - 32, 2);

    // room label
    c.save();
    c.font = "900 10px 'Trebuchet MS', sans-serif";
    c.fillStyle = "rgba(190, 225, 255, 0.42)";
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(spaced(room.name), room.x + 16, room.y + 14);
    c.restore();

    drawDecor(c, room);
  }

  // subtle walkway edge glow
  c.strokeStyle = "rgba(95, 231, 245, 0.18)";
  c.lineWidth = 2;
  c.stroke(union);
  c.restore();

  // exterior details: little lights around hull
  c.save();
  for (const r of WALK) {
    if (r.w > 200 || r.h > 200) continue;
  }
  c.restore();
}

function spaced(text) {
  return text.split("").join(" ");
}

function drawDecor(c, room) {
  c.save();
  c.beginPath();
  c.rect(room.x, room.y, room.w, room.h);
  c.clip();
  const id = room.id;

  if (id === "cafe") {
    table(c, 520, 108, 26);
    table(c, 520, 232, 26);
    plant(c, 776, 76);
    // serving counter
    rr(c, 600, 68, 120, 16, 6);
    c.fillStyle = "#26374e"; c.fill();
    c.fillStyle = "rgba(255,255,255,0.08)";
    c.fillRect(608, 72, 104, 3);
  } else if (id === "medbay") {
    bed(c, 190, 92, "#2b4b60");
    bed(c, 190, 138, "#2b4b60");
    bed(c, 190, 184, "#2b4b60");
    scanner(c, 322, 120);
  } else if (id === "weapons") {
    consoleProp(c, 1032, 92, 96, 44, "#ff8a9a");
    c.save();
    c.strokeStyle = "rgba(255, 138, 154, 0.3)";
    c.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.arc(1142, 170, 14 + i * 10, -2.6, -0.5);
      c.stroke();
    }
    c.restore();
    crate(c, 1004, 190, 22);
  } else if (id === "electrical") {
    panel(c, 204, 382, "#ffd83d");
    panel(c, 204, 424, "#46e08a");
    panel(c, 204, 466, "#ff8a9a");
    // wires
    c.save();
    c.strokeStyle = "rgba(255, 216, 61, 0.22)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(260, 490);
    c.bezierCurveTo(300, 470, 280, 440, 320, 430);
    c.stroke();
    c.strokeStyle = "rgba(95, 231, 245, 0.16)";
    c.beginPath();
    c.moveTo(318, 430);
    c.bezierCurveTo(340, 450, 340, 480, 330, 500);
    c.stroke();
    c.restore();
  } else if (id === "admin") {
    rr(c, 600, 432, 92, 34, 6);
    c.fillStyle = "#26374e"; c.fill();
    c.fillStyle = "rgba(95, 231, 245, 0.45)";
    c.fillRect(608, 438, 22, 14);
    c.fillRect(634, 438, 22, 14);
    c.fillRect(660, 438, 22, 14);
    chair(c, 630, 478);
    chair(c, 664, 478);
  } else if (id === "nav") {
    consoleProp(c, 1062, 452, 100, 52, "#5fe7f5");
    c.save();
    c.strokeStyle = "rgba(95, 231, 245, 0.3)";
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(1112, 478, 18, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(1112, 460); c.lineTo(1112, 496); c.stroke();
    c.beginPath(); c.moveTo(1094, 478); c.lineTo(1130, 478); c.stroke();
    c.restore();
    // star map
    c.fillStyle = "rgba(255,255,255,0.4)";
    [[1150, 400], [1170, 420], [1140, 430], [1190, 440]].forEach(([x, y]) => {
      c.beginPath(); c.arc(x, y, 1.5, 0, TAU); c.fill();
    });
  } else if (id === "storage") {
    crate(c, 436, 606, 30);
    crate(c, 480, 616, 24);
    crate(c, 600, 606, 28);
    crate(c, 610, 680, 20);
    barrel(c, 438, 668);
    barrel(c, 470, 686);
  } else if (id === "comms") {
    consoleProp(c, 786, 586, 64, 36, "#c8a6ff");
    c.save();
    c.strokeStyle = "rgba(200, 166, 255, 0.25)";
    c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(874, 620, 16 + i * 12, -1.2, 1.2);
      c.stroke();
    }
    c.restore();
  } else if (id === "shields") {
    c.save();
    c.strokeStyle = "rgba(70, 224, 138, 0.22)";
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(1110, 700, 26 + i * 16, Math.PI, TAU);
      c.stroke();
    }
    c.restore();
    consoleProp(c, 1136, 626, 56, 34, "#46e08a");
  }

  c.restore();
}

function table(c, x, y, r) {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.28)";
  c.beginPath(); c.ellipse(x, y + 6, r + 4, r * 0.8, 0, 0, TAU); c.fill();
  c.fillStyle = "#28384e";
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = "rgba(95,231,245,0.18)";
  c.lineWidth = 2;
  c.beginPath(); c.arc(x, y, r - 5, 0, TAU); c.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    c.fillStyle = "#1b2838";
    c.beginPath();
    c.arc(x + Math.cos(a) * (r + 14), y + Math.sin(a) * (r + 14), 7, 0, TAU);
    c.fill();
  }
  c.restore();
}
function plant(c, x, y) {
  c.save();
  c.fillStyle = "#1f3040";
  rr(c, x - 8, y + 2, 16, 14, 3); c.fill();
  c.fillStyle = "#2f6b4a";
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.5;
    c.beginPath();
    c.ellipse(x + Math.cos(a) * 9, y - 5 + Math.sin(a) * 9, 5, 11, a, 0, TAU);
    c.fill();
  }
  c.restore();
}
function bed(c, x, y, color) {
  c.save();
  rr(c, x, y, 62, 26, 6);
  c.fillStyle = "#1a2b3a"; c.fill();
  rr(c, x + 4, y + 4, 54, 18, 4);
  c.fillStyle = color; c.fill();
  rr(c, x + 6, y + 5, 14, 10, 3);
  c.fillStyle = "rgba(255,255,255,0.35)"; c.fill();
  c.restore();
}
function scanner(c, x, y) {
  c.save();
  c.strokeStyle = "rgba(111, 227, 245, 0.35)";
  c.lineWidth = 3;
  c.beginPath(); c.arc(x, y, 22, Math.PI * 0.55, Math.PI * 1.45); c.stroke();
  c.fillStyle = "rgba(111, 227, 245, 0.12)";
  c.beginPath(); c.arc(x, y, 17, 0, TAU); c.fill();
  c.restore();
}
function consoleProp(c, x, y, w, h, accent) {
  c.save();
  rr(c, x, y, w, h, 7);
  c.fillStyle = "#1b2938"; c.fill();
  c.strokeStyle = "rgba(95,231,245,0.2)"; c.lineWidth = 1.5; c.stroke();
  rr(c, x + 6, y + 6, w - 12, h - 16, 3);
  c.fillStyle = shade(accent, -0.7); c.fill();
  c.fillStyle = accent;
  c.globalAlpha = 0.55;
  c.fillRect(x + 10, y + 10, (w - 20) * 0.55, 3);
  c.fillRect(x + 10, y + 16, (w - 20) * 0.35, 2);
  c.globalAlpha = 1;
  c.fillStyle = "rgba(255,255,255,0.1)";
  c.fillRect(x + 6, y + h - 7, w - 12, 3);
  c.restore();
}
function crate(c, x, y, s) {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.25)";
  rr(c, x + 3, y + 4, s, s, 4); c.fill();
  rr(c, x, y, s, s, 4);
  c.fillStyle = "#3a2f22"; c.fill();
  c.strokeStyle = "rgba(255, 176, 102, 0.2)"; c.lineWidth = 1.5; c.stroke();
  c.beginPath(); c.moveTo(x + 4, y + 4); c.lineTo(x + s - 4, y + s - 4);
  c.moveTo(x + s - 4, y + 4); c.lineTo(x + 4, y + s - 4); c.stroke();
  c.restore();
}
function barrel(c, x, y) {
  c.save();
  c.fillStyle = "#4a3524";
  rr(c, x, y, 20, 26, 7); c.fill();
  c.strokeStyle = "rgba(255, 176, 102, 0.22)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x + 2, y + 8); c.lineTo(x + 18, y + 8); c.stroke();
  c.beginPath(); c.moveTo(x + 2, y + 18); c.lineTo(x + 18, y + 18); c.stroke();
  c.restore();
}
function panel(c, x, y, accent) {
  c.save();
  rr(c, x, y, 34, 30, 4);
  c.fillStyle = "#202a36"; c.fill();
  c.strokeStyle = "rgba(95,231,245,0.14)"; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = accent;
  c.globalAlpha = 0.75;
  c.beginPath(); c.arc(x + 10, y + 9, 2.5, 0, TAU); c.fill();
  c.globalAlpha = 0.35;
  for (let i = 0; i < 3; i++) c.fillRect(x + 7, y + 16 + i * 4, 20, 2);
  c.restore();
}
function chair(c, x, y) {
  c.save();
  c.fillStyle = "#233142";
  rr(c, x - 8, y - 8, 16, 16, 5); c.fill();
  c.strokeStyle = "rgba(95,231,245,0.12)"; c.lineWidth = 1; c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- ui refs
const ui = {
  bg: $("#bg"), menu: $("#menu"), role: $("#role"), hud: $("#hud"),
  nickname: $("#nickname"), colorRow: $("#colorRow"), playBtn: $("#playBtn"),
  howtoBtn: $("#howtoBtn"), howto: $("#howto"), howtoClose: $("#howtoClose"), howtoPlay: $("#howtoPlay"),
  roleIcon: $("#roleIcon"), roleTitle: $("#roleTitle"), roleDesc: $("#roleDesc"),
  roleTasks: $("#roleTasks"), roleStart: $("#roleStart"),
  roleTag: $("#roleTag"), taskPct: $("#taskPct"), taskFill: $("#taskFill"), taskList: $("#taskList"),
  soundBtn: $("#soundBtn"), pauseBtn: $("#pauseBtn"),
  prompt: $("#prompt"), killBtn: $("#killBtn"), ventBtn: $("#ventBtn"),
  useBtn: $("#useBtn"), useLabel: $("#useLabel"),
  joystick: $("#joystick"), joyKnob: $("#joyKnob"), notify: $("#notify"),
  pause: $("#pause"), resumeBtn: $("#resumeBtn"), pauseRestartBtn: $("#pauseRestartBtn"), pauseMenuBtn: $("#pauseMenuBtn"),
  minigame: $("#minigame"), mgTitle: $("#mgTitle"), mgBody: $("#mgBody"), mgHint: $("#mgHint"), mgClose: $("#mgClose"),
  meeting: $("#meeting"), meetingTitle: $("#meetingTitle"), meetingSub: $("#meetingSub"),
  meetingTimer: $("#meetingTimer"), meetingChat: $("#meetingChat"), meetingGrid: $("#meetingGrid"),
  skipVote: $("#skipVote"), ejectScene: $("#ejectScene"), ejectBean: $("#ejectBean"),
  ejectTitle: $("#ejectTitle"), ejectSub: $("#ejectSub"),
  end: $("#end"), endEmblem: $("#endEmblem"), endTitle: $("#endTitle"), endSub: $("#endSub"),
  endStats: $("#endStats"), againBtn: $("#againBtn"), endMenuBtn: $("#endMenuBtn"),
  toasts: $("#toasts")
};

const BOT_NAMES = ["Deniz", "Bora", "Zeynep", "Atlas", "Nova", "Elif", "Kaan", "Ayla", "Orion", "Luna", "Mert", "Ege", "Selin", "Derya", "Poyraz", "Rüzgar"];
const KILL_CD = 12;
const BOT_KILL_CD = 15;
const VENT_CD = 2.5;
const WITNESS_R = 300;
const BOT_SPEED = 96;

const state = {
  phase: "menu",
  players: [],
  player: null,
  bodies: [],
  tasks: [],
  elapsed: 0,
  gameTime: 0,
  playerKillCd: 0,
  playerVentCd: 0,
  emergencyUsed: false,
  camera: { x: SPAWN.x, y: SPAWN.y },
  shake: 0,
  selectedColor: 0,
  session: 0,
  meeting: null,
  keys: new Set(),
  joy: { active: false, dx: 0, dy: 0, id: null },
  near: { task: null, body: null, victim: null, vent: null, emergency: false },
  promptKey: "",
  hudKey: "",
  minigame: null,
  stats: null,
  paused: false,
  gameVisible: false
};

const timers = new Set();
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
  return id;
}
function clearTimers() {
  for (const id of timers) clearTimeout(id);
  timers.clear();
}

// ---------------------------------------------------------------- menu
function loadPrefs() {
  try {
    const n = localStorage.getItem("sus_name");
    const c = parseInt(localStorage.getItem("sus_color"), 10);
    if (n) ui.nickname.value = n;
    if (Number.isFinite(c) && c >= 0 && c < COLORS.length) state.selectedColor = c;
  } catch (e) { /* ignore */ }
}
function savePrefs() {
  try {
    localStorage.setItem("sus_name", ui.nickname.value.trim().slice(0, 12));
    localStorage.setItem("sus_color", String(state.selectedColor));
  } catch (e) { /* ignore */ }
}
function buildColorRow() {
  ui.colorRow.innerHTML = "";
  COLORS.forEach((col, i) => {
    const b = document.createElement("button");
    b.className = "swatch" + (i === state.selectedColor ? " on" : "");
    b.style.setProperty("--c", col.hex);
    b.title = col.name;
    b.setAttribute("aria-label", col.name);
    b.addEventListener("click", () => {
      state.selectedColor = i;
      Sound.click();
      buildColorRow();
      const logo = $("#logoChibi");
      if (logo) logo.style.setProperty("--c", col.hex);
    });
    ui.colorRow.appendChild(b);
  });
  const logo = $("#logoChibi");
  if (logo) logo.style.setProperty("--c", COLORS[state.selectedColor].hex);
}

function openHowto() {
  Sound.click();
  ui.howto.classList.remove("hidden");
}
function closeHowto() {
  ui.howto.classList.add("hidden");
}

// ---------------------------------------------------------------- game setup
function sanitizeName(v) {
  const s = (v || "").trim().replace(/\s+/g, " ").slice(0, 12);
  return s || "Mürettebat";
}

function newGame() {
  clearTimers();
  state.session++;
  state.phase = "reveal";
  state.bodies = [];
  state.elapsed = 0;
  state.gameTime = 0;
  state.playerKillCd = 0;
  state.playerVentCd = 0;
  state.emergencyUsed = false;
  state.meeting = null;
  state.near = { task: null, body: null, victim: null, vent: null, emergency: false };
  state.shake = 0;
  state.paused = false;
  state.minigame = null;

  const name = sanitizeName(ui.nickname.value);
  ui.nickname.value = name;
  savePrefs();

  const impIsPlayer = Math.random() < 0.4;
  const colorIdx = state.selectedColor;
  const botColors = shuffle(COLORS.map((_, i) => i).filter((i) => i !== colorIdx)).slice(0, 7);
  const botNames = shuffle(BOT_NAMES).slice(0, 7);

  const slots = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i / 7) * TAU;
    slots.push({ x: SPAWN.x + Math.cos(a) * 66, y: SPAWN.y + Math.sin(a) * 62 });
  }

  const players = [];
  const player = {
    id: 0,
    name,
    color: COLORS[colorIdx].hex,
    colorName: COLORS[colorIdx].name,
    isPlayer: true,
    isImpostor: impIsPlayer,
    alive: true,
    ghost: false,
    x: SPAWN.x,
    y: SPAWN.y,
    facing: 1,
    walk: 0,
    moving: false,
    kills: 0,
    tasks: [],
    path: null,
    target: null,
    think: 0,
    work: 0,
    idle: 0,
    killCd: 0,
    witness: null,
    sawVent: false,
    reported: false
  };
  players.push(player);

  for (let i = 0; i < 7; i++) {
    const ci = botColors[i];
    const bot = {
      id: i + 1,
      name: botNames[i],
      color: COLORS[ci].hex,
      colorName: COLORS[ci].name,
      isPlayer: false,
      isImpostor: !impIsPlayer && i === 0,
      alive: true,
      ghost: false,
      x: slots[i].x,
      y: slots[i].y,
      facing: 1,
      walk: 0,
      moving: false,
      kills: 0,
      tasks: [],
      path: null,
      target: null,
      think: rand(0, 1),
      work: 0,
      idle: rand(0.5, 2),
      killCd: BOT_KILL_CD,
      witness: null,
      sawVent: false,
      reported: false,
      wander: null
    };
    players.push(bot);
  }

  for (const p of players) {
    p.tasks = shuffle(TASK_DEFS).slice(0, 3).map((def) => ({ def, done: false }));
  }

  state.players = players;
  state.player = player;
  state.camera.x = player.x;
  state.camera.y = player.y;

  ui.menu.classList.add("hidden");
  ui.end.classList.add("hidden");
  ui.meeting.classList.add("hidden");
  ui.pause.classList.add("hidden");
  ui.minigame.classList.add("hidden");
  ui.hud.classList.add("hidden");
  ui.notify.classList.add("hidden");
  ui.role.classList.remove("hidden");
  ui.role.classList.toggle("impostor", impIsPlayer);
  ui.roleIcon.style.setProperty("--c", player.color);
  ui.roleTitle.textContent = impIsPlayer ? "HİLECİ" : "MÜRETTEBAT";
  ui.roleDesc.textContent = impIsPlayer
    ? "Kimseye görünmeden mürettebatı öldür. Cesetleri bildirip masumları suçla. Herkesi yok et ya da sayıyı eşitle."
    : "Görevlerini tamamla ve hileciyi bul. Görev çubuğu %100 olursa ya da hileci oylamayla atılırsa kazanırsın.";

  ui.roleTasks.innerHTML = "";
  const tLabel = document.createElement("div");
  tLabel.className = "role-task";
  tLabel.innerHTML = impIsPlayer
    ? "<b>SAHTE</b> Kamuflaj görevlerin"
    : "<b>GÖREV</b> 3 görev seni bekliyor";
  ui.roleTasks.appendChild(tLabel);
  for (const t of player.tasks) {
    const el = document.createElement("div");
    el.className = "role-task";
    el.textContent = t.def.name;
    ui.roleTasks.appendChild(el);
  }

  $("#game").style.display = "block";
  state.gameVisible = true;
  buildColorRow();

  Sound.meeting();
  toast(impIsPlayer ? "Rolün: HİLECİ — kimseye belli etme." : "Rolün: MÜRETTEBAT — görevlere odaklan.", impIsPlayer ? "red" : "green");
}

function beginPlay() {
  if (!state.player) return;
  ui.role.classList.add("hidden");
  ui.hud.classList.remove("hidden");
  state.phase = "playing";
  state.gameTime = 0;
  state.elapsed = 0;
  state.playerKillCd = state.player.isImpostor ? KILL_CD : 0;
  for (const p of state.players) {
    p.killCd = Math.max(p.killCd, BOT_KILL_CD);
  }
  const coarse = window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  ui.joystick.classList.toggle("hidden", !coarse);
  state.camera.x = state.player.x;
  state.camera.y = state.player.y;
  renderTasks();
  refreshHUD(true);
  Sound.click();
  if (state.player.isImpostor) {
    toast("E ile öldür, Q ile havalandırmaya gir.", "red");
  } else {
    toast("Görev noktalarına git ve E ile görevleri yap.", "cyan");
  }
  updateCamera(1);
}

// ---------------------------------------------------------------- notifications
function toast(text, cls) {
  const el = document.createElement("div");
  el.className = "toast " + (cls || "");
  el.textContent = text;
  ui.toasts.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 320);
  }, 3400);
}

let notifyTimer = null;
function notify(text, cls) {
  ui.notify.textContent = text;
  ui.notify.className = "notify " + (cls || "");
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => ui.notify.classList.add("hidden"), 4200);
}

// ---------------------------------------------------------------- tasks / hud
function taskStats() {
  let done = 0, total = 0;
  for (const p of state.players) {
    if (p.isImpostor) continue;
    for (const t of p.tasks) {
      if (t.done) { done++; total++; }
      else if (p.alive || p.isPlayer) total++;
    }
  }
  return { done, total, pct: total ? done / total : 0 };
}

function renderTasks() {
  const p = state.player;
  if (!p) return;
  ui.taskList.innerHTML = "";
  for (const t of p.tasks) {
    const row = document.createElement("div");
    row.className = "task-row" + (t.done ? " done" : "") + (p.isImpostor ? " fake" : "");
    const dot = document.createElement("span");
    dot.className = "tdot";
    dot.textContent = t.done ? "✓" : "";
    const label = document.createElement("span");
    label.textContent = t.def.name;
    row.appendChild(dot);
    row.appendChild(label);
    ui.taskList.appendChild(row);
  }
  ui.roleTag.textContent = !p.alive ? "HAYALET" : p.isImpostor ? "HİLECİ" : "MÜRETTEBAT";
  ui.roleTag.className = "role-chip" + (!p.alive ? " ghost" : p.isImpostor ? " impostor" : "");
  refreshHUD(true);
}

function refreshHUD(force) {
  const p = state.player;
  if (!p) return;
  const st = taskStats();
  const pct = Math.round(st.pct * 100);
  ui.taskPct.textContent = pct + "%";
  ui.taskFill.style.width = (st.pct * 100).toFixed(1) + "%";
  if (p.isImpostor && p.alive) {
    ui.roleTag.textContent = "HİLECİ";
    ui.roleTag.className = "role-chip impostor";
  } else if (!p.alive) {
    ui.roleTag.textContent = "HAYALET";
    ui.roleTag.className = "role-chip ghost";
  }

  const isImp = p.isImpostor && p.alive;
  const near = state.near;
  const showKill = isImp;
  const showVent = isImp;
  const showUse = !!(near.task || near.body || near.emergency) || (isImp && near.body);
  const useKind = near.body ? "report" : "use";

  ui.killBtn.classList.toggle("hidden", !showKill);
  ui.ventBtn.classList.toggle("hidden", !showVent);
  ui.useBtn.classList.toggle("hidden", !showUse);
  ui.useBtn.classList.toggle("report", useKind === "report");
  ui.useLabel.textContent = near.body ? "BİLDİR" : near.emergency ? "TOPLANTI" : "GÖREV";

  // kill cooldown
  const killCd = state.playerKillCd;
  const killReady = killCd <= 0 && !!near.victim;
  ui.killBtn.disabled = !killReady;
  const km = ui.killBtn.querySelector(".cd-mask");
  const kn = ui.killBtn.querySelector(".cd-num");
  if (killCd > 0) {
    km.style.background = `conic-gradient(rgba(3,6,13,.8) ${clamp(killCd / KILL_CD, 0, 1) * 360}deg, rgba(3,6,13,0) 0deg)`;
    kn.textContent = Math.ceil(killCd);
  } else {
    km.style.background = "transparent";
    kn.textContent = "";
  }

  const ventCd = state.playerVentCd;
  ui.ventBtn.disabled = !(near.vent && ventCd <= 0);
  const vm = ui.ventBtn.querySelector(".cd-mask");
  const vn = ui.ventBtn.querySelector(".cd-num");
  if (ventCd > 0) {
    vm.style.background = `conic-gradient(rgba(3,6,13,.8) ${clamp(ventCd / VENT_CD, 0, 1) * 360}deg, rgba(3,6,13,0) 0deg)`;
    vn.textContent = Math.ceil(ventCd);
  } else {
    vm.style.background = "transparent";
    vn.textContent = "";
  }

  ui.useBtn.disabled = false;
  if (!showUse) {
    ui.useBtn.classList.add("hidden");
  }

  // prompt
  let html = "";
  if (state.phase === "playing") {
    if (near.victim && isImp) {
      html = `<span class="key">E</span> ${near.victim.name} — Öldür`;
    } else if (near.body) {
      html = `<span class="key">E</span> Cesedi bildir — ${near.body.name}`;
    } else if (near.task) {
      html = `<span class="key">E</span> ${near.task.def.name} görevini yap`;
    } else if (near.emergency) {
      html = `<span class="key">E</span> Acil toplantı çağır`;
    } else if (near.vent && isImp) {
      html = `<span class="key">Q</span> Havalandırmaya gir`;
    }
  }
  if (html !== state.promptKey) {
    state.promptKey = html;
    if (html) {
      ui.prompt.innerHTML = html;
      ui.prompt.classList.remove("hidden");
      ui.prompt.classList.toggle("report", !!near.body);
    } else {
      ui.prompt.classList.add("hidden");
    }
  }
}

// ---------------------------------------------------------------- player actions
function flash() {
  const el = document.createElement("div");
  el.className = "flash-red";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function playerKill(victim) {
  const p = state.player;
  if (!p || !p.isImpostor || !p.alive) return;
  if (state.playerKillCd > 0) return;
  if (!victim || !victim.alive || victim.ghost) return;
  if (dist(p, victim) > 58) return;
  performKill(p, victim);
  state.playerKillCd = KILL_CD;
  updateNear();
  refreshHUD(true);
}

function performKill(killer, victim) {
  if (!victim || !victim.alive) return;
  victim.alive = false;
  victim.ghost = true;
  victim.path = null;
  victim.workingTask = null;
  killer.kills = (killer.kills || 0) + 1;

  const body = {
    x: victim.x,
    y: victim.y,
    color: victim.color,
    name: victim.name,
    id: Math.random().toString(36).slice(2),
    born: state.gameTime
  };
  state.bodies.push(body);

  Sound.kill();
  state.shake = 12;
  if (killer.isPlayer || victim.isPlayer) flash();
  if (killer.isPlayer) toast(`Sessizce hallettin: ${victim.name}`, "red");
  if (victim.isPlayer) onPlayerDeath();

  // witnesses
  if (!state.meeting) {
    for (const b of state.players) {
      if (b === killer || b === victim || b.isImpostor || !b.alive || b.isPlayer || b.ghost) continue;
      if (dist(b, victim) < WITNESS_R) {
        b.witness = killer.id;
        b.reportPend = rand(1.4, 2.4);
        b.reportReason = "witness";
        b.reportBody = body;
      }
    }
  }
  renderTasks();
  updateNear();
  refreshHUD(true);
  checkWin();
}

function onPlayerDeath() {
  const p = state.player;
  if (!p) return;
  renderTasks();
  refreshHUD(true);
  notify("ÖLDÜN. Hayalet olarak görevleri tamamlamaya devam edebilirsin.", "cyan");
  Sound.death();
  toast("Artık bir hayaletsin. Duvarlardan geçebilir, görev yapabilirsin.", "cyan");
}

function playerVent() {
  const p = state.player;
  if (!p || !p.isImpostor || !p.alive) return;
  if (state.phase !== "playing" || state.playerVentCd > 0) return;
  const vent = state.near.vent;
  if (!vent) return;
  const idx = VENTS.indexOf(vent);
  const next = VENTS[(idx + 1) % VENTS.length];

  // bots can spot a venting impostor
  for (const b of state.players) {
    if (b.isImpostor || !b.alive || b.isPlayer || b.ghost) continue;
    if (!state.meeting && dist(b, p) < 200) {
      b.witness = p.id;
      b.reportPend = rand(1.2, 2.0);
      b.reportReason = "vent";
      b.reportBody = null;
    }
  }

  p.x = next.x;
  p.y = next.y;
  p.facing = 1;
  state.playerVentCd = VENT_CD;
  state.camera.x = p.x;
  state.camera.y = p.y;
  state.shake = 5;
  Sound.vent();
  toast("Havalandırma: " + next.room, "cyan");
  updateNear();
}

function reportBody(body) {
  const p = state.player;
  if (!p || !p.alive || !body || state.phase !== "playing") return;
  state.bodies = state.bodies.filter((b) => b !== body);
  startMeeting("body", p, body);
}

function callEmergency() {
  const p = state.player;
  if (!p || !p.alive || state.emergencyUsed || state.phase !== "playing") return;
  state.emergencyUsed = true;
  startMeeting("emergency", p, null);
}

function doAction() {
  if (state.phase !== "playing") return;
  const p = state.player;
  if (!p) return;
  const near = state.near;
  if (p.isImpostor && p.alive && near.victim && state.playerKillCd <= 0) {
    playerKill(near.victim);
    return;
  }
  if (p.alive && near.body) {
    reportBody(near.body);
    return;
  }
  if (near.task) {
    openMinigame(near.task);
    return;
  }
  if (p.alive && near.emergency) {
    callEmergency();
  }
}

// ---------------------------------------------------------------- interaction
function updateNear() {
  const p = state.player;
  const near = { task: null, body: null, victim: null, vent: null, emergency: false };
  if (!p || state.phase !== "playing") { state.near = near; return; }
  if (p.alive) {
    for (const b of state.bodies) {
      if (dist(p, b) < 58) { near.body = b; break; }
    }
    if (!state.emergencyUsed && dist(p, EMERGENCY) < 56) near.emergency = true;
  }
  for (const t of p.tasks) {
    if (t.done) continue;
    if (Math.hypot(p.x - t.def.x, p.y - t.def.y) < 46) { near.task = t; break; }
  }
  if (p.isImpostor && p.alive) {
    let bd = 999;
    for (const q of state.players) {
      if (q.isPlayer || q.isImpostor || !q.alive || q.ghost) continue;
      const d = dist(p, q);
      if (d < 54 && d < bd) { bd = d; near.victim = q; }
    }
    for (const v of VENTS) {
      if (Math.hypot(p.x - v.x, p.y - v.y) < 48) { near.vent = v; break; }
    }
  }
  state.near = near;
}

// ---------------------------------------------------------------- movement
function updatePlayer(dt) {
  const p = state.player;
  if (!p) return;
  let dx = 0, dy = 0;
  const k = state.keys;
  if (k.has("KeyW") || k.has("ArrowUp")) dy -= 1;
  if (k.has("KeyS") || k.has("ArrowDown")) dy += 1;
  if (k.has("KeyA") || k.has("ArrowLeft")) dx -= 1;
  if (k.has("KeyD") || k.has("ArrowRight")) dx += 1;
  if (state.joy.active) { dx += state.joy.dx; dy += state.joy.dy; }
  const len = Math.hypot(dx, dy);
  if (len > 0.12) {
    dx /= len; dy /= len;
    const speed = p.ghost ? 200 : p.isImpostor ? 174 : 166;
    const moved = moveTowards(p, p.x + dx * 120, p.y + dy * 120, speed, dt, !p.ghost);
    p.moving = moved;
    p.walk += dt * (moved ? 9 : 3);
    if (Math.abs(dx) > 0.2) p.facing = dx > 0 ? 1 : -1;
    if (p.ghost) {
      p.x = clamp(p.x, 14, W - 14);
      p.y = clamp(p.y, 14, H - 14);
    }
  } else {
    p.moving = false;
    p.walk += dt * 2;
  }
}

function updateCamera(dt) {
  const p = state.player;
  if (!p) return;
  const scale = viewScale();
  const viewW = cw / scale, viewH = ch / scale;
  const tx = viewW >= W ? W / 2 : clamp(p.x, viewW / 2, W - viewW / 2);
  const ty = viewH >= H ? H / 2 : clamp(p.y, viewH / 2, H - viewH / 2);
  const k = dt >= 1 ? 1 : 1 - Math.exp(-dt * 8);
  state.camera.x += (tx - state.camera.x) * k;
  state.camera.y += (ty - state.camera.y) * k;
}
function viewScale() {
  return clamp(Math.min(cw / 1180, ch / 700), 0.55, 1.45);
}

// ---------------------------------------------------------------- bots
function botMove(b, dt) {
  if (!b.path || !b.path.length) { b.moving = false; return; }
  const t = b.path[0];
  const bx = b.x, by = b.y;
  const moved = moveTowards(b, t.x, t.y, BOT_SPEED, dt, true);
  b.moving = moved;
  if (moved) {
    b.walk += dt * 8;
    if (Math.abs(t.x - bx) > 0.6) b.facing = t.x > bx ? 1 : -1;
    b.stuck = 0;
  } else {
    b.stuck = (b.stuck || 0) + dt;
    if (b.stuck > 0.55) {
      b.stuck = 0;
      b.path = null;
      b.idle = rand(0.5, 1.1);
      b.crowded = (b.crowded || 0) + 1;
    }
  }
  if (b.path && Math.hypot(t.x - b.x, t.y - b.y) < 9) {
    b.path.shift();
    if (!b.path.length) {
      b.moving = false;
      if (b.mode === "wander") { b.idle = rand(1.5, 3.5); b.mode = "idle"; }
    }
  }
}

function chooseCrewTask(b) {
  const pending = b.tasks.filter((t) => !t.done);
  if (!pending.length) return null;
  return pick(pending);
}

function updateCrewBot(b, dt) {
  if (b.reportPend > 0) {
    b.reportPend -= dt;
    if (b.reportPend <= 0 && state.phase === "playing") {
      if (b.reportReason === "witness") {
        startMeeting("witness", b, b.reportBody);
      } else if (b.reportReason === "vent") {
        startMeeting("vent", b, null);
      } else {
        startMeeting("body", b, b.reportBody);
      }
      return;
    }
  }

  // spot bodies
  if (!state.meeting && !b.reportPend) {
    for (const body of state.bodies) {
      if (dist(b, body) < 74) {
        b.reportPend = rand(0.4, 0.9);
        b.reportReason = "body";
        b.reportBody = body;
        b.path = null;
        break;
      }
    }
  }

  if (b.work > 0) {
    b.work -= dt;
    if (b.work <= 0) {
      const t = b.workingTask;
      if (t && !t.done) t.done = true;
      b.workingTask = null;
      b.idle = rand(12, 20);
      b.taskRef = null;
      b.mode = "idle";
      refreshHUD(true);
    }
    return;
  }
  if (b.idle > 0) { b.idle -= dt; return; }

  if (b.taskRef) {
    const t = b.taskRef;
    if (Math.hypot(b.x - t.def.x, b.y - t.def.y) < 28) {
      b.workingTask = t;
      b.taskRef = null;
      b.path = null;
      b.work = rand(4, 7);
      b.facing = 1;
      return;
    }
    if (!b.path || !b.path.length) {
      b.repath = (b.repath || 0) - dt;
      if (b.repath <= 0) {
        b.path = findPath(b.x, b.y, t.def.x, t.def.y);
        b.repath = 0.8;
        if (!b.path.length) { b.taskRef = null; b.idle = rand(1, 2); }
      }
      return;
    }
    botMove(b, dt);
    return;
  }

  const t = chooseCrewTask(b);
  if (t) {
    b.taskRef = t;
    b.path = findPath(b.x, b.y, t.def.x, t.def.y);
    if (!b.path.length) { b.taskRef = null; b.idle = rand(1, 2); }
  } else {
    if (!b.path || !b.path.length) {
      const pt = randomPointInWalkable();
      b.path = findPath(b.x, b.y, pt.x, pt.y);
      b.mode = "wander";
      b.idle = rand(2, 6);
    } else {
      botMove(b, dt);
    }
  }
}

function updateImpostorBot(b, dt) {
  b.killCd = Math.max(0, b.killCd - dt);
  b.think -= dt;

  // valid target
  if (b.huntTarget && (!b.huntTarget.alive || b.huntTarget.isImpostor)) b.huntTarget = null;

  if (b.path && b.path.length) {
    botMove(b, dt);
    if (b.huntTarget && b.huntTarget.alive && dist(b, b.huntTarget) < 42 && b.killCd <= 0) {
      botKill(b, b.huntTarget);
    }
    return;
  }

  if (b.idle > 0) { b.idle -= dt; return; }

  if (b.killCd <= 0) {
    if (!b.huntTarget || b.think <= 0) {
      b.think = rand(1.4, 2.6);
      let best = null, bd = 900;
      for (const q of state.players) {
        if (q.isImpostor || !q.alive || q.ghost) continue;
        const d = dist(b, q);
        if (d < bd) { bd = d; best = q; }
      }
      b.huntTarget = best;
    }
    if (b.huntTarget) {
      if (b.huntTarget.alive && dist(b, b.huntTarget) < 42) {
        botKill(b, b.huntTarget);
        return;
      }
      b.path = findPath(b.x, b.y, b.huntTarget.x, b.huntTarget.y);
      b.idle = 0;
      if (!b.path.length) { b.huntTarget = null; b.idle = rand(1, 2); }
      return;
    }
  }

  // pretend to work / wander while cooldown
  if (!b.path || !b.path.length) {
    const pt = randomPointInWalkable();
    b.path = findPath(b.x, b.y, pt.x, pt.y);
    b.mode = "wander";
    b.idle = rand(2, 5);
  } else {
    botMove(b, dt);
  }
}

function botKill(b, victim) {
  if (!victim.alive) return;
  performKill(b, victim);
  b.killCd = BOT_KILL_CD;
  b.huntTarget = null;
  b.path = null;
  b.idle = rand(0.6, 1.4);
  renderTasks();
  updateNear();
  refreshHUD(true);
  // sometimes escape through a vent
  const vent = VENTS.find((v) => Math.hypot(b.x - v.x, b.y - v.y) < 120);
  if (vent && Math.random() < 0.55) {
    const next = VENTS[(VENTS.indexOf(vent) + 1) % VENTS.length];
    b.x = next.x;
    b.y = next.y;
    b.path = null;
    b.idle = rand(1, 2);
  }
}

// ---------------------------------------------------------------- win / end
function checkWin() {
  if (state.phase !== "playing") return;
  const st = taskStats();
  if (st.total > 0 && st.done >= st.total) {
    endGame("crew", "tasks");
    return;
  }
  const impAlive = state.players.filter((p) => p.isImpostor && p.alive).length;
  const crewAlive = state.players.filter((p) => !p.isImpostor && p.alive).length;
  if (impAlive === 0) { endGame("crew", "ejected"); return; }
  if (crewAlive <= impAlive) { endGame("impostor", "parity"); }
}

function endGame(who, reason) {
  if (state.phase === "ended") return;
  state.phase = "ended";
  clearTimers();
  if (state.meeting && state.meeting.resolveTimer) clearTimeout(state.meeting.resolveTimer);
  state.meeting = null;
  ui.hud.classList.add("hidden");
  ui.meeting.classList.add("hidden");
  ui.minigame.classList.add("hidden");
  ui.pause.classList.add("hidden");
  ui.notify.classList.add("hidden");
  ui.end.classList.remove("hidden");

  const st = taskStats();
  const pct = Math.round(st.pct * 100);
  const survived = state.player.alive;
  const isCrew = !state.player.isImpostor;
  const playerWon = (who === "crew") === isCrew;
  const time = Math.floor(state.gameTime);
  const m = Math.floor(time / 60), s = time % 60;

  ui.end.classList.toggle("impostor", who === "impostor");
  ui.endEmblem.textContent = who === "crew" ? "🛡" : "☠";
  ui.endTitle.textContent = who === "crew" ? "MÜRETTEBAT KAZANDI" : "HİLECİ KAZANDI";
  let sub = "";
  if (reason === "tasks") sub = "Tüm görevler tamamlandı. İstasyon kurtuldu!";
  else if (reason === "ejected") sub = "Hileci oylamayla uzaya fırlatıldı. Mürettebat güvende.";
  else sub = "Hileci sayıyı eşitledi. İstasyonun karanlığı onun oldu.";
  if (!playerWon) sub += " Bu sefer kaybettin.";
  else sub += " Bu sefer kazandın!";
  ui.endSub.textContent = sub;

  ui.endStats.innerHTML = "";
  const stats = [
    { v: "%" + pct, l: "GÖREVLER" },
    { v: m + ":" + String(s).padStart(2, "0"), l: "SÜRE" },
    { v: state.player.kills || 0, l: "CİNAYET" }
  ];
  for (const stx of stats) {
    const d = document.createElement("div");
    d.className = "stat";
    d.innerHTML = `<b>${stx.v}</b><span>${stx.l}</span>`;
    ui.endStats.appendChild(d);
  }
  void survived;

  if (playerWon) Sound.win(); else Sound.lose();
}

function goMenu() {
  clearTimers();
  state.session++;
  state.phase = "menu";
  state.meeting = null;
  state.players = [];
  state.player = null;
  state.bodies = [];
  $("#game").style.display = "none";
  ui.hud.classList.add("hidden");
  ui.role.classList.add("hidden");
  ui.end.classList.add("hidden");
  ui.meeting.classList.add("hidden");
  ui.minigame.classList.add("hidden");
  ui.pause.classList.add("hidden");
  ui.howto.classList.add("hidden");
  ui.notify.classList.add("hidden");
  ui.menu.classList.remove("hidden");
  ui.prompt.classList.add("hidden");
  state.gameVisible = false;
  buildColorRow();
  Sound.click();
}

function restartGame() {
  clearTimers();
  state.session++;
  newGame();
}

function openPause() {
  if (state.phase !== "playing") return;
  state.paused = true;
  state.phase = "paused";
  ui.pause.classList.remove("hidden");
  Sound.click();
}
function closePause() {
  if (state.phase !== "paused") return;
  state.paused = false;
  ui.pause.classList.add("hidden");
  state.phase = "playing";
  Sound.click();
}

// ---------------------------------------------------------------- background / space
const bgCanvas = ui.bg;
const bgCtx = bgCanvas.getContext("2d");
const stars = Array.from({ length: 190 }, () => ({
  x: Math.random(),
  y: Math.random(),
  z: rand(0.25, 1),
  r: rand(0.45, 1.7),
  tw: rand(0, TAU),
  c: pick(["#cfe8ff", "#9fd8ff", "#ffffff", "#ffe9c4", "#c8b6ff"])
}));

function drawSpaceBackground(t) {
  if (bgCanvas.width !== Math.floor(cw * dpr) || bgCanvas.height !== Math.floor(ch * dpr)) {
    bgCanvas.width = Math.floor(cw * dpr);
    bgCanvas.height = Math.floor(ch * dpr);
  }
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  bgCtx.clearRect(0, 0, cw, ch);
  const g = bgCtx.createRadialGradient(cw * 0.74, ch * 0.3, 0, cw * 0.74, ch * 0.3, Math.max(cw, ch) * 0.75);
  g.addColorStop(0, "rgba(56, 38, 110, 0.30)");
  g.addColorStop(0.5, "rgba(20, 24, 58, 0.12)");
  g.addColorStop(1, "rgba(4, 6, 13, 0)");
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0, 0, cw, ch);

  for (const s of stars) {
    const a = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.4 + s.tw));
    bgCtx.globalAlpha = a * s.z;
    bgCtx.fillStyle = s.c;
    bgCtx.beginPath();
    bgCtx.arc(s.x * cw, s.y * ch, s.r * s.z, 0, TAU);
    bgCtx.fill();
  }
  bgCtx.globalAlpha = 1;

  // shooting star
  const cycle = t % 13;
  if (cycle < 1.1) {
    const p = cycle / 1.1;
    const sx = cw * (0.15 + p * 0.6);
    const sy = ch * (0.12 + p * 0.3);
    const grd = bgCtx.createLinearGradient(sx, sy, sx - 130, sy - 62);
    grd.addColorStop(0, "rgba(200, 240, 255, 0.9)");
    grd.addColorStop(1, "rgba(200, 240, 255, 0)");
    bgCtx.strokeStyle = grd;
    bgCtx.lineWidth = 2;
    bgCtx.beginPath();
    bgCtx.moveTo(sx, sy);
    bgCtx.lineTo(sx - 130, sy - 62);
    bgCtx.stroke();
  }
}

function drawGameSpace(t, scale, camX, camY) {
  // parallax starfield in screen space
  for (const s of stars) {
    const px = mod(s.x * cw - camX * s.z * 0.35 * scale, cw);
    const py = mod(s.y * ch - camY * s.z * 0.35 * scale, ch);
    ctx.globalAlpha = (0.25 + 0.35 * s.z) * (0.7 + 0.3 * Math.sin(t * 1.3 + s.tw));
    ctx.fillStyle = s.c;
    ctx.beginPath();
    ctx.arc(px, py, s.r * s.z * (0.7 + scale * 0.5), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(cw * 0.7, ch * 0.25, 0, cw * 0.7, ch * 0.25, Math.max(cw, ch) * 0.8);
  g.addColorStop(0, "rgba(50, 34, 100, 0.16)");
  g.addColorStop(1, "rgba(3, 5, 12, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, ch);
}
function mod(n, m) { return ((n % m) + m) % m; }

// ---------------------------------------------------------------- character art
function drawBeanShape(g, color, facing, walkPhase, scale) {
  const dark = shade(color, -0.55);
  const mid = shade(color, -0.18);
  const light = shade(color, 0.16);
  g.save();
  g.scale(scale, scale);

  // legs
  const swing = Math.sin(walkPhase) * 2.4;
  g.fillStyle = mid;
  g.strokeStyle = dark;
  g.lineWidth = 2;
  rr(g, -9, 8 + Math.max(0, swing), 8, 13, 3.5);
  g.fill(); g.stroke();
  rr(g, 1, 8 + Math.max(0, -swing), 8, 13, 3.5);
  g.fill(); g.stroke();

  // backpack
  g.fillStyle = mid;
  g.strokeStyle = dark;
  g.lineWidth = 2;
  g.save();
  g.translate(-facing * 13, 0);
  rr(g, -5, -9, 10, 20, 4);
  g.fill();
  g.stroke();
  g.restore();

  // body
  g.beginPath();
  g.moveTo(-13, -3);
  g.bezierCurveTo(-13, -24, 13, -24, 13, -3);
  g.lineTo(13, 7);
  g.quadraticCurveTo(13, 12, 8, 12);
  g.lineTo(-8, 12);
  g.quadraticCurveTo(-13, 12, -13, 7);
  g.closePath();
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = dark;
  g.lineWidth = 2.5;
  g.stroke();

  // highlight
  g.save();
  g.globalAlpha = 0.35;
  g.strokeStyle = light;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-8, -15);
  g.quadraticCurveTo(-11, -6, -10, 2);
  g.stroke();
  g.restore();

  // visor
  g.save();
  g.translate(facing * 4.6, -11);
  g.rotate(facing * -0.08);
  const vg = g.createLinearGradient(-8, -6, 8, 7);
  vg.addColorStop(0, "#e8fdff");
  vg.addColorStop(0.45, "#a9e9f8");
  vg.addColorStop(1, "#5cb2d2");
  g.fillStyle = vg;
  g.strokeStyle = shade("#4a8ca6", -0.45);
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(0, 0, 9, 6.4, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.ellipse(-3.2, -2.2, 3, 1.8, -0.3, 0, TAU);
  g.fill();
  g.restore();

  g.restore();
}

function drawPlayerCharacter(p, t) {
  const isGhost = p.ghost;
  const isMe = p.isPlayer;
  ctx.save();
  ctx.globalAlpha = isGhost ? 0.42 : 1;

  // shadow
  if (!isGhost) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 22, 15, 5, 0, 0, TAU);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(p.x, p.y);
  if (isMe) {
    ctx.shadowColor = isGhost ? "rgba(190,170,255,0.8)" : "rgba(95,231,245,0.55)";
    ctx.shadowBlur = 16;
  }
  drawBeanShape(ctx, p.color, p.facing, p.moving ? p.walk : p.walk * 0.2, 1);
  ctx.restore();

  if (isGhost) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "rgba(190,170,255,0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 22, 17, 6, 0, 0, TAU);
    ctx.stroke();
  }

  // name tag
  ctx.globalAlpha = isGhost ? 0.65 : 1;
  const label = p.name;
  ctx.font = "800 9px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(label).width;
  const tagY = p.y - 32;
  rr(ctx, p.x - tw / 2 - 5, tagY - 7, tw + 10, 14, 7);
  ctx.fillStyle = isMe ? "rgba(11, 34, 48, 0.82)" : "rgba(6, 12, 22, 0.76)";
  ctx.fill();
  if (isMe) {
    ctx.strokeStyle = "rgba(95,231,245,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = isMe ? "#bff7ff" : "rgba(225, 240, 255, 0.9)";
  ctx.fillText(label, p.x, tagY + 0.5);

  // little player arrow
  if (isMe && !isGhost) {
    const bob = Math.sin(t * 4) * 2;
    ctx.fillStyle = "rgba(95, 231, 245, 0.85)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 43 + bob);
    ctx.lineTo(p.x - 5, p.y - 51 + bob);
    ctx.lineTo(p.x + 5, p.y - 51 + bob);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawDeadBody(b, t) {
  ctx.save();
  ctx.translate(b.x, b.y + 4);
  ctx.rotate(-1.02);
  ctx.globalAlpha = 0.9;
  drawBeanShape(ctx, b.color, 1, 0, 1);
  ctx.restore();

  // little broken visor glint
  ctx.save();
  ctx.translate(b.x, b.y + 4);
  ctx.rotate(-1.02);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1, -15);
  ctx.lineTo(7, -7);
  ctx.stroke();
  ctx.restore();

  // dark puddle
  ctx.save();
  ctx.globalAlpha = 0.55;
  const g = ctx.createRadialGradient(b.x, b.y + 12, 0, b.x, b.y + 12, 27);
  g.addColorStop(0, shade(b.color, -0.55));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + 12, 27, 12, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // pulsing marker
  const pulse = 0.5 + 0.5 * Math.sin(t * 3 + b.x);
  ctx.save();
  ctx.globalAlpha = 0.25 + pulse * 0.2;
  ctx.strokeStyle = "#ff4d64";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y + 2, 22 + pulse * 5, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawVent(v, t, highlight) {
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 25, 9, 0, 0, TAU);
  ctx.fill();
  rr(ctx, -21, -14, 42, 26, 6);
  ctx.fillStyle = "#1a2634";
  ctx.fill();
  ctx.strokeStyle = highlight ? "rgba(167, 123, 255, 0.9)" : "rgba(120, 160, 200, 0.35)";
  ctx.lineWidth = highlight ? 2 : 1.5;
  ctx.stroke();
  ctx.fillStyle = "#0b121c";
  for (let i = 0; i < 3; i++) {
    rr(ctx, -15, -8 + i * 7, 30, 4, 2);
    ctx.fill();
  }
  if (highlight) {
    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 6);
    ctx.strokeStyle = "rgba(167, 123, 255, 0.7)";
    ctx.lineWidth = 2;
    rr(ctx, -25, -18, 50, 34, 9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTaskMarker(task, t) {
  const bob = Math.sin(t * 2.2 + task.def.x * 0.03) * 3;
  const x = task.def.x, y = task.def.y + bob;
  ctx.save();
  ctx.translate(x, y);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3 + task.def.y * 0.02);
  ctx.shadowColor = "rgba(255, 216, 61, 0.75)";
  ctx.shadowBlur = 14;
  ctx.rotate(t * 0.5);
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 13);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 216, 61, 0.16)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 216, 61, 0.95)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.28 + pulse * 0.22;
  ctx.strokeStyle = "#ffd83d";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 17 + pulse * 5, 0, TAU);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#2a1f00";
  ctx.font = "900 10px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", 0, 0.5);
  ctx.restore();
}

function drawEmergency(t) {
  const used = state.emergencyUsed;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
  ctx.save();
  ctx.translate(EMERGENCY.x, EMERGENCY.y);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 25, 9, 0, 0, TAU);
  ctx.fill();
  rr(ctx, -22, 2, 44, 13, 5);
  ctx.fillStyle = "#1b2938";
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 200, 255, 0.2)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (!used) {
    ctx.shadowColor = "rgba(255, 77, 100, 0.9)";
    ctx.shadowBlur = 18 + pulse * 14;
  }
  ctx.beginPath();
  ctx.arc(0, 1, 13, Math.PI, TAU);
  ctx.fillStyle = used ? "#3a4654" : "#e02c46";
  ctx.fill();
  ctx.strokeStyle = used ? "rgba(140,160,180,0.3)" : "rgba(255, 140, 155, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- game render
function renderGame(t) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = "#04060d";
  ctx.fillRect(0, 0, cw, ch);

  const scale = viewScale();
  const shake = state.shake;
  const ox = shake > 0 ? rand(-shake, shake) : 0;
  const oy = shake > 0 ? rand(-shake, shake) : 0;
  const camX = state.camera.x + ox;
  const camY = state.camera.y + oy;

  drawGameSpace(t, scale, camX, camY);

  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.scale(scale, scale);
  ctx.translate(-camX, -camY);

  ctx.drawImage(mapCanvas, 0, 0);

  // vents
  const p = state.player;
  const nearVent = p && p.isImpostor && p.alive ? state.near.vent : null;
  for (const v of VENTS) {
    drawVent(v, t, p && p.isImpostor && p.alive ? (nearVent === v ? true : Math.hypot(p.x - v.x, p.y - v.y) < 100) : false);
  }
  drawEmergency(t);

  // task markers (only own tasks)
  if (p) {
    for (const task of p.tasks) {
      if (!task.done) drawTaskMarker(task, t);
    }
  }

  // bodies
  for (const b of state.bodies) drawDeadBody(b, t);

  // characters
  const chars = state.players.filter((pl) => pl.alive || (pl.isPlayer && pl.ghost));
  chars.sort((a, b) => a.y - b.y);
  for (const pl of chars) drawPlayerCharacter(pl, t);

  ctx.restore();

  // darkness / vision
  const player = state.player;
  if (player) {
    if (player.ghost) {
      ctx.fillStyle = "rgba(8, 10, 24, 0.18)";
      ctx.fillRect(0, 0, cw, ch);
    } else {
      const sx = cw / 2 + (player.x - camX) * scale;
      const sy = ch / 2 + (player.y - camY) * scale;
      const radius = (player.isImpostor ? 440 : 390) * scale;
      const g = ctx.createRadialGradient(sx, sy, radius * 0.14, sx, sy, radius);
      g.addColorStop(0, "rgba(2, 5, 12, 0)");
      g.addColorStop(0.52, "rgba(2, 5, 12, 0.04)");
      g.addColorStop(0.76, "rgba(2, 5, 12, 0.4)");
      g.addColorStop(1, "rgba(2, 5, 12, 0.9)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
    }
  }

  // vignette
  const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.25, cw / 2, ch / 2, Math.max(cw, ch) * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, cw, ch);
}

// ---------------------------------------------------------------- mini games
function openMinigame(task) {
  if (!task || task.done) return;
  if (state.phase !== "playing") return;
  const p = state.player;
  if (!p) return;
  state.phase = "minigame";
  const type = task.def.type;
  state.minigame = { task, type, cleanup: null };
  ui.minigame.classList.remove("hidden");
  ui.mgTitle.textContent = TASK_TYPE_NAME[type] || task.def.name;
  ui.mgBody.innerHTML = "";
  ui.mgHint.textContent = "";
  Sound.click();
  if (type === "wiring") startWiring(task);
  else if (type === "calibrate") startCalibrate(task);
  else startDownload(task);
}

function closeMinigame() {
  const mg = state.minigame;
  if (mg && typeof mg.cleanup === "function") {
    try { mg.cleanup(); } catch (e) { /* ignore */ }
  }
  state.minigame = null;
  ui.minigame.classList.add("hidden");
  if (state.phase === "minigame") state.phase = "playing";
  updateNear();
  refreshHUD(true);
}

function completeTask(task) {
  if (!task || task.done) return;
  task.done = true;
  closeMinigame();
  renderTasks();
  Sound.task();
  toast("Görev tamamlandı: " + task.def.name, "green");
  const p = state.player;
  if (p && p.tasks.every((t) => t.done)) {
    toast(p.isImpostor ? "Tüm sahte görevler tamamlandı. Kamuflaj sürüyor." : "Tüm görevlerin tamamlandı!", "gold");
  }
  checkWin();
}

// ---- wiring
const WIRE_COLORS = [
  { id: "red", hex: "#ff4d64" },
  { id: "blue", hex: "#4f8cff" },
  { id: "yellow", hex: "#ffd83d" },
  { id: "pink", hex: "#ec6fc0" }
];

function startWiring(task) {
  const left = WIRE_COLORS.slice();
  const right = shuffle(left);
  ui.mgBody.innerHTML = `
    <div class="wire-wrap" id="wireWrap">
      <svg id="wireSvg"></svg>
      <div class="wire-col" id="wireL"></div>
      <div class="wire-col" id="wireR"></div>
    </div>`;
  ui.mgHint.textContent = "Soldaki renkleri sağdaki eşleriyle birleştir. Noktayı sürükle.";
  const wrap = $("#wireWrap");
  const svg = $("#wireSvg");
  const ns = "http://www.w3.org/2000/svg";
  const pairs = [];
  let drag = null;
  let preview = null;
  let done = false;

  const makeDot = (col, side, parent) => {
    const d = document.createElement("div");
    d.className = "wire-dot";
    d.style.setProperty("--c", col.hex);
    d.dataset.color = col.id;
    d.dataset.side = side;
    parent.appendChild(d);
    return d;
  };
  left.forEach((c) => makeDot(c, "left", $("#wireL")));
  right.forEach((c) => makeDot(c, "right", $("#wireR")));

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    return { x: r.left + r.width / 2 - w.left, y: r.top + r.height / 2 - w.top };
  }
  function line(a, b, color, cls) {
    const l = document.createElementNS(ns, "line");
    l.setAttribute("x1", a.x); l.setAttribute("y1", a.y);
    l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
    l.setAttribute("stroke", color);
    l.setAttribute("stroke-width", "6");
    l.setAttribute("stroke-linecap", "round");
    if (cls) l.setAttribute("class", cls);
    svg.appendChild(l);
    return l;
  }
  function redraw() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.innerHTML = "";
    preview = null;
    for (const pr of pairs) line(centerOf(pr.a), centerOf(pr.b), pr.colorHex);
    if (drag) {
      preview = line(drag.start, drag.point, drag.colorHex);
      preview.setAttribute("stroke-dasharray", "7 7");
      preview.setAttribute("opacity", "0.75");
    }
  }
  function pointerPos(e) {
    const w = wrap.getBoundingClientRect();
    return { x: e.clientX - w.left, y: e.clientY - w.top };
  }
  function onDown(e) {
    if (done) return;
    const dot = e.target.closest(".wire-dot");
    if (!dot || dot.dataset.side !== "left" || dot.classList.contains("used")) return;
    e.preventDefault();
    drag = {
      start: centerOf(dot),
      point: pointerPos(e),
      color: dot.dataset.color,
      colorHex: dot.style.getPropertyValue("--c").trim(),
      el: dot
    };
    dot.classList.add("hot");
    redraw();
  }
  function onMove(e) {
    if (!drag) return;
    drag.point = pointerPos(e);
    redraw();
  }
  function onUp(e) {
    if (!drag) return;
    const pos = pointerPos(e);
    let best = null, bd = 34;
    for (const dot of wrap.querySelectorAll('.wire-dot[data-side="right"]')) {
      if (dot.classList.contains("used") || dot.dataset.color !== drag.color) continue;
      const c = centerOf(dot);
      const d = Math.hypot(c.x - pos.x, c.y - pos.y);
      if (d < bd) { bd = d; best = dot; }
    }
    if (best) {
      drag.el.classList.remove("hot");
      drag.el.classList.add("used");
      best.classList.add("used");
      pairs.push({
        a: drag.el,
        b: best,
        colorHex: drag.colorHex
      });
      Sound.click();
      ui.mgHint.textContent = "Bağlandı: " + pairs.length + "/4";
      drag = null;
      redraw();
      if (pairs.length === 4 && !done) {
        done = true;
        later(() => {
          if (state.minigame && state.minigame.task === task) completeTask(task);
        }, 520);
      }
    } else {
      if (drag.el) drag.el.classList.remove("hot");
      drag = null;
      redraw();
      Sound.error();
    }
  }

  wrap.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  setTimeout(redraw, 30);
  window.addEventListener("resize", redraw);

  state.minigame.cleanup = () => {
    wrap.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    window.removeEventListener("resize", redraw);
  };
}

// ---- calibrate
function startCalibrate(task) {
  ui.mgBody.innerHTML = `
    <div class="cal-wrap">
      <div class="cal-track" id="calTrack">
        <div class="cal-zone" id="calZone"></div>
        <div class="cal-needle" id="calNeedle"></div>
      </div>
      <div class="cal-meta">
        <span id="calMsg">Yeşil alanda durdur.</span>
        <div class="cal-pips" id="calPips"></div>
      </div>
      <button id="calBtn" class="btn btn-primary cal-btn">DURDUR</button>
    </div>`;
  ui.mgHint.textContent = "İbre yeşil bölgedeyken DURDUR'a bas. 3 kez tuttur.";
  const track = $("#calTrack");
  const zoneEl = $("#calZone");
  const needleEl = $("#calNeedle");
  const msg = $("#calMsg");
  const pips = $("#calPips");
  const btn = $("#calBtn");

  let pos = 0, dir = 1, speed = 0.58;
  let zoneStart = rand(0.2, 0.55), zoneW = 0.18;
  let hits = 0, raf = null, last = performance.now(), done = false;

  for (let i = 0; i < 3; i++) {
    const p = document.createElement("div");
    p.className = "cal-pip";
    pips.appendChild(p);
  }
  function applyZone() {
    zoneEl.style.left = zoneStart * 100 + "%";
    zoneEl.style.width = zoneW * 100 + "%";
  }
  function loop(now) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    pos += dir * speed * dt;
    if (pos > 1) { pos = 1; dir = -1; }
    if (pos < 0) { pos = 0; dir = 1; }
    needleEl.style.left = pos * 100 + "%";
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (done) return;
    if (pos >= zoneStart && pos <= zoneStart + zoneW) {
      hits++;
      Sound.taskStep();
      pips.children[hits - 1].classList.add("on");
      if (hits >= 3) {
        done = true;
        msg.textContent = "Kalibrasyon tamam!";
        completeTask(task);
        return;
      }
      zoneW = Math.max(0.1, 0.18 - hits * 0.03);
      zoneStart = rand(0.12, 0.9 - zoneW);
      speed = 0.58 + hits * 0.16;
      applyZone();
      msg.textContent = hits + "/3 — devam et!";
    } else {
      msg.textContent = "Kaçırdın! Tekrar dene.";
      Sound.error();
    }
  }
  applyZone();
  raf = requestAnimationFrame(loop);
  btn.addEventListener("click", stop);
  state.minigame.cleanup = () => {
    if (raf) cancelAnimationFrame(raf);
    btn.removeEventListener("click", stop);
  };
}

// ---- download
function startDownload(task) {
  ui.mgBody.innerHTML = `
    <div class="dl-wrap">
      <div class="dl-screen"><div class="dl-pct" id="dlPct">0%</div></div>
      <div class="dl-track"><div class="dl-fill" id="dlFill"></div></div>
      <button id="dlBtn" class="btn btn-primary dl-btn">BASILI TUT</button>
    </div>`;
  ui.mgHint.textContent = "İndirme tamamlanana kadar butonu basılı tut.";
  const pct = $("#dlPct");
  const fill = $("#dlFill");
  const btn = $("#dlBtn");

  let prog = 0, holding = false, raf = null, last = performance.now(), done = false;
  function render() {
    pct.textContent = Math.floor(prog) + "%";
    fill.style.width = prog + "%";
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (holding && !done) {
      prog = Math.min(100, prog + dt * 52);
      render();
      if (prog >= 100) {
        done = true;
        holding = false;
        btn.textContent = "TAMAMLANDI";
        Sound.taskStep();
        later(() => {
          if (state.minigame && state.minigame.task === task) completeTask(task);
        }, 420);
      }
    }
    raf = requestAnimationFrame(loop);
  }
  function down(e) {
    if (done) return;
    e.preventDefault();
    holding = true;
    btn.textContent = "BIRAKMA...";
  }
  function up() {
    if (done) return;
    holding = false;
    btn.textContent = "BASILI TUT";
  }
  btn.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  render();
  raf = requestAnimationFrame(loop);
  state.minigame.cleanup = () => {
    if (raf) cancelAnimationFrame(raf);
    btn.removeEventListener("pointerdown", down);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
  };
}

// ---------------------------------------------------------------- meetings
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const GENERIC_CHAT = [
  "Nerede buldunuz?",
  "Ben görevdeydim, bütün gün.",
  "Biri bir şey gördü mü?",
  "Ben temizim, boşuna oy atmayın.",
  "Hemen oylayalım.",
  "Kanıt yok, ben atlıyorum.",
  "Beni takip eden biri vardı.",
  "Sakin olun, görevlere dönelim.",
  "Bence biri yalan söylüyor.",
  "Çok sessizsin, şüpheli.",
  "Oyu boşa harcamayın.",
  "Görev çubuğu ilerliyor, iyi iş."
];

function startMeeting(reason, reporter, body) {
  if (state.phase !== "playing") return;
  if (state.meeting) return;
  if (!state.player) return;
  state.phase = "meeting";
  for (const p of state.players) {
    p.path = null;
    p.workingTask = null;
    p.work = 0;
    p.idle = rand(0.5, 2);
    p.reportPend = 0;
    p.reportBody = null;
    p.reportReason = null;
  }
  if (body) state.bodies = state.bodies.filter((b) => b !== body);

  const m = {
    reason,
    reporter,
    body,
    elapsed: 0,
    timer: 20,
    votes: new Map(),
    plans: [],
    chat: [],
    chatIndex: 0,
    resolved: false,
    postTimer: 0,
    ejected: null,
    counts: null
  };

  for (const b of state.players) {
    if (b.isPlayer || !b.alive) continue;
    let target = "skip";
    if (!b.isImpostor && b.witness !== null && b.witness !== undefined) {
      const w = state.players.find((p) => p.id === b.witness);
      if (w && w.alive) target = w.id;
    } else if (b.isImpostor) {
      const crew = state.players.filter((p) => !p.isImpostor && p.alive && p !== b);
      if (crew.length && Math.random() < 0.62) target = pick(crew).id;
    } else if (Math.random() < 0.7) {
      const others = state.players.filter((p) => p.alive && p !== b);
      if (others.length) target = pick(others).id;
    }
    m.plans.push({ bot: b, at: rand(2.4, 9.5), target, done: false });
  }

  // ------- chat plan
  m.chat.push({
    at: 0.15,
    sys: true,
    text: `${reporter.name} toplantıyı başlattı.`
  });
  if (reason === "witness" && reporter.witness !== null) {
    const killer = state.players.find((p) => p.id === reporter.witness);
    if (killer) {
      m.chat.push({
        at: 0.7,
        name: reporter.name,
        color: reporter.color,
        text: body
          ? `${body.name}'i ${killer.name} öldürürken gördüm!`
          : `${killer.name}'i havalandırmadan çıkarken gördüm!`
      });
      m.chat.push({
        at: 1.4,
        name: killer.name,
        color: killer.color,
        text: "Bu bir yalan! Ben görevdeydim."
      });
    }
  } else if (reason === "body") {
    m.chat.push({
      at: 0.6,
      name: reporter.name,
      color: reporter.color,
      text: body ? `${body.name}'in cesedini buldum.` : "Ceset buldum."
    });
  } else if (reason === "emergency") {
    m.chat.push({
      at: 0.6,
      name: reporter.name,
      color: reporter.color,
      text: "Acil durum! Bir şeyler yanlış."
    });
  } else if (reason === "vent") {
    m.chat.push({
      at: 0.6,
      name: reporter.name,
      color: reporter.color,
      text: "Biri havalandırmaya giriyordu, gördüm!"
    });
  }

  const talkers = state.players.filter((p) => !p.isPlayer && p.alive);
  const usable = shuffle(talkers).slice(0, Math.min(3, talkers.length));
  const lines = shuffle(GENERIC_CHAT).slice(0, usable.length);
  usable.forEach((t, i) => {
    m.chat.push({
      at: rand(1.6, 4.6) + i * 0.7,
      name: t.name,
      color: t.color,
      text: lines[i]
    });
  });
  m.chat.sort((a, b) => a.at - b.at);

  state.meeting = m;
  ui.meetingTitle.textContent =
    reason === "witness" ? "CİNAYETE TANIK" :
    reason === "vent" ? "ŞÜPHELİ DURUM" :
    reason === "emergency" ? "ACİL TOPLANTI" : "CESET BULUNDU";
  const bodyTxt = body ? ` • ${body.name}'in cesedi` : "";
  ui.meetingSub.textContent =
    reason === "emergency" ? `${reporter.name} acil toplantı çağırdı${bodyTxt}` :
    reason === "witness" ? `${reporter.name} bir cinayete tanık olduğunu söylüyor${bodyTxt}` :
    reason === "vent" ? `${reporter.name} birini havalandırmada gördü${bodyTxt}` :
    `${reporter.name} bir ceset buldu${bodyTxt}`;
  ui.meetingTimer.textContent = "20";
  ui.meetingTimer.classList.remove("urgent");
  ui.meetingChat.innerHTML = "";
  ui.skipVote.classList.remove("voted");
  ui.skipVote.textContent = "OYU ATLA";
  ui.skipVote.disabled = false;
  if (!state.player.alive) {
    ui.skipVote.disabled = true;
    ui.skipVote.textContent = "HAYALETSİN";
  }
  ui.ejectScene.classList.add("hidden");
  ui.ejectBean.style.display = "none";
  ui.meeting.classList.remove("hidden");
  renderMeetingCards();
  Sound.meeting();
  updateNear();
  refreshHUD(true);
}

function renderMeetingCards() {
  const m = state.meeting;
  if (!m) return;
  ui.meetingGrid.innerHTML = "";
  for (const p of state.players) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pcard" + (p.alive ? "" : " dead");
    btn.dataset.id = p.id;
    btn.disabled = !p.alive;
    btn.innerHTML = `
      <div class="chibi" style="--c:${p.color}"><span class="pack"></span><span class="body"></span><span class="visor"></span></div>
      <span class="pname">${escapeHtml(p.name)}</span>
      ${p.isPlayer ? '<span class="ptag">SEN</span>' : ""}
    `;
    if (p.alive && state.player && state.player.alive && !m.resolved && !m.votes.has(state.player.id)) {
      btn.addEventListener("click", () => castPlayerVote(p.id));
    }
    if (state.player && m.votes.get(state.player.id) === p.id) btn.classList.add("voted");
    ui.meetingGrid.appendChild(btn);
  }
}

function castPlayerVote(target) {
  const m = state.meeting;
  const p = state.player;
  if (!m || m.resolved || !p || !p.alive) return;
  if (m.votes.has(p.id)) return;
  m.votes.set(p.id, target);
  Sound.vote();
  if (target === "skip") {
    ui.skipVote.classList.add("voted");
    ui.skipVote.disabled = true;
  }
  renderMeetingCards();
  if (m.votes.size >= state.players.filter((q) => q.alive).length) {
    resolveVotes(m);
  }
}

function updateMeeting(dt) {
  const m = state.meeting;
  if (!m) return;
  m.elapsed += dt;

  while (m.chatIndex < m.chat.length && m.chat[m.chatIndex].at <= m.elapsed) {
    const line = m.chat[m.chatIndex++];
    appendChatLine(line);
  }

  if (!m.resolved) {
    m.timer -= dt;
    const shown = Math.max(0, Math.ceil(m.timer));
    if (ui.meetingTimer.textContent !== String(shown)) ui.meetingTimer.textContent = String(shown);
    ui.meetingTimer.classList.toggle("urgent", m.timer < 6);

    for (const plan of m.plans) {
      if (plan.done || m.elapsed < plan.at) continue;
      plan.done = true;
      if (plan.bot.alive && !m.votes.has(plan.bot.id)) {
        m.votes.set(plan.bot.id, plan.target);
      }
    }
    const aliveCount = state.players.filter((q) => q.alive).length;
    if (m.timer <= 0 || m.votes.size >= aliveCount) {
      resolveVotes(m);
    }
  } else {
    m.postTimer -= dt;
    if (m.postTimer <= 0) finishMeeting(m);
  }
}

function appendChatLine(line) {
  const d = document.createElement("div");
  d.className = "chat-line" + (line.sys ? " sys" : "");
  if (line.sys) {
    d.textContent = line.text;
  } else {
    d.innerHTML = `<b style="color:${line.color}">${escapeHtml(line.name)}</b>${escapeHtml(line.text)}`;
  }
  ui.meetingChat.appendChild(d);
  ui.meetingChat.scrollTop = ui.meetingChat.scrollHeight;
}

function resolveVotes(m) {
  if (!m || m.resolved) return;
  m.resolved = true;

  const alive = state.players.filter((q) => q.alive);
  for (const q of alive) {
    if (!m.votes.has(q.id)) m.votes.set(q.id, "skip");
  }
  const counts = new Map();
  for (const target of m.votes.values()) {
    counts.set(target, (counts.get(target) || 0) + 1);
  }
  m.counts = counts;

  let best = null, bestN = 0, tie = false;
  for (const [target, n] of counts) {
    if (n > bestN) { best = target; bestN = n; tie = false; }
    else if (n === bestN) tie = true;
  }

  let ejected = null;
  if (!tie && best !== "skip" && best !== null && bestN > 0) {
    ejected = state.players.find((q) => q.id === best) || null;
    if (ejected && !ejected.alive) ejected = null;
  }
  m.ejected = ejected;

  for (const [target, n] of counts) {
    if (target === "skip") {
      ui.skipVote.textContent = `OYU ATLA · ${n}`;
      ui.skipVote.disabled = true;
      continue;
    }
    const card = ui.meetingGrid.querySelector(`.pcard[data-id="${target}"]`);
    if (card) {
      const s = document.createElement("span");
      s.className = "votecount";
      s.textContent = n;
      card.appendChild(s);
    }
  }
  ui.skipVote.disabled = true;

  if (ejected) {
    ejected.alive = false;
    ejected.ghost = true;
    ejected.path = null;
    ejected.workingTask = null;
  }

  ui.ejectScene.classList.remove("hidden");
  ui.ejectBean.style.display = ejected ? "block" : "none";
  ui.ejectBean.style.setProperty("--c", ejected ? ejected.color : "#3b6fe0");
  ui.ejectTitle.textContent = ejected ? `${ejected.name} uzaya fırlatıldı` : "KİMSE ATILMADI";
  ui.ejectSub.className = "";
  ui.ejectSub.textContent = ejected
    ? "Rolü açıklanıyor..."
    : tie ? "Oylar eşit çıktı. Kimse atılmadı." : "Yeterli oy yok. Kimse atılmadı.";
  m.postTimer = ejected ? 3.6 : 2.4;
  Sound.eject();

  if (ejected) {
    later(() => {
      if (state.meeting !== m) return;
      ui.ejectSub.textContent = ejected.isImpostor ? "HİLECİYDİ!" : "Hileci değildi...";
      ui.ejectSub.className = ejected.isImpostor ? "good" : "bad";
      if (ejected.isImpostor) Sound.win();
    }, 1500);
  } else {
    later(() => {
      if (state.meeting !== m) return;
      ui.ejectSub.textContent = "Görevlere dönün.";
    }, 1400);
  }
}

function finishMeeting(m) {
  if (state.meeting !== m) return;
  state.meeting = null;
  ui.meeting.classList.add("hidden");
  ui.ejectScene.classList.add("hidden");
  if (state.phase !== "meeting") return;

  state.bodies = [];
  respawnAfterMeeting();
  state.phase = "playing";
  state.playerKillCd = state.player && state.player.isImpostor && state.player.alive ? KILL_CD : 0;
  state.playerVentCd = 0;
  for (const p of state.players) {
    p.path = null;
    p.work = 0;
    p.workingTask = null;
    p.taskRef = null;
    p.idle = rand(0.6, 1.8);
    p.reportPend = 0;
    p.reportBody = null;
    p.reportReason = null;
    if (!p.isPlayer) p.killCd = p.isImpostor ? BOT_KILL_CD : 0;
  }
  state.near = { task: null, body: null, victim: null, vent: null, emergency: false };
  updateNear();
  renderTasks();
  refreshHUD(true);
  updateCamera(1);

  const ejected = m.ejected;
  if (ejected && ejected.isImpostor) {
    toast("Hileci uzaya fırlatıldı!", "green");
    endGame("crew", "ejected");
    return;
  }
  if (ejected && ejected.isPlayer) {
    notify("Atıldın! Hayalet olarak görevlerini tamamlamaya devam et.", "cyan");
  }
  if (ejected && !ejected.isPlayer) {
    toast(`${ejected.name} hileci değildi.`, "gold");
  }
  if (!ejected) toast("Kimse atılmadı. Görevlere dön.", "cyan");
  checkWin();
}

function respawnAfterMeeting() {
  const alive = state.players.filter((p) => p.alive);
  const n = Math.max(1, alive.length);
  alive.forEach((p, i) => {
    const a = -Math.PI / 2 + (i / n) * TAU;
    p.x = SPAWN.x + Math.cos(a) * 64;
    p.y = SPAWN.y + Math.sin(a) * 58;
    p.facing = 1;
    p.moving = false;
    p.killCd = p.isImpostor ? BOT_KILL_CD : 0;
  });
  const me = state.player;
  if (me && !me.alive) {
    me.x = SPAWN.x;
    me.y = SPAWN.y;
  }
  state.camera.x = SPAWN.x;
  state.camera.y = SPAWN.y;
}

// ---------------------------------------------------------------- input
const MOVE_CODES = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

window.addEventListener("keydown", (e) => {
  if (e.target === ui.nickname) return;
  const code = e.code;
  if (MOVE_CODES.includes(code)) {
    state.keys.add(code);
    if (state.phase === "playing") e.preventDefault();
  }
  if (code === "Escape") {
    if (!ui.howto.classList.contains("hidden")) { closeHowto(); return; }
    if (state.phase === "playing") { openPause(); return; }
    if (state.phase === "paused") { closePause(); return; }
  }
  if (state.phase === "playing") {
    if (code === "KeyE") { e.preventDefault(); doAction(); }
    if (code === "KeyQ") { e.preventDefault(); playerVent(); }
  }
  if (state.phase === "minigame") {
    if (state.minigame && state.minigame.type === "calibrate" &&
        (code === "Space" || code === "Enter" || code === "KeyE")) {
      e.preventDefault();
      const b = $("#calBtn");
      if (b) b.click();
    }
  }
});
window.addEventListener("keyup", (e) => {
  state.keys.delete(e.code);
});
window.addEventListener("blur", () => state.keys.clear());

document.addEventListener("pointerdown", () => Sound.unlock(), { once: true });

function updateJoy(e) {
  const rect = ui.joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = (e.clientX - cx) / (rect.width * 0.34);
  let dy = (e.clientY - cy) / (rect.height * 0.34);
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  state.joy.dx = dx;
  state.joy.dy = dy;
  ui.joyKnob.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
}
ui.joystick.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  state.joy.active = true;
  state.joy.id = e.pointerId;
  ui.joystick.setPointerCapture(e.pointerId);
  updateJoy(e);
});
ui.joystick.addEventListener("pointermove", (e) => {
  if (state.joy.active && e.pointerId === state.joy.id) updateJoy(e);
});
function endJoy() {
  if (!state.joy.active) return;
  state.joy.active = false;
  state.joy.id = null;
  state.joy.dx = 0;
  state.joy.dy = 0;
  ui.joyKnob.style.transform = "translate(0,0)";
}
ui.joystick.addEventListener("pointerup", endJoy);
ui.joystick.addEventListener("pointercancel", endJoy);

// ---------------------------------------------------------------- buttons
ui.playBtn.addEventListener("click", () => {
  Sound.unlock();
  newGame();
});
ui.howtoBtn.addEventListener("click", openHowto);
ui.howtoClose.addEventListener("click", closeHowto);
ui.howtoPlay.addEventListener("click", () => { closeHowto(); newGame(); });
ui.roleStart.addEventListener("click", () => { Sound.unlock(); beginPlay(); });
ui.mgClose.addEventListener("click", () => { Sound.click(); closeMinigame(); });
ui.skipVote.addEventListener("click", () => castPlayerVote("skip"));
ui.killBtn.addEventListener("click", () => { if (state.near.victim) playerKill(state.near.victim); });
ui.ventBtn.addEventListener("click", playerVent);
ui.useBtn.addEventListener("click", doAction);
ui.soundBtn.addEventListener("click", () => {
  const muted = Sound.toggle();
  refreshSoundBtn();
  toast(muted ? "Ses kapatıldı." : "Ses açıldı.", muted ? "red" : "cyan");
});
ui.pauseBtn.addEventListener("click", openPause);
ui.resumeBtn.addEventListener("click", closePause);
ui.pauseRestartBtn.addEventListener("click", () => { ui.pause.classList.add("hidden"); restartGame(); });
ui.pauseMenuBtn.addEventListener("click", goMenu);
ui.againBtn.addEventListener("click", restartGame);
ui.endMenuBtn.addEventListener("click", goMenu);
ui.nickname.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    Sound.unlock();
    newGame();
  }
});
ui.nickname.addEventListener("input", () => {
  if (ui.nickname.value.length > 12) ui.nickname.value = ui.nickname.value.slice(0, 12);
});

function refreshSoundBtn() {
  ui.soundBtn.classList.toggle("off", Sound.muted);
  ui.soundBtn.title = Sound.muted ? "Sesi aç" : "Sesi kapat";
}

// ---------------------------------------------------------------- main loop
let lastFrame = performance.now();

function update(dt) {
  state.shake = Math.max(0, state.shake - dt * 26);
  if (state.phase === "playing") {
    state.gameTime += dt;
    state.playerKillCd = Math.max(0, state.playerKillCd - dt);
    state.playerVentCd = Math.max(0, state.playerVentCd - dt);
    updatePlayer(dt);
    updateCamera(dt);
    for (const p of state.players) {
      if (p.isPlayer || !p.alive) continue;
      if (p.isImpostor) updateImpostorBot(p, dt);
      else updateCrewBot(p, dt);
      if (state.phase !== "playing") break;
    }
    updateNear();
    refreshHUD();
    state.winTick = (state.winTick || 0) + dt;
    if (state.winTick > 0.4) {
      state.winTick = 0;
      checkWin();
    }
  } else if (state.phase === "meeting") {
    updateMeeting(dt);
    updateCamera(dt);
  }
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  try { update(dt); } catch (err) { console.error(err); }
  const t = now / 1000;
  drawSpaceBackground(t);
  if (state.gameVisible) {
    try { renderGame(t); } catch (err) { console.error(err); }
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- init
loadPrefs();
buildColorRow();
refreshSoundBtn();
drawMap();
buildGrid();
requestAnimationFrame(frame);

// expose a tiny bit for debugging / tinkering
window.AMONGSUS = { state, COLORS, VENTS, TASK_DEFS };





})();
