// Flow-field particle band. Particles follow a divergence-free (stream-function) field
// and leave long-exposure trails. Colors come from the CSS theme: --bg, --text and the
// accent named in the canvas's data-accent attribute.
(function () {
  var canvas = document.getElementById("flow");
  if (!canvas) return;
  var gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, alpha: false, antialias: false });
  if (!gl) { canvas.parentNode.hidden = true; return; }

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);
  function cssColor(name) {
    probe.style.color = "var(" + name + ")";
    var m = getComputedStyle(probe).color.match(/[\d.]+/g);
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  }

  var th;
  function readTheme() {
    var dark = isDark();
    th = {
      dark: dark,
      bg: cssColor("--bg"),
      c1: cssColor("--text"),
      c2: cssColor(canvas.dataset.accent || "--blue"),
      alpha: dark ? 0.11 : 0.4,
      fade: dark ? 0.045 : 0.035
    };
  }

  var N = Math.round((innerWidth < 700 ? 12000 : 30000) * (+canvas.dataset.density || 1));
  var pos = new Float32Array(N * 2), life = new Float32Array(N), seed = new Float32Array(N);
  var A = canvas.clientWidth / Math.max(1, canvas.clientHeight) || 2.39;
  function spawn(i) {
    pos[2 * i] = (Math.random() * 2 - 1) * A;
    pos[2 * i + 1] = Math.random() * 2 - 1;
    life[i] = 150 + Math.random() * 450;
  }
  for (var i = 0; i < N; i++) {
    spawn(i);
    life[i] *= Math.random();
    seed[i] = Math.random() < 0.8 ? Math.random() * 0.15 : 0.6 + Math.random() * 0.4;
  }

  function compile(vs, fs) {
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return p;
  }
  var points = compile(
    "attribute vec2 a_p; attribute float a_s; uniform vec2 u_scale; uniform float u_size; varying float v_s;" +
    "void main(){ gl_Position = vec4(a_p * u_scale, 0.0, 1.0); gl_PointSize = u_size; v_s = a_s; }",
    "precision mediump float; varying float v_s; uniform vec3 u_c1; uniform vec3 u_c2; uniform float u_a;" +
    "void main(){ vec3 c = mix(u_c1, u_c2, v_s); gl_FragColor = vec4(c * u_a, u_a); }");
  var quad = compile(
    "attribute vec2 a_q; void main(){ gl_Position = vec4(a_q, 0.0, 1.0); }",
    "precision mediump float; uniform vec4 u_c; void main(){ gl_FragColor = u_c; }");

  function buffer(data, usage) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return b;
  }
  var posBuf = buffer(pos, gl.DYNAMIC_DRAW);
  var seedBuf = buffer(seed, gl.STATIC_DRAW);
  var quadBuf = buffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var L = {
    p: gl.getAttribLocation(points, "a_p"), s: gl.getAttribLocation(points, "a_s"),
    scale: gl.getUniformLocation(points, "u_scale"), size: gl.getUniformLocation(points, "u_size"),
    c1: gl.getUniformLocation(points, "u_c1"), c2: gl.getUniformLocation(points, "u_c2"), a: gl.getUniformLocation(points, "u_a"),
    q: gl.getAttribLocation(quad, "a_q"), c: gl.getUniformLocation(quad, "u_c")
  };

  function clear() {
    gl.clearColor(th.bg[0], th.bg[1], th.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  var mx = 99, my = 99;
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width * 2 - 1) * A;
    my = 1 - (e.clientY - r.top) / r.height * 2;
  });
  canvas.addEventListener("pointerleave", function () { mx = my = 99; });

  // psi = sum a*sin(kx*x + ky*y + w*t); velocity = (dpsi/dy, -dpsi/dx)
  var WAVES = [[1, 1.3, 0.4, 0.13], [0.8, -0.5, 1.7, -0.11], [0.6, 2.3, -1.9, 0.17], [0.4, 3.7, 2.9, -0.21], [0.5, 0.9, -1.1, 0.07]];
  var phase = (+canvas.dataset.phase || 0);
  var SP = 0.0019;
  function step(t) {
    t += phase;
    for (var i = 0; i < N; i++) {
      var x = pos[2 * i], y = pos[2 * i + 1], vx = 0, vy = 0;
      for (var k = 0; k < 5; k++) {
        var W = WAVES[k], c = W[0] * Math.cos(W[1] * x + W[2] * y + W[3] * t);
        vx += c * W[2];
        vy -= c * W[1];
      }
      var dx = x - mx, dy = y - my, r2 = dx * dx + dy * dy;
      if (r2 < 0.16) {
        var f = (0.16 - r2) / 0.16 * 6 / Math.sqrt(r2 + 1e-4);
        vx += dx * f; vy += dy * f;
      }
      x += vx * SP; y += vy * SP;
      if (--life[i] < 0 || x < -A || x > A || y < -1 || y > 1) { spawn(i); continue; }
      pos[2 * i] = x; pos[2 * i + 1] = y;
    }
  }

  function fit() {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w; canvas.height = h;
    A = w / h;
    clear();
  }

  function draw(t) {
    fit();
    step(t);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);

    gl.useProgram(quad);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform4f(L.c, th.bg[0], th.bg[1], th.bg[2], th.fade);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(L.q);
    gl.vertexAttribPointer(L.q, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(L.q);

    gl.useProgram(points);
    if (th.dark) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2f(L.scale, 1 / A, 1);
    gl.uniform1f(L.size, 1.5 * Math.min(devicePixelRatio || 1, 2));
    gl.uniform3fv(L.c1, th.c1);
    gl.uniform3fv(L.c2, th.c2);
    gl.uniform1f(L.a, th.alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.enableVertexAttribArray(L.p);
    gl.vertexAttribPointer(L.p, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.enableVertexAttribArray(L.s);
    gl.vertexAttribPointer(L.s, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.disableVertexAttribArray(L.p);
    gl.disableVertexAttribArray(L.s);
  }

  readTheme();
  addEventListener("themechange", function () { readTheme(); clear(); start(); });

  // Pause offscreen / in background tabs; with reduced motion, settle and hold a still frame.
  var visible = true, raf = 0, frames = 0, t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    draw((now - t0) / 1000);
    if (!reduced || ++frames < 150) start();
  }
  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; start(); }).observe(canvas);
  document.addEventListener("visibilitychange", start);
  start();
})();
