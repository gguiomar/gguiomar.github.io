// The Bogdanov-Takens normal form in its control space, after the "bt3d" scene of the stochastic normal-form talk.
// Fixed points of w1' = w2, w2' = nu1 + nu2 w1 + a w1^2 + b w1 w2 (a = 1, b = -1) form one surface over the control
// plane (nu2, nu1), folded back along nu1 = nu2^2/4; colored stable / saddle / unstable. On the floor: the fold,
// Hopf and homoclinic curves and the BT point. Magenta loops: the range of w1 along the cycles born at the Hopf
// line. A noisy state rides on the surface while the parameters circle the BT point. Canvas 2D, theme colors, drag
// to rotate.
(function () {
  var canvas = document.querySelector('canvas[data-visual="bt"]');
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var A = 1, B = -1, N2 = [-1.3, 1.3], N1MIN = -0.6, N1MAX = 0.45, WMAX = 1.25, FY = -2.5 / 0.9;
  var RX = 1.0, RY = 0.3, SIG = 0.06, SPEED = 2.5, H = 0.01, NTR = 140;

  function P(n2, n1, w) { return [n2 * 1.6, w * 0.9, -n1 * 3.2]; }   // nu2 right, w1 up, nu1 away from the viewer
  function type(n2, w) { return n2 + 2 * A * w > 0 ? "saddle" : B * w < 0 ? "stable" : "unstable"; }
  function field(n1, n2, x, y) { return [y, n1 + n2 * x + A * x * x + B * x * y]; }
  function span(n2) {
    var d = Math.sqrt(n2 * n2 - 4 * A * N1MIN);
    return [Math.max(-WMAX, (-n2 - d) / (2 * A)), Math.min(WMAX, (-n2 + d) / (2 * A))];
  }

  // range of w1 along the stable cycle at (nu1, nu2), or null if the state escapes
  function cycleRange(n1, n2) {
    var D = n2 * n2 - 4 * A * n1, x = (-n2 - Math.sqrt(D)) / (2 * A) + 0.02, y = 0, lo = Infinity, hi = -Infinity;
    for (var i = 0; i < 26000; i++) {
      var f1 = field(n1, n2, x, y), f2 = field(n1, n2, x + H * f1[0], y + H * f1[1]);
      x += H * (f1[0] + f2[0]) / 2; y += H * (f1[1] + f2[1]) / 2;
      if (Math.abs(x) > 6) return null;
      if (i > 18000) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
    }
    return hi - lo > 0.01 ? [lo, hi] : null;
  }

  // ---- static geometry ----
  var NW = 40, NN = 26, quads = [];
  for (var j = 0; j < NN; j++) {
    for (var i = 0; i < NW; i++) {
      var a2 = N2[0] + (N2[1] - N2[0]) * j / NN, b2 = N2[0] + (N2[1] - N2[0]) * (j + 1) / NN;
      var sa = span(a2), sb = span(b2), u0 = i / NW, u1 = (i + 1) / NW;
      var wa0 = sa[0] + (sa[1] - sa[0]) * u0, wa1 = sa[0] + (sa[1] - sa[0]) * u1;
      var wb0 = sb[0] + (sb[1] - sb[0]) * u0, wb1 = sb[0] + (sb[1] - sb[0]) * u1;
      var pt = function (n2, w) { return P(n2, -n2 * w - A * w * w, w); };
      quads.push({ v: [pt(a2, wa0), pt(a2, wa1), pt(b2, wb1), pt(b2, wb0)], t: type((a2 + b2) / 2, (wa0 + wa1 + wb0 + wb1) / 4) });
    }
  }
  var grid = [];   // curves of the surface at fixed nu2, split by type
  for (var g2 = N2[0]; g2 <= N2[1] + 1e-9; g2 += 0.26) {
    var sp = span(g2), cur = [], t0 = null;
    for (var k = 0; k <= 120; k++) {
      var w = sp[0] + (sp[1] - sp[0]) * k / 120, ty = type(g2, w), p = P(g2, -g2 * w - A * w * w, w);
      if (t0 !== null && ty !== t0) { grid.push({ pts: cur, t: t0 }); cur = [cur[cur.length - 1]]; }
      t0 = ty; cur.push(p);
    }
    grid.push({ pts: cur, t: t0 });
  }
  var foldS = [], foldF = [], twoF = [];
  for (k = 0; k <= 80; k++) {
    var n2 = N2[0] + (N2[1] - N2[0]) * k / 80, n1 = n2 * n2 / (4 * A);
    foldS.push(P(n2, n1, -n2 / (2 * A))); foldF.push(P(n2, n1, FY));
  }
  twoF = foldF.concat([P(N2[1], N1MIN, FY), P(N2[0], N1MIN, FY)]);
  var hopfS = [P(N2[0], 0, 0), P(0, 0, 0)], hopfF = [P(N2[0], 0, FY), P(0, 0, FY)], hom = [];
  for (k = 0; k <= 50; k++) { n2 = N2[0] * k / 50; hom.push(P(n2, -6 / 25 * n2 * n2, FY)); }
  var loops = [];
  [-1.2, -1.0, -0.8, -0.6].forEach(function (n2) {
    var hc = -6 / 25 * n2 * n2, up = [P(n2, 0, 0)], dn = [P(n2, 0, 0)];
    for (var i = 1; i <= 10; i++) {
      var n1 = hc * 0.97 * i / 10, r = cycleRange(n1, n2);
      if (!r) break;
      up.push(P(n2, n1, r[1])); dn.push(P(n2, n1, r[0]));
    }
    if (up.length > 1) loops.push(dn.reverse().concat(up.slice(1)));
  });
  var outline = [P(N2[0], N1MIN, FY), P(N2[1], N1MIN, FY), P(N2[1], N1MAX, FY), P(N2[0], N1MAX, FY), P(N2[0], N1MIN, FY)];

  // ---- camera ----
  var yaw0 = 0.67, yaw = yaw0, pitch = 0.42, drag = null, TGT = [0, -0.75, 0.3];
  var Wc = 0, Hc = 0, SC = 1;
  function proj(p) {
    var x = p[0] - TGT[0], y = p[1] - TGT[1], z = p[2] - TGT[2];
    var cy = Math.cos(yaw), sy = Math.sin(yaw), xr = cy * x - sy * z, zr = sy * x + cy * z;
    var cp = Math.cos(pitch), spn = Math.sin(pitch), yr = cp * y - spn * zr, zz = spn * y + cp * zr;
    var f = 9.5 / (9.5 - zz);
    return [Wc / 2 + xr * f * SC, Hc / 2 - yr * f * SC, zz];
  }
  canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", function (e) {
    if (!drag) return;
    yaw -= (e.clientX - drag.x) * 0.006;
    pitch = Math.max(0.05, Math.min(1.2, pitch + (e.clientY - drag.y) * 0.004));
    drag = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerup", function () { drag = null; yaw0 = yaw; });

  var C;
  function readTheme() {
    function css(n) { var c = cssColor(n); return "rgb(" + c.map(function (v) { return Math.round(v * 255); }).join(",") + ")"; }
    C = { ink: css("--text"), faint: css("--faint"), line: css("--line"), stable: css("--blue"), unstable: css("--red"),
          saddle: css("--muted"), hopf: css("--violet"), fold: css("--green"), noise: css("--orange") };
  }
  readTheme();
  addEventListener("themechange", readTheme);

  function path(pts, col, lw, dash, alpha) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.beginPath();
    pts.forEach(function (p, i) { var q = proj(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  function dot(p, r, col) { var q = proj(p); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 2 * Math.PI); ctx.fill(); }
  function label(p, s, col, dx, dy) {
    var q = proj(p); ctx.fillStyle = col; ctx.font = "11.5px 'IBM Plex Mono', monospace"; ctx.textAlign = "left";
    ctx.fillText(s, q[0] + (dx || 0), q[1] + (dy || 0));
  }

  // ---- the noisy state ----
  var S = { th: Math.PI * 0.62, w: [0.5, 0], trail: [], ctrl: [] };
  function tick(dt) {
    var n2 = RX * Math.cos(S.th), n1 = RY * Math.sin(S.th);
    S.th += dt * (n2 < 0 && Math.abs(n1) < 0.22 ? 0.2 : 0.5);
    var steps = Math.abs(S.w[0]) < 5 && Math.abs(S.w[1]) < 5 ? Math.round(dt * SPEED / H) : 0;
    for (var i = 0; i < steps; i++) {
      var f1 = field(n1, n2, S.w[0], S.w[1]), f2 = field(n1, n2, S.w[0] + H * f1[0], S.w[1] + H * f1[1]);
      S.w[0] += H * (f1[0] + f2[0]) / 2;
      S.w[1] += H * (f1[1] + f2[1]) / 2 + SIG * Math.sqrt(H) * (Math.random() * 2 - 1) * 1.73;
      if (!(Math.abs(S.w[0]) < 5 && Math.abs(S.w[1]) < 5)) { S.w = [9, 9]; break; }
    }
    var D = n2 * n2 - 4 * A * n1, out = Math.abs(S.w[0]) > 2.2 || Math.abs(S.w[1]) > 2.5;
    if (out && D > 0) {   // restart once something attracts the state again
      var xf = (-n2 - Math.sqrt(D)) / (2 * A);
      if (type(n2, xf) === "stable" || (n1 < 0 && n1 > -6 / 25 * n2 * n2 && n2 < 0)) S.w = [xf + 0.03, 0];
    }
    S.shown = !(Math.abs(S.w[0]) > 2.2 || Math.abs(S.w[1]) > 2.5);
    if (S.shown) S.trail.push(P(n2, n1, S.w[0])); else S.trail = [];
    S.ctrl.push(P(n2, n1, FY));
    if (S.trail.length > NTR) S.trail.shift();
    if (S.ctrl.length > NTR) S.ctrl.shift();
    S.n2 = n2; S.n1 = n1;
  }
  function trail(pts, col, lw) {
    for (var i = 1; i < pts.length; i++) path([pts[i - 1], pts[i]], col, lw, null, Math.pow(i / pts.length, 1.3));
  }

  var last = 0;
  runVisual(canvas, function (t) {
    var dt = Math.min(0.05, t - last); last = t;
    tick(dt);
    if (!drag) yaw += (yaw0 + 0.35 * Math.sin(t * 0.18) - yaw) * 0.03;

    var dpr = Math.min(devicePixelRatio || 1, 2);
    fitCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Wc = canvas.width / dpr; Hc = canvas.height / dpr; SC = Hc / 5.6;
    ctx.clearRect(0, 0, Wc, Hc);

    // floor: control plane, region with two fixed points, fold / Hopf / homoclinic curves, control loop
    path(outline, C.line, 1);
    ctx.fillStyle = C.line; ctx.globalAlpha = 0.5; ctx.beginPath();
    twoF.forEach(function (p, i) { var q = proj(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.fill(); ctx.globalAlpha = 1;
    path(foldF, C.fold, 1.6);
    path(hopfF, C.hopf, 1.6);
    path(hom, C.faint, 1.2, [5, 4]);
    trail(S.ctrl, C.ink, 1.2);
    dot(P(S.n2, S.n1, FY), 2.6, C.ink);
    dot(P(0, 0, FY), 3, C.stable);

    // surface: translucent faces back to front, then the grid curves
    quads.forEach(function (qd) { qd.z = qd.v.reduce(function (s, p) { return s + proj(p)[2]; }, 0); });
    quads.sort(function (a, b) { return a.z - b.z; });
    quads.forEach(function (qd) {
      ctx.fillStyle = C[qd.t]; ctx.globalAlpha = qd.t === "stable" ? 0.16 : 0.11; ctx.beginPath();
      qd.v.forEach(function (p, i) { var q = proj(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1;
    grid.forEach(function (g) { path(g.pts, C[g.t], 1, g.t === "stable" ? null : [4, 3], 0.75); });
    path(foldS, C.ink, 1.6);
    path(hopfS, C.hopf, 2.2);
    loops.forEach(function (l) { path(l, C.hopf, 1.3, null, 0.8); });
    dot(P(0, 0, 0), 4, C.stable);

    // the state and its stem to the control point
    if (S.shown) {
      trail(S.trail, C.noise, 2);
      path([P(S.n2, S.n1, FY), P(S.n2, S.n1, S.w[0])], C.faint, 1, [3, 3]);
      dot(P(S.n2, S.n1, S.w[0]), 4.5, C.noise);
    }

    label(P(0, 0, 0), "BT", C.stable, 10, -8);
    label(foldS[70], "fold", C.ink, 10, 4);
    label(P(N2[0], 0, 0), "Hopf", C.hopf, -36, 4);
    label(P(-1.05, -(-1.05) * 0.95 - 0.95 * 0.95, 0.95), "stable", C.stable, 8, 0);
    label(P(0.9, -0.9 * 0.2 - 0.04, 0.2), "saddle", C.saddle, 8, 0);
    label(P(1.25, -1.25 * -1.0 - 1.0, -1.0), "unstable", C.unstable, 8, 0);
  });
})();
