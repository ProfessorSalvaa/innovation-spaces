/* Display style: "normal" (original design) or "proto" (white hologram skin for the Proto M2).
   Chosen on the home and start screens; remembered in this browser. All Proto styling lives in css/hologram.css under body.proto. */
(function () {
  'use strict';
  var KEY = 'ixc-display-mode';
  function saved() { try { return localStorage.getItem(KEY) === 'proto' ? 'proto' : 'normal'; } catch (e) { return 'normal'; } }
  function apply(mode) {
    document.body.classList.toggle('proto', mode === 'proto');
    Array.prototype.forEach.call(document.querySelectorAll('.mode-sel button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === mode ? 'true' : 'false'); });
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }
  Array.prototype.forEach.call(document.querySelectorAll('.mode-sel button'), function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); apply(b.getAttribute('data-mode')); });
  });
  apply(saved());
  window.__displayMode = apply;
})();
