// Strange-attractor visuals (any number per page): tens of thousands of trajectories integrated live and drawn as
// points. Pick the system with data-system ("aizawa" | "halvorsen" | "lorenz" | "thomas"); colors come from the
// CSS theme (--bg, --text, data-accent, data-accent2). Drag to rotate.
(function () {
  function init(canvas) {
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { canvas.parentNode.hidden = true; return; }

    var SYSTEMS = {
      aizawa: {
        dt: 0.006, sub: 2, gap: 7, start: [0.1, 0, 0], center: [0, 0, 0.6], scale: 0.8, upZ: 1,
        deriv: function (x, y, z, o) {
          var a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1;
          o[0] = (z - b) * x - d * y;
          o[1] = d * x + (z - b) * y;
          o[2] = c + a * z - z * z * z / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x;
        }
      },
      halvorsen: {
        dt: 0.005, sub: 2, gap: 6, start: [1, 0, 0], center: [-2.6, -2.6, -2.6], scale: 0.1, upZ: 0, bound: 60, alpha: 0.55,
        deriv: function (x, y, z, o) {
          var a = 1.89;
          o[0] = -a * x - 4 * y - 4 * z - y * y;
          o[1] = -a * y - 4 * z - 4 * x - z * z;
          o[2] = -a * z - 4 * x - 4 * y - x * x;
        }
      },
      lorenz: {
        dt: 0.004, sub: 2, gap: 5, start: [0.1, 0, 20], center: [0, 0, 25], scale: 0.036, upZ: 1, bound: 80, alpha: 0.22, tilt: 0.12, ang: -0.8, sway: 0.5,
        deriv: function (x, y, z, o) {
          o[0] = 10 * (y - x);
          o[1] = x * (28 - z) - y;
          o[2] = x * y - 8 / 3 * z;
        }
      },
      thomas: {
        dt: 0.045, sub: 1, gap: 6, start: [0.1, 0, 0], center: [0, 0, 0], scale: 0.3, upZ: 0,
        deriv: function (x, y, z, o) {
          var b = 0.208186;
          o[0] = Math.sin(y) - b * x;
          o[1] = Math.sin(z) - b * y;
          o[2] = Math.sin(x) - b * z;
        }
      }
    };
    var S = SYSTEMS[canvas.dataset.system] || SYSTEMS.aizawa;

    var N = innerWidth < 700 ? 18000 : 45000;
    var P = new Float32Array(N * 3), seed = new Float32Array(N), k = [0, 0, 0];
    function adv(p) { S.deriv(p[0], p[1], p[2], k); p[0] += k[0] * S.dt; p[1] += k[1] * S.dt; p[2] += k[2] * S.dt; }

    // Seed every particle from one long trajectory so they all start on the attractor.
    var p = S.start.slice();
    for (var i = 0; i < 2000; i++) adv(p);
    for (i = 0; i < N; i++) {
      for (var s = 0; s < S.gap; s++) adv(p);
      P[3 * i] = p[0] + (Math.random() - 0.5) * 0.02;
      P[3 * i + 1] = p[1] + (Math.random() - 0.5) * 0.02;
      P[3 * i + 2] = p[2];
      seed[i] = Math.random();
    }

    var q = [0, 0, 0], B = S.bound || 20;
    function step() {
      for (var i = 0; i < N; i++) {
        var j = 3 * i;
        q[0] = P[j]; q[1] = P[j + 1]; q[2] = P[j + 2];
        for (var s = 0; s < S.sub; s++) adv(q);
        if (!(Math.abs(q[0]) < B && Math.abs(q[1]) < B && Math.abs(q[2]) < B)) {
          var r = (Math.random() * N | 0) * 3;
          q[0] = P[r]; q[1] = P[r + 1]; q[2] = P[r + 2];
        }
        P[j] = q[0]; P[j + 1] = q[1]; P[j + 2] = q[2];
      }
    }

    var prog = glProgram(gl,
      "attribute vec3 a_p; attribute float a_s;" +
      "uniform vec3 u_center; uniform float u_scale; uniform float u_upz;" +
      "uniform float u_ang; uniform float u_tilt; uniform float u_asp; uniform float u_size; uniform float u_zoom;" +
      "varying float v_s; varying float v_d;" +
      "void main(){" +
      "  vec3 q = (a_p - u_center) * u_scale;" +
      "  if (u_upz > 0.5) q = vec3(q.x, q.z, q.y);" +
      "  float c = cos(u_ang), s = sin(u_ang);" +
      "  q = vec3(c * q.x - s * q.z, q.y, s * q.x + c * q.z);" +
      "  float ct = cos(u_tilt), st = sin(u_tilt);" +
      "  q = vec3(q.x, ct * q.y - st * q.z, st * q.y + ct * q.z);" +
      "  float depth = q.z + 5.0;" +
      "  vec2 sp = q.xy * u_zoom / depth;" +
      "  gl_Position = vec4(sp.x / u_asp, sp.y, 0.0, 1.0);" +
      "  gl_PointSize = u_size * 5.0 / depth;" +
      "  v_s = a_s; v_d = clamp((6.2 - depth) / 2.4, 0.0, 1.0);" +
      "}",
      "precision mediump float; varying float v_s; varying float v_d;" +
      "uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3; uniform float u_a;" +
      "void main(){" +
      "  vec2 p = gl_PointCoord - 0.5; if (dot(p, p) > 0.25) discard;" +
      "  vec3 col = v_s < 0.75 ? u_c1 : mix(u_c2, u_c3, (v_s - 0.75) / 0.25);" +
      "  float al = u_a * (0.25 + 0.75 * v_d);" +
      "  gl_FragColor = vec4(col * al, al);" +
      "}");

    var pBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
    gl.bufferData(gl.ARRAY_BUFFER, P, gl.DYNAMIC_DRAW);
    var lp = gl.getAttribLocation(prog, "a_p");
    gl.enableVertexAttribArray(lp);
    gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 0, 0);
    var sBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seed, gl.STATIC_DRAW);
    var ls = gl.getAttribLocation(prog, "a_s");
    gl.enableVertexAttribArray(ls);
    gl.vertexAttribPointer(ls, 1, gl.FLOAT, false, 0, 0);
    gl.useProgram(prog);
    var U = {};
    ["u_center", "u_scale", "u_upz", "u_ang", "u_tilt", "u_asp", "u_size", "u_zoom", "u_c1", "u_c2", "u_c3", "u_a"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform3fv(U.u_center, S.center);
    gl.uniform1f(U.u_scale, S.scale);
    gl.uniform1f(U.u_upz, S.upZ);

    var th;
    function readTheme() {
      th = {
        dark: isDark(),
        bg: cssColor("--bg"),
        c1: cssColor("--text"),
        c2: cssColor(canvas.dataset.accent || "--orange"),
        c3: cssColor(canvas.dataset.accent2 || "--blue")
      };
      th.alpha = (th.dark ? 0.16 : 0.22) * (S.alpha || 1);
    }
    readTheme();
    addEventListener("themechange", readTheme);

    var ang = S.ang != null ? S.ang : 0.6, tilt = S.tilt || 0.3, spin = 0.12, drag = null, base = ang;
    canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      ang += (e.clientX - drag.x) * 0.006;
      tilt = Math.max(-1.2, Math.min(1.2, tilt + (e.clientY - drag.y) * 0.004));
      spin = (e.clientX - drag.x) * 0.3;
      drag = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("pointerup", function () { drag = null; base = ang; });

    var last = 0;
    runVisual(canvas, function (t) {
      var dt = Math.min(0.05, t - last); last = t;
      fitCanvas(canvas);
      step();
      if (!drag && S.sway) { ang += (base + S.sway * Math.sin(t * 0.25) - ang) * 0.03; }   // sway around the most readable view
      else if (!drag) { spin += (0.12 - spin) * 0.02; ang += spin * dt; }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(th.bg[0], th.bg[1], th.bg[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      if (th.dark) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      var asp = canvas.width / canvas.height;
      gl.uniform1f(U.u_ang, ang);
      gl.uniform1f(U.u_tilt, tilt);
      gl.uniform1f(U.u_asp, asp);
      gl.uniform1f(U.u_zoom, 4.2 * Math.min(1, asp * 0.55));
      gl.uniform1f(U.u_size, 1.6 * Math.min(devicePixelRatio || 1, 2));
      gl.uniform3fv(U.u_c1, th.c1);
      gl.uniform3fv(U.u_c2, th.c2);
      gl.uniform3fv(U.u_c3, th.c3);
      gl.uniform1f(U.u_a, th.alpha);
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, P);
      gl.drawArrays(gl.POINTS, 0, N);
    });
  }
  document.querySelectorAll('canvas[data-visual="attractor"]').forEach(init);
})();
