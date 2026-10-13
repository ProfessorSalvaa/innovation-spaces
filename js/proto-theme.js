/* Proto light theme for the three.js scenes.
   The Proto M2 is a transparent display, so Proto mode puts everything on white. The scenes were built for a dark
   background with additive glow, which disappears on white. This switches those materials to normal blending with
   darker colours, hides decorative halos, and adds a soft floor shadow. Normal mode is never touched: call apply(scene, false)
   and everything is restored exactly. */
(function (root) {
  'use strict';
  var DARK = 0.55, INK = 0x24302a;
  function matsOf(o) { var m = o.material; return m ? (Array.isArray(m) ? m : [m]) : []; }
  function isOn() { return !!(document.body && document.body.classList.contains('proto')); }
  function lum(c) { return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b; }
  function apply(scene, on) {
    scene.traverse(function (o) {
      if (o.userData && o.userData.ptVis === undefined) o.userData.ptVis = o.visible;
      matsOf(o).forEach(function (m) {
        var u = m.userData || (m.userData = {}), p = u.pt;
        if (!p) p = u.pt = { add: m.blending === THREE.AdditiveBlending, col: m.color ? m.color.clone() : null, shader: !!m.isShaderMaterial };
        if (o.userData && o.userData.ptCol !== undefined && m.color) m.color.copy(on ? new THREE.Color(o.userData.ptCol) : p.col);
        if (p.add) {
          if (p.shader && !(m.uniforms && m.uniforms.uLight)) { o.visible = on ? false : o.userData.ptVis; return; }
          m.blending = on ? THREE.NormalBlending : THREE.AdditiveBlending;
          if (m.color && !m.vertexColors && !o.isSprite) m.color.copy(p.col).multiplyScalar(on ? DARK : 1);
          if (m.uniforms && m.uniforms.uLight) m.uniforms.uLight.value = on ? 1 : 0;
          m.needsUpdate = true;
        } else if (p.col && !m.vertexColors && !m.isShaderMaterial && !m.isMeshStandardMaterial && !o.isInstancedMesh && lum(p.col) > 0.82) {
          m.color.copy(on ? new THREE.Color(INK) : p.col);
        }
      });
    });
  }
  function shadow(w, h) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(10,20,10,0.42)'); g.addColorStop(0.55, 'rgba(10,20,10,0.16)'); g.addColorStop(1, 'rgba(10,20,10,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = -1; m.userData.ptVis = false; return m;
  }
  root.ProtoTheme = { apply: apply, isOn: isOn, shadow: shadow, BG: [0.933, 0.945, 0.965], BG_HEX: 0xeef1f6, DARK: DARK };
})(window);
