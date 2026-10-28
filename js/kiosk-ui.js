(function (root) {
  'use strict';

  function nextTab(key, current, count) {
    if (!count) return null;
    if (key === 'ArrowRight') return (current + 1) % count;
    if (key === 'ArrowLeft') return (current + count - 1) % count;
    if (key === 'Home') return 0;
    if (key === 'End') return count - 1;
    return null;
  }

  function setView(document, mode) {
    var focus = { hub: 'goInno', inno: 'homeI', lshc: 'homeL', fdesk: 'homeF' }[mode];
    if (!focus) throw new Error('Unknown kiosk view');
    document.getElementById('hub').inert = mode !== 'hub';
    document.getElementById('lshc').inert = mode !== 'lshc';
    var fd = document.getElementById('fdesk'); if (fd) fd.inert = mode !== 'fdesk';
    ['head', 'hs', 'lower', 'bar'].forEach(function (id) {
      document.getElementById(id).inert = mode !== 'inno';
    });
    document.getElementById('splash').inert = true;
    document.getElementById(focus).focus({ preventScroll: true });
  }

  function initHomeMedia(document, reducedMotion) {
    var backgrounds = ['homeVideo1', 'homeVideo2'].map(function (id) { return document.getElementById(id); });
    var choices = ['bg1', 'bg2'].map(function (id) { return document.getElementById(id); });
    var idleVideo = document.getElementById('idleVideo');
    var dialog = document.getElementById('idleScreen');
    var toggle = document.getElementById('motionToggle');
    var homeStatus = document.getElementById('mediaStatus');
    var idleStatus = document.getElementById('idleMediaStatus');
    var active = true, selected = 0, paused = !!reducedMotion, playingVideo = null, revision = 0;

    function updateToggle() {
      var label = paused ? 'Play background' : 'Pause background';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('data-tooltip', label);
      toggle.setAttribute('aria-pressed', String(!paused));
      toggle.setAttribute('data-paused', String(paused));
    }

    function failed(video) {
      if (video !== playingVideo) return;
      playingVideo = null;
      video.pause();
      if (video === idleVideo) idleStatus.textContent = 'Video unavailable. You can still start the experience.';
      else {
        paused = true;
        homeStatus.textContent = 'Background unavailable. Choose another or retry playback.';
        updateToggle();
      }
    }

    function sync() {
      backgrounds.forEach(function (video, index) {
        video.hidden = index !== selected;
        choices[index].checked = index === selected;
      });
      updateToggle();
      var next = active && !document.hidden ? (dialog.open ? idleVideo : (paused ? null : backgrounds[selected])) : null;
      backgrounds.concat(idleVideo).forEach(function (video) { if (video !== next) video.pause(); });
      if (playingVideo === next) return;
      playingVideo = next;
      var token = ++revision;
      if (next) next.play().catch(function () { if (token === revision) failed(next); });
    }

    choices.forEach(function (choice, index) {
      choice.addEventListener('change', function () {
        if (!choice.checked) return;
        selected = index;
        homeStatus.textContent = '';
        sync();
      });
    });
    toggle.addEventListener('click', function () {
      paused = !paused;
      homeStatus.textContent = '';
      sync();
    });
    document.getElementById('startScreen').addEventListener('click', function () {
      idleStatus.textContent = '';
      idleVideo.currentTime = 0;
      dialog.showModal();
      sync();
    });
    document.getElementById('idleStart').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dialog.close();
    });
    dialog.addEventListener('close', sync);
    document.addEventListener('visibilitychange', sync);
    backgrounds.concat(idleVideo).forEach(function (video) {
      video.addEventListener('error', function () { failed(video); });
    });
    sync();
    return {
      setActive: function (value) {
        active = value;
        if (!active && dialog.open) dialog.close();
        sync();
      }
    };
  }

  var api = { nextTab: nextTab, setView: setView, initHomeMedia: initHomeMedia };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KioskUI = api;
})(typeof window !== 'undefined' ? window : globalThis);