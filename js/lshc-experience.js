(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), hub = $('hub'), lshc = $('lshc');
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var mode = 'hub';
  window.__innoPaused = true;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function toStage(e) { var r = stage.getBoundingClientRect(), k = r.width / 1080; return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; }
  function rip(e, parent) {
    var p = toStage(e), d = document.createElement('div'); d.className = 'rip'; d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
    parent.appendChild(d); setTimeout(function () { d.remove(); }, 900);
  }

  /* ---------- small sound kit (Web Audio, no files) ---------- */
  var ac = null, lastTap = 0;
  function actx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e2) {} } return ac; }
  function tone(f, d, type, v, f2, dl) {
    var c = actx(); if (!c) return; var t0 = c.currentTime + (dl || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v || 0.03, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.05);
  }
  var sfx = {
    tap: function () { var n = performance.now(); if (n - lastTap < 60) return; lastTap = n; tone(1100, 0.09, 'sine', 0.022, 1700); },
    select: function () { tone(660, 0.3, 'sine', 0.04, 990); tone(990, 0.4, 'triangle', 0.03, 1320, 0.09); },
    scan: function () { tone(220, 1.4, 'sawtooth', 0.018, 1300); tone(440, 1.4, 'sine', 0.02, 2000, 0.05); },
    build: function () { tone(120, 2.4, 'sawtooth', 0.02, 700); tone(240, 2.4, 'sine', 0.02, 1100, 0.1); },
    ready: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.5, 'sine', 0.035, null, i * 0.1); }); },
    door: function () { tone(520, 0.3, 'sine', 0.04, 880); tone(880, 0.5, 'triangle', 0.03, 1320, 0.1); },
    seen: function (n) { tone(620 + n * 120, 0.28, 'sine', 0.035, null); tone(930 + n * 120, 0.35, 'triangle', 0.025, null, 0.08); }
  };

  /* ---------- hub (start screen) ---------- */
  var homeMedia = KioskUI.initHomeMedia(document, RM);
  function showHub() {
    mode = 'hub'; window.__innoPaused = true; leaveL(); if (window.__fdesk) window.__fdesk.leave(); hub.style.display = 'flex'; void hub.offsetWidth; hub.classList.remove('off');
    homeMedia.setActive(true);
    KioskUI.setView(document, mode);
  }
  function hideHub() { homeMedia.setActive(false); hub.classList.add('off'); setTimeout(function () { if (mode !== 'hub') hub.style.display = 'none'; }, 800); }
  hub.addEventListener('pointerdown', function (e) { e.stopPropagation(); rip(e, hub); sfx.tap(); });
  $('goInno').addEventListener('click', function () { sfx.door(); mode = 'inno'; window.__innoPaused = false; hideHub(); $('start').click(); KioskUI.setView(document, mode); });
  $('goLshc').addEventListener('click', function () { sfx.door(); mode = 'lshc'; hideHub(); enterL(); KioskUI.setView(document, mode); });
  $('goFd').addEventListener('click', function () { sfx.door(); mode = 'fdesk'; hideHub(); if (window.__fdesk) window.__fdesk.enter(); KioskUI.setView(document, mode); });
  $('homeF').addEventListener('click', function () { sfx.door(); showHub(); });
  $('homeI').addEventListener('click', function () { sfx.door(); if (window.__orbit) window.__orbit.reset(); showHub(); });
  $('homeL').addEventListener('click', function () { sfx.door(); showHub(); });
  KioskUI.setView(document, mode);
  ['bar', 'ldock'].forEach(function (id) {
    $(id).addEventListener('keydown', function (event) {
      var tabs = Array.from(this.querySelectorAll('[role="tab"]'));
      var next = KioskUI.nextTab(event.key, tabs.indexOf(document.activeElement), tabs.length);
      if (next === null) return;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  });
  ['homeI', 'homeL', 'homeF', 'voice', 'lvoice'].forEach(function (id) {
    $(id).title = $(id).getAttribute('aria-label');
  });


  /* ================= LSHC Experience Arena: five 3D screens (three.js) ================= */
  var LW = 1080, LH = 1920, PI2 = Math.PI * 2;
  var elGl = $('lgl'), elTitle = $('ltitle'), elTag = $('ltag'), elNum = $('lnum'), elAttract = $('lattract'), elHs = $('lhs'), elCard = $('lcard'), elCT = $('lctitle'), elCX = $('lctext');
  var elOrb = $('lorb'), elVbi = $('lvbi'), elLower = $('llower'), elVoice = $('lvoice'), elAct = $('lact'), elActL = $('lactl'), elDock = $('ldock'), elPill = $('lpill'), elProg = $('lprog');
  var elTour = $('ltour'), elLayers = $('llayers'), elLoad = $('lload'), waveBars = $('lwave').children, chips = elLayers.querySelectorAll('.chip');
  var MOTIFS = LCONTENT.motifs, NM = MOTIFS.length, TOTAL = NM * 5;
  function rng3(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function eIO(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eO(x) { return 1 - Math.pow(1 - x, 3); }
  function eBack(x) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  var C_AQUA = 0x3fc3ec, C_LIME = 0x86eb22, C_GREEN = 0x86bc25, C_ORANGE = 0xed8b00, C_TEAL = 0x005587, C_PAPER = 0xffffff;

  var LT = false, themeSeen = false, floorShadow = null, bgPlane = null;
  function setTheme(on) {
    LT = on; ProtoTheme.apply(scene, on); renderer.setClearColor(on ? ProtoTheme.BG_HEX : 0x080b09, 1); if (bloom) bloom.enabled = !on; if (floorShadow) floorShadow.visible = on; if (bgPlane) bgPlane.visible = !on;
  }
  var ICONS3 = {
    body: '<svg viewBox="0 0 48 48"><circle cx="24" cy="8" r="5"/><path d="M14 18h20M24 15v16M24 31l-8 14M24 31l8 14M14 18l-6 12M34 18l6 12"/></svg>',
    molecule: '<svg viewBox="0 0 48 48"><circle cx="14" cy="14" r="6"/><circle cx="36" cy="18" r="5"/><circle cx="24" cy="36" r="6"/><path d="M19 17l12 1M17 19l5 12M33 22l-6 10"/></svg>',
    cell: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><circle cx="21" cy="22" r="7"/><path d="M33 33l4 4M37 15l3-3M10 33l-3 3"/></svg>',
    imaging: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6"/></svg>',
    globe: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><ellipse cx="24" cy="24" rx="8" ry="18"/><path d="M6 24h36M9 14h30M9 34h30"/></svg>',
    genome: '<svg viewBox="0 0 48 48"><path d="M14 4c0 12 20 12 20 22s-20 10-20 18M34 4c0 12-20 12-20 22s20 10 20 18M17 12h14M17 36h14M15 24h18"/></svg>',
    journey: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="6"/><circle cx="8" cy="14" r="4"/><circle cx="40" cy="14" r="4"/><circle cx="10" cy="38" r="4"/><circle cx="38" cy="38" r="4"/><path d="M11 16l9 5M37 16l-9 5M13 35l7-6M35 35l-7-6"/></svg>'
  };

  /* ---------- state ---------- */
  var L3 = { ok: false, loading: false, failed: false, running: false };
  var renderer, composer, bloom, scene, camera, motifs = [], AN = null, lastT = 0, TT = 0;
  var cur = -1, sel = -1, tw = { phase: 'idle', t: 0, next: -1 }, started = false, audioOn = true, visited = {}, celebrated = false, tour = null, attract = false, atStep = -2, atNext = 0, lastTouch = 0;
  var typing = null, curAudio = null, sayTok = 0, doneTimer = 0, amp = 0, kick = 0, rotY = 0.3, rotX = 0.08, velY = 0, zoomK = 1, zoomKT = 1, dragging = false, ptrs = {}, swipe = null, pokeKeep = false, dragDX = 0, dragDY = 0;
  var lookC = new THREE.Vector3(), lookT = new THREE.Vector3(), camD = 9, camDT = 9, par = { x: 0, y: 0, tx: 0, ty: 0 };
  var tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), connT = -1, hsEls = [], hsPos = [], dockBtns = [];
  var TEX_DOT = null;
  var elStat = $('lstat'), elSweep = $('lsweep'), elToast = $('ltoast'), rimL = null, fillL = null, pedestal = null, pedRings = [], pedTicks = null, rainPts = null, rainPos = null, rainSpd = null, doneTopic = {}, statEls = [], statT = 0, accCur = new THREE.Color(0x00a3e0), accTgt = new THREE.Color(0x00a3e0);
  /* per-topic accent (UI + light), and simulated live readouts (decorative, not real data) */
  var ACC = [['#00a3e0', '#5cc8f2'], ['#86bc25', '#86eb22'], ['#86eb22', '#b7e320'], ['#a0dcff', '#3fc3ec'], ['#00a3e0', '#3fc3ec'], ['#86eb22', '#3fc3ec'], ['#3fc3ec', '#86eb22']];
  function nf(n) { return Math.floor(n).toLocaleString('en-IN'); }
  var STATS = [
    [{ l: 'Heart rate', u: 'bpm', f: function (T) { return 70 + Math.round(3 * Math.sin(T * 1.1) + 2 * Math.sin(T * 2.7)); }, p: function (T) { return 0.55 + 0.35 * Math.sin(T * 3.3); } }, { l: 'Oxygen', u: '%', f: function (T) { return 97 + Math.round(0.6 + 0.9 * Math.sin(T * 0.6)); }, p: function () { return 0.97; } }],
    [{ l: 'Screened', u: 'molecules', f: function (T) { return nf(1000000 + T * 48000); }, p: function (T) { return (T * 0.07) % 1; } }, { l: 'Binding fit', u: '%', f: function (T) { return 86 + Math.round(5 * Math.sin(T * 0.5)); }, p: function (T) { return 0.88 + 0.05 * Math.sin(T * 0.5); } }],
    [{ l: 'Engineered', u: '% of cells', f: function (T) { return 62 + Math.round(18 * (0.5 + 0.5 * Math.sin(T * 0.4))); }, p: function (T) { return 0.7 + 0.18 * Math.sin(T * 0.4); } }, { l: 'Viability', u: '%', f: function (T) { return 95 + Math.round(2 * Math.sin(T * 0.8)); }, p: function () { return 0.96; } }],
    [{ l: 'Slices read', u: 'of 512', f: function (T) { return nf((T * 14) % 512); }, p: function (T) { return ((T * 14) % 512) / 512; } }, { l: 'Areas flagged', u: 'for review', f: function (T) { return 1 + Math.floor(T / 4) % 3; }, p: function (T) { return 0.3 + 0.3 * Math.sin(T); } }],
    [{ l: 'In transit', u: 'shipments', f: function (T) { return 118 + Math.round(9 * Math.sin(T * 0.7)); }, p: function (T) { return 0.6 + 0.2 * Math.sin(T * 0.7); } }, { l: 'Sites online', u: 'countries', f: function (T) { return 46 + Math.round(2 * Math.sin(T * 0.3)); }, p: function () { return 0.9; } }],
    [{ l: 'Bases read', u: 'million', f: function (T) { return nf(T * 1.8); }, p: function (T) { return (T * 0.1) % 1; } }, { l: 'Variants flagged', u: 'so far', f: function (T) { return 3 + Math.floor(T / 3) % 9; }, p: function (T) { return 0.4 + 0.3 * Math.sin(T * 0.9); } }],
    [{ l: 'Devices', u: 'connected', f: function (T) { return nf(1284 + 14 * Math.sin(T * 0.6) + T * 0.3); }, p: function (T) { return 0.75 + 0.1 * Math.sin(T * 0.6); } }, { l: 'Alerts routed', u: 'today', f: function (T) { return nf(T / 2.2); }, p: function (T) { return (T * 0.09) % 1; } }]
  ];
  function renderStats(i) {
    var d = STATS[i] || []; elStat.innerHTML = ''; statEls = [];
    d.forEach(function (s) { var t = document.createElement('div'); t.className = 'st'; t.innerHTML = '<span class="sl">' + s.l + '</span><b class="sv">0</b><em class="su">' + s.u + '</em><i class="sb"><u></u></i>'; elStat.appendChild(t); statEls.push({ s: s, v: t.querySelector('.sv'), bar: t.querySelector('u'), last: '' }); });
  }
  function toast(a, b) { elToast.innerHTML = '<i></i><b>' + a + '</b><span>' + b + '</span>'; elToast.classList.remove('on'); void elToast.offsetWidth; elToast.classList.add('on'); sfx.ready(); }
  function dotTex() {
    if (TEX_DOT) return TEX_DOT; var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 64, 64); TEX_DOT = new THREE.CanvasTexture(c); return TEX_DOT;
  }
  function addMat(color, op) { return new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: op === undefined ? 1 : op, blending: THREE.AdditiveBlending, depthWrite: false }); }
  function pointsMat(size, color, op, vc) { return new THREE.PointsMaterial({ size: size, map: dotTex(), color: color, transparent: true, opacity: op === undefined ? 1 : op, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, vertexColors: !!vc }); }
  function holoMat(color, op, power, scanBand) {
    return new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color(color) }, uOp: { value: op }, uTime: { value: 0 }, uScan: { value: -99 }, uPow: { value: power || 2.2 }, uLight: { value: 0 }, uBand: { value: scanBand === undefined ? 1 : scanBand } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 uCol; uniform float uOp; uniform float uTime; uniform float uScan; uniform float uPow; uniform float uBand; uniform float uLight; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow); float band = 0.5 + 0.5*sin(vW.y*34.0 - uTime*1.7); float sc = smoothstep(0.32, 0.0, abs(vW.y - uScan)); float a = uOp*(0.05 + 0.7*f)*(1.0 - uBand*0.3 + uBand*0.3*band) + sc*0.55*uOp; vec3 c = mix(uCol, vec3(0.53,0.92,0.13), sc); vec4 o = vec4(c*(0.75 + 0.7*f), a); if (uLight > 0.5) { o = vec4(c*0.6, min(1.0, a*1.35)); } gl_FragColor = o; }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide
    });
  }
  function setOp(m, a) {
    if (m.isShaderMaterial) { m.uniforms.uOp.value = a; return; }
    var t = a < 0.995; if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; } m.opacity = a; m.depthWrite = !(t && a < 0.55);
  }

  /* ---------- anatomy: unpack the embedded BodyParts3D subset ---------- */
  function b64Bytes(b64) { var s = atob(b64), n = s.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = s.charCodeAt(i); return u; }
  async function loadAnatomy() {
    var u8 = b64Bytes(ANAT_B64), ds = new DecompressionStream('deflate'), buf = await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();
    var dv = new DataView(buf), hl = dv.getUint32(0, true), head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)).replace(/\u0000+$/, ''));
    var base = 4 + hl, ib = base + head.posBytes, mn = head.min, mx = head.max, sx = (mx[0] - mn[0]) / 65535, sy = (mx[1] - mn[1]) / 65535, sz = (mx[2] - mn[2]) / 65535;
    var byG = {}, parts = {};
    head.parts.forEach(function (p) { (byG[p.g] = byG[p.g] || []).push(p); });
    var groups = {};
    Object.keys(byG).forEach(function (gn) {
      var ps = byG[gn], nv = 0, ni = 0; ps.forEach(function (p) { nv += p.v; ni += p.i; });
      var pos = new Float32Array(nv * 3), idx = new Uint32Array(ni), vo = 0, io = 0, bmin = [1e9, 1e9, 1e9], bmax = [-1e9, -1e9, -1e9];
      ps.forEach(function (p) {
        var q = new Int16Array(buf, base + p.po, p.v * 3), ix = new Uint16Array(buf, ib + p.io, p.i), pmn = [1e9, 1e9, 1e9], pmx = [-1e9, -1e9, -1e9];
        for (var k = 0; k < p.v; k++) {
          var x = mn[0] + (q[3 * k] + 32768) * sx, y = mn[1] + (q[3 * k + 1] + 32768) * sy, z = mn[2] + (q[3 * k + 2] + 32768) * sz, o = (vo + k) * 3; pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
          if (x < pmn[0]) pmn[0] = x; if (y < pmn[1]) pmn[1] = y; if (z < pmn[2]) pmn[2] = z; if (x > pmx[0]) pmx[0] = x; if (y > pmx[1]) pmx[1] = y; if (z > pmx[2]) pmx[2] = z;
        }
        for (var j = 0; j < p.i; j++) idx[io + j] = ix[j] + vo; vo += p.v; io += p.i;
        for (var a = 0; a < 3; a++) { if (pmn[a] < bmin[a]) bmin[a] = pmn[a]; if (pmx[a] > bmax[a]) bmax[a] = pmx[a]; }
        parts[p.n] = { min: pmn, max: pmx };
      });
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
      groups[gn] = { geo: geo, min: bmin, max: bmax };
    });
    return { groups: groups, parts: parts };
  }
  function gc(gn) { var b = AN.groups[gn]; return new THREE.Vector3((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2); }

  /* ---------- particles, rings ---------- */
  var PN = 700, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pBase = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN), pMax = new Float32Array(PN), pIdx = 0, pGeo, pPts, rings = [];
  function burst(x, y, z, n, spd, life, cols) {
    for (var i = 0; i < n; i++) {
      var k = pIdx++ % PN, a = Math.random() * PI2, b = Math.acos(2 * Math.random() - 1), s = spd * (0.35 + Math.random() * 0.65), c = new THREE.Color(cols[(Math.random() * cols.length) | 0]);
      pPos[k * 3] = x; pPos[k * 3 + 1] = y; pPos[k * 3 + 2] = z; pVel[k * 3] = Math.sin(b) * Math.cos(a) * s; pVel[k * 3 + 1] = Math.cos(b) * s; pVel[k * 3 + 2] = Math.sin(b) * Math.sin(a) * s;
      pBase[k * 3] = c.r; pBase[k * 3 + 1] = c.g; pBase[k * 3 + 2] = c.b; pMax[k] = pLife[k] = life * (0.6 + Math.random() * 0.4);
    }
  }
  function ringAt(x, y, z, color, size) {
    var r = null; for (var i = 0; i < rings.length; i++) if (!rings[i].on) { r = rings[i]; break; } if (!r) return;
    r.on = true; r.t = 0; r.size = size || 1.6; r.mesh.position.set(x, y, z); r.mesh.material.color.setHex(color); if (LT) r.mesh.material.color.multiplyScalar(0.55); r.mesh.visible = true;
  }
  function fxStep(dt) {
    for (var i = 0; i < PN; i++) {
      if (pLife[i] > 0) { pLife[i] -= dt; var f = Math.max(0, pLife[i] / pMax[i]); pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt; pVel[i * 3] *= 0.97; pVel[i * 3 + 1] *= 0.97; pVel[i * 3 + 2] *= 0.97; if (LT) { for (var q = 0; q < 3; q++) pCol[i * 3 + q] = ProtoTheme.BG[q] + (pBase[i * 3 + q] * 0.55 - ProtoTheme.BG[q]) * f; } else { pCol[i * 3] = pBase[i * 3] * f; pCol[i * 3 + 1] = pBase[i * 3 + 1] * f; pCol[i * 3 + 2] = pBase[i * 3 + 2] * f; } }
      else { if (LT) { pCol[i * 3] = ProtoTheme.BG[0]; pCol[i * 3 + 1] = ProtoTheme.BG[1]; pCol[i * 3 + 2] = ProtoTheme.BG[2]; } else pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0; }
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    rings.forEach(function (r) { if (!r.on) return; r.t += dt / 1.2; if (r.t >= 1) { r.on = false; r.mesh.visible = false; return; } r.mesh.scale.setScalar(0.1 + r.size * eO(r.t)); r.mesh.material.opacity = 0.55 * (1 - r.t); r.mesh.quaternion.copy(camera.quaternion); });
  }

  /* ---------- the guide: embedded voice, captions follow the audio ---------- */
  function stopAudio() { if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio.onended = curAudio.onerror = null; curAudio = null; } clearTimeout(doneTimer); }
  elVoice.addEventListener('pointerdown', function (e) { e.stopPropagation(); pokeKeep = true; poke(); pokeKeep = false; });
  elVoice.addEventListener('click', function () {
    audioOn = !audioOn; elVoice.setAttribute('aria-pressed', audioOn ? 'true' : 'false');
    if (!audioOn) { var cont = typing && typing.mode === 'audio'; if (curAudio) { try { curAudio.pause(); } catch (e) {} } if (cont) { typing.mode = 'time'; typing.start = performance.now() - typing.text.length * 12; typing.per = 24; } }
  });
  function say(title, text, clip, opts) {
    opts = opts || {}; stopAudio(); var tok = ++sayTok;
    elCT.textContent = title; elCT.classList.remove('rv'); void elCT.offsetWidth; elCT.classList.add('rv');
    var a = document.createElement('span'), b = document.createElement('span'); b.className = 'ghost'; b.textContent = text; elCX.textContent = ''; elCX.appendChild(a); elCX.appendChild(b);
    function finish() { if (tok !== sayTok) return; if (opts.then) doneTimer = setTimeout(function () { if (tok === sayTok) opts.then(); }, opts.gap || 1100); }
    var useAudio = audioOn && clip && AUDIO[clip] && started && !(attract && !tour && clip !== 'idle');
    if (useAudio) {
      var au = new Audio('data:' + ((window.AUDIO_MIME && AUDIO_MIME[clip]) || 'audio/mpeg') + ';base64,' + AUDIO[clip]); curAudio = au; au.preload = 'auto';
      typing = { a: a, b: b, text: text, mode: 'audio', au: au, finish: finish, tok: tok };
      au.onerror = function () { if (tok !== sayTok || !typing) return; typing.mode = 'time'; typing.start = performance.now(); typing.per = 32; };
      var pr; try { pr = au.play(); } catch (e) { pr = null; }
      if (pr && pr.catch) pr.catch(function () { if (tok !== sayTok || !typing) return; typing.mode = 'time'; typing.start = performance.now(); typing.per = 32; });
    } else if (RM) { a.textContent = text; b.textContent = ''; typing = null; finish(); }
    else typing = { a: a, b: b, text: text, mode: 'time', start: performance.now(), per: 26, finish: finish, tok: tok };
  }
  function poke() { lastTouch = performance.now(); if (tour && !pokeKeep) endTour(false); if (attract) { attract = false; elAttract.classList.remove('on'); } }

  /* ================= motif 1: the connected body (real anatomy) ================= */
  var BODY_LAYERS = [['skin'], ['muscle'], ['bone'], ['heart', 'lung', 'liver', 'gall', 'stomach', 'pancreas', 'intestine', 'colon', 'esoph', 'kidney', 'adrenal', 'spleen', 'brain'], ['artery', 'vein'], ['nerve']];
  var BODY_STD = {
    muscle: [0x9a3430, 0x2a0606, 0.2, 0.72], bone: [0xe8dfca, 0x3a3224, 0.12, 0.55], heart: [0xb3222c, 0x4a0408, 0.35, 0.45], lung: [0xd4ecf1, 0x3fc3ec, 0.32, 0.4], liver: [0x7a2c1c, 0x2a0a04, 0.2, 0.5],
    gall: [0x5a9a2e, 0x1a3a0a, 0.25, 0.4], stomach: [0xc9786a, 0x3a1410, 0.2, 0.5], pancreas: [0xd9a46e, 0x3a2410, 0.2, 0.5], intestine: [0xd98f7e, 0x3a1a14, 0.2, 0.5], colon: [0xc68068, 0x36180f, 0.2, 0.5],
    esoph: [0xc98080, 0x3a1414, 0.2, 0.5], kidney: [0x8f302c, 0x300808, 0.25, 0.45], adrenal: [0xe2b24e, 0x40300a, 0.3, 0.45], spleen: [0x6c2640, 0x240a14, 0.25, 0.5], brain: [0xdba3a0, 0x4a1c1c, 0.3, 0.55],
    artery: [0xe23a3a, 0xff2020, 0.5, 0.4], vein: [0x3d68dc, 0x2050ff, 0.45, 0.4], nerve: [0xf3dd4c, 0xf3dd4c, 0.7, 0.4]
  };
  function stdMat(name) { var d = BODY_STD[name]; return new THREE.MeshStandardMaterial({ color: d[0], emissive: d[1], emissiveIntensity: d[2], roughness: d[3], metalness: 0.08 }); }
  var BODY_PRESET = [
    { layers: [0.22, 0, 0, 1, 0.15, 0.95], hl: ['brain'] }, { layers: [0.3, 0, 0, 1, 1, 0], hl: ['heart', 'artery', 'vein'] }, { layers: [0.2, 0, 0.9, 1, 0, 0], hl: ['lung'] },
    { layers: [0.25, 0, 0, 1, 0.35, 0], hl: ['liver', 'stomach', 'intestine', 'colon', 'pancreas', 'gall', 'kidney'] }, { layers: [0.8, 0, 0, 0.3, 0.7, 0.55], hl: null }
  ];
  function buildBody() {
    var s = 3.4 / 1.72, g = new THREE.Group(), inner = new THREE.Group(); inner.scale.setScalar(s); inner.position.y = -0.86 * s; g.add(inner);
    var M = { key: 'body', group: g, inner: inner, layerA: [0, 0, 0, 0, 0, 0], layerT: [0.5, 0, 0.25, 1, 0.45, 0], layerMeshes: [[], [], [], [], [], []], meshByG: {}, skinMat: null, hl: null, hlA: 0, scanT: -1, focus: [5.4, 5.8, 5.6, 6.0, 6.2], tilt: false };
    BODY_LAYERS.forEach(function (names, li) { names.forEach(function (nm) { var gr = AN.groups[nm]; if (!gr) return; var mat = nm === 'skin' ? holoMat(C_AQUA, 1, 2.0, 1) : stdMat(nm); var mesh = new THREE.Mesh(gr.geo, mat); mesh.userData = { layer: li, name: nm }; inner.add(mesh); M.layerMeshes[li].push(mesh); M.meshByG[nm] = mesh; if (nm === 'skin') M.skinMat = mat; }); });
    var cB = gc('brain'), cH = gc('heart'), cL = gc('lung'), cV = gc('liver'), rp = AN.parts['Left radius'] || AN.parts['Right radius'] || null;
    var wr = rp ? new THREE.Vector3((rp.min[0] + rp.max[0]) / 2, rp.min[1] + 0.025, (rp.min[2] + rp.max[2]) / 2) : new THREE.Vector3(0.33, 0.85, 0);
    var loc = [cB.clone(), cH.clone().add(new THREE.Vector3(0, 0, 0.03)), cL.clone().add(new THREE.Vector3(-0.07, 0.03, 0.02)), cV.clone().add(new THREE.Vector3(0, -0.02, 0.02)), wr];
    M.anchors = loc.map(function (v) { return { get: function (o) { o.copy(v).multiplyScalar(s); o.y -= 0.86 * s; return o; } }; });
    M.act = 'Run a scan';
    var scanRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.014, 8, 96), addMat(C_LIME, 0.9)); scanRing.rotation.x = Math.PI / 2; scanRing.visible = false; g.add(scanRing);
    var scanDisc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 64), addMat(C_LIME, 0.1)); scanDisc.rotation.x = -Math.PI / 2; scanDisc.visible = false; g.add(scanDisc);
    var heartMesh = M.meshByG.heart, hc = cH.clone(), lungMesh = M.meshByG.lung, lc = cL.clone();
    M.onEnter = function () { M.layerT = [0.5, 0, 0.25, 1, 0.45, 0]; M.hl = null; };
    M.onSelect = function (i) { var p = BODY_PRESET[i]; M.layerT = p.layers.slice(); M.hl = p.hl; syncChips(); };
    M.onDeselect = function () { M.layerT = [0.5, 0, 0.25, 1, 0.45, 0]; M.hl = null; syncChips(); };
    M.doAct = function () { M.scanT = 0; sfx.scan(); scanRing.visible = scanDisc.visible = true; };
    M.update = function (T, dt) {
      if (M.skinMat) M.skinMat.uniforms.uTime.value = T;
      var k = Math.min(1, dt * 4); M.hlA += ((M.hl ? 1 : 0) - M.hlA) * k;
      for (var li = 0; li < 6; li++) {
        M.layerA[li] += (M.layerT[li] - M.layerA[li]) * k; var a = M.layerA[li];
        M.layerMeshes[li].forEach(function (mesh) {
          mesh.visible = a > 0.02; if (!mesh.visible) return;
          var nm = mesh.userData.name, inHL = M.hl && M.hl.indexOf(nm) >= 0, mul = li === 3 || li === 4 || li === 5 ? (M.hl ? (inHL ? 1 : 0.28) : 1) : 1, m = mesh.material;
          setOp(m, a * (nm === 'skin' ? 1 : mul)); if (m.emissiveIntensity !== undefined) { var d = BODY_STD[nm]; if (d) m.emissiveIntensity = d[2] * (inHL ? 2.4 : 1) * (1 + 0.25 * Math.sin(T * 3 + li)); }
        });
      }
      var bt = Math.pow(Math.max(0, Math.sin(T * 3.3)), 6), hs = 1 + (M.hl && M.hl.indexOf('heart') >= 0 ? 0.07 : 0.035) * bt;
      if (heartMesh) { heartMesh.scale.setScalar(hs); heartMesh.position.copy(hc).multiplyScalar(1 - hs); }
      if (lungMesh) { var ls = 1 + 0.018 * Math.sin(T * 1.4); lungMesh.scale.set(ls, ls, ls); lungMesh.position.copy(lc).multiplyScalar(1 - ls); }
      if (M.scanT >= 0) { M.scanT += dt / 2.6; var wy = 1.95 - 3.9 * eIO(Math.min(1, M.scanT)); scanRing.position.y = wy; scanDisc.position.y = wy; if (M.skinMat) M.skinMat.uniforms.uScan.value = wy; var op = Math.sin(Math.min(1, M.scanT) * Math.PI); scanRing.material.opacity = 0.9 * op; scanDisc.material.opacity = 0.12 * op; if (M.scanT >= 1) { M.scanT = -1; scanRing.visible = scanDisc.visible = false; if (M.skinMat) M.skinMat.uniforms.uScan.value = -99; } }
    };
    return M;
  }

  /* ================= motif 2: drug discovery ================= */
  function buildMolecule() {
    var g = new THREE.Group(), R = rng3(11), prot = new THREE.Group(); g.add(prot); prot.scale.setScalar(0.78);
    var M = { key: 'molecule', group: g, focus: [7.4, 7.2, 7.0, 8.0, 8.2], tilt: false, act: 'Dock the molecule' };
    var specs = [[-0.7, 0.55, 0.1, 0.2, 1, 0.1, 1.3], [0.75, 0.5, -0.1, -0.1, 1, 0.2, 1.2], [-0.85, -0.5, 0, 0.1, 1, -0.2, 1.2], [0.8, -0.55, 0.15, 0.15, 1, 0.1, 1.2], [0, 0.9, -0.6, 1, 0.1, 0.2, 1.3], [0, -0.95, -0.4, 1, -0.1, 0.1, 1.3], [0, 0, -0.95, 1, 0.2, 0, 1.4], [-0.38, 0.26, 0.66, 0.3, 1, 0.2, 0.75], [0.42, -0.2, 0.7, -0.2, 1, 0.2, 0.75]];
    var ends = [], helixMeshes = [], beadP = [], beadC = [];
    specs.forEach(function (sp, i) {
      var c = new THREE.Vector3(sp[0], sp[1], sp[2]), a = new THREE.Vector3(sp[3], sp[4], sp[5]).normalize(), u = new THREE.Vector3(0, 1, 0); if (Math.abs(a.y) > 0.9) u.set(1, 0, 0); u.cross(a).normalize(); var v = a.clone().cross(u).normalize(), pts = [], len = sp[6], pitch = 0.34, turns = len / pitch, n = Math.ceil(turns * 14);
      for (var k = 0; k <= n; k++) { var t = k / n, an = t * turns * PI2; pts.push(c.clone().add(a.clone().multiplyScalar((t - 0.5) * len)).add(u.clone().multiplyScalar(Math.cos(an) * 0.2)).add(v.clone().multiplyScalar(Math.sin(an) * 0.2))); }
      var col = new THREE.Color().setHSL(0.52 - i * 0.036, 0.78, 0.55), mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.046, 10, false), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.16, roughness: 0.3, metalness: 0.15 }));
      prot.add(mesh); helixMeshes.push(mesh); ends.push([pts[0], pts[n], c]); for (var bk = 0; bk <= n; bk += 4) { beadP.push(pts[bk].x, pts[bk].y, pts[bk].z); beadC.push(col.r, col.g, col.b); }
    });
    for (var e = 0; e < ends.length - 1; e++) {
      var p0 = ends[e][1], p1 = ends[e + 1][0], mid = p0.clone().add(p1).multiplyScalar(0.5), out = mid.clone().normalize().multiplyScalar(0.22);
      prot.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, mid.add(out), p1]), 20, 0.034, 6, false), new THREE.MeshStandardMaterial({ color: 0xf1f6ec, emissive: 0x335544, emissiveIntensity: 0.3, roughness: 0.4 })));
    }
    var pocket = new THREE.Vector3(0.02, 0.04, 0.92), sd = [], N = 1700; var spos = new Float32Array(N * 3), k2 = 0;
    for (var i = 0; i < N; i++) { var d = new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (d.length() < 0.05) continue; d.normalize(); if (d.angleTo(new THREE.Vector3(0.02, 0.04, 1)) < 0.4) continue; var rr = 1.33 + 0.07 * Math.sin(d.x * 7) * Math.sin(d.y * 6 + 1) + R() * 0.03; spos[k2++] = d.x * rr; spos[k2++] = d.y * rr; spos[k2++] = d.z * rr; }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(spos.slice(0, k2), 3)); prot.add(new THREE.Points(sg, pointsMat(0.05, C_AQUA, 0.5)));
    var pocketGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_LIME, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); pocketGlow.scale.set(0.75, 0.75, 1); pocketGlow.position.copy(pocket); prot.add(pocketGlow);
    var bdG = new THREE.BufferGeometry(); bdG.setAttribute('position', new THREE.Float32BufferAttribute(beadP, 3)); bdG.setAttribute('color', new THREE.Float32BufferAttribute(beadC, 3)); var beads = new THREE.Points(bdG, pointsMat(0.13, 0xffffff, 0.95, true)); prot.add(beads);
    var shell = new THREE.Mesh(bumpy(new THREE.SphereGeometry(1.36, 64, 48), 0.035, 5, 17), holoMat(C_AQUA, 0.75, 1.9, 1)); prot.add(shell);
    /* ligand: ball-and-stick */
    var lig = new THREE.Group(); lig.scale.setScalar(0.72); g.add(lig);
    var atoms = [[0.2, 0, 0, 'C'], [0.1, 0.173, 0, 'C'], [-0.1, 0.173, 0, 'N'], [-0.2, 0, 0, 'C'], [-0.1, -0.173, 0, 'C'], [0.1, -0.173, 0, 'C'], [0.42, 0, 0.04, 'O'], [0.22, 0.36, -0.05, 'C'], [0.02, 0.56, 0, 'N'], [-0.42, 0.02, -0.04, 'C'], [-0.62, -0.16, 0, 'O'], [-0.22, -0.36, 0.05, 'C']];
    var bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [1, 7], [7, 8], [3, 9], [9, 10], [4, 11]], ecol = { C: C_LIME, N: C_AQUA, O: C_ORANGE };
    atoms.forEach(function (a) { var m = new THREE.Mesh(new THREE.SphereGeometry(a[3] === 'C' ? 0.075 : 0.09, 20, 14), new THREE.MeshStandardMaterial({ color: ecol[a[3]], emissive: ecol[a[3]], emissiveIntensity: 0.3, roughness: 0.25 })); m.position.set(a[0], a[1], a[2]); lig.add(m); });
    bonds.forEach(function (b) { var A = new THREE.Vector3(atoms[b[0]][0], atoms[b[0]][1], atoms[b[0]][2]), B = new THREE.Vector3(atoms[b[1]][0], atoms[b[1]][1], atoms[b[1]][2]), d = B.clone().sub(A), len = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, len, 8), new THREE.MeshStandardMaterial({ color: 0xf1f6ec, emissive: 0x446655, emissiveIntensity: 0.4, roughness: 0.4 })); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); lig.add(m); });
    var lglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_LIME, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); lglow.scale.set(1.1, 1.1, 1); lig.add(lglow);
    var pocketW = pocket.clone().multiplyScalar(0.78), farPos = new THREE.Vector3(1.25, 0.85, 1.45), lstate = { mode: 'free', t: 0, from: farPos.clone(), to: farPos.clone(), chain: false };
    lig.position.copy(farPos);
    var ringsP = [0.2, 0.3, 0.4].map(function (r, i) { var m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 64), addMat(C_LIME, 0.4)); m.position.copy(pocketW); g.add(m); return m; });
    var hbP = new Float32Array(6 * 6), hbG = new THREE.BufferGeometry(); for (var h2 = 0; h2 < 6; h2++) { var ha = h2 / 6 * PI2; hbP.set([pocketW.x, pocketW.y, pocketW.z, pocketW.x + Math.cos(ha) * 0.36, pocketW.y + Math.sin(ha) * 0.36, pocketW.z - 0.14], h2 * 6); } hbG.setAttribute('position', new THREE.BufferAttribute(hbP, 3));
    var hbL = new THREE.LineSegments(hbG, new THREE.LineBasicMaterial({ color: C_LIME, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(hbL);
    /* AI swarm + hit points */
    var SN = 110, swPos = new Float32Array(SN * 3), sw = [], hitIdx = []; for (var s2 = 0; s2 < SN; s2++) sw.push({ a: R() * PI2, r: 1.5 + R() * 0.4, sp: 0.25 + R() * 0.5, y: (R() - 0.5) * 0.45 });
    var swG = new THREE.BufferGeometry(); swG.setAttribute('position', new THREE.BufferAttribute(swPos, 3)); var swarm = new THREE.Points(swG, pointsMat(0.06, C_AQUA, 0.85)), hitPos = new Float32Array(8 * 3), hitG = new THREE.BufferGeometry(); hitG.setAttribute('position', new THREE.BufferAttribute(hitPos, 3)); var hits = new THREE.Points(hitG, pointsMat(0.15, C_LIME, 1));
    var swGroup = new THREE.Group(); swGroup.rotation.set(0.5, 0, 0.32); swGroup.add(swarm); swGroup.add(hits); g.add(swGroup);
    var loop = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.011, 8, 180), addMat(C_GREEN, 0.5)); loop.rotation.set(1.15, 0, -0.55); g.add(loop);
    var arrows = []; for (var ar = 0; ar < 3; ar++) { var cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 12), addMat(C_LIME, 0.95)); loop.add(cone); arrows.push(cone); }
    var minis = []; [C_LIME, C_AQUA, C_ORANGE, C_GREEN, 0xa0dcff].forEach(function (mc) { var mg = new THREE.Group(); for (var q2 = 0; q2 < 3; q2++) { var ma = q2 * 2.1, ms = new THREE.Mesh(new THREE.SphereGeometry(0.052 - q2 * 0.009, 12, 10), new THREE.MeshBasicMaterial({ color: mc })); ms.position.set(Math.cos(ma) * 0.1, Math.sin(ma) * 0.1, 0); mg.add(ms); } var mgl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: mc, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); mgl.scale.setScalar(0.42); mg.add(mgl); loop.add(mg); minis.push(mg); });
    M.anchors = [
      { get: function (o) { return o.set(-0.2, 0.55, 0.2); } },
      { get: function (o) { return o.copy(lig.position); } },
      { get: function (o) { return o.copy(pocketW); } },
      { get: function (o) { var p = new THREE.Vector3(-1.5, 0.3, 0); p.applyEuler(swGroup.rotation); return o.copy(p); } },
      { get: function (o) { var p = new THREE.Vector3(1.72, 0, 0); p.applyEuler(loop.rotation); return o.copy(p); } }
    ];
    M.onEnter = function () { lstate = { mode: 'free', t: 0, from: lig.position.clone(), to: farPos.clone(), chain: false }; lstate.mode = 'move'; };
    M.onSelect = function () {}; M.onDeselect = function () {};
    M.doAct = function () { sfx.scan(); var bound = lstate.mode === 'bound'; lstate = { mode: 'move', t: 0, from: lig.position.clone(), to: bound ? farPos.clone() : pocketW.clone(), chain: bound, dur: bound ? 0.7 : 1.7 }; };
    M.update = function (T, dt) {
      prot.rotation.y = Math.sin(T * 0.25) * 0.08; prot.scale.setScalar(0.78 * (1 + 0.012 * Math.sin(T * 1.3))); shell.material.uniforms.uTime.value = T; var bnd = lstate.mode === 'bound';
      ringsP.forEach(function (r, i) { r.rotation.z = T * (0.6 + i * 0.3) * (i % 2 ? -1 : 1); r.scale.setScalar(1 + 0.08 * Math.sin(T * 3 + i) + (bnd ? 0.14 : 0)); r.material.opacity = bnd ? 0.85 : 0.28 + 0.15 * Math.sin(T * 2 + i); });
      hbL.material.opacity += ((bnd ? 0.5 + 0.4 * Math.sin(T * 14) : 0) - hbL.material.opacity) * Math.min(1, dt * 8);
      minis.forEach(function (m, i) { var an = -T * 0.32 + i * PI2 / 5; m.position.set(Math.cos(an) * 1.72, Math.sin(an) * 1.72, 0); m.rotation.z = T * 2 + i; });
      if (lstate.mode === 'move') { var tw3 = lig.getWorldPosition(new THREE.Vector3()); burst(tw3.x, tw3.y, tw3.z, 2, 0.25, 0.5, [C_LIME, C_AQUA]); } helixMeshes.forEach(function (h, i) { h.material.emissiveIntensity = 0.16 + 0.08 * Math.sin(T * 1.6 + i); });
      pocketGlow.material.opacity = lstate.mode === 'bound' ? 0.9 : 0.35 + 0.2 * Math.sin(T * 3);
      if (lstate.mode === 'move') { lstate.t += dt / (lstate.dur || 1.2); var k = Math.min(1, lstate.t), e2 = eIO(k); lig.position.lerpVectors(lstate.from, lstate.to, e2); lig.position.y += Math.sin(k * Math.PI) * 0.25; lig.rotation.y += dt * (6 - 4 * k); if (k >= 1) { if (lstate.chain) lstate = { mode: 'move', t: 0, from: lig.position.clone(), to: pocketW.clone(), chain: false, dur: 1.7 }; else if (lstate.to.distanceTo(pocketW) < 0.01) { lstate.mode = 'bound'; var wp = lig.getWorldPosition(new THREE.Vector3()); burst(wp.x, wp.y, wp.z, 160, 3.0, 1.3, [C_LIME, C_AQUA, C_PAPER]); ringAt(wp.x, wp.y, wp.z, C_LIME, 2.4); sfx.ready(); } else lstate.mode = 'free'; } }
      else if (lstate.mode === 'free') { lig.position.set(farPos.x + Math.cos(T * 0.7) * 0.18, farPos.y + Math.sin(T * 1.1) * 0.15, farPos.z); lig.rotation.y += dt * 0.8; lig.rotation.x = Math.sin(T * 0.6) * 0.4; }
      else if (lstate.mode === 'bound') { lig.position.copy(pocketW); lig.position.x += Math.sin(T * 9) * 0.003; lig.rotation.y += dt * 0.6; }
      sw.forEach(function (p, i) { p.a += p.sp * dt; swPos[i * 3] = Math.cos(p.a) * p.r; swPos[i * 3 + 1] = p.y + Math.sin(p.a * 2 + i) * 0.05; swPos[i * 3 + 2] = Math.sin(p.a) * p.r * 0.6; }); swG.attributes.position.needsUpdate = true;
      for (var h = 0; h < 8; h++) { var q = sw[h * 13]; hitPos[h * 3] = Math.cos(q.a) * q.r; hitPos[h * 3 + 1] = q.y; hitPos[h * 3 + 2] = Math.sin(q.a) * q.r * 0.6; } hitG.attributes.position.needsUpdate = true; hits.material.opacity = 0.6 + 0.4 * Math.sin(T * 5);
      arrows.forEach(function (c, i) { var an = T * 0.6 + i * PI2 / 3, rr = 1.72; c.position.set(Math.cos(an) * rr, Math.sin(an) * rr, 0); c.rotation.z = an; });
    };
    return M;
  }

  /* ================= motif 3: advanced therapies (a living cell) ================= */
  function bumpy(geo, amp, f, seed) { var p = geo.attributes.position, v = new THREE.Vector3(), R = rng3(seed), ph = [R() * 6, R() * 6, R() * 6]; for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); var n = 1 + amp * (Math.sin(v.x * f + ph[0]) * Math.sin(v.y * f * 1.1 + ph[1]) * Math.sin(v.z * f * 0.9 + ph[2])); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; }
  function fibDir(i, n) { var y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), th = i * 2.399963229728653; return new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r); }
  function barcodeTex(txt) { var c = document.createElement('canvas'); c.width = 256; c.height = 128; var x = c.getContext('2d'); x.fillStyle = 'rgba(6,18,12,0.7)'; x.fillRect(0, 0, 256, 128); x.strokeStyle = 'rgba(63,195,236,0.9)'; x.lineWidth = 3; x.strokeRect(2, 2, 252, 124); var R = rng3(3); x.fillStyle = '#f1f6ec'; var px = 20; while (px < 236) { var w = 2 + Math.floor(R() * 5); x.fillRect(px, 18, w, 62); px += w + 2 + Math.floor(R() * 4); } x.font = '600 22px sans-serif'; x.fillStyle = '#86eb22'; x.fillText(txt, 20, 108); return new THREE.CanvasTexture(c); }
  function buildCell() {
    var g = new THREE.Group(), R = rng3(21), M = { key: 'cell', group: g, focus: [6.0, 5.8, 6.0, 6.2, 6.6], tilt: false, act: 'Engineer the cell' };
    var TS = 0.82, tcell = new THREE.Group(); tcell.position.set(-0.62, 0.1, 0); tcell.scale.setScalar(TS); g.add(tcell);
    var memb = new THREE.Mesh(bumpy(new THREE.SphereGeometry(0.98, 72, 54), 0.03, 4.2, 5), holoMat(C_AQUA, 1.0, 1.6, 0)); tcell.add(memb);
    var nuc = new THREE.Group(); nuc.position.set(-0.08, 0.08, 0.05); tcell.add(nuc);
    var nsh = new THREE.Mesh(bumpy(new THREE.SphereGeometry(0.42, 48, 36), 0.04, 6, 8), holoMat(C_LIME, 1.0, 1.4, 0)); nuc.add(nsh);
    var chrom = []; for (var c = 0; c < 6; c++) { var pts = []; for (var k = 0; k < 9; k++) { var d = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(0.12 + R() * 0.2); pts.push(d); } var col = c % 2 ? C_AQUA : C_LIME, m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 60, 0.018, 6, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95 })); nuc.add(m); chrom.push(m); }
    var nucleolus = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: C_ORANGE, emissiveIntensity: 0.6 })); nucleolus.position.set(0.1, 0.05, 0.1); nuc.add(nucleolus);
    var mito = []; for (var m2 = 0; m2 < 6; m2++) { var dir = fibDir(m2 * 2 + 1, 12).multiplyScalar(0.68 + R() * 0.08); var mg = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: C_ORANGE, emissive: 0xaa4a00, emissiveIntensity: 0.55, roughness: 0.35, transparent: true, opacity: 0.92 })); mg.scale.set(0.2, 0.09, 0.09); mg.position.copy(dir); mg.lookAt(dir.clone().multiplyScalar(2)); mg.rotateY(Math.PI / 2); mg.rotateZ(R() * 3); tcell.add(mg); mito.push(mg); }
    var er = []; for (var e = 0; e < 3; e++) { var ep = []; for (var j = 0; j < 14; j++) { var a = j / 14 * PI2 * 1.5 + e * 2; ep.push(new THREE.Vector3(Math.cos(a) * 0.55, Math.sin(a * 1.7 + e) * 0.35, Math.sin(a) * 0.55)); } var em = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ep), 120, 0.012, 5, false), new THREE.MeshBasicMaterial({ color: C_AQUA, transparent: true, opacity: 0.35 })); tcell.add(em); er.push(em); }
    var RN = 88, stemG = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6); stemG.translate(0, 0.1, 0); var stems = new THREE.InstancedMesh(stemG, new THREE.MeshStandardMaterial({ color: 0xcfe9f0, emissive: C_AQUA, emissiveIntensity: 0.4 }), RN), tipG = new THREE.SphereGeometry(0.036, 10, 8), tips = new THREE.InstancedMesh(tipG, new THREE.MeshStandardMaterial({ color: C_LIME, emissive: C_LIME, emissiveIntensity: 0.5 }), RN);
    var rd = [], dm = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc1 = new THREE.Vector3(1, 1, 1);
    for (var r = 0; r < RN; r++) { var dd = fibDir(r, RN); rd.push(dd); q.setFromUnitVectors(up, dd); var pos = dd.clone().multiplyScalar(0.97); dm.compose(pos, q, sc1); stems.setMatrixAt(r, dm); dm.compose(dd.clone().multiplyScalar(1.19), q, sc1); tips.setMatrixAt(r, dm); }
    tcell.add(stems); tcell.add(tips);
    var target = new THREE.Group(); target.position.set(1.08, -0.3, 0.1); target.scale.setScalar(0.92); g.add(target);
    var tmem = new THREE.Mesh(bumpy(new THREE.SphereGeometry(0.56, 56, 42), 0.1, 5.5, 13), holoMat(0xff7a4a, 1.0, 1.3, 0)); target.add(tmem);
    var tnuc = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), new THREE.MeshStandardMaterial({ color: 0xff9a6a, emissive: 0xff5a1a, emissiveIntensity: 0.7, roughness: 0.4 })); target.add(tnuc);
    var AG = 46, agG = new THREE.SphereGeometry(0.03, 8, 6), ags = new THREE.InstancedMesh(agG, new THREE.MeshStandardMaterial({ color: C_ORANGE, emissive: C_ORANGE, emissiveIntensity: 0.5 }), AG); for (var a2 = 0; a2 < AG; a2++) { var dg = fibDir(a2, AG).multiplyScalar(0.6); dm.compose(dg, q.identity(), sc1); ags.setMatrixAt(a2, dm); } target.add(ags);
    var idTag = new THREE.Sprite(new THREE.SpriteMaterial({ map: barcodeTex('PATIENT ID 0042'), transparent: true })); idTag.scale.set(0.8, 0.4, 1); idTag.position.set(-1.0, -1.15, 0.4); g.add(idTag);
    var idLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.85, -0.97, 0.3), new THREE.Vector3(-0.78, -0.62, 0.1)]), new THREE.LineBasicMaterial({ color: C_AQUA, transparent: true, opacity: 0.7 })); g.add(idLine);
    var cyN = 240, cyPos = new Float32Array(cyN * 3); for (var cy = 0; cy < cyN; cy++) { var cd = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(0.3 + R() * 0.55); cyPos[cy * 3] = cd.x; cyPos[cy * 3 + 1] = cd.y; cyPos[cy * 3 + 2] = cd.z; }
    var cyG = new THREE.BufferGeometry(); cyG.setAttribute('position', new THREE.BufferAttribute(cyPos, 3)); var cyto = new THREE.Points(cyG, pointsMat(0.038, C_AQUA, 0.6)); tcell.add(cyto);
    var golgi = new THREE.Group(); golgi.position.set(0.4, -0.42, 0.34); for (var gi = 0; gi < 5; gi++) { var gm = new THREE.Mesh(new THREE.TorusGeometry(0.2 - gi * 0.022, 0.018, 8, 40, Math.PI * 1.3), new THREE.MeshStandardMaterial({ color: 0xa0dcff, emissive: C_AQUA, emissiveIntensity: 0.5, roughness: 0.4 })); gm.position.y = gi * 0.06 - 0.12; gm.rotation.x = Math.PI / 2; gm.rotation.z = gi * 0.12; golgi.add(gm); } tcell.add(golgi);
    var ves = []; for (var vi = 0; vi < 12; vi++) { var vm = new THREE.Mesh(new THREE.SphereGeometry(0.028 + R() * 0.02, 12, 10), new THREE.MeshBasicMaterial({ color: vi % 2 ? C_LIME : C_AQUA })); tcell.add(vm); ves.push({ m: vm, a: R() * PI2, r: 0.5 + R() * 0.3, y: (R() - 0.5) * 1.0, sp: 0.25 + R() * 0.5 }); }
    var eff = []; for (var ei = 0; ei < 4; ei++) { var eg = new THREE.Group(), em2 = new THREE.Mesh(bumpy(new THREE.SphereGeometry(0.17, 32, 24), 0.06, 6, 50 + ei), holoMat(C_LIME, 1, 1.5, 0)); eg.add(em2); eg.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: C_LIME, emissiveIntensity: 0.8 }))); var egl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_LIME, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })); egl.scale.setScalar(0.7); eg.add(egl); g.add(eg); eff.push({ g: eg, mat: em2.material, a: ei * PI2 / 4 }); }
    var decor = [[1.5, 0.66, -0.3, 0.3], [0.78, -1.0, -0.25, 0.26], [1.6, -0.95, 0.0, 0.22]].map(function (d, i) { var dg = new THREE.Group(); dg.position.set(d[0], d[1], d[2]); dg.userData.s = d[3]; dg.add(new THREE.Mesh(bumpy(new THREE.SphereGeometry(1, 40, 30), 0.1, 5.5, 70 + i), holoMat(0xff7a4a, 1.0, 1.3, 0))); dg.scale.setScalar(d[3]); g.add(dg); return dg; });
    function setDecor(f) { decor.forEach(function (d) { d.scale.setScalar(d.userData.s * Math.max(0.001, f)); }); }
    var cs = { mode: 'idle', t: 0, killed: 0 };
    M.anchors = [
      { get: function (o) { return o.copy(tcell.position).add(nuc.position.clone().multiplyScalar(TS)); } },
      { get: function (o) { return o.copy(tcell.position).add(new THREE.Vector3(0.9, 0.55, 0.3).multiplyScalar(TS)); } },
      { get: function (o) { return o.copy(target.position); } },
      { get: function (o) { return o.copy(tcell.position).add(mito[0].position.clone().multiplyScalar(TS)); } },
      { get: function (o) { return o.copy(idTag.position); } }
    ];
    M.onEnter = function () { cs = { mode: 'idle', t: 0, killed: 0 }; tcell.position.set(-0.62, 0.1, 0); target.scale.setScalar(0.92); target.visible = true; setDecor(1); };
    M.onSelect = function () {}; M.onDeselect = function () {};
    M.doAct = function () { sfx.scan(); cs = { mode: 'approach', t: 0, killed: 0 }; target.visible = true; target.scale.setScalar(0.92); setDecor(1); };
    M.update = function (T, dt) {
      memb.material.uniforms.uTime.value = T; nsh.material.uniforms.uTime.value = T; tmem.material.uniforms.uTime.value = T;
      tcell.rotation.y = T * 0.12; target.rotation.y = -T * 0.1; chrom.forEach(function (m, i) { m.rotation.y = T * (0.3 + i * 0.07); m.rotation.x = T * 0.2; });
      mito.forEach(function (m, i) { m.material.emissiveIntensity = 0.5 + 0.25 * Math.sin(T * 2 + i); });
      var base = new THREE.Vector3(-0.62, 0.1, 0);
      if (cs.mode === 'idle') { tcell.position.set(base.x + Math.sin(T * 0.5) * 0.04, base.y + Math.sin(T * 0.7) * 0.05, 0); }
      else if (cs.mode === 'approach') { cs.t += dt / 2.0; var k = eIO(Math.min(1, cs.t)); tcell.position.set(base.x + 0.5 * k, base.y - 0.14 * k, 0); if (cs.t >= 1) { cs.mode = 'bind'; cs.t = 0; var wp = target.getWorldPosition(new THREE.Vector3()); ringAt(wp.x - 0.3, wp.y + 0.1, wp.z, C_LIME, 1.8); burst(wp.x - 0.3, wp.y + 0.1, wp.z, 80, 2.0, 1.0, [C_LIME, C_AQUA]); sfx.select(); } }
      else if (cs.mode === 'bind') { cs.t += dt / 1.6; target.position.x = 1.08 + Math.sin(T * 40) * 0.012 * cs.t; if (cs.t >= 1) { cs.mode = 'kill'; cs.t = 0; var wq = target.getWorldPosition(new THREE.Vector3()); burst(wq.x, wq.y, wq.z, 320, 3.4, 1.8, [0xff7a4a, C_ORANGE, C_LIME, C_PAPER]); ringAt(wq.x, wq.y, wq.z, C_ORANGE, 3.0); sfx.ready(); } }
      else if (cs.mode === 'kill') { cs.t += dt / 1.0; target.scale.setScalar(Math.max(0.001, 0.92 * (1 - eO(Math.min(1, cs.t))))); setDecor(1 - eO(Math.min(1, cs.t))); if (cs.t >= 1) { target.visible = false; cs.mode = 'wait'; cs.t = 0; } }
      else if (cs.mode === 'wait') { cs.t += dt / 2.0; var kk = Math.min(1, cs.t); tcell.position.set(base.x + 0.5 * (1 - eIO(kk)), base.y - 0.14 * (1 - eIO(kk)), 0); if (cs.t >= 1) { cs.mode = 'idle'; target.position.set(1.08, -0.3, 0.1); target.visible = true; target.scale.setScalar(0.001); setDecor(0.001); cs.mode = 'respawn'; cs.t = 0; } }
      else if (cs.mode === 'respawn') { cs.t += dt / 1.0; target.scale.setScalar(Math.max(0.001, 0.92 * eBack(Math.min(1, cs.t)))); setDecor(eBack(Math.min(1, cs.t))); if (cs.t >= 1) { cs.mode = 'idle'; target.scale.setScalar(0.92); } }
      cyto.rotation.y = T * 0.09; cyto.rotation.x = T * 0.05; golgi.rotation.y = Math.sin(T * 0.4) * 0.3; tips.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(T * 3) + (cs.mode === 'approach' || cs.mode === 'bind' ? 0.7 : 0);
      ves.forEach(function (v) { var an = v.a + T * v.sp; v.m.position.set(Math.cos(an) * v.r, v.y + 0.08 * Math.sin(an * 2), Math.sin(an) * v.r * 0.8); });
      decor.forEach(function (d, i) { d.rotation.y = T * 0.12 + i; d.children[0].material.uniforms.uTime.value = T; });
      var ke = cs.mode === 'bind' ? Math.min(1, cs.t) : cs.mode === 'kill' ? 1 : cs.mode === 'wait' ? 1 - Math.min(1, cs.t) : 0, kk2 = eIO(ke);
      eff.forEach(function (e, i) { var hx = 0.25 + Math.cos(T * 0.5 + e.a) * 0.32, hy = 0.98 + Math.sin(T * 0.7 + e.a * 2) * 0.1, hz = Math.sin(T * 0.5 + e.a) * 0.3, tx = target.position.x + Math.cos(e.a + T * 1.2) * 0.72, ty = target.position.y + Math.sin(e.a + T * 1.2) * 0.72, tz = 0.1; e.g.position.set(hx + (tx - hx) * kk2, hy + (ty - hy) * kk2, hz + (tz - hz) * kk2); e.mat.uniforms.uTime.value = T; });
    };
    return M;
  }

  /* ================= motif 4: medical imaging (CT scan through the real anatomy) ================= */
  function sliceTex() {
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d'); x.fillStyle = '#02080a'; x.fillRect(0, 0, 256, 256);
    var bg = x.createRadialGradient(128, 130, 20, 128, 130, 112); bg.addColorStop(0, '#6b7478'); bg.addColorStop(0.8, '#4d575b'); bg.addColorStop(1, '#2e3638'); x.fillStyle = bg; x.beginPath(); x.ellipse(128, 130, 112, 84, 0, 0, PI2); x.fill();
    x.fillStyle = '#05090a'; x.beginPath(); x.ellipse(82, 118, 36, 52, -0.08, 0, PI2); x.fill(); x.beginPath(); x.ellipse(174, 118, 36, 52, 0.08, 0, PI2); x.fill();
    var R = rng3(4); for (var i = 0; i < 260; i++) { var side = i % 2 ? 174 : 82, px = side + (R() - 0.5) * 60, py = 118 + (R() - 0.5) * 92; x.fillStyle = 'rgba(190,200,205,' + (0.08 + R() * 0.25) + ')'; x.fillRect(px, py, 1.6, 1.6); }
    x.fillStyle = '#9aa3a7'; x.beginPath(); x.ellipse(132, 140, 30, 26, 0.2, 0, PI2); x.fill(); x.fillStyle = '#e6eaec'; x.beginPath(); x.arc(128, 178, 15, 0, PI2); x.fill(); x.fillStyle = '#05090a'; x.beginPath(); x.arc(128, 178, 5, 0, PI2); x.fill();
    x.strokeStyle = '#d6dcde'; x.lineWidth = 5; for (var r = 0; r < 6; r++) { var a0 = 0.5 + r * 0.38; x.beginPath(); x.ellipse(128, 130, 104, 76, 0, Math.PI * 0.18 + r * 0.02, Math.PI * 0.18 + r * 0.02 + 0.28); x.stroke(); x.beginPath(); x.ellipse(128, 130, 104, 76, 0, Math.PI * 0.82 - r * 0.02 - 0.28, Math.PI * 0.82 - r * 0.02); x.stroke(); }
    x.strokeStyle = 'rgba(63,195,236,0.55)'; x.lineWidth = 2; x.strokeRect(1, 1, 254, 254); return new THREE.CanvasTexture(c);
  }
  function buildImaging() {
    var s = 3.1, g = new THREE.Group(), inner = new THREE.Group(); inner.scale.setScalar(s); inner.position.y = -1.22 * s; g.add(inner);
    var M = { key: 'imaging', group: g, focus: [7.4, 7.6, 7.2, 6.8, 7.6], tilt: false, act: 'Run the scan' };
    var plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), ghosts = [], solids = [];
    [['bone', 0xe8dfca, 0.12], ['lung', 0xd4ecf1, 0.35], ['heart', 0xb3222c, 0.35]].forEach(function (d) {
      var gr = AN.groups[d[0]]; if (!gr) return;
      var gh = new THREE.Mesh(gr.geo, holoMat(C_AQUA, 0.5, 1.4, 0)); inner.add(gh); ghosts.push(gh);
      var sm = new THREE.MeshStandardMaterial({ color: d[1], emissive: d[1], emissiveIntensity: d[2], roughness: 0.5, metalness: 0.05, clippingPlanes: [plane] }); var so = new THREE.Mesh(gr.geo, sm); inner.add(so); solids.push(so);
    });
    var skinG = AN.groups.skin; if (skinG) { var sk = new THREE.Mesh(skinG.geo, holoMat(C_AQUA, 0.35, 2.0, 1)); inner.add(sk); ghosts.push(sk); }
    var yTop = (1.5 - 1.22) * s, yBot = (0.9 - 1.22) * s, gan = new THREE.Group(); g.add(gan);
    var ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.14, 24, 110), new THREE.MeshStandardMaterial({ color: 0x15332c, emissive: 0x0a2a24, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.6 })); ringMesh.rotation.x = Math.PI / 2; gan.add(ringMesh);
    var gin = new THREE.Group(); gan.add(gin); var glow = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.012, 8, 110), addMat(C_AQUA, 0.95)); glow.rotation.x = Math.PI / 2; gan.add(glow);
    for (var t = 0; t < 28; t++) { var a = t / 28 * PI2, bx = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.1), addMat(t % 7 === 0 ? C_LIME : C_AQUA, 0.9)); bx.position.set(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0); bx.rotation.y = -a; gin.add(bx); }
    var disc = new THREE.Mesh(new THREE.CircleGeometry(0.96, 72), addMat(C_LIME, 0.14)); disc.rotation.x = -Math.PI / 2; gan.add(disc);
    var tex = sliceTex(), slices = [], SL = 18; for (var i = 0; i < SL; i++) { var sm2 = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); sm2.position.set(1.3, -0.7 + i * 0.085, 0.45 - i * 0.01); sm2.rotation.set(-1.0, -0.5, 0); g.add(sm2); slices.push(sm2); }
    var lc = gc('lung'), lsz = new THREE.Vector3(AN.groups.lung.max[0] - AN.groups.lung.min[0], AN.groups.lung.max[1] - AN.groups.lung.min[1], AN.groups.lung.max[2] - AN.groups.lung.min[2]);
    var bracket = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(lsz.x * 1.04, lsz.y * 1.04, lsz.z * 1.04)), new THREE.LineBasicMaterial({ color: C_LIME, transparent: true, opacity: 0 })); bracket.position.copy(lc); inner.add(bracket);
    var nodP = lc.clone().add(new THREE.Vector3(-0.065, -0.02, 0.03)), nod = new THREE.Mesh(new THREE.SphereGeometry(0.011, 14, 10), new THREE.MeshBasicMaterial({ color: C_ORANGE, transparent: true, opacity: 0 })); nod.position.copy(nodP); inner.add(nod);
    var nodG = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_ORANGE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); nodG.scale.set(0.012, 0.012, 1); nodG.scale.setScalar(0.12); nodG.position.copy(nodP); inner.add(nodG);
    var hm = new THREE.Mesh(AN.groups.heart.geo, new THREE.MeshBasicMaterial({ color: C_LIME, wireframe: true, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })), hold = new THREE.Group(), hc = gc('heart'); hm.position.copy(hc).multiplyScalar(-1); hold.add(hm); hold.scale.setScalar(4.8); hold.position.set(-1.12, 0.95, 0.5); g.add(hold);
    var gy = { v: yBot, dir: 1, mode: 'idle', t: 0 };
    function apply() { gan.position.y = gy.v; plane.constant = gy.v; }
    M.anchors = [
      { get: function (o) { return o.set(1.05, gy.v, 0.5); } },
      { get: function (o) { return o.set(1.3, 0.05, 0.45); } },
      { get: function (o) { return o.copy(lc).add(new THREE.Vector3(-lsz.x * 0.45, lsz.y * 0.35, lsz.z * 0.5)).multiplyScalar(s).add(new THREE.Vector3(0, -1.22 * s, 0)); } },
      { get: function (o) { return o.copy(nodP).multiplyScalar(s).add(new THREE.Vector3(0, -1.22 * s, 0)); } },
      { get: function (o) { return o.copy(hold.position); } }
    ];
    M.onEnter = function () { gy.mode = 'idle'; gy.t = 0; gy.v = yBot; apply(); };
    M.onSelect = function () {}; M.onDeselect = function () {};
    M.doAct = function () { sfx.scan(); gy.mode = 'scan'; gy.t = 0; };
    M.update = function (T, dt) {
      ghosts.forEach(function (m) { m.material.uniforms.uTime.value = T; });
      if (gy.mode === 'idle') { gy.t += dt / 7.0; var u = (Math.sin(gy.t * PI2 - 1.2) * 0.5 + 0.5); gy.v = yBot + (yTop - yBot) * u; }
      else if (gy.mode === 'scan') { gy.t += dt / 3.4; gy.v = yBot + (yTop - yBot) * eIO(Math.min(1, gy.t)); if (gy.t >= 1) { gy.mode = 'idle'; gy.t = 0.2; var wp = nod.getWorldPosition(new THREE.Vector3()); ringAt(wp.x, wp.y, wp.z, C_ORANGE, 1.4); burst(wp.x, wp.y, wp.z, 80, 1.6, 1.0, [C_ORANGE, C_LIME]); sfx.ready(); } }
      apply(); gin.rotation.y = T * (gy.mode === 'scan' ? 6 : 1.2); disc.material.opacity = 0.12 + 0.05 * Math.sin(T * 6);
      slices.forEach(function (m, i) { var yy = yBot + (yTop - yBot) * (i / (SL - 1)), on = gy.v >= yy; m.material.opacity += ((on ? 0.55 : 0) - m.material.opacity) * Math.min(1, dt * 8); });
      var past = gy.v > (nodP.y - 1.22) * s + 0.2 ? 1 : 0; bracket.material.opacity += (past * (0.5 + 0.3 * Math.sin(T * 4)) - bracket.material.opacity) * Math.min(1, dt * 6); nod.material.opacity += (past - nod.material.opacity) * Math.min(1, dt * 6); nodG.material.opacity = nod.material.opacity * (0.55 + 0.35 * Math.sin(T * 5));
      hold.rotation.y = T * 0.5; hold.position.y = 0.95 + Math.sin(T * 0.9) * 0.05;
    };
    return M;
  }

  /* ================= motif 5: global health network ================= */
  function ll2v(lat, lon, r) { var la = lat * Math.PI / 180, lo = lon * Math.PI / 180; return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)); }
  function buildGlobe() {
    var g = new THREE.Group(), RAD = 1.48, M = { key: 'globe', group: g, focus: [9.2, 9.0, 9.0, 9.2, 9.0], tilt: true, act: 'Ship a dose', dist: 10.4 };
    var earth = new THREE.Group(); g.add(earth);
    var ecore = new THREE.Mesh(new THREE.SphereGeometry(RAD * 0.994, 64, 48), new THREE.MeshBasicMaterial({ color: 0x06202a })); ecore.userData.ptCol = 0xdbe6ef; earth.add(ecore);
    var eshell = new THREE.Mesh(new THREE.SphereGeometry(RAD * 0.998, 64, 48), holoMat(C_AQUA, 0.5, 2.4, 1)); earth.add(eshell);
    var atm = new THREE.Mesh(new THREE.SphereGeometry(RAD * 1.16, 64, 48), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: 'varying vec3 vN; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.25,0.76,0.93,1.0)*clamp(i,0.0,1.0)*0.65; }' })); g.add(atm);
    var atm2 = new THREE.Mesh(new THREE.SphereGeometry(RAD * 1.38, 64, 48), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: 'varying vec3 vN; void main(){ float i = pow(0.55 - dot(vN, vec3(0.0,0.0,1.0)), 4.0); gl_FragColor = vec4(0.53,0.92,0.13,1.0)*clamp(i,0.0,1.0)*0.4; }' })); g.add(atm2);
    var bits = b64Bytes(LAND_B64), N = 7000, lp = [], R = rng3(9);
    for (var i = 0; i < N; i++) { if (!(bits[i >> 3] >> (i & 7) & 1)) continue; var y = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - y * y), th = i * 2.399963229728653, base = new THREE.Vector3(rr * Math.sin(th), y, rr * Math.cos(th)); for (var k = 0; k < 3; k++) { var jv = base.clone().add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(k ? 0.045 : 0)).normalize().multiplyScalar(RAD * 1.004); lp.push(jv.x, jv.y, jv.z); } }
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); earth.add(new THREE.Points(lg, pointsMat(0.05, C_AQUA, 0.95)));
    var grat = []; for (var la = -60; la <= 60; la += 30) for (var lo = 0; lo < 360; lo += 6) { var a = ll2v(la, lo, RAD * 1.001), b = ll2v(la, lo + 6, RAD * 1.001); grat.push(a.x, a.y, a.z, b.x, b.y, b.z); } for (var lo2 = 0; lo2 < 360; lo2 += 30) for (var la2 = -84; la2 < 84; la2 += 6) { var c = ll2v(la2, lo2, RAD * 1.001), d = ll2v(la2 + 6, lo2, RAD * 1.001); grat.push(c.x, c.y, c.z, d.x, d.y, d.z); }
    var gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(grat, 3)); earth.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: C_AQUA, transparent: true, opacity: 0.1 })));
    var CITY = { hyd: [17.39, 78.49], bos: [42.36, -71.06], nbo: [-1.29, 36.82], fra: [50.11, 8.68], syd: [-33.87, 151.21], sao: [-23.55, -46.63], sin: [1.35, 103.82], nyc: [40.71, -74.0], lon: [51.5, -0.12], tok: [35.68, 139.69], dxb: [25.2, 55.27] };
    var marks = []; Object.keys(CITY).forEach(function (k) { var p = ll2v(CITY[k][0], CITY[k][1], RAD * 1.01), hot = ['hyd', 'bos', 'nbo', 'syd', 'fra'].indexOf(k) >= 0, m = new THREE.Mesh(new THREE.SphereGeometry(hot ? 0.035 : 0.022, 12, 10), new THREE.MeshBasicMaterial({ color: hot ? C_LIME : C_AQUA })); m.position.copy(p); earth.add(m); var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: hot ? C_LIME : C_AQUA, transparent: true, opacity: hot ? 0.9 : 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(hot ? 0.28 : 0.16); sp.position.copy(p); earth.add(sp); marks.push({ k: k, sp: sp, hot: hot, p: p }); });
    function arc(a, b, h) { var A = ll2v(CITY[a][0], CITY[a][1], RAD * 1.01), B = ll2v(CITY[b][0], CITY[b][1], RAD * 1.01), mid = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(RAD * (1.01 + h)); return new THREE.QuadraticBezierCurve3(A, mid, B); }
    var ARCS = [['fra', 'hyd', 0.38], ['bos', 'fra', 0.3], ['hyd', 'syd', 0.34], ['hyd', 'nbo', 0.26], ['bos', 'sao', 0.28], ['hyd', 'sin', 0.18], ['nyc', 'lon', 0.2], ['hyd', 'tok', 0.3], ['dxb', 'hyd', 0.16]].map(function (d) { var cv2 = arc(d[0], d[1], d[2]); var ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cv2.getPoints(60)), new THREE.LineBasicMaterial({ color: C_AQUA, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); earth.add(ln); return { curve: cv2, ph: R() }; });
    var PK = ARCS.length * 3, pkPos = new Float32Array(PK * 3), pkG = new THREE.BufferGeometry(); pkG.setAttribute('position', new THREE.BufferAttribute(pkPos, 3)); earth.add(new THREE.Points(pkG, pointsMat(0.09, C_LIME, 1)));
    var TL = 6, trPk = new Float32Array(PK * TL * 3), trCl = new Float32Array(PK * TL * 3), trPG = new THREE.BufferGeometry(), lc0 = new THREE.Color(C_LIME);
    for (var pi = 0; pi < PK; pi++) for (var tj = 0; tj < TL; tj++) { var fc = Math.pow(1 - tj / TL, 1.8) * 0.8, ii = (pi * TL + tj) * 3; trCl[ii] = lc0.r * fc; trCl[ii + 1] = lc0.g * fc; trCl[ii + 2] = lc0.b * fc; }
    trPG.setAttribute('position', new THREE.BufferAttribute(trPk, 3)); trPG.setAttribute('color', new THREE.BufferAttribute(trCl, 3)); var trPts = new THREE.Points(trPG, pointsMat(0.06, 0xffffff, 1, true)); trPts.frustumCulled = false; earth.add(trPts);
    var cn = 460, cpos = new Float32Array(cn * 3); for (var ci = 0; ci < cn; ci++) { var cv = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(RAD * (1.06 + R() * 0.03)); cpos[ci * 3] = cv.x; cpos[ci * 3 + 1] = cv.y; cpos[ci * 3 + 2] = cv.z; }
    var cgm = new THREE.BufferGeometry(); cgm.setAttribute('position', new THREE.BufferAttribute(cpos, 3)); var clouds = new THREE.Points(cgm, pointsMat(0.07, 0xffffff, 0.2)); g.add(clouds);
    var orbs = [[1.86, 1.2, 0.3, 0.5], [2.02, -0.8, -0.5, -0.38]].map(function (od) { var og = new THREE.Group(); og.rotation.set(od[1], 0, od[2]); g.add(og); og.add(new THREE.Mesh(new THREE.TorusGeometry(od[0], 0.005, 6, 160), addMat(C_AQUA, 0.3))); var sat = new THREE.Group(); sat.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }))); var sgl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_LIME, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); sgl.scale.setScalar(0.3); sat.add(sgl); og.add(sat); return { og: og, sat: sat, r: od[0], sp: od[3], a: R() * PI2 }; });
    var beamG = new THREE.BufferGeometry(); beamG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 2 * 3), 3)); var beams = new THREE.LineSegments(beamG, new THREE.LineBasicMaterial({ color: C_LIME, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(beams);
    var ship = new THREE.Group(), cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 12), new THREE.MeshBasicMaterial({ color: C_LIME })); cap.rotation.x = Math.PI / 2; ship.add(cap); var shg = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_LIME, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); shg.scale.setScalar(0.34); ship.add(shg); ship.visible = false; earth.add(ship);
    var trailN = 40, trPos = new Float32Array(trailN * 3), trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); var trail = new THREE.Points(trG, pointsMat(0.07, C_LIME, 0.9)); trail.visible = false; earth.add(trail);
    var shipState = { on: false, t: 0 }, mid = ARCS[0].curve.getPoint(0.5), ringT = 0, ringI = 0, hydP = ll2v(CITY.hyd[0], CITY.hyd[1], RAD * 1.01), sv = new THREE.Vector3();
    M.anchors = [
      { get: function (o) { return o.copy(ll2v(CITY.hyd[0], CITY.hyd[1], RAD * 1.03)); } }, { get: function (o) { return o.copy(ll2v(CITY.bos[0], CITY.bos[1], RAD * 1.03)); } },
      { get: function (o) { return o.copy(ll2v(CITY.nbo[0], CITY.nbo[1], RAD * 1.03)); } }, { get: function (o) { return o.copy(mid).multiplyScalar(1.02); } }, { get: function (o) { return o.copy(ll2v(CITY.syd[0], CITY.syd[1], RAD * 1.03)); } }
    ];
    M.onEnter = function () { shipState.on = false; ship.visible = trail.visible = false; }; M.onSelect = function () {}; M.onDeselect = function () {};
    M.doAct = function () { sfx.scan(); shipState = { on: true, t: 0 }; ship.visible = trail.visible = true; };
    M.update = function (T, dt) {
      eshell.material.uniforms.uTime.value = T; clouds.rotation.y = T * 0.035; clouds.rotation.x = T * 0.01; var bp = beamG.attributes.position.array, bop = 0;
      orbs.forEach(function (o, oi) { o.a += dt * o.sp; o.sat.position.set(Math.cos(o.a) * o.r, Math.sin(o.a) * o.r, 0); o.og.updateMatrixWorld(true); sv.copy(o.sat.position); o.og.localToWorld(sv); g.worldToLocal(sv); var vis = sv.dot(hydP) > RAD * RAD * 0.9; bp[oi * 6] = sv.x; bp[oi * 6 + 1] = sv.y; bp[oi * 6 + 2] = sv.z; bp[oi * 6 + 3] = hydP.x; bp[oi * 6 + 4] = hydP.y; bp[oi * 6 + 5] = hydP.z; if (vis) bop = 0.55; if (!vis) { bp[oi * 6 + 3] = sv.x; bp[oi * 6 + 4] = sv.y; bp[oi * 6 + 5] = sv.z; } });
      beamG.attributes.position.needsUpdate = true; beams.material.opacity += (bop * (0.6 + 0.4 * Math.sin(T * 12)) - beams.material.opacity) * Math.min(1, dt * 6);
      ringT -= dt; if (ringT <= 0) { ringT = 0.8; var mk = marks[(ringI++) % marks.length]; if (mk.hot) { var wpm = earth.localToWorld(mk.p.clone()); if (wpm.z > 0.4) ringAt(wpm.x, wpm.y, wpm.z, C_LIME, 0.55); } }
      marks.forEach(function (m, i) { m.sp.material.opacity = (m.hot ? 0.7 : 0.4) + 0.3 * Math.sin(T * 2.4 + i); });
      for (var a = 0; a < ARCS.length; a++) for (var k = 0; k < 3; k++) { var p = ARCS[a].curve.getPoint((T * 0.18 + ARCS[a].ph + k / 3) % 1), idx = (a * 3 + k) * 3; pkPos[idx] = p.x; pkPos[idx + 1] = p.y; pkPos[idx + 2] = p.z; for (var tj2 = 0; tj2 < TL; tj2++) { var tq = ARCS[a].curve.getPoint(((T * 0.18 + ARCS[a].ph + k / 3 - tj2 * 0.014) % 1 + 1) % 1), ti = ((a * 3 + k) * TL + tj2) * 3; trPk[ti] = tq.x; trPk[ti + 1] = tq.y; trPk[ti + 2] = tq.z; } } pkG.attributes.position.needsUpdate = true; trPG.attributes.position.needsUpdate = true;
      if (shipState.on) { shipState.t += dt / 3.0; var kk = Math.min(1, shipState.t), c = ARCS[0].curve; var p2 = c.getPoint(eIO(kk)), p3 = c.getPoint(Math.min(1, eIO(kk) + 0.01)); ship.position.copy(p2); ship.lookAt(p3.clone().add(earth.position)); for (var t = 0; t < trailN; t++) { var tp = c.getPoint(Math.max(0, eIO(kk) - t * 0.012)); trPos[t * 3] = tp.x; trPos[t * 3 + 1] = tp.y; trPos[t * 3 + 2] = tp.z; } trG.attributes.position.needsUpdate = true; if (kk >= 1) { shipState.on = false; ship.visible = trail.visible = false; var wp = new THREE.Vector3(); wp.copy(p2); earth.localToWorld(wp); g.localToWorld(wp.set(0, 0, 0)); var w2 = earth.localToWorld(p2.clone()); ringAt(w2.x, w2.y, w2.z, C_LIME, 1.6); burst(w2.x, w2.y, w2.z, 120, 1.6, 1.1, [C_LIME, C_AQUA, C_PAPER]); sfx.ready(); } }
    };
    return M;
  }

  /* ================= motif 6: precision medicine (a living double helix) ================= */
  function buildGenome() {
    var g = new THREE.Group(), R = rng3(31), M = { key: 'genome', group: g, focus: [8.6, 8.2, 8.8, 8.4, 8.6], tilt: false, act: 'Sequence the genome', dist: 11 };
    var NB = 56, H = 3.7, RAD = 0.56, TURNS = 3.4, y0 = -H / 2, VI = 38, PAL = [0x3fc3ec, 0x86eb22, 0xa0dcff, 0x86bc25];
    function hp(t, ph) { var a = t * TURNS * PI2 + ph; return new THREE.Vector3(Math.cos(a) * RAD, y0 + t * H, Math.sin(a) * RAD); }
    var helix = new THREE.Group(); g.add(helix);
    [0, Math.PI].forEach(function (ph, s) {
      var pts = []; for (var k = 0; k <= 220; k++) pts.push(hp(k / 220, ph)); var col = s ? C_LIME : C_AQUA;
      helix.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 360, 0.04, 8, false), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.2 })));
    });
    var rungG = new THREE.CylinderGeometry(0.016, 0.016, 1, 6); rungG.rotateZ(Math.PI / 2);
    var rungs = new THREE.InstancedMesh(rungG, new THREE.MeshBasicMaterial({ color: 0xffffff }), NB), caps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.058, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), NB * 2);
    var tmpC = new THREE.Color(), type = [], lvl = new Float32Array(NB), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), yAx = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3(), scl = new THREE.Vector3(RAD * 2, 1, 1);
    for (var i = 0; i < NB; i++) {
      var tp = (R() * 4) | 0, t = (i + 0.5) / NB; type.push(tp); q.setFromAxisAngle(yAx, -t * TURNS * PI2); pos.set(0, y0 + t * H, 0); mtx.compose(pos, q, scl); rungs.setMatrixAt(i, mtx);
      q.identity(); mtx.compose(hp(t, 0), q, one); caps.setMatrixAt(i * 2, mtx); mtx.compose(hp(t, Math.PI), q, one); caps.setMatrixAt(i * 2 + 1, mtx);
      rungs.setColorAt(i, tmpC.setHex(PAL[tp])); caps.setColorAt(i * 2, tmpC.setHex(PAL[tp])); caps.setColorAt(i * 2 + 1, tmpC.setHex(PAL[tp ^ 1]));
    }
    helix.add(rungs); helix.add(caps);
    var halo = new THREE.Group(), hpn = 320, hpos = new Float32Array(hpn * 3); for (var h = 0; h < hpn; h++) { var ha = R() * PI2, hr = 0.95 + R() * 0.75; hpos[h * 3] = Math.cos(ha) * hr; hpos[h * 3 + 1] = (R() - 0.5) * (H + 0.6); hpos[h * 3 + 2] = Math.sin(ha) * hr; }
    var hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hpos, 3)); halo.add(new THREE.Points(hg, pointsMat(0.05, C_AQUA, 0.6))); g.add(halo);
    var scanRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.014, 8, 96), addMat(C_LIME, 0.9)); scanRing.rotation.x = Math.PI / 2; scanRing.visible = false; g.add(scanRing);
    var scanDisc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 64), addMat(C_LIME, 0.1)); scanDisc.rotation.x = -Math.PI / 2; scanDisc.visible = false; g.add(scanDisc);
    var tV = (VI + 0.5) / NB, vPos = hp(tV, 0).add(new THREE.Vector3(0, 0, 0)), vGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_ORANGE, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); vGlow.scale.setScalar(0.5); vGlow.position.set(0, y0 + tV * H, 0); g.add(vGlow);
    var fixed = false, st = { mode: 'idle', t: 0, y: y0 };
    M.anchors = [{ pt: [0.88, 0] }, { pt: [tV, Math.PI] }, { pt: [0.18, 0] }, { pt: [0.5, Math.PI] }, { pt: [0.33, Math.PI] }].map(function (a) { return { get: function (o) { return o.copy(hp(a.pt[0], a.pt[1])); } }; });
    M.onEnter = function () { fixed = false; st = { mode: 'idle', t: 0, y: y0 }; scanRing.visible = scanDisc.visible = false; };
    M.onSelect = function () {}; M.onDeselect = function () {};
    M.doAct = function () { sfx.scan(); fixed = false; st = { mode: 'scan', t: 0, y: y0 }; scanRing.visible = scanDisc.visible = true; };
    M.update = function (T, dt) {
      var br = 1 + 0.025 * Math.sin(T * 1.6); helix.scale.set(br, 1, br); halo.rotation.y = -T * 0.22;
      var yv = vGlow.position.y;
      if (st.mode === 'scan') { st.t += dt / 3.0; st.y = y0 + H * eIO(Math.min(1, st.t)); if (st.t >= 1) { st.mode = 'back'; st.t = 0; } }
      else if (st.mode === 'back') { st.t += dt / 0.9; st.y = y0 + H - (y0 + H - yv) * eIO(Math.min(1, st.t)); if (st.t >= 1) { st.mode = 'edit'; st.t = 0; var w0 = vGlow.getWorldPosition(new THREE.Vector3()); ringAt(w0.x, w0.y, w0.z, C_ORANGE, 1.1); burst(w0.x, w0.y, w0.z, 50, 1.4, 0.8, [C_ORANGE, C_PAPER]); } }
      else if (st.mode === 'edit') { st.t += dt / 1.0; if (st.t >= 1) { st.mode = 'idle'; fixed = true; scanRing.visible = scanDisc.visible = false; var w1 = vGlow.getWorldPosition(new THREE.Vector3()); ringAt(w1.x, w1.y, w1.z, C_LIME, 1.8); burst(w1.x, w1.y, w1.z, 140, 2.4, 1.2, [C_LIME, C_AQUA, C_PAPER]); sfx.ready(); } }
      var active = st.mode !== 'idle'; scanRing.position.y = scanDisc.position.y = st.y; var op = active ? 1 : 0; scanRing.material.opacity = 0.9 * op; scanDisc.material.opacity = (0.1 + 0.04 * Math.sin(T * 8)) * op;
      for (var i = 0; i < NB; i++) {
        var yy = y0 + (i + 0.5) / NB * H; if (st.mode === 'scan' && st.y >= yy) lvl[i] = 1; lvl[i] *= Math.exp(-dt * 1.3);
        var glow = 0.4 + 0.35 * (0.5 + 0.5 * Math.sin(T * 2.2 - i * 0.38)) + lvl[i] * 1.1;
        if (i === VI) { tmpC.setHex(fixed ? C_LIME : C_ORANGE); glow = fixed ? 1.3 : 0.9 + 0.5 * Math.sin(T * 6); } else tmpC.setHex(PAL[type[i]]);
        rungs.setColorAt(i, tmpC.multiplyScalar(glow * (LT ? 0.55 : 1)));
      }
      rungs.instanceColor.needsUpdate = true;
      vGlow.material.color.setHex(fixed ? C_LIME : C_ORANGE); vGlow.material.opacity = 0.45 + 0.35 * Math.sin(T * (fixed ? 2 : 6)); vGlow.scale.setScalar(fixed ? 0.42 : 0.5 + 0.12 * Math.sin(T * 6));
    };
    return M;
  }

  /* ================= motif 7: the patient journey (connected care network) ================= */
  function buildJourney() {
    var g = new THREE.Group(), R = rng3(41), M = { key: 'journey', group: g, focus: [8.8, 8.8, 8.8, 8.8, 8.8], tilt: false, act: 'Send an alert', dist: 9.6 };
    var ORB = 1.5, orbit = new THREE.Group(); orbit.rotation.x = 1.0; g.add(orbit);
    orbit.add(new THREE.Mesh(new THREE.TorusGeometry(ORB, 0.011, 8, 160), addMat(C_AQUA, 0.55)));
    var ring2 = new THREE.Mesh(new THREE.TorusGeometry(ORB * 1.28, 0.006, 8, 160), addMat(C_GREEN, 0.3)); orbit.add(ring2);
    var core = new THREE.Group(); g.add(core);
    core.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 30), holoMat(C_LIME, 1, 1.5, 0)));
    var wire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshBasicMaterial({ color: C_LIME, wireframe: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); core.add(wire);
    var cglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_LIME, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); cglow.scale.setScalar(1.5); core.add(cglow);
    var defs = [[C_LIME, new THREE.OctahedronGeometry(0.17)], [C_AQUA, new THREE.BoxGeometry(0.26, 0.26, 0.26)], [0xa0dcff, new THREE.IcosahedronGeometry(0.19)], [C_GREEN, new THREE.CylinderGeometry(0.12, 0.12, 0.3, 18)], [C_AQUA, new THREE.DodecahedronGeometry(0.21)]];
    var nodes = defs.map(function (d, i) {
      var n = new THREE.Group(), body = new THREE.Mesh(d[1], new THREE.MeshStandardMaterial({ color: d[0], emissive: d[0], emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.2 })), halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: d[0], transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })), shell = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.008, 6, 48), addMat(d[0], 0.6));
      halo.scale.setScalar(0.85); n.add(body); n.add(halo); n.add(shell); orbit.add(n); return { g: n, body: body, halo: halo, shell: shell, col: d[0], a: -Math.PI / 2 + i * PI2 / 5 - 0.25, flash: 0 };
    });
    var spokeG = new THREE.BufferGeometry(), spokePos = new Float32Array(5 * 6); spokeG.setAttribute('position', new THREE.BufferAttribute(spokePos, 3)); orbit.add(new THREE.LineSegments(spokeG, new THREE.LineBasicMaterial({ color: C_AQUA, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })));
    var PK = 5 * 4, pkPos = new Float32Array(PK * 3), pkG = new THREE.BufferGeometry(); pkG.setAttribute('position', new THREE.BufferAttribute(pkPos, 3)); orbit.add(new THREE.Points(pkG, pointsMat(0.09, C_LIME, 1)));
    var OK = 10, okPos = new Float32Array(OK * 3), okG = new THREE.BufferGeometry(); okG.setAttribute('position', new THREE.BufferAttribute(okPos, 3)); orbit.add(new THREE.Points(okG, pointsMat(0.07, C_AQUA, 0.9)));
    var alertS = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: C_ORANGE, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); alertS.scale.setScalar(0.55); alertS.visible = false; orbit.add(alertS);
    var alertC = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); alertS.add(alertC);
    var ecgG = new THREE.Group(), EN = 120, ecgPos = new Float32Array(EN * 3), ecgGeo = new THREE.BufferGeometry(); ecgGeo.setAttribute('position', new THREE.BufferAttribute(ecgPos, 3)); ecgG.add(new THREE.Line(ecgGeo, new THREE.LineBasicMaterial({ color: C_LIME, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }))); ecgG.position.set(0, -2.0, 0.4); g.add(ecgG);
    function ecg(u) { var d = u - 0.5; return 0.42 * Math.exp(-Math.pow(d * 46, 2)) - 0.1 * Math.exp(-Math.pow((d + 0.045) * 70, 2)) - 0.13 * Math.exp(-Math.pow((d - 0.05) * 70, 2)) + 0.07 * Math.exp(-Math.pow((d - 0.2) * 14, 2)); }
    var path = [0, -1, 1, -1, 4], al = { on: false, leg: 0, t: 0 }, tv = new THREE.Vector3(), tv2 = new THREE.Vector3();
    function nodeLocal(i, o) { return o.set(Math.cos(nodes[i].a) * ORB, Math.sin(nodes[i].a) * ORB, 0); }
    M.anchors = nodes.map(function (n, i) { return { get: function (o) { return nodeLocal(i, o).applyEuler(orbit.rotation); } }; });
    M.onEnter = function () { al.on = false; alertS.visible = false; nodes.forEach(function (n) { n.flash = 0; }); };
    M.onSelect = function () {}; M.onDeselect = function () {};
    M.doAct = function () { sfx.scan(); al = { on: true, leg: 0, t: 0 }; alertS.visible = true; nodes[0].flash = 1; };
    function wpos(v) { orbit.updateMatrixWorld(true); return orbit.localToWorld(v.clone()); }
    M.update = function (T, dt) {
      g.updateMatrixWorld(true); ring2.rotation.z = T * 0.08;
      var beat = Math.pow(Math.max(0, Math.sin(T * 3.3)), 6); core.scale.setScalar(1 + 0.1 * beat); wire.rotation.y = T * 0.5; wire.rotation.x = T * 0.3; core.children[0].material.uniforms.uTime.value = T; cglow.material.opacity = 0.5 + 0.3 * beat;
      nodes.forEach(function (n, i) {
        n.a += dt * 0.1; nodeLocal(i, n.g.position); n.flash *= Math.exp(-dt * 2.2); n.body.rotation.y = T * 0.8 + i; n.body.rotation.x = T * 0.4;
        n.body.material.emissiveIntensity = 0.5 + 0.2 * Math.sin(T * 2 + i) + n.flash * 1.6; n.halo.scale.setScalar(0.85 + n.flash * 0.9 + 0.08 * Math.sin(T * 3 + i)); n.shell.scale.setScalar(1 + n.flash * 0.5 + 0.06 * Math.sin(T * 2.4 + i)); n.shell.material.opacity = 0.4 + n.flash * 0.5;
        spokePos[i * 6] = spokePos[i * 6 + 1] = spokePos[i * 6 + 2] = 0; spokePos[i * 6 + 3] = n.g.position.x; spokePos[i * 6 + 4] = n.g.position.y; spokePos[i * 6 + 5] = 0;
        for (var k = 0; k < 4; k++) { var u = (T * 0.35 + i * 0.21 + k / 4) % 1, rev = (i + k) % 2; u = rev ? 1 - u : u; var o = (i * 4 + k) * 3; pkPos[o] = n.g.position.x * u; pkPos[o + 1] = n.g.position.y * u; pkPos[o + 2] = 0; }
      });
      spokeG.attributes.position.needsUpdate = true; pkG.attributes.position.needsUpdate = true;
      for (var j = 0; j < OK; j++) { var oa = T * 0.45 + j * PI2 / OK; okPos[j * 3] = Math.cos(oa) * ORB; okPos[j * 3 + 1] = Math.sin(oa) * ORB; okPos[j * 3 + 2] = 0; } okG.attributes.position.needsUpdate = true;
      if (al.on) {
        al.t += dt / 0.85; var a = path[al.leg], b = path[al.leg + 1], k2 = eIO(Math.min(1, al.t));
        if (a < 0) tv.set(0, 0, 0); else nodeLocal(a, tv); if (b < 0) tv2.set(0, 0, 0); else nodeLocal(b, tv2);
        alertS.position.lerpVectors(tv, tv2, k2); alertS.scale.setScalar(0.5 + 0.15 * Math.sin(T * 20));
        if (al.t >= 1) {
          var w = wpos(tv2); if (b < 0) { burst(w.x, w.y, w.z, 40, 1.2, 0.7, [C_ORANGE, C_LIME]); ringAt(w.x, w.y, w.z, C_ORANGE, 0.9); kick = Math.max(kick, 0.8); } else { nodes[b].flash = 1; burst(w.x, w.y, w.z, 90, 1.8, 1.0, [C_LIME, C_AQUA, C_PAPER]); ringAt(w.x, w.y, w.z, C_LIME, 1.3); sfx.seen(al.leg + 1); }
          al.leg++; al.t = 0; if (al.leg >= path.length - 1) { al.on = false; alertS.visible = false; sfx.ready(); kick = Math.max(kick, 1.4); }
        }
      }
      ecgG.rotation.y = -g.rotation.y; for (var e = 0; e < EN; e++) { var ex = e / (EN - 1), uu = ((ex * 1.6 - T * 0.55) % 1 + 1) % 1; ecgPos[e * 3] = (ex - 0.5) * 3.0; ecgPos[e * 3 + 1] = ecg(uu) * (al.on ? 1.6 : 1); ecgPos[e * 3 + 2] = 0; } ecgGeo.attributes.position.needsUpdate = true;
    };
    return M;
  }

  /* ================= scene setup, UI, loop ================= */
  var VOFF = 205, elConnP = null, elConnD = null, twRot = 0, tiltCur = 0.3, tiltT = 0.3, rotYT = 0, ambStars = null, ready3 = false, ambT = 1;
  function syncChips() { var M = motifs[0]; if (!M) return; for (var i = 0; i < chips.length; i++) chips[i].setAttribute('aria-pressed', M.layerT[i] > 0.05 ? 'true' : 'false'); }
  for (var cI = 0; cI < chips.length; cI++) (function (i) { chips[i].addEventListener('pointerdown', function (e) { e.stopPropagation(); poke(); }); chips[i].addEventListener('click', function () { var M = motifs[0]; if (!M || cur !== 0) return; M.layerT[i] = M.layerT[i] > 0.05 ? 0 : (i === 0 ? 0.55 : 0.9); syncChips(); sfx.tap(); }); })(cI);

  async function initL3D() {
    if (L3.ok) return true; if (L3.loading) return false; L3.loading = true;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(1); renderer.setSize(LW, LH); renderer.setClearColor(0x080b09, 1); renderer.localClippingEnabled = true; elGl.appendChild(renderer.domElement);
      scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(40, LW / LH, 0.1, 100); camera.position.set(0, 0, 9); camera.setViewOffset(LW, LH, 0, VOFF, LW, LH);
      scene.add(new THREE.AmbientLight(0xa0bbb4, 0.45)); var key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(-2, 3, 5); scene.add(key);
      rimL = new THREE.PointLight(0x3fc3ec, 1.4, 16); rimL.position.set(3, 1.5, -3); scene.add(rimL); fillL = new THREE.PointLight(0x86bc25, 0.7, 14); fillL.position.set(-3, -2, 3); scene.add(fillL);
      (function () { var c = document.createElement('canvas'); c.width = 216; c.height = 384; var x = c.getContext('2d'); x.fillStyle = '#080b09'; x.fillRect(0, 0, 216, 384); var r1 = x.createRadialGradient(108, 170, 0, 108, 170, 190); r1.addColorStop(0, 'rgba(0,163,224,0.06)'); r1.addColorStop(1, 'rgba(0,163,224,0)'); x.fillStyle = r1; x.fillRect(0, 0, 216, 384); var r2 = x.createRadialGradient(108, 320, 0, 108, 320, 160); r2.addColorStop(0, 'rgba(134,188,37,0.08)'); r2.addColorStop(1, 'rgba(134,188,37,0)'); x.fillStyle = r2; x.fillRect(0, 0, 216, 384); var bgm = new THREE.Mesh(new THREE.PlaneGeometry(28, 49.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); bgm.position.set(0, -1.5, -14); scene.add(bgm); bgPlane = bgm; })();
      var sp = new Float32Array(300 * 3), R = rng3(77); for (var i = 0; i < 300; i++) { sp[i * 3] = (R() - 0.5) * 16; sp[i * 3 + 1] = (R() - 0.5) * 24; sp[i * 3 + 2] = -3 - R() * 8; } var sgm = new THREE.BufferGeometry(); sgm.setAttribute('position', new THREE.BufferAttribute(sp, 3)); ambStars = new THREE.Points(sgm, pointsMat(0.05, C_AQUA, 0.55)); scene.add(ambStars);
      pedestal = new THREE.Group(); pedestal.position.y = -2.2; scene.add(pedestal); pedestal.visible = false;
      floorShadow = ProtoTheme.shadow(5.2, 2.6); floorShadow.position.y = -2.19; scene.add(floorShadow);
      [0.95, 1.3, 1.65].forEach(function (r) { var pr = new THREE.Mesh(new THREE.RingGeometry(r - 0.012, r, 128), addMat(C_AQUA, 0.4)); pr.rotation.x = -Math.PI / 2; pedestal.add(pr); pedRings.push(pr); });
      var tk = []; for (var ti = 0; ti < 72; ti++) { var ta = ti / 72 * PI2, r0 = ti % 6 === 0 ? 1.78 : 1.82; tk.push(Math.cos(ta) * r0, 0, Math.sin(ta) * r0, Math.cos(ta) * 1.9, 0, Math.sin(ta) * 1.9); }
      var tkg = new THREE.BufferGeometry(); tkg.setAttribute('position', new THREE.Float32BufferAttribute(tk, 3)); pedTicks = new THREE.LineSegments(tkg, new THREE.LineBasicMaterial({ color: C_AQUA, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); pedestal.add(pedTicks);
      var RN2 = 150; rainPos = new Float32Array(RN2 * 3); rainSpd = new Float32Array(RN2); for (var ri = 0; ri < RN2; ri++) { rainPos[ri * 3] = (R() - 0.5) * 7; rainPos[ri * 3 + 1] = (R() - 0.5) * 11; rainPos[ri * 3 + 2] = -2 - R() * 4; rainSpd[ri] = 0.15 + R() * 0.55; }
      var rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rainPos, 3)); rainPts = new THREE.Points(rg, pointsMat(0.045, C_AQUA, 0.45)); rainPts.frustumCulled = false; scene.add(rainPts);
      pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3)); pPts = new THREE.Points(pGeo, pointsMat(0.09, 0xffffff, 1, true)); pPts.frustumCulled = false; scene.add(pPts);
      for (var rI = 0; rI < 6; rI++) { var rm = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 72), new THREE.MeshBasicMaterial({ color: C_LIME, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); rm.visible = false; scene.add(rm); rings.push({ mesh: rm, on: false, t: 0, size: 1.6 }); }
      try { if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass) { composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera)); bloom = new THREE.UnrealBloomPass(new THREE.Vector2(LW / 2, LH / 2), 0.26, 0.5, 0.64); composer.addPass(bloom); } } catch (e) { composer = null; bloom = null; }
      AN = await loadAnatomy();
      motifs = [buildBody(), buildMolecule(), buildCell(), buildImaging(), buildGlobe(), buildGenome(), buildJourney()];
      motifs.forEach(function (m, i) { m.group.visible = false; m.def = MOTIFS[i]; scene.add(m.group); });
      elConnP = $('lconnp'); elConnD = $('lconnd');
      MOTIFS.forEach(function (md, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'topic'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false');
        b.innerHTML = ICONS3[md.key] + '<b>' + md.dock + '</b><span class="dots"><i></i><i></i><i></i><i></i><i></i></span>';
        b.addEventListener('click', function () { poke(); setMotif(i); }); elDock.appendChild(b); dockBtns.push(b);
      });
      elDock.style.setProperty('--nm', NM); L3.ok = true; L3.loading = false; return true;
    } catch (err) { console.error(err); L3.failed = true; L3.loading = false; var sp2 = elLoad.querySelector('span'); if (sp2) sp2.textContent = 'This display could not load 3D'; return false; }
  }

  /* ---------- progress, hotspots, selection ---------- */
  function vKey(m, n) { return m + ':' + n; }
  function countSeen() { var c = 0; for (var k in visited) c++; return c; }
  function refreshProgress() {
    dockBtns.forEach(function (b, m) { var d = b.querySelectorAll('.dots i'), all = true; for (var n = 0; n < 5; n++) { d[n].className = visited[vKey(m, n)] ? 'on' : ''; if (!visited[vKey(m, n)]) all = false; } b.classList.toggle('done', all); });
    elProg.innerHTML = 'Explored <b>' + countSeen() + '</b> / ' + TOTAL;
  }
  function letters(name) { var h = ''; var ls = name.lastIndexOf(' ') + 1; for (var i = 0; i < name.length; i++) { var c = name[i]; h += c === ' ' ? ' ' : '<span class="ch' + (i >= ls ? ' stix' : '') + '" style="animation-delay:' + (i * 38) + 'ms">' + c + '</span>'; } return h + '<b class="ch" style="animation-delay:' + (name.length * 38) + 'ms">.</b>'; }
  function buildHotspots() {
    elHs.innerHTML = ''; hsEls = []; hsPos = [];
    MOTIFS[cur].notes.forEach(function (n, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hs' + (visited[vKey(cur, i)] ? ' seen' : ''); b.setAttribute('aria-label', n[1]); b.style.setProperty('--d', (0.45 + i * 0.14) + 's'); b.innerHTML = '<i></i><span>' + n[0] + '</span>';
      b.addEventListener('click', function (e) { e.stopPropagation(); poke(); select(i); }); elHs.appendChild(b); hsEls.push(b);
    });
  }
  function anchorWorld(i, out) { var M = motifs[cur]; M.anchors[i].get(out); M.group.updateMatrixWorld(true); return M.group.localToWorld(out); }
  function afterNote() { if (tour) return tourAdvance; if (!attract && countSeen() >= TOTAL && !celebrated) return celebrate; return null; }
  function select(i) {
    sel = i; lshc.classList.add('hassel'); var M = motifs[cur], md = MOTIFS[cur], note = md.notes[i];
    if (!attract) { var key = vKey(cur, i), first = !visited[key]; visited[key] = true; refreshProgress(); if (first) { var dd = dockBtns[cur].querySelectorAll('.dots i')[i]; if (dd) dd.classList.add('new'); sfx.seen(countSeen()); if (dockBtns[cur].classList.contains('done') && !doneTopic[cur]) { doneTopic[cur] = true; if (countSeen() < TOTAL) toast('Topic complete', md.name); } } }
    hsEls.forEach(function (el, k) { el.classList.toggle('on', k === i); if (visited[vKey(cur, k)]) el.classList.add('seen'); });
    var wp = anchorWorld(i, new THREE.Vector3()); burst(wp.x, wp.y, wp.z, 70, 1.5, 0.9, [C_LIME, C_AQUA, C_PAPER]); ringAt(wp.x, wp.y, wp.z, C_LIME, 0.5); sfx.select(); connT = 0; kick = 0.6;
    elCard.classList.remove('pulse'); void elCard.offsetWidth; elCard.classList.add('pulse');
    M.anchors[i].get(tmpV); var base = -Math.atan2(tmpV.x, tmpV.z); rotYT = base + Math.round((rotY - base) / PI2) * PI2; if (M.tilt) tiltT = Math.atan2(tmpV.y, Math.hypot(tmpV.x, tmpV.z));
    if (M.onSelect) M.onSelect(i); say(note[1], note[2], md.key + '-' + (i + 1), { then: afterNote() });
  }
  function playIntro() { var M = motifs[cur], md = MOTIFS[cur]; sel = -1; lshc.classList.remove('hassel'); connT = -1; tiltT = M.tilt ? 0.3 : 0; hsEls.forEach(function (el) { el.classList.remove('on'); }); if (M.onDeselect) M.onDeselect(); say(md.name, md.intro, md.key + '-0', { then: tour ? tourAdvance : null }); }

  /* ---------- switching screens ---------- */
  function setMotif(i) { if (i === cur || tw.phase !== 'idle') return false; dockBtns.forEach(function (button) { button.disabled = true; }); if (cur < 0) { commit(i); tw.phase = 'in'; tw.t = 0; return true; } tw.phase = 'out'; tw.t = 0; tw.next = i; return true; }
  function commit(i, silent) {
    if (cur >= 0) { motifs[cur].group.visible = false; motifs[cur].group.scale.setScalar(1); }
    cur = i; var M = motifs[i], md = MOTIFS[i]; M.group.visible = true; sel = -1; rotYT = 0; tiltCur = tiltT = M.tilt ? 0.3 : 0; rotX = M.tilt ? 0 : 0.08;
    if (M.onEnter) M.onEnter(); if (i === 0) syncChips();
    dockBtns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); }); elPill.style.transform = 'translateX(' + (i * 100) + '%)'; elNum.innerHTML = '0' + (i + 1) + '<i> / 0' + NM + '</i>';
    elTitle.innerHTML = letters(md.name); elTag.textContent = md.tag; elTag.classList.remove('rv'); void elTag.offsetWidth; elTag.classList.add('rv'); elActL.textContent = md.act; elLayers.classList.toggle('on', i === 0);
    var ac = ACC[i] || ACC[0]; lshc.style.setProperty('--acc', ac[0]); lshc.style.setProperty('--acc2', ac[1]); accTgt.set(ac[0]); renderStats(i); statT = 0;
    elSweep.classList.remove('go'); void elSweep.offsetWidth; elSweep.classList.add('go'); if (pedestal) pedestal.visible = true;
    burst(0, 0, 0, 160, 2.8, 1.2, [C_AQUA, C_LIME, C_PAPER]); ringAt(0, 0, 0, C_AQUA, 1.5); ringAt(0, 0, 0, C_LIME, 0.9); sfx.select(); connT = -1; buildHotspots(); if (!silent) playIntro();
  }
  elAct.addEventListener('pointerdown', function (e) { e.stopPropagation(); poke(); });
  elAct.addEventListener('click', function () { if (cur < 0 || tw.phase !== 'idle') return; var M = motifs[cur]; M.doAct(); kick = Math.max(kick, 1); elAct.classList.add('fired'); setTimeout(function () { elAct.classList.remove('fired'); }, 700); });

  /* ---------- guided tour ---------- */
  function tourAdvance() {
    if (!tour) return; if (tw.phase !== 'idle') { setTimeout(tourAdvance, 300); return; }
    tour.k++; if (tour.k >= tour.steps.length) { endTour(true); return; }
    var s = tour.steps[tour.k]; if (s.m !== cur) setMotif(s.m); else if (s.n >= 0) select(s.n); else playIntro();
  }
  function endTour(done) { tour = null; elTour.setAttribute('aria-pressed', 'false'); elTour.lastChild.textContent = 'Guided tour'; elTour.firstChild.innerHTML = '<path d="M7 4.5v15l13-7.5z"/>'; if (done) say('Your turn', 'That was the tour. Now it is your turn. Touch anything that glows, and see where it takes you.', null); }
  elTour.addEventListener('pointerdown', function (e) { e.stopPropagation(); pokeKeep = true; poke(); pokeKeep = false; rip(e, lshc); });
  elTour.addEventListener('click', function () {
    if (!L3.ok) return; if (tour) { endTour(false); return; }
    tour = { steps: [], k: -1 }; for (var m = 0; m < NM; m++) { tour.steps.push({ m: m, n: -1 }); for (var n = 0; n < 5; n++) tour.steps.push({ m: m, n: n }); }
    elTour.setAttribute('aria-pressed', 'true'); elTour.lastChild.textContent = 'Stop tour'; elTour.firstChild.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2"/>'; tourAdvance();
  });
  function celebrate() {
    celebrated = true; kick = 2.6; sfx.ready();
    for (var fw = 0; fw < 8; fw++) (function (n) { setTimeout(function () { burst((Math.random() - 0.5) * 3, (Math.random() - 0.3) * 2.4, 0.5, 150, 3.2, 1.6, [C_GREEN, C_LIME, C_AQUA, C_PAPER, C_ORANGE]); ringAt((Math.random() - 0.5) * 2, (Math.random() - 0.3) * 2, 0.5, C_LIME, 1.6); }, n * 260); })(fw);
    var cols = ['#86bc25', '#86eb22', '#00a3e0', '#3fc3ec', '#ffffff', '#a0dcff'];
    for (var i = 0; i < 60; i++) { var c = document.createElement('i'); c.className = 'cf'; c.style.left = (Math.random() * 1040 + 20) + 'px'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (Math.random() * 0.9) + 's'; c.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)'; lshc.appendChild(c); (function (n) { setTimeout(function () { n.remove(); }, 5200); })(c); }
    say('Life sciences explorer', LCONTENT.done, 'done', null);
  }

  /* ---------- enter / leave ---------- */
  function resetL() {
    stopAudio(); sayTok++; tour = null; elTour.setAttribute('aria-pressed', 'false'); elTour.lastChild.textContent = 'Guided tour'; elTour.firstChild.innerHTML = '<path d="M7 4.5v15l13-7.5z"/>';
    visited = {}; doneTopic = {}; celebrated = false; attract = false; elAttract.classList.remove('on'); typing = null; sel = -1; connT = -1; tw = { phase: 'idle', t: 0, next: -1 }; rotY = 0.3; rotX = 0.08; velY = 0; zoomK = zoomKT = 1; ready3 = false;
    elHs.innerHTML = ''; hsEls = []; elCT.textContent = ''; elCX.textContent = ''; elVbi.style.transform = 'scaleX(0)'; elLayers.classList.remove('on'); elStat.innerHTML = ''; statEls = []; elToast.classList.remove('on'); if (pedestal) pedestal.visible = false; refreshProgress();
    if (cur >= 0 && motifs[cur]) { motifs[cur].group.visible = false; motifs[cur].group.scale.setScalar(1); } cur = -1;
    dockBtns.forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
  }
  function enterL() {
    lshc.style.display = 'block'; void lshc.offsetWidth; lshc.classList.add('on'); lshc.classList.remove('ready'); elLoad.classList.remove('off'); started = true; lastTouch = performance.now();
    resetL(); sfx.build();
    initL3D().then(function (ok) {
      if (!ok || mode !== 'lshc') return; elLoad.classList.add('off'); resetL(); lshc.classList.add('ready'); camDT = camD = 12; lookC.set(0, 0, 0);
      if (!L3.running) { L3.running = true; lastT = performance.now(); requestAnimationFrame(frame); }
      lastTouch = performance.now(); commit(0, true); tw.phase = 'in'; tw.t = 0; dockBtns.forEach(function (button) { button.disabled = true; }); ready3 = true; say('Hello there', LCONTENT.greet, 'greet', { then: playIntro, gap: 500 });
    });
  }
  function leaveL() { L3.running = false; stopAudio(); sayTok++; tour = null; lshc.classList.remove('on', 'ready'); setTimeout(function () { if (mode !== 'lshc') lshc.style.display = 'none'; }, 700); }

  /* ---------- input: drag to turn, swipe to switch, wheel to zoom ---------- */
  function nPtrs() { return Object.keys(ptrs).length; }
  lshc.addEventListener('pointerdown', function (e) {
    e.stopPropagation(); poke(); rip(e, lshc); sfx.tap();
    if (e.target.closest && e.target.closest('button')) return; if (!L3.ok || cur < 0) return;
    try { lshc.setPointerCapture(e.pointerId); } catch (err) {}
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }; dragging = true; velY = 0; dragDX = dragDY = 0;
    var p = toStage(e), nx = p.x / LW * 2 - 1, ny = -(p.y / LH * 2 - 1); tmpV.set(nx, ny, 0.5).unproject(camera); tmpV.sub(camera.position); var tt = -camera.position.z / tmpV.z; tmpV.multiplyScalar(tt).add(camera.position); burst(tmpV.x, tmpV.y, 0.4, 14, 1.1, 0.7, [C_AQUA, C_LIME]); ringAt(tmpV.x, tmpV.y, 0.4, C_AQUA, 0.6);
  });
  lshc.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect(); par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    var p = ptrs[e.pointerId]; if (!p) return; poke(); var k = 1 / (r.width / LW), dx = (e.clientX - p.x) * k, dy = (e.clientY - p.y) * k; p.x = e.clientX; p.y = e.clientY;
    if (nPtrs() === 1) { dragDX += dx; dragDY += dy; }
  });
  function up(e) {
    var p = ptrs[e.pointerId], r = stage.getBoundingClientRect(), k = 1 / (r.width / LW);
    if (p && nPtrs() === 1 && L3.ok && cur >= 0) { var sdx = (e.clientX - p.sx) * k, sdy = (e.clientY - p.sy) * k, sdt = performance.now() - p.t; if (sdt < 450 && Math.abs(sdx) > 220 && Math.abs(sdx) > Math.abs(sdy) * 1.6 && tw.phase === 'idle') { setMotif((cur + (sdx < 0 ? 1 : NM - 1)) % NM); velY = 0; } }
    delete ptrs[e.pointerId]; if (nPtrs() === 0) dragging = false;
  }
  lshc.addEventListener('pointerup', up); lshc.addEventListener('pointercancel', up);
  lshc.addEventListener('wheel', function (e) { e.preventDefault(); poke(); zoomKT = clamp(zoomKT * (e.deltaY < 0 ? 1.04 : 0.96), 0.85, 1.5); }, { passive: false });

  /* ---------- frame loop ---------- */
  function frame(now) {
    if (!L3.running) return; requestAnimationFrame(frame);
    var wantLT = ProtoTheme.isOn(); if (wantLT !== themeSeen) { themeSeen = wantLT; if (wantLT || scene.userData.themed) { scene.userData.themed = true; setTheme(wantLT); } }
    var dt = Math.min(window.__lshcCap || 0.1, (now - lastT) / 1000); lastT = now; if (!(dt >= 0)) dt = 0.016; TT += dt;
    if (typing) {
      var ty = typing, len = ty.text.length, nc, done;
      if (ty.mode === 'audio') { var au = ty.au, d = au.duration; if (!isFinite(d) || d <= 0) d = len * 0.062; var p = au.ended ? 1 : Math.min(1, au.currentTime / d * 1.04 + (au.currentTime > 0 ? 0.006 : 0)); nc = Math.floor(p * len); done = au.ended; }
      else { nc = Math.min(len, Math.floor((performance.now() - ty.start) / ty.per)); done = nc >= len; }
      ty.a.textContent = ty.text.slice(0, nc); ty.b.textContent = ty.text.slice(nc); elVbi.style.transform = 'scaleX(' + (nc / len).toFixed(3) + ')'; if (done) { typing = null; ty.finish(); }
    }
    var speaking = !!typing; amp += ((speaking ? 1 : 0) - amp) * 0.15;
    for (var w = 0; w < waveBars.length; w++) { var h = 0.12 + amp * (0.15 + 0.85 * Math.abs(Math.sin(TT * 7.3 + w * 1.7) * Math.sin(TT * 3.1 + w * 0.9))); waveBars[w].style.transform = 'scaleY(' + h.toFixed(3) + ')'; }
    if (speaking !== elOrb._s) { elOrb._s = speaking; elOrb.classList.toggle('spk', speaking); }
    elOrb.style.transform = 'scale(' + (1 + amp * 0.16 * (0.5 + 0.5 * Math.sin(TT * 10)) + 0.04 * Math.sin(TT * 1.6)).toFixed(3) + ')';
    var nowMs = performance.now();
    if (ready3 && !attract && !tour && cur >= 0 && nowMs - lastTouch > 30000) { attract = true; atStep = -2; atNext = nowMs + 400; elAttract.classList.add('on'); }
    if (attract && nowMs >= atNext && tw.phase === 'idle') { atStep++; if (atStep === -1) { say('Psst…', LCONTENT.idle, 'idle'); atNext = nowMs + 7000; } else if (atStep > 4) { atStep = -1; setMotif((cur + 1) % NM); atNext = nowMs + 9000; } else { select(atStep); atNext = nowMs + 11000; } }
    if (cur < 0) { if (composer && !LT) composer.render(); else renderer.render(scene, camera); return; }

    /* screen switch tween */
    if (tw.phase === 'out') { tw.t += dt / 0.3; var gO = motifs[cur].group; gO.scale.setScalar(Math.max(0.001, 1 - tw.t * tw.t)); twRot = tw.t * tw.t * 2.2; if (tw.t >= 1) { commit(tw.next); tw.phase = 'in'; tw.t = 0; } }
    else if (tw.phase === 'in') { tw.t += dt / 0.6; var kk = Math.min(1, tw.t), gI = motifs[cur].group; gI.scale.setScalar(Math.max(0.001, eBack(kk))); twRot = -(1 - kk) * (1 - kk) * 3.4; if (kk >= 1) { tw.phase = 'idle'; gI.scale.setScalar(1); twRot = 0; dockBtns.forEach(function (button) { button.disabled = false; }); } }
    var M = motifs[cur];
    /* rotation: auto spin, or glide the selected point to the front */
    if (dragDX || dragDY) {
      var kd = 1 - Math.exp(-dt * 11), sx = dragDX * kd, sy = dragDY * kd; dragDX -= sx; dragDY -= sy; if (Math.abs(dragDX) < 0.02) dragDX = 0; if (Math.abs(dragDY) < 0.02) dragDY = 0;
      rotY += sx * 0.0048; rotX = clamp(rotX + sy * 0.0028, -0.5, 0.5); if (dt > 0) velY = clamp(velY + (sx * 0.0048 / dt - velY) * Math.min(1, dt * 7), -1.1, 1.1);
    }
    if (!dragging) { if (sel >= 0) { rotY += (rotYT + 0.22 * Math.sin(TT * 0.5) - rotY) * Math.min(1, dt * 1.7); } else { rotY += (velY + (RM ? 0.03 : (M.tilt ? 0.1 : 0.14))) * dt; velY *= Math.exp(-dt * 2.4); } rotX += ((M.tilt ? 0 : 0.08) - rotX) * Math.min(1, dt * 1.2); }
    tiltCur += (tiltT - tiltCur) * Math.min(1, dt * 2.4); M.group.rotation.set(rotX + (M.tilt ? tiltCur : 0), rotY + twRot, 0, 'XYZ');
    M.update(TT, dt);
    /* camera: glide in to the selected point */
    zoomK += (zoomKT - zoomK) * (1 - Math.exp(-dt * 6));
    if (sel >= 0) { anchorWorld(sel, tmpV2); lookT.copy(tmpV2); camDT = M.focus[sel] / zoomK; } else { lookT.set(0, 0, 0); camDT = (M.dist || (M.key === 'body' ? 12 : 9)) / zoomK; }
    var ek = 1 - Math.exp(-dt * 2.3); lookC.lerp(lookT, ek); camD += (camDT - camD) * ek; par.x += (par.tx - par.x) * 0.06; par.y += (par.ty - par.y) * 0.06;
    camera.position.set(lookC.x + par.x * 0.25, lookC.y - par.y * 0.18, camD); camera.lookAt(lookC.x, lookC.y, 0);
    if (ambStars) ambStars.rotation.y = TT * 0.01;
    accCur.lerp(accTgt, Math.min(1, dt * 3));
    if (rimL) { rimL.color.copy(accCur); rimL.intensity = 1.4 + 0.25 * Math.sin(TT * 1.3); }
    if (pedestal) { pedTicks.rotation.y = TT * 0.35; pedTicks.material.color.copy(accCur); if (LT) pedTicks.material.color.multiplyScalar(0.55); pedRings.forEach(function (r, i) { r.material.color.copy(accCur); if (LT) r.material.color.multiplyScalar(0.55); r.material.opacity = 0.18 + 0.3 * (0.5 + 0.5 * Math.sin(TT * 1.6 - i * 0.9)); r.scale.setScalar(1 + 0.03 * Math.sin(TT * 1.6 - i * 0.9)); }); }
    if (rainPts) { rainPts.material.color.copy(accCur); if (LT) rainPts.material.color.multiplyScalar(0.55); for (var rq = 0; rq < rainSpd.length; rq++) { var ry = rainPos[rq * 3 + 1] + rainSpd[rq] * dt * (1 + kick * 2); if (ry > 5.5) ry -= 11; rainPos[rq * 3 + 1] = ry; } rainPts.geometry.attributes.position.needsUpdate = true; }
    statT -= dt; if (statT <= 0 && statEls.length) { statT = 0.12; statEls.forEach(function (e) { var v = String(e.s.f(TT)); if (v !== e.last) { e.last = v; e.v.textContent = v; } e.bar.style.transform = 'scaleX(' + clamp(e.s.p(TT), 0.03, 1).toFixed(3) + ')'; }); }
    kick *= Math.exp(-dt * 2.6); if (bloom) bloom.strength = 0.26 + kick * 0.28 + amp * 0.04 * (0.5 + 0.5 * Math.sin(TT * 9));
    ambT -= dt; if (ambT < 0 && !RM) { ambT = 0.5 + Math.random() * 0.7; var aa = Math.random() * PI2, ab = Math.acos(2 * Math.random() - 1); burst(Math.sin(ab) * Math.cos(aa) * 1.6, Math.cos(ab) * 1.6, Math.sin(ab) * Math.sin(aa) * 1.6, 1, 0.1, 1.6, [C_AQUA]); }
    fxStep(dt); camera.updateMatrixWorld();
    /* hotspots follow their anchors */
    M.group.updateMatrixWorld(true); M.group.getWorldPosition(tmpV2); var czw = tmpV2.z;
    for (var i = 0; i < hsEls.length; i++) {
      M.anchors[i].get(tmpV); M.group.localToWorld(tmpV); var zrel = tmpV.z - czw; tmpV.project(camera); var x = (tmpV.x * 0.5 + 0.5) * LW, y = (-tmpV.y * 0.5 + 0.5) * LH, back = zrel < -0.45, el = hsEls[i];
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (back ? 0.8 : 1) + ')'; el.style.opacity = tw.phase === 'idle' ? (back ? 0.45 : 1) : clamp(M.group.scale.x, 0, 1); el.classList.toggle('flip', x > 620); hsPos[i] = [x, y];
    }
    if (connT >= 0 && sel >= 0 && hsPos[sel] && tw.phase === 'idle') {
      connT = Math.min(1, connT + dt / 0.55); var ctop = elLower.offsetTop + elCard.offsetTop - 2, hp = hsPos[sel], tx = clamp(hp[0], 150, 930), cy2 = (hp[1] + ctop) / 2;
      elConnP.setAttribute('d', 'M' + hp[0].toFixed(1) + ' ' + hp[1].toFixed(1) + ' C' + hp[0].toFixed(1) + ' ' + cy2.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + (cy2 - 40).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ctop);
      elConnP.setAttribute('stroke-dashoffset', (1 - eIO(connT)).toFixed(3)); elConnP.style.opacity = 0.9; elConnD.setAttribute('cx', tx.toFixed(1)); elConnD.setAttribute('cy', ctop); elConnD.style.opacity = connT >= 1 ? 1 : 0;
    } else if (elConnP && (connT < 0 || sel < 0 || tw.phase !== 'idle')) { elConnP.style.opacity = 0; elConnD.style.opacity = 0; }
    if (composer && !LT) composer.render(); else renderer.render(scene, camera);
  }
  window.__lshc = { enter: enterL, leave: leaveL, idle: function () { lastTouch = 0; }, state: function () { return { cur: cur, sel: sel, ok: L3.ok, failed: L3.failed, tris: renderer ? renderer.info.render.triangles : 0, calls: renderer ? renderer.info.render.calls : 0 }; } };

})();
