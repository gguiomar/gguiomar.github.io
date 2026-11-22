// Team-merging diagram for "Keep perfecting the art of connecting". About 200 people in three clusters start in
// teams of three; after every round teams merge by rank (first with last, second with second-to-last, ...), so
// sizes double (3, 6, 12, ...) and the clusters mix, until a single group remains. Colors follow the CSS theme.
(function () {
  var canvas = document.querySelector('canvas[data-visual="merge"]');
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var N = 192, CLUSTERS = 3, HOLD = 1.6, MOVE = 1.3, END_HOLD = 3.2;
  var seed = 7;
  function rnd() { return (seed = (seed * 16807) % 2147483647) / 2147483647; }

  // people sorted by cluster, so the first teams of three are homogeneous
  var cluster = [];
  for (var i = 0; i < N; i++) cluster.push(Math.floor(i * CLUSTERS / N));
  var stages = [[]];
  for (i = 0; i < N; i += 3) stages[0].push([i, i + 1, i + 2]);
  while (stages[stages.length - 1].length > 1) {
    var prev = stages[stages.length - 1].slice();
    for (i = prev.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = prev[i]; prev[i] = prev[j]; prev[j] = tmp; }   // this round's ranking
    var next = [];
    for (i = 0; i < prev.length / 2; i++) next.push(prev[i].concat(prev[prev.length - 1 - i]));   // best with worst
    stages.push(next);
  }

  var C_;
  function readTheme() {
    function css(n) { var v = cssColor(n); return "rgb(" + v.map(function (x) { return Math.round(x * 255); }).join(",") + ")"; }
    C_ = { text: css("--text"), muted: css("--muted"), faint: css("--faint"), line: css("--line"),
           cl: [css("--blue"), css("--orange"), css("--green")] };
  }
  readTheme();
  addEventListener("themechange", readTheme);

  // layout: each stage packs its groups into a grid; members sit on a sunflower spiral inside their group
  var W = 0, H = 0, layouts = [];
  function layout() {
    layouts = stages.map(function (groups) {
      var k = groups.length, top = 34, h = H - top - 10, cols = Math.ceil(Math.sqrt(k * W / h)), rows = Math.ceil(k / cols);
      var cw = W / cols, ch = h / rows, rad = Math.min(cw, ch) * 0.42, pos = new Array(N), centers = [];
      groups.forEach(function (g, gi) {
        var row = Math.floor(gi / cols), inRow = Math.min(cols, k - row * cols);
        var cx = (W - inRow * cw) / 2 + (gi % cols + 0.5) * cw, cy = top + (row + 0.5) * ch;
        centers.push([cx, cy, rad]);
        g.forEach(function (p, m) {
          var rr = rad * 0.86 * Math.sqrt((m + 0.5) / g.length), a = m * 2.39996;
          pos[p] = [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
        });
      });
      var dot = Math.max(1.6, Math.min(4.5, rad * 0.86 / Math.sqrt(groups[0].length) * 0.8));
      return { pos: pos, centers: centers, dot: dot, label: k === 1 ? "one group of " + N : k + " teams of " + groups[0].length };
    });
  }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  var CYCLE = (stages.length - 1) * (HOLD + MOVE) + HOLD + END_HOLD;
  runVisual(canvas, function (t) {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    if (fitCanvas(canvas) || !layouts.length) { W = canvas.width / dpr; H = canvas.height / dpr; layout(); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var u = t % CYCLE, s = Math.floor(u / (HOLD + MOVE)), local = u - s * (HOLD + MOVE), f = 0;
    if (s >= stages.length - 1) { s = stages.length - 1; } else if (local > HOLD) { f = ease((local - HOLD) / MOVE); }
    var A = layouts[s], Bl = layouts[Math.min(s + 1, stages.length - 1)];

    // group outlines fade out while members travel to their merged group
    ctx.strokeStyle = C_.line; ctx.lineWidth = 1;
    ctx.globalAlpha = 1 - f;
    A.centers.forEach(function (c) { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, 2 * Math.PI); ctx.stroke(); });
    ctx.globalAlpha = f;
    if (f > 0) Bl.centers.forEach(function (c) { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, 2 * Math.PI); ctx.stroke(); });
    ctx.globalAlpha = 1;

    var dot = A.dot + (Bl.dot - A.dot) * f;
    for (var p = 0; p < N; p++) {
      var a = A.pos[p], b = Bl.pos[p];
      ctx.fillStyle = C_.cl[cluster[p]];
      ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, dot, 0, 2 * Math.PI); ctx.fill();
    }

    ctx.font = "11.5px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C_.muted;
    ctx.fillText("round " + (s + 1) + " · " + (f > 0.5 ? Bl.label : A.label), 0, 14);
    ctx.textAlign = "right"; ctx.fillStyle = C_.faint;
    ctx.fillText(f > 0 ? "merging by rank: first with last" : "", W, 14);
  });
})();
