(function () {
  'use strict';
  var W = 1080, H = 1920;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = document.getElementById('stage');
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- scale the fixed stage to whatever window it is in ---------- */
  var scale = 0.4;
  function fit() {
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.setProperty('--stage-scale', scale);
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }
  window.addEventListener('resize', fit); fit();

  /* ---------- content (captions match the recorded narration word for word) ---------- */
  var GREET = 'Hi, I’m your Orbit guide. Welcome to the Innovation Space. Touch anything that glows, and I’ll show you what’s next.';
  var IDLE = 'Psst. Come closer. Touch the screen, and let’s explore the future together.';
  var ICONS = {
    ai: '<svg viewBox="0 0 48 48"><circle cx="9" cy="24" r="4"/><circle cx="24" cy="9" r="4"/><circle cx="24" cy="39" r="4"/><circle cx="39" cy="24" r="4"/><path d="M12.5 21.5 20.5 12M12.5 26.5l8 9M27.5 12l8 9.5M27.5 36l8-9.5M24 13v22"/></svg>',
    quantum: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="24" rx="20" ry="8"/><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(120 24 24)"/><circle cx="24" cy="24" r="3" fill="currentColor"/></svg>',
    twin: '<svg viewBox="0 0 48 48"><path d="M24 5 41 14.5v19L24 43 7 33.5v-19zM7 14.5 24 24l17-9.5M24 24v19"/></svg>',
    genome: '<svg viewBox="0 0 48 48"><path d="M14 5c22 12 22 26 0 38M34 5C12 17 12 31 34 43M19 15h10M17 24h14M19 33h10"/></svg>',
    shield: '<svg viewBox="0 0 48 48"><path d="M24 4 40 10.5V24c0 9.500-7 16.500-16 20-9-3.500-16-10.500-16-20V10.500zM16.500 24l5 5 10-11"/></svg>'
  };
  var TOPICS = [
    { key: 'ai', name: 'Generative AI', tag: 'Software that writes, sees and reasons', act: 'Fire a signal',
      intro: 'This is generative AI. Picture a network of tiny decision makers, all learning from examples. Tap a glowing node, and let’s look closer.',
      notes: [
        ['Learning', 'Every node adjusts a small weight each time it sees an example. Billions of tiny nudges, and suddenly the system can write, draw, and reason.'],
        ['Reasoning', 'Newer models don’t just answer. They break a problem into steps, and check their own work along the way.'],
        ['Agents', 'Now give that model some tools. Search, calculators, your calendar. That’s an agent. It doesn’t just talk, it gets things done.']] },
    { key: 'quantum', name: 'Quantum Computing', tag: 'Computing with the rules of physics', act: 'Measure the qubit',
      intro: 'Welcome to quantum computing. Here, information lives in qubits, and a qubit can hold a blend of zero and one until you measure it. Tap a glowing point.',
      notes: [
        ['Qubit', 'Imagine a globe. A classical bit sits at the north or the south pole. A qubit can point anywhere on the surface, and that opens up new ways to solve problems.'],
        ['Entanglement', 'Entangled qubits share a single state. Measure one, and you instantly know something about the other. It’s one of the strangest ideas in physics.'],
        ['Where it helps', 'The early wins are in chemistry, materials, and optimisation. Think faster searches for new medicines, and smarter logistics.']] },
    { key: 'twin', name: 'Digital Twins', tag: 'A living copy of the real world', act: 'Simulate a surge',
      intro: 'This is a digital twin, a living copy of a hospital campus, or a factory, or a whole city. Real sensors feed it, so it stays in step with the real world. Tap a glowing tower.',
      notes: [
        ['Sense', 'Sensors stream temperature, movement, and energy use into the model, second by second.'],
        ['Simulate', 'Now ask what if. What if we change the layout? What if patients surge on a Monday? Test it here first, with zero disruption.'],
        ['Optimise', 'The twin recommends improvements. Once you act on them, the results flow back, and the model learns again.']] },
    { key: 'genome', name: 'Genomics', tag: 'Reading the code of life', act: 'Read the code',
      intro: 'This is DNA, the code of life. Four letters, A, T, C and G, written along a double helix. Sequencing reads it, and AI helps us understand it. Tap a glowing rung.',
      notes: [
        ['Bases', 'A always pairs with T, and C always pairs with G. Those pairs form the rungs of the ladder.'],
        ['Sequencing', 'Sequencing machines read the order of those letters. It produces far more data than any person could study by hand.'],
        ['Precision medicine', 'Add AI, and a person’s genome can help point to the treatment most likely to work for them.']] },
    { key: 'shield', name: 'Cyber Shield', tag: 'Trust, built in layers', act: 'Simulate an attack',
      intro: 'Welcome to the cyber shield. Security works in layers. Each layer lowers risk, and buys defenders precious time. Tap a glowing point.',
      notes: [
        ['Detect', 'Detection first. AI watches millions of events, and spots unusual behaviour faster than any human team could.'],
        ['Protect', 'Then protection. With zero trust, every user and every device is verified, every single time.'],
        ['Respond', 'And finally, response. Automated playbooks contain a threat in seconds, then people investigate and recover.']] }
  ];

  var EXTRA = {
    ai: [['Prompts', 'Everything starts with a prompt. A clear question, some context, and the model turns your words into a plan.'], ['Guardrails', 'And great power needs guardrails. Testing, human oversight, and clear rules keep AI fair, safe, and accountable.']],
    quantum: [['Error correction', 'Qubits are fragile. Error correction spreads one piece of information across many qubits, so a single slip doesn\u2019t ruin the answer.'], ['Quantum-safe', 'One day, quantum computers could break today\u2019s encryption. So the world is already moving to new, quantum-safe security.']],
    twin: [['Flow', 'People, patients, deliveries. Watch how everything flows through the campus, and spot a bottleneck before it forms.'], ['Energy', 'Energy is tracked building by building. The twin finds the waste, and cuts both cost and carbon.']],
    genome: [['Gene editing', 'Tools like CRISPR work like molecular scissors, cutting DNA at an exact spot, so scientists can correct a faulty gene.'], ['Drug discovery', 'Once you know the genetic cause of a disease, you know where to aim. And AI shortens the hunt for new medicines.']],
    shield: [['Identity', 'Identity is the new perimeter. Strong sign-in, like a passkey or a fingerprint, stops most attacks before they even start.'], ['Resilience', 'No shield is perfect. Resilience means planning, practising, and backing up, so you recover fast when something does get through.']]
  };
  TOPICS.forEach(function (tp) { EXTRA[tp.key].forEach(function (n) { tp.notes.push(n); }); });
  var TOTAL = TOPICS.length * 5;

  /* ---------- three.js renderer, bloom, lights ---------- */
  var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H);
  renderer.setClearColor(0x080b09, 1);
  $('gl').appendChild(renderer.domElement);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
  camera.position.set(0, 0, 9);
  var ROOT_Y = 0.62;
  var root = new THREE.Group(); root.position.y = ROOT_Y; scene.add(root);

  (function backdrop() {
    var c = document.createElement('canvas'); c.width = 216; c.height = 384;
    var g = c.getContext('2d');
    g.fillStyle = '#080b09'; g.fillRect(0, 0, 216, 384);
    var r1 = g.createRadialGradient(108, 142, 0, 108, 142, 190);
    r1.addColorStop(0, 'rgba(20,40,28,0.45)'); r1.addColorStop(0.55, 'rgba(10,24,17,0.18)'); r1.addColorStop(1, 'rgba(8,11,9,0)');
    g.fillStyle = r1; g.fillRect(0, 0, 216, 384);
    var r2 = g.createRadialGradient(108, 340, 0, 108, 340, 170);
    r2.addColorStop(0, 'rgba(0,90,100,0.06)'); r2.addColorStop(1, 'rgba(8,11,9,0)');
    g.fillStyle = r2; g.fillRect(0, 0, 216, 384);
    var t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; scene.background = t;
  })();

  scene.add(new THREE.AmbientLight(0x88b8a0, 0.7));
  var key = new THREE.DirectionalLight(0xe8ffd0, 1.5); key.position.set(3, 4, 5); scene.add(key);
  var rim = new THREE.PointLight(0x0097a9, 2.2, 14); rim.position.set(-4, -1, 3); scene.add(rim);
  var warm = new THREE.PointLight(0x86bc25, 1.8, 12); warm.position.set(3, -3, 2); scene.add(warm);

  var composer = null, bloom = null;
  try {
    if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass) {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.36, 0.5, 0.58);
      composer.addPass(bloom);
    }
  } catch (e) { composer = null; bloom = null; }

  var LT = false, themeSeen = false, themed = false, floorShadow = null, savedBg = null;
  function setTheme(on) { LT = on; ProtoTheme.apply(scene, on); renderer.setClearColor(on ? ProtoTheme.BG_HEX : 0x080b09, 1); if (bloom) bloom.enabled = !on; if (floorShadow) floorShadow.visible = on; if (on) { if (!savedBg) savedBg = scene.background; scene.background = new THREE.Color(ProtoTheme.BG_HEX); } else if (savedBg) scene.background = savedBg; }
  /* ---------- helpers ---------- */
  var C = function (h) { return new THREE.Color(h); };
  var GREEN = C(0x86bc25), LIME = C(0xc4d600), TEAL = C(0x0097a9), AQUA = C(0x5fd4e3), ORANGE = C(0xed8b00), SOFT = C(0x1b6f63), PAPER = C(0xf1f6ec);
  var Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  var TEX = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  function pts(pos, col, size, opacity) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size: size, map: TEX, vertexColors: true, transparent: true, opacity: opacity == null ? 1 : opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  }
  function segs(pos, color, opacity) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  }
  function glow(color, size, op) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX, color: color, transparent: true, opacity: op == null ? 1 : op, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.set(size, size, 1); return s;
  }
  function fresnel(color, power, opacity) {
    return new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, o: { value: opacity }, uLight: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 c; uniform float p; uniform float o; uniform float uLight; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), p); if (uLight > 0.5) { gl_FragColor = vec4(c * 0.6, min(1.0, f * o * 1.6)); } else { gl_FragColor = vec4(c * f * 1.5, f * o); } }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
  }
  function bond(a, b, rad, color) {
    var d = new THREE.Vector3().subVectors(b, a), len = d.length();
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 8), new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.3, emissive: color, emissiveIntensity: 0.25 }));
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, d.normalize()); return m;
  }
  function ball(pos, rad, color) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(rad, 20, 16), new THREE.MeshStandardMaterial({ color: color, roughness: 0.25, metalness: 0.35, emissive: color, emissiveIntensity: 0.45 }));
    m.position.copy(pos); return m;
  }
  function circlePts(fn, n) { var a = []; for (var k = 0; k < n; k++) { var p = fn(k / n * Math.PI * 2), q = fn((k + 1) / n * Math.PI * 2); a.push(p[0], p[1], p[2], q[0], q[1], q[2]); } return a; }
  var labelRedraw = [];
  function label(txt, color, w, h, font) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 128;
    var tex = new THREE.CanvasTexture(c);
    function draw() {
      var g = c.getContext('2d'); g.clearRect(0, 0, 256, 128);
      g.font = (font || '700 84px') + ' "Open Sans", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 16; g.fillText(txt, 128, 68); tex.needsUpdate = true;
    }
    draw(); labelRedraw.push(draw);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.set(w, h, 1); return s;
  }
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 84px "Open Sans"').then(function () { labelRedraw.forEach(function (f) { f(); }); }).catch(function () {});
  }
  function nearest(list, dir, ok) {
    var best = -1, bd = -9, d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    for (var i = 0; i < list.length; i++) { if (ok && !ok(i)) continue; var v = list[i].clone().normalize().dot(d); if (v > bd) { bd = v; best = i; } }
    return best;
  }
  var cmp = function (a, b) { return a[0] - b[0]; };

  /* --- 1. Generative AI: a layered neural network with signals racing through it --- */
  function buildAI(notes) {
    var g = new THREE.Group(), r = rng(7), i, j, P = [], S = [];
    [[0.6, 12], [0.95, 26], [1.3, 46]].forEach(function (sh, si) {
      for (i = 0; i < sh[1]; i++) {
        var y = 1 - 2 * (i + 0.5) / sh[1], rr = Math.sqrt(1 - y * y), th = i * 2.39996 + si * 1.3, k = sh[0] * (0.94 + 0.12 * r());
        P.push(new THREE.Vector3(Math.cos(th) * rr * k, y * k, Math.sin(th) * rr * k)); S.push(si);
      }
    });
    var N = P.length, adj = [], E = [], ep = [];
    for (i = 0; i < N; i++) adj.push([]);
    function link(a, b) { if (adj[a].indexOf(b) >= 0) return; adj[a].push(b); adj[b].push(a); E.push([a, b]); ep.push(P[a].x, P[a].y, P[a].z, P[b].x, P[b].y, P[b].z); }
    for (i = 0; i < N; i++) {
      var same = [], inner = [];
      for (j = 0; j < N; j++) { if (j === i) continue; var d = P[i].distanceToSquared(P[j]); if (S[j] === S[i]) same.push([d, j]); else if (S[j] === S[i] - 1) inner.push([d, j]); }
      same.sort(cmp); inner.sort(cmp);
      for (j = 0; j < 2; j++) link(i, same[j][1]);
      if (inner.length) link(i, inner[0][1]);
    }
    g.add(segs(ep, 0x2fb5a0, 0.22));

    var nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial(), N);
    var dummy = new THREE.Object3D(), en = new Float32Array(N), gpos = [], gcol = new Float32Array(N * 3), tmp = new THREE.Color();
    for (i = 0; i < N; i++) {
      dummy.position.copy(P[i]); dummy.scale.setScalar([0.05, 0.06, 0.07][S[i]]); dummy.updateMatrix();
      nodes.setMatrixAt(i, dummy.matrix); nodes.setColorAt(i, SOFT); gpos.push(P[i].x, P[i].y, P[i].z);
    }
    nodes.instanceColor.setUsage(THREE.DynamicDrawUsage);
    g.add(nodes);
    var halo = pts(gpos, gcol, 0.12, 0.5); g.add(halo);

    var NP = 36, pl = [], pulses = pts(new Array(NP * 3).fill(0), new Array(NP * 3).fill(0), 0.14, 1); g.add(pulses);
    for (i = 0; i < NP; i++) { var e = E[Math.floor(r() * E.length)]; pl.push({ a: e[0], b: e[1], t: r(), s: 0.55 + r() * 0.8 }); }

    var core = new THREE.Mesh(new THREE.SphereGeometry(0.4, 40, 30), fresnel(0x86bc25, 1.6, 1));
    var coreIn = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 20), new THREE.MeshBasicMaterial({ color: 0xe9ff9a }));
    var coreWire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), new THREE.MeshBasicMaterial({ color: 0xc4d600, wireframe: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    var coreGlow = glow(0x86bc25, 1.0, 0.7);
    g.add(core, coreIn, coreWire, coreGlow);

    var rings = [];
    [[1.6, [1.1, 0, 0.3], 14, 0.3]].forEach(function (cfg, ri) {
      var tilt = new THREE.Group(); tilt.rotation.set(cfg[1][0], cfg[1][1], cfg[1][2]);
      var spin = new THREE.Group(); tilt.add(spin);
      var torus = new THREE.Mesh(new THREE.TorusGeometry(cfg[0], 0.004, 6, 160), new THREE.MeshBasicMaterial({ color: 0x86bc25, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
      torus.rotation.x = Math.PI / 2; tilt.add(torus);
      var tok = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.055, 0.05), new THREE.MeshBasicMaterial(), cfg[2]);
      for (var k = 0; k < cfg[2]; k++) {
        var a = k / cfg[2] * Math.PI * 2; dummy.position.set(Math.cos(a) * cfg[0], 0, Math.sin(a) * cfg[0]); dummy.rotation.set(0, -a, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
        tok.setMatrixAt(k, dummy.matrix); tok.setColorAt(k, (k % 3 === 0 ? LIME : (k % 3 === 1 ? GREEN : AQUA)).clone().multiplyScalar(0.55));
      }
      dummy.rotation.set(0, 0, 0);
      spin.add(tok); g.add(tilt); rings.push({ tilt: tilt, spin: spin, R: cfg[0], s: cfg[3] });
    });

    var wave = -1, boost = 0;
    function pn(a, b) { return a; }
    var learn = nearest(P, [-1, 0.35, 0.6], function (k) { return S[k] === 2; }), reason = nearest(P, [0.2, 1, 0.5], function (k) { return S[k] === 1; }), prompt = nearest(P, [1, -0.45, 0.5], function (k) { return S[k] === 2; }), guard = nearest(P, [-0.3, -1, 0.5], function (k) { return S[k] === 2; });
    var anchors = [
      { get: function () { return P[learn]; }, title: notes[0][0], text: notes[0][1] },
      { get: function () { return P[reason]; }, title: notes[1][0], text: notes[1][1] },
      { get: function () { var rg = rings[0]; return new THREE.Vector3(rg.R, 0, 0).applyAxisAngle(Y, rg.spin.rotation.y).applyEuler(rg.tilt.rotation); }, title: notes[2][0], text: notes[2][1] },
      { get: function () { return P[prompt]; }, title: notes[3][0], text: notes[3][1] },
      { get: function () { return P[guard]; }, title: notes[4][0], text: notes[4][1] }
    ];
    var pa = pulses.geometry.attributes.position.array, pcA = pulses.geometry.attributes.color.array, ha = halo.geometry.attributes.color.array;
    return { group: g, anchors: anchors,
      act: function () { wave = 0; boost = 1; },
      update: function (t, dt) {
        var i;
        if (wave >= 0) { wave += dt * 1.45; for (i = 0; i < N; i++) { if (Math.abs(P[i].length() - wave) < 0.16) en[i] = 1.5; } if (wave > 1.9) wave = -1; }
        boost = Math.max(0, boost - dt * 0.6);
        for (i = 0; i < NP; i++) {
          var p = pl[i]; p.t += p.s * dt * (1 + boost * 2.5);
          if (p.t >= 1) { en[p.b] = 1; var nb = adj[p.b], nx = nb[Math.floor(Math.random() * nb.length)]; if (nx === p.a && nb.length > 1) nx = nb[(nb.indexOf(nx) + 1) % nb.length]; p.a = p.b; p.b = nx; p.t = 0; }
          var A = P[p.a], B = P[p.b];
          pa[i * 3] = A.x + (B.x - A.x) * p.t; pa[i * 3 + 1] = A.y + (B.y - A.y) * p.t; pa[i * 3 + 2] = A.z + (B.z - A.z) * p.t;
          var f = Math.sin(p.t * Math.PI); pcA[i * 3] = 0.77 * f; pcA[i * 3 + 1] = 0.84 * f; pcA[i * 3 + 2] = 0.1 * f;
        }
        pulses.geometry.attributes.position.needsUpdate = true; pulses.geometry.attributes.color.needsUpdate = true;
        var dec = Math.exp(-dt * 2.4);
        for (i = 0; i < N; i++) {
          en[i] *= dec; var e = Math.min(1, en[i]);
          tmp.copy(SOFT).lerp(LIME, e); nodes.setColorAt(i, tmp);
          ha[i * 3] = 0.08 + e * 0.7; ha[i * 3 + 1] = 0.3 + e * 0.6; ha[i * 3 + 2] = 0.25 + e * 0.05;
        }
        nodes.instanceColor.needsUpdate = true; halo.geometry.attributes.color.needsUpdate = true;
        coreIn.scale.setScalar(1 + 0.12 * Math.sin(t * 3) + boost * 0.4); coreGlow.scale.setScalar(1.0 + 0.12 * Math.sin(t * 3) + boost * 0.6);
        coreWire.rotation.y = t * 0.6; coreWire.rotation.x = t * 0.35;
        rings.forEach(function (rg) { rg.spin.rotation.y = t * rg.s; });
      } };
  }

  /* --- 2. Quantum: a Bloch sphere with a precessing qubit, an entangled pair and a molecule --- */
  function buildQuantum(notes) {
    var g = new THREE.Group(), R = 0.9, i;
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 56, 40), fresnel(0x0097a9, 1.9, 1)));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.99, 32, 24), new THREE.MeshStandardMaterial({ color: 0x0a3b30, transparent: true, opacity: 0.2, roughness: 0.25, metalness: 0.3, depthWrite: false })));
    g.add(segs(circlePts(function (t) { return [Math.cos(t) * R, 0, Math.sin(t) * R]; }, 96), 0x86bc25, 0.85));
    g.add(segs(circlePts(function (t) { return [Math.cos(t) * R, Math.sin(t) * R, 0]; }, 96), 0x5fd4e3, 0.35));
    g.add(segs([0, -1.2, 0, 0, 1.2, 0, -1.1, 0, 0, 1.1, 0, 0, 0, 0, -1.1, 0, 0, 1.1], 0xf1f6ec, 0.4));
    var top = label('|0⟩', '#86bc25', 0.5, 0.25), bot = label('|1⟩', '#5fd4e3', 0.5, 0.25);
    top.position.set(0, 1.4, 0); bot.position.set(0, -1.4, 0); g.add(top, bot);

    var arrow = new THREE.Group();
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, R - 0.1, 8), new THREE.MeshBasicMaterial({ color: 0xc4d600 })); shaft.position.y = (R - 0.1) / 2;
    var cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.15, 14), new THREE.MeshBasicMaterial({ color: 0xc4d600 })); cone.position.y = R - 0.02;
    var tipGlow = glow(0xc4d600, 0.5, 1); tipGlow.position.y = R;
    arrow.add(shaft, cone, tipGlow); g.add(arrow);
    var proj = segs([0, 0, 0, 0, 0, 0], 0xf1f6ec, 0.45); g.add(proj);
    var foot = glow(0xf1f6ec, 0.2, 0.8); g.add(foot);
    var L = 100, tp = new Float32Array(L * 3), tc = new Float32Array(L * 3), tg = new THREE.BufferGeometry();
    for (i = 0; i < L; i++) { var f = 1 - i / L; tc[i * 3] = LIME.r * f; tc[i * 3 + 1] = LIME.g * f; tc[i * 3 + 2] = LIME.b * f; }
    tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tc, 3));
    var trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(trail);
    var shock = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), fresnel(0xc4d600, 1.3, 0)); g.add(shock);

    function orbit(radius, rot, col) {
      var tilt = new THREE.Group(); tilt.rotation.set(rot[0], rot[1], rot[2]);
      var tor = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.005, 6, 160), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      tor.rotation.x = Math.PI / 2; tilt.add(tor); g.add(tilt); return tilt;
    }
    function electron(color, size) { var e = new THREE.Group(); e.add(ball(new THREE.Vector3(), 0.05, color)); e.add(glow(color, size, 0.95)); return e; }
    var t1 = orbit(1.2, [1.05, 0, 0.35], 0x86bc25), eA = electron(0xc4d600, 0.34), eB = electron(0x5fd4e3, 0.34); t1.add(eA, eB);
    var link = segs([0, 0, 0, 0, 0, 0], 0xc4d600, 0.7); t1.add(link);
    var beads = [glow(0xf1f6ec, 0.2, 0.95), glow(0xf1f6ec, 0.2, 0.95), glow(0xf1f6ec, 0.2, 0.95)]; beads.forEach(function (b) { t1.add(b); });
    var t2 = orbit(1.3, [-0.5, 0, -0.9], 0x0097a9), e2a = electron(0x5fd4e3, 0.3), e2b = electron(0x86bc25, 0.3); t2.add(e2a, e2b);

    var mol = new THREE.Group(); mol.position.set(0.95, -0.72, 0.25); g.add(mol);
    var atoms = [], mp = [];
    for (i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; mp.push(new THREE.Vector3(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17)); }
    var sub = [new THREE.Vector3(0.36, 0.12, 0), new THREE.Vector3(-0.3, -0.16, 0.22), new THREE.Vector3(0.05, 0.2, -0.32)];
    var subFrom = [0, 3, 4];
    mp.forEach(function (v, k) { mol.add(ball(v, 0.05, k % 2 ? 0x0097a9 : 0x86bc25)); mol.add(bond(v, mp[(k + 1) % 6], 0.012, 0xa9c2ac)); });
    sub.forEach(function (v, k) { mol.add(ball(v, 0.062, k === 1 ? 0xed8b00 : 0xc4d600)); mol.add(bond(mp[subFrom[k]], v, 0.012, 0xa9c2ac)); });
    

    var m = { t: -1, target: 0, hit: false }, shockV = 0, resK = 0, arrowDir = new THREE.Vector3(), tip = new THREE.Vector3(), first = true, thetaCur = 1;
    var Rt = 1.2;
    var anchors = [
      { get: function () { return tip; }, title: notes[0][0], text: notes[0][1] },
      { get: function () { return eA.position.clone().applyEuler(t1.rotation); }, title: notes[1][0], text: notes[1][1] },
      { get: function () { return mol.position; }, title: notes[2][0], text: notes[2][1] },
      { get: function () { return e2a.position.clone().applyEuler(t2.rotation); }, title: notes[3][0], text: notes[3][1] },
      { get: function () { return e2b.position.clone().applyEuler(t2.rotation); }, title: notes[4][0], text: notes[4][1] }
    ];
    return { group: g, anchors: anchors,
      act: function () { if (m.t < 0) { m.t = 0; m.hit = false; m.target = Math.random() < 0.5 ? 0 : Math.PI; } },
      update: function (t, dt) {
        var free = 1.05 + 0.45 * Math.sin(t * 0.55), w = 0;
        if (m.t >= 0) {
          m.t += dt;
          w = m.t < 0.5 ? ease(m.t / 0.5) : (m.t < 1.9 ? 1 : Math.max(0, 1 - (m.t - 1.9) / 0.8));
          if (m.t >= 0.5 && !m.hit) { m.hit = true; shockV = 1; }
          if (m.t > 2.7) m.t = -1;
        }
        thetaCur = free * (1 - w) + m.target * w;
        var phi = t * 1.25;
        arrowDir.set(Math.sin(thetaCur) * Math.cos(phi), Math.cos(thetaCur), Math.sin(thetaCur) * Math.sin(phi));
        arrow.quaternion.setFromUnitVectors(Y, arrowDir);
        tip.copy(arrowDir).multiplyScalar(R);
        if (first) { for (var q = 0; q < L; q++) { tp[q * 3] = tip.x; tp[q * 3 + 1] = tip.y; tp[q * 3 + 2] = tip.z; } first = false; }
        tp.copyWithin(3, 0, (L - 1) * 3); tp[0] = tip.x; tp[1] = tip.y; tp[2] = tip.z; tg.attributes.position.needsUpdate = true;
        var pa = proj.geometry.attributes.position.array; pa[0] = tip.x; pa[1] = tip.y; pa[2] = tip.z; pa[3] = tip.x; pa[4] = 0; pa[5] = tip.z; proj.geometry.attributes.position.needsUpdate = true;
        foot.position.set(tip.x, 0, tip.z);
        shockV = Math.max(0, shockV - dt * 1.5); shock.scale.setScalar(1 + (1 - shockV) * 0.55); shock.material.uniforms.o.value = shockV * 1.1;
        var pulse = 1 + 0.5 * w; top.scale.set(0.5 * (m.target === 0 ? pulse : 1), 0.25 * (m.target === 0 ? pulse : 1), 1); bot.scale.set(0.5 * (m.target !== 0 ? pulse : 1), 0.25 * (m.target !== 0 ? pulse : 1), 1);
        tipGlow.scale.setScalar(0.5 + 0.5 * w);

        var a = t * 0.7; eA.position.set(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2); eB.position.set(-Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2);
        var lp = link.geometry.attributes.position.array; lp[0] = eA.position.x; lp[1] = 0; lp[2] = eA.position.z; lp[3] = eB.position.x; lp[4] = 0; lp[5] = eB.position.z; link.geometry.attributes.position.needsUpdate = true;
        link.material.opacity = 0.45 + 0.3 * Math.sin(t * 5);
        beads.forEach(function (b, k) { var u = (t * 0.5 + k / 3) % 1; b.position.set(eA.position.x * (1 - 2 * u), 0, eA.position.z * (1 - 2 * u)); });
        var a2 = t * 0.45; e2a.position.set(Math.cos(a2) * 1.3, 0, Math.sin(a2) * 1.3); e2b.position.set(Math.cos(a2 + 3.4) * 1.3, 0, Math.sin(a2 + 3.4) * 1.3);
        mol.rotation.y = t * 0.5; mol.rotation.x = 0.4;
      } };
  }

  /* --- 3. Digital twin: a hospital campus with sensors, live traffic and data arcs --- */
  function buildTwin(notes) {
    var g = new THREE.Group(), inner = new THREE.Group(), r = rng(21), i, j;
    inner.rotation.x = 0.42; inner.position.y = -0.5; g.add(inner);
    var plat = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.48, 0.08, 72), new THREE.MeshStandardMaterial({ color: 0x0c2b1e, metalness: 0.6, roughness: 0.35, emissive: 0x04150d }));
    plat.position.y = -0.05; inner.add(plat);
    var rimT = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.014, 8, 120), new THREE.MeshBasicMaterial({ color: 0x86bc25, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); rimT.rotation.x = Math.PI / 2; inner.add(rimT);
    var cell = 0.31, B = [];
    for (i = -3; i <= 3; i++) for (j = -3; j <= 3; j++) {
      if (i === 0 || j === 0) continue;
      var x = i * cell + Math.sign(i) * 0.03, z = j * cell + Math.sign(j) * 0.03, dc = Math.hypot(x, z);
      if (dc > 1.22) continue;
      if (!(i === 1 && j === 1) && r() < 0.3) continue;
      var hosp = (i === 1 && j === 1), h = hosp ? 1.05 : Math.max(0.1, (0.14 + r() * 0.5) * (1.55 - dc * 0.65));
      B.push({ x: x, z: z, w: hosp ? 0.3 : 0.19 + r() * 0.06, d: hosp ? 0.3 : 0.19 + r() * 0.06, h: h, hosp: hosp, rr: r() });
    }
    var n = B.length, dummy = new THREE.Object3D(), box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    var body = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: 0x0a2a1e, metalness: 0.25, roughness: 0.55, emissive: 0x041a10, transparent: true, opacity: 0.9 }), n);
    var roofGeo = new THREE.BoxGeometry(1, 0.025, 1), roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshBasicMaterial(), n);
    var ed = [], fl = [];
    function loop(a, x0, x1, z0, z1, y) { a.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0); }
    B.forEach(function (b, k) {
      dummy.position.set(b.x, 0, b.z); dummy.scale.set(b.w, b.h, b.d); dummy.updateMatrix(); body.setMatrixAt(k, dummy.matrix);
      dummy.position.set(b.x, b.h + 0.012, b.z); dummy.scale.set(b.w * 0.8, 1, b.d * 0.8); dummy.updateMatrix(); roofs.setMatrixAt(k, dummy.matrix); roofs.setColorAt(k, (b.hosp ? PAPER : GREEN).clone().multiplyScalar(0.6));
      var x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
      ed.push(x0, 0, z0, x0, b.h, z0, x1, 0, z0, x1, b.h, z0, x1, 0, z1, x1, b.h, z1, x0, 0, z1, x0, b.h, z1);
      loop(ed, x0, x1, z0, z1, 0); loop(ed, x0, x1, z0, z1, b.h);
      for (var y = 0.16; y < b.h - 0.05; y += 0.16) loop(fl, x0, x1, z0, z1, y);
    });
    roofs.instanceColor.setUsage(THREE.DynamicDrawUsage);
    var edgeL = segs(ed, 0x86bc25, 0.7), floorL = segs(fl, 0x0097a9, 0.2);
    inner.add(body, roofs, edgeL, floorL);
    var hb = B.filter(function (b) { return b.hosp; })[0];
    var cross = new THREE.Group(); cross.position.set(hb.x, hb.h + 0.06, hb.z);
    cross.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.05), new THREE.MeshBasicMaterial({ color: 0xc4d600 })), new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.16), new THREE.MeshBasicMaterial({ color: 0xc4d600 })));
    var cg = glow(0xc4d600, 0.7, 0.8); cross.add(cg); inner.add(cross);

    var sens = B.filter(function (b) { return !b.hosp; }).sort(function (a, b) { return b.h - a.h; }).slice(0, 5).sort(function (a, b) { return a.x - b.x; }), sr = [];
    var hub = new THREE.Group(); hub.position.set(hb.x * 0.4, 1.55, hb.z * 0.4); inner.add(hub);
    var hubMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: 0x5fd4e3, wireframe: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    var hubCore = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe9ffff })); var hubGlow = glow(0x5fd4e3, 0.9, 0.9);
    hub.add(hubMesh, hubCore, hubGlow);
    var arcs = [], arcLines = [];
    sens.forEach(function (b, k) {
      var p0 = new THREE.Vector3(b.x, b.h + 0.3, b.z), c1 = new THREE.Vector3((b.x + hub.position.x) / 2, Math.max(b.h, 1.55) + 0.5, (b.z + hub.position.z) / 2);
      inner.add(segs([b.x, b.h, b.z, b.x, b.h + 0.3, b.z], 0x5fd4e3, 0.7));
      var sg = glow(0x5fd4e3, 0.36, 0.95); sg.position.copy(p0); inner.add(sg);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.005, 6, 36), new THREE.MeshBasicMaterial({ color: 0x5fd4e3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); ring.rotation.x = Math.PI / 2; ring.position.set(b.x, b.h + 0.02, b.z); inner.add(ring);
      sr.push({ ring: ring, ph: k * 0.37 });
      var a = []; for (var s = 0; s < 32; s++) { var u0 = s / 32, u1 = (s + 1) / 32; [u0, u1].forEach(function (u) { var v = new THREE.Vector3().addScaledVector(p0, (1 - u) * (1 - u)).addScaledVector(c1, 2 * (1 - u) * u).addScaledVector(hub.position, u * u); a.push(v.x, v.y, v.z); }); }
      inner.add(segs(a, 0x5fd4e3, 0.2)); arcs.push({ p0: p0, c: c1, off: k / 5 });
    });
    var ap = pts(new Array(15 * 3).fill(0), new Array(15 * 3).fill(1), 0.16, 1); ap.material.color = C(0x9ff0ff); inner.add(ap);

    var NT = 26, tr = [];
    for (i = 0; i < NT; i++) tr.push({ ax: i % 3, off: (i % 2 ? 1 : -1) * 0.045, u: r(), sp: (r() > 0.5 ? 1 : -1) * (0.12 + r() * 0.14) });
    var trp = pts(new Array(NT * 3).fill(0), new Array(NT * 3).fill(1), 0.11, 1); inner.add(trp);
    var scan = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), new THREE.MeshBasicMaterial({ color: 0x86bc25, transparent: true, opacity: 0.11, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    scan.rotation.x = -Math.PI / 2; inner.add(scan);
    var scanEdge = segs([-1.15, 0, -1.15, 1.15, 0, -1.15, 1.15, 0, -1.15, 1.15, 0, 1.15, 1.15, 0, 1.15, -1.15, 0, 1.15, -1.15, 0, 1.15, -1.15, 0, -1.15], 0xc4d600, 0.85); inner.add(scanEdge);

    function tw(v) { return v.clone().applyEuler(inner.rotation).add(inner.position); }
    var surge = { t: -1 }, sv = 0, tmp = new THREE.Color();
    var anchors = [
      { get: function () { return tw(new THREE.Vector3(sens[0].x, sens[0].h + 0.3, sens[0].z)); }, title: notes[0][0], text: notes[0][1] },
      { get: function () { return tw(new THREE.Vector3(hb.x, hb.h + 0.16, hb.z)); }, title: notes[1][0], text: notes[1][1] },
      { get: function () { return tw(hub.position); }, title: notes[2][0], text: notes[2][1] },
      { get: function () { return tw(new THREE.Vector3(0.02, 0.1, 0.95)); }, title: notes[3][0], text: notes[3][1] },
      { get: function () { return tw(new THREE.Vector3(-0.95, 0.35, 0.45)); }, title: notes[4][0], text: notes[4][1] }
    ];
    var trA = trp.geometry.attributes.position.array, trC = trp.geometry.attributes.color.array, apA = ap.geometry.attributes.position.array, apC = ap.geometry.attributes.color.array;
    return { group: g, anchors: anchors,
      act: function () { surge.t = 0; },
      update: function (t, dt) {
        if (surge.t >= 0) { surge.t += dt; sv = surge.t < 0.7 ? ease(surge.t / 0.7) : (surge.t < 4.2 ? 1 : Math.max(0, 1 - (surge.t - 4.2) / 1.6)); if (surge.t > 5.8) { surge.t = -1; sv = 0; } }
        var y = (Math.sin(t * 0.9) * 0.5 + 0.5) * 1.15; scan.position.y = y; scanEdge.position.y = y; scan.material.opacity = 0.11 + sv * 0.1;
        for (var k = 0; k < n; k++) { tmp.copy(B[k].hosp ? PAPER : GREEN).lerp(ORANGE, clamp(sv * (0.4 + 0.9 * B[k].rr), 0, 1)).multiplyScalar(0.6); roofs.setColorAt(k, tmp); }
        roofs.instanceColor.needsUpdate = true;
        edgeL.material.color.copy(GREEN).lerp(ORANGE, sv * 0.65);
        var sp = 1 + sv * 2.4;
        for (k = 0; k < NT; k++) {
          var d = tr[k]; d.u += d.sp * dt * sp * (d.ax === 2 ? 0.5 : 1); if (d.u > 1) d.u -= 1; if (d.u < 0) d.u += 1;
          var x, z; if (d.ax === 0) { x = (d.u - 0.5) * 2.5; z = d.off; } else if (d.ax === 1) { x = d.off; z = (d.u - 0.5) * 2.5; } else { x = Math.cos(d.u * 6.2832) * 1.36; z = Math.sin(d.u * 6.2832) * 1.36; }
          trA[k * 3] = x; trA[k * 3 + 1] = 0.02; trA[k * 3 + 2] = z;
          var c = GREEN.clone().lerp(ORANGE, sv); trC[k * 3] = c.r; trC[k * 3 + 1] = c.g; trC[k * 3 + 2] = c.b;
        }
        trp.geometry.attributes.position.needsUpdate = true; trp.geometry.attributes.color.needsUpdate = true;
        for (k = 0; k < 5; k++) for (var q = 0; q < 3; q++) {
          var u = (t * 0.45 + arcs[k].off + q / 3) % 1, a = arcs[k], idx = k * 3 + q;
          apA[idx * 3] = (1 - u) * (1 - u) * a.p0.x + 2 * (1 - u) * u * a.c.x + u * u * hub.position.x;
          apA[idx * 3 + 1] = (1 - u) * (1 - u) * a.p0.y + 2 * (1 - u) * u * a.c.y + u * u * hub.position.y;
          apA[idx * 3 + 2] = (1 - u) * (1 - u) * a.p0.z + 2 * (1 - u) * u * a.c.z + u * u * hub.position.z;
          var f = Math.sin(u * Math.PI); apC[idx * 3] = 0.6 * f; apC[idx * 3 + 1] = 0.95 * f; apC[idx * 3 + 2] = f;
        }
        ap.geometry.attributes.position.needsUpdate = true; ap.geometry.attributes.color.needsUpdate = true;
        sr.forEach(function (s) { var u = ((t * 0.8) + s.ph) % 1; s.ring.scale.setScalar(0.6 + u * 1.8); s.ring.material.opacity = 0.9 * (1 - u); });
        hubMesh.rotation.y = t * 0.9; hubMesh.rotation.x = t * 0.5; hub.position.y = 1.55 + Math.sin(t * 1.4) * 0.03; hubGlow.scale.setScalar(0.9 + 0.15 * Math.sin(t * 3) + sv * 0.4);
        cg.scale.setScalar(0.7 + 0.1 * Math.sin(t * 4));
      } };
  }

  /* --- 4. Genomics: a solid double helix, coloured base pairs and a sequencing read head --- */
  function buildGenome(notes) {
    var tilt = new THREE.Group(), g = new THREE.Group(); tilt.add(g); tilt.rotation.z = 0.28;
    var n = 32, len = 2.5, rad = 0.46, step = 0.62, i, r = rng(3);
    function pt(f, off) { var y = (f - 0.5) * len, a = f * (n - 1) * step + off; return new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad); }
    [[0, 0x86bc25, 0x2c4a08], [Math.PI, 0x0097a9, 0x00363d]].forEach(function (s) {
      var arr = []; for (i = 0; i <= 260; i++) arr.push(pt(i / 260, s[0]));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arr), 520, 0.03, 8, false), new THREE.MeshStandardMaterial({ color: s[1], roughness: 0.3, metalness: 0.4, emissive: s[2], emissiveIntensity: 1 })));
    });
    var BASE = { A: GREEN, T: C(0x1fb6cc), C: LIME, G: AQUA }, pairs = [['A', 'T'], ['T', 'A'], ['C', 'G'], ['G', 'C']], seq = [];
    var dummy = new THREE.Object3D();
    var cyl = new THREE.CylinderGeometry(0.024, 0.024, 1, 8);
    var lm = new THREE.InstancedMesh(cyl, new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.2, emissive: 0x000000 }), n), rm = new THREE.InstancedMesh(cyl, lm.material, n);
    var beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 12), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.3 }), n * 2);
    var A = [], Bv = [], pp = [], pcol = new Float32Array(n * 6);
    for (i = 0; i < n; i++) {
      var f = i / (n - 1), pa = pt(f, 0), pb = pt(f, Math.PI), mid = new THREE.Vector3(0, pa.y, 0), pr = pairs[Math.floor(r() * 4)];
      seq.push(pr); A.push(pa); Bv.push(pb);
      [[lm, pa], [rm, pb]].forEach(function (o) {
        var d = new THREE.Vector3().subVectors(mid, o[1]); dummy.position.copy(o[1]).add(mid).multiplyScalar(0.5); dummy.quaternion.setFromUnitVectors(Y, d.clone().normalize()); dummy.scale.set(1, d.length() * 0.98, 1); dummy.updateMatrix(); o[0].setMatrixAt(i, dummy.matrix);
      });
      lm.setColorAt(i, BASE[pr[0]]); rm.setColorAt(i, BASE[pr[1]]);
      beads.setColorAt(i * 2, GREEN); beads.setColorAt(i * 2 + 1, TEAL); dummy.quaternion.identity(); dummy.scale.setScalar(0.05); dummy.position.copy(pa); dummy.updateMatrix(); beads.setMatrixAt(i * 2, dummy.matrix);
      dummy.position.copy(pb); dummy.updateMatrix(); beads.setMatrixAt(i * 2 + 1, dummy.matrix);
      pp.push(pa.x * 0.6, pa.y, pa.z * 0.6, pb.x * 0.6, pb.y, pb.z * 0.6);
    }
    lm.instanceColor.setUsage(THREE.DynamicDrawUsage); rm.instanceColor.setUsage(THREE.DynamicDrawUsage);
    g.add(lm, rm, beads);
    var bp = pts(pp, pcol, 0.11, 0.7);

    var head = new THREE.Group(); g.add(head);
    var hr = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.013, 8, 96), new THREE.MeshBasicMaterial({ color: 0xc4d600, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); hr.rotation.x = Math.PI / 2;
    var hd = new THREE.Mesh(new THREE.CircleGeometry(0.66, 48), new THREE.MeshBasicMaterial({ color: 0x86bc25, transparent: true, opacity: 0.1, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); hd.rotation.x = Math.PI / 2;
    head.add(hr, hd, glow(0xc4d600, 0.9, 0.7));

    var letters = [], lg = new THREE.Group(); g.add(lg);
    var LT = ['A', 'T', 'C', 'G'], LC = ['#86bc25', '#1fb6cc', '#c4d600', '#5fd4e3'];
    for (i = 0; i < 8; i++) {
      var li = i % 4, s = label(LT[li], LC[li], 0.3, 0.15, '800 90px'); s.material.opacity = 0.75;
      var pv = new THREE.Group(); pv.add(s); s.position.x = 0.98 + r() * 0.25; pv.rotation.y = r() * 6.28; pv.position.y = (r() - 0.5) * len; lg.add(pv);
      letters.push({ pv: pv, sp: 0.15 + r() * 0.25, vy: (r() - 0.5) * 0.06 });
    }
    var NS = 40, sp = [], sd = [];
    for (i = 0; i < NS; i++) { var a = r() * 6.28, rr = 0.7 + r() * 0.5; sd.push({ a: a, r: rr, y: (r() - 0.5) * len, v: 0.1 + r() * 0.25 }); }
    var stream = pts(new Array(NS * 3).fill(0), (function () { var c = []; for (var q = 0; q < NS; q++) c.push(0.3, 0.55, 0.3); return c; })(), 0.06, 0.8); g.add(stream);

    var headY = 0, scanT = -1, spin = 0, ix = [5, 23, 13, 27];
    function toWorld(v) { return v.clone().applyEuler(g.rotation).applyEuler(tilt.rotation); }
    var anchors = [
      { get: function () { return toWorld(A[ix[0]]); }, title: notes[0][0], text: notes[0][1] },
      { get: function () { return toWorld(new THREE.Vector3(0.66, headY, 0)); }, title: notes[1][0], text: notes[1][1] },
      { get: function () { return toWorld(Bv[ix[1]]); }, title: notes[2][0], text: notes[2][1] },
      { get: function () { return toWorld(A[ix[2]]); }, title: notes[3][0], text: notes[3][1] },
      { get: function () { return toWorld(Bv[ix[3]]); }, title: notes[4][0], text: notes[4][1] }
    ];
    var sA = stream.geometry.attributes.position.array, bc = bp.geometry.attributes.color.array, tmp = new THREE.Color();
    return { group: tilt, anchors: anchors,
      act: function () { scanT = 0; },
      update: function (t, dt) {
        spin += dt * 0.38; g.rotation.y = spin;
        if (scanT >= 0) { scanT += dt; var p = scanT / 3.2; headY = (-0.5 + ease(p)) * len; if (p >= 1) { scanT = -1; } }
        else headY = Math.sin(t * 0.55) * len * 0.47;
        head.position.y = headY; hr.scale.setScalar(1 + 0.04 * Math.sin(t * 6));
        for (var k = 0; k < n; k++) {
          var d = A[k].y - headY, gs = Math.exp(-d * d / 0.05), m = 0.4 + 0.9 * gs;
          tmp.copy(BASE[seq[k][0]]).multiplyScalar(m); lm.setColorAt(k, tmp); bc[k * 6] = tmp.r; bc[k * 6 + 1] = tmp.g; bc[k * 6 + 2] = tmp.b;
          tmp.copy(BASE[seq[k][1]]).multiplyScalar(m); rm.setColorAt(k, tmp); bc[k * 6 + 3] = tmp.r; bc[k * 6 + 4] = tmp.g; bc[k * 6 + 5] = tmp.b;
        }
        lm.instanceColor.needsUpdate = true; rm.instanceColor.needsUpdate = true; bp.geometry.attributes.color.needsUpdate = true;
        letters.forEach(function (l) { l.pv.rotation.y += l.sp * dt; l.pv.position.y += l.vy * dt; if (Math.abs(l.pv.position.y) > len / 2) l.vy = -l.vy; });
        for (k = 0; k < NS; k++) { var s = sd[k]; s.y += s.v * dt; if (s.y > len / 2) s.y = -len / 2; s.a += dt * 0.4; sA[k * 3] = Math.cos(s.a) * s.r; sA[k * 3 + 1] = s.y; sA[k * 3 + 2] = Math.sin(s.a) * s.r; }
        stream.geometry.attributes.position.needsUpdate = true;
      } };
  }

  /* --- 5. Cyber shield: layered defences, a radar sweep and incoming threats --- */
  function buildShield(notes) {
    var g = new THREE.Group(), i, r = rng(11);
    var lock = new THREE.Group();
    var lb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.13), new THREE.MeshStandardMaterial({ color: 0xc4d600, metalness: 0.5, roughness: 0.3, emissive: 0x536000, emissiveIntensity: 0.9 }));
    var sh = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.024, 12, 30, Math.PI), new THREE.MeshStandardMaterial({ color: 0xe9ff9a, metalness: 0.6, roughness: 0.25, emissive: 0x536000, emissiveIntensity: 0.6 })); sh.position.y = 0.12;
    var kh = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: 0x06120c })); kh.position.set(0, 0.01, 0.066);
    lock.add(lb, sh, kh, glow(0x86bc25, 1.3, 0.8)); g.add(lock);
    var s1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshStandardMaterial({ color: 0x0e4d33, flatShading: true, transparent: true, opacity: 0.26, emissive: 0x0a3a25, roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide, depthWrite: false }));
    var s1e = new THREE.LineSegments(new THREE.EdgesGeometry(s1.geometry), new THREE.LineBasicMaterial({ color: 0x86bc25, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    var l1 = new THREE.Group(); l1.add(s1, s1e); g.add(l1);
    var geo2 = new THREE.IcosahedronGeometry(0.98, 1);
    var s2e = new THREE.LineSegments(new THREE.EdgesGeometry(geo2), new THREE.LineBasicMaterial({ color: 0x0097a9, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
    var s2p = new THREE.Points(geo2, new THREE.PointsMaterial({ size: 0.09, map: TEX, color: 0x5fd4e3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    var l2 = new THREE.Group(); l2.add(s2e, s2p); g.add(l2);
    var outer = new THREE.Mesh(new THREE.SphereGeometry(1.32, 48, 36), fresnel(0x86bc25, 3.2, 0.5)); g.add(outer);
    var lat = new THREE.Group(); g.add(lat);
    [].forEach(function (h) { var rr = 1.32 * Math.sqrt(1 - h * h); var tor = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.005, 6, 120), new THREE.MeshBasicMaterial({ color: 0x86bc25, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })); tor.rotation.x = Math.PI / 2; tor.position.y = h * 1.32; lat.add(tor); });
    var radar = new THREE.Group(); radar.rotation.x = -Math.PI / 2 + 0.25; g.add(radar);
    var fan = new THREE.Mesh(new THREE.RingGeometry(0.05, 1.3, 40, 1, 0, 1.1), new THREE.MeshBasicMaterial({ color: 0x0097a9, transparent: true, opacity: 0.2, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    radar.add(fan, segs([0, 0, 0, 1.3, 0, 0], 0x5fd4e3, 0.9));

    var NT = 14, th = [], hp = pts(new Array(NT * 9).fill(0), new Array(NT * 9).fill(0), 0.17, 1); g.add(hp);
    function respawn(t) { var a = r() * 6.283, b = Math.acos(2 * r() - 1); t.d = new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)); t.r = 2.1 + r() * 1.3; t.v = 0.75 + r() * 0.9; t.stop = r() < 0.18 ? 0.98 : 1.34; }
    for (i = 0; i < NT; i++) { var o = {}; respawn(o); o.r = 1.4 + r() * 2; th.push(o); }
    var rip = [], rn = 0;
    for (i = 0; i < 14; i++) { var m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: 0xed8b00, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); m.visible = false; g.add(m); rip.push({ m: m, life: 1 }); }
    var flash = 0, boost = 0, base = 4;
    function impact(d, rad) {
      var p = rip[rn++ % rip.length]; p.life = 0; p.m.visible = true; p.m.position.copy(d).multiplyScalar(rad); p.m.quaternion.setFromUnitVectors(Z, d); p.m.material.color.set(rad < 1.1 ? 0x5fd4e3 : 0xed8b00); p.rad = rad;
      flash = Math.min(1, flash + 0.35);
    }
    var v2 = geo2.attributes.position, V2 = [];
    for (i = 0; i < v2.count; i++) V2.push(new THREE.Vector3(v2.getX(i), v2.getY(i), v2.getZ(i)));
    var pi = nearest(V2, [-1, -0.2, 0.6]);
    var detDir = new THREE.Vector3(0.75, 0.55, 0.4).normalize(), idDir = new THREE.Vector3(-0.5, 0.45, 0.6).normalize(), resDir = new THREE.Vector3(-0.85, -0.2, 0.5).normalize();
    var anchors = [
      { get: function () { return detDir.clone().multiplyScalar(1.32); }, title: notes[0][0], text: notes[0][1] },
      { get: function () { return V2[pi].clone().applyEuler(l2.rotation); }, title: notes[1][0], text: notes[1][1] },
      { get: function () { return new THREE.Vector3(0, -0.28, 0.1); }, title: notes[2][0], text: notes[2][1] },
      { get: function () { return idDir.clone().multiplyScalar(0.62).applyEuler(l1.rotation); }, title: notes[3][0], text: notes[3][1] },
      { get: function () { return resDir.clone().multiplyScalar(1.3); }, title: notes[4][0], text: notes[4][1] }
    ];
    var hA = hp.geometry.attributes.position.array, hC = hp.geometry.attributes.color.array;
    return { group: g, anchors: anchors,
      act: function () { boost = 1; flash = 1; },
      update: function (t, dt) {
        boost = Math.max(0, boost - dt / 6); var active = Math.round(base + (NT - base) * Math.min(1, boost * 1.6)), sp = 1 + boost * 1.2;
        l1.rotation.y += dt * 0.22; l2.rotation.y -= dt * 0.15; l2.rotation.x += dt * 0.06; lat.rotation.y += dt * 0.1; radar.children[0].parent.rotation.z -= dt * 1.4;
        lock.position.y = Math.sin(t * 1.5) * 0.02; lock.rotation.y = Math.sin(t * 0.7) * 0.35;
        for (var k = 0; k < NT; k++) {
          var q = th[k], o = k * 9;
          if (k >= active) { for (var z = 0; z < 9; z++) hA[o + z] = (z % 3 === 1) ? 999 : 0; continue; }
          q.r -= q.v * sp * dt;
          if (q.r <= q.stop) { impact(q.d, q.stop); respawn(q); }
          for (var s = 0; s < 3; s++) {
            var rr = q.r + s * 0.13, f = (1 - s * 0.32);
            hA[o + s * 3] = q.d.x * rr; hA[o + s * 3 + 1] = q.d.y * rr; hA[o + s * 3 + 2] = q.d.z * rr;
            hC[o + s * 3] = 0.93 * f; hC[o + s * 3 + 1] = 0.55 * f; hC[o + s * 3 + 2] = 0.0;
          }
        }
        hp.geometry.attributes.position.needsUpdate = true; hp.geometry.attributes.color.needsUpdate = true;
        rip.forEach(function (p) { if (p.life >= 1) return; p.life += dt / 0.7; if (p.life >= 1) { p.m.visible = false; return; } p.m.scale.setScalar(0.03 + p.life * 0.4 * (p.rad < 1.1 ? 0.7 : 1)); p.m.material.opacity = (1 - p.life) * 0.9; });
        flash = Math.max(0, flash - dt * 1.4); outer.material.uniforms.o.value = 0.4 + flash * 0.9;
      } };
  }

  var BUILDERS = { ai: buildAI, quantum: buildQuantum, twin: buildTwin, genome: buildGenome, shield: buildShield };
  TOPICS.forEach(function (tp) {
    tp.scene = BUILDERS[tp.key](tp.notes);
    tp.scene.group.traverse(function (o) { o.frustumCulled = false; });
    tp.scene.group.visible = false; tp.scene.group.scale.setScalar(0.001); root.add(tp.scene.group);
  });

  /* --- HUD ring and drifting particle layers behind the object (parallax) --- */
  var hud = new THREE.Group(); hud.position.set(0, ROOT_Y, -1); scene.add(hud);
  (function () {
    hud.add(segs(circlePts(function (t) { return [Math.cos(t) * 1.7, Math.sin(t) * 1.7, 0]; }, 120), 0x86bc25, 0.16));
    [[0.3, 1.1], [2.5, 0.8], [4.1, 1.3]].forEach(function (c) { hud.add(segs(circlePts(function (t) { return [Math.cos(c[0] + t / 6.2832 * c[1]) * 1.78, Math.sin(c[0] + t / 6.2832 * c[1]) * 1.78, 0]; }, 40), 0x5fd4e3, 0.35)); });
  })();
  var layers = [];
  [[150, 0.09, -8, 0.4], [80, 0.12, -4, 0.5], [28, 0.18, -1, 0.7]].forEach(function (cfg, li) {
    var r = rng(100 + li), pos = [], col = [];
    for (var i = 0; i < cfg[0]; i++) {
      pos.push((r() - 0.5) * 16, (r() - 0.5) * 22, cfg[2] - r() * 3);
      var m = 0.4 + r() * 0.6, q = r();
      if (q > 0.86) col.push(0.77 * m, 0.84 * m, 0); else if (q > 0.6) col.push(0.1 * m, 0.7 * m, 0.75 * m); else col.push(0.53 * m, 0.74 * m, 0.14 * m);
    }
    var p = pts(pos, col, cfg[1], cfg[3]); p.frustumCulled = false; scene.add(p); layers.push(p);
  });


  /* ---------- FX: sparks, shockwaves, shooting stars, synthesised sound ---------- */
  var FXN = 800, fxP = new Float32Array(FXN * 3), fxV = new Float32Array(FXN * 3), fxC = new Float32Array(FXN * 3), fxB = new Float32Array(FXN * 3), fxL = new Float32Array(FXN), fxD = new Float32Array(FXN), fxI = 0;
  for (var fi = 0; fi < FXN; fi++) fxP[fi * 3 + 1] = 999;
  var fxGeo = new THREE.BufferGeometry(); fxGeo.setAttribute('position', new THREE.BufferAttribute(fxP, 3)); fxGeo.setAttribute('color', new THREE.BufferAttribute(fxC, 3));
  var fxPts = new THREE.Points(fxGeo, new THREE.PointsMaterial({ size: 0.11, map: TEX, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  fxPts.frustumCulled = false; scene.add(fxPts);
  var SPARK = [GREEN, LIME, AQUA, PAPER, GREEN];
  function emit(x, y, z, n, speed, life, cols) {
    cols = cols || SPARK;
    for (var k = 0; k < n; k++) {
      var i = (fxI++) % FXN, a = Math.random() * 6.2832, b = Math.acos(2 * Math.random() - 1), sp = speed * (0.25 + 0.75 * Math.random()), c = cols[Math.floor(Math.random() * cols.length)];
      fxP[i * 3] = x; fxP[i * 3 + 1] = y; fxP[i * 3 + 2] = z;
      fxV[i * 3] = Math.sin(b) * Math.cos(a) * sp; fxV[i * 3 + 1] = Math.cos(b) * sp; fxV[i * 3 + 2] = Math.sin(b) * Math.sin(a) * sp;
      fxB[i * 3] = c.r; fxB[i * 3 + 1] = c.g; fxB[i * 3 + 2] = c.b; fxL[i] = 1; fxD[i] = 1 / (life * (0.6 + 0.8 * Math.random()));
    }
  }
  function fxStep(dt) {
    var drag = Math.exp(-1.5 * dt);
    for (var i = 0; i < FXN; i++) {
      if (fxL[i] <= 0) continue;
      fxL[i] -= fxD[i] * dt;
      if (fxL[i] <= 0) { fxP[i * 3 + 1] = 999; if (LT) { fxC[i * 3] = ProtoTheme.BG[0]; fxC[i * 3 + 1] = ProtoTheme.BG[1]; fxC[i * 3 + 2] = ProtoTheme.BG[2]; } else fxC[i * 3] = fxC[i * 3 + 1] = fxC[i * 3 + 2] = 0; continue; }
      fxV[i * 3] *= drag; fxV[i * 3 + 1] *= drag; fxV[i * 3 + 2] *= drag;
      fxP[i * 3] += fxV[i * 3] * dt; fxP[i * 3 + 1] += fxV[i * 3 + 1] * dt; fxP[i * 3 + 2] += fxV[i * 3 + 2] * dt;
      var f = fxL[i] * fxL[i]; if (LT) { for (var q = 0; q < 3; q++) fxC[i * 3 + q] = ProtoTheme.BG[q] + (fxB[i * 3 + q] * 0.55 - ProtoTheme.BG[q]) * f; } else { fxC[i * 3] = fxB[i * 3] * f; fxC[i * 3 + 1] = fxB[i * 3 + 1] * f; fxC[i * 3 + 2] = fxB[i * 3 + 2] * f; }
    }
    fxGeo.attributes.position.needsUpdate = true; fxGeo.attributes.color.needsUpdate = true;
  }
  var fxRings = [], fxRn = 0;
  for (var ri = 0; ri < 8; ri++) { var rm = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 96), new THREE.MeshBasicMaterial({ color: 0x86bc25, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); rm.visible = false; rm.frustumCulled = false; scene.add(rm); fxRings.push({ m: rm, t: 1, max: 1 }); }
  function ringAt(x, y, z, color, max) { var r = fxRings[(fxRn++) % fxRings.length]; r.t = 0; r.max = max; r.m.position.set(x, y, z); r.m.material.color.set(color); if (LT) r.m.material.color.multiplyScalar(0.55); r.m.visible = true; }
  var streaks = [];
  for (var si = 0; si < 3; si++) { var sl = segs([0, 0, 0, 0, 0, 0], 0x5fd4e3, 0.8); sl.frustumCulled = false; scene.add(sl); streaks.push({ l: sl, wait: 1 + si * 2.2, on: false, x: 0, y: 0 }); }
  function streakStep(dt) {
    streaks.forEach(function (s) {
      if (!s.on) { s.wait -= dt; if (s.wait > 0) return; s.on = true; s.x = -1 + Math.random() * 3.5; s.y = 4.2 + Math.random() * 1.5; s.life = 0; }
      s.life += dt; s.x -= 7.5 * dt; s.y -= 5 * dt;
      var a = s.l.geometry.attributes.position.array; a[0] = s.x; a[1] = s.y; a[2] = -3; a[3] = s.x + 1.5; a[4] = s.y + 1; a[5] = -3; s.l.geometry.attributes.position.needsUpdate = true;
      s.l.material.opacity = Math.max(0, 0.9 - s.life * 0.45);
      if (s.life > 2) { s.on = false; s.wait = 3 + Math.random() * 6; s.l.material.opacity = 0; }
    });
  }
  function ringStep(dt) {
    fxRings.forEach(function (r) { if (r.t >= 1) return; r.t += dt / 0.9; if (r.t >= 1) { r.m.visible = false; return; } var e = 1 - Math.pow(1 - r.t, 3); r.m.scale.setScalar(0.05 + e * r.max); r.m.material.opacity = (1 - r.t) * 0.6; });
  }
  var _ray = new THREE.Vector3();
  function clientToWorld(cx, cy) {
    var rc = stage.getBoundingClientRect(), nx = ((cx - rc.left) / scale) / W * 2 - 1, ny = -(((cy - rc.top) / scale) / H * 2 - 1);
    _ray.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
    var t = -camera.position.z / _ray.z; return new THREE.Vector3().copy(camera.position).addScaledVector(_ray, t);
  }
  var AC = null, lastSfx = 0, lastDrag = 0;
  function tone(f, d, type, vol, slide, delay) {
    if (!audioOn || !started) return;
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      var t0 = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
      g.gain.setValueAtTime(vol || 0.04, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.05);
    } catch (e) {}
  }
  var sfx = {
    discover: function (n) { var sc = [523, 587, 659, 784, 880], f = sc[n % 5] * (n > 5 ? 2 : 1); tone(f, 0.5, 'sine', 0.045); tone(f * 1.5, 0.6, 'triangle', 0.02, null, 0.08); tone(f * 2, 0.7, 'sine', 0.015, null, 0.16); },
    pop: function (d, i) { tone(760 + i * 140, 0.12, 'sine', 0.02, 1100, d); },
    drag: function (v) { var n = performance.now(); if (n - lastDrag < 110 || v < 4) return; lastDrag = n; tone(150 + Math.min(v, 50) * 7, 0.14, 'triangle', 0.012, 90 + Math.min(v, 50) * 4); },
    topic: function (k) { sfx.whoosh(); var ch = { ai: [523, 784, 1046], quantum: [440, 660, 988], twin: [392, 587, 784], genome: [494, 740, 988], shield: [349, 523, 698] }[k] || [523, 784]; ch.forEach(function (f, i) { tone(f, 0.5, 'sine', 0.025, null, 0.25 + i * 0.09); }); },
    act: function (k) {
      if (k === 'ai') { [400, 500, 630, 800, 1000, 1260].forEach(function (f, i) { tone(f, 0.25, 'sine', 0.03, f * 1.1, i * 0.07); }); }
      else if (k === 'quantum') { tone(880, 0.12, 'square', 0.015, 300); tone(140, 0.7, 'sine', 0.05, 60, 0.5); tone(1320, 0.5, 'sine', 0.03, null, 0.55); }
      else if (k === 'twin') { tone(300, 0.9, 'sawtooth', 0.02, 900); tone(600, 0.9, 'sine', 0.02, 1300, 0.1); }
      else if (k === 'genome') { for (var q = 0; q < 10; q++) tone(600 + q * 70, 0.08, 'square', 0.012, null, q * 0.1); }
      else { tone(160, 0.5, 'sawtooth', 0.03, 90); for (var z = 0; z < 5; z++) tone(900 + z * 100, 0.1, 'sine', 0.02, 400, 0.15 + z * 0.16); }
    },
    tap: function () { var n = performance.now(); if (n - lastSfx < 60) return; lastSfx = n; tone(1100, 0.09, 'sine', 0.025, 1700); },
    select: function () { tone(660, 0.3, 'sine', 0.04, 990); tone(990, 0.4, 'triangle', 0.03, 1320, 0.09); },
    whoosh: function () { tone(420, 0.55, 'triangle', 0.035, 90); tone(210, 0.6, 'sine', 0.03, 640); },
    zap: function () { tone(180, 0.45, 'sawtooth', 0.025, 1400); tone(1400, 0.3, 'sine', 0.02, 300, 0.1); },
    win: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.55, 'sine', 0.04, null, i * 0.11); }); }
  };

  /* ---------- DOM ---------- */
  var elTitle = $('title'), elTag = $('tag'), elBar = $('bar'), elHs = $('hs'), elCT = $('ctitle'), elCX = $('ctext'), elOrb = $('orb'), elAttract = $('attract');
  var elVoice = $('voice'), elHead = $('head'), elCard = $('card'), elAct = $('act'), elActL = $('actl'), elTour = $('tour'), elProg = $('prog'), elSplash = $('splash');
  var waveBars = $('wave').children, elVbi = $('vbi'), elLower = $('lower');
  var visited = {}, celebrated = false;
  function seenKey(t, n) { return TOPICS[t].key + ':' + n; }
  function countSeen() { var c = 0; for (var k in visited) c++; return c; }

  TOPICS.forEach(function (tp, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'topic'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false');
    b.innerHTML = ICONS[tp.key] + '<b>' + ({ ai: 'Gen AI', quantum: 'Quantum', twin: 'Twins', genome: 'Genomics', shield: 'Cyber' }[tp.key] || tp.name) + '</b><span class="dots"><i></i><i></i><i></i><i></i><i></i></span>';
    b.addEventListener('click', function () { poke(); setTopic(i); });
    elBar.appendChild(b); tp.btn = b;
  });
  function refreshProgress() {
    TOPICS.forEach(function (tp, t) { var d = tp.btn.querySelectorAll('.dots i'); for (var n = 0; n < 5; n++) d[n].className = visited[seenKey(t, n)] ? 'on' : ''; });
    elProg.innerHTML = 'Explored <b>' + countSeen() + '</b> / ' + TOTAL;
  }

  /* ---------- the guide: recorded human voice, captions follow the audio ---------- */
  var started = false, audioOn = true, sayTok = 0, curAudio = null, doneTimer = 0, typing = null, attract = false, tour = null;
  elVoice.addEventListener('pointerdown', function (e) { e.stopPropagation(); pokeKeep = true; poke(); pokeKeep = false; });
  elVoice.addEventListener('click', function () {
    audioOn = !audioOn; elVoice.setAttribute('aria-pressed', audioOn ? 'true' : 'false');
    if (!audioOn) { var cont = typing && typing.mode === 'audio'; if (curAudio) { try { curAudio.pause(); } catch (e) {} } if (cont) { typing.mode = 'time'; typing.start = performance.now() - typing.text.length * 12; typing.per = 24; } }
  });
  function stopAudio() { if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio.onended = curAudio.onerror = null; curAudio = null; } clearTimeout(doneTimer); }
  function say(title, text, clip, opts) {
    opts = opts || {}; stopAudio(); var tok = ++sayTok;
    elCT.textContent = title; elCT.classList.remove('rv'); void elCT.offsetWidth; elCT.classList.add('rv');
    var a = document.createElement('span'), b = document.createElement('span'); b.className = 'ghost'; b.textContent = text;
    elCX.textContent = ''; elCX.appendChild(a); elCX.appendChild(b);
    function finish() { if (tok !== sayTok) return; if (opts.then) doneTimer = setTimeout(function () { if (tok === sayTok) opts.then(); }, opts.gap || 1100); }
    var useAudio = audioOn && clip && started && !(attract && !tour && clip !== 'idle');
    if (useAudio) {
      var au = new Audio('audio/' + clip + '.mp3'); curAudio = au; au.preload = 'auto';
      typing = { a: a, b: b, text: text, mode: 'audio', au: au, finish: finish, tok: tok };
      au.onerror = function () { if (tok !== sayTok || !typing) return; typing.mode = 'time'; typing.start = performance.now(); typing.per = 32; };
      var pr; try { pr = au.play(); } catch (e) { pr = null; }
      if (pr && pr.catch) pr.catch(function () { if (tok !== sayTok || !typing) return; typing.mode = 'time'; typing.start = performance.now(); typing.per = 32; });
    } else if (RM) { a.textContent = text; b.textContent = ''; typing = null; finish(); }
    else typing = { a: a, b: b, text: text, mode: 'time', start: performance.now(), per: 26, finish: finish, tok: tok };
  }

  var cur = -1, hsEls = [], sel = -1;
  function buildHotspots() {
    elHs.innerHTML = ''; hsEls = [];
    TOPICS[cur].scene.anchors.forEach(function (an, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hs' + (visited[seenKey(cur, i)] ? ' seen' : '');
      b.setAttribute('aria-label', an.title); b.style.setProperty('--d', (0.45 + i * 0.14) + 's'); sfx.pop(0.45 + i * 0.14, i); b.innerHTML = '<i></i><span>' + an.title + '</span>';
      b.addEventListener('click', function (e) { e.stopPropagation(); poke(); select(i); });
      elHs.appendChild(b); hsEls.push(b);
    });
  }
  function after() { if (tour) return tourAdvance; if (!attract && countSeen() >= TOTAL && !celebrated) return celebrate; return null; }
  function select(i) {
    sel = i;
    if (!attract) {
      var firstTime = !visited[seenKey(cur, i)]; visited[seenKey(cur, i)] = true; refreshProgress();
      if (firstTime) { var dd = TOPICS[cur].btn.querySelectorAll('.dots i')[i]; if (dd) dd.classList.add('new'); sfx.discover(countSeen()); }
    }
    hsEls.forEach(function (el, k) { el.classList.toggle('on', k === i); if (visited[seenKey(cur, k)]) el.classList.add('seen'); });
    var tp = TOPICS[cur], an = tp.scene.anchors[i];
    var wp = an.get().clone(); tp.scene.group.localToWorld(wp);
    emit(wp.x, wp.y, wp.z, 60, 1.6, 0.9); ringAt(wp.x, wp.y, wp.z, 0xc4d600, 1.1); sfx.select(); connT = 0;
    elCard.classList.remove('pulse'); void elCard.offsetWidth; elCard.classList.add('pulse');
    say(an.title, an.text, tp.key + '-' + (i + 1), { then: after() });
  }
  function playIntro() { var tp = TOPICS[cur]; say('Start here', tp.intro, tp.key + '-0', { then: tour ? tourAdvance : null }); }

  var tw = { phase: 'idle', t: 0, next: -1 };
  function setTopic(i) {
    if (i === cur || tw.phase !== 'idle') return false;
    TOPICS.forEach(function (topic) { topic.btn.disabled = true; });
    if (cur < 0) { commit(i); tw.phase = 'in'; tw.t = 0; return true; }
    tw.phase = 'out'; tw.t = 0; tw.next = i; return true;
  }
  function commit(i) {
    if (cur >= 0) { TOPICS[cur].scene.group.visible = false; TOPICS[cur].scene.group.rotation.y = 0; }
    cur = i; var tp = TOPICS[i]; tp.scene.group.visible = true;
    TOPICS.forEach(function (x, k) { x.btn.setAttribute('aria-selected', k === i ? 'true' : 'false'); }); $('pill').style.transform = 'translateX(' + (i * 100) + '%)'; $('num').innerHTML = '0' + (i + 1) + '<i> / 0' + TOPICS.length + '</i>';
    elTitle.innerHTML = letters(tp.name); elTag.textContent = tp.tag; elTag.classList.remove('rv'); void elTag.offsetWidth; elTag.classList.add('rv'); elActL.textContent = tp.act;
    emit(0, ROOT_Y, 0, 200, 3.0, 1.2); ringAt(0, ROOT_Y, 0, 0x86bc25, 2.3); ringAt(0, ROOT_Y, 0, 0x5fd4e3, 1.5); sfx.topic(tp.key); connT = -1;
    sel = -1; buildHotspots(); playIntro();
  }
  function letters(name) {
    var h = '';
    var ls = name.lastIndexOf(' ') + 1; for (var i = 0; i < name.length; i++) { var c = name[i]; h += c === ' ' ? ' ' : '<span class="ch' + (i >= ls ? ' stix' : '') + '" style="animation-delay:' + (i * 38) + 'ms">' + c + '</span>'; }
    return h + '<b class="ch" style="animation-delay:' + (name.length * 38) + 'ms">.</b>';
  }
  var connT = -1, elConnP = $('connp'), elConnD = $('connd'), hsPos = [];
  function easeOutBack(x) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

  elAct.addEventListener('pointerdown', function (e) { e.stopPropagation(); poke(); });
  elAct.addEventListener('click', function () { if (cur < 0 || tw.phase !== 'idle') return; TOPICS[cur].scene.act(); kick = Math.max(kick, 1); sfx.act(TOPICS[cur].key); emit(0, ROOT_Y, 0, 200, 4, 1.2, [LIME, AQUA, PAPER]); ringAt(0, ROOT_Y, 0, 0xc4d600, 2.4); elAct.classList.add('fired'); setTimeout(function () { elAct.classList.remove('fired'); }, 700); });

  /* guided tour: the guide walks through every topic on her own */
  function tourAdvance() {
    if (!tour) return;
    if (tw.phase !== 'idle') { setTimeout(tourAdvance, 300); return; }
    tour.k++;
    if (tour.k >= tour.steps.length) { endTour(true); return; }
    var s = tour.steps[tour.k];
    if (s.t !== cur) setTopic(s.t); else if (s.n >= 0) select(s.n); else playIntro();
  }
  function endTour(done) {
    tour = null; elTour.setAttribute('aria-pressed', 'false'); elTour.lastChild.textContent = 'Guided tour';
    elTour.firstChild.innerHTML = '<path d="M7 4.5v15l13-7.5z"/>';
    if (done) say('Your turn', 'That was the tour. Now it is your turn. Touch anything that glows, and see where it takes you.', null);
  }
  elTour.addEventListener('pointerdown', function (e) { e.stopPropagation(); pokeKeep = true; poke(); pokeKeep = false; ripple(e); });
  elTour.addEventListener('click', function () {
    if (tour) { endTour(false); return; }
    started = true; tour = { steps: [], k: -1 };
    TOPICS.forEach(function (tp, ti) { tour.steps.push({ t: ti, n: -1 }); for (var n = 0; n < 5; n++) tour.steps.push({ t: ti, n: n }); });
    elTour.setAttribute('aria-pressed', 'true'); elTour.lastChild.textContent = 'Stop tour';
    elTour.firstChild.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2"/>';
    tourAdvance();
  });

  function celebrate() {
    celebrated = true; kick = 2.6; sfx.win();
    for (var fw = 0; fw < 9; fw++) (function (n) { setTimeout(function () { var x = (Math.random() - 0.5) * 3, y = ROOT_Y + (Math.random() - 0.3) * 2.4; emit(x, y, 0.5, 160, 3.4, 1.6, [GREEN, LIME, AQUA, PAPER, ORANGE]); ringAt(x, y, 0.5, 0xc4d600, 1.6); tone(500 + Math.random() * 500, 0.3, 'sine', 0.03, 200); }, n * 260); })(fw);
    var cols = ['#86bc25', '#c4d600', '#0097a9', '#5fd4e3', '#f1f6ec', '#ed8b00'];
    for (var i = 0; i < 60; i++) { var c = document.createElement('i'); c.className = 'cf'; c.style.left = (Math.random() * 1040 + 20) + 'px'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (Math.random() * 0.9) + 's'; c.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)'; stage.appendChild(c); (function (el) { setTimeout(function () { el.remove(); }, 5200); })(c); }
    say('Innovation explorer', 'You have explored every idea in the orbit. That is the spirit of this space. Now go and build what is next.', null);
  }

  /* welcome splash: first touch starts the show (and unlocks audio) */
  elSplash.addEventListener('click', function () {
    if (started) return; started = true; lastTouch = performance.now();
    sfx.win(); emit(0, ROOT_Y, 0, 400, 4.2, 1.6); ringAt(0, ROOT_Y, 0, 0x86bc25, 3); ringAt(0, ROOT_Y, 0, 0xc4d600, 1.9);
    elSplash.classList.add('off'); setTimeout(function () { elSplash.style.display = 'none'; }, 1000);
    say('Hello there', GREET, 'greet', { then: playIntro, gap: 500 });
  });

  /* ---------- input: drag to rotate, pinch to zoom, tap for an energy pulse, parallax ---------- */
  var ptrs = {}, rotY = 0.4, rotX = 0.12, velY = 0, velX = 0, zoom = 0.95, zoomT = 0.95, pinch0 = 0, zoom0 = 1, par = { x: 0, y: 0, tx: 0, ty: 0 }, kick = 0;
  function nPtrs() { return Object.keys(ptrs).length; }
  function ripple(e) {
    var r = stage.getBoundingClientRect(), d = document.createElement('div'); d.className = 'rip';
    d.style.left = ((e.clientX - r.left) / scale) + 'px'; d.style.top = ((e.clientY - r.top) / scale) + 'px'; stage.appendChild(d); setTimeout(function () { d.remove(); }, 900);
  }
  stage.addEventListener('pointerdown', function (e) {
    poke(); ripple(e); sfx.tap(); var tw0 = clientToWorld(e.clientX, e.clientY); emit(tw0.x, tw0.y, 0.4, 10, 1.1, 0.6); ringAt(tw0.x, tw0.y, 0.4, 0x86bc25, 0.55);
    if (e.target.closest && e.target.closest('button, #splash')) return;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
    if (nPtrs() === 2) { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoomT; }
  });
  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    var p = ptrs[e.pointerId]; if (!p) return;
    poke(); var tw1 = clientToWorld(e.clientX, e.clientY); emit(tw1.x, tw1.y, 0.4, 2, 0.5, 0.6);
    var dx = (e.clientX - p.x) / scale, dy = (e.clientY - p.y) / scale; p.x = e.clientX; p.y = e.clientY; sfx.drag(Math.hypot(dx, dy));
    if (nPtrs() === 1) { velY = dx * 0.0035; velX = dy * 0.0028; rotY += dx * 0.0085; rotX = clamp(rotX + dy * 0.006, -0.9, 0.9); }
    else if (nPtrs() === 2) { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) zoomT = clamp(zoom0 * d / pinch0, 0.85, 1.7); }
  });
  function up(e) {
    var p = ptrs[e.pointerId];
    if (p && nPtrs() === 1 && started) {
      var sdx = (e.clientX - p.sx) / scale, sdy = (e.clientY - p.sy) / scale, sdt = performance.now() - p.t;
      if (sdt < 450 && Math.abs(sdx) > 220 && Math.abs(sdx) > Math.abs(sdy) * 1.6 && tw.phase === 'idle' && cur >= 0) { setTopic((cur + (sdx < 0 ? 1 : TOPICS.length - 1)) % TOPICS.length); velY = 0; }
    }
    if (p && nPtrs() === 1 && performance.now() - p.t < 350 && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) / scale < 14) kick = Math.max(kick, 1);
    delete ptrs[e.pointerId]; if (nPtrs() < 2) pinch0 = 0;
  }
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', function (e) { e.preventDefault(); poke(); zoomT = clamp(zoomT * (e.deltaY < 0 ? 1.06 : 0.94), 0.85, 1.7); }, { passive: false });

  /* ---------- idle attract loop ---------- */
  var lastTouch = performance.now(), atStep = -2, atNext = 0;
  function poke() { lastTouch = performance.now(); if (tour && !pokeKeep) endTour(false); if (attract) { attract = false; elAttract.classList.remove('on'); } }
  var pokeKeep = false;

  /* ---------- frame loop ---------- */
  var ambT = 1, glitchT = 9, v3 = new THREE.Vector3(), rw = new THREE.Vector3(), clock = new THREE.Clock(), T = 0, amp = 0;
  function frame() {
    var wantLT = ProtoTheme.isOn(); if (wantLT !== themeSeen) { themeSeen = wantLT; if (wantLT || themed) { themed = true; if (!floorShadow) { floorShadow = ProtoTheme.shadow(5, 2.6); floorShadow.position.y = -2.5; scene.add(floorShadow); } setTheme(wantLT); } }
    requestAnimationFrame(frame);
    if (window.__innoPaused) { clock.getDelta(); return; }
    var dt = Math.min(clock.getDelta(), 0.05); T += dt;
    var now = performance.now();

    if (typing) {
      var ty = typing, len = ty.text.length, nc, done;
      if (ty.mode === 'audio') {
        var au = ty.au, d = au.duration; if (!isFinite(d) || d <= 0) d = len * 0.062;
        var p = au.ended ? 1 : Math.min(1, au.currentTime / d * 1.05 + (au.currentTime > 0 ? 0.008 : 0));
        nc = Math.floor(p * len); done = au.ended;
      } else { nc = Math.min(len, Math.floor((now - ty.start) / ty.per)); done = nc >= len; }
      ty.a.textContent = ty.text.slice(0, nc); ty.b.textContent = ty.text.slice(nc); elVbi.style.transform = 'scaleX(' + (nc / len).toFixed(3) + ')';
      if (done) { typing = null; ty.finish(); }
    }
    var speaking = !!typing;
    amp += ((speaking ? 1 : 0) - amp) * 0.15;
    for (var w = 0; w < waveBars.length; w++) {
      var h = 0.12 + amp * (0.15 + 0.85 * Math.abs(Math.sin(T * 7.3 + w * 1.7) * Math.sin(T * 3.1 + w * 0.9)));
      waveBars[w].style.transform = 'scaleY(' + h.toFixed(3) + ')';
    }
    if (speaking !== elOrb._s) { elOrb._s = speaking; elOrb.classList.toggle('spk', speaking); }
    elOrb.style.transform = 'scale(' + (1 + amp * 0.16 * (0.5 + 0.5 * Math.sin(T * 10)) + 0.04 * Math.sin(T * 1.6)).toFixed(3) + ')';

    if (started && !attract && !tour && now - lastTouch > 30000 && cur >= 0) { attract = true; elAttract.classList.add('on'); atStep = -2; atNext = now + 400; }
    if (attract && now >= atNext && tw.phase === 'idle') {
      atStep++;
      if (atStep === -1) { say('Psst…', IDLE, 'idle'); atNext = now + 9000; }
      else if (atStep > 4) { atStep = -1; setTopic((cur + 1) % TOPICS.length); atNext = now + 7000; }
      else { select(atStep); atNext = now + 8000; }
    }

    if (tw.phase === 'out') { tw.t += dt / 0.3; TOPICS[cur].scene.group.scale.setScalar(Math.max(0.001, 1 - tw.t * tw.t)); TOPICS[cur].scene.group.rotation.y = tw.t * tw.t * 2.2; if (tw.t >= 1) { commit(tw.next); tw.phase = 'in'; tw.t = 0; } }
    else if (tw.phase === 'in') { tw.t += dt / 0.6; var k = Math.min(1, tw.t); TOPICS[cur].scene.group.scale.setScalar(Math.max(0.001, easeOutBack(k))); TOPICS[cur].scene.group.rotation.y = -(1 - k) * (1 - k) * 3.4; if (k >= 1) { tw.phase = 'idle'; TOPICS[cur].scene.group.scale.setScalar(1); TOPICS[cur].scene.group.rotation.y = 0; TOPICS.forEach(function (topic) { topic.btn.disabled = false; }); } }

    kick *= Math.exp(-dt * 2.6); fxStep(dt); ringStep(dt); streakStep(dt);
    if (started && !RM) {
      var ca = T * 1.15; emit(Math.cos(ca) * 1.95, ROOT_Y + Math.sin(ca * 0.9) * 0.5, Math.sin(ca) * 1.2, 1, 0.08, 0.8, [LIME]);
      ambT -= dt; if (ambT < 0) { ambT = 0.5 + Math.random() * 0.8; var aa = Math.random() * 6.28, ab = Math.acos(2 * Math.random() - 1); emit(Math.sin(ab) * Math.cos(aa) * 1.3, ROOT_Y + Math.cos(ab) * 1.3, Math.sin(ab) * Math.sin(aa) * 1.3, 4, 0.5, 1.2, [GREEN, AQUA]); }
      if (false) { glitchT = 11 + Math.random() * 8; elTitle.classList.add('glitch'); setTimeout(function () { elTitle.classList.remove('glitch'); }, 380); }
    }
    if (nPtrs() === 0) { velY *= 0.94; velX *= 0.9; rotY += velY + (RM ? 0.0006 : ((attract || tour) ? 0.004 : 0.0024)); rotX = clamp(rotX + velX, -0.9, 0.9); }
    zoom += (zoomT - zoom) * 0.12;
    root.rotation.y = rotY + par.x * 0.12; root.rotation.x = rotX + par.y * 0.07; root.scale.setScalar(zoom * (1 + kick * 0.05));
    root.position.y = ROOT_Y + (RM ? 0 : Math.sin(T * 0.9) * 0.05);
    if (bloom) bloom.strength = 0.36 + kick * 0.6 + amp * 0.06 * (0.5 + 0.5 * Math.sin(T * 9));

    par.x += (par.tx - par.x) * 0.06; par.y += (par.ty - par.y) * 0.06;
    camera.position.set(par.x * 0.5, -par.y * 0.35, 9 + Math.sin(T * 0.5) * 0.12); camera.lookAt(0, 0, 0);
    hud.rotation.z = T * 0.05; hud.position.x = -par.x * 0.12; hud.position.y = ROOT_Y + par.y * 0.08;
    layers.forEach(function (l, i) { l.position.x = par.x * (0.3 + i * 0.25); l.position.y = -par.y * (0.2 + i * 0.15); l.rotation.z = T * 0.004 * (i + 1); });
    elHead.style.transform = 'translate(' + (-par.x * 14).toFixed(1) + 'px,' + (-par.y * 8).toFixed(1) + 'px)';
    elLower.style.transform = 'translate(' + (par.x * 8).toFixed(1) + 'px,' + (par.y * 5).toFixed(1) + 'px)';

    if (cur >= 0) {
      var sc = TOPICS[cur].scene; sc.update(T, dt);
      scene.updateMatrixWorld(); camera.updateMatrixWorld();
      root.getWorldPosition(rw); var cd = camera.position.distanceTo(rw);
      elHs.style.opacity = clamp(sc.group.scale.x, 0, 1);
      for (var i = 0; i < hsEls.length; i++) {
        v3.copy(sc.anchors[i].get()); sc.group.localToWorld(v3);
        var dist = v3.distanceTo(camera.position); v3.project(camera);
        var x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H, back = dist - cd > 0.5;
        var el = hsEls[i]; el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (back ? 0.8 : 1) + ')';
        el.style.opacity = back ? 0.5 : 1; el.classList.toggle('flip', x > 620); hsPos[i] = [x, y];
      }
    }
    if (connT >= 0 && sel >= 0 && hsPos[sel] && tw.phase === 'idle') {
      connT = Math.min(1, connT + dt / 0.55); var ctop = elLower.offsetTop + elCard.offsetTop - 2, hp = hsPos[sel], tx = clamp(hp[0], 150, 930), cy2 = (hp[1] + ctop) / 2;
      elConnP.setAttribute('d', 'M' + hp[0].toFixed(1) + ' ' + hp[1].toFixed(1) + ' C' + hp[0].toFixed(1) + ' ' + cy2.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + (cy2 - 40).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ctop);
      elConnP.setAttribute('stroke-dashoffset', (1 - ease(connT)).toFixed(3)); elConnP.style.opacity = 0.9;
      elConnD.setAttribute('cx', tx.toFixed(1)); elConnD.setAttribute('cy', ctop); elConnD.style.opacity = connT >= 1 ? 1 : 0;
    } else if (connT < 0 || sel < 0 || tw.phase !== 'idle') { elConnP.style.opacity = 0; elConnD.style.opacity = 0; }
    if (composer && !LT) composer.render(); else renderer.render(scene, camera);
  }
  window.__orbit = { reset: function () {
    stopAudio(); sayTok++; if (tour) endTour(false); typing = null;
    started = false; attract = false; elAttract.classList.remove('on');
    visited = {}; celebrated = false; sel = -1; connT = -1; refreshProgress();
    hsEls.forEach(function (el) { el.classList.remove('on', 'seen'); });
    elSplash.style.display = ''; void elSplash.offsetWidth; elSplash.classList.remove('off');
    if (tw.phase === 'idle') { if (cur !== 0) setTopic(0); else { buildHotspots(); playIntro(); } }
  } };
  refreshProgress();
  setTopic(0);
  requestAnimationFrame(frame);
})();
