const assert = require('node:assert/strict');
const { test } = require('node:test');
const { nextTab, setView, initHomeMedia } = require('../js/kiosk-ui.js');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

test('LSHC branding is consistent in markup, captions and documentation', () => {
  const files = ['index.html', 'js/lshc-content.js', 'README.md', 'LSHC-voiceover-script.md'];
  for (const file of files) {
    const source = readFileSync(resolve(__dirname, '..', file), 'utf8');
    assert.match(source, /LSHC Experience Arena/, file);
    assert.doesNotMatch(source, /LSHC Experience Centre|Life Sciences and Health Care|life sciences and health care|Life Sciences &amp; Health Care/, file);
  }
  const context = {};
  runInNewContext(readFileSync(resolve(__dirname, '../js/lshc-content.js'), 'utf8'), context);
  assert.match(context.LCONTENT.greet, /Welcome to the LSHC Experience Arena/);
  assert.match(context.LCONTENT.done, /Life Sciences & Healthcare/);
});

test('topic keys wrap and support Home and End', () => {
  for (const [key, current, expected] of [
    ['ArrowRight', 4, 0], ['ArrowLeft', 0, 4], ['Home', 3, 0], ['End', 1, 4]
  ]) assert.equal(nextTab(key, current, 5), expected);
  assert.equal(nextTab('Enter', 2, 5), null);
  assert.equal(nextTab('ArrowRight', 0, 0), null);
});

function fixture() {
  const elements = {};
  for (const id of ['hub', 'lshc', 'head', 'hs', 'lower', 'bar', 'splash', 'goInno', 'homeI', 'homeL']) {
    elements[id] = { inert: false, focus() { elements.focused = id; } };
  }
  return { elements, getElementById(id) { return elements[id]; } };
}

test('only the active experience is interactive and receives focus', () => {
  const document = fixture();
  for (const [mode, focus] of [['hub', 'goInno'], ['inno', 'homeI'], ['lshc', 'homeL']]) {
    setView(document, mode);
    assert.equal(document.elements.focused, focus);
    assert.equal(document.elements.hub.inert, mode !== 'hub');
    assert.equal(document.elements.lshc.inert, mode !== 'lshc');
    for (const id of ['head', 'hs', 'lower', 'bar']) {
      assert.equal(document.elements[id].inert, mode !== 'inno');
    }
    assert.equal(document.elements.splash.inert, true);
  }
});

test('invalid view does not change the active experience', () => {
  const document = fixture();
  assert.throws(() => setView(document, 'unknown'), /Unknown kiosk view/);
  assert.equal(document.elements.hub.inert, false);
});

function mediaFixture() {
  function target() {
    const events = {};
    return {
      hidden: false, open: false, checked: false, currentTime: 0, playing: false,
      attributes: {}, textContent: '',
      addEventListener(name, handler) { events[name] = handler; },
      emit(name, event) { if (events[name]) events[name](event); },
      setAttribute(name, value) { this.attributes[name] = value; },
      play() { this.playing = true; return Promise.resolve(); },
      pause() { this.playing = false; },
      showModal() { this.open = true; },
      close() { this.open = false; this.emit('close'); }
    };
  }
  const document = target();
  document.elements = {};
  for (const id of ['homeVideo1', 'homeVideo2', 'idleVideo', 'idleScreen', 'startScreen', 'idleStart', 'motionToggle', 'mediaStatus', 'idleMediaStatus', 'bg1', 'bg2']) {
    document.elements[id] = target();
  }
  document.getElementById = id => document.elements[id];
  return document;
}

test('background selection plays only the selected video and survives leaving home', () => {
  const document = mediaFixture();
  const controller = initHomeMedia(document, false);
  const elements = document.elements;
  assert.equal(elements.homeVideo1.playing, true);
  assert.equal(elements.homeVideo2.playing, false);
  elements.bg2.checked = true;
  elements.bg2.emit('change');
  assert.equal(elements.homeVideo1.playing, false);
  assert.equal(elements.homeVideo1.hidden, true);
  assert.equal(elements.homeVideo2.playing, true);
  controller.setActive(false);
  assert.equal(elements.homeVideo2.playing, false);
  controller.setActive(true);
  assert.equal(elements.homeVideo2.playing, true);
  elements.bg1.checked = true;
  elements.bg1.emit('change');
  assert.equal(elements.homeVideo1.playing, true);
});

