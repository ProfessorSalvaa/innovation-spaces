/* Front Desk of the Future: Ava, a hologram host, in seven interactive three.js chapters.
   Voice-led (ElevenLabs clips in audio/frontdesk), with one- or two-word labels on screen and captions only when CC is on.
   Lines and labels: js/frontdesk-content.js. Clip timings and loudness envelopes: js/frontdesk-voice.js. Icons: js/frontdesk-icons.js. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), root = $('fdesk');
  if (!root || !window.THREE || !window.FDCONTENT) return;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var C = FDCONTENT, CH = C.chapters, NC = CH.length, W = 1080, H = 1920, PI = Math.PI, PI2 = PI * 2;
  var VOICE = window.FDVOICE || {}, ICON = window.FDICONS || {};
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function damp(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }
  function eIO(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eO(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function eBack(x) { x = clamp(x, 0, 1); var c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function win(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function toStage(e) { var r = stage.getBoundingClientRect(), k = r.width / W; return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; }
  function V(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ---------- sound kit: Web Audio tones, no files ---------- */
  var ac = null, lastTap = 0, padNodes = null;
  function actx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e2) {} } return ac; }
  function tone(f, d, type, v, f2, dl) {
    var c = actx(); if (!c) return; var t0 = c.currentTime + (dl || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v || 0.03, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.05);
  }
  var NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
  var sfx = {
    tap: function () { var n = performance.now(); if (n - lastTap < 60) return; lastTap = n; tone(1150, 0.08, 'sine', 0.018, 1700); },
    select: function () { tone(660, 0.3, 'sine', 0.035, 990); tone(990, 0.4, 'triangle', 0.025, 1320, 0.09); },
    chime: function (n) { var f = NOTES[n % NOTES.length]; tone(f, 0.9, 'sine', 0.04); tone(f * 2, 0.7, 'sine', 0.012, null, 0.02); },
    rise: function (n) { var f = NOTES[n % NOTES.length]; tone(f * 0.5, 0.7, 'triangle', 0.03, f); tone(f, 0.9, 'sine', 0.025, null, 0.25); },
    hum: function (n) { tone(70 + n * 14, 1.1, 'sawtooth', 0.012, 90 + n * 18); tone(140 + n * 28, 0.9, 'sine', 0.02, null, 0.05); },
    whoosh: function () { tone(180, 0.6, 'sawtooth', 0.012, 1400); tone(320, 0.7, 'sine', 0.015, 1900, 0.05); },
    form: function () { tone(110, 2.2, 'sawtooth', 0.014, 520); tone(220, 2.2, 'sine', 0.022, 880, 0.15); [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.7, 'sine', 0.025, null, 1.6 + i * 0.09); }); },
    ready: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.55, 'sine', 0.03, null, i * 0.09); }); },
    stress: function () { tone(880, 0.12, 'square', 0.008); tone(880, 0.12, 'square', 0.008, null, 0.18); },
    bonk: function () { tone(300, 0.18, 'triangle', 0.04, 140); },
    calm: function () { [392, 494, 587, 740].forEach(function (f, i) { tone(f, 1.6, 'sine', 0.022, null, i * 0.12); }); }
  };
  function padStart() {
    var c = actx(); if (!c || padNodes || RM) return;
    try {
      var g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.012, c.currentTime + 3);
      var os = [130.81, 196, 261.63, 329.63].map(function (f, i) { var o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 4; o.connect(lp); o.start(); return o; });
      var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 160; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      lp.connect(g); g.connect(c.destination); padNodes = { g: g, os: os.concat([lfo]) };
    } catch (e) { padNodes = null; }
  }
  function padStop() { if (!padNodes || !ac) return; var p = padNodes; padNodes = null; try { p.g.gain.cancelScheduledValues(ac.currentTime); p.g.gain.setValueAtTime(p.g.gain.value, ac.currentTime); p.g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.8); setTimeout(function () { p.os.forEach(function (o) { try { o.stop(); } catch (e) {} }); }, 900); } catch (e) {} }

  /* ---------- DOM ---------- */
  var elGl = $('fgl'), elTitle = $('ftitle'), elNum = $('fnum'), elHs = $('fhs'), elAct = $('fact'), elActL = $('factl'), elDock = $('fdock'), elPill = $('fpill');
  var elProg = $('fprog'), elTour = $('ftour'), elCC = $('fcc'), elMute = $('fmute'), elCap = $('fcap'), elLabel = $('flabel'), elWave = $('fwave'), elLoad = $('fload'), elFlash = $('fflash'), elVoiceBar = $('fvoice');
  var waveBars = elWave ? Array.prototype.slice.call(elWave.children) : [];
  var TOTAL = CH.reduce(function (a, c) { return a + c.notes.length; }, 0);

  /* ---------- three.js state ---------- */
  var renderer, composer, bloom, scene, camera, ok = false, loading = false, failed = false, running = false, lastT = 0, TT = 0;
  var LT = false, themeSeen = false, floorMat = null, floorShadow = null;
  var accCur = new THREE.Color(0x3fc3ec), accTgt = new THREE.Color(0x3fc3ec), keyL = null, rimL = null, fillL = null;
  var mode = 'off', cur = -1, sel = -1, chapters = [], ava = null, visited = {}, tour = null, attract = false, atStep = -2, atNext = 0, lastTouch = 0, celebrated = false;
  var camP = V(0, 2, 9), camL = V(0, 1.3, 0), camPT = V(0, 2, 9), camLT = V(0, 1.3, 0), orbitYaw = 0, orbitYawT = 0, par = { x: 0, y: 0, tx: 0, ty: 0 };
  var hsEls = [], hsPos = [], dockBtns = [], tw = { phase: 'idle', t: 0, next: -1 }, kick = 0, amp = 0, ampS = 0, tmpV = V(0, 0, 0), tmpV2 = V(0, 0, 0), tmpV3 = V(0, 0, 0);
  var ACC = ['#3fc3ec', '#ed8b00', '#86eb22', '#3fc3ec', '#00a3e0', '#ffc864', '#86eb22'];
  var ACC2 = ['#a0dcff', '#ffc864', '#c8f56a', '#86eb22', '#86eb22', '#3fc3ec', '#3fc3ec'];
  var C_AQUA = 0x3fc3ec, C_LIME = 0x86eb22, C_GREEN = 0x86bc25, C_BLUE = 0x00a3e0, C_GOLD = 0xffc864, C_ORANGE = 0xed8b00, C_WHITE = 0xffffff, C_ICE = 0xa0dcff;

  /* ---------- textures ---------- */
  var TEX = {};
  function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t; }
  function dotTex() { return TEX.dot || (TEX.dot = canvasTex(64, 64, function (x) { var r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 64, 64); })); }
  function glowTex() { return TEX.glow || (TEX.glow = canvasTex(128, 128, function (x) { var r = x.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.2, 'rgba(255,255,255,0.35)'); r.addColorStop(0.55, 'rgba(255,255,255,0.08)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 128, 128); })); }
  function iconTex(name, framed) {
    var key = name + (framed ? ':f' : ''); if (TEX[key]) return TEX[key];
    return (TEX[key] = canvasTex(256, 256, function (x) {
      x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
      if (framed === 'circle') { x.lineWidth = 5; x.globalAlpha = 0.9; x.beginPath(); x.arc(128, 128, 118, 0, PI2); x.stroke(); x.globalAlpha = 0.35; x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 104, 0, PI2); x.stroke(); x.globalAlpha = 1; }
      else if (framed) { x.lineWidth = 5; x.globalAlpha = 0.85; rr(x, 8, 8, 240, 240, 46); x.stroke(); x.globalAlpha = 1; }
      var p = ICON[name]; if (!p) return; var s = framed ? 5.4 : 8.6, o = 128 - 12 * s;
      x.save(); x.translate(o, o); x.scale(s, s); x.lineWidth = 2.1; x.shadowColor = 'rgba(255,255,255,0.9)'; x.shadowBlur = 6; try { x.stroke(new Path2D(p)); } catch (e) {} x.restore();
    }));
  }
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

  /* ---------- materials ---------- */
  function addMat(color, op, side) { return new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: op === undefined ? 1 : op, blending: THREE.AdditiveBlending, depthWrite: false, side: side || THREE.FrontSide }); }
  function lineMat(color, op) { return new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: op === undefined ? 1 : op, blending: THREE.AdditiveBlending, depthWrite: false }); }
  function pointsMat(size, color, op, vc) { return new THREE.PointsMaterial({ size: size, map: dotTex(), color: color, transparent: true, opacity: op === undefined ? 1 : op, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, vertexColors: !!vc }); }
  function iconMat(name, color, framed) { return new THREE.MeshBasicMaterial({ map: iconTex(name, framed), color: color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); }
  var HOLO_V = 'uniform float uTime; uniform float uGlitch; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); float b = floor(w.y*14.0 + floor(uTime*7.0)*3.1); float r = fract(sin(b*12.9898)*43758.5453); w.x += uGlitch*step(0.93, r)*0.08*sin(uTime*60.0 + b); vW = w.xyz; vec4 mv = viewMatrix*w; vN = normalize(mat3(viewMatrix)*mat3(modelMatrix)*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }';
  var HOLO_F = 'uniform vec3 uCol; uniform vec3 uCol2; uniform float uOp; uniform float uTime; uniform float uLight; uniform float uReveal; uniform float uY0; uniform float uY1; uniform float uAmp; uniform float uFill; uniform float uPow; uniform float uFlash; varying vec3 vN; varying vec3 vV; varying vec3 vW;' +
    'void main(){ float h = clamp((vW.y - uY0)/max(0.001, uY1 - uY0), 0.0, 1.0); if (h > uReveal + 0.001) discard; float edge = (1.0 - smoothstep(0.0, 0.05, uReveal - h))*step(uReveal, 0.999);' +
    ' float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow); float scan = 0.82 + 0.18*sin(vW.y*150.0 - uTime*5.0); float sweep = smoothstep(0.06, 0.0, abs(fract(h - uTime*0.22) - 0.5) - 0.44);' +
    ' vec3 col = mix(uCol, uCol2, smoothstep(0.15, 1.0, h)); float a = uOp*((uFill + 0.9*f)*scan + 0.25*sweep + uAmp*0.35*f) + edge*uOp*1.4 + uFlash*0.35*uOp; vec3 c = col*(0.55 + 0.85*f + 0.3*sweep) + vec3(1.0)*(edge*0.9 + uFlash*0.4);' +
    ' if (uLight > 0.5) { gl_FragColor = vec4(mix(col*0.42, vec3(0.12, 0.2, 0.24), 0.35) + vec3(edge*0.3), clamp(uOp*(0.18 + 0.75*f)*scan + edge*uOp, 0.0, 1.0)); } else { gl_FragColor = vec4(c, a); } }';
  var holoMats = [];
  function holoMat(color, color2, op, opts) {
    opts = opts || {};
    var m = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(color) }, uCol2: { value: new THREE.Color(color2 === undefined || color2 === null ? color : color2) }, uOp: { value: op === undefined ? 1 : op }, uTime: { value: 0 }, uLight: { value: 0 }, uReveal: { value: 1 }, uY0: { value: -10 }, uY1: { value: 10 }, uAmp: { value: 0 }, uFill: { value: opts.fill === undefined ? 0.07 : opts.fill }, uPow: { value: opts.pow || 2.0 }, uGlitch: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: HOLO_V, fragmentShader: HOLO_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: opts.side || THREE.FrontSide
    });
    holoMats.push(m); return m;
  }
  function setOp(m, a) { if (m.uniforms && m.uniforms.uOp) m.uniforms.uOp.value = a; else m.opacity = a; }

  /* ---------- geometry helpers ---------- */
  function cr(p0, p1, p2, p3, t) { var t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); }
  function loft(rings, seg, sub) {
    var R = [], i, s, r, j;
    for (i = 0; i < rings.length - 1; i++) { var p0 = rings[Math.max(0, i - 1)], p1 = rings[i], p2 = rings[i + 1], p3 = rings[Math.min(rings.length - 1, i + 2)]; for (s = 0; s < sub; s++) { var t = s / sub, q = []; for (var k = 0; k < 4; k++) q.push(cr(p0[k], p1[k], p2[k], p3[k], t)); R.push(q); } }
    R.push(rings[rings.length - 1]);
    var pos = [], idx = [], uv = [];
    for (r = 0; r < R.length; r++) for (j = 0; j <= seg; j++) { var a = j / seg * PI2; pos.push(Math.sin(a) * R[r][1], R[r][0], Math.cos(a) * R[r][2] + R[r][3]); uv.push(j / seg, r / (R.length - 1)); }
    for (r = 0; r < R.length - 1; r++) for (j = 0; j < seg; j++) { var a0 = r * (seg + 1) + j, b0 = a0 + seg + 1; idx.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function capsule(len, r0, r1, seg) {
    var pts = [], n = 6, i;
    for (i = 0; i <= n; i++) { var a = -PI / 2 + i / n * PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r1), -len + Math.sin(a) * r1)); }
    for (i = 1; i <= n; i++) { var b = i / n * PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(b) * r0), Math.sin(b) * r0)); }
    return new THREE.LatheGeometry(pts, seg || 14);
  }
  function rrShape(w, h, r) { var s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
  function rrLine(w, h, r, color, op) { var pts = rrShape(w, h, r).getPoints(10); var g = new THREE.BufferGeometry().setFromPoints(pts.map(function (p) { return V(p.x, p.y, 0); })); return new THREE.LineLoop(g, lineMat(color, op)); }
  function holoBox(w, h, d, color, op) {
    var g = new THREE.Group(), geo = new THREE.BoxGeometry(w, h, d);
    var fill = new THREE.Mesh(geo, addMat(color, op === undefined ? 0.08 : op)); var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(color, 0.85));
    g.add(fill); g.add(edges); g.userData = { fill: fill, edges: edges }; return g;
  }
  function iconPlane(name, size, color, framed) { var m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), iconMat(name, color, framed)); return m; }
  function sprite(color, size, op) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: color, transparent: true, opacity: op === undefined ? 1 : op, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(size, size, 1); return s; }
  /* a line that draws itself on (uP) and carries flowing dashes */
  function progLine(points, color, op, segs) {
    var curve = new THREE.CatmullRomCurve3(points), pts = curve.getPoints(segs || 80), pos = [], tt = [];
    pts.forEach(function (p, i) { pos.push(p.x, p.y, p.z); tt.push(i / (pts.length - 1)); });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
    var m = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(color) }, uP: { value: 0 }, uOp: { value: op === undefined ? 1 : op }, uTime: { value: 0 }, uLight: { value: 0 } },
      vertexShader: 'attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uP; uniform float uOp; uniform float uTime; uniform float uLight; varying float vT; void main(){ if (vT > uP) discard; float d = 0.55 + 0.45*step(0.5, fract(vT*26.0 - uTime*2.2)); float head = smoothstep(0.06, 0.0, uP - vT); vec3 c = mix(uCol, vec3(1.0), head*0.7); if (uLight > 0.5) gl_FragColor = vec4(uCol*0.5, uOp*d); else gl_FragColor = vec4(c, uOp*(d + head)); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    var l = new THREE.Line(g, m); l.userData.curve = curve; l.frustumCulled = false; return l;
  }

  /* ---------- particles, rings ---------- */
  var PN = 900, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pBase = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN), pMax = new Float32Array(PN), pIdx = 0, pGeo, rings = [];
  function burst(x, y, z, n, spd, life, cols, up) {
    if (!pGeo) return;
    for (var i = 0; i < n; i++) {
      var k = pIdx++ % PN, a = Math.random() * PI2, b = Math.acos(2 * Math.random() - 1), s = spd * (0.35 + Math.random() * 0.65), c = new THREE.Color(cols[(Math.random() * cols.length) | 0]);
      pPos[k * 3] = x; pPos[k * 3 + 1] = y; pPos[k * 3 + 2] = z; pVel[k * 3] = Math.sin(b) * Math.cos(a) * s; pVel[k * 3 + 1] = Math.cos(b) * s + (up || 0); pVel[k * 3 + 2] = Math.sin(b) * Math.sin(a) * s;
      pBase[k * 3] = c.r; pBase[k * 3 + 1] = c.g; pBase[k * 3 + 2] = c.b; pMax[k] = pLife[k] = life * (0.6 + Math.random() * 0.4);
    }
  }
  function burstV(v, n, spd, life, cols, up) { burst(v.x, v.y, v.z, n, spd, life, cols, up); }
  function ringAt(v, color, size) { var r = null; for (var i = 0; i < rings.length; i++) if (!rings[i].on) { r = rings[i]; break; } if (!r) return; r.on = true; r.t = 0; r.size = size || 1.2; r.mesh.position.copy(v); r.mesh.material.color.setHex(color); if (LT) r.mesh.material.color.multiplyScalar(0.55); r.mesh.visible = true; }
  function fxStep(dt) {
    var BG = window.ProtoTheme ? ProtoTheme.BG : [0.93, 0.94, 0.96];
    for (var i = 0; i < PN; i++) {
      if (pLife[i] > 0) {
        pLife[i] -= dt; var f = Math.max(0, pLife[i] / pMax[i]), j = i * 3; pPos[j] += pVel[j] * dt; pPos[j + 1] += pVel[j + 1] * dt; pPos[j + 2] += pVel[j + 2] * dt; pVel[j] *= 0.97; pVel[j + 1] *= 0.97; pVel[j + 2] *= 0.97;
        if (LT) { for (var q = 0; q < 3; q++) pCol[j + q] = BG[q] + (pBase[j + q] * 0.5 - BG[q]) * f; } else { pCol[j] = pBase[j] * f; pCol[j + 1] = pBase[j + 1] * f; pCol[j + 2] = pBase[j + 2] * f; }
      } else { if (LT) { pCol[i * 3] = BG[0]; pCol[i * 3 + 1] = BG[1]; pCol[i * 3 + 2] = BG[2]; } else pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0; }
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    rings.forEach(function (r) { if (!r.on) return; r.t += dt / 1.1; if (r.t >= 1) { r.on = false; r.mesh.visible = false; return; } r.mesh.scale.setScalar(0.05 + r.size * eO(r.t)); r.mesh.material.opacity = 0.6 * (1 - r.t); r.mesh.quaternion.copy(camera.quaternion); });
  }

  /* ================= Ava: the hologram host ================= */
  var AVA_RINGS = [[0.0, 0.34, 0.3, 0.03], [0.07, 0.325, 0.285, 0.03], [0.3, 0.265, 0.232, 0.02], [0.55, 0.205, 0.175, 0.01], [0.78, 0.17, 0.134, 0], [0.9, 0.143, 0.108, 0], [0.98, 0.127, 0.097, 0.005], [1.06, 0.134, 0.104, 0.012], [1.15, 0.15, 0.117, 0.022], [1.22, 0.156, 0.112, 0.018], [1.29, 0.171, 0.099, 0.004], [1.335, 0.176, 0.087, -0.004], [1.37, 0.133, 0.074, -0.004], [1.4, 0.062, 0.055, 0], [1.43, 0.047, 0.047, 0.004], [1.5, 0.043, 0.045, 0.008]];
  /* pose: [abduction, flex(-forward), twist, elbow(-bend), wrist] per arm; head [yaw, pitch, roll]; lean */
  var POSES = {
    rest: { L: [0.13, -0.06, 0.15, -0.22, 0], R: [0.13, -0.06, 0.15, -0.22, 0], head: [0, 0.03, 0], lean: 0 },
    open: { L: [0.72, -0.5, 0.9, -0.5, -0.2], R: [0.72, -0.5, 0.9, -0.5, -0.2], head: [0, -0.07, 0], lean: -0.02 },
    presentL: { L: [0.62, -0.78, 0.7, -0.28, -0.25], R: [0.12, -0.08, 0.15, -0.3, 0], head: [0.42, 0.04, 0.06], lean: 0.02 },
    presentR: { L: [0.12, -0.08, 0.15, -0.3, 0], R: [0.62, -0.78, 0.7, -0.28, -0.25], head: [-0.42, 0.04, -0.06], lean: 0.02 },
    chest: { L: [0.13, -0.06, 0.15, -0.25, 0], R: [-0.05, -0.32, -0.9, -1.95, 0.2], head: [0, 0.08, 0.05], lean: 0.02 },
    wave: { L: [0.13, -0.06, 0.15, -0.25, 0], R: [1.05, -0.35, -1.35, -1.55, 0], head: [-0.12, -0.04, -0.08], lean: -0.01 },
    laugh: { L: [0.2, -0.25, 0.4, -0.9, 0], R: [-0.05, -0.32, -0.9, -1.95, 0.2], head: [0.1, -0.2, 0.12], lean: -0.04 },
    think: { L: [0.1, -0.35, -0.6, -1.4, 0], R: [-0.02, -0.55, -0.9, -2.3, 0.3], head: [0.15, 0.12, 0.1], lean: 0.02 },
    hop: { L: [0.5, -0.3, 0.5, -0.6, 0], R: [0.5, -0.3, 0.5, -0.6, 0], head: [0.3, 0.15, 0], lean: 0.05 },
    quiet: { L: [0.1, -0.12, 0.2, -0.5, 0], R: [0.1, -0.12, 0.2, -0.5, 0], head: [0.25, 0.12, 0.04], lean: 0.02 }
  };
  function buildAva() {
    var A = { root: new THREE.Group(), body: new THREE.Group(), mats: [], arms: {}, cur: JSON.parse(JSON.stringify(POSES.rest)), base: 'rest', gest: null, gestT: 0, gestDur: 0, reveal: 0, revealT: 1, op: 1, opT: 1, glitch: 0, flash: 0, look: { x: 0, y: 0 }, pos: V(0, 0, 0), posT: V(0, 0, 0), ry: 0, ryT: 0, s: 1.8, sT: 1.8, hop: 0, tint: new THREE.Color(C_AQUA), tintT: new THREE.Color(C_AQUA) };
    var mat = holoMat(0x3fc3ec, 0xe8fbff, 1, { fill: 0.035, pow: 2.2 }); A.mats.push(mat); A.mat = mat;
    A.root.add(A.body);
    var torso = new THREE.Mesh(loft(AVA_RINGS, 56, 4), mat); A.body.add(torso); A.torso = torso;
    var hp = new THREE.Group(); hp.position.set(0, 1.45, 0.006); A.body.add(hp); A.headP = hp;
    var head = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 30), mat); head.scale.set(0.083, 0.11, 0.097); head.position.set(0, 0.138, 0.012); hp.add(head); A.head = head;
    var hair = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 22, 0, PI2, 0, PI * 0.6), mat); hair.scale.set(0.094, 0.118, 0.106); hair.position.set(0, 0.15, 0.0); hair.rotation.x = -0.42; hp.add(hair);
    var bun = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); bun.scale.set(0.05, 0.046, 0.045); bun.position.set(0, 0.2, -0.088); hp.add(bun);
    var eyeM = new THREE.SpriteMaterial({ map: glowTex(), color: 0xe8fbff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    A.eyes = [-1, 1].map(function (s) { var e = new THREE.Sprite(eyeM); e.scale.set(0.03, 0.022, 1); e.position.set(0.03 * s, 0.148, 0.098); hp.add(e); return e; });
    A.blink = 2;
    [1, -1].forEach(function (side) {
      var sh = new THREE.Group(); sh.position.set(0.166 * side, 1.33, -0.004); sh.rotation.order = 'ZXY'; A.body.add(sh);
      sh.add(new THREE.Mesh(capsule(0.265, 0.041, 0.033, 18), mat));
      var el = new THREE.Group(); el.position.y = -0.265; sh.add(el);
      el.add(new THREE.Mesh(capsule(0.24, 0.032, 0.023, 16), mat));
      var wr = new THREE.Group(); wr.position.y = -0.24; el.add(wr);
      var hand = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), mat); hand.scale.set(0.025, 0.066, 0.014); hand.position.y = -0.055; wr.add(hand);
      A.arms[side > 0 ? 'L' : 'R'] = { sh: sh, el: el, wr: wr, hand: hand, side: side };
    });
    /* AI core: a light in the chest that beats with her voice */
    A.core = sprite(0xe8fbff, 0.22, 0.75); A.core.position.set(0, 1.16, 0.06); A.body.add(A.core);
    /* aura: particles that rise off her surface */
    var R = rng(5), N = 900, ap = new Float32Array(N * 3), as = new Float32Array(N), tp = torso.geometry.attributes.position;
    for (var i = 0; i < N; i++) { var vi = (R() * tp.count) | 0; ap[i * 3] = tp.getX(vi) * 1.04; ap[i * 3 + 1] = tp.getY(vi); ap[i * 3 + 2] = tp.getZ(vi) * 1.04; as[i] = R(); }
    var ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(ap, 3)); ag.setAttribute('aS', new THREE.BufferAttribute(as, 1));
    A.auraMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(C_AQUA) }, uOp: { value: 1 }, uLight: { value: 0 }, uMap: { value: dotTex() }, uScale: { value: 1 }, uReveal: { value: 1 }, uAmp: { value: 0 } },
      vertexShader: 'attribute float aS; uniform float uTime; uniform float uScale; uniform float uReveal; uniform float uAmp; varying float vA; void main(){ float t = fract(uTime*(0.12 + aS*0.18) + aS*7.0); vec3 p = position + vec3(sin(aS*40.0 + uTime)*0.02, t*(0.22 + uAmp*0.15), cos(aS*30.0 + uTime)*0.02); vA = sin(t*3.14159)*step(position.y/1.6, uReveal); vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = (0.012 + aS*0.022)*uScale/(-mv.z); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 uCol; uniform float uOp; uniform float uLight; uniform sampler2D uMap; varying float vA; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); if (uLight > 0.5) gl_FragColor = vec4(uCol*0.45, t.a*vA*uOp*0.8); else gl_FragColor = vec4(uCol*t.rgb, t.a*vA*uOp*0.9); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    A.aura = new THREE.Points(ag, A.auraMat); A.aura.frustumCulled = false; A.body.add(A.aura);
    /* projector base */
    var base = new THREE.Group(); A.root.add(base); A.base3 = base;
    var disc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 64), new THREE.MeshBasicMaterial({ map: glowTex(), color: C_AQUA, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })); disc.rotation.x = -PI / 2; disc.position.y = 0.004; base.add(disc); A.disc = disc;
    A.baseRings = [0.36, 0.44, 0.5].map(function (r, i) { var m = new THREE.Mesh(new THREE.RingGeometry(r - 0.006, r, 96), addMat(C_AQUA, 0.6, THREE.DoubleSide)); m.rotation.x = -PI / 2; m.position.y = 0.006 + i * 0.001; base.add(m); return m; });
    var cone = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 1.9, 48, 1, true), new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(C_AQUA) }, uOp: { value: 0.5 }, uLight: { value: 0 }, uTime: { value: 0 } },
      vertexShader: 'varying float vY; varying vec2 vU; void main(){ vY = position.y/1.9 + 0.5; vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uOp; uniform float uLight; uniform float uTime; varying float vY; varying vec2 vU; void main(){ float a = pow(1.0 - vY, 2.4)*0.16*uOp*(0.8 + 0.2*sin(vU.x*60.0 + uTime*2.0)); if (uLight > 0.5) gl_FragColor = vec4(0.0); else gl_FragColor = vec4(uCol, a); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    cone.position.y = 0.95; base.add(cone); A.cone = cone;
    /* the point of light she unfolds from */
    A.seed = sprite(0xffffff, 0.1, 0); A.seed.position.set(0, 1.16, 0.05); A.root.add(A.seed);
    A.beam = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.8), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0xe8fbff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); A.beam.position.set(0, 0.9, 0.05); A.root.add(A.beam);
    A.materialize = function (dur) { A.reveal = 0; A.revealT = 1; A.revealDur = dur || 2.6; A.formT = 0; sfx.form(); };
    A.gesture = function (name, dur) { if (!POSES[name]) return; A.gest = name; A.gestT = 0; A.gestDur = dur || 2.4; };
    A.setBase = function (name) { if (POSES[name]) A.base = name; };
    A.handWorld = function (side, out) { var a = A.arms[side]; a.hand.updateMatrixWorld(true); return a.hand.getWorldPosition(out); };
    A.headWorld = function (out) { A.head.updateMatrixWorld(true); return A.head.getWorldPosition(out); };
    A.coreWorld = function (out) { A.core.updateMatrixWorld(true); return A.core.getWorldPosition(out); };
    A.update = function (T, dt, amp) {
      /* placement: glide; a big jump makes her dissolve and re-project */
      if (A.pos.distanceTo(A.posT) > 0.9 && A.jump === undefined) { A.jump = 0; }
      if (A.jump !== undefined) { A.jump += dt; if (A.jump < 0.35) A.revealVis = 1 - A.jump / 0.35; else { if (!A.jumped) { A.jumped = true; A.pos.copy(A.posT); A.ry = A.ryT; A.s = A.sT; burst(A.pos.x, A.pos.y + 0.05, A.pos.z, 40, 1.2, 0.8, [C_AQUA, C_WHITE], 1); } A.revealVis = Math.min(1, (A.jump - 0.35) / 0.6); if (A.jump > 0.95) { A.jump = undefined; A.jumped = false; A.revealVis = 1; } } } else A.revealVis = 1;
      A.pos.x = damp(A.pos.x, A.posT.x, 3, dt); A.pos.y = damp(A.pos.y, A.posT.y, 3, dt); A.pos.z = damp(A.pos.z, A.posT.z, 3, dt); A.ry = damp(A.ry, A.ryT, 3, dt); A.s = damp(A.s, A.sT, 3, dt);
      A.hop = Math.max(0, A.hop - dt);
      var hopY = A.hop > 0 ? Math.sin((1 - A.hop / 0.6) * PI) * 0.08 : 0;
      A.root.position.set(A.pos.x, A.pos.y + 0.02 * Math.sin(T * 1.3) + hopY, A.pos.z); A.root.rotation.y = A.ry; A.root.scale.setScalar(A.s);
      /* forming from a point of light */
      if (A.formT !== undefined) {
        A.formT += dt; var ft = A.formT, d = A.revealDur;
        A.seed.material.opacity = win(ft, 0, 0.25) * (1 - win(ft, d * 0.55, d * 0.8)); A.seed.scale.setScalar(0.1 + 0.5 * win(ft, 0, 0.6) + 0.15 * Math.sin(ft * 20));
        A.beam.material.opacity = win(ft, 0.35, 0.6) * (1 - win(ft, d * 0.6, d)); A.beam.scale.set(1, 0.05 + win(ft, 0.35, 0.9), 1);
        A.reveal = eIO(win(ft, 0.6, d)); if (ft > d + 0.2) { A.formT = undefined; A.reveal = 1; }
      }
      /* pose blending */
      var target = POSES[A.gest || A.base] || POSES.rest; if (A.gest) { A.gestT += dt; if (A.gestT > A.gestDur) A.gest = null; }
      var k = 1 - Math.exp(-dt * 5.5);
      ['L', 'R'].forEach(function (s) { for (var i = 0; i < 5; i++) A.cur[s][i] += (target[s][i] - A.cur[s][i]) * k; });
      for (var i = 0; i < 3; i++) A.cur.head[i] += (target.head[i] - A.cur.head[i]) * k; A.cur.lean += (target.lean - A.cur.lean) * k;
      var talk = amp, waveOsc = A.gest === 'wave' ? Math.sin(T * 9) * 0.35 : 0;
      ['L', 'R'].forEach(function (s) {
        var a = A.arms[s], p = A.cur[s], sd = a.side, breath = 0.015 * Math.sin(T * 1.3 + (sd > 0 ? 0 : 1.5)), gest = talk * 0.06 * Math.sin(T * 3.1 + sd);
        a.sh.rotation.set(p[1] + breath + gest, p[2] * sd, (p[0] + breath * 0.5) * sd);
        a.el.rotation.set(p[3] + (s === 'R' ? waveOsc : 0) + gest * 1.5, 0, 0); a.wr.rotation.set(p[4], 0, (s === 'R' ? waveOsc * 0.6 : 0));
      });
      /* head: pose, look toward the visitor's touch, nod with speech */
      A.look.x = damp(A.look.x, par.x * 0.35, 2, dt); A.look.y = damp(A.look.y, par.y * 0.18, 2, dt);
      A.headP.rotation.set(A.cur.head[1] + A.look.y + talk * 0.05 * Math.sin(T * 6.3) + 0.012 * Math.sin(T * 0.9), A.cur.head[0] + A.look.x + 0.03 * Math.sin(T * 0.5), A.cur.head[2] + 0.02 * Math.sin(T * 0.7));
      A.body.rotation.set(A.cur.lean, 0.04 * Math.sin(T * 0.4), 0.012 * Math.sin(T * 0.8)); A.body.scale.set(1, 1 + 0.004 * Math.sin(T * 1.3), 1);
      A.blink -= dt; var bl = 1; if (A.blink < 0) { bl = Math.abs(A.blink) < 0.07 ? 0.15 : 1; if (A.blink < -0.14) A.blink = 2.5 + Math.random() * 3; } A.eyes.forEach(function (e) { e.scale.y = 0.022 * bl; e.material.opacity = (LT ? 0 : 0.8) * A.op; });
      /* materials */
      A.op = damp(A.op, A.opT, 2.5, dt); A.glitch = Math.max(0, A.glitch - dt * 1.6); A.flash = Math.max(0, A.flash - dt * 2);
      A.tint.lerp(A.tintT, Math.min(1, dt * 2.5));
      A.root.updateMatrixWorld(true); var y0 = A.root.position.y, y1 = y0 + 1.72 * A.s, rv = Math.min(A.reveal, A.revealVis);
      A.mats.forEach(function (m) { var u = m.uniforms; u.uTime.value = T; u.uReveal.value = rv; u.uY0.value = y0; u.uY1.value = y1; u.uAmp.value = amp; u.uOp.value = A.op * 0.5; u.uGlitch.value = A.glitch + (RM ? 0 : 0.04 * (Math.random() < 0.01 ? 1 : 0)); u.uFlash.value = A.flash; u.uCol.value.copy(A.tint); });
      A.auraMat.uniforms.uTime.value = T; A.auraMat.uniforms.uReveal.value = rv; A.auraMat.uniforms.uAmp.value = amp; A.auraMat.uniforms.uOp.value = A.op * 0.55; A.auraMat.uniforms.uScale.value = 1500; A.auraMat.uniforms.uCol.value.copy(A.tint);
      A.core.material.opacity = (0.2 + 0.45 * amp + 0.08 * Math.sin(T * 2)) * rv * A.op; A.core.scale.setScalar(0.16 + amp * 0.14 + 0.02 * Math.sin(T * 2.2)); A.core.material.color.copy(A.tint).lerp(new THREE.Color(1, 1, 1), 0.6);
      A.disc.material.color.copy(A.tint); A.disc.material.opacity = (0.45 + 0.25 * amp) * A.op; A.baseRings.forEach(function (r, i) { r.material.color.copy(A.tint); r.material.opacity = (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(T * 1.8 - i))) * A.op; r.scale.setScalar(1 + 0.04 * Math.sin(T * 1.8 - i)); });
      A.cone.material.uniforms.uTime.value = T; A.cone.material.uniforms.uOp.value = 0.35 * rv * A.op; A.cone.material.uniforms.uCol.value.copy(A.tint);
      if (LT) { A.disc.material.color.multiplyScalar(0.55); A.baseRings.forEach(function (r) { r.material.color.multiplyScalar(0.55); }); }
    };
    return A;
  }

  /* ---------- people, robots and props for the dioramas ---------- */
  var FIG_G = null;
  function figGeo() {
    if (FIG_G) return FIG_G;
    FIG_G = {
      body: loft([[0.3, 0.09, 0.07, 0], [0.4, 0.105, 0.075, 0], [0.55, 0.11, 0.07, 0.005], [0.63, 0.12, 0.065, 0], [0.67, 0.07, 0.05, 0], [0.7, 0.035, 0.035, 0]], 20, 3),
      head: new THREE.SphereGeometry(0.068, 18, 14), leg: capsule(0.27, 0.035, 0.028, 10), arm: capsule(0.24, 0.026, 0.02, 8),
      bag: new THREE.BoxGeometry(0.15, 0.2, 0.08), handle: new THREE.BoxGeometry(0.012, 0.09, 0.012)
    };
    return FIG_G;
  }
  function buildFigure(color, opts) {
    opts = opts || {}; var G = figGeo(), f = { g: new THREE.Group(), body: new THREE.Group(), mat: holoMat(color, opts.top || 0xffffff, 1, { fill: 0.12, pow: 1.6 }), legs: [], arms: [], walk: 0, op: 1 };
    f.g.add(f.body); f.body.add(new THREE.Mesh(G.body, f.mat)); var hd = new THREE.Mesh(G.head, f.mat); hd.position.y = 0.78; f.body.add(hd); f.head = hd;
    [-1, 1].forEach(function (s) { var hip = new THREE.Group(); hip.position.set(0.048 * s, 0.31, 0); hip.add(new THREE.Mesh(G.leg, f.mat)); f.body.add(hip); f.legs.push(hip); var sh = new THREE.Group(); sh.position.set(0.125 * s, 0.62, 0); sh.rotation.z = 0.12 * s; sh.add(new THREE.Mesh(G.arm, f.mat)); f.body.add(sh); f.arms.push(sh); });
    if (opts.bag) { var bag = new THREE.Group(); var b = new THREE.Mesh(G.bag, f.mat); b.position.y = 0.11; bag.add(b); var hn = new THREE.Mesh(G.handle, f.mat); hn.position.y = 0.25; bag.add(hn); bag.position.set(0.2, 0, 0.02); f.g.add(bag); f.bag = bag; }
    f.setOp = function (a) { f.op = a; f.mat.uniforms.uOp.value = a; f.g.visible = a > 0.01; };
    f.animate = function (T, dt, walking) { f.walk = damp(f.walk, walking ? 1 : 0, 6, dt); var w = f.walk, ph = T * 7 + (f.phase || 0); f.legs[0].rotation.x = Math.sin(ph) * 0.5 * w; f.legs[1].rotation.x = -Math.sin(ph) * 0.5 * w; f.arms[0].rotation.x = -Math.sin(ph) * 0.4 * w; f.arms[1].rotation.x = Math.sin(ph) * 0.4 * w; f.body.position.y = Math.abs(Math.sin(ph)) * 0.02 * w + 0.006 * Math.sin(T * 1.5 + (f.phase || 0)); f.mat.uniforms.uTime.value = T; };
    return f;
  }
  function buildRobot() {
    var R = { g: new THREE.Group(), arms: {}, legs: [], on: 0, onT: 0, wave: 0, walk: 0 };
    var white = new THREE.MeshStandardMaterial({ color: 0xe9eef2, roughness: 0.32, metalness: 0.25 }), dark = new THREE.MeshStandardMaterial({ color: 0x141a1e, roughness: 0.2, metalness: 0.65 });
    R.glow = new THREE.MeshBasicMaterial({ color: C_LIME }); R.white = white;
    var pel = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), white); pel.scale.set(0.105, 0.07, 0.08); pel.position.y = 0.5; R.g.add(pel);
    var torso = new THREE.Mesh(loft([[0.52, 0.1, 0.07, 0], [0.62, 0.13, 0.08, 0.005], [0.74, 0.165, 0.095, 0.01], [0.82, 0.17, 0.09, 0.005], [0.86, 0.12, 0.07, 0], [0.88, 0.04, 0.04, 0]], 28, 3), white); R.g.add(torso);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 32), R.glow); ring.position.set(0, 0.74, 0.106); R.g.add(ring); R.ring = ring;
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.06, 12), dark); neck.position.y = 0.89; R.g.add(neck);
    var hp = new THREE.Group(); hp.position.y = 0.91; R.g.add(hp); R.headP = hp;
    var head = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), white); head.scale.set(0.09, 0.105, 0.098); head.position.y = 0.1; hp.add(head);
    var visor = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16, -PI * 0.36, PI * 0.72, PI * 0.3, PI * 0.32), dark); visor.scale.set(0.094, 0.108, 0.101); visor.position.y = 0.1; hp.add(visor);
    R.eyes = [-1, 1].map(function (s) { var e = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), R.glow); e.position.set(0.032 * s, 0.112, 0.097); hp.add(e); return e; });
    [1, -1].forEach(function (s) {
      var sh = new THREE.Group(); sh.position.set(0.19 * s, 0.82, 0); sh.rotation.order = 'ZXY'; R.g.add(sh);
      var jnt = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), dark); sh.add(jnt); sh.add(new THREE.Mesh(capsule(0.2, 0.036, 0.031, 12), white));
      var el = new THREE.Group(); el.position.y = -0.2; sh.add(el); el.add(new THREE.Mesh(new THREE.SphereGeometry(0.033, 12, 8), dark)); el.add(new THREE.Mesh(capsule(0.19, 0.03, 0.026, 12), white));
      var hand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), dark); hand.position.y = -0.22; el.add(hand);
      R.arms[s > 0 ? 'L' : 'R'] = { sh: sh, el: el, hand: hand, side: s };
      var hip = new THREE.Group(); hip.position.set(0.07 * s, 0.47, 0); R.g.add(hip); hip.add(new THREE.Mesh(capsule(0.22, 0.046, 0.038, 12), white));
      var kn = new THREE.Group(); kn.position.y = -0.22; hip.add(kn); kn.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), dark)); kn.add(new THREE.Mesh(capsule(0.2, 0.038, 0.032, 12), white));
      var foot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.035, 0.14), dark); foot.position.set(0, -0.225, 0.03); kn.add(foot); R.legs.push({ hip: hip, kn: kn });
    });
    R.animate = function (T, dt) {
      R.on = damp(R.on, R.onT, 2.2, dt); var on = R.on, wv = R.wave > 0 ? 1 : 0; R.wave = Math.max(0, R.wave - dt);
      R.walk = R.walk || 0; var wk = R.walk, ph = T * 6;
      R.glow.color.setRGB(0.53 * (0.15 + 0.85 * on), 0.92 * (0.15 + 0.85 * on), 0.13 * (0.15 + 0.85 * on)); if (LT) R.glow.color.multiplyScalar(0.7);
      R.headP.rotation.set(lerp(0.32, 0, on) + 0.02 * Math.sin(T), 0.15 * Math.sin(T * 0.4) * on, 0);
      var L = R.arms.L, Rr = R.arms.R;
      L.sh.rotation.set(-Math.sin(ph) * 0.35 * wk, 0, lerp(0.05, 0.12, on)); L.el.rotation.x = -0.25 * on - 0.2 * wk;
      Rr.sh.rotation.set(lerp(0, -0.25, wv) + Math.sin(ph) * 0.35 * wk, lerp(0, -1.2, wv) * -1, -lerp(0.05, 1.15, wv)); Rr.el.rotation.set(lerp(-0.25 * on, -1.5, wv) + wv * 0.35 * Math.sin(T * 9), 0, 0);
      R.legs[0].hip.rotation.x = Math.sin(ph) * 0.45 * wk; R.legs[1].hip.rotation.x = -Math.sin(ph) * 0.45 * wk; R.legs[0].kn.rotation.x = Math.max(0, -Math.sin(ph)) * 0.6 * wk; R.legs[1].kn.rotation.x = Math.max(0, Math.sin(ph)) * 0.6 * wk;
      R.g.position.y = (R.baseY || 0) + Math.abs(Math.sin(ph)) * 0.015 * wk;
    };
    return R;
  }

  /* ================= chapters ================= */
  function base(i) {
    var g = new THREE.Group(); g.visible = false; scene.add(g);
    return { i: i, def: CH[i], group: g, anchors: [], update: function () {}, enter: function () {}, leave: function () {}, select: function () {}, deselect: function () {}, act: function (done) { if (done) done(); }, vis: 0 };
  }
  function anchorOf(obj, off) { return function (out) { obj.updateMatrixWorld(true); out.set(off ? off[0] : 0, off ? off[1] : 0, off ? off[2] : 0); return obj.localToWorld(out); }; }
  function billboard(o) { o.quaternion.copy(camera.quaternion); }

  /* ---------- 1. Meet Ava ---------- */
  function buildMeet() {
    var M = base(0), g = M.group;
    M.ava = { p: [0, 0, 0], ry: 0, s: 1.82, pose: 'rest' }; M.cam = { p: [0, 1.95, 9.2], l: [0, 1.32, 0] };
    var names = ['key', 'pin', 'calendar', 'heart'], cols = [C_GOLD, C_AQUA, C_ICE, 0xff8fa3];
    M.tiles = names.map(function (n, i) {
      var t = new THREE.Group(), fr = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), iconMat(n, cols[i], true)); t.add(fr);
      var glow = sprite(cols[i], 1.0, 0.25); glow.position.z = -0.02; t.add(glow); g.add(t);
      return { g: t, mat: fr.material, glow: glow, a0: i / 4 * PI2 + 0.4, y: [2.75, 1.7, 2.25, 1.25][i], pop: 0, sel: 0, col: cols[i] };
    });
    M.orbit = 0;
    M.anchors = [function (out) { ava.headWorld(out); out.x += 0.42; out.y -= 0.05; return out; }, anchorOf(M.tiles[3].g), anchorOf(M.tiles[2].g)];
    M.select = function (i) {
      if (i === 0) { ava.gesture('chest', 3.4); ava.flash = 1; ava.glitch = 0.6; ava.headWorld(tmpV); burstV(tmpV, 60, 1.2, 1.1, [C_AQUA, C_WHITE]); }
      if (i === 1) { ava.gesture('open', 3.6); M.tiles[3].pop = 1; M.tiles[3].g.getWorldPosition(tmpV); burstV(tmpV, 80, 1.6, 1.2, [0xff8fa3, C_GOLD, C_WHITE]); ringAt(tmpV, 0xff8fa3, 1.2); }
      if (i === 2) { ava.gesture('laugh', 3.2); M.tiles[2].pop = 1; M.tiles[2].g.getWorldPosition(tmpV); burstV(tmpV, 60, 1.4, 1, [C_ICE, C_WHITE]); }
    };
    M.act = function (done) { ava.gesture('wave', 3.4); var gv = C.greet[(Math.random() * C.greet.length) | 0]; say('Ava', gv.text, gv.clip, { then: done }); };
    M.update = function (T, dt) {
      M.orbit += dt * 0.16;
      M.tiles.forEach(function (t, i) {
        var a = t.a0 + M.orbit, focus = (sel === 1 && i === 3) || (sel === 2 && i === 2); t.sel = damp(t.sel, focus ? 1 : 0, 3, dt); t.pop = Math.max(0, t.pop - dt * 1.4);
        var x = Math.sin(a) * 1.22, z = Math.cos(a) * 0.75, y = t.y + 0.08 * Math.sin(T * 0.9 + i * 1.7);
        t.g.position.set(lerp(x, 0.98, t.sel), lerp(y, 2.15, t.sel), lerp(z, 0.95, t.sel)); billboard(t.g); t.g.rotateZ(0.08 * Math.sin(T * 0.7 + i));
        var front = 0.55 + 0.45 * (Math.cos(a) * 0.5 + 0.5); t.g.scale.setScalar((0.82 + 0.25 * front) * (1 + 0.45 * t.sel) * (1 + 0.25 * Math.sin(t.pop * PI)) * M.vis);
        t.mat.opacity = (0.45 + 0.55 * Math.max(front, t.sel)) * M.vis; t.glow.material.opacity = (0.12 + 0.35 * t.sel + 0.3 * t.pop) * M.vis;
      });
    };
    return M;
  }

  /* ---------- 2. Rush hour: the queue, the clock, the stretched desk ---------- */
  function buildRush() {
    var M = base(1), g = M.group;
    M.ava = { p: [-0.98, 0, 1.55], ry: 0.55, s: 1.05, pose: 'rest' }; M.cam = { p: [0.2, 4.5, 8.4], l: [0.15, 0.95, -0.3] };
    var floor = rrLine(3.6, 3.0, 0.3, C_ORANGE, 0.35); floor.rotation.x = -PI / 2; floor.position.set(0.35, 0.004, -0.45); g.add(floor);
    var desk = holoBox(1.55, 0.42, 0.42, C_ORANGE, 0.1); desk.position.set(0.8, 0.21, -1.42); desk.rotation.y = -0.12; g.add(desk); M.desk = desk;
    var mon = iconPlane('cpu', 0.28, C_ICE); mon.position.set(0.55, 0.62, -1.42); g.add(mon); M.mon = mon;
    M.papers = []; for (var p = 0; p < 6; p++) { var sh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), addMat(0xfff4e0, 0.5, THREE.DoubleSide)); sh.rotation.x = -PI / 2; sh.position.set(0.22, 0.43 + p * 0.012, -1.4); sh.userData.base = sh.position.clone(); g.add(sh); M.papers.push(sh); }
    var agent = buildFigure(0xfff0d6, { top: 0xffffff }); agent.g.position.set(0.95, 0, -1.82); agent.g.scale.setScalar(0.95); g.add(agent.g); M.agent = agent;
    M.tasks = ['phone', 'key', 'calendar', 'bell', 'luggage'].map(function (n, i) { var ic = iconPlane(n, 0.2, C_ORANGE); g.add(ic); return { m: ic, a: i / 5 * PI2 }; });
    M.clock = (function () {
      var cg = new THREE.Group(), face = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), addMat(C_ORANGE, 0.08)); cg.add(face);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.012, 8, 64), addMat(C_ORANGE, 0.95)); cg.add(rim);
      for (var t = 0; t < 12; t++) { var tk = new THREE.Mesh(new THREE.PlaneGeometry(0.014, t % 3 ? 0.04 : 0.07), addMat(C_ORANGE, 0.9)); var a = t / 12 * PI2; tk.position.set(Math.sin(a) * 0.29, Math.cos(a) * 0.29, 0.002); tk.rotation.z = -a; cg.add(tk); }
      function hand(len, w, col) { var hg = new THREE.Group(); var hm = new THREE.Mesh(new THREE.PlaneGeometry(w, len), addMat(col, 1)); hm.position.y = len / 2; hg.add(hm); hg.position.z = 0.004; cg.add(hg); return hg; }
      var hh = hand(0.17, 0.026, C_WHITE), mh = hand(0.25, 0.018, C_WHITE), sh2 = hand(0.27, 0.007, C_ORANGE);
      cg.position.set(0.85, 2.1, -1.55); g.add(cg);
      return { g: cg, rim: rim, face: face, hh: hh, mh: mh, sh: sh2, h: 3, m: 5, ht: 3, mt: 5 };
    })();
    /* stanchion lanes and the queue */
    var lanes = [[1.35, -0.78, -0.45, -0.78], [-0.45, -0.18, 1.35, -0.18], [1.35, 0.42, 0.25, 0.42]];
    lanes.forEach(function (l) { var n = 5; for (var s = 0; s <= n; s++) { var x = lerp(l[0], l[2], s / n), z = l[1] + 0.28; var post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), addMat(C_ICE, 0.6)); post.position.set(x, 0.16, z); g.add(post); } var tape = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(l[0], 0.3, l[1] + 0.28), V(l[2], 0.3, l[3] + 0.28)]), lineMat(C_ORANGE, 0.55)); g.add(tape); });
    var path = [V(0.7, 0, -0.95), V(0.15, 0, -0.95), V(-0.35, 0, -0.95), V(-0.35, 0, -0.42), V(0.15, 0, -0.42), V(0.7, 0, -0.42), V(1.2, 0, -0.42), V(1.2, 0, 0.18), V(0.7, 0, 0.18), V(0.2, 0, 0.18)];
    var gc = [0x3fc3ec, 0xa0dcff, 0x86eb22, 0xffffff, 0x3fc3ec, 0xc8f56a, 0xa0dcff, 0xffffff, 0x00a3e0, 0x86eb22];
    M.guests = path.map(function (p, i) { var f = buildFigure(gc[i], { bag: true }); f.home = p.clone(); f.g.position.copy(p); f.g.rotation.y = i < 3 ? -PI / 2 : (i < 7 ? PI / 2 : -PI / 2); if (i === 3 || i === 7) f.g.rotation.y = PI; f.phase = i * 1.3; f.g.scale.setScalar(0.92); g.add(f.g); f.stress = sprite(C_ORANGE, 0.16, 0.8); f.stress.position.set(p.x, 1.02, p.z); g.add(f.stress); return f; });
    M.night = 0; M.nightT = 0; M.calm = 0; M.calmT = 0; M.sys = 0; M.actT = -1;
    M.lateGuest = buildFigure(0xa0dcff, { bag: true }); M.lateGuest.g.position.set(-1.6, 0, 0.6); M.lateGuest.setOp(0); g.add(M.lateGuest.g);
    M.anchors = [anchorOf(agent.head), anchorOf(M.clock.g), function (out) { out.set(0.22, 0.5, -1.4); return g.localToWorld(out); }];
    M.enter = function () { M.night = M.nightT = 0; M.calm = M.calmT = 0; M.actT = -1; M.sys = 0; M.guests.forEach(function (f) { f.g.position.copy(f.home); f.setOp(1); }); M.clock.ht = 3; M.clock.mt = 5; };
    M.select = function (i) {
      M.nightT = i === 1 ? 1 : 0; M.clock.ht = i === 1 ? 2 : (M.calmT ? 3 : 3); M.clock.mt = i === 1 ? 0 : 5; if (i === 1) { M.lateT = 0; ava.gesture('think', 3); }
      if (i === 0) { ava.gesture('presentL', 3); sfx.stress(); M.agent.head.getWorldPosition(tmpV); ringAt(tmpV, C_ORANGE, 0.6); }
      if (i === 2) { M.sys = 1; ava.gesture('presentL', 3); sfx.stress(); }
    };
    M.deselect = function () { M.nightT = 0; M.clock.ht = 3; M.clock.mt = 5; };
    M.act = function (done) { M.nightT = 0; M.actT = 0; M.calmT = 1; ava.gesture('open', 4); sfx.calm(); say(M.def.act, M.def.actLine, 'rush-act', { then: done }); M.clock.ht = 3; M.clock.mt = 5; };
    M.update = function (T, dt) {
      M.night = damp(M.night, M.nightT, 2, dt); M.calm = damp(M.calm, M.calmT, 1.5, dt); var vis = M.vis;
      var stressCol = new THREE.Color(C_ORANGE).lerp(new THREE.Color(C_LIME), M.calm);
      desk.userData.edges.material.color.copy(stressCol).multiplyScalar(LT ? 0.55 : 1); desk.userData.fill.material.color.copy(stressCol).multiplyScalar(LT ? 0.55 : 1);
      var sinkT = M.calm; desk.scale.set(1, 1 - 0.75 * sinkT, 1); desk.position.y = 0.21 * (1 - 0.75 * sinkT); setOp(desk.userData.edges.material, (0.85 - 0.5 * sinkT) * vis); setOp(desk.userData.fill.material, (0.1 - 0.05 * sinkT) * vis);
      if (M.sys > 0) { M.sys = Math.max(0, M.sys - dt / 4); var gl = Math.random() < 0.3 ? 1 : 0.4; setOp(desk.userData.edges.material, gl * vis); }
      M.papers.forEach(function (s, k) { var fly = M.sys > 0 ? Math.sin((1 - M.sys) * PI) : 0; s.position.set(s.userData.base.x + fly * Math.sin(k * 2 + T * 2) * 0.35, s.userData.base.y + fly * (0.4 + k * 0.12), s.userData.base.z + fly * Math.cos(k * 3 + T) * 0.2); s.rotation.set(-PI / 2 + fly * Math.sin(T * 3 + k), fly * k * 0.5, fly * Math.cos(T * 2 + k)); setOp(s.material, (0.5 - 0.35 * M.calm) * vis); });
      /* agent juggling tasks */
      var busy = (1 - M.calm), sp = 1.4 + M.night * 1.2 + (sel === 0 ? 1.8 : 0); M.agent.animate(T, dt, false); M.agent.head.position.y = 0.78 + 0.01 * Math.sin(T * 9) * busy;
      M.tasks.forEach(function (t, k) { var a = t.a + T * sp, show = k < 3 || M.night > 0.5 ? 1 : 0; t.m.position.set(0.95 + Math.cos(a) * 0.32, 1.02 + 0.18 * Math.sin(a * 1.3) + k * 0.02, -1.82 + Math.sin(a) * 0.22); billboard(t.m); setOp(t.m.material, 0.85 * busy * show * vis); t.m.material.color.setHex(C_ORANGE); if (LT) t.m.material.color.multiplyScalar(0.55); });
      M.mon.position.y = 0.62 - 0.2 * M.calm; billboard(M.mon); setOp(M.mon.material, (0.8 - 0.6 * M.calm) * vis);
      /* clock */
      var ck = M.clock; ck.h = damp(ck.h, ck.ht, 2, dt); ck.m = damp(ck.m, ck.mt, 2, dt); billboard(ck.g); ck.g.scale.setScalar(vis * (1 + 0.05 * Math.sin(T * 6) * busy * (1 - M.night)));
      ck.hh.rotation.z = -((ck.h % 12) + ck.m / 60) / 12 * PI2; ck.mh.rotation.z = -ck.m / 60 * PI2; ck.sh.rotation.z = -Math.floor(T) / 60 * PI2 * 6;
      ck.rim.material.color.copy(stressCol).lerp(new THREE.Color(0x5a7dff), M.night * (1 - M.calm)); if (LT) ck.rim.material.color.multiplyScalar(0.55);
      /* queue: shuffles while stressed, dissolves to the lifts on Anticipate, empties at 2 AM */
      if (M.actT >= 0) M.actT += dt;
      M.guests.forEach(function (f, k) {
        var leave = M.actT >= 0 ? win(M.actT, 0.6 + k * 0.16, 1.9 + k * 0.16) : 0;
        if (M.actT >= 0 && leave > 0 && !f.left) { f.left = true; burst(f.g.position.x, 0.5, f.g.position.z, 20, 0.9, 0.8, [C_LIME, C_WHITE], 0.6); ringAt(V(f.g.position.x, 0.45, f.g.position.z).applyMatrix4(g.matrixWorld), C_LIME, 0.5); }
        if (M.actT < 0) f.left = false;
        var tx = lerp(f.home.x, 1.9, eIO(leave)), tz = lerp(f.home.z, -0.9, eIO(leave)); f.g.position.x = tx; f.g.position.z = tz; if (leave > 0 && leave < 1) f.g.rotation.y = Math.atan2(1.9 - f.home.x, -0.9 - f.home.z);
        f.animate(T, dt, leave > 0 && leave < 1); f.setOp(vis * (1 - leave) * (1 - M.night));
        f.stress.position.set(f.g.position.x, 1.0 + 0.04 * Math.sin(T * 5 + k), f.g.position.z); f.stress.material.opacity = (k % 3 === 0 ? 1 : 0.4) * (0.4 + 0.6 * Math.abs(Math.sin(T * 3 + k))) * vis * (1 - leave) * (1 - M.night) * (1 - M.calm);
      });
      /* 2 AM: one tired guest */
      var lg = M.lateGuest; if (M.nightT > 0.5) { M.lateT = (M.lateT || 0) + dt; var w = win(M.lateT, 0.3, 4.5); lg.g.position.set(lerp(-1.6, 0.55, eIO(w)), 0, lerp(0.6, -0.95, eIO(w))); lg.g.rotation.y = Math.atan2(2.15, -1.55); lg.animate(T * 0.6, dt, w < 1); } lg.setOp(M.night * vis);
      accTgt.set(M.night > 0.5 ? '#5a7dff' : (M.calm > 0.5 ? '#86eb22' : ACC[1]));
    };
    return M;
  }

  /* ---------- 3. Five ideas ---------- */
  function buildVision() {
    var M = base(2), g = M.group;
    M.ava = { p: [0, 0, 0], ry: 0, s: 1.62, pose: 'rest' }; M.cam = { p: [0, 2.35, 9.0], l: [0, 1.4, 0] };
    var names = ['radar', 'bot', 'waves', 'fingerprint', 'handheart'], cols = [C_AQUA, C_ICE, C_BLUE, C_LIME, C_GOLD];
    var orbit = new THREE.Group(); orbit.position.y = 1.55; orbit.rotation.x = 0.22; g.add(orbit); M.orbitG = orbit;
    var ringL = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.006, 6, 160), addMat(C_LIME, 0.5)); ringL.rotation.x = PI / 2; orbit.add(ringL); M.ringL = ringL;
    M.meds = names.map(function (n, i) {
      var m = new THREE.Group(); orbit.add(m);
      var disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 48), new THREE.MeshBasicMaterial({ map: glowTex(), color: cols[i], transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); m.add(disc);
      var ic = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), iconMat(n, cols[i], 'circle')); ic.position.z = 0.01; m.add(ic);
      var halo = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.375, 64, 1, 0, PI * 1.4), addMat(cols[i], 0.8, THREE.DoubleSide)); m.add(halo);
      return { g: m, ic: ic, disc: disc, halo: halo, a: i / 5 * PI2, lit: 0, litT: 0, pop: 0, col: cols[i] };
    });
    M.crown = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.012, 8, 96), addMat(C_LIME, 0)); M.crown.rotation.x = PI / 2; M.crown.position.y = 3.35; g.add(M.crown);
    M.beam = progLine([V(0, 2.1, 0.1), V(0.4, 2.2, 0.5), V(0.9, 1.9, 0.9)], C_LIME, 0.9, 40); g.add(M.beam);
    M.spin = 0; M.spinT = null; M.crownT = 0; M.crownV = 0;
    M.anchors = M.meds.map(function (m) { return anchorOf(m.g); });
    M.enter = function () { M.meds.forEach(function (m, i) { m.lit = 0; m.litT = 0; m.pop = 0; m.intro = -i * 0.18; }); M.crownT = 0; M.crownV = 0; };
    M.select = function (i) { var m = M.meds[i]; m.litT = 1; m.pop = 1; sfx.rise(i); M.spinT = -m.a + 0.55; while (M.spinT - M.spin > PI) M.spinT -= PI2; while (M.spinT - M.spin < -PI) M.spinT += PI2; ava.gesture(i % 2 ? 'presentR' : 'presentL', 3.2); setTimeout(function () { m.g.getWorldPosition(tmpV); burstV(tmpV, 70, 1.3, 1.1, [m.col, C_WHITE]); ringAt(tmpV, m.col, 0.9); }, 650); M.beamT = 0; };
    M.deselect = function () { M.spinT = null; M.beamT = -1; };
    M.act = function (done) {
      ava.setBase('rest'); M.spinT = null; M.beamT = -1;
      M.meds.forEach(function (m, i) { setTimeout(function () { if (cur !== 2) return; m.litT = 1; m.pop = 1; sfx.rise(i); m.g.getWorldPosition(tmpV); burstV(tmpV, 40, 1.1, 0.9, [m.col, C_WHITE]); }, 300 + i * 480); });
      setTimeout(function () { if (cur !== 2) return; M.crownT = 1; ava.gesture('open', 3.4); ava.flash = 1; sfx.ready(); burst(0, 3.3, 0, 140, 2.2, 1.4, [C_LIME, C_GOLD, C_WHITE, C_AQUA]); kick = 1.4; }, 300 + 5 * 480 + 200);
      setTimeout(function () { if (done) done(); }, 300 + 5 * 480 + 2200);
    };
    M.update = function (T, dt) {
      if (M.spinT === null) M.spin += dt * 0.18; else M.spin = damp(M.spin, M.spinT, 3, dt);
      M.meds.forEach(function (m, i) {
        m.intro = Math.min(1, (m.intro || 0) + dt * 1.3); var iv = eBack(Math.max(0, m.intro));
        var a = m.a + M.spin, isSel = sel === i; m.lit = damp(m.lit, m.litT, 3, dt); m.pop = Math.max(0, m.pop - dt * 1.2);
        m.g.position.set(Math.sin(a) * 1.62, 0.1 * Math.sin(T * 1.1 + i), Math.cos(a) * 1.62); m.g.quaternion.copy(orbit.quaternion).invert().multiply(camera.quaternion);
        var front = Math.cos(a) * 0.5 + 0.5; m.g.scale.setScalar(iv * M.vis * (0.75 + 0.3 * front) * (1 + 0.5 * (isSel ? 1 : 0) * eO(1 - m.pop * 0.5)) * (1 + 0.2 * Math.sin(m.pop * PI)));
        var on = Math.max(m.lit, isSel ? 1 : 0); setOp(m.ic.material, (0.35 + 0.65 * Math.max(front, on)) * M.vis); m.disc.material.opacity = (0.15 + 0.6 * on) * M.vis; m.halo.rotation.z = T * (0.6 + on * 2) + i; setOp(m.halo.material, (0.2 + 0.7 * on) * M.vis);
      });
      setOp(M.ringL.material, (0.25 + 0.4 * M.crownV) * M.vis);
      M.crownV = damp(M.crownV, M.crownT, 2, dt); M.crown.scale.setScalar(0.2 + 0.8 * eO(M.crownV)); setOp(M.crown.material, M.crownV * M.vis * (0.7 + 0.3 * Math.sin(T * 3))); M.crown.rotation.z = T;
      if (sel >= 0 && M.beamT !== undefined && M.beamT >= 0) {
        M.beamT += dt; var m = M.meds[sel]; ava.coreWorld(tmpV); m.g.getWorldPosition(tmpV2); var mid = tmpV.clone().lerp(tmpV2, 0.5); mid.y += 0.3;
        M.beam.geometry.dispose(); var nb = progLine([tmpV.clone(), mid, tmpV2.clone()], m.col, 0.9, 40); M.beam.geometry = nb.geometry; M.beam.material.uniforms.uP.value = eO(win(M.beamT, 0.2, 0.9)); M.beam.material.uniforms.uCol.value.setHex(m.col); M.beam.visible = true;
      } else M.beam.visible = false;
      M.beam.material.uniforms.uTime.value = T; M.beam.material.uniforms.uOp.value = M.vis;
    };
    return M;
  }

  /* ---------- 4. Six skills ---------- */
  function buildSkills() {
    var M = base(3), g = M.group;
    M.ava = { p: [0, 0, 0.55], ry: 0, s: 1.36, pose: 'rest' }; M.cam = { p: [0, 2.4, 10.2], l: [0, 1.9, 0] };
    var names = ['languages', 'key', 'route', 'bell', 'smile', 'handshake'], cols = [C_AQUA, C_GOLD, C_LIME, C_ICE, 0xff8fa3, C_GREEN];
    var ang = [165, 133, 101, 79, 47, 15];
    M.tiles = names.map(function (n, i) {
      var a = ang[i] * PI / 180, t = new THREE.Group(); t.position.set(Math.cos(a) * 1.28, 2.0 + Math.sin(a) * 1.5, -0.35); g.add(t);
      var fr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), iconMat(n, cols[i], true)); t.add(fr);
      var gl = sprite(cols[i], 0.9, 0.2); gl.position.z = -0.03; t.add(gl);
      return { g: t, fr: fr, gl: gl, home: t.position.clone(), col: cols[i], on: 0, intro: -i * 0.12 };
    });
    M.anchors = M.tiles.map(function (t) { return anchorOf(t.g); });
    /* demo props */
    M.bubbles = [0, 1, 2, 3].map(function (k) { var b = iconPlane('languages', 0.3, [C_AQUA, C_GOLD, C_LIME, 0xff8fa3][k], 'circle'); g.add(b); return b; });
    M.badge = iconPlane('badge', 0.34, C_LIME); g.add(M.badge);
    M.card = new THREE.Group(); var cb = holoBox(0.34, 0.22, 0.02, C_GOLD, 0.25); M.card.add(cb); var strip = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.04), addMat(C_GOLD, 0.8)); strip.position.set(0, 0.05, 0.012); M.card.add(strip); g.add(M.card);
    M.phone = new THREE.Group(); var pb = holoBox(0.24, 0.44, 0.03, C_ICE, 0.12); M.phone.add(pb); M.screen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.38), addMat(C_LIME, 0)); M.screen.position.z = 0.017; M.phone.add(M.screen); M.check = iconPlane('badge', 0.18, C_WHITE); M.check.position.z = 0.02; M.phone.add(M.check); M.phone.position.set(1.1, 1.05, 0.95); g.add(M.phone);
    M.path = progLine([V(0.25, 0.01, 1.05), V(0.75, 0.01, 1.25), V(1.3, 0.01, 0.9), V(1.55, 0.01, 0.2), V(1.45, 0.01, -0.3)], C_LIME, 1, 80); g.add(M.path);
    M.lift = new THREE.Group(); var fr2 = rrLine(0.6, 1.0, 0.04, C_LIME, 0.9); fr2.position.y = 0.5; M.lift.add(fr2); M.doors = [-1, 1].map(function (s) { var d = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.96), addMat(C_LIME, 0.12, THREE.DoubleSide)); d.position.set(0.14 * s, 0.5, 0); M.lift.add(d); return d; }); var up = iconPlane('route', 0.18, C_LIME); up.position.set(0, 1.12, 0); M.lift.add(up); M.lift.position.set(1.45, 0, -0.45); M.lift.rotation.y = -0.6; g.add(M.lift);
    M.walker = buildRobot(); M.walker.g.scale.setScalar(0.62); M.walker.onT = 1; g.add(M.walker.g);
    M.reqs = ['clock', 'utensils', 'bed'].map(function (n, k) { var ic = iconPlane(n, 0.3, [C_ICE, C_GOLD, C_AQUA][k], 'circle'); g.add(ic); return ic; });
    M.nodes = [0, 1, 2].map(function (k) { var n = holoBox(0.22, 0.22, 0.22, C_AQUA, 0.15); n.position.set(1.35, 0.7 + k * 0.5, -0.1); g.add(n); return n; });
    M.links = [0, 1, 2].map(function (k) { var l = progLine([V(0, 1.6, 0.6), V(0.8, 1.2 + k * 0.3, 0.4), V(1.35, 0.7 + k * 0.5, -0.1)], C_AQUA, 0.9, 30); g.add(l); return l; });
    M.moods = [[0x3fc3ec, -1.0], [0xffc864, 0], [0x86eb22, 1.0]].map(function (d, k) { var grp = new THREE.Group(); var n = k === 2 ? 3 : 1; grp.figs = []; for (var q = 0; q < n; q++) { var f = buildFigure(d[0], {}); f.g.scale.setScalar(k === 2 && q > 0 ? 0.6 : 0.9); f.g.position.x = (q - (n - 1) / 2) * 0.28; f.phase = q; grp.add(f.g); grp.figs.push(f); } grp.position.set(d[1] * 1.05, 0, 1.45); g.add(grp); return grp; });
    M.human = buildFigure(0xffe2b0, { top: 0xffffff }); M.human.g.position.set(1.15, 0, 0.8); M.human.g.scale.setScalar(1.55); M.human.g.rotation.y = -0.7; g.add(M.human.g);
    M.orb = sprite(C_GOLD, 0.35, 0); g.add(M.orb);
    M.shake = iconPlane('handshake', 0.42, C_GOLD, 'circle'); g.add(M.shake);
    M.guest = buildFigure(0xa0dcff, { bag: true }); M.guest.g.scale.setScalar(1.2); g.add(M.guest.g);
    M.scanR = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.008, 6, 64), addMat(C_AQUA, 0)); M.scanR.rotation.x = PI / 2; g.add(M.scanR);
    M.demo = -1; M.dt = 0;
    M.enter = function () { M.demo = -1; M.tiles.forEach(function (t, i) { t.intro = -i * 0.12; }); };
    M.select = function (i) { M.demo = i; M.dt = 0; var t = M.tiles[i]; t.g.getWorldPosition(tmpV); burstV(tmpV, 50, 1.2, 0.9, [t.col, C_WHITE]); sfx.chime(i); if (i === 0) ava.gesture('wave', 3.2); else if (i === 1) ava.gesture('presentL', 3); else if (i === 2) ava.gesture('presentL', 3.5); else if (i === 3) ava.gesture('open', 3); else if (i === 4) ava.gesture('rest', 1); else ava.gesture('presentL', 3.4); };
    M.deselect = function () { M.demo = -1; };
    M.act = function (done) { M.demo = 6; M.dt = 0; sfx.chime(2); ava.gesture('wave', 2.2); M.actDone = done; };
    M.update = function (T, dt) {
      var vis = M.vis; M.dt += dt; var d = M.demo, t = M.dt;
      M.tiles.forEach(function (tl, i) { tl.intro = Math.min(1, tl.intro + dt * 1.6); var on = d === i || (d === 6 && i === 1) ? 1 : 0; tl.on = damp(tl.on, on, 4, dt); tl.g.position.set(tl.home.x, tl.home.y + 0.05 * Math.sin(T * 1.2 + i), tl.home.z + tl.on * 0.5); tl.g.lookAt(camera.position); tl.g.scale.setScalar(eBack(Math.max(0, tl.intro)) * vis * (1 + 0.3 * tl.on)); setOp(tl.fr.material, (0.55 + 0.45 * tl.on) * vis); tl.gl.material.opacity = (0.12 + 0.4 * tl.on) * vis; });
      /* reset props */
      M.bubbles.forEach(function (b) { b.visible = false; }); M.badge.visible = false; M.card.visible = false; M.phone.visible = false; M.path.visible = false; M.lift.visible = false; M.walker.g.visible = false; M.reqs.forEach(function (r) { r.visible = false; }); M.nodes.forEach(function (n) { n.visible = false; }); M.links.forEach(function (l) { l.visible = false; }); M.moods.forEach(function (m) { m.visible = false; }); M.human.g.visible = false; M.orb.visible = false; M.shake.visible = false; M.guest.g.visible = false; M.scanR.visible = false;
      ava.headWorld(tmpV3); g.worldToLocal(tmpV3); var core = ava.coreWorld(V(0, 0, 0)); g.worldToLocal(core);
      if (d === 0) { M.bubbles.forEach(function (b, k) { b.visible = true; var p = win(t, 0.2 + k * 0.35, 0.9 + k * 0.35), a = -1.2 + k * 0.8; b.position.set(tmpV3.x + Math.sin(a) * (0.35 + 0.35 * eO(p)), tmpV3.y + 0.1 + Math.cos(a) * 0.2 + 0.25 * eO(p), tmpV3.z + 0.2); b.scale.setScalar(eBack(p) * vis); billboard(b); setOp(b.material, (1 - win(t, 4, 5)) * vis); }); M.badge.visible = true; M.badge.position.set(0.75, 1.55, 0.8); billboard(M.badge); M.badge.scale.setScalar(eBack(win(t, 1.6, 2.2)) * vis); }
      if (d === 1 || d === 6) {
        var t0 = d === 6 ? 2.2 : 0; M.phone.visible = M.card.visible = true;
        if (d === 6) { M.guest.g.visible = true; var gw = win(t, 0, 1.6); M.guest.g.position.set(lerp(-1.7, -0.55, eIO(gw)), 0, 1.15); M.guest.g.rotation.y = PI / 2 * (1 - gw * 0.7); M.guest.animate(T, dt, gw > 0 && gw < 1); M.guest.setOp(vis * (1 - win(t, 6.5, 7.2))); M.scanR.visible = true; var sc = win(t, 1.4, 2.4); M.scanR.position.set(-0.55, lerp(1.5, 0.05, sc), 1.15); setOp(M.scanR.material, Math.sin(sc * PI) * vis); if (t > 1.4 && !M._sc) { M._sc = 1; sfx.whoosh(); } if (t < 1) M._sc = 0; }
        var ct = win(t, t0 + 0.2, t0 + 1.6); ava.handWorld('L', tmpV2); g.worldToLocal(tmpV2);
        var pp = V(1.1, 1.05, 0.95); M.card.position.set(lerp(tmpV2.x, pp.x, eIO(ct)), lerp(tmpV2.y, pp.y, eIO(ct)) + Math.sin(ct * PI) * 0.45, lerp(tmpV2.z + 0.1, pp.z, eIO(ct))); M.card.rotation.set(0.3, ct * PI * 2, 0.2); M.card.scale.setScalar(vis * (1 - win(t, t0 + 1.5, t0 + 1.7)) * eBack(win(t, t0, t0 + 0.3)));
        var ok2 = win(t, t0 + 1.6, t0 + 2.0); setOp(M.screen.material, 0.12 + 0.5 * ok2); M.check.scale.setScalar(eBack(ok2) * vis); M.phone.lookAt(camera.position); M.phone.scale.setScalar(vis * eBack(win(t, t0, t0 + 0.4)));
        if (ok2 > 0 && !M._ok) { M._ok = 1; sfx.ready(); M.phone.getWorldPosition(tmpV); burstV(tmpV, 50, 1, 0.9, [C_LIME, C_WHITE]); ringAt(tmpV, C_LIME, 0.6); } if (ok2 === 0) M._ok = 0;
      }
      if (d === 2 || d === 6) {
        var t1 = d === 6 ? 4.4 : 0; M.path.visible = M.lift.visible = true; M.path.material.uniforms.uP.value = eO(win(t, t1 + 0.2, t1 + 1.6)); M.path.material.uniforms.uTime.value = T; M.path.material.uniforms.uOp.value = vis;
        var op = win(t, t1 + 1.6, t1 + 2.2); M.doors[0].position.x = -0.14 - 0.24 * op; M.doors[1].position.x = 0.14 + 0.24 * op; M.lift.scale.setScalar(vis * eBack(win(t, t1, t1 + 0.4)));
        var walker = d === 2 ? M.walker : M.guest; walker.g.visible = true; var wt = win(t, t1 + 0.6, t1 + 3.4), pt = M.path.userData.curve.getPoint(Math.max(0.001, wt)), pt2 = M.path.userData.curve.getPoint(Math.min(1, wt + 0.02)); walker.g.position.set(pt.x, 0, pt.z); walker.g.rotation.y = Math.atan2(pt2.x - pt.x, pt2.z - pt.z);
        if (d === 2) { walker.walk = wt > 0 && wt < 1 ? 1 : 0; walker.animate(T, dt); } else walker.animate(T, dt, wt > 0 && wt < 1);
        if (d === 6 && t > t1 + 3.6 && M.actDone) { var cb2 = M.actDone; M.actDone = null; setTimeout(cb2, 900); }
      }
      if (d === 3) { M.reqs.forEach(function (r, k) { r.visible = true; var a = win(t, 0.2 + k * 0.3, 1.3 + k * 0.3); r.position.set(lerp(-1.5, core.x, eIO(a)), lerp(0.8 + k * 0.45, core.y, eIO(a)), lerp(0.9, core.z + 0.1, eIO(a))); r.scale.setScalar(vis * (1 - win(t, 1.3 + k * 0.3, 1.5 + k * 0.3)) * eBack(win(t, k * 0.3, k * 0.3 + 0.3))); billboard(r); });
        M.nodes.forEach(function (n, k) { n.visible = true; n.scale.setScalar(vis * eBack(win(t, 2.2 + k * 0.2, 2.6 + k * 0.2))); n.rotation.y = T; }); M.links.forEach(function (l, k) { l.visible = true; l.material.uniforms.uP.value = eO(win(t, 2.2 + k * 0.2, 2.9 + k * 0.2)); l.material.uniforms.uTime.value = T; l.material.uniforms.uOp.value = vis; }); if (t > 2.2 && !M._rq) { M._rq = 1; sfx.chime(5); ava.flash = 1; } if (t < 2) M._rq = 0; }
      if (d === 4) { var phase = Math.min(2, Math.floor(t / 2)); M.moods.forEach(function (m, k) { m.visible = true; m.scale.setScalar(vis * eBack(win(t, k * 0.25, k * 0.25 + 0.4))); m.figs.forEach(function (f) { f.animate(T * (k === 0 ? 2 : k === 1 ? 0.5 : 1), dt, k === 0 || k === 2); f.setOp((phase === k ? 1 : 0.35) * vis); }); }); ava.tintT.setHex([C_AQUA, C_GOLD, C_LIME][phase]); if (phase !== M._mp) { M._mp = phase; sfx.chime(phase + 2); M.moods[phase].getWorldPosition(tmpV); burstV(tmpV, 30, 0.8, 0.8, [[C_AQUA, C_GOLD, C_LIME][phase], C_WHITE], 0.6); } } else { ava.tintT.set(ACC[cur] && cur === 3 ? '#3fc3ec' : ava.tintT.getStyle()); M._mp = -1; }
      if (d === 5) { M.human.g.visible = true; M.human.setOp(vis * eO(win(t, 0, 0.8))); M.human.animate(T, dt, false); M.orb.visible = true; var ot = win(t, 0.9, 2.1); M.human.head.getWorldPosition(tmpV2); g.worldToLocal(tmpV2); tmpV2.y -= 0.25; M.orb.position.set(lerp(core.x, tmpV2.x, eIO(ot)), lerp(core.y, tmpV2.y, eIO(ot)) + Math.sin(ot * PI) * 0.35, lerp(core.z, tmpV2.z, eIO(ot))); M.orb.material.opacity = Math.sin(ot * PI) * vis + (ot >= 1 ? 0 : 0); M.shake.visible = true; M.shake.position.set(0.62, 1.95, 0.9); billboard(M.shake); M.shake.scale.setScalar(vis * eBack(win(t, 2.1, 2.5))); if (ot >= 1 && !M._hs) { M._hs = 1; sfx.ready(); M.shake.getWorldPosition(tmpV); burstV(tmpV, 60, 1.2, 1, [C_GOLD, C_WHITE]); } if (t < 1) M._hs = 0; }
    };
    return M;
  }

  /* ---------- 5. Under the hood: eight layers ---------- */
  var SLAB_F = 'uniform vec3 uCol; uniform float uOp; uniform float uTime; uniform float uKind; uniform float uLight; uniform float uAmp; uniform float uHi; varying vec2 vUv;' +
    'float hexd(vec2 p){ p = abs(p); return max(dot(p, normalize(vec2(1.0,1.732))), p.x); }' +
    'void main(){ vec2 uv = vUv; vec2 p = uv*vec2(2.2,1.0); float v = 0.0; float k = uKind;' +
    ' if (k < 0.5) { vec2 q = p*7.0; vec2 a = mod(q, vec2(1.0,1.732)) - vec2(0.5,0.866); vec2 b = mod(q - vec2(0.5,0.866), vec2(1.0,1.732)) - vec2(0.5,0.866); vec2 gv = dot(a,a) < dot(b,b) ? a : b; v = smoothstep(0.05, 0.0, abs(hexd(gv) - 0.42))*(0.5 + 0.5*sin(uTime*2.0 + length(p)*6.0)); }' +
    ' else if (k < 1.5) { float g1 = smoothstep(0.03, 0.0, abs(fract(p.x*5.0) - 0.5) - 0.46)*step(fract(p.y*3.0), 0.5); float g2 = smoothstep(0.03, 0.0, abs(fract(p.y*6.0) - 0.5) - 0.46); float pulse = smoothstep(0.08, 0.0, abs(fract(p.x*0.8 - uTime*0.6) - 0.5)); v = max(g1, g2)*0.6 + pulse*g2; }' +
    ' else if (k < 2.5) { vec2 c = fract(p*vec2(5.0,3.0)); float bx = step(0.18, c.x)*step(c.x, 0.82)*step(0.18, c.y)*step(c.y, 0.82); float id = floor(p.x*5.0) + floor(p.y*3.0)*7.0; v = bx*(0.25 + 0.75*step(0.6, fract(sin(id*12.9 + floor(uTime*0.8))*437.5))); }' +
    ' else if (k < 3.5) { vec2 n1 = vec2(0.4,0.5), n2 = vec2(1.1,0.25), n3 = vec2(1.1,0.75), n4 = vec2(1.8,0.5); float d = min(min(length(p-n1), length(p-n2)), min(length(p-n3), length(p-n4))); v = smoothstep(0.1, 0.07, d); float t = fract(uTime*0.5); vec2 m1 = mix(n1, mix(n2, n3, step(0.5, fract(uTime*0.25))), t); vec2 m2 = mix(mix(n2, n3, step(0.5, fract(uTime*0.25))), n4, t); v += smoothstep(0.05, 0.0, length(p - m1))*1.5 + smoothstep(0.05, 0.0, length(p - m2))*1.5; }' +
    ' else if (k < 4.5) { float x = floor(p.x*14.0); float hgt = 0.15 + (0.35 + uAmp*0.5)*abs(sin(x*1.7 + uTime*(3.0 + uAmp*6.0))*sin(x*0.6 + uTime*1.3)); v = step(abs(uv.y - 0.5), hgt*0.5)*step(0.2, fract(p.x*14.0))*step(fract(p.x*14.0), 0.8); }' +
    ' else if (k < 5.5) { vec2 c = p - vec2(1.1, 0.5); float r = length(c); float a = atan(c.y, c.x); v = smoothstep(0.02, 0.0, abs(r - 0.32))*(0.6 + 0.4*step(0.5, fract(a*3.0/3.1416 + uTime*0.4))) + smoothstep(0.02, 0.0, abs(r - 0.18)); }' +
    ' else if (k < 6.5) { vec2 q = fract(p*12.0) - 0.5; float dots = smoothstep(0.12, 0.06, length(q)); float sw = smoothstep(0.15, 0.0, abs(uv.x - fract(uTime*0.35))); v = dots*(0.25 + 0.75*sw) + sw*0.25; }' +
    ' else { float t = fract(uTime*0.3); float st = 0.0; for (int i = 0; i < 6; i++) { float fi = float(i); vec2 c = vec2(0.25 + fi*0.33, 0.5 + 0.12*mod(fi, 2.0) - 0.06); st += smoothstep(0.07, 0.04, length((p - c)*vec2(1.0, 0.6)))*step(fi/6.0, t); } v = st; }' +
    ' float edgeF = smoothstep(0.02, 0.0, min(min(uv.x, 1.0 - uv.x)*2.2, min(uv.y, 1.0 - uv.y))); float a = uOp*(0.06 + 0.6*v + 0.5*edgeF)*(0.5 + 0.5*uHi); if (uLight > 0.5) gl_FragColor = vec4(uCol*0.5, min(1.0, a*1.2)); else gl_FragColor = vec4(uCol*(0.7 + 0.6*v), a); }';
  function buildStack() {
    var M = base(4), g = M.group;
    M.ava = { p: [-1.32, 0, 1.0], ry: 0.5, s: 1.2, pose: 'rest' }; M.cam = { p: [0.15, 3.0, 8.9], l: [0.2, 1.95, 0] };
    var stack = new THREE.Group(); stack.position.set(0.55, 0, -0.2); stack.rotation.y = -0.42; g.add(stack); M.stack = stack;
    var cols = [C_GREEN, C_AQUA, C_BLUE, C_LIME, C_ICE, C_AQUA, C_BLUE, C_LIME], icons = ['shield', 'cpu', 'building', 'workflow', 'audio', 'cog', 'scan', 'footprints'];
    M.slabs = cols.map(function (c, k) {
      var s = new THREE.Group(); stack.add(s);
      var box = holoBox(2.25, 0.08, 1.05, c, 0.1); s.add(box);
      var pm = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(c) }, uOp: { value: 1 }, uTime: { value: 0 }, uKind: { value: k }, uLight: { value: 0 }, uAmp: { value: 0 }, uHi: { value: 1 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: SLAB_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      var pat = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 0.97), pm); pat.rotation.x = -PI / 2; pat.position.y = 0.045; s.add(pat);
      var ic = iconPlane(icons[k], 0.34, c, 'circle'); ic.position.set(-1.38, 0.12, 0.35); s.add(ic);
      return { g: s, box: box, pm: pm, ic: ic, col: c, y: 0.3 + k * 0.46, out: 0, b: 0, bT: 0 };
    });
    M.core = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 16, 1, true), addMat(C_LIME, 0)); M.core.position.set(0, 0, 0); stack.add(M.core);
    M.beam = progLine([V(0, 0, 0), V(0.5, 0.5, 0.5), V(1, 1, 1)], C_LIME, 0.9, 30); g.add(M.beam); M.beam.visible = false;
    M.anchors = []; for (var n = 0; n < 8; n++) (function (n) { var k = 7 - n; M.anchors.push(function (out) { var s = M.slabs[k]; s.g.updateMatrixWorld(true); out.set(1.0, 0.1, 0.48); return s.g.localToWorld(out); }); })(n);
    function build(delay) { M.slabs.forEach(function (s, k) { s.b = 0; s.bT = -(delay || 0) - k * 0.32; s.hummed = false; }); M.coreV = 0; M.coreT = -(delay || 0) - 8 * 0.32; }
    M.enter = function () { build(0.4); };
    M.select = function (n) { var k = 7 - n, s = M.slabs[k]; sfx.hum(k); s.g.getWorldPosition(tmpV); burstV(tmpV, 50, 1.2, 0.9, [s.col, C_WHITE]); ava.gesture('presentL', 3.4); M.beamT = 0; };
    M.deselect = function () { M.beamT = -1; };
    M.act = function (done) { M.slabs.forEach(function (s) { s.fall = 0; }); M.falling = 0; setTimeout(function () { if (cur !== 4) return; M.falling = -1; build(0); }, 700); setTimeout(function () { if (cur !== 4) return; ava.gesture('open', 3); sfx.ready(); kick = 1.5; burst(0.55, 4, -0.2, 160, 2.2, 1.4, [C_LIME, C_AQUA, C_WHITE]); }, 700 + 8 * 320 + 600); setTimeout(function () { if (done) done(); }, 700 + 8 * 320 + 2200); };
    M.update = function (T, dt) {
      var vis = M.vis, selK = sel >= 0 ? 7 - sel : -1;
      if (M.falling >= 0) M.falling += dt;
      M.slabs.forEach(function (s, k) {
        s.bT += dt; var bt = clamp(s.bT / 0.55, 0, 1); if (s.bT > 0 && !s.hummed) { s.hummed = true; sfx.hum(k); }
        var fall = M.falling >= 0 ? eIO(win(M.falling, k * 0.03, 0.5 + k * 0.03)) : 0;
        s.out = damp(s.out, k === selK ? 1 : 0, 4, dt);
        s.g.position.set(0, s.y + (1 - eO(bt)) * 0.7 + s.out * 0.12 - fall * (s.y + 0.4), s.out * 0.55); s.g.scale.setScalar(Math.max(0.001, eO(bt) * (1 - fall)) * vis);
        var dim = selK >= 0 && k !== selK ? 0.35 : 1, flash = 1 + (1 - bt) * 2 * (bt > 0 ? 1 : 0);
        setOp(s.box.userData.edges.material, 0.85 * dim * vis * Math.min(1, flash)); setOp(s.box.userData.fill.material, 0.08 * dim * vis * flash);
        s.pm.uniforms.uTime.value = T; s.pm.uniforms.uAmp.value = amp; s.pm.uniforms.uOp.value = vis * dim; s.pm.uniforms.uHi.value = k === selK ? 1.6 : 1;
        s.ic.quaternion.copy(s.g.getWorldQuaternion(new THREE.Quaternion())).invert().multiply(camera.quaternion); setOp(s.ic.material, 0.95 * dim * vis); s.ic.scale.setScalar(1 + 0.3 * s.out);
      });
      M.coreT += dt; var cv = clamp(M.coreT / 1.2, 0, 1); M.core.scale.set(1, Math.max(0.001, 4.0 * eO(cv)), 1); M.core.position.y = 2.0 * eO(cv); setOp(M.core.material, cv * (0.25 + 0.2 * Math.sin(T * 4)) * vis);
      if (sel >= 0 && M.beamT >= 0) { M.beamT += dt; ava.handWorld('L', tmpV); M.anchors[sel](tmpV2); var mid = tmpV.clone().lerp(tmpV2, 0.5); mid.y += 0.4; M.beam.geometry.dispose(); M.beam.geometry = progLine([tmpV.clone(), mid, tmpV2.clone()], C_LIME, 1, 30).geometry; M.beam.material.uniforms.uP.value = eO(win(M.beamT, 0.3, 1)); M.beam.material.uniforms.uCol.value.setHex(M.slabs[7 - sel].col); M.beam.visible = true; } else M.beam.visible = false;
      M.beam.material.uniforms.uTime.value = T; M.beam.material.uniforms.uOp.value = vis;
    };
    return M;
  }

  /* ---------- 6. A guest's day: Ms. Rivera in a digital twin of the hotel ---------- */
  function buildDay() {
    var M = base(5), g = M.group;
    M.ava = { p: [-1.15, 0, 1.6], ry: 0.6, s: 0.95, pose: 'rest' }; M.cam = { p: [0.25, 4.7, 7.7], l: [0.2, 0.95, -0.35] };
    var pad = rrLine(3.5, 3.0, 0.3, C_AQUA, 0.4); pad.rotation.x = -PI / 2; pad.position.set(0.25, 0.004, -0.35); g.add(pad);
    /* the hotel tower, live: rooms light as they are ready */
    var tower = new THREE.Group(); tower.position.set(1.05, 0, -1.4); g.add(tower); M.tower = tower;
    for (var f = 0; f < 6; f++) { var fl = holoBox(1.15, 0.3, 0.75, C_AQUA, 0.04); fl.position.y = 0.45 + f * 0.31; tower.add(fl); }
    var wins = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.17, 0.14), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), 24); var dm = new THREE.Object3D(), wc = new THREE.Color();
    for (var w = 0; w < 24; w++) { var fi = Math.floor(w / 4), wi = w % 4; dm.position.set(-0.4 + wi * 0.27, 0.45 + fi * 0.31, 0.378); dm.updateMatrix(); wins.setMatrixAt(w, dm.matrix); wins.setColorAt(w, wc.setHex(0x1d4a5a)); } tower.add(wins); M.wins = wins; M.room = 4 * 4 + 2;
    var lobbyIcon = iconPlane('hotel', 0.4, C_AQUA, 'circle'); lobbyIcon.position.set(0, 2.45, 0); tower.add(lobbyIcon); M.towerIcon = lobbyIcon;
    M.lift = new THREE.Group(); var lf = rrLine(0.42, 0.62, 0.03, C_LIME, 0.9); lf.position.y = 0.31; M.lift.add(lf); M.lift.position.set(1.05, 0, -1.02); g.add(M.lift);
    var desk = holoBox(0.85, 0.3, 0.28, C_ICE, 0.05); desk.position.set(0.15, 0.15, -0.5); g.add(desk); M.desk = desk;
    var arch = new THREE.Group(); [-1, 1].forEach(function (s) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.04), addMat(C_AQUA, 0.7)); p.position.set(0.3 * s, 0.4, 0); arch.add(p); }); var top = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.015, 6, 32, PI), addMat(C_AQUA, 0.7)); top.position.y = 0.8; arch.add(top); arch.position.set(-1.05, 0, 0.75); arch.rotation.y = 0.9; g.add(arch);
    M.tables = [[-0.95, -0.95], [-0.35, -1.35]].map(function (p, k) { var t = new THREE.Group(); var top2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32), addMat(C_GOLD, 0.25)); top2.position.y = 0.32; t.add(top2); var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8), addMat(C_GOLD, 0.5)); leg.position.y = 0.16; t.add(leg); var ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.28, 48), addMat(C_GOLD, 0, THREE.DoubleSide)); ring.rotation.x = -PI / 2; ring.position.y = 0.01; t.add(ring); t.userData.ring = ring; t.position.set(p[0], 0, p[1]); g.add(t); return t; });
    var dine = iconPlane('utensils', 0.3, C_GOLD, 'circle'); dine.position.set(-0.65, 0.95, -1.15); g.add(dine); M.dine = dine;
    M.plane = iconPlane('plane', 0.55, C_ICE); g.add(M.plane);
    M.trail = progLine([V(-3.4, 4.4, -3.2), V(-2.2, 3.4, -2.4), V(-1.5, 2.2, -1.2), V(-1.25, 1.2, 0.2)], C_ICE, 0.8, 60); g.add(M.trail);
    M.rivera = buildFigure(0xffc864, { bag: true }); M.rivera.g.scale.setScalar(1.1); g.add(M.rivera.g);
    M.bot = buildRobot(); M.bot.g.scale.setScalar(0.66); M.bot.onT = 1; g.add(M.bot.g);
    M.team = buildFigure(0x86eb22, { top: 0xffffff }); M.team.g.scale.setScalar(1.1); g.add(M.team.g);
    M.phone = iconPlane('smartphone', 0.26, C_LIME, 'circle'); g.add(M.phone); M.key = iconPlane('key', 0.22, C_GOLD); g.add(M.key);
    M.note = iconPlane('bell', 0.22, C_AQUA); g.add(M.note); M.heart = iconPlane('heart', 0.38, 0xff8fa3, 'circle'); g.add(M.heart);
    M.route = progLine([V(-1.05, 0.01, 0.75), V(-0.4, 0.01, 0.35), V(0.25, 0.01, -0.05), V(0.75, 0.01, -0.6), V(1.05, 0.01, -0.95)], C_LIME, 1, 80); g.add(M.route);
    M.step = -1; M.st = 0; M.played = -1;
    M.anchors = [anchorOf(M.plane), function (out) { var fi2 = 4, wi2 = 2; out.set(-0.4 + wi2 * 0.27, 0.45 + fi2 * 0.31, 0.4); tower.updateMatrixWorld(true); return tower.localToWorld(out); }, anchorOf(M.lift, [0, 0.7, 0]), anchorOf(M.tables[0], [0, 0.45, 0]), anchorOf(M.heart)];
    M.enter = function () { M.step = -1; M.st = 0; M.played = -1; };
    M.select = function (i) { M.step = i; M.st = 0; M.played = Math.max(M.played, i); sfx.chime(i + 1); ava.gesture('presentL', 2.6); };
    M.deselect = function () {};
    M.act = function (done) { var k = 0; function next() { if (cur !== 5 || !M.playing) { M.playing = false; if (done) done(); return; } if (k >= 5) { M.playing = false; if (done) done(); return; } var i = k++; markSeen(5, i); selectHS(i, next); } M.playing = true; next(); };
    M.update = function (T, dt) {
      var vis = M.vis, s = M.step, t = (M.st += dt); M.trail.material.uniforms.uTime.value = M.route.material.uniforms.uTime.value = T;
      function done(i) { return s > i || (s === i && t > 99); }
      /* 1 landing */
      var pl = s === 0 ? win(t, 0.1, 2.6) : (s > 0 ? 1 : 0); var pp = M.trail.userData.curve.getPoint(Math.max(0.001, Math.min(1, pl))); M.plane.position.copy(pp); billboard(M.plane); M.plane.scale.setScalar(vis * (s === 0 ? (1 - win(t, 2.5, 3)) * eBack(win(t, 0, 0.3)) : (s < 0 ? 0.0001 : 0.0001)) + 0.0001); M.trail.material.uniforms.uP.value = s === 0 ? pl : 0; M.trail.material.uniforms.uOp.value = vis * (1 - (s === 0 ? win(t, 2.6, 3.4) : 1));
      /* Rivera's position across the day */
      var rv = M.rivera, pos = V(-1.05, 0, 0.75), walking = false, rot = 0.9, show = s >= 0 && (s > 0 || t > 2.2) ? 1 : 0;
      if (s >= 2) { var wt = s === 2 ? win(t, 0.6, 4.6) : 1; var c = M.route.userData.curve, q = c.getPoint(Math.max(0.001, wt)), q2 = c.getPoint(Math.min(1, wt + 0.02)); pos.set(q.x, 0, q.z); rot = Math.atan2(q2.x - q.x, q2.z - q.z); walking = s === 2 && wt > 0 && wt < 1; if (s >= 4) { pos.set(0.85, 0, -0.62); rot = -0.6; } }
      rv.g.position.copy(pos); rv.g.rotation.y = rot; rv.animate(T, dt, walking); rv.setOp(vis * show * (s === 0 ? win(t, 2.2, 2.8) : 1)); if (rv.bag) rv.bag.visible = s < 2;
      /* robot carries the bag */
      var bot = M.bot; bot.g.visible = vis > 0.01; var bp = s >= 2 ? pos.clone().add(V(-0.28, 0, 0.12)) : V(-0.7, 0, 0.55); bot.g.position.x = damp(bot.g.position.x, bp.x, 4, dt); bot.g.position.z = damp(bot.g.position.z, bp.z, 4, dt); bot.g.rotation.y = s >= 2 ? rot : 0.4; bot.walk = walking ? 1 : 0; bot.animate(T, dt); bot.g.scale.setScalar(0.66 * vis);
      /* 2 room ready: the twin flags it, housekeeping lights it */
      var rr2 = s === 1 ? win(t, 0.4, 1.4) : (s > 1 ? 1 : 0), scanY = s === 1 ? win(t, 0, 1.2) : -1;
      for (var w2 = 0; w2 < 24; w2++) { var fi3 = Math.floor(w2 / 4), base2 = 0.25 + 0.2 * (Math.sin(w2 * 7.3 + Math.floor(T * 0.5)) > 0.4 ? 1 : 0), sc = scanY >= 0 ? smoothstep2(0.2, 0, Math.abs(fi3 / 5 - scanY)) : 0; if (w2 === M.room) { wc.setHex(0x86eb22).multiplyScalar(0.25 + 0.75 * rr2 * (0.8 + 0.2 * Math.sin(T * 4))); } else wc.setHex(0x3fc3ec).multiplyScalar(base2 + sc * 0.8); if (LT) wc.multiplyScalar(0.5); wins.setColorAt(w2, wc); } wins.instanceColor.needsUpdate = true; wins.material.opacity = vis;
      if (s === 1 && t > 1.4 && !M._room) { M._room = 1; M.anchors[1](tmpV); burstV(tmpV, 50, 1, 0.9, [C_LIME, C_WHITE]); ringAt(tmpV, C_LIME, 0.5); sfx.ready(); } if (s !== 1) M._room = 0;
      M.towerIcon.lookAt(camera.position); setOp(M.towerIcon.material, 0.8 * vis);
      /* phone + key */
      M.phone.visible = show > 0 && s >= 0; M.phone.position.set(pos.x + 0.22, 1.2 + 0.05 * Math.sin(T * 2), pos.z); billboard(M.phone); M.phone.scale.setScalar(vis * (s === 0 ? eBack(win(t, 2.8, 3.2)) : 1) * (s >= 4 ? 0.0001 : 1) + 0.0001);
      var kt = s === 2 ? win(t, 1.4, 2.6) : (s > 2 ? 1 : 0); M.key.visible = s === 2; M.key.position.set(lerp(0.15, pos.x + 0.22, eIO(kt)), lerp(0.55, 1.2, eIO(kt)) + Math.sin(kt * PI) * 0.4, lerp(-0.5, pos.z, eIO(kt))); billboard(M.key); M.key.scale.setScalar(vis * (1 - win(t, 2.5, 2.7)));
      /* 4 dinner */
      var dn = s === 3 ? win(t, 0.4, 1.2) : (s > 3 ? 1 : 0); setOp(M.tables[0].userData.ring.material, dn * vis * (0.6 + 0.4 * Math.sin(T * 3))); M.dine.visible = s >= 3; billboard(M.dine); M.dine.scale.setScalar(vis * (s === 3 ? eBack(win(t, 0.2, 0.6)) : 1));
      M.note.visible = s === 3; var nt = win(t, 1.6, 3.0); M.note.position.set(lerp(pos.x, 0.55, eIO(nt)), 1.1 + Math.sin(nt * PI) * 0.4, lerp(pos.z, 0.55, eIO(nt))); billboard(M.note); M.note.scale.setScalar(vis * (1 - win(t, 2.9, 3.1)));
      /* 5 the moment: a person from the team says welcome back */
      var tm = M.team, tw2 = s === 4 ? win(t, 0.3, 2.4) : 0, tp = V(0.6, 0, 0.55).lerp(V(0.62, 0, -0.32), s === 4 ? eIO(tw2) : 0); tm.g.position.copy(tp); tm.g.rotation.y = s === 4 ? Math.atan2(0.85 - tp.x, -0.62 - tp.z) : -0.4; tm.animate(T, dt, s === 4 && tw2 > 0 && tw2 < 1); tm.setOp(vis);
      M.heart.visible = s === 4; M.heart.position.set(0.74, 1.55, -0.45); billboard(M.heart); var hv = win(t, 2.4, 2.9); M.heart.scale.setScalar(vis * eBack(hv) * (1 + 0.08 * Math.sin(T * 5)));
      if (s === 4 && hv > 0 && !M._hb) { M._hb = 1; sfx.ready(); M.heart.getWorldPosition(tmpV); burstV(tmpV, 90, 1.5, 1.3, [C_GOLD, 0xff8fa3, C_WHITE]); ringAt(tmpV, C_GOLD, 1); accTgt.set('#ffc864'); } if (s !== 4) M._hb = 0;
      M.route.material.uniforms.uP.value = s === 2 ? eO(win(t, 0, 1)) : (s > 2 ? 1 : 0); M.route.material.uniforms.uOp.value = vis * (s > 2 ? 0.35 : 1);
      setOp(M.desk.userData.edges.material, 0.4 * vis); setOp(M.desk.userData.fill.material, 0.03 * vis);
    };
    return M;
  }
  function smoothstep2(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  /* ---------- 7. Your turn: the honest part, and the door to the robot ---------- */
  function buildFinale() {
    var M = base(6), g = M.group;
    M.ava = { p: [-0.78, 0, 0.45], ry: 0.28, s: 1.6, pose: 'rest' }; M.cam = { p: [0.05, 2.1, 9.1], l: [0.1, 1.38, 0] };
    var door = new THREE.Group(); door.position.set(0.98, 0, -0.55); door.rotation.y = -0.25; g.add(door); M.door = door;
    [-1, 1].forEach(function (s) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.05), addMat(C_GOLD, 0.9)); p.position.set(0.62 * s, 1.1, 0); door.add(p); });
    var archT = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 64, PI), addMat(C_GOLD, 0.9)); archT.position.y = 2.2; door.add(archT);
    M.portalMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uOp: { value: 0.3 }, uCol: { value: new THREE.Color(C_GOLD) }, uLight: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform float uTime; uniform float uOp; uniform vec3 uCol; uniform float uLight; varying vec2 vUv; void main(){ vec2 p = vUv - vec2(0.5, 0.42); float d = length(p*vec2(1.6, 0.9)); float rays = 0.5 + 0.5*sin(atan(p.y, p.x)*12.0 + uTime*0.8); float a = uOp*(smoothstep(0.75, 0.0, d)*0.55 + rays*smoothstep(0.6, 0.1, d)*0.12); if (uLight > 0.5) gl_FragColor = vec4(uCol*0.6, a*0.6); else gl_FragColor = vec4(uCol*(0.8 + 0.4*rays), a); }', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    var portal = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 2.82), M.portalMat); portal.position.set(0, 1.41, -0.03); door.add(portal);
    M.robot = buildRobot(); M.robot.g.scale.setScalar(2.25); M.robot.g.position.set(0, 0, -0.25); door.add(M.robot.g); M.robot.onT = 0.1;
    M.stairs = new THREE.Group(); for (var k = 0; k < 4; k++) { var st = holoBox(0.42, 0.12 * (k + 1), 0.2, C_GOLD, 0.08); st.position.set(0, 0.06 * (k + 1), -k * 0.2); M.stairs.add(st); } M.stairs.position.set(-1.62, 0, 1.25); M.stairs.rotation.y = 0.5; g.add(M.stairs);
    M.ghosts = [0, 1, 2].map(function (k) { var gr = new THREE.Group(); var b = holoBox(0.42, 0.55, 0.3, C_ORANGE, 0.08); b.position.y = 0.45; gr.add(b); var h = holoBox(0.3, 0.24, 0.24, C_ORANGE, 0.08); h.position.y = 0.88; gr.add(h); var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), addMat(C_ORANGE, 0.8)); ant.position.y = 1.08; gr.add(ant); gr.position.set(-0.1 + k * 0.75, 0, -1.9); gr.scale.setScalar(1.3); g.add(gr); return gr; });
    M.heartI = iconPlane('heart', 0.5, C_GOLD, 'circle'); M.heartI.position.set(0.98, 3.25, -0.55); g.add(M.heartI);
    M.bridge = progLine([V(-0.4, 1.6, 0.6), V(0.3, 2.3, 0.3), V(0.98, 1.6, -0.6)], C_GOLD, 1, 60); g.add(M.bridge);
    M.anchors = [anchorOf(archT, [0, 0.62, 0]), anchorOf(M.stairs, [0, 0.5, -0.3]), function (out) { ava.headWorld(out); out.x -= 0.38; return out; }];
    M.ghost = -1; M.stairT = -1; M.real = -1; M.open = 0; M.openT = 0; M.bridgeT = -1;
    M.enter = function () { M.ghost = -1; M.open = M.openT = 0; M.bridgeT = -1; M.robot.onT = 0.1; ava.opT = 1; };
    M.leave = function () { ava.opT = 1; ava.setBase('rest'); };
    M.select = function (i) { if (i === 0) { M.ghost = 0; ava.gesture('presentL', 3); } if (i === 1) { M.stairT = 0; ava.gesture('hop', 1.4); ava.hop = 0.6; setTimeout(function () { sfx.bonk(); ava.glitch = 0.4; }, 380); setTimeout(function () { ava.gesture('laugh', 2.4); }, 1300); } if (i === 2) { ava.gesture('chest', 3.4); ava.glitch = 1.6; ava.flash = 0.6; M.real = 0; } };
    M.act = function (done) { M.openT = 1; M.bridgeT = 0; ava.gesture('presentL', 4); sfx.whoosh(); setTimeout(function () { if (cur !== 6) return; M.robot.onT = 1; sfx.ready(); M.robot.wave = 3.2; door.getWorldPosition(tmpV); tmpV.y += 1.6; burstV(tmpV, 160, 2.4, 1.5, [C_GOLD, C_LIME, C_WHITE, C_AQUA]); kick = 1.6; confetti(); }, 1600); say(M.def.act, M.def.actLine, 'meet-act', { then: function () { if (cur === 6) { ava.setBase('quiet'); ava.opT = 0.45; } if (done) done(); } }); };
    M.update = function (T, dt) {
      var vis = M.vis; M.portalMat.uniforms.uTime.value = T; M.open = damp(M.open, M.openT, 1.6, dt); M.portalMat.uniforms.uOp.value = (0.25 + 0.75 * M.open) * vis;
      M.robot.animate(T, dt); M.robot.g.visible = vis > 0.02;
      if (M.ghost >= 0) M.ghost += dt; var gv = M.ghost >= 0 ? win(M.ghost, 0, 0.6) * (1 - win(M.ghost, 2.4, 3.2)) : 0;
      M.ghosts.forEach(function (gh, k) { gh.visible = gv > 0.01; gh.children.forEach(function (c) { if (c.userData.edges) { setOp(c.userData.edges.material, gv * 0.8 * vis); setOp(c.userData.fill.material, gv * 0.08 * vis); } else setOp(c.material, gv * vis); }); gh.position.y = 0.04 * Math.sin(T * 3 + k); gh.rotation.y = 0.2 * Math.sin(T + k); if (M.ghost > 2.4 && !gh.puffed) { gh.puffed = true; gh.getWorldPosition(tmpV); burstV(tmpV.add(V(0, 0.8, 0)), 40, 1, 1, [C_ORANGE, C_WHITE], 0.4); } if (M.ghost < 0) gh.puffed = false; });
      var hv = M.ghost >= 0 ? win(M.ghost, 2.8, 3.4) : (M.open > 0.5 ? 1 : 0); M.heartI.visible = hv > 0.01; billboard(M.heartI); M.heartI.scale.setScalar(eBack(hv) * vis * (1 + 0.06 * Math.sin(T * 4))); if (M.ghost > 2.8 && !M._hb) { M._hb = 1; sfx.calm(); } if (M.ghost < 0) M._hb = 0;
      if (M.stairT >= 0) { M.stairT += dt; var sf = Math.sin(clamp(M.stairT / 1.2, 0, 1) * PI); M.stairs.children.forEach(function (c, k) { setOp(c.userData.edges.material, (0.6 + sf * 0.4 * Math.abs(Math.sin(T * 10 + k))) * vis); }); if (M.stairT > 1.4) M.stairT = -1; } else M.stairs.children.forEach(function (c) { setOp(c.userData.edges.material, 0.6 * vis); setOp(c.userData.fill.material, 0.08 * vis); });
      if (M.bridgeT >= 0) { M.bridgeT += dt; ava.handWorld('L', tmpV); M.door.getWorldPosition(tmpV2); tmpV2.y += 1.5; var mid = tmpV.clone().lerp(tmpV2, 0.5); mid.y += 0.6; M.bridge.geometry.dispose(); M.bridge.geometry = progLine([tmpV.clone(), mid, tmpV2.clone()], C_GOLD, 1, 60).geometry; M.bridge.material.uniforms.uP.value = eO(win(M.bridgeT, 0.3, 1.5)); M.bridge.visible = true; } else M.bridge.visible = false;
      M.bridge.material.uniforms.uTime.value = T; M.bridge.material.uniforms.uOp.value = vis;
    };
    return M;
  }

  /* ---------- confetti, flash ---------- */
  function confetti() {
    if (RM) return; var cols = ['#86bc25', '#86eb22', '#00a3e0', '#3fc3ec', '#ffffff', '#ffc864'];
    for (var i = 0; i < 70; i++) { var c = document.createElement('i'); c.className = 'cf'; c.style.left = (Math.random() * 1040 + 20) + 'px'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (Math.random() * 0.9) + 's'; c.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)'; root.appendChild(c); (function (n) { setTimeout(function () { n.remove(); }, 5200); })(c); }
  }
  function flash() { if (!elFlash) return; elFlash.classList.remove('on'); void elFlash.offsetWidth; elFlash.classList.add('on'); }

  /* ================= voice: ElevenLabs clips, captions on demand ================= */
  var vo = { au: null, take: null, tok: 0, text: '', start: 0, mode: 'none', then: null, gap: 900, est: 0, timer: 0 }, voiceOn = true, ccOn = false;
  function stopVoice() { vo.tok++; if (vo.au) { try { vo.au.pause(); } catch (e) {} vo.au.onended = vo.au.onerror = null; vo.au = null; } clearTimeout(vo.timer); vo.mode = 'none'; vo.then = null; }
  function envAt(take, t) { if (!take || !take.e) return 0; var i = Math.floor(t * 30); if (i < 0 || i >= take.e.length) return 0; return parseInt(take.e.charAt(i), 36) / 35; }
  function say(label, text, clip, opts) {
    opts = opts || {}; stopVoice(); var tok = vo.tok; vo.text = text || ''; vo.then = opts.then || null; vo.gap = opts.gap === undefined ? 900 : opts.gap; vo.start = performance.now();
    if (elLabel) { elLabel.textContent = label || 'Ava'; elLabel.classList.remove('rv'); void elLabel.offsetWidth; elLabel.classList.add('rv'); }
    setCaption('');
    var takes = VOICE[clip], take = takes && takes.length ? takes[(Math.random() * takes.length) | 0] : null; vo.take = take; vo.est = take ? take.d : Math.max(2.5, vo.text.length * 0.065);
    if (voiceOn && take && !(attract && !tour && clip !== 'idle')) {
      var au = new Audio('audio/frontdesk/' + take.f); au.preload = 'auto'; vo.au = au; vo.mode = 'audio';
      au.onended = function () { if (tok === vo.tok) finishVoice(tok); };
      au.onerror = function () { if (tok !== vo.tok) return; vo.au = null; vo.mode = 'time'; vo.start = performance.now(); autoCC(true); };
      var pr; try { pr = au.play(); } catch (e) { pr = null; }
      if (pr && pr.catch) pr.catch(function () { if (tok !== vo.tok) return; vo.au = null; vo.mode = 'time'; vo.start = performance.now(); autoCC(true); });
    } else { vo.mode = 'time'; }
  }
  function finishVoice(tok) { vo.mode = 'none'; vo.au = null; setCaption(vo.text, true); var then = vo.then; vo.then = null; if (then) vo.timer = setTimeout(function () { if (tok === vo.tok) then(); }, vo.gap); }
  function voiceProgress() {
    if (vo.mode === 'audio' && vo.au) { var t = vo.au.currentTime || 0, d = isFinite(vo.au.duration) && vo.au.duration > 0 ? vo.au.duration : vo.est; return { t: t, p: Math.min(1, t / d), a: envAt(vo.take, t) }; }
    if (vo.mode === 'time') { var tt = (performance.now() - vo.start) / 1000, p = Math.min(1, tt / vo.est); if (p >= 1) { finishVoice(vo.tok); return { t: tt, p: 1, a: 0 }; } return { t: tt, p: p, a: vo.take ? envAt(vo.take, tt) : 0.35 + 0.35 * Math.abs(Math.sin(tt * 9) * Math.sin(tt * 3.3)) }; }
    return null;
  }
  var capShown = '';
  function setCaption(s, full) { if (!elCap) return; if (s === capShown) return; capShown = s; elCap.textContent = s; }
  function autoCC(on) { if (on && !ccOn) { root.classList.add('cc-auto'); } else if (!on) root.classList.remove('cc-auto'); }
  if (elCC) elCC.addEventListener('click', function () { ccOn = !ccOn; elCC.setAttribute('aria-pressed', ccOn ? 'true' : 'false'); root.classList.toggle('cc', ccOn); sfx.tap(); });
  if (elMute) elMute.addEventListener('click', function () { voiceOn = !voiceOn; elMute.setAttribute('aria-pressed', voiceOn ? 'true' : 'false'); if (!voiceOn) { if (vo.au) { var tt = vo.au.currentTime || 0; try { vo.au.pause(); } catch (e) {} vo.au = null; vo.mode = 'time'; vo.start = performance.now() - tt * 1000; } autoCC(true); } else autoCC(false); });

  /* ================= scene setup ================= */
  async function init3D() {
    if (ok) return true; if (loading) return false; loading = true;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.setClearColor(0x05090a, 1); elGl.appendChild(renderer.domElement);
      scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100); camera.position.copy(camP);
      scene.add(new THREE.AmbientLight(0xb8c8c4, 0.55)); keyL = new THREE.DirectionalLight(0xffffff, 0.9); keyL.position.set(-3, 5, 6); scene.add(keyL);
      rimL = new THREE.PointLight(0x3fc3ec, 1.6, 14); rimL.position.set(3, 3, -3); scene.add(rimL); fillL = new THREE.PointLight(0x86bc25, 0.8, 12); fillL.position.set(-3, 1, 3); scene.add(fillL);
      /* holographic floor grid */
      floorMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(C_AQUA) }, uTime: { value: 0 }, uLight: { value: 0 }, uOp: { value: 1 } }, vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
        fragmentShader: 'uniform vec3 uCol; uniform float uTime; uniform float uLight; uniform float uOp; varying vec3 vW; void main(){ vec2 p = vW.xz; vec2 g = abs(fract(p*2.0 - 0.5) - 0.5)/fwidth(p*2.0); float line = 1.0 - min(min(g.x, g.y), 1.0); float d = length(p - vec2(0.0, 0.3)); float fade = smoothstep(5.5, 0.5, d); float pulse = smoothstep(0.25, 0.0, abs(d - mod(uTime*0.9, 7.0)))*0.6; float a = (line*0.28 + pulse*line*1.2 + 0.02)*fade*uOp; if (uLight > 0.5) gl_FragColor = vec4(uCol*0.35, a*0.7); else gl_FragColor = vec4(uCol, a); }',
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, extensions: { derivatives: true } });
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMat); floor.rotation.x = -PI / 2; floor.position.y = -0.002; scene.add(floor);
      floorShadow = window.ProtoTheme ? ProtoTheme.shadow(1.6, 0.9) : null; if (floorShadow) { floorShadow.position.y = 0.001; scene.add(floorShadow); }
      /* backdrop and drifting dust */
      var bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ map: canvasTex(256, 192, function (x) { x.fillStyle = '#05090a'; x.fillRect(0, 0, 256, 192); var r = x.createRadialGradient(128, 80, 0, 128, 80, 140); r.addColorStop(0, 'rgba(63,195,236,0.10)'); r.addColorStop(1, 'rgba(63,195,236,0)'); x.fillStyle = r; x.fillRect(0, 0, 256, 192); var r2 = x.createRadialGradient(128, 190, 0, 128, 190, 120); r2.addColorStop(0, 'rgba(134,188,37,0.08)'); r2.addColorStop(1, 'rgba(134,188,37,0)'); x.fillStyle = r2; x.fillRect(0, 0, 256, 192); }), depthWrite: false }));
      bg.position.set(0, 4, -16); scene.add(bg); bg.userData.ptVis = true; scene.userData.bg = bg;
      var R = rng(77), DN = 260, dp = new Float32Array(DN * 3); for (var i = 0; i < DN; i++) { dp[i * 3] = (R() - 0.5) * 12; dp[i * 3 + 1] = R() * 7; dp[i * 3 + 2] = -1 - R() * 7; } var dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); scene.userData.dust = new THREE.Points(dg, pointsMat(0.045, C_AQUA, 0.5)); scene.add(scene.userData.dust);
      pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3)); var pPts = new THREE.Points(pGeo, pointsMat(0.07, 0xffffff, 1, true)); pPts.frustumCulled = false; scene.add(pPts);
      for (var rI = 0; rI < 8; rI++) { var rm = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 72), new THREE.MeshBasicMaterial({ color: C_LIME, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); rm.visible = false; scene.add(rm); rings.push({ mesh: rm, on: false, t: 0, size: 1 }); }
      try { if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass) { composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera)); bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.38, 0.45, 0.72); composer.addPass(bloom); } } catch (e) { composer = null; bloom = null; }
      ava = buildAva(); scene.add(ava.root);
      chapters = [buildMeet(), buildRush(), buildVision(), buildSkills(), buildStack(), buildDay(), buildFinale()];
      CH.forEach(function (c, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'topic'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false');
        b.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + (ICON[DOCK_ICONS[i]] || '') + '"/></svg><b>' + c.dock + '</b><span class="dots">' + c.notes.map(function () { return '<i></i>'; }).join('') + '</span>';
        b.addEventListener('click', function () { poke(); setChapter(i); }); elDock.appendChild(b); dockBtns.push(b);
      });
      elDock.style.setProperty('--nm', NC);
      ok = true; loading = false; return true;
    } catch (err) { console.error(err); failed = true; loading = false; var sp = elLoad && elLoad.querySelector('span'); if (sp) sp.textContent = 'This display could not load 3D'; return false; }
  }
  var DOCK_ICONS = ['sparkles', 'clock', 'radar', 'bell', 'layers', 'plane', 'door'];

  /* ================= navigation, hotspots, tour ================= */
  function vKey(c, n) { return c + ':' + n; }
  function countSeen() { var n = 0; for (var k in visited) n++; return n; }
  function refreshProgress() {
    dockBtns.forEach(function (b, c) { var d = b.querySelectorAll('.dots i'), all = true; for (var n = 0; n < d.length; n++) { d[n].className = visited[vKey(c, n)] ? 'on' : ''; if (!visited[vKey(c, n)]) all = false; } b.classList.toggle('done', all); });
    if (elProg) elProg.innerHTML = 'Explored <b>' + countSeen() + '</b> / ' + TOTAL;
  }
  function markSeen(c, n) { var k = vKey(c, n); if (visited[k] || attract) return; visited[k] = true; refreshProgress(); var dd = dockBtns[c] && dockBtns[c].querySelectorAll('.dots i')[n]; if (dd) dd.classList.add('new'); }
  function letters(name) { var h = '', ls = name.lastIndexOf(' ') + 1; for (var i = 0; i < name.length; i++) { var ch = name[i]; h += ch === ' ' ? ' ' : '<span class="ch' + (i >= ls ? ' stix' : '') + '" style="animation-delay:' + (i * 34) + 'ms">' + ch + '</span>'; } return h + '<b class="ch" style="animation-delay:' + (name.length * 34) + 'ms">.</b>'; }
  function buildHotspots() {
    elHs.innerHTML = ''; hsEls = []; hsPos = [];
    CH[cur].notes.forEach(function (n, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hs' + (visited[vKey(cur, i)] ? ' seen' : ''); b.setAttribute('aria-label', n[0]); b.style.setProperty('--d', (0.6 + i * 0.12) + 's'); b.innerHTML = '<i></i><span>' + n[0] + '</span>';
      b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      b.addEventListener('click', function (e) { e.stopPropagation(); poke(); if (chapters[cur] && chapters[cur].playing) chapters[cur].playing = false; selectHS(i); }); elHs.appendChild(b); hsEls.push(b);
    });
  }
  function selectHS(i, then) {
    var M = chapters[cur], def = CH[cur], note = def.notes[i]; if (!M || !note) return;
    sel = i; root.classList.add('hassel'); markSeen(cur, i); sfx.select(); kick = Math.max(kick, 0.6);
    hsEls.forEach(function (el, k) { el.classList.toggle('on', k === i); if (visited[vKey(cur, k)]) el.classList.add('seen'); });
    M.anchors[i](tmpV); burstV(tmpV, 40, 1.1, 0.8, [C_LIME, C_AQUA, C_WHITE]); ringAt(tmpV, C_LIME, 0.45);
    M.select(i);
    var after = then || (tour ? tourAdvance : (!attract && countSeen() >= TOTAL && !celebrated ? celebrate : null));
    say(note[0], note[1], def.key + '-' + (i + 1), { then: after });
  }
  function playIntro(then) { var M = chapters[cur], def = CH[cur]; sel = -1; root.classList.remove('hassel'); hsEls.forEach(function (el) { el.classList.remove('on'); }); M.deselect(); ava.setBase(M.ava.pose); say(def.name, def.intro, def.key + '-0', { then: then || (tour ? tourAdvance : null) }); }
  function setChapter(i, silent) { if (i === cur || tw.phase !== 'idle' || !ok) return false; dockBtns.forEach(function (b) { b.disabled = true; }); if (cur < 0) { commit(i, silent); tw.phase = 'in'; tw.t = 0; return true; } tw.phase = 'out'; tw.t = 0; tw.next = i; tw.silent = silent; sfx.whoosh(); return true; }
  function commit(i, silent) {
    if (cur >= 0 && chapters[cur]) { chapters[cur].leave(); chapters[cur].group.visible = false; chapters[cur].vis = 0; chapters[cur].playing = false; }
    cur = i; var M = chapters[i], def = CH[i]; M.group.visible = true; M.vis = 0; sel = -1; root.classList.remove('hassel'); M.enter();
    ava.posT.set(M.ava.p[0], M.ava.p[1], M.ava.p[2]); ava.ryT = M.ava.ry; ava.sT = M.ava.s; ava.setBase(M.ava.pose); ava.tintT.set(i === 4 ? '#3fc3ec' : '#3fc3ec');
    camPT.set(M.cam.p[0], M.cam.p[1], M.cam.p[2]); camLT.set(M.cam.l[0], M.cam.l[1], M.cam.l[2]); orbitYawT = 0;
    dockBtns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); }); elPill.style.transform = 'translateX(' + (i * 100) + '%)'; elNum.innerHTML = '0' + (i + 1) + '<i> / 0' + NC + '</i>';
    elTitle.innerHTML = letters(def.name); root.classList.remove('ttl'); void root.offsetWidth; root.classList.add('ttl');
    if (elActL) elActL.textContent = def.act || ''; if (elAct) elAct.hidden = !def.act;
    root.style.setProperty('--acc', ACC[i]); root.style.setProperty('--acc2', ACC2[i]); accTgt.set(ACC[i]);
    buildHotspots(); burst(0, 1.2, 0, 120, 2.4, 1.1, [C_AQUA, C_LIME, C_WHITE]); flash();
    if (!silent) playIntro();
  }
  function tourSteps() { var s = []; for (var c = 0; c < NC; c++) { s.push({ c: c, n: -1 }); for (var n = 0; n < CH[c].notes.length; n++) s.push({ c: c, n: n }); if (c === 1 || c === 2 || c === 4 || c === 6) s.push({ c: c, n: -2 }); } return s; }
  function tourAdvance() {
    if (!tour) return; if (tw.phase !== 'idle') { setTimeout(tourAdvance, 300); return; }
    tour.k++; if (tour.k >= tour.steps.length) { endTour(true); return; }
    var s = tour.steps[tour.k]; if (s.c !== cur) { setChapter(s.c); return; } if (s.n >= 0) selectHS(s.n); else if (s.n === -2) runAct(tourAdvance); else playIntro();
  }
  function endTour(done) { tour = null; elTour.setAttribute('aria-pressed', 'false'); elTour.lastChild.textContent = 'Guided tour'; elTour.firstChild.innerHTML = '<path d="M7 4.5v15l13-7.5z"/>'; if (done) { ava.gesture('wave', 3); confetti(); sfx.ready(); } }
  function celebrate() { celebrated = true; kick = 2.4; sfx.ready(); confetti(); ava.gesture('open', 3); ava.flash = 1; for (var fw = 0; fw < 6; fw++) (function (n) { setTimeout(function () { burst((Math.random() - 0.5) * 3, 1 + Math.random() * 2.4, 0.5, 120, 2.6, 1.4, [C_GREEN, C_LIME, C_AQUA, C_WHITE, C_GOLD]); }, n * 260); })(fw); }
  function runAct(then) { var M = chapters[cur]; if (!M || !CH[cur].act) { if (then) then(); return; } sel = -1; root.classList.add('hassel'); hsEls.forEach(function (el) { el.classList.remove('on'); }); M.deselect(); kick = Math.max(kick, 1); if (elAct) { elAct.classList.add('fired'); setTimeout(function () { elAct.classList.remove('fired'); }, 700); } if (elLabel) { elLabel.textContent = CH[cur].act; } M.act(then || null); }
  if (elAct) { elAct.addEventListener('pointerdown', function (e) { e.stopPropagation(); poke(); }); elAct.addEventListener('click', function () { if (cur < 0 || tw.phase !== 'idle') return; runAct(null); }); }
  elTour.addEventListener('pointerdown', function (e) { e.stopPropagation(); pokeKeep = true; poke(); pokeKeep = false; });
  elTour.addEventListener('click', function () { if (!ok) return; if (tour) { endTour(false); return; } tour = { steps: tourSteps(), k: -1 }; elTour.setAttribute('aria-pressed', 'true'); elTour.lastChild.textContent = 'Stop tour'; elTour.firstChild.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2"/>'; if (cur !== 0) tour.k = -1; tourAdvance(); });
  ['fcc', 'fmute', 'homeF'].forEach(function (id) { var e = $(id); if (e) e.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); poke(); }); });
  var pokeKeep = false;
  function poke() { lastTouch = performance.now(); if (tour && !pokeKeep) endTour(false); if (attract) { attract = false; root.classList.remove('attract'); } }

  /* ================= enter / leave ================= */
  function resetState() {
    stopVoice(); tour = null; elTour.setAttribute('aria-pressed', 'false'); elTour.lastChild.textContent = 'Guided tour'; elTour.firstChild.innerHTML = '<path d="M7 4.5v15l13-7.5z"/>';
    visited = {}; celebrated = false; attract = false; root.classList.remove('attract', 'hassel', 'cc-auto'); sel = -1; tw = { phase: 'idle', t: 0, next: -1 }; elHs.innerHTML = ''; hsEls = []; setCaption(''); refreshProgress();
    if (cur >= 0 && chapters[cur]) { chapters[cur].group.visible = false; chapters[cur].leave(); } cur = -1; dockBtns.forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
  }
  function enter() {
    mode = 'on'; root.style.display = 'block'; void root.offsetWidth; root.classList.add('on'); root.classList.remove('ready'); if (elLoad) elLoad.classList.remove('off'); lastTouch = performance.now(); actx();
    init3D().then(function (good) {
      if (!good || mode !== 'on') return; if (elLoad) elLoad.classList.add('off'); resetState(); root.classList.add('ready');
      if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(frame); }
      padStart(); commit(0, true); tw.phase = 'in'; tw.t = 0; dockBtns.forEach(function (b) { b.disabled = true; });
      ava.pos.set(0, 0, 0); ava.posT.set(0, 0, 0); ava.s = ava.sT = chapters[0].ava.s; camP.set(0, 1.6, 11.5); camL.set(0, 1.4, 0); ava.materialize(2.8); ava.gesture('open', 4.2);
      setTimeout(function () { if (mode !== 'on' || cur !== 0) return; var gv = C.greet[(Math.random() * C.greet.length) | 0]; say('Ava', gv.text, gv.clip, { then: function () { if (cur === 0 && !tour) playIntro(); }, gap: 400 }); }, 2400);
    });
  }
  function leave() { mode = 'off'; running = false; stopVoice(); padStop(); tour = null; root.classList.remove('on', 'ready'); setTimeout(function () { if (mode !== 'on') root.style.display = 'none'; }, 700); }

  /* ================= input: touch Ava, drag to look around, swipe to change chapter ================= */
  var ptr = null, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  root.addEventListener('pointerdown', function (e) {
    e.stopPropagation(); poke(); sfx.tap(); var p = toStage(e), r = document.createElement('div'); r.className = 'rip'; r.style.left = p.x + 'px'; r.style.top = p.y + 'px'; root.appendChild(r); setTimeout(function () { r.remove(); }, 900);
    if (e.target.closest && e.target.closest('button')) return; if (!ok || cur < 0) return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), yaw: orbitYawT };
    try { root.setPointerCapture(e.pointerId); } catch (err) {}
    ndc.set(p.x / W * 2 - 1, -(p.y / H * 2 - 1)); ray.setFromCamera(ndc, camera); var hits = ray.intersectObjects([ava.torso, ava.head], false);
    if (hits.length) { var gs = ['wave', 'laugh', 'chest', 'open']; ava.gesture(gs[(Math.random() * gs.length) | 0], 2.2); ava.flash = 0.8; ava.glitch = 0.5; burstV(hits[0].point, 50, 1.2, 0.9, [C_AQUA, C_WHITE, C_LIME]); ringAt(hits[0].point, C_AQUA, 0.5); sfx.chime(((Math.random() * 6) | 0) + 1); }
    else { ray.ray.at(8, tmpV); burstV(tmpV, 12, 0.8, 0.6, [C_AQUA, C_LIME]); }
  });
  root.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect(); par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!ptr || ptr.id !== e.pointerId) return; var k = W / r.width; orbitYawT = clamp(ptr.yaw - (e.clientX - ptr.sx) * k * 0.0018, -0.55, 0.55); lastTouch = performance.now();
  });
  function up(e) {
    if (!ptr || ptr.id !== e.pointerId) return; var r = stage.getBoundingClientRect(), k = W / r.width, dx = (e.clientX - ptr.sx) * k, dy = (e.clientY - ptr.sy) * k, dtm = performance.now() - ptr.t;
    if (dtm < 450 && Math.abs(dx) > 220 && Math.abs(dx) > Math.abs(dy) * 1.6 && tw.phase === 'idle') { orbitYawT = 0; setChapter((cur + (dx < 0 ? 1 : NC - 1)) % NC); }
    ptr = null; setTimeout(function () { if (!ptr) orbitYawT = 0; }, 2500);
  }
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  root.addEventListener('wheel', function (e) { e.preventDefault(); poke(); orbitYawT = clamp(orbitYawT + e.deltaY * 0.0015, -0.55, 0.55); }, { passive: false });
  elDock.addEventListener('keydown', function (event) { var tabs = Array.prototype.slice.call(elDock.querySelectorAll('[role="tab"]')); var next = window.KioskUI ? KioskUI.nextTab(event.key, tabs.indexOf(document.activeElement), tabs.length) : null; if (next === null) return; event.preventDefault(); tabs[next].focus(); tabs[next].click(); });

  /* ================= frame loop ================= */
  var hsProj = V(0, 0, 0);
  function frame(now) {
    if (!running) return; requestAnimationFrame(frame);
    var wantLT = window.ProtoTheme ? ProtoTheme.isOn() : false; if (wantLT !== themeSeen) { themeSeen = wantLT; if (wantLT || scene.userData.themed) { scene.userData.themed = true; LT = wantLT; ProtoTheme.apply(scene, wantLT); renderer.setClearColor(wantLT ? ProtoTheme.BG_HEX : 0x05090a, 1); if (bloom) bloom.enabled = !wantLT; if (floorShadow) floorShadow.visible = wantLT; scene.userData.bg.visible = !wantLT; } }
    var dt = Math.min(window.__fdCap || 0.1, (now - lastT) / 1000); lastT = now; if (!(dt >= 0)) dt = 0.016; TT += dt; var T = TT;
    /* voice: envelope drives Ava, the waveform and the captions */
    var vp = voiceProgress(), target = vp ? vp.a : 0; amp += (target - amp) * (target > amp ? 0.55 : 0.2); ampS = damp(ampS, vp ? 1 : 0, 6, dt);
    if (vp) { var n = Math.floor(vp.p * vo.text.length); if ((ccOn || root.classList.contains('cc-auto')) && vo.text) setCaption(vo.text.slice(0, Math.max(n, 1)) + (n < vo.text.length ? '' : '')); }
    for (var w = 0; w < waveBars.length; w++) { var hb = 0.1 + ampS * (0.1 + 0.9 * amp * (0.45 + 0.55 * Math.abs(Math.sin(T * 8.1 + w * 1.3) * Math.sin(T * 3.7 + w * 0.7)))); waveBars[w].style.transform = 'scaleY(' + hb.toFixed(3) + ')'; }
    if (elVoiceBar) { var spk = !!vp; if (spk !== elVoiceBar._s) { elVoiceBar._s = spk; elVoiceBar.classList.toggle('spk', spk); } }
    /* idle attract */
    var nowMs = performance.now();
    if (cur >= 0 && !attract && !tour && nowMs - lastTouch > 30000 && tw.phase === 'idle') { attract = true; atStep = -2; atNext = nowMs + 300; root.classList.add('attract'); }
    if (attract && nowMs >= atNext && tw.phase === 'idle') { atStep++; if (atStep === -1) { ava.gesture('wave', 3); say('Ava', C.idle, 'idle'); atNext = nowMs + 6500; } else if (atStep >= CH[cur].notes.length) { atStep = -1; setChapter((cur + 1) % NC, true); atNext = nowMs + 4000; } else { selectHS(atStep); atNext = nowMs + 7000; } }
    /* chapter tween */
    if (tw.phase === 'out') { tw.t += dt / 0.45; chapters[cur].vis = Math.max(0, 1 - eIO(tw.t)); if (tw.t >= 1) { commit(tw.next, tw.silent); tw.phase = 'in'; tw.t = 0; } }
    else if (tw.phase === 'in') { tw.t += dt / 0.9; chapters[cur].vis = eO(tw.t); if (tw.t >= 1) { tw.phase = 'idle'; chapters[cur].vis = 1; dockBtns.forEach(function (b) { b.disabled = false; }); if (tour && tour.steps[tour.k] && tour.steps[tour.k].c === cur && tour.steps[tour.k].n === -1) playIntro(); } }
    var M = chapters[cur];
    /* camera: glide between chapter framings, lean in on a selection, orbit while dragging */
    var lookT = tmpV2.copy(camLT), posT = tmpV3.copy(camPT);
    if (M && sel >= 0 && M.anchors[sel]) { M.anchors[sel](hsProj); lookT.lerp(hsProj, 0.32); posT.lerp(hsProj, 0.12); }
    orbitYaw = damp(orbitYaw, orbitYawT, 4, dt); par.x = damp(par.x, par.tx, 2, dt); par.y = damp(par.y, par.ty, 2, dt);
    var ek = 1 - Math.exp(-dt * 1.9); camL.lerp(lookT, ek); camP.lerp(posT, ek);
    var ox = camP.x - camL.x, oz = camP.z - camL.z, cy = Math.cos(orbitYaw + par.x * 0.03), sy = Math.sin(orbitYaw + par.x * 0.03);
    camera.position.set(camL.x + ox * cy - oz * sy, camP.y - par.y * 0.12, camL.z + ox * sy + oz * cy); camera.lookAt(camL);
    /* world */
    ava.update(T, dt, amp);
    if (M) M.update(T, dt);
    holoMats.forEach(function (m) { if (m !== ava.mat) m.uniforms.uTime.value = T; });
    accCur.lerp(accTgt, Math.min(1, dt * 2)); if (rimL) rimL.color.copy(accCur);
    floorMat.uniforms.uTime.value = T; floorMat.uniforms.uCol.value.copy(accCur).lerp(new THREE.Color(C_AQUA), 0.4);
    if (scene.userData.dust) { scene.userData.dust.rotation.y = T * 0.01; scene.userData.dust.material.color.copy(accCur); if (LT) scene.userData.dust.material.color.multiplyScalar(0.55); }
    if (floorShadow) floorShadow.position.set(ava.pos.x, 0.001, ava.pos.z);
    kick *= Math.exp(-dt * 2.4); if (bloom) bloom.strength = 0.36 + kick * 0.25 + amp * 0.08;
    fxStep(dt); camera.updateMatrixWorld();
    /* hotspots follow their anchors */
    if (M) for (var i = 0; i < hsEls.length; i++) {
      M.anchors[i](hsProj); var vz = hsProj.clone().applyMatrix4(camera.matrixWorldInverse).z; hsProj.project(camera); var x = (hsProj.x * 0.5 + 0.5) * W, y = (-hsProj.y * 0.5 + 0.5) * H, el = hsEls[i];
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.style.opacity = tw.phase === 'idle' ? (vz > -0.1 ? 0 : 1) : clamp(M.vis, 0, 1); el.classList.toggle('flip', x > 640); hsPos[i] = [x, y];
    }
    if (composer && !LT) composer.render(); else renderer.render(scene, camera);
  }

  window.__fdesk = { dbg: function () { var M = chapters[4]; return M.slabs.map(function (s) { return [s.g.scale.x.toFixed(2), s.g.position.y.toFixed(2), s.bT.toFixed(2), s.g.visible, M.group.visible, M.vis]; }); }, wake: function () { lastTouch = performance.now(); }, enter: enter, leave: leave, idle: function () { lastTouch = 0; }, go: function (i) { setChapter(i); }, pick: function (i) { selectHS(i); }, act: function () { runAct(null); }, state: function () { return { cur: cur, sel: sel, ok: ok, failed: failed, tw: tw.phase, calls: renderer ? renderer.info.render.calls : 0, tris: renderer ? renderer.info.render.triangles : 0 }; } };
})();
