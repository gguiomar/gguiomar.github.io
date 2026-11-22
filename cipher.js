// Decryption-grid band for "Keep perfecting the art of connecting": a 10-wide grid whose cells flicker between
// cipher glyphs, letters and digits and gradually settle into the sentence, then scramble and start again.
// Reconstructed from photos of the 2019 game; the glyph shapes are stand-ins for the original cipher.
(function () {
  var canvas = document.querySelector('canvas[data-visual="cipher"]');
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var ROWS = ["   KEEP   ", "PERFECTING", "THE ART OF", "CONNECTING"];
  var R = ROWS.length, C = ROWS[0].length;
  var LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", DIGITS = "0123456789";
  var PERIOD = 16;   // seconds per cycle: scramble, settle, hold

  var seed = 11;
  function rnd() { return (seed = (seed * 16807) % 2147483647) / 2147483647; }
  function glyphMask() { var m = 0; while (!m) m = Math.floor(rnd() * 511) & 0x1ff; return m; }

  var cells = [];
  for (var r = 0; r < R; r++) {
    for (var c = 0; c < C; c++) {
      var target = ROWS[r][c];
      cells.push({ r: r, c: c, target: target, blank: target === " ", lock: 0.08 + rnd() * 0.62,
                   kind: 0, ch: "", mask: glyphMask(), restMask: glyphMask(), next: 0 });
    }
  }
  function randomize(cell) {
    cell.kind = Math.floor(rnd() * 3);   // 0 glyph, 1 letter, 2 digit (the three controller states)
    cell.ch = cell.kind === 1 ? LETTERS[Math.floor(rnd() * 26)] : DIGITS[Math.floor(rnd() * 10)];
    cell.mask = glyphMask();
  }
  cells.forEach(randomize);

  var C_;
  function readTheme() {
    function css(n) { var v = cssColor(n); return "rgb(" + v.map(function (x) { return Math.round(x * 255); }).join(",") + ")"; }
    C_ = { text: css("--text"), muted: css("--muted"), faint: css("--faint"), line: css("--line"), accent: css("--ochre") };
  }
  readTheme();
  addEventListener("themechange", readTheme);

  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function drawGlyph(x, y, s, mask, color) {
    var p = s * 0.2, g = (s - 2 * p) / 3;
    ctx.fillStyle = color;
    for (var i = 0; i < 9; i++) {
      if (mask >> i & 1) ctx.fillRect(x + p + (i % 3) * g + g * 0.12, y + p + Math.floor(i / 3) * g + g * 0.12, g * 0.76, g * 0.76);
    }
  }

  runVisual(canvas, function (t) {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var W = canvas.width / dpr, H = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);

    var u = (t % PERIOD) / PERIOD;
    var progress = u < 0.82 ? smooth((u - 0.06) / 0.62) : 1 - smooth((u - 0.88) / 0.1);
    var gap = 0.14, size = Math.min(H * 0.86 / (R + (R - 1) * gap), W * 0.92 / (C + (C - 1) * gap));
    var step = size * (1 + gap), x0 = (W - (C * step - size * gap)) / 2, y0 = (H - (R * step - size * gap)) / 2;
    ctx.lineWidth = Math.max(1, size * 0.045);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "500 " + Math.round(size * 0.56) + "px 'IBM Plex Mono', monospace";

    cells.forEach(function (cell) {
      var x = x0 + cell.c * step, y = y0 + cell.r * step, settled = progress > cell.lock;
      if (!settled && t > cell.next) { randomize(cell); cell.next = t + 0.25 + rnd() * 0.9; }
      ctx.strokeStyle = settled && !cell.blank ? C_.muted : C_.line;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      if (settled) {
        if (cell.blank) drawGlyph(x, y, size, cell.restMask, C_.line);
        else { ctx.fillStyle = C_.text; ctx.fillText(cell.target, x + size / 2, y + size / 2 + size * 0.03); }
      } else if (cell.kind === 0) {
        drawGlyph(x, y, size, cell.mask, C_.faint);
      } else {
        ctx.fillStyle = C_.faint; ctx.fillText(cell.ch, x + size / 2, y + size / 2 + size * 0.03);
      }
    });
  });
})();