test('start-screen loop pauses the background and Click to start restores it', () => {
  const document = mediaFixture();
  const controller = initHomeMedia(document, false);
  const elements = document.elements;
  elements.startScreen.emit('click');
  assert.equal(elements.idleScreen.open, true);
  assert.equal(elements.idleVideo.playing, true);
  assert.equal(elements.homeVideo1.playing, false);
  elements.idleStart.emit('click');
  assert.equal(elements.idleScreen.open, false);
  assert.equal(elements.idleVideo.playing, false);
  assert.equal(elements.homeVideo1.playing, true);
  elements.startScreen.emit('click');
  controller.setActive(false);
  assert.equal(elements.idleScreen.open, false);
  assert.equal(elements.idleVideo.playing, false);
});

test('motion preference, manual pause and page visibility control playback', () => {
  const document = mediaFixture();
  initHomeMedia(document, true);
  const elements = document.elements;
  assert.equal(elements.homeVideo1.playing, false);
  elements.motionToggle.emit('click');
  assert.equal(elements.homeVideo1.playing, true);
  document.hidden = true;
  document.emit('visibilitychange');
  assert.equal(elements.homeVideo1.playing, false);
  document.hidden = false;
  document.emit('visibilitychange');
  assert.equal(elements.homeVideo1.playing, true);
  elements.motionToggle.emit('click');
  assert.equal(elements.homeVideo1.playing, false);
  assert.equal(elements.motionToggle.attributes['aria-label'], 'Play background');
  elements.startScreen.emit('click');
  assert.equal(elements.idleVideo.playing, true);
  elements.idleStart.emit('click');
  assert.equal(elements.homeVideo1.playing, false);
});

test('Escape closes the start screen without affecting other keys', () => {
  const document = mediaFixture();
  initHomeMedia(document, false);
  const elements = document.elements;
  elements.startScreen.emit('click');
  elements.idleScreen.emit('keydown', { key: 'ArrowRight' });
  assert.equal(elements.idleScreen.open, true);
  let prevented = false;
  elements.idleScreen.emit('keydown', { key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(elements.idleScreen.open, false);
  assert.equal(elements.idleVideo.playing, false);
  assert.equal(elements.homeVideo1.playing, true);
  assert.equal(prevented, true);
});

test('playback failures are handled and can be retried', async () => {
  const document = mediaFixture();
  const elements = document.elements;
  elements.homeVideo1.play = () => Promise.reject(new Error('blocked'));
  initHomeMedia(document, false);
  await Promise.resolve();
  assert.match(elements.mediaStatus.textContent, /unavailable/i);
  assert.equal(elements.motionToggle.attributes['aria-label'], 'Play background');
  elements.homeVideo1.play = () => Promise.resolve();
  elements.motionToggle.emit('click');
  assert.equal(elements.mediaStatus.textContent, '');
  elements.idleVideo.play = () => Promise.reject(new Error('unsupported'));
  elements.startScreen.emit('click');
  await Promise.resolve();
  assert.match(elements.idleMediaStatus.textContent, /unavailable/i);
  elements.idleStart.emit('click');
  assert.equal(elements.idleScreen.open, false);
});

test('a stale playback rejection cannot interrupt a newer background', async () => {
  const document = mediaFixture();
  let rejectPlayback;
  document.elements.homeVideo1.play = () => new Promise((resolve, reject) => { rejectPlayback = reject; });
  initHomeMedia(document, false);
  document.elements.bg2.checked = true;
  document.elements.bg2.emit('change');
  rejectPlayback(new Error('superseded'));
  await Promise.resolve();
  assert.equal(document.elements.mediaStatus.textContent, '');
  assert.equal(document.elements.homeVideo2.playing, true);
});