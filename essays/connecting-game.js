// "Keep perfecting the art of connecting": a single-player version of the final game of the 2019
// Champalimaud Research retreat, true to the original design: a 10 x 10 grid; 25 controllers each drive four
// mirrored cells and tilt up (cipher glyphs), left (letters) or right (numbers). The game is solved when every
// controller under the sentence shows letters and every other one does not; then the grid disappears.
(function () {
  "use strict";

  // ?embed: the game sits in an iframe inside the essay; the page chrome is hidden and the height is reported up
  var EMBED = /[?&]embed\b/.test(location.search);
  if (EMBED) {
    document.documentElement.classList.add("embed");
    var reportHeight = function () {
      var wrap = document.querySelector(".wrap");
      if (wrap && parent !== window) parent.postMessage({ connectingGameHeight: Math.ceil(wrap.getBoundingClientRect().height) }, "*");
    };
    addEventListener("load", function () {
      reportHeight();
      if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector(".wrap"));
    });
  }

  // ---------------- cipher ----------------
  // Glyphs are a square frame with up to five inner blocks. Arms encode a hex digit (top 1, right 2, bottom 4,
  // left 8); the centre block is filled whenever an arm is (as in the original hex sheet), or alone for "a".
  var T = 1, R = 2, B = 4, L = 8, C = 16;
  var LETTER_CODE = {
    o: 0, a: C,
    e: C | 1, c: C | 2, h: C | 3, l: C | 4, m: C | 5, n: C | 6, g: C | 7,
    p: C | 8, r: C | 9, s: C | 10, t: C | 11, u: C | 12, d: C | 13, y: C | 14, x: C | 15,
    // arms without the centre: reconstructed assignments for the letters the key photo does not resolve
    q: R, w: T | R, k: T | B, v: R | B, j: T | L, i: R | L, f: B | L, z: R | B | L, b: T | R | B | L
  };

  // ---------------- board ----------------
  var LETTERS = [
    "AWAKEEPOST",
    "YHMARVELAT",
    "PERFECTING",
    "ARANOWHERE",
    "SEITHEREKN",
    "TWNPARTIME",
    "SECRETINOS",
    "CALMOFFLIN",
    "EMEMBERXYZ",
    "CONNECTING"
  ];
  var SENTENCE = { 0: [3, 4, 5, 6], 2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4: [3, 4, 5], 5: [4, 5, 6], 7: [4, 5], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] };
  var LINES = ["KEEP", "PERFECTING", "THE", "ART", "OF", "CONNECTING"];
  var UP = 0, LEFT = 1, RIGHT = 2;
  var STATE_NAME = ["glyphs", "letters", "numbers"];

  // As on the night: controller (i, j) of a 5 x 5 block drives four mirrored cells, (i, j), (i, 9 - j), (9 - i, j)
  // and (9 - i, 9 - j). Every controller tilts the same way: up shows glyphs, left letters, right numbers.
  function groupOf(r, c) { return (r < 5 ? r : 9 - r) * 5 + (c < 5 ? c : 9 - c); }
  function inSentence(r, c) { return (SENTENCE[r] || []).indexOf(c) >= 0; }

  // each cell has a fixed letter (the sketched letter grid), its cipher glyph, and a number
  function sym(k, v) { return { k: k, v: v }; }
  var cells = [];
  for (var r = 0; r < 10; r++) {
    for (var c = 0; c < 10; c++) {
      cells.push({ r: r, c: c, g: groupOf(r, c), letter: LETTERS[r][c], number: (r * 10 + c) % 16,
                   target: inSentence(r, c), changed: -1, prev: null });
    }
  }
  var letterGroup = [];
  for (var g = 0; g < 25; g++) letterGroup.push(cells.some(function (cl) { return cl.g === g && cl.target; }));

  // state[g] is how controller g is tilted: 0 up (glyphs), 1 left (letters), 2 right (numbers)
  var state = new Array(25), solved = false, solvedAt = 0, startedAt = 0, selected = 0;
  function look(cl) { var k = state[cl.g]; return sym(k, k === RIGHT ? cl.number : cl.letter); }
  function touches(cl, g) { return cl.g === g; }
  // solved: every controller under the sentence shows letters and every other one does not
  function isSolved() {
    for (var g = 0; g < 25; g++) if ((state[g] === LEFT) !== letterGroup[g]) return false;
    return true;
  }
  function shuffle() {
    do { for (var g = 0; g < 25; g++) state[g] = Math.floor(Math.random() * 3); } while (isSolved());
    cells.forEach(function (cl) { cl.changed = -1; cl.prev = null; });
    solved = false; startedAt = performance.now(); document.body.classList.remove("solved");
  }

  // ---------------- glyph drawing ----------------
  function glyphPath(ctx, x, y, s, code) {
    var u = s / 5;   // frame and blocks on a 5 x 5 lattice, as in the 60-unit original (12-unit modules)
    ctx.beginPath();
    ctx.rect(x, y, s, s);
    ctx.rect(x + s - u, y + u, -(s - 2 * u), s - 2 * u);   // counter-clockwise inner hole
    var blocks = [];
    if (code & C) blocks.push([2, 2]);
    if (code & T) blocks.push([2, 1]);
    if (code & R) blocks.push([3, 2]);
    if (code & B) blocks.push([2, 3]);
    if (code & L) blocks.push([1, 2]);
    blocks.forEach(function (b) { ctx.rect(x + b[0] * u, y + b[1] * u, u, u); });
    ctx.fill("evenodd");
  }
  function glyphSVG(code, size) {
    var parts = ['<path d="M0 0H5V5H0ZM1 1V4H4V1Z" fill-rule="evenodd"/>'], m = [[C, 2, 2], [T, 2, 1], [R, 3, 2], [B, 2, 3], [L, 1, 2]];
    m.forEach(function (b) { if (code & b[0]) parts.push('<rect x="' + b[1] + '" y="' + b[2] + '" width="1" height="1"/>'); });
    return '<svg viewBox="0 0 5 5" width="' + size + '" height="' + size + '" fill="currentColor" aria-hidden="true">' + parts.join("") + "</svg>";
  }

  // ---------------- cartoon rendering ----------------
  // Like cel animation "line boil": every tile, glyph, letter and number exists as BOIL separate hand-made drawings
  // (freehand outlines with varying weight and overshooting corners, re-lettered characters, each drawing warped
  // differently). The whole board swaps drawings together a few times a second.
  var canvas = document.getElementById("board"), ctx = canvas.getContext("2d");
  var hover = -1, showLinks = false;
  var HOLD_MS = 1200;   // the solved board stays briefly, then everything but the sentence disappears
  var BOIL = 4, BOIL_MS = 100, STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PAL = { chalk: "#fff3e4", wash: ["rgba(255,250,240,0.10)", "rgba(255,226,205,0.32)", "rgba(110,40,150,0.42)"],
              target: "#fff3e4", targetInk: "#7a2a6e", select: "#ffd23f", link: "rgba(255,210,63,0.35)" };
  function boilTick(now) { return STILL ? 0 : Math.floor(now / BOIL_MS) % BOIL; }

  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function blank(S) { var c = document.createElement("canvas"); c.width = c.height = S; return c; }

  // a rectangle traced by hand: each side split into segments, every vertex nudged
  function roughPoints(x, y, w, h, a, rnd) {
    var pts = [], n = 3, i;
    for (i = 0; i < n; i++) pts.push([x + w * i / n, y]);
    for (i = 0; i < n; i++) pts.push([x + w, y + h * i / n]);
    for (i = 0; i < n; i++) pts.push([x + w - w * i / n, y + h]);
    for (i = 0; i < n; i++) pts.push([x, y + h - h * i / n]);
    return pts.map(function (p) { return [p[0] + (rnd() - 0.5) * 2 * a, p[1] + (rnd() - 0.5) * 2 * a]; });
  }
  function roughRect(c, x, y, w, h, a, rnd) {
    roughPoints(x, y, w, h, a, rnd).forEach(function (p, k) { if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
    c.closePath();
  }
  // freehand outline: segment by segment with changing pen pressure, overshooting the corners a little
  function sketchRect(c, x, y, w, h, a, lw, rnd) {
    var pts = roughPoints(x, y, w, h, a, rnd);
    c.lineCap = "round";
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dy = q[1] - p[1], o = 0.06 + rnd() * 0.1;
      c.beginPath();
      c.moveTo(p[0] - dx * o, p[1] - dy * o);
      c.quadraticCurveTo((p[0] + q[0]) / 2 + (rnd() - 0.5) * a, (p[1] + q[1]) / 2 + (rnd() - 0.5) * a, q[0] + dx * o * 0.5, q[1] + dy * o * 0.5);
      c.lineWidth = lw * (0.6 + rnd() * 0.8);
      c.stroke();
    }
  }
  // a wobbly displacement so every drawing of the same character has a slightly different shape
  function warp(src, S, rnd) {
    var amp = S * 0.016, f1 = (1.5 + rnd() * 2) * 2 * Math.PI / S, f2 = (1.5 + rnd() * 2) * 2 * Math.PI / S, p1 = rnd() * 6.3, p2 = rnd() * 6.3;
    var mid = blank(S), out = blank(S), m = mid.getContext("2d"), o = out.getContext("2d"), step = Math.max(1, Math.round(S / 60));
    for (var y = 0; y < S; y += step) m.drawImage(src, 0, y, S, step, amp * Math.sin(y * f1 + p1), y, S, step);
    for (var x = 0; x < S; x += step) o.drawImage(mid, x, 0, step, S, x, amp * Math.sin(x * f2 + p2), step, S);
    return out;
  }

  function drawGlyph(c, S, code, ink, rnd) {
    var inner = S * 0.56, x = (S - inner) / 2, y = x, u = inner / 5, a = S * 0.02;
    c.strokeStyle = c.fillStyle = ink;
    // the frame as a painted ring with a thin freehand line over it, the blocks as roughly painted squares
    c.beginPath(); roughRect(c, x, y, inner, inner, a * 0.6, rnd); roughRect(c, x + u, y + u, inner - 2 * u, inner - 2 * u, a * 0.6, rnd); c.fill("evenodd");
    c.globalAlpha = 0.6; sketchRect(c, x - u * 0.15, y - u * 0.15, inner + u * 0.3, inner + u * 0.3, a, u * 0.22, rnd); c.globalAlpha = 1;
    [[C, 2, 2], [T, 2, 1], [R, 3, 2], [B, 2, 3], [L, 1, 2]].forEach(function (b) {
      if (code & b[0]) { c.beginPath(); roughRect(c, x + b[1] * u, y + b[2] * u, u, u, a * 0.7, rnd); c.fill(); }
    });
  }
  function drawText(c, S, text, ink, rnd) {
    var font = "'Patrick Hand', 'Comic Sans MS', cursive", size = S * (text.length > 1 ? 0.5 : 0.66), chars = text.split("");
    c.fillStyle = c.strokeStyle = ink; c.textAlign = "center"; c.textBaseline = "middle";
    // each character re-lettered: its own tilt, size and position, plus a thin second pass of the pen
    var widthEach = size * 0.52, x0 = S / 2 - widthEach * (chars.length - 1) / 2;
    chars.forEach(function (ch, i) {
      c.save();
      c.translate(x0 + i * widthEach + (rnd() - 0.5) * S * 0.05, S / 2 + S * 0.05 + (rnd() - 0.5) * S * 0.05);
      c.rotate((rnd() - 0.5) * 0.2);
      var k = 0.88 + rnd() * 0.24; c.scale(k * (0.92 + rnd() * 0.16), k);
      c.font = size + "px " + font;
      c.fillText(ch, 0, 0);
      c.lineWidth = S * 0.012; c.globalAlpha = 0.55; c.strokeText(ch, (rnd() - 0.5) * S * 0.02, (rnd() - 0.5) * S * 0.02);
      c.restore(); c.globalAlpha = 1;
    });
  }

  // sprites: "<kind>:<value>:<target>" -> BOIL drawings at the current cell size
  var cache = {}, cacheSize = 0, rings = [];
  function sprite(look, isTarget, variant) {
    var kind = look.k, value = look.v;
    var key = kind + ":" + value + ":" + (isTarget ? 1 : 0), list = cache[key];
    if (!list) {
      list = cache[key] = [];
      var base = (kind + 1) * 1000 + (typeof value === "string" ? value.charCodeAt(0) : value) * 31 + (isTarget ? 7 : 0);
      for (var v = 0; v < BOIL; v++) {
        var S = cacheSize, rnd = rng(base * 97 + v * 7919), tile = blank(S), t = tile.getContext("2d"), pad = S * 0.07;
        // tile: a translucent wash and a freehand chalk outline
        t.beginPath(); roughRect(t, pad, pad, S - 2 * pad, S - 2 * pad, S * 0.025, rnd);
        t.fillStyle = isTarget ? PAL.target : PAL.wash[kind]; t.fill();
        t.strokeStyle = PAL.chalk; t.globalAlpha = 0.9;
        sketchRect(t, pad, pad, S - 2 * pad, S - 2 * pad, S * 0.03, S * 0.045, rnd);
        t.globalAlpha = 0.4; sketchRect(t, pad, pad, S - 2 * pad, S - 2 * pad, S * 0.035, S * 0.02, rnd);
        t.globalAlpha = 1;
        // content drawn on its own layer, then warped differently for each drawing
        var layer = blank(S), lc = layer.getContext("2d"), ink = isTarget ? PAL.targetInk : PAL.chalk;
        if (kind === UP) drawGlyph(lc, S, LETTER_CODE[value.toLowerCase()], ink, rnd); else drawText(lc, S, String(value), ink, rnd);
        t.drawImage(warp(layer, S, rnd), 0, 0);
        list.push(tile);
      }
    }
    return list[variant];
  }
  function ring(variant) {
    if (rings.length !== BOIL || rings[0].width !== cacheSize) {
      rings = [];
      for (var v = 0; v < BOIL; v++) {
        var S = cacheSize, off = blank(S), c = off.getContext("2d"), rnd = rng(4242 + v * 17);
        c.strokeStyle = PAL.select;
        sketchRect(c, S * 0.03, S * 0.03, S * 0.94, S * 0.94, S * 0.04, S * 0.07, rnd);
        rings.push(off);
      }
    }
    return rings[variant];
  }

  function render(now) {
    var dpr = Math.min(devicePixelRatio || 1, 2), W = canvas.clientWidth;
    if (canvas.width !== Math.round(W * dpr)) { canvas.width = canvas.height = Math.round(W * dpr); }
    var gap = W * 0.004, s = (W - gap * 11) / 10, S = Math.round(s * dpr);
    if (S !== cacheSize) { cacheSize = S; cache = {}; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    var v = boilTick(now), reveal = solved ? Math.max(0, Math.min(1, (now - solvedAt - HOLD_MS) / 1600)) : 0;

    cells.forEach(function (cl) {
      var x = gap + cl.c * (s + gap), y = gap + cl.r * (s + gap);
      var fade = solved && !cl.target ? 1 - reveal : 1;
      if (fade <= 0) return;
      var p = cl.changed < 0 ? 1 : Math.min(1, (now - cl.changed) / 240), shown = p < 0.5 && cl.prev ? cl.prev : look(cl);
      ctx.globalAlpha = fade;
      ctx.save();
      if (p < 1) { ctx.translate(x + s / 2, y + s / 2); ctx.scale(1, Math.abs(1 - 2 * p) * 0.9 + 0.1); ctx.translate(-x - s / 2, -y - s / 2); }
      ctx.drawImage(sprite(shown, solved && cl.target, v), x, y, s, s);
      ctx.restore();
      if (showLinks && hover >= 0 && touches(cl, hover)) { ctx.globalAlpha = fade; ctx.fillStyle = PAL.link; ctx.fillRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8); }
      if (touches(cl, selected) && !solved) { ctx.globalAlpha = 1; ctx.drawImage(ring(v), x, y, s, s); }
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(render);
  }
  // redraw once the hand-lettering font has loaded
  if (document.fonts && document.fonts.load) document.fonts.load("40px 'Patrick Hand'").then(function () { cache = {}; boilTexts.forEach(function (b) { b.build(); }); });

  // ---------------- boiling hand-lettered text (title, closing words) ----------------
  var boilTexts = [];
  function boilText(el, lines, opt) {
    var cv = document.createElement("canvas"), c = cv.getContext("2d"), frames = [], last = -1;
    cv.setAttribute("aria-hidden", "true"); el.appendChild(cv);
    function build() {
      var dpr = Math.min(devicePixelRatio || 1, 2), W = el.clientWidth;
      if (!W) { frames = []; setTimeout(build, 200); return; }   // not laid out yet (hidden): try again shortly
      var size = opt.size(W), lh = size * (opt.lineHeight || 1.25);
      var L = typeof lines === "function" ? lines(W) : lines;   // lines may depend on the available width
      var H = Math.ceil(lh * L.length + size * 0.4);
      cv.style.width = W + "px"; cv.style.height = H + "px"; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      frames = [];
      for (var v = 0; v < BOIL; v++) {
        var f = document.createElement("canvas"); f.width = cv.width; f.height = cv.height;
        var fc = f.getContext("2d"), rnd = rng(opt.seed + v * 131);
        fc.scale(dpr, dpr); fc.textBaseline = "middle";
        L.forEach(function (line, li) {
          var x = opt.indent ? opt.indent(li, W, size) : 0, y = size * 0.6 + li * lh;
          fc.fillStyle = opt.color(li);
          line.split("").forEach(function (ch) {
            fc.font = size + "px 'Patrick Hand', 'Comic Sans MS', cursive";
            var w = fc.measureText(ch).width + (opt.tracking || 0) * size;
            fc.save(); fc.translate(x + (rnd() - 0.5) * size * 0.06, y + (rnd() - 0.5) * size * 0.08); fc.rotate((rnd() - 0.5) * 0.16);
            fc.fillText(ch, 0, 0); fc.restore();
            x += w;
          });
        });
        frames.push(f);
      }
      last = -1;
    }
    var box = { build: build, el: el };
    boilTexts.push(box);
    build();
    (function loop(now) {
      var v = boilTick(now);
      if (v !== last && frames.length && cv.width && cv.height) { c.clearRect(0, 0, cv.width, cv.height); c.drawImage(frames[v], 0, 0); last = v; }
      requestAnimationFrame(loop);
    })(0);
    return box;
  }
  if (!EMBED) boilText(document.getElementById("title"),
           function (W) { return W < 560 ? ["Keep perfecting the art", "of connecting"] : ["Keep perfecting the art of connecting"]; },
           { seed: 9, lineHeight: 1.1, size: function (W) { return W < 560 ? Math.min(32, W / 9) : Math.min(34, W / 13); }, color: function () { return "#fff3e4"; } });
  var resizeTimer = 0;
  addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { boilTexts.forEach(function (b) { b.build(); }); }, 200); });

  // ---------------- painted background ----------------
  // Thick red, orange, magenta and purple brush strokes, like the projection on the night. Each of the BOIL
  // drawings repaints every stroke a little differently.
  var bg = document.getElementById("paint"), bctx = bg.getContext("2d"), bgVariants = [], lastBg = -1;
  var STROKES = [];
  (function () {
    var r = rng(2019), cols = ["#e8473a", "#f26b3a", "#f59a48", "#d23a6a", "#a8358a", "#7a2f9a", "#5a2a86", "#ef5c4a"];
    for (var i = 0; i < 52; i++) {
      STROKES.push({ x: r(), y: r(), len: 0.25 + r() * 0.45, ang: -0.6 + r() * 0.6 + (r() < 0.3 ? 1.3 : 0),
                     w: 0.06 + r() * 0.12, col: cols[Math.floor(r() * cols.length)], a: 0.45 + r() * 0.35, bend: (r() - 0.5) * 0.5 });
    }
  })();
  function paperNoise() {
    var n = document.createElement("canvas"); n.width = n.height = 180;
    var c = n.getContext("2d"), img = c.createImageData(180, 180);
    for (var i = 0; i < img.data.length; i += 4) { var v = 140 + Math.random() * 115; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    c.putImageData(img, 0, 0);
    return n;
  }
  var NOISE = paperNoise();
  function paintBackground(Wb, Hb, variant) {
    var off = document.createElement("canvas"); off.width = Wb; off.height = Hb;
    var c = off.getContext("2d"), rnd = rng(77 + variant * 1009), M = Math.max(Wb, Hb), m = Math.min(Wb, Hb);
    var g = c.createLinearGradient(0, 0, Wb, Hb); g.addColorStop(0, "#c8403a"); g.addColorStop(0.55, "#b03a5a"); g.addColorStop(1, "#5e2a7e");
    c.fillStyle = g; c.fillRect(0, 0, Wb, Hb);
    c.lineCap = "round";
    STROKES.forEach(function (st) {
      // each drawing moves, turns and bends the stroke noticeably, like a background repainted per frame
      var cx = st.x * Wb + (rnd() - 0.5) * m * 0.035, cy = st.y * Hb + (rnd() - 0.5) * m * 0.035;
      var Lh = st.len * M / 2 * (0.93 + rnd() * 0.14), ang = st.ang + (rnd() - 0.5) * 0.09, w = st.w * m * 1.6, bend = st.bend + (rnd() - 0.5) * 0.15;
      var dx = Math.cos(ang) * Lh, dy = Math.sin(ang) * Lh, nx = -Math.sin(ang), ny = Math.cos(ang), n = 10;
      for (var k = 0; k < n; k++) {
        var t = k / (n - 1) - 0.5, o = t * w;
        c.beginPath();
        c.moveTo(cx - dx * (0.85 + rnd() * 0.15) + nx * o, cy - dy * (0.85 + rnd() * 0.15) + ny * o);
        c.quadraticCurveTo(cx + nx * (o + bend * Lh), cy + ny * (o + bend * Lh), cx + dx * (0.85 + rnd() * 0.15) + nx * o, cy + dy * (0.85 + rnd() * 0.15) + ny * o);
        c.strokeStyle = st.col; c.lineWidth = w / n * 2;
        c.globalAlpha = st.a * (0.4 + rnd() * 0.6) * (1 - Math.abs(t) * 0.85);
        c.stroke();
      }
    });
    c.globalAlpha = 0.18; c.globalCompositeOperation = "overlay";
    c.fillStyle = c.createPattern(NOISE, "repeat"); c.fillRect(0, 0, Wb, Hb);
    return off;
  }
  function buildBg() {
    var scale = Math.min(devicePixelRatio || 1, 2) * 0.6;
    bg.width = Math.round(innerWidth * scale); bg.height = Math.round(innerHeight * scale);
    bgVariants = [];
    if (!bg.width || !bg.height) { setTimeout(buildBg, 200); return; }   // frame not laid out yet: try again shortly
    for (var v = 0; v < BOIL; v++) bgVariants.push(paintBackground(bg.width, bg.height, v));
    lastBg = -1;
  }
  var bgTimer = 0;
  addEventListener("resize", function () { clearTimeout(bgTimer); bgTimer = setTimeout(buildBg, 200); });
  buildBg();
  (function bgLoop(now) {
    var v = boilTick(now);
    if (v !== lastBg && bgVariants.length) { bctx.drawImage(bgVariants[v], 0, 0); lastBg = v; }
    requestAnimationFrame(bgLoop);
  })(0);

  // ---------------- controllers ----------------
  var pad = document.getElementById("pad"), buttons = [];
  var ARROWS = ["↑", "←", "→"];
  for (var k = 0; k < 25; k++) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "ctl"; b.dataset.g = k;
    b.innerHTML = '<span class="num">' + (k + 1) + '</span><span class="tilt"></span>';
    pad.appendChild(b); buttons.push(b);
  }
  function syncPad() {
    buttons.forEach(function (b, g) {
      b.querySelector(".tilt").textContent = ARROWS[state[g]];
      b.classList.toggle("sel", g === selected);
      b.dataset.state = STATE_NAME[state[g]];
      b.setAttribute("aria-label", "Controller " + (g + 1) + ", tilted " + ["up: glyphs", "left: letters", "right: numbers"][state[g]]);
    });
  }
  function tilt(g, s) {
    if (solved || state[g] === s) return;
    var now = performance.now();
    cells.forEach(function (cl) { if (touches(cl, g)) { cl.prev = look(cl); cl.changed = now; } });
    state[g] = s;
    syncPad();
    if (isSolved()) { solved = true; solvedAt = performance.now(); setTimeout(showReveal, HOLD_MS + 1700); }
  }
  pad.addEventListener("click", function (e) {
    var b = e.target.closest(".ctl"); if (!b) return;
    var g = +b.dataset.g; selected = g;
    tilt(g, e.shiftKey ? (state[g] + 2) % 3 : (state[g] + 1) % 3);
    syncPad();
  });
  pad.addEventListener("focusin", function (e) { var b = e.target.closest(".ctl"); if (b) { selected = +b.dataset.g; syncPad(); } });
  pad.addEventListener("mouseover", function (e) { var b = e.target.closest(".ctl"); hover = b ? +b.dataset.g : -1; });
  pad.addEventListener("mouseleave", function () { hover = -1; });
  document.addEventListener("keydown", function (e) {
    if (document.querySelector("dialog[open]")) return;
    var map = { ArrowUp: UP, ArrowLeft: LEFT, ArrowRight: RIGHT, w: UP, a: LEFT, d: RIGHT };
    if (e.key in map && pad.contains(document.activeElement)) { e.preventDefault(); tilt(selected, map[e.key]); }
  });

  // phone tilt drives the selected controller
  var tiltBtn = document.getElementById("use-tilt");
  if (window.DeviceOrientationEvent && "ontouchstart" in window) {
    tiltBtn.hidden = false;
    tiltBtn.addEventListener("click", function () {
      var start = function () {
        tiltBtn.textContent = "Tilt on";
        addEventListener("deviceorientation", function (e) {
          var gm = e.gamma || 0;
          if (gm < -25) tilt(selected, LEFT); else if (gm > 25) tilt(selected, RIGHT); else if (Math.abs(gm) < 10) tilt(selected, UP);
        });
      };
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then(function (p) { if (p === "granted") start(); }).catch(function () {});
      } else start();
    });
  }

  document.getElementById("links").addEventListener("change", function (e) { showLinks = e.target.checked; });
  document.getElementById("restart").addEventListener("click", function () { shuffle(); syncPad(); closeReveal(); });

  // ---------------- clue, key, timer, prompts ----------------
  var clue = document.getElementById("clue-glyphs");
  clue.innerHTML = "keep perfecting the art of connecting".split(" ").map(function (w) {
    return '<span class="word">' + w.split("").map(function (ch) { return glyphSVG(LETTER_CODE[ch], 22); }).join("") + "</span>";
  }).join("");
  document.getElementById("key-grid").innerHTML = "abcdefghijklmnopqrstuvwxyz".split("").map(function (ch) {
    return "<span>" + glyphSVG(LETTER_CODE[ch], 26) + "<b>" + ch + "</b></span>";
  }).join("");
  document.querySelectorAll("[data-open]").forEach(function (btn) {
    btn.addEventListener("click", function () { document.getElementById(btn.dataset.open).showModal(); });
  });
  document.querySelectorAll("dialog").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  var timer = document.getElementById("timer"), DURATION = 30 * 60 * 1000;
  setInterval(function () {
    if (solved) return;
    var left = DURATION - (performance.now() - startedAt), m, s;
    if (left <= 0) { timer.textContent = "00:00"; timer.classList.add("over"); return; }
    m = Math.floor(left / 60000); s = Math.floor(left / 1000) % 60;
    timer.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    timer.classList.remove("over");
  }, 250);

  var PROMPTS = window.CONNECTING_PROMPTS || [], promptEl = document.getElementById("prompt"), pi = 0;
  function nextPrompt() {
    if (!PROMPTS.length) return;
    promptEl.classList.remove("in");
    setTimeout(function () { promptEl.textContent = PROMPTS[pi++ % PROMPTS.length]; promptEl.classList.add("in"); }, 400);
  }
  for (var i = PROMPTS.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = PROMPTS[i]; PROMPTS[i] = PROMPTS[j]; PROMPTS[j] = t; }
  nextPrompt(); setInterval(nextPrompt, 18000);

  // ---------------- reveal ----------------
  var revealEl = document.getElementById("reveal"), revealPending = false;
  function showReveal() {
    var secs = Math.round((solvedAt - startedAt) / 1000);
    var holder = document.getElementById("reveal-lines");
    holder.setAttribute("aria-label", LINES.join(" "));
    var INDENT = [0, 1.2, 3.4, 4.6, 4.0, 1.2];
    revealPending = !holder.querySelector("canvas");   // build the boiling closing words once, reuse on replay
    document.getElementById("reveal-time").textContent = "Decoded in " + Math.floor(secs / 60) + " min " + (secs % 60) + " s. Nobody won the game. Everybody did.";
    document.body.classList.add("solved");
    revealEl.hidden = false;
    if (revealPending) {
      revealPending = false;
      boilText(holder, LINES, { seed: 2019, lineHeight: 1.35, tracking: 0.28,
        size: function (W) { return Math.min(64, W / 9.5); },
        indent: function (li, W, size) { return INDENT[li] * size * 0.9; },
        color: function (li) { return li % 2 ? "#fff3e4" : "#ffd23f"; } });
    }
  }
  function closeReveal() { revealEl.hidden = true; document.body.classList.remove("solved"); }
  document.getElementById("again").addEventListener("click", function () { shuffle(); syncPad(); closeReveal(); });

  // test hook: window.__connecting.solve() fills in the solution
  window.__connecting = { solve: function () {
                            for (var g = 0; g < 25; g++) tilt(g, letterGroup[g] ? LEFT : (state[g] === LEFT ? RIGHT : state[g])); },
                          letterGroups: letterGroup.filter(Boolean).length };

  shuffle(); syncPad();
  requestAnimationFrame(render);
})();
