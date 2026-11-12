// Theme, film grain and small page behaviors shared by every page. Load in <head>.
(function () {
  var root = document.documentElement;
  try { var saved = localStorage.getItem("theme"); if (saved) root.dataset.theme = saved; } catch (e) {}

  window.isDark = function () {
    if (root.dataset.theme) return root.dataset.theme === "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches;
  };
  // the resolved scheme, for CSS that must differ between themes beyond the color tokens
  function syncScheme() { root.dataset.scheme = isDark() ? "dark" : "light"; }
  syncScheme();
  addEventListener("themechange", syncScheme);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    dispatchEvent(new Event("themechange"));
  });

  // ---------- Helpers for the generative bands ----------
  var probe;
  // Resolve a CSS custom property (e.g. "--bg") to [r, g, b] in 0..1 for the current theme.
  window.cssColor = function (name) {
    if (!probe) { probe = document.createElement("span"); probe.style.display = "none"; document.body.appendChild(probe); }
    probe.style.color = "var(" + name + ")";
    var m = getComputedStyle(probe).color.match(/[\d.]+/g);
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  };
  window.mixColor = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };

  window.glProgram = function (gl, vs, fs) {
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
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  };

  // Match the canvas backing store to its CSS size; returns true when it changed.
  window.fitCanvas = function (canvas, scale) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2) * (scale || 1);
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  };

  // rAF loop that pauses offscreen / in background tabs. With reduced motion it
  // renders a short warm-up and holds the frame. Restarts on theme change.
  window.runVisual = function (canvas, draw) {
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    addEventListener("themechange", function () { frames = 0; start(); });
    start();
  };

  function addGrain() {
    var c = document.createElement("canvas");
    c.width = c.height = 200;
    var ctx = c.getContext("2d");
    var img = ctx.createImageData(200, 200);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var g = document.createElement("div");
    g.className = "grain";
    g.style.backgroundImage = "url(" + c.toDataURL() + ")";
    document.body.appendChild(g);
  }

  function initToggle() {
    var b = document.querySelector(".theme-toggle");
    if (!b) return;
    function label() { b.textContent = isDark() ? "☀" : "☾"; b.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme"); }
    label();
    b.addEventListener("click", function () {
      root.dataset.theme = isDark() ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
      label();
      dispatchEvent(new Event("themechange"));
    });
    addEventListener("themechange", label);
  }

  function initFilters() {
    var chips = document.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip); });
        document.querySelectorAll(".works > .work").forEach(function (w) {
          w.hidden = f !== "all" && w.dataset.medium !== f;
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    addGrain();
    initToggle();
    initFilters();
  });
})();
